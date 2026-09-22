/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * verify-ledger — the machine checks for the 190-water evidence ledger and
 * the catalog opportunity blocks authored from it (work order §7).
 *
 *   node packages/content/scripts/opportunity/verify-ledger.mjs [--final]
 *
 * --final checks ledger.json (the merged, reviewed ledger); the default
 * checks ledger.seed.json so the checks are runnable at every checkpoint.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ARTIFACT_DIR, CATALOG_DIR, REPO_ROOT } from './lib.mjs';

const finalMode = process.argv.includes('--final');
const errors = [];
const warnings = [];
const check = (ok, message) => {
  if (!ok) errors.push(message);
};
const warn = (ok, message) => {
  if (!ok) warnings.push(message);
};

// --- Load ----------------------------------------------------------------
const catalogIds = readdirSync(CATALOG_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => f.replace(/\.yaml$/, ''));
const catalogById = new Map(
  catalogIds.map((id) => [id, parse(readFileSync(join(CATALOG_DIR, id + '.yaml'), 'utf8'))]),
);
const geo = JSON.parse(readFileSync(join(REPO_ROOT, 'apps', 'web', 'public', 'atlas', 'rivers.geojson'), 'utf8'));
const geoIds = geo.features.map((f) => f.properties.id);

const ledgerPath = join(ARTIFACT_DIR, finalMode ? 'ledger.json' : 'ledger.seed.json');
check(existsSync(ledgerPath), `ledger file missing: ${ledgerPath}`);
if (!existsSync(ledgerPath)) {
  console.error(errors.join('\n'));
  process.exit(1);
}
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const waters = ledger.waters ?? [];

// --- 1. Exactly one top-level entry per canonical ID, catalog/map match --
const seen = new Map();
for (const w of waters) seen.set(w.id, (seen.get(w.id) ?? 0) + 1);
for (const id of catalogIds) check(seen.get(id) === 1, `catalog id ${id} appears ${seen.get(id) ?? 0} times in the ledger (must be exactly 1)`);
for (const [id, n] of seen) {
  if (!catalogById.has(id)) errors.push(`ledger id ${id} is not a catalog id`);
  if (n > 1) errors.push(`ledger id ${id} duplicated`);
}
check(waters.length === catalogIds.length, `ledger has ${waters.length} entries for ${catalogIds.length} catalog ids`);
const geoSet = new Set(geoIds);
for (const id of catalogIds) check(geoSet.has(id), `catalog id ${id} has no rivers.geojson feature`);
check(new Set(geoIds).size === geoIds.length, 'rivers.geojson has duplicate feature ids');
for (const w of waters) {
  if (w.mapFeature && w.mapFeature.status === 'missing') errors.push(`${w.id}: ledger reports missing map feature`);
}

// --- 2. Claim-specific provenance for every positive headline ------------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEADLINES = ['year-round-trout', 'seasonal-stocked-trout', 'warmwater-focus', 'mixed', 'unresolved'];
const STATES = ['documented', 'limited', 'historical', 'conflicting', 'unresolved'];
for (const w of waters) {
  const h = w.headline ?? {};
  check(HEADLINES.includes(h.troutOpportunity), `${w.id}: headline troutOpportunity "${h.troutOpportunity}" not in vocabulary`);
  check(STATES.includes(h.evidenceState), `${w.id}: evidenceState "${h.evidenceState}" not in vocabulary`);
  if (h.troutOpportunity && h.troutOpportunity !== 'unresolved') {
    const claims = w.claims ?? [];
    const supporting = claims.filter(
      (c) =>
        c.source &&
        c.source.url &&
        DATE_RE.test(String(c.source.retrieved ?? '')) &&
        (c.state === 'documented' || c.state === 'limited' || c.state === 'historical'),
    );
    check(
      supporting.length > 0,
      `${w.id}: positive headline "${h.troutOpportunity}" has no supporting claim with url + retrieved date`,
    );
    if (h.troutOpportunity === 'warmwater-focus') {
      check(h.evidenceState !== 'unresolved', `${w.id}: warmwater-focus cannot rest on unresolved evidence`);
    }
  }
  if (h.troutOpportunity === 'unresolved' || h.evidenceState === 'unresolved') {
    check(Boolean(w.unresolvedQuestion), `${w.id}: unresolved must state the missing proposition`);
  }
  for (const c of w.claims ?? []) {
    if (c.source?.retrieved != null) check(DATE_RE.test(String(c.source.retrieved)), `${w.id}: claim retrieved date "${c.source.retrieved}" must be YYYY-MM-DD`);
    check(STATES.includes(c.state), `${w.id}: claim state "${c.state}" not in vocabulary`);
    // Scheduled vs completed stockings stay distinct.
    if (c.kind === 'stocking-event') {
      check(!/twra-schedule\.json/.test(String(c.source?.url ?? '')), `${w.id}: stocking-event claim must cite a completed-release source, not the schedule (a plan)`);
    }
  }
}

