// Continuity audit: counts how many disconnected "chunks" each line river in
// public/atlas/rivers.geojson renders as on the map.
//
// A CHUNK = a maximal set of parts stitched end-to-end, where "stitched" means
// two parts have endpoints within 1 km of each other (haversine). Chunks are
// separated by real coverage gaps — the visible breaks users reported
// ("the Harpeth River split into 3 distinct rivers").
//
// REAL DATA ONLY: this script only measures committed geometry; it never
// modifies it. Exit code is non-zero when a non-allowlisted line river has
// more than one chunk, so CI stays green only when every river reads as one
// continuous water (or its fragmentation is documented, see ALLOWLIST).
//
// Run:      node scripts/audit-river-continuity.mjs            (check, CI mode)
//           node scripts/audit-river-continuity.mjs --write    (regenerate docs/CONTINUITY-AUDIT.md)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '..');
const repo = join(webDir, '..', '..');
const ATLAS = join(webDir, 'public', 'atlas', 'rivers.geojson');
const DOC = join(repo, 'docs', 'CONTINUITY-AUDIT.md');
const BEFORE = join(webDir, '.atlas-src', 'out', 'continuity-before.json');
const JOINS = join(webDir, '.atlas-src', 'out', 'residual-joins.json');
const WRITE = process.argv.includes('--write');
const STITCH_KM = 1.0;

// Documented exceptions — fragmentation that is deliberate or inherent to the
// catalog, NOT a geometry bug. Every entry must cite its documentation.
const ALLOWLIST = {
  'cane-creek':
    'Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane.',
};

const R_KM = 6371.0088;
const RAD = Math.PI / 180;
function haversineKm([lon1, lat1], [lon2, lat2]) {
  const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(a));
}

// ---- union-find over part indices ----
function find(parent, i) {
  while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
  return i;
}
function union(parent, rank, a, b) {
  a = find(parent, a); b = find(parent, b);
  if (a === b) return;
  if (rank[a] < rank[b]) [a, b] = [b, a];
  parent[b] = a;
  if (rank[a] === rank[b]) rank[a]++;
}

function analyze(parts) {
  const ends = parts.map((p) => [p[0], p[p.length - 1]]);
  const parent = parts.map((_, i) => i);
  const rank = new Array(parts.length).fill(0);
  const stitches = []; // {a, b, km} endpoint pairs joined within threshold
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      let best = Infinity, bi = -1, bj = -1;
      for (const ei of [0, 1]) for (const ej of [0, 1]) {
        const d = haversineKm(ends[i][ei], ends[j][ej]);
        if (d < best) { best = d; bi = ei; bj = ej; }
      }
      if (best <= STITCH_KM) {
        union(parent, rank, i, j);
        stitches.push({ a: [i, bi], b: [j, bj], km: best });
      }
    }
  }
  const groups = new Map(); // root -> part indices
  for (let i = 0; i < parts.length; i++) {
    const r = find(parent, i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  }
  const chunks = [...groups.values()];
  // inter-chunk gaps: nearest endpoint pair between each pair of chunks
  const gaps = [];
  for (let c = 0; c < chunks.length; c++) {
    for (let d = c + 1; d < chunks.length; d++) {
      let best = Infinity, pair = null;
      for (const i of chunks[c]) for (const j of chunks[d]) {
        for (const ei of [0, 1]) for (const ej of [0, 1]) {
          const dd = haversineKm(ends[i][ei], ends[j][ej]);
          if (dd < best) { best = dd; pair = [ends[i][ei], ends[j][ej]]; }
        }
      }
      gaps.push({ km: best, from: pair[0], to: pair[1], chunkA: c, chunkB: d });
    }
  }
  gaps.sort((x, y) => y.km - x.km);
  const fmt = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
  return {
    chunks: chunks.length,
    chunkSizes: chunks.map((idx) => idx.length).sort((a, b) => b - a),
    gaps: gaps.slice(0, 8).map((g) => ({
      km: Math.round(g.km * 100) / 100,
      where: `${fmt(g.from)} -> ${fmt(g.to)}`,
    })),
  };
}

