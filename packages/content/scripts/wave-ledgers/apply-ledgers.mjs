#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Wave-ledger apply (import plan Phase 3 — wholesale authoring from a
 * hand-verified manifest).
 *
 * Manifest provenance: Phase 1 diff (DIFF-REPORT.md) + owner-ordered cross-check
 * against Wikipedia/official sources on 2026-09-15, which CONFIRMED 7 strip
 * candidates + all 3 claim candidates and REJECTED roaring-fork from the strip
 * list (the wave-3 "none-found" class meant "no stream-level species detail" —
 * NPS documents reproducing wild trout across GRSM; the catalog verdict stood).
 *
 * Batches (one commit each, validate:content after every batch):
 *   A — species verdicts: 7 strips to warmwater + 3 claims to trout, with
 *       fishery/season coherence, notes correction lines and officialSources.
 *   B — season/program fills: wave-3 class-driven windows (stocked-winter,
 *       wild, mixed) + clean month-name-range window fills + holston-river.
 *
 *   node packages/content/scripts/wave-ledgers/apply-ledgers.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const dryRun = process.argv.includes('--dry-run');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const ledgerDir = join(root, 'docs', 'research', '2026-09-15-wave-ledgers');
const catalogDir = join(root, 'packages', 'content', 'streams', 'tn');
const TWRA_STOCK = 'https://www.tn.gov/twra/fishing/trout-information-stockings.html';

const { waters } = JSON.parse(readFileSync(join(ledgerDir, 'ledger', 'waters.json'), 'utf8'));
const bySlug = new Map();
for (const w of waters) if (!bySlug.has(w.slug)) bySlug.set(w.slug, w); // first block wins (wave order)

// --- Batch A manifest (cross-check-confirmed 2026-09-15) -------------------
const STRIP = [
  { slug: 'obed-river', src: 'https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm', why: 'NPS Obed WSR documents a warmwater fishery (smallmouth/rock bass); no trout program or record; agency temps reached 29.7 °C in Jul 2026.' },
  { slug: 'new-river', src: 'https://www.tn.gov/twra/fishing.html', why: 'Agency sources document a warmwater smallmouth fishery (Jul 2026 max 27.4 °C at 03408500); no TWRA trout program.' },
  { slug: 'french-broad-river', src: 'https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/douglas-reservoir.html', why: 'The Tennessee reach below Douglas Dam is a warmwater smallmouth/crappie fishery; TWRA stocks no trout row; trout mentions belong to the NC headwaters.' },
  { slug: 'red-river-clarksville', src: 'https://www.tn.gov/twra/fishing.html', why: 'Warmwater river (smallmouth/largemouth/spotted bass, white bass, catfish); no TWRA trout stocking row or trout record.' },
  { slug: 'clear-creek-obed', src: 'https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm', why: 'Obed-system creek; warmwater fish community, zero salmonids in NPS records, summer temps ~30 °C.' },
  { slug: 'daddys-creek', src: 'https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm', why: 'Obed-system creek; warmwater (TWRA stocks musky here; smallmouth mercury advisory); zero salmonids in NPS records.' },
  { slug: 'reedy-creek', src: 'https://www.tn.gov/twra/fishing.html', why: 'Urban Kingsport creek; warmwater (303(d) listed); zero trout rows in the TWRA 2026 schedule.' },
];
const CLAIM = [
  { slug: 'south-holston-lake', fields: { species: 'trout', stockingProgram: true, fishery: 'stocked' }, src: 'https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/south-holston-reservoir.html', why: 'TWRA annually stocks trout in the reservoir (lake + lake trout named); stocking months unpinned — left unset.' },
  { slug: 'harpeth-river', fields: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [12, 1, 2], seasonKind: 'programmatic' }, src: TWRA_STOCK, why: 'TWRA winter program stocks the Harpeth at Eastern Flank Battle Park (Franklin) — December runs per the official schedule.' },
  { slug: 'little-tennessee-river', fields: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [2, 3, 4], seasonKind: 'programmatic' }, src: 'https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/tellico-reservoir.html', why: 'Trout water is the Chilhowee-tailwater reach (upper Little Tennessee arm); late-winter/early-spring rainbow plants per TWRA.' },
];
const STRIP_DROP_FIELDS = ['fishery', 'yearRound', 'seasonMonths', 'seasonKind'];

