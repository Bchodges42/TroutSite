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

// Capture-relative URLs ("captures/twra-schedule.json", forecast digest
// anchors) are in-repo artifacts; the contract requires a real URL, so they
// resolve to the LIVE source via the capture source log (retrieval provenance
// stays in the ledger).
const sourceLog = JSON.parse(readFileSync(join(ARTIFACT_DIR, 'captures', 'source-log.json'), 'utf8'));
const captureUrlById = new Map(sourceLog.captures.map((c) => [c.id, c.url]));
const DIGEST_TO_CAPTURE = {
  'twra-forecast-text': 'twra-forecast-itemdata',
  'twra-trout-page': 'twra-trout-page',
};
function resolveSourceUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  const m = String(url).match(/^captures\/([a-z0-9-]+)\.(?:json|md|txt|html)(?:#.+)?$/i);
  if (!m) return null;
  const id = DIGEST_TO_CAPTURE[m[1]] ?? m[1];
  return captureUrlById.get(id) ?? null;
}
function sanitize(text) {
  // Preserve exact quoted source wording. Typed targetSpecies are checked
  // separately; changing a quotation to evade a validator destroys evidence.
  return String(text);
}

function sourcesFrom(water) {
  const out = [];
  const seen = new Set();
  for (const claim of water.claims ?? []) {
    if (!claim.source?.url) continue;
    if (claim.state !== 'documented' && claim.state !== 'limited' && claim.state !== 'historical') continue;
    const url = resolveSourceUrl(claim.source.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      label: sanitize(claim.source.title ?? claim.source.publisher ?? 'Source'),
      url,
      kind: CLAIM_KIND_TO_SOURCE_KIND[claim.kind] ?? 'agency-assessment',
      ...(claim.source.observationPeriod ? { observationPeriod: sanitize(claim.source.observationPeriod) } : {}),
      ...(claim.source.publicationDate ? { publicationDate: claim.source.publicationDate } : {}),
      retrieved: claim.source.retrieved,
      ...(claim.source.pinpoint ? { pinpoint: sanitize(claim.source.pinpoint) } : {}),
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
    ...(h.statement ? { statement: sanitize(h.statement) } : {}),
    ...(h.reachScope ? { reachScope: sanitize(h.reachScope) } : {}),
    asOf: h.asOf,
    ...(!unresolved && sourcesFrom(water).length ? { sources: sourcesFrom(water) } : {}),
    ...(water.qualifications?.length
      ? { caveats: water.qualifications.slice(0, 4).map(sanitize) }
      : {}),
    ...(unresolved && water.unresolvedQuestion ? { unresolvedQuestion: sanitize(water.unresolvedQuestion) } : {}),
  };
  return block;
}

const CORRECTION_MARK = 'Correction (2026-09-22, evidence ledger):';
function stripCorrectionNotes(notes) {
  // Idempotency: remove a previously appended correction appendix before
  // re-running, so apply is safe to repeat.
  if (!notes) return '';
  const at = notes.indexOf(CORRECTION_MARK);
  return (at >= 0 ? notes.slice(0, at) : notes).trim();
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

  // yearRound consistency normalization (deterministic, derived from the
  // adjudicated headline — never from prose): a seasonal-stocked or
  // warmwater-focus headline cannot coexist with yearRound:true, and a
  // documented year-round headline cannot sit on yearRound:false. The
  // stocking window itself (seasonMonths/seasonKind) is NOT touched here —
  // wrong windows are catalog content corrections routed to the owner report.
  const headline = water.headline.troutOpportunity;
  if (headline === 'seasonal-stocked-trout' || headline === 'warmwater-focus') {
    if (doc.yearRound === true) {
      const before = doc.yearRound;
      doc.yearRound = false;
      corrected += 1;
      doc.notes = `${(doc.notes ?? '').trim()}${doc.notes ? '\n\n' : ''}Correction (2026-09-22, evidence ledger): yearRound ${before} → false — the adjudicated headline is ${headline}; a year-round flag contradicts it (ADR 0010 consistency).`.trim();
      console.log(`${water.id}: yearRound true → false (headline consistency)`);
    }
  }
  if (headline === 'year-round-trout' && doc.yearRound === false) {
    doc.yearRound = true;
    corrected += 1;
    doc.notes = `${(doc.notes ?? '').trim()}${doc.notes ? '\n\n' : ''}Correction (2026-09-22, evidence ledger): yearRound false → true — the adjudicated headline is year-round-trout on documented reach evidence${water.headline.reachScope ? ` (${water.headline.reachScope})` : ''} (ADR 0010 consistency).`.trim();
    console.log(`${water.id}: yearRound false → true (headline consistency)`);
  }

  // Lane-documented field corrections: only the structured, explicitly
  // flagged subset auto-applies; everything else is reported for the owner.
  const corr = water.catalogFieldCorrections;
  // The adjudication explicitly rejected these inherited winter templates.
  // Their schedule weeks are useful in the opportunity statement, but they
  // cannot serve as a fishing season or a current-presence calendar.
  const invalidProgrammaticWindow =
    typeof corr === 'string' && /seasonMonths[^.]{0,40}\bwrong\b/i.test(corr);
  if (invalidProgrammaticWindow) {
    if (doc.seasonMonths !== undefined || doc.seasonKind !== undefined) {
      delete doc.seasonMonths;
      delete doc.seasonKind;
      corrected += 1;
      console.log(`${water.id}: removed unsupported programmatic season window`);
    }
  }
  if (corr && typeof corr === 'object' && corr.apply && corr.fields) {
    for (const [field, value] of Object.entries(corr.fields)) {
      if (!['yearRound', 'seasonMonths', 'seasonKind'].includes(field)) continue;
      const before = doc[field];
      doc[field] = value;
      if (JSON.stringify(before) !== JSON.stringify(value)) corrected += 1;
      doc.notes = `${(doc.notes ?? '').trim()}${doc.notes ? '\n\n' : ''}Correction (2026-09-22, evidence ledger): ${field} ${JSON.stringify(before)} → ${JSON.stringify(value)} — ${corr.reason ?? 'see ledger'}.`.trim();
    }
  }
  // Report-only corrections.
  if (corr && typeof corr === 'object' && !corr.apply) {
    ownerReport.push({ id: water.id, correction: corr });
  }
  if (corr && typeof corr === 'string') {
    ownerReport.push({
      id: water.id,
      correction: corr,
      ...(invalidProgrammaticWindow
        ? { repair: 'Unsupported seasonMonths and seasonKind removed from the catalog; other details in this correction still require review.' }
        : {}),
    });
  }

  if (!dryRun) writeFileSync(path, stringify(doc, { lineWidth: 100 }));
  if (doc.opportunity.trout !== 'unresolved' && sourcesFrom(water).length === 0) {
    console.error(`WARNING: ${water.id} positive headline has NO resolvable source URLs`);
  }
  console.log(`${dryRun ? '[dry] ' : ''}${water.id}: ${doc.opportunity.trout}/${doc.opportunity.evidenceState}${corr ? ' +correction' : ''}`);
}
console.log(`\n${dryRun ? 'would apply' : 'applied'} ${applied} opportunity blocks; ${corrected} field corrections; ${ownerReport.length} owner-report items`);
if (ownerReport.length && !dryRun) {
  writeFileSync(join(ARTIFACT_DIR, 'owner-corrections-report.json'), JSON.stringify(ownerReport, null, 2));
  console.log('owner-corrections-report.json written (NOT auto-applied)');
}
