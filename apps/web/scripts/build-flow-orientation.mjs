#!/usr/bin/env node
/* global console */
/**
 * build-flow-orientation.mjs — deterministic downstream-orientation generator.
 *
 * Reads:
 *   - apps/web/public/atlas/rivers.geojson   (canonical geometry, 147 features)
 *   - apps/web/atlas-sources/verified/*.topology.json  (dam anchors, verified
 *     in/out edges — REGION TOPOLOGY RECORDS)
 * Writes:
 *   - apps/web/src/features/map/flowOrientation.json
 *     { generated, source, derivation, stats, waters: { <id>: { parts: [1|-1|0...], confidence } } }
 *
 * WHY: flow direction must derive from topology, never from vertex order (the
 * Duck River's stored vertex order is provably wrong — teleports) and never
 * from hand assignment. See docs/flow-orientation.md for the full derivation
 * contract; `flow-orientation-core.mjs` holds the pure logic and its tests.
 *
 * Run from the repo root or apps/web:
 *   node apps/web/scripts/build-flow-orientation.mjs
 * The output is committed — it is a source-tracked artifact like
 * riverIndex.json (no app runtime dependency on the script).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deriveFlowOrientation } from './flow-orientation-core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const geoPath = resolve(webRoot, 'public/atlas/rivers.geojson');
const topoPaths = [
  resolve(webRoot, 'atlas-sources/verified/west-middle.topology.json'),
  resolve(webRoot, 'atlas-sources/verified/east-southeast.topology.json'),
];
const outPath = resolve(webRoot, 'src/features/map/flowOrientation.json');

const fc = JSON.parse(readFileSync(geoPath, 'utf8'));
const topologyRecords = topoPaths.flatMap((p) => JSON.parse(readFileSync(p, 'utf8')).records ?? []);

const { waters, stats } = deriveFlowOrientation({ features: fc.features, topologyRecords });

const payload = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'topology+confluence-graph',
  inputs: {
    geometry: 'public/atlas/rivers.geojson',
    topology: [
      'atlas-sources/verified/west-middle.topology.json',
      'atlas-sources/verified/east-southeast.topology.json',
    ],
  },
  derivation:
    'Downstream orientation per water and per geometry part, derived ONLY from ' +
    'verified data — never from vertex order and never by hand. Priority: ' +
    '(a) verified topology records: upstream/downstreamFeatureIds edges accepted ' +
    'only when a feature endpoint lies within 900 m of the referenced water (ids ' +
    'normalized by stripping "(prose)" suffixes); dam anchors — every dammed LINE ' +
    'water in the atlas is the reach BELOW its dam, so the dam end is upstream; ' +
    'termini mouth/confluence anchors; (b) lake in/out: throughLakeIds endpoints ' +
    'INSIDE the lake polygon are where the water joins the pool (downstream end, ' +
    'flow exits toward the dam/outlet side); when both ends lie outside, the end ' +
    'nearer the through-lake dam is downstream; ' +
    '(c) confluence graph over ~50 m endpoint snaps: BFS hop-distance from the ' +
    'mississippi-river anchor (Cumberland and Tennessee main stems chain to it) ' +
    'ranks waters; a touched neighbor with smaller distance is the recipient; ' +
    '(d) 2-way part-junction chaining within a feature (3+ way junctions never ' +
    'propagate). Confidence: high = topology/dam/lake/termini evidence, ' +
    'medium = confluence-graph or chain evidence, low = unoriented. ' +
    'flags: 1 = stored coordinate order flows downstream, -1 = reversed, ' +
    '0 = UNORIENTED (unknown-safe: renderers must draw no arrows for that part).',
  stats,
  waters,
};

writeFileSync(outPath, JSON.stringify(payload, null, 1) + '\n');

const unoriented = Object.entries(waters)
  .filter(([, v]) => v.confidence === 'low')
  .map(([id]) => id);
console.log(
  `flowOrientation.json: ${stats.lineFeatures} line waters, ${stats.orientedParts}/${stats.parts} parts oriented`,
);
console.log(`confidence: high=${stats.high} medium=${stats.medium} low=${stats.low}`);
console.log(`methods: ${JSON.stringify(stats.byMethod)}`);
console.log(`unoriented (${unoriented.length}): ${unoriented.join(', ') || 'none'}`);
