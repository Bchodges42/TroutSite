import { startJob, type JobDetail } from '../jobs/run.js';
import type { Db } from '../db.js';

/**
 * F8 — NWS barometric pressure provider (data-sources lane, contract v2).
 *
 * Source: api.weather.gov station observations (public domain, no key). NWS's
 * API policy requires a declared User-Agent identifying the client; the job
 * passes the same operator User-Agent the other providers use.
 *
 * AREA-LEVEL DISCIPLINE (privacy spec + honesty): pressure is a REGION signal,
 * never a per-water one. Each catalog region maps to one representative ASOS
 * station (below); consumers must label it "area pressure". The browser never
 * calls NWS — this runs server-side only, and nothing region-level enters the
 * per-water WaterEvidence payloads.
 *
 * observedAt-vs-retrievedAt discipline: observedAt is the observation's own
 * `properties.timestamp` from NWS, never the fetch time; retrievedAt is when
 * WE fetched. A station whose latest observation is older than
 * PRESSURE_STALE_MINUTES yields no row (stale stays absent, T1-6 discipline).
 *
 * 3-hour trend: derived (confidence 'derived' downstream) as latest minus the
 * observation closest to 3 hours before it, searched inside a 2–4 h window;
 * |delta| <= PRESSURE_TREND_STABLE_HPA is 'stable'. Outside that window the
 * trend is null (not guessed).
 */

export const NWS_OBSERVATIONS_URL = 'https://api.weather.gov/stations';

/**
 * Region → representative NWS station (ICAO). Catalog regions (packages/content
 * streams YAML regionId values, 2026-09 capture). One station may serve several
 * adjacent regions — pressure varies slowly over tens of km, and honesty about
 * granularity beats false precision.
 */
export const NWS_PRESSURE_STATIONS: Record<string, { station: string; note: string }> = {
  'tn-west': { station: 'KNQA', note: 'Millington (Memphis area) ASOS' },
  'tn-middle-nashville': { station: 'KBNA', note: 'Nashville International ASOS' },
  'tn-middle-duck-elk': { station: 'KSYI', note: 'Shelbyville ASOS (Duck/Elk basin)' },
  'tn-middle-caney-fork': { station: 'KMOR', note: 'Tullahoma ASOS (Caney Fork headwaters edge)' },
  'tn-upper-cumberland': { station: 'KCSV', note: 'Crossville ASOS (Upper Cumberland)' },
  'tn-cumberland-plateau': { station: 'KCSV', note: 'Crossville ASOS (plateau)' },
  'tn-northeast-watauga': { station: 'KTRI', note: 'Tri-Cities ASOS (Watauga NE)' },
  'tn-east-holston': { station: 'KTRI', note: 'Tri-Cities ASOS (Holston)' },
  'tn-east-clinch': { station: 'KTYS', note: 'Knoxville ASOS (Clinch valley edge)' },
  'tn-east-smokies': { station: 'KGKT', note: 'Gatlinburg–Pigeon Forge ASOS (Smokies)' },
  'tn-east-pigeon-frenchbroad': { station: 'KMRN', note: 'Morristown ASOS (Pigeon/French Broad)' },
  'tn-se-hiwassee': { station: 'KCHA', note: 'Chattanooga ASOS (Hiwassee SE edge)' },
};

/** An observation older than this yields no row (stale stays absent). */
export const PRESSURE_STALE_MINUTES = 180;
/** Trend baseline is searched in [2 h, 4 h] before the latest observation. */
export const PRESSURE_TREND_WINDOW_MINUTES = 120;
export const PRESSURE_TREND_BASELINE_TARGET_MINUTES = 180;
/** |Δ| at or below this is 'stable' (hPa per ~3 h); beyond → rising/falling. */
export const PRESSURE_TREND_STABLE_HPA = 1.0;

export interface NwsPressurePoint {
  /** The observation's own timestamp from NWS (never the fetch time). */
  observedAt: string;
  /** barometricPressure converted Pa → hPa, rounded to 0.1. */
  hPa: number;
}

interface NwsObservationPropertiesJson {
  timestamp?: string;
  barometricPressure?: { value?: number | null; unitCode?: string };
  seaLevelPressure?: { value?: number | null; unitCode?: string };
  precipitationLast3Hours?: number | null;
}

interface NwsObservationsJson {
  features?: Array<{ properties?: NwsObservationPropertiesJson }>;
}

/** Plausibility bounds for sea-level barometric pressure (hPa). */
function plausibleHPa(v: number): boolean {
  return v >= 850 && v <= 1100;
}

/**
 * Pure parser: api.weather.gov /stations/{id}/observations payload → usable
 * pressure points, oldest-first, deduped by timestamp. Pa → hPa (÷ 100).
 * PREFERS seaLevelPressure (the standard quantity for area-level comparison —
 * station-elevation-independent; the live probe caught stations publishing
 * barometricPressure as null) and falls back to barometricPressure. Null
 * pressures, missing timestamps, implausible values, and non-Pa unit codes are
 * skipped (missing stays missing — never substituted).
 */