// --- build ops ---------------------------------------------------------------
const ops = []; // {slug, batch, fields:{set:{}, remove:[]}, notesAdd, srcAdd}
const pushOp = (slug, batch, fields, notesAdd, srcAdd) => ops.push({ slug, batch, fields, notesAdd, srcAdd });

// Batch A
for (const s of STRIP) {
  pushOp(s.slug, 'A', { set: { species: 'warmwater', stockingProgram: false }, remove: STRIP_DROP_FIELDS }, `Correction (2026-09-15): agency sources document a warmwater fishery with no trout program or record — ${s.why} (retrieved 2026-09-14).`, s.src);
}
for (const c of CLAIM) {
  pushOp(c.slug, 'A', { set: c.fields, remove: [] }, `Stocked trout fishery confirmed by agency sources (retrieved 2026-09-14) — ${c.why}`, c.src);
}

// Batch B — wave-3 class-driven fills
const classFills = { 'stocked-winter': 0, 'wild-self-sustaining': 0, mixed: 0 };
for (const w of waters) {
  if (!w.class || w.slug === 'watauga-river-wilbur-reach') continue;
  if (w.wave !== 3) continue;
  if (w.class === 'stocked-winter') {
    classFills['stocked-winter'] += 1;
    pushOp(w.slug, 'B', { set: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [12, 1, 2], seasonKind: 'programmatic' }, remove: [] }, null, null);
  } else if (w.class === 'wild-self-sustaining') {
    classFills['wild-self-sustaining'] += 1;
    pushOp(w.slug, 'B', { set: { species: 'trout', fishery: 'wild', yearRound: true }, remove: [] }, null, null);
  } else if (w.class === 'mixed') {
    classFills.mixed += 1;
    pushOp(w.slug, 'B', { set: { species: 'trout', stockingProgram: true, yearRound: true }, remove: [] }, null, null);
  }
}

// Batch B — hand-set window fills only: waters whose ledger row pins an
// explicit window (Dec–Mar Percy Priest winter program). Automated window
// extraction over single month words proved too noisy (elk-river-lower).
const windowFills = [
  { slug: 'east-fork-stones-river', months: [12, 1, 2, 3], why: 'owner-confirmed winter-stocked (J. Percy Priest Dam/Stones row, Dec–Mar)' },
  { slug: 'west-fork-stones-river', months: [12, 1, 2, 3], why: 'winter program reach of the Stones (Dec–Mar)' },
];

// Batch B — hand-verified species fills. These are waters where the catalog
// leaves species unset and the ledgers + Trout Management Plan document a real
// trout fishery. Deliberately EXPLICIT, not derived: the automated verdict
// bucket also captured disambiguation-heavy lakes (boone/douglas/great-falls)
// whose TWRA "trout" lines belong to riverine arms — wave-1 verified those
// trout-free, so they stay out. All five below are TMP-nine or wave-2 finds.
const SPECIES_FILLS = [
  { slug: 'holston-river', set: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [11, 12, 1, 2, 3, 4], seasonKind: 'programmatic' }, why: 'Cherokee Dam tailwater reach of the main-stem Holston carries Nov–Apr stocked trout (wave-2).' },
  { slug: 'wilbur-lake', set: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [3, 4, 5, 6, 7], seasonKind: 'programmatic' }, why: 'TMP trout reservoir; "Watauga Dam, Wilbur Reservoir — Rainbow — March through July" schedule row (wave-1 dispute resolved).' },
  { slug: 'fort-patrick-henry-lake', set: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false }, why: 'TMP nine-trout-reservoir list ("Region IV, Fort Patrick Henry — Brown and Rainbow"); stocking months unpinned.' },
  { slug: 'watauga-lake', set: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false }, why: 'TMP trout reservoir ("Region IV, Watauga — Lake and Rainbow"); months unpinned.' },
  { slug: 'tellico-lake', set: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [2, 3, 4], seasonKind: 'programmatic' }, why: 'TMP trout reservoir — upper Little Tennessee arm below Chilhowee Dam; ~4,500 rainbows late winter/early spring.' },
];

// --- apply ---------------------------------------------------------------------
function loadYaml(slug) {
  return { path: join(catalogDir, `${slug}.yaml`), doc: parse(readFileSync(join(catalogDir, `${slug}.yaml`), 'utf8')) };
}

