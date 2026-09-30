#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Validation gate for apps/web/atlas-sources/verified/east-southeast.geojson
 * (+ .topology.json). Checks the geometry contract and the East/Southeast
 * connection chains. Exits non-zero on any FAIL.
 *
 * Checks: duplicate ids · empty geometry · ring closure · self-intersection ·
 * swapped/degenerate coordinates · bounds errors · bad label anchors ·
 * unexplained line gaps (islands) · inlet/outlet terminal distances (line
 * endpoints vs lake polygons / dam anchors / other lines) · duplicate
 * overlapping reaches · catalog/geometry parity · missing priority lakes ·
 * cross-state retention (South Holston VA portion).
 * (The retired passive-lakes check was removed 2026-09-29 with the empty
 * public/atlas/lakes.geojson artifact it dereferenced — KNOWN-ISSUES F26;
 * every formerly passive named lake now ships an interactive replacement.)
 *
 * Run: node scripts/validate-east-southeast.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { REACH_GATE } from './atlas-reach-gates.mjs';

// Dam anchors (USGS NWIS coordinates, NAD83) — carried locally so the gate
// does not load the old build script's git-ignored caches at import time.
const DAMS = {
  norris: { name: 'Norris Dam', coords: [-84.08214, 36.21563], source: 'USGS NWIS 03533000 (Clinch River below Norris Dam), NAD83' },
  'melton-hill': { name: 'Melton Hill Dam', coords: [-84.30076, 35.88536], source: 'USGS NWIS 03535912' },
  'fort-loudoun': { name: 'Fort Loudoun Dam', coords: [-84.24325, 35.79174], source: 'USGS NWIS 03499510' },
  'watts-bar': { name: 'Watts Bar Dam', coords: [-84.78328, 35.62035], source: 'USGS NWIS 03543005' },
  chickamauga: { name: 'Chickamauga Dam', coords: [-85.22968, 35.10313], source: 'USGS NWIS 03566510' },
  nickajack: { name: 'Nickajack Dam', coords: [-85.62108, 35.00258], source: 'USGS NWIS 03570525' },
  tellico: { name: 'Tellico Dam', coords: [-84.25445, 35.78768], source: 'NHD 01327191 + TWRA northern extremum' },
  cherokee: { name: 'Cherokee Dam', coords: [-83.49934, 36.1662], source: 'USGS NWIS 03493510 (Holston River at Cherokee Dam, TW)' },
  douglas: { name: 'Douglas Dam', coords: [-83.53878, 35.9612], source: 'USGS NWIS 03468510 (French Broad River at Douglas Dam, TW)' },
  'south-holston': { name: 'South Holston Dam', coords: [-82.09726, 36.52356], source: 'USGS NWIS 03476500' },
  boone: { name: 'Boone Dam', coords: [-82.43792, 36.44066], source: 'USGS NWIS 03486810' },
  'ft-patrick-henry': { name: 'Fort Patrick Henry Dam', coords: [-82.50904, 36.49816], source: 'USGS NWIS 03487010' },
  watauga: { name: 'Watauga Dam', coords: [-82.12596, 36.33011], source: 'USGS NWIS 03483950' },
  wilbur: { name: 'Wilbur Dam', coords: [-82.12956, 36.34411], source: 'USGS NWIS 03484000' },
  parksville: { name: 'Parksville Dam (Ocoee No. 1)', coords: [-84.6552, 35.0908], source: 'USGS NWIS 03564500' },
  'ocoee-no-3': { name: 'Ocoee Dam No. 3', coords: [-84.4699, 35.0371], source: 'NHD 01296232 west extremum' },
  chilhowee: { name: 'Chilhowee Dam', coords: [-84.0252, 35.5623], source: 'NHD 01280464 north-east extremum' },
  calderwood: { name: 'Calderwood Dam', coords: [-83.9418, 35.4987], source: 'NHD 00982412 south-east extremum' },
};

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERIFIED = path.join(webRoot, 'atlas-sources', 'verified');
const fc = JSON.parse(readFileSync(path.join(VERIFIED, 'east-southeast.geojson'), 'utf8'));
const topoPath = path.join(VERIFIED, 'east-southeast.topology.json');
const hasTopo = existsSync(topoPath);

const errors = [];
const warns = [];
const notes = [];
function fail(id, msg) { errors.push(`FAIL ${id}: ${msg}`); }
function warn(id, msg) { warns.push(`WARN ${id}: ${msg}`); }

