import { GaugeReadingSchema, READING_STALE_MINUTES, ReleaseScheduleSchema } from '@trout/contracts';
import type { GaugeReading, ReleaseSchedule, WaterObservation } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob, type JobDetail } from '../jobs/run.js';
import {
  fetchTvaRows,
  parseTvaNumber,
  parseTvaObservations,
  parseTvaTimestamp,
  fetchTvaGenerationReleases,
  fetchTvaPredictedData,
  tvaSourceUrl,
  type TvaRow,
} from './tva-provider.js';
import { USACE_TAILWATER_SERIES, fetchUsaceObservations } from './usace-provider.js';
import { TVA_MONITORS, TVA_SCHEDULE_MONITORS } from './monitors.js';

/**
 * Conditions bridge (gauges lane): turns the NON-USGS gauge sources (TVA
 * observed-data + USACE A2W tailwater series) into rows in gauge_readings_raw
 * keyed by namespaced gauge ids (`tva:NRST1`, `usace:CETT1`; USGS ids stay bare
 * numeric strings). The snapshot builder and the frozen source-agnostic
 * scoreConditions then treat them exactly like USGS readings — no scorer change.
 *
 * Mapping: discharge-cfs → cfs, stage-ft → height_ft, temperature-c → temp_c;
 * reservoir-level-ft → reservoir_level_ft for lake context only.
 * Every reading is validated with GaugeReadingSchema before insert; the payload
 * column keeps the RAW source row per metric for audit.
 *
 * Job log: its own 'gauges-conditions' row so build.ts's jobHealthy(db,'gauges')
 * keeps keying the USGS run exactly as before (no staleness-semantics change).
 * Soft-fail by source, mirroring the evidence job: an upstream failure becomes a
 * warning + errors count — the run only hard-fails on a crash.
 */

const TVA_BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** metric → gauge_readings_raw column (all non-score context is additive). */
const METRIC_FIELD: Partial<Record<WaterObservation['metric'], 'cfs' | 'heightFt' | 'tempC' | 'dissolvedOxygenMgL' | 'reservoirLevelFt' | 'precipitationMm'>> = {
  'discharge-cfs': 'cfs',
  'stage-ft': 'heightFt',
  'temperature-c': 'tempC',
  'dissolved-oxygen-mg-l': 'dissolvedOxygenMgL',
  'reservoir-level-ft': 'reservoirLevelFt',
  'precipitation-mm': 'precipitationMm',
};

/** TVA observed-data field behind each metric (for raw-row audit lookup). */
const TVA_FIELD_BY_METRIC: Partial<Record<WaterObservation['metric'], keyof TvaRow>> = {
  'discharge-cfs': 'AverageHourlyDischarge',
  'stage-ft': 'TailwaterElevation',
  'reservoir-level-ft': 'ReservoirElevation',
};

export interface ConditionsReading {
  reading: GaugeReading;
  /** Raw source rows per metric, JSON-encoded for the payload audit column. */
  payload: string;
}

/**
 * Merge one gauge's newest-wins observations into a single GaugeReading the way
 * parseInstantValues merges USGS parameters: newest observation per metric wins,
 * the reading timestamp is the newest INCLUDED metric's observedAt, and
 * any metric without a column is skipped. Newest-wins and the merge stamp are
 * chosen by PARSED INSTANT, never string order (F34 — TVA offsets differ by
 * zone label and the DST repeated hour mixes them). T1-6: a
 * metric whose own observation is older than the freshness window
 * (READING_STALE_MINUTES, the scorer's staleness contract) relative to the
 * gauge's newest observation is dropped instead of merged — a dead discharge
 * sensor must not ride along under a fresh stage timestamp. Metrics included
 * at a different instant than the merged stamp keep their own time in
 * metricTimes (F01). Returns null when nothing conditions-relevant survived
 * validation.
 */
