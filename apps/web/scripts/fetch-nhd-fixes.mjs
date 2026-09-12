/* global AbortSignal, URL, URLSearchParams, console, fetch, process, setTimeout */
// East/southeast geometry-fix crew — targeted NHDPlus HR takes for the waters
// being rebuilt from source (tellico area, horse-creek-greene, brush-creek-cocke,
// wolf-river-fentress) plus an NHDWaterbody take for the norris-lake membership
// verification. Same fetch pattern as fetch-nhd-targets.mjs (fcode 46006/46003/
// 55800 flowlines, OBJECTID discovery then whole-feature geometry re-fetch by
// OBJECTID so every part is returned whole — never clipped by the envelope).
//
// Envelopes are county/watershed-scoped to exclude same-named waters:
//   tellico        'Tellico%'  — Monroe County TN river + pool arm reaches
//   citico         'Citico%'   — Monroe County TN creek (Cherokee NF to Tellico Lake)
//   horse-greene   'Horse Creek' — capped at 36.22N: the Washington County Horse
//                                Creek (36.42-36.53, Kingsport area) that leaked
//                                into the first-pass weld is north of the cap
//   brush-cocke    'Brush Creek' — Cocke County window near Newport (the Jefferson
//                                County Brush Creek / Douglas pool is west of -83.20)
//   wolf-fentress  'Wolf River'  — capped at -84.78W: the West Tennessee Wolf
//                                River (Memphis, -90..-89) is far outside
//   norris-wb      NHDWaterbody (layer 9) GNIS 'Norris%' — membership check only
// Run: node scripts/fetch-nhd-fixes.mjs [key ...]
const only = new Set((process.argv[2] ?? '').split(',').filter(Boolean));

const TARGETS = [
  { key: 'tellico', like: '%Tellico%', env: '-84.45,35.15,-84.00,35.55', streams: ['tellico-river'] },
  { key: 'citico', like: 'Citico%', env: '-84.25,35.25,-83.95,35.60', streams: ['citico-creek'] },
  { key: 'horse-greene', like: 'Horse Creek', env: '-82.78,35.98,-82.58,36.22', streams: ['horse-creek-greene'] },
  { key: 'brush-cocke', like: 'Brush Creek', env: '-83.20,35.80,-82.75,36.05', streams: ['brush-creek-cocke'] },
  { key: 'wolf-fentress', like: 'Wolf River', env: '-85.30,36.38,-84.78,36.75', streams: ['wolf-river-fentress'] },
  { key: 'norris-wb', like: '%Norris%', env: '-84.45,36.10,-83.75,36.65', layer: 9, outFields: 'gnis_name,gnis_id,nhdplusid,reachcode,fcode,areasqkm' },
];

const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(layer, params, tries = 4) {
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
  throw new Error('query failed after retries');
}

const { writeFileSync, mkdirSync } = await import('node:fs');
mkdirSync(new URL('../.atlas-src/nhd', import.meta.url), { recursive: true });

for (const t of TARGETS.filter((t) => !only.size || only.has(t.key))) {
  const layer = t.layer ?? 3; // 3 = NetworkNHDFlowline, 9 = NHDWaterbody
  console.log(`== ${t.key} layer=${layer} like=[${t.like}]`);
  const ids = [];
  let offset = 0;
  for (;;) {
    const p = {
      where: t.layer
        ? `gnis_name LIKE '${t.like}'`
        : `(fcode=46006 OR fcode=46003 OR fcode=55800) AND gnis_name LIKE '${t.like}'`,
      geometry: t.env, geometryType: 'esriGeometryEnvelope', inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects', returnIdsOnly: 'true',
      resultOffset: String(offset), f: 'pjson',
    };
    const j = await post(layer, p);
    const batch = j.objectIds ?? [];
    ids.push(...batch);
    console.log(`  ids offset=${offset} got=${batch.length} total=${ids.length} exceeded=${j.exceededTransferLimit ?? false}`);
    if (batch.length < 1000 || !j.exceededTransferLimit) break;
    offset += batch.length;
    await sleep(2000);
  }
  const feats = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150);
    const j = await post(layer, {
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields: t.outFields ?? 'gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde',
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
