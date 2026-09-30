import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { db } from '../src/lib/db';
import { fetchSnapshot } from '../src/lib/snapshots';
import { z } from 'zod';

/**
 * T2-42 — offline content recovery: when the network fails AND Dexie has no
 * copy, fetchSnapshot falls back to the service worker's runtime cache before
 * giving up ("not on this device"). The SW-cached copy reports live:false.
 *
 * F03 — the same recovery tier must also run on the KNOWN-offline path
 * (navigator.onLine === false): an installed shell in airplane mode with an
 * empty Dexie store still holds precached/service-worker content, and the
 * early offline branch must not exit before the recovery tier.
 */

const SCHEMA = z.object({ hello: z.string() });
const URL = '/v1/test-recovery.json';

const cacheStore = new Map<string, Response>();

beforeEach(async () => {
  cacheStore.clear();
  await db.snapshots.clear();
  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new TypeError('Failed to fetch');
  }) as unknown as typeof fetch);
  // jsdom has no Cache Storage — stand in a minimal one backed by a Map.
  vi.stubGlobal('caches', {
    match: async (req: RequestInfo) => cacheStore.get(typeof req === 'string' ? req : req.url) ?? undefined,
  });
});

afterEach(() => {
  restoreOnline();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** navigator.onLine is a read-only getter in the specs — redefine it. */
function setOnline(online: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true });
}

function restoreOnline(): void {
  delete (window.navigator as { onLine?: boolean }).onLine;
}

/** Cache Storage stub that emulates Workbox revisioned precache keys. */
function stubRevisionedCaches(revisionedKey: string): void {
  vi.stubGlobal('caches', {
    match: async (req: RequestInfo, opts?: { ignoreSearch?: boolean }) => {
      const u = typeof req === 'string' ? req : req.url;
      if (opts?.ignoreSearch) {
        // Real Cache Storage semantics: compare with the query string stripped.
        return u.split('?')[0] === revisionedKey.split('?')[0]
          ? cacheStore.get(revisionedKey)
          : undefined;
      }
      return cacheStore.get(u) ?? undefined;
    },
  });
}

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

describe('fetchSnapshot — F03 known-offline recovery parity', () => {
  afterEach(restoreOnline);

  it('serves the SW-cached copy while ACTUALLY offline with empty Dexie', async () => {
    cacheStore.set(URL, new Response(JSON.stringify({ hello: 'world' }), { status: 200 }));
    setOnline(false);
    const result = await fetchSnapshot(URL, SCHEMA, 60);
    expect(result.live).toBe(false);
    expect(result.data).toEqual({ hello: 'world' });
  });

  it('recovers a Workbox revisioned precache key while offline (ignoreSearch)', async () => {
    // Workbox stores unhashed precache entries under
    // `<url>?__WB_REVISION__=<hash>` (vite.shared.ts precache globs), so an
    // exact-key match misses the content pack in a real installed browser.
    const revisionedKey = `${URL}?__WB_REVISION__=abc123`;
    cacheStore.set(revisionedKey, new Response(JSON.stringify({ hello: 'precache' }), { status: 200 }));
    stubRevisionedCaches(revisionedKey);
    setOnline(false);
    const result = await fetchSnapshot(URL, SCHEMA, 60);
    expect(result.live).toBe(false);
    expect(result.data).toEqual({ hello: 'precache' });
  });

  it('prefers the fresher Dexie copy over the SW cache while offline', async () => {
    await db.snapshots.put({ url: URL, data: { hello: 'dexie' }, fetchedAt: 5_000, expiresAt: 6_000 });
    cacheStore.set(URL, new Response(JSON.stringify({ hello: 'sw' }), { status: 200 }));
    setOnline(false);
    const result = await fetchSnapshot(URL, SCHEMA, 60);
    expect(result.data).toEqual({ hello: 'dexie' });
    expect(result.fetchedAt).toBe(5_000);
    expect(result.live).toBe(false);
  });

  it('still throws when offline with neither Dexie nor the SW cache holding data', async () => {
    setOnline(false);
    await expect(fetchSnapshot(URL, SCHEMA, 60)).rejects.toThrow('offline and no cached snapshot');
  });
});
