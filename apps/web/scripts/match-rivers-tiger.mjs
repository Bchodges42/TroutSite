// Match Trout's 92 streams to real TIGER/Line linear-water geometry.
// REAL DATA ONLY: U.S. Census Bureau TIGER/Line 2024 LINEARWATER, Tennessee
// (public domain). No synthetic coordinates anywhere in this pipeline.
// Run: node scripts/match-rivers-tiger.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open as openShapefile } from 'shapefile';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '..');
const srcDir = join(webDir, '.atlas-src', 'shp');
const outDir = join(webDir, '.atlas-src', 'out');
mkdirSync(outDir, { recursive: true });

// ---- load streams catalog ----
const packPath = join(webDir, '..', '..', 'packages', 'content', 'dist', 'pack', 'streams.json');
const pack = JSON.parse(readFileSync(packPath, 'utf8'));
const streams = pack.streams ?? pack;
console.log(`streams: ${streams.length}`);

// ---- load county bboxes (real Census cartographic geometry) ----
const counties = JSON.parse(readFileSync(join(outDir, 'tn-counties.geojson'), 'utf8'));
const countyBox = new Map(); // upper(name) -> [minLon,minLat,maxLon,maxLat]
function walk(node, cb) {
  if (Array.isArray(node) && typeof node[0] === 'number') { cb(node); return; }
  if (Array.isArray(node)) for (const c of node) walk(c, cb);
}
for (const f of counties.features) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  walk(f.geometry.coordinates, ([x, y]) => {
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
    b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
  });
  countyBox.set(String(f.properties.NAME).toUpperCase(), b);
}

// ---- TIGER name normalization ----
const WORD = { RIV: 'RIVER', R: 'RIVER', CRK: 'CREEK', CR: 'CREEK', FRK: 'FORK', FK: 'FORK', BR: 'BRANCH', E: 'EAST', W: 'WEST', N: 'NORTH', S: 'SOUTH', SULFUR: 'SULPHUR', WHITEOAK: 'WHITE OAK' };
const GENERIC = new Set(['RIVER', 'CREEK', 'FORK', 'BRANCH', 'RUN', 'BROOK', 'PRONG']);
function clean(s) {
  return String(s).toUpperCase()
    .replace(/['’`]/g, '') // possessives: DADDY'S -> DADDYS
    .replace(/\bMC\s+(?=[A-Z])/g, 'MC') // MC CUTCHEON -> MCCUTCHEON
    .replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
    .map((w) => WORD[w] ?? w);
}
function normTiger(fullname) { return clean(fullname).join(' '); }
function normOurs(name) { return clean(name.split('(')[0]).join(' '); }
function stem(normed) {
  const t = normed.split(' ');
  while (t.length > 1 && GENERIC.has(t[t.length - 1])) t.pop();
  return t.join(' ');
}
// Tailwater entities reuse their parent river's real geometry (same water,
// different managed reach — recorded in the validation report, not invented).
const PARENT = {
  'boone-tailwater': 'SOUTH FORK HOLSTON RIVER',
  'ft-patrick-henry-tailwater': 'SOUTH FORK HOLSTON RIVER',
  'parksville-tailwater': 'OCOEE RIVER',
};
function countyHint(name) {
  const m = name.match(/\(([^)]+)\s+County\)/i);
  return m ? m[1].toUpperCase() : null;
}

// ---- read all county shapefiles ----
const { readdirSync } = await import('node:fs');
const shpFiles = readdirSync(srcDir).filter((f) => f.endsWith('.shp'));
console.log(`shapefiles: ${shpFiles.length}`);
const segs = []; // {name, norm, mtfcc, countyFips, coords, bbox}
for (const f of shpFiles) {
  const countyFips = f.slice(8, 13);
  const src = await openShapefile(join(srcDir, f));
  let rec;
  while ((rec = await src.read()).done === false) {
    const p = rec.value.properties;
    if (!p.FULLNAME) continue;
    if (p.MTFCC !== 'H3010' && p.MTFCC !== 'H3013') continue;
    const g = rec.value.geometry;
    if (!g || (g.type !== 'LineString' && g.type !== 'MultiLineString')) continue;
    const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const line of lines) for (const [x, y] of line) {
      b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
      b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
    }
    segs.push({ name: p.FULLNAME, norm: normTiger(p.FULLNAME), mtfcc: p.MTFCC, countyFips, lines, bbox: b });
  }
}
console.log(`named natural segments: ${segs.length}`);

