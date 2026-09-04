#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * STILLWATER lane — integrate still-water polygons into the canonical
 * interactive source apps/web/public/atlas/rivers.geojson per
 * docs/WATERBODY-GEOMETRY-CONTRACT.md (in trout-fieldwork-20260904):
 *
 *   1. Replace the 13 twra-winter-ponds Point anchors IN PLACE with the
 *      contract-shaped polygons staged in .atlas-src/stillwater/extract/<id>.geojson
 *      (same IDs; legacy fiche metadata retained).
 *   2. Insert new still waters that have no existing feature (pickwick-lake).
 *   3. Promote the reference lakes from passive apps/web/public/atlas/lakes.geojson
 *      to contract-shaped interactive features (Census AREAWATER provenance)
 *      and remove them from the passive file (contract §4) — the remaining
 *      non-reference lakes stay passive.
 *
 * The staged per-water files are build intermediates (reproducible with
 * fetch-stillwater-nhd.mjs / trace-stillwater.mjs + committed vertex lists in
 * .atlas-src — .atlas-src is git-ignored by design; rivers.geojson is the
 * committed deliverable).
 *
 * Usage:
 *   node scripts/build-stillwater.mjs [--only id1,id2,...] [--lakes] [--dry-run]
 *
 *   --only   integrate just these staged extract ids (default: all staged)
 *   --lakes  also promote the 14 reference lakes from lakes.geojson
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTRACT_DIR = join(webRoot, '.atlas-src', 'stillwater', 'extract');
const riversPath = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const lakesPath = join(webRoot, 'public', 'atlas', 'lakes.geojson');

const args = process.argv.slice(2);
const onlyArg = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const doLakes = args.includes('--lakes');
const dryRun = args.includes('--dry-run');

// Reference lakes (waterbody-inventory.json) → lakes.geojson ids are identical
// (build-lakes.mjs slugged the display names the same way).
const REFERENCE_LAKES = new Set([
  'lake-barkley', 'kentucky-lake', 'old-hickory-lake', 'j-percy-priest-lake',
  'tims-ford-lake', 'center-hill-lake', 'dale-hollow-lake', 'watts-bar-lake',
  'chickamauga-lake', 'norris-lake', 'fort-loudoun-lake', 'cherokee-lake',
  'douglas-lake', 'south-holston-lake',
]);

const countVerts = (coords) => coords.reduce((n, part) => n + part.reduce((m, ring) => m + ring.length, 0), 0);

function contractFeature(staged) {
  // staged files are already contract-shaped (fetch/trace emit)
  return staged;
}

function promoteLakeFeature(f) {
  const p = f.properties;
  const coords = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  return {
    type: 'Feature',
    properties: {
      id: p.id,
      name: p.name,
      waterbodyType: 'lake',
      source: 'census-areawater',
      approximate: false,
      labelAnchor: p.labelAnchor,
      bounds: p.bounds,
      partCount: coords.length,
      vertexCount: countVerts(coords),
      crs: 'EPSG:4326',
      coordinateOrder: 'longitude,latitude',
    },
    geometry: { type: 'MultiPolygon', coordinates: coords },
  };
}

function atomicWrite(path, data) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'stillwater-')), 'out.json');
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

const rivers = JSON.parse(readFileSync(riversPath, 'utf8'));
const before = rivers.features.length;

// ---- 1+2: staged extracts → replace-by-id or append ----
const stagedIds = readdirSync(EXTRACT_DIR).filter((n) => n.endsWith('.geojson')).map((n) => n.replace(/\.geojson$/, ''));
const ids = (onlyArg ?? stagedIds).filter((id) => existsSync(join(EXTRACT_DIR, `${id}.geojson`)));
const missing = (onlyArg ?? []).filter((id) => !existsSync(join(EXTRACT_DIR, `${id}.geojson`)));
if (missing.length) console.log(`WARN no staged extract for: ${missing.join(', ')}`);

let replaced = 0, appended = 0;
for (const id of ids) {
  const staged = contractFeature(JSON.parse(readFileSync(join(EXTRACT_DIR, `${id}.geojson`), 'utf8')));
  const idx = rivers.features.findIndex((f) => f.properties?.id === id);
  if (idx >= 0) {
    const prev = rivers.features[idx];
    // retain legacy fiche metadata (species/stockingProgram/notes/…) that the
    // point anchors carried — the staged feature already includes it for
    // winter-pond targets; for anything else keep prior extra keys.
    const merged = { ...prev.properties, ...staged.properties };
    rivers.features[idx] = { ...staged, properties: merged };
    replaced++;
    console.log(`replaced ${id}: ${prev.geometry.type} → ${staged.geometry.type} (${staged.properties.vertexCount} verts)`);
  } else {
    rivers.features.push(staged);
    appended++;
    console.log(`appended ${id}: ${staged.geometry.type} (${staged.properties.vertexCount} verts)`);
  }
}

// ---- 3: promote reference lakes ----
let promoted = 0, removedPassive = 0;
if (doLakes) {
  const lakes = JSON.parse(readFileSync(lakesPath, 'utf8'));
  const keep = [];
  for (const f of lakes.features) {
    const id = f.properties?.id;
    if (REFERENCE_LAKES.has(id)) {
      const feat = promoteLakeFeature(f);
      const idx = rivers.features.findIndex((r) => r.properties?.id === id);
      if (idx >= 0) rivers.features[idx] = feat;
      else rivers.features.push(feat);
      promoted++;
      removedPassive++;
      console.log(`promoted ${id} (Census AREAWATER → interactive; removed from passive lakes.geojson)`);
    } else {
      keep.push(f);
    }
  }
  lakes.features = keep;
  if (!dryRun) atomicWrite(lakesPath, `${JSON.stringify(lakes)}\n`);
}

if (!dryRun) atomicWrite(riversPath, JSON.stringify(rivers));
console.log(`rivers.geojson: ${before} → ${rivers.features.length} features (replaced ${replaced}, appended ${appended}, promoted ${promoted})`);
