#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Build the owner review page for the habitat-evidence lane.
 * Runs the stage-2 code classifier over every evidenced water (batches 1-3),
 * buckets results into OWNER DECISIONS (escalations + conflicts) vs
 * AUTO-ACCEPTED (high-confidence), embeds the research-flagged catalog
 * conflicts, and writes a single self-contained HTML file.
 *
 * Usage: node docs/research/2026-09-18-habitat-review/build-review.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from '../../../packages/content/scripts/classification/code-classify.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const batches = [
  ...read('packages/content/research/habitat-survival/batch1.json'),
  ...read('packages/content/research/habitat-survival/batch2.json'),
  ...read('packages/content/research/habitat-survival/batch3.json'),
];
const composite = read('packages/content/research/CLASSIFICATION-COMPOSITE-2026-09-17.json');
const LABEL_TEXT = {
  'trout-stream-year-round': 'Year Round - Trout Stream',
  'warmwater-yearly-stocked-winter-trout': 'Warm Water - Seasonal/Winter Stocking',
  'warmwater-no-trout': 'Warm Water - No Trout',
};

const rows = batches.map((rec) => {
  const cw = composite.waters[rec.slug] ?? {};
  const v = classify({
    evidenceRecord: rec,
    catalogRow: cw.catalog ?? {},
    stockingRow: { months: cw.seasonMonths ?? [] },
  });
  return {
    slug: rec.slug,
    name: rec.segment?.description?.split('(')[0]?.trim() || rec.slug,
    read: `${rec.overallSurvivalRead.yearRoundSurvivalLikely} (${rec.overallSurvivalRead.confidence})`,
    readWhy: rec.overallSurvivalRead.oneLineWhy,
    label: v.label,
    labelText: LABEL_TEXT[v.label] ?? v.label,
    confidence: v.confidence,
    gate: v.confidenceGate,
    reasons: v.reasons,
    conflicts: v.conflicts,
  };
});
const escalations = rows.filter((r) => r.gate === 'low').sort((a, b) => a.slug.localeCompare(b.slug));
const accepts = rows.filter((r) => r.gate === 'high').sort((a, b) => a.slug.localeCompare(b.slug));

/** Jev second opinions, when rate-escalations.mjs has been run with a key. */
let ratings = null;
const ratingsPath = join(dirname(fileURLToPath(import.meta.url)), 'jev-ratings.json');
if (existsSync(ratingsPath)) ratings = JSON.parse(readFileSync(ratingsPath, 'utf8')).results;
const ratingOf = (slug) => (ratings ?? []).find((r) => r.slug === slug) ?? null;
const disagreements = (ratings ?? []).filter((r) => r.resolution?.resolution === 'owner-box');
const agreements = (ratings ?? []).filter((r) => r.resolution?.resolution === 'accept');

/** Research-flagged catalog conflicts from batch reports 1-3 (owner boxes). */
const researchBoxes = [
  ['batch 1', 'duck-river-tailwater', 'Catalog says TWRA stocks it year-round; the 2026 workbook says winter months only (Jan, Feb, Mar, Nov, Dec). Decisive fact is yours.'],
  ['batch 1', 'wilbur-lake', 'An earlier ledger recorded a "Rainbow, March-July" reservoir row; the 2026-09-17 workbook has NO Wilbur Reservoir row at all.'],
  ['batch 2', 'leconte-creek', 'Catalog note says "TWRA spring stocking listed" but the 2026 workbook has zero LeConte Creek rows; GSMNP policy says the park stopped stocking in 1975.'],
  ['batch 2', 'roaring-fork', 'Catalog note claims spring stocking; the 2026 workbook has zero Roaring Fork rows.'],
  ['batch 2', 'cosby-creek', 'TWRA 2026 schedule lists seasonal Cosby Creek stocking (Mar-Jun) while NPS says the park does not stock — where does TWRA actually stock?'],
  ['batch 2', 'red-river-clarksville', 'TWRA stocks winter rainbows at Billy Dunlop Park — but no source pins whether that is the Red River channel or a park pond.'],
  ['batch 2', 'powell-river', 'Catalog claims wild rainbow/brown trout in upper reaches; zero agency support found. TWRA manages it as smallmouth water.'],
  ['batch 2', 'east-fork-stones-river', 'Catalog is internally conflicted (trout/wild fishery flags, yearRound false, no stocking row); nothing agency-side supports wild trout.'],
  ['batch 2', 'boone-lake + melton-hill-lake', 'TWRA live page names its year-round reservoir trout program — Boone and Melton Hill are NOT on it, and neither has a lake stocking row.'],
  ['batch 3', 'little-tennessee-river', 'TWRA program list entry "Tellico Upper (Rainbow)" plausibly IS the Chilhowee-tailwater Little Tennessee arm, but TWRA never says so explicitly (legacy composite owner box).'],
  ['batch 3', 'ocoee-number-three-lake', 'Catalog claims TWRA calls this pool "Hiwassee Lake" (443 ac) — could not be verified anywhere; TVA says 360 ac.'],
  ['batch 3', 'hurricane-creek / standing-rock-creek / white-oak-creek', 'These are Kentucky-Lake drainage creeks (Houston/Humphreys/Stewart counties) per their own GPS data, but carry stale "upper Cumberland" region labels. hurricane-creek GNIS IDs also mismatch.'],
  ['batch 3', 'harpeth-river', "TDEC's scenic-river designation excludes the Williamson County reach this catalog entry covers — any scenic-river fishery framing misattributes the reach."],
  ['batch 3', 'new-river', 'Catalog frames it as a state scenic river; TDEC live scenic-rivers index (24 waters) does not list it.'],
  ['batch 3', 'johnson-park-lake', 'Catalog says Memphis; sourced locality is W.C. Johnson Park, Collierville.'],
  ['batch 3', 'paris-city-park-lake', 'Stocking segment unresolved: TWRA lists "Paris City Park", local news places it at the Eiffel Tower Park pond, the catalog maps Green Acres Lake.'],
  ['batch 3', 'salt-lick-creek', 'Catalog seasonMonths (Dec/Jan/Feb) vs workbook March rows — internally inconsistent.'],
  ['batch 3', 'calderwood-lake', 'TWRA live page lists Brook/Brown/Rainbow; the stocking dataset rows say Rainbow only.'],
  ['policy', 'ALL', 'Ruling needed: the new year-round policy (continuous stocking alone = year-round) supersedes one sentence in the older 2026-09-17 category criteria ("a long stocking calendar is program evidence, not survival proof by itself"). The classifier implements the NEW policy; confirm.'],
];

