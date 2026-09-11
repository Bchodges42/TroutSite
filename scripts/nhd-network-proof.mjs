#!/usr/bin/env node
// nhd-network-proof.mjs — PROOF for the network-linework architecture
// (GEOVALID-2 consolidation, owner-directed exploration).
//
// Instead of per-water traced paths, render the NHD named network as-is:
// every named flowline intersecting a bbox, simplified, written as one
// GeoJSON layer the map can draw zoom-gated under the catalog rivers.
//
//   node scripts/nhd-network-proof.mjs \
//     --bbox -86.1,35.55,-85.0,36.30 --out apps/web/public/atlas/network-caneyfork.geojson
//
// Proof-only: no production wiring beyond the temporary map-style layer.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dpSimplify, lineLengthKm, roundCoords } from './nhd_lib.mjs';
import { collapseHairpins } from './nhd-validate-lib.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argOf = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const [x0, y0, x1, y1] = argOf('--bbox', '-86.1,35.55,-85.0,36.30').split(',').map(Number);
const tolM = Number(argOf('--simplify-m', '10'));
const outPath = path.resolve(
  repoRoot,
  argOf('--out', 'apps/web/public/atlas/network-caneyfork.geojson'),
);
const hu8Dir = path.join(repoRoot, 'data/nhd/hu8');

const inBbox = (lon, lat) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1;
const touches = (coords) => coords.some((line) => line.some(([lon, lat]) => inBbox(lon, lat)));

const features = [];
let units = 0;
for (const file of fs
  .readdirSync(hu8Dir)
  .filter((f) => f.endsWith('.jsonl'))
  .sort()) {
  const hu8 = file.replace('.jsonl', '');
  const lines = fs.readFileSync(path.join(hu8Dir, file), 'utf8').split('\n').filter(Boolean);
  let kept = 0;
  for (const line of lines) {
    const f = JSON.parse(line);
    if (!f.geometry?.coordinates || !touches(f.geometry.coordinates)) continue;
    const parts = f.geometry.coordinates
      .map((lineCoords) => collapseHairpins(roundCoords(dpSimplify(lineCoords, tolM), 5)).coords)
      .filter((lineCoords) => lineCoords.length >= 2);
    if (parts.length === 0) continue;
    features.push({
      type: 'Feature',
      properties: {
        kind: 'minor-water',
        name: f.properties.gnis_name ?? null,
        ftype: f.properties.ftype,
        lengthKm: Math.round(parts.reduce((s, p) => s + lineLengthKm(p), 0) * 100) / 100,
        hu8,
        pid: String(f.properties.permanent_identifier),
      },
      geometry: { type: 'MultiLineString', coordinates: parts },
    });
    kept++;
  }
  units++;
}

const totalKm = features.reduce((s, f) => s + f.properties.lengthKm, 0);
const payload = JSON.stringify({ type: 'FeatureCollection', features });
fs.writeFileSync(outPath, payload);
console.log(
  `network proof: ${features.length} named lines across ${units} unit files, ` +
    `${Math.round(totalKm)} km, ${Math.round(payload.length / 1024)} KB -> ${path.relative(repoRoot, outPath)}`,
);
