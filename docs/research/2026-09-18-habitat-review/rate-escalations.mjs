#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Run Jev over every classifier escalation and record the typed verdicts.
 * Produces jev-ratings.json consumed by build-review.mjs, which then shows
 * the owner the ACTUAL review items: Jev-vs-code disagreements and Jev
 * abstentions. Requires TYPESAFE_API_KEY in the clone root .env (gitignored).
 *
 * Usage: node docs/research/2026-09-18-habitat-review/rate-escalations.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, escalateJev, resolveEscalation } from '../../../packages/content/scripts/classification/code-classify.mjs';
import { loadExtracted, buildEnrichedInput } from '../../../packages/content/scripts/classification/habitat-input.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
if (!existsSync(join(root, '.env'))) {
  console.error('NO .env in this clone — add TYPESAFE_API_KEY=<key> to the clone root .env (gitignored), then rerun.');
  process.exit(1);
}
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const batches = [
  ...read('packages/content/research/habitat-survival/batch1.json'),
  ...read('packages/content/research/habitat-survival/batch2.json'),
  ...read('packages/content/research/habitat-survival/batch3.json'),
  ...read('packages/content/research/habitat-survival/batch4.json'),
];
const { composite, fishbrainBySlug, troutNames } = loadExtracted();

const inputs = batches.map((rec) => buildEnrichedInput(rec, composite, fishbrainBySlug, troutNames));
const escalations = inputs
  .map((input) => ({ input, verdict: classify(input) }))
  .filter((x) => x.verdict.escalate);

console.log(`escalations to rate: ${escalations.length}`);
const results = [];
const CONCURRENCY = 5;
for (let i = 0; i < escalations.length; i += CONCURRENCY) {
  const chunk = escalations.slice(i, i + CONCURRENCY);
  const rated = await Promise.all(chunk.map(async ({ input, verdict }) => {
    const slug = input.evidenceRecord.slug;
    try {
      const jev = await escalateJev(input);
      const resolution = resolveEscalation(jev, verdict.label);
      console.log(`  ${slug}: jev=${jev.choice ?? jev.decision} code=${verdict.label} -> ${resolution.resolution}`);
      return { slug, codeLabel: verdict.label, codeConfidence: verdict.confidence, conflicts: verdict.conflicts, jev, resolution };
    } catch (e) {
      console.log(`  ${slug}: ERROR ${String(e.message).slice(0, 120)}`);
      return { slug, codeLabel: verdict.label, conflicts: verdict.conflicts, error: String(e.message).slice(0, 300), resolution: { resolution: 'error' } };
    }
  }));
  results.push(...rated);
}

const out = join(dirname(fileURLToPath(import.meta.url)), 'jev-ratings.json');
writeFileSync(out, JSON.stringify({ ratedAt: new Date().toISOString(), model: 'jev-latest', results }, null, 2));
const agree = results.filter((r) => r.resolution.resolution === 'accept').length;
const disagree = results.filter((r) => r.resolution.resolution === 'owner-box').length;
const pending = results.filter((r) => r.resolution.resolution === 'escalate-pending').length;
const errors = results.filter((r) => r.resolution.resolution === 'error').length;
console.log(`wrote ${out}`);
console.log(`agree=${agree} owner-box=${disagree} pending=${pending} errors=${errors}`);