const esc = escalations.map((r) => `
  <div class="card">
    <div class="slug">${r.slug} <span class="pill lean">code lean: ${r.labelText}</span> <span class="pill">researcher read: ${r.read}</span></div>
    <div class="why">${r.readWhy}</div>
    ${r.conflicts.length ? `<div class="conflict">CONFLICT: ${r.conflicts.join(' · ')}</div>` : ''}
    <div class="reasons">${r.reasons.join(' · ')}</div>
  </div>`).join('\n');

const acc = accepts.map((r) => `
  <tr><td>${r.slug}</td><td>${r.labelText}</td><td>${r.confidence}</td><td>${r.read}</td><td>${r.readWhy}</td></tr>`).join('\n');

const escCards = escalations.map((r) => {
  const rt = ratingOf(r.slug);
  const jevLine = rt
    ? (rt.error
      ? `<div class="conflict">Jev call errored: ${rt.error}</div>`
      : `<div class="jev">Jev: <b>${rt.jev.choice}</b> (confidence ${rt.jev.choiceConfidence ?? '?'}) → <b>${rt.resolution.resolution}</b>${rt.resolution.reason ? ` — ${rt.resolution.reason}` : ''}</div>`)
    : '<div class="jev pending">Jev second opinion: PENDING — run rate-escalations.mjs with TYPESAFE_API_KEY in the clone .env</div>';
  return `
  <div class="card">
    <div class="slug">${r.slug} <span class="pill lean">code lean: ${r.labelText}</span> <span class="pill">researcher read: ${r.read}</span></div>
    <div class="why">${r.readWhy}</div>
    ${r.conflicts.length ? `<div class="conflict">CONFLICT: ${r.conflicts.join(' · ')}</div>` : ''}
    ${jevLine}
    <div class="reasons">${r.reasons.join(' · ')}</div>
  </div>`;
}).join('\n');

const disagreeRows = disagreements.map((rt) => {
  const row = rows.find((r) => r.slug === rt.slug);
  const abstained = rt.jev?.choice === 'none';
  return `
  <div class="card disagree">
    <div class="slug">${rt.slug} <span class="pill">${abstained ? 'Jev abstained' : 'Jev disagrees'}</span> <span class="pill lean">code lean: ${LABEL_TEXT[rt.codeLabel] ?? rt.codeLabel}</span> <span class="pill">researcher read: ${row?.read ?? '?'}</span></div>
    <div class="conflict">CODE says ${LABEL_TEXT[rt.codeLabel] ?? rt.codeLabel} — JEV says ${rt.jev?.choice === 'none' ? 'cannot decide (abstained)' : (LABEL_TEXT[rt.jev.choice] ?? rt.jev.choice)}${rt.jev?.choiceConfidence != null ? ` (confidence ${rt.jev.choiceConfidence})` : ''}</div>
    ${rt.conflicts?.length ? `<div class="why">structural conflicts: ${rt.conflicts.join(' · ')}</div>` : ''}
    <div class="why">${row?.readWhy ?? ''}</div>
  </div>`;
}).join('\n');

