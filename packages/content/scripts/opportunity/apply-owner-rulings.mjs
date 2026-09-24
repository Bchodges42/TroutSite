/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * apply-owner-rulings — apply the four 2026-09-24 owner rulings (provenance:
 * OWNER-RULINGS-2026-09-24.md) to the catalog AND the ledger headline set so
 * verify-ledger stays consistent. Idempotent via the marker note line.
 *   node packages/content/scripts/opportunity/apply-owner-rulings.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const CAT = join(ROOT, 'packages', 'content', 'streams', 'tn');
const ART = join(ROOT, 'docs', 'research', '2026-09-22-fishery-opportunities');
const MARK = 'Owner ruling (2026-09-24):';
const dryRun = process.argv.includes('--dry-run');
const SCHED_URL = 'https://www.tn.gov/twra/fishing/trout-information-stockings.html';
const FORECAST_URL = 'https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747/data?f=json';

function load(id) { return parse(readFileSync(join(CAT, id + '.yaml'), 'utf8')); }
function save(id, doc) { if (!dryRun) writeFileSync(join(CAT, id + '.yaml'), stringify(doc, { lineWidth: 100 })); }
function note(doc, text) {
  if ((doc.notes ?? '').includes(MARK + ' ' + text)) return;
  const base = (doc.notes ?? '').trim();
  doc.notes = `${base}${base ? '\n\n' : ''}${MARK} ${text}`;
}
const ledger = JSON.parse(readFileSync(join(ART, 'ledger.json'), 'utf8'));
const byId = new Map(ledger.waters.map((w) => [w.id, w]));
function setHeadline(id, mut) {
  const w = byId.get(id);
  mut(w.headline, w);
}

// 1. Harpeth — warmwater river + documented winter trout program → mixed
{
  const d = load('harpeth-river');
  d.species = 'warmwater';
  d.stockingProgram = true;
  d.yearRound = false;
  d.seasonMonths = [12, 1, 2];
  d.seasonKind = 'programmatic';
  if (!(d.targetSpecies ?? []).includes('smallmouth-bass')) d.targetSpecies = [...(d.targetSpecies ?? []), 'smallmouth-bass'].sort();
  d.opportunity = {
    trout: 'mixed',
    evidenceState: 'documented',
    statement: 'A warmwater river (owner ruling 2026-09-24) with a documented TWRA winter trout program (December–February stockings at Eastern Flank Battle Park, Franklin) — bass and panfish coexist with the seasonal trout stocking.',
    asOf: '2026',
    sources: [
      { label: 'TWRA trout stocking schedule — Harpeth River at Eastern Flank Battle Park', url: SCHED_URL, kind: 'schedule-table', observationPeriod: '2026 stocking year', retrieved: '2026-09-22', pinpoint: 'rows: "Harpeth River at Eastern Flank Battle Park" (Williamson), Winter program, Dec–Feb weeks, Rainbow Trout' },
      { label: 'Owner ruling 2026-09-24 — warmwater river, seasonally stocked', url: SCHED_URL, kind: 'program-description', retrieved: '2026-09-24', pinpoint: 'OWNER-RULINGS-2026-09-24.md ruling 1 + ruling 4 (ambient smallmouth policy)' },
    ],
    caveats: [
      'Winter trout window only — the stocking months are not a survival window.',
      'Warmwater species presence per the owner\'s statewide ambient policy (smallmouth and the common TN warmwater suite), not a per-water survey.',
    ],
  };
  note(d, 'warmwater river with a documented seasonal trout program (see OWNER-RULINGS-2026-09-24.md); smallmouth tag retained under the ambient-presence policy.');
  save('harpeth-river', d);
  setHeadline('harpeth-river', (h, w) => {
    h.troutOpportunity = 'mixed';
    h.warmwaterFocus = true;
    h.evidenceState = 'documented';
    h.statement = d.opportunity.statement;
    d.opportunity.reachScope = h.reachScope ?? undefined;
    if (d.opportunity.reachScope) save('harpeth-river', d);
    w.claims.push({ kind: 'warmwater-fishery', state: 'documented', appliesToReach: 'whole feature', source: { url: 'OWNER-RULINGS-2026-09-24.md', publisher: 'Owner (interview)', title: 'Owner ruling 1 + 4', method: 'owner ruling (ambient-presence policy)', retrieved: '2026-09-24', pinpoint: 'warmwater river; smallmouth ambient statewide' }, statement: 'Owner rules the Harpeth a warmwater river; smallmouth/warmwater presence is ambient per the statewide policy.', qualification: 'Product decision recorded with date, distinguishable from measured evidence.', nextQuestion: null });
  });
}

