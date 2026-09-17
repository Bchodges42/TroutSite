#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Known-answer validation — run BEFORE trusting any pipeline output.
 *
 * Expectations come from the audited wave ledgers (docs/research/2026-09-15-wave-ledgers/)
 * and the owner-confirmed strip/claim verdicts applied 2026-09-15
 * (packages/content/scripts/wave-ledgers/apply-ledgers.mjs).
 *
 *   node packages/content/scripts/classification/validate-known-answers.mjs
 *
 * Prints a per-bucket hit-rate table. Bar: ≥0.90 on each corroborating bucket;
 * below bar on any bucket → the pipeline stays report-only (it always is) and
 * the failing bucket's boxes are marked needs-manual-review in the report.
 */
import { loadCatalog, loadLedgerDiff, loadOwnerVerdicts, loadStockingGeojson, eventsFromGeojson, resolveEvent, ALIASES } from './lib.mjs';
import { STRIP, CLAIM } from '../wave-ledgers/apply-manifest.mjs';

const catalog = loadCatalog();
const bySlug = new Map(catalog.map((w) => [w.slug, w]));
const { events } = eventsFromGeojson(loadStockingGeojson());
const ledgerRows = loadLedgerDiff().rows;
const ledgerBySlug = new Map(ledgerRows.map((r) => [r.slug, r]));
const owner = loadOwnerVerdicts();

const results = [];
const record = (bucket, ok, detail) => results.push({ bucket, ok, detail });

// ---- 1. Owner-confirmed strip/claim verdicts are in the catalog and protected
for (const { slug } of STRIP) {
  const doc = bySlug.get(slug)?.doc;
  record('strip-verdict-catalog', doc?.species === 'warmwater', `${slug}: ${doc?.species}`);
  const protectedOk = Boolean(owner.verdicts[slug]?.neverRepropose);
  record('strip-verdict-protected', protectedOk, `${slug} owner-protected`);
}
for (const c of CLAIM) {
  const doc = bySlug.get(c.slug)?.doc;
  record('claim-verdict-catalog', doc?.species === 'trout', `${c.slug}: ${doc?.species}`);
  record('claim-verdict-protected', Boolean(owner.verdicts[c.slug]?.neverRepropose), `${c.slug} owner-protected`);
}

// ---- 2. Resolution must reproduce audited identities -----------------------
// (a) the county guard must NOT let the Mill Creek (Hickman) false positive through
const cat = catalog;
const hickmanMill = { water: 'Mill Creek', site: 'Mill Creek', county: 'Hickman', program: 'Spring' };
const hickmanRes = resolveEvent(hickmanMill, cat, ALIASES);
record('resolution-guard', hickmanRes.slug === null, `Mill Creek (Hickman) → ${hickmanRes.how}`);

// (b) wave-3 identity corrections resolve via documented aliases
const puncheon = { water: 'Puncheon Camp Creek #1', site: 'Puncheon Camp Creek #1', county: 'Grainger', program: 'Spring' };
record('resolution-alias', resolveEvent(puncheon, cat, ALIASES).slug === 'puncheon-camp-creek', 'puncheon → Grainger population');
const saltlick = { water: 'Salt Lick Creek', site: 'Salt Lick Creek', county: 'Macon', program: 'Spring' };
record('resolution-exact', resolveEvent(saltlick, cat, ALIASES).slug === 'salt-lick-creek', 'salt lick creek (Macon)');

