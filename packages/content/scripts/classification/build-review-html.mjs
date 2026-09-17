#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Build the self-contained Jev decision-review page (Fieldwork paper look).
 *
 *   node packages/content/scripts/classification/build-review-html.mjs
 *
 * Reads the latest eval JSON, enriches rows with per-water evidence (tier,
 * match status, ledger, stocking, FULL Fishbrain species list with catch
 * counts), and writes JEV-REVIEW.html: a sortable/filterable review table.
 * Every decision is PREFILLED with Jev's raw choice (owner-reviewed labels
 * where they exist); the owner flips what they disagree with; export emits a
 * complete trout.jev-tn-review-labels.v1 truth set. Clicking a water name
 * opens a species panel with per-species catch counts and the Fishbrain page
 * link. No data leaves the machine.
 *
 * The browser-side script avoids template literals so the page can live
 * inside one Node template literal.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIFF_OUT_DIR } from './lib.mjs';
import { evidenceState, reviewedCategory, CATEGORY_LABELS } from './jev-classify.mjs';

const evalPath = join(DIFF_OUT_DIR, 'jev-classification-eval.json');
const evalDoc = JSON.parse(readFileSync(evalPath, 'utf8'));

// Composite program classification (classification-composite.json, 2026-09-17):
// per-water TWRA StockingProgram conclusion (Spring/Tailwater/Winter/Reservoir)
// from schedule workbook + live stocking feed + warmwater workbook. Optional:
// the review page renders it in the drawer when the file is present.
const compositePath = join(DIFF_OUT_DIR, 'classification-composite.json');
const compositeBySlug = {};
if (existsSync(compositePath)) {
  for (const [slug, v] of Object.entries(JSON.parse(readFileSync(compositePath, 'utf8')).waters ?? {})) {
    compositeBySlug[slug] = {
      recommendedClass: v.recommendedClass ?? null,
      programClasses: v.programClasses ?? [],
      modifiers: v.modifiers ?? [],
      seasonMonths: v.seasonMonths ?? null,
      confidence: v.confidence ?? null,
      flags: v.flags ?? [],
    };
  }
}

const evidence = {};
for (const r of evalDoc.results) {
  if (r.error) continue;
  const s = evidenceState(r.slug, { month: evalDoc.month.number });
  const fb = s.evidence.fishbrainDiscovery;
  const species = [
    ...(fb.freshwaterTrout ?? []).map((x) => ({ name: x.name, catches: x.catches ?? 0, role: 'trout' })),
    ...(fb.topFreshwaterSpecies ?? []).map((x) => ({ name: x.name, catches: x.catches ?? 0, role: 'context' })),
    ...(fb.excludedMarineOrBrackish ?? []).map((x) => ({ name: x.name, catches: x.catches ?? 0, role: 'excluded' })),
  ].sort((a, b) => b.catches - a.catches);
  evidence[r.slug] = {
    tier: fb.tier,
    matchStatus: fb.matchStatus ?? 'no-record',
    waterName: s.water.name,
    waterbodyType: s.water.waterbodyType,
    counties: s.water.counties ?? [],
    ledger: s.evidence.auditedLedger.available,
    ledgerClass: s.evidence.auditedLedger.class ?? null,
    stockingEvents: s.evidence.twraStocking.matchedEvents.length,
    stockingPrograms: [...new Set(s.evidence.twraStocking.matchedEvents.map((e) => e.program))],
    species,
    fishbrainPageUrl: fb.pageUrl ?? null,
    fishbrainWaterName: fb.pageName ?? null,
    loggedCatches: fb.loggedCatches ?? null,
    catalogSpecies: s.evidence.catalog.species ?? null,
    composite: compositeBySlug[r.slug] ?? null,
    catalogFishery: s.evidence.catalog.fishery ?? null,
    catalogYearRound: s.evidence.catalog.yearRound ?? null,
    catalogSeasonMonths: s.evidence.catalog.seasonMonths ?? null,
    officialSources: (s.evidence.catalog.officialSources ?? []).slice(0, 4).map((x) => x.label ?? x.url ?? ''),
    notes: String(s.evidence.catalog.notes ?? '').slice(0, 500),
  };
}

