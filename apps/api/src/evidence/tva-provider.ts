import { WaterObservationSchema } from '@trout/contracts';
import type { WaterObservation } from '@trout/contracts';
import type { ReleaseBlock, ReleaseForecastRow } from '@trout/contracts';

/**
 * TVA lake-info REST API parser (data-sources lane).
 *
 * GET https://www.tva.com/RestApi/observed-data/{LocationID} returns hourly rows:
 *   { Day: "09/04/2026", Time: "2 PM EDT", ReservoirElevation: "1,012.93",
 *     TailwaterElevation: "827.69", AverageHourlyDischarge: "8,400" }
 *
 * Mapping: ReservoirElevation → reservoir-level-ft; TailwaterElevation → stage-ft;
 * AverageHourlyDischarge → discharge-cfs. TVA supplies NO water temperature and
 * NO provisional qualifiers — so evidence carries none (never invented here).
 * Numbers are operational estimates published by TVA; the source registry notes that.
 */

const TVA_API_BASE = 'https://www.tva.com/RestApi';

/** Per-row evidence URL points at the dam's public page (the API is undocumented). */
export function tvaSourceUrl(_locationId: string): string {
  return 'https://www.tva.com/environment/lake-levels';
}

/** TVA timestamps carry their own DST abbreviation; map it to a fixed offset. */
const TZ_OFFSET: Record<string, string> = {
  EST: '-05:00',
  EDT: '-04:00',
  CST: '-06:00',
  CDT: '-05:00',
};

/**
 * Parse "09/04/2026" + "2 PM EDT" → "2026-09-04T14:00:00-04:00" (contracts accept
 * the explicit offset, which preserves exactly what TVA published). Returns null
 * for anything unparseable — that row is then skipped, not zeroed.
 */
export function parseTvaTimestamp(day: string, time: string): string | null {
  const dm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(day.trim());
  if (!dm?.[1] || !dm[2] || !dm[3]) return null;
  const tm = /^(\d{1,2})\s*(AM|PM)\s+(EST|EDT|CST|CDT)$/i.exec(time.trim());
  if (!tm?.[1] || !tm[2] || !tm[3]) return null;
  let hour = Number(tm[1]);
  const ampm = tm[2].toUpperCase();
  if (hour < 1 || hour > 12) return null;
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  const offset = TZ_OFFSET[tm[3].toUpperCase()];
  if (!offset) return null;
  const month = dm[1].padStart(2, '0');
  const dayPart = dm[2].padStart(2, '0');
  return `${dm[3]}-${month}-${dayPart}T${String(hour).padStart(2, '0')}:00:00${offset}`;
}

/**
 * Parse TVA's published numbers: "1,012.93" → 1012.93, "8,400" → 8400.
 * Blank/dash/garbage → undefined (missing stays missing; zero is kept when real).
 */
export function parseTvaNumber(raw: string | number | undefined): number | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned.length === 0 || cleaned === '-' || cleaned === '--') return undefined;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return undefined;
  // TVA uses 0 for "no data today" on discharge in some rows — a release of 0 cfs
  // IS meaningful (no generation), so 0 is kept for discharge; for elevations a
  // literal 0 is physically impossible and treated as no data.
  return n;
}

function metricFor(field: keyof TvaRow): WaterObservation['metric'] | undefined {
  if (field === 'ReservoirElevation') return 'reservoir-level-ft';
  if (field === 'TailwaterElevation') return 'stage-ft';
  if (field === 'AverageHourlyDischarge') return 'discharge-cfs';
  return undefined;
}

export interface TvaRow {
  Day?: string;
  Time?: string;
  ReservoirElevation?: string | number;
  TailwaterElevation?: string | number;
  AverageHourlyDischarge?: string | number;
}

/**
 * Pure parser: TVA observed-data rows → observations for one location.
 * The newest row per metric wins (rows arrive in ascending time). Zero discharge
 * is preserved (a real "no generation" reading); physically-impossible zero
 * elevations are dropped as no-data.
 */
