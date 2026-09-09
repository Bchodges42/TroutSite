#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * trace-west/fetch-west.mjs — trace-crew WEST take fetcher (2026-09-08).
 *
 * Copy of the west-middle-fetch-nhd.mjs query pattern (never edits the
 * original) with three trace-specific extensions:
 *
 *   1. VAA flowline fields (levelpathi/pathlength/hydroseq/dnlevelpat/
 *      dnhydroseq/divergence) on every take, so rebuild scripts can order
 *      main stems deterministically from NHDPlus network topology.
 *   2. UNNAMED-CARRIER REFILL with ZERO extra discovery queries: stage-1
 *      discovery retains EVERY flowline's attributes in the envelope area;
 *      after the named matches are fetched, the unnamed reaches
 *      (gnis_name empty) whose levelpathi is one of the water's named level
 *      paths (>= max(minKm, 8% of the largest named level path)) are fetched
 *      by OBJECTID and flagged `_refill: true`. These are the through-pool
 *      artificial paths ("through-pool carrier unnamed in NHD") and the
 *      unnamed gap reaches (Buffalo 2.7 km hole class).
 *   3. FULL-EXTENT envelopes for the big rivers: the old hand-drawn band
 *      envelopes skipped main-stem segments between box edges (the same
 *      hand-drawn-envelope defect the Cumberland fetch header documents).
 *      Wide boxes are auto-tiled to 0.6 deg (paging is unreliable on wide
 *      envelopes and silently drops large features).
 *
 * Same-name disambiguation is by envelope scope (two Wolf Rivers, two Mill
 * Creeks, two Brush Creeks, two Cane Creeks exist; envelopes are county-
 * scoped like scripts/fetch-nhd-fixes.mjs).
 *
 * Takes are cached to apps/web/.atlas-src/trace/west/takes/<key>.json as
 *   { key, service, retrieved, envelopes, nameTest, features: [...] }
 *
 * Run: node scripts/trace-west/fetch-west.mjs [key ...]   (default: all)
 *      node scripts/trace-west/fetch-west.mjs --force [key ...]
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(webRoot, '.atlas-src', 'trace', 'west', 'takes');

const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const NETFLOW = 3;
const SLEEP = 1100;
const PAGE = 2000;
const GEO_CHUNK = 120;
// VAA fields so rebuild scripts order main stems by network topology.
const FL_FIELDS = 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde,levelpathi,pathlength,hydroseq,divergence,dnlevelpat,dnhydroseq,totdasqkm';
const FCODE_FL = '(fcode=46006 OR fcode=46003 OR fcode=55800 OR fcode=33400)';

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

/** Tile envelopes to <=0.6 deg x 0.6 deg: the service's resultOffset paging
 * is unreliable on wide envelopes (large features silently dropped). */
export function tileEnvelopes(envelopes, maxDeg = 0.6) {
  const out = [];
  const step = maxDeg - 0.01;
  for (const env of envelopes) {
    const [x0, y0, x1, y1] = env.split(',').map(Number);
    for (let nx = 0; x0 + nx * step < x1; nx++) {
      for (let ny = 0; y0 + ny * step < y1; ny++) {
        const a = +(x0 + nx * step).toFixed(3);
        const b = +(y0 + ny * step).toFixed(3);
        const c = +Math.min(x0 + nx * step + maxDeg, x1).toFixed(3);
        const d = +Math.min(y0 + ny * step + maxDeg, y1).toFixed(3);
        out.push([a, b, c, d]);
      }
    }
  }
  return out;
}

/** Discover EVERY flowline's attributes in the envelopes (no name filter
 * server-side — the service ignores gnis_name in WHERE under envelope
 * queries; matching is client-side). */
