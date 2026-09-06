#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * EAST/SOUTHEAST + CUMBERLAND PLATEAU hydrography rebuild — authoritative
 * source fetch (session B, branch geo/east-fix).
 *
 * Port of west-middle-fetch-nhd.mjs (the West/Middle lane's tooling) to the
 * East/Southeast feature set. Sources (public domain):
 *   - USGS NHDPlus HR MapServer (hydro.nationalmap.gov), layer 9 NHDWaterbody
 *     (lake/reservoir polygons), layer 3 NetworkNHDFlowline (flowlines,
 *     incl. 55800 artificial paths that carry named rivers through pools).
 *   - TWRA RiversReservoirs FeatureServer layer 1 tn_reservoirs (the
 *     Tennessee waterways experience source; identity outlines + Nickajack
 *     delivery geometry).
 *
 * Extraction is authoritative-ID based: coarse envelopes + FCode query
 * discover candidate OBJECTIDs (the service ignores gnis_name in WHERE, so
 * name matching happens client-side against returned attributes), then
 * geometry is re-fetched by OBJECTID IN (...) batches. Envelopes are
 * auto-tiled to ≤0.6° — wide envelopes silently drop large features — and
 * the full NHD feature is kept whole-part, never clipped server-side.
 *
 * Caches go to apps/web/.atlas-src/east-r2/<key>.json (git-ignored) as
 *   { key, service, layer, retrieved, envelopes, nameTest, matched, features }
 *
 * Run: node scripts/east-fetch-nhd.mjs [key ...]      (default: all)
 *      node scripts/east-fetch-nhd.mjs --force [key …]  (refetch)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(webRoot, '.atlas-src', 'east-r2');

const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const LAYER = { waterbody: 9, netflow: 3 };
const TWRA_RES = 'https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/RiversReservoirs/FeatureServer/1/query';
const SLEEP = 1500;
const PAGE = 2000;
const GEO_CHUNK = 120;
const FCODE_WB = '(fcode BETWEEN 39000 AND 39099 OR fcode BETWEEN 43600 AND 43699)';
const FCODE_FL = '(fcode=46006 OR fcode=46003 OR fcode=55800 OR fcode=33400)';
const WB_FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,areasqkm';
const FL_FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde';

const RETRIEVED = new Date().toISOString().slice(0, 10);
const force = process.argv.includes('--force');
const onlyArg = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = new Set(onlyArg.flatMap((a) => a.split(',')).filter(Boolean));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, params, tries = 4) {
  const body = new URLSearchParams(params);
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(180000) });
      const text = await res.text();
      if (res.ok && (text.startsWith('{') || text.startsWith(' '))) return JSON.parse(text);
      console.log(`    retry ${i + 1}: http ${res.status} ${text.slice(0, 100)}`);
    } catch (e) {
      console.log(`    retry ${i + 1}: ${String(e).slice(0, 120)}`);
    }
    await sleep(5000);
  }
  throw new Error(`query failed after retries: ${JSON.stringify(params).slice(0, 120)}`);
}

async function getTwra() {
  const file = join(OUT_DIR, 'twra-reservoirs.geojson');
  if (!force && existsSync(file)) { console.log('= twra reservoirs: cached'); return; }
  const j = await get(`${TWRA_RES}?where=1%3D1&outFields=*&outSR=4326&f=geojson&resultRecordCount=400`);
  writeFileSync(file, JSON.stringify(j));
  console.log(`+ twra reservoirs: ${j.features?.length ?? 0} features`);
}

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      const text = await res.text();
      if (res.ok && text.startsWith('{')) return JSON.parse(text);
      console.log(`    retry ${i + 1}: http ${res.status} ${text.slice(0, 100)}`);
    } catch (e) {
      console.log(`    retry ${i + 1}: ${String(e).slice(0, 120)}`);
    }
    await sleep(5000);
  }
  throw new Error('get failed after retries');
}

/**
 * Discover OBJECTIDs for one system across one or more envelopes, keeping
 * features whose gnis_name matches the system's name test (client-side —
 * the MapServer ignores gnis_name in WHERE under envelope queries).
 *
 * Envelopes are auto-tiled to ≤0.6°×0.6°: the service's resultOffset paging
 * is unreliable on wide envelopes and silently drops large features. Tiling
 * keeps every query small; the OBJECTID map dedupes tile overlaps.
 */