export function parseTvaObservations(
  rows: TvaRow[],
  opts: { locationId: string; sourceUrl?: string } = { locationId: 'UNKNOWN' },
): WaterObservation[] {
  const sourceUrl = opts.sourceUrl ?? tvaSourceUrl(opts.locationId);
  const byMetric = new Map<WaterObservation['metric'], WaterObservation>();
  for (const row of rows) {
    const day = row.Day ?? '';
    const time = row.Time ?? '';
    const observedAt = parseTvaTimestamp(day, time);
    if (observedAt === null) continue;
    for (const field of ['ReservoirElevation', 'TailwaterElevation', 'AverageHourlyDischarge'] as const) {
      const metric = metricFor(field);
      if (!metric) continue;
      const raw = row[field];
      const value = parseTvaNumber(raw);
      if (value === undefined) continue;
      if (metric !== 'discharge-cfs' && value === 0) continue;
      const parsed = WaterObservationSchema.safeParse({
        sourceId: 'tva-restapi',
        sourceUrl,
        observedAt,
        metric,
        value,
      });
      if (!parsed.success) continue;
      const prev = byMetric.get(metric);
      // F34 residue (Wave-1 handoff): newest-wins by PARSED INSTANT, never
      // text — parseTvaTimestamp embeds EST/EDT/CST/CDT offsets, and across
      // the DST fall-back the same wall-clock hour exists twice (mixed
      // offsets), where text order ranks the OLDER instant as newer.
      if (
        !prev ||
        Date.parse(parsed.data.observedAt) > Date.parse(prev.observedAt)
      ) {
        byMetric.set(metric, parsed.data);
      }
    }
  }
  return [...byMetric.values()].sort(
    (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt) || a.metric.localeCompare(b.metric),
  );
}

export interface TvaFetchOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * Fetch the RAW observed-data rows for one TVA location (same endpoint, headers
 * and error discipline as fetchTvaObservations, split out so the conditions
 * bridge can keep the source row verbatim in its audit column). Requires a
 * browser-like User-Agent — tva.com sits behind Cloudflare and answers plain
 * programmatic agents with 403. Throws on HTTP failure.
 */
