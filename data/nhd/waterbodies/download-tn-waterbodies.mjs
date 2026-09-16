#!/usr/bin/env node
/**
 * Download USGS NHD (National Hydrography Dataset) High Resolution waterbody
 * polygons for the Tennessee area from the official USGS National Map ArcGIS
 * REST service and assemble them into a single GeoJSON extract.
 *
 *   Service:  https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer
 *   Layer:    12 "Waterbody - Large Scale" (esriGeometryPolygon, high-res NHD)
 *   License:  USGS — public domain (see service description / NOTES.md)
 *
 * Raw per-page responses are stored in raw/ (git-ignored); the merged extract
 * is written to tn-waterbodies.geojson in EPSG:4326.
 *
 * Usage:
 *   node download-tn-waterbodies.mjs [--min-area 0.05] [--bbox w,s,e,n]
 *
 * Property mapping (source -> output):
 *   PERMANENT_IDENTIFIER -> permanent_identifier
 *   GNIS_ID              -> gnis_id
 *   GNIS_NAME            -> gnis_name
 *   FTYPE                -> ftype
 *   FCODE                -> fcode
 *   AREASQKM             -> area_sqkm
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, 'raw');
const OUT_FILE = join(HERE, 'tn-waterbodies.geojson');

const SERVICE_URL = 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12/query';
// Tennessee bounding box (generous; also captures Kentucky Lake's KY extent).
const DEFAULT_BBOX = [-90.31, 34.98, -81.65, 36.69];
// Lake/Pond (390) and Reservoir (362) feature types.
const FTYPE_FILTER = 'FTYPE IN (390, 362)';

function parseArgs(argv) {
  const args = { minArea: 0.05, bbox: DEFAULT_BBOX };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--min-area') args.minArea = Number(argv[++i]);
    else if (argv[i] === '--bbox') args.bbox = argv[++i].split(',').map(Number);
  }
  return args;
}

function buildUrl({ bbox, minArea }, offset, limit) {
  const [w, s, e, n] = bbox;
  const params = new URLSearchParams({
    where: `${FTYPE_FILTER} AND AREASQKM >= ${minArea}`,
    geometry: `${w},${s},${e},${n}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'PERMANENT_IDENTIFIER,GNIS_ID,GNIS_NAME,FTYPE,FCODE,AREASQKM',
    orderByFields: 'OBJECTID', // required by the service for resultOffset paging
    returnGeometry: 'true',
    outSR: '4326',
    resultOffset: String(offset),
    resultRecordCount: String(limit),
    f: 'geojson',
  });
  return `${SERVICE_URL}?${params.toString()}`;
}

async function fetchPage(url, attempt = 1) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
      return fetchPage(url, attempt + 1);
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (starts: ${text.slice(0, 120)})`);
  }
}

function roundCoords(c) {
  // 6 decimals ~ 0.1 m precision; drops nothing but shrinks the file.
  if (Array.isArray(c[0])) return c.map(roundCoords);
  return [Math.round(c[0] * 1e6) / 1e6, Math.round(c[1] * 1e6) / 1e6];
}

async function main() {
  const opts = parseArgs(process.argv);
  mkdirSync(RAW_DIR, { recursive: true });

  let limit = 500; // >500 with full geometry triggers HTTP 500 server-side
  const all = new Map(); // permanent_identifier -> feature (dedupe)
  let offset = 0;
  let page = 0;
  let done = false;

  while (!done) {
    const url = buildUrl(opts, offset, limit);
    let data;
    try {
      data = await fetchPage(url);
    } catch (err) {
      if (limit > 100) {
        limit = Math.max(100, Math.floor(limit / 2));
        console.warn(`query failed (${err.message}); retrying with page size ${limit}`);
        continue;
      }
      throw err;
    }
    if (data.error) throw new Error(`Service error: ${JSON.stringify(data.error)}`);
    const feats = data.features ?? [];
    writeFileSync(join(RAW_DIR, `page-${String(page).padStart(4, '0')}.json`), JSON.stringify(data));
    for (const f of feats) {
      const p = f.properties ?? {};
      const pid = p.permanent_identifier ?? p.PERMANENT_IDENTIFIER;
      if (pid && !all.has(pid)) all.set(pid, { geometry: f.geometry, properties: p });
    }
    process.stdout.write(`page ${page}: +${feats.length} (total ${all.size})\n`);
    // GeoJSON responses omit exceededTransferLimit; short page means done.
    const etl = data.exceededTransferLimit ?? data.properties?.exceededTransferLimit;
    if (etl === false || (etl == null && feats.length < limit)) done = true;
    offset += feats.length;
    page++;
  }

  const collection = {
    type: 'FeatureCollection',
    name: 'nhd-hr-tn-waterbodies',
    source: 'USGS National Hydrography Dataset High Resolution, National Map ArcGIS REST service nhd/MapServer layer 12 (Waterbody - Large Scale)',
    sourceUrl: 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12',
    license: 'USGS data — public domain (acknowledgment appreciated)',
    retrieved: new Date().toISOString().slice(0, 10),
    filter: `FTYPE IN (390,362) AND AREASQKM >= ${opts.minArea}, intersects TN bbox ${opts.bbox.join(',')}`,
    crs: 'EPSG:4326 (coordinateOrder: longitude,latitude)',
    propertyMapping: {
      PERMANENT_IDENTIFIER: 'permanent_identifier',
      GNIS_ID: 'gnis_id',
      GNIS_NAME: 'gnis_name',
      FTYPE: 'ftype',
      FCODE: 'fcode',
      AREASQKM: 'area_sqkm',
    },
    features: [...all.values()].map(({ geometry, properties: p }) => ({
      type: 'Feature',
      properties: {
        permanent_identifier: String(p.permanent_identifier ?? p.PERMANENT_IDENTIFIER),
        gnis_id: p.gnis_id ?? p.GNIS_ID ?? null,
        gnis_name: p.gnis_name ?? p.GNIS_NAME ?? null,
        ftype: p.ftype ?? p.FTYPE ?? null,
        fcode: p.fcode ?? p.FCODE ?? null,
        area_sqkm: p.area_sqkm ?? p.AREASQKM ?? null,
      },
      geometry: { type: geometry.type, coordinates: roundCoords(geometry.coordinates) },
    })),
  };

  writeFileSync(OUT_FILE, JSON.stringify(collection));
  const mb = (existsSync(OUT_FILE) ? readFileSync(OUT_FILE).length : 0) / 1e6;
  console.log(`wrote ${OUT_FILE}: ${collection.features.length} features, ${mb.toFixed(1)} MB`);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
