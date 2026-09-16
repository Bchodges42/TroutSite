#!/usr/bin/env node
/* global console, process */
/**
 * One-time, reproducible migration of line-water hydrography identity.
 *
 * The YAML catalog remains the source of truth. GNIS values come first from
 * the reviewed selectable-river manifest, then from the existing atlas trace,
 * then from the permanent identifiers already present in the NHD graphs.
 * HUC8 values are taken from those same graph reaches and the research ledger.
 * Run with --write after reviewing the report.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from '../packages/content/node_modules/yaml/dist/index.js';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:');
const STREAM_DIR = join(ROOT, 'packages/content/streams/tn');
const GRAPH_DIR = join(ROOT, 'data/nhd/graphs');
const ATLAS = JSON.parse(readFileSync(join(ROOT, 'apps/web/public/atlas/rivers.geojson'), 'utf8'));
const ADDITIONS = JSON.parse(readFileSync(join(ROOT, 'apps/web/atlas-sources/selectable-river-additions.json'), 'utf8')).candidates;
const LEDGER = JSON.parse(readFileSync(join(ROOT, 'docs/research/2026-09-15-wave-ledgers/ledger/waters.json'), 'utf8')).waters;

const LINE_TYPES = new Set(['river', 'creek', 'tailrace', 'spring']);
const HUC_OVERRIDES = { 'conasauga-river': '06020002' };
const GNIS_OVERRIDES = { 'richardson-byrd-creek': ['01299343', '01299344', '01269411'] };
const COUNTY_OVERRIDES = {
  'richardson-byrd-creek': ['Hancock'],
  'cane-creek': ['Bledsoe', 'Van Buren'],
  'cane-creek-hickman-perry': ['Hickman', 'Perry'],
  'hurricane-creek': ['Houston', 'Humphreys'],
};
const RECEIVING_WATER_OVERRIDES = {
  'cane-creek': 'Caney Fork River',
  'cane-creek-hickman-perry': 'Buffalo River',
};

function normal(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/gi, '')
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b));
}

function readGraphs() {
  const byPid = new Map();
  const byGnis = new Map();
  const byName = new Map();
  for (const file of readdirSync(GRAPH_DIR).filter((name) => name.endsWith('.json')).sort()) {
    const graph = JSON.parse(readFileSync(join(GRAPH_DIR, file), 'utf8'));
    for (const edge of graph.edges) {
      const row = { ...edge, hu8: graph.meta.hu8 };
      byPid.set(String(edge.pid), row);
      if (edge.gnisId) {
        if (!byGnis.has(String(edge.gnisId))) byGnis.set(String(edge.gnisId), []);
        byGnis.get(String(edge.gnisId)).push(row);
      }
      const key = normal(edge.name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(row);
    }
  }
  return { byPid, byGnis, byName };
}

const graphs = readGraphs();
const atlasById = new Map(ATLAS.features.map((feature) => [feature.properties.id, feature.properties]));
const additionsById = new Map(ADDITIONS.map((candidate) => [candidate.id, candidate]));
const ledgerById = new Map(LEDGER.map((row) => [row.slug, row]));

function identityFor(stream) {
  const atlas = atlasById.get(stream.id) ?? {};
  const addition = additionsById.get(stream.id) ?? {};
  const ledger = ledgerById.get(stream.id)?.identity ?? {};
  const atlasIds = Array.isArray(atlas.sourceIds) ? atlas.sourceIds.map(String) : [];
  const advertisedGnis = [...(atlas.gnisIds ?? []), ...(addition.gnisIds ?? [])].map(String);
  const sourceRows = atlasIds.map((pid) => graphs.byPid.get(pid)).filter(Boolean);
  const sourceGnis = sourceRows.map((row) => row.gnisId).filter(Boolean).map(String);
  let gnisIds = unique([...advertisedGnis, ...sourceGnis, ...(GNIS_OVERRIDES[stream.id] ?? [])]);
  let huc8s = unique([
    ...sourceRows.map((row) => row.hu8),
    ...(Array.isArray(ledger.huc8) ? ledger.huc8 : [ledger.huc8]),
    HUC_OVERRIDES[stream.id],
  ]);

  // For older TIGER or point-seeded traces, recover exact named NHD identity
  // inside the ledger HUC before falling back to the reviewed manifest GNIS.
  const coreName = normal(stream.name.replace(/\([^)]*\)/g, '').replace(/tailwater|reach|system/gi, ''));
  const namedRows = (graphs.byName.get(coreName) ?? []).filter((row) => !huc8s.length || huc8s.includes(row.hu8));
  if (!gnisIds.length && namedRows.length) gnisIds = unique(namedRows.map((row) => row.gnisId));
  if (!huc8s.length && gnisIds.length) huc8s = unique(gnisIds.flatMap((gnis) => (graphs.byGnis.get(gnis) ?? []).map((row) => row.hu8)));

  // The Conasauga TN reach is a documented TIGER fallback; its NHD graph is
  // named Conasauga Creek and carries a different GNIS feature id.
  if (stream.id === 'conasauga-river') {
    gnisIds = ['00327507'];
    huc8s = ['06020002'];
  }
  if (!gnisIds.length || !huc8s.length) {
    throw new Error(`${stream.id}: could not infer GNIS/HUC8 (gnis=${gnisIds.join(',')} huc8=${huc8s.join(',')})`);
  }

  const counties = unique([
    ...(Array.isArray(ledger.county) ? ledger.county : [ledger.county]),
    ...(stream.name.match(/\(([^)]*County[^)]*)\)/i)?.[1]?.split(/[/,&]/g) ?? []),
    ...(COUNTY_OVERRIDES[stream.id] ?? []),
  ].filter(Boolean).flatMap((county) => String(county).split(/\s+and\s+|[/,&]/gi))
    .map((county) => county.replace(/\s+County$/i, '').trim())
    .filter((county) => county && !/smokies|station in|reaches/i.test(county)));
  const identity = { gnisIds, huc8s };
  if (counties.length) identity.counties = counties;
  if (RECEIVING_WATER_OVERRIDES[stream.id]) identity.receivingWater = RECEIVING_WATER_OVERRIDES[stream.id];
  return identity;
}

const files = readdirSync(STREAM_DIR).filter((name) => name.endsWith('.yaml')).sort();
let changed = 0;
for (const file of files) {
  const path = join(STREAM_DIR, file);
  const source = readFileSync(path, 'utf8');
  const stream = YAML.parse(source);
  if (!LINE_TYPES.has(stream.waterbodyType)) continue;
  const identity = identityFor(stream);
  const existing = stream.hydroIdentity;
  const same = JSON.stringify(existing) === JSON.stringify(identity);
  console.log(`${stream.id}\tGNIS ${identity.gnisIds.join(',')}\tHUC8 ${identity.huc8s.join(',')}${identity.counties ? `\tcounties ${identity.counties.join(',')}` : ''}${same ? '\tunchanged' : ''}`);
  if (process.argv.includes('--write') && !same) {
    const block = [
      'hydroIdentity:',
      `  gnisIds: [${identity.gnisIds.map((value) => JSON.stringify(value)).join(', ')}]`,
      `  huc8s: [${identity.huc8s.map((value) => JSON.stringify(value)).join(', ')}]`,
      ...(identity.counties ? [`  counties: [${identity.counties.map((value) => JSON.stringify(value)).join(', ')}]`] : []),
      ...(identity.receivingWater ? [`  receivingWater: ${JSON.stringify(identity.receivingWater)}`] : []),
      '',
    ].join('\n');
    const withoutIdentity = source.replace(/\nhydroIdentity:\n(?:  .*\n)+(?=\n|$)/, '\n');
    writeFileSync(path, `${withoutIdentity.trimEnd()}\n${block}`);
    changed += 1;
  }
}
if (process.argv.includes('--write')) console.log(`wrote ${changed} line-water identity blocks`);
