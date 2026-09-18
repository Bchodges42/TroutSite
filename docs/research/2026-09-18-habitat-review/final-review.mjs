#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * FINAL decision review: all 190 waters, overrideable (select per row,
 * autosave, export), full Fishbrain species lists with catch counts in the
 * drawer, facet-3 Jev pass applied. Legacy JEV-REVIEW format.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from '../../../packages/content/scripts/classification/code-classify.mjs';
import { loadExtracted, buildEnrichedInput } from '../../../packages/content/scripts/classification/habitat-input.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const LABELS = {
  'trout-stream-year-round': 'Year Round - Trout Stream',
  'warmwater-yearly-stocked-winter-trout': 'Warm Water - Seasonal/Winter Stocking',
  'warmwater-no-trout': 'Warm Water - No Trout',
};

const batches = [1, 2, 3, 4, 5, 6].flatMap((i) => read(`packages/content/research/habitat-survival/batch${i}.json`));
const bySlug = new Map(batches.map((r) => [r.slug, r]));
const composite = read('packages/content/research/CLASSIFICATION-COMPOSITE-2026-09-17.json');
const { fishbrainBySlug, troutNames } = loadExtracted();
const ratings = read('docs/research/2026-09-18-habitat-review/jev-ratings.json').results;
const ratingOf = (slug) => ratings.find((r) => r.slug === slug) ?? null;
const labels = read('packages/content/research/habitat-survival/habitat-review-labels.json').labels;
const decisions = read('packages/content/research/habitat-survival/review-decisions-2026-09-18.json').decisions;
const tickets = decisions.filter((d) => d.decision === 'research');

function verdictOf(rec) {
  const input = buildEnrichedInput(rec, composite, fishbrainBySlug, troutNames);
  return { input, v: classify(input) };
}

const rows = batches.map((rec) => {
  const { input, v } = verdictOf(rec);
  const rt = ratingOf(rec.slug);
  const fb = input.fishbrain;
  const ownerLabel = labels[rec.slug] ?? null;
  let final, decidedBy, confidence, kind;
  if (ownerLabel) {
    final = ownerLabel; decidedBy = 'owner ruling'; confidence = rt?.jev?.choiceConfidence ?? null;
    kind = 'owner-ruled';
  } else if (rt && rt.resolution?.resolution === 'accept') {
    final = rt.codeLabel; decidedBy = 'code + Jev agree'; confidence = rt.jev?.choiceConfidence ?? null;
    kind = 'agreed';
  } else if (rt && rt.resolution?.resolution === 'owner-box') {
    final = v.label; decidedBy = 'code (Jev disagreed/abstained)'; confidence = v.confidence;
    kind = 'escalation';
  } else if (v.confidenceGate === 'high') {
    final = v.label; decidedBy = 'code alone'; confidence = v.confidence;
    kind = 'agreed';
  } else {
    final = v.label; decidedBy = 'code (low confidence)'; confidence = v.confidence;
    kind = 'escalation';
  }
  return { rec, input, v, rt, fb, final, decidedBy, confidence, kind };
});

const escalations = rows.filter((r) => r.kind === 'escalation' || (r.kind === 'owner-ruled' && r.rt && r.rt.resolution?.resolution === 'owner-box'));
const newBoxes = escalations.filter((r) => !r.ownerLabelFinal);
const stableCount = rows.length - escalations.length;

const styleHtml = (() => {
  const legacy = readFileSync(join(root, 'docs', 'research', '2026-09-17-classification-diff', 'JEV-REVIEW.html'), 'utf8');
  const m = legacy.match(/<style>[\s\S]*?<\/style>/);
  return m ? m[0] : '<style>body{font-family:Georgia,serif}</style>';
})();