const _KM2 = 12392 * Math.cos((36 * Math.PI) / 180);
function walkPts(r, out) { if (typeof r[0] === 'number') out.push(r); else for (const c of r) walkPts(c, out); }
function geomPts(geom) { const out = []; walkPts(geom.coordinates, out); return out; }
function distM(a, b) {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function pointInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function pointInGeom(pt, geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'Polygon' ? [geom.coordinates] : [];
  for (const poly of polys) {
    if (pointInRing(pt, poly[0])) {
      let hole = false;
      for (let i = 1; i < poly.length; i++) if (pointInRing(pt, poly[i])) { hole = true; break; }
      if (!hole) return true;
    }
  }
  return false;
}
function pointToSegmentM2(p, a, b) {
  const kx = 111320 * Math.cos((p[1] * Math.PI) / 180);
  const px = p[0] * kx, py = p[1] * 111320;
  const ax = a[0] * kx, ay = a[1] * 111320, bx = b[0] * kx, by = b[1] * 111320;
  const dx = bx - ax, dy = by - ay;
  const L2 = dx * dx + dy * dy;
  let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function distToGeomLinesM(pt, geom) {
  // nearest distance from pt to the feature's line segments
  let best = Infinity;
  const lines = geom.type === 'MultiLineString' ? geom.coordinates : geom.type === 'LineString' ? [geom.coordinates] : [];
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) {
    const d = pointToSegmentM2(pt, l[i], l[i + 1]);
    if (d < best) best = d;
  }
  return best;
}
function distToGeom(pt, geom) {
  // crude: nearest vertex (vertices are <=~45 m apart after simplification)
  let best = Infinity;
  for (const c of geomPts(geom)) { const d = distM(pt, c); if (d < best) best = d; }
  return pointInGeom(pt, geom) ? 0 : best;
}
function segIntersect(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
function ringSelfIntersects(ring) {
  const n = ring.length - 1; // last == first
  const touch = (p, q) => p[0] === q[0] && p[1] === q[1];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
        // shared-endpoint contact (ring pinches to a point) is not a crossing
        const a = ring[i]; const b = ring[i + 1]; const c = ring[j]; const d = ring[j + 1];
        if (!(touch(a, c) || touch(a, d) || touch(b, c) || touch(b, d))) return true;
      }
    }
  }
  return false;
}

const REQUIRED_PROPS = ['id', 'name', 'waterbodyType', 'source', 'approximate', 'labelAnchor', 'bounds'];
const ids = new Set();
const lakes = new Map();
const rivers = new Map();

// ---- canonical catalog parity
const catalogDir = path.join(webRoot, '..', '..', 'packages', 'content', 'streams', 'tn');
const catalogIds = new Set(readdirSync(catalogDir).filter((n) => n.endsWith('.yaml')).map((n) => n.replace(/\.yaml$/, '')));

for (const f of fc.features) {
  const p = f.properties;
  const id = p.id;
  // --- required properties
  for (const k of REQUIRED_PROPS) if (p[k] === undefined) fail(id, `missing required property ${k}`);
  // --- duplicate ids
  if (ids.has(id)) fail(id, 'duplicate feature id');
  ids.add(id);
  // --- geometry sanity
  if (!f.geometry || !f.geometry.coordinates || !f.geometry.coordinates.length) { fail(id, 'empty geometry'); continue; }
  const pts = geomPts(f.geometry);
  // --- swapped/degenerate coordinates
  const outOfTn = pts.filter(([x, y]) => x < -92 || x > -80 || y < 33 || y > 38).length;
  if (outOfTn) fail(id, `${outOfTn} coordinates outside the TN regional window (swapped axes?)`);
  // --- bounds
  const xs = pts.map((c) => c[0]);
  const ys = pts.map((c) => c[1]);
  const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const b = p.bounds;
  if (!b || b.length !== 4) fail(id, 'bounds must be [w,s,e,n]');
  else {
    for (let i = 0; i < 4; i++) if (Math.abs(b[i] - bb[i]) > 0.002) fail(id, `bounds[${i}] ${b[i]} != computed ${bb[i].toFixed(6)}`);
    if (b[0] > b[2] || b[1] > b[3]) fail(id, 'bounds inverted');
  }
  // --- label anchor on the feature (polygons: inside the water; lines:
  // within 100 m of a reach vertex — the anchor is a line midpoint)
  if (f.geometry.type.endsWith('LineString')) {
    const d = Math.min(...pts.map((c) => distM(p.labelAnchor, c)));
    if (d > 100) fail(id, `labelAnchor ${Math.round(d)} m off the reach line`);
  } else if (!pointInGeom(p.labelAnchor, f.geometry)) {
    const d = distToGeom(p.labelAnchor, f.geometry);
    if (d > 150) fail(id, `labelAnchor off-feature by ${Math.round(d)} m`);
    else warn(id, `labelAnchor ${Math.round(d)} m outside geometry (coved ring)`);
  }
  if (f.geometry.type.endsWith('Polygon')) {
    lakes.set(id, f);
    // --- ring closure + self-intersection
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const poly of polys) {
      for (const ring of poly) {
        const a = ring[0];
        const z = ring[ring.length - 1];
        if (Math.abs(a[0] - z[0]) > 1e-9 || Math.abs(a[1] - z[1]) > 1e-9) fail(id, 'unclosed ring');
        if (ring.length < 4) fail(id, 'degenerate ring (<4 points)');
        else if (ringSelfIntersects(ring)) fail(id, 'self-intersecting ring');
      }
    }
  } else {
    rivers.set(id, f);
    // --- duplicate overlapping reaches: pairwise centroid sampling would be
    // O(n^2); compare bbox-overlap + identical-vertex sharing between reaches
    for (const [otherId, other] of rivers) {
      if (otherId === id) continue;
      const shared = geomPts(f.geometry).filter((c) => geomPts(other.geometry).some((c2) => c2[0] === c[0] && c2[1] === c[1])).length;
      if (shared > 20) fail(id, `shares ${shared} identical vertices with ${otherId} (duplicate/overlapping reach)`);
    }
  }
}

