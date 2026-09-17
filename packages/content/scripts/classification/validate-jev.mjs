#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Jev known-answer gate — run BEFORE trusting/advising with Jev verdicts.
 *
 * Fixture cases come from the audited wave ledgers + the deterministic
 * resolver's proven traps (see validate-known-answers.mjs). Jev must:
 *   - hit ≥90% of positive/family cases,
 *   - ABSTAIN on the Mill Creek (Hickman) trap (picking the Overton water
 *     through a county contradiction is the exact failure mode this gate
 *     exists for),
 * else Jev stays advisory-only in decision boxes and the deterministic
 * matcher remains authoritative. Even at the bar, Jev output ships as
 * advice in the owner's decision boxes — never as a direct write.
 *
 *   node packages/content/scripts/classification/validate-jev.mjs
 */
import { loadCatalog, normalizeName, normCounty, coreName, resolveEvent, ALIASES, loadStockingGeojson, eventsFromGeojson } from './lib.mjs';
import { jevResolve } from './judge.mjs';

const catalog = loadCatalog();
const bySlug = (slug) => {
  const w = catalog.find((x) => x.slug === slug);
  if (!w) throw new Error(`fixture slug missing: ${slug}`);
  return { slug, name: w.doc.name, counties: (w.doc.hydroIdentity?.counties ?? []).map(normCounty), bounds: w.bounds };
};
// Borrow real coordinates from the committed feed so the coord evidence is
// authentic, not invented.
const realCoords = new Map();
for (const ev of eventsFromGeojson(loadStockingGeojson()).events) {
  if (ev.sampleCoord) realCoords.set(`${normCounty(ev.county)}|${normalizeName(ev.water)}`, ev.sampleCoord);
}
const coordFor = (ev) => realCoords.get(`${normCounty(ev.county)}|${normalizeName(ev.water)}`) ?? null;

// [event, expected slug | {family:[...]}, candidates, note]
const CASES = [
  [{ water: 'Mill Creek (Standing Stone State Park)', site: 'Mill Creek', county: 'Overton', program: 'Spring' }, 'mill-creek-overton', ['mill-creek-overton', 'cane-creek'], 'exact'],
  [{ water: 'Mill Creek', site: 'Mill Creek', county: 'Hickman', program: 'Spring' }, 'MUST-ABSTAIN', ['mill-creek-overton', 'cane-creek-hickman-perry'], 'TRAP: county contradicts both candidates'],
  [{ water: 'Salt Lick Creek', site: 'x', county: 'Macon', program: 'Spring' }, 'salt-lick-creek', ['salt-lick-creek'], 'wave-3 identity'],
  [{ water: 'Puncheon Camp Creek #1', site: 'x', county: 'Grainger', program: 'Spring' }, 'puncheon-camp-creek', ['puncheon-camp-creek'], 'catalog county (Campbell) contradicts; wave-3 says Grainger'],
  [{ water: 'Cane Creek', site: 'x', county: 'Vanburen', program: 'Spring' }, 'cane-creek', ['cane-creek', 'cane-creek-hickman-perry'], 'county narrows'],
  [{ water: 'Cane Creek', site: 'x', county: 'Hickman', program: 'Spring' }, 'cane-creek-hickman-perry', ['cane-creek', 'cane-creek-hickman-perry'], 'county narrows (other way)'],
  [{ water: 'South Holston Tailwater', site: 'x', county: 'Sullivan', program: 'Tailwater' }, 'south-holston-river', ['south-holston-river', 'south-holston-lake'], 'TWRA naming convention'],
  [{ water: 'Watauga Reservoir', site: 'x', county: 'Carter', program: 'Reservoir' }, 'watauga-lake', ['watauga-lake', 'watauga-river'], 'TWRA naming convention'],
  [{ water: 'Harpeth River', site: 'Eastern Flank Battle Park', county: 'Williamson', program: 'Winter' }, 'harpeth-river', ['harpeth-river'], 'mixed water'],
  [{ water: 'Little Buffalo River', site: 'x', county: 'Lawrence', program: 'Spring' }, 'little-buffalo-river', ['little-buffalo-river', 'buffalo-river'], 'prefix disambiguation'],
  [{ water: 'Duck River', site: 'Dement Bridge', county: 'Bedford', program: 'Tailwater' }, { family: ['duck-river-lower', 'duck-river-mouth', 'duck-river-tailwater'] }, ['duck-river-lower', 'duck-river-mouth', 'duck-river-tailwater'], 'access-site only — family-level answer acceptable'],
  [{ water: 'Caney Fork River', site: "Betty's Island", county: 'Smith', program: 'Tailwater' }, { family: ['caney-fork-river', 'caney-fork-upper'] }, ['caney-fork-river', 'caney-fork-upper'], 'access-site only — family-level answer acceptable'],
];

const results = [];
for (const [ev, expected, candidateSlugs, note] of CASES) {
  const candidates = candidateSlugs.map(bySlug);
  const sampleCoord = coordFor(ev);
  const event = { ...ev, sampleCoord, normName: normalizeName(ev.water), normCounty: normCounty(ev.county), normCore: coreName(ev.water) };
  let jev;
  try {
    jev = await jevResolve(event, candidates);
  } catch (e) {
    results.push({ case: `${ev.water} (${ev.county})`, note, expected: JSON.stringify(expected), got: `ERROR ${e.message}`, pass: false });
    continue;
  }
  const want = typeof expected === 'string' ? expected : null;
  let pass;
  if (want === 'MUST-ABSTAIN') pass = jev.choice === 'none';
  else if (want) pass = jev.choice === want;
  else pass = expected.family.includes(jev.choice);
  results.push({ case: `${ev.water} (${ev.county})`, note, expected: want ?? `one of ${expected.family.join('|')}`, got: `${jev.choice} (conf ${jev.confidence})`, pass });

  const det = resolveEvent(event, catalog, ALIASES);
  results[results.length - 1].deterministic = det.how === 'ambiguous' ? 'ambiguous(queue)' : det.slug ?? det.how;
}

console.log('\n=== JEV KNOWN-ANSWER GATE ===\n');
let hit = 0;
for (const r of results) {
  if (r.pass) hit += 1;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.case.padEnd(46)} want ${String(r.expected).padEnd(28)} got ${r.got}  [det: ${r.deterministic}]`);
}
const rate = hit / results.length;
const trap = results.find((r) => r.note.startsWith('TRAP'));
const aboveBar = rate >= 0.9 && trap.pass;
console.log(`\nHit rate: ${hit}/${results.length} (${(rate * 100).toFixed(0)}%); trap abstained: ${trap.pass}`);
console.log(`VERDICT: ${aboveBar ? 'ABOVE BAR — Jev advice may land in decision boxes (advisory)' : 'BELOW BAR — Jev stays off; deterministic matcher remains authoritative'}`);
process.exit(0);
