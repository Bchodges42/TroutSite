import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchSnapshot } from '../src/lib/snapshots';
import { z } from 'zod';

/**
 * T2-42 — offline content recovery: when the network fails AND Dexie has no
 * copy, fetchSnapshot falls back to the service worker's runtime cache before
 * giving up ("not on this device"). The SW-cached copy reports live:false.
 */

const SCHEMA = z.object({ hello: z.string() });
const URL = '/v1/test-recovery.json';

const cacheStore = new Map<string, Response>();

beforeEach(() => {
  cacheStore.clear();
  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new TypeError('Failed to fetch');
  }) as unknown as typeof fetch);
  // jsdom has no Cache Storage — stand in a minimal one backed by a Map.
  vi.stubGlobal('caches', {
    match: async (req: RequestInfo) => cacheStore.get(typeof req === 'string' ? req : req.url) ?? undefined,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchSnapshot — T2-42 SW-cache recovery tier', () => {
  it('serves the SW-cached copy (live:false) when network and Dexie both fail', async () => {
    cacheStore.set(URL, new Response(JSON.stringify({ hello: 'world' }), { status: 200 }));
    const result = await fetchSnapshot(URL, SCHEMA, 60);
    expect(result.live).toBe(false);
    expect(result.data).toEqual({ hello: 'world' });
  });

  it('throws when the SW cache has no copy either', async () => {
    await expect(fetchSnapshot(URL, SCHEMA, 60)).rejects.toThrow();
  });

  it('prefers the fresh network copy when the network works', async () => {
    cacheStore.set(URL, new Response(JSON.stringify({ hello: 'stale' }), { status: 200 }));
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input.toString();
      if (u === URL) {
        return new Response(JSON.stringify({ hello: 'fresh' }), { status: 200 });
      }
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch);
    const result = await fetchSnapshot(URL, SCHEMA, 60);
    expect(result.live).toBe(true);
    expect(result.data).toEqual({ hello: 'fresh' });
  });
});