const DATA = {
  generatedAt: new Date().toISOString(),
  rows: rows.map((r) => ({
    water: r.rec.slug,
    decision: r.final,
    decidedBy: r.decidedBy,
    kind: r.kind,
    confidence: r.confidence,
    jevChoice: r.rt?.jev?.choice ?? null,
    jevConfidence: r.rt?.jev?.choiceConfidence ?? null,
    researcher: `${r.rec.overallSurvivalRead.yearRoundSurvivalLikely} (${r.rec.overallSurvivalRead.confidence})`,
    summary: r.rec.overallSurvivalRead.oneLineWhy,
    conflicts: r.v.conflicts,
    fishbrain: {
      matchStatus: r.fb.matchStatus,
      loggedCatches: r.fb.loggedCatches,
      pageUrl: r.fb.pageUrl,
      troutCatches: r.fb.troutCatches,
      topSpecies: r.fb.topSpecies,
      allSpecies: (fishbrainBySlug.get(r.rec.slug)?.species ?? []).map((s) => ({ name: s.displayName, catches: s.catchesCount ?? 0 })),
    },
    facts: (function () {
      const f = r.v.facets;
      const out = [
        `stocking months: ${f.stockingMonths.length ? f.stockingMonths.join(', ') : 'none resolved'}`,
        `program signals: ${f.feedPrograms.length ? f.feedPrograms.join(', ') : 'none'}`,
        `wild: ${f.wild} · holdover: ${f.holdover} · cold release: ${f.coldRelease}`,
      ];
      for (const t of r.rec.summerTemperature ?? []) out.push(`summer temp: ${t.celsius}°C m${t.monthObserved}/${t.year} (${t.sourceType})`);
      return out;
    })(),
    sources: (r.rec.sourcesChecked ?? []).slice(0, 14),
  })),
  tickets,
};

const counts = {
  total: rows.length,
  escalations: rows.filter((r) => r.kind === 'escalation').length,
  ownerRuled: rows.filter((r) => r.kind === 'owner-ruled').length,
  agreed: rows.filter((r) => r.kind === 'agreed').length,
};
const dist = {};
for (const r of rows) dist[r.final] = (dist[r.final] ?? 0) + 1;

