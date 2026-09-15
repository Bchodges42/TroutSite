#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Wave-ledger parser (import plan Phase 1a — REPORT-ONLY).
 *
 * Parses the three SOURCES-LEDGER-WAVE*.md files (shared 6-slot block format)
 * into machine-readable JSON under docs/research/2026-09-15-wave-ledgers/ledger/
 * and runs the Phase-1 self-checks (block counts, unique slugs, slot
 * completeness, catalog membership). Exits non-zero on any check failure.
 *
 *   node packages/content/scripts/wave-ledgers/parse-ledgers.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const ledgerDir = join(root, 'docs', 'research', '2026-09-15-wave-ledgers');
const outDir = join(ledgerDir, 'ledger');
const catalogDir = join(root, 'packages', 'content', 'streams', 'tn');

const WAVES = [
  { file: 'SOURCES-LEDGER-WAVE1-TAILWATERS-LAKES.md', wave: 1, expectBlocks: 51 },
  { file: 'SOURCES-LEDGER-WAVE2-RIVERS-PONDS.md', wave: 2, expectBlocks: 41 },
  { file: 'SOURCES-LEDGER-WAVE3-CREEKS.md', wave: 3, expectBlocks: 57 },
];

const CORE_SLOTS = ['Species', 'Stocking', 'Regulations', 'Gauges', 'Access', 'Identity'];
const CLASS_RE = /^(wild-self-sustaining|mixed|stocked-winter|warmwater|none-found)\b/;
const URL_RE = /https?:\/\/[^\s|)]+/g;
const USGS_RE = /\b0\d{7}\b/g;
const VENDOR_RE = /\b(tva|usace):[A-Za-z0-9]{2,6}\b/g;

function parseSlotLine(line) {
  // "- <Label[ (annotation)]>: <value...>"
  const m = /^-\s+([A-Za-z]+)(\s*\([^)]*\))?\s*:\s*(.*)$/.exec(line);
  if (!m) return null;
  const [, label, annotation, value] = m;
  const urls = value.match(URL_RE) ?? [];
  const noneFound = /none found|no (current |active |[a-z]+ )?(usgs )?(gauge|station|trout|stocking|special|ramp|record)|not citable|not verifiable|unresolved|unfetchable/i.test(value);
  const tried = /tried\s*:/i.test(value);
  return {
    label,
    annotation: annotation ? annotation.slice(2, -1).trim() : null,
    value: value.trim(),
    urls: [...new Set(urls)],
    noneFound,
    tried,
  };
}

function parseWave({ file, wave }) {
  const text = readFileSync(join(ledgerDir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const h = /^###\s+(\S+)\s*$/.exec(line);
    if (h) {
      if (current) blocks.push(current);
      current = { slug: h[1], wave, slotLines: [] };
      continue;
    }
    if (!current) continue;
    // any level-2 heading (or later ### after capture) ends the block; also
    // fenced appendix content never starts with "- <Label>:"
    if (/^##\s/.test(line)) {
      blocks.push(current);
      current = null;
      continue;
    }
    if (/^-\s+[A-Za-z]+\s*(\([^)]*\))?\s*:/.test(line)) {
      const slot = parseSlotLine(line);
      if (slot) current.slotLines.push(slot);
    }
  }
  if (current) blocks.push(current);

  return blocks.map(({ slug, slotLines }) => {
    const slots = {};
    for (const s of slotLines) (slots[s.label] ??= []).push(s);
    const gaugeTextRaw = (slots.Gauges ?? []).map((s) => s.value).join(' ');
    // HUC-8 watershed codes ("HUC 06040004") are 0-prefixed 8-digit numbers
    // too — drop them before station-ID extraction.
    const gaugeText = gaugeTextRaw.replace(/HUC(?:-8)?\s*\d{8}/gi, ' ');
    const idText = (slots.Identity ?? []).map((s) => s.value).join(' ');
    const classLine = (slots.Class ?? [])[0]?.value ?? null;
    const classVerdict = classLine ? (CLASS_RE.exec(classLine)?.[1] ?? null) : null;
    const identity = {
      county: (/\|\s*([A-Za-z][A-Za-z ]*?)\s+[Cc]ount(y|ies)/.exec(idText)?.[1] ?? null),
      huc8: (/\bHUC(?:-8)?\s+(\d{8})\b/.exec(idText)?.[1] ?? null),
      lat: (/(-?\d{2}\.\d{4,}),\s*(-?\d{2}\.\d{4,})/.exec(idText)?.[1] ?? null),
      lon: (/(-?\d{2}\.\d{4,}),\s*(-?\d{2}\.\d{4,})/.exec(idText)?.[2] ?? null),
    };
    return {
      slug,
      wave,
      class: classVerdict,
      slots,
      completeness: Object.fromEntries(CORE_SLOTS.map((s) => [s, (slots[s]?.length ?? 0) > 0])),
      usgsIds: [...new Set(gaugeText.match(USGS_RE) ?? [])],
      vendorGauges: [...new Set(gaugeText.match(VENDOR_RE) ?? [])],
      gaugeActive: /\bStatus:\s*active\b/i.test(gaugeText),
      identity,
      urlCount: slotLines.reduce((n, s) => n + s.urls.length, 0),
    };
  });
}

