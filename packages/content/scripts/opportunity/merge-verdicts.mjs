/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * merge-verdicts — fold the adjudication lanes' per-water verdict files into
 * the final ledger.json.
 *
 *   node packages/content/scripts/opportunity/merge-verdicts.mjs
 *
 * Every catalog id MUST have a verdict file under evidence-work/adj/lane-*/
 * (except seed entries explicitly marked not-adjudicated, which fail loudly
 * in --strict mode). The seed's identity/backbone blocks are preserved;
 * headline/claims/unresolvedQuestion/qualifications/flags come from the
 * verdict.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARTIFACT_DIR, REPO_ROOT } from './lib.mjs';

const strict = process.argv.includes('--strict');
const seed = JSON.parse(readFileSync(join(ARTIFACT_DIR, 'ledger.seed.json'), 'utf8'));
const adjRoot = join(REPO_ROOT, 'evidence-work', 'adj');

// Collect verdict files from every lane dir.
const verdicts = new Map();
const laneSummaries = [];
for (const dir of readdirSync(adjRoot, { withFileTypes: true })) {
  if (!dir.isDirectory() || !/^lane-/.test(dir.name)) continue;
  let count = 0;
  for (const f of readdirSync(join(adjRoot, dir.name))) {
    if (!f.endsWith('.json') || f.endsWith('-input.json')) continue;
    const path = join(adjRoot, dir.name, f);
    try {
      const v = JSON.parse(readFileSync(path, 'utf8'));
      if (!v.id || !v.headline) {
        console.error(`WARN: ${path} is not a verdict file (missing id/headline); skipped`);
        continue;
      }
      if (verdicts.has(v.id)) console.error(`WARN: duplicate verdict for ${v.id} (${verdicts.get(v.id).lane} vs ${dir.name}) — keeping the later (${dir.name})`);
      verdicts.set(v.id, { lane: dir.name, v });
      count += 1;
    } catch (e) {
      console.error(`ERROR: cannot parse ${path}: ${e.message}`);
      process.exitCode = 1;
    }
  }
  const summaryPath = join(adjRoot, dir.name, 'SUMMARY.md');
  const summary = existsSyncCompat(summaryPath) ? readFileSync(summaryPath, 'utf8') : null;
  laneSummaries.push({ lane: dir.name, verdicts: count, summary });
}
function existsSyncCompat(p) {
  try {
    readdirSync(p);
    return true;
  } catch {
    try {
      readFileSync(p);
      return true;
    } catch {
      return false;
    }
  }
}

const missing = [];
const waters = seed.waters.map((entry) => {
  const hit = verdicts.get(entry.id);
  if (!hit) {
    missing.push(entry.id);
    return { ...entry, adjudicated: false };
  }
  const v = hit.v;
  return {
    ...entry,
    adjudicated: true,
    adjudicatedBy: hit.lane,
    headline: {
      troutOpportunity: v.headline.troutOpportunity,
      warmwaterFocus: v.headline.warmwaterFocus ?? null,
      evidenceState: v.headline.evidenceState,
      reachScope: v.headline.reachScope ?? null,
      statement: v.headline.statement ?? null,
      asOf: v.headline.asOf ?? null,
    },
    claims: v.claims ?? [],
    unresolvedQuestion: v.unresolvedQuestion ?? null,
    qualifications: v.qualifications ?? [],
    flags: v.flags ?? [],
    scheduleJoin: {
      seedVerdict: entry.backbone.scheduleProgram ? 'joined' : 'no-join',
      laneVerdict: v.scheduleJoinVerdict ?? null,
      note: v.scheduleJoinNote ?? null,
    },
    catalogFieldCorrections: v.catalogFieldCorrections ?? null,
    webChecks: v.webChecks ?? [],
  };
});

console.log(`verdicts: ${verdicts.size} | waters: ${waters.length} | missing: ${missing.length}`);
if (missing.length) {
  console.error('waters without verdicts:', missing.join(', '));
  if (strict) process.exit(1);
}
const counts = { headline: {}, evidenceState: {} };
for (const w of waters) {
  const key = w.adjudicated ? w.headline.troutOpportunity : 'NOT-ADJUDICATED';
  counts.headline[key] = (counts.headline[key] ?? 0) + 1;
  const ekey = w.adjudicated ? w.headline.evidenceState : 'NOT-ADJUDICATED';
  counts.evidenceState[ekey] = (counts.evidenceState[ekey] ?? 0) + 1;
}
console.log('headlines:', JSON.stringify(counts.headline, null, 0));
console.log('evidence states:', JSON.stringify(counts.evidenceState, null, 0));

const out = {
  meta: {
    ...seed.meta,
    mergedAt: new Date().toISOString(),
    laneSummaries: laneSummaries.map((s) => ({ lane: s.lane, verdicts: s.verdicts })),
  },
  scheduleJoinStats: seed.scheduleJoinStats,
  unmatchedScheduleRows: seed.unmatchedScheduleRows,
  counts,
  waters,
};
writeFileSync(join(ARTIFACT_DIR, 'ledger.json'), JSON.stringify(out, null, 2));
console.log('ledger.json written');
