#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * GEOMETRY lane (2026-09-04, base 5648ccc): Stones River / Sinking Creek
 * continuity + contract repairs to public/atlas/rivers.geojson.
 *
 * Evidence-based, REAL geometry only (no straight connectors, no traced
 * imagery, no inferred coordinates):
 *
 * 1. stones-river — the catalog reach was gated at the dam (minLat 36.153),
 *    so no centerline continued through the J. Percy Priest reservoir
 *    corridor to the East/West Fork meeting point. NHDPlus HR carries the
 *    main stem as fcode-55800 artificial-path reaches named "Stones River"
 *    from the forks' confluence (-86.4587,35.9859) through the pool to the
 *    dam; 20 corridor nhdplusids re-verified live against
 *    hydro.nationalmap.gov (NHDPlus_HR MapServer/3) on 2026-09-04. Those
 *    reaches are added here (TIGER-covered parts deduped out).
 * 2. sinking-creek-wilson — one catalog id had fused THREE distinct GNIS
 *    waters: chunk A = NHD "Sinking Creek" gnis_id 01270380 (through west
 *    Lebanon / Don Fox Community Park — the TWRA winter-program water);
 *    chunk B = a DIFFERENT "Sinking Creek", gnis_id 01303641 (rural
 *    Round Lick drainage, 3-5 km SW); chunk C = a third Sinking Creek in
 *    Rutherford County ending at the J. Percy Priest west shore, 12.15 km
 *    from either. B and C are removed, not connected. 10/11 kept parts are
 *    coordinate-exact NHD 01270380 reaches. waterbodyType "spring" ->
 *    "creek" (geometry contract enum).
 * 3. duck-river-lower / elk-river-lower — reach-gate overlap slivers drew
 *    the SAME TIGER parts twice under both reach ids (14 / 2 exact-shared
 *    parts). Removed from the *-lower features; both stay single-chunk and
 *    now end at their defining USGS gauge longitudes (Shelbyville 03598000
 *    -86.4992, Prospect 03584600 -86.9947). Matching gate tightenings in
 *    atlas-reach-gates.mjs keep pipeline re-runs reproducible.
 * 4. 8 TWRA winter ponds were MultiPolygon-TYPED but Polygon-NESTED
 *    (coordinates depth 3 instead of 4 — invalid GeoJSON). Rings wrapped,
 *    no coordinate changed.
 * 5. 10 interactive lake labelAnchors sat OUTSIDE their polygons (they were
 *    the reference inventory's approximate locations, e.g. chickamauga
 *    1.95 km off). Recomputed as max-clearance interior points of the
 *    largest member polygon. riverIndex.json is regenerated afterwards by
 *    scripts/regenerate-river-index.mjs.
 *
 * Run: node scripts/fix-stones-sinking-continuity.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '..');
const ATLAS = join(webDir, 'public', 'atlas', 'rivers.geojson');
const NHD = (f) => join(webDir, '.atlas-src', 'nhd', f);
const CLIP = [-90.6, 34.98, -81.45, 36.75];

const R_KM = 6371.0088, RAD = Math.PI / 180;
const havKm = ([lon1, lat1], [lon2, lat2]) => {
  const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(a));
};
const log = (...a) => console.log(...a);

const g = JSON.parse(readFileSync(ATLAS, 'utf8'));
const byId = new Map(g.features.map((f) => [f.properties.id, f]));
const feat = (id) => {
  const f = byId.get(id);
  if (!f) throw new Error(`missing feature ${id}`);
  return f;
};

function recount(f) {
  const p = f.properties;
  const bb = [1e9, 1e9, -1e9, -Infinity + 0];
  bb[3] = -1e9;
  let verts = 0;
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      verts++;
      if (c[0] < bb[0]) bb[0] = c[0]; if (c[1] < bb[1]) bb[1] = c[1];
      if (c[0] > bb[2]) bb[2] = c[0]; if (c[1] > bb[3]) bb[3] = c[1];
    } else for (const k of c) walk(k);
  };
  walk(f.geometry.coordinates);
  p.bounds = bb.map((v) => Math.round(v * 1e6) / 1e6);
  p.vertexCount = verts;
  if (f.geometry.type === 'MultiLineString') p.partCount = f.geometry.coordinates.length;
  return bb;
}

