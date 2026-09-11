// Rebuild brush-creek-cocke (canonical-only legacy TIGER LINEARWATER feature)
// from the NHDPlus HR take .atlas-src/nhd/brush-cocke.geojson (fetched by
// scripts/fetch-nhd-fixes.mjs, Cocke-County-scoped envelope). Public domain
// (USGS).
//
// Defect (audit-s2 CONNECTIVITY-REPORT, confirmed on main): the delivered
// feature is 4 disconnected TIGER fragments squeezed into a 0.7 x 2.6 km strip
// near the French Broad (largest internal gap 252 m; mouth ends 41 m / 766 m /
// 1.0 km off the french-broad-river line) — the "sprawl" users reported. NHD
// models ONE Brush Creek (Cocke County, Newport area): a 6.75 km chain from
// the headwaters near (35.9799, -82.9071) to the French Broad confluence at
// (35.9405, -82.9287), which lands 2 m from the delivered french-broad-river
// line. The take's second weld component is a 60 m same-named sliver at the
// envelope's SW corner (35.8485, -82.7565, Great Smoky Mountains park area) —
// an unrelated water, dropped (documented, not merged).
//
// Deterministic + idempotent. Run: node scripts/fix-brush-creek-cocke.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const RIVERS = new URL('../public/atlas/rivers.geojson', import.meta.url);
const TAKE = new URL('../.atlas-src/nhd/brush-cocke.geojson', import.meta.url);
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

const atlas = JSON.parse(readFileSync(RIVERS, 'utf8'));
const take = JSON.parse(readFileSync(TAKE, 'utf8'));

const segments = [];
for (const f of take.features) {
  const g = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const pts of g) segments.push({ pts, id: f.properties.nhdplusid });
}
const chains = weldTracked(segments).sort((a, b) => lineLenKm(b.pts) - lineLenKm(a.pts));
const main = chains[0];
const dropped = chains.slice(1).map((c) => `${c.pts.length}v ${lineLenKm(c.pts).toFixed(2)}km at (${c.pts[0].map((v) => v.toFixed(4))})`);
const lenKm = lineLenKm(main.pts);

// connection verification against the delivered French Broad line
const fb = atlas.features.find((x) => x.properties.id === 'french-broad-river');
let mouthD = Infinity;
for (const end of [main.pts[0], main.pts[main.pts.length - 1]]) {
  (function w(r) { if (typeof r[0] === 'number') { const d = dM(end, r); if (d < mouthD) mouthD = d; } else r.forEach(w); })(fb.geometry.coordinates);
}
if (mouthD > 50) throw new Error(`mouth does not weld to the French Broad (${Math.round(mouthD)} m > 50 m policy)`);

let minX = 180, minY = 90, maxX = -180, maxY = -90;
for (const [x, y] of main.pts) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const bounds = [Math.floor(minX * 1e6) / 1e6, Math.floor(minY * 1e6) / 1e6, Math.ceil(maxX * 1e6) / 1e6, Math.ceil(maxY * 1e6) / 1e6];

const f = atlas.features.find((x) => x.properties.id === 'brush-creek-cocke');
const oldAnchor = f.properties.labelAnchor;
let anchor = main.pts[0], bd = Infinity;
for (const p of main.pts) { const d = dM(p, oldAnchor); if (d < bd) { bd = d; anchor = p; } }

f.geometry = { type: 'MultiLineString', coordinates: [main.pts] };
f.properties = {
  ...f.properties,
  bounds,
  labelAnchor: anchor.map((v) => +v.toFixed(6)),
  source: 'nhd-hr',
  approximate: false,
  partCount: 1,
  vertexCount: main.pts.length,
  lengthKm: +lenKm.toFixed(2),
  sourceIds: [...new Set(main.ids)].sort(),
  sourceRetrieved: RETRIEVED,
  fixSource: `scripts/fix-brush-creek-cocke.mjs ${RETRIEVED}: welded NHDPlus HR take (.atlas-src/nhd/brush-cocke.geojson, Cocke-County-scoped, GNIS 'Brush Creek') into one chain; dropped unrelated same-named envelope-corner sliver(s): ${dropped.join('; ')}`,
};
console.log(`brush-creek-cocke: 4 TIGER parts -> 1 NHD chain · ${lenKm.toFixed(2)} km · ${main.pts.length} verts · ${main.ids.length} reaches`);
console.log(`  mouth -> french-broad-river: ${Math.round(mouthD)} m · bounds ${bounds}`);
console.log(`  dropped: ${dropped.join(' | ') || 'none'}`);
writeFileSync(RIVERS, JSON.stringify(atlas));
console.log('rivers.geojson updated: brush-creek-cocke rebuilt from NHDPlus HR');