export function parseNwsPressure(payload: unknown): NwsPressurePoint[] {
  const features = (payload as NwsObservationsJson)?.features ?? [];
  const byTime = new Map<string, NwsPressurePoint>();
  for (const f of features) {
    const p = f?.properties;
    const ts = p?.timestamp;
    if (typeof ts !== 'string') continue;
    const slp = p?.seaLevelPressure;
    const baro = p?.barometricPressure;
    const source =
      slp && typeof slp.value === 'number' && Number.isFinite(slp.value)
        ? slp
        : baro && typeof baro.value === 'number' && Number.isFinite(baro.value)
          ? baro
          : undefined;
    if (!source) continue;
    // Live API emits 'wmoUnit:Pa'; older examples show 'unit:Pa' — accept both.
    if (source.unitCode && !/^(wmo)?unit:pa$/i.test(source.unitCode)) continue;
    const hPa = Math.round((source.value! / 100) * 10) / 10;
    if (!plausibleHPa(hPa)) continue;
    if (!Number.isNaN(Date.parse(ts))) byTime.set(ts, { observedAt: ts, hPa });
  }
  return [...byTime.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

export interface NwsPrecipitationPoint {
  observedAt: string;
  precipitationMm: number;
}

/** Parse NWS's measured rolling three-hour precipitation field (mm). */
export function parseNwsPrecipitation(payload: unknown): NwsPrecipitationPoint[] {
  const features = (payload as NwsObservationsJson)?.features ?? [];
  const byTime = new Map<string, NwsPrecipitationPoint>();
  for (const f of features) {
    const p = f?.properties;
    const ts = p?.timestamp;
    const value = p?.precipitationLast3Hours;
    if (typeof ts !== 'string' || typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue;
    if (!Number.isNaN(Date.parse(ts))) byTime.set(ts, { observedAt: ts, precipitationMm: value });
  }
  return [...byTime.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

export type PressureTrendDirection = 'rising' | 'falling' | 'stable';

export interface PressureTrend {
  latest: NwsPressurePoint;
  /** The ~3 h-earlier baseline the delta was computed against (null when the
   *  observation history does not reach back into the window). */
  baseline: NwsPressurePoint | null;
  /** latest.hPa − baseline.hPa (null without a baseline). */
  deltaHpa: number | null;
  direction: PressureTrendDirection;
}

/**
 * Derive the 3-hour pressure trend from an oldest-first point list. The latest
 * point must be fresher than PRESSURE_STALE_MINUTES at `nowMs`; the baseline is
 * the point closest to 3 h before the latest inside a 2–4 h window. Without a
 * usable baseline the trend is null and the direction falls back to 'stable'
 * (no evidence of movement is not evidence of movement).
 */
export function pressureTrend(points: NwsPressurePoint[], nowMs: number): PressureTrend | null {
  if (points.length === 0) return null;
  const latest = points[points.length - 1]!;
  const latestMs = Date.parse(latest.observedAt);
  if (Number.isNaN(latestMs)) return null;
  const ageMinutes = (nowMs - latestMs) / 60_000;
  if (ageMinutes > PRESSURE_STALE_MINUTES || ageMinutes < -PRESSURE_STALE_MINUTES) return null;

  const target = latestMs - PRESSURE_TREND_BASELINE_TARGET_MINUTES * 60_000;
  const window = PRESSURE_TREND_WINDOW_MINUTES * 60_000;
  let baseline: NwsPressurePoint | undefined;
  for (const p of points) {
    const ms = Date.parse(p.observedAt);
    if (Number.isNaN(ms)) continue;
    if (Math.abs(ms - target) <= window && ms < latestMs) {
      if (!baseline || Math.abs(ms - target) < Math.abs(Date.parse(baseline.observedAt) - target)) {
        baseline = p;
      }
    }
  }
  if (!baseline) return { latest, baseline: null, deltaHpa: null, direction: 'stable' };
  const deltaHpa = Math.round((latest.hPa - baseline.hPa) * 10) / 10;
  const direction: PressureTrendDirection =
    Math.abs(deltaHpa) <= PRESSURE_TREND_STABLE_HPA ? 'stable' : deltaHpa < 0 ? 'falling' : 'rising';
  return { latest, baseline, deltaHpa, direction };
}

export function nwsObservationsUrl(station: string, limit: number): string {
  return `${NWS_OBSERVATIONS_URL}/${encodeURIComponent(station)}/observations?limit=${limit}`;
}

export interface NwsFetchOptions {
  userAgent: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Observations requested per station (NWS max 45; 24 covers a day of hourly
   *  METARs even on stations streaming 5-minute feeds with null pressures). */
  limit?: number;
}

/** Fetch observations for one station. Throws on HTTP failure (soft-failed per region upstream). */
export async function fetchNwsPressure(station: string, opts: NwsFetchOptions): Promise<NwsPressurePoint[]> {
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(nwsObservationsUrl(station, opts.limit ?? 24), {
    headers: {
      // NWS API policy: a declared User-Agent identifying the client.
      'User-Agent': opts.userAgent,
      Accept: 'application/geo+json',
    },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
  });
  if (!res.ok) throw new Error(`NWS request failed: HTTP ${res.status} for station ${station}`);
  return parseNwsPressure(await res.json());
}

/** One NWS request supplies both pressure and the optional rain context. */
export async function fetchNwsContext(
  station: string,
  opts: NwsFetchOptions,
): Promise<{ pressure: NwsPressurePoint[]; precipitation: NwsPrecipitationPoint[] }> {
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(nwsObservationsUrl(station, opts.limit ?? 24), {
    headers: { 'User-Agent': opts.userAgent, Accept: 'application/geo+json' },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
  });
  if (!res.ok) throw new Error(`NWS request failed: HTTP ${res.status} for station ${station}`);
  const payload = await res.json();
  return { pressure: parseNwsPressure(payload), precipitation: parseNwsPrecipitation(payload) };
}

export interface PressureJobResult extends JobDetail {
  regions: number;
  stored: number;
  rainStored: number;
  errors: number;
  warnings: string[];
}

/**
 * Pressure job (F8): one NWS request per distinct station, region rows upserted
 * into region_pressure with observedAt (NWS) kept separate from retrievedAt
 * (fetch). Soft-fail per region: an upstream failure becomes a warning + error
 * count — the run only hard-fails on a crash.
 */
export async function runPressureJob(
  db: Db,
  opts: NwsFetchOptions & { now?: Date },
): Promise<PressureJobResult> {
  const now = opts.now ?? new Date();
  const nowMs = now.getTime();
  const handle = startJob(db, 'pressure');
  const warnings: string[] = [];
  let errors = 0;

  const byStation = new Map<string, string[]>();
  for (const [regionId, { station }] of Object.entries(NWS_PRESSURE_STATIONS)) {
    const list = byStation.get(station) ?? [];
    list.push(regionId);
    byStation.set(station, list);
  }

  const upsert = db.prepare(`
    INSERT INTO region_pressure (region_id, observed_at, retrieved_at, pressure_hpa, trend_hpa_3h, trend_direction, station)
    VALUES (@region_id, @observed_at, @retrieved_at, @pressure_hpa, @trend_hpa_3h, @trend_direction, @station)
    ON CONFLICT(region_id) DO UPDATE SET
      observed_at=@observed_at, retrieved_at=@retrieved_at, pressure_hpa=@pressure_hpa,
      trend_hpa_3h=@trend_hpa_3h, trend_direction=@trend_direction, station=@station
  `);
  const upsertRain = db.prepare(`
    INSERT INTO region_precipitation (region_id, observed_at, retrieved_at, precipitation_mm, station)
    VALUES (@region_id, @observed_at, @retrieved_at, @precipitation_mm, @station)
    ON CONFLICT(region_id) DO UPDATE SET
      observed_at=@observed_at, retrieved_at=@retrieved_at, precipitation_mm=@precipitation_mm, station=@station
  `);

  let stored = 0;
  let rainStored = 0;
  for (const [station, regions] of byStation) {
    let context: { pressure: NwsPressurePoint[]; precipitation: NwsPrecipitationPoint[] };
    try {
      context = await fetchNwsContext(station, opts);
    } catch (err) {
      errors += 1;
      warnings.push(`NWS ${station} (${regions.join(', ')}) failed: ${(err as Error).message}`);
      continue;
    }
    const latestRain = context.precipitation[context.precipitation.length - 1];
    if (latestRain && nowMs - Date.parse(latestRain.observedAt) <= PRESSURE_STALE_MINUTES * 60_000) {
      for (const regionId of regions) {
        upsertRain.run({
          region_id: regionId,
          observed_at: latestRain.observedAt,
          retrieved_at: now.toISOString(),
          precipitation_mm: latestRain.precipitationMm,
          station,
        });
        rainStored += 1;
      }
    }
    const points = context.pressure;
    const trend = pressureTrend(points, nowMs);
    if (!trend) {
      warnings.push(
        `NWS ${station}: no observation within ${PRESSURE_STALE_MINUTES} min — ${regions.join(', ')} not updated`,
      );
      continue;
    }
    for (const regionId of regions) {
      upsert.run({
        region_id: regionId,
        observed_at: trend.latest.observedAt,
        retrieved_at: now.toISOString(),
        pressure_hpa: trend.latest.hPa,
        trend_hpa_3h: trend.deltaHpa,
        trend_direction: trend.direction,
        station,
      });
      stored += 1;
    }
  }

  const result: PressureJobResult = {
    regions: Object.keys(NWS_PRESSURE_STATIONS).length,
    stored,
    rainStored,
    errors,
    warnings,
  };
  handle.ok(result);
  return result;
}
