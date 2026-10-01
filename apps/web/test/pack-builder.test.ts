import { describe, expect, it } from 'vitest';
import { tileForCoordinate } from '../src/lib/atlasAvailability';
import {
  cacheNameForUrl,
  networkClusterUrlsForPoint,
  parseNetworkClusters,
  parseTopoTileInfo,
  planTripPack,
  planWaterPack,
  releasesApplicableForPack,
  terrainTileUrls,
  toManifestInput,
  toPlanIndexEntry,
  waterAnchor,
  PACK_CACHE_NAME,
  type TopoTileInfo,
} from '../src/lib/packBuilder';
import { tripManifestId } from '../src/lib/downloadManifests';
import type { Stream } from '@trout/contracts';

/**
 * Pure pack-planning tests (ADR 0012 decision 3). The section/URL model here
 * is the honest-minimal contract the pack cache pins against: it is derived
 * from what the app actually reads for a water (StreamDetailPage + the map),
 * never from what a pack could theoretically carry.
 */

const TOPO: TopoTileInfo = { pattern: 'hillshade/{z}/{x}/{y}.webp', minZoom: 7, maxZoom: 11 };

function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'caney-fork-river',
    name: 'Caney Fork River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-east-clinch',
    hydroIdentity: { gnisIds: ['00000001'], huc8s: ['06010201'] },
    gaugeIds: ['03424010'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
    species: 'trout',
    targetSpecies: ['rainbow', 'brown'],
    fishery: 'tailwater',
    officialSources: [],
    ...overrides,
  } as unknown as Stream;
}

describe('planWaterPack — the required section set', () => {
  const plan = planWaterPack(makeStream(), { month: 9 });

  it('plans catalog + conditions + releases + hatch + geometry for a tailrace trout water', () => {
    expect(plan.sections.map((s) => s.key)).toEqual([
      'catalog',
      'conditions',
      'releases',
      'hatch',
      'geometry',
    ]);
    expect(plan.sections.every((s) => s.required)).toBe(true);
  });

  it('catalog section carries the water guide files the detail page reads', () => {
    const catalog = plan.sections.find((s) => s.key === 'catalog')!;
    expect(catalog.urls).toEqual([
      '/v1/streams',
      '/content/fishing.json',
      '/content/taxa.json',
      '/content/patterns.json',
      '/v1/stocking/TN.json',
      '/content/access.json',
      '/v1/reports/recent.json',
    ]);
  });

  it('conditions section carries the shared snapshot plus per-water fishability when species are cataloged', () => {
    const conditions = plan.sections.find((s) => s.key === 'conditions')!;
    expect(conditions.urls).toEqual([
      '/v1/conditions/latest.json',
      '/v1/fishability/caney-fork-river.json',
    ]);
  });

  it('releases section is required for a dam-release water and pins its schedule', () => {
    const releases = plan.sections.find((s) => s.key === 'releases')!;
    expect(releases.required).toBe(true);
    expect(releases.urls).toEqual(['/v1/release-schedule/caney-fork-river.json']);
  });

  it('hatch section is region+month scoped', () => {
    const hatch = plan.sections.find((s) => s.key === 'hatch')!;
    expect(hatch.urls).toEqual(['/v1/hatch/tn-east-clinch/9.json']);
  });

  it('geometry section pins the reach-geometry source (network context added via hints)', () => {
    const geometry = plan.sections.find((s) => s.key === 'geometry')!;
    expect(geometry.urls).toEqual(['/atlas/rivers.geojson']);
    const withClusters = planWaterPack(makeStream(), {
      month: 9,
      clusterUrls: ['/atlas/network/manifest.json', '/atlas/network/0601.geojson'],
    });
    expect(withClusters.sections.find((s) => s.key === 'geometry')!.urls).toEqual([
      '/atlas/rivers.geojson',
      '/atlas/network/manifest.json',
      '/atlas/network/0601.geojson',
    ]);
  });

  it('resolves the actual atlas-relative network filenames without repeating network/', () => {
    expect(networkClusterUrlsForPoint([{ id: '0505', file: 'network/0505.geojson', bounds: [-91, 34, -80, 37] }], { lon: -86, lat: 36 }))
      .toEqual(['/atlas/network/manifest.json', '/atlas/network/0505.geojson']);
  });

  it('assetUrls dedupes across sections', () => {
    const urls = new Set(plan.assetUrls);
    expect(urls.size).toBe(plan.assetUrls.length);
    expect(plan.assetUrls.length).toBe(plan.sections.reduce((n, s) => n + s.urls.length, 0));
  });
});

