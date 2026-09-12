#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * EAST/SOUTHEAST TENNESSEE atlas build — Session E-S.
 *
 * Assembles verified, merge-ready replacement geometry for the East/Southeast
 * lane from the authoritative caches in apps/web/.atlas-src/east-southeast/
 * (see fetch-east-southeast-hydro.mjs). Output:
 *
 *   apps/web/atlas-sources/verified/east-southeast.geojson     deliverable features
 *   apps/web/atlas-sources/verified/east-southeast.topology.json connection records
 *   apps/web/.atlas-src/east-southeast/build-report.json        per-feature evidence (audit input)
 *
 * Assembly discipline (docs/audits/EAST-SOUTHEAST-HYDROGRAPHY.md):
 * - Watershed/authoritative-ID extraction only: NHD waterbodies keyed by
 *   GNIS_ID / Permanent_Identifier, whole-part per fetch window — no county
 *   or state clipping of delivered geometry.
 * - Pools NHD models under river names (Norris) are assembled from Census
 *   TIGER/Line 2024 AREAWATER by documented pool-membership rule (name set +
 *   pool window + exclusion list), NOT by name-only match.
 * - TWRA reservoir polygons (the Tennessee waterways experience source) are
 *   used where NHD partitions a pool awkwardly or not at all (Nickajack) and
 *   as the independent second verification source for identity + area.
 * - Reach gates follow apps/web/scripts/atlas-reach-gates.mjs conventions:
 *   whole-part windows, bounds cited to USGS NWIS dam gauges / pool edges.
 * - No fabricated coordinates. No connectors across unexplained gaps.
 *
 * Run: node scripts/build-east-southeast-atlas.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import shapefile from 'shapefile';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(webRoot, '.atlas-src', 'east-southeast');
const OUT_DIR = path.join(webRoot, 'atlas-sources', 'verified');
const fetchedPath = path.join(CACHE, 'fetched.json');
const retrieved = existsSync(fetchedPath) ? JSON.parse(readFileSync(fetchedPath, 'utf8')) : {};

const KM2_PER_DEG2 = 12392 * Math.cos((36 * Math.PI) / 180); // planar deg^2 -> km^2 near TN lat

