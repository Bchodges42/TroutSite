/* global console, process */
// Fetch + extract official Census TIGER/Line 2024 sources for the atlas.
// Public domain (U.S. Census Bureau). Downloads once into .atlas-src/
// (git-ignored); re-runs skip archives that already exist.
//
// Layout produced (all under apps/web/.atlas-src/):
//   lw/      per-county LINEARWATER zips (95 TN counties, FIPS 47001..47189)
//   aw/      per-county AREAWATER zips
//   shp/     extracted LINEARWATER shapefiles
//   awshp/   extracted AREAWATER shapefiles
//   county5m.zip / state5m.zip / place500k.zip  context archives
//
// Run: node scripts/fetch-atlas-sources.mjs [--check]
//   --check only lists what is missing (no downloads).
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '.atlas-src');
const CHECK = process.argv.includes('--check');

const FIPS = [];
for (let i = 1; i <= 189; i += 2) FIPS.push(`47${String(i).padStart(3, '0')}`);

const BASE = 'https://www2.census.gov/geo/tiger/TIGER2024';
const GENZ = 'https://www2.census.gov/geo/tiger/GENZ2024/shp';
const jobs = [
  ...FIPS.map((f) => ({ dir: 'lw', name: `tl_2024_${f}_linearwater.zip`, url: `${BASE}/LINEARWATER/tl_2024_${f}_linearwater.zip` })),
  ...FIPS.map((f) => ({ dir: 'aw', name: `tl_2024_${f}_areawater.zip`, url: `${BASE}/AREAWATER/tl_2024_${f}_areawater.zip` })),
  // Context files are the 1:5m CARTOGRAPHIC boundary (GENZ cb_*) series — the
  // same series the shipped atlas geometry was built from. Inner filenames are
  // cb_2024_*, which the extraction skip-checks must match.
  { dir: '.', name: 'county5m.zip', url: `${GENZ}/cb_2024_us_county_5m.zip` },
  { dir: '.', name: 'state5m.zip', url: `${GENZ}/cb_2024_us_state_5m.zip` },
  { dir: '.', name: 'place500k.zip', url: `${GENZ}/cb_2024_47_place_500k.zip` },
];

function download(url, dest) {
  execSync(`curl -fL --retry 3 --retry-delay 5 -o ${JSON.stringify(dest)} ${JSON.stringify(url)}`, { stdio: 'inherit' });
}

let missing = 0;
for (const j of jobs) {
  mkdirSync(join(SRC, j.dir), { recursive: true });
  const dest = join(SRC, j.dir, j.name);
  if (existsSync(dest) && statSync(dest).size > 0) continue;
  missing++;
  if (CHECK) {
    console.log(`MISSING ${j.dir}/${j.name}`);
    continue;
  }
  console.log(`fetch ${j.dir}/${j.name}`);
  download(j.url, dest);
}

// Extraction (skipped under --check): shapefiles next to their zips.
if (!CHECK) {
  const extract = (zipDir, outDir) => {
    mkdirSync(join(SRC, outDir), { recursive: true });
    for (const z of readdirSync(join(SRC, zipDir)).filter((f) => f.endsWith('.zip'))) {
      const stem = z.replace(/\.zip$/, '');
      if (existsSync(join(SRC, outDir, `${stem}.shp`))) continue;
      console.log(`unzip ${zipDir}/${z} -> ${outDir}/`);
      execSync(`unzip -o -q ${JSON.stringify(join(SRC, zipDir, z))} -d ${JSON.stringify(join(SRC, outDir))}`);
    }
  };
  extract('lw', 'shp');
  extract('aw', 'awshp');
  for (const [z, inner] of [
    ['county5m.zip', 'cb_2024_us_county_5m'],
    ['state5m.zip', 'cb_2024_us_state_5m'],
    ['place500k.zip', 'cb_2024_47_place_500k'],
  ]) {
    if (existsSync(join(SRC, `${inner}.shp`))) continue;
    console.log(`unzip ${z}`);
    execSync(`unzip -o -q ${JSON.stringify(join(SRC, z))} -d ${JSON.stringify(SRC)}`);
  }
}

if (CHECK) {
  console.log(missing === 0 ? 'atlas sources: complete' : `atlas sources: ${missing} archives missing`);
  process.exit(missing === 0 ? 0 : 1);
}
console.log('atlas sources ready.');