function tileEnvelopes(envelopes, maxDeg = 0.6) {
  const out = [];
  const step = maxDeg - 0.01; // small overlap
  for (const env of envelopes) {
    const [x0, y0, x1, y1] = env.split(',').map(Number);
    for (let nx = 0; x0 + nx * step < x1; nx++) {
      for (let ny = 0; y0 + ny * step < y1; ny++) {
        const a = +(x0 + nx * step).toFixed(3);
        const b = +(y0 + ny * step).toFixed(3);
        const c = +Math.min(x0 + nx * step + maxDeg, x1).toFixed(3);
        const d = +Math.min(y0 + ny * step + maxDeg, y1).toFixed(3);
        out.push(`${a},${b},${c},${d}`);
      }
    }
  }
  return out;
}

async function discover(key, layerNum, fcodeWhere, envelopes, nameTest, fields) {
  const url = `${SVC}/${layerNum}/query`;
  const ids = new Map(); // OBJECTID -> attributes (first discovery wins)
  const rawCounts = [];
  for (const env of tileEnvelopes(envelopes)) {
    let offset = 0;
    for (;;) {
      const res = await post(url, {
        where: fcodeWhere,
        geometry: env, geometryType: 'esriGeometryEnvelope', inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: fields, returnGeometry: 'false',
        resultOffset: offset, resultRecordCount: PAGE, f: 'json',
      });
      if (res.error) throw new Error(`discovery error ${key}: ${JSON.stringify(res.error).slice(0, 200)}`);
      const feats = res.features ?? [];
      rawCounts.push(feats.length);
      for (const f of feats) {
        const a = f.attributes ?? {};
        if (nameTest.test(a.gnis_name ?? '')) ids.set(String(a.OBJECTID), a);
      }
      if (feats.length < PAGE) break;
      offset += PAGE;
      await sleep(300);
    }
    await sleep(SLEEP);
  }
  return { ids: [...ids.entries()], rawCounts };
}

async function fetchGeometry(key, layerNum, fields, objectIds, mao) {
  const url = `${SVC}/${layerNum}/query`;
  const feats = [];
  for (let i = 0; i < objectIds.length; i += GEO_CHUNK) {
    const chunk = objectIds.slice(i, i + GEO_CHUNK);
    const res = await post(url, {
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields: fields,
      returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: mao,
      f: 'geojson',
    });
    if (res.error) throw new Error(`geometry error ${key}: ${JSON.stringify(res.error).slice(0, 200)}`);
    feats.push(...(res.features ?? []));
    await sleep(SLEEP);
  }
  return feats;
}

// ---------------------------------------------------------------------------
// Lakes (NHD waterbody layer, GNIS name-matched, NHDPlusID pinned at build).
// ---------------------------------------------------------------------------
const LAKES = [
  { key: 'lake-norris', nameTest: /^(Norris Lake|Norris Reservoir)$/i,
    envs: ['-84.45,36.05,-83.10,36.75'], mao: '0.0004' },
  { key: 'lake-boone', nameTest: /^Boone Lake$/i,
    envs: ['-82.65,36.30,-82.15,36.65'], mao: '0.0003' },
  // NHD's named Nickajack pool covers only the western gorge (the Chattanooga
  // reach is NHD river-area) — fetched for the identity record + QA overlay;
  // delivery geometry stays TWRA per the lane decision.
  { key: 'lake-nickajack-nhd', nameTest: /^Nickajack Lake$/i,
    envs: ['-85.75,34.90,-85.00,35.45'], mao: '0.0004' },
];