// ---- catalog parity
for (const id of ids) {
  if (!catalogIds.has(id)) fail(id, 'geometry has no catalog YAML row');
}
for (const id of [
  'norris-lake', 'cherokee-lake', 'chickamauga-lake', 'douglas-lake', 'fort-loudoun-lake',
  'watts-bar-lake', 'south-holston-lake', 'boone-lake', 'watauga-lake', 'wilbur-lake',
  'fort-patrick-henry-lake', 'tellico-lake', 'melton-hill-lake', 'chilhowee-lake',
  'calderwood-lake', 'parksville-lake', 'ocoee-number-three-lake', 'nickajack-lake',
]) {
  if (!ids.has(id)) fail(id, 'priority lake missing from delivery');
}
// (F26, 2026-09-29 audit) The retired passive-lakes check — which dereferenced
// the intentionally removed empty public/atlas/lakes.geojson and crashed the
// whole gate with ENOENT — is gone. Every formerly passive named lake
// (boone, watauga, tellico, parksville, nickajack) ships an interactive
// replacement and is covered by the priority-lake parity check above.

// ---- cross-state retention (South Holston must include the VA portion)
const sh = lakes.get('south-holston-lake');
if (sh) {
  const pts = geomPts(sh.geometry);
  const vaPts = pts.filter(([, y]) => y > 36.575).length;
  if (vaPts < 50) fail('south-holston-lake', `Virginia portion missing (only ${vaPts} vertices north of 36.575)`);
}

