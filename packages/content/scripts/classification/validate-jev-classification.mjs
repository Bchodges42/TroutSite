#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Run or dry-run the Jev fishery classifier over the complete Fishbrain
 * GraphQL research set (featured and standard-tier waters).
 *
 * Examples:
 *   node packages/content/scripts/classification/validate-jev-classification.mjs --dry-run
 *   node packages/content/scripts/classification/validate-jev-classification.mjs --month July --limit 5 --write
 *   node packages/content/scripts/classification/validate-jev-classification.mjs --all --month 1 --write
 *
 * Live results are advisory evidence for review. This script never edits a
 * stream YAML file. Use --write to save the returned distributions.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DIFF_OUT_DIR,
  REPO_ROOT,
  loadCatalog,
  loadLedgerDiff,
} from './lib.mjs';
import {
  CATEGORY_CRITERIA,
  FISHBRAIN_PATH,
  FISHBRAIN_STANDARD_PATH,
  MODEL,
  MONTHS,
  categoryAnswer,
  callJev,
  evidenceState,
  fishbrainCatalogSlugs,
  fishbrainRecordCount,
  normalizeMonth,
} from './jev-classify.mjs';

const arg = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
};
const limitArg = arg('--limit');
const limit = limitArg === null ? Infinity : Number(limitArg);
const month = normalizeMonth(arg('--month') ?? new Date().getMonth() + 1);
const dryRun = process.argv.includes('--dry-run');
const writeResults = process.argv.includes('--write');
const includeAll = process.argv.includes('--all');
const includeLedger = process.argv.includes('--include-ledger');

if (limit !== Infinity && (!Number.isInteger(limit) || limit < 0)) {
  throw new Error(`--limit must be a non-negative integer; got ${limitArg}`);
}

const ledgerSlugs = loadLedgerDiff().rows.map((row) => row.slug);
const catalogSlugs = loadCatalog().map((water) => water.slug);
const fishbrainSlugs = fishbrainCatalogSlugs();
const seed = includeAll ? catalogSlugs : fishbrainSlugs;
const targetSlugs = [...new Set([
  ...seed,
  ...(includeLedger ? ledgerSlugs : []),
])].slice(0, limit);

console.log(JSON.stringify({
  model: MODEL,
  month: { number: month, name: MONTHS[month - 1] },
  fishbrainRecords: fishbrainRecordCount(),
  targets: targetSlugs.length,
  scope: includeAll ? 'all catalog waters' : includeLedger ? 'Fishbrain GraphQL records + audited ledger waters' : 'Fishbrain GraphQL featured + standard records',
  dryRun,
}, null, 2));

if (dryRun) {
  const checks = targetSlugs.map((slug) => {
    const state = evidenceState(slug, { month });
    const fishbrainEvidence = state.evidence.fishbrainDiscovery;
    return {
      slug,
      requestedMonth: state.requestedMonth,
      stateWater: state.water.name,
      catalogAvailable: state.evidence.catalog.available,
      ledgerAvailable: state.evidence.auditedLedger.available,
      stockingEvents: state.evidence.twraStocking.matchedEvents.length,
      fishbrainAvailable: fishbrainEvidence.available,
      acceptedFreshwaterTroutSpecies: fishbrainEvidence.freshwaterTrout?.map((item) => item.name) ?? [],
      excludedMarineSpecies: fishbrainEvidence.excludedMarineOrBrackish?.map((item) => item.name) ?? [],
      categoryOptions: Object.keys(CATEGORY_CRITERIA),
    };
  });
  console.log(JSON.stringify({ checks }, null, 2));
  process.exit(0);
}

const queue = [...targetSlugs];
const results = [];
let completed = 0;
async function worker() {
  for (;;) {
    const slug = queue.shift();
    if (!slug) return;
    try {
      const response = await callJev(evidenceState(slug, { month }), { month });
      const answer = categoryAnswer(response);
      results.push({ slug, requestedMonth: month, ...answer });
    } catch (error) {
      results.push({ slug, requestedMonth: month, error: error.message });
    }
    completed += 1;
    if (completed % 10 === 0 || completed === targetSlugs.length) console.log(`completed ${completed}/${targetSlugs.length}`);
  }
}
await Promise.all(Array.from({ length: Math.min(4, Math.max(1, targetSlugs.length)) }, worker));
results.sort((a, b) => a.slug.localeCompare(b.slug));

const output = {
  generated: new Date().toISOString(),
  model: MODEL,
  month: { number: month, name: MONTHS[month - 1] },
  fishbrainPaths: [FISHBRAIN_PATH, FISHBRAIN_STANDARD_PATH].map((path) => path.slice(REPO_ROOT.length + 1)),
  results,
};
if (writeResults) {
  mkdirSync(DIFF_OUT_DIR, { recursive: true });
  const outputPath = join(DIFF_OUT_DIR, 'jev-classification-eval.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`wrote ${outputPath}`);
}
