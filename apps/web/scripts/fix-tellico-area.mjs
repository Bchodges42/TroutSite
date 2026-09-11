// Rebuild tellico-river + citico-creek (canonical-only legacy TIGER LINEARWATER
// features) from the NHDPlus HR takes in .atlas-src/nhd/{tellico,citico}.geojson
// (fetched by scripts/fetch-nhd-fixes.mjs). Public domain (USGS).
//
// Defects fixed (audit-s2 CONNECTIVITY-REPORT, confirmed on main):
// - tellico-river: 6 TIGER parts with a 1.46 km internal hole and a lower end
//   2.68 km off the Tellico Lake shoreline. NHD models ONE Tellico River
//   (GNIS 01648176, 165 reaches): free-flowing river from the NC line at
//   Tellico Plains plus 55800 artificial paths carrying the name up the
//   Tellico arm of Tellico Lake to its Little Tennessee confluence at
//   (-84.2415, 35.5109). The weld yields one connected chain; the pool carries
//   the water onward (little-tennessee-river through-route, same convention as
//   the east region artifact). The single vertex of the chain that lies across
//   the TN line (NC, Unicoi crest) is trimmed per the little-tennessee-river
//   state-cut precedent.
// - citico-creek: 12 internal TIGER fragments (largest gap 5.52 km) and a
//   699 m near-miss to the lake. NHD models ONE Citico Creek (50 reaches)
//   flowing north into the Chilhowee pool of Tellico Lake (the Little
//   Tennessee arm); its welded chain ends EXACTLY on a
//   little-tennessee-river through-pool vertex (0 m) and 178 m from the
//   delivered Tellico Lake polygon (NHD pool-shoreline mapping margin).
//
// Deterministic + idempotent: output depends only on the two take files.
// Run: node scripts/fix-tellico-area.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const RIVERS = new URL('../public/atlas/rivers.geojson', import.meta.url);
const TAKES = {
  'tellico-river': new URL('../.atlas-src/nhd/tellico.geojson', import.meta.url),
  'citico-creek': new URL('../.atlas-src/nhd/citico.geojson', import.meta.url),
};
const SNAP = 2e-4; // ~22 m endpoint snap (source geometry is 4 dp ≈ 11 m)
const RETRIEVED = '2026-09-08';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function dM(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const lineLenKm = (line) => { let s = 0; for (let i = 1; i < line.length; i++) s += dM(line[i - 1], line[i]); return s / 1000; };

/** Weld segments into maximal chains, tracking the nhdplusids that built each. */
function weldTracked(segments) {
  const chains = segments.map((s) => ({ pts: s.pts.slice(), ids: [s.id] }));
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < chains.length; i++) {
      for (let j = i + 1; j < chains.length; j++) {
        const a = chains[i], b = chains[j];
        const combos = [
          [a.pts[a.pts.length - 1], b.pts[0], () => [...a.pts, ...b.pts.slice(1)]],
          [a.pts[a.pts.length - 1], b.pts[b.pts.length - 1], () => [...a.pts, ...b.pts.reverse().slice(1)]],
          [a.pts[0], b.pts[b.pts.length - 1], () => [...b.pts, ...a.pts.slice(1)]],
          [a.pts[0], b.pts[0], () => [...b.pts.reverse(), ...a.pts.slice(1)]],
        ];
        for (const [p, q, join] of combos) {
          if (dist(p, q) <= SNAP) {
            chains[i] = { pts: join(), ids: [...a.ids, ...b.ids] };
            chains.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
  }
  return chains;
}

function ptInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function ptInGeom(pt, geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  for (const poly of polys) {
    if (ptInRing(pt, poly[0]) && !poly.slice(1).some((h) => ptInRing(pt, h))) return true;
  }
  return false;
}

const atlas = JSON.parse(readFileSync(RIVERS, 'utf8'));
const tnBoundary = JSON.parse(readFileSync(new URL('../public/atlas/tn-boundary.geojson', import.meta.url), 'utf8')).features[0].geometry;
const before = {};
for (const id of Object.keys(TAKES)) {
  const f = atlas.features.find((x) => x.properties.id === id);
  before[id] = { parts: f.geometry.coordinates.length, vertices: f.properties.vertexCount };
}

for (const [id, takeUrl] of Object.entries(TAKES)) {
  const take = JSON.parse(readFileSync(takeUrl, 'utf8'));
  const segments = [];
  for (const f of take.features) {
    const g = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const pts of g) segments.push({ pts, id: f.properties.nhdplusid });
  }
  const chains = weldTracked(segments).sort((a, b) => lineLenKm(b.pts) - lineLenKm(a.pts));
  const main = chains[0];
  // state cut: drop the contiguous leading run of vertices outside TN (the
  // Tellico headwater salient across the Unicoi crest into NC) — the
  // little-tennessee-river precedent of state-cutting cross-state named water
  let pts = main.pts.slice();
  const cutFrom = pts.findIndex((p) => ptInGeom(p, tnBoundary));
  let cutNote = '';
  if (cutFrom > 0 && cutFrom < pts.length / 2) {
    pts = pts.slice(cutFrom);
    cutNote = `; state cut at the TN line (dropped the ${cutFrom}-vertex NC headwater run, little-tennessee-river precedent)`;
  }
  const lenKm = lineLenKm(pts);
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const bounds = [Math.floor(minX * 1e6) / 1e6, Math.floor(minY * 1e6) / 1e6, Math.ceil(maxX * 1e6) / 1e6, Math.ceil(maxY * 1e6) / 1e6];

  // connection verification against the delivered pool
  const lake = atlas.features.find((x) => x.properties.id === 'tellico-lake');
  const littleT = atlas.features.find((x) => x.properties.id === 'little-tennessee-river');
  const nearest = (pt, geom) => {
    let b = Infinity;
    (function w(r) { if (typeof r[0] === 'number') { const d = dM(pt, r); if (d < b) b = d; } else r.forEach(w); })(geom.coordinates);
    return b;
  };
  const endLake = Math.min(nearest(pts[0], lake.geometry), nearest(pts[pts.length - 1], lake.geometry));
  const endLakeInside = ptInGeom(pts[0], lake.geometry) || ptInGeom(pts[pts.length - 1], lake.geometry);
  const endLittleT = Math.min(nearest(pts[0], littleT.geometry), nearest(pts[pts.length - 1], littleT.geometry));

  // label anchor: keep the previous anchor position (nearest chain vertex keeps
  // the label where the catalog had it, on the free-flowing reach)
  const f = atlas.features.find((x) => x.properties.id === id);
  const oldAnchor = f.properties.labelAnchor;
  let anchor = pts[0], bd = Infinity;
  for (const p of pts) { const d = dM(p, oldAnchor); if (d < bd) { bd = d; anchor = p; } }

  f.geometry = { type: 'MultiLineString', coordinates: [pts] };
  f.properties = {
    ...f.properties,
    bounds,
    labelAnchor: anchor.map((v) => +v.toFixed(6)),
    source: 'nhd-hr',
    approximate: false,
    partCount: 1,
    vertexCount: pts.length,
    lengthKm: +lenKm.toFixed(2),
    sourceIds: [...new Set(main.ids)].sort(),
    sourceRetrieved: RETRIEVED,
    throughLakeIds: ['tellico-lake'],
    fixSource: `scripts/fix-tellico-area.mjs ${RETRIEVED}: welded NHDPlus HR take (.atlas-src/nhd/${id.startsWith('tellico') ? 'tellico' : 'citico'}.geojson, GNIS-matched reaches incl. 55800 artificial paths) into one connected chain${cutNote}`,
  };
  console.log(`${id}: ${before[id].parts} TIGER parts -> 1 NHD chain · ${lenKm.toFixed(1)} km · ${pts.length} verts · ${main.ids.length} reaches`);
  console.log(`  bounds ${bounds}`);
  console.log(`  lower end -> tellico-lake: ${endLakeInside ? 'INSIDE' : Math.round(endLake) + ' m'} · -> little-tennessee-river: ${Math.round(endLittleT)} m`);
  console.log(`  dropped chains: ${chains.length - 1} (degenerate NHD micro-connectors / up-pool main-stem path owned by little-tennessee-river)`);
}

writeFileSync(RIVERS, JSON.stringify(atlas));
console.log('rivers.geojson updated: tellico-river + citico-creek rebuilt from NHDPlus HR');