// ---------------------------------------------------------------------------
// Rivers (NHD network flowlines, GNIS name-matched). envs cover the FULL
// extent of the reach including cross-state headwaters (whole-part fetch;
// reach windows cut at build time by documented gates / state cuts).
// mao = maxAllowableOffset degrees for geometry fetch.
// ---------------------------------------------------------------------------
const RIVERS = [
  { key: 'river-tennessee', nameTest: /^Tennessee River$/i,
    envs: ['-85.85,34.90,-83.50,36.20', '-88.65,34.95,-87.70,36.75'], mao: '0.0005' },
  { key: 'river-holston', nameTest: /^Holston River$/i,
    envs: ['-84.10,35.80,-82.40,36.70'], mao: '0.0005' },
  { key: 'river-north-fork-holston', nameTest: /^North Fork Holston River$/i,
    envs: ['-83.00,36.40,-82.30,36.90'], mao: '0.0005' },
  // (envelope already covers the full fork incl. the VA headwaters; the build
  // gate + VA state cut keep the Tennessee reach to the Kingsport confluence)
  // One fetch feeds three gated reaches (south-holston-river below South
  // Holston Dam, boone-tailwater, ft-patrick-henry-tailwater) plus the
  // South Holston Lake inflow reach in VA.
  { key: 'river-south-fork-holston', nameTest: /^South Fork Holston River$/i,
    envs: ['-82.70,36.30,-81.70,36.90'], mao: '0.0004' },
  { key: 'river-watauga', nameTest: /^Watauga River$/i,
    envs: ['-82.60,36.15,-81.75,36.65'], mao: '0.0004' },
  { key: 'river-french-broad', nameTest: /^French Broad River$/i,
    envs: ['-84.05,35.70,-82.50,36.25'], mao: '0.0004' },
  { key: 'river-pigeon', nameTest: /^Pigeon River$/i,
    envs: ['-83.45,35.60,-82.80,36.10'], mao: '0.0004' },
  { key: 'river-nolichucky', nameTest: /^Nolichucky River$/i,
    envs: ['-83.35,35.80,-82.05,36.50'], mao: '0.0004' },
  { key: 'river-powell', nameTest: /^Powell River$/i,
    envs: ['-84.40,36.10,-82.90,36.90'], mao: '0.0004' },
  { key: 'river-clinch', nameTest: /^Clinch River$/i,
    envs: ['-84.75,35.70,-83.75,36.50'], mao: '0.0004' },
  { key: 'river-little-tennessee', nameTest: /^Little Tennessee River$/i,
    envs: ['-84.45,35.25,-83.70,35.95'], mao: '0.0004' },
  { key: 'river-hiwassee', nameTest: /^Hiwassee River$/i,
    envs: ['-85.15,35.00,-84.10,35.50'], mao: '0.0004' },
  { key: 'river-ocoee', nameTest: /^Ocoee River$/i,
    envs: ['-84.85,34.88,-84.25,35.25'], mao: '0.0003' },
  { key: 'river-obed', nameTest: /^Obed River$/i,
    envs: ['-85.20,35.85,-84.55,36.20'], mao: '0.0003' },
  { key: 'river-emory', nameTest: /^Emory River$/i,
    envs: ['-84.80,35.85,-84.35,36.25'], mao: '0.0003' },
  { key: 'river-daddys-creek', nameTest: /^Daddy.?s Creek$/i,
    envs: ['-85.20,35.70,-84.70,36.15'], mao: '0.0002' },
  { key: 'river-clear-fork', nameTest: /^Clear Fork$/i,
    envs: ['-85.00,36.00,-84.45,36.60'], mao: '0.0003' },
  { key: 'river-new', nameTest: /^New River$/i,
    envs: ['-84.70,36.05,-84.20,36.50'], mao: '0.0003' },
  // Big South Fork: the catalog id south-fork-cumberland names the reach
  // around Leatherwood Ford (bounds -84.67..-84.61, 36.50..36.60).
  { key: 'river-south-fork-cumberland', nameTest: /^(Big )?South Fork( Cumberland)? River$|Big South Fork/i,
    envs: ['-84.85,36.00,-84.40,36.70'], mao: '0.0003' },
  { key: 'river-wolf-fentress', nameTest: /^Wolf River$/i,
    envs: ['-85.25,36.45,-84.80,36.70'], mao: '0.0002' },
  { key: 'river-piney-rhea', nameTest: /^Piney River$/i,
    envs: ['-85.20,35.55,-84.60,36.00'], mao: '0.0003' },
  { key: 'river-little-river', nameTest: /^Little River$/i,
    envs: ['-84.05,35.52,-83.40,35.95'], mao: '0.0003' },
  { key: 'river-upper-roan', nameTest: /(Roan) Creek/i,
    envs: ['-82.20,36.25,-81.60,36.60'], mao: '0.0002' },
  { key: 'river-horse-creek', nameTest: /^Horse Creek$/i,
    envs: ['-82.90,36.00,-82.50,36.55'], mao: '0.0002' },
  { key: 'river-indian-creek', nameTest: /^Indian Creek$/i,
    envs: ['-83.70,36.35,-83.30,36.70'], mao: '0.0002' },
  { key: 'river-sequatchie', nameTest: /^Sequatchie River$/i,
    envs: ['-85.70,34.98,-84.85,35.95'], mao: '0.0004' },
  { key: 'river-richardson-byrd', nameTest: /^(Richardson|Byrd) Creek$/i,
    envs: ['-83.30,36.40,-82.95,36.65'], mao: '0.0002' },
];