export async function fetchTvaRows(locationId: string, opts: TvaFetchOptions): Promise<TvaRow[]> {
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? TVA_API_BASE;
  const url = `${base}/observed-data/${encodeURIComponent(locationId)}`;
  const res = await doFetch(url, {
    headers: {
      // Realistic browser headers; without them Cloudflare returns 403 (verified 2026-09-04).
      'User-Agent': opts.userAgent,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
  });
  if (!res.ok) throw new Error(`TVA request failed: HTTP ${res.status} for ${locationId}`);
  const payload = (await res.json()) as unknown;
  if (!Array.isArray(payload)) throw new Error(`TVA response for ${locationId} is not an array`);
  return payload as TvaRow[];
}

/**
 * Fetch observed data for one TVA location. Requires a browser-like User-Agent —
 * tva.com sits behind Cloudflare and answers plain programmatic agents with 403.
 * Throws on HTTP failure (caller converts to per-water error entries).
 */
export async function fetchTvaObservations(locationId: string, opts: TvaFetchOptions): Promise<WaterObservation[]> {
  return parseTvaObservations(await fetchTvaRows(locationId, opts), { locationId });
}

export interface TvaReleaseRow {
  Day?: string;
  Time?: string;
  Generators?: string | number;
}

/** Parse a TVA release row's "1 AM - 5 AM EDT" time without changing its precision. */
export function parseTvaReleaseBlock(row: TvaReleaseRow): ReleaseBlock | null {
  const day = row.Day?.trim() ?? '';
  const time = row.Time?.trim() ?? '';
  const match = /^(.*?)\s*-\s*(.*?)\s+(EST|EDT|CST|CDT)$/i.exec(time);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  const timeZone = match[3].toUpperCase() as ReleaseBlock['timeZone'];
  const startTime = match[1].trim();
  const endTime = match[2].trim();
  // Reuse the observed timestamp parser as the validation for each endpoint's
  // 12-hour clock, then retain TVA's own human time labels in the contract.
  if (!parseTvaTimestamp(day, `${startTime} ${timeZone}`) || !parseTvaTimestamp(day, `${endTime} ${timeZone}`)) return null;
  const date = parseTvaTimestamp(day, `12 PM ${timeZone}`)?.slice(0, 10);
  if (!date || row.Generators === undefined) return null;
  const generators = String(row.Generators).trim();
  if (!generators) return null;
  return { date, startTime, endTime, timeZone, generators };
}

/** Pure parser for TVA generation-releases/{LocationID}; [] is a valid empty state. */
export function parseTvaGenerationReleases(payload: unknown): ReleaseBlock[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((row) => (row && typeof row === 'object' ? parseTvaReleaseBlock(row as TvaReleaseRow) : null))
    .filter((row): row is ReleaseBlock => row !== null);
}

export interface TvaPredictedRow {
  Day?: string;
  AverageInflow?: string | number;
  MidnightElevation?: string | number;
  AverageOutflow?: string | number;
}

/**
 * The release-forecast contract promises nonnegative values. TVA legitimately
 * publishes negative AverageInflow during reservoir drawdowns; rather than
 * publishing the negative (contract-breaking) or clamping to 0 (a fabricated
 * reading), the field is omitted — missing stays missing.
 */
function nonnegativeForecastValue(raw: string | number | undefined): number | undefined {
  const n = parseTvaNumber(raw);
  return n !== undefined && n >= 0 ? n : undefined;
}

/** Pure parser for TVA predicted-data/{LocationID}; missing fields stay missing. */
export function parseTvaPredictedData(payload: unknown): ReleaseForecastRow[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const row = raw as TvaPredictedRow;
    const dateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(row.Day?.trim() ?? '');
    if (!dateMatch?.[1] || !dateMatch[2] || !dateMatch[3]) return [];
    const date = `${dateMatch[3]}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
    const candidate = {
      date,
      ...(nonnegativeForecastValue(row.AverageInflow) !== undefined ? { averageInflowCfs: nonnegativeForecastValue(row.AverageInflow) } : {}),
      ...(nonnegativeForecastValue(row.MidnightElevation) !== undefined ? { midnightElevationFt: nonnegativeForecastValue(row.MidnightElevation) } : {}),
      ...(nonnegativeForecastValue(row.AverageOutflow) !== undefined ? { averageOutflowCfs: nonnegativeForecastValue(row.AverageOutflow) } : {}),
    };
    return Object.keys(candidate).length > 1 ? [candidate] : [];
  });
}

export type TvaScheduleFetchOptions = TvaFetchOptions;

async function fetchTvaJson<T>(path: string, opts: TvaScheduleFetchOptions): Promise<T> {
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? TVA_API_BASE;
  const res = await doFetch(`${base}/${path}`, {
    headers: { 'User-Agent': opts.userAgent, Accept: 'application/json' },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
  });
  if (!res.ok) throw new Error(`TVA request failed: HTTP ${res.status} for ${path}`);
  return (await res.json()) as T;
}

export async function fetchTvaGenerationReleases(locationId: string, opts: TvaScheduleFetchOptions): Promise<ReleaseBlock[]> {
  const payload = await fetchTvaJson<unknown>(`generation-releases/${encodeURIComponent(locationId)}`, opts);
  return parseTvaGenerationReleases(payload);
}

export async function fetchTvaPredictedData(locationId: string, opts: TvaScheduleFetchOptions): Promise<ReleaseForecastRow[]> {
  const payload = await fetchTvaJson<unknown>(`predicted-data/${encodeURIComponent(locationId)}`, opts);
  return parseTvaPredictedData(payload);
}
