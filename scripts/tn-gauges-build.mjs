// tn-gauges-build.mjs — build the statewide USGS gauge map layer.
//
// Fetches every ACTIVE Tennessee stream gauge (USGS Waterservices site file,
// instantaneous + daily-value unions), annotates the gauges already wired to
// catalog waters (packages/content/streams/tn/*.yaml `gaugeIds:`), and writes
// a compact same-origin GeoJSON the web map ships as a public asset:
//   apps/web/public/atlas/gauges-tn.geojson
//
// Usage:
//   node scripts/tn-gauges-build.mjs           # fetch + write
//   node scripts/tn-gauges-build.mjs --check   # validate the committed file (no network)
//
// USGS site IDs are strings with leading zeros — never coerce them to numbers.
// The layer is a STATIC catalog (station inventory changes monthly at most);
// live readings are fetched per-gauge at runtime from /v1/gauges/:id/now.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'apps', 'web', 'public', 'atlas', 'gauges-tn.geojson');
const STREAMS_DIR = join(root, 'packages', 'content', 'streams', 'tn');

const SITE_FILE = (dataType) =>
  // siteOutput=expanded adds drain_area_va + county_nm, which the basic output omits.
  `https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=tn&siteType=ST&siteStatus=active&hasDataTypeCd=${dataType}&siteOutput=expanded`;
// TN bounding box sanity window (the map's own max bounds, slightly padded).
const TN_BOX = { lonMin: -90.6, lonMax: -81.4, latMin: 34.7, latMax: 36.9 };

// Expanded site files carry county_cd as a 5-digit FIPS; the site file never
// ships names. Tennessee's 95 counties are stable — map them here.
const TN_COUNTIES = {
  47001: 'Anderson',
  47003: 'Bedford',
  47005: 'Benton',
  47007: 'Bledsoe',
  47009: 'Blount',
  47011: 'Bradley',
  47013: 'Campbell',
  47015: 'Cannon',
  47017: 'Carroll',
  47019: 'Carter',
  47021: 'Cheatham',
  47023: 'Chester',
  47025: 'Claiborne',
  47027: 'Clay',
  47029: 'Cocke',
  47031: 'Coffee',
  47033: 'Crockett',
  47035: 'Cumberland',
  47037: 'Davidson',
  47039: 'Decatur',
  47041: 'DeKalb',
  47043: 'Dickson',
  47045: 'Dyer',
  47047: 'Fayette',
  47049: 'Fentress',
  47051: 'Franklin',
  47053: 'Gibson',
  47055: 'Giles',
  47057: 'Grainger',
  47059: 'Greene',
  47061: 'Grundy',
  47063: 'Hamblen',
  47065: 'Hamilton',
  47067: 'Hancock',
  47069: 'Hardeman',
  47071: 'Hardin',
  47073: 'Hawkins',
  47075: 'Haywood',
  47077: 'Henderson',
  47079: 'Henry',
  47081: 'Hickman',
  47083: 'Houston',
  47085: 'Humphreys',
  47087: 'Jackson',
  47089: 'Jefferson',
  47091: 'Johnson',
  47093: 'Knox',
  47095: 'Lake',
  47097: 'Lauderdale',
  47099: 'Lawrence',
  47101: 'Lewis',
  47103: 'Lincoln',
  47105: 'Loudon',
  47107: 'Macon',
  47109: 'Madison',
  47111: 'Marion',
  47113: 'Marshall',
  47115: 'Maury',
  47117: 'McMinn',
  47119: 'McNairy',
  47121: 'Meigs',
  47123: 'Monroe',
  47125: 'Montgomery',
  47127: 'Moore',
  47129: 'Morgan',
  47131: 'Obion',
  47133: 'Overton',
  47135: 'Perry',
  47137: 'Pickett',
  47139: 'Polk',
  47141: 'Putnam',
  47143: 'Rhea',
  47145: 'Roane',
  47147: 'Robertson',
  47149: 'Rutherford',
  47151: 'Scott',
  47153: 'Sequatchie',
  47155: 'Sevier',
  47157: 'Shelby',
  47159: 'Smith',
  47161: 'Stewart',
  47163: 'Sullivan',
  47165: 'Sumner',
  47167: 'Tipton',
  47169: 'Trousdale',
  47171: 'Unicoi',
  47173: 'Union',
  47175: 'Van Buren',
  47177: 'Warren',
  47179: 'Washington',
  47181: 'Wayne',
  47183: 'Weakley',
  47185: 'White',
  47187: 'Williamson',
  47189: 'Wilson',
};

