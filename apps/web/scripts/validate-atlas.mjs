// Structural validator for public/atlas/rivers.geojson.
// Checks: WGS84 lon/lat order, regional clip, no empty parts, no NaN,
// MultiLineString / MultiPolygon / Polygon (interactive lakes) / Point (the
// West TN put-and-take anchors merged by merge-west-tn-points.mjs), unique
// ids, tailwater reach notes. Geometry-integrity gates ported from the
// geo/east-fix rebuild (review §5 G1): rebuilt-lake part/area/source
// contracts with topology provenance linkage, component sliver/detach
// detection, vertexCount/bounds parity, and area recomputation.
// Exits non-zero on failure.
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
const stats = new Map();
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
  const b = [180, 90, -180, -90];
  const walk = (node) => {
    if (Array.isArray(node) && typeof node[0] === 'number') {
      const [x, y] = node;
      if (!Number.isFinite(x) || !Number.isFinite(y)) errors.push(`${id}: non-finite coordinate`);
      else if (Math.abs(x) > 180 || Math.abs(y) > 90) errors.push(`${id}: out-of-range [${x},${y}]`);
      else if (x < CLIP[0] || y < CLIP[1] || x > CLIP[2] || y > CLIP[3]) errors.push(`${id}: outside TN clip [${x},${y}]`);
      // lon/lat-order sanity: Tennessee is lon≈-90..-81, lat≈35..37
      if (x > -50 && y < -50) errors.push(`${id}: suspected lat/lon swap [${x},${y}]`);
      if (x < b[0]) b[0] = x;
      if (y < b[1]) b[1] = y;
      if (x > b[2]) b[2] = x;
      if (y > b[3]) b[3] = y;
      return 1;
    }
    if (!Array.isArray(node) || node.length === 0) { errors.push(`${id}: empty part`); return 0; }
    return node.reduce((n, c) => n + walk(c), 0);
  };
  const verts = walk(geom.coordinates);
  if (verts === 0) errors.push(`${id}: zero vertices`);
  stats.set(id, { p, geom, verts, bounds: b });
}

// ---- Geometry integrity gates (ported from the geo/east-fix rebuild gate;
// review §5 G1: every retained component documented, no silent re-assembly) ----

const KM2_PER_DEG2 = 12392 * Math.cos((36 * Math.PI) / 180); // matches the rebuild builders' convention
const ringAreaKm2 = (ring) => {
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return (Math.abs(a) / 2) * KM2_PER_DEG2;
};
const componentAreaKm2 = (poly) => poly.reduce((s, r, i) => s + (i ? -ringAreaKm2(r) : ringAreaKm2(r)), 0);
const componentBounds = (poly) => {
  const b = [180, 90, -180, -90];
  for (const [x, y] of poly[0]) {
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x;
    if (y > b[3]) b[3] = y;
  }
  return b;
};
const bboxGapKm = (a, b) =>
  Math.hypot(Math.max(b[0] - a[2], a[0] - b[2], 0) * 111.32 * Math.cos((36 * Math.PI) / 180),
    Math.max(b[1] - a[3], a[1] - b[3], 0) * 110.9);

// Provenance linkage: the topology records are the documented-membership
// source of truth for rebuilt waters (sourceIdentifiers/verificationSources).
const topoRecords = new Map();
for (const region of ['east-southeast', 'west-middle']) {
  try {
    const doc = JSON.parse(readFileSync(join(here, '..', 'atlas-sources', 'verified', `${region}.topology.json`), 'utf8'));
    for (const r of doc.records ?? []) topoRecords.set(r.featureId, { region, ...r });
  } catch { /* staging files are committed; a missing region simply has no records */ }
}

// Declared rebuilt-lake contracts (mirrors validate-east-southeast.mjs).
const REBUILT_LAKES = {
  'norris-lake': { maxParts: 3, areaKm2: [90, 100], source: 'nhd-hr' },
  'nickajack-lake': { maxParts: 3, areaKm2: [40, 47], source: 'twra-reservoirs' },
  'boone-lake': { maxParts: 3, areaKm2: [15, 22], source: 'nhd-hr' },
};

