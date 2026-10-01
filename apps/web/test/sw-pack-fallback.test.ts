import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PACK_CACHE_NAME } from '../src/lib/packBuilder';
import { parsePrecacheManifest } from '../scripts/size-budget.mjs';

/**
 * Service-worker pack fallback (offline downloads lane, last SW step).
 *
 * Pack-pinned assets live in Cache Storage under `trout-packs-v1` (packBuilder
 * PACK_CACHE_NAME). The project's SW is built by vite-plugin-pwa generateSW,
 * which cannot carry a custom fetch handler inline — so vite.shared.ts wires
 * `importScripts: ['pack-fallback.js']` (a first-class generateSW option) and
 * public/pack-fallback.js supplies the last-resort handler: after Workbox's
 * router has had its say, unclaimed GET same-origin requests are answered from
 * the pack cache before falling through to the network.
 *
 * There is no SW runtime in jsdom, so the suite pins the wiring at three
 * levels, mirroring how test/bundle-splitting.test.tsx works:
 *  1. CONFIG — vite.shared.ts must keep generateSW (the manifest-format the
 *     build gates parse) and importScripts the fallback file.
 *  2. BEHAVIOR — the REAL public/pack-fallback.js is evaluated in a sandboxed
 *     `self` with stub caches/fetch, and fetch events are dispatched through
 *     the registered listeners: ordering (fallback registers after a Workbox
 *     listener that attaches later in sw.js evaluation), non-shadowing
 *     (claimed events keep the Workbox response and start no duplicate
 *     fetch), pack hits (ignoreSearch), network fall-through, offline
 *     misses, and the never-ours request classes.
 *  3. ARTIFACT (when a dist exists) — the built sw.js actually importScripts
 *     the file, the file is copied verbatim, and the precache manifest the
 *     build gates parse still contains it.
 */

// ---- 1. config level --------------------------------------------------------

const sharedSource = readFileSync(join(process.cwd(), 'vite.shared.ts'), 'utf8');
const fallbackSource = readFileSync(join(process.cwd(), 'public', 'pack-fallback.js'), 'utf8');

describe('PWA config stays generateSW + importScripts wiring', () => {
  it('keeps the generateSW strategy (injectManifest would emit a quoted-key manifest the build gates cannot parse)', () => {
    expect(sharedSource).not.toContain('injectManifest');
    expect(sharedSource).toMatch(/VitePWA\(/);
  });

  it('wires the pack fallback via workbox importScripts', () => {
    expect(sharedSource).toMatch(/importScripts:\s*\[\s*'pack-fallback\.js'\s*\]/);
  });

  it('pins the fallback to the pack cache the app actually pins into', () => {
    expect(PACK_CACHE_NAME).toBe('trout-packs-v1');
    expect(fallbackSource).toContain(`PACK_CACHE_NAME = '${PACK_CACHE_NAME}'`);
  });

  it('uses ignoreSearch (revisioned/queried cache keys must still match) and never opens topo-cache', () => {
    expect(fallbackSource).toContain('ignoreSearch: true');
    // Terrain tiles live in topo-cache and are already claimed by the Workbox
    // CacheFirst /atlas/topo/ route — the fallback must not look in it. The
    // header comment may name the cache; the CODE may not reference it.
    const code = fallbackSource.slice(fallbackSource.indexOf('(function ()'));
    expect(code).not.toContain('topo-cache');
    expect(code).not.toMatch(/caches\.open/);
  });
});

// ---- 2. behavior level (the real file, sandboxed) ---------------------------

type FakeRequest = { method: string; mode: string; url: string };
type FakeResponse = { ok: boolean; status: number; body: string };

const ORIGIN = 'https://app.test';

interface Sandbox {
  fetchListeners: Array<(event: FakeFetchEvent) => void>;
  addEventListener(type: string, listener: (event: FakeFetchEvent) => void): void;
  location: { origin: string };
}

interface FakeFetchEvent {
  request: FakeRequest;
  respondWith(p: Promise<FakeResponse>): void;
}

function loadFallback(opts: {
  cacheEntries?: Record<string, FakeResponse>;
  fetchImpl?: (request: FakeRequest) => Promise<FakeResponse>;
}): { sandbox: Sandbox; flush: () => Promise<void> } {
  const sandbox: Sandbox = {
    fetchListeners: [],
    addEventListener: () => {},
    location: { origin: ORIGIN },
  };
  const cachesImpl = {
    match: async (
      req: FakeRequest,
      cacheOpts?: { cacheName?: string; ignoreSearch?: boolean },
    ): Promise<FakeResponse | undefined> => {
      // The fallback must look in exactly one cache: the pack cache.
      expect(cacheOpts?.cacheName).toBe(PACK_CACHE_NAME);
      const strip = (u: string) => (cacheOpts?.ignoreSearch ? u.split('?')[0] ?? u : u);
      for (const [key, hit] of Object.entries(opts.cacheEntries ?? {})) {
        if (strip(key) === strip(req.url)) return hit;
      }
      return undefined;
    },
  };
  const fetchImpl = opts.fetchImpl ?? (async () => {
    throw new TypeError('Failed to fetch');
  });
  // Evaluate the REAL file with a sandboxed self/caches/fetch. `new Function`
  // shadows only the globals the file touches; Promise/URL/Response stay the
  // runtime's own, as in a real service worker global scope.
  const run = new Function('self', 'caches', 'fetch', fallbackSource) as (
    self: Sandbox,
    caches: unknown,
    fetch: unknown,
  ) => void;
  sandbox.addEventListener = (type, listener) => {
    expect(type).toBe('fetch');
    sandbox.fetchListeners.push(listener);
  };
  run(sandbox, cachesImpl, fetchImpl);
  return {
    sandbox,
    // The fallback registers its listener one microtask after evaluation —
    // the same checkpoint the real sw.js relies on.
    flush: () => Promise.resolve(),
  };
}

/** Respond semantics like the real FetchEvent: a second respondWith throws. */
function makeEvent(request: FakeRequest): {
  event: FakeFetchEvent;
  responses: Promise<FakeResponse>[];
} {
  const responses: Promise<FakeResponse>[] = [];
  return {
    event: {
      request,
      respondWith(p) {
        if (responses.length > 0) {
          throw new Error('InvalidStateError: respondWith was already called');
        }
        responses.push(p);
      },
    },
    responses,
  };
}

function dispatch(listeners: Sandbox['fetchListeners'], event: FakeFetchEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Real dispatch isolates listener exceptions; the assertions below pin
      // the observable outcomes instead.
    }
  }
}