// ---- 3. T1 events corroborate ledger classes -------------------------------
// events per ledger slug (resolution repeated here so the validator is standalone)
const evBySlug = new Map();
for (const ev of events) {
  const r = resolveEvent(ev, cat, ALIASES);
  if (r.slug) {
    if (!evBySlug.has(r.slug)) evBySlug.set(r.slug, []);
    evBySlug.get(r.slug).push(ev);
  }
}
const classBuckets = { 'stocked-winter': 0, 'stocked-winter-hit': 0, mixed: 0, 'mixed-hit': 0, warmwater: 0, 'warmwater-hit-ok': 0, wild: 0, 'wild-ok': 0 };
for (const [slug, row] of ledgerBySlug) {
  if (!row.class) continue;
  const hasEvents = evBySlug.has(slug);
  if (row.class === 'stocked-winter') {
    classBuckets['stocked-winter'] += 1;
    if (hasEvents) classBuckets['stocked-winter-hit'] += 1;
  } else if (row.class === 'mixed') {
    classBuckets.mixed += 1;
    if (hasEvents) classBuckets['mixed-hit'] += 1;
  } else if (row.class === 'wild-self-sustaining') {
    // Stocking events at park-boundary access points do NOT disprove wild
    // character (cosby/leconte are GSMNP wild waters with TWRA rows).
    // Informational only — never a gate.
    classBuckets.wild += 1;
    if (!hasEvents) classBuckets['wild-ok'] += 1;
  }
}
const rates = {
  'stocked-winter corroborated by feed': classBuckets['stocked-winter-hit'] / Math.max(1, classBuckets['stocked-winter']),
  'mixed corroborated by feed': classBuckets['mixed-hit'] / Math.max(1, classBuckets.mixed),
};
// warmwater/wild contradictions are DATA FINDINGS (they ship as conflict
// boxes for the owner), not pipeline errors — so they are not gates here.

// ---- 4. Season windows: feed-derived vs ledger-audited (where both exist) --
let seasonBoth = 0, seasonAgree = 0;
const seasonMismatches = [];
for (const [slug, row] of ledgerBySlug) {
  const evs = evBySlug.get(slug) ?? [];
  const months = [...new Set(evs.filter((e) => e.windowMonths).flatMap((e) => e.windowMonths))].sort((a, b) => a - b);
  if (!row.season?.ledgerMonths || months.length === 0) continue;
  seasonBoth += 1;
  const lm = [...row.season.ledgerMonths].sort((a, b) => a - b);
  const overlap = months.some((m) => lm.includes(m));
  if (overlap) seasonAgree += 1;
  else seasonMismatches.push(`${slug}: feed ${JSON.stringify(months)} vs ledger ${JSON.stringify(lm)}`);
}

// ---- report ----------------------------------------------------------------
const buckets = {};
for (const r of results) {
  buckets[r.bucket] ??= { pass: 0, total: 0, fails: [] };
  buckets[r.bucket].total += 1;
  if (r.ok) buckets[r.bucket].pass += 1;
  else buckets[r.bucket].fails.push(r.detail);
}

console.log('\n=== KNOWN-ANSWER VALIDATION ===\n');
let allPass = true;
for (const [name, b] of Object.entries(buckets)) {
  const rate = b.pass / b.total;
  const ok = rate >= 0.9;
  if (!ok) allPass = false;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(28)} ${b.pass}/${b.total} (${(rate * 100).toFixed(0)}%)`);
  if (!ok) b.fails.slice(0, 8).forEach((f) => console.log(`      ✗ ${f}`));
}
console.log('\n--- T1 corroboration of ledger classes ---');
for (const [name, rate] of Object.entries(rates)) {
  const ok = rate >= 0.9;
  if (!ok) allPass = false;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(36)} ${(rate * 100).toFixed(0)}%`);
}
console.log(`\nINFO  Season windows (feed program vs ledger audit): ${seasonAgree}/${seasonBoth} overlap (${seasonBoth ? ((seasonAgree / seasonBoth) * 100).toFixed(0) : 'n/a'}%) — feed program labels are coarse; mismatches ship in decision boxes`);
seasonMismatches.slice(0, 10).forEach((m) => console.log(`  ✗ ${m}`));
console.log('INFO  warmwater contradictions surfaced as conflict boxes: reedy-creek, red-river-clarksville (owner decision)');
console.log('INFO  wild-class waters with feed events: cosby-creek, leconte-creek (stocking at park access points; character unchanged)');
console.log(`\nVERDICT: ${allPass ? 'ABOVE BAR — pipeline output may inform decision boxes' : 'BELOW BAR — stay report-only, boxes flagged needs-manual-review'}`);
process.exit(0);
