#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * EAST/SOUTHEAST TENNESSEE hydrography fetch — Session E-S (lead hydrographic
 * data engineer, East & Southeast TN).
 *
 * Fetches authoritative geometry for the East/Southeast audit lane into
 * apps/web/.atlas-src/east-southeast/ (git-ignored build cache). Everything is
 * public domain. Subcommands (all idempotent; pass --force to refetch):
 *
 *   node scripts/fetch-east-southeast-hydro.mjs twra       TWRA RiversReservoirs FeatureServer layers 0/1 (the "Tennessee waterways" experience sources)
 *   node scripts/fetch-east-southeast-hydro.mjs wbd        USGS WBD HUC8 units intersecting the region (watershed windows)
 *   node scripts/fetch-east-southeast-hydro.mjs waterbody  USGS NHDPlus HR NHDWaterbody polygons, whole-part per window (NO county clipping)
 *   node scripts/fetch-east-southeast-hydro.mjs flowline   USGS NHDPlus HR NHDFlowline reaches for named targets (network + non-network)
 *   node scripts/fetch-east-southeast-hydro.mjs gauges     USGS NWIS site coordinates for dam/catalog gauges
 *   node scripts/fetch-east-southeast-hydro.mjs gauges     USGS NWIS site coordinates for dam/catalog gauges
 *   node scripts/fetch-east-southeast-hydro.mjs all        everything
 *
 * Sources (retrieval date recorded per cache file in fetched.json):
 * - USGS NHDPlus HR ArcGIS: https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer (layers 3,4,9,2)
 * - USGS WBD ArcGIS: https://hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer (layer 4 = HUC8)
 * - TWRA RiversReservoirs FeatureServer (the layer pair behind the Tennessee
 *   waterways ArcGIS experience): https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/RiversReservoirs/FeatureServer
 * - USGS NWIS site service: https://waterservices.usgs.gov/nwis/site/
 */
const CACHE = new URL('../.atlas-src/east-southeast/', import.meta.url);
const FORCE = process.argv.includes('--force');
const only = (process.argv[2] ?? 'all');

const NHD_BASE = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const WBD_HUC8 = 'https://hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer/4/query';
const TWRA_BASE = 'https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/RiversReservoirs/FeatureServer';
const NWIS = 'https://waterservices.usgs.gov/nwis/site';

const REGION = [-85.95, 34.9, -81.65, 36.8]; // East/SE TN + cross-state margins (VA/NC/GA/AL edges)

// Whole-part fetch windows for NHDWaterbody (≤ ~1.1° × 0.55°; the service
// rejects the 4°-wide envelopes B13 hit with HTTP 504). These are REGION
// windows, not county windows — polygons are fetched complete, keyed by
// Permanent_Identifier, so state/county seams never clip them.
const WINDOWS = [
  { key: 'tri-cities', env: [-82.75, 36.20, -81.75, 36.80] },  // South Holston(+VA), Boone, FPH, Wilbur, Watauga Lk, Cherokee head
  { key: 'cherokee-douglas', env: [-83.70, 35.90, -82.70, 36.45] }, // Cherokee Lk, Douglas Lk
  { key: 'norris', env: [-84.40, 36.05, -83.25, 36.62] },      // Norris Lk, Clinch, Powell
  { key: 'knoxville', env: [-84.40, 35.52, -83.50, 36.05] },   // Fort Loudoun, Tellico, Little T lower
  { key: 'watts-bar', env: [-85.05, 35.50, -84.15, 36.00] },   // Watts Bar, Melton Hill, Clinch tail, Emory mouth
  { key: 'chickamauga', env: [-85.25, 35.02, -84.45, 35.60] }, // Chickamauga Lk, Hiwassee mouth
  { key: 'chattanooga', env: [-85.80, 34.92, -85.00, 35.40] }, // Nickajack Lk, Chickamauga south, TN R
  { key: 'ocoee-hiwassee', env: [-84.95, 34.88, -84.05, 35.40] }, // Parksville/Ocoee, Hiwassee upper, Appalachia margin
  { key: 'chilhowee', env: [-84.20, 35.45, -83.35, 35.95] },   // Chilhowee, Calderwood, Little T upper
  { key: 'tenn-west-sweep', env: [-88.65, 34.95, -87.70, 36.75] }, // Tennessee River west reach (shared tennessee-river id)
];

