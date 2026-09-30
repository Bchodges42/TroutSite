import { GaugeReadingSchema, READING_STALE_MINUTES } from '@trout/contracts';
import type { GaugeReading } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob, type JobDetail } from '../jobs/run.js';
import { fetchWithRetry } from '../lib/retry.js';
import { fetchWaterDataReadings } from './usgs-waterdata.js';

const USGS_IV_URL = 'https://waterservices.usgs.gov/nwis/iv/';
/** USGS parameter codes: discharge, stage, temperature, and DO constraint context. */
const PARAM_CODES = ['00060', '00065', '00010', '00300', '00045'] as const;
/** USGS etiquette (§8): batch politely; 50 sites/request is well under documented limits. */
const SITES_PER_REQUEST = 50;
/** Raw audit rows older than this are pruned on every gauges run. */
const RAW_RETENTION_DAYS = 90;

export interface UsgsFetchOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  /** Injected base URL for tests (failure simulation points this at a 404). */
  baseUrl?: string;
  timeoutMs?: number;
  /** Provider switch for the Q1 2027 WaterServices retirement. */
  provider?: 'legacy' | 'waterdata';
  /** Server-only Water Data API key; never shipped to the browser. */
  waterDataApiKey?: string;
}

interface UsgsValueJson {
  value: string;
  dateTime: string;
  qualifiers?: string[];
}

interface UsgsSeriesJson {
  sourceInfo?: { siteCode?: { value?: string }[] };
  variable?: {
    variableCode?: { value?: string; vocabulary?: string }[];
    unit?: { unitCode?: string };
  };
  values?: { value?: UsgsValueJson[] }[];
}

interface UsgsResponseJson {
  value?: { timeSeries?: UsgsSeriesJson[] };
}

const INVALID_QUALIFIERS = new Set(['ice', 'eqp', 'ssn', 'bkw', 'flt']);

/** USGS missing-data sentinels arrive as string values; treat them as absent. */
function parseMetric(raw: string | undefined, qualifiers: string[] | undefined, code: string): number | undefined {
  if (raw === undefined) return undefined;
  if (qualifiers?.some((q) => INVALID_QUALIFIERS.has(q.trim().toLowerCase()))) return undefined;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  // -999999 (and variants) mean "no measurement" in NWIS.
  if (n <= -999000) return undefined;
  // A non-positive discharge cannot be scored as a valid flow reading. Zero is
  // retained as an explicit warning by parseInstantValuesDetailed below.
  if (code === '00060' && n <= 0) return undefined;
  return code === '00045' ? n * 25.4 : n;
}

/** Normalize any USGS dateTime into the contracts' IsoDateTimeSchema shape. */
function normalizeTimestamp(usgs: string): string {
  if (GaugeReadingSchema.shape.timestamp.safeParse(usgs).success) return usgs;
  const d = new Date(usgs);
  if (Number.isNaN(d.getTime())) throw new Error(`Unparseable USGS timestamp: ${usgs}`);
  return d.toISOString();
}

function latestValue(series: UsgsSeriesJson): UsgsValueJson | undefined {
  const values = series.values?.[0]?.value ?? [];
  const usable = values.filter(
    (v) =>
      typeof v?.value === 'string' &&
      typeof v?.dateTime === 'string' &&
      Number.isFinite(Date.parse(v.dateTime)),
  );
  if (usable.length === 0) return undefined;
  return usable.reduce((newest, v) =>
    Date.parse(v.dateTime) > Date.parse(newest.dateTime) ? v : newest,
  );
}

/**
 * T1-6: a parameter series that stopped reporting (gauge moved to provisional,
 * sensor outage) keeps serving its last value for months. Merging it into a
 * reading stamped with a NEWER parameter's time launders old flow/temperature
 * as current data and the scorer publishes a confident score from it. Each
 * parameter older than the shared freshness window (READING_STALE_MINUTES,
 * the same 3 h the scorer's staleness contract uses) relative to the newest
 * observation for the site is dropped instead of merged.
 */
interface ParseInstantValuesResult {
  readings: GaugeReading[];
  warnings: string[];
}

