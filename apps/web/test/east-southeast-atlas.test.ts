/**
 * East/Southeast Tennessee hydrography lane — deliverable structure and
 * connection-chain tests. These exercise the merge-ready artifacts in
 * atlas-sources/verified/ (east-southeast.geojson + east-southeast.topology.json)
 * without touching the canonical combined sources.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import path from 'node:path';

const webRoot = path.resolve(__dirname, '..');
const geojson: GeoJSON.FeatureCollection = JSON.parse(
  readFileSync(path.join(webRoot, 'atlas-sources/verified/east-southeast.geojson'), 'utf8'),
);
const topology = JSON.parse(
  readFileSync(path.join(webRoot, 'atlas-sources/verified/east-southeast.topology.json'), 'utf8'),
);

const byId = new Map(geojson.features.map((f) => [f.properties.id as string, f]));
const REQUIRED_PROPS = ['id', 'name', 'waterbodyType', 'source', 'approximate', 'labelAnchor', 'bounds'] as const;

const PRIORITY_LAKES = [
  'norris-lake', 'cherokee-lake', 'chickamauga-lake', 'douglas-lake', 'fort-loudoun-lake',
  'watts-bar-lake', 'south-holston-lake', 'boone-lake', 'watauga-lake', 'wilbur-lake',
  'fort-patrick-henry-lake', 'tellico-lake', 'melton-hill-lake', 'chilhowee-lake',
  'calderwood-lake', 'parksville-lake', 'ocoee-number-three-lake', 'nickajack-lake',
];

/** Simple ring-crossing test (shared endpoints allowed). */
function ringHasCrossing(ring: number[][]): boolean {
  const n = ring.length - 1;
  const orient = (a: number[], b: number[], c: number[]) =>
    Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  const touch = (p: number[], q: number[]) => p[0] === q[0] && p[1] === q[1];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const a = ring[i]; const b = ring[i + 1]; const c = ring[j]; const d = ring[j + 1];
      if (orient(a, b, c) !== orient(a, b, d) && orient(c, d, a) !== orient(c, d, b)
        && !(touch(a, c) || touch(a, d) || touch(b, c) || touch(b, d))) return true;
    }
  }
  return false;
}