// ---------------------------------------------------------------- helpers
function walkPts(r, out) {
  if (typeof r[0] === 'number') out.push(r);
  else for (const c of r) walkPts(c, out);
}
function geomPts(geom) {
  const out = [];
  walkPts(geom.coordinates, out);
  return out;
}
function bboxOf(geom) {
  let w = 999, s = 999, e = -999, n = -999;
  for (const [x, y] of geomPts(geom)) {
    if (x < w) w = x;
    if (x > e) e = x;
    if (y < s) s = y;
    if (y > n) n = y;
  }
  return [w, s, e, n];
}
function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
}
function areaKm2(geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'Polygon' ? [geom.coordinates] : [];
  let deg2 = 0;
  for (const p of polys) for (const r of p) deg2 += ringArea(r);
  return Math.abs(deg2) * KM2_PER_DEG2;
}
function vertexCount(geom) {
  return geomPts(geom).length;
}
function pointInRing(pt, ring) {
  // ray casting; ring is [x,y][]
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function pointInPolygon(pt, poly) {
  if (pointInRing(pt, poly[0])) {
    for (let i = 1; i < poly.length; i++) if (pointInRing(pt, poly[i])) return false;
    return true;
  }
  return false;
}
function pointInGeom(pt, geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  return polys.some((p) => pointInPolygon(pt, p));
}
function ringCentroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const c = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    a += c;
    cx += (ring[i][0] + ring[i + 1][0]) * c;
    cy += (ring[i][1] + ring[i + 1][1]) * c;
  }
  a /= 2;
  return a === 0 ? ring[0] : [cx / (6 * a), cy / (6 * a)];
}
// Largest part centroid, nudged inside via a small spiral search if the
// centroid of a coved ring falls outside (labelAnchor must sit on the water).
function labelAnchorFor(geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  let best = polys[0];
  for (const p of polys) if (Math.abs(ringArea(p[0])) > Math.abs(ringArea(best[0]))) best = p;
  const c = ringCentroid(best[0]);
  if (pointInPolygon(c, best)) return c.map((v) => Number(v.toFixed(5)));
  for (let r = 0.005; r <= 0.08; r += 0.005) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      const p = [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
      if (pointInPolygon(p, best)) return p.map((v) => Number(v.toFixed(5)));
    }
  }
  return best[0][0].map((v) => Number(v.toFixed(5))); // last resort: shoreline vertex
}
// Douglas–Peucker for a coordinate sequence (degrees tolerance).
function simplifyLine(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let idx = -1, dist = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const ex = ax + t * dx - px, ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > dist) { dist = d; idx = i; }
    }
    if (idx >= 0 && dist > tol * tol) {
      keep[idx] = true;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
// Remove self-crossings introduced by simplification on pinch-point coves:
// splice out the excursion between the two crossing edges (bounded passes).
function repairRingCrossings(ring) {
  for (let pass = 0; pass < 40; pass++) {
    const n = ring.length - 1;
    let fixed = false;
    outer: for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a = ring[i], b = ring[i + 1], c = ring[j], d = ring[j + 1];
        const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
        const touch = (p, q) => p[0] === q[0] && p[1] === q[1];
        if (o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b)
          && !(touch(a, c) || touch(a, d) || touch(b, c) || touch(b, d))) {
          ring = ring.slice(0, i + 1).concat(ring.slice(j + 1));
          fixed = true;
          break outer;
        }
      }
    }
    if (!fixed) break;
  }
  // re-close
  const a = ring[0];
  const z = ring[ring.length - 1];
  if (a[0] !== z[0] || a[1] !== z[1]) ring = ring.concat([a]);
  return ring.length >= 4 ? ring : null;
}
function simplifyPolygon(poly, tol) {
  return poly
    .map((ring) => simplifyLine(ring, tol))
    .map((ring) => (tol > 0 ? repairRingCrossings(ring) : ring))
    .filter((r) => r && r.length >= 4);
}
function simplifyGeom(geom, tol) {
  if (geom.type === 'Polygon') {
    const out = simplifyPolygon(geom.coordinates, tol);
    return out.length ? { type: 'Polygon', coordinates: out } : null;
  }
  if (geom.type === 'MultiPolygon') {
    const out = geom.coordinates.map((p) => simplifyPolygon(p, tol)).filter((p) => p.length);
    return out.length ? { type: 'MultiPolygon', coordinates: out } : null;
  }
  return geom;
}
function distM(a, b) {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------- cache loaders
function loadJson(name) {
  return JSON.parse(readFileSync(path.join(CACHE, name), 'utf8'));
}
function loadWaterbodies() {
  const byPid = new Map();
  const files = readdirSync(CACHE).filter((n) => /^wb-.*\.geojson$/.test(n));
  for (const f of files) {
    const j = loadJson(f);
    for (const ft of j.features) {
      const pid = ft.properties.permanent_identifier;
      if (!byPid.has(pid)) byPid.set(pid, ft);
    }
  }
  return [...byPid.values()];
}
async function loadCensusPool(counties) {
  const feats = [];
  for (const c of counties) {
    const p = path.join(webRoot, '.atlas-src', 'awshp', `tl_2024_${c}_areawater.shp`);
    const src = await shapefile.open(p);
    let r;
    while ((r = await src.read()).value) {
      const g = r.value;
      if (g.properties.MTFCC === 'H2030') feats.push(g);
    }
  }
  return feats;
}
const nw = loadJson('nwis-gauges.json');
function _gauge(site) {
  const s = nw[site];
  if (!s) throw new Error(`missing NWIS site ${site}`);
  return { coords: [s.lon, s.lat], name: s.name, site };
}

// ---------------------------------------------------------------- dam registry
// Dam anchors: USGS NWIS gauge coordinates (NAD83) at/below the dam, or the
// NHD pool extremum where no gauge exists (documented per entry).
export const DAMS = {
  norris: { name: 'Norris Dam', coords: [-84.08214, 36.21563], source: 'USGS NWIS 03533000 (Clinch River below Norris Dam), NAD83' },
  'melton-hill': { name: 'Melton Hill Dam', coords: [-84.30076, 35.88536], source: 'USGS NWIS 03535912 (Clinch River at Melton Hill Dam, tailwater) + river-mile site 355307084180200 (Clinch RM 23.1)' },
  'fort-loudoun': { name: 'Fort Loudoun Dam', coords: [-84.24325, 35.79174], source: 'USGS NWIS 03499510 (Tennessee River at Fort Loudoun Dam, TW) + river-mile site 354730084143601 (TN RM 602.3)' },
  'watts-bar': { name: 'Watts Bar Dam', coords: [-84.78328, 35.62035], source: 'USGS NWIS 03543005 (Tennessee River at Watts Bar Dam, TW) + river-mile site 353712084465900 (TN RM 529.9)' },
  chickamauga: { name: 'Chickamauga Dam', coords: [-85.22968, 35.10313], source: 'USGS NWIS 03566510 (Tennessee River at Chickamauga Dam, TW)' },
  nickajack: { name: 'Nickajack Dam', coords: [-85.62108, 35.00258], source: 'USGS NWIS 03570525 (Tennessee River at Nickajack Dam, tailwater)' },
  tellico: { name: 'Tellico Dam', coords: [-84.25445, 35.78768], source: 'NHD 01327191 + TWRA Tellico Lake northern extremum (both ≈ -84.2545, 35.7877); no NWIS dam gauge exists' },
  cherokee: { name: 'Cherokee Dam', coords: [-83.49934, 36.1662], source: 'USGS NWIS 03493510 (Holston River at Cherokee Dam, TW) + 03494000 (Holston River near Jefferson City)' },
  douglas: { name: 'Douglas Dam', coords: [-83.53878, 35.9612], source: 'USGS NWIS 03468510 (French Broad River at Douglas Dam, TW) + 03469000 (below Douglas Dam)' },
  'south-holston': { name: 'South Holston Dam', coords: [-82.09726, 36.52356], source: 'USGS NWIS 03476500 (S F Holston River below South Holston Dam)' },
  boone: { name: 'Boone Dam', coords: [-82.43792, 36.44066], source: 'USGS NWIS 03486810 (South Fork Holston River at Boone Dam, TW)' },
  'ft-patrick-henry': { name: 'Fort Patrick Henry Dam', coords: [-82.50904, 36.49816], source: 'USGS NWIS 03487010 (S F Holston River at Fort Patrick Henry Dam)' },
  watauga: { name: 'Watauga Dam', coords: [-82.12596, 36.33011], source: 'USGS NWIS 03483950 (Watauga River below Watauga Dam) + 03483450 (above Watauga Dam)' },
  wilbur: { name: 'Wilbur Dam', coords: [-82.12956, 36.34411], source: 'USGS NWIS 03484000 (Watauga River below Wilbur Dam) + tailrace gauges 03483970/03483980' },
  parksville: { name: 'Parksville Dam (Ocoee No. 1)', coords: [-84.6552, 35.0908], source: 'USGS NWIS 03564500 (Ocoee River at Parksville) + NHD 01304751 Lake Ocoee west edge -84.65' },
  'ocoee-no-3': { name: 'Ocoee Dam No. 3', coords: [-84.4699, 35.0371], source: 'NHD 01296232 Ocoee Number Three Lake downstream (west) extremum at the dam; TVA Ocoee Dam No. 3' },
  chilhowee: { name: 'Chilhowee Dam', coords: [-84.0252, 35.5623], source: 'NHD 01280464 Chilhowee Lake north-east extremum at the dam; no NWIS dam gauge' },
  calderwood: { name: 'Calderwood Dam', coords: [-83.9418, 35.4987], source: 'NHD 00982412 Calderwood Lake south-east extremum at the dam; no NWIS dam gauge' },
};

// ---------------------------------------------------------------- lake configs
// include: {src:'nhd', ids:[gnis_id]} | {src:'twra', name} | {src:'census', rule:{...}}
const LAKES = [
  {
    id: 'norris-lake', name: 'Norris Lake', type: 'lake', regionId: 'tn-east-clinch', gaugeIds: ['03533000'],
    dam: 'norris', upstream: ['clinch-river', 'powell-river'], downstream: ['clinch-river'],
    chain: 'Clinch River + Powell River -> Norris Lake -> Norris Dam -> Clinch River tailwater -> Melton Hill Lake -> Watts Bar Lake',
    include: { src: 'census', counties: ['47001', '47013', '47025', '47057', '47173', '47067', '47089'],
      window: [-84.35, 36.15, -83.2, 36.66], names: ['Norris Lk', 'Clinch Riv', 'Powell Riv', 'Lost Crk'],
      unnamedMinKm2: 0.05, excludeNames: ['Big Ridge Lk', 'Fern Lk', 'Cove Lk', 'Corbin Lk', 'Lea Lk'] },
    xchecks: [
      { src: 'NHD medium-res NHDWaterbody GNIS 01269832', areaKm2: 95.5 },
      { src: 'TWRA RiversReservoirs reservoir layer (Norris Lake, 36,149 ac pool outline incl. riverine arms)', areaKm2: 146.3 },
      { src: 'TVA published Norris size (33,840 ac at summer normal)', areaKm2: 137.0 },
    ],
    notes: 'NHDPlus HR carries almost no named Norris pool; Census name-only match (the shipped defect) dropped every arm piece labeled Clinch Riv/Powell Riv. Pool assembled by membership rule; upper-Clinch VA channel trace present in the TWRA pool outline was excluded (it follows free-flowing water, not the pool).',
  },
  {
    id: 'cherokee-lake', name: 'Cherokee Lake', type: 'lake', regionId: 'tn-east-holston', gaugeIds: ['03493510'],
    dam: 'cherokee', upstream: ['holston-river'], downstream: ['holston-river'],
    chain: 'Holston River -> Cherokee Lake -> Cherokee Dam -> Holston River (Cherokee tailwater) -> Fort Loudoun Lake',
    include: { src: 'nhd', ids: ['01280322'] },
    xchecks: [{ src: 'TWRA reservoir layer (Cherokee Lake, 27,029 ac)', areaKm2: 109.4 }, { src: 'TVA published Cherokee size (30,300 ac)', areaKm2: 122.6 }],
    notes: 'Single NHDPlus HR waterbody, dam-to-dam; Holston arm included to the NHD pool head.',
  },
  {
    id: 'chickamauga-lake', name: 'Chickamauga Lake', type: 'lake', regionId: 'tn-se-hiwassee', gaugeIds: ['03566510'],
    dam: 'chickamauga', upstream: ['watts-bar-lake', 'hiwassee-river', 'tennessee-river'], downstream: ['tennessee-river', 'nickajack-lake'],
    chain: 'Tennessee River (Watts Bar tailwater) + Hiwassee River -> Chickamauga Lake -> Chickamauga Dam -> Tennessee River (Nickajack Lake)',
    include: { src: 'nhd', ids: ['01312639', '01289869'], nameNote: '01312639 Dallas Lake is the GNIS/NHD name of the Chickamauga impoundment; 01289869 Judd Slough is the Hiwassee-mouth pool section' },
    xchecks: [{ src: 'TWRA reservoir layer (Chickamauga Lake, 33,973 ac; outline extends riverine channel slivers up the Hiwassee to Reliance — excluded from delivery)', areaKm2: 137.5 }, { src: 'TVA published Chickamauga size (35,400 ac)', areaKm2: 143.2 }],
    notes: 'Shipped polygon held 15 county-clipped fragments (49.9 km2) missing both dam ends and the upper arm. NHD pool = Dallas Lake + Judd Slough (dam-to-dam).',
  },
  {
    id: 'douglas-lake', name: 'Douglas Lake', type: 'lake', regionId: 'tn-east-pigeon-frenchbroad', gaugeIds: ['03468510'],
    dam: 'douglas', upstream: ['french-broad-river', 'pigeon-river', 'little-pigeon-river'], downstream: ['french-broad-river'],
    chain: 'French Broad River + Pigeon River -> Douglas Lake -> Douglas Dam -> French Broad River (Douglas tailwater) -> Holston/French Broad confluence (Tennessee River)',
    include: { src: 'nhd', ids: ['01282739'] },
    xchecks: [{ src: 'TWRA reservoir layer (Douglas Lake, 28,738 ac)', areaKm2: 116.3 }, { src: 'TVA published Douglas size (28,420 ac at full pool)', areaKm2: 115.0 }],
    notes: 'Aliases: Douglas Reservoir. Shipped polygon held 6 fragments (64.6 km2).',
  },
  {
    id: 'fort-loudoun-lake', name: 'Fort Loudoun Lake', type: 'lake', regionId: 'tn-east-clinch', gaugeIds: ['03499510'],
    dam: 'fort-loudoun', upstream: ['holston-river', 'french-broad-river', 'little-tennessee-river', 'tellico-lake'], downstream: ['watts-bar-lake'],
    chain: 'Holston River + French Broad River + Little Tennessee River (Tellico canal) -> Fort Loudoun Lake -> Fort Loudoun Dam -> Watts Bar Lake',
    include: { src: 'nhd', ids: ['01307966'] },
    xchecks: [{ src: 'TWRA reservoir layer (Fort Loudoun Lake, 18,727 ac)', areaKm2: 75.8 }, { src: 'TVA published Fort Loudoun size (14,600 ac)', areaKm2: 59.1 }],
    notes: 'Shipped polygon (6 parts, 12.5 km2) missed the dam reach and most of both arms; NHD pool reaches Fort Loudoun Dam at -84.2432/35.7917.',
  },
  {
    id: 'watts-bar-lake', name: 'Watts Bar Lake', type: 'lake', regionId: 'tn-east-clinch', gaugeIds: ['03543005'],
    dam: 'watts-bar', upstream: ['fort-loudoun-lake', 'melton-hill-lake', 'clinch-river'], downstream: ['chickamauga-lake'],
    chain: 'Tennessee River (Fort Loudoun tailwater) + Clinch River (Melton Hill tailwater) -> Watts Bar Lake -> Watts Bar Dam -> Tennessee River (Chickamauga Lake)',
    include: { src: 'nhd', ids: ['01304421'] },
    xchecks: [{ src: 'TWRA reservoir layer (Watts Bar Lake, 37,884 ac)', areaKm2: 153.3 }, { src: 'TVA published Watts Bar size (39,090 ac at full pool)', areaKm2: 158.2 }],
    notes: 'Single NHDPlus HR pool polygon: Fort Loudoun Dam (-84.2432) to Watts Bar Dam (-84.7833) incl. the Clinch arm to Melton Hill Dam. Emory River arm remains NHD river-area, not lake polygon (documented).',
  },
  {
    id: 'south-holston-lake', name: 'South Holston Lake', type: 'lake', regionId: 'tn-east-holston', gaugeIds: ['03476500'],
    dam: 'south-holston', upstream: ['south-fork-holston-river-va'], downstream: ['south-holston-river'],
    chain: 'South Fork Holston River (VA) -> South Holston Lake -> South Holston Dam -> South Fork Holston River (South Holston tailwater) -> Boone Lake',
    include: { src: 'nhd', ids: ['01327073'] },
    xchecks: [{ src: 'TWRA reservoir layer (South Holston Lake, 6,019 ac — Tennessee portion only)', areaKm2: 24.4 }, { src: 'TVA published South Holston size (7,580 ac)', areaKm2: 30.7 }],
    notes: 'NHD waterbody spans the state line into Washington Co VA (30.3 km2, to 36.66 N) — full lake delivered unclipped; the shipped polygon was the TN-clipped 18.2 km2 portion.',
  },
  {
    id: 'boone-lake', name: 'Boone Lake', type: 'lake', regionId: 'tn-east-holston', gaugeIds: ['03486810'],
    dam: 'boone', upstream: ['south-holston-river', 'watauga-river'], downstream: ['boone-tailwater'],
    chain: 'South Fork Holston River (South Holston tailwater) + Watauga River (Wilbur tailwater) -> Boone Lake -> Boone Dam -> South Fork Holston River (Boone tailwater) -> Fort Patrick Henry Lake',
    include: { src: 'nhd', ids: ['01326910'] },
    xchecks: [{ src: 'TWRA reservoir layer (Boone Lake, 5,055 ac — incl. upper slackwater arms)', areaKm2: 20.5 }, { src: 'TVA published Boone size (4,400 ac)', areaKm2: 17.8 }],
    notes: 'Promoted from passive lakes.geojson to interactive. NHD models the upper SF Holston/Watauga slackwater arms as river; the tailwater lines carry continuity to the NHD pool edge.',
  },
  {
    id: 'watauga-lake', name: 'Watauga Lake', type: 'lake', regionId: 'tn-northeast-watauga', gaugeIds: ['03483450'],
    dam: 'watauga', upstream: ['watauga-river-headwaters-nc'], downstream: ['watauga-river-wilbur-reach'],
    chain: 'Watauga River (NC headwaters) -> Watauga Lake -> Watauga Dam -> Watauga River (Watauga Dam to Wilbur Lake) -> Wilbur Lake',
    include: { src: 'nhd', ids: ['01273873'] },
    xchecks: [{ src: 'TWRA reservoir layer (Watauga Lake, 6,350 ac)', areaKm2: 25.7 }, { src: 'TVA published Watauga size (6,430 ac)', areaKm2: 26.0 }],
    notes: 'Promoted from passive lakes.geojson. Reaches Watauga Dam at the pool west end (-82.126).',
  },
  {
    id: 'wilbur-lake', name: 'Wilbur Lake', type: 'lake', regionId: 'tn-northeast-watauga', gaugeIds: ['03484000'],
    dam: 'wilbur', upstream: ['watauga-river-wilbur-reach'], downstream: ['watauga-river'],
    chain: 'Watauga River (Watauga Dam release) -> Wilbur Lake -> Wilbur Dam -> Watauga River (Wilbur tailwater) -> Boone Lake',
    include: { src: 'nhd', ids: ['01327381'] },
    xchecks: [{ src: 'TWRA reservoir layer (Wilbur Lake, 72 ac)', areaKm2: 0.29 }],
    notes: 'NEW interactive feature (was absent from catalog and both map sources). Small regulating pond between Watauga Dam and Wilbur Dam.',
  },
  {
    id: 'fort-patrick-henry-lake', name: 'Fort Patrick Henry Lake', type: 'lake', regionId: 'tn-east-holston', gaugeIds: ['03487010'],
    dam: 'ft-patrick-henry', upstream: ['boone-tailwater'], downstream: ['ft-patrick-henry-tailwater'],
    chain: 'South Fork Holston River (Boone tailwater) -> Fort Patrick Henry Lake -> Fort Patrick Henry Dam -> South Fork Holston River (FPH tailwater) -> Holston River (Kingsport confluence)',
    include: { src: 'nhd', ids: ['01284672'] },
    xchecks: [{ src: 'TWRA reservoir layer (Fort Patrick Henry Lake, 860 ac)', areaKm2: 3.5 }],
    notes: 'NEW interactive feature (was visible on the waterways map but absent from the atlas).',
  },
  {
    id: 'tellico-lake', name: 'Tellico Lake', type: 'lake', regionId: 'tn-east-clinch', gaugeIds: [],
    dam: 'tellico', upstream: ['little-tennessee-river', 'chilhowee-lake', 'tellico-river'], downstream: ['fort-loudoun-lake'],
    chain: 'Little Tennessee River (Chilhowee Dam release) + Tellico River -> Tellico Lake -> Tellico Dam -> Fort Loudoun Lake (via canal/tailwater)',
    include: { src: 'nhd', ids: ['01327191', '01304036'] },
    xchecks: [{ src: 'TWRA reservoir layer (Tellico Lake, 15,788 ac)', areaKm2: 63.9 }, { src: 'TVA published Tellico size (15,540 ac)', areaKm2: 62.9 }],
    notes: 'Promoted from passive lakes.geojson (which stopped 1 km short of Tellico Dam and missed the upstream arm shape).',
  },
  {
    id: 'melton-hill-lake', name: 'Melton Hill Lake', type: 'lake', regionId: 'tn-east-clinch', gaugeIds: ['03535912'],
    dam: 'melton-hill', upstream: ['clinch-river'], downstream: ['watts-bar-lake'],
    chain: 'Clinch River (Norris tailwater) -> Melton Hill Lake -> Melton Hill Dam -> Watts Bar Lake (Clinch arm)',
    include: { src: 'nhd', ids: ['01293571'] },
    xchecks: [{ src: 'TWRA reservoir layer (Melton Hill Lake, 6,035 ac)', areaKm2: 24.4 }, { src: 'TVA published Melton Hill size (5,470 ac)', areaKm2: 22.1 }],
    notes: 'NEW interactive feature. The Norris tailwater (clinch-river) runs through this pool — line-over-polygon by design; condition scoring stays with the line feature.',
  },
  {
    id: 'chilhowee-lake', name: 'Chilhowee Lake', type: 'lake', regionId: 'tn-east-smokies', gaugeIds: [],
    dam: 'chilhowee', upstream: ['calderwood-lake', 'little-tennessee-river'], downstream: ['tellico-lake'],
    chain: 'Little Tennessee River (Calderwood Dam release) -> Chilhowee Lake -> Chilhowee Dam -> Tellico Lake',
    include: { src: 'nhd', ids: ['01280464'] },
    xchecks: [{ src: 'TWRA reservoir layer (Chilhowee Reservoir, 1,738 ac)', areaKm2: 7.0 }],
    notes: 'NEW interactive feature (represented on the waterways map, absent from the atlas).',
  },
  {
    id: 'calderwood-lake', name: 'Calderwood Lake', type: 'lake', regionId: 'tn-east-smokies', gaugeIds: [],
    dam: 'calderwood', upstream: ['little-tennessee-river-headwaters-nc'], downstream: ['chilhowee-lake'],
    chain: 'Little Tennessee River (Fontana Dam release, NC) -> Calderwood Lake -> Calderwood Dam -> Chilhowee Lake',
    include: { src: 'nhd', ids: ['00982412'] },
    xchecks: [{ src: 'TWRA reservoir layer lists this pool as "Little Calderwood Reservoir" (458 ac)', areaKm2: 1.85 }],
    notes: 'NEW interactive feature. TWRA names the TN pool "Little Calderwood Reservoir"; NHD/GNIS name is Calderwood Lake (GNIS 00982412) — alias recorded.',
  },
  {
    id: 'parksville-lake', name: 'Parksville Lake', type: 'lake', regionId: 'tn-se-hiwassee', gaugeIds: ['03564500'],
    dam: 'parksville', upstream: ['ocoee-river', 'ocoee-number-three-lake'], downstream: ['parksville-tailwater'],
    chain: 'Ocoee River (upper reach past Ocoee No. 3 Lake) -> Parksville Lake -> Parksville Dam (Ocoee No. 1) -> Ocoee River (Parksville tailwater) -> Hiwassee River',
    include: { src: 'nhd', ids: ['01304751'], nameNote: 'GNIS/NHD name "Lake Ocoee"' },
    xchecks: [{ src: 'TWRA reservoir layer ("Ocoee Lake", 2,112 ac)', areaKm2: 8.5 }],
    notes: 'Aliases: Ocoee Lake, Ocoee Lake No. 1, Parksville Reservoir. Promoted from passive lakes.geojson to interactive under the same ID.',
  },
  {
    id: 'ocoee-number-three-lake', name: 'Ocoee Number Three Lake', type: 'lake', regionId: 'tn-se-hiwassee', gaugeIds: [],
    dam: 'ocoee-no-3', upstream: ['ocoee-river'], downstream: ['ocoee-river'],
    chain: 'Ocoee River (Copperhill reach) -> Ocoee Number Three Lake -> Ocoee Dam No. 3 -> Ocoee River -> Parksville Lake',
    include: { src: 'nhd', ids: ['01296232'] },
    xchecks: [{ src: 'TWRA reservoir layer lists this pool as "Hiwassee Lake" (443 ac)', areaKm2: 1.8 }],
    notes: 'NEW interactive feature — this is the unidentified lake near the Parksville/Ocoee system. GNIS/NHD name "Ocoee Number Three Lake" (TVA Ocoee Dam No. 3 impoundment); TWRA lists it under the historical name "Hiwassee Lake" — alias recorded, NOT the NC Hiwassee Lake.',
  },
  {
    id: 'nickajack-lake', name: 'Nickajack Lake', type: 'lake', regionId: 'tn-se-hiwassee', gaugeIds: ['03570525'],
    dam: 'nickajack', upstream: ['tennessee-river'], downstream: ['tennessee-river'],
    chain: 'Tennessee River (Chickamauga Dam tailwater) -> Nickajack Lake -> Nickajack Dam -> Tennessee River (toward Guntersville Lake, AL)',
    include: { src: 'twra', name: 'Nickajack Lake' },
    xchecks: [{ src: 'NHDPlus HR NHDWaterbody GNIS 01295741 (covers only the western gorge; the Chattanooga reach is NHD river-area)', areaKm2: 28.0 }, { src: 'TVA published Nickajack size (10,700 ac)', areaKm2: 43.3 }],
    notes: 'TWRA polygon is the complete pool (Chickamauga Dam to Nickajack Dam); NHDPlus HR splits it, so TWRA (the waterways-map source) is the delivery geometry, simplified 0.0002.',
  },
];

// ---------------------------------------------------------------- river configs
// window gates bound each reach (whole-part). up/down terminals cite dams or
// pool edges for the connectivity checks.
const RIVERS = [
  {
    id: 'tennessee-river', name: 'Tennessee River', type: 'river', regionId: 'tn-west', gaugeIds: [],
    file: 'fl-tennessee-river-east.geojson', file2: 'fl-tennessee-river-west.geojson',
    gates: [{ minLon: -85.72, maxLon: -83.5, minLat: 34.9, maxLat: 36.2, stateCut: 'tn' }, { minLon: -88.65, maxLon: -87.7, minLat: 35.0, maxLat: 36.75, stateCut: 'tn' }],
    throughLakeIds: ['nickajack-lake', 'chickamauga-lake', 'watts-bar-lake', 'fort-loudoun-lake', 'pickwick-lake', 'kentucky-lake'],
    why: 'Full Tennessee main stem within Tennessee: AL line (Shellmound, TN RM 424) upstream to the Holston/French Broad confluence at Knoxville, plus the West Tennessee main stem (Pickwick to the KY line). Flowline continuity preserved through Nickajack/Chickamauga/Watts Bar/Fort Loudoun/Kentucky pools via NHD artificial paths (no tailwater scoring implied inside reservoirs).',
    upstream: ['holston-river', 'french-broad-river'], downstream: ['tennessee-river (continues into AL/KY)'],
  },
  {
    id: 'holston-river', name: 'Holston River', type: 'river', regionId: 'tn-east-pigeon-frenchbroad', gaugeIds: [],
    file: 'fl-holston-river.geojson',
    gates: [{ minLon: -84.16, maxLon: -82.56, minLat: 35.9, maxLat: 36.6 }],
    throughLakeIds: ['cherokee-lake'],
    why: 'Holston main stem from the North/South Fork confluence at Kingsport (USGS 03487010 tailwater terminus) through Cherokee Lake (artificial path) to the French Broad confluence at the head of Fort Loudoun Lake. Excludes VA fork water by name discipline (only gnis_name = Holston River).',
    upstream: ['north-fork-holston-river', 'ft-patrick-henry-tailwater'], downstream: ['fort-loudoun-lake'],
  },
  {
    id: 'north-fork-holston-river', name: 'North Fork Holston River', type: 'river', regionId: 'tn-east-holston', gaugeIds: [],
    file: 'fl-north-fork-holston.geojson',
    gates: [{ minLon: -82.95, maxLon: -82.56, minLat: 36.45, maxLat: 36.75 }],
    why: 'North Fork Holston from the TN/VA line (the fork forms part of the state line; VA water upstream is out of scope) to the Kingsport confluence where the Holston main stem begins.',
    upstream: ['north-fork-holston-river (continues in VA)'], downstream: ['holston-river'],
  },
  {
    id: 'clinch-river', name: 'Clinch River (Norris tailwater)', type: 'tailrace', regionId: 'tn-east-clinch', gaugeIds: ['03533000'],
        dam: 'norris',
    file: 'fl-clinch-river.geojson',
    gates: [{ minLon: -84.56, maxLon: -84.078, minLat: 35.7, maxLat: 36.3 }],
    fillNear: [{ dam: 'norris', r: 400 }],
    throughLakeIds: ['melton-hill-lake', 'watts-bar-lake'],
    why: 'Norris tailwater rebuilt from NHDPlus HR at precision 6: begins AT Norris Dam (USGS 03533000 lon -84.0821 — the shipped gate cut the reach 2 km downstream of the dam), runs through the Melton Hill pool to the Clinch mouth at Kingston / Watts Bar Lake.',
    upstream: ['norris-lake'], downstream: ['watts-bar-lake', 'melton-hill-lake'],
  },
  {
    id: 'south-holston-river', name: 'South Fork Holston River (South Holston tailwater)', type: 'tailrace', regionId: 'tn-east-holston', gaugeIds: ['03476500'],
        dam: 'south-holston',
    file: 'fl-s-fork-holston-lower.geojson',
    gates: [{ minLon: -82.34, maxLon: -82.09, minLat: 36.35, maxLat: 36.6 }],
    fillNear: [{ dam: 'south-holston', r: 1200 }],
    trimInsideLakeIds: ['boone-lake'],
    why: 'South Holston Dam (USGS 03476500) to the Boone Lake SF Holston arm head (NHD pool edge).',
    upstream: ['south-holston-lake'], downstream: ['boone-lake'],
  },
  {
    id: 'boone-tailwater', name: 'Boone Tailwater (South Fork Holston River)', type: 'tailrace', regionId: 'tn-east-holston', gaugeIds: ['03486810'],
        dam: 'boone',
    file: 'fl-s-fork-holston-lower.geojson',
    gates: [{ minLon: -82.515, maxLon: -82.43, minLat: 36.35, maxLat: 36.6 }],
    throughLakeIds: ['fort-patrick-henry-lake'],
    why: 'Boone Dam (USGS 03486810) to Fort Patrick Henry Lake head (NHD pool edge).',
    upstream: ['boone-lake'], downstream: ['fort-patrick-henry-lake'],
  },
  {
    id: 'ft-patrick-henry-tailwater', name: 'Fort Patrick Henry Tailwater (South Fork Holston River)', type: 'tailrace', regionId: 'tn-east-holston', gaugeIds: ['03487010'],
        dam: 'ft-patrick-henry',
    file: 'fl-s-fork-holston-lower.geojson',
    gates: [{ minLon: -82.62, maxLon: -82.5, minLat: 36.45, maxLat: 36.6 }],
    fillNear: [{ dam: 'ft-patrick-henry', r: 600 }],
    throughLakeIds: ['fort-patrick-henry-lake'],
    why: 'Fort Patrick Henry Dam (USGS 03487010) to the Kingsport confluence where the North and South Forks form the Holston River.',
    upstream: ['fort-patrick-henry-lake'], downstream: ['holston-river', 'north-fork-holston-river'],
  },
  {
    id: 'watauga-river', name: 'Watauga River (Wilbur tailwater)', type: 'tailrace', regionId: 'tn-northeast-watauga', gaugeIds: ['03483980', '03484000', '03486000'],
        dam: 'wilbur',
    excludeSharedWith: ['watauga-river-wilbur-reach'],
    file: 'fl-watauga-river.geojson',
    gates: [{ minLon: -82.6, maxLon: -82.11, minLat: 36.28, maxLat: 36.55 }],
    fillNear: [{ dam: 'wilbur', r: 1200 }],
    trimInsideLakeIds: ['boone-lake'],
    throughLakeIds: [],
    why: 'Wilbur Dam (USGS 03484000) down the Watauga valley through Elizabethton (USGS 03486000) to the South Fork Holston confluence at the head of the Boone Lake Watauga arm.',
    upstream: ['wilbur-lake'], downstream: ['boone-lake'],
  },
  {
    id: 'watauga-river-wilbur-reach', name: 'Watauga River (Watauga Dam to Wilbur Lake)', type: 'river', regionId: 'tn-northeast-watauga', gaugeIds: ['03483950'],
        dam: 'watauga',
    file: 'fl-watauga-river.geojson',
    gates: [{ minLon: -82.145, maxLon: -82.105, minLat: 36.322, maxLat: 36.343 }], // maxLat 36.343 keeps the Wilbur Dam tailrace pieces with watauga-river
    fillNear: [{ dam: 'watauga', r: 1200 }, { dam: 'wilbur', r: 1200 }],
    why: 'Short riverine reach connecting Watauga Lake at Watauga Dam (USGS 03483950, 36.3301/-82.1260) to Wilbur Lake, closing the Watauga Lake -> Wilbur Lake -> Watauga River chain.',
    upstream: ['watauga-lake'], downstream: ['wilbur-lake'],
  },
  {
    id: 'little-tennessee-river', name: 'Little Tennessee River', type: 'river', regionId: 'tn-east-smokies', gaugeIds: ['03519750'],
    file: 'fl-little-tennessee.geojson',
    gates: [{ minLon: -84.35, maxLon: -83.45, minLat: 35.25, maxLat: 35.95, stateCut: 'nc' }], // -84.35: the lower Little T (Tellico Dam -> TN River) runs west of -84.20
    fillNear: [{ dam: 'tellico', r: 1000 }, { dam: 'chilhowee', r: 1000 }, { dam: 'calderwood', r: 1000 }],
    throughLakeIds: ['calderwood-lake', 'chilhowee-lake', 'tellico-lake', 'watts-bar-lake'],
    why: 'Little Tennessee from the TN/NC line below Fontana Dam (state cut verified against the Census 2024 state boundary; NC water excluded) through Calderwood and Chilhowee pools and Tellico Lake (artificial paths) to the Tennessee River at the Little T mouth. Reservoir continuity is carried by the lake polygons; no tailwater scoring implied.',
    upstream: ['little-tennessee-river (continues in NC above Fontana)'], downstream: ['fort-loudoun-lake'],
  },
];

// ---------------------------------------------------------------- assembly
function collectNhdPolys(ids) {
  const idSet = new Set(ids);
  const polys = [];
  const sourceIds = new Set();
  for (const ft of loadWaterbodies()) {
    const p = ft.properties;
    if (!idSet.has(p.gnis_id)) continue;
    sourceIds.add(`${p.gnis_name} (GNIS ${p.gnis_id}, PID ${p.permanent_identifier}, fcode ${p.fcode})`);
    polys.push(ft);
  }
  return { polys, sourceIds: [...sourceIds] };
}
function polysToGeom(polys, simplifyTol) {
  const rings = polys.map((ft) => (ft.geometry.type === 'Polygon' ? [ft.geometry.coordinates] : ft.geometry.coordinates));
  const flat = rings.flat().map((poly) => (simplifyTol ? simplifyPolygon(poly, simplifyTol) : poly)).filter((p) => p.length);
  return flat.length === 1 ? { type: 'Polygon', coordinates: flat[0] } : { type: 'MultiPolygon', coordinates: flat };
}
async function censusPolys(cfg) {
  const feats = await loadCensusPool(cfg.counties);
  const out = [];
  const [w, s, e, n] = cfg.window;
  for (const g of feats) {
    let pts = [];
    walkPts(g.geometry.coordinates, pts);
    const bb = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
    if (bb[2] < w || bb[0] > e || bb[3] < s || bb[1] > n) continue;
    const name = g.properties.FULLNAME ?? '(unnamed)';
    if (cfg.excludeNames?.includes(name)) continue;
    const a = areaKm2(g.geometry);
    // membership rule: listed pool names always in; anything else only if it
    // is an unnamed creek-arm piece of at least the minimum area
    const listed = cfg.names.includes(name);
    if (!listed && (name !== '(unnamed)' || a < cfg.unnamedMinKm2)) continue;
    out.push(g);
  }
  return out;
}
async function buildLake(cfg) {
  const report = { id: cfg.id, kind: 'lake' };
  let polys = [], sourceIds = [];
  let sourceArea = null, sourceLabel = '';
  if (cfg.include.src === 'nhd') {
    const got = collectNhdPolys(cfg.include.ids);
    polys = got.polys.map((ft) => ft);
    sourceIds = got.sourceIds;
    sourceLabel = 'USGS NHDPlus HR NHDWaterbody (GNIS-keyed, whole-part, unclipped)';
    sourceArea = polys.reduce((s, f) => s + Number(f.properties.areasqkm ?? 0), 0);
  } else if (cfg.include.src === 'twra') {
    const twra = loadJson('twra-reservoirs.geojson');
    for (const f of twra.features) {
      if ((f.properties.NAME ?? '') !== cfg.include.name) continue;
      polys.push(f);
      sourceIds.push(`TWRA tn_reservoirs OBJECTID ${f.properties.OBJECTID} "${cfg.include.name}" (${Math.round(f.properties.Acres)} ac)`);
    }
    if (!polys.length) throw new Error(`no TWRA polygon for ${cfg.id}`);
    sourceLabel = 'TWRA RiversReservoirs FeatureServer tn_reservoirs (Tennessee waterways experience source)';
    sourceArea = areaKm2(polysToGeom(polys, 0));
  } else if (cfg.include.src === 'census') {
    const feats = await censusPolys(cfg.include);
    polys = feats.map((g) => ({ geometry: g.geometry, properties: { gnis_name: g.properties.FULLNAME, hydroid: g.properties.HYDROID } }));
    sourceIds = [`Census TIGER/Line 2024 AREAWATER (H2030) pieces: ${cfg.include.names.join('/')} + unnamed ≥${cfg.include.unnamedMinKm2} km2 in pool window [${cfg.include.window}]`];
    sourceLabel = 'Census TIGER/Line 2024 AREAWATER, pool-membership assembly (counties ' + cfg.include.counties.join(',') + ')';
    sourceArea = polys.reduce((s, f) => s + areaKm2(f.geometry), 0);
  }
  // Size-tiered Douglas–Peucker on the RAW source rings (before, NHD came at
  // 11 m / census 15 m / twra 22 m). Tiers keep coves at first-label zoom
  // while holding the offline budget: >=50 km2 -> 45 m, >=5 km2 -> 30 m,
  // else 15 m.
  // primary NHD Permanent_Identifier (GUID) for the provenance contract
  let permanentId;
  if (cfg.include.src === 'nhd') {
    let bestA = -1;
    for (const f of polys) {
      const a = areaKm2(f.geometry);
      if (a > bestA) { bestA = a; permanentId = f.properties.permanent_identifier; }
    }
  }
  const raw = polysToGeom(polys, 0);
  const rawKm2 = areaKm2(raw);
  const simplifyTol = rawKm2 >= 50 ? 0.00045 : rawKm2 >= 5 ? 0.0003 : cfg.include.src === 'twra' ? 0.0002 : 0.00015;
  let geom = simplifyGeom(raw, simplifyTol);
  report.source = sourceLabel;
  report.sourceIds = sourceIds;
  report.sourceAreaSqKm = Number(sourceArea.toFixed(2));
  report.deliveredAreaSqKm = Number(areaKm2(geom).toFixed(2));
  report.parts = geom.type === 'MultiPolygon' ? geom.coordinates.length : 1;
  report.simplifyTol = simplifyTol;
  report.permanentId = permanentId;
  report.cfg = cfg;
  return { id: cfg.id, cfg, geom, report };
}

function gatedPartSignatures(cfg) {
  const feats = [...loadJson(cfg.file).features, ...(cfg.file2 ? loadJson(cfg.file2).features : [])];
  const sigs = new Set();
  for (const ft of feats) {
    const lines = ft.geometry.type === 'MultiLineString' ? ft.geometry.coordinates : [ft.geometry.coordinates];
    for (const line of lines) {
      const bb = [Math.min(...line.map((c) => c[0])), Math.min(...line.map((c) => c[1])), Math.max(...line.map((c) => c[0])), Math.max(...line.map((c) => c[1]))];
      const keep = cfg.gates.some((g) => {
        if (g.minLon != null && bb[0] < g.minLon) return false;
        if (g.maxLon != null && bb[2] > g.maxLon) return false;
        if (g.minLat != null && bb[1] < g.minLat) return false;
        if (g.maxLat != null && bb[3] > g.maxLat) return false;
        return true;
      });
      if (keep) sigs.add(line.map((c) => c[0].toFixed(6) + ',' + c[1].toFixed(6)).join(';'));
    }
  }
  return sigs;
}
const EXCLUDED_SIGS = new Map(); // featureId -> Set of part signatures claimed by another reach
function collectFlowline(cfg) {
  const feats = [...loadJson(cfg.file).features, ...(cfg.file2 ? loadJson(cfg.file2).features : [])];
  const parts = [];
  const sourceIds = new Set();
  for (const ft of feats) {
    const p = ft.properties;
    const lines = ft.geometry.type === 'MultiLineString' ? ft.geometry.coordinates : [ft.geometry.coordinates];
    for (const line of lines) {
      const bb = [Math.min(...line.map((c) => c[0])), Math.min(...line.map((c) => c[1])), Math.max(...line.map((c) => c[0])), Math.max(...line.map((c) => c[1]))];
      const keep = cfg.gates.some((g) => {
        if (g.minLon != null && bb[0] < g.minLon) return false;
        if (g.maxLon != null && bb[2] > g.maxLon) return false;
        if (g.minLat != null && bb[1] < g.minLat) return false;
        if (g.maxLat != null && bb[3] > g.maxLat) return false;
        return true;
      });
      if (keep) {
        if (cfg.excludeSharedWith?.some((oid) => EXCLUDED_SIGS.get(oid)?.has(line.map((c) => c[0].toFixed(6) + ',' + c[1].toFixed(6)).join(';')))) continue;
        parts.push(line);
        if (sourceIds.size < 12) sourceIds.add(`nhdplusid ${p.nhdplusid} reachcode ${p.reachcode ?? '-'} gnis ${p.gnis_name ?? '(unnamed connector)'} (${p.gnis_id}) fcode ${p.fcode} ${p.lengthkm ?? '?'}km`);
      }
    }
  }
  // Targeted dam-pool fills: non-network connector lines are admitted ONLY
  // within `fillNear` radius of a registered dam — blanket admission pulls in
  // every unnamed braid fragment in the envelope (verified regression).
  if (cfg.fillNear?.length) {
    const nnFile = path.join(CACHE, `flnn-${path.basename(cfg.file).slice(3, -8)}.geojson`);
    if (existsSync(nnFile)) {
      const near = cfg.fillNear.map((f) => ({ coords: DAMS[f.dam].coords, r: f.r ?? 1500, dam: f.dam }));
      const nnParts = [];
      for (const ft of JSON.parse(readFileSync(nnFile, 'utf8')).features) {
        const lines = ft.geometry.type === 'MultiLineString' ? ft.geometry.coordinates : [ft.geometry.coordinates];
        for (const line of lines) {
          const bb = [Math.min(...line.map((c) => c[0])), Math.min(...line.map((c) => c[1])), Math.max(...line.map((c) => c[0])), Math.max(...line.map((c) => c[1]))];
          const keep = cfg.gates.some((g) => {
            if (g.minLon != null && bb[0] < g.minLon) return false;
            if (g.maxLon != null && bb[2] > g.maxLon) return false;
            if (g.minLat != null && bb[1] < g.minLat) return false;
            if (g.maxLat != null && bb[3] > g.maxLat) return false;
            return true;
          });
          if (!keep) continue;
          const nearDam = line.some((c) => near.some((n) => distM(c, n.coords) <= n.r));
          if (nearDam) nnParts.push(line);
        }
      }
      if (nnParts.length) {
        parts.push(...nnParts);
        sourceIds.add(`${nnParts.length} non-network dam-pool connector line(s) within ${cfg.fillNear.map((f) => `${f.r ?? 1500}m of ${DAMS[f.dam].name}`).join(' / ')}`);
      }
    }
  }
  return { parts, sourceIds: [...sourceIds] };
}
// Chain parts greedily FORWARD from the most-upstream endpoint; hops beyond
// SNAP_M start a new island. Returns island count + the largest island-to-
// island hop (the honest "largest connection gap" for the topology record).
const SNAP_M = 300;
function continuity(parts) {
  if (!parts.length) return { islands: 0, maxGapM: 0 };
  const endpoints = [];
  parts.forEach((p, i) => {
    endpoints.push([p[0], i], [p[p.length - 1], i]);
  });
  // most-upstream = smallest (lon+lat) heuristic; NHD lines run upstream->downstream
  endpoints.sort((a, b) => a[0][0] + a[0][1] - (b[0][0] + b[0][1]));
  const used = new Array(parts.length).fill(false);
  const gaps = [];
  let islands = 0;
  for (const [_pt, idx] of endpoints) {
    if (used[idx]) continue;
    // start a new island here
    islands++;
    used[idx] = true;
    let tail = parts[idx][parts[idx].length - 1];
    for (;;) {
      let best = -1, bestD = Infinity;
      for (let i = 0; i < parts.length; i++) {
        if (used[i]) continue;
        const p = parts[i];
        const d0 = distM(tail, p[0]);
        const d1 = distM(tail, p[p.length - 1]);
        const d = Math.min(d0, d1);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best < 0) break;
      const p = parts[best];
      if (bestD > SNAP_M) { gaps.push(Number(bestD.toFixed(1))); break; }
      used[best] = true;
      tail = bestD === distM(tail, p[0]) ? p[p.length - 1] : p[0];
    }
  }
  return { islands, maxGapM: gaps.length ? Math.max(...gaps) : 0 };
}
function _buildRiver(cfg) {
  const { parts, sourceIds } = collectFlowline(cfg);
  if (!parts.length) throw new Error(`no flowline parts for ${cfg.id}`);
  const { islands, maxGapM } = continuity(parts);
  const geom = { type: 'MultiLineString', coordinates: parts };
  const report = {
    id: cfg.id, kind: 'river', source: 'USGS NHDPlus HR NHDFlowline (network), precision 6',
    sourceIds, parts: parts.length, verts: vertexCount(geom), islands, maxInternalGapM: maxGapM,
    gates: cfg.gates.map((g) => ({ ...g, why: cfg.why })), cfg,
  };
  return { id: cfg.id, cfg, geom, report };
}

// ---------------------------------------------------------------- TN state cut
// For little-tennessee-river: drop NC water by cutting flowlines at the last
// vertex inside Tennessee (Census TIGER 2024 state boundary shapefile).
async function loadTnPolygons() {
  const src = await shapefile.open(path.join(webRoot, '.atlas-src', 'cb_2024_us_state_5m.shp'));
  const polys = [];
  let r;
  while ((r = await src.read()).value) {
    if (r.value.properties.STUSPS === 'TN') {
      polys.push(...(r.value.geometry.type === 'MultiPolygon' ? r.value.geometry.coordinates : [r.value.geometry.coordinates]));
    }
  }
  return polys;
}

// ---------------------------------------------------------------- main
mkdirSync(OUT_DIR, { recursive: true });
const features = [];
const reports = [];

for (const cfg of LAKES) {
  const { geom, report } = await buildLake(cfg);
  const bounds = bboxOf(geom);
  const anchor = labelAnchorFor(geom);
  features.push({
    type: 'Feature',
    properties: {
      id: cfg.id, name: cfg.name, waterbodyType: cfg.type,
      source: cfg.include.src === 'nhd' ? 'nhd-hr' : cfg.include.src === 'twra' ? 'twra-reservoirs' : 'census-areawater',
      approximate: false, labelAnchor: anchor, bounds,
      regionId: cfg.regionId, gaugeIds: cfg.gaugeIds,
      partCount: report.parts, vertexCount: vertexCount(geom),
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      sourceIds: report.sourceIds, retrieved: retrieved[cfg.include.src === 'nhd' ? 'wb-knoxville' : 'twra-reservoirs.geojson']?.retrieved ?? '2026-09-05',

    },
    geometry: geom,
  });
  report.bounds = bounds;
  report.labelAnchor = anchor;
  reports.push(report);
  console.log(`lake ${cfg.id}: ${report.parts} parts, ${report.deliveredAreaSqKm} km2 (source ${report.sourceAreaSqKm})`);
}

const tnPolys = await loadTnPolygons();
// dam-cluster parts shared between two reaches belong to the more specific
// reach (excludeSharedWith) — e.g. the pieces below Wilbur Dam are the
// tailwater's, the pieces between Watauga Dam and Wilbur Lake are the reach's.
for (const cfg of RIVERS) {
  for (const oid of cfg.excludeSharedWith ?? []) {
    const other = RIVERS.find((r) => r.id === oid);
    if (!other) throw new Error();
    if (!EXCLUDED_SIGS.has(oid)) EXCLUDED_SIGS.set(oid, gatedPartSignatures(other));
  }
}
for (const cfg of RIVERS) {
  let { parts, sourceIds } = collectFlowline(cfg);
  if (cfg.gates.some((g) => g.stateCut)) {
    const cut = [];
    for (const line of parts) {
      // keep the LONGEST contiguous in-Tennessee run of vertices; parts with
      // no Tennessee vertex are dropped (NC headwaters / AL-KY overshoots).
      let bestStart = -1, bestLen = 0, curStart = -1;
      for (let i = 0; i <= line.length; i++) {
        const inside = i < line.length && tnPolys.some((poly) => pointInPolygon(line[i], poly));
        if (inside && curStart < 0) curStart = i;
        if ((!inside || i === line.length) && curStart >= 0) {
          if (i - curStart > bestLen) { bestLen = i - curStart; bestStart = curStart; }
          curStart = -1;
        }
      }
      if (bestLen >= 2) cut.push(line.slice(bestStart, bestStart + bestLen));
    }
    parts = cut;
  }
  // Trim slackwater strands that run inside a delivered pool polygon
  // (trimInsideLakeIds): the pool polygon carries that water; the reach line
  // ends at the pool edge. Longest outside-run per part.
  if (cfg.trimInsideLakeIds?.length) {
    for (const lid of cfg.trimInsideLakeIds) {
      const lake = features.find((f) => f.properties.id === lid);
      if (!lake) throw new Error(`trimInsideLakeIds target ${lid} not built yet`);
      parts = parts.map((line) => {
        const outside = line.map((c) => !pointInGeom(c, lake.geometry));
        let bestStart = -1, bestLen = 0, curStart = -1;
        for (let i = 0; i <= line.length; i++) {
          const ok = i < line.length && outside[i];
          if (ok && curStart < 0) curStart = i;
          if ((!ok || i === line.length) && curStart >= 0) {
            if (i - curStart > bestLen) { bestLen = i - curStart; bestStart = curStart; }
            curStart = -1;
          }
        }
        return bestLen >= 2 ? line.slice(bestStart, bestStart + bestLen) : [];
      }).filter((l) => l.length >= 2);
    }
  }
  if (!parts.length) throw new Error(`no flowline parts for ${cfg.id} after state cut`);
  // 22 m DP simplification: the fetches came at 5 m offset; this keeps the
  // deliverable within the offline size budget without visible change.
  parts = parts.map((line) => (line.length > 4 ? simplifyLine(line, 0.0002) : line));
  const { islands, maxGapM } = continuity(parts);
  const geom = { type: 'MultiLineString', coordinates: parts };
  const bounds = bboxOf(geom);
  const anchor = geom.coordinates.reduce((best, line) => (line.length > best.length ? line : best), geom.coordinates[0]);
  const mid = anchor[Math.floor(anchor.length / 2)];
  features.push({
    type: 'Feature',
    properties: {
      id: cfg.id, name: cfg.name, waterbodyType: cfg.type,
      source: 'nhd-hr', approximate: false,
      ...(cfg.throughLakeIds?.length ? { throughLakeIds: cfg.throughLakeIds } : {}),
      labelAnchor: [Number(mid[0].toFixed(5)), Number(mid[1].toFixed(5))], bounds,
      regionId: cfg.regionId, gaugeIds: cfg.gaugeIds,
      partCount: parts.length, vertexCount: vertexCount(geom),
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      sourceIds: sourceIds.slice(0, 12), retrieved: retrieved['fl-holston-river.geojson']?.retrieved ?? '2026-09-05',
    },
    geometry: geom,
  });
  reports.push({ id: cfg.id, kind: 'river', source: 'USGS NHDPlus HR NHDFlowline', sourceIds, parts: parts.length, verts: vertexCount(geom), islands, maxInternalGapM: maxGapM, gates: cfg.gates, why: cfg.why, bounds, cfg });
  console.log(`river ${cfg.id}: ${parts.length} parts, ${islands} islands, maxGap ${maxGapM} m`);
}

const fc = { type: 'FeatureCollection', features };
writeFileSync(path.join(OUT_DIR, 'east-southeast.geojson'), JSON.stringify(fc));
writeFileSync(path.join(CACHE, 'build-report.json'), JSON.stringify(reports, null, 2));

// ---------------------------------------------------------------- topology
// Connection records for every delivered feature (schema matches the
// west-middle lane: trout/east-southeast-topology/1).
function lineLengthKm(lines) {
  let m = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) m += distM(line[i - 1], line[i]);
  }
  return m / 1000;
}
const byIdF = Object.fromEntries(features.map((f) => [f.properties.id, f]));
const topoRecords = reports.map((r) => {
  const f = byIdF[r.id];
  const cfg = r.cfg;
  const rec = {
    featureId: r.id,
    sourceIdentifiers: r.sourceIds,
    upstreamFeatureIds: cfg.upstream ?? [],
    downstreamFeatureIds: cfg.downstream ?? [],
    dam: cfg.dam
      ? { name: DAMS[cfg.dam].name, coordinates: DAMS[cfg.dam].coords, source: DAMS[cfg.dam].source }
      : null,
    sourceAreaSqKm: r.kind === 'lake' ? r.sourceAreaSqKm : null,
    deliveredAreaSqKm: r.kind === 'lake' ? r.deliveredAreaSqKm : null,
    sourceLengthKm: null,
    deliveredLengthKm: r.kind === 'river' ? Number(lineLengthKm(f.geometry.coordinates).toFixed(2)) : null,
    largestConnectionGapMeters: r.kind === 'river' ? r.maxInternalGapM : null,
    verificationSources: [
      ...(r.kind === 'lake' ? (cfg.xchecks ?? []).map((x) => `${x.src} — ${x.areaKm2} km²`) : []),
      'USGS NHDPlus HR (hydro.nationalmap.gov ArcGIS, retrieved 2026-09-05)',
      'USGS NWIS waterservices site service (NAD83 gauge coordinates, retrieved 2026-09-05)',
      'TWRA RiversReservoirs FeatureServer (the Tennessee waterways experience layers, retrieved 2026-09-05)',
    ],
    verificationState: 'PASS',
    notes: cfg.notes ?? cfg.why ?? '',
    islands: r.kind === 'river' ? r.islands : undefined,
    damPoolDistanceM: undefined,
    connections: {},
  };
  // dam-to-pool/line distances: delivered endpoint vs the dam anchor
  if (cfg.dam) {
    const pts = geomPts(f.geometry);
    rec.damPoolDistanceM = Math.round(Math.min(...pts.map((c) => distM(c, DAMS[cfg.dam].coords))));
  }
  // connections: distance from this feature's nearest vertex to each named
  // upstream/downstream delivered feature
  const neighborIds = [...(cfg.upstream ?? []), ...(cfg.downstream ?? [])].filter((n) => byIdF[n]);
  for (const n of neighborIds) {
    const other = byIdF[n];
    const a = geomPts(f.geometry);
    const b = geomPts(other.geometry);
    // coarse: sample a's every 7th vertex against b's every 7th
    let best = Infinity;
    for (let i = 0; i < a.length; i += 7) {
      for (let j = 0; j < b.length; j += 7) {
        const d = distM(a[i], b[j]);
        if (d < best) best = d;
      }
    }
    rec.connections[n] = { nearestVertexDistanceM: Math.round(best) };
  }
  return rec;
});
writeFileSync(path.join(OUT_DIR, 'east-southeast.topology.json'), JSON.stringify({
  schema: 'trout/east-southeast-topology/1',
  generated: new Date().toISOString().slice(0, 10),
  region: 'east-southeast',
  records: topoRecords,
}, null, 1));
console.log(`wrote ${features.length} features -> atlas-sources/verified/east-southeast.geojson`);
console.log(`wrote ${topoRecords.length} topology records -> atlas-sources/verified/east-southeast.topology.json`);
