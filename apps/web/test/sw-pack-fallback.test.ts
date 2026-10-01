import { afterEach, describe, expect, it, vi } from 'vitest';
import { PINNED_CACHE, pinnedResponse } from '../src/lib/swPinnedResponse';
import { PACK_CACHE_NAME } from '../src/lib/packBuilder';
import { parsePrecacheManifest } from '../scripts/size-budget.mjs';

const origin = 'https://app.test';
afterEach(() => vi.unstubAllGlobals());

describe('pinned cache error recovery (real worker handler)', () => {
  it.each(['/v1/conditions/latest.json', '/content/access.json', '/atlas/topo/tile.png'])('recovers %s from the durable pack, including query variants', async (path) => {
    const hit = new Response('saved', { status: 200 });
    const match = vi.fn().mockResolvedValue(hit);
    vi.stubGlobal('caches', { match });
    const request = new Request(origin + path + '?refresh=1');
    expect(await pinnedResponse(request, origin)).toBe(hit);
    expect(match).toHaveBeenCalledWith(request, { cacheName: PACK_CACHE_NAME, ignoreSearch: true });
    expect(PINNED_CACHE).toBe(PACK_CACHE_NAME);
  });
  it.each(['/v1/watches/rules?subscriptionId=secret', '/v1/corrections/status/secret', '/v1/owner/dashboard', '/v1/portal/draft', '/settings'])('never recovers private or non-resource %s', async (path) => {
    const match = vi.fn().mockResolvedValue(new Response('private'));
    vi.stubGlobal('caches', { match });
    expect((await pinnedResponse(new Request(origin + path), origin)).type).toBe('error');
    expect(match).not.toHaveBeenCalled();
  });
  it('never recovers POST or external requests', async () => {
    const match = vi.fn();
    vi.stubGlobal('caches', { match });
    expect((await pinnedResponse(new Request(origin + '/v1/streams', { method: 'POST' }), origin)).type).toBe('error');
    expect((await pinnedResponse(new Request('https://external.test/v1/streams'), origin)).type).toBe('error');
    expect(match).not.toHaveBeenCalled();
  });
  it('returns a network error for missing, failed, or unavailable storage', async () => {
    const match = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(new Response('', { status: 500 })).mockRejectedValueOnce(new Error('storage'));
    vi.stubGlobal('caches', { match });
    for (let i = 0; i < 3; i++) expect((await pinnedResponse(new Request(origin + '/v1/streams'), origin)).type).toBe('error');
  });
});

describe('install budget inspects the injected manifest', () => {
  it('accepts minified function names, quoted keys and escaped URLs', () => {
    expect(parsePrecacheManifest('self.__TROUT_PRECACHE_MANIFEST=[{"revision":"x","url":"index.html"},{url:"assets/a\\u002eb.js",revision:null}];p(self.__TROUT_PRECACHE_MANIFEST)'))
      .toEqual([{ url: 'index.html' }, { url: 'assets/a.b.js' }]);
  });
  it('continues reading older generated workers', () => {
    expect(parsePrecacheManifest('w.precacheAndRoute([{url:"index.html",revision:"x"}])')).toEqual([{ url: 'index.html' }]);
  });
});
