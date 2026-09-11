// Build-time fetch of USGS NHDPlus HR geometry for named waters that TIGER
// LINEARWATER omits or fragments (wide main stems, a few creeks).
// Baked to static files — zero runtime requests. Public domain (USGS).
// Run: node scripts/fetch-nhd-targets.mjs
const only = new Set((process.argv[2] ?? '').split(',').filter(Boolean));
// Envelopes cover the FULL Tennessee extent of each named water, including the
// tailwater/confluence ends that earlier envelopes clipped (B13: the French
// Broad envelope stopped short of the Holston confluence at Knoxville, the
// Stones envelope short of the Cumberland mouth, the Clinch envelope cut the
// Norris tailwater south of 35.9). Dam-gated sub-reaches (tailwaters) are
// trimmed in merge-rivers.mjs REACH_GATE using USGS gauge / GNIS dam points.
const TARGETS = [
  { key: 'white-oak', like: '%White Oak%', env: '-87.75,36.15,-87.3,36.5', streams: ['white-oak-creek'] },
  { key: 'french-broad', like: '%French Broad%', env: '-83.95,35.5,-82.4,36.3', streams: ['french-broad-river'] },
  { key: 'hiwassee', like: '%Hiwassee%', env: '-85.1,34.9,-83.9,35.7', streams: ['hiwassee-river'] },
  { key: 'obey', like: '%Obey%', env: '-85.55,36.2,-85.05,36.62', streams: ['obey-river'] },
  { key: 'mill-overton', like: '%Mill Creek%', env: '-85.55,36.2,-85.0,36.52', streams: ['mill-creek-overton'] },
  { key: 'roan', like: '%Roan%', env: '-82.15,36.35,-81.8,36.68', streams: ['upper-roan-creek'] },
  { key: 'byrd-richardson', like: '%Richardson%', env: '-83.35,36.35,-82.95,36.62', streams: ['richardson-byrd-creek'] },
  { key: 'byrd-creek', like: 'Byrd Creek', env: '-83.35,36.35,-82.95,36.62', streams: ['richardson-byrd-creek'] },
  { key: 'nprong-barren', like: '%Barren%', env: '-86.05,35.6,-85.6,35.95', streams: ['north-prong-barren-fork', 'barren-fork-river'] },
  // The wide -84.6..-82.0 Clinch envelope exceeded the service's processing
  // window (HTTP 504, retried 2026-09-04); only water west of Norris Dam
  // (lon -84.06, the gated tailwater) is consumed by merge-rivers.mjs, so the
  // envelope covers just that reach.
  { key: 'clinch', like: '%Clinch%', env: '-84.65,35.8,-84.0,36.4', streams: ['clinch-river'] },
  { key: 'watauga', like: '%Watauga%', env: '-82.7,36.0,-81.85,36.6', streams: ['watauga-river'] },
  { key: 's-holston', like: '%Holston%', env: '-82.9,36.25,-81.8,36.7', streams: ['south-holston-river', 'boone-tailwater', 'ft-patrick-henry-tailwater'] },
  { key: 'caney-fork', like: '%Caney Fork%', env: '-86.0,35.55,-85.0,36.35', streams: ['caney-fork-river'] },
  { key: 'nolichucky', like: '%Nolichucky%', env: '-83.35,35.85,-82.1,36.45', streams: ['nolichucky-river'] },
  { key: 'powell', like: '%Powell%', env: '-84.05,36.25,-82.95,36.7', streams: ['powell-river'] },
  { key: 'stones', like: '%Stones%', env: '-86.8,35.65,-86.0,36.3', streams: ['stones-river', 'west-fork-stones-river', 'east-fork-stones-river'] },
  { key: 's-cumberland', like: '%Cumberland%', env: '-85.05,36.35,-84.35,36.8', streams: ['south-fork-cumberland'] },
  { key: 'piney-rhea', like: '%Piney%', env: '-85.05,35.45,-84.55,35.9', streams: ['piney-river-rhea'] },
  { key: 'cane-hickman', like: 'Cane Creek', env: '-87.7,35.6,-87.2,36.0', streams: ['cane-creek'] },
  { key: 'ocoee', like: '%Ocoee%', env: '-84.85,34.95,-84.3,35.35', streams: ['ocoee-river', 'parksville-tailwater'] },
  { key: 'station-creek', like: 'Station Creek', env: '-83.7,36.4,-83.3,36.65', streams: ['station-creek'] },
  { key: 'mossy-creek-jefferson', like: 'Mossy Creek', env: '-83.65,36.0,-83.3,36.3', streams: ['mossy-creek-jefferson'] },
  { key: 'leconte-creek', like: '%onte Creek', env: '-83.7,35.6,-83.4,35.95', streams: ['leconte-creek'] },
  { key: 'forge-creek-johnson', like: 'Forge Creek', env: '-82.1,36.35,-81.65,36.65', streams: ['forge-creek-johnson'] },
  { key: 'elk', like: 'Elk River', env: '-87.05,34.95,-86.2,35.45', streams: ['elk-river', 'elk-river-lower'] },
  { key: 'duck', like: 'Duck River', env: '-87.1,35.4,-86.05,35.75', streams: ['duck-river-tailwater', 'duck-river-lower'] },
  // CONTINUITY lane (2026-09-04): per-stream corridor envelopes for the named
  // waters whose TIGER LINEARWATER coverage is sparse enough to render as
  // multiple disconnected chunks (see docs/CONTINUITY-AUDIT.md). Each envelope
  // bounds the full Tennessee extent of that one water; NHD takes are keyed by
  // exact gnis_name in merge-rivers.mjs, so same-named waters outside the
  // envelope can never leak in.
  { key: 'harpeth', like: 'Harpeth River', env: '-87.30,35.72,-86.55,36.32', streams: ['harpeth-river'] },
  { key: 'collins', like: 'Collins River', env: '-85.82,35.40,-85.54,35.82', streams: ['collins-river'] },
  { key: 'clear-fork', like: 'Clear Fork', env: '-85.02,36.02,-84.48,36.62', streams: ['clear-fork'] },
  // GNIS spells both "Sulfur Fork Creek" and "Sulphur ..."; the wide prefix
  // catches either spelling inside this Robertson/Sumner-corner envelope.
  { key: 'sulfur-fork', like: 'Sul%', env: '-87.22,36.34,-86.28,36.70', streams: ['sulfur-fork-creek'] },
  { key: 'emory', like: 'Emory River', env: '-84.72,35.90,-84.40,36.22', streams: ['emory-river'] },
  { key: 'hurricane-houston', like: 'Hurricane Creek', env: '-87.98,35.92,-87.52,36.42', streams: ['hurricane-creek'] },
  { key: 'sinking-wilson', like: 'Sinking Creek', env: '-86.46,36.00,-86.24,36.24', streams: ['sinking-creek-wilson'] },
  { key: 'daddys', like: 'Daddys Creek', env: '-85.16,35.72,-84.72,36.12', streams: ['daddys-creek'] },
  { key: 'efork-shoal', like: 'East Fork Shoal Creek', env: '-87.22,34.96,-87.02,35.14', streams: ['east-fork-shoal-creek'] },
  { key: 'indian-claiborne', like: 'Indian Creek', env: '-83.66,36.34,-83.36,36.64', streams: ['indian-creek-claiborne'] },
  { key: 'laurel-johnson', like: 'Laurel Creek', env: '-81.86,36.48,-81.70,36.64', streams: ['laurel-creek-johnson'] },
  { key: 'new-river-scott', like: 'New River', env: '-84.62,36.08,-84.28,36.46', streams: ['new-river'] },
  { key: 'n-chickamauga', like: 'North Chickamauga Creek', env: '-85.42,35.06,-85.12,35.32', streams: ['north-chickamauga-creek'] },
  { key: 'obed', like: 'Obed%', env: '-85.16,35.86,-84.58,36.14', streams: ['obed-river'] },
  { key: 'sequatchie', like: 'Sequatchie%', env: '-85.08,35.70,-84.93,35.88', streams: ['sequatchie-river'] },
  { key: 'fletchers', like: 'Fletchers Fork', env: '-87.56,36.52,-87.38,36.64', streams: ['fletchers-fork'] },
  { key: 'horse-greene', like: 'Horse Creek', env: '-82.88,36.03,-82.58,36.46', streams: ['horse-creek-greene'] },
  // French Broad braids below Seven Islands: the NAMED "French Broad River"
  // connectors hop channel to channel across a braided wide section, leaving a
  // ~1.3 km hole in the drawn line. The braid channels themselves are UNNAMED
  // 46006/55800 reaches in NHDPlus HR — fetched by this name-less corridor
  // target (gnis_name IS NULL) and consumed for french-broad-river in
  // merge-rivers.mjs. Envelope is tight around the braid only.
  { key: 'fbb-braid', like: null, env: '-82.95,35.91,-82.87,35.97', streams: ['french-broad-river'] },
  // ---- B15 missing-line rivers (docs/waterbody-inventory.json) ----
  // One corridor envelope per named water, sized to its FULL Tennessee extent
  // (inventory approximateLocation + countyOrRegion). Consumed by
  // build-missing-rivers.mjs; whole-part TN filter + contract properties there.
  // Wide rivers split into two overlapping envelopes (overlap keeps every part
  // whole: phase-2 geometry is fetched by OBJECTID, so a part intersecting
  // either envelope comes back complete; dedupe by NHD key at assembly).
  // Mississippi = the state-boundary mainstem ONLY; the narrow corridor keeps
  // the fetch inside the Tennessee line (AR/MS water never fetched). East cap
  // -89.40 (not -89.55): the channel bends east above Tiptonville to ~-89.46,
  // still well west of any interior TN water.
  { key: 'mississippi', like: 'Mississippi River', env: '-90.35,34.98,-89.40,36.60', streams: ['mississippi-river'] },
  { key: 'obion', like: '%Obion%', env: '-89.65,35.85,-88.65,36.7', streams: ['obion-river'] },
  { key: 'hatchie', like: '%Hatchie%', env: '-89.7,35.2,-88.95,36.1', streams: ['hatchie-river'] },
  { key: 'wolf-west', like: 'Wolf River', env: '-90.2,34.95,-89.05,35.35', streams: ['wolf-river-west-tennessee'] },
  { key: 'tennessee-river-east', like: 'Tennessee River', env: '-85.65,34.95,-83.55,36.1', streams: ['tennessee-river'] },
  { key: 'tennessee-river-west', like: 'Tennessee River', env: '-88.6,34.95,-87.75,36.7', streams: ['tennessee-river'] },
  { key: 'cumberland-upper', like: 'Cumberland River', env: '-86.95,36.05,-85.05,36.72', streams: ['cumberland-river'] },
  { key: 'cumberland-lower', like: 'Cumberland River', env: '-87.95,36.05,-86.85,36.72', streams: ['cumberland-river'] },
  { key: 'buffalo', like: '%Buffalo%', env: '-88.1,35.3,-87.2,36.0', streams: ['buffalo-river'] },
  { key: 'holston', like: 'Holston River', env: '-84.05,35.85,-82.45,36.65', streams: ['holston-river'] },
];

