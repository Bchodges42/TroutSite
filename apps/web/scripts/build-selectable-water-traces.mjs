#!/usr/bin/env node
/* global console, process */
/*
 * Deterministic selectable-water trace builder.
 *
 * Identity is read from the YAML catalog. The trace recipe contains only
 * source reach seeds and reviewed boundary/name rules; it deliberately does
 * not duplicate GNIS/HUC identity. Raw NHD graph edges are walked in flow
 * direction, with the committed endpoint topology as the primary join and
 * no geometry bridge insertion. A disconnected source component remains a
 * separate MultiLineString part.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from '../../../packages/content/node_modules/yaml/dist/index.js';
import { bboxOf, dpSimplify, haversineM, lineLengthKm, roundCoords } from '../../../scripts/nhd_lib.mjs';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(webRoot, '..', '..');
const streamDir = join(repoRoot, 'packages', 'content', 'streams', 'tn');
const graphDir = join(repoRoot, 'data', 'nhd', 'graphs');
const atlasPath = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const recipePath = join(webRoot, 'atlas-sources', 'selectable-water-traces.json');
const additionsPath = join(webRoot, 'atlas-sources', 'selectable-river-additions.json');
const lineTypes = new Set(['river', 'creek', 'tailrace', 'spring']);
const rebuildIds = new Set([
  ...JSON.parse(readFileSync(additionsPath, 'utf8')).candidates.map((row) => row.id),
  'obion-river',
  'cane-creek',
  'cane-creek-hickman-perry',
]);
const simplifyToleranceM = 10;
const coordinateDecimals = 5;
const ordinaryWeldLimitM = 15;

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const uniqueSorted = (values) => [...new Set(values.map(String))].sort((a, b) => a.localeCompare(b));
const normal = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function loadStreams() {
  return readdirSync(streamDir)
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => ({ file, stream: YAML.parse(readFileSync(join(streamDir, file), 'utf8')) }));
}

function loadGraphs() {
  const graphs = new Map();
  const byPid = new Map();
  for (const file of readdirSync(graphDir).filter((name) => name.endsWith('.graph.json')).sort()) {
    const graph = readJson(join(graphDir, file));
    graph.edges = graph.edges.map((edge, index) => ({ ...edge, index }));
    const out = new Map();
    const incoming = new Map();
    const indexedGraph = { ...graph, out, incoming };
    for (const edge of graph.edges) {
      if (!out.has(edge.from)) out.set(edge.from, []);
      if (!incoming.has(edge.to)) incoming.set(edge.to, []);
      out.get(edge.from).push(edge.index);
      incoming.get(edge.to).push(edge.index);
      byPid.set(String(edge.pid), { graph: indexedGraph, edge });
    }
    graphs.set(graph.meta.hu8, indexedGraph);
  }
  return { graphs, byPid };
}

const atlas = readJson(atlasPath);
const atlasById = new Map(atlas.features.map((feature) => [feature.properties.id, feature]));
const additions = readJson(additionsPath).candidates;
const additionsById = new Map(additions.map((row) => [row.id, row]));
const { graphs, byPid } = loadGraphs();
const streams = loadStreams();

function rawEdgesFor(stream) {
  const identity = stream.hydroIdentity;
  if (!identity) throw new Error(`${stream.id}: missing hydroIdentity`);
  const allowedHucs = new Set(identity.huc8s.map(String));
  const exactGnis = new Set(identity.gnisIds.map(String));
  const candidate = additionsById.get(stream.id);
  const allowedNames = new Set((candidate?.nhdNames ?? []).map(normal));
  const rows = [];
  for (const [hu8, graph] of graphs) {
    if (!allowedHucs.has(String(hu8))) continue;
    for (const edge of graph.edges) {
      if (exactGnis.has(String(edge.gnisId)) || allowedNames.has(normal(edge.name))) {
        rows.push({ graph, edge, exact: exactGnis.has(String(edge.gnisId)) });
      }
    }
  }
  return { rows, exactGnis, allowedNames };
}

function connectedComponents(rows) {
  const byGraph = new Map();
  for (const row of rows) {
    if (!byGraph.has(row.graph.meta.hu8)) byGraph.set(row.graph.meta.hu8, []);
    byGraph.get(row.graph.meta.hu8).push(row.edge.index);
  }
  const components = [];
  for (const graph of graphs.values()) {
    const indexes = byGraph.get(graph.meta.hu8) ?? [];
    const allowed = new Set(indexes);
    const seen = new Set();
    const undirected = new Map();
    for (const index of indexes) {
      const edge = graph.edges[index];
      for (const node of [edge.from, edge.to]) {
        if (!undirected.has(node)) undirected.set(node, []);
        undirected.get(node).push(index);
      }
    }
    for (const start of indexes.sort((a, b) => String(graph.edges[a].pid).localeCompare(String(graph.edges[b].pid)))) {
      if (seen.has(start)) continue;
      const component = [];
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        const index = stack.pop();
        component.push(index);
        const edge = graph.edges[index];
        for (const node of [edge.from, edge.to]) {
          for (const next of undirected.get(node) ?? []) {
            if (!allowed.has(next) || seen.has(next)) continue;
            seen.add(next);
            stack.push(next);
          }
        }
      }
      components.push({ graph, indexes: component.sort((a, b) => String(graph.edges[a].pid).localeCompare(String(graph.edges[b].pid))) });
    }
  }
  return components;
}

function chooseSeeds(rows) {
  return connectedComponents(rows)
    .filter((component) => component.indexes.some((index) => rows.some((row) => row.graph === component.graph && row.edge.index === index && row.exact)))
    .map((component) => {
      const exact = component.indexes
        .map((index) => component.graph.edges[index])
        .filter((edge) => rows.some((row) => row.graph === component.graph && row.edge.index === edge.index && row.exact));
      exact.sort((a, b) => b.km - a.km || String(a.pid).localeCompare(String(b.pid)));
      return { graph: component.graph, index: exact[0].index };
    })
    .sort((a, b) => String(a.graph.meta.hu8).localeCompare(String(b.graph.meta.hu8)) || String(a.graph.edges[a.index].pid).localeCompare(String(b.graph.edges[b.index].pid)));
}

function remainingLength(graph, start, direction, allowed, memo = new Map(), visiting = new Set()) {
  const key = `${direction}:${start}`;
  if (memo.has(key)) return memo.get(key);
  if (visiting.has(key)) return 0;
  visiting.add(key);
  const edge = graph.edges[start];
  const candidates = direction === 'down' ? graph.out.get(edge.to) ?? [] : graph.incoming.get(edge.from) ?? [];
  let best = 0;
  for (const index of candidates) {
    if (!allowed.has(index)) continue;
    best = Math.max(best, graph.edges[index].km + remainingLength(graph, index, direction, allowed, memo, visiting));
  }
  visiting.delete(key);
  const result = edge.km + best;
  memo.set(key, result);
  return result;
}

function hasUsableVaa(graph) {
  return graph.edges.some((edge) => [
    edge.vaa?.hydroseq,
    edge.vaa?.uphydroseq,
    edge.vaa?.dnlevelpathid,
    edge.vaa?.dnminhydroseq,
  ].some((value) => Number.isFinite(Number(value)) && Number(value) !== 0));
}

function walk(graph, seed, direction, allowed, boundary) {
  const path = [seed];
  const visited = new Set([seed]);
  const memo = new Map();
  let current = seed;
  let reason = direction === 'up' ? 'headwater' : 'terminal-node';
  while (true) {
    const edge = graph.edges[current];
    const node = direction === 'down' ? edge.to : edge.from;
    const candidates = (direction === 'down' ? graph.out.get(node) ?? [] : graph.incoming.get(node) ?? [])
      .filter((index) => allowed.has(index) && !visited.has(index));
    if (!candidates.length) break;
    if (direction === 'up' && boundary.startsWith('dam:')) {
      const damName = normal(boundary.slice(4));
      const dam = candidates.find((index) => graph.edges[index].ftype === 558 && normal(graph.edges[index].name) === damName);
      if (dam !== undefined) {
        reason = 'dam';
        break;
      }
    }
    candidates.sort((a, b) => {
      const ea = graph.edges[a];
      const eb = graph.edges[b];
      return (normal(ea.name) === normal(edge.name) ? 0 : 1) - (normal(eb.name) === normal(edge.name) ? 0 : 1)
        || remainingLength(graph, b, direction, allowed, memo) - remainingLength(graph, a, direction, allowed, memo)
        || String(ea.pid).localeCompare(String(eb.pid));
    });
    current = candidates[0];
    visited.add(current);
    path.push(current);
  }
  return { path, reason };
}

function appendEdge(parts, coords, edge) {
  const source = edge.coords.map(([lon, lat]) => [lon, lat]);
  const last = coords.at(-1);
  const gapM = last ? haversineM(last, source[0]) : 0;
  if (!last || gapM <= ordinaryWeldLimitM) {
    coords.push(...(last && gapM <= ordinaryWeldLimitM ? source.slice(1) : source));
    return { gapM, welded: Boolean(last) };
  }
  if (coords.length >= 2) parts.push(coords);
  return { gapM, welded: false, next: source };
}

function assembleRoutes(routes) {
  const parts = [];
  let current = [];
  let maxWeldM = 0;
  for (const route of routes) {
    if (current.length >= 2) parts.push(current);
    current = [];
    for (const index of route.path) {
      const result = appendEdge(parts, current, route.graph.edges[index]);
      if (result.welded) maxWeldM = Math.max(maxWeldM, result.gapM);
      if (result.next) {
        if (current.length >= 2) parts.push(current);
        current = result.next;
      }
    }
  }
  if (current.length >= 2) parts.push(current);
  return { parts, maxWeldM };
}

function identitySeeds(stream) {
  const rows = rawEdgesFor(stream).rows;
  return chooseSeeds(rows).map(({ graph, index }) => String(graph.edges[index].pid));
}

function boundary(feature, direction) {
  const configured = feature?.properties?.trace?.[direction]?.spec;
  return typeof configured === 'string' && configured.length ? configured : direction === 'up' ? 'headwater' : 'mouth';
}

function recipeFor(stream, feature) {
  const candidate = additionsById.get(stream.id);
  const transitions = uniqueSorted((candidate?.nhdNames ?? []).filter((name) => normal(name) !== normal(stream.name)));
  return {
    id: stream.id,
    seedPermanentIdentifiers: identitySeeds(stream),
    upstreamBoundary: boundary(feature, 'up'),
    downstreamBoundary: boundary(feature, 'down'),
    allowedNameTransitions: transitions,
    allowedSharedReachIds: [],
    reviewNote: rebuildIds.has(stream.id)
      ? 'Rebuilt from committed raw NHD flowlines using GNIS/HUC identity and endpoint topology; disconnected NHD components remain visible gaps.'
      : 'Identity and deterministic raw-NHD seed recorded; existing reviewed geometry retained until its next trace refresh.',
  };
}

function displayTierFor(stream, feature) {
  const authored = stream.display ?? feature?.properties?.displayTier;
  if (authored === 'featured' || authored === 'standard' || authored === 'reference') return authored;
  const labelMinZoom = Number(
    additionsById.get(stream.id)?.labelMinZoom ?? feature?.properties?.labelMinZoom ?? 0,
  );
  return labelMinZoom >= 9 ? 'reference' : 'standard';
}

function makeTrace(stream, feature) {
  const raw = rawEdgesFor(stream);
  const recipes = recipeFor(stream, feature);
  if (!recipes.seedPermanentIdentifiers.length) return { recipe: recipes, feature };
  const routes = [];
  const used = new Set();
  for (const seedPid of recipes.seedPermanentIdentifiers) {
    const located = byPid.get(seedPid);
    if (!located || used.has(`${located.graph.meta.hu8}:${located.edge.index}`)) continue;
    const allowed = new Set(raw.rows.filter((row) => row.graph === located.graph).map((row) => row.edge.index));
    const up = walk(located.graph, located.edge.index, 'up', allowed, recipes.upstreamBoundary);
    const down = walk(located.graph, located.edge.index, 'down', allowed, recipes.downstreamBoundary);
    const sequence = [...up.path.reverse(), ...down.path.slice(1)];
    for (const index of sequence) used.add(`${located.graph.meta.hu8}:${index}`);
    routes.push({ graph: located.graph, path: sequence, up, down });
  }
  const assembled = assembleRoutes(routes);
  const before = assembled.parts.reduce((sum, part) => sum + part.length, 0);
  const parts = assembled.parts.map((part) => roundCoords(dpSimplify(part, simplifyToleranceM), coordinateDecimals));
  const coordinates = parts;
  const allCoords = parts.flat();
  const sourceIds = uniqueSorted(routes.flatMap((route) => route.path.map((index) => String(route.graph.edges[index].pid))));
  const existing = feature?.properties ?? {};
  const labelPart = parts.slice().sort((a, b) => b.length - a.length)[0] ?? [];
  const labelAnchor = labelPart[Math.floor(labelPart.length / 2)] ?? existing.labelAnchor ?? allCoords[0];
  const trace = {
    upstreamBoundary: recipes.upstreamBoundary,
    downstreamBoundary: recipes.downstreamBoundary,
    seedPermanentIdentifiers: recipes.seedPermanentIdentifiers,
    topology: routes.some((route) => hasUsableVaa(route.graph))
      ? 'hydroseq/downstream VAA where populated; snapped-endpoint graph otherwise'
      : 'snapped-endpoint graph; committed VAA has no usable hydroseq/downstream values',
    vaaUsed: routes.some((route) => hasUsableVaa(route.graph)),
    toleranceM: 12,
    ordinaryWeldMaxM: Number(assembled.maxWeldM.toFixed(3)),
    routeReasons: routes.map((route) => ({ hu8: route.graph.meta.hu8, up: route.up.reason, down: route.down.reason })),
    routes: routes.map((route) => ({
      hu8: route.graph.meta.hu8,
      permanentIdentifiers: route.path.map((index) => String(route.graph.edges[index].pid)),
    })),
  };
  const properties = {
    ...existing,
    id: stream.id,
    name: stream.name,
    displayTier: displayTierFor(stream, existing),
    waterbodyType: stream.waterbodyType,
    source: 'nhd',
    geometrySource: 'nhd',
    traceMode: 'rebuilt',
    approximate: false,
    sourceIds,
    nhdPermanentIds: sourceIds,
    nhdPlusIds: [],
    labelAnchor: labelAnchor.map((value) => Number(value.toFixed(5))),
    bounds: bboxOf(allCoords),
    lengthKm: Number(parts.reduce((sum, part) => sum + lineLengthKm(part), 0).toFixed(2)),
    partCount: parts.length,
    vertexCount: allCoords.length,
    crs: 'EPSG:4326',
    trace,
    simplification: {
      algorithm: 'Douglas-Peucker',
      toleranceM: simplifyToleranceM,
      coordinateDecimals,
      vertexCountBefore: before,
      vertexCountAfter: allCoords.length,
    },
  };
  return {
    recipe: recipes,
    feature: {
      type: 'Feature',
      properties,
      geometry: { type: 'MultiLineString', coordinates },
    },
  };
}

const recipes = [];
const builtFeatures = new Map();
const streamById = new Map(streams.map(({ stream }) => [stream.id, stream]));
const lineStreams = streams.filter(({ stream }) => lineTypes.has(stream.waterbodyType));
for (const { stream } of lineStreams.sort((a, b) => a.stream.id.localeCompare(b.stream.id))) {
  const existing = atlasById.get(stream.id);
  const result = makeTrace(stream, existing);
  recipes.push(result.recipe);
  if (rebuildIds.has(stream.id) && result.feature !== existing) builtFeatures.set(stream.id, result.feature);
}

for (const feature of atlas.features) {
  const id = feature.properties.id;
  const replacement = builtFeatures.get(id);
  if (replacement) continue;
  const stream = streamById.get(id);
  if (!stream) continue;
  feature.properties.displayTier = displayTierFor(stream, feature);
  if (!lineTypes.has(feature.properties.waterbodyType)) continue;
  const rawIds = (feature.properties.sourceIds ?? []).map(String).filter((id) => byPid.has(id));
  feature.properties.nhdPermanentIds ??= [];
  feature.properties.nhdPlusIds ??= uniqueSorted((feature.properties.sourceIds ?? []).map(String).filter((id) => !byPid.has(id)));
  if (rawIds.length && !feature.properties.nhdPermanentIds.length) feature.properties.nhdPermanentIds = rawIds;
}

for (const [id, feature] of builtFeatures) {
  const index = atlas.features.findIndex((row) => row.properties.id === id);
  if (index >= 0) atlas.features[index] = feature;
  else atlas.features.push(feature);
}
atlas.features.sort((a, b) => String(a.properties.id).localeCompare(String(b.properties.id)));
recipes.sort((a, b) => a.id.localeCompare(b.id));
const recipeDocument = {
  schema: 'trout/selectable-water-traces/1',
  generated: '2026-09-16',
  source: 'USGS NHDPlus HR NetworkNHDFlowline committed graph topology',
  rules: {
    identity: 'packages/content/streams/tn/*.yaml hydroIdentity',
    direction: 'downstream graph edge orientation; upstream/downstream boundary stops are explicit per record',
    ordinaryWeldMaxM: ordinaryWeldLimitM,
    syntheticConnectors: false,
  },
  traces: recipes,
};
const output = JSON.stringify({ atlas, recipeDocument });
const fingerprint = createHash('sha256').update(output).digest('hex');
if (process.argv.includes('--check')) {
  console.log(`selectable-water-traces: ${recipes.length} recipes, ${builtFeatures.size} rebuilt features, fingerprint ${fingerprint}`);
} else {
  writeFileSync(atlasPath, JSON.stringify(atlas) + '\n');
  writeFileSync(recipePath, JSON.stringify(recipeDocument, null, 2) + '\n');
  console.log(`selectable-water-traces: ${recipes.length} recipes, ${builtFeatures.size} rebuilt features -> ${recipePath}`);
  console.log(`fingerprint: ${fingerprint}`);
}
