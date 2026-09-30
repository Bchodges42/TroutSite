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

type StubResponse = {
  ok?: boolean;
  status?: number;
  json?: unknown;
  /** Content-Type the stub server answers with. */
  contentType?: string;
};

function fetchResponder(responses: Record<string, StubResponse>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const hit = Object.entries(responses).find(([key]) => url.includes(key));
    if (!hit) throw new Error('unexpected fetch ' + url);
    const { ok = true, status = ok ? 200 : 404, json, contentType } = hit[1];
    return {
      ok,
      status,
      headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? (contentType ?? null) : null) },
      json: async () => json,
    } as unknown as Response;
  });
}

const JSON_TYPE = 'application/json';
const IMAGE_TYPE = 'image/webp';

const GOOD_TOPO = {
  generated: '2026-09-05T00:00:00Z',
  bands: [{ file: 'contours-band0.geojson' }],
  hillshade: {
    pattern: 'hillshade/{z}/{x}/{y}.webp',
    minZoom: 7,
    maxZoom: 11,
    probe: 'hillshade/8/66/100.webp',
  },
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
  it('is true when the manifest is good and the declared probe tile serves as an image', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: GOOD_TOPO, contentType: JSON_TYPE },
      '/atlas/topo/hillshade/8/66/100.webp': { json: {}, contentType: IMAGE_TYPE },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated); // no cache churn
    await expect(probeTerrainAvailability('topo-cache', [0])).resolves.toBe(true);
  });

  it('is false when the declared probe tile 404s (partial deploy)', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: GOOD_TOPO, contentType: JSON_TYPE },
      '/atlas/topo/hillshade/8/66/100.webp': { ok: false },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated);
    await expect(probeTerrainAvailability('topo-cache', [0])).resolves.toBe(false);
  });

  // F28 — the SPA fallback used to answer 200 text/html for a missing tile and
  // the probe counted res.ok as availability, certifying a nonexistent image.
  it('is false when the probe tile answers 200 text/html (SPA shell)', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: GOOD_TOPO, contentType: JSON_TYPE },
      '/atlas/topo/hillshade/8/66/100.webp': { json: {}, contentType: 'text/html; charset=utf-8' },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated);
    await expect(probeTerrainAvailability('topo-cache', [0])).resolves.toBe(false);
  });

  it('is false when the probe tile answers with a non-image content-type', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: GOOD_TOPO, contentType: JSON_TYPE },
      '/atlas/topo/hillshade/8/66/100.webp': { json: {}, contentType: 'application/json' },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated);
    await expect(probeTerrainAvailability('topo-cache', [0])).resolves.toBe(false);
  });

  it('is false when the tile response carries no content-type to verify', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: GOOD_TOPO, contentType: JSON_TYPE },
      '/atlas/topo/hillshade/8/66/100.webp': { json: {} },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', GOOD_TOPO.generated);
    await expect(probeTerrainAvailability('topo-cache', [0])).resolves.toBe(false);
  });

  it('falls back across the declared zoom range when an older manifest declares no probe tile', async () => {
    // The shipped set can start above the declared minimum: the z7 computed
    // tile is absent, the z8 tile over central Tennessee is real.
    const withoutProbe = {
      ...GOOD_TOPO,
      hillshade: { pattern: GOOD_TOPO.hillshade.pattern, minZoom: 7, maxZoom: 11 },
    };
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/topo/manifest.json': { json: withoutProbe, contentType: JSON_TYPE },
      '/atlas/topo/hillshade/7/33/50.webp': { ok: false },
      '/atlas/topo/hillshade/8/66/100.webp': { json: {}, contentType: IMAGE_TYPE },
    }));
    stubCaches();
    localStorage.setItem('trout:topo-generated', withoutProbe.generated);
    await expect(probeTerrainAvailability('topo-cache', [0])).resolves.toBe(true);
  });

  it('is false when the manifest is HTML from the SPA fallback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html; charset=utf-8' },
      json: async () => {
        throw new Error('<html> is not JSON');
      },
    } as unknown as Response)));
    stubCaches();
    await expect(probeTerrainAvailability('topo-cache', [0])).resolves.toBe(false);
  });
});

describe('probeRoadsAvailability', () => {
  it('is true only when EVERY referenced road file serves as JSON', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/roads-manifest.json': {
        json: { files: [{ file: 'roads-major.geojson' }, { file: 'roads-minor.geojson' }] },
        contentType: JSON_TYPE,
      },
      '/atlas/roads-major.geojson': { json: {}, contentType: 'application/geo+json' },
      '/atlas/roads-minor.geojson': { json: {}, contentType: 'application/geo+json' },
    }));
    const manifest = await probeRoadsAvailability();
    expect(manifest?.files.map((f) => f.file)).toEqual(['roads-major.geojson', 'roads-minor.geojson']);
  });

  it('is null when one referenced road file 404s', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/roads-manifest.json': {
        json: { files: [{ file: 'roads-major.geojson' }, { file: 'roads-minor.geojson' }] },
        contentType: JSON_TYPE,
      },
      '/atlas/roads-major.geojson': { json: {}, contentType: 'application/geo+json' },
      '/atlas/roads-minor.geojson': { ok: false },
    }));
    await expect(probeRoadsAvailability([0])).resolves.toBeNull();
  });

  // F28 — same SPA-shell trap as the terrain tile: a 200 text/html road file
  // is not road data.
  it('is null when a referenced road file answers 200 text/html (SPA shell)', async () => {
    vi.stubGlobal('fetch', fetchResponder({
      '/atlas/roads-manifest.json': {
        json: { files: [{ file: 'roads-major.geojson' }] },
        contentType: JSON_TYPE,
      },
      '/atlas/roads-major.geojson': { json: {}, contentType: 'text/html; charset=utf-8' },
    }));
    await expect(probeRoadsAvailability([0])).resolves.toBeNull();
  });
});

describe('shipped topo manifest integrity (F28)', () => {
  it('declares a probe tile that actually exists among the shipped tiles', async () => {
    const { existsSync, readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/atlas/topo/manifest.json'), 'utf8'),
    ) as { hillshade: { probe?: string; minZoom: number; maxZoom: number } };
    // The probe tile is the readiness helper's source of truth — it must be a
    // real shipped file, never a URL the deployment 404s (or worse, answers
    // with the SPA shell).
    expect(manifest.hillshade.probe).toMatch(/^hillshade\/\d+\/\d+\/\d+\.webp$/);
    expect(
      existsSync(resolve(process.cwd(), 'public/atlas/topo', manifest.hillshade.probe!)),
    ).toBe(true);
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

  // F29 — the marker may only advance once the deletion actually succeeded;
  // a failed delete must stay retryable on the very next call.
  it('does not record the generation when the deletion fails, and retries next call', async () => {
    let deleteCalls = 0;
    let failDelete = true;
    vi.stubGlobal('caches', {
      delete: async (_name: string) => {
        deleteCalls += 1;
        if (failDelete) throw new Error('transient deletion failure');
        return true;
      },
    });
    localStorage.setItem('trout:topo-generated', 'old-generation');

    const first = await invalidateStaleTopoCache({ ...GOOD_TOPO, generated: 'new-generation' });
    expect(first).toBe(false);
    expect(localStorage.getItem('trout:topo-generated')).toBe('old-generation');

    failDelete = false;
    const second = await invalidateStaleTopoCache({ ...GOOD_TOPO, generated: 'new-generation' });
    expect(second).toBe(true);
    expect(deleteCalls).toBe(2); // the failed purge was retried
    expect(localStorage.getItem('trout:topo-generated')).toBe('new-generation');
  });
});
