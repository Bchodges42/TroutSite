/* global console, process */
// fix-great-falls-lake.mjs — drop the orphan part from great-falls-lake.
//
// Defect (tasking 2026-09-08, verified against the lake-great-falls NHD take):
// great-falls-lake shipped as a 2-part MultiPolygon:
//   - part 1 (index 0): a shattered decimation artifact of NHDArea piece
//     NHDPlusID 24001400139760 (the Caney Fork valley wide-water polygon,
//     7.47 km², 21 rings / 22,745 vertices in the take). The delivered part
//     kept only 7 rings / 197 vertices scattered 10-40 km up the Caney Fork
//     valley (35.77..35.97 N) — it matches NO real NHD waterbody polygon, and
//     its pool-gorge portion was destroyed by the ring decimation. THE ORPHAN.
//   - part 2 (index 1): a faithful representation of NHDArea piece NHDPlusID
//     24001400139538 (the Collins River arm wide-water, 5.57 km²; delivered
//     8,261 of 8,727 take vertices, bbox identical to the take piece). It
//     carries the ENTIRE Great Falls pool from the dam to the Caney/Collins
//     forks junction — including the reaches where barren-fork-river,
//     collins-river, charles-creek and upper-hills-creek end inside the pool
//     (verified correct, kept).
//
// Method: keep part 2 only (whole rings, no coordinate edits), recompute
// partCount/vertexCount/bounds/areaSqKm, re-derive an interior label anchor,
// and re-measure the lake topology record (dam pool distance, connections).
// Run: node scripts/fix-great-falls-lake.mjs
import {
  commitFeature, _commitTopology, countVerts, geomBBox, _haversine, outwardBounds,
  pointInRings, pointToPolygonM, polyAreaKm2, readRegion,
} from './lib-west-middle-fix.mjs';

const KEEP_INDEX = 1; // the Collins-arm NHDArea piece (NHDPlusID 24001400139538)

const { fc } = readRegion();
const f = fc.features.find((x) => x.properties?.id === 'great-falls-lake');
if (!f) throw new Error('great-falls-lake not found in west-middle.geojson');
if (f.geometry.type === 'Polygon') {
  console.log('great-falls-lake: single-part Polygon present — already fixed, nothing to do');
  process.exit(0);
}
if (f.geometry.type !== 'MultiPolygon') throw new Error(`unexpected geometry ${f.geometry.type}`);
const polys = f.geometry.coordinates;
if (polys.length === 1) {
  console.log('great-falls-lake: single part present — already fixed, nothing to do');
  process.exit(0);
}
if (polys.length !== 2) throw new Error(`expected the documented 2-part geometry, found ${polys.length} parts — refusing to blind-drop`);

const kept = polys[KEEP_INDEX];

// label anchor: keep if inside the kept polygon, else derive an interior point
// (builder interiorAnchor convention: centroid if inside, else grid search)
let anchor = f.properties.labelAnchor;
const inside = (p) => pointInRings(p, kept);
if (!Array.isArray(anchor) || !inside(anchor)) {
  const b = geomBBox([kept[0]]);
  let best = null, bestD = Infinity;
  for (let gx = 0; gx <= 60; gx++) {
    for (let gy = 0; gy <= 60; gy++) {
      const p = [b[0] + ((b[2] - b[0]) * gx) / 60, b[1] + ((b[3] - b[1]) * gy) / 60];
      if (!inside(p)) continue;
      const d = Math.hypot(p[0] - (-85.68), p[1] - 35.79); // pool core vicinity
      if (d < bestD) { bestD = d; best = p; }
    }
  }
  anchor = (best ?? kept[0][0]).map((v) => +v.toFixed(4));
  console.log('labelAnchor recomputed to', anchor);
}

const bbox = geomBBox([kept[0]]);
const areaKm2 = polyAreaKm2({ type: 'Polygon', coordinates: kept });
f.geometry = { type: 'Polygon', coordinates: kept };
f.properties = {
  ...f.properties,
  labelAnchor: anchor,
  bounds: outwardBounds(bbox),
  partCount: 1,
  vertexCount: countVerts(kept),
  areaSqKm: +areaKm2.toFixed(2),
  sourceIds: ['24001400139538'],
};
console.log(`great-falls-lake: kept the Collins-arm piece (${f.properties.vertexCount} verts, ${f.properties.areaSqKm} km²)`);

// topology: re-measure dam pool distance + connections against the kept polygon
const topo = readRegion().topo;
const rec = topo.records.find((r) => r.featureId === 'great-falls-lake');
const patch = {
  sourceIdentifiers: ['24001400139538'],
  deliveredAreaSqKm: f.properties.areaSqKm,
  notes: 'Caney Fork/Collins impoundment above Center Hill Lake at Rock Island; promoted to interactive with catalog record. Fixed 2026-09-08: the orphan part 1 (a shattered decimation artifact of NHDArea NHDPlusID 24001400139760 — 197 scattered sliver vertices vs the 22,745-vertex take piece, pool-gorge portion destroyed) was dropped; the delivered pool is the faithful representation of NHDArea NHDPlusID 24001400139538, which carries the whole pool from the dam to the forks junction and absorbs barren-fork-river, collins-river, charles-creek and upper-hills-creek (unchanged).',
};
if (rec?.dam?.coordinates) {
  patch.damPoolDistanceM = Math.round(pointToPolygonM(rec.dam.coordinates, f.geometry));
}
// connections: re-measure each declared river's closest endpoint
const linesOf = (id) => {
  const g = fc.features.find((x) => x.properties?.id === id)?.geometry;
  if (!g) return null;
  return g.type === 'MultiLineString' ? g.coordinates : g.type === 'LineString' ? [g.coordinates] : null;
};
const connections = {};
for (const rid of ['collins-river', 'caney-fork-upper', 'barren-fork-river', 'charles-creek', 'upper-hills-creek']) {
  const lines = linesOf(rid);
  if (!lines) continue;
  let best = Infinity;
  for (const l of lines) for (const e of [l[0], l[l.length - 1]]) best = Math.min(best, pointToPolygonM(e, f.geometry));
  const near = best <= 150;
  connections[rid] = {
    endpointToLakeM: Math.round(best),
    ok: near,
    informational: !near,
    ...(rid === 'caney-fork-upper' ? { note: 'the previous 20 m connection landed on a sliver of the dropped orphan artifact; the true Caney Fork pool-gorge water is inside the kept Collins-arm piece, whose extent reaches the dam (verified); caney-fork-upper\'s upstream terminus remains documented at its catalog reach end' } : {}),
  };
}
patch.connections = connections;
commitFeature(f, patch);
console.log('connections:', JSON.stringify(connections));
