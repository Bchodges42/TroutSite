import { READING_STALE_MINUTES, WaterObservationSchema } from '@trout/contracts';
import type { WaterObservation } from '@trout/contracts';
import { USACE_TAILWATER_SERIES, type UsaceStationResult } from './usace-provider.js';

export const CWMS_BASE = 'https://cwms-data.usace.army.mil/cwms-data/';
type Metric = 'discharge-cfs' | 'temperature-c';
interface Page {
  name?: unknown;
  'office-id'?: unknown;
  units?: unknown;
  values?: unknown;
  'next-page'?: unknown;
  'value-columns'?: { name?: string; ordinal?: number }[];
}
export interface CwmsOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  spacingMs?: number;
  windowHours?: number;
  now?: Date;
  maxPages?: number;
}

/** CWMS uses the HEC quality bit field: missing=4, questionable=8, rejected=16.
 * Keep the original code (including 0=unscreened); never call it approved.
 * https://www.hec.usace.army.mil/confluence/dssdocs/dssjavaprogrammer/time-series-data/quality-flags
 */
export function usableCwmsQuality(code: unknown): code is number {
  return typeof code === 'number' && Number.isInteger(code) &&
    code >= -2147483648 && code <= 4294967295 && (code & 28) === 0;
}

export function cwmsSeriesUrl(name: string, unit: 'cfs' | 'C', begin: Date, end: Date): URL {
  const url = new URL('timeseries', CWMS_BASE);
  url.search = new URLSearchParams({ office: 'LRN', name, unit,
    begin: begin.toISOString(), end: end.toISOString(), 'page-size': '1000' }).toString();
  return url;
}

/** Parse a complete, identity-checked series. Future/stale/null/bad-quality values
 * stay unavailable; a genuine zero discharge remains zero. */
export function parseCwmsValues(
  values: unknown[],
  opts: { name: string; metric: Metric; sourceUrl: string; now: Date },
): { observation: WaterObservation | null; point?: [number, number, number] } {
  const nowMs = opts.now.getTime();
  const points = values.filter((row): row is [number, number, number] =>
    Array.isArray(row) && row.length >= 3 &&
    typeof row[0] === 'number' && Number.isFinite(row[0]) &&
    typeof row[1] === 'number' && Number.isFinite(row[1]) &&
    usableCwmsQuality(row[2]) &&
    row[0] <= nowMs && nowMs - row[0] <= READING_STALE_MINUTES * 60_000 &&
    (opts.metric !== 'discharge-cfs' || row[1] >= 0),
  );
  const point = points.reduce<[number, number, number] | undefined>(
    (best, row) => !best || row[0] > best[0] ? row : best, undefined,
  );
  if (!point) return { observation: null };
  const parsed = WaterObservationSchema.safeParse({
    sourceId: 'usace-cwms', sourceUrl: opts.sourceUrl,
    observedAt: new Date(point[0]).toISOString(), metric: opts.metric,
    value: point[1], qualifier: String(point[2]),
  });
  return parsed.success ? { observation: parsed.data, point } : { observation: null };
}

/** Each metric is atomic across pages. A failed page withholds that metric;
 * healthy metrics from other series can still publish with a degraded job. */
export async function fetchCwmsObservations(
  station: string, opts: CwmsOptions,
): Promise<UsaceStationResult & { errors: number }> {
  const registry = USACE_TAILWATER_SERIES[station];
  if (!registry) throw new Error(`USACE station ${station} is not in the audited registry`);
  const now = opts.now ?? new Date();
  const begin = new Date(now.getTime() - (opts.windowHours ?? 48) * 3_600_000);
  const requests: { name: string; unit: 'cfs' | 'C'; metric: Metric }[] = [
    { name: registry.flow, unit: 'cfs', metric: 'discharge-cfs' },
    ...(registry.temp ? [{ name: registry.temp, unit: 'C' as const, metric: 'temperature-c' as const }] : []),
  ];
  const out: UsaceStationResult & { errors: number } = {
    observations: [], rawByMetric: {}, warnings: [], errors: 0,
  };
  for (const [index, request] of requests.entries()) {
    try {
      const sourceUrl = cwmsSeriesUrl(request.name, request.unit, begin, now);
      const values: unknown[] = [];
      const seen = new Set<string>();
      let cursor: string | undefined;
      let complete = false;
      for (let page = 0; page < (opts.maxPages ?? 20); page++) {
        const url = new URL(sourceUrl);
        if (cursor) url.searchParams.set('page', cursor);
        const response = await (opts.fetchImpl ?? fetch)(url.toString(), {
          headers: { Accept: 'application/json;version=2', 'User-Agent': opts.userAgent },
          signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json() as Page;
        if (body.name !== request.name || body['office-id'] !== 'LRN') {
          throw new Error('series or office does not match the audited request');
        }
        if (body.units !== request.unit) throw new Error(`unexpected units: ${String(body.units)}`);
        if (body['value-columns'] && ['date-time', 'value', 'quality-code'].some((name, index) =>
          body['value-columns']?.[index]?.name !== name || body['value-columns']?.[index]?.ordinal !== index + 1)) {
          throw new Error('unexpected value column order');
        }
        if (!Array.isArray(body.values)) throw new Error('missing values array');
        values.push(...body.values);
        const next = body['next-page'];
        if (next === null || next === undefined || next === '') { complete = true; break; }
        if (typeof next !== 'string' || seen.has(next)) throw new Error('invalid or repeated page cursor');
        seen.add(next);
        cursor = next;
      }
      if (!complete) throw new Error('pagination exceeded the page limit');
      const parsed = parseCwmsValues(values, { name: request.name, metric: request.metric,
        sourceUrl: sourceUrl.toString(), now });
      if (!parsed.observation) throw new Error('no fresh usable observations (missing, stale, future or quality flagged)');
      out.observations.push(parsed.observation);
      out.rawByMetric[request.metric] = {
        sourceId: 'usace-cwms', sourceUrl: sourceUrl.toString(), key: request.name,
        office: 'LRN', units: request.unit, value: parsed.point,
      };
    } catch (error) {
      out.errors++;
      out.warnings.push(`CWMS ${station} ${request.metric}: ${(error as Error).message}`);
    }
    if (index + 1 < requests.length && (opts.spacingMs ?? 1000) > 0) {
      await new Promise((resolve) => setTimeout(resolve, opts.spacingMs ?? 1000));
    }
  }
  return out;
}
