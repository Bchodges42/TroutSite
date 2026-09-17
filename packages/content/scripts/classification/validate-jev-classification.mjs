#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Jev SPECIES-CLASSIFIER gate — the owner-directed use, scored against the
 * audited wave-ledger corpus before any wiring.
 *
 * Owner-ruling overrides applied to the truth table (documented, from the
 * 2026-09-15 cross-check in wave-ledgers/apply-manifest.mjs):
 *   - roaring-fork: 'none-found' class was REJECTED as a strip candidate —
 *     NPS documents wild trout park-wide, so trout-wild is the ruled truth.
 * Everything else scores as the ledger records it.
 *
 *   node packages/content/scripts/classification/validate-jev-classification.mjs [--limit N]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadLedgerDiff, LEDGER_DIR } from './lib.mjs';
import { evidenceState, callJev, MONTHS, MODEL } from './jev-classify.mjs';

const limit = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? Number(process.argv[i + 1]) : Infinity; })();

const ledgerRows = loadLedgerDiff().rows;

// Owner-ruled truths (see header). Keyed by slug: the class the 2026-09-15
// cross-check established over the ledger's coarse class line.
const RULINGS = {
  'roaring-fork': 'trout-wild',
};

const TROUTISH = new Set(['trout-wild', 'trout-stocked-seasonal', 'trout-stocked-year-round', 'mixed']);

const targets = ledgerRows.filter((r) => r.verdict?.ledger && r.verdict.ledger !== 'unclear').slice(0, limit);
console.log(`evaluating ${targets.length} audited waters (${MODEL})...\n`);

const results = [];
let done = 0;
const queue = [...targets];
async function worker() {
  for (;;) {
    const row = queue.shift();
    if (!row) return;
    try {
      const json = await callJev(evidenceState(row.slug));
      const cls = json.answers?.trout_class?.choice ?? 'unknown';
      const months = MONTHS.filter((m) => (json.answers?.[`month_${m}`]?.noul ?? 0) >= 0.5).map((m) => MONTHS.indexOf(m) + 1);
      results.push({
        slug: row.slug,
        truthClass: RULINGS[row.slug] ?? row.class ?? null,
        ledgerSpecies: row.verdict.ledger,
        predicted: cls,
        confidence: json.answers?.trout_class?.confidence ?? 0,
        months,
        ledgerMonths: row.season?.ledgerMonths ?? null,
      });
    } catch (e) {
      results.push({ slug: row.slug, error: e.message });
    }
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${targets.length}`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

// ---------------------------------------------------------------- scoring
mkdirSync(join(LEDGER_DIR, '..', '2026-09-17-classification-diff'), { recursive: true });
writeFileSync(join(LEDGER_DIR, '..', '2026-09-17-classification-diff', 'jev-classification-eval.json'), JSON.stringify({ generated: new Date().toISOString(), model: MODEL, results }, null, 2));

let n = 0, classHit = 0, classTotal = 0, falseTrout = 0, falseTroutList = [], missedTrout = 0;
const confusion = new Map();
let monthWaters = 0, monthJaccardSum = 0, monthExact = 0;
for (const r of results) {
  if (r.error) continue;
  n += 1;
  const truthLabel = r.truthClass ?? r.ledgerSpecies;
  confusion.set(`${truthLabel} → ${r.predicted}`, (confusion.get(`${truthLabel} → ${r.predicted}`) ?? 0) + 1);
  if (r.truthClass) {
    classTotal += 1;
    if (r.predicted === r.truthClass) classHit += 1;
  }
  const truthTroutish = r.ledgerSpecies === 'trout' || TROUTISH.has(r.truthClass ?? '');
  const predTroutish = TROUTISH.has(r.predicted);
  if (!truthTroutish && predTroutish) {
    // a trout claim on a water the ledgers found no trout in — poisoning risk
    falseTrout += 1;
    falseTroutList.push(`${r.slug} → ${r.predicted} (conf ${r.confidence})`);
  }
  if (truthTroutish && !predTroutish) missedTrout += 1;
  if (r.ledgerMonths?.length) {
    monthWaters += 1;
    const a = new Set(r.months);
    const b = new Set(r.ledgerMonths);
    let inter = 0;
    for (const m of a) if (b.has(m)) inter += 1;
    const union = a.size + b.size - inter;
    const jac = union === 0 ? 1 : inter / union;
    monthJaccardSum += jac;
    if (jac === 1) monthExact += 1;
  }
}

console.log(`\n=== JEV SPECIES-CLASSIFIER GATE (vs audited ledger, owner rulings applied) ===\n`);
console.log(`evaluated: ${n} waters`);
console.log(`concrete-class accuracy: ${classHit}/${classTotal} (${((classHit / Math.max(1, classTotal)) * 100).toFixed(0)}%)  [bar: 75%]`);
console.log(`genuine false-trout: ${falseTrout}  [bar: 0]  ${falseTroutList.join('; ') || '(none)'}`);
console.log(`missed-trout (trout truth called warmwater/unknown): ${missedTrout}  [bar: 0]`);
console.log(`month windows: mean Jaccard ${(monthJaccardSum / Math.max(1, monthWaters)).toFixed(2)} over ${monthWaters}, exact sets ${monthExact}`);
console.log('\nconfusion (truth → predicted):');
for (const [k, v] of [...confusion.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);

const barOk = falseTrout === 0 && missedTrout === 0 && classHit / Math.max(1, classTotal) >= 0.75;
console.log(`\nVERDICT: ${barOk ? 'ABOVE BAR — wire as ADVISORY proposals for unset waters (decision boxes only)' : 'BELOW BAR — stays report-only'}`);
process.exit(0);