async function discoverAll(envs) {
  const url = `${SVC}/${NETFLOW}/query`;
  const ids = new Map(); // OBJECTID -> attributes
  const tiles = tileEnvelopes(envs);
  let done = 0;
  for (const [a, b, c, d] of tiles) {
    let offset = 0;
    for (;;) {
      const res = await post(url, {
        where: FCODE_FL, geometry: `${a},${b},${c},${d}`, geometryType: 'esriGeometryEnvelope', inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: FL_FIELDS, returnGeometry: 'false',
        resultOffset: offset, resultRecordCount: PAGE, f: 'json',
      });
      if (res.error) throw new Error(`discovery error: ${JSON.stringify(res.error).slice(0, 200)}`);
      const feats = res.features ?? [];
      for (const f of feats) {
        const at = f.attributes ?? {};
        ids.set(String(at.OBJECTID), at);
      }
      if (feats.length < PAGE) break;
      offset += PAGE;
      await sleep(250);
    }
    done++;
    if (done % 5 === 0 || done === tiles.length) console.log(`    discovery tile ${done}/${tiles.length} — ${ids.size} flowlines retained`);
    await sleep(SLEEP);
  }
  return ids;
}

async function fetchGeometry(objectIds, mao, tag = '') {
  const url = `${SVC}/${NETFLOW}/query`;
  const feats = [];
  for (let i = 0; i < objectIds.length; i += GEO_CHUNK) {
    const chunk = objectIds.slice(i, i + GEO_CHUNK);
    const res = await post(url, {
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields: FL_FIELDS,
      returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: mao,
      f: 'geojson',
    });
    if (res.error) throw new Error(`geometry error: ${JSON.stringify(res.error).slice(0, 200)}`);
    feats.push(...(res.features ?? []));
    if (tag) console.log(`    ${tag} geometry ${Math.min(i + GEO_CHUNK, objectIds.length)}/${objectIds.length}`);
    await sleep(SLEEP);
  }
  return feats;
}