export function buildConditionsReading(
  gaugeId: string,
  source: string,
  obs: WaterObservation[],
  rawByMetric: Partial<Record<WaterObservation['metric'], unknown>> = {},
): ConditionsReading | null {
  const sorted = [...obs].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  const newest = sorted[0]?.observedAt;
  const newestMs = newest ? Date.parse(newest) : Number.NaN;
  const fields: GaugeReading = { gaugeId, timestamp: newest ?? new Date(0).toISOString() };
  const rows: Record<string, unknown> = {};
  /** The chosen observation per included field (for per-metric freshness times). */
  const chosen: Partial<Record<'cfs' | 'heightFt' | 'tempC' | 'dissolvedOxygenMgL' | 'reservoirLevelFt' | 'precipitationMm', WaterObservation>> = {};
  let timestamp: string | undefined;
  for (const o of sorted) {
    const field = METRIC_FIELD[o.metric];
    if (!field || fields[field] !== undefined) continue;
    const observedMs = Date.parse(o.observedAt);
    if (
      !Number.isNaN(newestMs) &&
      !Number.isNaN(observedMs) &&
      newestMs - observedMs > READING_STALE_MINUTES * 60_000
    ) {
      continue;
    }
    fields[field] = o.value;
    chosen[field] = o;
    rows[o.metric] = rawByMetric[o.metric] ?? { observedAt: o.observedAt, value: o.value };
    if (timestamp === undefined || observedMs > Date.parse(timestamp)) timestamp = o.observedAt;
  }
  if (timestamp === undefined) return null;
  const metricTimes: NonNullable<GaugeReading['metricTimes']> = {};
  for (const [field, o] of Object.entries(chosen) as [keyof typeof chosen, WaterObservation][]) {
    if (Date.parse(o.observedAt) === Date.parse(timestamp)) continue;
    metricTimes[field] = o.observedAt;
  }
  const parsed = GaugeReadingSchema.safeParse({
    ...fields,
    timestamp,
    ...(Object.keys(metricTimes).length > 0 ? { metricTimes } : {}),
  });
  if (!parsed.success) return null;
  return {
    reading: parsed.data,
    payload: JSON.stringify({
      source,
      gaugeId,
      rows,
      ...(Object.keys(metricTimes).length > 0 ? { metricTimes } : {}),
    }),
  };
}

/** Find the exact TVA row behind an observation (for the raw audit payload). */
function tvaRawRowFor(obs: WaterObservation, rows: TvaRow[]): unknown {
  const field = TVA_FIELD_BY_METRIC[obs.metric];
  if (!field) return undefined;
  return rows.find(
    (r) =>
      parseTvaTimestamp(r.Day ?? '', r.Time ?? '') === obs.observedAt &&
      parseTvaNumber(r[field]) === obs.value,
  );
}

export interface ConditionsBridgeOptions {
  /** Plain user agent for the USACE A2W API. */
  userAgent: string;
  /** Browser-like user agent for tva.com (Cloudflare front). Defaults to the evidence lane's. */
  tvaUserAgent?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** USACE inter-series spacing (default 1000 ms; 0 in tests). */
  spacingMs?: number;
  /** TVA politeness gap (default 300 ms; 0 in tests). */
  tvaSpacingMs?: number;
  /** USACE lookback window hours (default 48). */
  windowHours?: number;
  /** Fetch and persist TVA release/forecast context. Disabled for legacy bridge callers. */
  releaseSchedules?: boolean;
  /** Fetch reservoir level/discharge rows as conditions context. */
  includeReservoirs?: boolean;
}

export interface ConditionsBridgeResult extends JobDetail {
  gauges: number;
  items: number;
  tvaLocations: number;
  usaceStations: number;
  errors: number;
  warnings: string[];
  releaseSchedules: number;
}

interface FetchedBatch {
  gaugeId: string;
  source: 'tva-restapi' | 'usace-a2w';
  obs: WaterObservation[];
  rawByMetric: Partial<Record<WaterObservation['metric'], unknown>>;
}

/**
 * Fetch every TVA tailwater monitor (role 'tailwater' in TVA_MONITORS) and every
 * registered USACE tailwater station, and write ONE merged reading per namespaced
 * gauge into gauge_readings_raw. Never touches USGS (numeric ids stay the USGS
 * job's business) and never writes lake/reservoir monitors.
 */