function midAnchor(f) {
  // pipeline convention: midpoint of the longest part
  const parts = f.geometry.coordinates;
  let best = parts[0];
  for (const p of parts) if (p.length > best.length) best = p;
  f.properties.labelAnchor = best[Math.floor(best.length / 2)];
}

function chunkCount(parts) {
  const n = parts.length;
  if (n <= 1) return n;
  const ends = parts.map((p) => [p[0], p[p.length - 1]]);
  const parent = parts.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = Math.min(havKm(ends[i][0], ends[j][0]), havKm(ends[i][0], ends[j][1]),
      havKm(ends[i][1], ends[j][0]), havKm(ends[i][1], ends[j][1]));
    if (d <= 1.0) { const a = find(i), b = find(j); if (a !== b) parent[b] = a; }
  }
  return new Set(parts.map((_, i) => find(i))).size;
}

// ---------------------------------------------------------------- 1. stones
{
  const f = feat('stones-river');
  const committed = f.geometry.coordinates;
  const nhd = JSON.parse(readFileSync(NHD('stones.geojson'), 'utf8'));
  const covered = new Set();
  for (const part of committed) for (const [x, y] of part) covered.add(`${Math.round(x / 0.002)},${Math.round(y / 0.002)}`);
  const added = [];
  for (const featN of nhd.features) {
    if (featN.properties.gnis_name !== 'Stones River') continue;
    const geoms = featN.geometry.type === 'LineString' ? [featN.geometry.coordinates] : featN.geometry.coordinates;
    for (const part of geoms) {
      if (!part.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= CLIP[0] && x <= CLIP[2] && y >= CLIP[1] && y <= CLIP[3])) continue;
      let seen = 0;
      for (const [x, y] of part) if (covered.has(`${Math.round(x / 0.002)},${Math.round(y / 0.002)}`)) seen++;
      if (part.length && seen / part.length >= 0.5) continue; // TIGER already draws this reach
      if (committed.some((p) => JSON.stringify(p) === JSON.stringify(part))) continue;
      added.push(part);
    }
  }
  log(`stones-river: committed ${committed.length} parts + ${added.length} NHD corridor parts (fcode 55800, gnis "Stones River")`);
  if (!added.length) throw new Error('stones-river: no corridor parts added — source changed?');
  f.geometry.coordinates = [...committed, ...added];
  const before = chunkCount(committed);
  const after = chunkCount(f.geometry.coordinates);
  log(`stones-river: chunks ${before} -> ${after}`);
  if (after !== 1) throw new Error('stones-river: not one stitched chunk after merge');
  // corridor south end must reach the East/West Fork confluence
  const CONFLUENCE = [-86.4587, 35.9859];
  let best = Infinity;
  for (const part of added) for (const v of [part[0], part[part.length - 1]]) best = Math.min(best, havKm(v, CONFLUENCE));
  log(`stones-river: corridor end nearest fork confluence ${best.toFixed(2)} km`);
  if (best > 1.0) throw new Error('stones-river: corridor does not reach the fork confluence');
  f.properties.source = ['tiger-linear', 'nhd-hr', 'nhd-corridor-55800', 'reach-gated'];
  recount(f);
  midAnchor(f);
  log(`stones-river: bounds ${f.properties.bounds} anchor ${f.properties.labelAnchor}`);
}

