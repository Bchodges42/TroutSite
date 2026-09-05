import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Geometry-continuity gates for the interactive atlas sources
 * (public/atlas/rivers.geojson + the generated riverIndex.json).
 *
 * Provenance for every expected value: docs/GEO-CONTINUITY-AUDIT.md
 * (USGS NHDPlus HR via hydro.nationalmap.gov, Census TIGER/Line — all
 * public domain, EPSG:4326 [longitude, latitude]).
 */

type Pt = [number, number];
interface Ring extends Array<Pt> {}
interface LineFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    waterbodyType: string;
    source: string[] | string;
    approximate: boolean;
    labelAnchor: Pt;
    bounds: [number, number, number, number];
    partCount?: number;
    vertexCount?: number;
    [k: string]: unknown;
  };
  geometry:
    | { type: 'MultiLineString'; coordinates: Pt[][] }
    | { type: 'MultiPolygon'; coordinates: Ring[][][] };
}
interface Collection {
  type: 'FeatureCollection';
  features: LineFeature[];
}

const read = (rel: string): Collection =>
  JSON.parse(readFileSync(resolve(process.cwd(), rel), 'utf8'));

const rivers = read('public/atlas/rivers.geojson');
const index = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/features/map/riverIndex.json'), 'utf8'),
) as Array<{ id: string; name: string; anchor: Pt; bounds: [number, number, number, number] }>;

const byId = new Map(rivers.features.map((f) => [f.properties.id, f]));
const line = (id: string) => {
  const f = byId.get(id);
  if (!f) throw new Error(`missing feature ${id}`);
  if (f.geometry.type !== 'MultiLineString') throw new Error(`${id} is not a line feature`);
  return f as (typeof rivers)['features'][number] & { geometry: { type: 'MultiLineString'; coordinates: Pt[][] } };
};
const poly = (id: string) => {
  const f = byId.get(id);
  if (!f) throw new Error(`missing feature ${id}`);
  if (f.geometry.type !== 'MultiPolygon') throw new Error(`${id} is not a polygon feature`);
  return f as (typeof rivers)['features'][number] & { geometry: { type: 'MultiPolygon'; coordinates: Ring[][][] } };
};

const R_KM = 6371.0088;
const RAD = Math.PI / 180;
const havKm = ([lon1, lat1]: Pt, [lon2, lat2]: Pt) => {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(a));
};

const vertices = (f: LineFeature): Pt[] => {
  const out: Pt[] = [];
  const walk = (c: unknown) => {
    if (Array.isArray(c) && typeof c[0] === 'number') out.push(c as Pt);
    else if (Array.isArray(c)) for (const k of c) walk(k);
  };
  walk(f.geometry.coordinates);
  return out;
};

const minVertexKm = (a: Pt[], b: Pt[]) => {
  let best = Infinity;
  for (const p of a) for (const q of b) best = Math.min(best, havKm(p, q));
  return best;
};

/** Maximal sets of parts stitched end-to-end within `km` (1 km = audit parity). */
const chunks = (parts: Pt[][], km = 1.0): Pt[][][] => {
  const ends = parts.map((p) => [p[0], p[p.length - 1]]);
  const parent = parts.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let i = 0; i < parts.length; i++)
    for (let j = i + 1; j < parts.length; j++)
      for (const ei of [0, 1])
        for (const ej of [0, 1])
          if (havKm(ends[i][ei], ends[j][ej]) <= km) {
            const a = find(i);
            const b = find(j);
            if (a !== b) parent[b] = a;
          }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < parts.length; i++) {
    const r = find(i);
    (groups.get(r) ?? groups.set(r, []).get(r)).push(i);
  }
  return [...groups.values()].map((idx) => idx.map((i) => parts[i]));
};

/** Largest inter-chunk endpoint separation in km (0 when single-chunk). */
const maxChunkSeparationKm = (parts: Pt[][], km = 1.0) => {
  const cs = chunks(parts, km);
  if (cs.length < 2) return 0;
  let worst = 0;
  for (let i = 0; i < cs.length; i++)
    for (let j = i + 1; j < cs.length; j++)
      for (const a of cs[i])
        for (const v of [a[0], a[a.length - 1]])
          for (const b of cs[j])
            for (const w of [b[0], b[b.length - 1]]) worst = Math.max(worst, havKm(v, w));
  return worst;
};

const realBounds = (f: LineFeature): [number, number, number, number] => {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of vertices(f)) {
    w = Math.min(w, x); s = Math.min(s, y); e = Math.max(e, x); n = Math.max(n, y);
  }
  return [w, s, e, n];
};

