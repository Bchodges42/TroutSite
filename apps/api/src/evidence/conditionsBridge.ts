import { GaugeReadingSchema } from '@trout/contracts';
import type { GaugeReading, WaterObservation } from '@trout/contracts';
import type { Db } from '../db.js';
import { startJob, type JobDetail } from '../jobs/run.js';
import {
  fetchTvaRows,
  parseTvaNumber,
  parseTvaObservations,
  parseTvaTimestamp,
  type TvaRow,
} from './tva-provider.js';
import { USACE_TAILWATER_SERIES, fetchUsaceObservations } from './usace-provider.js';
import { TVA_MONITORS } from './monitors.js';

/**
 * Conditions bridge (gauges lane): turns the NON-USGS gauge sources (TVA
 * observed-data + USACE A2W tailwater series) into rows in gauge_readings_raw
 * keyed by namespaced gauge ids (`tva:NRST1`, `usace:CETT1`; USGS ids stay bare
 * numeric strings). The snapshot builder and the frozen source-agnostic
 * scoreConditions then treat them exactly like USGS readings — no scorer change.
 *
 * Mapping: discharge-cfs → cfs, stage-ft → height_ft, temperature-c → temp_c;
 * reservoir-level-ft is deliberately NOT a conditions input and is skipped.
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

/** metric → gauge_readings_raw column (reservoir-level-ft intentionally absent). */
const METRIC_FIELD: Partial<Record<WaterObservation['metric'], 'cfs' | 'heightFt' | 'tempC'>> = {
  'discharge-cfs': 'cfs',
  'stage-ft': 'heightFt',
  'temperature-c': 'tempC',
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
 * reservoir-level-ft (and any metric without a column) is skipped. Returns null
 * when nothing conditions-relevant survived validation.
 */
export function buildConditionsReading(
  gaugeId: string,
  source: string,
  obs: WaterObservation[],
  rawByMetric: Partial<Record<WaterObservation['metric'], unknown>> = {},
): ConditionsReading | null {
  const sorted = [...obs].sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  const fields: { cfs?: number; heightFt?: number; tempC?: number } = {};
  const rows: Record<string, unknown> = {};
  let timestamp: string | undefined;
  for (const o of sorted) {
    const field = METRIC_FIELD[o.metric];
    if (!field || fields[field] !== undefined) continue;
    fields[field] = o.value;
    rows[o.metric] = rawByMetric[o.metric] ?? { observedAt: o.observedAt, value: o.value };
    if (timestamp === undefined || o.observedAt > timestamp) timestamp = o.observedAt;
  }
  if (timestamp === undefined) return null;
  const parsed = GaugeReadingSchema.safeParse({ gaugeId, ...fields, timestamp });
  if (!parsed.success) return null;
  return { reading: parsed.data, payload: JSON.stringify({ source, gaugeId, rows }) };
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
}

export interface ConditionsBridgeResult extends JobDetail {
  gauges: number;
  items: number;
  tvaLocations: number;
  usaceStations: number;
  errors: number;
  warnings: string[];
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

  const tvaMonitors = Object.entries(TVA_MONITORS).filter(([, m]) => m.role === 'tailwater');
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

  for (const [station, series] of Object.entries(USACE_TAILWATER_SERIES)) {
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
      INSERT INTO gauge_readings_raw (gauge_id, fetched_at, payload, cfs, height_ft, temp_c, observed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
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
        c.reading.timestamp,
      );
    }
    return built.length;
  });
  const items = store();

  const result: ConditionsBridgeResult = {
    gauges: built.length,
    items,
    tvaLocations: tvaMonitors.length,
    usaceStations: Object.keys(USACE_TAILWATER_SERIES).length,
    errors,
    warnings,
  };
  handle.ok(result);
  return result;
}