// Named NHD flowline targets: [key, gnis_name SQL LIKE, envelope]. Envelopes
// bound the FULL extent of the reach including cross-state ends — never a
// county clip. Precision 6 / offset 0.00005 keeps dam + confluence geometry
// exact; size is trimmed at build time if needed.
const FLOWLINE_TARGETS = [
  { key: 'tennessee-river-east', like: 'Tennessee River', env: [-85.85, 34.90, -83.50, 36.15] },
  { key: 'tennessee-river-west', like: 'Tennessee River', env: [-88.65, 34.95, -87.70, 36.75] },
  { key: 'holston-river', like: 'Holston River', env: [-84.10, 35.80, -82.40, 36.70] },
  { key: 'north-fork-holston', like: 'North Fork Holston River', env: [-83.00, 36.40, -82.30, 36.90] },
  { key: 'south-fork-holston', like: 'South Fork Holston River', env: [-82.40, 36.30, -81.70, 36.90] },
  // Lower SF Holston: Boone Dam -> Fort Patrick Henry Dam -> Kingsport
  // confluence (-82.44..-82.62) lies WEST of the envelope above; the old B13
  // cache (precision 4) is superseded by this precision-6 take.
  { key: 's-fork-holston-lower', like: 'South Fork Holston River', env: [-82.70, 36.30, -82.05, 36.65] },
  { key: 'watauga-river', like: 'Watauga River', env: [-82.60, 36.15, -81.75, 36.65] },
  { key: 'little-tennessee', like: 'Little Tennessee River', env: [-84.35, 35.25, -83.45, 35.95] }, // -84.35: the lower Little T (Tellico Dam -> TN River mouth) is WEST of -84.20
  { key: 'hiwassee-river', like: 'Hiwassee River', env: [-85.15, 35.00, -84.10, 35.50] },
  { key: 'ocoee-river', like: 'Ocoee River', env: [-84.85, 34.88, -84.30, 35.25] },
  { key: 'tellico-river', like: 'Tellico River', env: [-84.45, 35.22, -84.00, 35.52] },
  { key: 'clinch-river', like: 'Clinch River', env: [-84.75, 35.70, -83.75, 36.50] },
  { key: 'powell-river', like: 'Powell River', env: [-84.15, 36.20, -83.15, 36.80] },
  { key: 'french-broad-river', like: 'French Broad River', env: [-84.05, 35.70, -82.70, 36.25] },
  { key: 'pigeon-river', like: 'Pigeon River', env: [-83.40, 35.65, -82.85, 36.15] },
  { key: 'little-pigeon-river', like: 'Little Pigeon River', env: [-83.75, 35.50, -83.20, 36.05] },
  { key: 'nolichucky-river', like: 'Nolichucky River', env: [-83.35, 35.80, -82.05, 36.50] },
  { key: 'doe-river', like: 'Doe River', env: [-82.30, 36.10, -81.95, 36.45] },
  { key: 'little-river-blount', like: 'Little River', env: [-84.05, 35.52, -83.40, 35.95] },
];