const packHit = (body: string): FakeResponse => ({ ok: true, status: 200, body });
const jsonResponse = (body: string): FakeResponse => ({ ok: true, status: 200, body });

describe('pack-fallback.js listener ordering', () => {
  it('registers its fetch listener only in a microtask — AFTER listeners attached later in sw.js evaluation', async () => {
    const { sandbox, flush } = loadFallback({});
    // Synchronously (as the rest of the generated sw.js runs right after
    // importScripts), Workbox's router listener attaches first…
    expect(sandbox.fetchListeners).toEqual([]);
    const workboxListener = () => {};
    sandbox.addEventListener('fetch', workboxListener);
    expect(sandbox.fetchListeners).toEqual([workboxListener]);
    // …and only after the microtask checkpoint does the fallback attach, last.
    await flush();
    expect(sandbox.fetchListeners).toEqual([workboxListener, expect.any(Function)]);
  });
});

describe('pack-fallback.js response selection', () => {
  it('serves a pack-pinned asset offline when no route claimed the event (ignoreSearch)', async () => {
    const { sandbox, flush } = loadFallback({
      cacheEntries: { [`${ORIGIN}/v1/streams`]: packHit('{"catalog":true}') },
    });
    await flush();
    const { event, responses } = makeEvent({
      method: 'GET',
      mode: 'cors',
      url: `${ORIGIN}/v1/streams?cachebust=1`,
    });
    dispatch(sandbox.fetchListeners, event);
    expect(responses).toHaveLength(1);
    await expect(responses[0]).resolves.toEqual(packHit('{"catalog":true}'));
  });

  it('does not shadow a Workbox route: claimed events keep the Workbox response and start no duplicate fetch', async () => {
    const fetchCalls: FakeRequest[] = [];
    const { sandbox, flush } = loadFallback({
      // The pack cache even holds this URL — Workbox must still win.
      cacheEntries: { [`${ORIGIN}/v1/conditions/latest.json`]: packHit('{"stale":true}') },
      fetchImpl: async (request) => {
        fetchCalls.push(request);
        return jsonResponse('{"fresh":true}');
      },
    });
    const workboxResponse = jsonResponse('{"fresh":true}');
    // The router listener attaches during sw.js evaluation — BEFORE the
    // fallback's deferred microtask registration (ordering test above).
    sandbox.addEventListener('fetch', (event) => {
      event.respondWith(Promise.resolve(workboxResponse));
    });
    await flush();
    const { event, responses } = makeEvent({
      method: 'GET',
      mode: 'cors',
      url: `${ORIGIN}/v1/conditions/latest.json`,
    });
    dispatch(sandbox.fetchListeners, event);
    expect(responses).toHaveLength(1);
    await expect(responses[0]).resolves.toBe(workboxResponse);
    // The `claimed` guard: no duplicate network fetch behind the lost race.
    await Promise.resolve();
    expect(fetchCalls).toEqual([]);
  });

  it('does not start a network fetch for claimed events that miss the pack cache either', async () => {
    // The common case for every Workbox-handled request (most URLs have no
    // pack entry): losing the respondWith race must not leave a duplicate
    // network fetch running behind Workbox's response.
    const fetchCalls: FakeRequest[] = [];
    const { sandbox, flush } = loadFallback({
      fetchImpl: async (request) => {
        fetchCalls.push(request);
        return jsonResponse('{"fresh":true}');
      },
    });
    sandbox.addEventListener('fetch', (event) => {
      event.respondWith(Promise.resolve(jsonResponse('{"workbox":true}')));
    });
    await flush();
    const { event, responses } = makeEvent({
      method: 'GET',
      mode: 'cors',
      url: `${ORIGIN}/content/taxa.json`,
    });
    dispatch(sandbox.fetchListeners, event);
    expect(responses).toHaveLength(1);
    await expect(responses[0]).resolves.toEqual(jsonResponse('{"workbox":true}'));
    await Promise.resolve();
    expect(fetchCalls).toEqual([]);
  });

  it('falls through to the network when nothing is pinned and the network works', async () => {
    const { sandbox, flush } = loadFallback({
      fetchImpl: async () => jsonResponse('{"live":true}'),
    });
    await flush();
    const { event, responses } = makeEvent({
      method: 'GET',
      mode: 'cors',
      url: `${ORIGIN}/v1/shops/TN.json`,
    });
    dispatch(sandbox.fetchListeners, event);
    await expect(responses[0]).resolves.toEqual(jsonResponse('{"live":true}'));
  });

  it('rejects like the pre-fallback default when offline with no pack copy', async () => {
    const { sandbox, flush } = loadFallback({}); // fetch always rejects
    await flush();
    const { event, responses } = makeEvent({
      method: 'GET',
      mode: 'cors',
      url: `${ORIGIN}/v1/stocking/TN.json`,
    });
    dispatch(sandbox.fetchListeners, event);
    await expect(responses[0]).rejects.toThrow('Failed to fetch');
  });

  it('survives Cache Storage being unavailable (falls through to fetch)', async () => {
    // Re-evaluate with `caches` undefined: only self/fetch are provided.
    const sandbox: Sandbox = {
      fetchListeners: [],
      addEventListener: () => {},
      location: { origin: ORIGIN },
    };
    sandbox.addEventListener = (type, listener) => {
      if (type === 'fetch') sandbox.fetchListeners.push(listener);
    };
    const fetchCalls: FakeRequest[] = [];
    new Function('self', 'caches', 'fetch', fallbackSource)(
      sandbox,
      undefined,
      async (request: FakeRequest) => {
        fetchCalls.push(request);
        return jsonResponse('{"live":true}');
      },
    );
    await Promise.resolve();
    const { event, responses } = makeEvent({
      method: 'GET',
      mode: 'cors',
      url: `${ORIGIN}/v1/streams`,
    });
    dispatch(sandbox.fetchListeners, event);
    await expect(responses[0]).resolves.toEqual(jsonResponse('{"live":true}'));
    expect(fetchCalls).toHaveLength(1);
  });

  it.each([
    ['non-GET', { method: 'POST', mode: 'cors', url: `${ORIGIN}/api/x` }],
    ['navigation', { method: 'GET', mode: 'navigate', url: `${ORIGIN}/v1/streams` }],
    ['cross-origin', { method: 'GET', mode: 'cors', url: 'https://cdn.example/v1/streams' }],
  ])('never answers a %s request (default browser behavior stands)', async (_label, request) => {
    const { sandbox, flush } = loadFallback({
      cacheEntries: { [`${ORIGIN}/v1/streams`]: packHit('{"pinned":true}') },
    });
    await flush();
    const { event, responses } = makeEvent(request as FakeRequest);
    dispatch(sandbox.fetchListeners, event);
    expect(responses).toHaveLength(0);
  });
});

