#!/usr/bin/env node
/**
 * Audit first-class catalog waters against Tennessee's local TIGER/Line
 * hydrography, with an optional NHD identity/order probe for curated candidates.
 *
 * Run from apps/web after fetch-atlas-sources.mjs has populated .atlas-src:
 *   node scripts/audit-selectable-rivers.mjs
 *   node scripts/audit-selectable-rivers.mjs --nhd
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open as openShape } from 'shapefile';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..', '..');
const nhd = process.argv.includes('--nhd');

const CANDIDATES = [
  ['forked-deer-river', 'Forked Deer River', '-89.8,35.75,-88.3,36.2'],
  ['south-fork-forked-deer-river', 'South Fork Forked Deer River', '-89.2,35.3,-88.4,35.9'],
  ['north-fork-forked-deer-river', 'North Fork Forked Deer River', '-89.7,35.4,-88.3,36.2'],
  ['middle-fork-forked-deer-river', 'Middle Fork Forked Deer River', '-89.8,35.5,-88.3,36.2'],
  ['rutherford-fork-obion-river', 'Rutherford Fork Obion River', '-89.2,35.7,-88.3,36.4'],
  ['north-fork-obion-river', 'North Fork Obion River', '-89.2,36.2,-88.3,36.7'],
  ['middle-fork-obion-river', 'Middle Fork Obion River', '-89.1,36.0,-88.1,36.5'],
  ['south-fork-obion-river', 'South Fork Obion River', '-89.2,35.8,-88.3,36.4'],
  [
    'loosahatchie-river',
    'Loosahatchie River',
    '-90.2,35.1,-89.2,35.5',
    ['Loosahatchie River Canal', 'Loosahatchie River Drainage Canal'],
  ],
  ['big-sandy-river', 'Big Sandy River', '-88.7,35.5,-87.9,36.5'],
  ['beech-river', 'Beech River', '-88.7,35.4,-87.9,35.9'],
  ['tuscumbia-river', 'Tuscumbia River', '-88.7,34.9,-87.8,35.3'],
  ['nonconnah-creek', 'Nonconnah Creek', '-90.2,34.9,-89.4,35.2'],
  ['falling-water-river', 'Falling Water River', '-85.8,35.9,-85.1,36.3'],
  ['blackburn-fork', 'Blackburn Fork', '-85.8,36.1,-85.3,36.5'],
  ['roaring-river', 'Roaring River', '-85.8,36.1,-85.1,36.6'],
  ['east-fork-obey-river', 'East Fork Obey River', '-85.4,36.0,-84.8,36.6'],
  ['west-fork-obey-river', 'West Fork Obey River', '-85.4,36.0,-84.9,36.6'],
  ['piney-river-hickman', 'Piney River', '-87.8,35.5,-87.2,36.2'],
  ['richland-creek-maury', 'Richland Creek', '-87.3,35.1,-86.7,35.8'],
  ['big-swan-creek', 'Big Swan Creek', '-87.7,35.3,-87.1,36.0'],
  ['big-bigby-creek', 'Big Bigby Creek', '-87.6,35.2,-86.9,35.9'],
  ['west-harpeth-river', 'West Harpeth River', '-87.1,35.7,-86.5,36.2'],
  ['little-harpeth-river', 'Little Harpeth River', '-87.1,35.7,-86.5,36.2'],
  ['yellow-creek-houston', 'Yellow Creek', '-87.8,36.0,-87.2,36.6'],
  ['south-chickamauga-creek', 'South Chickamauga Creek', '-85.5,34.9,-84.9,35.4'],
  ['conasauga-river', 'Conasauga River', '-84.9,34.8,-84.2,35.4'],
  ['chestuee-creek', 'Chestuee Creek', '-84.9,35.0,-84.1,35.7'],
  ['oostanaula-creek', 'Oostanaula Creek', '-85.0,35.0,-84.2,35.7'],
  ['north-mouse-creek', 'North Mouse Creek', '-85.0,35.1,-84.2,35.8'],
  ['south-mouse-creek', 'South Mouse Creek', '-85.0,35.0,-84.3,35.7'],
  ['candies-creek', 'Candies Creek', '-85.2,34.9,-84.6,35.5'],
  ['big-sewee-creek', 'Big Sewee Creek', '-85.0,35.3,-84.3,35.9'],
  ['big-soddy-creek', 'Big Soddy Creek', '-85.5,35.1,-84.9,35.5', ['Soddy Creek']],
  ['sale-creek', 'Sale Creek', '-85.5,35.2,-84.9,35.7'],
  [
    'little-chuckey-creek',
    'Little Chuckey Creek',
    '-83.4,35.9,-82.6,36.5',
    ['Little Chucky Creek'],
  ],
  ['bullrun-creek', 'Bullrun Creek', '-84.4,35.8,-83.5,36.5'],
  ['dumplin-creek', 'Dumplin Creek', '-83.9,35.7,-83.2,36.4'],
  ['paint-creek-greene', 'Paint Creek', '-83.2,35.7,-82.5,36.4'],
  ['brimstone-creek', 'Brimstone Creek', '-84.8,36.0,-84.2,36.7'],
  ['crab-orchard-creek', 'Crab Orchard Creek', '-85.0,35.7,-84.3,36.3'],
];

const WORD = {
  RIV: 'RIVER',
  R: 'RIVER',
  CRK: 'CREEK',
  CR: 'CREEK',
  FRK: 'FORK',
  FK: 'FORK',
  BR: 'BRANCH',
  E: 'EAST',
  W: 'WEST',
  N: 'NORTH',
  S: 'SOUTH',
};
const normalize = (value) =>
  String(value ?? '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((word) => WORD[word] ?? word)
    .join(' ');
const radians = (degrees) => (degrees * Math.PI) / 180;
function lengthKm(line) {
  let total = 0;
  for (let index = 1; index < line.length; index++) {
    const a = line[index - 1],
      b = line[index];
    const dLat = radians(b[1] - a[1]),
      dLon = radians(b[0] - a[0]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
    total += 12742 * Math.asin(Math.sqrt(h));
  }
  return total;
}

async function tigerInventory() {
  const inventory = new Map();
  const shapeDir = join(webRoot, '.atlas-src', 'shp');
  for (const file of readdirSync(shapeDir).filter((name) => name.endsWith('.shp'))) {
    const source = await openShape(join(shapeDir, file));
    for (;;) {
      const row = await source.read();
      if (row.done) break;
      const name = normalize(row.value.properties.FULLNAME);
      if (!name) continue;
      const lines =
        row.value.geometry.type === 'LineString'
          ? [row.value.geometry.coordinates]
          : row.value.geometry.type === 'MultiLineString'
            ? row.value.geometry.coordinates
            : [];
      const record = inventory.get(name) ?? { lines: [], signatures: new Set() };
      for (const line of lines) {
        const forward = line.map((point) => point.join(',')).join(';');
        const reverse = [...line]
          .reverse()
          .map((point) => point.join(','))
          .join(';');
        const signature = forward < reverse ? forward : reverse;
        if (record.signatures.has(signature)) continue;
        record.signatures.add(signature);
        record.lines.push(line);
      }
      inventory.set(name, record);
    }
  }
  return inventory;
}

const distanceKm = (a, b) => {
  const dLat = radians(b[1] - a[1]),
    dLon = radians(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

function summarizeTiger(inventory, names, envelope) {
  const [west, south, east, north] = envelope.split(',').map(Number);
  const lines = names
    .flatMap((name) => inventory.get(normalize(name))?.lines ?? [])
    .filter((line) => line.some(([x, y]) => x >= west && x <= east && y >= south && y <= north));
  const parents = lines.map((_, index) => index);
  const find = (index) =>
    parents[index] === index ? index : (parents[index] = find(parents[index]));
  const unite = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parents[b] = a;
  };
  const ends = lines.map((line) => [line[0], line.at(-1)]);
  for (let a = 0; a < lines.length; a++)
    for (let b = a + 1; b < lines.length; b++) {
      if (ends[a].some((left) => ends[b].some((right) => distanceKm(left, right) <= 1)))
        unite(a, b);
    }
  const groups = new Map();
  for (let index = 0; index < lines.length; index++) {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), index]);
  }
  const chunks = [...groups.values()];
  const gaps = [];
  for (let a = 0; a < chunks.length; a++)
    for (let b = a + 1; b < chunks.length; b++) {
      let nearest = Infinity;
      for (const left of chunks[a])
        for (const right of chunks[b])
          for (const x of ends[left])
            for (const y of ends[right]) {
              nearest = Math.min(nearest, distanceKm(x, y));
            }
      gaps.push(nearest);
    }
  return {
    lengthKm: +lines.reduce((sum, line) => sum + lengthKm(line), 0).toFixed(1),
    segmentCount: lines.length,
    chunks: chunks.length,
    largestGapKm: gaps.length ? +Math.max(...gaps).toFixed(2) : 0,
  };
}

async function nhdIdentity([id, name, envelope, queryNames = [name]]) {
  const url = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/3/query';
  const params = new URLSearchParams({
    where: `(fcode=46006 OR fcode=46003 OR fcode=55800) AND (${queryNames.map((queryName) => `gnis_name='${queryName.replaceAll("'", "''")}'`).join(' OR ')})`,
    geometry: envelope,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde',
    returnGeometry: 'false',
    resultRecordCount: '2000',
    f: 'json',
  });
  const response = await fetch(url, {
    method: 'POST',
    body: params,
    signal: AbortSignal.timeout(120_000),
  });
  const json = await response.json();
  if (json.error) throw new Error(`${id}: ${JSON.stringify(json.error)}`);
  const identities = new Map();
  for (const feature of json.features ?? []) {
    const attributes = feature.attributes;
    const record = identities.get(attributes.gnis_id) ?? {
      gnisId: attributes.gnis_id,
      lengthKm: 0,
      maxOrder: 0,
      reaches: 0,
    };
    record.lengthKm += attributes.lengthkm ?? 0;
    record.maxOrder = Math.max(record.maxOrder, attributes.streamorde ?? 0);
    record.reaches += 1;
    identities.set(attributes.gnis_id, record);
  }
  return { id, name, envelope, identities: [...identities.values()] };
}

const catalogDir = join(repoRoot, 'packages', 'content', 'streams', 'tn');
const catalogText = readdirSync(catalogDir)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => readFileSync(join(catalogDir, name), 'utf8'))
  .join('\n');
const atlas = JSON.parse(readFileSync(join(webRoot, 'public', 'atlas', 'rivers.geojson'), 'utf8'));
const catalogIds = new Set(
  [...catalogText.matchAll(/^id:\s*(.+)$/gm)].map((match) => match[1].trim()),
);
const atlasIds = new Set(atlas.features.map((feature) => feature.properties.id));
const tiger = await tigerInventory();

const rows = CANDIDATES.map(([id, name, envelope, aliases = []]) => ({
  id,
  name,
  envelope,
  catalog: catalogIds.has(id),
  geometry: atlasIds.has(id),
  tiger: summarizeTiger(tiger, [name, ...aliases], envelope),
}));

if (nhd) {
  const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7);
  const candidates = only ? CANDIDATES.filter(([id]) => only.split(',').includes(id)) : CANDIDATES;
  for (let offset = 0; offset < candidates.length; offset += 8) {
    const batch = await Promise.all(candidates.slice(offset, offset + 8).map(nhdIdentity));
    for (const identity of batch)
      Object.assign(
        rows.find((row) => row.id === identity.id),
        { nhd: identity.identities },
      );
  }
}

console.log(
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      catalogCount: catalogIds.size,
      atlasCount: atlasIds.size,
      candidates: rows,
    },
    null,
    2,
  ),
);
