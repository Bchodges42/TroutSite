#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Build the owner review page for the habitat-evidence lane, in the same
 * format as the 2026-09-17 JEV-REVIEW.html decision table the owner knows:
 * sortable table + filters + per-item drawer + autosave + JSON export.
 * Decision rows = Jev-vs-code disagreements, research-flagged catalog
 * conflicts, and the one policy ruling. Jev agreements and code auto-accepts
 * are reference-only (no controls).
 *
 * Usage: node docs/research/2026-09-18-habitat-review/build-review.mjs
 * (run rate-escalations.mjs first so jev-ratings.json exists)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from '../../../packages/content/scripts/classification/code-classify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const LABELS = {
  'trout-stream-year-round': 'Year Round - Trout Stream',
  'warmwater-yearly-stocked-winter-trout': 'Warm Water - Seasonal/Winter Stocking',
  'warmwater-no-trout': 'Warm Water - No Trout',
};

const batches = [
  ...read('packages/content/research/habitat-survival/batch1.json'),
  ...read('packages/content/research/habitat-survival/batch2.json'),
  ...read('packages/content/research/habitat-survival/batch3.json'),
];
const bySlug = new Map(batches.map((r) => [r.slug, r]));
const composite = read('packages/content/research/CLASSIFICATION-COMPOSITE-2026-09-17.json');
const ratingsPath = join(here, 'jev-ratings.json');
const ratings = existsSync(ratingsPath) ? JSON.parse(readFileSync(ratingsPath, 'utf8')).results : [];
const ratingOf = (slug) => ratings.find((r) => r.slug === slug) ?? null;

function verdictOf(rec) {
  const cw = composite.waters[rec.slug] ?? {};
  return classify({ evidenceRecord: rec, catalogRow: cw.catalog ?? {}, stockingRow: { months: cw.seasonMonths ?? [] } });
}
function drawerFacts(rec) {
  if (!rec) return [];
  const cw = composite.waters[rec.slug] ?? {};
  const v = verdictOf(rec);
  const f = v.facets;
  const yn = (b) => (b === true ? 'yes' : b === false ? 'no' : 'unknown');
  const facts = [
    `wild population: ${yn(f.wild)}`,
    `holdover: ${yn(f.holdover)}`,
    `cold bottom-draw release: ${yn(f.coldRelease)}`,
    `stocking months: ${f.stockingMonths.length ? `${f.stockingMonths.join(', ')} (${f.stockingMonths.length}/12)` : 'none resolved'}`,
  ];
  if (rec.summerTemperature?.length) facts.push(`summer temps: ${rec.summerTemperature.map((t) => `${t.celsius}°C m${t.monthObserved}/${t.year}`).join('; ')}`);
  void cw;
  return facts;
}

const disagreements = ratings.filter((r) => r.resolution?.resolution === 'owner-box');
const jevAgreed = ratings.filter((r) => r.resolution?.resolution === 'accept');
const autoAccepts = [...bySlug.values()]
  .map((rec) => ({ rec, v: verdictOf(rec) }))
  .filter(({ v }) => v.confidenceGate === 'high');