// 2. East Fork Stones — warmwater + winter/seasonal stocking (ruling) → mixed
{
  const d = load('east-fork-stones-river');
  d.species = 'warmwater';
  delete d.fishery;
  d.stockingProgram = true;
  d.yearRound = false;
  d.seasonMonths = [12, 1, 2];
  d.seasonKind = 'programmatic';
  d.opportunity = {
    trout: 'mixed',
    evidenceState: 'limited',
    statement: 'A warmwater river with a winter/seasonal trout program (owner ruling 2026-09-24). No published TWRA row names this fork under the names searched — the winter claim rests on the ruling and the area\'s winter-program pattern.',
    asOf: '2026',
    unresolvedQuestion: 'Which published TWRA rows/locations constitute the East Fork Stones winter stocking? (asked of the owner/TWRA; zero rows found in the committed schedule/GIS captures)',
    sources: [
      { label: 'Owner ruling 2026-09-24 — warmwater, stocked winter/seasonally', url: SCHED_URL, kind: 'program-description', retrieved: '2026-09-24', pinpoint: 'OWNER-RULINGS-2026-09-24.md ruling 2' },
    ],
    caveats: [
      'The prior trout/wild tags carried no agency source; one NRSA site visit (2023, lower reach, zero salmonids) is a single sample, not trout absence.',
    ],
  };
  note(d, 'warmwater with a winter/seasonal trout program per OWNER-RULINGS-2026-09-24.md ruling 2; no published rows name this fork — TWRA question open.');
  save('east-fork-stones-river', d);
  setHeadline('east-fork-stones-river', (h, w) => {
    h.troutOpportunity = 'mixed';
    h.warmwaterFocus = true;
    h.evidenceState = 'limited';
    h.statement = d.opportunity.statement;
    w.unresolvedQuestion = 'Which published TWRA rows/locations constitute the East Fork Stones winter stocking?';
    w.claims.push({ kind: 'seasonal-stocked-opportunity', state: 'limited', appliesToReach: 'whole feature', source: { url: 'OWNER-RULINGS-2026-09-24.md', publisher: 'Owner (interview)', title: 'Owner ruling 2', method: 'owner ruling', retrieved: '2026-09-24', pinpoint: 'warmwater, stocked winter/seasonally' }, statement: 'Owner rules the East Fork warmwater with winter/seasonal trout stocking.', qualification: 'Zero published rows found for this fork — ruling exceeds current public data; tension preserved. Water-specific warmwater presence per the ambient policy (ruling 4).', nextQuestion: 'Identify the TWRA rows/locations for this stocking.' });
  });
}

// 3. Little Pigeon — wild + weekly-stocked corridor (ruling) → year-round-trout (limited)
{
  const d = load('little-pigeon-river');
  d.species = 'trout';
  d.stockingProgram = true;
  d.yearRound = true;
  d.fishery = 'wild+stocked';
  d.opportunity = {
    trout: 'year-round-trout',
    evidenceState: 'limited',
    statement: 'Trout water with wild trout present and weekly Gatlinburg-program stocking (owner ruling 2026-09-24). The documented weekly program is the West Prong through Gatlinburg (forecast node n-4U71UT + Gatlinburg Streams rows); main-stem-specific published rows were not found.',
    reachScope: 'Little Pigeon corridor at/above Sevierville (Gatlinburg program reach; see west-prong-little-pigeon for the documented weekly-stocked water)',
    asOf: '2026',
    sources: [
      { label: 'TWRA trout forecast — Gatlinburg streams stocked year-round to the park boundary (node n-4U71UT)', url: FORECAST_URL, kind: 'agency-assessment', publicationDate: '2026', retrieved: '2026-09-22', pinpoint: 'node n-4U71UT: Gatlinburg streams "Stocking: Year-Round", stocked Thursdays to the national park boundary' },
      { label: 'Owner ruling 2026-09-24 — stocked weekly, wild trout present', url: FORECAST_URL, kind: 'firsthand-report', retrieved: '2026-09-24', pinpoint: 'OWNER-RULINGS-2026-09-24.md ruling 3' },
    ],
    caveats: [
      'Main-stem-specific schedule rows were not found in the committed captures — the main-stem extent rests on the owner ruling.',
    ],
  };
  note(d, 'wild trout present + weekly Gatlinburg-program stocking per OWNER-RULINGS-2026-09-24.md ruling 3; fishery wild+stocked (ADR 0011).');
  save('little-pigeon-river', d);
  setHeadline('little-pigeon-river', (h, w) => {
    h.troutOpportunity = 'year-round-trout';
    h.warmwaterFocus = false;
    h.evidenceState = 'limited';
    h.reachScope = d.opportunity.reachScope;
    h.statement = d.opportunity.statement;
    w.unresolvedQuestion = null;
    w.claims.push({ kind: 'owner-ruling', state: 'limited', appliesToReach: 'Little Pigeon corridor at/above Sevierville', source: { url: 'OWNER-RULINGS-2026-09-24.md', publisher: 'Owner (interview)', title: 'Owner ruling 3', method: 'owner ruling', retrieved: '2026-09-24', pinpoint: 'stocked every week in Gatlinburg; wild trout present' }, statement: 'Owner rules the Little Pigeon weekly-stocked (Gatlinburg program) with wild trout present.', qualification: 'Documented weekly program is the West Prong; main-stem rows absent — ruling carries the main-stem extent.', nextQuestion: null });
  });
}

// 3b. West Prong — same split, documented (consistency with ruling 3)
{
  const d = load('west-prong-little-pigeon');
  d.fishery = 'wild+stocked';
  note(d, 'fishery wild+stocked (ADR 0011): wild park reach + the documented year-round Gatlinburg weekly program on the lower reach (owner ruling 2026-09-24 ruling 3 confirms).');
  save('west-prong-little-pigeon', d);
}

if (!dryRun) {
  writeFileSync(join(ART, 'ledger.json'), JSON.stringify(ledger, null, 2) + '\n');
}
console.log(dryRun ? '[dry-run] 4 rulings would apply + ledger headlines updated' : '4 rulings applied; ledger headlines updated (harpeth mixed, east-fork-stones mixed/limited, little-pigeon year-round/limited)');
