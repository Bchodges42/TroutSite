/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * apply-triage — apply the owner-approved 2026-09-24 triage decisions to the
 * catalog (research/owner-triage-20260924 dispositions; owner approved the
 * research-resolved set, the wild+stocked convention, and Parksville display
 * retention on 2026-09-24). NOT applied here: the 9 legacy-tag strips (owner
 * deferred pending the legacy digest) and caney-fork-upper's fishery
 * population (the triage suggested 'warmwater', but the field's enum is
 * trout-identity-typed — schema finding recorded in the apply report).
 *
 * Idempotent: every appended note line starts with the marker below.
 *   node packages/content/scripts/opportunity/apply-triage.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const CAT = join(ROOT, 'packages', 'content', 'streams', 'tn');
const MARK = 'Triage apply (2026-09-24):';
const dryRun = process.argv.includes('--dry-run');

const GRAHAM_URL = 'https://www.tn.gov/twra/fishing/where-to-fish/west-tennessee-r1/lake-graham.html';

function load(id) { return parse(readFileSync(join(CAT, id + '.yaml'), 'utf8')); }
function save(id, doc) { if (!dryRun) writeFileSync(join(CAT, id + '.yaml'), stringify(doc, { lineWidth: 100 })); }
function note(doc, text) {
  const base = (doc.notes ?? '').split(MARK)[0].trim();
  const existing = (doc.notes ?? '').includes(MARK) ? doc.notes.slice(doc.notes.indexOf(MARK)) : '';
  const line = `${MARK} ${text}`;
  doc.notes = existing.includes(text) ? doc.notes : `${base}${base ? '\n\n' : ''}${existing}${existing ? '\n\n' : ''}${line}`.trim();
}
const changes = [];

// --- repair-gap window removals -------------------------------------------
for (const [id, why] of [
  ['north-prong-barren-fork', 'removed stale seasonMonths [12,1,2]/programmatic — the committed TWRA schedule holds only spring weeks (3/22 + 4/26, "N Barren Fork Creek"); the repair\'s 22-item sweep missed this one'],
  ['tellico-lake', 'removed stale seasonMonths [2,3,4]/programmatic block — same class as the repaired 22 (year-round reservoir-list program; no published fishing window)'],
  ['watauga-river-wilbur-reach', 'removed seasonMonths [3,4,5,6,7] and seasonKind — those months mirror the Wilbur RESERVOIR static-table row and the fishery: tailwater label mirrored the below-Wilbur-Dam water (watauga-river); neither belongs to this reach'],
]) {
  const doc = load(id);
  if (doc.seasonMonths == null && doc.fishery !== 'tailwater') { changes.push(`${id}: already applied`); continue; }
  delete doc.seasonMonths;
  delete doc.seasonKind;
  if (id === 'watauga-river-wilbur-reach') delete doc.fishery;
  note(doc, why);
  save(id, doc);
  changes.push(`${id}: removed seasonMonths/seasonKind${id === 'watauga-river-wilbur-reach' ? ' + fishery' : ''}`);
}

// --- doe-river: author the documented REGULATORY DH window -----------------
{
  const doc = load('doe-river');
  if (doc.seasonKind !== 'regulatory') {
    doc.seasonMonths = [10, 11, 12, 1, 2];
    doc.seasonKind = 'regulatory';
    note(doc, 'seasonMonths re-authored as the documented REGULATORY delayed-harvest C&R window (Oct 1–Feb 28, TWRA regs, live-verified 2026-09-22) — the Mar–Jun stocking weeks are events, not the season');
    save('doe-river', doc);
    changes.push('doe-river: regulatory DH window Oct–Feb');
  }
}

// --- watauga-river: align months with the 2-of-3 source side ---------------
{
  const doc = load('watauga-river');
  const target = JSON.stringify([3, 4, 5, 6, 7, 8, 9]);
  if (JSON.stringify(doc.seasonMonths) !== target) {
    doc.seasonMonths = [3, 4, 5, 6, 7, 8, 9];
    note(doc, 'seasonMonths [3..12]→[3..9] — schedule + forecast say Mar–Sep; the static table alone says Mar–Dec (conflict preserved in the ledger; the field previously contradicted its own Mar–Sep caveat)');
    save('watauga-river', doc);
    changes.push('watauga-river: months → Mar–Sep (2-of-3 sources)');
  }
}

// --- yearRound / stockingProgram flips -------------------------------------
for (const [id, fields, why] of [
  ['dale-hollow-lake', { yearRound: true }, 'yearRound → true — TWRA year-round reservoir list (live 2026-09-22/24); the April schedule row\'s Brown-Trout vs list/page Rainbow conflict stays preserved in the ledger'],
  ['south-holston-lake', { yearRound: true }, 'yearRound → true — named in TWRA\'s live year-round reservoir list'],
  ['parksville-lake', { stockingProgram: true, yearRound: true }, 'stockingProgram → true + yearRound → true — TWRA year-round reservoir list ("Region II, Parksville - Rainbow") + captured fishery page + reservoir GIS points'],
]) {
  const doc = load(id);
  let touched = false;
  for (const [k, v] of Object.entries(fields)) if (doc[k] !== v) { doc[k] = v; touched = true; }
  if (touched) { note(doc, why); save(id, doc); changes.push(`${id}: ${Object.keys(fields).join('+')}`); }
}

