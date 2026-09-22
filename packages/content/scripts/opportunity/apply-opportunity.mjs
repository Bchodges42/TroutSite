/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * apply-opportunity — author the catalog `opportunity:` blocks from the final
 * ledger.json (ADR 0010), plus the SAFE subset of catalog field corrections
 * the ledger documented. Run with --dry-run first; every write is printed.
 *
 *   node packages/content/scripts/opportunity/apply-opportunity.mjs [--dry-run]
 *
 * NOT applied automatically (reported for the owner instead):
 *   - species strip/claim changes (they move waters across map modes)
 *   - regionId corrections
 * Applied when present with a reason: yearRound / seasonMonths / seasonKind
 * corrections, and removal of a catalog note gloss that matches no agency
 * source (only when the ledger flags it explicitly).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { ARTIFACT_DIR, CATALOG_DIR } from './lib.mjs';

const dryRun = process.argv.includes('--dry-run');
const ledger = JSON.parse(readFileSync(join(ARTIFACT_DIR, 'ledger.json'), 'utf8'));

const CLAIM_KIND_TO_SOURCE_KIND = {
  'year-round-opportunity': 'agency-assessment',
  'seasonal-stocked-opportunity': 'program-description',
  'stocking-program': 'schedule-table',
  'stocking-event': 'completed-release-report',
  'warmwater-fishery': 'agency-assessment',
  'trout-observation': 'survey',
  'wild-reproduction': 'survey',
  'legal-designation': 'legal-designation',
  'habitat-context': 'temperature-series',
  'stocking-calendar-conflict': 'schedule-table',
  'harvest-regulation': 'agency-assessment',
  'program-description': 'program-description',
};
// Capture-relative URLs are resolvable in-repo; keep them as-is (they are
// committed artifacts, not live fetches at runtime).

function sourcesFrom(water) {
  const out = [];
  const seen = new Set();
  for (const claim of water.claims ?? []) {
    if (!claim.source?.url) continue;
    if (claim.state !== 'documented' && claim.state !== 'limited' && claim.state !== 'historical') continue;
    const url = claim.source.url;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({
      label: claim.source.title ?? claim.source.publisher ?? 'Source',
      url,
      kind: CLAIM_KIND_TO_SOURCE_KIND[claim.kind] ?? 'agency-assessment',
      ...(claim.source.observationPeriod ? { observationPeriod: claim.source.observationPeriod } : {}),
      ...(claim.source.publicationDate ? { publicationDate: claim.source.publicationDate } : {}),
      retrieved: claim.source.retrieved,
      ...(claim.source.pinpoint ? { pinpoint: claim.source.pinpoint } : {}),
    });
    if (out.length >= 3) break;
  }
  return out;
}

function opportunityBlock(water) {
  const h = water.headline;
  const unresolved = h.troutOpportunity === 'unresolved';
  const block = {
    trout: h.troutOpportunity,
    evidenceState: h.evidenceState,
    ...(h.statement ? { statement: h.statement } : {}),
    ...(h.reachScope ? { reachScope: h.reachScope } : {}),
    asOf: h.asOf ?? String(new Date().getFullYear()),
    ...(!unresolved && sourcesFrom(water).length ? { sources: sourcesFrom(water) } : {}),
    ...(water.qualifications?.length ? { caveats: water.qualifications.slice(0, 4) } : {}),
    ...(unresolved && water.unresolvedQuestion ? { unresolvedQuestion: water.unresolvedQuestion } : {}),
  };
  return block;
}

let applied = 0;
let corrected = 0;
const ownerReport = [];
for (const water of ledger.waters) {
  if (water.adjudicated === false) continue;
  const path = join(CATALOG_DIR, water.id + '.yaml');
  const doc = parse(readFileSync(path, 'utf8'));
  doc.opportunity = opportunityBlock(water);
  applied += 1;

  // Safe field corrections (yearRound/seasonMonths/seasonKind) with a reason.
  const corr = water.catalogFieldCorrections;
  if (corr && typeof corr === 'object' && corr.apply && corr.fields) {
    for (const [field, value] of Object.entries(corr.fields)) {
      if (!['yearRound', 'seasonMonths', 'seasonKind'].includes(field)) continue;
      const before = doc[field];
      doc[field] = value;
      if (JSON.stringify(before) !== JSON.stringify(value)) corrected += 1;
      doc.notes = `${(doc.notes ?? '').trim()}${doc.notes ? '\n\n' : ''}Correction (${new Date().toISOString().slice(0, 10)}, evidence ledger): ${field} ${JSON.stringify(before)} → ${JSON.stringify(value)} — ${corr.reason ?? 'see ledger'}.`.trim();
    }
  }
  // Report-only corrections.
  if (corr && typeof corr === 'object' && !corr.apply) {
    ownerReport.push({ id: water.id, correction: corr });
  }
  if (corr && typeof corr === 'string') {
    ownerReport.push({ id: water.id, correction: corr });
  }

  if (!dryRun) writeFileSync(path, stringify(doc, { lineWidth: 100 }));
  console.log(`${dryRun ? '[dry] ' : ''}${water.id}: ${doc.opportunity.trout}/${doc.opportunity.evidenceState}${corr ? ' +correction' : ''}`);
}
console.log(`\n${dryRun ? 'would apply' : 'applied'} ${applied} opportunity blocks; ${corrected} field corrections; ${ownerReport.length} owner-report items`);
if (ownerReport.length) {
  writeFileSync(join(ARTIFACT_DIR, 'owner-corrections-report.json'), JSON.stringify(ownerReport, null, 2));
  console.log('owner-corrections-report.json written (NOT auto-applied)');
}
