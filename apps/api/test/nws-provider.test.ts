import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import {
  NWS_PRESSURE_STATIONS,
  PRESSURE_STALE_MINUTES,
  fetchNwsPressure,
  nwsObservationsUrl,
  parseNwsPressure,
  parseNwsPrecipitation,
  pressureTrend,
  runPressureJob,
  type NwsPressurePoint,
} from '../src/evidence/nws-provider.js';
import { makeEnv, readFixture, type TestEnv } from './helpers.js';

const NOW = new Date('2026-09-12T17:05:00Z');
const NOW_MS = NOW.getTime();

describe('parseNwsPressure', () => {
  it('keeps usable observations oldest-first, converts Pa → hPa, prefers SLP, skips the unusable', () => {
    const points = parseNwsPressure(JSON.parse(readFixture('NWS/observations-ktys.json')));
    // 15:00/16:00 show seaLevelPressure preference; null, missing, implausible,
    // and wrong-unit pressure sources are skipped.
    expect(points).toEqual([
      { observedAt: '2026-09-12T13:00:00+00:00', hPa: 1019 },
      { observedAt: '2026-09-12T14:00:00+00:00', hPa: 1017 },
      { observedAt: '2026-09-12T15:00:00+00:00', hPa: 1015.5 },
      { observedAt: '2026-09-12T16:00:00+00:00', hPa: 1015 },
      { observedAt: '2026-09-12T17:00:00+00:00', hPa: 1014.5 },
    ]);
  });

  it('returns nothing from garbage (missing stays missing, never zero)', () => {
    expect(parseNwsPressure({})).toEqual([]);
    expect(parseNwsPressure({ features: [{ properties: { timestamp: 'nope', barometricPressure: { value: 101300, unitCode: 'unit:Pa' } } }] })).toEqual([]);
    expect(parseNwsPressure(undefined)).toEqual([]);
  });

  it('parses the authentic quantitative-value precipitation object (F37): mm kept, documented in converted, null = no-data', () => {
    // F37 reproduction: the LIVE field is a quantitative-value object — the
    // official KBNA response shows precipitationLast3Hours=
    // {unitCode:'wmoUnit:mm', value:null, qualityControl:'Z'} — and the old
    // scalar-only parser returned [] for a measured 4.2 in exactly that shape.
    expect(parseNwsPrecipitation(JSON.parse(readFixture('NWS/observations-kbna.json')))).toEqual([
      // 0.1 in documented in wmoUnit:in → 2.54 mm → 2.5 (rounded to 0.1 mm)
      { observedAt: '2026-09-12T15:00:00+00:00', precipitationMm: 2.5 },
      { observedAt: '2026-09-12T16:00:00+00:00', precipitationMm: 4.2 },
    ]);
    // The 13:00/17:00 null-value windows stay absent (no-data is never zero-filled).
  });

  it('skips non-object, negative and undocumented-unit precipitation values (missing stays missing)', () => {
    expect(
      parseNwsPrecipitation({
        features: [
          { properties: { timestamp: '2026-09-12T14:00:00Z', precipitationLast3Hours: 4.2 } },
          { properties: { timestamp: '2026-09-12T15:00:00Z', precipitationLast3Hours: { unitCode: 'wmoUnit:mm', value: -1 } } },
          { properties: { timestamp: '2026-09-12T16:00:00Z', precipitationLast3Hours: { unitCode: 'wmoUnit:degC', value: 20 } } },
          { properties: { timestamp: '2026-09-12T17:00:00Z', precipitationLast3Hours: { value: 1 } } },
        ],
      }),
    ).toEqual([]);
  });
});

describe('pressureTrend', () => {
  const points = parseNwsPressure(JSON.parse(readFixture('NWS/observations-ktys.json')));

  it('pairs the latest with the observation closest to 3 h earlier and derives the direction', () => {
    const trend = pressureTrend(points, NOW_MS);
    expect(trend).not.toBeNull();
    expect(trend!.latest.observedAt).toBe('2026-09-12T17:00:00+00:00');
    expect(trend!.baseline!.observedAt).toBe('2026-09-12T14:00:00+00:00');
    expect(trend!.deltaHpa).toBe(-2.5);
    expect(trend!.direction).toBe('falling');
  });

  it('is null when the latest observation is stale (> 180 min old)', () => {
    const late = new Date(NOW_MS + (PRESSURE_STALE_MINUTES + 5) * 60_000).getTime();
    expect(pressureTrend(points, late)).toBeNull();
  });

  it('reports null delta with a stable direction when history does not reach the window', () => {
    const short: NwsPressurePoint[] = [{ observedAt: '2026-09-12T17:00:00+00:00', hPa: 1014.5 }];
    const trend = pressureTrend(short, NOW_MS);
    expect(trend).not.toBeNull();
    expect(trend!.baseline).toBeNull();
    expect(trend!.deltaHpa).toBeNull();
    expect(trend!.direction).toBe('stable');
  });

  it('classifies |Δ| ≤ 1 hPa as stable', () => {
    const pts: NwsPressurePoint[] = [
      { observedAt: '2026-09-12T14:00:00+00:00', hPa: 1014 },
      { observedAt: '2026-09-12T17:00:00+00:00', hPa: 1014.5 },
    ];
    expect(pressureTrend(pts, NOW_MS)?.direction).toBe('stable');
    const rising: NwsPressurePoint[] = [
      { observedAt: '2026-09-12T14:00:00+00:00', hPa: 1011 },
      { observedAt: '2026-09-12T17:00:00+00:00', hPa: 1014.5 },
    ];
    expect(pressureTrend(rising, NOW_MS)?.direction).toBe('rising');
  });
});