// Prefill truth: owner-reviewed label where it exists, else Jev's raw choice.
const prefills = {};
for (const r of evalDoc.results) {
  const reviewed = reviewedCategory(r.slug);
  prefills[r.slug] = reviewed ?? r.rawChoice ?? null;
}

const prevPath = join(DIFF_OUT_DIR, 'jev-classification-eval.pre-schedule.json');
const prevChoices = {};
if (existsSync(prevPath)) {
  for (const r of JSON.parse(readFileSync(prevPath, 'utf8')).results) if (!r.error) prevChoices[r.slug] = r.rawChoice ?? null;
}
const payload = JSON.stringify({
  prevChoices,
  generated: evalDoc.generated,
  month: evalDoc.month,
  model: evalDoc.model,
  labels: CATEGORY_LABELS,
  prefills,
  evidence,
  results: evalDoc.results,
}).replace(/</g, '\\u003c');

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,420;0,9..144,560;1,9..144,460;1,9..144,560&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
  :root {
    --paper:#f4efe4; --panel:#faf7ee; --panel2:#efe9da; --ink:#243039; --dim:#75808a;
    --hair:#ddd4bf; --hair2:#e9e2d0; --accent:#b4552d;
    --trout:#19647e; --winter:#96700f; --warm:#8f5b3c; --ok:#4a7c59;
  }
  * { box-sizing:border-box; }
  html { background:var(--paper); }
  body { margin:0; color:var(--ink); font:14px/1.5 "IBM Plex Sans", "Segoe UI", system-ui, sans-serif; }
  header { padding:20px 26px 14px; background:var(--panel);
           border-bottom:1px solid var(--hair); box-shadow:0 1px 0 var(--hair2); position:sticky; top:0; z-index:6; }
  .masthead { font-family:Fraunces, Georgia, serif; font-size:21px; letter-spacing:.02em; }
  .masthead .rule { color:var(--accent); }
  .masthead em { font-style:italic; font-weight:560; }
  .colophon { color:var(--dim); font-size:12px; margin-top:3px; }
  .colophon b { color:var(--ink); font-weight:600; }
  .bar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:12px;
         padding-top:10px; border-top:1px solid var(--hair2); }
  input[type=search], select { background:#fff; color:var(--ink); border:1px solid var(--hair);
         border-radius:6px; padding:6px 10px; font:13px "IBM Plex Sans", sans-serif; }
  input[type=search]:focus, select:focus, .note:focus { outline:2px solid var(--accent); outline-offset:1px; }
  label.chk { color:var(--dim); font-size:12.5px; display:flex; gap:5px; align-items:center; }
  button { background:#fff; color:var(--ink); border:1px solid var(--hair); border-radius:7px;
           padding:6px 13px; font:500 13px "IBM Plex Sans", sans-serif; cursor:pointer; }
  button:hover { border-color:var(--accent); color:var(--accent); }
  button.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
  button.primary:hover { background:#9c4523; color:#fff; }
  #progress { margin-left:auto; font-size:12.5px; color:var(--dim); }
  #progress b { font-family:Fraunces, Georgia, serif; font-size:17px; color:var(--ink); }
  table { border-collapse:collapse; width:100%; }
  th { position:sticky; top:138px; background:var(--panel); text-align:left; font:500 11px "IBM Plex Sans";
       color:var(--dim); text-transform:uppercase; letter-spacing:.09em; padding:9px 12px;
       border-bottom:1px solid var(--hair); cursor:pointer; user-select:none; white-space:nowrap; z-index:4; }
  th:hover { color:var(--accent); }
  th .dir { font-size:9px; }
  td { padding:9px 12px; border:1px solid #000; vertical-align:top; }
  tbody tr:nth-child(odd) td { background:#faf5e3; }
  tbody tr:nth-child(even) td { background:#dcd7ca; }
  tbody tr:hover td { background:#cfc7b2; }
  .wname { font-family:Fraunces, Georgia, serif; font-style:italic; font-weight:560; font-size:15.5px;
           cursor:pointer; border-bottom:1px dotted var(--dim); }
  .wname:hover { color:var(--accent); border-color:var(--accent); }
  .meta { color:var(--dim); font-size:11.5px; margin-top:2px; max-width:340px; }
  .badges { margin-top:3px; }
  .badge { font-size:10px; color:var(--dim); border:1px solid var(--hair); border-radius:4px;
           padding:1px 5px; margin-right:4px; background:#fff; white-space:nowrap; }
  .badge.flag { color:#a03b28; border-color:#c97f6e; background:#f8ebe6; }
  .badge.mod { color:var(--accent); border-color:var(--accent); background:#f8ece4; }
  .badge.rev { color:var(--ok); border-color:var(--ok); background:#edf3ec; }
  .pill { display:inline-block; padding:2px 9px; border-radius:11px; font-size:11.5px;
          border:1px solid; white-space:nowrap; font-weight:500; }
  .trout-stream-year-round { color:var(--trout); border-color:#7fb3c4; background:#e8f1f4; }
  .warmwater-yearly-stocked-winter-trout { color:var(--winter); border-color:#d3b878; background:#f6efdd; }
  .warmwater-no-trout { color:var(--warm); border-color:#cfa88e; background:#f5ece4; }
  .confwrap { white-space:nowrap; }
  .confbar { width:56px; height:5px; background:var(--panel2); border-radius:3px; display:inline-block;
             vertical-align:middle; margin-right:7px; }
  .confbar i { display:block; height:100%; border-radius:3px; background:var(--ok); }
  .lowconf .confbar i { background:var(--accent); }
  .lowconf .confnum { color:var(--accent); font-weight:600; }
  .seg { display:inline-flex; border:1px solid var(--hair); border-radius:8px; overflow:hidden; background:#fff; }
  .seg button { border:0; border-radius:0; background:transparent; padding:5px 9px; font-size:11.5px; border-right:1px solid var(--hair2); }
  .seg button:last-child { border-right:0; }
  .seg button.on-t { background:#dceaf0; color:var(--trout); font-weight:600; }
  .seg button.on-w { background:#f2e8cd; color:var(--winter); font-weight:600; }
  .seg button.on-n { background:#f2e2d6; color:var(--warm); font-weight:600; }
  .note { width:160px; background:#fff; border:1px solid var(--hair); border-radius:6px;
          color:var(--ink); font:12px "IBM Plex Sans"; padding:5px 7px; }
  tr.decided-mod td { background:#faf4e6; }
  footer { padding:18px 26px 30px; color:var(--dim); font-size:12px; }
  footer code { background:var(--panel2); border-radius:4px; padding:1px 5px; }
  .drawer { position:fixed; top:0; right:-480px; width:460px; height:100vh; overflow-y:auto;
            background:var(--panel); border-left:1px solid var(--hair); box-shadow:-12px 0 30px rgba(60,50,20,.12);
            transition:right .22s ease; z-index:20; padding:22px 24px 30px; }
  .drawer.open { right:0; }
  .drawer h2 { font-family:Fraunces, Georgia, serif; font-style:italic; font-weight:560; font-size:22px;
               margin:0 0 2px; }
  .drawer .sub2 { color:var(--dim); font-size:12px; margin-bottom:14px; }
  .drawer h3 { font:600 11px "IBM Plex Sans"; text-transform:uppercase; letter-spacing:.09em;
               color:var(--dim); margin:18px 0 6px; padding-bottom:4px; border-bottom:1px solid var(--hair); }
  .sprow { display:flex; align-items:center; gap:10px; padding:3px 0; font-size:13px; }
  .spname { flex:0 0 170px; }
  .spbar { flex:1; height:7px; background:var(--panel2); border-radius:4px; overflow:hidden; }
  .spbar i { display:block; height:100%; background:#8aa5b1; border-radius:4px; }
  .sprow.trout .spname { color:var(--trout); font-weight:600; }
  .sprow.trout .spbar i { background:var(--trout); }
  .sprow.excluded { color:var(--dim); text-decoration:line-through; }
  .spcount { flex:0 0 52px; text-align:right; font-variant-numeric:tabular-nums; color:var(--dim); }
  .kv { font-size:12.5px; margin:2px 0; }
  .kv b { font-weight:600; }
  .drawer .close { position:absolute; top:14px; right:16px; }
  .drawer a { color:var(--accent); }
  .scrim { position:fixed; inset:0; background:rgba(40,32,12,.18); display:none; z-index:15; }
  .scrim.open { display:block; }
  .toast { position:fixed; bottom:18px; right:18px; background:var(--ink); color:var(--paper);
           padding:10px 16px; border-radius:8px; display:none; z-index:30; font-size:13px; }
`;

const pageJs = `
var CATS = ['trout-stream-year-round','warmwater-yearly-stocked-winter-trout','warmwater-no-trout'];
var SHORT = { 'trout-stream-year-round':'Trout yr', 'warmwater-yearly-stocked-winter-trout':'Winter-stocked', 'warmwater-no-trout':'Warmwater' };
// Stable key: answers survive closing/reopening the page AND eval re-runs.
// Legacy per-generation keys (jev-review-v2-<generated>) are migrated once.
var LS_KEY = 'jev-review-v3';
var decisions = {}, restored = 0;
(function () {
  var saved = {};
  try {
    for (var li = 0; li < localStorage.length; li++) {
      var lk = localStorage.key(li);
      if (lk && lk.indexOf('jev-review-v2-') === 0) {
        var lp = {};
        try { lp = JSON.parse(localStorage.getItem(lk) || '{}') || {}; } catch (pe) { lp = {}; }
        for (var ls in lp) if (lp[ls] && lp[ls].category) saved[ls] = lp[ls];
      }
    }
    var v3 = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (v3 && v3.decisions) for (var vs in v3.decisions) if (v3.decisions[vs] && v3.decisions[vs].category) saved[vs] = v3.decisions[vs];
  } catch (se) { saved = {}; }
  for (var i = 0; i < DATA.results.length; i++) {
    var r0 = DATA.results[i];
    if (r0.error) continue;
    var sv = saved[r0.slug];
    // Only decisions the owner actually TOUCHED (override or note) survive a
    // restore; saved prefill echoes must never freeze a stale Jev call when
    // the eval is re-run — those rows re-derive from the current prefill.
    if (sv && sv.category && (sv.modified || sv.note)) { decisions[r0.slug] = sv; restored += 1; continue; }
    var pre = DATA.prefills[r0.slug];
    if (pre) decisions[r0.slug] = { category: pre, note: '', origin: pre === r0.rawChoice ? 'jev' : 'reviewed', modified: false };
  }
})();
var sortKey = 'confidence', sortDir = -1;
function changedFromPrev(slug) { var now = decisions[slug] ? decisions[slug].category : null; var was = DATA.prevChoices[slug]; return was && now && was !== now ? was : null; }

function el(id) { return document.getElementById(id); }
function save() { localStorage.setItem(LS_KEY, JSON.stringify({ generated: DATA.generated, savedAt: new Date().toISOString(), decisions: decisions })); }
function toast(msg) {
  var t = el('toast'); t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 2400);
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function decidedOf(slug) { var d = decisions[slug]; return d && d.category ? d : null; }
function isModified(slug) { var d = decisions[slug]; return !!(d && d.modified); }

function rows() {
  var q = el('q').value.toLowerCase();
  var fc = el('fcat').value, ft = el('ftier').value;
  var fdec = el('fdec').value;
  return DATA.results.filter(function (r) {
    if (r.error) return false;
    var ev = DATA.evidence[r.slug] || {};
    if (fc && r.rawChoice !== fc && decisions[r.slug].category !== fc) return false;
    if (ft && ev.tier !== ft) return false;
    if (fdec === 'modified' && !isModified(r.slug)) return false;
    if (fdec === 'agree' && isModified(r.slug)) return false;
    if (fdec === 'overridden' && !isModified(r.slug)) return false;
    if (el('flow').checked && r.confidence >= 0.6) return false;
    if (el('fflag').checked && !(r.consistencyFlags || []).length) return false;
    if (el('fnotfound').checked && ev.matchStatus !== 'not-found') return false;
    if (q) {
      var hay = [r.slug, ev.waterName, ev.notes].concat((ev.species || []).map(function (s) { return s.name; })).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function render() {
  var list = rows().slice().sort(function (a, b) {
    var eva = DATA.evidence[a.slug] || {}, evb = DATA.evidence[b.slug] || {};
    var va, vb;
    if (sortKey === 'decision') { va = (decisions[a.slug] || {}).category || ''; vb = (decisions[b.slug] || {}).category || ''; }
    else if (sortKey === 'tier') { va = eva.tier + eva.matchStatus; vb = evb.tier + evb.matchStatus; }
    else if (sortKey === 'note') { va = (decisions[a.slug] || {}).note || ''; vb = (decisions[b.slug] || {}).note || ''; }
    else if (sortKey === 'slug') { va = a.slug; vb = b.slug; }
    else { va = a[sortKey]; vb = b[sortKey]; }
    return ((va < vb) ? -1 : (va > vb) ? 1 : 0) * sortDir;
  });
  var html = list.map(function (r) {
    var ev = DATA.evidence[r.slug] || {};
    var d = decisions[r.slug];
    var mod = isModified(r.slug);
    var flags = (r.consistencyFlags || []).map(function () { return '<span class="badge flag">flag</span>'; }).join('');
    var badges = [
      '<span class="badge">' + esc(ev.tier || '?') + '</span>',
      (ev.matchStatus && ev.matchStatus !== 'candidate') ? '<span class="badge">' + esc(ev.matchStatus) + '</span>' : '',
      d && d.origin === 'reviewed' ? '<span class="badge rev">reviewed</span>' : '',
      mod ? '<span class="badge mod">your override</span>' : '',
      flags,
    ].join('');
    var metaParts = [ev.waterName, ev.waterbodyType, (ev.counties || []).join('/')],
      meta2 = [ev.ledger ? 'ledger OK' : 'no ledger',
        ev.stockingEvents ? ev.stockingEvents + ' stocking (' + (ev.stockingPrograms || []).join('/') + ')' : 'no stocking',
        (ev.species || []).length + ' FB species'];
    var seg = CATS.map(function (c) {
      var on = d && d.category === c ? (c === 'trout-stream-year-round' ? 'on-t' : (c === 'warmwater-yearly-stocked-winter-trout' ? 'on-w' : 'on-n')) : '';
      return '<button class="' + on + '" title="' + esc(DATA.labels[c]) + '" onclick="setCat(\\'' + r.slug + '\\',\\'' + c + '\\')">' + SHORT[c] + '</button>';
    }).join('');
    var noteVal = esc((d || {}).note || '');
    return '<tr class="' + (mod ? 'decided-mod ' : '') + (r.confidence < 0.6 ? 'lowconf' : '') + '">' +
      '<td><span class="wname" onclick="openDrawer(\\'' + r.slug + '\\')">' + esc(ev.waterName || r.slug) + '</span>' +
        '<div class="meta">' + esc(metaParts.join(' \\u00b7 ')) + '</div><div class="badges">' + badges + '</div></td>' +
      '<td class="cat"><div class="seg">' + seg + '</div><div class="meta" style="margin-top:3px">' +
        (d && d.origin === 'reviewed' ? 'owner-reviewed' : 'prefilled from Jev') + '</div></td>' +
      '<td class="cat"><span class="pill ' + (r.rawChoice || 'undecided') + '">' + (SHORT[r.rawChoice] || '\\u2014') + '</span></td>' +
      '<td class="confwrap"><span class="confbar"><i style="width:' + Math.round((r.confidence || 0) * 100) + '%"></i></span><span class="confnum">' + (r.confidence == null ? '' : r.confidence.toFixed(2)) + '</span></td>' +
      '<td>' + (r.monthsTrue == null ? '' : r.monthsTrue) + '/12</td>' +
      '<td>' + esc(ev.tier || '') + '</td>' +
      '<td><input class="note" value="' + noteVal + '" onchange="setNote(\\'' + r.slug + '\\', this.value)" placeholder="note\\u2026"></td>' +
      '</tr>';
  }).join('');
  el('rows').innerHTML = html;
  var modified = 0;
  for (var k in decisions) if (isModified(k)) modified += 1;
  el('progress').innerHTML = '<b>' + modified + '</b>/190 overridden \\u00b7 rest confirm Jev';
}

window.setCat = function (slug, cat) {
  var d = decisions[slug];
  if (!d) return;
  d.category = cat;
  d.modified = cat !== DATA.prefills[slug];
  save(); render();
};
window.setNote = function (slug, note) {
  var d = decisions[slug];
  if (!d) return;
  d.note = note;
  save();
};
window.resetOne = function (slug) {
  var pre = DATA.prefills[slug];
  decisions[slug] = { category: pre, note: (decisions[slug] || {}).note || '', origin: pre === rawOf(slug) ? 'jev' : 'reviewed', modified: false };
  save(); render();
};
window.openDrawer = function (slug) {
  var ev = DATA.evidence[slug] || {};
  var comp = ev.composite || {};
  var r = null;
  for (var i = 0; i < DATA.results.length; i++) if (DATA.results[i].slug === slug) r = DATA.results[i];
  el('dName').textContent = ev.waterName || slug;
  el('dSub').textContent = [ev.waterbodyType, (ev.counties || []).join(' / '), 'catalog: ' + slug].filter(Boolean).join(' \\u00b7 ');
  var rowsHtml = '';
  var maxC = 1;
  (ev.species || []).forEach(function (s) { maxC = Math.max(maxC, s.catches || 0); });
  var troutNames = (ev.species || []).filter(function (s) { return s.role === 'trout'; }).map(function (s) { return s.name; });
  (ev.species || []).forEach(function (s) {
    var cls = s.role === 'trout' ? 'trout' : (s.role === 'excluded' ? 'excluded' : '');
    rowsHtml += '<div class="sprow ' + cls + '"><span class="spname">' + esc(s.name) + '</span>' +
      '<span class="spbar"><i style="width:' + Math.max(2, Math.round((s.catches || 0) / maxC * 100)) + '%"></i></span>' +
      '<span class="spcount">' + (s.catches || 0) + '</span></div>';
  });
  el('dSpecies').innerHTML = rowsHtml || '<i style="color:var(--dim)">No Fishbrain species record.</i>';
  var kv = [];
  kv.push('<div class="kv"><b>Jev:</b> <span class="pill ' + (r.rawChoice || '') + '">' + (SHORT[r.rawChoice] || '\\u2014') + '</span> confidence ' + (r.confidence == null ? '\\u2014' : r.confidence.toFixed(2)) + ' \\u00b7 trout months ' + (r.monthsTrue == null ? '\\u2014' : r.monthsTrue) + '/12</div>');
  kv.push('<div class="kv"><b>Current decision:</b> ' + ((decisions[slug] || {}).category ? SHORT[decisions[slug].category] : '\\u2014') + '</div>');
  kv.push('<div class="kv"><b>Composite program (2026-09-17):</b> ' + esc([
    comp.recommendedClass,
    (comp.programClasses || []).length ? 'programs ' + comp.programClasses.join('/') : null,
    (comp.modifiers || []).length ? comp.modifiers.join(' + ') : null,
    (comp.seasonMonths || []).length ? 'months ' + JSON.stringify(comp.seasonMonths) : null,
    comp.confidence ? 'conf ' + comp.confidence : null,
    (comp.flags || []).length ? comp.flags.length + ' flag(s)' : null,
  ].filter(Boolean).join(' \\u00b7 ') || 'no composite row') + '</div>');
  kv.push('<div class="kv"><b>Catalog today:</b> ' + esc([ev.catalogSpecies ? 'species ' + ev.catalogSpecies : 'species unset', ev.catalogFishery ? ev.catalogFishery : null, ev.catalogYearRound == null ? null : (ev.catalogYearRound ? 'yearRound' : 'seasonal'), ev.catalogSeasonMonths ? 'months ' + JSON.stringify(ev.catalogSeasonMonths) : null].filter(Boolean).join(' \\u00b7 ') || '\\u2014') + '</div>');
  kv.push('<div class="kv"><b>Ledger:</b> ' + (ev.ledger ? 'audited (' + esc(ev.ledgerClass || 'no class line') + ')' : 'none') + ' \\u00b7 <b>TWRA feed:</b> ' + (ev.stockingEvents ? ev.stockingEvents + ' events (' + (ev.stockingPrograms || []).join('/') + ')' : 'none matched') + '</div>');
  kv.push('<div class="kv"><b>Fishbrain:</b> ' + esc(ev.matchStatus || '') + (ev.fishbrainWaterName ? ' \\u2014 "' + esc(ev.fishbrainWaterName) + '"' : '') + (ev.loggedCatches != null ? ' \\u00b7 ' + ev.loggedCatches + ' logged catches' : '') + '</div>');
  if (ev.notes) kv.push('<div class="kv"><b>Catalog notes:</b> ' + esc(ev.notes) + '</div>');
  el('dFacts').innerHTML = kv.join('');
  var link = el('dLink');
  if (ev.fishbrainPageUrl) { link.style.display = ''; link.href = ev.fishbrainPageUrl; }
  else link.style.display = 'none';
  el('scrim').classList.add('open');
  el('drawer').classList.add('open');
};
window.closeDrawer = function () {
  el('scrim').classList.remove('open');
  el('drawer').classList.remove('open');
};
function rawOf(slug) {
  for (var i = 0; i < DATA.results.length; i++) if (DATA.results[i].slug === slug) return DATA.results[i].rawChoice;
  return null;
}

function buildExport() {
  var labels = {};
  for (var slug in decisions) {
    var d = decisions[slug];
    if (!d.category) continue;
    labels[slug] = { category: d.category };
    if (d.note) labels[slug].note = d.note;
    if (d.origin === 'jev' && !d.modified) labels[slug].confirmedFrom = 'jev-' + DATA.generated.slice(0, 10);
    labels[slug].reviewedAt = new Date().toISOString().slice(0, 10);
  }
  return {
    schema: 'trout.jev-tn-review-labels.v1',
    stateId: 'TN',
    source: 'owner review of Jev system classifications (JEV-REVIEW.html, eval ' + DATA.generated + '); prefilled with raw Jev calls, owner modifications override',
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
  toast('Downloaded jev-tn-review-labels.json (' + Object.keys(buildExport().labels).length + ' waters)');
};
el('peek').onclick = function () {
  el('peekpre').textContent = JSON.stringify(buildExport(), null, 2);
  el('peekdlg').showModal();
};
el('resetVisible').onclick = function () {
  rows().forEach(function (r) { window.resetOne(r.slug); });
  toast('Visible rows reset to prefill');
};
el('closeDrawerBtn').onclick = window.closeDrawer;
el('scrim').onclick = window.closeDrawer;
Array.prototype.forEach.call(document.querySelectorAll('th'), function (th) {
  th.addEventListener('click', function () {
    var k = th.getAttribute('data-k');
    sortDir = (sortKey === k) ? -sortDir : 1;
    sortKey = k;
    render();
  });
});
['q', 'fcat', 'ftier', 'fdec', 'flow', 'fflag', 'fnotfound'].forEach(function (id) {
  el(id).addEventListener('input', render);
});
render();
if (restored > 0) toast('Restored ' + restored + ' saved decision' + (restored === 1 ? '' : 's') + ' from your last visit');
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jev decision review — 190 Tennessee waters</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,420;0,9..144,560;1,9..144,460;1,9..144,560&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<header>
  <div class="masthead"><span class="rule">TROUT</span> <em>· decision review</em></div>
  <div class="colophon"><b>190 Tennessee waters</b> · ${evalDoc.model} · ${evalDoc.month.name} eval · decisions prefilled with Jev; flip what you disagree with · eval generated ${evalDoc.generated}</div>
  <div class="bar">
    <input type="search" id="q" placeholder="filter water, species, notes…" size="26">
    <select id="fcat">
      <option value="">all categories</option>
      <option value="trout-stream-year-round">Trout Stream - year round</option>
      <option value="warmwater-yearly-stocked-winter-trout">Warm water - Yearly stocked winter trout</option>
      <option value="warmwater-no-trout">warm water(no trout)</option>
    </select>
    <select id="ftier">
      <option value="">all tiers</option>
      <option value="featured">featured</option>
      <option value="standard">standard</option>
    </select>
    <select id="fdec">
      <option value="">all decisions</option>
      <option value="overridden">changed by you</option>
      <option value="agree">confirming Jev</option>
    </select>
    <label class="chk"><input type="checkbox" id="flow"> conf &lt; 0.6</label>
    <label class="chk"><input type="checkbox" id="fflag"> flags</label>
    <label class="chk"><input type="checkbox" id="fnotfound"> not-found</label>
    <button id="resetVisible">Reset visible to Jev</button>
    <span id="progress"><b>0</b>/190 overridden · rest confirm Jev</span>
    <button class="primary" id="export">Export review JSON (190)</button>
    <button id="peek">Peek</button>
  </div>
</header>
<table id="t">
  <thead><tr>
    <th data-k="slug">Water</th>
    <th data-k="decision">Decision</th>
    <th data-k="rawChoice">Jev: system identity</th>
    <th data-k="confidence">Confidence</th>
    <th data-k="monthsTrue">Trout mo. now-yr</th>
    <th data-k="tier">Tier</th>
    <th data-k="note">Note</th>
  </tr></thead>
  <tbody id="rows"></tbody>
</table>
<footer>
  Click a <i>water name</i> for its full Fishbrain species list with catch counts, the composite program
  class, and the Fishbrain page link. Decisions autosave in this browser under a stable key and are
  restored when you come back — closing the tab or regenerating the eval will not lose them; old
  per-generation saves are migrated. Export downloads
  <code>jev-tn-review-labels.json</code> — the complete 190-water truth set; hand it to a session or drop it into
  <code>packages/content/research/</code>.
</footer>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer">
  <button class="close" id="closeDrawerBtn">✕</button>
  <h2 id="dName">—</h2>
  <div class="sub2" id="dSub">—</div>
  <h3>Fishbrain species · catches</h3>
  <div id="dSpecies"></div>
  <h3>Record</h3>
  <div id="dFacts"></div>
  <p style="margin-top:16px"><a id="dLink" target="_blank" rel="noopener">Open Fishbrain page ↗</a></p>
</aside>
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
