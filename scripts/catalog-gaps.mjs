// catalog-gaps.mjs — cross-reference the gauge layer against the water catalog
// to find gauged rivers that are NOT catalog waters (unselectable on the map),
// with a size verdict per river from USGS drainage area. Writes a markdown
// report to docs/GAUGE-CATALOG-GAPS.md.
//
//   node scripts/catalog-gaps.mjs
//
// Size bands (common-sense, drainage area at the gauge):
//   major  >= 400 sq mi   ·  solid 100-400  ·  small 20-100  ·  tiny < 20 (excluded)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(
  readFileSync(join(root, 'apps/web/src/features/map/riverIndex.json'), 'utf8'),
);
const gauges = JSON.parse(
  readFileSync(join(root, 'apps/web/public/atlas/gauges-tn.geojson'), 'utf8'),
);

// Catalog gaugeIds from the stream YAMLs (same parse as tn-gauges-build).
const wiredByGauge = new Map();
const yamlDir = join(root, 'packages/content/streams/tn');
const block = /gaugeIds:\s*\r?\n((?:[ \t]+-[ \t]*["']?\d{8}["']?[ \t]*\r?\n)+)/g;
for (const file of readdirSync(yamlDir).filter((f) => f.endsWith('.yaml'))) {
  const slug = file.replace(/\.yaml$/, '');
  const text = readFileSync(join(yamlDir, file), 'utf8');
  for (const match of text.matchAll(block)) {
    for (const m of match[1].matchAll(/\d{8}/g)) {
      wiredByGauge.set(m[0], [...(wiredByGauge.get(m[0]) ?? []), slug]);
    }
  }
}

/** Normalize a station name to a waterbody key: "DUCK RIVER AT X, TN" → "duck river". */
export function waterKey(stationNm) {
  let s = String(stationNm ?? '').toUpperCase();
  s = s.replace(/,?\s*TN\.?$/, '');
  s = s.replace(/\([^)]*\)/g, ' '); // catalog reach qualifiers: "Elk River (Prospect to state line)"
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
    .replace(/\bR\b/g, 'RIVER') // "CUMBERLAND R" → "CUMBERLAND RIVER"
    .replace(/\bC\b/g, 'CREEK') // "BEAVER C" → "BEAVER CREEK"
    .replace(/\s+/g, ' ')
    .trim();
}

// Known same-name/different-water splits the name match cannot resolve on its
// own: group key + HUC-8 prefix → the catalog situation.
const KEY_NOTES = {
  'WOLF RIVER':
    'TWO different rivers share this name: HUC 05130105 gauges (Byrdstown/Pickett) are the Fentress Co Wolf (Dale Hollow arm); HUC 08010210 gauges (Fayette/Shelby) are wolf-river-west-tennessee. Extra west-TN gauges are wiring candidates for the existing water; the Fentress Wolf has no catalog water.',
  'DUCK RIVER':
    'Catalog covers Normandy tailwater + Shelbyville–Columbia only. These unwired gauges span the WHOLE basin incl. the missing Columbia→mouth reaches — the user-reported unselectable-middle gap.',
  'CUMBERLAND RIVER':
    'cumberland-river exists but is DELIBERATELY gauge-unwired (owner decision). Extra main-stem gauges are recorded, not proposed for wiring.',
  'OBED RIVER':
    'obed-river is wired to 03538830 (Adams Bridge, upper main stem). 03539800 (Morgan Co, 518 sq mi, LOWER Obed) shows ACTIVE in the site file — the wave-2 ledger called it dead; correct the ledger and consider it for lower-Obed coverage.',
};

const sizeVerdict = (sqmi) =>
  sqmi >= 400 ? 'MAJOR' : sqmi >= 100 ? 'solid' : sqmi >= 20 ? 'small' : sqmi > 0 ? 'tiny' : '?';

const catalogKeys = new Map(index.map((w) => [w.id, waterKey(w.name)]));

// Group unwired gauges by waterbody key.
const rivers = new Map();
for (const g of gauges.features) {
  const p = g.properties;
  if (wiredByGauge.has(p.id)) continue;
  const key = waterKey(p.name);
  if (!key) continue;
  if (/\b(LAKE|RESERVOIR|L\b)\b/.test(key)) continue; // reservoir inventory stubs
  const r = rivers.get(key) ?? {
    key,
    gauges: [],
    maxDrain: 0,
    counties: new Set(),
    hucs: new Set(),
  };
  r.gauges.push(p);
  r.maxDrain = Math.max(r.maxDrain, p.drainSqMi ?? 0);
  if (p.county) r.counties.add(p.county);
  if (p.huc) r.hucs.add(p.huc);
  rivers.set(key, r);
}

const rows = [...rivers.values()]
  .map((r) => {
    // Classify: does a catalog water share this river's name (wiring gap) or
    // is there no catalog water at all (true catalog gap)?
    const matches = [...catalogKeys.entries()].filter(([, key]) => key === r.key);
    return { ...r, verdict: sizeVerdict(r.maxDrain), catalog: matches.map(([id]) => id) };
  })
  .sort((a, b) => b.maxDrain - a.maxDrain);

const line = (r) => {
  const ids = r.gauges.map((g) => g.id).join(', ');
  const cls =
    r.catalog.length > 0
      ? `wiring gap — catalog has ${r.catalog.map((s) => '`' + s + '`').join(', ')}`
      : '**no catalog water**';
  return `| ${r.key} | ${r.verdict} | ${r.maxDrain || '—'} | ${ids} | ${cls} |`;
};

const major = rows.filter((r) => r.verdict === 'MAJOR');
const solid = rows.filter((r) => r.verdict === 'solid');
const small = rows.filter((r) => r.verdict === 'small');
const tiny = rows.filter((r) => r.verdict === 'tiny' || r.verdict === '?');

const md = `# Gauged rivers missing from (or under-wired in) the catalog (2026-09-15)

Cross-reference of \`atlas/gauges-tn.geojson\` (137 active USGS stream gauges) against the
148-water catalog (\`riverIndex.json\` + stream YAML \`gaugeIds\`). Class per river:

- **no catalog water** — the river is not in the catalog at all: on the enhanced-zoom map its
  geometry renders as unselectable network clusters even though it carries agency-grade live
  data. These are catalog-add candidates.
- **wiring gap** — a catalog water exists for this river but its YAML \`gaugeIds\` don't
  include these active gauges. Cheap win: add the id(s) to the YAML.

Size verdict = USGS drainage area at the gauge: **MAJOR** ≥400 sq mi · **solid** 100–400 ·
**small** 20–100 · **tiny** <20 (excluded by the small-rivers rule — people fish small
rivers, but sub-20-sq-mi creeks are the tiny/seasonal class).

## True catalog gaps (no catalog water) — MAJOR, fishable-now rivers
| river | verdict | max drain (sq mi) | active gauges | class |
|---|---|---|---|---|
${
  major
    .filter((r) => r.catalog.length === 0)
    .map(line)
    .join('\n') || '—'
}

## True catalog gaps — solid-size
| river | verdict | max drain (sq mi) | active gauges | class |
|---|---|---|---|---|
${
  solid
    .filter((r) => r.catalog.length === 0)
    .map(line)
    .join('\n') || '—'
}

## True catalog gaps — small rivers (only with a fishery reason)
| river | verdict | max drain (sq mi) | active gauges | class |
|---|---|---|---|---|
${
  small
    .filter((r) => r.catalog.length === 0)
    .map(line)
    .join('\n') || '—'
}

## Wiring gaps (catalog water exists; active gauges not in its YAML)
| river | verdict | max drain (sq mi) | unwired active gauges | catalog water(s) |
|---|---|---|---|---|
${
  [...major, ...solid, ...small]
    .filter((r) => r.catalog.length > 0)
    .map(line)
    .join('\n') || '—'
}

## Same-name cautions (read before wiring any row above)
${Object.entries(KEY_NOTES)
  .map(([k, v]) => `- **${k}** — ${v}`)
  .join('\n')}

## Tiny/unknown (${tiny.length} groups) — excluded per the small-rivers rule
${tiny.map((r) => `- ${r.key} (${r.maxDrain || '?'} sq mi, ${r.gauges.length} gauge(s))`).join('\n')}

## Catalog waters with gauge wiring anomalies (known)
- **barren-fork-river** — wired 03421500 is Collins River near Rowland (wrong stream, discontinued 1924). No active USGS gauge exists on the Barren Fork itself.
- **little-tennessee-river** — no main-stem gauge exists; nearby ids are Tellico tributary/lake stubs.
- **holston-river** — no active main-stem gauge (03495500 ended 1993); live data is TVA-side.
- **watauga-river-wilbur-reach** — no station between the dams (03484000 below Wilbur ended 1982).
- **obed-river** — 03539800 (LOWER Obed, Morgan Co) is ACTIVE per the current site file, contrary to the wave-2 "dead gauge" note; 03538830 remains the upper-main-stem gauge.

## The Duck River display problem (user-reported) — FIXED 2026-09-15
The catalog carried only \`duck-river-tailwater\` (Normandy→Shelbyville) and
\`duck-river-lower\` (Shelbyville→Columbia); the remaining ~100 river miles (Columbia → the
Tennessee River confluence) rendered as unselectable network geometry. **Fixed on this
branch**: new catalog water \`duck-river-mouth\` (NHD-traced, 212.6 km, validate-atlas +
continuity PASS), wired to 03601600 / 03601990 / 03603000; duck-river-lower additionally
wired to 03598185 / 03599240 / 03599419. The statewide displayed-vs-selectable sweep is
\`docs/STATEWIDE-RIVER-COVERAGE.md\` (\`node scripts/statewide-coverage.mjs\`).

> Merge with the pre-existing 17-water add worklist (atlas coverage gaps) before authoring;
> source any addition with the wave-ledger block format so every new water ships with live
> agency URLs.
`;

const out = join(root, 'docs', 'GAUGE-CATALOG-GAPS.md');
writeFileSync(out, md);
console.log(`wrote ${out}`);
console.log(
  `major=${major.length} solid=${solid.length} small=${small.length} tiny=${tiny.length}`,
);
console.log('\nMAJOR rows:');
for (const r of major) console.log(' - ' + line(r));