function parseInstantValuesDetailed(payload: unknown): ParseInstantValuesResult {
  const series = (payload as UsgsResponseJson)?.value?.timeSeries ?? [];
  interface MetricValue {
    value: number;
    ts: string;
  }
  interface SiteMetrics {
    cfs?: MetricValue;
    heightFt?: MetricValue;
    tempC?: MetricValue;
    dissolvedOxygenMgL?: MetricValue;
    precipitationMm?: MetricValue;
  }
  const bySite = new Map<string, SiteMetrics>();
  const zeroDischargeSites = new Set<string>();

  // Pass 1: newest usable value per parameter (each series keeps its OWN time —
  // the timestamp is not merged away).
  for (const s of series) {
    const site = s.sourceInfo?.siteCode?.[0]?.value;
    if (!site) continue;
    const code = (s.variable?.variableCode ?? []).find((vc) => typeof vc.value === 'string')?.value;
    const latest = latestValue(s);
    if (!code || !latest) continue;
    const value = parseMetric(latest.value, latest.qualifiers, code);
    if (code === '00060' && Number.parseFloat(latest.value) === 0) {
      zeroDischargeSites.add(site);
    }
    if (value === undefined) continue;
    const field = code === '00060'
      ? 'cfs'
      : code === '00065'
        ? 'heightFt'
        : code === '00010'
          ? 'tempC'
          : code === '00300'
            ? 'dissolvedOxygenMgL'
            : code === '00045'
              ? 'precipitationMm'
              : null;
    if (!field) continue;
    const entry = bySite.get(site) ?? {};
    entry[field] = { value, ts: normalizeTimestamp(latest.dateTime) };
    bySite.set(site, entry);
  }

  // Pass 2 (T1-6): parameters older than the shared freshness window
  // (READING_STALE_MINUTES — the same 3 h the scorer's staleness contract
  // uses) relative to the site's newest observation are dropped; the reading
  // carries only what survived, stamped with the newest surviving time.
  // Metrics observed at a different instant than the merged stamp keep their
  // own time in metricTimes (F01) — instant comparison throughout, never
  // string order (F34).
  const readings: GaugeReading[] = [];
  for (const [gaugeId, entry] of bySite) {
    const times = Object.values(entry)
      .map((m) => (m ? Date.parse(m.ts) : Number.NaN))
      .filter((ms) => !Number.isNaN(ms));
    if (times.length === 0) continue;
    const newest = Math.max(...times);
    const merged: { cfs?: number; heightFt?: number; tempC?: number; dissolvedOxygenMgL?: number; precipitationMm?: number } = {};
    const metricTimes: NonNullable<GaugeReading['metricTimes']> = {};
    let timestamp: string | undefined;
    for (const [field, metric] of Object.entries(entry) as [keyof SiteMetrics, MetricValue][]) {
      if (!metric) continue;
      if (newest - Date.parse(metric.ts) > READING_STALE_MINUTES * 60_000) continue;
      merged[field] = metric.value;
      if (timestamp === undefined || Date.parse(metric.ts) > Date.parse(timestamp)) timestamp = metric.ts;
    }
    if (timestamp === undefined) continue;
    for (const [field, metric] of Object.entries(entry) as [keyof SiteMetrics, MetricValue][]) {
      if (merged[field] === undefined || !metric) continue;
      if (Date.parse(metric.ts) === Date.parse(timestamp)) continue;
      metricTimes[field] = metric.ts;
    }
    const parsed = GaugeReadingSchema.safeParse({
      gaugeId,
      ...merged,
      timestamp,
      ...(Object.keys(metricTimes).length > 0 ? { metricTimes } : {}),
    });
    if (parsed.success) readings.push(parsed.data);
  }
  return {
    readings,
    warnings: [...zeroDischargeSites].map(
      (site) => `USGS ${site} returned zero discharge; flow omitted until the sensor is verified`,
    ),
  };
}

export function parseInstantValues(payload: unknown): GaugeReading[] {
  return parseInstantValuesDetailed(payload).readings;
}

interface FetchInstantValuesResult {
  readings: GaugeReading[];
  warnings: string[];
}