// ---- 3. artifact level (real dist — built by pnpm build) --------------------

const distDir = join(process.cwd(), 'dist');
const distReady =
  existsSync(join(distDir, 'sw.js')) && existsSync(join(distDir, 'pack-fallback.js'));

describe.runIf(distReady)('built dist (real artifact)', () => {
  it('generates sw.js that importScripts the pack fallback', () => {
    const swSource = readFileSync(join(distDir, 'sw.js'), 'utf8');
    expect(swSource).toMatch(/importScripts\(\s*["']pack-fallback\.js["']\s*\)/);
  });

  it('copies the fallback verbatim from public/', () => {
    expect(readFileSync(join(distDir, 'pack-fallback.js'), 'utf8')).toBe(fallbackSource);
  });

  it('keeps the precache manifest parseable for the build gates and includes the fallback file', () => {
    // The size-budget/bundle-split gates parse generateSW's unquoted-key
    // manifest; this change deliberately stays on that format. If this parse
    // throws, the next `pnpm build` fails — better to catch it here.
    const urls = parsePrecacheManifest(readFileSync(join(distDir, 'sw.js'), 'utf8')).map(
      (e) => e.url,
    );
    expect(urls.length).toBeGreaterThan(0);
    expect(urls).toContain('pack-fallback.js');
  });
});
