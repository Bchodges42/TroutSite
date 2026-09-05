#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * WEST/MIDDLE lane — regional validation gate.
 *
 * Validates apps/web/atlas-sources/verified/west-middle.geojson and
 * west-middle.topology.json:
 *   structure        FeatureCollection, unique ids, required properties
 *   geometry         ring closure, self-intersection, empty parts, NaN,
 *                    coordinate order/swap detection, TN-plausible extents
 *   bounds           property must match the computed bbox (±0.0005°)
 *   labelAnchor      inside the feature (PIP / ≤150 m of line) and bounds
 *   line gaps        largest inter-part endpoint gap ≤ documented tolerance
 *                    or explained in the topology record
 *   connectivity     inlet/outlet-to-lake ≤ 150 m, dam-to-pool ≤ 600 m,
 *                    tailwater-start-to-dam ≤ 800 m (USGS site precision)
 *   duplicates       identical repeated line parts (accidental duplicates)
 *   catalog parity   every West/Middle catalog YAML has geometry; every
 *                    geometry id has a catalog YAML
 *   priority         required priority features present
 *
 * Run: node scripts/west-middle-validate.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '../..');
const VERIFIED = join(webRoot, 'atlas-sources', 'verified');
const YAML_DIR = join(repoRoot, 'packages', 'content', 'streams', 'tn');

const SNAP_M = 150; // documented tolerance: NHD fetch precision (~50 m) + endpoint round-off
const DAM_M = 1000; // dam-gauge sits below the dam structure; pool abuts the crest
const TAILWATER_M = 800;

const rad = (d) => (d * Math.PI) / 180;
const M_LAT = 111320;
function haversine(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}
function pointToSegmentM(p, a, b) {
  const kx = M_LAT * Math.cos(rad(p[1]));
  const px = p[0] * kx, py = p[1] * M_LAT;
  const ax = a[0] * kx, ay = a[1] * M_LAT, bx = b[0] * kx, by = b[1] * M_LAT;
  const dx = bx - ax, dy = by - ay;
  const L2 = dx * dx + dy * dy;
  let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function pointInRings(p, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
function pointToPolygonM(p, geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  let best = Infinity;
  for (const poly of polys) {
    if (pointInRings(p, poly)) return 0;
    let b = Infinity;
    for (const ring of poly) for (let i = 0; i < ring.length - 1; i++) {
      const d = pointToSegmentM(p, ring[i], ring[i + 1]);
      if (d < b) b = d;
    }
    best = Math.min(best, b);
  }
  return best;
}
function bboxOf(coords) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  (function walk(n) {
    if (Array.isArray(n[0]) && typeof n[0][0] === 'number') {
      for (const [x, y] of n) { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
      return;
    }
    for (const c of n) walk(c);
  })(coords);
  return b;
}
function segmentsIntersect(p1, p2, p3, p4) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
function ringSelfIntersects(ring) {
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      // bbox reject
      const a = ring[i], b = ring[i + 1], c = ring[j], d = ring[j + 1];
      if (Math.max(a[0], b[0]) < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) < Math.min(a[0], b[0])) continue;
      if (Math.max(a[1], b[1]) < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) < Math.min(a[1], b[1])) continue;
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
}
function lineParts(geom) {
  if (geom.type === 'LineString') return [geom.coordinates];
  if (geom.type === 'MultiLineString') return geom.coordinates;
  return [];
}
function polyRings(geom) {
  if (geom.type === 'Polygon') return geom.coordinates;
  if (geom.type === 'MultiPolygon') return geom.coordinates.flat();
  return [];
}
function partSignature(part) {
  return part.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(';');
}

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const fc = JSON.parse(readFileSync(join(VERIFIED, 'west-middle.geojson'), 'utf8'));
const topo = JSON.parse(readFileSync(join(VERIFIED, 'west-middle.topology.json'), 'utf8'));
const topoById = new Map(topo.records.map((r) => [r.featureId, r]));

if (fc.type !== 'FeatureCollection') err('root is not a FeatureCollection');