/** Fetch instant values for a batch of sites (single merged request per ≤50 sites). */
async function fetchInstantValuesDetailed(siteIds: string[], opts: UsgsFetchOptions): Promise<FetchInstantValuesResult> {
  if (siteIds.length === 0) return { readings: [], warnings: [] };
  if (opts.provider === 'waterdata') {
    const modern = await fetchWaterDataReadings(siteIds, {
      userAgent: opts.userAgent,
      apiKey: opts.waterDataApiKey,
      fetchImpl: opts.fetchImpl,
      baseUrl: opts.baseUrl,
      timeoutMs: opts.timeoutMs,
    });
    return modern;
  }
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? USGS_IV_URL;
  const readings: GaugeReading[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < siteIds.length; i += SITES_PER_REQUEST) {
    const batch = siteIds.slice(i, i + SITES_PER_REQUEST);
    const url = `${base}?format=json&sites=${batch.join(',')}&parameterCd=${PARAM_CODES.join(',')}`;
    const res = await fetchWithRetry(
      () =>
        doFetch(url, {
          headers: { 'User-Agent': opts.userAgent, Accept: 'application/json' },
          signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
        }),
      { baseDelayMs: 1000 },
    );
    if (!res.ok) {
      throw new Error(`USGS request failed: HTTP ${res.status} for sites ${batch.join(',')}`);
    }
    const parsed = parseInstantValuesDetailed(await res.json());
    readings.push(...parsed.readings);
    warnings.push(...parsed.warnings);
    // Politeness gap between batches (§8: respect rate limits).
    if (i + SITES_PER_REQUEST < siteIds.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return { readings, warnings };
}

export async function fetchInstantValues(siteIds: string[], opts: UsgsFetchOptions): Promise<GaugeReading[]> {
  return (await fetchInstantValuesDetailed(siteIds, opts)).readings;
}

export interface GaugesJobResult extends JobDetail {
  items: number;
  sites: number;
  warnings: string[];
}

/**
 * Gauges job: read every gaugeId seeded from content streams, fetch USGS instant values,
 * store one raw+normalized row per gauge, prune stale raw rows. Failures land in jobs_log
 * and are rethrown so the caller (cron/CLI) decides how to recover — the process survives.
 */
export async function runGaugesJob(db: Db, opts: UsgsFetchOptions): Promise<GaugesJobResult> {
  const handle = startJob(db, 'gauges');
  try {
    const rows = db.prepare('SELECT gauge_ids FROM streams WHERE gauge_ids != ?').all('[]') as {
      gauge_ids: string;
    }[];
    // Non-numeric ids (tva:/usace:-prefixed) belong to the conditions bridge
    // (evidence/conditionsBridge.ts) and must never reach NWIS.
    const siteIds = [
      ...new Set(rows.flatMap((r) => JSON.parse(r.gauge_ids) as string[]).filter((id) => /^\d+$/.test(id))),
    ];
    if (siteIds.length === 0) {
      const empty = { items: 0, sites: 0, warnings: ['no numeric USGS gauges seeded — nothing to fetch'] };
      handle.ok(empty);
      return empty;
    }

    // Network first (never inside a SQLite transaction — those are synchronous);
    // all writes happen in one synchronous transaction below.
    const fetched = await fetchInstantValuesDetailed(siteIds, opts);
    const readings = fetched.readings;
    const store = db.transaction((): GaugesJobResult => {
      const insert = db.prepare(`
      INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, dissolved_oxygen_mg_l, reservoir_level_ft, precipitation_mm, observed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const fetchedAt = new Date().toISOString();
      for (const r of readings) {
        insert.run(
          r.gaugeId,
          fetchedAt,
          JSON.stringify(r),
          r.cfs ?? null,
          r.heightFt ?? null,
          r.tempC ?? null,
          r.dissolvedOxygenMgL ?? null,
          null,
          r.precipitationMm ?? null,
          r.timestamp,
        );
      }
      const cutoff = new Date(Date.now() - RAW_RETENTION_DAYS * 86_400_000).toISOString();
      // F34: instant comparison (julianday), never text — observed_at values
      // may carry mixed UTC offsets.
      db.prepare('DELETE FROM gauge_readings_raw WHERE julianday(observed_at) < julianday(?)').run(cutoff);
      return {
        items: readings.length,
        sites: siteIds.length,
        warnings: [
          ...fetched.warnings,
          ...(readings.length < siteIds.length
            ? [`${siteIds.length - readings.length} of ${siteIds.length} gauges returned no data`]
            : []),
        ],
      };
    });
    const result = store();
    handle.ok(result);
    return result;
  } catch (err) {
    handle.fail(err, { items: 0 });
    throw err;
  }
}

/**
 * Read the newest stored reading per gauge (used by the snapshot builder).
 *
 * F34 (2026-09-29 audit): `observed_at` values may carry different UTC offsets
 * (the legacy parser preserves source offsets and the DST repeated hour mixes
 * them within one hour), so rows are ordered by `julianday(observed_at)` —
 * true instant order — never by text. This also covers rows written before
 * any storage normalization, without a migration.
 *
 * F01: freshness is per-metric. The payload column carries the source reading
 * including `metricTimes`; a metric whose OWN observation is older than the
 * absolute freshness window (injected `nowMs` — never another metric's
 * timestamp) is dropped here, so a working flow sensor cannot renew a stopped
 * temperature sensor through the snapshot chain.
 */
export function latestReadings(db: Db, nowMs = Date.now()): GaugeReading[] {
  const rows = db
    .prepare(
      `SELECT gauge_id, cfs, height_ft, temp_c, dissolved_oxygen_mg_l, reservoir_level_ft, precipitation_mm, observed_at, payload
       FROM gauge_readings_raw
       WHERE id IN (
         SELECT id FROM (
           SELECT id, ROW_NUMBER() OVER (PARTITION BY gauge_id ORDER BY julianday(observed_at) DESC) AS rn
           FROM gauge_readings_raw WHERE observed_at IS NOT NULL
         ) WHERE rn = 1
       )`,
    )
    .all() as { gauge_id: string; cfs: number | null; height_ft: number | null; temp_c: number | null; dissolved_oxygen_mg_l: number | null; reservoir_level_ft: number | null; precipitation_mm: number | null; observed_at: string; payload: string | null }[];
  return rows.flatMap((r) => {
    const observedMs = Date.parse(r.observed_at);
    if (!Number.isFinite(observedMs) || nowMs - observedMs > READING_STALE_MINUTES * 60_000) return [];
    // Per-metric observation times from the stored source reading (rows written
    // before F01 carry no metricTimes and fall back to the row's observed_at).
    let metricTimes: Partial<Record<string, string>> | undefined;
    if (r.payload) {
      try {
        const parsed = JSON.parse(r.payload) as { metricTimes?: Partial<Record<string, string>> };
        if (parsed && typeof parsed === 'object' && parsed.metricTimes && typeof parsed.metricTimes === 'object') {
          metricTimes = parsed.metricTimes;
        }
      } catch {
        // malformed payload — per-metric times unavailable, row stamp rules
      }
    }
    /** A metric survives only if its OWN observation is within the window. */
    const metricAgeOk = (field: string): boolean => {
      const own = metricTimes?.[field];
      if (own === undefined) return true; // observed at the row's stamp (already gated above)
      const ms = Date.parse(own);
      return Number.isFinite(ms) && nowMs - ms <= READING_STALE_MINUTES * 60_000;
    };
    const cfs = r.cfs !== null && r.cfs > 0 && metricAgeOk('cfs') ? r.cfs : null;
    const heightFt = r.height_ft !== null && Number.isFinite(r.height_ft) && metricAgeOk('heightFt') ? r.height_ft : null;
    const tempC = r.temp_c !== null && Number.isFinite(r.temp_c) && metricAgeOk('tempC') ? r.temp_c : null;
    const dissolvedOxygenMgL = r.dissolved_oxygen_mg_l !== null && r.dissolved_oxygen_mg_l >= 0 && metricAgeOk('dissolvedOxygenMgL') ? r.dissolved_oxygen_mg_l : null;
    const reservoirLevelFt = r.reservoir_level_ft !== null && r.reservoir_level_ft >= 0 && metricAgeOk('reservoirLevelFt') ? r.reservoir_level_ft : null;
    const precipitationMm = r.precipitation_mm !== null && r.precipitation_mm >= 0 && metricAgeOk('precipitationMm') ? r.precipitation_mm : null;
    if (cfs === null && heightFt === null && tempC === null && dissolvedOxygenMgL === null && reservoirLevelFt === null && precipitationMm === null) return [];
    const keptMetricTimes: NonNullable<GaugeReading['metricTimes']> = {};
    for (const [field, value] of Object.entries(metricTimes ?? {})) {
      if (value === undefined) continue;
      const kept = { cfs, heightFt, tempC, dissolvedOxygenMgL, reservoirLevelFt, precipitationMm }[
        field as 'cfs' | 'heightFt' | 'tempC' | 'dissolvedOxygenMgL' | 'reservoirLevelFt' | 'precipitationMm'
      ];
      if (kept === null || kept === undefined) continue;
      keptMetricTimes[field as 'cfs'] = value;
    }
    return [
      {
        gaugeId: r.gauge_id,
        ...(cfs !== null ? { cfs } : {}),
        ...(heightFt !== null ? { heightFt } : {}),
        ...(tempC !== null ? { tempC } : {}),
        ...(dissolvedOxygenMgL !== null ? { dissolvedOxygenMgL } : {}),
        ...(reservoirLevelFt !== null ? { reservoirLevelFt } : {}),
        ...(precipitationMm !== null ? { precipitationMm } : {}),
        timestamp: r.observed_at,
        ...(Object.keys(keptMetricTimes).length > 0 ? { metricTimes: keptMetricTimes } : {}),
      },
    ];
  });
}
