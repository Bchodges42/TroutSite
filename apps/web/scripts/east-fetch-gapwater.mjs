#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * EAST/SOUTHEAST rebuild — phase-3 gap-waterbody fetch (west-middle pattern):
 * for every measured unexplained chain separation in the build report, fetch
 * the NHDPlus HR NHDWaterbody polygons (layer 9) around the gap point. A
 * chain end within 150 m of such a waterbody is pool-mediated (the pond/lake
 * carries the water where the named flowline stops) rather than a broken
 * chain. Never used as geometry — classification evidence only.
 *
 * Cache: apps/web/.atlas-src/east-r2/gap-waterbodies.json
 * Run: node scripts/east-fetch-gapwater.mjs   (after east-rebuild-build.mjs)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(webRoot, '.atlas-src', 'east-r2');
const OUT = join(CACHE, 'gap-waterbodies.json');
const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/9/query';
const FCODE_WB = '(fcode BETWEEN 39000 AND 39099 OR fcode BETWEEN 43600 AND 43699)';
const FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,fcode,areasqkm';

const report = JSON.parse(readFileSync(join(CACHE, 'build-report.json'), 'utf8'));
const targets = new Map();
for (const r of report) {
  if (r.kind !== 'river' || r.largestGapM == null) continue;
  if (r.largestGapM < 300) continue;
  const key = r.gapAt.map((v) => v.toFixed(3)).join(',');
  targets.set(key, r.gapAt);
}
console.log(`gap points to cover: ${targets.size}`);

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
  throw new Error('gap-water query failed');
}

const feats = [];
const seen = new Set();
for (const [key, [lon, lat]] of targets) {
  const env = [lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05].map((v) => v.toFixed(4)).join(',');
  const j = await post({
    where: FCODE_WB,
    geometry: env, geometryType: 'esriGeometryEnvelope', inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: FIELDS, returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: '0.0001', f: 'geojson',
  });
  if (j.error) { console.log(`${key}: error ${JSON.stringify(j.error).slice(0, 120)}`); continue; }
  let added = 0;
  for (const f of j.features ?? []) {
    const id = String(f.properties?.OBJECTID);
    if (seen.has(id)) continue;
    seen.add(id);
    f.properties.__gapAt = key;
    feats.push(f);
    added++;
  }
  console.log(`${key}: ${added} waterbodies in window`);
  await sleep(1200);
}

if (existsSync(OUT)) {
  const prev = JSON.parse(readFileSync(OUT, 'utf8'));
  const prevIds = new Set((prev.features ?? []).map((f) => String(f.properties?.OBJECTID)));
  for (const f of feats) if (!prevIds.has(String(f.properties?.OBJECTID))) prev.features.push(f);
  writeFileSync(OUT, JSON.stringify(prev));
  console.log(`gap-waterbodies.json now holds ${(prev.features ?? []).length} polygons`);
} else {
  writeFileSync(OUT, JSON.stringify({ retrieved: new Date().toISOString().slice(0, 10), service: SVC, features: feats }));
  console.log(`wrote ${feats.length} gap-waterbody polygons`);
}