describe('runPressureJob', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  function serving(stations: Record<string, { status: number; body: string }>): { fetchImpl: typeof fetch; urls: string[] } {
    const urls: string[] = [];
    const fetchImpl = (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      urls.push(url);
      const station = /stations\/([^/]+)\//.exec(url)?.[1] ?? '';
      const canned = stations[station];
      if (!canned) return new Response('unexpected', { status: 404 });
      return new Response(canned.body, { status: canned.status });
    }) as typeof fetch;
    return { fetchImpl, urls };
  }

  const okBody = readFixture('NWS/observations-ktys.json');

  it('fetches one request per distinct station, upserts every mapped region, keeps observedAt vs retrievedAt', async () => {
    const stations: Record<string, { status: number; body: string }> = {};
    for (const { station } of Object.values(NWS_PRESSURE_STATIONS)) {
      stations[station] = { status: 200, body: okBody };
    }
    const f = serving(stations);
    const result = await runPressureJob(env.db, {
      userAgent: 'trout-test/1.0 (test@example.com)',
      fetchImpl: f.fetchImpl,
      now: NOW,
    });

    expect(result.errors).toBe(0);
    // Regions sharing a station share one request: 12 regions, 9 distinct stations.
    expect(new Set(Object.values(NWS_PRESSURE_STATIONS).map((s) => s.station)).size).toBe(f.urls.length);
    expect(result.stored).toBe(Object.keys(NWS_PRESSURE_STATIONS).length);

    const row = env.db.prepare('SELECT * FROM region_pressure WHERE region_id = ?').get('tn-east-smokies') as {
      observed_at: string;
      retrieved_at: string;
      pressure_hpa: number;
      trend_hpa_3h: number;
      trend_direction: string;
      station: string;
    };
    expect(row.observed_at).toBe('2026-09-12T17:00:00+00:00'); // NWS's own timestamp
    expect(row.retrieved_at).toBe(NOW.toISOString()); // our fetch time — never conflated
    expect(row.pressure_hpa).toBe(1014.5);
    expect(row.trend_hpa_3h).toBe(-2.5);
    expect(row.trend_direction).toBe('falling');
    expect(row.station).toBe('KGKT');
    // ktys fixture carries no precipitation — rain stays absent, never zeroed.
    expect(result.rainStored).toBe(0);
  });

  it('stores the newest measured rain window per region and skips null-value windows (F37)', async () => {
    const stations: Record<string, { status: number; body: string }> = {};
    for (const { station } of Object.values(NWS_PRESSURE_STATIONS)) {
      stations[station] = { status: 200, body: readFixture('NWS/observations-kbna.json') };
    }
    const f = serving(stations);
    const result = await runPressureJob(env.db, {
      userAgent: 'trout-test/1.0 (test@example.com)',
      fetchImpl: f.fetchImpl,
      now: NOW,
    });
    // 16:00Z (65 min old at NOW) is the newest MEASURED window; the newer
    // 17:00Z null window must not blank it, and every region gets the row.
    expect(result.rainStored).toBe(Object.keys(NWS_PRESSURE_STATIONS).length);
    const row = env.db.prepare('SELECT * FROM region_precipitation WHERE region_id = ?').get('tn-east-smokies') as {
      observed_at: string;
      precipitation_mm: number;
      station: string;
    };
    expect(row.observed_at).toBe('2026-09-12T16:00:00+00:00');
    expect(row.precipitation_mm).toBe(4.2);
    expect(row.station).toBe('KGKT');
  });

  it('soft-fails a station failure into warnings/errors while other regions still store', async () => {
    const stations: Record<string, { status: number; body: string }> = {};
    for (const { station } of Object.values(NWS_PRESSURE_STATIONS)) {
      stations[station] = { status: 200, body: okBody };
    }
    stations['KBNA'] = { status: 503, body: 'gone' };
    const f = serving(stations);
    const result = await runPressureJob(env.db, {
      userAgent: 'trout-test/1.0 (test@example.com)',
      fetchImpl: f.fetchImpl,
      now: NOW,
    });

    expect(result.errors).toBe(1);
    expect(result.warnings.join(' ')).toMatch(/NWS KBNA.*503/);
    // KBNA serves only tn-middle-nashville (KSYI serves duck-elk).
    expect(result.stored).toBe(Object.keys(NWS_PRESSURE_STATIONS).length - 1);
    expect(env.db.prepare('SELECT region_id FROM region_pressure WHERE region_id = ?').get('tn-middle-nashville')).toBeUndefined();
    expect(env.db.prepare('SELECT region_id FROM region_pressure WHERE region_id = ?').get('tn-west')).toBeDefined();
  });

  it('skips a region (honest absence) when its station data is stale', async () => {
    const staleBody = JSON.stringify({
      features: [
        {
          properties: {
            timestamp: '2026-09-12T12:00:00+00:00',
            barometricPressure: { value: 101900, unitCode: 'unit:Pa' },
          },
        },
      ],
    });
    const stations: Record<string, { status: number; body: string }> = {};
    for (const { station } of Object.values(NWS_PRESSURE_STATIONS)) {
      stations[station] = { status: 200, body: staleBody };
    }
    const f = serving(stations);
    const result = await runPressureJob(env.db, {
      userAgent: 'trout-test/1.0 (test@example.com)',
      fetchImpl: f.fetchImpl,
      now: NOW,
    });
    expect(result.stored).toBe(0);
    expect(result.warnings.join(' ')).toMatch(/no observation within 180 min/);
    const count = env.db.prepare('SELECT COUNT(*) AS n FROM region_pressure').get() as { n: number };
    expect(count.n).toBe(0);
  });

  it('declares the operator User-Agent on every NWS request', async () => {
    const seen: string[] = [];
    const fetchImpl = (async (_input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      seen.push(headers['User-Agent'] ?? '');
      return new Response(okBody, { status: 200 });
    }) as typeof fetch;
    await runPressureJob(env.db, { userAgent: 'trout-test/1.0 (test@example.com)', fetchImpl, now: NOW });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((ua) => ua.includes('trout-test/1.0'))).toBe(true);
  });

  it('builds the documented observations URL', () => {
    expect(nwsObservationsUrl('KTYS', 12)).toBe('https://api.weather.gov/stations/KTYS/observations?limit=12');
  });

  it('maps every region to an officially verified station (F38, no out-of-state or swapped stations)', () => {
    // F38: the official metadata probe (2026-09-29) showed KMOR is Morristown
    // Moore-Murrell TN (-83.3754, 36.1794) — not a "Tullahoma" Caney Fork
    // station — and KMRN is Morganton-Lenoir, NORTH CAROLINA. The corrected
    // table must keep them that way.
    expect(NWS_PRESSURE_STATIONS['tn-east-pigeon-frenchbroad']?.station).toBe('KMOR');
    expect(NWS_PRESSURE_STATIONS['tn-middle-caney-fork']?.station).toBe('KCSV');
    // The out-of-state Morganton-Lenoir NC station never serves a TN region.
    for (const { station } of Object.values(NWS_PRESSURE_STATIONS)) {
      expect(station).not.toBe('KMRN');
      expect(station).toMatch(/^K[A-Z]{3}$/);
    }
    // 12 regions share 9 distinct verified stations.
    expect(Object.keys(NWS_PRESSURE_STATIONS).length).toBe(12);
    expect(new Set(Object.values(NWS_PRESSURE_STATIONS).map((s) => s.station)).size).toBe(9);
  });
});