export async function runConditionsReadingsJob(
  db: Db,
  opts: ConditionsBridgeOptions,
): Promise<ConditionsBridgeResult> {
  const handle = startJob(db, 'gauges-conditions');
  const warnings: string[] = [];
  let errors = 0;
  const tvaUa = opts.tvaUserAgent ?? TVA_BROWSER_UA;
  const batches: FetchedBatch[] = [];
  const scheduleRows: ReleaseSchedule[] = [];

  const tvaMonitors = Object.entries(TVA_MONITORS).filter(
    ([, m]) => m.role === 'tailwater' || opts.includeReservoirs === true,
  );
  for (const [waterId, monitor] of tvaMonitors) {
    try {
      const rows = await fetchTvaRows(monitor.locationId, {
        userAgent: tvaUa,
        fetchImpl: opts.fetchImpl,
        timeoutMs: opts.timeoutMs,
      });
      const obs = parseTvaObservations(rows, { locationId: monitor.locationId });
      const rawByMetric: Partial<Record<WaterObservation['metric'], unknown>> = {};
      for (const o of obs) {
        const raw = tvaRawRowFor(o, rows);
        if (raw !== undefined) rawByMetric[o.metric] = raw;
      }
      batches.push({ gaugeId: `tva:${monitor.locationId}`, source: 'tva-restapi', obs, rawByMetric });
    } catch (err) {
      errors += 1;
      warnings.push(`TVA ${monitor.locationId} (${waterId}) failed: ${(err as Error).message}`);
    }
    // Politeness gap (Cloudflare front), same as the evidence lane.
    await new Promise((r) => setTimeout(r, opts.tvaSpacingMs ?? 300));
  }

  if (opts.releaseSchedules) {
    for (const [waterId, monitor] of Object.entries(TVA_SCHEDULE_MONITORS)) {
      let releases: ReleaseSchedule['releases'] = [];
      let forecasts: ReleaseSchedule['forecasts'] = [];
      let error: string | undefined;
      try {
        releases = await fetchTvaGenerationReleases(monitor.locationId, {
          userAgent: tvaUa,
          fetchImpl: opts.fetchImpl,
          timeoutMs: opts.timeoutMs,
        });
      } catch (err) {
        error = `generation releases: ${(err as Error).message}`;
      }
      try {
        forecasts = await fetchTvaPredictedData(monitor.locationId, {
          userAgent: tvaUa,
          fetchImpl: opts.fetchImpl,
          timeoutMs: opts.timeoutMs,
        });
      } catch (err) {
        error = error
          ? `${error}; predicted data: ${(err as Error).message}`
          : `predicted data: ${(err as Error).message}`;
      }
      let schedule: ReleaseSchedule;
      try {
        schedule = ReleaseScheduleSchema.parse({
          waterId,
          locationId: monitor.locationId,
          retrievedAt: new Date().toISOString(),
          sourceUrl: tvaSourceUrl(monitor.locationId),
          status: error ? 'unavailable' : releases.length === 0 ? 'empty' : 'available',
          releases,
          forecasts,
          ...(error ? { error } : {}),
        });
      } catch (err) {
        // One malformed upstream row must never abort the whole gauges job —
        // degrade this monitor to an unavailable schedule and keep ingesting.
        errors += 1;
        const validationError = `schedule validation failed: ${(err as Error).message}`;
        warnings.push(`TVA schedule ${monitor.locationId} (${waterId}) ${validationError}`);
        schedule = ReleaseScheduleSchema.parse({
          waterId,
          locationId: monitor.locationId,
          retrievedAt: new Date().toISOString(),
          sourceUrl: tvaSourceUrl(monitor.locationId),
          status: 'unavailable',
          releases: [],
          forecasts: [],
          error: validationError,
        });
      }
      scheduleRows.push(schedule);
      if (error) warnings.push(`TVA schedule ${monitor.locationId} (${waterId}) unavailable: ${error}`);
    }
  }

  // CORT1 is retained in the registry for coverage and fixture validation, but
  // cumberland-river deliberately has no single representative gauge. Fetching
  // it here created an orphan reading that no snapshot could consume (NEW-2).
  const usaceFetchEntries = Object.entries(USACE_TAILWATER_SERIES).filter(([station]) => station !== 'CORT1');
  for (const [station, series] of usaceFetchEntries) {
    try {
      const result = await fetchUsaceObservations(station, {
        userAgent: opts.userAgent,
        fetchImpl: opts.fetchImpl,
        timeoutMs: opts.timeoutMs,
        spacingMs: opts.spacingMs,
        windowHours: opts.windowHours,
      });
      batches.push({
        gaugeId: `usace:${station}`,
        source: 'usace-a2w',
        obs: result.observations,
        rawByMetric: result.rawByMetric,
      });
      warnings.push(...result.warnings);
    } catch (err) {
      errors += 1;
      warnings.push(`USACE ${station} (${series.waterId}) failed: ${(err as Error).message}`);
    }
  }

  const built = batches
    .map((b) => ({ batch: b, built: buildConditionsReading(b.gaugeId, b.source, b.obs, b.rawByMetric) }))
    .filter((b): b is { batch: FetchedBatch; built: ConditionsReading } => b.built !== null);

  const store = db.transaction((): number => {
    const insert = db.prepare(`
      INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, dissolved_oxygen_mg_l, reservoir_level_ft, precipitation_mm, observed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const fetchedAt = new Date().toISOString();
    for (const { built: c } of built) {
      insert.run(
        c.reading.gaugeId,
        fetchedAt,
        c.payload,
        c.reading.cfs ?? null,
        c.reading.heightFt ?? null,
        c.reading.tempC ?? null,
        c.reading.dissolvedOxygenMgL ?? null,
        c.reading.reservoirLevelFt ?? null,
        c.reading.precipitationMm ?? null,
        c.reading.timestamp,
      );
    }
    if (scheduleRows.length > 0) {
      const insertSchedule = db.prepare(`
        INSERT INTO release_schedules (water_id, location_id, retrieved_at, payload)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(water_id) DO UPDATE SET
          location_id=excluded.location_id, retrieved_at=excluded.retrieved_at, payload=excluded.payload
      `);
      for (const schedule of scheduleRows) {
        insertSchedule.run(schedule.waterId, schedule.locationId, schedule.retrievedAt, JSON.stringify(schedule));
      }
    }
    return built.length;
  });
  const items = store();

  const result: ConditionsBridgeResult = {
    gauges: built.length,
    items,
    tvaLocations: tvaMonitors.length,
    usaceStations: usaceFetchEntries.length,
    errors,
    warnings,
    releaseSchedules: scheduleRows.length,
  };
  handle.ok(result);
  return result;
}