// USGS NWIS sites: dam-tailwater gauges + catalog gauges for reaches this lane
// rebuilds. Discovered per-dam with a bBox search, then re-fetched by site so
// the cache holds canonical NAD83 dec_lat_va/dec_long_va.
const NWIS_DAM_SITES = {
  'norris': '03533000',      // Clinch River below Norris Dam
  'melton-hill': '03533500', // Clinch River below Melton Hill Dam (verify by search)
  'south-holston': '03476500',
  'boone': '03486810',
  'ft-patrick-henry': '03487010',
  'wilbur': '03484000',
  'cherokee': '03537000',    // Holston River below Cherokee Dam (verify by search)
  'fort-loudoun': '03535500', // Little Tennessee R abv Ft Loudoun Dam? (verify)
  'tellico': '03536550',     // Tellico R abv Tellico Dam? (verify)
  'watts-bar': '03571770',   // Tennessee R at Watts Bar Dam? (verify)
  'chickamauga': '03566000', // Tennessee R below Chickamauga Dam (verify)
  'nickajack': '03571000',   // Tennessee R below Nickajack Dam (verify)
  'ocoee': '03564500',       // Ocoee River nr Caney Creek (below Parksville Dam)
  'hiwassee': '03565500',    // Hiwassee River at Charleston
  'watauga': '03465500',     // Watauga River below Watauga Dam (verify)
};
const NWIS_BBOX_SITES = {
  'watauga-dam': [-82.25, 36.25, -82.05, 36.45],
  'cherokee-dam': [-83.55, 36.02, -83.30, 36.18],
  'fort-loudoun-dam': [-84.25, 35.72, -84.05, 35.90],
  'tellico-dam': [-84.35, 35.72, -84.15, 35.88],
  'watts-bar-dam': [-84.85, 35.70, -84.65, 35.88],
  'chickamauga-dam': [-85.35, 35.00, -85.15, 35.18],
  'nickajack-dam': [-85.72, 34.92, -85.52, 35.10],
  'melton-hill-dam': [-84.37, 35.80, -84.17, 35.98],
  'norris-dam': [-84.18, 36.14, -83.98, 36.32],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { mkdirSync, writeFileSync, existsSync, readFileSync } = await import('node:fs');

const fetched = existsSync(new URL('fetched.json', CACHE))
  ? JSON.parse(readFileSync(new URL('fetched.json', CACHE), 'utf8'))
  : {};
function markFetched(key, meta) {
  fetched[key] = { retrieved: new Date().toISOString().slice(0, 10), ...meta };
  writeFileSync(new URL('fetched.json', CACHE), JSON.stringify(fetched, null, 2));
}
function cached(name) {
  return existsSync(new URL(name, CACHE));
}
async function post(url, params, tries = 4) {
  const body = new URLSearchParams(params);
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: 'POST', body, signal: AbortSignal.timeout(180000) });
      const text = await res.text();
      if (res.ok && (text.startsWith('{') || text.startsWith(' '))) return JSON.parse(text);
      console.log(`  retry ${i + 1}: http ${res.status} ${text.slice(0, 100)}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 120)}`);
    }
    await sleep(6000);
  }
  throw new Error('query failed after retries');
}
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      const text = await res.text();
      // RDB (NWIS) begins with '#' and is returned as raw text; ArcGIS JSON
      // begins with '{' or ' ' and is parsed.
      if (res.ok && text.startsWith('#')) return text;
      if (res.ok && (text.startsWith('{') || text.startsWith(' '))) return JSON.parse(text);
      console.log(`  retry ${i + 1}: http ${res.status} ${text.slice(0, 100)}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 120)}`);
    }
    await sleep(6000);
  }
  throw new Error('get failed after retries');
}

// NHD id-collection + geometry fetch (same two-phase pattern as fetch-nhd-targets.mjs)
async function fetchNhdLayer(layer, where, env, outFields, offsetTol) {
  const ids = [];
  let offset = 0;
  for (;;) {
    const j = await post(`${NHD_BASE}/${layer}/query`, {
      where, geometry: env.join(','), geometryType: 'esriGeometryEnvelope', inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects', returnIdsOnly: 'true', resultOffset: String(offset), f: 'pjson',
    });
    const batch = j.objectIds ?? [];
    ids.push(...batch);
    if (batch.length < 1000 || !j.exceededTransferLimit) break;
    offset += batch.length;
    await sleep(1500);
  }
  const feats = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150);
    const j = await post(`${NHD_BASE}/${layer}/query`, {
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields, returnGeometry: 'true', geometryPrecision: '6',
      maxAllowableOffset: offsetTol, outSR: '4326', f: 'geojson',
    });
    feats.push(...(j.features ?? []));
    if ((i / 150) % 5 === 4) console.log(`  geom ${Math.min(i + 150, ids.length)}/${ids.length}`);
    await sleep(1500);
  }
  return feats;
}

