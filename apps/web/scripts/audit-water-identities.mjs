#!/usr/bin/env node
/* global console, process */
/*
 * Identity/provenance gate for selectable waters.
 *
 * This is intentionally independent of the trace builder's in-memory output:
 * it reads YAML, the committed recipe, the emitted atlas, and the committed
 * raw graphs, then checks that the four layers still agree. The builder's
 * --check fingerprint is run twice to catch nondeterministic assembly.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from '../../../packages/content/node_modules/yaml/dist/index.js';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(webRoot, '..', '..');
const streamDir = join(repoRoot, 'packages', 'content', 'streams', 'tn');
const graphDir = join(repoRoot, 'data', 'nhd', 'graphs');
const atlas = JSON.parse(readFileSync(join(webRoot, 'public', 'atlas', 'rivers.geojson'), 'utf8'));
const recipeDocument = JSON.parse(readFileSync(join(webRoot, 'atlas-sources', 'selectable-water-traces.json'), 'utf8'));
const recipes = new Map(recipeDocument.traces.map((record) => [record.id, record]));
const features = new Map(atlas.features.map((feature) => [feature.properties.id, feature]));
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const normal = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const lineTypes = new Set(['river', 'creek', 'tailrace', 'spring']);

const streams = readdirSync(streamDir)
  .filter((file) => file.endsWith('.yaml'))
  .sort()
  .map((file) => YAML.parse(readFileSync(join(streamDir, file), 'utf8')))
  .filter((stream) => lineTypes.has(stream.waterbodyType));
const rawByPid = new Map();
const rawNames = new Map();
for (const file of readdirSync(graphDir).filter((name) => name.endsWith('.graph.json')).sort()) {
  const graph = JSON.parse(readFileSync(join(graphDir, file), 'utf8'));
  for (const edge of graph.edges) {
    const row = { graph, edge };
    const pid = String(edge.pid);
    if (!rawByPid.has(pid)) rawByPid.set(pid, []);
    rawByPid.get(pid).push(row);
    const name = normal(edge.name);
    if (!rawNames.has(name)) rawNames.set(name, new Set());
    rawNames.get(name).add(String(edge.gnisId ?? ''));
  }
}

function partsOf(feature) {
  if (feature.geometry.type === 'LineString') return [feature.geometry.coordinates];
  if (feature.geometry.type === 'MultiLineString') return feature.geometry.coordinates;
  return [];
}

function allCoordinates(feature) {
  return partsOf(feature).flat();
}

function sameArray(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function assertFiniteGeometry(id, feature) {
  const coords = allCoordinates(feature);
  if (coords.length < 2) fail(`${id}: emitted line has fewer than two coordinates`);
  for (const coordinate of coords) {
    if (!Array.isArray(coordinate) || coordinate.length < 2 || !coordinate.slice(0, 2).every(Number.isFinite)) {
      fail(`${id}: emitted geometry contains a non-finite coordinate`);
      break;
    }
  }
  const bounds = feature.properties.bounds;
  if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite)) {
    fail(`${id}: emitted bounds are invalid`);
    return;
  }
  for (const [lon, lat] of coords) {
    if (lon < bounds[0] - 1e-7 || lon > bounds[2] + 1e-7 || lat < bounds[1] - 1e-7 || lat > bounds[3] + 1e-7) {
      fail(`${id}: coordinate falls outside emitted bounds`);
      break;
    }
  }
}

function assertTopology(id, feature, recipe) {
  const routes = feature.properties.trace?.routes;
  if (!Array.isArray(routes) || !routes.length) {
    fail(`${id}: rebuilt NHD feature has no route edge audit`);
    return;
  }
  const owned = [];
  for (const route of routes) {
    if (!Array.isArray(route.permanentIdentifiers) || !route.permanentIdentifiers.length) {
      fail(`${id}: route has no permanent identifiers`);
      continue;
    }
    const rows = route.permanentIdentifiers.map((pid) => rawByPid.get(String(pid))?.find((row) => String(row.graph.meta.hu8) === String(route.hu8)));
    if (rows.some((row) => !row)) {
      fail(`${id}: route includes a permanent identifier absent from raw HUC ${route.hu8}`);
      continue;
    }
    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1].edge;
      const current = rows[index].edge;
      if (previous.to !== current.from) fail(`${id}: route walks backward or across an unproven node at ${previous.pid} -> ${current.pid}`);
    }
    // NHD occasionally contains a zero-length self-loop artifact. It is a
    // source reach, not a branch/cycle, so omit only that repeated node from
    // the cycle test while retaining the reach in ownership/provenance.
    const nodes = [rows[0].edge.from];
    for (const row of rows) if (row.edge.from !== row.edge.to) nodes.push(row.edge.to);
    if (new Set(nodes).size !== nodes.length) fail(`${id}: route repeats a topology node (cycle/side-branch walk)`);
    owned.push(...route.permanentIdentifiers.map(String));
  }
  if (!sameArray([...new Set(owned)].sort(), [...feature.properties.nhdPermanentIds].sort())) {
    fail(`${id}: route audit identifiers do not equal emitted nhdPermanentIds`);
  }
  if (!sameArray([...feature.properties.trace.seedPermanentIdentifiers].sort(), [...recipe.seedPermanentIdentifiers].sort())) {
    fail(`${id}: emitted trace seeds differ from selectable-water-traces.json`);
  }
}

// The catalog intentionally has several same-base-name families. County
// identity is mandatory for those families because TWRA stocking rows use
// the bare name plus county as their only reach discriminator.
const ambiguousBases = new Set(['cane creek', 'duck river', 'elk river', 'hurricane creek', 'piney river', 'salt lick creek', 'wolf river']);
const baseGroups = new Map();
for (const stream of streams) {
  const base = normal(stream.name.replace(/\([^)]*\)/g, ''));
  if (!baseGroups.has(base)) baseGroups.set(base, []);
  baseGroups.get(base).push(stream);
}
for (const [base, group] of baseGroups) {
  if (group.length < 2 && !ambiguousBases.has(base)) continue;
  for (const stream of group) {
    if (!stream.hydroIdentity?.counties?.length) fail(`${stream.id}: county identity required for ambiguous/stocked name family ${base}`);
  }
}

const ownership = new Map();
for (const stream of streams) {
  const id = stream.id;
  const identity = stream.hydroIdentity;
  const recipe = recipes.get(id);
  const feature = features.get(id);
  if (!identity) {
    fail(`${id}: missing hydroIdentity`);
    continue;
  }
  if (!recipe) {
    fail(`${id}: missing selectable-water trace recipe`);
    continue;
  }
  if (!feature) {
    fail(`${id}: missing atlas feature`);
    continue;
  }
  if (feature.properties.name !== stream.name) fail(`${id}: catalog/atlas name mismatch`);
  if (feature.properties.waterbodyType !== stream.waterbodyType) fail(`${id}: catalog/atlas waterbodyType mismatch`);
  assertFiniteGeometry(id, feature);

  if (feature.properties.traceMode === 'rebuilt') {
    const permanentIds = (feature.properties.nhdPermanentIds ?? []).map(String);
    if (!permanentIds.length) fail(`${id}: rebuilt NHD feature has no nhdPermanentIds`);
    if (new Set(permanentIds).size !== permanentIds.length) fail(`${id}: repeated permanent identifier in emitted feature`);
    for (const pid of permanentIds) {
      const rows = rawByPid.get(pid);
      if (!rows?.length) {
        fail(`${id}: emitted reach ${pid} is absent from raw NHD`);
        continue;
      }
      const row = rows.find((candidate) => identity.huc8s.map(String).includes(String(candidate.graph.meta.hu8))) ?? rows[0];
      const gnis = String(row.edge.gnisId ?? '');
      const allowedNames = new Set([normal(row.edge.name), ...recipe.allowedNameTransitions.map(normal)]);
      if (!identity.gnisIds.map(String).includes(gnis) && !recipe.allowedNameTransitions.map(normal).includes(normal(row.edge.name))) {
        fail(`${id}: unrelated GNIS ${gnis} (${row.edge.name}) is present without an allowed name transition`);
      }
      if (!identity.huc8s.map(String).includes(String(row.graph.meta.hu8))) fail(`${id}: emitted reach ${pid} is outside catalog HUC identity`);
      if (allowedNames.size === 0) fail(`${id}: empty name-allowance evaluation`);
      const owners = ownership.get(pid) ?? [];
      owners.push(id);
      ownership.set(pid, owners);
    }
    if ((feature.properties.nhdPlusIds ?? []).length) fail(`${id}: rebuilt feature mixes NHDPlus ids into nhdPermanentIds output`);
    if (feature.properties.source !== 'nhd' || feature.properties.geometrySource !== 'nhd') fail(`${id}: rebuilt feature is not marked source=nhd/geometrySource=nhd`);
    if (feature.properties.trace?.ordinaryWeldMaxM > 15) fail(`${id}: ordinary weld exceeds 15m`);
    const simplification = feature.properties.simplification;
    if (!simplification || simplification.algorithm !== 'Douglas-Peucker' || simplification.toleranceM > 50 || simplification.vertexCountAfter !== feature.properties.vertexCount || simplification.vertexCountBefore < simplification.vertexCountAfter) {
      fail(`${id}: geometry simplification audit is invalid`);
    }
    assertTopology(id, feature, recipe);
  }
}

for (const [pid, owners] of ownership) {
  if (owners.length < 2) continue;
  const exceptions = new Set(owners.flatMap((id) => recipes.get(id)?.allowedSharedReachIds ?? []));
  if (!owners.every(() => exceptions.has(pid))) fail(`raw reach ${pid} is owned by multiple features without allowedSharedReachIds: ${owners.join(', ')}`);
}

for (const [name, gnis] of rawNames) {
  if (gnis.size > 1) warnings.push(`raw NHD name ${JSON.stringify(name)} has ${gnis.size} GNIS ids; review against catalog identities`);
}

const builder = join(webRoot, 'scripts', 'build-selectable-water-traces.mjs');
const fingerprint = () => execFileSync(process.execPath, [builder, '--check'], { encoding: 'utf8' }).trim().split(/\s+/).at(-1);
const first = fingerprint();
const second = fingerprint();
if (!first || first !== second) fail(`trace builder is nondeterministic (${first} != ${second})`);

console.log(`water identities: ${streams.length} selectable line waters, ${recipes.size} recipes, ${errors.length} errors`);
for (const warning of warnings.slice(0, 12)) console.log(`review: ${warning}`);
if (warnings.length > 12) console.log(`review: ${warnings.length - 12} additional repeated-name groups omitted`);
if (errors.length) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exit(1);
}
console.log('audit-water-identities: PASS');