// ---- connection chain endpoints
// Every chain spec requires SOME line endpoint of the reach to sit within
// tolerance of the anchor (dam coordinate / lake polygon / other reach) —
// i.e. the reach terminates there. Rivers here flow generally westward, so
// extreme-coordinate selection would mislabel ends; nearest-endpoint is the
// orientation-neutral test.
function reachEndpoints(f) {
  const lines = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
  const pts = [];
  for (const l of lines) { pts.push(l[0], l[l.length - 1]); }
  return pts;
}
const CHAINS = [
  // Northeast: South Holston Lake -> SH Dam -> tailwater -> Boone Lake
  { line: 'south-holston-river', target: { dam: 'south-holston' }, maxM: 300 },
  { line: 'south-holston-river', target: { lake: 'boone-lake' }, maxM: 400 },
  { line: 'boone-tailwater', target: { dam: 'boone' }, maxM: 300 },
  { line: 'boone-tailwater', target: { lake: 'fort-patrick-henry-lake' }, maxM: 400 },
  { line: 'ft-patrick-henry-tailwater', target: { dam: 'ft-patrick-henry' }, maxM: 300 },
  { line: 'ft-patrick-henry-tailwater', target: { line: 'holston-river' }, maxM: 400 },
  { line: 'holston-river', target: { lake: 'fort-loudoun-lake' }, maxM: 400 },

  // the Wilbur Dam / Watauga Dam cluster: NHD splits the tailrace-weir-pool
  // complex into connector strands; delivered lines + lake fragments span it
  // (visual QA: watauga-dams-local.png). Tolerances are documented, not hidden.
  { line: 'watauga-river', target: { dam: 'wilbur' }, maxM: 700 },
  { line: 'watauga-river', target: { lake: 'boone-lake' }, maxM: 400 },
  { line: 'watauga-river-wilbur-reach', target: { dam: 'watauga' }, maxM: 300 },
  { line: 'watauga-river-wilbur-reach', target: { lake: 'wilbur-lake' }, maxM: 400 },
  { line: 'watauga-river-wilbur-reach', target: { lake: 'watauga-lake' }, maxM: 1000 },
  { line: 'clinch-river', target: { dam: 'norris' }, maxM: 300 },
  { line: 'clinch-river', target: { lake: 'watts-bar-lake' }, maxM: 400 },
  // Little T -> Fort Loudoun Lake crosses the Tellico Dam / Tellico canal
  // complex: NHD's named flowline stops ~1.1 km short of the FL pool edge and
  // the two lake polygons span the canal (visual QA: knoxville-system.png).

  // geo/east-fix rebuild — rebuilt reaches must terminate at their declared
  // pools/confluences (the throughLakeIds gate below checks the through-route)
  { line: 'nolichucky-river', target: { lake: 'douglas-lake' }, maxM: 400 },
  // french-broad -> douglas continuity is gated by the through-lake route
  // check (the reach line runs into the pool; no chain end is required there)
  { line: 'french-broad-river', target: { lake: 'fort-loudoun-lake' }, maxM: 600 },
  { line: 'pigeon-river', target: { lake: 'douglas-lake' }, maxM: 700 }, // pool-arm edge mismatch (NHD chain vs delivered pool polygon)
  { line: 'emory-river', target: { lake: 'watts-bar-lake' }, maxM: 5000, why: 'the Watts Bar pool polygon excludes the Emory arm (NHD river-area water) — terminus measured across the arm' },
  { line: 'sequatchie-river', target: { lake: 'nickajack-lake' }, maxM: 3000, why: 'mouth reach stops at the Shellmound pool margin; the pool carries the water to the Tennessee' },
  { line: 'powell-river', target: { lake: 'norris-lake' }, maxM: 400 },
  { line: 'holston-river', target: { lake: 'cherokee-lake' }, maxM: 400 }, // through-pool route: the reach line ends at the pool edges, the pool carries the water past the dam
  { line: 'obed-river', target: { line: 'emory-river' }, maxM: 300 },
  { line: 'new-river', target: { line: 'clear-fork' }, maxM: 500 },
  { line: 'horse-creek-greene', target: { line: 'nolichucky-river' }, maxM: 500 },
  // geo/east-fix: Kingsport confluence braid — NHD named coverage of both
  // rivers stops short of the fork (documented seam both sides)
  { line: 'north-fork-holston-river', target: { line: 'holston-river' }, maxM: 800 },
  { line: 'holston-river', target: { line: 'ft-patrick-henry-tailwater' }, maxM: 1000 },
  { line: 'little-tennessee-river', target: { lake: 'fort-loudoun-lake' }, maxM: 1500 }, // named chain stops ~1.2 km short of the pool across the Tellico-canal complex (old-lane documented seam)
];
for (const c of CHAINS) {
  const f = rivers.get(c.line);
  if (!f) { fail(c.line, 'chain reach missing'); continue; }
  const _targetGeom = c.target.dam
    ? { type: 'Point-ish', coords: [DAMS[c.target.dam].coords] }
    : null;
  let best = Infinity;
  for (const pt of reachEndpoints(f)) {
    let d;
    if (c.target.dam) d = distM(pt, DAMS[c.target.dam].coords);
    else if (c.target.lake) d = distToGeom(pt, lakes.get(c.target.lake)?.geometry);
    else d = distToGeom(pt, rivers.get(c.target.line)?.geometry);
    if (d < best) best = d;
  }
  if (c.target.dam) {
    // dam anchors sit mid-channel: the reach LINE touching the dam is what
    // "starts at the dam" means — measure geometry distance too and accept
    // the better of the two
    const dGeom = distToGeomLinesM(DAMS[c.target.dam].coords, f.geometry);
    if (dGeom < best) best = dGeom;
  }
  if (!isFinite(best)) { fail(c.line, 'chain target missing'); continue; }
  const label = c.target.dam ?? c.target.lake ?? c.target.line;
  if (best > c.maxM) fail(c.line, `no endpoint within ${c.maxM} m of ${label} (nearest ${Math.round(best)} m)`);
  else notes.push(`OK ${c.line} -> ${label}: ${Math.round(best)} m`);
}