async function twra() {
  for (const [layer, name] of [[0, 'rivers'], [1, 'reservoirs']]) {
    const file = `twra-${name}.geojson`;
    if (!FORCE && cached(file)) { console.log(`= twra ${name} cached`); continue; }
    console.log(`== TWRA ${name} (layer ${layer})`);
    const j = await get(`${TWRA_BASE}/${layer}/query?where=1%3D1&outFields=*&outSR=4326&f=geojson&resultRecordCount=400`);
    writeFileSync(new URL(file, CACHE), JSON.stringify(j));
    markFetched(file, {
      source: 'TWRA RiversReservoirs FeatureServer',
      url: `${TWRA_BASE}/${layer}/query`,
      layer: name, features: j.features?.length ?? 0, license: 'public (TWRA open data)',
    });
  }
}

async function wbd() {
  const file = 'wbd-huc8.geojson';
  if (!FORCE && cached(file)) { console.log('= wbd huc8 cached'); return; }
  console.log('== WBD HUC8');
  const j = await post(WBD_HUC8, {
    where: '1=1', geometry: REGION.join(','), geometryType: 'esriGeometryEnvelope',
    inSR: '4326', spatialRel: 'esriSpatialRelIntersects', outFields: 'huc8,name,states,area_sqkm',
    returnGeometry: 'true', geometryPrecision: '5', maxAllowableOffset: '0.005', outSR: '4326', f: 'geojson',
  });
  writeFileSync(new URL(file, CACHE), JSON.stringify(j));
  console.log(`  HUC8 units: ${j.features?.length ?? 0}`);
  for (const f of j.features ?? []) console.log(`  ${f.properties.huc8} ${f.properties.name}`);
  markFetched(file, {
    source: 'USGS Watershed Boundary Dataset (HUC8)', url: WBD_HUC8,
    features: j.features?.length ?? 0, license: 'public domain (USGS)',
  });
}

async function waterbody() {
  const where = "(ftype=390 OR ftype=436 OR ftype=460)"; // Lake/Pond, Reservoir, Stream/River area
  const outFields = 'permanent_identifier,gnis_id,gnis_name,fcode,ftype,areasqkm,reachcode';
  for (const w of WINDOWS) {
    const file = `wb-${w.key}.geojson`;
    if (!FORCE && cached(file)) { console.log(`= wb ${w.key} cached`); continue; }
    console.log(`== waterbody ${w.key} [${w.env}]`);
    const feats = await fetchNhdLayer(9, where, w.env, outFields, '0.0001');
    writeFileSync(new URL(file, CACHE), JSON.stringify({ type: 'FeatureCollection', features: feats }));
    const names = {};
    for (const f of feats) {
      const n = f.properties.gnis_name ?? '(unnamed)';
      names[n] = (names[n] ?? 0) + 1;
    }
    console.log(`  feats=${feats.length} named=${Object.keys(names).length}`);
    markFetched(file, {
      source: 'USGS NHDPlus HR NHDWaterbody', url: `${NHD_BASE}/9/query`,
      window: w.env, features: feats.length, license: 'public domain (USGS)',
    });
  }
}

async function flowline() {
  const where = 'fcode IN (46006, 46003, 55800, 33400, 46003)';
  const outFields = 'gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde';
  for (const t of FLOWLINE_TARGETS) {
    const file = `fl-${t.key}.geojson`;
    if (!FORCE && cached(file)) { console.log(`= fl ${t.key} cached`); continue; }
    console.log(`== flowline ${t.key} like=[${t.like}]`);
    const feats = await fetchNhdLayer(3, `fcode IN (46006,46003,55800) AND gnis_name='${t.like}'`, t.env, outFields, '0.00005');
    writeFileSync(new URL(file, CACHE), JSON.stringify({ type: 'FeatureCollection', features: feats }));
    const parts = feats.reduce((n, f) => n + (f.geometry?.coordinates?.length ?? 0), 0);
    console.log(`  feats=${feats.length} verts=${parts}`);
    markFetched(file, {
      source: 'USGS NHDPlus HR NHDFlowline (network)', url: `${NHD_BASE}/3/query`,
      like: t.like, envelope: t.env, features: feats.length, license: 'public domain (USGS)',
    });
  }
}

