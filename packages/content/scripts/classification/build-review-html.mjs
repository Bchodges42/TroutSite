#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Build the self-contained Jev decision-review page.
 *
 *   node packages/content/scripts/classification/build-review-html.mjs
 *
 * Reads the latest eval JSON (docs/research/2026-09-17-classification-diff/
 * jev-classification-eval.json), enriches each row with dry-run evidence
 * facts (tier, match status, ledger, stocking events, fishbrain trout
 * species), and writes JEV-REVIEW.html next to it: a sortable, filterable
 * table with a per-water review form. Export produces a
 * trout.jev-tn-review-labels.v1 JSON ready to drop into
 * packages/content/research/jev-tn-review-labels.json.
 * No data leaves the machine; nothing is auto-submitted anywhere.
 *
 * NOTE: the browser-side script intentionally avoids template literals so
 * this whole page can live inside one Node template literal.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIFF_OUT_DIR } from './lib.mjs';
import { evidenceState, CATEGORY_LABELS, reviewedCategory } from './jev-classify.mjs';

const evalPath = join(DIFF_OUT_DIR, 'jev-classification-eval.json');
const evalDoc = JSON.parse(readFileSync(evalPath, 'utf8'));

const evidence = {};
for (const r of evalDoc.results) {
  if (r.error) continue;
  const s = evidenceState(r.slug, { month: evalDoc.month.number });
  const fb = s.evidence.fishbrainDiscovery;
  evidence[r.slug] = {
    tier: fb.tier,
    matchStatus: fb.matchStatus ?? 'no-record',
    waterName: s.water.name,
    waterbodyType: s.water.waterbodyType,
    ledger: s.evidence.auditedLedger.available,
    stockingEvents: s.evidence.twraStocking.matchedEvents.length,
    stockingPrograms: [...new Set(s.evidence.twraStocking.matchedEvents.map((e) => e.program))],
    fishbrainTrout: fb.freshwaterTrout?.map((x) => x.name) ?? [],
    catalogSpecies: s.evidence.catalog.species ?? null,
    notes: String(s.evidence.catalog.notes ?? '').slice(0, 400),
  };
}

const existingLabels = {};
for (const r of evalDoc.results) {
  const reviewed = reviewedCategory(r.slug);
  if (reviewed) existingLabels[r.slug] = reviewed;
}

const payload = JSON.stringify({
  generated: evalDoc.generated,
  month: evalDoc.month,
  model: evalDoc.model,
  labels: CATEGORY_LABELS,
  existingLabels,
  evidence,
  results: evalDoc.results,
}).replace(/</g, '\\u003c');

