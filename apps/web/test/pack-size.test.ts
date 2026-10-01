import { afterEach, expect, it, vi } from 'vitest';
import { estimatePackSize, sizeEstimateText } from '../src/lib/packSize';
import type { PackPlan } from '../src/lib/packBuilder';

const plan: PackPlan = { id: 'water:elk-river', kind: 'water', label: 'Elk', sections: [],
  assetUrls: ['/v1/streams', '/v1/streams', '/content/access.json', '/atlas/a.png'] };
afterEach(() => vi.unstubAllGlobals());

it('deduplicates the real working set, probes only HEAD and keeps compressed/missing sizes unknown', async () => {
  vi.stubGlobal('caches', undefined);
  const fetcher = vi.fn(async (url: string, _options?: RequestInit) => new Response(null, { headers: url.includes('streams')
    ? { 'content-length': '200', 'content-type': 'application/json' }
    : url.endsWith('.png') ? { 'content-length': '30', 'content-type': 'image/png', 'content-encoding': 'gzip' }
    : { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetcher);
  const size = await estimatePackSize(plan);
  expect(size).toMatchObject({ bytes: 200, knownAssets: 1, unknownAssets: 2 });
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(fetcher.mock.calls.every((call) => (call[1] as RequestInit).method === 'HEAD')).toBe(true);
  expect(sizeEstimateText(size)).toContain('2 file sizes unavailable');
});

it('uses first-party uncompressed metadata when an edge compresses the response', async () => {
  vi.stubGlobal('caches', undefined);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { headers: {
    'content-length': '20', 'content-type': 'application/json', 'content-encoding': 'gzip', 'x-trout-asset-bytes': '1000',
  } })));
  expect(await estimatePackSize(plan)).toMatchObject({ bytes: 3000, unknownAssets: 0 });
});

it('measures cached bodies without a request and stops an aborted check', async () => {
  vi.stubGlobal('caches', { open: async () => ({ match: async () => new Response('{}', { headers: { 'content-type': 'application/json' } }) }) });
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  const size = await estimatePackSize(plan);
  expect(size).toMatchObject({ bytes: 6, knownAssets: 3, unknownAssets: 0, cachedAssets: 3 });
  expect(fetcher).not.toHaveBeenCalled();
  const controller = new AbortController(); controller.abort();
  await expect(estimatePackSize(plan, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
});
