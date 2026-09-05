// Structural validator for public/atlas/rivers.geojson.
// Checks: WGS84 lon/lat order, regional clip, no empty parts, no NaN,
// MultiLineString / MultiPolygon / Polygon (interactive lakes) / Point (the
// West TN put-and-take anchors merged by merge-west-tn-points.mjs), unique
// ids, tailwater reach notes. Exits non-zero on failure.
//
// Run: node scripts/validate-atlas.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ATLAS = join(here, '..', 'public', 'atlas');
// Regional clip: catches gross coordinate errors, not border compliance —
// verified cross-state water is delivered unclipped (South Holston's VA arm,
// kentucky-lake / lake-barkley / cumberland-river into Kentucky), so the
// north bound covers the Kentucky pools (Kentucky Dam ≈ 37.01 N).
const CLIP = [-90.6, 34.6, -81.4, 37.3];

const errors = [];
const g = JSON.parse(readFileSync(join(ATLAS, 'rivers.geojson'), 'utf8'));
if (g.type !== 'FeatureCollection' || !Array.isArray(g.features)) {
  console.error('FAIL: not a FeatureCollection');
  process.exit(1);
}

const seen = new Set();
for (const f of g.features) {
  const p = f.properties ?? {};
  const id = p.id;
  if (!id) { errors.push('feature without id'); continue; }
  if (seen.has(id)) errors.push(`duplicate id ${id}`);
  seen.add(id);
  const geom = f.geometry ?? {};
  const sources = Array.isArray(p.source) ? p.source : [];
  const isPointAnchor = geom.type === 'Point' && sources.includes('twra-winter-ponds');
  if (geom.type !== 'MultiLineString' && geom.type !== 'MultiPolygon' && geom.type !== 'Polygon' && !isPointAnchor) {
    errors.push(`${id}: unexpected geometry ${geom.type}`);
    continue;
  }
  if (p.crs && p.crs !== 'EPSG:4326') errors.push(`${id}: crs ${p.crs}`);
  if (p.coordinateOrder && p.coordinateOrder !== 'longitude,latitude') errors.push(`${id}: coordinateOrder ${p.coordinateOrder}`);
  const walk = (node) => {
    if (Array.isArray(node) && typeof node[0] === 'number') {
      const [x, y] = node;
      if (!Number.isFinite(x) || !Number.isFinite(y)) errors.push(`${id}: non-finite coordinate`);
      else if (Math.abs(x) > 180 || Math.abs(y) > 90) errors.push(`${id}: out-of-range [${x},${y}]`);
      else if (x < CLIP[0] || y < CLIP[1] || x > CLIP[2] || y > CLIP[3]) errors.push(`${id}: outside TN clip [${x},${y}]`);
      // lon/lat-order sanity: Tennessee is lon≈-90..-81, lat≈35..37
      if (x > -50 && y < -50) errors.push(`${id}: suspected lat/lon swap [${x},${y}]`);
      return 1;
    }
    if (!Array.isArray(node) || node.length === 0) { errors.push(`${id}: empty part`); return 0; }
    return node.reduce((n, c) => n + walk(c), 0);
  };
  const verts = walk(geom.coordinates);
  if (verts === 0) errors.push(`${id}: zero vertices`);
}

const TAILWATERS = ['boone-tailwater', 'ft-patrick-henry-tailwater', 'parksville-tailwater'];
const notes = [];
for (const t of TAILWATERS) {
  if (seen.has(t)) notes.push(`${t}: present — managed reach reuses parent-river geometry (same water, see match-report parent)`);
  else notes.push(`${t}: MISSING from rivers.geojson`);
}

console.log(`features: ${g.features.length} unique ids: ${seen.size}`);
console.log(`tailwaters: ${notes.join(' | ')}`);
if (!seen.has('white-oak-creek')) notes.push('white-oak-creek unresolved — no verified official geometry yet');
if (errors.length) {
  console.error(`FAIL: ${errors.length} structural errors`);
  for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
  process.exit(1);
}
console.log('validate-atlas: PASS (zero structural/coordinate errors)');