function withinOnly(arr) {
  return !only.size || arr.some((k) => only.has(k));
}

mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const summary = [];
  const failures = [];
  await getTwra();
  await sleep(SLEEP);
  for (const sys of LAKES) {
    if (!withinOnly([sys.key])) continue;
    const file = join(OUT_DIR, `${sys.key}.json`);
    if (!force && existsSync(file)) { console.log(`= lake ${sys.key}: cached`); continue; }
    try {
      console.log(`+ lake ${sys.key} …`);
      const { ids, rawCounts } = await discover(sys.key, LAYER.waterbody, FCODE_WB, sys.envs, sys.nameTest, WB_FIELDS);
      const feats = ids.length ? await fetchGeometry(sys.key, LAYER.waterbody, WB_FIELDS, ids.map(([id]) => id), sys.mao) : [];
      writeFileSync(file, JSON.stringify({
        key: sys.key, service: `${SVC}/9/query`, retrieved: RETRIEVED,
        envelopes: sys.envs, nameTest: String(sys.nameTest),
        discoveryRaw: rawCounts, matched: ids.map(([, a]) => a), features: feats,
      }));
      const sqkm = ids.map(([, a]) => a.areasqkm ?? 0).reduce((s, v) => s + v, 0);
      summary.push(`lake ${sys.key}: ${ids.length} polys, ${sqkm.toFixed(2)} km²`);
    } catch (e) {
      failures.push(sys.key);
      console.log(`!! lake ${sys.key}: ${String(e).slice(0, 160)}`);
    }
    await sleep(SLEEP);
  }
  for (const sys of RIVERS) {
    if (!withinOnly([sys.key])) continue;
    const file = join(OUT_DIR, `${sys.key}.json`);
    if (!force && existsSync(file)) { console.log(`= river ${sys.key}: cached`); continue; }
    try {
      console.log(`+ river ${sys.key} …`);
      const { ids, rawCounts } = await discover(sys.key, LAYER.netflow, FCODE_FL, sys.envs, sys.nameTest, FL_FIELDS);
      const feats = ids.length ? await fetchGeometry(sys.key, LAYER.netflow, FL_FIELDS, ids.map(([id]) => id), sys.mao) : [];
      writeFileSync(file, JSON.stringify({
        key: sys.key, service: `${SVC}/3/query`, retrieved: RETRIEVED,
        envelopes: sys.envs, nameTest: String(sys.nameTest),
        discoveryRaw: rawCounts, matched: ids.map(([, a]) => a), features: feats,
      }));
      const km = ids.map(([, a]) => a.lengthkm ?? 0).reduce((s, v) => s + v, 0);
      summary.push(`river ${sys.key}: ${ids.length} parts, ${km.toFixed(1)} km`);
    } catch (e) {
      failures.push(sys.key);
      console.log(`!! river ${sys.key}: ${String(e).slice(0, 160)}`);
    }
    await sleep(SLEEP);
  }
  console.log('\n=== SUMMARY ===');
  for (const s of summary) console.log(s);
  if (failures.length) {
    console.log('\n=== FAILED (rerun with --force for these keys) ===');
    for (const k of failures) console.log(k);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
