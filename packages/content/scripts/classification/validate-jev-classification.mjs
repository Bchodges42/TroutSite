#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Run or dry-run the Jev fishery classifier over the complete Fishbrain
 * GraphQL research set (featured + standard tier = 190 Tennessee waters),
 * then score against the owner-reviewed labels.
 *
 * Examples:
 *   node packages/content/scripts/classification/validate-jev-classification.mjs --dry-run
 *   node packages/content/scripts/classification/validate-jev-classification.mjs --month July --limit 5 --write
 *   node packages/content/scripts/classification/validate-jev-classification.mjs --month 1 --write          # full 190 live
 *
 * Evaluation integrity (2026-09-17 directive):
 *   - Owner-reviewed labels are NEVER in the model state. Raw answers are
 *     scored as-is; "effective" answers apply reviewed labels as a code-level
 *     production override, and both are reported separately.
 *   - Only the 8 reviewed waters have ground truth (conditional accuracy).
 *     The other 182 are held out: category counts + confidence only.
 *   - No accuracy number from this script is a formal benchmark.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DIFF_OUT_DIR,
  REPO_ROOT,
} from './lib.mjs';
import {
  CATEGORY_LABELS,
  FISHBRAIN_PATH,
  FISHBRAIN_STANDARD_PATH,
  MODEL,
  MONTHS,
  callJev,
  categoryAnswer,
  categoryMonthConsistency,
  effectiveCategory,
  evidenceState,
  fishbrainCatalogSlugs,
  fishbrainRecordCount,
  normalizeMonth,
  reviewedCategory,
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

if (limit !== Infinity && (!Number.isInteger(limit) || limit < 0)) {
  throw new Error(`--limit must be a non-negative integer; got ${limitArg}`);
}

const fishbrainSlugs = fishbrainCatalogSlugs();
const targetSlugs = fishbrainSlugs.slice(0, limit);

console.log(JSON.stringify({
  model: MODEL,
  month: { number: month, name: MONTHS[month - 1] },
  fishbrainRecords: fishbrainRecordCount(),
  targets: targetSlugs.length,
  scope: 'Fishbrain GraphQL featured + standard records (190 unique Tennessee waters)',
  ownerReviewInState: false,
  dryRun,
}, null, 2));

if (dryRun) {
  const checks = targetSlugs.map((slug) => {
    const state = evidenceState(slug, { month });
    const fishbrainEvidence = state.evidence.fishbrainDiscovery;
    return {
      slug,
      tier: fishbrainEvidence.tier,
      matchStatus: fishbrainEvidence.matchStatus ?? 'no-record',
      water: state.water.name,
      waterbodyType: state.water.waterbodyType,
      ledgerAvailable: state.evidence.auditedLedger.available,
      stockingEvents: state.evidence.twraStocking.matchedEvents.length,
      freshwaterTroutSpecies: fishbrainEvidence.freshwaterTrout?.map((item) => item.name) ?? [],
      excludedMarineSpecies: fishbrainEvidence.excludedMarineOrBrackish?.map((item) => item.name) ?? [],
      segmentReviewReasons: fishbrainEvidence.segmentReviewReasons?.length ?? 0,
      ownerReviewInState: 'ownerReview' in state.evidence,
      categoryOptions: Object.keys(CATEGORY_LABELS),
    };
  });
  const summary = {
    targets: checks.length,
    tiers: checks.reduce((m, c) => ((m[c.tier] = (m[c.tier] ?? 0) + 1), m), {}),
    notFound: checks.filter((c) => c.matchStatus === 'not-found').length,
    needsSegmentReview: checks.filter((c) => c.segmentReviewReasons > 0).length,
    withLedger: checks.filter((c) => c.ledgerAvailable).length,
    withStockingEvents: checks.filter((c) => c.stockingEvents > 0).length,
    anyOwnerReviewLeak: checks.some((c) => c.ownerReviewInState),
  };
  console.log(JSON.stringify({ summary, checks }, null, 2));
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
      const monthNouls = {};
      for (const name of MONTHS) monthNouls[name] = response?.answers?.[`month_${name}`]?.noul ?? null;
      const consistency = categoryMonthConsistency(answer.choice, monthNouls);
      const reviewed = reviewedCategory(slug);
      results.push({
        slug,
        requestedMonth: month,
        rawChoice: answer.choice,
        rawLabel: answer.label,
        probabilities: answer.probabilities,
        confidence: answer.confidence,
        effectiveCategory: effectiveCategory(slug, answer.choice),
        overrideApplied: reviewed !== null && reviewed !== answer.choice,
        reviewedLabelAvailable: reviewed !== null,
        currentMonthTrout: answer.currentMonthTrout,
        evidenceQuality: answer.evidenceQuality,
        monthsTrue: consistency.monthsTrue,
        consistencyFlags: consistency.flags,
        model: answer.model,
      });
    } catch (error) {
      results.push({ slug, requestedMonth: month, error: error.message });
    }
    completed += 1;
    if (completed % 10 === 0 || completed === targetSlugs.length) console.log(`completed ${completed}/${targetSlugs.length}`);
  }
}
await Promise.all(Array.from({ length: Math.min(4, Math.max(1, targetSlugs.length)) }, worker));
results.sort((a, b) => a.slug.localeCompare(b.slug));

