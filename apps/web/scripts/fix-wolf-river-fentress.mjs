/* global URL, console */
// Rebuild wolf-river-fentress in the east/southeast REGION artifact
// (atlas-sources/verified/east-southeast.geojson + .topology.json) from the
// NHDPlus HR take .atlas-src/nhd/wolf-fentress.geojson (fetched by
// scripts/fetch-nhd-fixes.mjs; envelope scoped to the Fentress/Clay/Pickett
// Counties water — the West Tennessee Wolf River is 4+ degrees away).
// Public domain (USGS).
//
// Defect (audit-s2 CONNECTIVITY-REPORT, confirmed on main): the first-pass
// delivery was trimmed at the Dale Hollow pool margin — 3 strands ending
// 40 m / 68 m / 85 m short of the dale-hollow-lake polygon (2 chunks at
// 250 m stitch, 665 m inter-strand gap) and a dangling headwater end. NHD
// models ONE Wolf River: the welded take yields a single 63.7 km chain whose
// downstream end runs THROUGH the pool on 55800 artificial paths and ends
// INSIDE the delivered dale-hollow-lake polygon (the Obey River pool carries
// the water past Dale Hollow Dam) — same through-pool convention as the
// region's little-tennessee-river.
//
// Headwater finding (investigated, not defect-bridgeable): the named NHD
// 'Wolf River' begins at (36.5262, -84.9010). East of that terminus the next
// flowlines are different-named tributaries (Delk Creek 425-746 m, Pogue /
// Stewart / Jim Creeks) and unnamed reaches >= 425 m away — no same-water
// continuation, so per the no-fabrication rule the headwater end stays at the
// NHD named terminus.
//
// Deterministic + idempotent. Run: node scripts/fix-wolf-river-fentress.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const REGION = new URL('../atlas-sources/verified/east-southeast.geojson', import.meta.url);
const TOPO = new URL('../atlas-sources/verified/east-southeast.topology.json', import.meta.url);
const TAKE = new URL('../.atlas-src/nhd/wolf-fentress.geojson', import.meta.url);
const SNAP = 2e-4; // ~22 m endpoint snap (source is 4 dp ≈ 11 m)
const RETRIEVED = '2026-09-08';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function dM(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const lineLenKm = (line) => { let s = 0; for (let i = 1; i < line.length; i++) s += dM(line[i - 1], line[i]); return s / 1000; };

function weldTracked(segments) {
  const chains = segments.map((s) => ({ pts: s.pts.slice(), ids: [s.id], lenKm: s.lenKm }));
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
            chains[i] = { pts: join(), ids: [...a.ids, ...b.ids], lenKm: a.lenKm + b.lenKm };
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

const fc = JSON.parse(readFileSync(REGION, 'utf8'));
const topo = JSON.parse(readFileSync(TOPO, 'utf8'));
const take = JSON.parse(readFileSync(TAKE, 'utf8'));
const westMiddle = JSON.parse(readFileSync(new URL('../atlas-sources/verified/west-middle.geojson', import.meta.url), 'utf8'));

const segments = [];
let sourceLen = 0;
for (const f of take.features) {
  const g = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const pts of g) {
    segments.push({ pts, id: f.properties.nhdplusid, lenKm: f.properties.lengthkm ?? 0 });
    sourceLen += f.properties.lengthkm ?? 0;
  }
}
const chains = weldTracked(segments).sort((a, b) => lineLenKm(b.pts) - lineLenKm(a.pts));
const main = chains[0];
const dropped = chains.slice(1).map((c) => `${c.pts.length}v ${lineLenKm(c.pts).toFixed(2)}km at (${c.pts[0].map((v) => v.toFixed(4))})`);
const lenKm = lineLenKm(main.pts);

// connection verification against the WEST lane's Dale Hollow pool polygon
const dh = (westMiddle.features ?? []).find((x) => x.properties.id === 'dale-hollow-lake');
if (!dh) throw new Error('dale-hollow-lake not found in west-middle.geojson');
const mouth = main.pts[main.pts.length - 1];
const mouthInside = (() => {
  const polys = dh.geometry.type === 'MultiPolygon' ? dh.geometry.coordinates : [dh.geometry.coordinates];
  const inRing = (pt, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  return polys.some((poly) => inRing(mouth, poly[0]) && !poly.slice(1).some((h) => inRing(mouth, h)));
})();
if (!mouthInside) throw new Error(`mouth ${mouth} is not inside the dale-hollow-lake polygon — refusing to deliver a non-touching end`);

let minX = 180, minY = 90, maxX = -180, maxY = -90;
for (const [x, y] of main.pts) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const bounds = [+minX.toFixed(6), +minY.toFixed(6), +maxX.toFixed(6), +maxY.toFixed(6)];

const f = fc.features.find((x) => x.properties.id === 'wolf-river-fentress');
const oldAnchor = f.properties.labelAnchor;
let anchor = main.pts[0], bd = Infinity;
for (const p of main.pts) { const d = dM(p, oldAnchor); if (d < bd) { bd = d; anchor = p; } }

f.properties = {
  ...f.properties,
  bounds,
  labelAnchor: anchor.map((v) => +v.toFixed(5)),
  source: 'nhd-hr',
  approximate: false,
  partCount: 1,
  vertexCount: main.pts.length,
  lengthKm: +lenKm.toFixed(2),
  sourceIds: [...new Set(main.ids)].sort(),
  sourceRetrieved: RETRIEVED,
  throughLakeIds: ['dale-hollow-lake'],
};
f.geometry = { type: 'MultiLineString', coordinates: [main.pts] };

const rec = topo.records.find((r) => r.featureId === 'wolf-river-fentress');
rec.sourceIdentifiers = [
  `${main.ids.length} named NHD parts welded to 1 chain (Fentress/Clay Counties Wolf River only; nhdplusids pinned in feature sourceIds)`,
];
rec.upstreamFeatureIds = ['wolf-river-fentress (plateau headwaters — NHD named terminus at 36.5262,-84.9010; upstream drainage continues only as different-named tributaries, documented source terminus)'];
rec.downstreamFeatureIds = ['dale-hollow-lake'];
rec.sourceLengthKm = +sourceLen.toFixed(2);
rec.deliveredLengthKm = +lenKm.toFixed(2);
rec.largestConnectionGapMeters = 0;
rec.termini = [];
rec.chainSeparations = { attachments: 1, openEnds: 1, poolMediated: 0, poolMediatedMaxM: null, braid: 0, braidMaxM: null };
rec.midCourseSeams = [];
rec.reachScope = 'full-named-extent';
rec.lengthRatio = +(lenKm / sourceLen).toFixed(3);
rec.verificationState = 'PASS';
rec.notes = `FIX 2026-09-08 (scripts/fix-wolf-river-fentress.mjs): the first-pass delivery was trimmed at the Dale Hollow pool margin (3 strands, 40/68/85 m off the pool polygon, 665 m inter-strand gap). Rebuilt from the NHDPlus HR take as ONE chain that runs through the pool on NHD artificial paths and ends INSIDE the delivered dale-hollow-lake polygon (west-middle lane's pool; the Obey River pool carries the water past the dam). Dropped degenerate micro-connector(s): ${dropped.join('; ') || 'none'}. Headwater end documented at the NHD named terminus (no same-water continuation).`;

writeFileSync(REGION, JSON.stringify(fc, null, 1));
writeFileSync(TOPO, JSON.stringify(topo, null, 1));
console.log(`wolf-river-fentress: rebuilt — 1 chain, ${lenKm.toFixed(2)} km (NHD source ${sourceLen.toFixed(2)} km), ${main.pts.length} verts, ${main.ids.length} reaches`);
console.log(`  mouth inside dale-hollow-lake: ${mouthInside} at ${mouth.map((v) => v.toFixed(5))} · headwater ${main.pts[0].map((v) => v.toFixed(5))}`);
console.log(`  dropped: ${dropped.join(' | ') || 'none'}`);
