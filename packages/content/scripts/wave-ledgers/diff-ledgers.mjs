#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Wave-ledger diff (import plan Phase 1b — REPORT-ONLY).
 *
 * Compares the parsed wave ledgers (waters.json) field-by-field against the
 * catalog YAMLs. Buckets every water into agree / conflict / fill-gap per
 * field family and emits:
 *   docs/research/2026-09-15-wave-ledgers/ledger/diff.json
 *   docs/research/2026-09-15-wave-ledgers/DIFF-REPORT.md   (owner decision boxes)
 *
 * NO catalog YAML is modified by this script. Month extraction is best-effort;
 * every row stays owner-reviewable rather than auto-applyable.
 *
 *   node packages/content/scripts/wave-ledgers/diff-ledgers.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const ledgerDir = join(root, 'docs', 'research', '2026-09-15-wave-ledgers');
const catalogDir = join(root, 'packages', 'content', 'streams', 'tn');

const { waters } = JSON.parse(readFileSync(join(ledgerDir, 'ledger', 'waters.json'), 'utf8'));

// --- catalog -------------------------------------------------------------
const catalog = new Map();
for (const f of readdirSync(catalogDir).filter((x) => x.endsWith('.yaml'))) {
  const y = parse(readFileSync(join(catalogDir, f), 'utf8'));
  catalog.set(y.id, y);
}

// roster-authoritative block pick: wilbur-reach belongs to wave 2's roster
// (wave 1 carries it as a seed bonus block — skip that copy)
function rosterPick(b) {
  if (b.slug !== 'watauga-river-wilbur-reach') return b;
  return b.wave === 2 ? b : null;
}

