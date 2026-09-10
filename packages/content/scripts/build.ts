// OWNER: ROLE 4. Build the compact bundled JSON content pack the PWA precaches
// (CHAT-4 scope 2, §3: read path is static JSON; payload budget ≤ 20 MB).
// Output: dist/pack/ — bugs.json, patterns.json, streams.json, shops.json, regions.json,
// fishing.json (data-sources lane: structured fishing-information content),
// hatch/{regionId}/{month}.json (same shape as the /v1/hatch/{regionId}/{month}.json snapshot),
// plus meta.json. Returns non-zero if the pack exceeds the size budget.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FishingInformationSchema } from '@trout/contracts';
import { loadContent, FLOORS } from './lib.js';
import { REGIONS } from './regions.js';

const OUT = resolve(import.meta.dirname, '..', 'dist', 'pack');
const { bugs, patterns, streams, shops, hatch, illustrations, issues } = loadContent();

if (issues.length > 0) {
  for (const i of issues) console.error(`[content] FAIL ${i.file}: ${i.message}`);
  console.error('[content] pack not built — fix validation issues first (pnpm --filter @trout/content validate)');
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'hatch'), { recursive: true });

// Inline each taxon's line art so the PWA fetches one payload instead of 100+ files.
const bugList = [...bugs.values()].map(({ illustration, stages, ...taxon }) => ({
  ...taxon,
  stages,
  svg: illustrations.get(`${illustration.split('/').pop()}`) ?? '',
}));

const files: Record<string, string> = {
  'bugs.json': JSON.stringify({ taxa: bugList }),
  'patterns.json': JSON.stringify({ patterns: [...patterns.values()] }),
  'streams.json': JSON.stringify({ streams: [...streams.values()] }),
  'shops.json': JSON.stringify({ shops: [...shops.values()] }),
  'regions.json': JSON.stringify({ regions: REGIONS }),
  // Fishing-information content (statewide rules/licenses/terminology + water-specific
  // special regulations via appliesTo). Contract-validated before it ships.
  'fishing.json': JSON.stringify({
    fishing: FishingInformationSchema.parse(
      JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'data', 'fishing-information.json'), 'utf8')),
    ),
  }),
  // Per-water trout calendar (research lane 2026-09-10): months each water
  // plausibly holds trout + stocking-event months, cited per row in
  // docs/research/SPECIES-CLASSIFICATION.md. Passed through verbatim — the
  // research row set is the source of truth, presence stays honest to it.
  'trout-calendar.json': readFileSync(
    resolve(import.meta.dirname, '..', 'data', 'trout-calendar.json'),
    'utf8',
  ),
};

for (const [rid, charts] of hatch) {
  mkdirSync(join(OUT, 'hatch', rid), { recursive: true });
  for (const chart of charts) {
    files[`hatch/${rid}/${chart.month}.json`] = JSON.stringify(chart);
  }
}

let total = 0;
for (const [name, body] of Object.entries(files)) {
  const p = join(OUT, name.replaceAll('/', '\\'));
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, body);
  total += body.length;
}

const meta = {
  generatedAt: new Date().toISOString(),
  counts: { bugs: bugs.size, patterns: patterns.size, streams: streams.size, shops: shops.size, regions: hatch.size },
  packBytes: total,
  packMaxBytes: FLOORS.packMaxMb * 1024 * 1024,
};
writeFileSync(join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));

const mb = total / (1024 * 1024);
console.log(`[content] pack built at dist/pack (${mb.toFixed(2)} MB of ${FLOORS.packMaxMb} MB budget, ${Object.keys(files).length + 1} files)`);
if (total > meta.packMaxBytes) {
  console.error(`[content] FAILED: pack exceeds the ${FLOORS.packMaxMb} MB budget`);
  process.exit(1);
}
