// Rebuild horse-creek-greene in the east/southeast REGION artifact
// (atlas-sources/verified/east-southeast.geojson + .topology.json) from the
// NHDPlus HR take .atlas-src/nhd/horse-greene.geojson (fetched by
// scripts/fetch-nhd-fixes.mjs, envelope capped at 36.22 N). Public domain (USGS).
//
// Defect (audit-s2 CONNECTIVITY-REPORT, confirmed on main): the first-pass
// weld fused the Greene County Horse Creek with an UNRELATED same-named Horse
// Creek in Washington County (Kingsport area, lat 36.42-36.53, mouth at the
// Fort Patrick Henry tailwater) — the delivered feature sprawled 28.83 km
// across two waters (5 parts, 4 dangling ends), and its topology record
// documented the wrong creek's mouth as the Nolichucky terminus.
//
// Fix: the county-scoped take welds to ONE chain (31 named reaches, all GNIS
// 'Horse Creek') from the Cherokee NF headwaters (36.0683, -82.6331) to the
// Nolichucky confluence (36.1644, -82.7108), which ends 6 m from the delivered
// nolichucky-river line. Washington County water is never fetched.
//
// Deterministic + idempotent. Run: node scripts/fix-horse-creek-greene.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const REGION = new URL('../atlas-sources/verified/east-southeast.geojson', import.meta.url);
const TOPO = new URL('../atlas-sources/verified/east-southeast.topology.json', import.meta.url);
const TAKE = new URL('../.atlas-src/nhd/horse-greene.geojson', import.meta.url);
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
if (chains.length !== 1) throw new Error(`Horse Creek take welded to ${chains.length} chains (expected 1) — refusing to guess`);
const chain = chains[0];
const lenKm = lineLenKm(chain.pts);

// connection verification against the delivered Nolichucky line
const nol = fc.features.find((x) => x.properties.id === 'nolichucky-river');
let mouthD = Infinity;
for (const end of [chain.pts[0], chain.pts[chain.pts.length - 1]])
  for (const p of (nol.geometry.type === 'MultiLineString' ? nol.geometry.coordinates : [nol.geometry.coordinates]).flat())
    mouthD = Math.min(mouthD, dM(end, p));
if (mouthD > 50) throw new Error(`mouth does not weld to the Nolichucky (${Math.round(mouthD)} m > 50 m policy)`);

let minX = 180, minY = 90, maxX = -180, maxY = -90;
for (const [x, y] of chain.pts) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const bounds = [+minX.toFixed(6), +minY.toFixed(6), +maxX.toFixed(6), +maxY.toFixed(6)];

const f = fc.features.find((x) => x.properties.id === 'horse-creek-greene');
const oldAnchor = f.properties.labelAnchor;
let anchor = chain.pts[0], bd = Infinity;
for (const p of chain.pts) { const d = dM(p, oldAnchor); if (d < bd) { bd = d; anchor = p; } }
// the old anchor sat on the removed wrong-creek chains; if it was far away,
// anchor the label at the chain's middle vertex instead (on the water)
if (bd > 500) anchor = chain.pts[Math.floor(chain.pts.length / 2)];

f.properties = {
  ...f.properties,
  bounds,
  labelAnchor: anchor.map((v) => +v.toFixed(5)),
  source: 'nhd-hr',
  approximate: false,
  partCount: 1,
  vertexCount: chain.pts.length,
  lengthKm: +lenKm.toFixed(2),
  sourceIds: [...new Set(chain.ids)].sort(),
  sourceRetrieved: RETRIEVED,
};
f.geometry = { type: 'MultiLineString', coordinates: [chain.pts] };

const rec = topo.records.find((r) => r.featureId === 'horse-creek-greene');
rec.sourceIdentifiers = [
  `${chain.ids.length} named NHD parts welded to 1 chain (Greene County only; nhdplusids pinned in feature sourceIds)`,
];
rec.upstreamFeatureIds = ['horse-creek-greene (Cherokee NF headwaters)'];
rec.downstreamFeatureIds = ['nolichucky-river'];
rec.sourceLengthKm = +sourceLen.toFixed(2);
rec.deliveredLengthKm = +lenKm.toFixed(2);
rec.largestConnectionGapMeters = 0;
rec.termini = [];
rec.chainSeparations = { attachments: 1, openEnds: 1, poolMediated: 0, poolMediatedMaxM: null, braid: 0, braidMaxM: null };
rec.midCourseSeams = [];
rec.reachScope = 'full-named-extent';
rec.lengthRatio = +(lenKm / sourceLen).toFixed(3);
rec.verificationState = 'PASS';
rec.notes = 'FIX 2026-09-08 (scripts/fix-horse-creek-greene.mjs): the first-pass weld fused the Greene County Horse Creek with an unrelated same-named Washington County Horse Creek (lat 36.42-36.53, Holston/Fort Patrick Henry drainage) fetched whole-part through a too-wide envelope — 5 chains sprawled 28.83 km. Rebuilt from a county-scoped NHDPlus HR take (envelope capped at 36.22 N): ONE chain, Cherokee NF headwaters to the Nolichucky confluence, mouth welded to the delivered nolichucky-river line.';

writeFileSync(REGION, JSON.stringify(fc, null, 1));
writeFileSync(TOPO, JSON.stringify(topo, null, 1));
console.log(`horse-creek-greene: rebuilt — 1 chain, ${lenKm.toFixed(2)} km (NHD source ${sourceLen.toFixed(2)} km), ${chain.pts.length} verts, ${chain.ids.length} reaches`);
console.log(`  mouth -> nolichucky-river: ${Math.round(mouthD)} m · bounds ${bounds} · labelAnchor ${anchor.map((v) => v.toFixed(5))}`);
