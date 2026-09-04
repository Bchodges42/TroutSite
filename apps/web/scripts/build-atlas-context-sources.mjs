// Build atlas context intermediates (.atlas-src/out/) from the official Census
// 2024 cartographic boundary (cb_) shapefiles that fetch-atlas-sources.mjs
// downloads + extracts. Deterministic: fixed name tables, codepoint sort, 4dp
// rounding, strict count checks, polygon-containment self-check. The only
// dependency is the `shapefile` reader (already a devDependency). No mapshaper.
//
// Inputs (under .atlas-src/):
//   cb_2024_us_state_5m.shp    -> out/tn-boundary.geojson (TN)
//                              -> out/states-context.geojson (8 neighbors)
//   cb_2024_us_county_5m.shp   -> out/tn-counties.geojson (95 TN counties)
//   cb_2024_47_place_500k.shp  -> out/places.geojson + out/places.json (71 labels)
//
// Run AFTER fetch-atlas-sources.mjs:  node scripts/build-atlas-context-sources.mjs
// Then publish:                       node scripts/build-atlas-context.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open as openShape } from 'shapefile';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '.atlas-src');
const OUT = join(SRC, 'out');
mkdirSync(OUT, { recursive: true });

// ---- fixed curation tables (these ARE the editorial choices; do not change) ----
const NEIGHBORS = new Set(['MO', 'KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR']);
const CITY = new Set([
  'Chattanooga', 'Clarksville', 'Knoxville', 'Memphis', 'Murfreesboro',
  'Nashville-Davidson metropolitan government (balance)',
]);
const DISPLAY = { 'Nashville-Davidson metropolitan government (balance)': 'Nashville' };
const TOWNS = new Set([
  'Athens','Bolivar','Bristol','Brownsville','Byrdstown','Camden','Celina','Cleveland','Columbia',
  'Cookeville','Covington','Crossville','Dayton','Dover','Ducktown','Dunlap','Dyersburg','Elizabethton',
  'Erin','Etowah','Fayetteville','Franklin','Gainesboro','Gallatin','Gatlinburg','Greeneville','Huntsville',
  'Jackson','Jamestown','Jasper','Johnson City','Kingsport','Lawrenceburg','Lebanon','Linden','Livingston',
  'Loretto','Manchester','Martin','Maryville','McMinnville','Morristown','Newport','Oak Ridge','Oneida',
  'Paris','Pikeville','Pulaski','Ripley','Savannah','Sevierville','Shelbyville','Smithville','Smyrna',
  'South Pittsburg','Sparta','Spring Hill','Sweetwater','Townsend','Tullahoma','Union City','Waverly',
  'Waynesboro','Winchester','Woodbury',
]);

async function readShp(name) {
  const src = await openShape(join(SRC, name));
  const feats = [];
  let r;
  while ((r = await src.read()).done === false) feats.push(r.value);
  return feats;
}
const fc = (features) => ({ type: 'FeatureCollection', features });
const byName = (a, b) => (a.properties.NAME < b.properties.NAME ? -1 : a.properties.NAME > b.properties.NAME ? 1 : 0);

// ---- states: TN boundary + 8 bordering states ----
{
  const states = await readShp('cb_2024_us_state_5m.shp');
  const tn = states.filter((f) => f.properties.STUSPS === 'TN');
  const ctx = states.filter((f) => NEIGHBORS.has(f.properties.STUSPS)).sort(byName);
  if (tn.length !== 1) throw new Error(`expected exactly 1 TN feature, got ${tn.length}`);
  if (ctx.length !== 8) throw new Error(`expected 8 neighbor states, got ${ctx.length}: ${ctx.map((f) => f.properties.STUSPS).join(',')}`);
  writeFileSync(join(OUT, 'tn-boundary.geojson'), JSON.stringify(fc(tn)));
  writeFileSync(join(OUT, 'states-context.geojson'), JSON.stringify(fc(ctx)));
  console.log(`context sources: boundary 1, neighbors ${ctx.length}`);
}

