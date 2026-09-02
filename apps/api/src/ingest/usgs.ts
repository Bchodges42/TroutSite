import { GaugeReadingSchema } from '@trout/contracts';
import type { GaugeReading } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob, type JobDetail } from '../jobs/run.js';
import { fetchWithRetry } from '../lib/retry.js';

const USGS_IV_URL = 'https://waterservices.usgs.gov/nwis/iv/';
/** USGS parameter codes: discharge (cfs), gage height (ft), water temperature (°C). */
const PARAM_CODES = ['00060', '00065', '00010'] as const;
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

/** USGS missing-data sentinels arrive as string values; treat them as absent. */
function parseMetric(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  // -999999 (and variants) mean "no measurement" in NWIS.
  if (n <= -999000) return undefined;
  return n;
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
  const usable = values.filter((v) => typeof v?.value === 'string' && typeof v?.dateTime === 'string');
  if (usable.length === 0) return undefined;
  return usable.reduce((newest, v) => (v.dateTime > newest.dateTime ? v : newest));
}

/**
 * Pure parser for the USGS Waterservices instant-values JSON (format=json).
 * One merged GaugeReading per site: the newest value of each available parameter.
 * Tolerates missing parameters, missing series, empty value arrays, and sentinel values.
 */
export function parseInstantValues(payload: unknown): GaugeReading[] {
  const series = (payload as UsgsResponseJson)?.value?.timeSeries ?? [];
  const bySite = new Map<string, { cfs?: number; heightFt?: number; tempC?: number; timestamp: string }>();

  for (const s of series) {
    const site = s.sourceInfo?.siteCode?.[0]?.value;
    if (!site) continue;
    const code = (s.variable?.variableCode ?? []).find((vc) => typeof vc.value === 'string')?.value;
    const latest = latestValue(s);
    if (!code || !latest) continue;

    const entry = bySite.get(site) ?? { timestamp: normalizeTimestamp(latest.dateTime) };
    const value = parseMetric(latest.value);
    if (value !== undefined) {
      if (code === '00060') entry.cfs = value;
      else if (code === '00065') entry.heightFt = value;
      else if (code === '00010') entry.tempC = value;
    }
    // Timestamps differ per series by seconds; keep the newest across merged parameters.
    const ts = normalizeTimestamp(latest.dateTime);
    if (ts > entry.timestamp) entry.timestamp = ts;
    bySite.set(site, entry);
  }

  const readings: GaugeReading[] = [];
  for (const [gaugeId, e] of bySite) {
    const candidate: GaugeReading = {
      gaugeId,
      ...(e.cfs !== undefined ? { cfs: e.cfs } : {}),
      ...(e.heightFt !== undefined ? { heightFt: e.heightFt } : {}),
      ...(e.tempC !== undefined ? { tempC: e.tempC } : {}),
      timestamp: e.timestamp,
    };
    const parsed = GaugeReadingSchema.safeParse(candidate);
    if (parsed.success) readings.push(parsed.data);
  }
  return readings;
}

/** Fetch instant values for a batch of sites (single merged request per ≤50 sites). */
export async function fetchInstantValues(siteIds: string[], opts: UsgsFetchOptions): Promise<GaugeReading[]> {
  if (siteIds.length === 0) return [];
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? USGS_IV_URL;
  const readings: GaugeReading[] = [];

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
    readings.push(...parseInstantValues(await res.json()));
    // Politeness gap between batches (§8: respect rate limits).
    if (i + SITES_PER_REQUEST < siteIds.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return readings;
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
    const siteIds = [...new Set(rows.flatMap((r) => JSON.parse(r.gauge_ids) as string[]))];
    if (siteIds.length === 0) {
      const empty = { items: 0, sites: 0, warnings: ['no streams seeded yet — nothing to fetch'] };
      handle.ok(empty);
      return empty;
    }

    // Network first (never inside a SQLite transaction — those are synchronous);
    // all writes happen in one synchronous transaction below.
    const readings = await fetchInstantValues(siteIds, opts);
    const store = db.transaction((): GaugesJobResult => {
      const insert = db.prepare(`
        INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, observed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
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
          r.timestamp,
        );
      }
      const cutoff = new Date(Date.now() - RAW_RETENTION_DAYS * 86_400_000).toISOString();
      db.prepare('DELETE FROM gauge_readings_raw WHERE observed_at < ?').run(cutoff);
      return {
        items: readings.length,
        sites: siteIds.length,
        warnings:
          readings.length < siteIds.length
            ? [`${siteIds.length - readings.length} of ${siteIds.length} gauges returned no data`]
            : [],
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

/** Read the newest stored reading per gauge (used by the snapshot builder). */
export function latestReadings(db: Db): GaugeReading[] {
  const rows = db
    .prepare(
      `SELECT gauge_id, cfs, height_ft, temp_c, observed_at
       FROM gauge_readings_raw
       WHERE id IN (
         SELECT id FROM (
           SELECT id, ROW_NUMBER() OVER (PARTITION BY gauge_id ORDER BY observed_at DESC) AS rn
           FROM gauge_readings_raw WHERE observed_at IS NOT NULL
         ) WHERE rn = 1
       )`,
    )
    .all() as { gauge_id: string; cfs: number | null; height_ft: number | null; temp_c: number | null; observed_at: string }[];
  return rows.map((r) => ({
    gaugeId: r.gauge_id,
    ...(r.cfs !== null ? { cfs: r.cfs } : {}),
    ...(r.height_ft !== null ? { heightFt: r.height_ft } : {}),
    ...(r.temp_c !== null ? { tempC: r.temp_c } : {}),
    timestamp: r.observed_at,
  }));
}