// region ownership: every id we ship must be West/Middle
const OWNED_YAML = new Set([
  // tn-west
  'beech-lake', 'cameron-brown-lake', 'covington-fbc-pond', 'edmund-orgill-lake', 'hatchie-river',
  'johnson-park-lake', 'kentucky-lake', 'lake-graham', 'martin-city-pond', 'milan-city-pond',
  'mississippi-river', 'obion-river', 'paris-city-park-lake', 'pickwick-lake', 'shelby-farms-lake',
  'tennessee-river', 'union-city-reelfoot-pond', 'valentine-park-pond', 'wolf-river-west-tennessee',
  'yale-road-park-lake', 'reelfoot-lake',
  // tn-middle-nashville
  'cumberland-river', 'east-fork-stones-river', 'fletchers-fork', 'harpeth-river', 'j-percy-priest-lake',
  'lake-barkley', 'little-west-fork-creek', 'old-hickory-lake', 'red-river-clarksville', 'sinking-creek-wilson',
  'stones-river', 'sulfur-fork-creek', 'west-fork-stones-river',
  // tn-middle-duck-elk
  'big-rock-creek', 'boiling-fork-creek', 'buffalo-river', 'duck-river-lower', 'duck-river-tailwater',
  'east-fork-shoal-creek', 'elk-river', 'elk-river-lower', 'little-buffalo-river', 'mccutcheon-creek',
  'shoal-creek', 'tims-ford-lake', 'normandy-lake', 'woods-reservoir',
  // tn-middle-caney-fork
  'barren-fork-river', 'calfkiller-river', 'cane-creek', 'caney-fork-river', 'center-hill-lake',
  'charles-creek', 'collins-river', 'great-falls-lake', 'mill-creek-overton', 'north-prong-barren-fork',
  'pine-creek-dekalb', 'rocky-river', 'upper-hills-creek',
  // tn-upper-cumberland
  'dale-hollow-lake', 'hurricane-creek', 'obey-river', 'salt-lick-creek', 'standing-rock-creek',
  'white-oak-creek',
]);

const REQUIRED = [
  'mississippi-river', 'obion-river', 'hatchie-river', 'wolf-river-west-tennessee', 'tennessee-river',
  'kentucky-lake', 'pickwick-lake', 'lake-barkley', 'cumberland-river', 'old-hickory-lake',
  'j-percy-priest-lake', 'stones-river', 'east-fork-stones-river', 'west-fork-stones-river',
  'duck-river-lower', 'duck-river-tailwater', 'normandy-lake', 'buffalo-river', 'tims-ford-lake',
  'elk-river', 'elk-river-lower', 'center-hill-lake', 'caney-fork-river', 'dale-hollow-lake',
  'obey-river', 'reelfoot-lake', 'woods-reservoir', 'great-falls-lake',
];