// ---------------------------------------------------------------------------
// Systems. envs cover the FULL extent (whole-part fetch; same-name ambiguity
// resolved by county-scoped envelopes). minKm = refill level-path floor.
// ---------------------------------------------------------------------------
const SYSTEMS = [
  // --- priority ---
  { key: 'river-cumberland', mao: '0.0005', minKm: 10,
    envs: ['-88.25,36.05,-85.20,37.15'], nameTest: /^Cumberland River$/i },
  { key: 'river-tennessee', mao: '0.0005', minKm: 10,
    // ONE full-extent box (auto-tiled) — 2026-09-08 trace-west fix: the five
    // hand-drawn bands used before skipped main-stem segments between box
    // edges; the named-match bbox stopped mid-course at the band edge.
    envs: ['-88.60,34.20,-83.60,36.90'],
    // The through-pool artificial paths carry the RESERVOIR gnis_name in NHD
    // (Guntersville Lake etc.), not the river name — keep them all.
    nameTest: /^(Tennessee River|Guntersville Lake|Wheeler Lake|Wilson Lake|Kentucky Lake|Pickwick Lake|Watts Bar Lake|Chickamauga Lake|Nickajack Lake|Fort Loudoun Lake)$/i },
  // --- west Tennessee rivers ---
  { key: 'river-wolf-west', mao: '0.0004', minKm: 10, envs: ['-90.30,34.90,-88.85,35.50'], nameTest: /^Wolf River$/i },
  { key: 'river-hatchie', mao: '0.0004', minKm: 10, envs: ['-89.85,34.95,-88.75,35.90'], nameTest: /(Hatchie)/i },
  { key: 'river-obion', mao: '0.0004', minKm: 10, envs: ['-89.85,35.70,-88.55,36.50'], nameTest: /^Obion River$/i },
  { key: 'river-harpeth', mao: '0.0004', minKm: 10, envs: ['-87.30,35.70,-86.50,36.35'], nameTest: /^Harpeth River$/i },
  { key: 'river-buffalo', mao: '0.0004', minKm: 10, envs: ['-88.00,35.20,-87.10,36.20'], nameTest: /^(Buffalo River|Little Buffalo River)$/i },
  // --- middle Tennessee ---
  { key: 'creek-cane-hickman', mao: '0.0003', minKm: 8,
    // envelope 2 added 2026-09-08: the ONE cane-creek catalog id also covers
    // the same-named Bledsoe/Van Buren Cane Creek ~2.3 deg east (DELIBERATE
    // allowlist) — both waters must rebuild from their own level paths.
    envs: ['-87.85,35.55,-87.20,36.00', '-85.80,35.50,-85.00,35.95'], nameTest: /^Cane Creek$/i },
  { key: 'river-calfkiller', mao: '0.0003', minKm: 5, envs: ['-85.55,35.75,-85.25,36.15'], nameTest: /^Calfkiller/i },
  { key: 'river-red', mao: '0.0004', minKm: 10,
    // widened east 2026-09-08: the named Red River continues past the old
    // -86.85 edge toward its KY headwaters; catalog gate trims on delivery.
    envs: ['-87.45,36.40,-86.30,36.90'], nameTest: /^Red River$/i },
  { key: 'creek-salt-lick', mao: '0.0002', minKm: 5,
    // widened 2026-09-08: the old [-86.00,36.40,-85.75,36.70] window missed
    // the creek's middle course (2 chunks / 9.21 km gap in continuity).
    envs: ['-86.30,36.30,-85.55,36.80'], nameTest: /^Salt Lick Creek$/i },
  { key: 'creek-white-oak', mao: '0.0003', minKm: 5, envs: ['-87.95,36.10,-87.50,36.30'], nameTest: /White ?Oak Creek/i },
  { key: 'creek-hurricane', mao: '0.0003', minKm: 3,
    // widened 2026-09-08: the LEFT-OPEN 34.5 km hole between 2 chains needs
    // the full same-name extent before the level paths can be separated.
    envs: ['-88.10,35.80,-87.40,36.50'], nameTest: /^Hurricane Creek$/i },
  { key: 'creek-sulfur-fork', mao: '0.0003', minKm: 5, envs: ['-87.20,36.40,-86.30,36.70'], nameTest: /Sul?phur Fork/i },
  { key: 'river-stones', mao: '0.0004', minKm: 5, envs: ['-86.85,35.60,-86.00,36.30'], nameTest: /Stones River/i },
  // --- small catalog streams ---
  { key: 'creek-big-rock', mao: '0.0003', minKm: 3, envs: ['-86.90,35.30,-86.55,35.65'], nameTest: /^Big Rock Creek$/i },
  { key: 'creek-pine-dekalb', mao: '0.0002', minKm: 3, envs: ['-86.00,35.80,-85.60,36.10'], nameTest: /^Pine Creek$/i },
  { key: 'river-rocky', mao: '0.0003', minKm: 3, envs: ['-85.65,35.50,-85.40,35.80'], nameTest: /^Rocky River$/i },
  { key: 'creek-upper-hills', mao: '0.0002', minKm: 2, envs: ['-85.75,35.53,-85.60,35.60'], nameTest: /^Hills Creek$/i },
  { key: 'river-barren-fork', mao: '0.0003', minKm: 5, envs: ['-86.05,35.55,-85.60,35.95'], nameTest: /^Barren Fork/i },
  { key: 'creek-charles', mao: '0.0002', minKm: 2, envs: ['-86.00,35.70,-85.70,35.85'], nameTest: /^Charles Creek$/i },
  { key: 'fork-fletchers', mao: '0.0002', minKm: 2, envs: ['-87.55,36.50,-87.40,36.65'], nameTest: /^Fletchers Fork$/i },
  { key: 'creek-little-west-fork', mao: '0.0002', minKm: 3, envs: ['-87.55,36.55,-87.30,36.65'], nameTest: /Little West Fork/i },
  { key: 'creek-mccutcheon', mao: '0.0002', minKm: 3, envs: ['-87.00,35.65,-86.85,35.85'], nameTest: /^McCutcheon Creek$/i },
  { key: 'creek-shoal', mao: '0.0003', minKm: 5, envs: ['-87.65,34.95,-87.25,35.30'], nameTest: /^Shoal Creek$/i },
  { key: 'creek-boiling-fork', mao: '0.0002', minKm: 2, envs: ['-86.15,35.10,-85.90,35.25'], nameTest: /^Boiling Fork Creek$/i },
  { key: 'creek-standing-rock', mao: '0.0002', minKm: 2, envs: ['-88.05,36.38,-87.80,36.50'], nameTest: /^Standing Rock Creek$/i },
  { key: 'creek-north-prong-barren', mao: '0.0002', minKm: 2, envs: ['-86.00,35.65,-85.90,35.75'], nameTest: /^North Prong Barren/i },
  { key: 'creek-sinking', mao: '0.0003', minKm: 3, envs: ['-86.60,36.00,-86.20,36.25'], nameTest: /^Sinking Creek$/i },
  { key: 'creek-east-fork-shoal', mao: '0.0002', minKm: 2, envs: ['-87.25,34.95,-87.00,35.15'], nameTest: /^East Fork Shoal Creek$/i },
  // --- follow-up wave 2 (orchestrator follow-up, 2026-09-09) ---
  { key: 'river-collins', mao: '0.0003', minKm: 5,
    // south edge widened to 35.35: the canonical Collins bbox reaches 35.3927
    envs: ['-85.85,35.35,-85.50,35.85'], nameTest: /^Collins River$/i },
  { key: 'river-caney-fork', mao: '0.0004', minKm: 5,
    envs: ['-86.05,35.50,-84.95,36.40'], nameTest: /^Caney Fork( River)?$/i },
  { key: 'creek-laurel-johnson', mao: '0.0002', minKm: 2,
    envs: ['-81.95,36.42,-81.60,36.72'], nameTest: /^Laurel Creek$/i },
  { key: 'creek-middle-prong-little-pigeon', mao: '0.0002', minKm: 2,
    envs: ['-83.55,35.60,-83.15,35.82'], nameTest: /^Middle Prong( of )?\s*Little Pigeon/i },
  { key: 'creek-north-chickamauga', mao: '0.0003', minKm: 5,
    envs: ['-85.55,35.00,-85.05,35.40'], nameTest: /^North Chickamauga Creek$/i },
];

