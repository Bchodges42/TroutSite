/* global console */
// Build public/atlas/lakes.geojson — the major lakes and reservoirs the
// mapped rivers connect to — from real Census TIGER/Line AREAWATER polygons
// (public domain). Same source family as the river atlas; all geometry comes
// from the source files. GNIS names vary slightly per county, so each lake is
// matched by name fragment and labeled with its common display name.
//
// Run: node scripts/build-lakes.mjs
import { writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open as openShapefile } from 'shapefile';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '..');
const awDir = join(webDir, '.atlas-src', 'awshp');
const outPath = join(webDir, 'public', 'atlas', 'lakes.geojson');

// match fragments (tested against AREAWATER FULLNAME after Census
// abbreviation expansion — TIGER writes "Norris Lk", "Lk Barkley") →
// display name shown on the atlas.
const LAKES = [
  { match: 'center hill', name: 'Center Hill Lake' },
  { match: 'great falls', name: 'Great Falls Lake' },
  { match: 'tims ford', name: 'Tims Ford Lake' },
  { match: 'normandy', name: 'Normandy Lake' },
  { match: 'dale hollow', name: 'Dale Hollow Lake' },
  { match: 'south holston', name: 'South Holston Lake' },
  { match: 'boone lake', name: 'Boone Lake' },
  { match: 'patrick henry', name: 'Fort Patrick Henry Lake' },
  { match: 'watauga lake', name: 'Watauga Lake' },
  { match: 'cherokee lake', name: 'Cherokee Lake' },
  { match: 'douglas lake', name: 'Douglas Lake' },
  { match: 'norris lake', name: 'Norris Lake' },
  { match: 'tellico', name: 'Tellico Lake' },
  { match: 'loudoun', name: 'Fort Loudoun Lake' },
  { match: 'watts bar', name: 'Watts Bar Lake' },
  { match: 'chickamauga', name: 'Chickamauga Lake' },
  { match: 'nickajack', name: 'Nickajack Lake' },
  { match: 'parksville', name: 'Parksville Lake' },
  { match: 'percy priest', name: 'J. Percy Priest Lake' },
  { match: 'old hickory lake', name: 'Old Hickory Lake' },
  { match: 'reelfoot', name: 'Reelfoot Lake' },
  { match: 'kentucky lake', name: 'Kentucky Lake' },
  { match: 'barkley', name: 'Lake Barkley' },
  { match: 'woods reservoir', name: 'Woods Reservoir' },
];

// Same abbreviation expansion as match-rivers-tiger.mjs (TIGER style: Lk, Riv, Frk)
const WORD = { LK: 'LAKE', RIV: 'RIVER', FRK: 'FORK', CRK: 'CREEK', BR: 'BRANCH', RES: 'RESERVOIR' };
function norm(s) {
  return String(s).toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
    .map((w) => WORD[w] ?? w).join(' ');
}

// Vertex budget per lake: AREAWATER polygons are detailed; the atlas only
// needs shoreline character at z≤11. Sequential decimation ≈0.002° (~200 m).
const DECIM = 0.002;
const MAX_VERTS_PER_LAKE = 2600;

function decimate(ring) {
  const out = [];
  let last = null;
  for (const pt of ring) {
    if (!last || Math.abs(pt[0] - last[0]) >= DECIM || Math.abs(pt[1] - last[1]) >= DECIM) {
      out.push([Math.round(pt[0] * 1e4) / 1e4, Math.round(pt[1] * 1e4) / 1e4]);
      last = pt;
    }
  }
  if (out.length < 3) return [];
  // close the ring
  const [fx, fy] = out[0];
  const [lx, ly] = out[out.length - 1];
  if (fx !== lx || fy !== ly) out.push([fx, fy]);
  return out;
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(a / 2);
}

function centroid(ring) {
  let x = 0, y = 0, n = 0;
  for (const pt of ring) { x += pt[0]; y += pt[1]; n++; }
  return [x / n, y / n];
}

const byLake = new Map(); // display name -> { polys: [], verts: 0 }
for (const f of readdirSync(awDir).filter((n) => n.endsWith('.shp'))) {
  const src = await openShapefile(join(awDir, f));
  let rec;
  while ((rec = await src.read()).done === false) {
    const p = rec.value.properties;
    const fullname = String(p.FULLNAME ?? p.GNIS_NAME ?? '');
    if (!fullname) continue;
    const normalized = norm(fullname);
    const lake = LAKES.find((l) => normalized.includes(l.match.toUpperCase()));
    if (!lake) continue;
    const g = rec.value.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    let entry = byLake.get(lake.name);
    if (!entry) { entry = { polys: [], verts: 0 }; byLake.set(lake.name, entry); }
    for (const rings of polys) {
      const [outer, ...holes] = rings;
      const d = decimate(outer);
      if (d.length < 4) continue;
      entry.polys.push([d, ...holes.map(decimate).filter((r) => r.length >= 4)]);
      entry.verts += d.length;
    }
  }
}

const features = [];
for (const [name, { polys }] of byLake) {
  // The size floor applies to the LAKE's largest ring, not each county
  // fragment — reservoirs split across county files must survive.
  let biggestArea = 0;
  for (const rings of polys) {
    const a = ringArea(rings[0]);
    if (a > biggestArea) biggestArea = a;
  }
  if (biggestArea < 0.00008) { console.log(`  skip (too small) ${name}`); continue; } // ≳ 0.8 km²
  let finalVerts = 0;
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  let biggest = null;
  for (const rings of polys) {
    for (const ring of rings) {
      finalVerts += ring.length;
      for (const [x, y] of ring) {
        b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
        b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
      }
    }
    const a = ringArea(rings[0]);
    if (a > biggestArea || !biggest) { biggestArea = a; biggest = rings[0]; }
  }
  // hard cap: thin uniformly if still too dense
  if (finalVerts > MAX_VERTS_PER_LAKE) {
    const stride = Math.ceil(finalVerts / MAX_VERTS_PER_LAKE);
    const thinned = polys.map((rings) => rings.map((ring) => ring.filter((_, i) => i % stride === 0 || i === ring.length - 1)));
    features.push([name, thinned, b, biggest]);
  } else {
    features.push([name, polys, b, biggest]);
  }
}

features.sort((a, b) => a[0].localeCompare(b[0]));
const fc = {
  type: 'FeatureCollection',
  features: features.map(([name, polys, b, biggest]) => ({
    type: 'Feature',
    properties: {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      kind: 'lake',
      bounds: b.map((v) => Math.round(v * 1e4) / 1e4),
      labelAnchor: centroid(biggest).map((v) => Math.round(v * 1e4) / 1e4),
    },
    geometry: { type: 'MultiPolygon', coordinates: polys },
  })),
};
writeFileSync(outPath, `${JSON.stringify(fc)}\n`);
let total = 0;
for (const f of fc.features) {
  const walk = (n) => (Array.isArray(n) && typeof n[0] === 'number' ? 1 : n.reduce((s, c) => s + walk(c), 0));
  total += walk(f.geometry.coordinates);
}
console.log(`lakes.geojson: ${fc.features.length} lakes, ${total} verts`);
for (const f of fc.features) console.log(`  ${f.properties.name}  ${f.properties.bounds.map((v) => v.toFixed(2)).join(',')}`);
