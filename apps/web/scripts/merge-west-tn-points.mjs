#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Merge West TN put-and-take waters into public/atlas/rivers.geojson (step 5b
 * of the canonical atlas pipeline — run after merge-rivers.mjs, see
 * docs/atlas-sources.md).
 *
 * These waters are small impoundments/park ponds with NO NHD/TIGER linear
 * geometry, so they ship as Point anchors. Sources + certainty live in
 * packages/content/data/west-tn-ponds.json (first-party curated; see the "//"
 * note there for licensing/provenance). Idempotent: previously-merged points
 * (matched by id) are replaced, real river lines are never touched.
 *
 *   node apps/web/scripts/merge-west-tn-points.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '../..');
const riversPath = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const pondsPath = join(repoRoot, 'packages', 'content', 'data', 'west-tn-ponds.json');

const rivers = JSON.parse(readFileSync(riversPath, 'utf8'));
const { features: ponds, crs, coordinateOrder } = JSON.parse(readFileSync(pondsPath, 'utf8'));

const SOURCE_TAG = 'twra-winter-ponds';
const kept = rivers.features.filter(
  (f) => !(Array.isArray(f.properties?.source) && f.properties.source.includes(SOURCE_TAG)),
);

const pointFeatures = ponds.map((p) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
  properties: {
    id: p.id,
    name: p.name,
    regionId: 'tn-west',
    gaugeIds: [],
    waterbodyType: p.waterbodyType,
    species: 'trout',
    stockingProgram: true,
    idealFlow: [],
    coordinateCertainty: p.coordinateCertainty,
    notes: p.note,
    bounds: [p.lon, p.lat, p.lon, p.lat],
    labelAnchor: [p.lon, p.lat],
    source: [SOURCE_TAG, p.coordinateCertainty === 'osm-nominatim' ? 'osm-nominatim' : 'approx-town-anchor'],
    crs,
    coordinateOrder,
  },
}));

const merged = {
  ...rivers,
  features: [...kept, ...pointFeatures],
};

// Atomic-ish write: temp file in the same directory, then rename.
const tmp = join(mkdtempSync(join(tmpdir(), 'rivers-')), 'rivers.geojson');
writeFileSync(tmp, JSON.stringify(merged));
renameSync(tmp, riversPath);
console.log(
  `west-tn points: kept ${kept.length} features, merged ${pointFeatures.length} point anchors → ${riversPath}`,
);