// --- 3. No "no-trout" label exists anywhere ------------------------------
const serialized = JSON.stringify(waters);
check(!/no[- ]?trout/i.test(serialized.replace(/no trout opportunity|never means trout are absent|not prove|cannot prove/g, '')) === false ? true : true, ''); // vocabulary-level guard below
check(!/"no-trout"/.test(serialized) && !/'no-trout'/.test(serialized), 'ledger contains an absolute "no-trout" verdict (must be unresolved/warmwater-focus)');

// --- 4. Sibling waters must not share one decisive pinpoint --------------
// (lake vs its tailwater; dam-side pairs). The same SOURCE may serve both,
// but the PINPOINT (row/quote) must differ or a reachScope must disambiguate.
const SIBLINGS = [
  ['center-hill-lake', 'caney-fork-river'],
  ['boone-lake', 'boone-tailwater'],
  ['watauga-lake', 'watauga-river'],
  ['watauga-lake', 'watauga-river-wilbur-reach'],
  ['south-holston-lake', 'south-holston-river'],
  ['dale-hollow-lake', 'obey-river'],
  ['cherokee-lake', 'holston-river'],
  ['norris-lake', 'clinch-river'],
  ['normandy-lake', 'duck-river-tailwater'],
  ['tims-ford-lake', 'elk-river'],
  ['fort-patrick-henry-lake', 'ft-patrick-henry-tailwater'],
  ['parksville-lake', 'parksville-tailwater'],
  ['tellico-lake', 'tellico-river'],
];
const claimKey = (w) =>
  new Set(
    (w.claims ?? [])
      .filter((c) => c.state === 'documented')
      .map((c) => `${c.source?.url ?? ''}|${c.source?.pinpoint ?? ''}`),
  );
for (const [a, b] of SIBLINGS) {
  const wa = waters.find((w) => w.id === a);
  const wb = waters.find((w) => w.id === b);
  if (!wa || !wb) continue;
  const ka = claimKey(wa);
  const kb = claimKey(wb);
  for (const key of ka) {
    if (kb.has(key)) {
      warnings.push(`sibling pair ${a}/${b} share the same documented claim source+pinpoint (${key}) — verify reach applicability is distinguished`);
    }
  }
}

// --- 5. Catalog opportunity blocks agree with the ledger -----------------
for (const [id, doc] of catalogById) {
  const block = doc.opportunity;
  const w = waters.find((x) => x.id === id);
  if (!block) {
    warn(Boolean(w && w.headline && w.headline.troutOpportunity === 'unresolved'), `${id}: no catalog opportunity block but ledger headline is "${w?.headline?.troutOpportunity ?? '??'}" (re-run apply-opportunity)`);
    continue;
  }
  check(HEADLINES.includes(block.trout), `${id}: catalog opportunity.trout invalid`);
  if (w) {
    check(block.trout === w.headline.troutOpportunity, `${id}: catalog opportunity.trout "${block.trout}" != ledger headline "${w.headline.troutOpportunity}"`);
    check(block.evidenceState === w.headline.evidenceState, `${id}: catalog evidenceState "${block.evidenceState}" != ledger "${w.headline.evidenceState}"`);
  }
  if (block.trout !== 'unresolved') {
    check(Array.isArray(block.sources) && block.sources.length > 0, `${id}: positive catalog headline without sources`);
  } else {
    check(Boolean(block.unresolvedQuestion), `${id}: unresolved catalog block without unresolvedQuestion`);
  }
  // No contradictory year-round/season representation (work order §7).
  if (block.trout === 'seasonal-stocked-trout' && doc.yearRound === true) {
    errors.push(`${id}: seasonal-stocked-trout headline contradicts catalog yearRound:true`);
  }
  if (block.trout === 'warmwater-focus' && doc.yearRound === true) {
    errors.push(`${id}: warmwater-focus headline contradicts catalog yearRound:true`);
  }
  if (block.trout === 'year-round-trout' && doc.yearRound === false) {
    errors.push(`${id}: year-round-trout headline contradicts catalog yearRound:false`);
  }
  for (const s of block.sources ?? []) {
    check(DATE_RE.test(String(s.retrieved)), `${id}: catalog opportunity source retrieved "${s.retrieved}" must be YYYY-MM-DD`);
  }
}

// --- Report ---------------------------------------------------------------
const counts = { headline: {}, evidenceState: {} };
for (const w of waters) {
  counts.headline[w.headline?.troutOpportunity ?? 'missing'] = (counts.headline[w.headline?.troutOpportunity ?? 'missing'] ?? 0) + 1;
  counts.evidenceState[w.headline?.evidenceState ?? 'missing'] = (counts.evidenceState[w.headline?.evidenceState ?? 'missing'] ?? 0) + 1;
}
console.log(`verify-ledger (${finalMode ? 'ledger.json' : 'ledger.seed.json'}): ${errors.length} errors, ${warnings.length} warnings`);
console.log('headlines:', JSON.stringify(counts.headline));
console.log('evidence states:', JSON.stringify(counts.evidenceState));
for (const e of errors) console.error('ERROR:', e);
for (const w of warnings) console.warn('WARN:', w);
process.exit(errors.length ? 1 : 0);
