import { WaterObservationSchema } from '@trout/contracts';
import type { WaterObservation } from '@trout/contracts';

/**
 * USACE "Access to Water" (A2W) reporting API parser (data-sources lane).
 *
 * GET https://water.usace.army.mil/cda/reporting/providers/lrn/timeseries
 *       ?name={TSID}&begin={ISO-Z}&end={ISO-Z}
 * returns:
 *   {"key":"CETT1-CENTER_HILL.Flow.Ave.1Hour.1Hour.man-rev","parameter":"Flow",
 *    "unit":"cfs","values":[["2026-09-05T00:00:00Z",8078.00], ...]}
 * — [ISO-Z UTC, number|null] pairs. Nashville District (provider "lrn") only;
 * rivergages.mvr.usace.army.mil does not carry LRN. No auth, plain UA +
 * Accept: application/json suffice; no CORS — server-side fetches only.
 *
 * Units are fixed English per series (the API ignores a unit parameter):
 *   Flow          → cfs          (0.0 is a real reading — turbines off)
 *   Elev-Tail / Stage-Tail → ft  (tailwater elevation, NGVD29)
 *   Temp-Water-Tail → °F          (converted to °C here, rounded to 0.1)
 *
 * Verified edge behaviors (2026-09-08 captures, .session1-research/usace):
 *   - unknown TSID  → HTTP 200 with an EMPTY body (0 bytes) — a warning, not an error;
 *   - empty/future window → HTTP 200 with values: [] — also a warning;
 *   - HTTP !ok      → thrown (the caller converts it to an upstream error);
 *   - series lag up to ~7 h → the fetch window defaults to 48 h.
 * TSIDs are HARDCODED below (verified live 2026-09-08) and never discovered at runtime.
 */

const USACE_A2W_BASE = 'https://water.usace.army.mil/cda/reporting/providers/lrn';

export interface UsaceSeriesSet {
  waterId: string;
  flow: string;
  stage?: string;
  temp?: string;
}

/**
 * Hardcoded LRN timeseries ids per dam tailwater (all verified live 2026-09-08,
 * fixtures apps/api/fixtures/USACE/ + .session1-research/usace/fixtures/README.md).
 * OHIT1/ASHT1/BARK2 are deliberately absent: OHIT1+ASHT1 temp series are dead and
 * no catalog water maps to them; Barkley has no temp series and TVA already covers
 * the lake (prefixes keep the TVA/USACE BARK2 id spaces distinct anyway).
 */
export const USACE_TAILWATER_SERIES: Record<string, UsaceSeriesSet> = {
  CETT1: {
    waterId: 'caney-fork-river',
    flow: 'CETT1-CENTER_HILL.Flow.Ave.1Hour.1Hour.man-rev',
    stage: 'CETT1-CENTER_HILL.Elev-Tail.Inst.30Minutes.0.dcp-rev',
    temp: 'CETT1-CENTER_HILL.Temp-Water-Tail.Inst.30Minutes.0.dcp-rev',
  },
  DHTT1: {
    waterId: 'obey-river',
    flow: 'DHTT1-DALE_HOLLOW.Flow.Ave.1Hour.1Hour.man-rev',
    stage: 'DHTT1-DALE_HOLLOW.Elev-Tail.Inst.30Minutes.0.dcp-rev',
    temp: 'DHTT1-DALE_HOLLOW.Temp-Water-Tail.Inst.30Minutes.0.dcp-rev',
  },
  JPPT1: {
    waterId: 'stones-river',
    flow: 'JPPT1-J_PERCY_PRIEST.Flow.Ave.1Hour.1Hour.man-rev',
    stage: 'JPPT1-J_PERCY_PRIEST.Elev-Tail.Inst.30Minutes.0.dcp-rev',
    temp: 'JPPT1-J_PERCY_PRIEST.Temp-Water-Tail.Inst.30Minutes.0.dcp-rev',
  },
  CORT1: {
    waterId: 'cumberland-river',
    flow: 'CORT1-CORDELL_HULL.Flow.Ave.1Hour.1Hour.man-rev',
    stage: 'CORT1-CORDELL_HULL.Elev-Tail.Inst.30Minutes.0.dcp-rev',
    temp: 'CORT1-CORDELL_HULL.Temp-Water-Tail.Inst.30Minutes.0.dcp-rev',
  },
};

/** Per-row evidence URL points at the public A2W portal (the API is its data service). */
export function usaceSourceUrl(_station: string): string {
  return 'https://water.usace.army.mil/';
}

/** °F → °C rounded to 0.1 (A2W Temp-Water-Tail publishes Fahrenheit). */
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}

export interface UsaceSeriesJson {
  key?: string;
  parameter?: string;
  unit?: string;
  values?: unknown;
}

export interface ParsedUsaceSeries {
  observation: WaterObservation | null;
  /** The newest raw [ISO-Z, value] point + series key — audit payload for the DB. */
  point?: [string, number];
  seriesKey?: string;
  warning?: string;
}

