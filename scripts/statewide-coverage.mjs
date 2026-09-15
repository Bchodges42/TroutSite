// statewide-coverage.mjs — STATEWIDE displayed-vs-selectable river coverage.
//
// The enhanced-zoom map renders the NHD network (public/atlas/network/*.geojson)
// as NON-SELECTABLE context: named water shows, a tap does nothing unless the
// water is also a catalog water in rivers.geojson. This script enumerates every
// named river on that network, aggregates its mapped length, subtracts what the
// catalog already covers, and applies a fishable-size verdict so the owner can
// see exactly WHICH unselectable rivers SHOULD become catalog waters.
//
//   node scripts/statewide-coverage.mjs   (writes docs/STATEWIDE-RIVER-COVERAGE.md)
//
// Verdict bands are on AGGREGATE MAPPED LENGTH (sum of NHD segment km per river
// across all HUCs — a meander-aware size proxy):
//   corridor >= 100 km  → SHOULD be a catalog water (major river corridor)
//   solid     40-100 km → candidate (solid fishable river)
//   small     15-40 km  → only with a fishery reason (gauge/stocking/public water)
//   context    < 15 km  → stays network context (tiny/seasonal class)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const networkDir = join(root, 'apps/web/public/atlas/network');
const index = JSON.parse(
  readFileSync(join(root, 'apps/web/src/features/map/riverIndex.json'), 'utf8'),
);
const gaugesFc = JSON.parse(
  readFileSync(join(root, 'apps/web/public/atlas/gauges-tn.geojson'), 'utf8'),
);

/** Shared normalization with catalog-gaps.mjs: "Elk River (Prospect...)" / "WF X" → one key. */
function waterKey(name) {
  let s = String(name ?? '').toUpperCase();
  s = s.replace(/,?\s*TN\.?$/, '');
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.split(
    /\s+(?:AT|NEAR|ABOVE|BELOW|BL\b|ABV|NR|TRIB|TR\.|AT HWY|US HWY|STHWY|SR |MILE|WW|BW|LB|RB)\b/i,
  )[0];
  s = s.replace(/\b(PEAK|TAILWATER|TW)\b.*$/, '');
  return s
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\bWF\b/g, 'WEST FORK')
    .replace(/\bEF\b/g, 'EAST FORK')
    .replace(/\bSF\b/g, 'SOUTH FORK')
    .replace(/\bNF\b/g, 'NORTH FORK')
    .replace(/\bR\b/g, 'RIVER')
    .replace(/\bC\b/g, 'CREEK')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- catalog keys (selectable waters) ---
const catalogKeys = new Map(index.map((w) => [w.id, waterKey(w.name)]));
const catalogByKey = new Map();
for (const [id, key] of catalogKeys) catalogByKey.set(key, [...(catalogByKey.get(key) ?? []), id]);

// --- gauges keyed by waterbody ---
const gaugeKeys = new Map();
for (const g of gaugesFc.features) {
  const key = waterKey(g.properties.name);
  if (!key) continue;
  gaugeKeys.set(key, { id: g.properties.id, drain: g.properties.drainSqMi ?? 0 });
}

