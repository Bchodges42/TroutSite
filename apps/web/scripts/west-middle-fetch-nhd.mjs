#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * WEST/MIDDLE TENNESSEE hydrography lane — authoritative source fetch.
 *
 * Sources (public domain):
 *   - USGS NHDPlus HR MapServer (hydro.nationalmap.gov), layer 9 NHDWaterbody
 *     (lake/reservoir polygons), layer 3 NetworkNHDFlowline + layer 4
 *     NonNetworkNHDFlowline (flowlines, incl. 55800 artificial paths that
 *     carry named rivers through reservoirs).
 *   - USGS NWIS waterservices site service (dam/outflow gauge coordinates).
 *
 * Extraction is authoritative-ID based: a coarse envelope + FCode query
 * discovers candidate OBJECTIDs (the service ignores gnis_name in WHERE, so
 * name matching is done client-side against the returned attributes), then
 * geometry is re-fetched by OBJECTID IN (...) batches. No county clipping —
 * envelopes cover the FULL extent of each waterbody/reach including
 * out-of-state reservoir portions, and the full NHD feature (never a partial
 * clip) is kept whole-part.
 *
 * Raw responses are cached to apps/web/.atlas-src/west-middle/<key>.json
 * (git-ignored) as:
 *   { key, service, layer, retrieved, envelopes, nameTest, features: [...] }
 *
 * Run: node scripts/west-middle-fetch-nhd.mjs [key ...]   (default: all)
 *      node scripts/west-middle-fetch-nhd.mjs --force [key ...]  (refetch)
 */