// ---------------------------------------------------------------- 2. sinking
{
  const f = feat('sinking-creek-wilson');
  const committed = f.geometry.coordinates;
  // chunk A corridor: lon -86.315..-86.285, lat >= 36.12 (GNIS 01270380)
  const keep = committed.filter((part) => part.every(([x, y]) => x >= -86.315 && x <= -86.285 && y >= 36.12));
  const removedB = committed.filter((p) => p.every(([x]) => x > -86.42 && x < -86.315)).length;
  const removedC = committed.filter((p) => p.some(([x]) => x < -86.42)).length;
  log(`sinking-creek-wilson: keep ${keep.length} parts (GNIS 01270380), remove ${removedB} chunk-B + ${removedC} chunk-C parts`);
  if (keep.length !== 11) throw new Error(`sinking: expected 11 kept parts, got ${keep.length}`);
  const chunks = chunkCount(keep);
  if (chunks !== 1) throw new Error(`sinking: kept creek has ${chunks} chunks`);
  f.geometry.coordinates = keep;
  f.properties.waterbodyType = 'creek';
  f.properties.source = ['nhd-hr'];
  // anchor: on-creek vertex nearest Don Fox Community Park, Lebanon (TWRA stocking access)
  const PARK = [-86.29, 36.205];
  let best = Infinity, bp = null;
  for (const part of keep) for (const v of part) { const d = havKm(v, PARK); if (d < best) { best = d; bp = v; } }
  f.properties.labelAnchor = bp;
  log(`sinking-creek-wilson: anchor ${bp} (${best.toFixed(2)} km from Don Fox Park), chunks=1`);
  recount(f);
}

// ------------------------------------------------------- 3. duck/elk dedupe
for (const [keepId, stripId] of [['duck-river-tailwater', 'duck-river-lower'], ['elk-river', 'elk-river-lower']]) {
  const keepKeys = new Set(feat(keepId).geometry.coordinates.map((p) => JSON.stringify(p)));
  const f = feat(stripId);
  const before = f.geometry.coordinates.length;
  f.geometry.coordinates = f.geometry.coordinates.filter((p) => !keepKeys.has(JSON.stringify(p)));
  const removed = before - f.geometry.coordinates.length;
  const chunks = chunkCount(f.geometry.coordinates);
  log(`${stripId}: removed ${removed} exact-shared parts, chunks=${chunks}`);
  if (chunks !== 1) throw new Error(`${stripId}: fragmented after dedupe`);
  recount(f);
  // the removed sliver may have supplied the anchor midpoint — recompute
  midAnchor(f);
}

// Exact self-duplicate parts (a part repeated inside one MultiLineString)
// double-draw the same segment. Found by the geometry-continuity test suite
// across 10 features (charles-creek, clear-creek-obed, clear-fork,
// duck-river-tailwater, elk-river, emory-river, obed-river,
// red-river-clarksville, rocky-river, wolf-river-fentress) — pipeline
// artifacts of the TIGER+NHD source blends. Pure dedup: no coordinate
// changes, identical shapes.
let selfDupTotal = 0;
for (const f of g.features) {
  if (f.geometry.type !== 'MultiLineString') continue;
  const parts = f.geometry.coordinates;
  const uniq = parts.filter((p, i, arr) => arr.findIndex((q) => JSON.stringify(q) === JSON.stringify(p)) === i);
  if (uniq.length === parts.length) continue;
  selfDupTotal += parts.length - uniq.length;
  f.geometry.coordinates = uniq;
  recount(f);
}
log(`self-duplicate parts removed across all line features: ${selfDupTotal}`);

