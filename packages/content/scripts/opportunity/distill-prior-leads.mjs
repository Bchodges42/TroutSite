/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Distill the six habitat-research batch records (branches
 * evidence/habitat-batch1..batch6, 190 records) into per-water PRIOR LEADS:
 * source URLs, segment boundaries, and the record's own verdict — kept
 * strictly as leads. The 2026-09-21 evidence-methods audit reproduced
 * unchecked-string gates, lake/tailwater category errors, and low-confidence
 * agreement in this layer, so nothing here is a verdict; each lead says what
 * the NEXT source must answer.
 *
 * Run from repo root:
 *   node packages/content/scripts/opportunity/distill-prior-leads.mjs <seedsRoot>
 * where <seedsRoot> holds notes/habitat-batch<N>/*.json (extracted from the
 * research branches; not committed to main).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
let seedsRoot = process.argv[2] ?? join(root, "evidence-work", "seeds");
const outPath = join(root, 'docs', 'research', '2026-09-22-fishery-opportunities', 'prior-leads.json');

const waters = {};
// Seeds may sit directly in seedsRoot or one level down (notes/), depending on
// how the research branches were extracted.
let batchDirs = [];
for (const base of [seedsRoot, join(seedsRoot, 'notes')]) {
  try {
    batchDirs = readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^habitat-batch\d+$/.test(d.name))
      .map((d) => d.name)
      .sort();
    if (batchDirs.length) { seedsRoot = base; break; }
  } catch { /* try next base */ }
}
if (!batchDirs.length) {
  console.error('no notes/habitat-batchN dirs under', seedsRoot);
  process.exit(1);
}
const batchRoot = seedsRoot;

let count = 0;
for (const dir of batchDirs) {
  const batch = dir.replace('habitat-', '');
  const files = readdirSync(join(batchRoot, dir)).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const rec = JSON.parse(readFileSync(join(seedsRoot, dir, f), 'utf8'));
    const slug = rec.slug ?? f.replace(/\.json$/, '');
    if (waters[slug]) {
      console.error('DUPLICATE prior record for', slug, 'in', batch);
      process.exit(1);
    }
    const temp = Array.isArray(rec.summerTemperature) ? rec.summerTemperature : [];
    waters[slug] = {
      batch,
      recordPath: `notes/${batch}/${f} (branch evidence/${batch})`,
      segment: rec.segment?.description ?? null,
      boundaries: rec.segment?.boundaries ?? null,
      coldSourceSummary: rec.coldSource
        ? {
            damTailwater: rec.coldSource.damTailwater ? { dam: rec.coldSource.damTailwater.dam, operator: rec.coldSource.damTailwater.operator, releaseType: rec.coldSource.damTailwater.releaseType } : null,
            springFed: rec.coldSource.springFed?.value ?? null,
            notes: rec.coldSource.notes ?? null,
          }
        : null,
      summerTemperatureCount: temp.length,
      summerTemperature: temp.slice(0, 8),
      holdover: rec.holdover ? { documented: rec.holdover.documented, detail: rec.holdover.detail ?? null } : null,
      wildPopulation: rec.wildPopulation ? { documented: rec.wildPopulation.documented, detail: rec.wildPopulation.detail ?? null } : null,
      troutSpecies: rec.troutSpecies ?? [],
      overallSurvivalRead: rec.overallSurvivalRead ?? null,
      sourcesChecked: rec.sourcesChecked ?? [],
    };
    count += 1;
  }
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ meta: { batches: batchDirs, recordCount: count, generatedAt: new Date().toISOString(), warning: 'PRIOR RESEARCH LEADS — not verified claims; see docs/reports/2026-09-21-evidence-methods-audit (research branch codex/evidence-methods-audit-20260921)' }, waters }, null, 2));
console.log('prior leads written:', count, 'waters →', outPath);
