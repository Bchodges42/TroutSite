#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * WEST/MIDDLE lane — phase-2 connector fetch.
 *
 * NHD names rivers per segment; the unnamed fcode-55800 artificial-path and
 * connector segments that carry a named river across a dam pool or through a
 * braided reach are NOT retrieved by name-keyed discovery. This pass reads
 * the measured endpoint gaps from the build log and fetches the unnamed
 * connector candidates in a small box around each gap.
 *
 * Output: .atlas-src/west-middle/connectors.json — raw candidates; the build
 * attaches only those whose endpoints join the selected chain (whole-part
 * discipline still applies).
 *
 * Run: node scripts/west-middle-fetch-connectors.mjs   (after west-middle-build.mjs)
 */
import { readFileSync, writeFileSync, _existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(webRoot, '.atlas-src', 'west-middle');
const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const LOG = join(CACHE, 'build-log.json');
const OUT = join(CACHE, 'connectors.json');
const SLEEP = 1200;
const BOX = 0.07; // gap box half-width in degrees (~7.5 km)
const RETRIEVED = new Date().toISOString().slice(0, 10);

const log = JSON.parse(readFileSync(LOG, 'utf8'));
const gapSites = new Map(); // key -> [lon,lat]
for (const e of log) {
  if (e.largestGapM != null && e.gapAt) gapSites.set(e.id, e.gapAt);
}
// terminus anchor boxes: named chains stop short of these authoritative
// points (mouths / urban reaches); unnamed NHD carriers may bridge them
const ANCHOR_BOXES = [
  ['duck-river-lower@columbia', -87.03234, 35.61809],
  ['red-river-clarksville@named-west-end', -87.372, 36.5382],
  ['wolf-river-west-tennessee@mouth', -90.062, 35.179],
  ['obion-river@mouth', -89.6876, 35.8904],
  ['hatchie-river@mouth', -89.8622, 35.5851],
];
for (const [id, lon, lat] of ANCHOR_BOXES) {
  if (!gapSites.has(id)) gapSites.set(id, [lon, lat]);
}
console.log(`gap sites: ${gapSites.size}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function post(params, layer = 3, tries = 4) {
  const body = new URLSearchParams(params);
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${SVC}/${layer}/query`, { method: 'POST', body, signal: AbortSignal.timeout(120000) });
      const text = await res.text();
      if (res.ok && (text.startsWith('{') || text.startsWith(' '))) return JSON.parse(text);
      console.log(`  retry ${i + 1}: http ${res.status} ${text.slice(0, 80)}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 100)}`);
    }
    await sleep(5000);
  }
  throw new Error('query failed');
}

const out = { service: `${SVC}/3/query`, retrieved: RETRIEVED, features: [], waterbodies: [], gaps: {} };
for (const [id, [lon, lat]] of gapSites) {
  const env = [lon - BOX, lat - BOX, lon + BOX, lat + BOX].map((v) => v.toFixed(3)).join(',');
  const params = {
    where: '(fcode=55800 OR gnis_name IS NULL) AND (fcode=46006 OR fcode=46003 OR fcode=55800 OR fcode=33400)',
    geometry: env, geometryType: 'esriGeometryEnvelope', inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde',
    returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: '0.0005', f: 'geojson',
  };
  try {
    let feats = [];
    for (const layer of [3, 4]) {
      const j = await post(params, layer);
      feats.push(...(j.features ?? []));
      await sleep(SLEEP);
    }
    // dedupe by OBJECTID
    const seen = new Set();
    feats = feats.filter((f) => {
      const id = f.properties?.OBJECTID ?? f.properties?.objectid;
      if (id == null || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    out.features.push(...feats);
    // NHD waterbody polygons around the gap: flowline names stop at any
    // waterbody (named or not), so these mediate the gap.
    const wbParams = new URLSearchParams({
      where: '(fcode BETWEEN 39000 AND 39099 OR fcode BETWEEN 43600 AND 43699)',
      geometry: env, geometryType: 'esriGeometryEnvelope', inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'OBJECTID,gnis_name,gnis_id,nhdplusid,fcode,areasqkm',
      returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: '0.0002', f: 'geojson',
    });
    let wb = [];
    try {
      const jw = await post(wbParams, 9);
      wb = jw.features ?? [];
      out.waterbodies.push(...wb);
    } catch { wb = []; }
    out.gaps[id] = { at: [lon, lat], candidates: feats.length, waterbodies: wb.length };
    console.log(`${id}: ${feats.length} connector candidates, ${wb.length} waterbodies @ [${lon.toFixed(3)},${lat.toFixed(3)}]`);
  } catch (e) {
    console.log(`${id}: FAILED ${String(e).slice(0, 100)}`);
    out.gaps[id] = { at: [lon, lat], candidates: -1 };
  }
  await sleep(SLEEP);
}
writeFileSync(OUT, JSON.stringify(out));
console.log(`wrote ${OUT} (${out.features.length} candidates)`);
