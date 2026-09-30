import { GaugeReadingSchema, READING_STALE_MINUTES } from '@trout/contracts';
import type { GaugeReading } from '@trout/contracts';
import { fetchWithRetry } from '../lib/retry.js';

/** Modern USGS Water Data OGC API (WaterServices replacement). */
export const USGS_WATERDATA_BASE = 'https://api.waterdata.usgs.gov/ogcapi/v0';
export const WATERDATA_PARAMETER_CODES = ['00060', '00065', '00010', '00300', '00045'] as const;

interface WaterDataProperties {
  monitoring_location_id?: string;
  parameter_code?: string;
  time?: string;
  value?: string | number | null;
  /** Live OGC payloads ship this as a string OR an array of strings (["P"]) —
   *  never assume the string shape (2026-09-14 ingest crash). */
  qualifier?: string | string[] | null;
  approval_status?: string | null;
}

interface WaterDataFeature {
  properties?: WaterDataProperties;
}

export interface WaterDataFeatureCollection {
  type?: string;
  features?: WaterDataFeature[];
}

const INVALID_QUALIFIERS = new Set(['ice', 'eqp', 'ssn', 'bkw', 'flt']);
const METRIC_BY_PARAMETER: Record<string, 'cfs' | 'heightFt' | 'tempC' | 'dissolvedOxygenMgL' | 'precipitationMm' | undefined> = {
  '00060': 'cfs',
  '00065': 'heightFt',
  '00010': 'tempC',
  '00300': 'dissolvedOxygenMgL',
  '00045': 'precipitationMm',
};

/** First string qualifier verbatim (legacy NWIS convention; live payloads may
 *  ship ["P"] arrays — audit-b/usgs-provider "arrays like [\"P\"] → \"P\""). */
function normalizeQualifier(qualifier: string | string[] | null | undefined): string | null {
  if (typeof qualifier === 'string') return qualifier;
  if (Array.isArray(qualifier)) return qualifier.find((q): q is string => typeof q === 'string') ?? null;
  return null;
}

function parseValue(value: string | number | null | undefined, qualifier: string | string[] | null | undefined, parameter: string): number | undefined {
  if (value === null || value === undefined) return undefined;
  const q = normalizeQualifier(qualifier);
  if (q && INVALID_QUALIFIERS.has(q.trim().toLowerCase())) return undefined;
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(n) || n <= -999_000) return undefined;
  if (parameter === '00060' && n <= 0) return undefined;
  return parameter === '00045' ? n * 25.4 : n;
}

function normalizeSite(id: string): string | null {
  const match = /^USGS-(\d+)$/.exec(id);
  return match?.[1] ?? null;
}

/**
 * Parse one recorded or live OGC FeatureCollection into merged gauge rows.
 *
 * Each parameter keeps its OWN observation time (F01, 2026-09-29 audit): the
 * reading's `timestamp` is the newest surviving metric's time, and any metric
 * observed at a different instant is recorded in `metricTimes`. T1-6 parity
 * with the legacy parser: a parameter older than the shared freshness window
 * (READING_STALE_MINUTES — the same 3 h the scorer's staleness contract uses)
 * relative to the site's newest observation is dropped instead of merged — a
 * stopped temperature sensor must not ride along under a fresh flow stamp,
 * and the flow sensor must not renew the temperature's freshness.
 */