/** Parse an NWIS RDB site file (tab-separated; # comments; second row = format spec). */
export function parseSiteFile(text) {
  const lines = text.split('\n').filter((line) => line && !line.startsWith('#'));
  if (lines.length < 3) return [];
  const header = lines[0].split('\t');
  const rows = [];
  for (const line of lines.slice(2)) {
    const cols = line.split('\t');
    const row = {};
    header.forEach((key, i) => {
      row[key] = cols[i] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

/** Slugs wired to each gauge id, from the stream YAMLs' `gaugeIds:` blocks. */
export function collectWiredGauges(dir = STREAMS_DIR) {
  const wired = new Map();
  if (!existsSync(dir)) return wired;
  const block = /gaugeIds:\s*\r?\n((?:[ \t]+-[ \t]*["']?\d{8}["']?[ \t]*\r?\n)+)/g;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
    const slug = file.replace(/\.yaml$/, '');
    const text = readFileSync(join(dir, file), 'utf8');
    for (const match of text.matchAll(block)) {
      for (const idLine of match[1].matchAll(/\d{8}/g)) {
        const id = idLine[0];
        wired.set(id, [...(wired.get(id) ?? []), slug]);
      }
    }
  }
  return wired;
}

export function buildFeatureCollection(sitesByType, wired) {
  const sites = new Map();
  for (const [dataType, rows] of Object.entries(sitesByType)) {
    for (const row of rows) {
      const id = row.site_no;
      if (!/^\d{8}$/.test(id)) continue;
      const lat = Number.parseFloat(row.dec_lat_va);
      const lon = Number.parseFloat(row.dec_long_va);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      if (lon < TN_BOX.lonMin || lon > TN_BOX.lonMax || lat < TN_BOX.latMin || lat > TN_BOX.latMax)
        continue;
      const site = sites.get(id) ?? {
        id,
        name: row.station_nm?.trim() ?? '',
        // county_cd is the 3-digit within-state code (e.g. "151" = Scott,
        // FIPS 47151) — prefix the state FIPS to hit the name table.
        county:
          TN_COUNTIES[
            '47' +
              String(row.county_cd ?? '')
                .trim()
                .padStart(3, '0')
          ] ?? '',
        // Catalog identity uses HUC-8; some site rows carry a 12-digit HUC-12.
        huc: row.huc_cd?.trim().slice(0, 8) ?? '',
        drainSqMi: row.drain_area_va ? Number.parseFloat(row.drain_area_va) : null,
        lat,
        lon,
        types: new Set(),
      };
      site.types.add(dataType);
      sites.set(id, site);
    }
  }
  const features = [...sites.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((site) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(site.lon.toFixed(6)), Number(site.lat.toFixed(6))],
      },
      properties: {
        id: site.id,
        name: site.name,
        county: site.county,
        huc: site.huc,
        drainSqMi: site.drainSqMi,
        types: [...site.types].sort().join('+'),
        wired: wired.has(site.id) ? 1 : 0,
        wiredTo: (wired.get(site.id) ?? []).join(','),
      },
    }));
  return { type: 'FeatureCollection', features };
}

async function fetchSites() {
  const sitesByType = {};
  for (const dataType of ['iv', 'dv']) {
    const res = await fetch(SITE_FILE(dataType), {
      headers: {
        'User-Agent': 'TroutSite/1.0 (tn-gauges-build)',
        Accept: 'text/tab-separated-values',
      },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`USGS site file failed: HTTP ${res.status} (${dataType})`);
    sitesByType[dataType] = parseSiteFile(await res.text());
  }
  return sitesByType;
}

function summarize(fc) {
  const wiredCount = fc.features.filter((f) => f.properties.wired).length;
  const iv = fc.features.filter((f) => f.properties.types.includes('iv')).length;
  return `${fc.features.length} gauges (${iv} real-time, ${wiredCount} wired to catalog waters)`;
}

function check(fc) {
  const problems = [];
  if (fc?.type !== 'FeatureCollection') problems.push('not a FeatureCollection');
  const features = fc?.features ?? [];
  if (features.length < 100)
    problems.push(`only ${features.length} gauges (expected the ~140-strong active network)`);
  for (const f of features) {
    const p = f.properties ?? {};
    if (!/^\d{8}$/.test(String(p.id))) problems.push(`bad id: ${p.id}`);
    if (!Array.isArray(f.geometry?.coordinates) || f.geometry.coordinates.length !== 2) {
      problems.push(`bad geometry on ${p.id}`);
    }
  }
  if (problems.length) {
    console.error(`gauges-tn.geojson FAILED check:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`gauges-tn.geojson check OK: ${summarize(fc)}`);
}

const isCheck = process.argv.includes('--check');
if (isCheck) {
  if (!existsSync(OUT)) {
    console.error(`gauges-tn.geojson missing at ${OUT} — run without --check first`);
    process.exit(1);
  }
  check(JSON.parse(readFileSync(OUT, 'utf8')));
} else {
  const wired = collectWiredGauges();
  const sitesByType = await fetchSites();
  const fc = buildFeatureCollection(sitesByType, wired);
  writeFileSync(OUT, JSON.stringify(fc) + '\n');
  console.log(`wrote ${OUT}\n${summarize(fc)}`);
}