const agreeTable = agreements.length
  ? `<table><tr><th>water</th><th>code + Jev agree on</th><th>Jev confidence</th></tr>${agreements.map((rt) => `<tr><td>${rt.slug}</td><td>${LABEL_TEXT[rt.codeLabel] ?? rt.codeLabel}</td><td>${rt.jev?.choiceConfidence ?? '?'}</td></tr>`).join('')}</table>`
  : '<div class="count">none yet</div>';

const boxes = researchBoxes.map(([b, w, d]) => `
  <div class="card"><div class="slug">${w} <span class="pill">${b}</span></div><div class="why">${d}</div></div>`).join('\n');
const policyHtml = researchBoxes.filter(([b]) => b === 'policy')
  .map(([, w, d]) => `<div class="card"><div class="slug">${w}</div><div class="why">${d}</div></div>`).join('\n');
const conflictHtml = researchBoxes.filter(([b]) => b !== 'policy')
  .map(([b, w, d]) => `<div class="card"><div class="slug">${w} <span class="pill">${b}</span></div><div class="why">${d}</div></div>`).join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Habitat Evidence Review — items needing owner rulings</title>
<style>
 body{font-family:Georgia,serif;max-width:980px;margin:24px auto;padding:0 16px;color:#222;background:#faf7f0}
 h1{font-size:26px} h2{margin-top:36px;border-bottom:2px solid #8b6f47;padding-bottom:4px}
 .card{background:#fff;border:1px solid #ddd8cc;border-radius:6px;padding:10px 14px;margin:10px 0}
 .slug{font-weight:bold;font-size:17px} .pill{font-size:12px;background:#eee7d8;border-radius:10px;padding:2px 8px;margin-left:6px;font-weight:normal}
 .pill.lean{background:#dfe9f5} .why{margin-top:6px;font-style:italic;color:#555} .conflict{margin-top:6px;color:#8c2f1b;font-weight:bold}
 .reasons{margin-top:4px;color:#666;font-size:14px}
 .jev{margin-top:6px;color:#1f4e79}
 .jev.pending{color:#8a6d1a;font-style:italic}
 .card.disagree{border-color:#8c2f1b;border-width:2px;background:#fff7f5}
 table{border-collapse:collapse;width:100%;font-size:14px} td,th{border:1px solid #ddd8cc;padding:6px 8px;text-align:left;vertical-align:top}
 .note{background:#efe9db;border-left:4px solid #8b6f47;padding:10px 14px;margin:14px 0}
 .count{font-size:14px;color:#666}
</style></head><body>
<h1>Habitat Evidence Review — what needs your ruling</h1>
<div class="note">Generated from 72 sourced evidence records (batches 1–3) run through the free code classifier.
<b>Escalations</b> are waters the code would not decide on its own. <b>Auto-accepted</b> waters decided themselves at high confidence (list included so you can spot-check).
The old <a href="../2026-09-17-classification-diff/JEV-REVIEW.html">JEV-REVIEW.html</a> page is untouched for the legacy 190-water pass.</div>
<h2>1 · Policy ruling needed (one item)</h2>
${policyHtml}
<h2>2 · Research-flagged catalog conflicts (${researchBoxes.length - 1} boxes)</h2>
${conflictHtml}
<h2>3 · Jev vs code — the actual review items (${ratings ? disagreements.length + ' disagree/abstain' : 'JEV NOT RUN — needs TYPESAFE_API_KEY in clone .env'})</h2>
${ratings
    ? (disagreements.length ? disagreeRows : '<div class="count">Zero disagreements — Jev agreed with the code or abstained everywhere (sections 4-5).</div>')
    : `<div class="count">These ${escalations.length} waters could not be decided by the code alone. Run <b>rate-escalations.mjs</b> with a TYPESAFE_API_KEY in the clone .env to fetch Jev's second opinions — then only the disagreements need your review.</div>`}
<h2>4 · Jev agreed with the code — accepted (${ratings ? agreements.length : 0})</h2>
${ratings ? agreeTable : '<div class="count">not run yet</div>'}
<h2>5 · Full escalation detail with second-opinion status (${escalations.length} waters)</h2>
${escCards}
<h2>6 · Auto-accepted at high confidence — no Jev needed (${accepts.length} waters — spot-check list)</h2>
<table><tr><th>water</th><th>label</th><th>researcher read</th><th>why</th></tr>${acc}</table>
</body></html>`;

const out = join(dirname(fileURLToPath(import.meta.url)), 'HABITAT-REVIEW.html');
writeFileSync(out, html);
console.log(`wrote ${out}`);
console.log(`escalations: ${escalations.length}, auto-accepted: ${accepts.length}, research boxes: ${researchBoxes.length - 1} + 1 policy ruling`);