export function parseWaterDataResponse(payload: unknown): GaugeReading[] {
  const features = (payload as WaterDataFeatureCollection | null)?.features ?? [];
  const bySite = new Map<string, { cfs?: { value: number; timestamp: string }; heightFt?: { value: number; timestamp: string }; tempC?: { value: number; timestamp: string }; dissolvedOxygenMgL?: { value: number; timestamp: string }; precipitationMm?: { value: number; timestamp: string } }>();
  for (const feature of features) {
    const p = feature?.properties;
    if (!p || typeof p.monitoring_location_id !== 'string' || typeof p.parameter_code !== 'string' || typeof p.time !== 'string') continue;
    const gaugeId = normalizeSite(p.monitoring_location_id);
    const field = METRIC_BY_PARAMETER[p.parameter_code];
    const timeMs = Date.parse(p.time);
    if (!gaugeId || !field || !Number.isFinite(timeMs)) continue;
    const timestamp = new Date(timeMs).toISOString();
    const value = parseValue(p.value, p.qualifier, p.parameter_code);
    if (value === undefined) continue;
    const current = bySite.get(gaugeId) ?? {};
    const previous = current[field];
    if (!previous || Date.parse(timestamp) >= Date.parse(previous.timestamp)) current[field] = { value, timestamp };
    bySite.set(gaugeId, current);
  }
  return [...bySite.entries()].flatMap(([gaugeId, fields]) => {
    const entries = Object.entries(fields) as [keyof typeof fields, { value: number; timestamp: string }][];
    const times = entries.map(([, m]) => Date.parse(m.timestamp)).filter((ms) => !Number.isNaN(ms));
    if (times.length === 0) return [];
    // T1-6: drop metrics older than the freshness window relative to the site's
    // newest observation — absolute age is enforced downstream against the
    // per-metric times (latestReadings, scoreFishability), never against
    // another metric's stamp.
    const newest = Math.max(...times);
    const metricTimes: NonNullable<GaugeReading['metricTimes']> = {};
    const merged: { cfs?: number; heightFt?: number; tempC?: number; dissolvedOxygenMgL?: number; precipitationMm?: number } = {};
    let timestamp: string | undefined;
    for (const [field, metric] of entries) {
      if (newest - Date.parse(metric.timestamp) > READING_STALE_MINUTES * 60_000) continue;
      merged[field] = metric.value;
      if (timestamp === undefined || Date.parse(metric.timestamp) > Date.parse(timestamp)) timestamp = metric.timestamp;
    }
    if (timestamp === undefined) return [];
    for (const [field, metric] of entries) {
      if (merged[field] === undefined) continue;
      if (Date.parse(metric.timestamp) === Date.parse(timestamp)) continue;
      metricTimes[field] = metric.timestamp;
    }
    const parsed = GaugeReadingSchema.safeParse({
      gaugeId,
      ...merged,
      timestamp,
      ...(Object.keys(metricTimes).length > 0 ? { metricTimes } : {}),
    });
    return parsed.success ? [parsed.data] : [];
  });
}

export interface WaterDataFetchOptions {
  userAgent: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface WaterDataFetchResult {
  readings: GaugeReading[];
  warnings: string[];
}

/** Fetch latest-continuous observations for a batch of USGS sites. */
export async function fetchWaterDataReadings(siteIds: string[], opts: WaterDataFetchOptions): Promise<WaterDataFetchResult> {
  const numeric = [...new Set(siteIds.filter((id) => /^\d+$/.test(id)))];
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? USGS_WATERDATA_BASE;
  const warnings = opts.apiKey ? [] : ['USGS Water Data API key is not configured; using the keyless development quota'];
  if (numeric.length === 0) return { readings: [], warnings };
  const readings: GaugeReading[] = [];
  for (let i = 0; i < numeric.length; i += 50) {
    const batch = numeric.slice(i, i + 50);
    const params = new URLSearchParams({
      f: 'json',
      monitoring_location_id: batch.map((id) => `USGS-${id}`).join(','),
      parameter_code: WATERDATA_PARAMETER_CODES.join(','),
      limit: '500',
    });
    if (opts.apiKey) params.set('api_key', opts.apiKey);
    const url = `${base.replace(/\/$/, '')}/collections/latest-continuous/items?${params.toString()}`;
    const res = await fetchWithRetry(
      () => doFetch(url, { headers: { 'User-Agent': opts.userAgent, Accept: 'application/geo+json, application/json' }, signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000) }),
      { baseDelayMs: 1000 },
    );
    if (!res.ok) throw new Error(`USGS Water Data request failed: HTTP ${res.status} for sites ${batch.join(',')}`);
    const parsed = parseWaterDataResponse(await res.json());
    readings.push(...parsed);
    if (i + 50 < numeric.length) await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return { readings, warnings };
}