const conflicts = [
  ['duck-river-tailwater', 'Catalog says TWRA stocks it year-round; the 2026 workbook says winter months only (Jan, Feb, Mar, Nov, Dec).'],
  ['wilbur-lake', 'An earlier ledger recorded a "Rainbow, March-July" reservoir row; the 2026-09-17 workbook has NO Wilbur Reservoir row at all.'],
  ['leconte-creek', 'Catalog note says "TWRA spring stocking listed" but the 2026 workbook has zero LeConte Creek rows; GSMNP stopped stocking in 1975.'],
  ['roaring-fork', 'Catalog note claims spring stocking; the 2026 workbook has zero Roaring Fork rows.'],
  ['cosby-creek', 'TWRA 2026 schedule lists seasonal stocking (Mar-Jun) while NPS says the park does not stock — where does TWRA actually stock?'],
  ['red-river-clarksville', 'TWRA stocks winter rainbows at Billy Dunlop Park — no source pins whether that is the river channel or a park pond.'],
  ['powell-river', 'Catalog claims wild rainbow/brown trout in upper reaches; zero agency support found. TWRA manages it as smallmouth water.'],
  ['east-fork-stones-river', 'Catalog is internally conflicted (trout/wild fishery flags, yearRound false, no stocking row); nothing agency-side supports wild trout.'],
  ['boone-lake', "TWRA's live trout page names its year-round reservoir program — Boone is NOT on it and has no lake stocking row."],
  ['melton-hill-lake', "TWRA's live trout page names its year-round reservoir program — Melton Hill is NOT on it and has no lake stocking row."],
  ['little-tennessee-river', 'TWRA program list entry "Tellico Upper (Rainbow)" plausibly IS the Chilhowee-tailwater Little Tennessee arm; TWRA never says so explicitly.'],
  ['ocoee-number-three-lake', 'Catalog claims TWRA calls this pool "Hiwassee Lake" (443 ac) — unverifiable; TVA says 360 ac.'],
  ['hurricane-creek', 'Kentucky-Lake drainage creek (Houston/Humphreys) per its own hydroIdentity, but carries a stale "upper Cumberland" region label; GNIS IDs also mismatch.'],
  ['standing-rock-creek', 'Kentucky-Lake drainage creek (Stewart Co.) per hydroIdentity, stale "upper Cumberland" region label.'],
  ['white-oak-creek', 'Kentucky-Lake drainage creek (Houston Co.) per hydroIdentity, stale "upper Cumberland" region label.'],
  ['harpeth-river', "TDEC's scenic-river designation excludes the Williamson County reach this entry covers — scenic-river fishery framing misattributes the reach."],
  ['new-river', 'Catalog frames it as a state scenic river; TDEC live scenic-rivers index (24 waters) does not list it.'],
  ['johnson-park-lake', 'Catalog says Memphis; sourced locality is W.C. Johnson Park, Collierville.'],
  ['paris-city-park-lake', 'Stocking segment unresolved: TWRA lists "Paris City Park", local news says Eiffel Tower Park pond, catalog maps Green Acres Lake.'],
  ['salt-lick-creek', 'Catalog seasonMonths (Dec/Jan/Feb) vs workbook March rows — internally inconsistent.'],
  ['calderwood-lake', 'TWRA live page lists Brook/Brown/Rainbow; the stocking dataset rows say Rainbow only.'],
];

const rows = [];

for (const rt of disagreements) {
  const rec = bySlug.get(rt.slug);
  const v = verdictOf(rec);
  rows.push({
    key: rt.slug,
    kind: 'disagreement',
    water: rt.slug,
    code: v.labelText,
    jev: LABELS[rt.jev?.choice] ?? 'abstained',
    jevConfidence: rt.jev?.choiceConfidence ?? null,
    jevNoul: rt.jev?.yearRoundSurvival ?? null,
    jevStrength: rt.jev?.evidenceStrength ?? null,
    researcher: rec ? `${rec.overallSurvivalRead.yearRoundSurvivalLikely} (${rec.overallSurvivalRead.confidence})` : '',
    summary: rec?.overallSurvivalRead?.oneLineWhy ?? '',
    conflicts: v.conflicts,
    options: [
      { value: rt.jev?.choice ?? 'research', label: `Jev: ${LABELS[rt.jev?.choice] ?? '—'}` },
      { value: v.label, label: `Code: ${v.labelText}` },
      ...Object.entries(LABELS).filter(([k]) => k !== rt.jev?.choice && k !== v.label).map(([k, t]) => ({ value: k, label: t })),
      { value: 'research', label: 'Send back for research' },
    ],
    prefill: rt.jev?.choice ?? 'research',
    facts: drawerFacts(rec),
    sources: (rec?.sourcesChecked ?? []).slice(0, 12),
  });
}

for (const [slug, detail] of conflicts) {
  const rec = bySlug.get(slug);
  const rt = ratingOf(slug);
  rows.push({
    key: 'conflict:' + slug,
    kind: 'conflict',
    water: slug,
    code: rec ? verdictOf(rec).labelText : '',
    jev: rt?.jev ? (LABELS[rt.jev.choice] ?? '—') : '',
    jevConfidence: rt?.jev?.choiceConfidence ?? null,
    researcher: rec ? `${rec.overallSurvivalRead.yearRoundSurvivalLikely} (${rec.overallSurvivalRead.confidence})` : '',
    summary: detail,
    conflicts: [detail],
    options: [
      { value: 'accept-evidence', label: 'Fix catalog to match evidence' },
      { value: 'keep-catalog', label: 'Keep catalog as-is' },
      { value: 'research', label: 'Send back for research' },
    ],
    prefill: 'accept-evidence',
    facts: drawerFacts(rec),
    sources: (rec?.sourcesChecked ?? []).slice(0, 12),
  });
}