// --- scan the displayed network ---
// Group by name + HUC-6 (sub-basin): statewide generic names ("Dry Creek")
// otherwise sum dozens of unrelated creeks into one phantom 800 km river, and
// a real river stays coherent inside its sub-basin. Segments outside the
// TENNESSEE BOUNDARY (NC/VA/KY/MS reaches of shared basins — e.g. the
// Tuckasegee in 06010202) are skipped: this is a Tennessee catalog.
const boundaryFc = JSON.parse(
  readFileSync(join(root, 'apps/web/public/atlas/tn-boundary.geojson'), 'utf8'),
);
const rings = boundaryFc.features.flatMap((f) =>
  f.geometry.type === 'Polygon'
    ? [f.geometry.coordinates[0]]
    : f.geometry.coordinates.map((r) => r[0]),
);
function pointInTN(lon, lat) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
  }
  return inside;
}
const GENERIC_FIRST = new Set([
  'DRY',
  'LICK',
  'BEAR',
  'LONG',
  'MUD',
  'TOWN',
  'ROCK',
  'BEAVER',
  'TURKEY',
  'BIG',
  'LITTLE',
  'BRUSH',
  'SPRING',
  'SULPHUR',
  'POSEY',
  ' MILL',
  'POND',
  'CAMP',
  'BUCK',
  'PANTHER',
  'WOLF',
  'JONES',
  'SMITH',
  'JOHNSON',
  'WILLIAMS',
  'HICKORY',
  'ASH',
]);
const GENERIC_NAME =
  /^(DRY|LICK|BEAR|LONG|MUD|TOWN|ROCK|BEAVER|TURKEY|BIG|LITTLE|BRUSH|SPRING|POND|CAMP|BUCK|PANTHER|WOLF|JONES|SMITH|JOHNSON|WILLIAMS|HICKORY|ASH|FLAT|GRASSY|LOST|COLD|SUGAR|CEDAR|OAK|POPLAR|WALNUT|CHERRY|MAPLE|SPRUCE|PINE|LAUREL|IVY|WALNUT|BIRCH|ELK|BUFFALO|BEAVERDAM|STILL)\b/;

const rivers = new Map(); // key = nameKey + '@' + hu6 → {name, km, hucs:Set, segments}
let kinds = {};
let unnamed = 0;
let outOfState = 0;
for (const file of readdirSync(networkDir).filter((f) => f.endsWith('.geojson'))) {
  const fc = JSON.parse(readFileSync(join(networkDir, file), 'utf8'));
  for (const f of fc.features) {
    const p = f.properties ?? {};
    kinds[p.kind ?? '?'] = (kinds[p.kind ?? '?'] ?? 0) + 1;
    const name = String(p.name ?? '').trim();
    if (!name) {
      unnamed += 1;
      continue;
    }
    const c0 = f.geometry?.coordinates?.[0];
    const lon = Array.isArray(c0?.[0]) ? c0[0][0] : c0?.[0];
    const lat = Array.isArray(c0?.[0]) ? c0[0][1] : c0?.[1];
    if (!Number.isFinite(lon) || !pointInTN(lon, lat)) {
      outOfState += 1;
      continue;
    }
    const key = waterKey(name);
    if (!key || /\b(LAKE|RESERVOIR)\b/.test(key)) continue;
    const hu6 = String(p.hu8 ?? '').slice(0, 6) || '??????';
    const gkey = `${key}@${hu6}`;
    const r = rivers.get(gkey) ?? { gkey, key, name, km: 0, hucs: new Set(), segments: 0 };
    r.km += Number(p.lengthKm ?? 0);
    if (p.hu8) r.hucs.add(p.hu8);
    r.segments += 1;
    rivers.set(gkey, r);
  }
}

// --- classify: is the river already selectable (catalog) or not? ---
// Generic first words ("Dry Creek" ×40 statewide) are name collisions, not one
// river: never auto-promote them to SHOULD; park them in the review bucket.
const rows = [...rivers.values()]
  .map((r) => {
    const catalog = catalogByKey.get(r.key) ?? [];
    const gauge = gaugeKeys.get(r.key) ?? null;
    const generic = GENERIC_NAME.test(r.key);
    let verdict;
    if (r.km >= 100) verdict = generic ? 'review' : 'corridor';
    else if (r.km >= 40) verdict = 'solid';
    else if (r.km >= 15) verdict = verdictWithBoost(r, gauge);
    else verdict = 'context';
    return { ...r, km: Math.round(r.km), catalog, gauge, generic, verdict };
  })
  .sort((a, b) => b.km - a.km);

function verdictWithBoost(r, gauge) {
  // a small river with an active USGS gauge (and its drainage >= 20 sq mi) is a
  // fishery signal — promote from context to candidate.
  return gauge && gauge.drain >= 20 ? 'solid' : 'small';
}