// ---- run ----
const g = JSON.parse(readFileSync(ATLAS, 'utf8'));
const lineFeatures = g.features.filter((f) => f.geometry.type === 'MultiLineString');
const skipped = g.features.filter((f) => f.geometry.type !== 'MultiLineString');
const rows = [];
let failures = 0;
for (const f of lineFeatures) {
  const id = f.properties.id;
  const parts = f.geometry.coordinates.filter((p) => Array.isArray(p) && p.length >= 2);
  const a = analyze(parts);
  const allowReason = ALLOWLIST[id] ?? null;
  const bad = a.chunks > 1 && !allowReason;
  if (bad) failures++;
  rows.push({ id, parts: parts.length, ...a, allowReason, bad });
}
rows.sort((x, y) => y.chunks - x.chunks || x.id.localeCompare(y.id));

const multi = rows.filter((r) => r.chunks > 1);
const unexpected = rows.filter((r) => r.bad);
const allowlisted = rows.filter((r) => r.chunks > 1 && r.allowReason);
console.log(`line rivers: ${lineFeatures.length} (skipped non-line features: ${skipped.length})`);
console.log(`multi-chunk: ${multi.length}  unexpected: ${unexpected.length}  allowlisted: ${allowlisted.length}`);
for (const r of rows.filter((r) => r.chunks > 1)) {
  console.log(`  ${r.bad ? 'FAIL' : 'ALLOW'} ${r.id}: ${r.chunks} chunks / ${r.parts} parts  gaps<=${r.gaps[0]?.km ?? 0}km`);
}
const failed = unexpected.length > 0;
if (failed) console.error(`FAIL: ${unexpected.length} unexpected multi-chunk stream(s)`);
else console.log('audit-river-continuity: PASS (0 unexpected multi-chunk streams)');

// ---- report (written even on failure so the "before" baseline is capturable) ----
if (!WRITE) process.exit(failed ? 1 : 0);

const before = existsSync(BEFORE)
  ? JSON.parse(readFileSync(BEFORE, 'utf8'))
  : Object.fromEntries(rows.map((r) => [r.id, { parts: r.parts, chunks: r.chunks }]));
writeFileSync(BEFORE, JSON.stringify(before, null, 1));
const joins = existsSync(JOINS) ? JSON.parse(readFileSync(JOINS, 'utf8')) : [];
const fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1);