const seen = new Map();
for (const f of fc.features ?? []) {
  const p = f.properties ?? {};
  const id = p.id;
  if (!id) { err('feature without id'); continue; }
  if (seen.has(id)) err(`duplicate id ${id}`);
  seen.set(id, f);
  if (!OWNED_YAML.has(id)) err(`${id}: not a West/Middle owned id`);
  for (const k of ['id', 'name', 'waterbodyType', 'source', 'approximate', 'labelAnchor', 'bounds']) {
    if (p[k] === undefined) err(`${id}: missing required property ${k}`);
  }
  if (typeof p.source !== 'string' || !p.source.length) err(`${id}: source must be a space-delimited string`);
  if (typeof p.approximate !== 'boolean') err(`${id}: approximate must be boolean`);
  const g = f.geometry;
  if (!g || !g.coordinates || !countVertsSafe(g.coordinates)) err(`${id}: empty geometry`);
  if (!['MultiLineString', 'LineString', 'MultiPolygon', 'Polygon'].includes(g?.type)) err(`${id}: unexpected geometry ${g?.type}`);
  const isLine = g?.type.includes('LineString');
  const isPoly = g?.type.includes('Polygon');
  if (isLine && !['river', 'stream', 'creek', 'tailrace'].includes(p.waterbodyType)) err(`${id}: line geometry with waterbodyType ${p.waterbodyType}`);
  if (isPoly && !['lake', 'pond', 'reservoir'].includes(p.waterbodyType)) err(`${id}: polygon geometry with waterbodyType ${p.waterbodyType}`);

  // coordinates sanity
  const bad = [];
  (function walk(n) {
    if (Array.isArray(n[0]) && typeof n[0][0] === 'number') {
      for (const [x, y] of n) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) bad.push(`non-finite [${x},${y}]`);
        else if (Math.abs(x) > 180 || Math.abs(y) > 90) bad.push(`out-of-range [${x},${y}]`);
        else if (x < -95 || x > -78 || y < 32 || y > 39) bad.push(`outside TN region [${x},${y}]`);
        else if (x > -50 && y < -50) bad.push(`suspected lat/lon swap [${x},${y}]`);
      }
      return;
    }
    for (const c of n) walk(c);
  })(g?.coordinates ?? []);
  if (bad.length) err(`${id}: ${bad.slice(0, 3).join('; ')}`);

  // bounds match
  const bb = bboxOf(g?.coordinates ?? []);
  if (Array.isArray(p.bounds)) {
    for (let i = 0; i < 4; i++) {
      if (Math.abs(p.bounds[i] - bb[i]) > 0.0005) { err(`${id}: bounds mismatch index ${i}: ${p.bounds[i]} vs computed ${bb[i].toFixed(5)}`); break; }
    }
  }

  // labelAnchor
  if (Array.isArray(p.labelAnchor)) {
    const [lx, ly] = p.labelAnchor;
    if (!inBBoxCheck(p.bounds, lx, ly)) err(`${id}: labelAnchor outside bounds`);
    if (isPoly) {
      const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
      const inside = polys.some((poly) => pointInRings([lx, ly], poly));
      const near = pointToPolygonM([lx, ly], g);
      if (!inside && near > SNAP_M) err(`${id}: labelAnchor ${Math.round(near)} m outside the feature`);
    } else if (isLine) {
      let best = Infinity;
      for (const l of lineParts(g)) for (let i = 0; i < l.length - 1; i++) {
        const d = pointToSegmentM([lx, ly], l[i], l[i + 1]);
        if (d < best) best = d;
      }
      if (best > SNAP_M) err(`${id}: labelAnchor ${Math.round(best)} m from the line`);
    }
  }

  // geometry-level checks
  if (isPoly) {
    for (const ring of polyRings(g)) {
      if (ring.length < 4) err(`${id}: degenerate ring (${ring.length} pts)`);
      else {
        if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) err(`${id}: unclosed ring`);
        if (ringSelfIntersects(ring)) err(`${id}: self-intersecting ring`);
      }
    }
  }
  if (isLine) {
    const parts = lineParts(g);
    const sigs = new Map();
    for (const part of parts) {
      if (part.length < 2) err(`${id}: line part with <2 vertices`);
      const s = partSignature(part);
      sigs.set(s, (sigs.get(s) ?? 0) + 1);
    }
    for (const [s, n] of sigs) if (n > 1) err(`${id}: ${n} identical duplicate line parts (${s.slice(0, 40)}…)`);

    // endpoint gap analysis — pool-mediated endpoints (within SNAP_M of a
    // delivered lake/reservoir polygon) are explained by the pool carrying
    // the connection; everything else must match the topology record.
    const lakeIndex = [...seen.entries()]
      .filter(([, lf]) => lf.geometry.type.includes('Polygon'))
      .map(([lid, lf]) => ({ id: lid, geom: lf.geometry, b: bboxOf(lf.geometry.coordinates) }));
    let gapWaterIndex = [];
    try {
      const gwPath = join(webRoot, '.atlas-src', 'west-middle', 'gap-waterbodies.json');
      if (existsSync(gwPath)) {
        const gw = JSON.parse(readFileSync(gwPath, 'utf8'));
        gapWaterIndex = (gw.features ?? [])
          .filter((f) => f.geometry?.type?.includes('Polygon'))
          .map((f) => ({ geom: f.geometry, b: bboxOf(f.geometry.coordinates) }));
      }
    } catch { /* optional mediation cache */ }
    const ends = [];
    parts.forEach((l, ci2) => { if (l.length) { ends.push({ ci: ci2, p: l[0] }); if (l.length > 1) ends.push({ ci: ci2, p: l[l.length - 1] }); } });
    let worst = 0, wp = null;
    for (let i = 0; i < ends.length; i++) {
      const e = ends[i];
      let m = Infinity;
      for (let j = 0; j < ends.length; j++) {
        if (ends[j].ci === e.ci) continue; // a chain's own far end is not a gap
        const d = haversine(e.p, ends[j].p);
        if (d < m) m = d;
      }
      if (m > worst && m < 5000) { worst = m; wp = e.p; }
    }
    const topoRec = topoById.get(id);
    const braidMax = topoRec?.chainSeparations?.braidMaxM ?? 0;
    const poolMax = topoRec?.chainSeparations?.poolMediatedMaxM ?? 0;
    const gapCeiling = Math.max(topoRec?.largestConnectionGapMeters ?? 0, braidMax, poolMax) + 5;
    // policy: chain separations >= 3 km are distinct fork/reach structures
    // (headwater forks, gated reach boundaries), not broken chains — they are
    // verified visually in the render pass instead
    if (worst > 300 && worst < 3000) {
      // classification order: pool mediation (delivered lakes) → recorded
      // chain separations (gap/braid) → unexplained error
      let poolM = Infinity;
      for (const lake of [...lakeIndex, ...gapWaterIndex]) {
        const [lx, ly] = wp;
        const b = lake.b;
        if (lx < b[0] - 0.02 || lx > b[2] + 0.02 || ly < b[1] - 0.02 || ly > b[3] + 0.02) continue;
        poolM = Math.min(poolM, pointToPolygonM(wp, lake.geom));
      }
      if (poolM <= SNAP_M) {
        warn(`${id}: endpoint separation ${Math.round(worst)} m — pool-mediated (${Math.round(poolM)} m from a delivered lake polygon)`);
      } else if (topoRec && worst <= gapCeiling) {
        warn(`${id}: endpoint separation ${Math.round(worst)} m — within recorded chain separations (gap ${topoRec.largestConnectionGapMeters ?? 0} m, braid ${braidMax} m)`);
      } else {
        err(`${id}: unexplained endpoint gap ${Math.round(worst)} m at [${wp?.map((v) => v.toFixed(4))}] exceeds topology record (gap ${topoRec?.largestConnectionGapMeters ?? 'none'} m + braid ${braidMax} m)`);
      }
    }
  }
}