// ---- counties: Tennessee's 95 ----
{
  const counties = (await readShp('cb_2024_us_county_5m.shp'))
    .filter((f) => f.properties.STATEFP === '47')
    .sort(byName);
  if (counties.length !== 95) throw new Error(`expected 95 TN counties, got ${counties.length}`);
  writeFileSync(join(OUT, 'tn-counties.geojson'), JSON.stringify(fc(counties)));
  console.log(`context sources: counties ${counties.length}`);
}

// ---- places: 71 curated labels with in-script interior points ----
// cb_ place files carry no INTPT attributes, so the label point is computed
// here: scanline interior point on the largest outer ring, preferring spans
// near the ring's vertical middle (PENALTY term). A polygon-containment
// self-check throws if any point misses its own place.
function shoelace(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function ringHasPoint(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inGeometry(geometry, x, y) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const poly of polys) {
    if (!ringHasPoint(poly[0], x, y)) continue;
    let hole = false;
    for (let h = 1; h < poly.length; h++) if (ringHasPoint(poly[h], x, y)) hole = true;
    if (!hole) return true;
  }
  return false;
}
function interiorPoint(geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let best = null;
  let bestArea = 0;
  for (const poly of polys) {
    const area = Math.abs(shoelace(poly[0]));
    if (area > bestArea) { bestArea = area; best = poly[0]; }
  }
  let x0 = 1 / 0, y0 = 1 / 0, x1 = -1 / 0, y1 = -1 / 0;
  for (const [x, y] of best) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const midY = (y0 + y1) / 2;
  const h = y1 - y0;
  let outX = (x0 + x1) / 2, outY = midY, bestScore = -1 / 0;
  const ROWS = 33;
  const PENALTY = 2; // prefers central spans over peripheral wide lobes
  for (let i = 0; i < ROWS; i++) {
    const y = y0 + (h * i) / (ROWS - 1);
    const xs = [];
    for (let k = 0; k < best.length; k++) {
      const [ax, ay] = best[k];
      const [bx, by] = best[(k + 1) % best.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < xs.length; j += 2) {
      const w = xs[j + 1] - xs[j];
      const score = w - PENALTY * Math.abs(y - midY);
      if (score > bestScore) { bestScore = score; outX = (xs[j] + xs[j + 1]) / 2; outY = y; }
    }
  }
  return [outX, outY];
}
{
  const round4 = (n) => Math.round(n * 1e4) / 1e4;
  const places = [];
  const pointFeats = [];
  for (const f of await readShp('cb_2024_47_place_500k.shp')) {
    const p = f.properties;
    const isCity = CITY.has(p.NAME);
    if (!isCity && !TOWNS.has(p.NAME)) continue;
    const [lon, lat] = interiorPoint(f.geometry);
    if (!inGeometry(f.geometry, lon, lat)) throw new Error(`${p.NAME}: interior point fell outside its own polygon`);
    const display = DISPLAY[p.NAME] ?? p.NAME;
    const kind = isCity ? 'city' : 'town';
    places.push({ name: display, lon: round4(lon), lat: round4(lat), kind });
    pointFeats.push({ type: 'Feature', properties: { NAME: p.NAME, displayName: display, kind }, geometry: { type: 'Point', coordinates: [round4(lon), round4(lat)] } });
  }
  places.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const nCity = places.filter((p) => p.kind === 'city').length;
  if (places.length !== 71) throw new Error(`expected 71 curated places, got ${places.length}`);
  if (nCity !== 6) throw new Error(`expected 6 cities, got ${nCity}`);
  const SOURCE = 'U.S. Census Bureau 2024 cartographic boundary place file cb_2024_47_place_500k (public domain); interior points computed by build-atlas-context-sources.mjs (deterministic scanline)';
  writeFileSync(join(OUT, 'places.geojson'), JSON.stringify(fc(pointFeats)));
  writeFileSync(join(OUT, 'places.json'), JSON.stringify({ source: SOURCE, places }));
  console.log(`context sources: places ${places.length} (${nCity} cities)`);
}
console.log('atlas context intermediates ready.');