describe('planWaterPack — honest omissions', () => {
  it('omits the fishability file for waters with no cataloged target species', () => {
    const plan = planWaterPack(makeStream({ id: 'holston-river', targetSpecies: undefined, fishery: undefined, waterbodyType: 'river' }), { month: 9 });
    const conditions = plan.sections.find((s) => s.key === 'conditions')!;
    expect(conditions.urls).toEqual(['/v1/conditions/latest.json']);
  });

  it('omits the releases section for non-tailrace waters', () => {
    const plan = planWaterPack(makeStream({ waterbodyType: 'creek', fishery: 'wild' }), { month: 9 });
    expect(plan.sections.map((s) => s.key)).not.toContain('releases');
    expect(releasesApplicableForPack({ waterbodyType: 'river', fishery: undefined })).toBe(false);
    expect(releasesApplicableForPack({ waterbodyType: 'tailrace', fishery: undefined })).toBe(true);
    expect(releasesApplicableForPack({ waterbodyType: 'river', fishery: 'tailwater' })).toBe(true);
  });

  it('never plans terrain unless includeTerrain AND resolved coverage inputs arrive', () => {
    expect(planWaterPack(makeStream(), { month: 9 }).sections.map((s) => s.key)).not.toContain('terrain');
    expect(
      planWaterPack(makeStream(), { month: 9, includeTerrain: true }).sections.map((s) => s.key),
    ).not.toContain('terrain');
    const withTopo = planWaterPack(makeStream(), { month: 9, includeTerrain: true, topo: TOPO });
    const terrain = withTopo.sections.find((s) => s.key === 'terrain');
    expect(terrain).toBeDefined();
    expect(terrain!.required).toBe(false);
  });

  it('offers no terrain for waters without an on-device anchor (West-TN ponds)', () => {
    const pond = makeStream({ id: 'west-tn-pond-not-in-geo' });
    expect(waterAnchor(pond.id)).toBeNull();
    const plan = planWaterPack(pond, { month: 9, includeTerrain: true, topo: TOPO });
    expect(plan.sections.map((s) => s.key)).not.toContain('terrain');
  });
});

describe('terrain tiles — bounded, anchored, coverage-scoped', () => {
  it('builds a 2-zoom, 3×3 window of real tile URLs around the anchor', () => {
    const anchor = waterAnchor('caney-fork-river')!;
    const urls = terrainTileUrls(anchor, TOPO);
    expect(urls).toHaveLength(18);
    expect(new Set(urls).size).toBe(18);
    const center = { ...tileForCoordinate(anchor.lon, anchor.lat, 11), z: 11 };
    expect(urls).toContain(`/atlas/topo/hillshade/11/${center.x}/${center.y}.webp`);
    expect(urls.every((u) => u.startsWith('/atlas/topo/hillshade/'))).toBe(true);
    expect(urls.some((u) => u.startsWith('/atlas/topo/hillshade/10/'))).toBe(true);
    // Bounded: never above the manifest's max zoom.
    expect(urls.some((u) => u.startsWith('/atlas/topo/hillshade/12/'))).toBe(false);
  });

  it('respects a manifest with a narrower range and rejects malformed ones', () => {
    const urls = terrainTileUrls({ lat: 35.9, lon: -85.4 }, { pattern: 'h/{z}/{x}/{y}.webp', minZoom: 10, maxZoom: 10 });
    expect(urls).toHaveLength(9);
    expect(parseTopoTileInfo({ hillshade: { pattern: 'nope', minZoom: 1, maxZoom: 2 } })).toBeNull();
    expect(parseTopoTileInfo({ hillshade: { pattern: 'a/{z}/{x}/{y}.webp', minZoom: '7', maxZoom: 11 } })).toBeNull();
    expect(parseTopoTileInfo(null)).toBeNull();
    expect(parseTopoTileInfo({ hillshade: { pattern: 'h/{z}/{x}/{y}.webp', minZoom: 3, maxZoom: 2 } })!.minZoom).toBe(3);
  });
});