rows.push({
  key: 'policy:year-round',
  kind: 'policy',
  water: 'POLICY — year-round rule precedence',
  code: 'classifier implements the NEW rule',
  jev: '',
  jevConfidence: null,
  researcher: '',
  summary: 'Confirm that continuous (12-month) stocking alone qualifies a water as Year Round - Trout Stream. This supersedes one sentence in the older 2026-09-17 category criteria ("a long stocking calendar is program evidence, not survival proof by itself"). The classifier and Jev prompts already follow the new rule.',
  conflicts: [],
  options: [
    { value: 'confirm-new', label: 'Confirm: continuous stocking = year-round' },
    { value: 'revert-old', label: 'Revert: calendar is program evidence only' },
  ],
  prefill: '',
  facts: [],
  sources: [],
});

const reference = {
  jevAgreed: jevAgreed.map((rt) => ({ slug: rt.slug, label: LABELS[rt.codeLabel] ?? rt.codeLabel })),
  codeAuto: autoAccepts.map(({ rec, v }) => ({ slug: rec.slug, label: v.labelText })),
};

const styleHtml = (() => {
  const legacy = readFileSync(join(root, 'docs', 'research', '2026-09-17-classification-diff', 'JEV-REVIEW.html'), 'utf8');
  const m = legacy.match(/<style>[\s\S]*?<\/style>/);
  return m ? m[0] : '<style>body{font-family:Georgia,serif;max-width:1100px;margin:20px auto;padding:0 14px}</style>';
})();

const DATA = { generatedAt: new Date().toISOString(), rows, reference };
const counts = {
  disagreements: disagreements.length,
  conflicts: conflicts.length,
  policy: 1,
  jevAgreed: reference.jevAgreed.length,
  codeAuto: reference.codeAuto.length,
};