const css = `
  :root { --bg:#10151c; --panel:#161d26; --ink:#dbe4ee; --dim:#8496ab; --line:#24303f;
          --trout:#3fa9f5; --winter:#e0a93e; --warm:#c47f5a; --ok:#57b26a; --flag:#e06c5a; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.45 "Segoe UI", system-ui, sans-serif; }
  header { padding:14px 20px; border-bottom:1px solid var(--line); position:sticky; top:0;
           background:var(--panel); z-index:5; }
  h1 { margin:0 0 4px; font-size:18px; }
  .sub { color:var(--dim); font-size:12px; font-weight:400; }
  .bar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:10px; }
  input[type=search], select { background:#0c1117; color:var(--ink); border:1px solid var(--line);
         border-radius:6px; padding:6px 9px; font-size:13px; }
  label.chk { color:var(--dim); font-size:12.5px; display:flex; gap:5px; align-items:center; }
  button { background:#22303f; color:var(--ink); border:1px solid #31435a; border-radius:6px;
           padding:6px 12px; font-size:13px; cursor:pointer; }
  button:hover { background:#2c3e52; }
  button.primary { background:#2b5278; border-color:#3c6f9e; }
  button:disabled { opacity:.4; cursor:default; }
  #progress { margin-left:auto; font-size:13px; color:var(--dim); }
  #progress b { color:var(--ink); font-size:15px; }
  table { border-collapse:collapse; width:100%; }
  th { position:sticky; top:122px; background:var(--panel); text-align:left; font-size:11.5px;
       color:var(--dim); text-transform:uppercase; letter-spacing:.04em; padding:8px 10px;
       border-bottom:1px solid var(--line); cursor:pointer; user-select:none; white-space:nowrap; z-index:4; }
  th:hover { color:var(--ink); }
  td { padding:7px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
  tr:hover td { background:#141b24; }
  .slug { font-weight:600; }
  .meta { color:var(--dim); font-size:11.5px; margin-top:2px; }
  .pill { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11.5px; border:1px solid; white-space:nowrap; }
  .trout-stream-year-round { color:var(--trout); border-color:var(--trout); }
  .warmwater-yearly-stocked-winter-trout { color:var(--winter); border-color:var(--winter); }
  .warmwater-no-trout { color:var(--warm); border-color:var(--warm); }
  .undecided { color:var(--dim); border-color:var(--line); }
  .confbar { width:60px; height:6px; background:#0c1117; border-radius:3px; display:inline-block;
             vertical-align:middle; margin-right:6px; }
  .confbar i { display:block; height:100%; border-radius:3px; background:var(--ok); }
  .lowconf .confbar i { background:var(--flag); }
  .badge { font-size:10.5px; color:var(--dim); border:1px solid var(--line); border-radius:4px;
           padding:1px 5px; margin-right:4px; white-space:nowrap; }
  .badge.flag { color:var(--flag); border-color:var(--flag); }
  .badge.override { color:var(--winter); border-color:var(--winter); }
  .seg { display:inline-flex; border:1px solid var(--line); border-radius:6px; overflow:hidden; }
  .seg button { border:0; border-radius:0; background:transparent; padding:4px 7px; font-size:11px; }
  .seg button.on-t { background:#173a54; color:var(--trout); }
  .seg button.on-w { background:#443614; color:var(--winter); }
  .seg button.on-n { background:#40251c; color:var(--warm); }
  .seg button:hover { background:#22303f; }
  .note { width:150px; background:#0c1117; border:1px solid var(--line); border-radius:5px;
          color:var(--ink); font-size:12px; padding:4px 6px; }
  tr.decided td { background:rgba(87,178,106,.05); }
  footer { padding:16px 20px; color:var(--dim); font-size:12px; }
  dialog { background:var(--panel); color:var(--ink); border:1px solid var(--line);
           border-radius:10px; max-width:760px; width:92%; }
  dialog::backdrop { background:rgba(0,0,0,.6); }
  pre { white-space:pre-wrap; font-size:11.5px; background:#0c1117; padding:10px;
        border-radius:8px; max-height:50vh; overflow:auto; }
  .toast { position:fixed; bottom:18px; right:18px; background:#22303f; border:1px solid #31435a;
           padding:10px 16px; border-radius:8px; display:none; z-index:9; }
`;