// Approximate region windows [minLon,minLat,maxLon,maxLat] — used ONLY to
// discard same-named waters in far parts of the state (e.g. the many "Cane
// Creeks"). Geometry always comes from the source files, never from these.
const REGION_WINDOW = {
  'tn-northeast-watauga': [-82.7, 35.9, -81.8, 36.7],
  'tn-east-holston': [-83.3, 36.1, -81.9, 36.7],
  'tn-east-clinch': [-84.3, 36.0, -82.9, 36.7],
  'tn-east-pigeon-frenchbroad': [-83.7, 35.5, -82.7, 36.3],
  'tn-east-smokies': [-84.0, 35.4, -83.2, 35.9],
  'tn-se-hiwassee': [-85.1, 34.9, -84.2, 35.7],
  'tn-cumberland-plateau': [-85.3, 35.8, -84.4, 36.7],
  'tn-upper-cumberland': [-85.9, 36.2, -85.0, 36.7],
  'tn-middle-caney-fork': [-86.1, 35.5, -85.3, 36.2],
  'tn-middle-duck-elk': [-87.0, 34.9, -85.7, 35.7],
  'tn-middle-nashville': [-87.2, 35.9, -86.0, 36.7],
};
// Explicit reach aliases: the stocked reach name differs from the mapped
// water name (same county, name containment). Recorded in validation.
const ALIAS = {
  'upper-hills-creek': 'HILLS CREEK', // upper reach of Warren County Hills Creek
};
const KNOWN_COUNTY = {
  'mccutcheon-creek': ['MAURY'],
  'richardson-byrd-creek': ['HANCOCK'],
  'barren-fork-river': ['WARREN', 'COFFEE'],
  'upper-hills-creek': ['WARREN'],
  'hurricane-creek': ['HOUSTON', 'HUMPHREYS'],
  'little-buffalo-river': ['LAWRENCE', 'LEWIS'],
  'white-oak-creek': ['HOUSTON', 'HUMPHREYS', 'STEWART'],
  'puncheon-camp-creek': ['GRAINGER'],
  'mill-creek-overton': ['OVERTON'],
  'clear-fork': ['MORGAN', 'SCOTT'],
  'shoal-creek': ['LAWRENCE'],
  'salt-lick-creek': ['MACON'],
  'sulfur-fork-creek': ['ROBERTSON', 'SUMNER'],
  'horse-creek-greene': ['GREENE'],
  'citico-creek': ['MONROE'],
  'charles-creek': ['WARREN'],
  'cane-creek': ['BLEDSOE', 'VAN BUREN', 'HICKMAN', 'PERRY'],
  'east-fork-stones-river': ['RUTHERFORD', 'CANNON'],
};
const QUALIFIER = new Set(['EAST', 'WEST', 'NORTH', 'SOUTH', 'UPPER', 'LOWER', 'MIDDLE', 'LITTLE', 'BIG', 'OLD']);

// index by normalized name AND by stem
const byName = new Map();
const byStem = new Map();
for (const s of segs) {
  if (!byName.has(s.norm)) byName.set(s.norm, []);
  byName.get(s.norm).push(s);
  const st = stem(s.norm);
  if (!byStem.has(st)) byStem.set(st, []);
  byStem.get(st).push(s);
}

function boxesOverlap(a, b, pad = 0.02) {
  return a[0] - pad <= b[2] && a[2] + pad >= b[0] && a[1] - pad <= b[3] && a[3] + pad >= b[1];
}