const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Habitat Evidence — decision review</title>
${styleHtml}
<style>
 td .dim{color:var(--dim);font-size:12px}
 select.dec{max-width:240px}
 h2.ref{margin-top:34px;font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:560;font-size:20px}
 .kindpill{font-size:11px;border:1px solid var(--line);border-radius:9px;padding:1px 7px;margin-left:6px}
 .kind-disagreement{background:#fdeceb} .kind-conflict{background:#fdf6e3} .kind-policy{background:#eaf2fb}
 .refline{color:var(--dim);font-size:13px;margin-top:6px}
</style></head><body>
<header>
  <div class="masthead"><span class="rule">TROUT</span> <em>· habitat decision review</em></div>
  <div class="colophon"><b>${rows.length} decisions</b> · ${counts.disagreements} Jev-vs-code disagreements · ${counts.conflicts} catalog conflicts · 1 policy ruling ·
    ${counts.jevAgreed} Jev-agreed + ${counts.codeAuto} code-accepted need no action · generated ${DATA.generatedAt.slice(0, 10)}</div>
  <div class="bar">
    <input type="search" id="q" placeholder="filter item, note…" size="24">
    <select id="fkind">
      <option value="">all kinds</option>
      <option value="disagreement">Jev vs code</option>
      <option value="conflict">catalog conflicts</option>
      <option value="policy">policy ruling</option>
    </select>
    <select id="fdec">
      <option value="">all decisions</option>
      <option value="pending">still to decide</option>
      <option value="overridden">changed by you</option>
    </select>
    <button id="resetVisible">Reset visible to prefill</button>
    <span id="progress"><b>0</b>/${rows.length} changed · rest keep prefill</span>
    <button class="primary" id="export">Export decisions JSON</button>
    <button id="peek">Peek</button>
  </div>
</header>
<table id="t">
  <thead><tr>
    <th data-k="water">Item</th>
    <th data-k="kind">Kind</th>
    <th data-k="decision">Decision</th>
    <th data-k="code">Code says</th>
    <th data-k="jev">Jev says</th>
    <th data-k="researcher">Researcher</th>
    <th data-k="note">Note</th>
  </tr></thead>
  <tbody id="rows"></tbody>
</table>
<footer>
  Click an <i>item name</i> for the evidence drawer (facets, conflicts, sources checked). Disagreements are prefilled with Jev's pick —
  flip what you disagree with; conflicts are prefilled "fix catalog"; the policy ruling starts undecided. Decisions autosave in this
  browser under a stable key and survive regeneration. Export downloads <code>habitat-review-decisions.json</code> — hand it to a
  session or drop it into <code>packages/content/research/</code>.
</footer>
<h2 class="ref">Reference — already decided, no action needed</h2>
<div class="refline">Jev agreed with the code (${counts.jevAgreed}): ${reference.jevAgreed.map((r) => `${r.slug} → ${r.label}`).join(' · ')}</div>
<div class="refline">Code decided alone at high confidence (${counts.codeAuto}): ${reference.codeAuto.map((r) => `${r.slug} → ${r.label}`).join(' · ')}</div>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer">
  <button class="close" id="closeDrawerBtn">✕</button>
  <h2 id="dName">—</h2>
  <div class="sub2" id="dSub">—</div>
  <h3>Evidence facets</h3>
  <div id="dFacts"></div>
  <h3>Summary</h3>
  <div id="dSummary"></div>
  <h3>Conflicts</h3>
  <div id="dConflicts"></div>
  <h3>Sources checked</h3>
  <div id="dSources"></div>
</aside>
<dialog id="peekdlg"><h3 style="margin-top:0">Export preview</h3><pre id="peekpre"></pre>
<button onclick="document.getElementById('peekdlg').close()">Close</button></dialog>
<div class="toast" id="toast"></div>
<script>
const DATA = ${JSON.stringify(DATA)};
const LS_KEY = 'habitat-review-v1';
const saved = (JSON.parse(localStorage.getItem(LS_KEY) || '{}').rows) || {};
const state = {};
for (const r of DATA.rows) {
  const sv = saved[r.key];
  state[r.key] = { decision: sv && sv.decision !== undefined ? sv.decision : r.prefill, note: (sv && sv.note) || '', modified: !!(sv && sv.modified) };
}
let sortKey = '', sortDir = 1;
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function fmtRow(r) {
  const st = state[r.key];
  const opts = r.options.map(o => '<option value="' + esc(o.value) + '"' + (st.decision === o.value ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
  const conf = r.jevConfidence != null ? ' <span class="dim">(' + Number(r.jevConfidence).toFixed(2) + ')</span>' : '';
  return '<tr data-key="' + esc(r.key) + '">' +
    '<td><a href="#" class="wlink">' + esc(r.water) + '</a><span class="kindpill kind-' + r.kind + '">' + r.kind + '</span></td>' +
    '<td>' + r.kind + '</td>' +
    '<td><select class="dec" data-key="' + esc(r.key) + '">' + (r.prefill ? '' : '<option value="">— decide —</option>') + opts + '</select></td>' +
    '<td>' + esc(r.code) + '</td>' +
    '<td>' + esc(r.jev) + conf + '</td>' +
    '<td>' + esc(r.researcher) + '</td>' +
    '<td><input class="note" data-key="' + esc(r.key) + '" value="' + esc(st.note) + '" placeholder="note…" size="18"></td></tr>';
}
function visible(r) {
  const q = document.getElementById('q').value.toLowerCase();
  if (q && !(r.water + ' ' + r.summary + ' ' + (state[r.key].note || '')).toLowerCase().includes(q)) return false;
  const k = document.getElementById('fkind').value;
  if (k && r.kind !== k) return false;
  const d = document.getElementById('fdec').value;
  const decided = r.prefill ? state[r.key].modified : !!state[r.key].decision;
  if (d === 'pending' && decided) return false;
  if (d === 'overridden' && !state[r.key].modified) return false;
  return true;
}
function render() {
  let list = DATA.rows.filter(visible);
  if (sortKey) list = list.slice().sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * sortDir);
  document.getElementById('rows').innerHTML = list.map(fmtRow).join('');
  updateProgress();
  bind();
}
function updateProgress() {
  const changed = DATA.rows.filter(r => state[r.key].modified).length;
  document.getElementById('progress').innerHTML = '<b>' + changed + '</b>/' + DATA.rows.length + ' changed · rest keep prefill';
}
function persist() { localStorage.setItem(LS_KEY, JSON.stringify({ rows: state })); }
function bind() {
  const tb = document.getElementById('rows');
  tb.querySelectorAll('select.dec').forEach(sel => sel.onchange = () => {
    const k = sel.dataset.key; state[k].decision = sel.value; state[k].modified = true; persist(); render();
  });
  tb.querySelectorAll('input.note').forEach(inp => inp.oninput = () => {
    const k = inp.dataset.key; state[k].note = inp.value; state[k].modified = true; persist(); updateProgress();
  });
  tb.querySelectorAll('a.wlink').forEach(a => a.onclick = (e) => { e.preventDefault(); openDrawer(a.closest('tr').dataset.key); });
}
function openDrawer(key) {
  const r = DATA.rows.find(x => x.key === key); if (!r) return;
  document.getElementById('dName').textContent = r.water;
  document.getElementById('dSub').textContent = r.kind + (r.researcher ? ' · researcher read: ' + r.researcher : '');
  document.getElementById('dFacts').innerHTML = (r.facts || []).map(f => '<div>· ' + esc(f) + '</div>').join('') || '<div class="dim">n/a</div>';
  document.getElementById('dSummary').innerHTML = '<div>' + esc(r.summary) + '</div>' +
    (r.jevNoul != null ? '<div class="dim">Jev year-round truth: ' + Number(r.jevNoul).toFixed(2) + ' · evidence strength: ' + (r.jevStrength != null ? Number(r.jevStrength).toFixed(2) : 'n/a') + '</div>' : '');
  document.getElementById('dConflicts').innerHTML = (r.conflicts || []).map(c => '<div>⚠ ' + esc(c) + '</div>').join('') || '<div class="dim">none</div>';
  document.getElementById('dSources').innerHTML = (r.sources || []).map(s => '<div><a href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(String(s).replace(/^https?:\\/\\//, '').slice(0, 72)) + '</a></div>').join('') || '<div class="dim">none</div>';
  document.getElementById('drawer').classList.add('open');
  document.getElementById('scrim').classList.add('on');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('scrim').classList.remove('on');
}
function buildExport() {
  return {
    generatedAt: DATA.generatedAt,
    decisions: DATA.rows.map(r => ({ key: r.key, kind: r.kind, decision: state[r.key].decision || null, note: state[r.key].note || null })),
  };
}
document.getElementById('closeDrawerBtn').onclick = closeDrawer;
document.getElementById('scrim').onclick = closeDrawer;
document.getElementById('q').oninput = render;
document.getElementById('fkind').onchange = render;
document.getElementById('fdec').onchange = render;
document.getElementById('resetVisible').onclick = () => {
  DATA.rows.filter(visible).forEach(r => { state[r.key].decision = r.prefill; state[r.key].note = ''; state[r.key].modified = false; });
  persist(); render(); toast('visible rows reset');
};
document.getElementById('export').onclick = () => {
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'habitat-review-decisions.json'; a.click();
  toast('exported');
};
document.getElementById('peek').onclick = () => {
  document.getElementById('peekpre').textContent = JSON.stringify(buildExport(), null, 2).slice(0, 4000);
  document.getElementById('peekdlg').showModal();
};
document.querySelectorAll('#t th').forEach(th => th.onclick = () => {
  const k = th.dataset.k; if (!k) return;
  sortDir = sortKey === k ? -sortDir : 1; sortKey = k; render();
});
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 1600); }
render();
</script>
</body></html>`;

const out = join(here, 'HABITAT-REVIEW.html');
writeFileSync(out, html);
console.log(`wrote ${out}`);
console.log(`decision rows: ${rows.length} (${counts.disagreements} disagreements, ${counts.conflicts} conflicts, 1 policy)`);
console.log(`reference: ${counts.jevAgreed} jev-agreed, ${counts.codeAuto} code-auto`);
