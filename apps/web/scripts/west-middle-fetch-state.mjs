#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * WEST/MIDDLE lane — independent cross-check fetch from the Tennessee
 * waterways experience backing service ("RiversReservoirs", the layer behind
 * https://experience.arcgis.com/experience/f736acdf47ea44028420c5611291db5f —
 * TWRA boating/fishing map data; public GIS service of the State of TN).
 *
 * Caches:
 *   - tn reservoir polygons named for the West/Middle lakes (outSR 4326)
 *   - tn river arcs named for the West/Middle rivers (outSR 4326)
 * to apps/web/.atlas-src/west-middle/state-*.json for source-vs-delivered
 * area/length comparisons (independent verification source).
 *
 * Run: node scripts/west-middle-fetch-state.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(webRoot, '.atlas-src', 'west-middle');
const SVC = 'https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/RiversReservoirs/FeatureServer';
const RETRIEVED = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RESERVOIR_NAMES = [
  'Kentucky Lake', 'Pickwick Lake', 'Lake Barkley', 'Old Hickory Lake',
  'J. Percy Priest Reservoir', 'Tims Ford Reservoir', 'Center Hill Lake',
  'Dale Hollow Lake', 'Normandy Reservoir', 'Reelfoot Lake',
  'Woods Reservoir', 'Cheatham Lake', 'Cordell Hull Lake',
];

const RIVER_NAMES = [
  'Mississippi River', 'Obion River', 'Hatchie River', 'Wolf River',
  'Tennessee River', 'Cumberland River', 'Buffalo River', 'Harpeth River',
  'Duck River', 'Elk River', 'Caney Fork River', 'Stones River', 'Obey River',
  'Forked Deer River', 'North Fork Forked Deer River', 'South Fork Forked Deer River',
];

async function queryAll(layer, whereFn, page = 1000) {
  const out = [];
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({
      where: whereFn(offset), outFields: '*', returnGeometry: 'true',
      outSR: '4326', resultOffset: String(offset), resultRecordCount: String(page), f: 'geojson',
    });
    const res = await fetch(`${SVC}/${layer}/query?${params}`, { signal: AbortSignal.timeout(120000) });
    if (!res.ok) throw new Error(`http ${res.status} layer ${layer}`);
    const j = await res.json();
    if (j.error) throw new Error(`layer ${layer}: ${JSON.stringify(j.error)}`);
    const feats = j.features ?? [];
    out.push(...feats);
    if (feats.length < page) break;
    offset += page;
    await sleep(400);
  }
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });

const res = await queryAll(1, () => '1=1');
const wanted = new Set(RESERVOIR_NAMES.map((n) => n.toLowerCase()));
const resHits = res.filter((f) => wanted.has(String(f.properties?.NAME ?? '').toLowerCase().trim()));
writeFileSync(join(OUT_DIR, 'state-reservoirs.json'), JSON.stringify({
  key: 'state-reservoirs',
  service: `${SVC}/1/query`,
  itemName: 'RiversReservoirs (TN waterways experience boating/fishing map)',
  itemUrl: 'https://experience.arcgis.com/experience/f736acdf47ea44028420c5611291db5f',
  retrieved: RETRIEVED, features: resHits,
}));
console.log(`state reservoirs: ${resHits.length}/${RESERVOIR_NAMES.length} wanted of ${res.length} total`);

await sleep(1500);

const rivers = await queryAll(0, () => '1=1');
const byName = new Map();
for (const f of rivers) {
  const n = String(f.properties?.FENAME ?? '').trim();
  if (RIVER_NAMES.includes(n)) {
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(f);
  }
}
writeFileSync(join(OUT_DIR, 'state-rivers.json'), JSON.stringify({
  key: 'state-rivers',
  service: `${SVC}/0/query`,
  itemName: 'RiversReservoirs (TN waterways experience boating/fishing map)',
  itemUrl: 'https://experience.arcgis.com/experience/f736acdf47ea44028420c5611291db5f',
  retrieved: RETRIEVED, features: Object.fromEntries(byName),
}));
console.log(`state river arcs: ${[...byName.entries()].map(([n, v]) => `${n}:${v.length}`).join(', ')}`);