// ---- cross-feature duplicate parts (reach-gate overlaps) ----
// Found by the geometry-continuity test suite; each shared part is kept on
// exactly one side of its reach boundary.
// - boone-tailwater vs ft-patrick-henry-tailwater: the gates overlap around
//   Fort Patrick Henry Dam (lon -82.509, USGS 03487010). Parts lying fully
//   east of the dam stay with the Boone tailwater; pool straddlers stay with
//   the FPH tailwater they start from (Watauga dam-pool precedent).
// - clear-fork vs clear-creek-obed: the 2 shared parts are NHD "Clear Creek"
//   GNIS 01305953 reaches (live bbox query -84.92..-84.68/36.08..36.17 on
//   2026-09-04 shows no "Clear Fork" water there) — keep in clear-creek-obed.
{
  const pairs = [
    ['ft-patrick-henry-tailwater', 'boone-tailwater', (w, e) => w > -82.509],
    ['boone-tailwater', 'ft-patrick-henry-tailwater', (w, e) => w < -82.509 && e > -82.509],
    ['clear-fork', 'clear-creek-obed', null],
  ];
  for (const [stripId, keepId, pred] of pairs) {
    const keepKeys = new Set(feat(keepId).geometry.coordinates.map((p) => JSON.stringify(p)));
    const f = feat(stripId);
    const before = f.geometry.coordinates.length;
    f.geometry.coordinates = f.geometry.coordinates.filter((pt) => {
      if (!keepKeys.has(JSON.stringify(pt))) return true;
      if (!pred) return false;
      let w = Infinity, e = -Infinity;
      for (const [x] of pt) { w = Math.min(w, x); e = Math.max(e, x); }
      return !pred(w, e);
    });
    log(`${stripId}: removed ${before - f.geometry.coordinates.length} shared parts (kept on ${keepId})`);
    recount(f);
  }
}

// --------------------------------------------------------- 4. pond nesting
const PONDS = ['shelby-farms-lake', 'cameron-brown-lake', 'yale-road-park-lake', 'johnson-park-lake',
  'valentine-park-pond', 'covington-fbc-pond', 'milan-city-pond', 'union-city-reelfoot-pond'];
for (const id of PONDS) {
  const f = feat(id);
  const c = f.geometry.coordinates;
  // depth 3 = [ring][pos][num] under a MultiPolygon type -> wrap once
  const depth3 = Array.isArray(c[0]) && typeof c[0][0]?.[0] === 'number';
  if (depth3) {
    f.geometry.coordinates = [c];
    log(`${id}: MultiPolygon nesting fixed (depth 3 -> 4), ${c.length} ring vertices unchanged`);
    recount(f);
  }
}

// --------------------------------------------------------- 5. lake anchors
function interiorAnchor(f) {
  const polys = f.geometry.coordinates;
  // largest member polygon by outer-ring vertex count
  let outer = null;
  for (const poly of polys) {
    const ring = poly[0];
    if (!outer || ring.length > outer.length) outer = ring;
  }
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of outer) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
  let best = null, bestClear = -1;
  const STEPS = 400;
  for (let i = 1; i < STEPS; i++) {
    const y = s + ((n - s) * i) / STEPS;
    const xs = [];
    for (let k = 0, j = outer.length - 1; k < outer.length; j = k++) {
      const yi = outer[k][1], yj = outer[j][1];
      if (yi > y !== yj > y) xs.push(((outer[j][0] - outer[k][0]) * (y - yi)) / (yj - yi) + outer[k][0]);
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x = (xs[k] + xs[k + 1]) / 2;
      let clear = Infinity;
      for (const v of outer) clear = Math.min(clear, havKm(v, [x, y]));
      if (clear > bestClear) { bestClear = clear; best = [x, y]; }
    }
  }
  return [Math.round(best[0] * 1e6) / 1e6, Math.round(best[1] * 1e6) / 1e6, bestClear];
}
const ANCHOR_FIX = ['lake-graham', 'center-hill-lake', 'chickamauga-lake', 'douglas-lake', 'fort-loudoun-lake',
  'kentucky-lake', 'norris-lake', 'old-hickory-lake', 'south-holston-lake', 'tims-ford-lake'];
for (const id of ANCHOR_FIX) {
  const f = feat(id);
  const [x, y, clear] = interiorAnchor(f);
  const old = f.properties.labelAnchor;
  f.properties.labelAnchor = [x, y];
  log(`${id}: labelAnchor ${old} -> [${x}, ${y}] (interior clearance ${clear.toFixed(2)} km)`);
}

// ------------------------------------------------------------------- write
writeFileSync(ATLAS, JSON.stringify(g));
log(`\nwrote ${ATLAS} (${g.features.length} features)`);
