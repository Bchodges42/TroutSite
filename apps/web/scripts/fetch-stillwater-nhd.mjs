#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * STILLWATER lane tooling — NHD waterbody polygons for still waters
 * (lakes / ponds / reservoirs).
 *
 * Source: USGS NHDPlus HR MapServer (hydro.nationalmap.gov), layer 9
 * NHDWaterbody + layer 8 NHDArea. Public domain (USGS). Baked to static
 * files — zero runtime requests. Same access pattern as
 * fetch-nhd-targets.mjs (flowlines), polygon layers instead.
 *
 * Modes:
 *   node scripts/fetch-stillwater-nhd.mjs scout [id,...]
 *       Coverage probe: what NHD polygons exist around each target anchor
 *       (the 13 twra-winter-ponds points). Writes raw responses to
 *       .atlas-src/stillwater/scout/<id>.json and prints a per-water table.
 *       No repo files changed.
 *
 *   node scripts/fetch-stillwater-nhd.mjs extract [id,...]
 *       Emit per-water MapLibre-ready GeoJSON (contract shape: properties
 *       id/name/waterbodyType/species/source/approximate/labelAnchor/bounds,
 *       MultiPolygon geometry, visual-centroid label anchor, TN-clipped) to
 *       apps/web/public/atlas/stillwater/<id>.geojson.
 *
 * Polygon selection: named match (gnis_name LIKE) when the target declares
 * nameLike, else the polygon containing the anchor point; fallback = nearest
 * polygon within the envelope above an area floor (marked approximate).
 * No new dependencies — ray-casting point-in-polygon, area-weighted visual
 * centroid, sequential decimation, and a segment-intersection clip against
 * the TN boundary ring (apps/web/public/atlas/tn-boundary.geojson).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '../..');
const SCOUT_DIR = join(webRoot, '.atlas-src', 'stillwater', 'scout');
const OUT_DIR = join(webRoot, '.atlas-src', 'stillwater', 'extract');
const PONDS_JSON = join(repoRoot, 'packages', 'content', 'data', 'west-tn-ponds.json');
const TN_BOUNDARY = join(webRoot, 'public', 'atlas', 'tn-boundary.geojson');

const MODE = process.argv[2] ?? 'scout';
const only = new Set(process.argv.slice(3).flatMap((a) => a.split(',')).filter(Boolean));

// Service limits: keep envelopes small (huge envelopes 504'd the flowline
// fetches before). Approx-town anchors get a wider envelope because the
// anchor sits at the town centroid, not on the water.
const SERVICE = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const LAYER = { waterbody: 9, area: 8 };
const SLEEP = 2000;
// Still-water FCodes: 390xx Lake/Pond family, 436xx Reservoir family.
// (369xx Swamp/Marsh and 460xx Stream/River areas are NOT still water and
// are excluded even when they appear in NHDArea.)
const FCODE_WHERE = '(fcode BETWEEN 39000 AND 39099 OR fcode BETWEEN 43600 AND 43699)';

/**
 * Scout/extract targets. env = [minLon, minLat, maxLon, maxLat] search
 * envelope; nameLike = preferred GNIS name tokens (% wildcards); areaFloor
 * = minimum polygon size (km²) for the unnamed nearest-fallback.
 */
