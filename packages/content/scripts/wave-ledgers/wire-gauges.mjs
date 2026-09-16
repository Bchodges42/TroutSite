#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Phase 4 gauge wiring (import plan) — probe-verified wires only.
 *
 * Every wire below was probed live against waterservices.usgs.gov on
 * 2026-09-15: station exists, siteStatus=active, series through 2026-09-14,
 * IV feed confirmed, and the station is ON the target water's reach.
 * Ledger wire candidates rejected by the same probe:
 *   07030290 (Loosahatchie stream ≠ Edmund-Orgill pond), 07026690 (Reelfoot
 *   peak-only, ended 2014 — superseded by 07027000), 03469230 (West Prong,
 *   zero published series), 03486000 (Elizabethton is below Boone — off the
 *   wilbur-reach), 03580750 (Tims Ford tailwater station ≠ lower Elk).
 * Unwire: elk-river 03578000 is the Elk HEADWATERS gauge near Pelham, not the
 *   Tims Ford tailwater reach (wave-1 roster error; TVA TMFT1 stays).
 *
 *   node packages/content/scripts/wave-ledgers/wire-gauges.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const dryRun = process.argv.includes('--dry-run');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const catalogDir = join(root, 'packages', 'content', 'streams', 'tn');
const verifiedPath = join(root, 'packages', 'content', 'data', 'verified-gauges.json');

// wire: water slug -> USGS id (probe-verified active + on-reach 2026-09-15)
const WIRES = [
  { slug: 'cumberland-river', id: '03431500', name: 'CUMBERLAND RIVER AT NASHVILLE, TN' },
  { slug: 'reelfoot-lake', id: '07027000', name: 'REELFOOT LAKE NR TIPTONVILLE, TN' },
  { slug: 'mississippi-river', id: '07032000', name: 'MISSISSIPPI RIVER AT MEMPHIS, TN' },
  { slug: 'wolf-river-fentress', id: '03416000', name: 'WOLF RIVER NEAR BYRDSTOWN, TN' },
  { slug: 'bradley-creek', id: '03578500', name: 'BRADLEY CREEK NR PRAIRIE PLAINS, TN' },
];
const UNWIRE = [{ slug: 'elk-river', id: '03578000', reason: 'headwaters gauge (near Pelham), not the Tims Ford tailwater reach — wave-1 roster error' }];

let writes = 0;
for (const w of [...WIRES.map((x) => ({ ...x, op: 'wire' })), ...UNWIRE.map((x) => ({ ...x, op: 'unwire' }))]) {
  const path = join(catalogDir, `${w.slug}.yaml`);
  const doc = parse(readFileSync(path, 'utf8'));
  doc.gaugeIds ??= [];
  if (w.op === 'wire') {
    if (doc.gaugeIds.includes(w.id)) {
      console.log(`  skip ${w.slug}: ${w.id} already wired`);
      continue;
    }
    doc.gaugeIds.push(w.id);
    doc.gaugeIds.sort();
  } else {
    if (!doc.gaugeIds.includes(w.id)) {
      console.log(`  skip ${w.slug}: ${w.id} not wired`);
      continue;
    }
    doc.gaugeIds = doc.gaugeIds.filter((g) => g !== w.id);
  }
  console.log(`  ${w.op} ${w.slug} ${w.op === 'wire' ? '+' : '-'}${w.id}`);
  if (!dryRun) {
    writeFileSync(path, stringify(doc, { lineWidth: 110 }));
    writes += 1;
  }
}

const vg = JSON.parse(readFileSync(verifiedPath, 'utf8'));
for (const w of WIRES) {
  if (vg.gauges[w.id]) continue;
  vg.gauges[w.id] = { name: w.name, realTimeIV: true };
  console.log(`  verified-gauges +${w.id}`);
}
if (!dryRun) {
  vg.comment = `${vg.comment} Added 2026-09-15 (import lane phase 4): ${WIRES.map((w) => w.id).join('/')} probed live (siteStatus=active, series through 2026-09-14, IV confirmed) before wiring; ${UNWIRE[0].id} unwired from elk-river (${UNWIRE[0].reason}).`;
  writeFileSync(verifiedPath, JSON.stringify(vg, null, 2) + '\n');
}
console.log(`[wire] ${dryRun ? 'dry run' : `wrote ${writes + 1} files`}`);
