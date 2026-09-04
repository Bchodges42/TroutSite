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
      // (waterbody connector reaches — e.g. the Caney Fork through its lakes)
      where: `(fcode=46006 OR fcode=46003 OR fcode=55800) AND gnis_name LIKE '${t.like}'`,
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