const uncovered = rows.filter((r) => r.catalog.length === 0);
const should = uncovered.filter((r) => r.verdict === 'corridor');
const solid = uncovered.filter((r) => r.verdict === 'solid');
const small = uncovered.filter((r) => r.verdict === 'small');
const review = uncovered.filter((r) => r.verdict === 'review');
const context = uncovered.filter((r) => r.verdict === 'context');

const row = (r) => {
  const gauge = r.gauge ? `yes (${r.gauge.id}, ${r.gauge.drain} sq mi)` : 'no';
  return `| ${r.name} | ${r.km} km | ${[...r.hucs].join(', ')} | ${gauge} |`;
};
const table = (list) =>
  ['| river | mapped length | HUC-8 | active gauge |', '|---|---|---|---|', ...list.map(row)].join(
    '\n',
  );

const md = `# Statewide river coverage — displayed vs selectable (2026-09-15)

Method: the enhanced-zoom map draws the NHD network (\`public/atlas/network/*.geojson\`,
${Object.entries(kinds)
  .map(([k, n]) => `${n} ${k}`)
  .join(', ')} features, ${unnamed} unnamed)
as NON-SELECTABLE context. A river is only tappable when a catalog water covers it. This
report aggregates every NAMED network river by waterbody (length summed across HUCs and
segments), subtracts rivers the catalog already makes selectable, and applies a
fishable-size verdict on aggregate mapped length:

**corridor** ≥100 km (SHOULD be a catalog water) · **solid** 40–100 km (candidate) ·
**small** 15–40 km (only with a fishery reason — active gauge, stocking, public water) ·
**context** <15 km (tiny/seasonal — correctly stays unselectable network context).

Catalog coverage: ${index.length} waters. Named network rivers: ${rivers.size} (${uncovered.length} NOT selectable).

## SHOULD be catalog waters — displayed major corridors you cannot tap (${should.length})
${table(should)}

## Generic-name corridors — NEED PER-INSTANCE REVIEW (${review.length})
These sum ≥100 km under one name, but the name is generic (Dry/Lick/Bear/...): the total
is almost certainly several unrelated creeks sharing a name across sub-basins. Each
instance needs a look at its actual watershed before it can be a catalog water — do NOT
author from this table alone.
${table(review)}

## Solid candidates (${solid.length})
${table(solid)}

## Small rivers — candidate only with a fishery reason (${small.length})
${table(small)}

## Context-only (<15 km mapped; correctly unselectable) — ${context.length} rivers, ${Math.round(context.reduce((s, r) => s + r.km, 0))} km total
Summarized, not enumerated: these are the headwater and tributary segments the zoom map
shows for orientation. They stay as-is unless a specific fishery reason emerges (TWRA
stocking site on them — cross-check the stocking overlay — or a management plan).

## Already selectable (network name matches a catalog water) — ${rows.length - uncovered.length} rivers
These render as tappable catalog water; their network geometry is redundant context that
the catalog corridor covers. No action.

> Cross-reference: \`docs/GAUGE-CATALOG-GAPS.md\` (gauge-based view of the same question,
> with drainage areas) and the 17-water add worklist (atlas coverage gaps). The SHOULD list
> above + those two = the statewide authoring queue. Every addition needs the wave-ledger
> sourcing treatment before it ships.
`;

const out = join(root, 'docs', 'STATEWIDE-RIVER-COVERAGE.md');
writeFileSync(out, md);
console.log(`wrote ${out}`);
console.log(
  `network rivers: ${rivers.size} named / ${unnamed} unnamed segments | unselectable: ${uncovered.length} | should=${should.length} solid=${solid.length} small=${small.length} context=${context.length}`,
);
console.log('\nSHOULD list:');
for (const r of should) console.log(` - ${r.name}: ${r.km} km [${[...r.hucs].join(',')}]`);