// --- verdicts -------------------------------------------------------------
// Wave-ledger Species/Stocking prose mixes real claims with honest negatives
// ("no trout documented") and tailwater-redirect explanations ("any trout here
// belongs to the Norris TW... — a different roster entry"). A positive trout
// verdict therefore requires a sentence that (a) still mentions trout after
// negation-phrase stripping and (b) is not a redirect/discount sentence.
const NEGATION_RES = [
  /none found[^.;]*/gi,
  /no trout[^.;]*/gi,
  /not a trout[^.;]*/gi,
  /zero trout[^.;]*/gi,
  /no salmonid[^.;]*/gi,
  /trout (presence|content|occurrence)( is| are)? not documented[^.;]*/gi,
  /not documented for the (lake|reservoir|river|main stem)[^.;]*/gi,
  /absent from [^.;]*(?:trout|schedule)[^.;]*/gi,
  /does not (?:name|list|document)[^.;]*/gi,
  /trout are not mentioned[^.;]*/gi,
  /trout are absent[^.;]*/gi,
  /no [a-z ]+ entry on [a-z' ]{0,14}trout [^.;]*/gi,
  /absence of any [a-z ]{0,20}trout[^.;]*/gi,
  /trout.? claim is (contradicted|refuted)[^.;]*/gi,
  /no (?:current|active|named) [a-z ]{0,20}trout[^.;]*/gi,
  /no [a-z' /-]{0,40}trout (row|schedule|record|program|stocking|entry|block)[^.;]*/gi,
  /no (?:current|active|named) (?:trout )?(?:stocking|program)[^.;]*/gi,
  /tried:[^|]*/gi,
];
const TROUT_RE = /\btrout\b|\bsalmonid/i;
const STRONG_NEG_RE = /no trout|zero trout|no salmonid|trout (presence|content|occurrence)[^.;]{0,40}not documented|not documented for the (lake|reservoir|river|main stem)|trout[^.;]{0,60}refuted|refuted[^.;]{0,60}trout/i;
const DISCOUNT_RE = /different (roster|water|entry)|belongs to the|pertains to|not the (lake|river|reservoir)|refuted|dam tailwater|below [a-z]+ dam|impounds? the|\bTW\s?[/\u2010-\u2015]|\babsent\b|occurrence (status only|only)|\bas present\b|npspecies|\brows? exist\b|reservoir row|unquantified/i;

function stripNegations(text) {
  let t = text;
  for (const re of NEGATION_RES) t = t.replace(re, ' ');
  return t;
}

function ledgerTroutVerdict(b) {
  if (b.class) return b.class === 'warmwater' || b.class === 'none-found' ? 'none' : 'trout';
  const speciesLines = b.slots.Species ?? [];
  const stockingLines = b.slots.Stocking ?? [];
  // URLs carry "trout-information-stockings" etc. — never evidence; drop them
  // before sentence analysis.
  const raw = `${speciesLines.map((s) => s.value).join(' ')} ${stockingLines.map((s) => s.value).join(' ')}`.replace(/https?:\/\/\S+/g, ' ');
  const cleanPositive = raw
    .split(/(?<=[.;])\s+/)
    .filter((s) => TROUT_RE.test(stripNegations(s)) && !DISCOUNT_RE.test(s));
  if (cleanPositive.length > 0) return 'trout';
  const speciesNone = speciesLines.length > 0 && speciesLines.every((s) => s.noneFound);
  const stockingNone = stockingLines.length > 0 && stockingLines.every((s) => s.noneFound);
  if (STRONG_NEG_RE.test(raw) || speciesNone || stockingNone) return 'none';
  return 'unclear';
}

function catalogTroutVerdict(y) {
  if (y.species === 'trout') return 'trout';
  if (y.species === 'warmwater') return 'none';
  if (y.species == null) return y.stockingProgram ? 'trout' : 'unset';
  return String(y.species);
}

function verdictBucket(lv, cv) {
  if (lv === 'unclear') return 'ledger-unclear';
  if (lv === cv) return cv === 'trout' ? 'agree-trout' : 'agree-none';
  if (lv === 'none' && cv === 'trout') return 'CONFLICT strip-candidate';
  if (lv === 'trout' && cv === 'none') return 'CONFLICT claim-candidate';
  if (cv === 'unset') return 'catalog-unset (fill-gap)';
  return `review (${lv} vs ${cv})`;
}

// --- season windows --------------------------------------------------------
const MONTH_ALIASES = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9,
  october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  // "may" is deliberately excluded from single-word matching (English "may");
  // it is still honored inside "X through/to Y" range pairs below.
};

function ledgerMonths(b) {
  const raw = (b.slots.Stocking ?? []).map((s) => s.value).join(' ').toLowerCase();
  if (!raw || /^none\b|^no current|^no trout/.test(raw.trim())) return { months: null, basis: 'none' };
  const set = new Set();
  const addRange = (a, z) => {
    if (a <= z) for (let i = a; i <= z; i++) set.add(i);
    else {
      for (let i = a; i <= 12; i++) set.add(i);
      for (let i = 1; i <= z; i++) set.add(i);
    }
  };
  // "march through december" / "november to june" — explicit month words only
  const M = 'january|february|march|april|may|june|july|august|september|october|november|december';
  for (const m of raw.matchAll(new RegExp(`\\b(${M})\\s+(?:through|to)\\s+(${M})\\b`, 'g'))) {
    addRange(MONTH_ALIASES[m[1]], MONTH_ALIASES[m[2]]);
  }
  // compact dash windows: "Nov–Apr", "Dec–Feb" — dash must touch both tokens
  // (prose em-dashes carry spaces, so this never pairs across punctuation)
  for (const m of raw.matchAll(/\b([a-z]{3})[a-z]*–([a-z]{3})[a-z]*\b/g)) {
    const a = MONTH_ALIASES[m[1]];
    const z = MONTH_ALIASES[m[2]];
    if (a && z) addRange(a, z);
  }
  for (const m of raw.matchAll(/\b([a-z]{3,9})\b/g)) {
    const v = MONTH_ALIASES[m[1]];
    if (v) set.add(v);
  }
  // numeric stocking dates: 3/15/2026, 1/13, TBD 12/2026 — guard month <= 12
  for (const m of raw.matchAll(/\b(\d{1,2})\/\d{1,2}(?:\/\d{2,4})?\b/g)) {
    const v = Number(m[1]);
    if (v >= 1 && v <= 12) set.add(v);
  }
  for (const m of raw.matchAll(/\btbd\s+(\d{1,2})\/(?:\d{4})\b/g)) {
    const v = Number(m[1]);
    if (v >= 1 && v <= 12) set.add(v);
  }
  if (set.size === 0) return { months: null, basis: 'unparsed' };
  const months = [...set].sort((a, b) => a - b);
  return { months, basis: months.length >= 11 ? 'year-round-ish' : 'parsed' };
}

// --- gauges -----------------------------------------------------------------
function ledgerGaugeInfo(b) {
  const text = (b.slots.Gauges ?? []).map((s) => s.value).join('   \n   ');
  const info = new Map();
  for (const id of b.usgsIds) {
    let active = false;
    let offReach = false;
    for (const m of text.matchAll(new RegExp(`${id}[\\s\\S]{0,350}`, 'g'))) {
      const w = m[0];
      if (/Status:\s*active\b/i.test(w)) active = true;
      if (/off-reach|wrong (stream|reach)|is actually|headwaters reach|NOT the tailwater|different water/i.test(w)) {
        offReach = true;
      }
    }
    info.set(id, { active, offReach });
  }
  return info;
}

function diffGauges(b, y) {
  const info = ledgerGaugeInfo(b);
  const cUsgs = (y.gaugeIds ?? []).filter((g) => /^\d{8}$/.test(g));
  const cVendor = (y.gaugeIds ?? []).filter((g) => !/^\d{8}$/.test(g));
  const keep = [];
  const unwireCandidates = [];
  const offReachFlagged = [];
  for (const id of cUsgs) {
    const st = info.get(id);
    if (!st) unwireCandidates.push(id);
    else if (st.offReach) offReachFlagged.push(id);
    else keep.push(id);
  }
  const wireCandidates = [...info.entries()].filter(([id, st]) => st.active && !st.offReach && !cUsgs.includes(id)).map(([id]) => id);
  return { catalogUsgs: cUsgs, catalogVendor: cVendor, ledgerUsgs: b.usgsIds, keep, unwireCandidates, offReachFlagged, wireCandidates };
}

// --- diff ---------------------------------------------------------------------
const rows = [];
for (const b of waters) {
  const r = rosterPick(b);
  if (!r) continue;
  const y = catalog.get(b.slug);
  const lv = ledgerTroutVerdict(r);
  const cv = catalogTroutVerdict(y);
  const { months, basis } = ledgerMonths(r);
  const cMonths = Array.isArray(y.seasonMonths) ? [...y.seasonMonths].sort((a, x) => a - x) : null;
  const SPECIAL_RE = /statewide trout (rules|regulations|creel)|no special|no [a-z]+-specific|general trout regs|absent from twra/i;
  const regLead = (r.slots.Regulations ?? []).find((s) => !s.noneFound && !SPECIAL_RE.test(s.value)) ?? null;
  rows.push({
    slug: b.slug,
    wave: r.wave,
    class: r.class,
    verdict: { ledger: lv, catalog: cv, bucket: verdictBucket(lv, cv) },
    season: {
      ledgerMonths: months,
      ledgerBasis: basis,
      catalogMonths: cMonths,
      bucket:
        months == null
          ? cMonths
            ? 'ledger-unparsed'
            : 'both-unset'
          : cMonths == null
            ? 'catalog-unset (fill-gap)'
            : JSON.stringify(months) === JSON.stringify(cMonths)
              ? 'match'
              : 'differ',
    },
    gauges: diffGauges(r, y),
    hasSpecialRegs: Boolean(regLead),
    specialRegLead: regLead?.value.slice(0, 140) ?? null,
    identity: r.identity,
    catalogName: y.name,
  });
}

function countBy(arr, fn) {
  return arr.reduce((m, x) => ((m[fn(x)] = (m[fn(x)] ?? 0) + 1), m), {});
}

const summary = {
  waters: rows.length,
  verdict: countBy(rows, (r) => r.verdict.bucket),
  season: countBy(rows, (r) => r.season.bucket),
  gauges: {
    keep: rows.reduce((n, r) => n + r.gauges.keep.length, 0),
    unwireCandidates: rows.reduce((n, r) => n + r.gauges.unwireCandidates.length, 0),
    wireCandidates: rows.reduce((n, r) => n + r.gauges.wireCandidates.length, 0),
    offReachFlagged: rows.reduce((n, r) => n + r.gauges.offReachFlagged.length, 0),
  },
  specialRegsWaters: rows.filter((r) => r.hasSpecialRegs).length,
};

writeFileSync(join(ledgerDir, 'ledger', 'diff.json'), JSON.stringify({ generated: '2026-09-15', summary, rows }, null, 2) + '\n');

// --- report -----------------------------------------------------------------
const strip = rows.filter((r) => r.verdict.bucket.includes('strip-candidate'));
const claim = rows.filter((r) => r.verdict.bucket.includes('claim-candidate'));
const unclear = rows.filter((r) => r.verdict.bucket === 'ledger-unclear');
const seasonDiffer = rows.filter((r) => r.season.bucket === 'differ');
const seasonFill = rows.filter((r) => r.season.bucket.startsWith('catalog-unset'));
const unwire = rows.filter((r) => r.gauges.unwireCandidates.length || r.gauges.offReachFlagged.length);
const wire = rows.filter((r) => r.gauges.wireCandidates.length);
const regs = rows.filter((r) => r.hasSpecialRegs);

const md = [];
md.push('# Wave-ledger diff vs catalog — owner decision boxes (Phase 1, report-only)');
md.push('');
md.push(`Generated 2026-09-15 from ${summary.waters} roster waters (149 blocks / 148 unique slugs). The ledgers cover the original 148-water roster only — the 40 selectable-river-expansion additions and duck-river-mouth have no ledger sourcing yet.`);
md.push('');
md.push('## Verdict census');
md.push('');
md.push('| Verdict bucket | Waters |');
md.push('|---|---|');
for (const [k, v] of Object.entries(summary.verdict).sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${v} |`);
md.push('');
md.push('## Season census');
md.push('');
md.push('| Season bucket | Waters |');
md.push('|---|---|');
for (const [k, v] of Object.entries(summary.season).sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${v} |`);
md.push('');
md.push(`## D1 — species-verdict conflicts (${strip.length} strip / ${claim.length} claim / ${unclear.length} unclear)`);
md.push('');
md.push('Ledger sourcing vs the catalog species verdict. Strip candidates: catalog says trout, the ledgers document none/warmwater. Claim candidates: the reverse.');
md.push('');
if (strip.length) {
  md.push('| Slug | Wave | Ledger class | Evidence lead |');
  md.push('|---|---|---|---|');
  for (const r of strip) md.push(`| ${r.slug} | ${r.wave} | ${r.class ?? r.verdict.ledger} | ${(r.specialRegLead ?? 'see ledger Species/Stocking lines').replace(/\|/g, '/')} |`);
  md.push('');
}
if (claim.length) {
  md.push('| Slug | Wave | Catalog verdict | Evidence lead |');
  md.push('|---|---|---|---|');
  for (const r of claim) md.push(`| ${r.slug} | ${r.wave} | ${r.verdict.catalog} | ${(r.specialRegLead ?? 'see ledger Species/Stocking lines').replace(/\|/g, '/')} |`);
  md.push('');
}
if (unclear.length) {
  md.push(`Ledger-unclear (manual read needed): ${unclear.map((r) => r.slug).join(', ')}`);
  md.push('');
}
md.push(`## Season windows — ${seasonDiffer.length} differ / ${seasonFill.length} catalog-unset fill-gaps`);
md.push('');
if (seasonDiffer.length) {
  md.push('| Slug | Catalog seasonMonths | Ledger months (basis) |');
  md.push('|---|---|---|');
  for (const r of seasonDiffer) md.push(`| ${r.slug} | [${(r.season.catalogMonths ?? []).join(', ')}] | [${(r.season.ledgerMonths ?? []).join(', ')}] (${r.season.ledgerBasis}) |`);
  md.push('');
}
if (seasonFill.length) {
  const fillable = seasonFill.filter((r) => r.season.ledgerMonths);
  md.push(`<details><summary>${seasonFill.length} waters with catalog-unset seasonMonths (${fillable.length} with ledger-derived windows)</summary>`);
  md.push('');
  md.push('```');
  for (const r of seasonFill) md.push(`${r.slug}: ${r.season.ledgerMonths ? `[${r.season.ledgerMonths.join(', ')}]` : '(ledger window unparsed)'}`);
  md.push('```');
  md.push('');
  md.push('</details>');
  md.push('');
}
md.push(`## Gauge wiring — ${summary.gauges.unwireCandidates} unwire / ${summary.gauges.offReachFlagged} off-reach flags / ${summary.gauges.wireCandidates} wire candidates (${summary.gauges.keep} kept as-is)`);
md.push('');
if (unwire.length) {
  md.push('Catalog-wired USGS IDs the ledgers contradict (absent from the ledger block, flagged off-reach, or a different water):');
  md.push('');
  md.push('| Slug | Catalog IDs | Unwire (not in ledger) | Off-reach flags |');
  md.push('|---|---|---|---|');
  for (const r of unwire.slice(0, 40)) md.push(`| ${r.slug} | ${r.gauges.catalogUsgs.join(', ') || '—'} | ${r.gauges.unwireCandidates.join(', ') || '—'} | ${r.gauges.offReachFlagged.join(', ') || '—'} |`);
  md.push('');
}
if (wire.length) {
  md.push(`<details><summary>${summary.gauges.wireCandidates} wire candidates (ledger-verified ACTIVE on-reach, not wired in catalog — probe-before-wire still mandatory)</summary>`);
  md.push('');
  md.push('```');
  for (const r of wire) md.push(`${r.slug}: +${r.gauges.wireCandidates.join(', +')}`);
  md.push('```');
  md.push('');
  md.push('</details>');
  md.push('');
}
md.push(`## Regulations enrichment — ${regs.length} roster waters carry documented special regulations`);
md.push('');
md.push('Full text lives in the ledger blocks (Regulations lines with source URLs); feeds `notes` prefixes now or a future `regulations` field (D4).');
md.push('');
  md.push('## Decision boxes (refreshed with wave findings)');
  md.push('');
  md.push('**Read these caveats first:**');
  md.push('');
  md.push('1. **Unwire ≠ wrong.** "Unwire (not in ledger)" means the ledger block never mentions that station — it can be a true miswire (barren-fork 03421500) OR newer wiring the ledger pre-dates (duck-river-lower gained +3 gauges from the gauge-layer lane AFTER wave-2). Probe before touching either way.');
  md.push('2. **Unresolved ≠ refuted.** `south-fork-cumberland` and `powell-river` were honestly UNRESOLVED by the ledgers (temperature series too old); their strip rows reflect "agency text names no trout", not a disproof. Owner call.');
  md.push('3. **`east-fork-stones-river` keeps its owner ruling** (winter-stocked, 2026-09-10) — any audit/ledger strip noise loses.');
  md.push('4. **Ledger month windows are best-effort parses** of schedule prose; numeric stocking-event dates (e.g. "02/18/2026") can add noise months. Reconcile the differ table against the ledger text, not the parsed set alone.');
  md.push('');
md.push('- **D1 species verdicts** — walk the strip/claim tables; safe defaults: strip → `species: warmwater` + note citation; claim → `species: trout` + citation. `east-fork-stones-river` keeps its owner ruling (winter-stocked) regardless.');
md.push('- **D2 display re-tier** — unchanged (authored campaign tiers stand; expansion waters ride `labelMinZoom`).');
md.push('- **D3 non-enum species** — ledger species detail (rainbow/brown/brook/lake) stays in `notes`/research YAML; no enum extension.');
md.push('- **D4 regulations/aliases** — `aliases` now exists in the contract (expansion merge); special-regs prose → `notes` prefixes or a future `regulations` field.');
md.push('- **D5 season windows** — apply ledger-derived windows where the catalog is unset; reconcile the `differ` table row by row (month parsing is best-effort).');
md.push('- **D6 identity/gauge fixes** — apply unwire/wire tables only after a live probe re-run (probe-before-wire mandatory; several ledger proposals are discontinued stations).');
md.push('');

writeFileSync(join(ledgerDir, 'DIFF-REPORT.md'), md.join('\n'));
console.log('[diff] summary:', JSON.stringify(summary, null, 2));
console.log('[diff] wrote ledger/diff.json + DIFF-REPORT.md');
