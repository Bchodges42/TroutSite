/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/** Counts for the implementation report: headlines × evidence states, and by
 *  waterbody type. Run after merge-verdicts.mjs. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARTIFACT_DIR } from './lib.mjs';

const ledger = JSON.parse(readFileSync(join(ARTIFACT_DIR, 'ledger.json'), 'utf8'));
const h = {};
const e = {};
const byType = {};
for (const w of ledger.waters) {
  const headline = w.adjudicated ? w.headline.troutOpportunity : 'NOT-ADJUDICATED';
  const state = w.adjudicated ? w.headline.evidenceState : 'NOT-ADJUDICATED';
  h[headline] = (h[headline] ?? 0) + 1;
  e[state] = (e[state] ?? 0) + 1;
  const t = w.waterbodyType;
  byType[t] ??= {};
  byType[t][headline] = (byType[t][headline] ?? 0) + 1;
}
console.log('headline:', JSON.stringify(h));
console.log('evidence:', JSON.stringify(e));
console.log('byType:', JSON.stringify(byType, null, 1));