// ---- unexplained gaps: reach islands from build report
if (existsSync(path.join(webRoot, '.atlas-src', 'east-southeast', 'build-report.json'))) {
  const report = JSON.parse(readFileSync(path.join(webRoot, '.atlas-src', 'east-southeast', 'build-report.json'), 'utf8'));
  for (const r of report.filter((x) => x.kind === 'river')) {
    if (r.id === 'tennessee-river') {
      notes.push(`tennessee-river: ${r.islands} islands — the main stem legitimately leaves the state between the Nickajack tailwater (RM 424) and Pickwick Lake; documented, not a defect`);
      continue;
    }
    if (r.maxInternalGapM > 2500) warn(r.id, `line island gap ${Math.round(r.maxInternalGapM)} m (${r.islands} islands) — slackwater strands inside pool polygons; verify at local zoom`);
    else notes.push(`OK ${r.id}: islands ${r.islands}, max gap ${Math.round(r.maxInternalGapM)} m`);
  }
}

// ---- legacy reach gates must not contradict new reach bounds
for (const id of ['south-holston-river', 'boone-tailwater', 'ft-patrick-henry-tailwater', 'watauga-river', 'clinch-river']) {
  if (REACH_GATE[id]) notes.push(`gate retained for ${id}: ${REACH_GATE[id].why}`);
}