/** Water's named level paths from the retained attributes (same weighting as
 * scripts/trace-west/lib.mjs levelPathGroups). */
function namedLevelPaths(attrs, nameTest, minKm) {
  const byLp = new Map();
  for (const a of attrs.values()) {
    if (!nameTest.test(a.gnis_name ?? '')) continue;
    const lp = String(a.levelpathi ?? '');
    byLp.set(lp, (byLp.get(lp) ?? 0) + (a.lengthkm ?? 0));
  }
  const groups = [...byLp.entries()].map(([lp, km]) => ({ lp, km })).sort((x, y) => y.km - x.km);
  if (!groups.length) return new Set();
  const max = groups[0].km;
  return new Set(groups.filter((g) => g.km >= Math.max(minKm, 0.08 * max)).map((g) => g.lp));
}

function withinOnly(key) {
  return !only.size || only.has(key);
}

mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const summary = [];
  const failures = [];
  for (const sys of SYSTEMS) {
    if (!withinOnly(sys.key)) continue;
    const file = join(OUT_DIR, `${sys.key}.json`);
    if (!force && existsSync(file)) { console.log(`= ${sys.key}: cached`); continue; }
    try {
      console.log(`+ ${sys.key}: discovery …`);
      const attrs = await discoverAll(sys.envs);
      const namedIds = [];
      const refillIds = [];
      const selected = namedLevelPaths(attrs, sys.nameTest, sys.minKm ?? 3);
      for (const [id, a] of attrs) {
        const name = a.gnis_name ?? '';
        if (sys.nameTest.test(name)) namedIds.push(id);
        else if (!name.trim() && selected.has(String(a.levelpathi ?? ''))) refillIds.push(id);
      }
      console.log(`    ${attrs.size} flowlines retained | ${namedIds.length} named matches | ${refillIds.length} unnamed refill reaches (level paths ${[...selected].join(', ') || 'none'})`);
      const feats = namedIds.length ? await fetchGeometry(namedIds, sys.mao) : [];
      if (refillIds.length) {
        const refills = await fetchGeometry(refillIds, sys.mao, 'refill');
        for (const f of refills) f.properties._refill = true;
        feats.push(...refills);
      }
      writeFileSync(file, JSON.stringify({
        key: sys.key, service: `${SVC}/${NETFLOW}/query`, retrieved: RETRIEVED,
        envelopes: sys.envs, nameTest: String(sys.nameTest),
        features: feats,
      }));
      const km = feats.reduce((s, f) => s + (f.properties?.lengthkm ?? 0), 0);
      summary.push(`${sys.key}: ${feats.length - refillIds.length} named + ${refillIds.length} refill parts, ${km.toFixed(1)} km`);
    } catch (e) {
      failures.push(sys.key);
      console.log(`!! ${sys.key}: ${String(e).slice(0, 200)}`);
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
