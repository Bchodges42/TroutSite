import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { createGaugeNowCache } from '../src/lib/gauge-now.js';
import type { GaugeNowCache } from '../src/lib/gauge-now.js';

const READING = { gaugeId: '03432350', cfs: 123, timestamp: '2026-09-14T12:00:00.000Z' };

function cacheStub(
  entry: Awaited<ReturnType<GaugeNowCache['get']>> | { throw: Error },
): GaugeNowCache {
  return {
    get: async (id) => {
      if (entry && 'throw' in entry) throw entry.throw;
      const e = entry as { reading: typeof READING; fetchedAt: number; stale: boolean } | null;
      if (!e) return null;
      return { ...e, reading: { ...e.reading, gaugeId: id } };
    },
  };
}

describe('GET /v1/gauges/:gaugeId/now', () => {
  let app: ReturnType<typeof buildApp>;

  afterEach(async () => {
    await app?.close();
  });

  it('rejects a gauge id that is not 8 digits', async () => {
    app = buildApp({ logger: false });
    for (const bad of ['0343235', '034323500', 'USGS-03432350', 'abc']) {
      const res = await app.inject({ method: 'GET', url: `/v1/gauges/${bad}/now` });
      expect(res.statusCode).toBe(400);
    }
  });

  it('returns a fresh reading with stale:false and a fetchedAt stamp', async () => {
    app = buildApp({
      logger: false,
      gaugesNow: cacheStub({
        reading: READING,
        fetchedAt: Date.parse('2026-09-14T12:00:05.000Z'),
        stale: false,
      }),
    });
    const res = await app.inject({ method: 'GET', url: '/v1/gauges/03432350/now' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.json()).toEqual({
      gaugeId: '03432350',
      cfs: 123,
      timestamp: '2026-09-14T12:00:00.000Z',
      stale: false,
      fetchedAt: '2026-09-14T12:00:05.000Z',
    });
  });

  it('marks a stale cached reading as stale', async () => {
    app = buildApp({
      logger: false,
      gaugesNow: cacheStub({ reading: READING, fetchedAt: 1, stale: true }),
    });
    const res = await app.inject({ method: 'GET', url: '/v1/gauges/03598000/now' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ gaugeId: '03598000', stale: true });
  });

  it('404s when the gauge has no current data', async () => {
    app = buildApp({ logger: false, gaugesNow: cacheStub(null) });
    const res = await app.inject({ method: 'GET', url: '/v1/gauges/03421000/now' });
    expect(res.statusCode).toBe(404);
  });

  it('502s when the cache throws (no cached reading to degrade to)', async () => {
    app = buildApp({ logger: false, gaugesNow: cacheStub({ throw: new Error('upstream down') }) });
    const res = await app.inject({ method: 'GET', url: '/v1/gauges/03421000/now' });
    expect(res.statusCode).toBe(502);
  });
});

describe('gauge-now cache behavior', () => {
  function fetchStub(payload: unknown, status = 200) {
    return vi.fn(
      async () =>
        ({ ok: status >= 200 && status < 300, status, json: async () => payload }) as Response,
    );
  }
  const ogcPayload = {
    features: [
      {
        properties: {
          monitoring_location_id: 'USGS-03432350',
          parameter_code: '00060',
          time: '2026-09-14T12:00:00.000Z',
          value: '123',
          qualifier: ['P'],
        },
      },
    ],
  };

  it('serves a fresh reading from cache without refetching inside the TTL', async () => {
    let clock = 1_000;
    const fetchImpl = fetchStub(ogcPayload);
    const cache = createGaugeNowCache({ fetchImpl, ttlMs: 1_000, now: () => clock });
    const first = await cache.get('03432350');
    clock += 500;
    const second = await cache.get('03432350');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(first?.reading.cfs).toBe(123);
    expect(second?.stale).toBe(false);
  });

  it('refetches after the TTL expires', async () => {
    let clock = 1_000;
    const fetchImpl = fetchStub(ogcPayload);
    const cache = createGaugeNowCache({ fetchImpl, ttlMs: 1_000, now: () => clock });
    await cache.get('03432350');
    clock += 2_000;
    await cache.get('03432350');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('serves the previous reading as stale when the live fetch fails', async () => {
    let clock = 1_000;
    let shouldFail = false;
    const fetchImpl = vi.fn(async () => {
      if (shouldFail) throw new Error('network down');
      return { ok: true, status: 200, json: async () => ogcPayload } as Response;
    });
    const cache = createGaugeNowCache({ fetchImpl, ttlMs: 1_000, now: () => clock });
    await cache.get('03432350');
    clock += 2_000; // past TTL, so the next get() refetches
    shouldFail = true;
    const degraded = await cache.get('03432350');
    expect(degraded?.stale).toBe(true);
    expect(degraded?.reading.cfs).toBe(123);
  });

  it('throws when the fetch fails and nothing was ever cached', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    const cache = createGaugeNowCache({ fetchImpl, now: () => 1_000 });
    await expect(cache.get('03432350')).rejects.toThrow('network down');
  });

  it('negative-caches a no-data gauge so repeat taps do not refetch', async () => {
    let clock = 1_000;
    const fetchImpl = fetchStub({ features: [] });
    const cache = createGaugeNowCache({ fetchImpl, ttlMs: 1_000, now: () => clock });
    await expect(cache.get('03421000')).resolves.toBeNull();
    clock += 200;
    await expect(cache.get('03421000')).resolves.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent gets for the same gauge into one fetch', async () => {
    const fetchImpl = fetchStub(ogcPayload);
    const cache = createGaugeNowCache({ fetchImpl, now: () => 1_000 });
    const [a, b] = await Promise.all([cache.get('03432350'), cache.get('03432350')]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(a?.reading.gaugeId).toBe('03432350');
    expect(b?.reading.gaugeId).toBe('03432350');
  });
});