const advisory = [];
for (const [id, s] of stats) {
  const { p, geom, verts, bounds } = s;

  // Declared props must describe the delivered geometry (all 146 carry these).
  if (p.vertexCount !== undefined && p.vertexCount !== verts) errors.push(`${id}: vertexCount ${p.vertexCount} != actual ${verts}`);
  if (p.bounds && (p.bounds[0] > bounds[0] + 1e-6 || p.bounds[1] > bounds[1] + 1e-6 ||
    p.bounds[2] < bounds[2] - 1e-6 || p.bounds[3] < bounds[3] - 1e-6)) {
    errors.push(`${id}: declared bounds ${JSON.stringify(p.bounds)} do not cover actual ${bounds.map((v) => +v.toFixed(6))}`);
  }

  if (geom.type !== 'MultiPolygon') continue;
  const polys = geom.coordinates;
  const areas = polys.map(componentAreaKm2);
  const total = areas.reduce((a, b) => a + b, 0);

  // Recomputed area must substantiate the declared one (gross-error tolerance:
  // formula drift between builders measured ≤5.1% on production data).
  if (typeof p.areaSqKm === 'number' && p.areaSqKm > 0) {
    const drift = Math.abs(total - p.areaSqKm) / p.areaSqKm;
    if (drift > 0.08) errors.push(`${id}: recomputed area ${total.toFixed(1)} km² differs from declared ${p.areaSqKm} km² by ${(drift * 100).toFixed(1)}% (> 8%)`);
  }

  const gate = REBUILT_LAKES[id];
  if (!gate) {
    // Legacy reservoirs are not gated (pre-existing multipart state the review
    // did not flag), but stale partCount declarations are reported.
    if (p.partCount !== undefined && p.partCount !== polys.length) {
      advisory.push(`${id}: partCount ${p.partCount} != actual ${polys.length} components (legacy prop)`);
    }
    continue;
  }

  if (p.source !== gate.source) errors.push(`${id}: source ${p.source} != expected ${gate.source} (identity source policy)`);
  if (polys.length > gate.maxParts) errors.push(`${id}: rebuilt lake has ${polys.length} parts (> ${gate.maxParts})`);
  if (p.partCount !== polys.length) errors.push(`${id}: partCount ${p.partCount} != actual ${polys.length}`);
  if (typeof p.areaSqKm !== 'number') errors.push(`${id}: rebuilt lake missing areaSqKm`);
  else if (p.areaSqKm < gate.areaKm2[0] || p.areaSqKm > gate.areaKm2[1]) {
    errors.push(`${id}: area ${p.areaSqKm} km² outside expected pool-stage window [${gate.areaKm2}]`);
  }

  // Every retained component must be defensible: no slivers, no detached
  // fragments (membership exemption = documented in the topology record).
  const largest = areas.indexOf(Math.max(...areas));
  const largestBounds = componentBounds(polys[largest]);
  polys.forEach((poly, i) => {
    if (i === largest) return;
    if (areas[i] < 0.05) errors.push(`${id}: sliver component ${i} ${areas[i].toFixed(3)} km² (< 0.05 km²) — needs documented membership`);
    else if (areas[i] < 0.5 && bboxGapKm(largestBounds, componentBounds(poly)) > 5) {
      errors.push(`${id}: detached component ${i} ${areas[i].toFixed(2)} km² > 5 km from main pool — needs documented membership`);
    }
  });

  const topo = topoRecords.get(id);
  if (!topo) errors.push(`${id}: rebuilt lake has no topology record (documented membership required)`);
  else {
    if (topo.verificationState !== 'PASS') errors.push(`${id}: topology verificationState ${topo.verificationState} != PASS`);
    if (!Array.isArray(topo.sourceIdentifiers) || topo.sourceIdentifiers.length === 0) errors.push(`${id}: topology record has no sourceIdentifiers`);
  }
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
for (const line of advisory) notes.push(line);
if (advisory.length) console.log(`advisory: ${advisory.length} legacy prop inconsistencies (non-blocking)`);
if (errors.length) {
  console.error(`FAIL: ${errors.length} structural/geometry errors`);
  for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
  process.exit(1);
}
console.log('validate-atlas: PASS (zero structural/coordinate/geometry-integrity errors)');
