/* global process */
/* eslint-disable no-undef */
/**
 * Session 3 imagery intake — copies the visually APPROVED license-safe
 * candidates (.atlas-src/imagery-candidates, see docs/imagery-provenance.csv)
 * into public/img/taxa/ as size-bounded JPEGs. One image per insect group,
 * keyed by the order/family the TaxonDetailPage looks up. Run from apps/web:
 *   node scripts/intake-imagery.mjs
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const webRoot = dirname(fileURLToPath(import.meta.url));
const appRoot = dirname(webRoot);
const repoRoot = join(appRoot, '..', '..');
const srcDir = join(repoRoot, '.atlas-src', 'imagery-candidates');
const outDir = join(appRoot, 'public', 'img', 'taxa');

// group → approved candidate file. Every entry must exist in
// docs/imagery-provenance.csv with an ad-safe license (CC0/PD/CC BY/CC BY-SA).
const PICKS = {
  'ephemeroptera.jpg': '01-mayfly/mayfly-3.jpg',
  'trichoptera.jpg': '02-caddisfly/caddisfly-2.jpg',
  'plecoptera.jpg': '03-stonefly/stonefly-1.jpg',
  'chironomidae.jpg': '04-midge/midge-2.jpg',
  'amphipoda.jpg': '05-scud/scud-1.jpg',
  'isopoda.jpg': '06-sowbug/sowbug-1.jpg',
  'tipulidae.jpg': '07-cranefly-larva/cranefly-1.jpg',
  'simuliidae.jpg': '08-blackfly-larva/blackfly-1.jpg',
  'odonata.jpg': '09-odonata/odonata-3.jpg',
  'coleoptera.jpg': '10-aquatic-beetle/beetle-1.jpg',
  'annelida.jpg': '12-leech/leech-1.jpg',
  'hymenoptera.jpg': '13-terrestrial/terrestrial-1.jpg',
  'orthoptera.jpg': '13-terrestrial/terrestrial-2.jpg',
  'megaloptera.jpg': '14-hellgrammite/hellgrammite-1.jpg',
};

const MAX_WIDTH = 960;
const QUALITY = 78;

// Provenance gate: refuse to ship a photo with no provenance row.
const csv = readFileSync(join(srcDir, 'PROVENANCE.csv'), 'utf8');
const rows = new Set(
  csv
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((line) => line.split(',')[0].replace(/^\uFEFF/, '')),
);

mkdirSync(outDir, { recursive: true });
let wrote = 0;
for (const [out, rel] of Object.entries(PICKS)) {
  if (!rows.has(rel)) {
    console.error(`intake-imagery: ${rel} has no PROVENANCE row — refusing to ship.`);
    process.exit(1);
  }
  const src = join(srcDir, rel);
  if (!existsSync(src)) {
    console.error(`intake-imagery: candidate missing: ${rel}`);
    process.exit(1);
  }
  await sharp(src).resize({ width: MAX_WIDTH, withoutEnlargement: true }).jpeg({ quality: QUALITY }).toFile(join(outDir, out));
  wrote += 1;
}
console.log(`intake-imagery: wrote ${wrote} photos to public/img/taxa (max ${MAX_WIDTH}px, q${QUALITY}).`);