const BASE = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/3/query';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(params, tries = 4) {
  const body = new URLSearchParams(params);
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(BASE, { method: 'POST', body, signal: AbortSignal.timeout(120000) });
      const text = await res.text();
      if (res.ok && (text.startsWith('{') || text.startsWith(' '))) return JSON.parse(text);
      console.log(`  retry ${i + 1}: http ${res.status} ${text.slice(0, 80)}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 100)}`);
    }
    await sleep(5000);
  }
  throw new Error('query failed after retries');
}

const { writeFileSync, mkdirSync } = await import('node:fs');
mkdirSync(new URL('../.atlas-src/nhd', import.meta.url), { recursive: true });

for (const t of TARGETS.filter((t) => !only.size || only.has(t.key))) {
  console.log(`== ${t.key} like=[${t.like}]`);
  // phase 1: collect OBJECTIDs (paginated)
  const ids = [];
  let offset = 0;
  for (;;) {
    const p = {
      // 46006 Stream/River · 46003 Artificial Path · 55800 Stream/River
      // (waterbody connector reaches — e.g. the Caney Fork through its lakes).
      // like=null fetches UNNAMED reaches only (gnis_name IS NULL) — used by
      // the fbb-braid braid-channel corridor.
      where: `(fcode=46006 OR fcode=46003 OR fcode=55800) AND ${t.like ? `gnis_name LIKE '${t.like}'` : 'gnis_name IS NULL'}`,
      geometry: t.env, geometryType: 'esriGeometryEnvelope', inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects', returnIdsOnly: 'true',
      resultOffset: String(offset), f: 'pjson',
    };
    const j = await post(p);
    const batch = j.objectIds ?? [];
    ids.push(...batch);
    console.log(`  ids offset=${offset} got=${batch.length} total=${ids.length} exceeded=${j.exceededTransferLimit ?? false}`);
    if (batch.length < 1000 || !j.exceededTransferLimit) break;
    offset += batch.length;
    await sleep(2000);
  }
  // phase 2: geometry in batches of 150
  const feats = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150);
    const j = await post({
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields: 'gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde',
      returnGeometry: 'true', geometryPrecision: '4', maxAllowableOffset: '0.0005',
      outSR: '4326', f: 'geojson',
    });
    feats.push(...(j.features ?? []));
    console.log(`  geom ${Math.min(i + 150, ids.length)}/${ids.length}`);
    await sleep(2000);
  }
  const names = {};
  for (const f of feats) names[f.properties.gnis_name] = (names[f.properties.gnis_name] ?? 0) + 1;
  console.log(`  names: ${JSON.stringify(names)}`);
  writeFileSync(new URL(`../.atlas-src/nhd/${t.key}.geojson`, import.meta.url),
    JSON.stringify({ type: 'FeatureCollection', features: feats }));
}
console.log('NHD fetch complete.');
