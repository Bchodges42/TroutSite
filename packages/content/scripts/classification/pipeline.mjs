#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Tiered classification pipeline — resolve → derive → diff. Report-only.
 *
 *   node packages/content/scripts/classification/pipeline.mjs [--write-report]
 *
 * Reads:  apps/web/public/atlas/twra-stocking.geojson (T1 — TWRA stocking events)
 *         docs/research/2026-09-15-wave-ledgers/ledger/diff.json (audited T2 reference)
 *         packages/content/scripts/classification/owner-verdicts.json (protected)
 *         packages/content/streams/tn/*.yaml (the catalog)
 * Writes (with --write-report): docs/research/2026-09-17-classification-diff/
 *   {DIFF-REPORT.md, classification-output.json, resolution.json}
 * Never writes catalog YAML.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  REPO_ROOT, DIFF_OUT_DIR, SOURCE_LABEL,
  loadCatalog, loadStockingGeojson, loadLedgerDiff, loadOwnerVerdicts,
  eventsFromGeojson, resolveEvent, eventKey, ALIASES,
} from './lib.mjs';

const writeReport = process.argv.includes('--write-report');

const aliases = ALIASES;
// Documented identity corrections (wave-3 audit): feed name → catalog slug,
// where the feed's statewide site name differs from the catalog entry.
// Added ONLY where the deterministic pass proves it necessary (see report).

const catalog = loadCatalog();
const { events, unparsedSpeciesRows } = eventsFromGeojson(loadStockingGeojson());
const owner = loadOwnerVerdicts();
const ledgerRows = loadLedgerDiff().rows;
const ledgerBySlug = new Map(ledgerRows.map((r) => [r.slug, r]));

// ---------------------------------------------------------------- resolution
const resolution = { matched: [], ambiguous: [], unmatched: [] };
const bySlugEvents = new Map();
for (const ev of events) {
  const r = resolveEvent(ev, catalog, aliases);
  if (r.slug) {
    resolution.matched.push({ event: ev, slug: r.slug, confidence: r.confidence, how: r.how });
    if (!bySlugEvents.has(r.slug)) bySlugEvents.set(r.slug, []);
    bySlugEvents.get(r.slug).push(ev);
  } else if (r.how === 'ambiguous') {
    resolution.ambiguous.push({ event: ev, candidates: r.candidates });
  } else {
    resolution.unmatched.push({ event: ev });
  }
}

// ----------------------------------------------------------------- derivation
// Per catalog water: computed stocked-trout view + (only where T1 events stand
// alone) a species proposal. Owner verdicts and ledger conflicts are PROTECTED:
// they surface in the diff as context, never as re-proposals.
const waters = [];
for (const { slug, doc } of catalog) {
  const evs = bySlugEvents.get(slug) ?? [];
  const programs = [...new Set(evs.map((e) => e.program))];
  const pinnedMonths = evs.filter((e) => e.windowMonths).flatMap((e) => e.windowMonths);
  const windowMonths = pinnedMonths.length ? [...new Set(pinnedMonths)].sort((a, b) => a - b) : null;
  const species = [...new Set(evs.flatMap((e) => e.species))].sort();
  const ledger = ledgerBySlug.get(slug) ?? null;
  const ownerVerdict = owner.verdicts[slug] ?? null;

  const stockedTrout = evs.length
    ? {
        computed: true,
        tier: 'T1',
        source: SOURCE_LABEL,
        windowMonths, // null when only Tailwater/Reservoir programs match (unpinned — T2 question)
        windowUnpinned: windowMonths === null,
        programs,
        eventCount: evs.length,
        species,
      }
    : null;

  // Species proposal rule: propose ONLY for waters with no species verdict at
  // all, where unambiguous T1 events exist, and no owner verdict / ledger
  // verdict claims the water. Mixed waters (warmwater base + winter trout)
  // carry the event view under stockedTrout without flipping the base species.
  let proposal = null;
  const protectedByOwner = ownerVerdict && ownerVerdict.neverRepropose;
  const ledgerSaysNone = ledger && ledger.verdict && ledger.verdict.ledger === 'none';
  const unset = !doc.species;
  if (unset && evs.length && !protectedByOwner && !ledgerSaysNone) {
    proposal = {
      field: 'species',
      value: 'trout',
      tier: 'T1',
      confidence: windowMonths && programs.length > 1 ? 'high' : 'medium',
      source: SOURCE_LABEL,
      evidence: evs.map((e) => `${e.site} (${e.county} Co) — ${e.program} program, ${e.species.join('/') || 'species unparsed'}`),
    };
  }

  waters.push({
    slug,
    catalog: {
      species: doc.species ?? null,
      fishery: doc.fishery ?? null,
      stockingProgram: doc.stockingProgram === true ? true : undefined,
      seasonMonths: doc.seasonMonths ?? null,
      display: doc.display ?? 'standard',
      counties: (doc.hydroIdentity && doc.hydroIdentity.counties) || [],
    },
    stockedTrout,
    proposal,
    ownerVerdict: ownerVerdict ? { verdict: ownerVerdict.verdict, ownerConfirmed: ownerVerdict.ownerConfirmed } : null,
    ledgerBucket: ledger ? ledger.verdict.bucket : null,
    ledgerMonths: ledger && ledger.season ? ledger.season.ledgerMonths : null,
  });
}

// --------------------------------------------------------------- decision boxes
const boxes = {
  speciesProposals: waters.filter((w) => w.proposal).map((w) => ({ slug: w.slug, ...w.proposal })),
  stockingProgramDeprecation: waters
    .filter((w) => w.catalog.stockingProgram)
    .map((w) => ({
      slug: w.slug,
      change: 'remove hand-set stockingProgram flag',
      replaceWith: w.stockedTrout ? 'computed stockedTrout view (T1 events)' : 'nothing — no T1 events matched; needs T2 verification',
      tier: w.stockedTrout ? 'T1' : 'T2-needed',
    })),
  seasonCorrections: waters
    .filter((w) => w.stockedTrout && w.stockedTrout.windowMonths && w.ledgerMonths
      && JSON.stringify([...w.ledgerMonths].sort((a, b) => a - b)) !== JSON.stringify(w.stockedTrout.windowMonths))
    .map((w) => ({ slug: w.slug, catalogMonths: w.catalog.seasonMonths, eventMonths: w.stockedTrout.windowMonths, ledgerMonths: w.ledgerMonths, tier: 'T1 vs audited-ledger', needs: 'owner/T2' })),
  ambiguousJoins: resolution.ambiguous.map(({ event, candidates }) => ({
    site: event.site, water: event.water, county: event.county, program: event.program, candidates,
  })),
  t1Conflicts: waters
    .filter((w) => w.stockedTrout && ((w.ledgerBucket || '').startsWith('CONFLICT strip') || (w.ownerVerdict && /warmwater/i.test(w.ownerVerdict.verdict) && !/mixed/i.test(w.ownerVerdict.verdict))))
    .map((w) => ({
      slug: w.slug,
      conflict: 'T1 stocking feed has live events; ledger/owner verdict says warmwater/none',
      ledgerBucket: w.ledgerBucket,
      ownerVerdict: w.ownerVerdict ? w.ownerVerdict.verdict : null,
      events: w.stockedTrout.programs.join('/'),
      needs: 'T2 re-verification + owner decision',
    })),
  unmatchedEvents: resolution.unmatched.map(({ event }) => ({
    site: event.site, county: event.county, program: event.program,
  })),
  identityCorrections: [/* populated below */],
};

