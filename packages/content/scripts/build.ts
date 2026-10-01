// OWNER: ROLE 4. Build the compact bundled JSON content pack the PWA precaches
// (CHAT-4 scope 2, §3: read path is static JSON; payload budget ≤ 20 MB).
// Output: dist/pack/ — bugs.json, patterns.json, streams.json, shops.json, regions.json,
// fishing.json (data-sources lane: structured fishing-information content),
// hatch/{regionId}/{month}.json (same shape as the /v1/hatch/{regionId}/{month}.json snapshot),
// plus meta.json. Returns non-zero if the pack exceeds the size budget.
import { accessSync, mkdirSync, readFileSync, rmSync, writeFileSync, constants } from 'node:fs';
import { join, resolve } from 'node:path';
import { FishingInformationSchema } from '@trout/contracts';
import { loadContent, loadSpeciesReference, FLOORS } from './lib.js';
import { loadAccess, toAccessPack } from './access/load.js';
import { REGIONS } from './regions.js';

const OUT = resolve(import.meta.dirname, '..', 'dist', 'pack');
const { bugs, patterns, streams, shops, hatch, illustrations, issues } = loadContent();
const { species, issues: speciesIssues } = loadSpeciesReference();
issues.push(...speciesIssues);

// Verified access records (ADR 0019): same gate validate.ts runs. An empty
// corpus is VALID — access.json still ships as `{ records: [] }` (honest
// empty, stable shape); example- fixtures never reach the pack.
const access = loadAccess(new Set(streams.keys()));
issues.push(...access.issues);

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
  // F2 species reference (comfort + activity bands, every value cited) — the
  // fishability scorer's data source once contracts v2 lands (Session A).
  'species.json': JSON.stringify({ species: [...species.entries()].map(([id, ref]) => ({ id, ...ref })) }),
  // Verified access records (ADR 0019), grouped by waterId. Stable shape at
  // zero records: `{ records: [] }` — absence of verified access is stated,
  // never implied by a missing file. The web reads it through the same
  // precached /content/*.json path as taxa/patterns.
  'access.json': JSON.stringify(toAccessPack(access.records)),
};

for (const [rid, charts] of hatch) {
  mkdirSync(join(OUT, 'hatch', rid), { recursive: true });
  for (const chart of charts) {
    files[`hatch/${rid}/${chart.month}.json`] = JSON.stringify(chart);
  }
}

let total = 0;
for (const [name, body] of Object.entries(files)) {
  // Keys use '/' as a logical separator; join real directories per-platform
  // (T1-5: a literal backslash in the joined name wrote unusable files on POSIX).
  const p = join(OUT, ...name.split('/'));
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, body);
  total += body.length;
}

// Self-check (T1-5 regression): every hatch chart must exist and be readable at its
// intended path — 12 regions × 12 months. A silent writer bug must fail the build,
// not surface later as hatchCharts:0 in the app.
{
  let checked = 0;
  const missing: string[] = [];
  for (const region of REGIONS) {
    for (let month = 1; month <= 12; month++) {
      const p = join(OUT, 'hatch', region.id, `${month}.json`);
      try {
        accessSync(p, constants.R_OK);
        checked++;
      } catch {
        missing.push(`hatch/${region.id}/${month}.json`);
      }
    }
  }
  if (missing.length > 0) {
    console.error(`[content] FAILED: ${missing.length} hatch chart(s) unreadable at their intended paths:`);
    for (const m of missing) console.error(`[content]   ${m}`);
    process.exit(1);
  }
  console.log(`[content] self-check: ${checked} hatch chart files readable`);
}

const meta = {
  generatedAt: new Date().toISOString(),
  counts: { bugs: bugs.size, patterns: patterns.size, streams: streams.size, shops: shops.size, regions: hatch.size, species: species.size, access: access.records.length },
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
