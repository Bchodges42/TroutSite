import { WaterObservationSchema } from '@trout/contracts';
import type { WaterObservation } from '@trout/contracts';
import { GaugeReadingSchema } from '@trout/contracts';

/**
 * USGS NWIS instant-values parser for the evidence layer (data-sources lane).
 *
 * Difference from ingest/usgs.ts: that parser merges a site's parameters into one
 * GaugeReading for scoring. Evidence needs PER-METRIC observations that preserve
 * each series' own timestamp and qualifier, so this parser emits one observation
 * per (site, parameter) from the newest usable point of each series.
 *
 * Discipline (brief rules):
 *   - zero is a value: 0 cfs is a real reading and is kept;
 *   - missing/sentinel values are absent — never substituted with zero;
 *   - per-point qualifiers (e.g. "P" provisional) pass through verbatim;
 *   - observedAt is the USGS dateTime, never the fetch time.
 */

const USGS_IV_URL = 'https://waterservices.usgs.gov/nwis/iv/';
const PARAM_CODES = ['00060', '00065', '00010', '00300', '00045'] as const;

export const USGS_METRIC_BY_PARAM: Record<string, WaterObservation['metric']> = {
  '00060': 'discharge-cfs',
  '00065': 'stage-ft',
  '00010': 'temperature-c',
  '00300': 'dissolved-oxygen-mg-l',
  '00045': 'precipitation-mm',
};

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

export interface UsgsResponseJson {
  value?: { timeSeries?: UsgsSeriesJson[] };
}

/** USGS missing-data sentinels (−999999 and friends) mean "no measurement". */
export function parseMetricValue(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  if (n <= -999_000) return undefined;
  return n;
}

/**
 * Normalize any USGS dateTime into the contracts' ISO-8601 shape.
 * USGS usually emits "...-05:00" local-offset timestamps; contracts accept offsets.
 */
function normalizeTimestamp(usgs: string): string | null {
  if (GaugeReadingSchema.shape.timestamp.safeParse(usgs).success) return usgs;
  const d = new Date(usgs);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Newest usable point of a series by its own dateTime (ties → last occurrence). */
function newestValue(series: UsgsSeriesJson): UsgsValueJson | undefined {
  const values = series.values?.[0]?.value ?? [];
  const usable = values.filter((v) => typeof v?.value === 'string' && typeof v?.dateTime === 'string');
  if (usable.length === 0) return undefined;
  return usable.reduce((newest, v) => (v.dateTime >= newest.dateTime ? v : newest));
}

/**
 * Pure parser: instant-values JSON → per-(site, metric) observations.
 * Tolerates missing parameters/series, empty value arrays, sentinel values and
 * unparseable timestamps (those series contribute nothing — missing stays missing).
 * A site whose every series is unusable produces NO observations, not zeros.
 */
export function parseUsgsObservations(
  payload: unknown,
  opts: { sourceUrl?: string } = {},
): WaterObservation[] {
  const series = (payload as UsgsResponseJson)?.value?.timeSeries ?? [];
  const out: WaterObservation[] = [];
  for (const s of series) {
    const site = s.sourceInfo?.siteCode?.[0]?.value;
    const code = (s.variable?.variableCode ?? []).find((vc) => typeof vc.value === 'string')?.value;
    if (!site || !code) continue;
    const metric = USGS_METRIC_BY_PARAM[code];
    if (!metric) continue;
    const latest = newestValue(s);
    if (!latest) continue;
    const observedAt = normalizeTimestamp(latest.dateTime);
    if (observedAt === null) continue;
    const rawValue = parseMetricValue(latest.value);
    const value = rawValue === undefined ? undefined : code === '00045' ? rawValue * 25.4 : rawValue;
    if (value === undefined) continue;
    // First source qualifier verbatim (USGS arrays like ["P"] → "P").
    const qualifier = latest.qualifiers?.find((q) => typeof q === 'string' && q.length > 0);
    const parsed = WaterObservationSchema.safeParse({
      sourceId: 'usgs-nwis-iv',
      sourceUrl: opts.sourceUrl ?? `https://waterdata.usgs.gov/monitoring-location/${site}/`,
      observedAt,
      metric,
      value,
      ...(qualifier ? { qualifier } : {}),
    });
    if (parsed.success) out.push(parsed.data);
  }
  // Observations for the same metric of the same site: keep the newest observedAt.
  const byKey = new Map<string, WaterObservation>();
  for (const o of out) {
    const key = `${o.sourceUrl}|${o.metric}`;
    const prev = byKey.get(key);
    if (!prev || o.observedAt > prev.observedAt) byKey.set(key, o);
  }
  return [...byKey.values()].sort(
    (a, b) => a.observedAt.localeCompare(b.observedAt) || a.metric.localeCompare(b.metric),
  );
}

export interface UsgsFetchOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * Fetch instant values for a batch of sites and parse them into observations.
 * Throws on HTTP failure so the caller can turn it into a per-water error entry
 * (a transport failure is an error, not an empty observation set).
 */
export async function fetchUsgsObservations(siteIds: string[], opts: UsgsFetchOptions): Promise<WaterObservation[]> {
  // Non-numeric ids (tva:/usace:-prefixed) belong to the conditions bridge and
  // must never reach NWIS — filter them out here so every caller is safe.
  const numeric = siteIds.filter((id) => /^\d+$/.test(id));
  if (numeric.length === 0) return [];
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? USGS_IV_URL;
  const out: WaterObservation[] = [];
  for (let i = 0; i < numeric.length; i += 50) {
    const batch = numeric.slice(i, i + 50);
    const url = `${base}?format=json&sites=${batch.join(',')}&parameterCd=${PARAM_CODES.join(',')}`;
    const res = await doFetch(url, {
      headers: { 'User-Agent': opts.userAgent, Accept: 'application/json' },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
    });
    if (!res.ok) throw new Error(`USGS request failed: HTTP ${res.status} for sites ${batch.join(',')}`);
    out.push(...parseUsgsObservations(await res.json()));
    if (i + 50 < numeric.length) await new Promise((r) => setTimeout(r, 1000));
  }
  return out;
}