const lines = [];
lines.push('# CONTINUITY-AUDIT — river continuity (chunk) audit');
lines.push('');
lines.push(`Lane: CONTINUITY · Repo: \`trout-geo\` · Base: \`db2555b\` (GEO lane HEAD) · Date: 2026-09-04`);
lines.push('');
lines.push('## Problem');
lines.push('');
lines.push('Users see individual catalog rivers rendering as MULTIPLE disconnected polylines with');
lines.push('visible gaps ("the Harpeth River split into 3 distinct rivers"). Verified baseline:');
lines.push('27 of the 92 line rivers in `apps/web/public/atlas/rivers.geojson` render as 2+ chunks.');
lines.push('');
lines.push('## Method');
lines.push('');
lines.push(`A **chunk** is a maximal set of a feature\'s parts stitched end-to-end, where two parts`);
lines.push(`are stitched when any endpoint of one lies within ${STITCH_KM.toFixed(1)} km (haversine) of an`);
lines.push('endpoint of the other. Chunks are separated by real coverage gaps in the committed');
lines.push('geometry. This reproduces what the map renders: parts of the same chunk touch (or');
lines.push('nearly touch), parts of different chunks show a visible break.');
lines.push('');
lines.push('Script: `apps/web/scripts/audit-river-continuity.mjs` — CI mode exits non-zero when a');
lines.push('non-allowlisted line river has more than one chunk. Run with `--write` to regenerate');
lines.push('this file. The baseline ("before") column is frozen at');
lines.push('`.atlas-src/out/continuity-before.json` on first write.');
lines.push('');
lines.push('## Allowlist (documented exceptions)');
lines.push('');
const allowIds = Object.keys(ALLOWLIST);
if (!allowIds.length) lines.push('_(empty)_');
for (const id of allowIds) lines.push(`- **${id}** — ${ALLOWLIST[id]}`);
lines.push('');
lines.push('## Per-stream results (before -> after)');
lines.push('');
lines.push('`before` = GEO-lane HEAD `db2555b` baseline; `after` = this lane\'s result.');
lines.push('Only streams with >1 chunk in either run are listed individually; all other');
lines.push(`${rows.filter((r) => r.chunks === 1 && (before[r.id]?.chunks ?? 1) === 1).length} line rivers are single-chunk in both runs (1 chunk / 1 chunk).`);
lines.push('');
lines.push('| id | parts before | chunks before | parts after | chunks after | status |');
lines.push('|---|---|---|---|---|---|');
for (const r of rows) {
  const b = before[r.id] ?? { parts: r.parts, chunks: r.chunks };
  if (b.chunks === 1 && r.chunks === 1) continue;
  const status = r.chunks > 1 ? (r.allowReason ? 'ALLOWLISTED' : 'STILL FRAGMENTED') : 'CONTINUOUS';
  lines.push(`| ${r.id} | ${b.parts} | ${b.chunks} | ${r.parts} | ${r.chunks} | ${status} |`);
}
lines.push('');
lines.push('## Multi-chunk detail (current run)');
lines.push('');
const detail = rows.filter((r) => r.chunks > 1);
if (!detail.length) lines.push('_(no multi-chunk line rivers)_');
for (const r of detail) {
  lines.push(`### ${r.id} — ${r.chunks} chunks / ${r.parts} parts${r.allowReason ? ' (ALLOWLISTED)' : ''}`);
  lines.push('');
  lines.push(`chunk sizes (parts per chunk): ${r.chunkSizes.join(', ')}; largest inter-chunk gaps:`);
  for (const gp of r.gaps) lines.push(`- ${gp.km.toFixed(1)} km at ${gp.where}`);
  if (r.allowReason) lines.push(`- exception: ${r.allowReason}`);
  lines.push('');
}
lines.push('## Residual endpoint joins applied (<= 1 km, logged per pipeline rule)');
lines.push('');
lines.push('Joins are produced by `apps/web/scripts/close-residual-gaps.mjs` and consumed from');
lines.push('`.atlas-src/out/residual-joins.json`. Only endpoint pairs with NO intermediate');
lines.push('NHD/TIGER segment available are bridged, and only up to 1 km.');
lines.push('');
if (!joins.length) {
  lines.push('_(none — every residual gap was filled with real NHD/TIGER geometry or left open)_');
} else {
  lines.push('| id | join # | endpoint A | endpoint B | gap |');
  lines.push('|---|---|---|---|---|');
  for (const j of joins) {
    lines.push(`| ${j.id} | ${j.index} | ${j.from} | ${j.to} | ${fmt1(j.km)} km |`);
  }
}
lines.push('');
lines.push('## Gaps left open (> 1 km, no public-domain geometry found)');
lines.push('');
const open = detail.filter((r) => (r.gaps[0]?.km ?? 0) > STITCH_KM);
if (!open.length) {
  lines.push('_(none — no committed river carries a gap larger than the 1 km stitch threshold)_');
} else {
  lines.push('| id | gap | where | reason |');
  lines.push('|---|---|---|---|');
  for (const r of open) {
    lines.push(`| ${r.id} | ${r.gaps[0].km.toFixed(1)} km | ${r.gaps[0].where} | ${r.allowReason ?? 'UNEXPECTED — audit fails' } |`);
  }
}
lines.push('');
lines.push('## Reproduce');
lines.push('');
lines.push('```bash');
lines.push('node apps/web/scripts/audit-river-continuity.mjs            # CI check (exit code)');
lines.push('node apps/web/scripts/audit-river-continuity.mjs --write    # regenerate this doc');
lines.push('```');
lines.push('');
writeFileSync(DOC, lines.join('\n'));
console.log(`wrote ${DOC}`);
process.exit(failed ? 1 : 0);