// ------------------------------------------------------------------ scoring
const scored = results.filter((r) => !r.error);
const errors = results.filter((r) => r.error);
const reviewedRows = scored.filter((r) => r.reviewedLabelAvailable);
const rawHits = reviewedRows.filter((r) => r.rawChoice === reviewedCategory(r.slug));
const effectiveHits = reviewedRows.filter((r) => r.effectiveCategory === reviewedCategory(r.slug));
const overrides = scored.filter((r) => r.overrideApplied);
const categoryCounts = scored.reduce((m, r) => ((m[r.effectiveCategory] = (m[effectiveKey(r)] ?? 0) + 1), m), {});
function effectiveKey(r) { return r.effectiveCategory; }
const confidenceBuckets = { '<0.4': 0, '0.4-0.6': 0, '0.6-0.8': 0, '>=0.8': 0 };
for (const r of scored) {
  if (r.confidence < 0.4) confidenceBuckets['<0.4'] += 1;
  else if (r.confidence < 0.6) confidenceBuckets['0.4-0.6'] += 1;
  else if (r.confidence < 0.8) confidenceBuckets['0.6-0.8'] += 1;
  else confidenceBuckets['>=0.8'] += 1;
}
const lowConfidence = scored.filter((r) => r.confidence < 0.6).map((r) => ({ slug: r.slug, confidence: r.confidence, category: r.effectiveCategory }));
const notFoundCount = scored.filter((r) => {
  const state = evidenceState(r.slug, { month });
  return state.evidence.fishbrainDiscovery.matchStatus === 'not-found';
}).length;
const inconsistent = scored.filter((r) => r.consistencyFlags.length > 0);

const output = {
  generated: new Date().toISOString(),
  model: MODEL,
  month: { number: month, name: MONTHS[month - 1] },
  fishbrainPaths: [FISHBRAIN_PATH, FISHBRAIN_STANDARD_PATH].map((path) => path.slice(REPO_ROOT.length + 1)),
  evaluationIntegrity: {
    ownerReviewInState: false,
    note: 'Raw = model answer with no reviewed labels in state. Effective = reviewed label applied as a code override where available. Conditional accuracy is over the 8 reviewed waters only; the rest are held out.',
  },
  summary: {
    targets: targetSlugs.length,
    evaluated: scored.length,
    errors: errors.length,
    conditionalAccuracy: {
      reviewedWaters: reviewedRows.length,
      rawCorrect: rawHits.length,
      rawAccuracy: reviewedRows.length ? +(rawHits.length / reviewedRows.length).toFixed(3) : null,
      effectiveCorrect: effectiveHits.length,
      effectiveAccuracy: reviewedRows.length ? +(effectiveHits.length / reviewedRows.length).toFixed(3) : null,
      overridesApplied: overrides.length,
      perLabel: reviewedRows.map((r) => ({
        slug: r.slug,
        reviewed: reviewedCategory(r.slug),
        raw: r.rawChoice,
        effective: r.effectiveCategory,
        confidence: r.confidence,
        match: r.rawChoice === reviewedCategory(r.slug),
      })),
    },
    heldOut: {
      waters: scored.length - reviewedRows.length,
      categoryCounts,
      note: 'no ground truth; counts and confidence only',
    },
    confidenceDistribution: confidenceBuckets,
    lowConfidenceBelow06: lowConfidence,
    notFoundEvidenceWaters: notFoundCount,
    consistencyFlags: inconsistent.map((r) => ({ slug: r.slug, flags: r.consistencyFlags })),
  },
  results,
};
if (writeResults) {
  mkdirSync(DIFF_OUT_DIR, { recursive: true });
  const outputPath = join(DIFF_OUT_DIR, 'jev-classification-eval.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`wrote ${outputPath}`);
}

console.log(`\n=== CLASSIFICATION SUMMARY (${scored.length}/${targetSlugs.length} evaluated, ${errors.length} errors) ===`);
console.log(`conditional accuracy on ${reviewedRows.length} reviewed waters: raw ${rawHits.length}/${reviewedRows.length} (${((rawHits.length / Math.max(1, reviewedRows.length)) * 100).toFixed(0)}%), effective ${effectiveHits.length}/${reviewedRows.length} (overrides: ${overrides.length})`);
for (const r of reviewedRows) {
  const reviewed = reviewedCategory(r.slug);
  console.log(`  ${r.slug.padEnd(26)} reviewed=${(reviewed ?? '—').padEnd(36)} raw=${(r.rawChoice ?? '—').padEnd(36)} conf=${r.confidence} ${r.rawChoice === reviewed ? 'MATCH' : 'DIFFER'}`);
}
console.log(`held-out category counts:`, JSON.stringify(categoryCounts));
console.log(`confidence distribution:`, JSON.stringify(confidenceBuckets));
console.log(`low-confidence (<0.6): ${lowConfidence.length}`);
lowConfidence.slice(0, 10).forEach((r) => console.log(`  ${r.slug} ${r.confidence} ${r.category}`));
console.log(`not-found evidence waters: ${notFoundCount}`);
console.log(`consistency flags: ${inconsistent.length}`);
inconsistent.slice(0, 10).forEach((r) => console.log(`  ${r.slug}: ${r.consistencyFlags.join(' | ')}`));
errors.slice(0, 5).forEach((r) => console.log(`ERROR ${r.slug}: ${r.error}`));
