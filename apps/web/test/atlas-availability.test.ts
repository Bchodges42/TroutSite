import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  invalidateStaleTopoCache,
  parseRoadsManifest,
  parseTopoManifest,
  probeRoadsAvailability,
  probeTerrainAvailability,
  tileForCoordinate,
} from '../src/lib/atlasAvailability';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

// jsdom has no `caches`; a boolean-throwing stub stands in for Cache Storage.
function stubCaches(deleteImpl: (name: string) => Promise<boolean> = async () => true) {
  const deleted: string[] = [];
  vi.stubGlobal('caches', {
    delete: async (name: string) => {
      deleted.push(name);
      return deleteImpl(name);
    },
  });
  return deleted;
}

function fetchResponder(responses: Record<string, { ok?: boolean; status?: number; json?: unknown }>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const hit = Object.entries(responses).find(([key]) => url.includes(key));
    if (!hit) throw new Error('unexpected fetch ' + url);
    const { ok = true, status = ok ? 200 : 404, json } = hit[1];
    return {
      ok,
      status,
      json: async () => json,
    } as Response;
  });
}

const GOOD_TOPO = {
  generated: '2026-09-05T00:00:00Z',
  bands: [{ file: 'contours-band0.geojson' }],
  hillshade: { pattern: 'hillshade/{z}/{x}/{y}.webp', minZoom: 7, maxZoom: 11 },
};

describe('manifest shape parsing', () => {
  it('accepts a well-formed topo manifest and rejects broken ones', () => {
    expect(parseTopoManifest(GOOD_TOPO)).not.toBeNull();
    expect(parseTopoManifest({ bands: [], hillshade: GOOD_TOPO.hillshade })).toBeNull();
    expect(parseTopoManifest({ bands: [1] })).toBeNull();
    expect(parseTopoManifest(null)).toBeNull();
    // SPA fallback answered HTML: fetchJson throws before parse; a stray string fails too.
    expect(parseTopoManifest('<html>')).toBeNull();
  });

  it('accepts a roads manifest with files and rejects empty or malformed ones', () => {
    expect(parseRoadsManifest({ files: [{ file: 'roads-major.geojson', minZoom: 5.6 }] })).not.toBeNull();
    expect(parseRoadsManifest({ files: [] })).toBeNull();
    expect(parseRoadsManifest({ files: [{ lod: 'major' }] })).toBeNull();
    expect(parseRoadsManifest('nope')).toBeNull();
  });
});

describe('tileForCoordinate', () => {
  it('returns the tile covering central Tennessee at the given zoom', () => {
    // z7 tile under central TN: x = (93.5/360)*128 = 33, standard mercator y = 50.
    expect(tileForCoordinate(-86.5, 35.8, 7)).toEqual({ x: 33, y: 50 });
    // zoom 0 is always 0/0; higher zooms stay within 2^z bounds.
    expect(tileForCoordinate(-86.5, 35.8, 0)).toEqual({ x: 0, y: 0 });
    const { x, y } = tileForCoordinate(-86.5, 35.8, 11);
    expect(x).toBeLessThan(2 ** 11);
    expect(y).toBeLessThan(2 ** 11);
    // Halving the tile size per zoom level doubles each index.
    expect(tileForCoordinate(-86.5, 35.8, 8)).toEqual({ x: 66, y: 100 });
  });
});

describe('probeTerrainAvailability', () => {
  it('is true when the manifest is good and the referenced tile is servable', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: GOOD_TOPO },
      '/atlas/topo/hillshade/7/33/': { json: {} },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated); // no cache churn
    await expect(probeTerrainAvailability()).resolves.toBe(true);
  });

  it('is false when the tile HEAD probe fails (partial deploy)', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: GOOD_TOPO },
      '/atlas/topo/hillshade/7/33/': { ok: false },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated);
    await expect(probeTerrainAvailability()).resolves.toBe(false);
  });

  it('is false when the manifest is HTML from the SPA fallback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('<html> is not JSON');
      },
    } as unknown as Response)));
    stubCaches();
    await expect(probeTerrainAvailability()).resolves.toBe(false);
  });
});

describe('probeRoadsAvailability', () => {
  it('is true only when EVERY referenced road file is servable', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/roads-manifest.json': {
        json: { files: [{ file: 'roads-major.geojson' }, { file: 'roads-minor.geojson' }] },
      },
      '/atlas/roads-major.geojson': { json: {} },
      '/atlas/roads-minor.geojson': { json: {} },
    }));
    const manifest = await probeRoadsAvailability();
    expect(manifest?.files.map((f) => f.file)).toEqual(['roads-major.geojson', 'roads-minor.geojson']);
  });

  it('is null when one referenced road file 404s', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/roads-manifest.json': {
        json: { files: [{ file: 'roads-major.geojson' }, { file: 'roads-minor.geojson' }] },
      },
      '/atlas/roads-major.geojson': { json: {} },
      '/atlas/roads-minor.geojson': { ok: false },
    }));
    await expect(probeRoadsAvailability()).resolves.toBeNull();
  });
});

describe('invalidateStaleTopoCache', () => {
  it('purges the topo cache when the manifest generation changes', async () => {
    const deleted = stubCaches();
    localStorage.setItem('trout:topo-generated', 'old-generation');
    await invalidateStaleTopoCache({ ...GOOD_TOPO, generated: 'new-generation' });
    expect(deleted).toEqual(['topo-cache']);
    expect(localStorage.getItem('trout:topo-generated')).toBe('new-generation');
  });

  it('does nothing when the generation is unchanged', async () => {
    const deleted = stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated);
    await invalidateStaleTopoCache(GOOD_TOPO);
    expect(deleted).toEqual([]);
  });

  it('records the generation even when Cache Storage is unavailable', async () => {
    vi.stubGlobal('caches', undefined);
    await invalidateStaleTopoCache(GOOD_TOPO);
    expect(localStorage.getItem('trout:topo-generated')).toBe(GOOD_TOPO.generated);
  });
});