// ------------------------------------------------------------------- summary
const summary = {
  feedRows: events.reduce((n, e) => n + e.points, 0),
  events: events.length,
  unparsedSpeciesRows,
  matchedEvents: resolution.matched.length,
  matchedWaters: bySlugEvents.size,
  ambiguousEvents: resolution.ambiguous.length,
  unmatchedEvents: resolution.unmatched.length,
  watersWithComputedStocking: waters.filter((w) => w.stockedTrout).length,
  watersWindowUnpinned: waters.filter((w) => w.stockedTrout?.windowUnpinned).length,
  speciesProposals: boxes.speciesProposals.length,
  stockingProgramFlags: boxes.stockingProgramDeprecation.length,
  seasonCorrections: boxes.seasonCorrections.length,
};

const output = { generated: new Date().toISOString().replace('T', ' ').slice(0, 16), summary, waters };

if (writeReport) {
  mkdirSync(DIFF_OUT_DIR, { recursive: true });
  writeFileSync(join(DIFF_OUT_DIR, 'classification-output.json'), JSON.stringify(output, null, 2));
  writeFileSync(join(DIFF_OUT_DIR, 'resolution.json'), JSON.stringify({
    matched: resolution.matched.map(({ event, slug, confidence, how }) => ({ site: event.site, county: event.county, slug, confidence, how })),
    ambiguous: boxes.ambiguousJoins,
    unmatched: boxes.unmatchedEvents,
  }, null, 2));
  writeFileSync(join(DIFF_OUT_DIR, 'DIFF-REPORT.md'), renderReport(summary, boxes, resolution));
  console.log(`report written to ${join(DIFF_OUT_DIR, 'DIFF-REPORT.md')}`);
}