const pointInPolygon = ([x, y]: Pt, rings: Ring[][]): boolean => {
  let inside = false;
  rings.forEach((polyRings, pi) => {
    polyRings.forEach((ring, ri) => {
      let cnt = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) cnt++;
      }
      const inRing = cnt % 2 === 1;
      if (ri === 0) inside = inside || inRing;
      else if (inRing) inside = false;
    });
  });
  return inside;
};

const CONTRACT_TYPES = ['river', 'creek', 'stream', 'tailrace', 'lake', 'pond', 'reservoir'];

describe('atlas geometry sources: contract validity (all features)', () => {
  it('has unique kebab-case ids and contract-legal waterbodyType values', () => {
    const seen = new Set<string>();
    for (const f of rivers.features) {
      const p = f.properties;
      expect(p.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(seen.has(p.id)).toBe(false);
      seen.add(p.id);
      expect(CONTRACT_TYPES).toContain(p.waterbodyType);
      expect(typeof p.approximate).toBe('boolean');
      expect(p.source).toBeTruthy();
      expect(p.name).toBeTruthy();
    }
  });

  it('stores only finite, ordered EPSG:4326 coordinates inside Tennessee', () => {
    for (const f of rivers.features) {
      for (const [x, y] of vertices(f)) {
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThan(-90.6);
        expect(x).toBeLessThan(-81.3);
        expect(y).toBeGreaterThan(34.9);
        expect(y).toBeLessThan(36.8);
      }
    }
  });

  it('declares bounds that contain every coordinate', () => {
    for (const f of rivers.features) {
      const [w, s, e, n] = f.properties.bounds;
      expect(w).toBeLessThan(e);
      expect(s).toBeLessThan(n);
      const [rw, rs, re, rn] = realBounds(f);
      expect(w).toBeLessThanOrEqual(rw + 5e-4);
      expect(s).toBeLessThanOrEqual(rs + 5e-4);
      expect(e).toBeGreaterThanOrEqual(re - 5e-4);
      expect(n).toBeGreaterThanOrEqual(rn - 5e-4);
    }
  });

  it('places every labelAnchor on or inside the represented feature', () => {
    for (const f of rivers.features) {
      const anchor = f.properties.labelAnchor;
      if (f.geometry.type === 'MultiPolygon') {
        expect(pointInPolygon(anchor, f.geometry.coordinates)).toBe(true);
      } else {
        const best = Math.min(...vertices(f).map((v) => havKm(v, anchor)));
        expect(best).toBeLessThanOrEqual(1.5);
      }
    }
  });

  it('uses valid GeoJSON nesting (MultiPolygon depth 4, MultiLineString depth 3)', () => {
    const depth = (c: unknown): number => {
      let d = 0;
      let x: unknown = c;
      while (Array.isArray(x)) {
        d++;
        x = x[0];
      }
      return d;
    };
    for (const f of rivers.features) {
      if (f.geometry.type === 'MultiPolygon') expect(depth(f.geometry.coordinates)).toBe(4);
      if (f.geometry.type === 'MultiLineString') expect(depth(f.geometry.coordinates)).toBe(3);
    }
  });

  it('has no exact duplicate parts across features (double-drawn reaches)', () => {
    const seen = new Map<string, string>();
    for (const f of rivers.features) {
      if (f.geometry.type !== 'MultiLineString') continue;
      for (const part of f.geometry.coordinates) {
        const key = JSON.stringify(part);
        const prior = seen.get(key);
        if (prior) throw new Error(`part duplicated between ${prior} and ${f.properties.id}`);
        seen.set(key, f.properties.id);
      }
    }
  });

  it('has no implausible (>3 km) jumps inside any single part', () => {
    for (const f of rivers.features) {
      if (f.geometry.type !== 'MultiLineString') continue;
      // mississippi-river (2-part boundary band, up-to-4.7 km chords at the
      // KY-Bend notch) and tennessee-river (B15-documented 3 welded NHDPlus
      // HR members, 3.0-3.6 km chords) are documented coarse welds, not
      // corrupted joins. Every other feature stays at 3 km.
      const coarseWeld = f.properties.id === 'mississippi-river' || f.properties.id === 'tennessee-river';
      for (const part of f.geometry.coordinates)
        for (let i = 1; i < part.length; i++) {
          const d = havKm(part[i - 1], part[i]);
          if (coarseWeld) expect(d).toBeLessThanOrEqual(5);
          else expect(d).toBeLessThanOrEqual(3);
        }
    }
  });

  it('matches the generated riverIndex exactly (id, name, anchor, bounds)', () => {
    expect(index.length).toBe(rivers.features.length);
    const geoIds = new Set(rivers.features.map((f) => f.properties.id));
    for (const entry of index) {
      expect(geoIds.has(entry.id)).toBe(true);
      const p = byId.get(entry.id)!.properties;
      expect(entry.name).toBe(p.name);
      expect(entry.anchor).toEqual(p.labelAnchor);
      expect(entry.bounds).toEqual(p.bounds);
    }
    const idxIds = new Set(index.map((e) => e.id));
    for (const f of rivers.features) expect(idxIds.has(f.properties.id)).toBe(true);
  });
});

describe('Stones River / J. Percy Priest system continuity', () => {
  // True East/West Fork meeting point — NHDPlus HR confluence node, verified
  // 2026-09-04 (both catalog forks already terminate exactly here).
  const CONFLUENCE: Pt = [-86.4587, 35.9859];

  it('brings both forks together at the real confluence', () => {
    const east = vertices(line('east-fork-stones-river'));
    const west = vertices(line('west-fork-stones-river'));
    expect(minVertexKm(east, west)).toBeLessThanOrEqual(0.05);
    expect(minVertexKm(east, [CONFLUENCE])).toBeLessThanOrEqual(0.1);
    expect(minVertexKm(west, [CONFLUENCE])).toBeLessThanOrEqual(0.1);
    expect(chunks(line('east-fork-stones-river').geometry.coordinates).length).toBe(1);
    expect(chunks(line('west-fork-stones-river').geometry.coordinates).length).toBe(1);
  });

  it('carries a Stones River centerline from the fork confluence through the reservoir to the dam', () => {
    const stones = line('stones-river');
    const verts = vertices(stones);
    expect(chunks(stones.geometry.coordinates).length).toBe(1);
    // reaches the East/West Fork meeting point
    expect(minVertexKm(verts, [CONFLUENCE])).toBeLessThanOrEqual(0.1);
    // continues through the J. Percy Priest pool (centerline vertices inside it)
    const lake = poly('j-percy-priest-lake').geometry.coordinates;
    const inside = verts.filter((v) => pointInPolygon(v, lake)).length;
    expect(inside).toBeGreaterThan(20);
    // and tops out at the dam (lake north tip, lat ~36.163)
    const northMost = Math.max(...verts.map((v) => v[1]));
    expect(northMost).toBeGreaterThan(36.14);
  });

  it('keeps the tailwater connected to the lake north tip', () => {
    const tail = vertices(line('stones-river'));
    const lakeVerts = vertices(poly('j-percy-priest-lake'));
    expect(minVertexKm(tail, lakeVerts)).toBeLessThanOrEqual(0.05);
  });
});

describe('Sinking Creek (Wilson County) regression', () => {
  it('is a single continuous component', () => {
    const parts = line('sinking-creek-wilson').geometry.coordinates;
    expect(chunks(parts).length).toBe(1);
    expect(maxChunkSeparationKm(parts)).toBe(0);
  });

  it('contains only the Lebanon/Don Fox Park creek (GNIS 01270380) — no fused fragments', () => {
    // The catalog water is the TWRA winter-program creek through west Lebanon.
    // Fragment 01303641 (a different Sinking Creek, lon > -86.34) and the
    // Rutherford County creek ending at J. Percy Priest (lon < -86.42) were
    // removed, not connected — 12.15 km apart and 3.7 km apart respectively.
    for (const [x] of vertices(line('sinking-creek-wilson'))) {
      expect(x).toBeGreaterThan(-86.315);
      expect(x).toBeLessThan(-86.285);
    }
    const anchor = byId.get('sinking-creek-wilson')!.properties.labelAnchor;
    // label anchor sits on the stocked reach near Don Fox Community Park
    expect(havKm(anchor, [-86.29, 36.205])).toBeLessThanOrEqual(1);
  });

  it('uses the contract waterbodyType (creek, not the catalog-side "spring")', () => {
    expect(byId.get('sinking-creek-wilson')!.properties.waterbodyType).toBe('creek');
  });
});

describe('reach-gate overlap regressions', () => {
  it('duck-river-tailwater and duck-river-lower share no geometry', () => {
    const a = new Set(line('duck-river-tailwater').geometry.coordinates.map((p) => JSON.stringify(p)));
    for (const p of line('duck-river-lower').geometry.coordinates) expect(a.has(JSON.stringify(p))).toBe(false);
  });

  it('elk-river and elk-river-lower share no geometry', () => {
    const a = new Set(line('elk-river').geometry.coordinates.map((p) => JSON.stringify(p)));
    for (const p of line('elk-river-lower').geometry.coordinates) expect(a.has(JSON.stringify(p))).toBe(false);
  });
});
