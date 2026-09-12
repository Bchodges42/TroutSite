/* global URL, console, process */
// fix-clear-creek-obed.mjs — drop double-imported parts from clear-creek-obed.
//
// Defect (DUPLICATES-REPORT 2026-09-08, pair findings #1/#6/#7 + sub-threshold
// 3↔9 and 7↔12): the canonical-only feature clear-creek-obed (TIGER-matched,
// no west-middle/east-southeast region artifact — regions replace by id, so a
// region-file fix could not reach it) contains five BYTE-IDENTICAL part pairs
// from a double import — 29.0 km of double-drawn creek:
//   0↔8 (3.99 km), 3↔9 (0.58 km), 4↔10 (18.81 km), 7↔12 (1.15 km), 5↔14 (4.48 km)
// The later indices {8,9,10,12,14} are the duplicate import; the first
// occurrences (0,3,4,5,7) chain into the shared unique parts (2,6,11,13).
//
// Method (fix-stones-river.mjs pattern — deterministic, idempotent,
// source-preserving): drop the duplicated parts whole (whole-part discipline,
// no interior coordinate edits), then recompute partCount/vertexCount/bounds.
// Verified pre/post condition: the intra-feature chunk structure is unchanged
// (5 chunks @ touch, 3 @ 250 m — identical before and after; the pre-existing
// corridor gaps belong to the TIGER source coverage, not to this defect).
//
// Run: node scripts/fix-clear-creek-obed.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';

const RIVERS = new URL('../public/atlas/rivers.geojson', import.meta.url);
const DROP = new Set([8, 9, 10, 12, 14]); // duplicate-import part indices

const atlas = JSON.parse(readFileSync(RIVERS, 'utf8'));
const f = atlas.features.find((x) => x.properties?.id === 'clear-creek-obed');
if (!f) throw new Error('clear-creek-obed not found in rivers.geojson');

const sig = (part) => part.map((v) => `${v[0].toFixed(5)},${v[1].toFixed(5)}`).join(';');

// idempotency guard: detect byte-identical duplicate parts by content, not by
// index (after a previous run the indices shift). No duplicates left -> the
// fix already ran; duplicates present -> they must be exactly the documented
// defect pairs before anything is dropped.
const parts = f.geometry.coordinates;
const firstSeen = new Map();
const dupPairs = [];
parts.forEach((part, i) => {
  const s = sig(part);
  if (firstSeen.has(s)) dupPairs.push([firstSeen.get(s), i]);
  else firstSeen.set(s, i);
});
if (dupPairs.length === 0) {
  console.log('clear-creek-obed: no byte-identical duplicate parts present — already de-duplicated, nothing to do');
  process.exit(0);
}
const expected = [[0, 8], [3, 9], [4, 10], [7, 12], [5, 14]];
const samePairs = (a, b) => a.length === b.length && a.every(([x, y], k) => x === b[k][0] && y === b[k][1]);
if (!samePairs(dupPairs, expected)) {
  throw new Error(`duplicate-part signature ${JSON.stringify(dupPairs)} != documented defect pairs ${JSON.stringify(expected)} — refusing to blind-drop`);
}

const before = {
  parts: parts.length,
  verts: parts.reduce((s, l) => s + l.length, 0),
};
const kept = parts.filter((_, i) => !DROP.has(i));

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, verts = 0;
for (const line of kept) {
  for (const [x, y] of line) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    verts++;
  }
}

f.geometry = { type: 'MultiLineString', coordinates: kept };
f.properties = {
  ...f.properties,
  bounds: [+minX.toFixed(6), +minY.toFixed(6), +maxX.toFixed(6), +maxY.toFixed(6)],
  partCount: kept.length,
  vertexCount: verts,
};

if (process.argv.includes('--check')) {
  console.log(`clear-creek-obed: would drop ${DROP.size} duplicated parts (${before.parts} -> ${kept.length} parts, ${before.verts} -> ${verts} verts)`);
  process.exit(0);
}

writeFileSync(RIVERS, JSON.stringify(atlas));
console.log(`rivers.geojson updated: clear-creek-obed ${before.parts} -> ${kept.length} parts, ${before.verts} -> ${verts} verts (29.0 km of double-drawn creek removed)`);
