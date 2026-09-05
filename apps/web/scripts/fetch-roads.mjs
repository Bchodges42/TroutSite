// Fetch + extract Census TIGER/Line 2024 ROADS ("All Roads") for the 95 TN
// counties. Public domain (US Government work) — license verdict and source
// URLs in docs/roads-sources.md. Downloads once into .atlas-src/ (git-ignored);
// re-runs skip archives that already exist.
//
// Layout produced (all under apps/web/.atlas-src/):
//   roads/      per-county ROADS zips (FIPS 47001..47189, odd numbers)
//   roadshp/    extracted shapefiles
//
// Run: node scripts/fetch-roads.mjs [--check]
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

const BASE = 'https://www2.census.gov/geo/tiger/TIGER2024/ROADS';

function download(url, dest) {
  execSync(`curl -fL --retry 3 --retry-delay 5 -o ${JSON.stringify(dest)} ${JSON.stringify(url)}`, { stdio: 'inherit' });
}

let missing = 0;
for (const f of FIPS) {
  mkdirSync(join(SRC, 'roads'), { recursive: true });
  const name = `tl_2024_${f}_roads.zip`;
  const dest = join(SRC, 'roads', name);
  if (existsSync(dest) && statSync(dest).size > 0) continue;
  missing++;
  if (CHECK) {
    console.log(`MISSING roads/${name}`);
    continue;
  }
  console.log(`fetch roads/${name}`);
  download(`${BASE}/${name}`, dest);
}

// Extraction (skipped under --check): shapefiles next to their zips.
if (!CHECK) {
  const outDir = join(SRC, 'roadshp');
  mkdirSync(outDir, { recursive: true });
  for (const z of readdirSync(join(SRC, 'roads')).filter((f) => f.endsWith('.zip'))) {
    const stem = z.replace(/\.zip$/, '');
    if (existsSync(join(outDir, `${stem}.shp`))) continue;
    console.log(`unzip roads/${z} -> roadshp/`);
    execSync(`unzip -o -q ${JSON.stringify(join(SRC, 'roads', z))} -d ${JSON.stringify(outDir)}`);
  }
}

if (CHECK) {
  console.log(missing === 0 ? 'roads sources: complete' : `roads sources: ${missing} archives missing`);
  process.exit(missing === 0 ? 0 : 1);
}
console.log('roads sources ready.');
