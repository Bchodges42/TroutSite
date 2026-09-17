#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Apply prominence Candidate A ("trout-pure", owner-approved first-paint):
 * the manifest's candidateA.tierChanges (display tiers) AND speciesFills land
 * TOGETHER in one commit — tiers alone strand 17 unset featured waters as
 * unlabeled dim shapes; fills alone exclude featured majors from trout mode.
 * (notes/MAP-PROMINENCE-DECISION-PACKAGE.md §Sequencing.)
 *
 *   node packages/content/scripts/classification/apply-prominence-a.mjs [--dry-run]
 *
 * Candidate B stays reachable: its full 29-change tierChanges list lives in
 * notes/apply-manifest.json candidateB, and waterDecision.ts keeps
 * FEATURED_WARMWATER_CONTEXT (default false).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { CATALOG_DIR, loadCatalog } from './lib.mjs';

const dryRun = process.argv.includes('--dry-run');
const manifest = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'notes', 'apply-manifest.json'), 'utf8'),
);

const { tierChanges } = manifest.candidateA;
const { speciesFills } = manifest;

// Mutate in memory first; verify; only then write (unless dry-run).
const docs = new Map(loadCatalog().map(({ slug, doc }) => [slug, doc]));
for (const w of docs.values()) if (w.display == null) w.display = 'standard';

let tierEdits = 0;
let fillEdits = 0;

for (const ch of tierChanges) {
  if (ch.field !== 'display') throw new Error(`unexpected field ${ch.field} in tierChanges`);
  const doc = docs.get(ch.id);
  if (!doc) throw new Error(`${ch.id}: not in catalog`);
  if ((doc.display ?? 'standard') !== ch.from) throw new Error(`${ch.id}: manifest from=${ch.from} but catalog has ${doc.display ?? 'standard'}`);
  doc.display = ch.to;
  tierEdits += 1;
}

for (const fill of speciesFills) {
  if (fill.field !== 'species') throw new Error(`unexpected field ${fill.field} in speciesFills`);
  const doc = docs.get(fill.id);
  if (!doc) throw new Error(`${fill.id}: not in catalog`);
  if (doc.species === fill.to) continue; // no-op guard (6 fills already warmwater in YAML)
  doc.species = fill.to;
  const cite = `Prominence A species fill (${fill.confidence}): ${fill.citation} — ${fill.note}`;
  doc.notes = doc.notes ? `${String(doc.notes).trim()}\n\n  ${cite}` : cite;
  fillEdits += 1;
}

const featured = [...docs.entries()].filter(([, d]) => d.display === 'featured').map(([slug]) => slug).sort();
const expected = [...manifest.candidateA.featured].sort();
if (featured.join(',') !== expected.join(',')) {
  throw new Error(`post-apply featured set mismatch:\n got ${featured.join(',')}\n want ${expected.join(',')}`);
}

if (!dryRun) {
  for (const ch of tierChanges) {
    const path = join(CATALOG_DIR, `${ch.id}.yaml`);
    writeFileSync(path, stringify(docs.get(ch.id), { lineWidth: 110 }));
  }
  for (const fill of speciesFills) {
    if (docs.get(fill.id).species !== fill.to) continue;
    const path = join(CATALOG_DIR, `${fill.id}.yaml`);
    writeFileSync(path, stringify(docs.get(fill.id), { lineWidth: 110 }));
  }
}

console.log(`${dryRun ? 'DRY-RUN OK' : 'APPLIED'}: ${tierEdits} tier changes, ${fillEdits} species fills (+${speciesFills.length - fillEdits} no-ops), featured = ${featured.length} (candidate A)`);
