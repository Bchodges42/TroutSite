// twra-layers-build.mjs — build the TWRA overlay map layers.
//
// Pulls two public ArcGIS FeatureServers behind TWRA's boating/fishing map
// (plain REST under the JS app) and writes same-origin assets for the web map:
//   apps/web/public/atlas/twra-attractors.geojson  (fish attractor structures in lakes)
//   apps/web/public/atlas/twra-stocking.geojson    (TWRA trout stocking sites)
//
// Usage:
//   node scripts/twra-layers-build.mjs           # fetch + write
//   node scripts/twra-layers-build.mjs --check   # validate committed files (no network)
//
// Both layers are context overlays (off by default, like the gauge layer);
// data credits belong to TWRA — carried in the map source attribution.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = {
  attractors: join(root, 'apps', 'web', 'public', 'atlas', 'twra-attractors.geojson'),
  stocking: join(root, 'apps', 'web', 'public', 'atlas', 'twra-stocking.geojson'),
};
const LAYER = (name) =>
  `https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/${name}/FeatureServer/0`;
const TN_BOX = { lonMin: -90.6, lonMax: -81.4, latMin: 34.7, latMax: 36.9 };

const clean = (v) => {
  const s = String(v ?? '').trim();
  return !s || s === 'null' || s === 'None' ? '' : s;
};
const inTN = ([lon, lat]) =>
  lon >= TN_BOX.lonMin && lon <= TN_BOX.lonMax && lat >= TN_BOX.latMin && lat <= TN_BOX.latMax;

/** Fetch every feature from a FeatureServer layer (paginated GeoJSON). */
export async function fetchLayer(layerName) {
  const features = [];
  const count = 1000;
  for (let offset = 0; ; offset += count) {
    const url =
      `${LAYER(layerName)}/query?where=1%3D1&outFields=*&f=geojson` +
      `&returnGeometry=true&resultRecordCount=${count}&resultOffset=${offset}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TroutSite/1.0 (twra-layers-build)', Accept: 'application/json' },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`${layerName} query failed: HTTP ${res.status}`);
    const page = await res.json();
    const batch = page.features ?? [];
    features.push(...batch);
    const exceeded = page.exceededTransferLimit ?? page.properties?.exceededTransferLimit;
    if (!exceeded || batch.length === 0) break;
  }
  return features;
}

function pointFeature([lon, lat], properties) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))] },
    properties,
  };
}

/** Drop empty-string properties — most attractor rows carry only a few fields. */
function compact(props) {
  return Object.fromEntries(Object.entries(props).filter(([, v]) => v !== ''));
}

export function buildAttractors(rows) {
  const features = [];
  for (const f of rows) {
    const p = f.properties ?? {};
    const coords = f.geometry?.coordinates;
    if (!Array.isArray(coords) || !inTN(coords)) continue;
    features.push(
      pointFeature(
        coords,
        compact({
          site: clean(p.Site_Name) || clean(p.WaterBody),
          water: clean(p.WaterBody),
          types: clean(p.StructureTypes),
          depth: clean(p.DepthRange),
          access: clean(p.Access_),
          marker: clean(p.Marker),
          note: clean(p.Note).slice(0, 160),
        }),
      ),
    );
  }
  return { type: 'FeatureCollection', features };
}

export function buildStocking(rows) {
  const seen = new Map(); // dedupe exact site+coordinate repeats in the master table
  const features = [];
  for (const f of rows) {
    const p = f.properties ?? {};
    const lat = Number.parseFloat(p.LATITUDE);
    const lon = Number.parseFloat(p.LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (!inTN([lon, lat])) continue;
    const key = `${clean(p.Site_Name)}|${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.set(key, true);
    features.push(
      pointFeature(
        [lon, lat],
        compact({
          site: clean(p.Site_Name),
          stream: clean(p.StreamName),
          county: clean(p.County)
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          region: clean(p.Region),
          program: clean(p.StockingProgram),
          class: clean(p.WaterClass),
          species: clean(p.Species),
          dh: clean(p.DelayedHarvestSeason),
          permit: clean(p.DailyPermitRequired),
          hours: clean(p.HoursOpen),
        }),
      ),
    );
  }
  return { type: 'FeatureCollection', features };
}

function summarize(name, fc, min) {
  const n = fc.features.length;
  return n >= min
    ? `${name}: ${n} features OK`
    : `${name}: only ${n} features (expected >= ${min})`;
}

function check(fc, name, min) {
  if (fc?.type !== 'FeatureCollection' || fc.features.length < min) {
    console.error(summarize(name, fc, min) + ' — FAILED');
    process.exit(1);
  }
  console.log(summarize(name, fc, min));
}

const isCheck = process.argv.includes('--check');
if (isCheck) {
  for (const [name, [file, min]] of Object.entries({
    attractors: [OUT.attractors, 1500],
    stocking: [OUT.stocking, 100],
  })) {
    if (!existsSync(file)) {
      console.error(`${file} missing — run without --check first`);
      process.exit(1);
    }
    check(JSON.parse(readFileSync(file, 'utf8')), name, min);
  }
} else {
  const attractors = buildAttractors(await fetchLayer('Fish_Attractor_Locations_view'));
  writeFileSync(OUT.attractors, JSON.stringify(attractors) + '\n');
  console.log(`wrote ${OUT.attractors}\n  ${summarize('attractors', attractors, 0)}`);
  const stocking = buildStocking(await fetchLayer('TWRA_Trout_Stocking_Locations'));
  writeFileSync(OUT.stocking, JSON.stringify(stocking) + '\n');
  console.log(`wrote ${OUT.stocking}\n  ${summarize('stocking', stocking, 0)}`);
}
