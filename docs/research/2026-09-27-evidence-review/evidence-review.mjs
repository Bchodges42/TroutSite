#!/usr/bin/env node
/**
 * EVIDENCE-REVIEW generator (rework of the 2026-09-18 final-review.mjs /
 * HABITAT-REVIEW.html pattern) — builds EVIDENCE-REVIEW-190.html over the
 * CURRENT decision layer:
 *   - ledger.json  = the bot's adjudicated verdicts + the claims (evidence)
 *     the bot used for each one (kind / statement / source / qualification);
 *   - the three deep-evidence passes (nine-water 2026-09-24, low-confidence
 *     47-water 2026-09-24, completion 134-water 2026-09-25) = the research
 *     recommendations, month corrections, identity fixes, and per-water logs.
 * The page keeps the old review UX: one row per water, decision select +
 * notes, localStorage autosave, JSON export. No external deps, plain node.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const ledger = read('docs/research/2026-09-22-fishery-opportunities/ledger.json');

// ---- pass log coverage (filename -> ledger id aliases where they differ) ----
const PASS_DIRS = [
  { dir: 'docs/research/nine-water-evidence-20260924', pass: 'nine-water (2026-09-24)' },
  { dir: 'docs/research/low-confidence-20260924', pass: 'low-confidence (2026-09-24)' },
  { dir: 'docs/research/completion-20260925', pass: 'completion (2026-09-25)' },
];
const ALIAS = { 'little-pigeon': 'little-pigeon-river', 'east-fork-stones': 'east-fork-stones-river' };

// ---- curated research verdicts (lead-curated 2026-09-27 from the three
// passes' wave outputs; parseVerdict below is only a fallback) --------------
const OVERRIDES = {};
const set = (verdict, months, ...ids) => ids.forEach((id) => (OVERRIDES[id] = { verdict, months }));
const YR = 'year-round-trout', SS = 'seasonal-stocked-trout', WW = 'warmwater-focus', MX = 'mixed', UN = 'unresolved';
// year-round survivors (completion pass)
set(YR, [3,4,5,6,7,8,9,10,11,12], 'caney-fork-river', 'elk-river', 'watauga-river');
set(YR, [3,4,5,6,7,8,9], 'clinch-river', 'south-holston-river');
set(YR, [1,2,3,4,5,6,7,8,9,10,11,12], 'obey-river', 'west-prong-little-pigeon', 'leconte-creek', 'roaring-fork');
set(YR, [2,3,4,5,6,7,8,9,10,11,12], 'tellico-river');
set(YR, null, 'dale-hollow-lake', 'south-holston-lake', 'watauga-lake', 'parksville-lake');
set(YR, [11,12], 'calderwood-lake');
set(YR, [2,11,12], 'chilhowee-lake');
set(YR, [3,4,5,6], 'laurel-fork-carter');
// year-round downgrades (completion pass)
set(SS, [10,11,12,1,2,3,4,5,6,7], 'hiwassee-river');
set(SS, [11,12,1,2,3,4], 'holston-river');
set(SS, [3,4,12], 'boone-tailwater');
set(SS, [3,4], 'ft-patrick-henry-tailwater');
set(SS, [2,3,4,5,10,11], 'middle-prong-little-pigeon');
set(SS, [3,4,5,6,10], 'little-river', 'doe-river', 'paint-creek-greene');
set(SS, [3,4,5,6], 'cosby-creek', 'beaverdam-creek', 'doe-creek-johnson', 'forge-creek-johnson', 'laurel-creek-johnson', 'upper-roan-creek', 'stoney-creek-carter', 'horse-creek-greene');
set(SS, [11,12,1,2,3,4,5,6], 'duck-river-tailwater');
set(SS, [2,3,4,5,6,7,8,10], 'buffalo-creek-grainger');
set(SS, [2,3,4,5,10], 'piney-river-rhea');
// seasonal month corrections (completion pass)
set(SS, [3,4,5], 'barren-fork-river', 'charles-creek', 'calfkiller-river', 'collins-river', 'cane-creek', 'rocky-river', 'sequatchie-river', 'little-sequatchie-river');
set(SS, [2,3,4], 'cane-creek-hickman-perry', 'gap-creek-claiborne', 'station-creek', 'indian-creek-claiborne', 'richardson-byrd-creek', 'puncheon-camp-creek', 'standing-rock-creek', 'white-oak-creek', 'hurricane-creek', 'pine-creek-dekalb');
set(SS, [3,4], 'salt-lick-creek', 'mill-creek-overton', 'upper-hills-creek');
set(SS, [2,3,4,5,6,7], 'citico-creek');
set(SS, [2,3,4,10,11], 'big-soddy-creek');
set(SS, [2,3,4,5], 'east-fork-shoal-creek', 'gulf-fork-big-creek', 'trail-fork-big-creek');
set(SS, [12,1,2,3], 'mccutcheon-creek', 'boiling-fork-creek', 'big-rock-creek');
set(SS, [12,1,2], 'sinking-creek-wilson', 'sulfur-fork-creek', 'red-river-clarksville', 'harpeth-river');
set(SS, [12,1], 'cameron-brown-lake', 'johnson-park-lake', 'covington-fbc-pond', 'edmund-orgill-lake', 'yale-road-park-lake', 'paris-city-park-lake');
set(SS, null, 'fort-patrick-henry-lake', 'nolichucky-river', 'reedy-creek', 'watauga-river-wilbur-reach');
set(SS, [2,3,4], 'tellico-lake');
set(SS, [2,3,4,5,6], 'wilbur-lake');
set(SS, [11,12,1], 'mossy-creek-jefferson');
set(SS, [3,4,5], 'brush-creek-cocke', 'north-prong-barren-fork');
set(SS, [3,4], 'goforth-creek', 'greasy-creek-polk', 'tumbling-creek', 'upper-hills-creek');
set(SS, [2,3,4,11], 'spring-creek-polk');
set(SS, [2,4], 'fletchers-fork');
set(SS, [2,4,6,7,8], 'little-west-fork-creek');
set(SS, [3,4,5,6], 'little-buffalo-river');
set(SS, [2,3,4], 'little-tennessee-river');
set(SS, [12,1,2], 'stones-river');
set(SS, [3,4,5], 'parksville-tailwater');
// mixed (completion + low-confidence)
set(MX, [12,1], 'lake-graham', 'martin-city-pond', 'milan-city-pond', 'valentine-park-pond', 'shelby-farms-lake', 'beech-lake', 'yale-road-park-lake');
set(MX, [11,12,1], 'mossy-creek-jefferson');
set(MX, [2,3,4,5,10], 'north-chickamauga-creek');
set(MX, [12,1,2,3], 'west-fork-stones-river');
set(MX, [3,4,5,10], 'wolf-river-fentress');
// warmwater-focus (completion + low-confidence + nine-water)
set(WW, null, 'blackburn-fork', 'boone-lake', 'buffalo-river', 'caney-fork-upper', 'center-hill-lake', 'cherokee-lake', 'chickamauga-lake', 'clear-creek-obed', 'conasauga-river', 'cumberland-river', 'daddys-creek', 'douglas-lake', 'duck-river-lower', 'duck-river-mouth', 'east-fork-obey-river', 'emory-river', 'fort-loudoun-lake', 'french-broad-river', 'great-falls-lake', 'hatchie-river', 'j-percy-priest-lake', 'kentucky-lake', 'lake-barkley', 'melton-hill-lake', 'nickajack-lake', 'normandy-lake', 'norris-lake', 'north-fork-holston-river', 'obed-river', 'obion-river', 'old-hickory-lake', 'pickwick-lake', 'reelfoot-lake', 'tennessee-river', 'tims-ford-lake', 'watts-bar-lake', 'wolf-river-west-tennessee', 'woods-reservoir');
set(WW, null, 'beech-river', 'big-bigby-creek', 'big-sandy-river', 'big-sewee-creek', 'big-swan-creek', 'brimstone-creek', 'bullrun-creek', 'candies-creek', 'chestuee-creek', 'clear-fork', 'dumplin-creek', 'falling-water-river', 'little-chuckey-creek', 'little-harpeth-river', 'loosahatchie-river', 'middle-fork-forked-deer-river', 'middle-fork-obion-river', 'mississippi-river', 'nonconnah-creek', 'north-fork-forked-deer-river', 'north-fork-obion-river', 'north-mouse-creek', 'ocoee-number-three-lake', 'ocoee-river', 'oostanaula-creek', 'richland-creek-maury', 'roaring-river', 'rutherford-fork-obion-river', 'sale-creek', 'south-chickamauga-creek', 'south-fork-forked-deer-river', 'south-fork-obion-river', 'south-mouse-creek', 'west-fork-obey-river', 'west-harpeth-river', 'yellow-creek-houston');
set(WW, null, 'east-fork-stones-river', 'little-pigeon-river', 'pigeon-river', 'powell-river', 'south-fork-cumberland', 'new-river', 'elk-river-lower');
// unresolved (leaning warmwater)
set(UN, null, 'bradley-creek', 'crab-orchard-creek');
// seasonal from nine-water / low-confidence
set(SS, [2,3,4,5], 'shoal-creek');
set(SS, null, 'union-city-reelfoot-pond');

// ---- log parsing ----------------------------------------------------------
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const normVerdict = (s) => s.toLowerCase().replace(/[_\s]+/g, '-').replace(/-trout$/, (m, o, str) => str.endsWith('-trout') ? '-trout' : m)
  .replace('warmwater-focus', 'warmwater-focus').replace('seasonal-stocked', 'seasonal-stocked-trout').replace('year-round', 'year-round-trout');

function parseVerdict(chunk) {
  const c = chunk.toLowerCase();
  // year-round: find the nearest outcome verb after the first year-round mention
  const yr = c.search(/year[ -]?round|yr flag/);
  if (yr >= 0) {
    const after = c.slice(yr, yr + 220);
    const keep = after.match(/\b(survives?|keep|kept|stays|stands|confirmed|holds|defensible)\b/);
    const fail = after.match(/\b(does ?not|doesn.t|never|won.t|fails?|not survive|downgrade[d]?|refut\w*|reject\w*|dropped|remove[d]?)\b/);
    if (keep && (!fail || keep.index < fail.index)) return 'year-round-trout';
    if (fail) return 'seasonal-stocked-trout';
  }
  // otherwise: first positional keyword in the chunk
  const order = [];
  const push = (re, v) => { const m = c.match(re); if (m) order.push({ i: m.index, v }); };
  push(/warm[ -]?water/i, 'warmwater-focus');
  push(/seasonal|put-and-take|winter program|winter water|winter[- ]stocked/i, 'seasonal-stocked-trout');
  push(/\bmixed\b/i, 'mixed');
  push(/\bunresolved\b/i, 'unresolved');
  if (!order.length) return null;
  order.sort((a, b) => a.i - b.i);
  return order[0].v;
}

function parseMonths(chunk) {
  const found = new Set();
  for (const m of chunk.matchAll(/\[([0-9,\s]{1,20})\]/g)) {
    for (const n of m[1].split(',').map((x) => parseInt(x.trim(), 10))) if (n >= 1 && n <= 12) found.add(n);
  }
  for (const m of chunk.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:through|–|—|-|to)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi)) {
    const a = MONTHS[m[1].toLowerCase()], b = MONTHS[m[2].toLowerCase()];
    if (a && b) for (let i = a; ; i = (i % 12) + 1) { found.add(i); if (i === b) break; }
  }
  for (const m of chunk.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi)) {
    const v = MONTHS[m[1].toLowerCase()]; if (v) found.add(v);
  }
  return found.size ? [...found].sort((a, b) => a - b) : null;
}

function parseLog(text) {
  const lines = text.split('\n');
  // recommendation chunk: iterate "recommendation"/"verdict"/"classify" markers
  // from LAST to FIRST; first chunk that yields a verdict wins (the tail of a
  // log sometimes mentions 'verdict' in passing after the real section).
  const markers = [...text.matchAll(/recommendation|verdict|classify/gi)].map((m) => m.index);
  let verdict = null, chunk = text.slice(-2500);
  for (let k = markers.length - 1; k >= 0 && !verdict; k--) {
    const idx = markers[k];
    chunk = text.slice(Math.max(0, idx - 250), idx + 2200);
    verdict = parseVerdict(chunk);
  }
  const months = verdict === 'year-round-trout' ? parseMonths(chunk) || null : parseMonths(chunk);
  // key sources: unique markdown http links, in document order
  const sources = []; const seen = new Set();
  for (const m of text.matchAll(/\[([^\]\n]{3,120})\]\((https?:\/\/[^)\s]+)\)/g)) {
    const url = m[2].replace(/[).,]+$/, '');
    if (seen.has(url)) continue; seen.add(url);
    sources.push({ title: m[1].replace(/\*+/g, '').trim().slice(0, 140), url });
    if (sources.length >= 12) break;
  }
  // corrections / identity findings
  const corrections = [];
  for (const ln of lines) {
    if (corrections.length >= 8) break;
    if (/\b(county fix|county correction|identity|corrected?|refuted|phantom|misattribut|stale|drains? to|is actually|renamed|removed (?:the )?designat|no longer|wrong water|not (?:the )?van buren|resolved)\b/i.test(ln)
      && !/^\s*\|/.test(ln) && ln.trim().length > 25) {
      corrections.push(ln.replace(/^[\s>#*\-]+/, '').trim().slice(0, 260));
    }
  }
  return { verdict, months, sources, corrections };
}

const passBySlug = new Map();
for (const { dir, pass } of PASS_DIRS) {
  for (const f of readdirSync(join(root, dir)).filter((x) => x.endsWith('.md'))) {
    const base = f.replace(/\.md$/, '');
    const slug = ALIAS[base] ?? base;
    if (!ledger.waters.some((w) => w.id === slug)) continue; // skip helper notes
    const text = readFileSync(join(root, dir, f), 'utf8');
    const parsed = parseLog(text);
    passBySlug.set(slug, {
      pass, verdict: parsed.verdict, months: parsed.months,
      sources: parsed.sources, corrections: parsed.corrections,
      logFile: `${dir.split('/').pop()}/${f}`,
    });
  }
}

// ---- merge ----------------------------------------------------------------
const rows = ledger.waters.map((w) => {
  const p = passBySlug.get(w.id) ?? null;
  const ledgerMonths = w.catalogFields?.seasonMonths ?? null;
  const yr = w.catalogFields?.yearRound === true;
  const effVerdict = OVERRIDES[w.id]?.verdict ?? p?.verdict ?? null;
  const effMonths = OVERRIDES[w.id] ? OVERRIDES[w.id].months : (p?.months ?? null);
  let delta = p ? 'no-verdict' : 'no-pass';
  if (p && effVerdict) {
    delta = String(effVerdict).toLowerCase() === String(w.headline.troutOpportunity).toLowerCase() ? 'agree' : 'review';
    if (delta === 'agree' && effMonths && ledgerMonths && JSON.stringify(effMonths) !== JSON.stringify(ledgerMonths)) delta = 'months-differ';
    if (delta === 'agree' && (p.corrections.length || (w.flags && w.flags.length))) delta = 'agree-noted';
  }
  return {
    id: w.id, name: w.name, type: w.waterbodyType, delta,
    counties: w.counties ?? [], region: w.regionId,
    ledger: {
      verdict: w.headline.troutOpportunity, evidenceState: w.headline.evidenceState,
      months: ledgerMonths, yearRoundFlag: yr, statement: w.headline.statement,
      flags: w.flags ?? [], unresolvedQuestion: w.unresolvedQuestion ?? null,
    },
    claims: (w.claims ?? []).map((c) => ({
      kind: c.kind, state: c.state, reach: c.appliesToReach,
      statement: c.statement, qualification: c.qualification,
      source: c.source ? {
        publisher: c.source.publisher, title: c.source.title, url: c.source.url,
        method: c.source.method, observationPeriod: c.source.observationPeriod,
        pinpoint: c.source.pinpoint, retrieved: c.source.retrieved,
      } : null,
    })),
    research: p ? {
      pass: p.pass,
      verdict: effVerdict,
      months: effMonths,
      curated: !!OVERRIDES[w.id],
      sources: p.sources, corrections: p.corrections, logFile: p.logFile,
    } : null,
    fishbrainLeads: (Array.isArray(w.fishbrainLeads) ? w.fishbrainLeads
      : w.fishbrainLeads && typeof w.fishbrainLeads === 'object' ? Object.entries(w.fishbrainLeads).map(([k, v]) => k + ': ' + JSON.stringify(v))
      : w.fishbrainLeads ? [String(w.fishbrainLeads)] : []
    ).map((f) => String(f).slice(0, 200)),
  };
});

const counts = {
  total: rows.length,
  byLedger: {}, byResearch: {}, delta: { agree: 0, 'agree-noted': 0, 'months-differ': 0, review: 0, 'no-pass': 0 },
};
for (const r of rows) {
  counts.byLedger[r.ledger.verdict] = (counts.byLedger[r.ledger.verdict] ?? 0) + 1;
  if (r.research?.verdict) counts.byResearch[r.research.verdict] = (counts.byResearch[r.research.verdict] ?? 0) + 1;
  counts.delta[r.delta] = (counts.delta[r.delta] ?? 0) + 1;
}

// ---- HTML -----------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Evidence Review — 190 Tennessee Waters</title>
<style>
:root { --ink:#1c2430; --paper:#f7f5f0; --line:#d8d2c4; --accent:#7a2e2e; --ok:#2e6b4f; --warn:#a4600f; --chip:#e9e4d8; }
* { box-sizing:border-box; }
body { font-family:Georgia,'Times New Roman',serif; background:var(--paper); color:var(--ink); margin:0; padding:1.2rem 1.6rem 4rem; }
h1 { font-size:1.45rem; margin:0 0 .2rem; } h1 small { font-weight:normal; color:#5a5347; }
.sub { color:#5a5347; font-size:.86rem; margin-bottom:.7rem; }
.bar { display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; background:#fff; border:1px solid var(--line); padding:.55rem .7rem; margin-bottom:.9rem; position:sticky; top:0; z-index:5; box-shadow:0 1px 4px rgba(0,0,0,.06); }
.bar input[type=search]{ flex:1 1 240px; padding:.35rem .5rem; font:inherit; border:1px solid var(--line); }
.bar select, .bar button { font:inherit; padding:.32rem .5rem; border:1px solid var(--line); background:#fff; cursor:pointer; }
.bar button.primary { background:var(--accent); color:#fff; border-color:var(--accent); }
.counts { font-size:.78rem; color:#5a5347; margin:.2rem 0 .6rem; }
table { border-collapse:collapse; width:100%; background:#fff; border:1px solid var(--line); }
th, td { text-align:left; vertical-align:top; padding:.42rem .55rem; border-bottom:1px solid var(--line); font-size:.86rem; }
th { background:var(--chip); position:sticky; top:3.2rem; z-index:4; font-size:.78rem; text-transform:uppercase; letter-spacing:.03em; }
tr.rowmain:hover { background:#fdfbf5; }
.wname { font-weight:bold; } .wid { color:#8a8272; font-size:.72rem; display:block; }
.chip { display:inline-block; padding:.06rem .4rem; border-radius:.6rem; font-size:.72rem; background:var(--chip); margin:.05rem .12rem .05rem 0; white-space:nowrap; }
.chip.yr { background:#dcefe4; } .chip.ss { background:#e4ecf7; } .chip.ww { background:#f3e6d0; } .chip.mx { background:#eadcf0; } .chip.un { background:#eee; }
.chip.warn { background:#f7e3c8; color:var(--warn); } .chip.ok { background:#dcefe4; color:var(--ok); }
select.dec { font:inherit; font-size:.8rem; max-width:11rem; }
input.note { width:100%; font:inherit; font-size:.8rem; border:1px solid var(--line); padding:.2rem .3rem; }
details { margin-top:.35rem; } summary { cursor:pointer; font-size:.78rem; color:var(--accent); }
.drawer { background:#fbf9f3; border:1px solid var(--line); padding:.6rem .8rem; margin:.4rem 0 1rem; font-size:.84rem; }
.drawer h4 { margin:.5rem 0 .2rem; font-size:.82rem; text-transform:uppercase; letter-spacing:.03em; color:#5a5347; }
.drawer ul { margin:.15rem 0 .4rem 1.1rem; padding:0; } .drawer li { margin:.14rem 0; }
.drawer .src { color:#45403a; } .drawer a { color:var(--accent); word-break:break-all; }
.flag { color:var(--warn); } .small { font-size:.76rem; color:#6a6355; }
.legend { font-size:.76rem; color:#5a5347; margin:.6rem 0; }
@media (max-width:900px){ .hidemid { display:none; } }
</style></head><body>
<h1>Evidence Review — 190 Tennessee Waters <small>· decision review over the current bot verdicts + deep-evidence passes</small></h1>
<div class="sub">Generated __GENERATED__ · research artifact only — not visitor-facing, not applied to the product.
Ledger verdicts &amp; claims from <code>ledger.json</code> (2026-09-22) · research recommendations from the three deep-evidence passes (2026-09-24/25) · full logs linked per row.
Decisions + notes autosave in this browser; <b>Export decisions</b> downloads <code>evidence-final-decisions.json</code> for the owner pipeline.</div>
<div class="bar">
  <input type="search" id="q" placeholder="filter: name, county, id…">
  <select id="fLedger"><option value="">ledger: all</option></select>
  <select id="fResearch"><option value="">research: all</option></select>
  <select id="fDelta"><option value="">delta: all</option><option>agree</option><option>agree-noted</option><option>months-differ</option><option value="review">review (verdict differs)</option><option>no-verdict</option><option>no-pass</option></select>
  <label class="small"><input type="checkbox" id="fFlag"> flagged only</label>
  <button id="export" class="primary">Export decisions</button>
  <button id="reset">Reset local</button>
  <span id="shown" class="small"></span>
</div>
<div class="counts" id="counts"></div>
<div class="legend"><b>Δ</b> agree = research reached the ledger verdict · agree-noted = same verdict with corrections/flags worth reading · months-differ = verdict matches but research months differ · review = verdict differs (owner decision needed) · no-pass = no deep-pass log (should be none).</div>
<table><thead><tr>
<th>Water</th><th>Ledger verdict (bot)</th><th>Research recommendation</th><th>Δ</th><th>Decision</th><th>Notes</th><th class="hidemid">Flags</th>
</tr></thead><tbody id="rows"></tbody></table>
<p class="small">Sources: ledger <code>ledger.json</code>; nine-water pass <code>nine-water-evidence-20260924/</code>; low-confidence pass <code>low-confidence-20260924/</code>; completion pass <code>completion-20260925/</code>; consolidated reports <code>2026-09-24-*.md</code>, <code>2026-09-25-*.md</code> under <code>docs/reports/</code>. Fishbrain leads are internal-research leads only (never production). Community-app species indices are boilerplate — do not treat as catches.</p>
<script>
const DATA = __DATA__;
const ALL = DATA.rows;
const LS = 'evidence-review-decisions-v1';
let saved = {}; try { saved = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) {}
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const verdictChip = (v) => { if (!v) return ''; const cls = v.includes('year-round') ? 'yr' : v.includes('seasonal') ? 'ss' : v.includes('warmwater') ? 'ww' : v.includes('mixed') ? 'mx' : 'un';
  return '<span class="chip ' + cls + '">' + esc(v) + '</span>'; };
const monthsStr = (m) => m && m.length ? m.join(', ') : '—';
const OPTS = ['', 'year-round-trout', 'seasonal-stocked-trout', 'warmwater-focus', 'mixed', 'unresolved'];
function deltaChip(d) {
  const map = { agree:['ok','agree'], 'agree-noted':['ok','agree + notes'], 'months-differ':['warn','months differ'], 'review':['warn','REVIEW — verdict differs'], 'no-pass':['','no pass'] };
  const [cls, label] = map[d] || ['','']; return '<span class="chip ' + cls + '">' + label + '</span>';
}
function rowHtml(r) {
  const dec = saved[r.id]?.decision || '';
  const note = saved[r.id]?.notes || '';
  const opts = OPTS.map(o => '<option value="' + o + '"' + (dec === o ? ' selected' : '') + '>' + (o || '— decision —') + '</option>').join('');
  const claims = (r.claims || []).map(c => '<li><b>' + esc(c.kind) + '</b> (' + esc(c.state) + (c.reach ? ', ' + esc(c.reach) : '') + '): ' + esc(c.statement)
    + (c.source ? ' <span class="src">— ' + esc(c.source.publisher || '') + (c.source.title ? ' · ' + esc(c.source.title) : '') + (c.source.pinpoint ? ' · ' + esc(c.source.pinpoint) : '')
    + (c.source.url ? ' <a href="' + esc(c.source.url) + '" target="_blank" rel="noopener">[source]</a>' : '') + '</span>' : '')
    + (c.qualification ? '<br><span class="small">Qualification: ' + esc(c.qualification) + '</span>' : '') + '</li>').join('');
  const rs = r.research;
  const research = rs ? '<h4>Research recommendation (' + esc(rs.pass) + ')</h4><p>' + verdictChip(rs.verdict)
    + ' &nbsp;months: <b>' + monthsStr(rs.months) + '</b></p>'
    + (rs.corrections.length ? '<h4>Corrections / findings</h4><ul>' + rs.corrections.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' : '')
    + (rs.sources.length ? '<h4>Key evidence sources (from the log)</h4><ul>' + rs.sources.map(s => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title || s.url) + '</a></li>').join('') + '</ul>' : '')
    + '<p class="small">Full log: <a href="../' + esc(rs.logFile) + '" target="_blank" rel="noopener">' + esc(rs.logFile) + '</a></p>' : '<p class="small">No deep-pass log for this water (should not happen).</p>';
  const claimsHtml = claims ? '<h4>Bot decision evidence (ledger claims)</h4><ul>' + claims + '</ul>' : '';
  const uq = r.ledger.unresolvedQuestion ? '<h4>Open question (ledger)</h4><p>' + esc(r.ledger.unresolvedQuestion) + '</p>' : '';
  const fb = (r.fishbrainLeads || []).length ? '<h4>Fishbrain leads (internal research only)</h4><ul>' + r.fishbrainLeads.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' : '';
  return '<tr class="rowmain"><td><span class="wname">' + esc(r.name) + '</span><span class="wid">' + esc(r.id) + ' · ' + esc(r.type) + ' · ' + esc((r.counties||[]).join(', ') || r.region) + '</span>'
    + '<details><summary>evidence &amp; log</summary><div class="drawer">'
    + '<h4>Ledger statement</h4><p>' + esc(r.ledger.statement) + '</p>'
    + claimsHtml + research + uq + fb + '</div></details></td>'
    + '<td>' + verdictChip(r.ledger.verdict) + '<br><span class="small">state: ' + esc(r.ledger.evidenceState) + '</span><br><span class="small">months: ' + monthsStr(r.ledger.months) + (r.ledger.yearRoundFlag ? ' · <span class="flag">YR flag</span>' : '') + '</span></td>'
    + '<td>' + (r.research ? verdictChip(r.research.verdict) + '<br><span class="small">months: ' + monthsStr(r.research.months) + '</span>' : '<span class="small">—</span>') + '</td>'
    + '<td>' + deltaChip(r.delta) + '</td>'
    + '<td><select class="dec" data-id="' + r.id + '">' + opts + '</select></td>'
    + '<td><input class="note" data-id="' + r.id + '" value="' + esc(note) + '" placeholder="notes…"></td>'
    + '<td class="hidemid">' + (r.ledger.flags || []).map(f => '<span class="chip warn">' + esc(f) + '</span>').join(' ') + '</td></tr>';
}
function applyFilters() {
  const q = $('q').value.toLowerCase();
  const fl = $('fLedger').value, fr = $('fResearch').value, fd = $('fDelta').value, ff = $('fFlag').checked;
  let n = 0;
  document.querySelectorAll('tr.rowmain').forEach(tr => {
    const id = tr.dataset.id; const r = ALL.find(x => x.id === id);
    const hay = (r.name + ' ' + r.id + ' ' + (r.counties||[]).join(' ') + ' ' + r.region).toLowerCase();
    const show = (!q || hay.includes(q)) && (!fl || r.ledger.verdict === fl) && (!fr || (r.research?.verdict || '') === fr) && (!fd || r.delta === fd) && (!ff || (r.ledger.flags||[]).length);
    tr.style.display = show ? '' : 'none';
    const d = tr.nextElementSibling; if (d && d.classList.contains('drawerwrap')) d.style.display = show ? '' : 'none';
    if (show) n++;
  });
  $('shown').textContent = n + ' of ' + ALL.length + ' shown';
}
function build() {
  const tb = $('rows'); tb.innerHTML = '';
  for (const r of ALL) {
    const tmp = document.createElement('tbody'); tmp.innerHTML = rowHtml(r);
    const tr = tmp.querySelector('tr'); tr.dataset.id = r.id; tb.appendChild(tr);
  }
  const led = [...new Set(ALL.map(r => r.ledger.verdict))], res = [...new Set(ALL.map(r => r.research?.verdict).filter(Boolean))];
  for (const v of led) { const o = document.createElement('option'); o.value = o.textContent = v; $('fLedger').appendChild(o); }
  for (const v of res) { const o = document.createElement('option'); o.value = o.textContent = v; $('fResearch').appendChild(o); }
  $('counts').textContent = 'Ledger: ' + Object.entries(DATA.counts.byLedger).map(([k,v]) => k + ' ' + v).join(' · ')
    + '  ‖  Research: ' + Object.entries(DATA.counts.byResearch).map(([k,v]) => k + ' ' + v).join(' · ')
    + '  ‖  Δ: ' + Object.entries(DATA.counts.delta).map(([k,v]) => k + ' ' + v).join(' · ');
  $('q').oninput = applyFilters; $('fLedger').onchange = applyFilters; $('fResearch').onchange = applyFilters; $('fDelta').onchange = applyFilters; $('fFlag').onchange = applyFilters;
  document.querySelectorAll('select.dec').forEach(s => s.onchange = () => { saved[s.dataset.id] = saved[s.dataset.id] || {}; saved[s.dataset.id].decision = s.value; saved[s.dataset.id].savedAt = new Date().toISOString(); persist(); });
  document.querySelectorAll('input.note').forEach(i => i.oninput = () => { saved[i.dataset.id] = saved[i.dataset.id] || {}; saved[i.dataset.id].notes = i.value; persistDebounced(); });
  $('export').onclick = exportJson;
  $('reset').onclick = () => { if (confirm('Clear all locally saved decisions/notes?')) { saved = {}; localStorage.removeItem(LS); build(); } };
  applyFilters();
}
let t; const persistDebounced = () => { clearTimeout(t); t.setTimeout; t = setTimeout(persist, 400); };
function persist(){ try { localStorage.setItem(LS, JSON.stringify(saved)); } catch(e){} }
function exportJson(){
  const out = { generatedAt: new Date().toISOString(), source: 'EVIDENCE-REVIEW-190.html', decisions: saved };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'evidence-final-decisions.json'; a.click();
}
build();
</script></body></html>`;

const dataJson = JSON.stringify({ generatedAt: new Date().toISOString(), counts, rows }, null, 1);
const outHtml = html.replace('__DATA__', dataJson).replace('__GENERATED__', new Date().toISOString().slice(0, 16) + 'Z');

const outDir = here;
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'EVIDENCE-REVIEW-190.html'), outHtml);
writeFileSync(join(outDir, 'evidence-decisions-data.json'), dataJson);
const noPass = rows.filter((r) => r.delta === 'no-pass').map((r) => r.id);
console.log('rows:', rows.length, '| delta:', JSON.stringify(counts.delta));
console.log('byResearch:', JSON.stringify(counts.byResearch));
if (noPass.length) console.log('NO-PASS waters:', noPass.join(', '));
console.log('wrote EVIDENCE-REVIEW-190.html and evidence-decisions-data.json');