const TARGETS = [
  // Identity-verified NHD picks. Durable provenance is carried by the pinned ids
  // below and the verified topology records in apps/web/atlas-sources/verified/.
  //  - pick / pickPoint: deterministic polygon selection (nhdplusid, or
  //    containment of a verified point from OSM/Wikipedia/TWRA research).
  //  - mao: maxAllowableOffset for the geometry fetch.
  { id: 'beech-lake', name: 'Beech Lake', env: [-88.503, 35.635, -88.353, 35.735], nameLike: '%Beech%', mao: 0.0003 },
  // NHD never names Lake Graham; nhdplusid verified by Wikipedia point
  // 35.6325,-88.72139 (dam on Brown's Creek, TWRA state fishing lake).
  { id: 'lake-graham', name: 'Lake Graham', env: [-88.945, 35.554, -88.725, 35.674], pick: ['20000700115945'], mao: 0.0003 },
  // Edmund-Orgill Park lake = NHD "Casper Lake" (park centerpiece, 67 acres),
  // NHD polygon contains the OSM park-lake center.
  { id: 'edmund-orgill-lake', name: 'Edmund-Orgill Park Lake', env: [-89.863, 35.352, -89.803, 35.392], nameLike: '%Casper%', mao: 0.0002 },
  // Martin City Park pond: NHD polygon bbox contains the OSM pond center.
  { id: 'martin-city-pond', name: 'Martin City Pond', env: [-88.869, 36.300, -88.829, 36.320], pick: ['20000700143255'], mao: 0.00015 },
  // TWRA "Paris City Park": NHD names this water Green Acres Lake (aka
  // Williams Lake), the city-run public fishing lake ~850 m from the historic
  // anchor; the pinned NHD id makes the selection deterministic.
  { id: 'paris-city-park-lake', name: 'Paris City Park Lake', env: [-88.330, 36.295, -88.290, 36.325], pick: ['25000102170314'], mao: 0 },
  // Valentine Regional Park pond: NHD polygon 80 m from the OSM pond center.
  { id: 'valentine-park-pond', name: 'Valentine Park Pond', env: [-89.821, 35.454, -89.781, 35.474], pick: ['20000700138219'], mao: 0.00015 },
  // Pickwick Lake (inventory missing-polygon): named NHD reservoir; envelope
  // spans the whole reservoir (Wilson Dam AL → Pickwick Landing Dam TN);
  // TN clip keeps only in-state parts.
  { id: 'pickwick-lake', name: 'Pickwick Lake', env: [-88.55, 34.75, -87.55, 35.2], nameLike: '%Pickwick%', mao: 0.0005, waterbodyType: 'reservoir', regionId: 'tn-west' },
  // Corrected Johnson Park Lake envelope: TWRA site is W.C. Johnson Park,
  // Collierville (419 Johnson Park Dr) — the repo's approx-town anchor sits
  // at downtown Memphis and is ~20 km off; the polygon will supply the real
  // label anchor.
  { id: 'johnson-park-lake', name: 'Johnson Park Lake', env: [-89.6852, 35.0775, -89.6652, 35.0975], areaFloor: 0.002 },
  // Scout-only fallbacks (identity still being verified; extract only with a
  // verified pick):
  { id: 'shelby-farms-lake', name: 'Shelby Farms Lake', env: [-89.863, 35.116, -89.803, 35.156], areaFloor: 0.002 },
  { id: 'cameron-brown-lake', name: 'Cameron Brown Lake', env: [-89.792, 35.091, -89.752, 35.111], areaFloor: 0.002 },
  { id: 'yale-road-park-lake', name: 'Yale Road Park Lake', env: [-89.877, 35.207, -89.837, 35.227], areaFloor: 0.002 },
  { id: 'milan-city-pond', name: 'Milan City Pond', env: [-88.750, 35.912, -88.710, 35.932], areaFloor: 0.002 },
  { id: 'covington-fbc-pond', name: 'Covington First Baptist Church Pond', env: [-89.709, 35.526, -89.589, 35.586], areaFloor: 0.001 },
  { id: 'union-city-reelfoot-pond', name: 'Union City Reelfoot Packing Site Pond', env: [-89.115, 36.396, -88.995, 36.456], areaFloor: 0.001 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(layer, params, tries = 4) {
  const body = new URLSearchParams(params);
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${SERVICE}/${layer}/query`, {
        method: 'POST', body, signal: AbortSignal.timeout(120000),
      });
      const text = await res.text();
      if (res.ok && (text.startsWith('{') || text.startsWith(' '))) return JSON.parse(text);
      console.log(`  retry ${i + 1}: http ${res.status} ${text.slice(0, 80)}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 100)}`);
    }
    await sleep(5000);
  }
  throw new Error(`layer ${layer} query failed after retries`);
}

/** All still-water polygons (waterbody + area layers) intersecting an envelope. */
async function fetchStillwater(env, mao = 0.0001, nameLike = null) {
  const geometry = { xmin: env[0], ymin: env[1], xmax: env[2], ymax: env[3] };
  const where = nameLike
    ? `(${FCODE_WHERE}) AND gnis_name LIKE '${nameLike}'`
    : FCODE_WHERE;
  const base = {
    where,
    geometry: JSON.stringify(geometry), geometryType: 'esriGeometryEnvelope', inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects', outFields:
      'gnis_name,gnis_id,nhdplusid,reachcode,fcode,ftype,areasqkm',
    returnGeometry: 'true', geometryPrecision: '6', maxAllowableOffset: String(mao),
    outSR: '4326', returnExceededLimitFeatures: 'true', f: 'geojson', resultRecordCount: '2000',
  };
  const out = [];
  for (const [kind, layer] of Object.entries(LAYER)) {
    const j = await post(layer, base);
    for (const f of j.features ?? []) out.push({ kind, ...f, properties: { kind, ...f.properties } });
    if (j.exceededTransferLimit) console.log(`  WARN: ${kind} exceededTransferLimit — widen pagination`);
    await sleep(SLEEP);
  }
  return out;
}

// ---------- geometry helpers (no dependencies) ----------

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInGeometry(x, y, geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  return polys.some((rings) => pointInRing(x, y, rings[0]) && !rings.slice(1).some((h) => pointInRing(x, y, h)));
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2; // signed; CCW positive in lon/lat at this scale
}

function geometryParts(geom) {
  // normalized: [{ rings: [outer, ...holes] }]
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}

function bboxOf(geometry) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const rings of geometryParts(geometry)) {
    for (const ring of rings) for (const [x, y] of ring) {
      if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y;
      if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
    }
  }
  return b;
}

/** Distance from point to a bbox (0 if inside). */
function distToBbox([x, y], b) {
  const dx = Math.max(b[0] - x, 0, x - b[2]);
  const dy = Math.max(b[1] - y, 0, y - b[3]);
  return Math.hypot(dx, dy);
}

/**
 * Visual centroid: area-weighted centroid of the largest outer ring; if the
 * result falls outside the polygon (strongly concave / C shapes), fall back
 * to the interior vertex nearest the centroid.
 */
function visualCentroid(geometry) {
  let best = null, bestAbs = 0;
  for (const [outer] of geometryParts(geometry).map((r) => r)) {
    const a = Math.abs(ringArea(outer));
    if (a > bestAbs) { bestAbs = a; best = outer; }
  }
  if (!best || best.length < 3) return null;
  let cx = 0, cy = 0;
  for (let i = 0; i < best.length - 1; i++) {
    const [x1, y1] = best[i], [x2, y2] = best[i + 1];
    const cross = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * cross; cy += (y1 + y2) * cross;
  }
  const a6 = ringArea(best);
  cx /= 6 * a6; cy /= 6 * a6;
  if (pointInGeometry(cx, cy, geometry)) return [cx, cy];
  let bestV = null, bestD = Infinity;
  for (const [x, y] of best) {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d < bestD) { bestD = d; bestV = [x, y]; }
  }
  return bestV;
}

/** Sequential decimation + rounding + ring closure (same style as build-lakes). */
function decimate(ring, minDelta = 0.0002) {
  const out = [];
  let last = null;
  for (const pt of ring) {
    if (!last || Math.abs(pt[0] - last[0]) >= minDelta || Math.abs(pt[1] - last[1]) >= minDelta) {
      out.push([Math.round(pt[0] * 1e5) / 1e5, Math.round(pt[1] * 1e5) / 1e5]);
      last = pt;
    }
  }
  if (out.length < 3) return [];
  const [fx, fy] = out[0];
  const [lx, ly] = out[out.length - 1];
  if (fx !== lx || fy !== ly) out.push([fx, fy]);
  return out;
}

// ---------- TN clip ----------

let tnRingCache = null;
function tnRing() {
  if (tnRingCache) return tnRingCache;
  const fc = JSON.parse(readFileSync(TN_BOUNDARY, 'utf8'));
  const coords = fc.features[0].geometry.type === 'Polygon'
    ? fc.features[0].geometry.coordinates[0]
    : fc.features[0].geometry.coordinates[0][0];
  tnRingCache = coords;
  return coords;
}

function segIntersect(p1, p2, p3, p4) {
  const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
  if (Math.abs(d) < 1e-15) return null;
  const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
  const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  return null;
}

/**
 * Clip one ring to the TN boundary: keep inside vertices; where consecutive
 * vertices straddle the boundary, splice in the boundary crossing. Brute
 * force against the 1,689-pt state ring — fine at build time, and only
 * engages for polygons that actually touch the state line.
 */
function clipRingToTN(ring) {
  const R = tnRing();
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1];
    const aIn = pointInRing(a[0], a[1], R);
    if (aIn) out.push(a);
    if (aIn !== pointInRing(b[0], b[1], R)) {
      for (let k = 0; k < R.length - 1; k++) {
        const hit = segIntersect(a, b, R[k], R[k + 1]);
        if (hit) { out.push([Math.round(hit[0] * 1e5) / 1e5, Math.round(hit[1] * 1e5) / 1e5]); break; }
      }
    }
  }
  if (out.length < 3) return [];
  const [fx, fy] = out[0];
  const [lx, ly] = out[out.length - 1];
  if (fx !== lx || fy !== ly) out.push([fx, fy]);
  return out;
}

/** Clip a geometry to Tennessee; drops parts fully outside. Returns null if nothing remains. */
function clipToTN(geometry) {
  const parts = geometryParts(geometry).map((rings) => {
    const outer = clipRingToTN(rings[0]);
    if (outer.length < 4) return null;
    const holes = rings.slice(1).map(clipRingToTN).filter((r) => r.length >= 4);
    return [outer, ...holes];
  }).filter(Boolean);
  if (!parts.length) return null;
  return { type: 'MultiPolygon', coordinates: parts };
}

// ---------- selection + emit ----------

function countVerts(geometry) {
  let n = 0;
  for (const rings of geometryParts(geometry)) for (const r of rings) n += r.length;
  return n;
}

/** Uniform thinning to a vertex cap (keeps ring closure). */
function thinGeometry(geometry, cap) {
  let total = countVerts(geometry);
  if (total <= cap) return geometry;
  const stride = Math.ceil(total / cap);
  const coords = geometryParts(geometry).map((rings) => rings.map((ring) => {
    const t = ring.filter((_, i) => i % stride === 0 || i === ring.length - 1);
    if (t.length >= 4) { const [fx, fy] = t[0]; const [lx, ly] = t[t.length - 1]; if (fx !== lx || fy !== ly) t.push([fx, fy]); }
    return t;
  })).map((rings) => rings.filter((r) => r.length >= 4));
  return { type: 'MultiPolygon', coordinates: coords.filter((r) => r.length) };
}

function nameMatches(gnisName, like) {
  if (!like || gnisName == null) return false;
  const rx = new RegExp('^' + like.split('%').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i');
  return rx.test(String(gnisName));
}

/**
 * Pick the NHD polygon(s) representing a target water.
 * Resolution order: explicit nhdplusid `pick` → `pickPoint` containment →
 * nameLike match → anchor containment → nearest above areaFloor (approximate).
 * Returns { features, how, approximate }.
 */
function selectWater(target, anchor, feats) {
  if (target.pick?.length) {
    const picked = feats.filter((f) => target.pick.includes(String(f.properties.nhdplusid)));
    if (picked.length) return { features: picked, how: 'nhd-pick', approximate: false };
  }
  if (target.pickPoint) {
    const [px, py] = target.pickPoint;
    const containing = feats.filter((f) => pointInGeometry(px, py, f.geometry));
    if (containing.length) return { features: containing, how: 'nhd-pick-point', approximate: false };
  }
  const named = feats.filter((f) => nameMatches(f.properties.gnis_name, target.nameLike));
  if (named.length) {
    // keep the largest as canonical, plus any disjoint same-named parts near it
    named.sort((a, b) => (b.properties.areasqkm ?? 0) - (a.properties.areasqkm ?? 0));
    return { features: named, how: 'nhd-named', approximate: false };
  }
  const containing = feats.filter((f) => pointInGeometry(anchor[0], anchor[1], f.geometry));
  if (containing.length) {
    containing.sort((a, b) => (b.properties.areasqkm ?? 0) - (a.properties.areasqkm ?? 0));
    return { features: containing, how: 'nhd-contains-anchor', approximate: false };
  }
  const floor = target.areaFloor ?? 0.002;
  if (!anchor) return { features: [], how: 'none', approximate: false };
  const near = feats
    .map((f) => ({ f, d: distToBbox(anchor, bboxOf(f.geometry)) }))
    .filter(({ f, d }) => d <= Math.max(0.02, (target.env[2] - target.env[0]) / 3) && (f.properties.areasqkm ?? 0) >= floor)
    .sort((a, b) => a.d - b.d);
  if (near.length) return { features: [near[0].f], how: 'nhd-nearest', approximate: true };
  return { features: [], how: 'none', approximate: false };
}

function mergeFeatures(features) {
  // MultiPolygon of all selected parts (usually 1; NHD splits big lakes rarely)
  const coords = [];
  for (const f of features) {
    for (const rings of geometryParts(f.geometry)) coords.push(rings);
  }
  return { type: 'MultiPolygon', coordinates: coords };
}

function waterbodyTypeFor(properties, target) {
  const fc = properties?.fcode ?? 0;
  if (fc >= 43600 && fc < 43700) return 'reservoir';
  return target.pondFallback ?? 'lake';
}

function rounded(v) { return Math.round(v * 1e5) / 1e5; }

function emitFeature(target, chosen, { _how, approximate }) {
  const merged = thinGeometry(mergeFeatures(chosen), 3000);
  const clipped = clipToTN(merged) ?? merged; // TN clip never empties these targets; keep guard anyway
  const coords = clipped.coordinates
    .map((rings) => rings.map((ring, i) => decimate(ring, i === 0 ? 0.0002 : 0.0002)).filter((r) => r.length >= 4))
    .filter((rings) => rings.length);
  const geometry = { type: 'MultiPolygon', coordinates: coords };
  const b = bboxOf(geometry);
  const fcMain = chosen[0].properties;
  const labelAnchor = visualCentroid(geometry);
  const partCount = coords.length;
  const vertexCount = countVerts(geometry);
  return {
    type: 'Feature',
    properties: {
      id: target.id,
      name: target.name,
      waterbodyType: target.waterbodyType ?? waterbodyTypeFor(fcMain, target),
      source: ['nhd-hr', ...((target.extraSource ?? []))].join(' '),
      // geometry certainty only — anchor-certainty (approx-town vs osm) is a
      // property of the old Point anchors, not of the authoritative polygon
      approximate: approximate,
      regionId: target.regionId ?? 'tn-west',
      labelAnchor: labelAnchor ? [rounded(labelAnchor[0]), rounded(labelAnchor[1])] : null,
      bounds: [rounded(b[0]), rounded(b[1]), rounded(b[2]), rounded(b[3])],
      partCount,
      vertexCount,
      crs: 'EPSG:4326',
      coordinateOrder: 'longitude,latitude',
    },
    geometry,
  };
}

// ---------- modes ----------

function targetsFromPonds() {
  const ponds = JSON.parse(readFileSync(PONDS_JSON, 'utf8')).features;
  const byId = new Map(ponds.map((p) => [p.id, p]));
  return TARGETS.map((t) => {
    const p = byId.get(t.id);
    const base = {
      ...t,
      name: t.name,
      anchor: p ? [p.lon, p.lat] : null,
      regionId: t.regionId ?? 'tn-west',
      extraSource: p ? ['twra-winter-ponds'] : [],
      approximate: p ? p.coordinateCertainty === 'approx-town-anchor' : false,
    };
    // Legacy winter-water metadata the UI fiche reads today — retained so the
    // polygon features are a drop-in replacement for the Point anchors.
    if (p) {
      base.stockingProgram = true;
      base.species = 'trout';
      base.notes = p.note;
      base.county = p.county;
      base.town = p.town;
    }
    return base;
  });
}

async function main() {
  const targets = targetsFromPonds().filter((t) => !only.size || only.has(t.id));
  if (!targets.length) { console.log('no targets matched'); return; }
  mkdirSync(SCOUT_DIR, { recursive: true });

  const rows = [];
  for (const t of targets) {
    console.log(`== ${t.id} (${t.name}) env=${t.env.join(',')}`);
    let feats = [];
    try {
      feats = await fetchStillwater(t.env, t.mao ?? 0.0001, t.nameLike ?? null);
    } catch (e) {
      console.log(`  FETCH FAILED: ${e.message}`);
      rows.push({ id: t.id, name: t.name, nhd: 'error', detail: e.message });
      continue;
    }
    writeFileSync(join(SCOUT_DIR, `${t.id}.json`), JSON.stringify({ target: { ...t, anchor: t.anchor }, features: feats }, null, 1));
    const chosen = selectWater(t, t.anchor, feats);
    const verified = ['nhd-pick', 'nhd-pick-point', 'nhd-named'].includes(chosen.how);
    for (const f of feats.slice(0, 25)) {
      const p = f.properties;
      const bb = bboxOf(f.geometry);
      const d = t.anchor ? distToBbox(t.anchor, bb) : null;
      console.log(`  ${f.kind} nhdplusid=${p.nhdplusid} name=${JSON.stringify(p.gnis_name)} fcode=${p.fcode} km2=${(p.areasqkm ?? 0).toFixed(4)} dist=${d == null ? 'n/a' : (d * 111320).toFixed(0) + 'm'} ${t.anchor && pointInGeometry(t.anchor[0], t.anchor[1], f.geometry) ? 'CONTAINS-ANCHOR' : ''}${nameMatches(p.gnis_name, t.nameLike) ? ' NAME-MATCH' : ''} verts=${countVerts(f.geometry)}`);
    }
    if (feats.length > 25) console.log(`  … +${feats.length - 25} more`);
    rows.push({
      id: t.id, name: t.name,
      nhd: chosen.features.length
        ? (chosen.how === 'nhd-named' || chosen.how === 'nhd-contains-anchor' ? 'yes' : 'nearest-approx')
        : 'no',
      how: chosen.how,
      picked: chosen.features.map((f) => `${f.properties.gnis_name ?? '(unnamed)'} fcode=${f.properties.fcode} ${f.properties.areasqkm?.toFixed(4)}km2`),
      polygonsInEnv: feats.length,
    });
    if (MODE === 'extract') {
      if (!chosen.features.length || !verified) {
        console.log(`  SKIP extract (selection ${chosen.how} is not identity-verified — trace or re-scout first)`);
      } else {
        const feature = emitFeature(t, chosen.features, chosen);
        mkdirSync(OUT_DIR, { recursive: true });
        const outPath = join(OUT_DIR, `${t.id}.geojson`);
        writeFileSync(outPath, `${JSON.stringify(feature)}\n`);
        console.log(`  emitted ${outPath} verts=${countVerts(feature.geometry)} bounds=${feature.properties.bounds.join(',')} labelAnchor=${feature.properties.labelAnchor}`);
      }
    }
    await sleep(SLEEP);
  }
  console.log('\n=== coverage summary ===');
  for (const r of rows) console.log(JSON.stringify(r));
  if (existsSync(join(SCOUT_DIR, 'summary.json'))) {
    // merge into running summary
    const prev = JSON.parse(readFileSync(join(SCOUT_DIR, 'summary.json'), 'utf8'));
    for (const r of rows) prev[r.id] = r;
    writeFileSync(join(SCOUT_DIR, 'summary.json'), JSON.stringify(prev, null, 1));
  } else {
    writeFileSync(join(SCOUT_DIR, 'summary.json'), JSON.stringify(Object.fromEntries(rows.map((r) => [r.id, r])), null, 1));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