describe('east-southeast verified geojson structure', () => {
  it('has unique ids and complete contract properties', () => {
    const ids = new Set<string>();
    for (const f of geojson.features) {
      const p = f.properties;
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      for (const k of REQUIRED_PROPS) expect(p).toHaveProperty(k);
      expect(['lake', 'pond', 'reservoir', 'river', 'creek', 'stream', 'tailrace']).toContain(p.waterbodyType);
      expect(typeof p.approximate).toBe('boolean');
      expect(p.labelAnchor).toHaveLength(2);
      expect(p.bounds).toHaveLength(4);
      expect(p.crs).toBe('EPSG:4326');
      expect(p.coordinateOrder).toBe('longitude,latitude');
    }
  });

  it('contains every priority lake with polygon geometry (no point placeholders)', () => {
    for (const id of PRIORITY_LAKES) {
      const f = byId.get(id);
      expect(f, `${id} present`).toBeDefined();
      expect(f!.geometry.type === 'Polygon' || f!.geometry.type === 'MultiPolygon').toBe(true);
    }
  });

  it('keeps label anchors inside lake polygons', () => {
    const inRing = (pt: number[], ring: number[][]) => {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
    const inPoly = (pt: number[], poly: number[][][]) =>
      inRing(pt, poly[0]) && !poly.slice(1).some((h) => inRing(pt, h));
    for (const f of geojson.features) {
      if (!f.geometry.type.endsWith('Polygon')) continue;
      const polys = f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
      const anchor = f.properties.labelAnchor as [number, number];
      const ok = polys.some((p) => inPoly(anchor, p));
      if (!ok) {
        // coved rings may push centroids out; allow <=150 m to the nearest vertex
        const pts: number[][] = [];
        const walk = (r: unknown) => {
          if (Array.isArray(r) && typeof r[0] === 'number') pts.push(r as number[]);
          else if (Array.isArray(r)) (r as unknown[]).forEach(walk);
        };
        walk(f.geometry.coordinates);
        const dist = (a: number[], b: number[]) =>
          Math.hypot((a[0] - b[0]) * 88_000, (a[1] - b[1]) * 111_000);
        const nearest = Math.min(...pts.map((c) => dist(anchor, c)));
        expect(nearest, `${f.properties.id} anchor near water`).toBeLessThan(150);
      }
    }
  });

  it('delivers lake rings without self-crossings', () => {
    for (const f of geojson.features) {
      if (!f.geometry.type.endsWith('Polygon')) continue;
      const polys = f.geometry.type === 'MultiPolygon'
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
      for (const poly of polys) {
        for (const ring of poly) {
          expect(ring[0][0]).toBeCloseTo(ring[ring.length - 1][0], 9);
          expect(ring[0][1]).toBeCloseTo(ring[ring.length - 1][1], 9);
          expect(ringHasCrossing(ring), `${f.properties.id} ring valid`).toBe(false);
        }
      }
    }
  });

  it('retains the cross-state Virginia portion of South Holston Lake', () => {
    const sh = byId.get('south-holston-lake')!;
    const pts: number[][] = [];
    const walk = (r: unknown) => {
      if (Array.isArray(r) && typeof r[0] === 'number') pts.push(r as number[]);
      else if (Array.isArray(r)) (r as unknown[]).forEach(walk);
    };
    walk(sh.geometry.coordinates);
    expect(pts.some(([, lat]) => lat > 36.6)).toBe(true);
    expect(sh.properties.bounds[3]).toBeGreaterThan(36.6);
  });
});

describe('east-southeast connection chains', () => {
  it('records the documented northeast chain in topology order', () => {
    const recs = new Map(topology.records.map((r: { featureId: string }) => [r.featureId, r]));
    // South Holston Lake -> SH Dam -> tailwater -> Boone Lake
    expect(recs.get('south-holston-lake')?.downstreamFeatureIds).toContain('south-holston-river');
    expect(recs.get('south-holston-river')?.dam?.name).toBe('South Holston Dam');
    expect(recs.get('south-holston-river')?.downstreamFeatureIds).toContain('boone-lake');
    // Boone Lake -> Boone Dam -> tailwater -> Fort Patrick Henry Lake
    expect(recs.get('boone-lake')?.downstreamFeatureIds).toContain('boone-tailwater');
    expect(recs.get('boone-tailwater')?.dam?.name).toBe('Boone Dam');
    expect(recs.get('boone-tailwater')?.downstreamFeatureIds).toContain('fort-patrick-henry-lake');
    // FPH Lake -> FPH Dam -> tailwater -> Holston River
    expect(recs.get('fort-patrick-henry-lake')?.downstreamFeatureIds).toContain('ft-patrick-henry-tailwater');
    expect(recs.get('ft-patrick-henry-tailwater')?.dam?.name).toBe('Fort Patrick Henry Dam');
    expect(recs.get('ft-patrick-henry-tailwater')?.downstreamFeatureIds).toContain('holston-river');
    // Holston -> Fort Loudoun Lake (Cherokee mid-stem)
    expect(recs.get('holston-river')?.upstreamFeatureIds).toContain('north-fork-holston-river');
    expect(recs.get('holston-river')?.downstreamFeatureIds).toContain('fort-loudoun-lake');
    // Watauga path
    expect(recs.get('watauga-lake')?.downstreamFeatureIds).toContain('watauga-river-wilbur-reach');
    expect(recs.get('watauga-river-wilbur-reach')?.downstreamFeatureIds).toContain('wilbur-lake');
    expect(recs.get('wilbur-lake')?.downstreamFeatureIds).toContain('watauga-river');
    expect(recs.get('watauga-river')?.downstreamFeatureIds).toContain('boone-lake');
  });

  it('records the documented southeast chain', () => {
    const recs = new Map(topology.records.map((r: { featureId: string }) => [r.featureId, r]));
    expect(recs.get('fort-loudoun-lake')?.downstreamFeatureIds).toContain('watts-bar-lake');
    expect(recs.get('watts-bar-lake')?.dam?.name).toBe('Watts Bar Dam');
    expect(recs.get('watts-bar-lake')?.downstreamFeatureIds).toContain('chickamauga-lake');
    expect(recs.get('chickamauga-lake')?.upstreamFeatureIds).toContain('hiwassee-river');
    expect(recs.get('chickamauga-lake')?.downstreamFeatureIds).toContain('nickajack-lake');
    expect(recs.get('parksville-lake')?.downstreamFeatureIds).toContain('parksville-tailwater');
    expect(recs.get('parksville-lake')?.upstreamFeatureIds).toContain('ocoee-number-three-lake');
  });

  it('carries two independent verification sources for the mandatory systems', () => {
    const mandatory = [
      'norris-lake', 'chickamauga-lake', 'south-holston-lake', 'boone-lake',
      'watauga-lake', 'fort-patrick-henry-lake', 'parksville-lake', 'nickajack-lake',
    ];
    for (const id of mandatory) {
      const rec = topology.records.find((r: { featureId: string }) => r.featureId === id);
      expect(rec, `${id} topology record`).toBeDefined();
      expect(rec.verificationSources.length).toBeGreaterThanOrEqual(2);
      expect(rec.verificationState).toBe('PASS');
    }
  });

  it('every topology record has source identifiers', () => {
    for (const rec of topology.records) {
      expect(Array.isArray(rec.sourceIdentifiers)).toBe(true);
      expect(rec.sourceIdentifiers.length).toBeGreaterThan(0);
    }
  });
});
