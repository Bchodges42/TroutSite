// Build published atlas context files from the raw `out/` intermediates.
// Slims feature properties (privacy + bytes), rounds coordinates to 4dp, and
// writes compact JSON to public/atlas/. Deterministic: same inputs, same bytes.
//
// Inputs (under .atlas-src/out/, produced by the TIGER/context steps):
//   tn-boundary.geojson, tn-counties.geojson, states-context.geojson, places.json
// Outputs (public/atlas/):
//   tn-boundary.geojson, tn-counties.geojson, states-context.geojson, places.json
//
// Run: node scripts/build-atlas-context.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '.atlas-src', 'out');
const PUB = join(here, '..', 'public', 'atlas');
mkdirSync(PUB, { recursive: true });

const round = (n) => Math.round(n * 1e4) / 1e4;
function roundCoords(node) {
  if (Array.isArray(node) && typeof node[0] === 'number') {
    node[0] = round(node[0]);
    node[1] = round(node[1]);
    return node;
  }
  if (Array.isArray(node)) for (const c of node) roundCoords(c);
  return node;
}

function slim(srcFile, destFile, props) {
  const g = JSON.parse(readFileSync(join(OUT, srcFile), 'utf8'));
  for (const f of g.features) f.properties = props(f.properties);
  roundCoords(g);
  writeFileSync(join(PUB, destFile), JSON.stringify(g));
  console.log(`context: ${destFile} (${g.features.length} features)`);
}

slim('tn-boundary.geojson', 'tn-boundary.geojson', (p) => ({ name: p.NAME ?? p.name, state: p.STUSPS ?? p.state }));
slim('tn-counties.geojson', 'tn-counties.geojson', (p) => ({ name: p.NAME ?? p.name, state: p.STUSPS ?? p.state ?? 'TN' }));
slim('states-context.geojson', 'states-context.geojson', (p) => ({ name: p.NAME ?? p.name, state: p.STUSPS ?? p.state }));

// places.json ships as-is (already minimal: name/lon/lat/kind + source line)
{
  const places = JSON.parse(readFileSync(join(OUT, 'places.json'), 'utf8'));
  writeFileSync(join(PUB, 'places.json'), JSON.stringify(places));
  console.log(`context: places.json (${places.places.length} places)`);
}
console.log('atlas context ready.');