const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Final decision review — ${counts.total} waters, all evidenced</title>
${styleHtml}
<style>
 td .dim{color:var(--dim);font-size:12px}
 select.dec{max-width:240px}
 tr.kind-escalation{background:#fff7f5} tr.kind-owner-ruled{background:#f4f9f1}
 h2.ref{margin-top:30px;font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:560;font-size:20px}
 .refline{color:var(--dim);font-size:13px;margin-top:6px}
 .trout{color:#1f4e79;font-weight:bold}
 .banner{background:#efe9db;border-left:4px solid #8b6f47;padding:10px 14px;margin:14px 0}
</style></head><body>
<header>
  <div class="masthead"><span class="rule">TROUT</span> <em>· final decision review — all ${counts.total} waters evidenced</em></div>
  <div class="colophon"><b>${dist['trout-stream-year-round'] ?? 0} Year Round</b> · <b>${dist['warmwater-yearly-stocked-winter-trout'] ?? 0} Seasonal/Winter</b> · <b>${dist['warmwater-no-trout'] ?? 0} No Trout</b> ·
    ${counts.agreed} code/Jev agreed · ${counts.escalations} escalations (override or confirm) · ${counts.ownerRuled} already yours · facet-3 Jev pass ${DATA.generatedAt.slice(0, 10)}</div>
  <div class="bar">
    <input type="search" id="q" placeholder="filter water, species, note…" size="26">
    <select id="fdec">
      <option value="">all categories</option>
      <option value="trout-stream-year-round">Year Round - Trout Stream</option>
      <option value="warmwater-yearly-stocked-winter-trout">Warm Water - Seasonal/Winter Stocking</option>
      <option value="warmwater-no-trout">Warm Water - No Trout</option>
    </select>
    <select id="fkind">
      <option value="">all rows</option>
      <option value="escalation">escalations</option>
      <option value="agreed">agreed</option>
      <option value="owner-ruled">your rulings</option>
    </select>
    <select id="fov">
      <option value="">any override state</option>
      <option value="pending">not overridden</option>
      <option value="overridden">overridden by you</option>
    </select>
    <button id="resetVisible">Reset visible to system decision</button>
    <span id="progress"><b>0</b>/${counts.total} overridden</span>
    <button class="primary" id="export">Export decisions JSON</button>
    <button id="peek">Peek</button>
  </div>
</header>
<div class="banner">
  Every row is <b>overrideable</b>: the select shows the system's final decision — flip anything you disagree with.
  Click a water for full evidence: <b>complete Fishbrain species list with catch counts</b> (trout highlighted), stocking months, program
  signals, temperatures, sources. Changes autosave; Export downloads <code>habitat-final-decisions.json</code> — hand it back and the
  labels move. New owner-boxes this pass: <b>center-hill-lake</b>, <b>watauga-lake</b>.
</div>
<table id="t">
  <thead><tr>
    <th data-k="water">Water</th>
    <th data-k="decision">Decision (override)</th>
    <th data-k="decidedBy">Decided by</th>
    <th data-k="confidence">Confidence</th>
    <th data-k="researcher">Researcher</th>
    <th data-k="note">Note</th>
  </tr></thead>
  <tbody id="rows"></tbody>
</table>
<h2 class="ref">Research tickets — in progress (${DATA.tickets.length})</h2>
<div class="refline">${DATA.tickets.map((t) => `<b>${t.key.replace('conflict:', '')}</b> — ${t.note ?? ''}`).join('</div><div class="refline">')}</div>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer">
  <button class="close" id="closeDrawerBtn">✕</button>
  <h2 id="dName">—</h2>
  <div class="sub2" id="dSub">—</div>
  <h3>Fishbrain species · catch counts (all)</h3>
  <div id="dSpecies"></div>
  <h3>Evidence facets</h3>
  <div id="dFacts"></div>
  <h3>Researcher summary</h3>
  <div id="dSummary"></div>
  <h3>Classifier conflicts</h3>
  <div id="dConflicts"></div>
  <h3>Sources checked</h3>
  <div id="dSources"></div>
</aside>
<dialog id="peekdlg"><h3 style="margin-top:0">Export preview</h3><pre id="peekpre"></pre>
<button onclick="document.getElementById('peekdlg').close()">Close</button></dialog>
<div class="toast" id="toast"></div>
<script>
const DATA = ${JSON.stringify(DATA)};
const LS_KEY = 'habitat-final-review-v1';
const saved = (JSON.parse(localStorage.getItem(LS_KEY) || '{}').rows) || {};
const state = {};
for (const r of DATA.rows) {
  const sv = saved[r.water];
  state[r.water] = { decision: sv && sv.decision !== undefined ? sv.decision : r.decision, note: (sv && sv.note) || '', modified: !!(sv && sv.modified) };
}
const CANON = { 'trout-stream-year-round': 1, 'warmwater-yearly-stocked-winter-trout': 1, 'warmwater-no-trout': 1 };
let sortKey = '', sortDir = 1;
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function fmtRow(r) {
  const st = state[r.water];
  const opts = ['trout-stream-year-round', 'warmwater-yearly-stocked-winter-trout', 'warmwater-no-trout']
    .map(k => '<option value="' + k + '"' + (st.decision === k ? ' selected' : '') + '>' + esc(k === r.decision ? r.decision : k) + '</option>').join('');
  return '<tr class="kind-' + r.kind + '" data-key="' + esc(r.water) + '">' +
    '<td><a href="#" class="wlink">' + esc(r.water) + '</a></td>' +
    '<td><select class="dec" data-key="' + esc(r.water) + '">' + opts + '</select>' + (st.modified ? ' <span class="dim">overridden</span>' : '') + '</td>' +
    '<td>' + esc(r.decidedBy) + '</td>' +
    '<td>' + (r.confidence != null ? Number(r.confidence).toFixed(2) : '—') + '</td>' +
    '<td>' + esc(r.researcher) + '</td>' +
    '<td><input class="note" data-key="' + esc(r.water) + '" value="' + esc(st.note) + '" placeholder="note…" size="18"></td></tr>';
}
function visible(r) {
  const q = document.getElementById('q').value.toLowerCase();
  if (q && !(r.water + ' ' + r.summary + ' ' + (state[r.water].note || '') + ' ' + (r.fishbrain.topSpecies || []).join(' ')).toLowerCase().includes(q)) return false;
  const d = document.getElementById('fdec').value;
  if (d && state[r.water].decision !== d) return false;
  const k = document.getElementById('fkind').value;
  if (k && r.kind !== k) return false;
  const o = document.getElementById('fov').value;
  if (o === 'overridden' && !state[r.water].modified) return false;
  if (o === 'pending' && state[r.water].modified) return false;
  return true;
}
function render() {
  let list = DATA.rows.filter(visible);
  if (sortKey) list = list.slice().sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * sortDir);
  document.getElementById('rows').innerHTML = list.map(fmtRow).join('');
  updateProgress(); bind();
}
function updateProgress() {
  const n = DATA.rows.filter(r => state[r.water].modified).length;
  document.getElementById('progress').innerHTML = '<b>' + n + '</b>/' + DATA.rows.length + ' overridden';
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
  const r = DATA.rows.find(x => x.water === key); if (!r) return;
  document.getElementById('dName').textContent = r.water;
  document.getElementById('dSub').textContent = r.decision + ' · decided by ' + r.decidedBy + (r.jevChoice ? ' · fresh Jev: ' + r.jevChoice + ' (' + (r.jevConfidence != null ? Number(r.jevConfidence).toFixed(2) : '?') + ')' : '');
  const sp = r.fishbrain.allSpecies || [];
  const troutSet = {}; (r.fishbrain.troutCatches || []).forEach(t => troutSet[t.name] = 1);
  document.getElementById('dSpecies').innerHTML = (r.fishbrain.matchStatus === 'no-record' || !sp.length)
    ? '<div class="dim">No Fishbrain record for this water (absence is not negative evidence).</div>'
    : '<div class="dim">' + (r.fishbrain.loggedCatches ?? '?') + ' logged catches total · <a href="' + esc(r.fishbrain.pageUrl || '#') + '" target="_blank" rel="noopener">Fishbrain page ↗</a></div>' +
      sp.map(s => '<div class="' + (troutSet[s.name] ? 'trout' : '') + '">· ' + esc(s.name) + ' — ' + s.catches + ' catches' + (troutSet[s.name] ? ' ◆' : '') + '</div>').join('');
  document.getElementById('dFacts').innerHTML = (r.facts || []).map(f => '<div>· ' + esc(f) + '</div>').join('');
  document.getElementById('dSummary').innerHTML = '<div>' + esc(r.summary) + '</div>';
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
  return { generatedAt: DATA.generatedAt, decisions: DATA.rows.map(r => ({ key: r.water, kind: r.kind, decision: state[r.water].decision, note: state[r.water].note || null })) };
}
document.getElementById('closeDrawerBtn').onclick = closeDrawer;
document.getElementById('scrim').onclick = closeDrawer;
document.getElementById('q').oninput = render;
document.getElementById('fdec').onchange = render;
document.getElementById('fkind').onchange = render;
document.getElementById('fov').onchange = render;
document.getElementById('resetVisible').onclick = () => {
  DATA.rows.filter(visible).forEach(r => { state[r.water].decision = r.decision; state[r.water].note = ''; state[r.water].modified = false; });
  persist(); render(); toast('visible rows reset');
};
document.getElementById('export').onclick = () => {
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'habitat-final-decisions.json'; a.click(); toast('exported');
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
console.log(`rows: ${counts.total} (agreed ${counts.agreed}, escalations ${counts.escalations}, owner-ruled ${counts.ownerRuled})`);
for (const [k, n] of Object.entries(dist)) console.log(`  ${LABELS[k] ?? k}: ${n}`);