// ---- topology file
if (!hasTopo) fail('topology', 'east-southeast.topology.json missing');
else {
  const t = JSON.parse(readFileSync(topoPath, 'utf8'));
  if (!Array.isArray(t.records)) fail('topology', 'records array missing');
  else {
    const topoIds = new Set(t.records.map((r) => r.featureId));
    for (const id of ids) if (!topoIds.has(id)) fail(id, 'no topology record');
    for (const r of t.records) {
      if (!r.sourceIdentifiers?.length) fail(r.featureId, 'topology record missing sourceIdentifiers');
      if (r.verificationState !== 'PASS' && r.verificationState !== 'UNRESOLVED') fail(r.featureId, `bad verificationState ${r.verificationState}`);
    }
    // ---- geo/east-fix rebuild gates -------------------------------------
    // Welded rivers: ≤ 40 chains, source-length parity (full-named-extent
    // reaches within 10% of the NHD lengthkm sum; gated/state-cut reaches
    // must keep ≥ half the source length), through-pool routes real, and no
    // unexplained mid-course gap over the 1 km policy line.
    const topoById = new Map(t.records.map((r) => [r.featureId, r]));
    const westMiddleLakes = new Map();
    try {
      const wm = JSON.parse(readFileSync(path.join(VERIFIED, 'west-middle.geojson'), 'utf8'));
      for (const f of wm.features ?? []) if (f.geometry?.type?.endsWith('Polygon')) westMiddleLakes.set(f.properties.id, f.geometry);
    } catch { /* west-middle file optional for the through-lake existence check */ }
    const REBUILT_RIVERS = new Set([
      'tennessee-river', 'french-broad-river', 'holston-river', 'nolichucky-river', 'powell-river',
      'little-tennessee-river', 'clinch-river', 'hiwassee-river', 'obed-river', 'daddys-creek',
      'clear-fork', 'piney-river-rhea', 'emory-river', 'new-river', 'ocoee-river', 'pigeon-river',
      'watauga-river', 'south-holston-river', 'little-river', 'upper-roan-creek', 'horse-creek-greene',
      'richardson-byrd-creek', 'indian-creek-claiborne', 'north-fork-holston-river', 'boone-tailwater',
      'sequatchie-river', 'ft-patrick-henry-tailwater',
    ]);
    for (const id of REBUILT_RIVERS) {
      const f = rivers.get(id);
      if (!f) { fail(id, 'rebuilt reach missing'); continue; }
      const rec = topoById.get(id);
      if (!rec) continue;
      const chains = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates.length : 1;
      if (chains > 40) fail(id, `rebuilt reach has ${chains} chains (> 40 weld target)`);
      if (rec.sourceLengthKm && rec.deliveredLengthKm) {
        const ratio = rec.deliveredLengthKm / rec.sourceLengthKm;
        const floor = rec.reachScope === 'gated' ? 0.5 : 0.9;
        if (ratio < floor || ratio > 1.1) {
          fail(id, `delivered length ${rec.deliveredLengthKm} km is ${(ratio * 100).toFixed(0)}% of NHD source ${rec.sourceLengthKm} km (scope ${rec.reachScope ?? 'full-named-extent'}, floor ${Math.round(floor * 100)}%)`);
        } else {
          notes.push(`OK ${id}: length ${rec.deliveredLengthKm} km = ${(ratio * 100).toFixed(0)}% of NHD ${rec.sourceLengthKm} km (${rec.reachScope ?? 'full-named-extent'})`);
        }
      }
      const gap = rec.largestConnectionGapMeters ?? 0;
      if (gap > 1000 && !(rec.midCourseSeams ?? []).some((s2) => s2.nearestChainM >= 1000 && s2.documented)) {
        fail(id, `unexplained mid-course gap ${gap} m exceeds the 1 km policy (must be documented as a real seam)`);
      }
      for (const s2 of rec.midCourseSeams ?? []) {
        if (s2.nearestChainM >= 1000 && !s2.documented) {
          fail(id, `mid-course seam ${s2.nearestChainM} m at [${s2.at}] lacks a documentation note`);
        }
      }
      for (const lid of f.properties.throughLakeIds ?? []) {
        const lakeGeom = lakes.get(lid)?.geometry ?? westMiddleLakes.get(lid);
        if (!lakeGeom) { fail(id, `throughLakeIds references missing lake ${lid}`); continue; }
        const tolM = rec.throughLakeToleranceM?.[lid] ?? 750;
        let best = Infinity;
        for (const line of (f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates])) {
          for (let i = 0; i < line.length; i += 3) {
            const d = distToGeom(line[i], lakeGeom);
            if (d < best) best = d;
            if (best === 0) break;
          }
          if (best === 0) break;
        }
        if (best > tolM) fail(id, `through-lake route to ${lid} never reaches the pool (nearest ${Math.round(best)} m > ${tolM} m)`);
        else notes.push(`OK ${id}: through-lake ${lid} reached (${Math.round(best)} m, tol ${tolM} m)`);
      }
      for (const tr of rec.termini ?? []) {
        if (!tr.ok && !tr.informational) fail(id, `terminus anchor '${tr.anchor}' is ${tr.distanceM} m away (max ${tr.maxM} m)`);
      }
      if (rec.tailwaterStartDistanceM != null && rec.tailwaterStartDistanceM > 800) {
        fail(id, `tailwater starts ${rec.tailwaterStartDistanceM} m from the dam (> 800 m)`);
      }
    }
    // Rebuilt lakes: part ceilings + pool-stage area windows + identity source
    const REBUILT_LAKES = {
      'norris-lake': { maxParts: 3, areaKm2: [90, 100], source: 'nhd-hr' },
      'nickajack-lake': { maxParts: 3, areaKm2: [40, 47], source: 'twra-reservoirs' },
      'boone-lake': { maxParts: 3, areaKm2: [15, 22], source: 'nhd-hr' },
    };
    for (const [id, gate] of Object.entries(REBUILT_LAKES)) {
      const f = lakes.get(id);
      if (!f) { fail(id, 'rebuilt lake missing'); continue; }
      if (f.properties.source !== gate.source) fail(id, `source ${f.properties.source} != expected ${gate.source} (identity source policy)`);
      const parts = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.length : 1;
      if (parts > gate.maxParts) fail(id, `rebuilt lake has ${parts} parts (> ${gate.maxParts})`);
      const area = f.properties.areaSqKm;
      if (typeof area !== 'number') fail(id, 'rebuilt lake missing areaSqKm');
      else if (area < gate.areaKm2[0] || area > gate.areaKm2[1]) fail(id, `area ${area} km² outside expected pool-stage window [${gate.areaKm2}]`);
      else notes.push(`OK ${id}: ${parts} parts, ${area} km² (pool-stage window ${gate.areaKm2.join('–')})`);
    }
  }
}

console.log('--- notes ---');
for (const n of notes) console.log(' ', n);
console.log('--- warnings ---');
for (const w of warns) console.log(' ', w);
console.log('--- errors ---');
for (const e of errors) console.log(' ', e);
console.log(`\n${fc.features.length} features · ${lakes.size} lakes · ${rivers.size} reaches · ${errors.length} errors · ${warns.length} warnings`);
if (errors.length) process.exit(1);
console.log('east-southeast validation: PASS');