function applyOp(doc, op) {
  const y = doc;
  for (const [k, v] of Object.entries(op.fields.set)) {
    // never overwrite an authored value with the same or weaker data; log-if-differs is the diff's job
    y[k] = v;
  }
  for (const k of op.fields.remove) delete y[k];
  if (op.notesAdd) {
    const base = typeof y.notes === 'string' ? y.notes.trim() : '';
    if (!base.includes('Correction (2026-09-15)') && !base.includes('Stocked trout fishery confirmed')) {
      y.notes = base ? `${base}\n\n${op.notesAdd}` : op.notesAdd;
    }
  }
  if (op.srcAdd && !JSON.stringify(y.officialSources ?? []).includes(op.srcAdd)) {
    y.officialSources = [
      ...(y.officialSources ?? []),
      { label: 'Agency fishery source — wave-ledger sourcing (retrieved 2026-09-14)', url: op.srcAdd },
    ];
  }
}

// merge window fills into batch-B ops (only where seasonMonths is actually unset)
const manifest = { A: [], B: [] };
const seen = new Set();
for (const op of ops) {
  const { doc } = loadYaml(op.slug);
  if (op.batch === 'B') {
    // never half-apply onto a conflicting authored verdict: a mixed/wild class
    // landing on a cataloged warmwater water is a review row, not an edit
    if (op.fields.set.species && doc.species === 'warmwater') {
      console.log(`  SKIP ${op.slug}: authored species warmwater conflicts with class fill (review row)`);
      continue;
    }
    const set = {};
    const w3 = bySlug.get(op.slug);
    const cls = w3?.class;
    for (const [k, v] of Object.entries(op.fields.set)) {
      if (doc[k] === undefined) set[k] = v;
      else if (doc[k] === v) set[k] = v; // idempotent no-op, recorded for the manifest
    }
    const changed = Object.keys(set).length > 0;
    if (!changed) continue;
    manifest.B.push({ slug: op.slug, class: cls, set, remove: [], notesAdd: null, srcAdd: null });
  } else {
    manifest.A.push(op);
  }
  seen.add(op.slug);
}
for (const wf of windowFills) {
  if (seen.has(wf.slug)) continue;
  const { doc } = loadYaml(wf.slug);
  if (doc.seasonMonths !== undefined) continue;
  if (doc.species !== 'trout') continue; // window fills only ride waters that are already trout
  const set = { seasonMonths: wf.months, seasonKind: 'programmatic' };
  if (doc.yearRound === undefined) set.yearRound = false; // seasonal program honesty
  manifest.B.push({ slug: wf.slug, class: null, set, remove: [], notesAdd: null, srcAdd: null });
  seen.add(wf.slug);
}
for (const sf of SPECIES_FILLS) {
  if (seen.has(sf.slug)) continue;
  const { doc } = loadYaml(sf.slug);
  if (doc.species !== undefined) continue; // fill-gaps only — never overwrite authored verdicts
  const set = { ...sf.set };
  manifest.B.push({
    slug: sf.slug,
    class: 'species-fill',
    set,
    remove: [],
    notesAdd: `Stocked trout fishery documented by agency sources in the 2026-09 wave-ledger sourcing pass (retrieved 2026-09-14) — ${sf.why}`,
    srcAdd: TWRA_STOCK,
  });
  seen.add(sf.slug);
}

// --- report + write ------------------------------------------------------------
console.log(`[apply] manifest: batch A = ${manifest.A.length} waters, batch B = ${manifest.B.length} waters`);
console.log('[apply] class fills seen:', JSON.stringify(classFills));
for (const op of manifest.A) console.log(`  A ${op.slug}: set {${Object.entries(op.fields.set).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}} remove [${op.fields.remove.join(', ')}]`);
for (const op of manifest.B) console.log(`  B ${op.slug} (${op.class ?? 'window-fill'}): set {${Object.entries(op.set).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}}`);

if (dryRun) {
  console.log('[apply] dry run — nothing written');
  process.exit(0);
}

let written = 0;
for (const batch of ['A', 'B']) {
  for (const op of manifest[batch]) {
    const { path, doc } = loadYaml(op.slug);
    applyOp(doc, { fields: { set: op.set ?? op.fields?.set, remove: op.remove ?? op.fields?.remove ?? [] }, notesAdd: op.notesAdd, srcAdd: op.srcAdd });
    writeFileSync(path, stringify(doc, { lineWidth: 110 }));
    written += 1;
  }
}
console.log(`[apply] wrote ${written} YAML files`);