async function gauges() {
  const file = 'nwis-gauges.json';
  if (!FORCE && cached(file)) { console.log('= gauges cached'); return; }
  console.log('== NWIS gauges (format=rdb, NAD83)');
  // NHD/NHDPlus HR services carry no dam-point layer (verified 2026-09-05:
  // NHDPoint fcode=39800 returns 0 features on both the HR and medium-res
  // services), so dam anchors come from USGS "below X Dam" gauge coordinates
  // — the same anchor class atlas-reach-gates.mjs already uses — cross-checked
  // against the Census AREAWATER lake footprints at each dam.
  function parseRdb(text) {
    const lines = text.split('\n').filter((l) => l && !l.startsWith('#'));
    if (lines.length < 2) return [];
    const header = lines[0].split('\t');
    return lines.slice(1).filter((l) => l.trim()).map((l) => {
      const vals = l.split('\t');
      const row = {};
      header.forEach((h, i) => { row[h] = vals[i]; });
      return row;
    });
  }
  const sites = {};
  const direct = Object.values(NWIS_DAM_SITES).filter(Boolean);
  if (direct.length) {
    const j = await get(`${NWIS}/?format=rdb&sites=${direct.join(',')}&siteOutput=expanded`);
    for (const s of parseRdb(j)) sites[s.site_no] = {
      name: s.station_nm, lat: Number(s.dec_lat_va), lon: Number(s.dec_long_va),
      huc: s.huc_cd, agency: s.agency_cd, county: `${s.state_cd}-${s.county_cd}`,
    };
  }
  for (const [key, env] of Object.entries(NWIS_BBOX_SITES)) {
    const j = await get(`${NWIS}/?format=rdb&bBox=${env.join(',')}&siteOutput=expanded&siteType=ST`);
    for (const s of parseRdb(j)) {
      if (!sites[s.site_no]) sites[s.site_no] = {
        name: s.station_nm, lat: Number(s.dec_lat_va), lon: Number(s.dec_long_va),
        huc: s.huc_cd, agency: s.agency_cd, county: `${s.state_cd}-${s.county_cd}`, discoveredBy: key,
      };
    }
    console.log(`  ${key}: total now ${Object.keys(sites).length}`);
    await sleep(1500);
  }
  writeFileSync(new URL(file, CACHE), JSON.stringify(sites, null, 2));
  markFetched(file, {
    source: 'USGS NWIS site service (NAD83 dec_lat_va/dec_long_va)',
    url: `${NWIS}/?format=rdb`, sites: Object.keys(sites).length, license: 'public domain (USGS)',
  });
}

mkdirSync(CACHE, { recursive: true });
// NHDArea (wide-river polygons) — pools NHD models as river areas rather than
// named waterbodies (Norris pool, the Tennessee River through Chattanooga,
// upper impoundment arms).
async function flowarea() {
  const where = '(ftype=460 OR ftype=336 OR ftype=466)';
  const outFields = 'permanent_identifier,gnis_id,gnis_name,fcode,ftype,areasqkm'; // NHDArea has no reachcode field
  for (const w of WINDOWS) {
    const file = `fa-${w.key}.geojson`;
    if (!FORCE && cached(file)) { console.log(`= fa ${w.key} cached`); continue; }
    console.log(`== flowarea ${w.key} [${w.env}]`);
    const feats = await fetchNhdLayer(8, where, w.env, outFields, '0.0001');
    writeFileSync(new URL(file, CACHE), JSON.stringify({ type: 'FeatureCollection', features: feats }));
    const named = feats.filter((f) => f.properties.gnis_name).length;
    console.log(`  feats=${feats.length} named=${named}`);
    markFetched(file, {
      source: 'USGS NHDPlus HR NHDArea', url: `${NHD_BASE}/8/query`,
      window: w.env, features: feats.length, license: 'public domain (USGS)',
    });
  }
}

