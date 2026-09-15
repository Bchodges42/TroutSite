#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Regenerate apps/web/src/features/map/riverIndex.json from the CURRENT
 * public/atlas/rivers.geojson (GEO lane follow-up: the old index was derived
 * from the pre-audit geometry — stale zoom bounds for corrected reaches and
 * no entries for the 13 West TN point anchors).
 *
 * Mirror of the original derivation: anchor = labelAnchor (fallback: first
 * coordinate), bounds = properties.bounds. Run after every atlas rebuild:
 *   node apps/web/scripts/regenerate-river-index.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolveWebRoot();
const geoPath = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const outPath = join(webRoot, 'src', 'features', 'map', 'riverIndex.json');

function resolveWebRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

const gj = JSON.parse(readFileSync(geoPath, 'utf8'));
const index = gj.features.map((f) => {
  const { id, name, bounds, labelAnchor, waterbodyType, labelMinZoom } = f.properties;
  const c = f.geometry.coordinates;
  const first = Array.isArray(c[0][0]) ? c[0][0] : c[0];
  const anchor = labelAnchor ?? (f.geometry.type === 'Point' ? c : first);
  return {
    id,
    name,
    waterbodyType: waterbodyType ?? null,
    anchor,
    bounds: bounds ?? [anchor[0], anchor[1], anchor[0], anchor[1]],
    ...(labelMinZoom == null ? {} : { labelMinZoom }),
  };
});
index.sort((a, b) => a.id.localeCompare(b.id));

writeFileSync(outPath, JSON.stringify(index, null, 2) + '\n');
const points = gj.features.filter((f) => f.geometry.type === 'Point').length;
console.log(
  `riverIndex: ${index.length} entries (${gj.features.length - points} lines + ${points} point anchors) -> ${outPath}`,
);