/**
 * F8 live probe (polite): ONE real request against api.weather.gov for a single
 * station, asserting the provider end-to-end against the live contract (Pa →
 * hPa plausibility). Skipped when the network is unavailable so an offline
 * sandbox cannot fail the suite — the polite part is that it never exceeds a
 * single-digit request count. HTTP-level failures (rate limit, upstream
 * outage) fail loudly: the probe exists to catch live contract drift.
 */
describe('NWS live probe (single-digit requests)', () => {
  it('fetches real observations for one station and parses them within plausible bounds', async () => {
    let points: NwsPressurePoint[];
    try {
      // Default limit (24) — stations on 5-minute feeds publish SLP only on the
      // hourly METAR, so a shallow window sees nothing but nulls (verified live).
      points = await fetchNwsPressure('KTYS', {
        userAgent: 'trout-site-dev/1.0 (fishing-report site)',
        timeoutMs: 20_000,
      });
    } catch (err) {
      const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err);
      if (/TypeError|fetch failed|ENOTFOUND|EAI_AGAIN|abort|timeout/i.test(msg)) {
        console.warn(`[nws-probe] network unavailable — live probe skipped (${msg})`);
        return;
      }
      throw err;
    }
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) {
      expect(p.hPa).toBeGreaterThanOrEqual(850);
      expect(p.hPa).toBeLessThanOrEqual(1100);
    }
  }, 30_000);
});
