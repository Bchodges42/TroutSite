import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GaugeReadingSchema, StreamSchema } from '@trout/contracts';
import type { GaugeReading, Stream } from '@trout/contracts';
import { z } from 'zod';
import { db } from '../src/lib/db';
import { fetchSnapshot, readCachedSnapshot } from '../src/lib/snapshots';

const streamSchema = z.array(StreamSchema);
const gaugeSchema = z.array(GaugeReadingSchema);

const sample: Stream[] = [
  {
    id: 's1',
    name: 'Test Creek',
    stateId: 'TN',
    waterbodyType: 'creek',
    regionId: 'tn-middle',
    gaugeIds: ['g1'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 300, unit: 'cfs' }],
    officialSources: [{ label: 'USGS', url: 'https://waterdata.usgs.gov' }],
  },
];

const readings: GaugeReading[] = [{ gaugeId: 'g1', cfs: 200, tempC: 12, timestamp: '2026-09-01T14:00Z' }];

beforeEach(async () => {
  await Promise.all([db.snapshots.clear(), db.logbook.clear(), db.settings.clear(), db.seen.clear()]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSnapshot (offline-first fetcher)', () => {
  it('stores a live fetch in Dexie and reports live=true', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonOk(sample)));

    const result = await fetchSnapshot('/v1/streams', streamSchema, 60);
    expect(result.live).toBe(true);
    expect(result.data).toEqual(sample);

    const stored = await db.snapshots.get('/v1/streams');
    expect(stored?.data).toEqual(sample);
    expect(stored?.fetchedAt).toBe(result.fetchedAt);
  });

  it('falls back to the cached snapshot when the network fails', async () => {
    await db.snapshots.put({ url: '/v1/streams', data: sample, fetchedAt: 1_000, expiresAt: 2_000 });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));

    const result = await fetchSnapshot('/v1/streams', streamSchema, 60);
    expect(result.live).toBe(false);
    expect(result.fetchedAt).toBe(1_000);
    expect(result.data).toEqual(sample);
  });

  it('serves stale cache past its TTL when offline (TTL is advisory)', async () => {
    await db.snapshots.put({ url: '/v1/streams', data: sample, fetchedAt: 1, expiresAt: 2 });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));

    const result = await fetchSnapshot('/v1/streams', streamSchema, 1);
    expect(result.live).toBe(false);
    expect(result.data).toEqual(sample);
  });

  it('refuses to serve cached data that no longer validates', async () => {
    await db.snapshots.put({ url: '/v1/streams', data: [{ nonsense: true }], fetchedAt: 1, expiresAt: 2 });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));

    await expect(fetchSnapshot('/v1/streams', streamSchema, 60)).rejects.toThrow();
  });

  it('rejects an HTTP error status instead of serving an empty body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    await expect(fetchSnapshot('/v1/streams', streamSchema, 60)).rejects.toThrow('HTTP 500');
  });

  it('reports a 200 served from a browser cache while offline as NOT live', async () => {
    await db.snapshots.put({ url: '/v1/streams', data: sample, fetchedAt: 1_000, expiresAt: 2_000 });
    vi.stubGlobal('fetch', vi.fn(async () => jsonOk(sample)));
    // navigator.onLine is a read-only getter in the specs — redefine it.
    const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    try {
      const result = await fetchSnapshot('/v1/streams', streamSchema, 60);
      expect(result.live).toBe(false); // chip must read "Offline · last known"
      expect(result.data).toEqual(sample);
    } finally {
      delete (window.navigator as { onLine?: boolean }).onLine;
      if (desc) Object.defineProperty(Navigator.prototype, 'onLine', desc);
    }
  });

  it('readCachedSnapshot returns null when nothing is stored', async () => {
    expect(await readCachedSnapshot('/v1/missing', streamSchema)).toBeNull();
  });

  it('validates payload shape against the frozen contract', async () => {
    const bad = [{ id: 'x' }]; // missing required fields
    vi.stubGlobal('fetch', vi.fn(async () => jsonOk(bad)));
    await expect(fetchSnapshot('/v1/streams', streamSchema, 60)).rejects.toThrow();

    vi.stubGlobal('fetch', vi.fn(async () => jsonOk(readings)));
    const ok = await fetchSnapshot('/v1/readings', gaugeSchema, 60);
    expect(ok.data).toEqual(readings);
  });
});

function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