const results = [];
const nameIndex = [...byName.keys()];
for (const st of streams) {
  const want = ALIAS[st.id] ?? PARENT[st.id] ?? normOurs(st.name);
  const wantStem = stem(want);
  const hint = countyHint(st.name) ?? KNOWN_COUNTY[st.id] ?? null;
  const strict = Object.hasOwn(KNOWN_COUNTY, st.id);
  // candidate pool: exact name, plus stem variants (TIGER often drops the
  // generic: "Barren Frk", "Clear Fork Riv" for CLEAR FORK).
  let pool = byName.get(want) ?? [];
  let how = 'exact';
  if (!pool.length && byStem.get(wantStem)) {
    pool = byStem.get(wantStem).filter((s) => stem(s.norm) === wantStem);
    how = `stem:${wantStem}`;
  }
  let cands = pool;
  if (strict && pool.length) {
    // strict streams also accept stem-sibling names before county filtering
    // (e.g. CLEAR FORK matches "Clear Frk" exactly and "Clear Fork Riv" by stem)
    const sibs = (byStem.get(wantStem) ?? []).filter((s) => stem(s.norm) === wantStem);
    const seen = new Set(pool);
    cands = [...pool, ...sibs.filter((s) => !seen.has(s))];
    if (cands.length > pool.length) how += '+stem-sibs';
  }
  if (!cands.length) {
    // constrained subset: every want-token appears in the candidate, and the
    // candidate's stem — after stripping leading qualifiers — must equal the
    // want stem. This rejects "East Fork Obey River" for want OBEY RIVER.
    const toks = want.split(' ');
    const sub = [];
    for (const n of nameIndex) {
      const nt = n.split(' ');
      if (!toks.every((t) => nt.includes(t))) continue;
      const cn = stem(n).split(' ');
      while (cn.length > 1 && QUALIFIER.has(cn[0])) cn.shift();
      if (cn.join(' ') === wantStem) sub.push(n);
    }
    sub.sort((a, b) => a.length - b.length);
    if (sub.length) { cands = byName.get(sub[0]); how = `subset:${sub[0]}`; }
  }
  // county filter: segment CENTROID must fall in the hinted/listed county.
  // (Bbox overlap is too loose near county lines.)
  const counties = hint ? (Array.isArray(hint) ? hint : [hint]) : null;
  if (counties && cands.length) {
    const boxes = counties.map((c) => countyBox.get(c)).filter(Boolean);
    const inCounty = boxes.length
      ? cands.filter((c) => {
          const cx = (c.bbox[0] + c.bbox[2]) / 2, cy = (c.bbox[1] + c.bbox[3]) / 2;
          return boxes.some((b) => cx >= b[0] && cx <= b[2] && cy >= b[1] && cy <= b[3]);
        })
      : [];
    if (inCounty.length) { cands = inCounty; how += '+county'; }
    else if (strict) { cands = []; how += '+county-miss-STRICT'; }
    else how += '+county-miss';
  }
  // region window: drop same-named waters far outside the stream's region.
  // Only for non-strict streams — strict ones are decided by county.
  const win = REGION_WINDOW[st.regionId];
  if (win && cands.length > 1 && !strict) {
    const inside = cands.filter((c) => boxesOverlap(c.bbox, win, 0.05));
    if (inside.length) { if (inside.length < cands.length) how += '+region'; cands = inside; }
    else how += '+region-miss';
  }
  results.push({ id: st.id, name: st.name, region: st.regionId, want, hint, how, parent: PARENT[st.id] ?? null, alias: ALIAS[st.id] ?? null, segs: cands });
}

const ok = results.filter((r) => r.segs.length);
const missing = results.filter((r) => !r.segs.length);
console.log(`matched: ${ok.length}, UNMATCHED: ${missing.length}`);
for (const r of missing) console.log(`  MISS ${r.id} want=[${r.want}]`);
// ambiguity + volume report
for (const r of ok) {
  const countiesHit = [...new Set(r.segs.map((s) => s.countyFips))].sort();
  const verts = r.segs.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.length, 0), 0);
  console.log(`  ${r.segs.length} parts ${verts} verts counties[${countiesHit.join(',')}] <- ${r.id} (${r.how}) tiger=[${r.segs[0].name}]`);
}

// ---- emit per-stream grouped GeoJSON (parts stay separate MultiLineStrings) ----
const features = ok.map((r) => {
  const parts = [];
  for (const s of r.segs) for (const line of s.lines) {
    if (line.length >= 2) parts.push(line);
  }
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  walk(parts, ([x, y]) => {
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
    b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
  });
  let verts = 0;
  for (const p of parts) verts += p.length;
  return {
    type: 'Feature',
    id: r.id,
    properties: {
      id: r.id, name: r.name, tigerName: r.segs[0].name, matchHow: r.how,
      parentReach: r.parent, partCount: parts.length, vertexCount: verts,
      bounds: b.map((v) => Math.round(v * 1e4) / 1e4),
    },
    geometry: { type: 'MultiLineString', coordinates: parts },
  };
});
writeFileSync(join(outDir, 'rivers-real.geojson'), JSON.stringify({ type: 'FeatureCollection', features }));
let totalVerts = 0;
for (const f of features) totalVerts += f.properties.vertexCount;
console.log(`wrote rivers-real.geojson: ${features.length} features, ${totalVerts} verts`);
writeFileSync(join(outDir, 'match-report.json'), JSON.stringify(results.map((r) => ({
  id: r.id, name: r.name, want: r.want, hint: r.hint, how: r.how, parent: r.parent,
  parts: r.segs.length,
  counties: [...new Set(r.segs.map((s) => s.countyFips))].sort(),
  tigerNames: [...new Set(r.segs.map((s) => s.name))],
})), null, 1));