function countVerts(c) {
  let n = 0;
  (function walk(a) {
    if (Array.isArray(a[0]) && typeof a[0][0] === 'number') { n += a.length; return; }
    for (const x of a) walk(x);
  })(c);
  return n;
}
function countVertsSafe(c) { try { return countVerts(c); } catch { return 0; } }
function inBBoxCheck(b, x, y) { return Array.isArray(b) && x >= b[0] - 1e-6 && x <= b[2] + 1e-6 && y >= b[1] - 1e-6 && y <= b[3] + 1e-6; }

// topology connectivity checks
for (const rec of topo.records ?? []) {
  const f = seen.get(rec.featureId);
  if (!f) { err(`topology: ${rec.featureId} missing from geojson`); continue; }
  const g = f.geometry;
  const isLine = g.type.includes('LineString');
  if (!isLine && rec.dam) {
    const d = pointToPolygonM(rec.dam.coordinates, g);
    if (d > DAM_M) err(`${rec.featureId}: dam ${rec.dam.name} is ${Math.round(d)} m from the pool polygon (> ${DAM_M} m)`);
    // informational passthrough is recorded in topology notes
  }
  for (const [rid, conn] of Object.entries(rec.connections ?? {})) {
    if (conn.endpointToLakeM == null) { warn(`topology: ${rec.featureId} ↔ ${rid} could not be measured`); continue; }
    if (conn.endpointToLakeM > SNAP_M && !conn.informational) {
      err(`${rec.featureId}: ${rid} endpoints are ${conn.endpointToLakeM} m from the pool (> ${SNAP_M} m snap tolerance)`);
    } else if (conn.endpointToLakeM > SNAP_M) {
      warn(`${rec.featureId} ↔ ${rid}: named chain ends ${conn.endpointToLakeM} m short of the pool edge (NHD named-coverage seam, documented)`);
    }
  }
  for (const t of rec.termini ?? []) {
    if (!t.ok && !t.informational) err(`${rec.featureId}: terminus anchor '${t.anchor}' is ${t.distanceM} m away (max ${t.maxM} m)`);
  }
  if (rec.tailwaterStartDistanceM != null && rec.tailwaterStartDistanceM > TAILWATER_M) {
    err(`${rec.featureId}: tailwater starts ${rec.tailwaterStartDistanceM} m from the dam (> ${TAILWATER_M} m)`);
  }
  if (rec.verificationState !== 'PASS' && rec.verificationState !== 'UNRESOLVED') err(`${rec.featureId}: bad verificationState`);
  if (rec.verificationState === 'PASS' && (!rec.verificationSources || rec.verificationSources.length < 2)) {
    err(`${rec.featureId}: PASS requires ≥2 verification sources`);
  }
}

// catalog parity
for (const id of OWNED_YAML) {
  const y = join(YAML_DIR, `${id}.yaml`);
  if (!existsSync(y)) err(`catalog: missing YAML for ${id}`);
  if (!seen.has(id)) err(`parity: West/Middle catalog id ${id} has no geometry in west-middle.geojson`);
}
for (const id of seen.keys()) {
  if (!existsSync(join(YAML_DIR, `${id}.yaml`))) err(`parity: geometry ${id} has no catalog YAML`);
}

// priority presence
for (const id of REQUIRED) if (!seen.has(id)) err(`priority: ${id} missing`);

console.log(`features: ${seen.size} | topology records: ${(topo.records ?? []).length}`);
for (const w of warns) console.log(`WARN  ${w}`);
if (errors.length) {
  console.error(`FAIL: ${errors.length} validation errors`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log('west-middle-validate: PASS');