const pageJs = `
var CATS = ['trout-stream-year-round','warmwater-yearly-stocked-winter-trout','warmwater-no-trout'];
var SHORT = { 'trout-stream-year-round':'Trout yr', 'warmwater-yearly-stocked-winter-trout':'Winter-stocked', 'warmwater-no-trout':'Warmwater' };
var LS_KEY = 'jev-review-' + DATA.generated;
var decisions = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
for (var slug0 in DATA.existingLabels) {
  if (!(slug0 in decisions)) decisions[slug0] = { category: DATA.existingLabels[slug0], note: '' };
}
var sortKey = 'confidence', sortDir = -1;

function el(id) { return document.getElementById(id); }
function save() { localStorage.setItem(LS_KEY, JSON.stringify(decisions)); }
function toast(msg) {
  var t = el('toast'); t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 2200);
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

function rows() {
  var q = el('q').value.toLowerCase();
  var fc = el('fcat').value, ft = el('ftier').value;
  return DATA.results.filter(function (r) {
    if (r.error) return false;
    var ev = DATA.evidence[r.slug] || {};
    var d = decisions[r.slug];
    if (fc === '__undecided' && d && d.category) return false;
    if (fc && fc !== '__undecided' && (!d || d.category !== fc)) return false;
    if (ft && ev.tier !== ft) return false;
    if (el('flow').checked && r.confidence >= 0.6) return false;
    if (el('fflag').checked && !(r.consistencyFlags || []).length) return false;
    if (el('fnotfound').checked && ev.matchStatus !== 'not-found') return false;
    if (q) {
      var hay = [r.slug, ev.waterName, ev.notes].concat(ev.fishbrainTrout || []).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function render() {
  var list = rows().slice().sort(function (a, b) {
    var eva = DATA.evidence[a.slug] || {}, evb = DATA.evidence[b.slug] || {};
    var va, vb;
    if (sortKey === 'reviewed') { va = (decisions[a.slug] || {}).category || ''; vb = (decisions[b.slug] || {}).category || ''; }
    else if (sortKey === 'tier') { va = eva.tier + eva.matchStatus; vb = evb.tier + evb.matchStatus; }
    else if (sortKey === 'note') { va = (decisions[a.slug] || {}).note || ''; vb = (decisions[b.slug] || {}).note || ''; }
    else { va = a[sortKey]; vb = b[sortKey]; }
    return ((va < vb) ? -1 : (va > vb) ? 1 : 0) * sortDir;
  });
  var html = list.map(function (r) {
    var ev = DATA.evidence[r.slug] || {};
    var d = decisions[r.slug];
    var decided = d && d.category;
    var flags = (r.consistencyFlags || []).map(function () { return '<span class="badge flag">flag</span>'; }).join('');
    var badges = [
      '<span class="badge">' + esc(ev.tier || '?') + '</span>',
      (ev.matchStatus && ev.matchStatus !== 'candidate') ? '<span class="badge">' + esc(ev.matchStatus) + '</span>' : '',
      r.overrideApplied ? '<span class="badge override">reviewed override</span>' : '',
      (r.reviewedLabelAvailable && !r.overrideApplied) ? '<span class="badge">reviewed</span>' : '',
      flags,
    ].join('');
    var metaParts = [ev.waterName, ev.waterbodyType,
      ev.ledger ? 'ledger OK' : 'no ledger',
      ev.stockingEvents ? ev.stockingEvents + ' stocking evt (' + (ev.stockingPrograms || []).join('/') + ')' : 'no stocking evt',
      (ev.fishbrainTrout || []).length ? 'FB trout: ' + ev.fishbrainTrout.join(', ') : 'no FB trout',
      ev.catalogSpecies ? 'catalog: ' + ev.catalogSpecies : 'catalog species unset'];
    var seg = CATS.map(function (c) {
      var on = decided === c ? (c === 'trout-stream-year-round' ? 'on-t' : (c === 'warmwater-yearly-stocked-winter-trout' ? 'on-w' : 'on-n')) : '';
      return '<button class="' + on + '" title="' + esc(DATA.labels[c]) + '" onclick="setCat(\\'' + r.slug + '\\',\\'' + c + '\\')">' + SHORT[c] + '</button>';
    }).join('');
    var noteVal = esc((d || {}).note || '');
    return '<tr class="' + (decided ? 'decided ' : '') + (r.confidence < 0.6 ? 'lowconf' : '') + '">' +
      '<td><span class="slug">' + esc(r.slug) + '</span><div class="meta">' + esc(metaParts.join(' \\u00b7 ')) + '</div><div>' + badges + '</div></td>' +
      '<td class="cat"><div class="seg">' + seg + '</div>' +
        '<button style="margin-top:4px;font-size:11px" onclick="clearOne(\\'' + r.slug + '\\')">clear</button></td>' +
      '<td class="cat"><span class="pill ' + (r.rawChoice || 'undecided') + '">' + (SHORT[r.rawChoice] || '\\u2014') + '</span></td>' +
      '<td><span class="confbar"><i style="width:' + Math.round((r.confidence || 0) * 100) + '%"></i></span>' + (r.confidence == null ? '' : r.confidence.toFixed(2)) + '</td>' +
      '<td>' + esc(ev.tier || '') + '</td>' +
      '<td>' + (r.monthsTrue == null ? '' : r.monthsTrue) + '/12</td>' +
      '<td><input class="note" value="' + noteVal + '" onchange="setNote(\\'' + r.slug + '\\', this.value)" placeholder="note\\u2026"></td>' +
      '</tr>';
  }).join('');
  el('rows').innerHTML = html;
  var total = DATA.results.filter(function (r) { return !r.error; }).length;
  var decided = 0;
  for (var k in decisions) if (decisions[k].category) decided += 1;
  el('progress').innerHTML = '<b>' + decided + '</b>/' + total + ' decided';
  el('export').disabled = decided === 0;
}

window.setCat = function (slug, cat) {
  decisions[slug] = Object.assign(decisions[slug] || {}, { category: cat, note: (decisions[slug] || {}).note || '' });
  save(); render();
};
window.clearOne = function (slug) { delete decisions[slug]; save(); render(); };
window.setNote = function (slug, note) {
  var d = Object.assign(decisions[slug] || {}, { note: note });
  if (d.category) decisions[slug] = d; else delete decisions[slug];
  save(); render();
};

function buildExport() {
  var labels = {};
  for (var slug in decisions) {
    var d = decisions[slug];
    if (!d.category) continue;
    labels[slug] = { category: d.category };
    if (d.note) labels[slug].note = d.note;
    labels[slug].reviewedAt = new Date().toISOString().slice(0, 10);
  }
  return {
    schema: 'trout.jev-tn-review-labels.v1',
    stateId: 'TN',
    source: 'owner review of Jev raw classifications (JEV-REVIEW.html, eval ' + DATA.generated + ')',
    interpretation: 'Reviewed segment labels for classifier calibration/override. warm water(no trout) means not a trout-stream fishery; it does not claim every trout species is absent.',
    labels: labels,
  };
}
window.buildExport = buildExport;

el('export').onclick = function () {
  var blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jev-tn-review-labels.json';
  a.click();
  toast('Downloaded jev-tn-review-labels.json');
};
el('peek').onclick = function () {
  el('peekpre').textContent = JSON.stringify(buildExport(), null, 2);
  el('peekdlg').showModal();
};
el('acceptHi').onclick = function () {
  var n = 0;
  rows().forEach(function (r) {
    if (r.confidence >= 0.8 && !r.reviewedLabelAvailable && !(decisions[r.slug] || {}).category) {
      decisions[r.slug] = { category: r.rawChoice, note: '' };
      n += 1;
    }
  });
  save(); render();
  toast(n ? 'Accepted ' + n + ' high-confidence Jev calls' : 'Nothing eligible visible');
};
el('clearVisible').onclick = function () {
  rows().forEach(function (r) { delete decisions[r.slug]; });
  save(); render(); toast('Cleared visible decisions');
};
Array.prototype.forEach.call(document.querySelectorAll('th'), function (th) {
  th.addEventListener('click', function () {
    var k = th.getAttribute('data-k');
    sortDir = (sortKey === k) ? -sortDir : 1;
    sortKey = k;
    render();
  });
});
['q', 'fcat', 'ftier', 'flow', 'fflag', 'fnotfound'].forEach(function (id) {
  el(id).addEventListener('input', render);
});
render();
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jev classification review — ${evalDoc.results.length} Tennessee waters</title>
<style>${css}</style>
</head>
<body>
<header>
  <h1>Jev classification review <span class="sub">${evalDoc.results.length} waters · ${evalDoc.model} · month ${evalDoc.month.name} · eval ${evalDoc.generated}</span></h1>
  <div class="sub">Raw model answers — no owner labels were in the state. Your decision overrides Jev; the 8 pre-existing reviewed labels are pre-filled and win on export unless you change them.</div>
  <div class="bar">
    <input type="search" id="q" placeholder="filter slug / species / notes…" size="26">
    <select id="fcat">
      <option value="">all categories</option>
      <option value="trout-stream-year-round">Trout Stream - year round</option>
      <option value="warmwater-yearly-stocked-winter-trout">Warm water - Yearly stocked winter trout</option>
      <option value="warmwater-no-trout">warm water(no trout)</option>
      <option value="__undecided">— undecided —</option>
    </select>
    <select id="ftier">
      <option value="">all tiers</option>
      <option value="featured">featured</option>
      <option value="standard">standard</option>
    </select>
    <label class="chk"><input type="checkbox" id="flow"> confidence &lt; 0.6</label>
    <label class="chk"><input type="checkbox" id="fflag"> consistency flags</label>
    <label class="chk"><input type="checkbox" id="fnotfound"> Fishbrain not-found</label>
    <button id="acceptHi">Accept Jev: high-confidence visible</button>
    <button id="clearVisible">Clear visible</button>
    <span id="progress"><b>0</b>/0 decided</span>
    <button class="primary" id="export" disabled>Export review JSON</button>
    <button id="peek">Peek export</button>
  </div>
</header>
<table id="t">
  <thead><tr>
    <th data-k="slug">Water</th>
    <th data-k="reviewed">Review decision</th>
    <th data-k="rawChoice">Jev raw</th>
    <th data-k="confidence">Conf</th>
    <th data-k="tier">Evidence</th>
    <th data-k="monthsTrue">Trout mo.</th>
    <th data-k="note">Note</th>
  </tr></thead>
  <tbody id="rows"></tbody>
</table>
<footer>
  Export downloads <code>jev-tn-review-labels.json</code> (schema trout.jev-tn-review-labels.v1) — hand it to a
  session or drop it into <code>packages/content/research/</code> to make your calls the calibration/override truth.
  Decisions autosave in this browser. Nothing is submitted anywhere automatically.
</footer>
<dialog id="peekdlg"><h3 style="margin-top:0">Export preview</h3><pre id="peekpre"></pre>
<button onclick="document.getElementById('peekdlg').close()">Close</button></dialog>
<div class="toast" id="toast"></div>
<script>
const DATA = ${payload};
${pageJs}
</script>
</body>
</html>
`;

const outPath = join(DIFF_OUT_DIR, 'JEV-REVIEW.html');
writeFileSync(outPath, html);
console.log(`wrote ${outPath} (${(html.length / 1024).toFixed(0)} KB, ${evalDoc.results.length} rows)`);
