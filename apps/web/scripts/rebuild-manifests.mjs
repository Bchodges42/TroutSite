/* global console, process */
/**
 * Rebuild the shipped atlas metadata FROM the final artifacts (T1-11).
 *
 * One-off geometry fixes drifted three rivers.geojson properties away from the
 * delivered geometries (vertexCount ±1), and the topo manifest was written
 * before late tile additions (531 vs 1021 tiles, byte drift, 5 fully
 * transparent tiles that should never have been emitted). Instead of rerunning
 * the network-bound builders, this script makes the metadata describe what is
 * actually on disk:
 *
 *   1. rivers.geojson — recompute every feature's vertexCount (and bounds,
 *      tightened to the actual geometry) from the delivered coordinates.
 *   2. atlas/topo/manifest.json — drop fully-transparent hillshade tiles
 *      (all alpha 0 ⇒ no shadow signal), then regenerate tiles/bytes/band
 *      byte counts and the top-level total. Pinned contract fields
 *      (pattern, zooms, encoding, maxAlpha, mask) are preserved.
 *
 * Run after any artifact touch-up, then validate:
 *   node scripts/rebuild-manifests.mjs && node scripts/validate-atlas.mjs && node scripts/validate-topo.mjs
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const ATLAS = join(here, '..', 'public', 'atlas');
const TOPO = join(ATLAS, 'topo');

/* --------------------------------------------- rivers.geojson properties */

const riversPath = join(ATLAS, 'rivers.geojson');
const rivers = JSON.parse(readFileSync(riversPath, 'utf8'));

const countVerts = (node) =>
  Array.isArray(node) && typeof node[0] === 'number'
    ? 1
    : Array.isArray(node)
      ? node.reduce((n, c) => n + countVerts(c), 0)
      : 0;
const boundsOf = (geom) => {
  const b = [180, 90, -180, -90];
  const walk = (node) => {
    if (Array.isArray(node) && typeof node[0] === 'number') {
      const [x, y] = node;
      if (x < b[0]) b[0] = x;
      if (y < b[1]) b[1] = y;
      if (x > b[2]) b[2] = x;
      if (y > b[3]) b[3] = y;
      return;
    }
    if (Array.isArray(node)) for (const c of node) walk(c);
  };
  walk(geom.coordinates);
  return b;
};

let fixed = 0;
for (const f of rivers.features) {
  const p = f.properties ?? (f.properties = {});
  const verts = countVerts(f.geometry?.coordinates ?? []);
  const b = boundsOf(f.geometry ?? { coordinates: [] });
  const patch = {};
  if (p.vertexCount !== undefined && p.vertexCount !== verts) patch.vertexCount = verts;
  if (p.bounds && JSON.stringify(p.bounds) !== JSON.stringify(b)) patch.bounds = b;
  if (Object.keys(patch).length > 0) {
    fixed++;
    console.log(`rivers: ${p.id} — ${Object.entries(patch).map(([k, v]) => `${k} ${JSON.stringify(p[k])} → ${JSON.stringify(v)}`).join(', ')}`);
    Object.assign(p, patch);
  }
}
writeFileSync(riversPath, JSON.stringify(rivers));
console.log(`rivers.geojson: ${rivers.features.length} features checked, ${fixed} corrected`);

/* ------------------------------------------------ topo manifest + tiles */

const manifestPath = join(TOPO, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error('rebuild-manifests: topo manifest not found — run build-topo first.');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// Fully-transparent tiles carry no shadow signal (the builder should have
// skipped them): detect via a cheap decode of the alpha plane and remove them.
const hillDir = join(TOPO, 'hillshade');
const empty = [];
let tiles = 0;
let bytes = 0;
for (const z of readdirSync(hillDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const zDir = join(hillDir, z.name);
  for (const x of readdirSync(zDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const xDir = join(zDir, x.name);
    for (const yFile of readdirSync(xDir)) {
      const p = join(xDir, yFile);
      const { data } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
      let hasShadow = false;
      for (let o = 3; o < data.length; o += 4) {
        if (data[o] !== 0) {
          hasShadow = true;
          break;
        }
      }
      if (!hasShadow) {
        empty.push(`hillshade/${z.name}/${x.name}/${yFile}`);
        rmSync(p);
        continue;
      }
      tiles++;
      bytes += statSync(p).size;
    }
  }
}
for (const rel of empty) console.log(`topo: removed fully-transparent tile ${rel}`);

let bandBytes = 0;
for (const entry of manifest.bands) {
  entry.bytes = statSync(join(TOPO, entry.file)).size;
  bandBytes += entry.bytes;
}
manifest.hillshade.tiles = tiles;
manifest.hillshade.bytes = bytes;
manifest.bytes = bandBytes + bytes;
manifest.generated = new Date().toISOString();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`topo manifest: ${tiles} tiles · ${(bytes / 1048576).toFixed(2)} MB hillshade · bands ${(bandBytes / 1048576).toFixed(2)} MB · total ${(manifest.bytes / 1048576).toFixed(2)} MB`);