describe('network-cluster resolution', () => {
  const manifest = {
    schema: 'trout/nhd-network/1',
    clusters: [
      { id: '0601', file: '0601.geojson', bounds: [-86.5, 35.5, -85.5, 36.5] },
      { id: '0602a', file: '0602a.geojson', bbox: [-84, 35, -83, 36] },
      { broken: true },
    ],
  };

  it('parses bounds and bbox tolerantly, dropping malformed rows', () => {
    const clusters = parseNetworkClusters(manifest);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]!.file).toBe('0601.geojson');
  });

  it('returns the manifest plus covering cluster files for a point inside one', () => {
    const urls = networkClusterUrlsForPoint(parseNetworkClusters(manifest), { lat: 36.09, lon: -85.82 });
    expect(urls).toEqual(['/atlas/network/manifest.json', '/atlas/network/0601.geojson']);
  });

  it('returns nothing when no cluster covers the water', () => {
    expect(networkClusterUrlsForPoint(parseNetworkClusters(manifest), { lat: 30, lon: -90 })).toEqual([]);
  });
});

describe('planTripPack — merge semantics', () => {
  const tailrace = planWaterPack(makeStream(), { month: 9 });
  const freestone = planWaterPack(
    makeStream({
      id: 'little-river',
      waterbodyType: 'river',
      fishery: 'wild',
      regionId: 'tn-east-smokies',
      targetSpecies: undefined,
    }),
    { month: 9 },
  );

  it('merges sections by key with a required-union and deduped URLs', () => {
    const trip = { id: 't1', title: 'September loop' };
    const plan = planTripPack(trip, [tailrace, freestone]);
    expect(plan.id).toBe(tripManifestId('t1'));
    expect(plan.kind).toBe('trip');
    expect(plan.label).toBe('Trip: September loop');
    const keys = plan.sections.map((s) => s.key);
    // 'releases' exists because ONE water needs it — and it is required.
    expect(keys).toContain('releases');
    expect(plan.sections.find((s) => s.key === 'releases')!.required).toBe(true);
    const conditions = plan.sections.find((s) => s.key === 'conditions')!;
    expect(conditions.urls).toEqual([
      '/v1/conditions/latest.json',
      '/v1/fishability/caney-fork-river.json',
    ]);
    const hatch = plan.sections.find((s) => s.key === 'hatch')!;
    expect(hatch.urls).toEqual([
      '/v1/hatch/tn-east-clinch/9.json',
      '/v1/hatch/tn-east-smokies/9.json',
    ]);
    // Shared catalog files appear exactly once in the working set.
    expect(plan.assetUrls.filter((u) => u === '/v1/streams')).toHaveLength(1);
    expect(new Set(plan.assetUrls).size).toBe(plan.assetUrls.length);
  });

  it('an empty water list yields an (honestly empty) trip plan', () => {
    const plan = planTripPack({ id: 't2', title: 'Bare' }, []);
    expect(plan.sections).toEqual([]);
    expect(plan.assetUrls).toEqual([]);
  });
});

describe('plan → manifest input', () => {
  it('starts every section not-ready and never invents bytes', () => {
    const plan = planWaterPack(makeStream(), { month: 9, includeTerrain: true, topo: TOPO });
    const input = toManifestInput(plan);
    expect(input.sections.every((s) => s.ready === false)).toBe(true);
    expect(input.sections.every((s) => s.bytes === undefined)).toBe(true);
    expect(input.manifestVersion).toBe(1);
    expect(input.kind).toBe('water');
    expect(input.assetUrls).toEqual(plan.assetUrls);
    const entry = toPlanIndexEntry(plan);
    expect(entry.sections).toEqual(
      plan.sections.map((s) => ({ key: s.key, urls: s.urls })),
    );
  });
});

describe('cache ownership per URL', () => {
  it('terrain tiles ride the existing CacheFirst topo-cache; everything else is pack cache', () => {
    expect(cacheNameForUrl('/atlas/topo/hillshade/11/66/100.webp')).toBe(PACK_CACHE_NAME);
    expect(cacheNameForUrl('/v1/conditions/latest.json')).toBe(PACK_CACHE_NAME);
    expect(cacheNameForUrl('/atlas/rivers.geojson')).toBe(PACK_CACHE_NAME);
    expect(cacheNameForUrl('/content/taxa.json')).toBe(PACK_CACHE_NAME);
  });
});