/**
 * Pure parser for ONE A2W timeseries document. Newest usable point wins
 * (compared as parsed instants — F34); null values are skipped; a real
 * 0 is kept; an empty/unparseable body or values:[] yields a warning (the
 * series exists-but-said-nothing), never a thrown error and never a zero.
 */
export function parseUsaceSeries(
  payload: UsaceSeriesJson | null | undefined,
  opts: { tsid: string; metric: WaterObservation['metric']; sourceUrl?: string },
): ParsedUsaceSeries {
  if (payload === null || payload === undefined) {
    return {
      observation: null,
      warning: `USACE ${opts.tsid}: empty or unparseable response body — no such series`,
    };
  }
  const rawValues = Array.isArray(payload.values) ? payload.values : [];
  const usable: [string, number][] = [];
  for (const pair of rawValues) {
    if (!Array.isArray(pair) || typeof pair[0] !== 'string') continue;
    const v = pair[1];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue; // null = missing point
    usable.push([pair[0], v]);
  }
  if (usable.length === 0) {
    return {
      observation: null,
      warning: `USACE ${opts.tsid}: no usable values in the requested window`,
    };
  }
  // Newest by PARSED INSTANT, never text order (F34): A2W publishes ISO-Z
  // stamps (text order happens to work), but an offset-bearing pair must not
  // regress this to string comparison. A non-parseable stamp (NaN) loses.
  const [observedAt, raw] = usable.reduce((newest, p) =>
    Date.parse(p[0]) >= Date.parse(newest[0]) ? p : newest,
  );
  const unit = typeof payload.unit === 'string' ? payload.unit : '';
  const value =
    opts.metric === 'temperature-c' && unit !== 'C' ? fahrenheitToCelsius(raw) : raw;
  const parsed = WaterObservationSchema.safeParse({
    sourceId: 'usace-a2w',
    sourceUrl: opts.sourceUrl ?? usaceSourceUrl(opts.tsid),
    observedAt,
    metric: opts.metric,
    value,
  });
  if (!parsed.success) {
    return { observation: null, warning: `USACE ${opts.tsid}: value failed the observation schema` };
  }
  return {
    observation: parsed.data,
    point: [observedAt, raw],
    seriesKey: typeof payload.key === 'string' ? payload.key : opts.tsid,
  };
}

export interface UsaceFetchOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  /** Lookback window in hours (series lag up to ~7 h). Default 48. */
  windowHours?: number;
  /** Politeness gap between serial series requests (latency 0.35–6.9 s). Default 1000 ms. */
  spacingMs?: number;
}

export interface UsaceStationResult {
  observations: WaterObservation[];
  /** Newest raw source row per metric (for the gauge_readings_raw payload column). */
  rawByMetric: Partial<Record<WaterObservation['metric'], unknown>>;
  warnings: string[];
}

/**
 * Fetch every registered series for one station, serially with a spacing gap.
 * A transport/HTTP failure throws (caller converts to an upstream error); a
 * series that answers "nothing" (empty body / values:[]) only warns.
 */
export async function fetchUsaceObservations(
  station: string,
  opts: UsaceFetchOptions,
): Promise<UsaceStationResult> {
  const series = USACE_TAILWATER_SERIES[station];
  if (!series) {
    throw new Error(`USACE station ${station} is not in the hardcoded registry (TSIDs are never discovered at runtime)`);
  }
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? USACE_A2W_BASE;
  const end = new Date();
  const begin = new Date(end.getTime() - (opts.windowHours ?? 48) * 3_600_000);
  const requests: { tsid: string; metric: WaterObservation['metric'] }[] = [
    { tsid: series.flow, metric: 'discharge-cfs' },
    ...(series.stage ? [{ tsid: series.stage, metric: 'stage-ft' as const }] : []),
    ...(series.temp ? [{ tsid: series.temp, metric: 'temperature-c' as const }] : []),
  ];
  const out: UsaceStationResult = { observations: [], rawByMetric: {}, warnings: [] };
  for (let i = 0; i < requests.length; i += 1) {
    const { tsid, metric } = requests[i]!;
    const url = `${base}/timeseries?name=${encodeURIComponent(tsid)}&begin=${begin.toISOString()}&end=${end.toISOString()}`;
    const res = await doFetch(url, {
      headers: { 'User-Agent': opts.userAgent, Accept: 'application/json' },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
    });
    if (!res.ok) throw new Error(`USACE request failed: HTTP ${res.status} for ${tsid}`);
    const text = await res.text();
    let payload: UsaceSeriesJson | null = null;
    if (text.trim().length > 0) {
      try {
        payload = JSON.parse(text) as UsaceSeriesJson;
      } catch {
        payload = null; // malformed body → treated like "no such series"
      }
    }
    const { observation, point, seriesKey, warning } = parseUsaceSeries(payload, { tsid, metric });
    if (observation && point) {
      out.observations.push(observation);
      out.rawByMetric[metric] = { key: seriesKey, unit: payload?.unit, value: point };
    }
    if (warning) out.warnings.push(warning);
    if (i + 1 < requests.length) await new Promise((r) => setTimeout(r, opts.spacingMs ?? 1000));
  }
  return out;
}