import { _readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(webRoot, '.atlas-src', 'west-middle');

const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const LAYER = { waterbody: 9, netflow: 3, nonnetflow: 4, area: 8 };
const NWIS = 'https://waterservices.usgs.gov/nwis/site';
const SLEEP = 1500;
const PAGE = 2000;
const GEO_CHUNK = 120;
const FCODE_WB = '(fcode BETWEEN 39000 AND 39099 OR fcode BETWEEN 43600 AND 43699)';
const FCODE_AREA_WIDE = '(fcode=46006 OR fcode=46003 OR fcode=43600 OR fcode=43612)';
const FCODE_FL = '(fcode=46006 OR fcode=46003 OR fcode=55800 OR fcode=33400)';
const WB_FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,areasqkm';
const AREA_FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,fcode,areasqkm';
// Geometry lane 2026-09-08: flowline takes also carry the NHDPlus VAA fields
// (levelpathi/pathlength/divergence/dnlevelpat/hydroseq) so rebuild scripts can
// order the mainstem deterministically from network topology instead of
// endpoint-weld heuristics.
const FL_FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde,levelpathi,pathlength,hydroseq,divergence,dnlevelpat,dnhydroseq,totdasqkm';

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

/**
 * Discover OBJECTIDs for one system across one or more envelopes, keeping
 * features whose gnis_name matches the system's name test (client-side —
 * the MapServer ignores gnis_name in WHERE under envelope queries).
 *
 * Envelopes are auto-tiled to ≤0.6°×0.6°: the service's resultOffset paging
 * is unreliable on wide envelopes and silently drops large features (the
 * 198.6 km² Lake Barkley pool vanished from a 1.05° envelope but is found
 * from a 0.1° probe). Tiling keeps every query small; the OBJECTID map
 * dedupes tile overlaps.
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

async function discover(key, layerNum, fcodeWhere, envelopes, nameTest, fields, minKm2 = 0) {
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
        const name = a.gnis_name ?? '';
        const km2 = a.areasqkm ?? 0;
        if (nameTest.test(name)) {
          if (name === '' && km2 < minKm2) continue; // unnamed pieces need an area floor
          ids.set(String(a.OBJECTID), a);
        }
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
// Systems. envs list = discovery envelopes covering the FULL waterbody/reach
// extent (whole-part fetch; out-of-state portions included, clipped later only
// where the product requires a state-limited reach and then documented).
// mao = maxAllowableOffset degrees for geometry fetch (small water → 0).
// ---------------------------------------------------------------------------
const LAKES = [
  { key: 'lake-kentucky', nameTest: /^(Kentucky Reservoir|Kentucky Lake)$/i,
    envs: ['-88.45,34.90,-87.75,35.75', '-87.95,35.55,-87.30,36.85', '-88.10,36.55,-87.30,37.20'], mao: '0.0004' },
  { key: 'lake-pickwick', nameTest: /^(Pickwick Lake|Pickwick Reservoir)$/i,
    envs: ['-88.45,34.60,-87.85,35.35'], mao: '0.0004' },
  // NHD leaves the big Cumberland pools unnamed (gnis_name IS NULL): the Old
  // Hickory pool is an 84.5 km² null polygon, Lake Barkley's pool likewise.
  // For those, discovery keeps ANY waterbody ≥ nullNameMinKm2 intersecting the
  // envelope; build-side selection then pins exact NHDPlusIDs (documented in
  // the audit) instead of trusting names.
  { key: 'lake-barkley', nameTest: /(Barkley)|^$/i,
    envs: ['-88.20,36.20,-87.15,37.15'], mao: '0.0004', nullNameMinKm2: 3 },
  { key: 'lake-old-hickory', nameTest: /(Old Hickory)|^$/i,
    envs: ['-86.80,36.18,-85.90,36.60'], mao: '0.0003', nullNameMinKm2: 3 },
  { key: 'lake-percy-priest', nameTest: /Percy Priest/i,
    envs: ['-86.80,35.90,-86.28,36.28'], mao: '0.0003' },
  { key: 'lake-tims-ford', nameTest: /Tims Ford/i,
    envs: ['-86.45,35.10,-85.90,35.42'], mao: '0.0002' },
  { key: 'lake-center-hill', nameTest: /Center Hill/i,
    envs: ['-86.05,35.70,-85.38,36.22'], mao: '0.0003' },
  { key: 'lake-dale-hollow', nameTest: /Dale Hollow/i,
    envs: ['-85.70,36.38,-85.00,36.88'], mao: '0.0003' },
  { key: 'lake-normandy', nameTest: /Normandy/i,
    envs: ['-86.35,35.33,-86.00,35.62'], mao: '0.0001' },
  // Reelfoot Lake's main basin carries the NHD gnis_name "Reading House
  // Slough" (44.29 km²) — keep by area floor as well.
  { key: 'lake-reelfoot', nameTest: /(Reelfoot|Reading House)|^$/i,
    envs: ['-89.65,36.28,-89.00,36.62'], mao: '0.0002', nullNameMinKm2: 3 },
  { key: 'lake-woods', nameTest: /Woods/i,
    envs: ['-86.25,35.22,-85.85,35.42'], mao: '0' },
  // Great Falls Lake is carried in NHDArea (layer 8) as unnamed fcode-46006
  // wide-water polygons (7.47 + 5.57 km²), not NHDWaterbody.
  { key: 'lake-great-falls', nameTest: /(Great Falls)|^$/i,
    envs: ['-85.95,35.70,-85.45,35.90'], mao: '0', nullNameMinKm2: 0.5,
    layerKey: 'area', fcodeWhere: FCODE_AREA_WIDE },
];

const RIVERS = [
  { key: 'river-mississippi', nameTest: /^Mississippi River$/i,
    // full border box (auto-tiled to 0.6°); the channel drifts east of
    // hand-drawn bands south of Memphis, which produced gaps
    envs: ['-91.30,34.95,-89.20,36.75'], mao: '0.0005' },
  { key: 'river-obion', nameTest: /^Obion River$/i,
    envs: ['-89.85,35.70,-88.55,36.50'], mao: '0.0004' },
  { key: 'river-hatchie', nameTest: /(Hatchie)/i,
    envs: ['-89.85,34.95,-88.75,35.90'], mao: '0.0004' },
  { key: 'river-wolf-west', nameTest: /^Wolf River$/i,
    envs: ['-90.30,34.90,-88.85,35.50'], mao: '0.0004' },
  { key: 'river-tennessee', nameTest: /^Tennessee River$/i,
    envs: ['-88.50,34.55,-87.20,35.60', '-87.40,35.40,-86.35,36.10', '-86.50,35.90,-85.35,36.50', '-85.50,36.20,-84.45,36.75', '-84.60,36.30,-83.65,36.75'], mao: '0.0005' },
  { key: 'river-cumberland', nameTest: /^Cumberland River$/i,
    // full TN box (auto-tiled): the old middle envelope skipped the
    // Clarksville reach (lon -87.36 fell between hand-drawn boxes)
    envs: ['-88.25,36.05,-85.20,37.15'], mao: '0.0005' },
  { key: 'river-buffalo', nameTest: /^(Buffalo River|Little Buffalo River)$/i,
    envs: ['-88.00,35.20,-87.10,36.20'], mao: '0.0004' },
  { key: 'river-harpeth', nameTest: /^Harpeth River$/i,
    envs: ['-87.30,35.70,-86.50,36.35'], mao: '0.0004' },
  { key: 'river-duck', nameTest: /^Duck River$/i,
    envs: ['-87.15,35.35,-86.05,35.80'], mao: '0.0004' },
  { key: 'river-elk', nameTest: /^Elk River$/i,
    // Second envelope added 2026-09-09 (geometry lane follow-up): the state
    // line reach south of Prospect sat outside the first envelope, which read
    // as a phantom 1.25 km "network gap" in elk-river-lower — NHD carries the
    // named Elk level path (25000200000187) continuously across the TN/AL
    // line; envelope covers it to the AL pool arm.
    envs: ['-87.05,34.90,-86.10,35.45', '-87.15,34.80,-86.90,35.05'], mao: '0.0004' },
  { key: 'river-caney-fork', nameTest: /Caney Fork/i,
    envs: ['-86.05,35.50,-84.95,36.40'], mao: '0.0004' },
  { key: 'river-stones', nameTest: /Stones River/i,
    envs: ['-86.85,35.60,-86.00,36.30'], mao: '0.0004' },
  { key: 'river-obey', nameTest: /^Obey River$/i,
    envs: ['-85.60,36.20,-85.05,36.65'], mao: '0.0003' },
  // catalog small streams — geometry refresh + connectivity verification
  { key: 'creek-big-rock', nameTest: /^Big Rock Creek$/i, envs: ['-86.90,35.30,-86.55,35.65'], mao: '0.0003' },
  { key: 'creek-boiling-fork', nameTest: /^Boiling Fork Creek$/i, envs: ['-86.15,35.10,-85.90,35.25'], mao: '0.0002' },
  { key: 'creek-east-fork-shoal', nameTest: /^East Fork Shoal Creek$/i, envs: ['-87.25,34.95,-87.00,35.15'], mao: '0.0002' },
  { key: 'creek-shoal', nameTest: /^Shoal Creek$/i, envs: ['-87.65,34.95,-87.25,35.30'], mao: '0.0003' },
  { key: 'creek-mccutcheon', nameTest: /^McCutcheon Creek$/i, envs: ['-87.00,35.65,-86.85,35.85'], mao: '0.0002' },
  { key: 'fork-fletchers', nameTest: /^Fletchers Fork$/i, envs: ['-87.55,36.50,-87.40,36.65'], mao: '0.0002' },
  { key: 'creek-little-west-fork', nameTest: /Little West Fork/i, envs: ['-87.55,36.55,-87.30,36.65'], mao: '0.0002' },
  { key: 'river-red', nameTest: /^Red River$/i, envs: ['-87.40,36.40,-86.85,36.75'], mao: '0.0004' },
  { key: 'creek-sinking', nameTest: /^Sinking Creek$/i, envs: ['-86.60,36.00,-86.20,36.25'], mao: '0.0003' },
  { key: 'creek-sulfur-fork', nameTest: /Sul?phur Fork/i, envs: ['-87.20,36.40,-86.30,36.70'], mao: '0.0003' },
  { key: 'creek-hurricane', nameTest: /^Hurricane Creek$/i, envs: ['-88.00,35.90,-87.50,36.45'], mao: '0.0003' },
  { key: 'creek-salt-lick', nameTest: /^Salt Lick Creek$/i, envs: ['-86.00,36.40,-85.75,36.70'], mao: '0.0002' },
  { key: 'creek-standing-rock', nameTest: /^Standing Rock Creek$/i, envs: ['-88.05,36.38,-87.80,36.50'], mao: '0.0002' },
  { key: 'creek-white-oak', nameTest: /White ?Oak Creek/i, envs: ['-87.95,36.10,-87.50,36.30'], mao: '0.0003' },
  { key: 'river-barren-fork', nameTest: /^Barren Fork/i, envs: ['-86.05,35.55,-85.60,35.95'], mao: '0.0003' },
  { key: 'river-calfkiller', nameTest: /^Calfkiller River$/i, envs: ['-85.55,35.75,-85.25,36.15'], mao: '0.0003' },
  { key: 'creek-charles', nameTest: /^Charles Creek$/i, envs: ['-86.00,35.70,-85.70,35.85'], mao: '0.0002' },
  { key: 'river-collins', nameTest: /^Collins River$/i, envs: ['-85.85,35.40,-85.50,35.85'], mao: '0.0003' },
  // Envelope widened 2026-09-08 (geometry lane): the old window
  // [-85.60,36.20,-85.30,36.55] matched the named reaches but the creek's
  // middle course (lat 36.30..36.45) must also be inside so the take carries
  // the whole named extent (whole-part fill of the documented 18.69 km
  // interior hole is decided from this take).
  { key: 'creek-mill-overton', nameTest: /^Mill Creek$/i, envs: ['-85.65,36.15,-84.95,36.60'], mao: '0.0003' },
  // Geometry lane 2026-09-08: Woods Reservoir (AEDC, Franklin County) sits on
  // Bradley Creek; the creek's course from the Woods dam to the Elk River is
  // the source-true connector between woods-reservoir and the Elk system.
  { key: 'creek-bradley', nameTest: /^Bradley Creek$/i, envs: ['-86.30,35.10,-85.85,35.45'], mao: '0.0003' },
  // Unnamed NHD reaches of the Bradley Creek level path (25000200006220):
  // the three artificial-path pieces that carry the flow from the Woods
  // Reservoir outlet to the Elk River (fbb-braid precedent: like-less fetch,
  // gnis_name IS NULL, envelope tight around the outlet corridor only).
  { key: 'creek-bradley-connectors', nameTest: /^$/, envs: ['-86.01,35.31,-85.995,35.33'], mao: '0.0002' },
  { key: 'creek-north-prong-barren', nameTest: /^North Prong Barren/i, envs: ['-86.00,35.65,-85.90,35.75'], mao: '0.0002' },
  { key: 'creek-pine-dekalb', nameTest: /^Pine Creek$/i, envs: ['-85.90,35.85,-85.70,36.00'], mao: '0.0002' },
  { key: 'river-rocky', nameTest: /^Rocky River$/i, envs: ['-85.65,35.50,-85.40,35.80'], mao: '0.0003' },
  { key: 'creek-upper-hills', nameTest: /^Hills Creek$/i, envs: ['-85.75,35.53,-85.60,35.60'], mao: '0.0002' },
  { key: 'creek-cane-hickman', nameTest: /^Cane Creek$/i, envs: ['-87.70,35.55,-87.20,36.00'], mao: '0.0003' },
];

// USGS NWIS dam / outflow gauges for the topology deliverable. bBox windows
// isolate each dam; names are matched client-side for certainty.
const DAMS = [
  { key: 'dam-kentucky', bbox: '-88.45,36.90,-88.05,37.20', name: /(Kentucky|Tennessee) Dam|Kentucky/i },
  { key: 'dam-pickwick', bbox: '-88.35,34.95,-88.00,35.20', name: /Pickwick/i },
  { key: 'dam-barkley', bbox: '-88.20,36.70,-87.60,37.10', name: /(Barkley|Cumberland)/i },
  { key: 'dam-old-hickory', bbox: '-86.75,36.20,-86.45,36.40', name: /Old Hickory/i },
  { key: 'dam-percy-priest', bbox: '-86.65,36.00,-86.40,36.20', name: /Percy Priest|Stones River/i },
  { key: 'dam-tims-ford', bbox: '-86.40,35.10,-86.15,35.30', name: /Tims Ford|Elk River/i },
  { key: 'dam-normandy', bbox: '-86.35,35.40,-86.15,35.55', name: /Normandy|Duck River/i },
  { key: 'dam-center-hill', bbox: '-85.95,35.85,-85.70,36.10', name: /Center Hill|Caney Fork/i },
  { key: 'dam-dale-hollow', bbox: '-85.60,36.45,-85.30,36.65', name: /Dale Hollow|Obey River/i },
  { key: 'dam-cheatham', bbox: '-87.25,36.20,-86.95,36.40', name: /Cheatham|Cumberland River/i },
  { key: 'dam-cordell-hull', bbox: '-86.05,36.22,-85.75,36.45', name: /Cordell Hull/i },
  { key: 'dam-great-falls', bbox: '-85.80,35.72,-85.60,35.90', name: /Great Falls|Caney Fork|Collins River/i },
];

async function fetchNwis(key, bbox, nameRe) {
  const params = new URLSearchParams({
    format: 'rdb', bBox: bbox, siteOutput: 'expanded',
  });
  const res = await fetch(`${NWIS}?${params}`, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`NWIS ${key}: http ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n').filter((l) => l && !l.startsWith('#'));
  if (lines.length < 2) return [];
  const head = lines[0].split('\t');
  const col = (n) => head.indexOf(n);
  const iSite = col('site_no'), iName = col('station_nm'), iLat = col('dec_lat_va'), iLon = col('dec_long_va');
  const out = [];
  for (const line of lines.slice(1)) {
    const c = line.split('\t');
    const name = c[iName] ?? '';
    const lat = parseFloat(c[iLat]);
    const lon = parseFloat(c[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (!nameRe.test(name)) continue;
    out.push({ site: c[iSite], name, lat, lon });
  }
  const bySite = new Map();
  for (const s of out) bySite.set(s.site, s);
  return [...bySite.values()];
}

function withinOnly(arr) {
  return !only.size || arr.some((k) => only.has(k));
}

mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const summary = [];
  const failures = [];
  for (const sys of LAKES) {
    if (!withinOnly([sys.key])) continue;
    const file = join(OUT_DIR, `${sys.key}.json`);
    if (!force && existsSync(file)) { console.log(`= lake ${sys.key}: cached`); continue; }
    try {
      console.log(`+ lake ${sys.key} …`);
      const layerNum = sys.layerKey === 'area' ? LAYER.area : LAYER.waterbody;
      const fcodeWhere = sys.layerKey === 'area' ? (sys.fcodeWhere ?? FCODE_AREA_WIDE) : FCODE_WB;
      const outFields = sys.layerKey === 'area' ? AREA_FIELDS : WB_FIELDS;
      const { ids, rawCounts } = await discover(sys.key, layerNum, fcodeWhere, sys.envs, sys.nameTest, outFields, sys.nullNameMinKm2 ?? 0);
      const feats = ids.length ? await fetchGeometry(sys.key, layerNum, outFields, ids.map(([id]) => id), sys.mao) : [];
      writeFileSync(file, JSON.stringify({
        key: sys.key, service: `${SVC}/${sys.layerKey === 'area' ? LAYER.area : 9}/query`, retrieved: RETRIEVED,
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
  for (const dam of DAMS) {
    if (!withinOnly([dam.key])) continue;
    const file = join(OUT_DIR, `${dam.key}.json`);
    if (!force && existsSync(file)) { console.log(`= dam ${dam.key}: cached`); continue; }
    try {
      console.log(`+ dam ${dam.key} …`);
      const sites = await fetchNwis(dam.key, dam.bbox, dam.name);
      writeFileSync(file, JSON.stringify({
        key: dam.key, service: `${NWIS}?format=json&bBox=${dam.bbox}&siteOutput=expanded`,
        retrieved: RETRIEVED, sites,
      }));
      summary.push(`dam ${dam.key}: ${sites.map((s) => `${s.site} ${s.name}`).join(' | ') || '(none)'}`);
    } catch (e) {
      failures.push(dam.key);
      console.log(`!! dam ${dam.key}: ${String(e).slice(0, 160)}`);
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
