#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * EAST/SOUTHEAST rebuild — phase-2 connector fetch (port of the West/Middle
 * lane's west-middle-fetch-connectors.mjs idea): unnamed/non-network NHDPlus
 * HR flowline strands (layer 4, fcode 55800 artificial paths + short unnamed
 * 46006 pieces) around the tailwater dam clusters, where the named NETWORK
 * flowline stops short of the dam crest. The build attaches a connector only
 * when BOTH its endpoints join the already-kept chain — nothing is
 * fabricated; anything still unjoined is measured, not bridged.
 *
 * Cache: apps/web/.atlas-src/east-r2/connectors.json
 * Run: node scripts/east-fetch-connectors.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(webRoot, '.atlas-src', 'east-r2', 'connectors.json');
const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/4/query';
const FCODE_FL = '(fcode=46006 OR fcode=46003 OR fcode=55800 OR fcode=33400)';
const FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm';

// dam-connector windows (~±0.03°) around the tailwater dams whose named
// network reach can stop short of the crest (same dams the previous east
// lane's fillNear covered, plus the Little T dam chain)
const BOXES = [
  { dam: 'norris', env: [-84.12, 36.18, -84.04, 36.25] },
  { dam: 'melton-hill', env: [-84.34, 35.86, -84.26, 35.92] },
  { dam: 'south-holston', env: [-82.13, 36.49, -82.06, 36.56] },
  { dam: 'boone', env: [-82.47, 36.41, -82.4, 36.47] },
  { dam: 'ft-patrick-henry', env: [-82.54, 36.47, -82.48, 36.53] },
  { dam: 'wilbur', env: [-82.16, 36.31, -82.1, 36.38] },
  { dam: 'watauga', env: [-82.16, 36.3, -82.09, 36.36] },
  { dam: 'tellico', env: [-84.29, 35.76, -84.22, 35.82] },
  { dam: 'chilhowee', env: [-84.06, 35.53, -83.99, 35.59] },
  { dam: 'calderwood', env: [-83.98, 35.47, -83.91, 35.53] },
  { dam: 'douglas', env: [-83.57, 35.93, -83.51, 35.99] },
  { dam: 'parksville', env: [-84.69, 35.06, -84.62, 35.12] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function post(params, tries = 4) {
  const body = new URLSearchParams(params);
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(SVC, { method: 'POST', body, signal: AbortSignal.timeout(120000) });
      const text = await res.text();
      if (res.ok && text.startsWith('{')) return JSON.parse(text);
      console.log(`  retry ${i + 1}: http ${res.status} ${text.slice(0, 80)}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 100)}`);
    }
    await sleep(5000);
  }
  throw new Error('connector query failed');
}

mkdirSync(dirname(OUT), { recursive: true });
const feats = [];
const seen = new Set();
for (const b of BOXES) {
  const ids = [];
  let offset = 0;
  for (;;) {
    const j = await post({
      where: FCODE_FL,
      geometry: b.env.join(','), geometryType: 'esriGeometryEnvelope', inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: FIELDS, returnGeometry: 'false',
      resultOffset: offset, resultRecordCount: 2000, f: 'json',
    });
    if (j.error) throw new Error(`${b.dam}: ${JSON.stringify(j.error).slice(0, 150)}`);
    for (const f of j.features ?? []) {
      const id = String(f.attributes.OBJECTID);
      if (!seen.has(id)) { seen.add(id); ids.push(id); }
    }
    if ((j.features ?? []).length < 2000) break;
    offset += 2000;
    await sleep(300);
  }
  console.log(`${b.dam}: ${ids.length} candidate connector strands`);
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const j = await post({
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields: FIELDS, returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: '0.00005', f: 'geojson',
    });
    feats.push(...(j.features ?? []));
    await sleep(1200);
  }
  await sleep(800);
}
if (existsSync(OUT)) {
  const prev = JSON.parse(readFileSync(OUT, 'utf8'));
  const prevIds = new Set((prev.features ?? []).map((f) => String(f.properties?.OBJECTID)));
  for (const f of feats) if (!prevIds.has(String(f.properties?.OBJECTID))) prev.features.push(f);
  writeFileSync(OUT, JSON.stringify(prev));
  console.log(`connectors.json now holds ${(prev.features ?? []).length} strands`);
} else {
  writeFileSync(OUT, JSON.stringify({ retrieved: new Date().toISOString().slice(0, 10), service: SVC, features: feats }));
  console.log(`wrote ${feats.length} connector strands -> connectors.json`);
}