console.log(JSON.stringify(summary, null, 2));

export { output, resolution, boxes, summary };

function renderReport(summary, boxes, resolution) {
  const rel = (p) => p.slice(REPO_ROOT.length + 1);
  return `# CLASSIFICATION DIFF — tiered sourcing decision boxes (report-only)

Generated ${new Date().toISOString().slice(0, 10)} by \`packages/content/scripts/classification/pipeline.mjs\`.
**Nothing here has been applied to the catalog.** Every box needs owner approval.
Tiers: T1 = stocking feed + USGS facts (automatic) · T2 = official pages for contested calls · T3 = public corroboration. Owner-ruled verdicts are protected and never re-proposed.

## Summary

| Metric | Count |
|---|---|
| Feed rows (points) | ${summary.feedRows} |
| Deduped stocking events | ${summary.events} |
| Events resolved to a catalog water | ${summary.matchedEvents} (${summary.matchedWaters} waters) |
| Ambiguous joins (QUEUED — multiple same-named waters) | ${summary.ambiguousEvents} |
| Unmatched events (site not in catalog) | ${summary.unmatchedEvents} |
| Waters with computed stockedTrout view | ${summary.watersWithComputedStocking} |
| …of which window unpinned (Tailwater/Reservoir — T2) | ${summary.watersWindowUnpinned} |
| Species proposals (unset waters, T1-only evidence) | ${summary.speciesProposals} |
| stockingProgram flags queued for deprecation | ${summary.stockingProgramFlags} |
| Season windows: events vs audited ledger | ${summary.seasonCorrections} |

## Box 1 — species proposals (T1 events, water currently unset)

${boxes.speciesProposals.length ? boxes.speciesProposals.map((p) => `- **${p.slug}** → \`species: ${p.value}\` (${p.confidence}, T1) — ${p.evidence.join('; ')}`).join('\n') : '_none_'}

## Box 2 — deprecate the hand-set \`stockingProgram\` flag

The flag is a bare boolean on ${boxes.stockingProgramDeprecation.length} waters. Ruling: stocking events are the data; the flag is replaced by the computed stockedTrout view. Waters with NO matching T1 events are flagged T2-needed (verify before removing their flag).

<details><summary>All ${boxes.stockingProgramDeprecation.length} flagged waters</summary>

\`\`\`
${boxes.stockingProgramDeprecation.map((b) => `${b.slug} — ${b.tier}`).join('\n')}
\`\`\`
</details>

## Box 3 — season windows: T1 events vs audited ledger

${boxes.seasonCorrections.length ? boxes.seasonCorrections.map((b) => `- **${b.slug}**: events ${JSON.stringify(b.eventMonths)} vs ledger ${JSON.stringify(b.ledgerMonths)} (catalog ${JSON.stringify(b.catalogMonths)})`).join('\n') : '_none_'}

## Box 4 — ambiguous name joins (queued, never guessed)

${boxes.ambiguousJoins.length ? boxes.ambiguousJoins.map((b) => `- **${b.site}** (${b.county} Co, ${b.program}) → candidates: ${b.candidates.join(', ')}`).join('\n') : '_none_'}

## Box 5 — feed sites with no catalog water (candidate adds / out-of-scope)

<details><summary>${boxes.unmatchedEvents.length} unmatched sites</summary>

\`\`\`
${resolution.unmatched.map(({ event }) => `${event.site} (${event.county} Co, ${event.program})`).join('\n')}
\`\`\`
</details>

## Machine-readable

- \`${rel(DIFF_OUT_DIR)}/classification-output.json\` — per-water derived views (species proposal, stockedTrout, protection flags)
- \`${rel(DIFF_OUT_DIR)}/resolution.json\` — every event → match/ambiguous/unmatched
`;
}