// --- run -----------------------------------------------------------------
mkdirSync(outDir, { recursive: true });
const all = WAVES.flatMap(parseWave);

// catalog membership (light: read the `id:` line; full YAML parse happens in the diff step)
const catalogIds = new Set(
  readdirSync(catalogDir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => /^id:\s*(\S+)/m.exec(readFileSync(join(catalogDir, f), 'utf8'))?.[1])
    .filter(Boolean),
);

const bySlug = new Map();
for (const b of all) {
  if (bySlug.has(b.slug)) bySlug.get(b.slug).push(b);
  else bySlug.set(b.slug, [b]);
}
const dupes = [...bySlug.entries()].filter(([, v]) => v.length > 1).map(([k]) => k);
const unknown = [...bySlug.keys()].filter((s) => !catalogIds.has(s));

const problems = [];
if (all.length !== 149) problems.push(`expected 149 blocks, got ${all.length}`);
WAVES.forEach(({ wave, expectBlocks }) => {
  const n = all.filter((b) => b.wave === wave).length;
  if (n !== expectBlocks) problems.push(`wave ${wave}: expected ${expectBlocks} blocks, got ${n}`);
});
if (bySlug.size !== 148) problems.push(`expected 148 unique slugs, got ${bySlug.size}`);
if (dupes.join(',') !== 'watauga-river-wilbur-reach') problems.push(`unexpected duplicate slugs: ${dupes.join(',')}`);
for (const s of unknown) problems.push(`ledger slug not in catalog: ${s}`);
for (const b of all) {
  for (const slot of CORE_SLOTS) {
    if (!b.completeness[slot]) problems.push(`${b.slug} (wave ${b.wave}): missing ${slot} slot`);
  }
}

// citation census
const census = {
  blocks: all.length,
  uniqueSlugs: bySlug.size,
  duplicateSlugs: dupes,
  catalogUnmatched: unknown,
  slotLines: all.reduce((n, b) => n + Object.values(b.slots).flat().length, 0),
  urlCitations: all.reduce((n, b) => n + b.urlCount, 0),
  blocksWithClass: all.filter((b) => b.class).length,
  classCounts: all.filter((b) => b.class).reduce((m, b) => ((m[b.class] = (m[b.class] ?? 0) + 1), m), {}),
  noneFoundSlotLines: all.reduce((n, b) => n + Object.values(b.slots).flat().filter((s) => s.noneFound).length, 0),
};

writeFileSync(
  join(outDir, 'waters.json'),
  JSON.stringify({ generated: '2026-09-15', census, waters: all }, null, 2) + '\n',
);

console.log('[parse] census:', JSON.stringify(census, null, 2));
if (problems.length) {
  console.error(`[parse] FAILED self-checks (${problems.length}):`);
  for (const p of problems.slice(0, 40)) console.error('  -', p);
  process.exit(1);
}
console.log(`[parse] OK — ${all.length} blocks, ${bySlug.size} unique slugs, all self-checks pass`);