// --- region / county / identity --------------------------------------------
for (const [id, mut, why] of [
  ['mill-creek-overton', (d) => { d.regionId = 'tn-upper-cumberland'; }, 'regionId tn-middle-caney-fork → tn-upper-cumberland — the creek\'s own huc8s (05130106, Obey/Cordell Hull drainage) contradict the Caney Fork tag; Obey-drainage catalog waters carry tn-upper-cumberland'],
  ['standing-rock-creek', (d) => { d.regionId = 'tn-west'; }, 'regionId tn-upper-cumberland → tn-west — the creek\'s own huc8s (06040005, Lower Tennessee/Kentucky Lake drainage) contradict the Cumberland tag; Kentucky-Lake/Tennessee-River waters carry tn-west'],
  ['puncheon-camp-creek', (d) => { d.hydroIdentity.counties = ['Grainger']; }, 'hydroIdentity.counties [Campbell] → [Grainger] — TWRA schedule COUNTY=Grainger and all 7 GIS stocking points sit in Grainger (Washburn); geometry/linework follow-up remains with the owner'],
]) {
  const doc = load(id);
  const before = JSON.stringify([doc.regionId, doc.hydroIdentity?.counties]);
  mut(doc);
  if (JSON.stringify([doc.regionId, doc.hydroIdentity?.counties]) !== before) { note(doc, why); save(id, doc); changes.push(`${id}: region/county corrected`); }
}

// --- note / citation repairs ------------------------------------------------
{
  const doc = load('clinch-river');
  const BAD = 'The tailwater runs from Norris Dam through Melton Hill Lake down to the Clinch mouth at Kingston / Watts Bar Lake.';
  const GOOD = 'The special-regulation trout water runs from Norris Dam to the Hwy 61 bridge; below that the Clinch becomes the Melton Hill pool (see melton-hill-lake) before reaching its mouth at Kingston.';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, GOOD);
    note(doc, 'reach sentence trimmed to the documented Hwy 61 boundary — the previous wording extended the tailwater claim through the Melton Hill pool');
    save('clinch-river', doc);
    changes.push('clinch-river: reach sentence trimmed to Hwy 61');
  }
}
{
  const doc = load('elk-river');
  let t = doc.notes ?? '';
  const B1 = 'winter stocking in the lower county reaches';
  if (t.includes(B1)) {
    t = t.replace(B1, 'winter pond stocking at Stone Bridge Park in Fayetteville (a different water)');
    doc.notes = t;
    note(doc, 'the only documented Lincoln County winter trout events are the Stone Bridge Park pond stockings in Fayetteville — not lower-river reaches; gauge text corrected (03578000 is upstream headwater context, not a tailwater gauge)');
    (doc.officialSources ?? []).forEach((s) => {
      if (/03578000/.test(s.url)) s.label = 'USGS Water Data — Elk River above Fayetteville (upstream headwater context, not the tailwater)';
    });
    const G = 'Two gauges (below dam and near Pelham) bracket the fishery.';
    if ((doc.notes ?? '').includes(G)) doc.notes = doc.notes.replace(G, 'The tailwater gauge (tva:TMFT1) is the release truth-teller; USGS 03578000 sits far upstream above Fayetteville and is headwater context only.');
    save('elk-river', doc);
    changes.push('elk-river: winter-claim + gauge text fixed');
  }
}
{
  const doc = load('elk-river-lower');
  const BAD = 'TWRA winter rainbow stocking in Lincoln County reaches';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, 'the only documented Lincoln County trout stockings are the Stone Bridge Park pond events in Fayetteville (winter program) — not this river reach');
    note(doc, 'false stocking claim corrected — schedule\'s only Lincoln County rows are the Fayetteville pond events; species/fishery/stockingProgram tags await the owner\'s legacy-tag decision');
    save('elk-river-lower', doc);
    changes.push('elk-river-lower: false stocking sentence corrected');
  }
}
{
  const doc = load('melton-hill-lake');
  const BAD = 'runs the length of this pool, giving year-round cold-water fishing;';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, 'runs the length of this pool;');
    note(doc, 'removed "year-round cold-water fishing" — TWRA\'s page uses "year-round" only for camping; the cold-water fishery claim belongs to the clinch-river tailwater reach, not this reservoir');
    save('melton-hill-lake', doc);
    changes.push('melton-hill-lake: unsupported phrase removed');
  }
}
{
  const doc = load('nolichucky-river');
  const BAD = 'upstream reaches hold scattered wild fish';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, 'upstream reaches are reported to hold scattered wild fish (angler reports; no agency source — unverified)');
    note(doc, 'wild-fish phrase relabeled unverified — no agency surface documents it (checked 2026-09-22/24)');
    save('nolichucky-river', doc);
    changes.push('nolichucky-river: wild-fish claim relabeled');
  }
}
{
  const doc = load('johnson-park-lake');
  const BAD = 'winter put-and-take lake in Memphis (Shelby County)';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, 'winter put-and-take lake in Collierville (Shelby County)');
    note(doc, 'city corrected Memphis → Collierville — TWRA GIS City field for the W.C. Johnson Park stocking point');
    save('johnson-park-lake', doc);
    changes.push('johnson-park-lake: city corrected');
  }
}
{
  const doc = load('lake-graham');
  let n = 0;
  for (const ev of doc.speciesEvidence ?? []) if (ev.url !== GRAHAM_URL) { ev.url = GRAHAM_URL; n += 1; }
  if (n) {
    note(doc, `speciesEvidence re-pointed (${n} entries) from the trout stocking page to TWRA's Lake Graham page — species line verbatim "Largemouth bass - crappie - bluegill - redear sunfish - blue & channel catfish" (live 2026-09-24)`);
    save('lake-graham', doc);
    changes.push(`lake-graham: ${n} citations re-pointed`);
  }
}

