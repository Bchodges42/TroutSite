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

// Documented exceptions — fragmentation that is deliberate (catalog design)
// or a gap that public-domain sources genuinely cannot fill (>1 km, no NHD
// reach and no TIGER segment in the corridor; probe evidence per entry in
// docs/CONTINUITY-AUDIT.md). Every entry must cite its documentation. The
// audit FAILS on any multi-chunk stream NOT listed here.
const ALLOWLIST = {
  'tennessee-river': {
    kind: 'B15-DOCUMENTED',
    reason:
      'B15/LINES lane (build-missing-rivers.mjs): 3 welded members from NHDPlus HR. The large gap is the genuine Alabama detour of the mainstem below Chattanooga — real geography, not missing data; the Kentucky Lake sliver member is in-TN (verified against the slanting KY line).',
  },
  'buffalo-river': {
    kind: 'B15-DOCUMENTED',
    reason:
      'B15/LINES lane: the named NHD flowline is absent for 2.7 km (35.364-35.389); the band was probed and carries zero named features, so no synthetic bridge was built per the no-fabrication rule.',
  },
  'mississippi-river': {
    kind: 'B15-DOCUMENTED',
    reason:
      'B15/LINES lane: the corridor-hugging mainstem carries the KY-Bend exclave notch (Tiptonville bend). Corridor rule caps excursions at 4000 m beyond the TN boundary; >4 km out-of-state water is exclusively KY/MS and correctly excluded, leaving 2 chunks at the notch.',
  },
  'cane-creek': {
    kind: 'DELIBERATE',
    reason:
      'Deliberate (docs/GEO-AUDIT.md "Not correctable" section): ONE catalog id intentionally covers two same-named Cane Creeks — the Bledsoe/Van Buren water and the Hickman/Perry water (~2.3 deg apart). Splitting the id is a catalog change owned by the content lane.',
  },
  'clear-fork': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: NHDPlus HR "Clear Fork" carries only the middle band (lat 36.287-36.424); TIGER is sparse at both ends. All-fcode corridor probes across both ~15 km holes (36.156->36.292 and 36.424->36.553) found no connectable reach chain (688/804 parts, connected=false). Gaps left open per the no-fabrication rule.',
  },
  'horse-creek-greene': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: NHD "Horse Creek" stops at lon -82.711 while TIGER fragments reach -82.790; the only corridor connection runs through the whole Nolichucky drainage web (1700+ unrelated parts), which is not a same-water bridge. Left open.',
  },
  'sinking-creek-wilson': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: 12.15 km west hole (36.046->36.094) and 3.69 km mid hole; all-fcode corridor probes found no connectable chain (172/113 parts, connected=false). Left open.',
  },
  'east-fork-shoal-creek': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: NHD "East Fork Shoal Creek" covers only lon -87.100..-87.064; the 6.06 km upper-reach hole (35.005->35.015) has no named reach and no connectable unnamed chain (409 corridor parts, connected=false). Left open.',
  },
  'hurricane-creek': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: NHD "Hurricane Creek" (115 reaches, full-extent envelope) splits into 2 chains with a 34.5 km hole; no named reach exists mid-creek and TIGER has 3 fragments that do not bridge it. Left open.',
  },
  'indian-creek-claiborne': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: every source combination (TIGER blend / NHD-only / full union) yields 2 chunks with a 24.66 km hole; no named reach in the corridor. Left open.',
  },
  'mill-creek-overton': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: NHDPlus HR carries NO "Mill Creek" reach at all between lat 36.30 and 36.44 (all-fcode probe of the mid corridor: zero Mill Creek features, no connectable unnamed chain), and TIGER has no segments there. The 18.77 km hole is a genuine NHD discontinuity. Left open.',
  },
  'piney-river-rhea': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: NHD splits the water into "Piney Creek" (upper+lower) and "Piney River" (mid band) and still lacks the 14.5 km reach through the Piney gorge; both names are taken, all combinations remain 2 chunks. Left open.',
  },
  'richardson-byrd-creek': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: 2.48 km gap between the Richardson Creek chain and the NHD "Byrd Creek" chain (-83.1364,36.4913 -> -83.1547,36.4745); the corridor connects only through 450+ unrelated web parts, not a same-water reach. Left open.',
  },
  'sulfur-fork-creek': {
    kind: 'LEFT-OPEN',
    reason:
      'Un-fillable from public sources: both NHD names taken ("Sulphur Fork Creek" + "Sulphur Fork Red River", 106 reaches, full-extent envelope) and the result is still 2 chunks with a 32.99 km hole. Left open.',
  },
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
  const allow = ALLOWLIST[id] ?? null;
  const allowReason = allow?.reason ?? null;
  const allowKind = allow?.kind ?? null;
  const bad = a.chunks > 1 && !allowReason;
  if (bad) failures++;
  rows.push({ id, parts: parts.length, ...a, allowReason, allowKind, bad });
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
lines.push('Implementation note: this endpoint-to-endpoint haversine count is slightly stricter');
lines.push('than the field verification for one stream — elk-river measures 9 chunks here vs 7');
lines.push('in the user-report verification (different distance implementation; the other');
lines.push('confirmed counts, and the 27-stream total, reproduce exactly). The stricter count');
lines.push('is the one CI enforces.');
lines.push('');
lines.push('Script: `apps/web/scripts/audit-river-continuity.mjs` — CI mode exits non-zero when a');
lines.push('non-allowlisted line river has more than one chunk. Run with `--write` to regenerate');
lines.push('this file. The baseline ("before") column is frozen at');
lines.push('`.atlas-src/out/continuity-before.json` on first write.');
lines.push('');
lines.push('## Allowlist (documented exceptions)');
lines.push('');
lines.push('### Deliberate (catalog design)');
lines.push('');
const deliberate = Object.entries(ALLOWLIST).filter(([, v]) => v.kind === 'DELIBERATE');
if (!deliberate.length) lines.push('_(none)_');
for (const [id, v] of deliberate) lines.push(`- **${id}** — ${v.reason}`);
lines.push('');
lines.push('### Left-open gaps (no public-domain geometry available; not fabricated)');
lines.push('');
const leftOpen = Object.entries(ALLOWLIST).filter(([, v]) => v.kind === 'LEFT-OPEN');
if (!leftOpen.length) lines.push('_(none)_');
for (const [id, v] of leftOpen) lines.push(`- **${id}** — ${v.reason}`);
lines.push('');
lines.push('## What the CONTINUITY lane changed (2026-09-04)');
lines.push('');
lines.push('1. **18 new per-stream corridor fetch targets** in `fetch-nhd-targets.mjs`');
lines.push('(harpeth, collins, clear-fork, sulfur-fork, emory, hurricane-houston, sinking-wilson,');
lines.push('daddys, efork-shoal, indian-claiborne, laurel-johnson, new-river-scott,');
lines.push('n-chickamauga, obed, sequatchie, fletchers, horse-greene, plus the name-less');
lines.push('`fbb-braid` corridor of unnamed French Broad braid channels) — all USGS NHDPlus HR,');
lines.push('fetched with retry/backoff on 2026-09-04 after earlier 504s.');
lines.push('2. **NHD takes** in `merge-rivers.mjs` for the new files plus previously fetched but');
lines.push('unused coverage: `powell.geojson` "Powell River", `byrd-creek.geojson` "Byrd Creek",');
lines.push('"Piney River" (lower Piney main stem), and both "Sulphur Fork Creek" /');
lines.push('"Sulphur Fork Red River" spellings.');
lines.push('3. **Continuity-aware source selection** in `merge-rivers.mjs`: per stream the');
lines.push('pipeline now picks the most continuous REAL source set — TIGER+NHD blend (base),');
lines.push('TIGER+NHD undeduplicated full union, NHD-only, or TIGER-only — switching only for');
lines.push('a strictly lower chunk count while still covering the base extent (0.05 deg per');
lines.push('side), so no switch can truncate a stream (logged as `sel:...` in the source tag).');
lines.push('4. **watauga-river reach gate** widened (maxLon -82.125 -> -82.11) with provenance:');
lines.push('the old edge rejected the two NHD dam-pool connectors at Wilbur Dam and split the');
lines.push('tailwater in two.');
lines.push('5. **`close-residual-gaps.mjs`** (new pipeline step) joins chunk endpoints across');
lines.push('residual gaps of at most 1 km; this run logged **0 joins** — every residual gap is');
lines.push('> 1 km and was documented instead of bridged.');
lines.push('');
lines.push(`Streams made fully continuous with real NHD geometry: ${rows.filter((r) => (before[r.id]?.chunks ?? 1) > 1 && r.chunks === 1).map((r) => r.id).join(', ')}.`);
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
  const status = r.chunks === 1 ? 'CONTINUOUS'
    : r.allowKind === 'DELIBERATE' ? 'ALLOWLISTED (deliberate)'
    : r.allowKind === 'LEFT-OPEN' ? 'LEFT-OPEN (documented source gap)'
    : 'STILL FRAGMENTED';
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