// Medium-resolution NHD waterbodies — independent-geometry cross-check for the
// one pool NHDPlus HR does not carry as a named waterbody (Norris Lake,
// GNIS 01269832). 1:100k generalization; used for verification, not delivery.
async function nhdmed() {
  const file = 'nhdmed-waterbodies.geojson';
  if (!FORCE && cached(file)) { console.log('= nhdmed cached'); return; }
  console.log('== NHD (medium-res) waterbodies for cross-check');
  const names = ['Norris Lake'];
  const j = await post('https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12/query', {
    where: `GNIS_NAME IN (${names.map((n) => `'${n}'`).join(',')})`,
    geometry: REGION.join(','), geometryType: 'esriGeometryEnvelope', inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects', outFields: 'GNIS_NAME,GNIS_ID,FCODE,AREASQKM',
    returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: '0.0003', outSR: '4326', f: 'geojson',
  });
  writeFileSync(new URL(file, CACHE), JSON.stringify(j));
  console.log(`  feats=${j.features?.length ?? 0}`);
  markFetched(file, {
    source: 'USGS NHD (medium resolution) NHDWaterbody',
    url: 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12/query',
    features: j.features?.length ?? 0, license: 'public domain (USGS)',
  });
}


// NonNetworkNHDFlowline (layer 4): dam-pool / weir / spillway connectors that
// the routed network layer 3 omits — the documented cause of residual 0.4-1.2km
// line gaps at Norris weir, Watauga Dam pool, and the SF Holston weir.
async function flownonnetwork() {
  const outFields = 'gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm'; // layer 4 has no streamorde
  const targets = [
    { key: 'clinch-river', like: '%Clinch%', env: [-84.6, 35.7, -84.0, 36.35] },
    { key: 'watauga-river', like: '%Watauga%', env: [-82.6, 36.15, -81.75, 36.65] },
    { key: 's-fork-holston-lower', like: '%Holston%', env: [-82.70, 36.30, -82.05, 36.65] },
    { key: 'north-fork-holston', like: '%Holston%', env: [-83.0, 36.4, -82.3, 36.9] },
    { key: 'holston-river', like: '%Holston%', env: [-84.1, 35.8, -82.4, 36.7] },
    { key: 'ocoee-river', like: '%Ocoee%', env: [-84.85, 34.88, -84.3, 35.25] },
    { key: 'hiwassee-river', like: '%Hiwassee%', env: [-85.15, 35.0, -84.1, 35.5] },
    { key: 'little-tennessee', like: '%Tennessee%', env: [-84.2, 35.25, -83.45, 35.95] },
  ];
  for (const t of targets) {
    const file = `flnn-${t.key}.geojson`;
    if (!FORCE && cached(file)) { console.log(`= flnn ${t.key} cached`); continue; }
    console.log(`== flowline-nonnetwork ${t.key}`);
    const feats = await fetchNhdLayer(4, `((fcode=46006 OR fcode=46003 OR fcode=55800) AND (gnis_name LIKE '${t.like}' OR gnis_name IS NULL))`, t.env, outFields, '0.00005');
    writeFileSync(new URL(file, CACHE), JSON.stringify({ type: 'FeatureCollection', features: feats }));
    console.log(`  feats=${feats.length}`);
    markFetched(file, {
      source: 'USGS NHDPlus HR NonNetworkNHDFlowline', url: `${NHD_BASE}/4/query`,
      like: t.like, envelope: t.env, features: feats.length, license: 'public domain (USGS)',
    });
  }
}

const steps = { twra, wbd, waterbody, flowline, gauges, flowarea, nhdmed, flownonnetwork };
const run = only === 'all' ? Object.keys(steps) : [only];
for (const s of run) {
  if (!steps[s]) throw new Error(`unknown step ${s}`);
  await steps[s]();
}
console.log('fetch complete.');