// --- field populations -------------------------------------------------------
{
  const doc = load('edmund-orgill-lake');
  if (doc.species !== 'trout' || doc.fishery !== 'stocked') {
    doc.species = 'trout';
    doc.fishery = 'stocked';
    note(doc, "species → 'trout', fishery → 'stocked' — schedule rows + GIS stocking point document the stocked-rainbow program (captures, 2026-09-22)");
    save('edmund-orgill-lake', doc);
    changes.push('edmund-orgill-lake: species/fishery populated');
  }
}

// --- trail-fork owner-fact monitoring line ----------------------------------
{
  const doc = load('trail-fork-big-creek');
  const LINE = 'TWRA\'s planned 2025 survey occurred (owner-reported 2026-09-24; result not located)';
  if (!(doc.notes ?? '').includes(LINE)) {
    note(doc, `${LINE} — no inference is made about findings or brook-trout persistence above the waterfall; the archived TWRA 2024-05-20 row records one completed stocking at this destination, not the survey`);
    save('trail-fork-big-creek', doc);
    changes.push('trail-fork-big-creek: owner-fact monitoring line');
  }
}

// --- wild+stocked convention (owner-adopted) --------------------------------
const WILD_STOCKED = [
  ['little-river', 'wild park reach (TDEC NRTS above RM 33.0) + TWRA-stocked lower reaches near Walland/Maryville'],
  ['tellico-river', 'wild reproduction above North River (forecast-documented) + the TWRA-stocked corridor and DH program'],
  ['middle-prong-little-pigeon', 'wild park reach (NPS; stocking ended park-wide in 1975) + TWRA rows stocking sites outside the park'],
  ['cosby-creek', 'wild park reach (rainbows + brook trout, NPS year-round fishing) + TWRA rows/GIS sites on lower private-land segments'],
  ['leconte-creek', 'wild park reach + TWRA year-round Gatlinburg program (DH + weekly rainbows stocked to the park boundary)'],
  ['roaring-fork', 'wild park reach + TWRA year-round Gatlinburg program (DH + weekly rainbows stocked to the park boundary)'],
];
for (const [id, reach] of WILD_STOCKED) {
  const doc = load(id);
  if (doc.fishery === 'wild+stocked') { changes.push(`${id}: wild+stocked already set`); continue; }
  doc.fishery = 'wild+stocked';
  note(doc, `fishery → 'wild+stocked' (ADR 0011): ${reach}`);
  save(id, doc);
  changes.push(`${id}: fishery → wild+stocked`);
}

// --- GSMNP note wording (park-reach split, stated once uniformly) ------------
{
  const doc = load('leconte-creek');
  const BAD = 'TWRA spring stocking listed';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, 'TWRA year-round program (Gatlinburg DH + weekly rainbows to the park boundary); the park reach is wild');
    save('leconte-creek', doc); changes.push('leconte-creek: program wording');
  }
}
{
  const doc = load('roaring-fork');
  const BAD = 'TWRA listing spring stocking for the Roaring Fork area';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, 'TWRA year-round program (Gatlinburg DH + weekly rainbows to the park boundary); the park reach is wild');
    save('roaring-fork', doc); changes.push('roaring-fork: program wording');
  }
}
{
  const doc = load('cosby-creek');
  const BAD = 'TWRA lists spring stocking';
  if ((doc.notes ?? '').includes(BAD)) {
    doc.notes = doc.notes.replace(BAD, 'TWRA stocking rows and GIS sites target the lower private-land segments; the park reach is wild');
    save('cosby-creek', doc); changes.push('cosby-creek: reach wording');
  }
}

console.log(dryRun ? '[dry-run] would apply:' : 'applied:');
for (const c of changes) console.log('  - ' + c);
console.log(`${changes.length} change(s)${dryRun ? ' (dry run — nothing written)' : ''}`);
