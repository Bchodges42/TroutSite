/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * integrate-verified-atlas.mjs — deterministic merge of VERIFIED regional
 * waterbody geometry into the canonical atlas.
 *
 * Staging inputs (produced by independent regional sessions — never edited here):
 *   apps/web/atlas-sources/verified/west-middle.geojson
 *   apps/web/atlas-sources/verified/east-southeast.geojson
 *   (+ the matching .topology.json files, read for the provenance disclosure)
 *
 * Behavior:
 *   • Consumes either, both, or neither staging file. With neither it prints
 *     and exits 0 without touching canonical files.
 *   • Replaces canonical features BY STABLE ID — it never appends a second
 *     feature with an id that already exists.
 *   • Rejects duplicate ids within a staging file, across staging files, and
 *     against a feature already merged in the same run.
 *   • Validates metadata, geometry, coordinate order, bounds, label anchors,
 *     polygon area / line length (against staged source metrics when present),
 *     authoritative identifiers (NHD Permanent_Identifier / GNIS), line
 *     endpoints, river↔lake intersections, and dam alignment — accuracy is
 *     judged by TOPOLOGY, not merely by "is valid GeoJSON".
 *   • Drops the passive twin from lakes.geojson when a staged lake replaces a
 *     lake that also renders there, so an interactive lake can never paint
 *     twice.
 *   • Regenerates riverIndex.json with the same derivation as
 *     regenerate-river-index.mjs.
 *   • Emits public/atlas/provenance.json (trout/atlas-provenance/1) from the
 *     staging topology records — the public provenance disclosure surface
 *     (review M3: internal geometry evidence lives here, never in angler
 *     catalog copy). Coverage is gated: every canonical water gets exactly one
 *     verified/carried/legacy record; PASS requires >= 2 verificationSources;
 *     seams over 1 km must be documented; lengthRatio must match delivered/source.
 *   • Prints before/after feature counts and every replaced/appended id.
 *   • Exits non-zero on any contract violation; `--dry-run` validates and
 *     reports without writing.
 *
 * Usage (post-merge command, run from the repo root):
 *   node apps/web/scripts/integrate-verified-atlas.mjs [--dry-run]
 *
 * Requires the built content pack for catalog identity checks:
 *   pnpm --filter @trout/content build
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');

const STAGING_FILES = [
  'apps/web/atlas-sources/verified/west-middle.geojson',
  'apps/web/atlas-sources/verified/east-southeast.geojson',
].map((rel) => ({ rel, path: join(repoRoot, rel) }));

const TOPOLOGY_FILES = [
  'apps/web/atlas-sources/verified/west-middle.topology.json',
  'apps/web/atlas-sources/verified/east-southeast.topology.json',
].map((rel) => ({ rel, region: rel.match(/([a-z-]+)\.topology\.json$/)?.[1], path: join(repoRoot, rel) }));

const RIVERS_PATH = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const LAKES_PATH = join(webRoot, 'public', 'atlas', 'lakes.geojson');
const PROVENANCE_PATH = join(webRoot, 'public', 'atlas', 'provenance.json');
const TN_BOUNDARY_PATH = join(webRoot, 'public', 'atlas', 'tn-boundary.geojson');
const INDEX_PATH = join(webRoot, 'src', 'features', 'map', 'riverIndex.json');
const PACK_PATH = join(repoRoot, 'packages', 'content', 'dist', 'pack', 'streams.json');

/** Staged waterbody classes and the geometry each may carry. */
const LINE_TYPES = ['LineString', 'MultiLineString'];
const POLY_TYPES = ['Polygon', 'MultiPolygon'];
const POINT_TYPES = ['Point', 'MultiPoint'];
const LINE_CLASSES = new Set(['river', 'creek', 'tailrace', 'spring']);
const STILL_CLASSES = new Set(['lake', 'pond']);
const ALLOWED_WB_TYPES = new Set([...LINE_CLASSES, ...STILL_CLASSES]);

/** Tolerances (meters). Verification-grade geometry still meets real-world tolerance. */
const M = {
  endpoint: 60, // endpoint-to-something proximity that "explains" an endpoint
  boundaryBuffer: 3_000, // TN boundary buffer used by the topo/asset pipelines
  anchorOnLine: 250, // label anchor may hang this far off its line
  damOnShore: 150, // a declared dam anchor must sit this close to its lake edge
  tailwaterAtDam: 250, // a declared tailwater must start this close to the dam
  areaMinM2: 500, // below this a polygon is a sliver, not a waterbody
  lengthMinM: 50, // below this a line is a fragment, not a reach
  sourceRatioLow: 0.75, // computed < 75% of sourceArea/Length = unexpected loss
  sourceRatioHigh: 1.5, // computed > 150% of sourceArea/Length = unexpected gain
  canonicalLossWarn: 0.6, // warn when replacing loses >60% of canonical size
};

class Violations {
  constructor() {
    this.list = [];
    this.warnings = [];
  }
  add(id, message) {
    this.list.push({ id, message });
  }
  warn(id, message) {
    this.warnings.push({ id, message });
  }
}

// ── geometry primitives (dependency-free; planar degree math with a cosine
//    latitude correction — accurate to ~0.2% at Tennessee latitudes) ──────────
const R_EARTH = 6_371_000;
function metersPerDegree(lat) {
  const rad = (lat * Math.PI) / 180;
  return { lat: 111_132.92 - 559.82 * Math.cos(2 * rad) + 1.175 * Math.cos(4 * rad), lon: 111_412.84 * Math.cos(rad) };
}
export function distM(a, b) {
  const mid = { lat: (a[1] + b[1]) / 2 };
  const m = metersPerDegree(mid.lat);
  const dx = (a[0] - b[0]) * m.lon;
  const dy = (a[1] - b[1]) * m.lat;
  return Math.hypot(dx, dy);
}
function ringAreaM2(ring) {
  if (ring.length < 4) return 0;
  const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const m = metersPerDegree(lat);
  let twice = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    twice += ring[i][0] * m.lon * ring[i + 1][1] * m.lat - ring[i + 1][0] * m.lon * ring[i][1] * m.lat;
  }
  return Math.abs(twice) / 2;
}
export function geometryAreaM2(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  return polys.reduce((sum, poly) => sum + ringAreaM2(poly[0]), 0);
}
export function lineLengthM(lines) {
  let total = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) total += distM(line[i - 1], line[i]);
  }
  return total;
}
function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if (!Array.isArray(ring[i]) || !Array.isArray(ring[j])) continue;
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
export function pointInGeometry(point, geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  return polys.some((rings) => pointInRing(point, rings[0]));
}
export function pointNearRings(point, geom, toleranceM) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  for (const rings of polys) for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) if (distM(point, ring[i]) <= toleranceM) return true;
  }
  return false;
}
export function flattenLines(geom) {
  if (geom.type === 'LineString') return [geom.coordinates];
  if (geom.type === 'MultiLineString') return geom.coordinates;
  return [];
}
function flattenPoints(geom) {
  if (geom.type === 'Point') return [geom.coordinates];
  if (geom.type === 'MultiPoint') return geom.coordinates;
  return [];
}
/** Strict GeoJSON nesting: does coordinates[] actually match the declared type? */
export function geometryDepthMatches(type, coordinates) {
  const isPos = (a) => Array.isArray(a) && a.length >= 2 && typeof a[0] === 'number' && typeof a[1] === 'number';
  const isRing = (a) => Array.isArray(a) && a.length >= 4 && a.every(isPos);
  const isPoly = (a) => Array.isArray(a) && a.length >= 1 && a.every(isRing);
  switch (type) {
    case 'Point': return isPos(coordinates);
    case 'MultiPoint': return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(isPos);
    case 'LineString': return Array.isArray(coordinates) && coordinates.length >= 2 && coordinates.every(isPos);
    case 'MultiLineString': return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every((l) => Array.isArray(l) && l.length >= 2 && l.every(isPos));
    case 'Polygon': return isPoly(coordinates);
    case 'MultiPolygon': return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(isPoly);
    default: return false;
  }
}

/** Every [lon,lat] in the geometry, with its path (for actionable messages). */
export function* eachCoordinate(geom) {
  const walk = function* (node, path) {
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      yield { coord: node, path };
      return;
    }
    for (let i = 0; i < node.length; i++) yield* walk(node[i], path.length ? `${path}.${i}` : String(i));
  };
  yield* walk(geom.coordinates, '');
}

// ── validation ───────────────────────────────────────────────────────────────
export function validateStagedFeature(feature, catalog, ctx, v) {
  const id = feature?.properties?.id;
  const where = id ?? `feature#${ctx.index}`;
  if (!feature || feature.type !== 'Feature') return v.add(where, 'entry is not a GeoJSON Feature');
  const props = feature.properties ?? {};
  for (const field of ['id', 'name', 'waterbodyType', 'source', 'approximate', 'labelAnchor', 'bounds']) {
    if (props[field] === undefined || props[field] === null || props[field] === '') {
      v.add(where, `missing required property "${field}"`);
    }
  }
  if (!id || typeof id !== 'string') return;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) v.add(id, `id "${id}" is not a kebab-case stable id`);

  const record = catalog.get(id);
  if (!record) {
    v.add(id, 'staged geometry has no matching catalog record (add/register the water first)');
  } else {
    if (props.waterbodyType !== record.waterbodyType) {
      v.add(id, `waterbodyType "${props.waterbodyType}" does not match catalog "${record.waterbodyType}"`);
    }
    if (typeof props.name === 'string' && props.name !== record.name) {
      v.warn(id, `staged name "${props.name}" differs from catalog name "${record.name}" (catalog wins)`);
    }
  }

  // Geometry shape + class contract.
  if (!feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) {
    v.add(id, 'missing or empty geometry');
    return;
  }
  const g = feature.geometry;
  const allowed =
    STILL_CLASSES.has(props.waterbodyType)
      ? [...POLY_TYPES, ...POINT_TYPES] // verified still water: polygon, or a point anchor where no polygon was verified
      : LINE_TYPES; // river/creek/tailrace are line reaches; a spring may be a point source
  const typeOk =
    allowed.includes(g.type) || (LINE_CLASSES.has(props.waterbodyType) && POINT_TYPES.includes(g.type));
  if (!typeOk) {
    v.add(id, `geometry type ${g.type} is not valid for waterbodyType "${props.waterbodyType}" (expected ${allowed.join('|')})`);
    return;
  }
  if (JSON.stringify(g.coordinates).length < 12) {
    v.add(id, 'empty geometry coordinates');
    return;
  }
  // Nesting depth must match the declared type — a Polygon-shaped coordinate
  // array labeled MultiPolygon (as seen in real staging output) is invalid
  // GeoJSON, and consuming it would silently read rings as positions.
  if (!geometryDepthMatches(g.type, g.coordinates)) {
    v.add(id, `coordinates do not match the declared geometry type "${g.type}" — check the nesting depth (GeoJSON requires MultiPolygon = array of Polygon coordinate arrays)`);
    return;
  }

  // Coordinate sanity + order.
  for (const { coord, path } of eachCoordinate(g)) {
    const [lon, lat] = coord;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      v.add(id, `non-finite coordinate at ${path}: ${JSON.stringify(coord)}`);
      continue;
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      v.add(id, `coordinate out of planetary range at ${path}: ${JSON.stringify(coord)}`);
    }
    // Tennessee latitudes/longitudes are so different in magnitude that a
    // swap is unambiguous — this is the classic lon/lat order defect.
    if (lat >= -91.5 && lat <= -78 && lon >= 30 && lon <= 38.5) {
      v.add(id, `coordinate order looks SWAPPED at ${path} (lon=${lon}, lat=${lat}) — must be [longitude,latitude]`);
    }
  }

  // Bounds must cover every coordinate.
  const b = props.bounds;
  if (Array.isArray(b) && b.length === 4 && b.every(Number.isFinite)) {
    if (b[0] > b[2] || b[1] > b[3]) {
      v.add(id, `bounds are not [minX,minY,maxX,maxY]: ${JSON.stringify(b)}`);
    } else {
      for (const { coord, path } of eachCoordinate(g)) {
        const pad = 1e-9;
        if (coord[0] < b[0] - pad || coord[0] > b[2] + pad || coord[1] < b[1] - pad || coord[1] > b[3] + pad) {
          v.add(id, `bounds do not cover coordinate at ${path} (${coord[0]},${coord[1]} vs ${JSON.stringify(b)})`);
          break;
        }
      }
      if (b[0] < -91.5 || b[2] > -78 || b[1] < 32 || b[3] > 38.5) {
        v.warn(id, `bounds ${JSON.stringify(b)} reach well outside the Tennessee working area`);
      }
    }
  }

  // Label anchor.
  const anchor = props.labelAnchor;
  if (Array.isArray(anchor) && anchor.length === 2 && anchor.every(Number.isFinite)) {
    if (Array.isArray(b) && b.length === 4) {
      if (anchor[0] < b[0] || anchor[0] > b[2] || anchor[1] < b[1] || anchor[1] > b[3]) {
        v.add(id, `labelAnchor ${JSON.stringify(anchor)} lies outside the feature bounds ${JSON.stringify(b)}`);
      }
    }
    if (POLY_TYPES.includes(g.type) && !pointInGeometry(anchor, g)) {
      v.add(id, `labelAnchor ${JSON.stringify(anchor)} lies outside its own polygon`);
    }
    if (LINE_TYPES.includes(g.type)) {
      let best = Infinity;
      for (const line of flattenLines(g)) {
        for (const coord of line) best = Math.min(best, distM(anchor, coord));
      }
      if (best > M.anchorOnLine) {
        v.warn(id, `labelAnchor sits ${Math.round(best)} m from its line (tolerance ${M.anchorOnLine} m)`);
      }
    }
  }

  // Size floors + source/canonical comparison (topology, not just validity).
  const area = POLY_TYPES.includes(g.type) ? geometryAreaM2(g) : null;
  const length = LINE_TYPES.includes(g.type) ? lineLengthM(flattenLines(g)) : null;
  if (area !== null && area < M.areaMinM2) v.add(id, `polygon area ${Math.round(area)} m² is below the ${M.areaMinM2} m² waterbody floor`);
  if (length !== null && length < M.lengthMinM) v.add(id, `line length ${Math.round(length)} m is below the ${M.lengthMinM} m reach floor`);
  const sourceArea = Number(props.sourceAreaM2);
  if (area !== null && Number.isFinite(sourceArea) && sourceArea > 0) {
    const ratio = area / sourceArea;
    if (ratio < M.sourceRatioLow || ratio > M.sourceRatioHigh) {
      v.add(id, `area ${Math.round(area)} m² is ${(ratio * 100).toFixed(0)}% of declared sourceAreaM2 ${Math.round(sourceArea)} — unexpected divergence from source metadata`);
    }
  }
  const sourceLength = Number(props.sourceLengthM);
  if (length !== null && Number.isFinite(sourceLength) && sourceLength > 0) {
    const ratio = length / sourceLength;
    if (ratio < M.sourceRatioLow || ratio > M.sourceRatioHigh) {
      v.add(id, `length ${Math.round(length)} m is ${(ratio * 100).toFixed(0)}% of declared sourceLengthM ${Math.round(sourceLength)} — unexpected divergence from source metadata`);
    }
  }
  const canonical = ctx.canonicalById.get(id);
  if (canonical) {
    const cg = canonical.geometry ?? {};
    const cArea = POLY_TYPES.includes(cg.type) ? geometryAreaM2(cg) : null;
    const cLength = LINE_TYPES.includes(cg.type) ? lineLengthM(flattenLines(cg)) : null;
    if (area !== null && cArea > 0 && area / cArea < M.canonicalLossWarn) {
      v.warn(id, `replacement polygon is ${(100 * area / cArea).toFixed(0)}% of the canonical feature's area`);
    }
    if (length !== null && cLength > 0 && length / cLength < M.canonicalLossWarn) {
      v.warn(id, `replacement line is ${(100 * length / cLength).toFixed(0)}% of the canonical feature's length`);
    }
  }

  // Authoritative identifiers (NHD Permanent_Identifier / GNIS) — validated
  // where the staging metadata carries them.
  const permanentId = props.permanentId ?? props.nhdPermanentId;
  const gnisId = props.gnisId;
  if (permanentId !== undefined) {
    if (typeof permanentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(permanentId).trim())) {
      v.add(id, `permanentId "${permanentId}" is not an NHD Permanent_Identifier GUID`);
    }
  }
  if (gnisId !== undefined && !/^\d{6,12}$/.test(String(gnisId))) {
    v.add(id, `gnisId "${gnisId}" is not a numeric GNIS identifier`);
  }
  const sourceText = Array.isArray(props.source) ? props.source.join(' ') : String(props.source ?? '');
  if (/nhd/i.test(sourceText) && !permanentId) {
    v.warn(id, 'source references NHD but no permanentId is carried — provenance is thinner than its source');
  }
}

/** Endpoint / intersection topology across the whole staged set + canonical context. */
export function validateTopology(staged, canonicalFeatures, lakes, tnBoundary, v) {
  const lakeGeoms = [];
  for (const f of lakes) {
    if (f.geometry && POLY_TYPES.includes(f.geometry.type)) lakeGeoms.push({ id: f.properties?.id, geom: f.geometry });
  }
  for (const f of staged) {
    if (POLY_TYPES.includes(f.feature.geometry.type)) lakeGeoms.push({ id: f.feature.properties.id, geom: f.feature.geometry });
  }
  // Canonical wide-water polygons also bound line reaches.
  const canonicalPolygons = canonicalFeatures.filter((f) => f.geometry && POLY_TYPES.includes(f.geometry.type));

  // Explainable endpoints: any staged or canonical line endpoint, a lake edge,
  // a wide-water polygon edge, or the Tennessee boundary (± its buffer).
  // Endpoints carry their owner so a reach can never explain an endpoint with
  // ITSELF — but two reaches sharing a junction coordinate (even the same
  // array object) explain each other.
  const endpoints = [];
  const pushEndpoint = (owner, lineIdx, endIdx, coord) =>
    endpoints.push({ owner, lineIdx, endIdx, coord });
  for (const { feature } of staged) {
    const owner = feature.properties?.id;
    flattenLines(feature.geometry).forEach((line, lineIdx) => {
      if (line.length > 0) {
        pushEndpoint(owner, lineIdx, 0, line[0]);
        pushEndpoint(owner, lineIdx, 1, line[line.length - 1]);
      }
    });
  }
  for (const f of canonicalFeatures) {
    flattenLines(f.geometry ?? {}).forEach((line, lineIdx) => {
      if (line.length > 0) {
        pushEndpoint(`canonical:${f.properties?.id}`, lineIdx, 0, line[0]);
        pushEndpoint(`canonical:${f.properties?.id}`, lineIdx, 1, line[line.length - 1]);
      }
    });
  }
  const explains = (end, owner, lineIdx, endIdx) =>
    endpoints.some(
      (other) =>
        !(other.owner === owner && other.lineIdx === lineIdx && other.endIdx === endIdx) &&
        distM(end, other.coord) <= M.endpoint,
    );
  const tnRings = tnBoundary
    ? (tnBoundary.geometry.type === 'Polygon'
        ? [tnBoundary.geometry.coordinates]
        : tnBoundary.geometry.type === 'MultiPolygon'
          ? tnBoundary.geometry.coordinates
          : [])
    : [];

  for (const { feature } of staged) {
    const id = feature.properties.id;
    const lines = flattenLines(feature.geometry);
    if (lines.length === 0) continue;
    const allowOpen = feature.properties.allowOpenEnds === true;

    // 1) unexplained endpoints
    flattenLines(feature.geometry).forEach((line, lineIdx) => {
      [[line[0], 0], [line[line.length - 1], 1]].forEach(([end, endIdx]) => {
        let explained = explains(end, id, lineIdx, endIdx);
        if (!explained) explained = lakeGeoms.some((l) => pointNearRings(end, l.geom, M.endpoint));
        if (!explained) explained = canonicalPolygons.some((f) => pointNearRings(end, f.geometry, M.endpoint));
        if (!explained && tnRings.length) {
          explained = tnRings.some((rings) => rings.some((ring) => pointNearRings(end, { type: 'Polygon', coordinates: [ring] }, M.boundaryBuffer)));
        }
        if (!explained) {
          if (allowOpen) {
            v.warn(id, `open endpoint ${JSON.stringify(end)} tolerated by allowOpenEnds`);
          } else {
            v.add(id, `unexplained line endpoint at ${JSON.stringify(end)} — it touches no staged/canonical reach, no lake edge, and not even the Tennessee boundary buffer`);
          }
        }
      });
    });

    // 2) river→lake intersections: only terminus runs may sit inside a lake.
    const through = new Set(Array.isArray(feature.properties.throughLakeIds) ? feature.properties.throughLakeIds : []);
    for (const line of lines) {
      for (const lake of lakeGeoms) {
        if (lake.id === id) continue;
        const inside = line.map((coord) => pointInGeometry(coord, lake.geom));
        const firstIdx = inside.indexOf(true);
        const lastIdx = inside.lastIndexOf(true);
        if (firstIdx === -1) continue;
        const touchesStart = firstIdx === 0 || inside.slice(0, 2).some(Boolean);
        const touchesEnd = lastIdx === line.length - 1 || inside.slice(-2).some(Boolean);
        const interiorRun = inside.slice(firstIdx, lastIdx + 1).some((flag, k) => flag && firstIdx + k > 1 && firstIdx + k < line.length - 2);
        const isCrossing = interiorRun && !touchesStart && !touchesEnd;
        const midRun = interiorRun && (touchesStart || touchesEnd) && lastIdx - firstIdx < line.length - 1 && lastIdx - firstIdx > 2;
        if ((isCrossing || midRun) && !through.has(lake.id)) {
          v.add(id, `reach crosses the interior of lake "${lake.id ?? 'unnamed'}" instead of ending at its edge (declare throughLakeIds if this flow path is verified)`);
        }
      }
    }

    // 3) dam alignment, where metadata declares it.
    const dam = feature.properties.damAnchor;
    if (Array.isArray(dam) && dam.length === 2) {
      const lakeId = feature.properties.upstreamLakeId;
      const lake = lakeGeoms.find((l) => l.id === lakeId);
      if (!lake) {
        v.add(id, `upstreamLakeId "${lakeId}" does not resolve to any staged or canonical lake polygon`);
      } else {
        const start = lines[0][0];
        const lakeEdge = pointNearRings(dam, lake.geom, M.damOnShore);
        if (!lakeEdge) v.add(id, `declared damAnchor ${JSON.stringify(dam)} is not on the shore of lake "${lakeId}" (tolerance ${M.damOnShore} m)`);
        const startAtDam = distM(start, dam) <= M.tailwaterAtDam;
        if (!startAtDam) {
          v.add(id, `tailwater starts ${Math.round(distM(start, dam))} m from its declared dam anchor — dam-to-tailwater alignment failed`);
        }
      }
    }
  }

  // 4) declared lake→dam alignment (lake side of the same metadata).
  for (const { feature } of staged) {
    if (!POLY_TYPES.includes(feature.geometry.type)) continue;
    const dam = feature.properties.damAnchor;
    if (Array.isArray(dam) && dam.length === 2 && !pointNearRings(dam, feature.geometry, M.damOnShore)) {
      v.add(feature.properties.id, `declared damAnchor ${JSON.stringify(dam)} is not on this lake's boundary (tolerance ${M.damOnShore} m)`);
    }
  }
}

// ── merge ────────────────────────────────────────────────────────────────────
export function mergeFeature(stagedFeature, catalog) {
  const id = stagedFeature.properties.id;
  const record = catalog.get(id);
  const props = {
    ...stagedFeature.properties,
    id,
    name: record?.name ?? stagedFeature.properties.name,
    regionId: record?.regionId,
    gaugeIds: record?.gaugeIds ?? [],
    crs: 'EPSG:4326',
    coordinateOrder: 'longitude,latitude',
    mergedFrom: 'atlas-sources/verified',
  };
  return { type: 'Feature', properties: props, geometry: stagedFeature.geometry };
}

export function regenerateIndex(features) {
  return features.map((f) => {
    const { id, name, bounds, labelAnchor } = f.properties;
    const c = f.geometry.coordinates;
    const first = Array.isArray(c[0][0]) ? c[0][0] : c[0];
    const anchor = labelAnchor ?? (f.geometry.type === 'Point' ? c : first);
    return { id, name, anchor, bounds: bounds ?? [anchor[0], anchor[1], anchor[0], anchor[1]] };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

// ── provenance disclosure (trout/atlas-provenance/1) ─────────────────────────
// Unifies the staging topology records into public/atlas/provenance.json so
// geometry evidence (source layers, ids, weld/seam narrative, verification)
// stays available in the product without ever riding in angler catalog copy
// (review M3). Classification per canonical water id:
//   verified — a topology record exists (documented membership for the
//              west-middle + geo/east-fix rebuilds)
//   carried  — a staged feature without a topology record but with a
//              carriedFrom marker (TWRA winter ponds verified by the
//              STILLWATER/GEO lanes)
//   legacy   — canonical water covered by neither staging file
const LEGACY_PROVENANCE_NOTE = 'pre-verified canonical geometry (pre geo/east-fix build); not yet topology-verified';

function loadTopologyRecords(v) {
  const records = new Map();
  const regions = new Map();
  for (const file of TOPOLOGY_FILES) {
    if (!existsSync(file.path)) {
      v.warn('provenance', `topology file missing: ${file.rel}`);
      continue;
    }
    const doc = JSON.parse(readFileSync(file.path, 'utf8'));
    regions.set(file.region, doc.generated);
    for (const record of doc.records ?? []) {
      if (records.has(record.featureId)) {
        v.add(record.featureId, `duplicate topology record across region files (also from ${records.get(record.featureId).region})`);
        continue;
      }
      records.set(record.featureId, { region: file.region, generated: doc.generated, ...record });
    }
  }
  return { records, regions };
}

function asSourceArray(source) {
  if (Array.isArray(source)) return source.map(String);
  if (typeof source === 'string' && source.trim()) return source.trim().split(/\s+/);
  return undefined;
}

function verifiedProvenanceRecord(rec) {
  const rebuild = {};
  if (rec.sourceLengthKm != null || rec.deliveredLengthKm != null || rec.lengthRatio != null || rec.reachScope) {
    rebuild.lengths = {};
    if ('sourceLengthKm' in rec) rebuild.lengths.sourceLengthKm = rec.sourceLengthKm ?? null;
    if ('deliveredLengthKm' in rec) rebuild.lengths.deliveredLengthKm = rec.deliveredLengthKm ?? null;
    const ratio = rec.lengthRatio
      ?? (rec.sourceLengthKm > 0 && rec.deliveredLengthKm != null
        ? Math.round((rec.deliveredLengthKm / rec.sourceLengthKm) * 1000) / 1000
        : undefined);
    if (ratio != null) rebuild.lengths.lengthRatio = ratio;
    if (rec.reachScope) rebuild.lengths.reachScope = rec.reachScope;
  }
  if (rec.sourceAreaSqKm != null || rec.deliveredAreaSqKm != null) {
    rebuild.areas = { sourceAreaSqKm: rec.sourceAreaSqKm ?? null, deliveredAreaSqKm: rec.deliveredAreaSqKm ?? null };
  }
  if (rec.largestConnectionGapMeters != null) rebuild.largestConnectionGapMeters = rec.largestConnectionGapMeters;
  if (rec.chainSeparations) rebuild.chainSeparations = rec.chainSeparations;
  if (Array.isArray(rec.termini) && rec.termini.length > 0) rebuild.termini = rec.termini;
  // Empty is honest: west records carry no seams by construction.
  rebuild.midCourseSeams = Array.isArray(rec.midCourseSeams) ? rec.midCourseSeams : [];
  if (rec.tailwaterStartDistanceM != null) {
    rebuild.tailwater = { startDistanceM: rec.tailwaterStartDistanceM };
    if (rec.tailwaterStartEndpointM != null) rebuild.tailwater.startEndpointM = rec.tailwaterStartEndpointM;
  }
  if (rec.throughLakeToleranceM) rebuild.throughLakeToleranceM = rec.throughLakeToleranceM;
  if ((rec.upstreamFeatureIds?.length ?? 0) > 0 || (rec.downstreamFeatureIds?.length ?? 0) > 0) {
    rebuild.flowConnectivity = {
      upstreamFeatureIds: rec.upstreamFeatureIds ?? [],
      downstreamFeatureIds: rec.downstreamFeatureIds ?? [],
    };
  }

  const out = {
    region: rec.region,
    generated: rec.generated,
    status: 'verified',
    verificationState: rec.verificationState,
    verificationSources: rec.verificationSources ?? [],
    sourceIdentifiers: rec.sourceIdentifiers ?? [],
  };
  if (Object.keys(rebuild).length > 0) out.rebuild = rebuild;
  if (rec.dam) {
    out.dam = { ...rec.dam };
    if (rec.damPoolDistanceM != null) out.dam.poolDistanceM = rec.damPoolDistanceM;
  }
  if (rec.connections) out.lake = { connections: rec.connections };
  if (rec.notes) out.note = rec.notes;
  return out;
}

function carriedProvenanceRecord(props, region) {
  return { region, status: 'carried', source: asSourceArray(props.source), note: String(props.carriedFrom) };
}

function legacyProvenanceRecord(feature) {
  return { status: 'legacy', source: asSourceArray(feature?.properties?.source), note: LEGACY_PROVENANCE_NOTE };
}

export function buildProvenanceDoc(ids, canonicalById, topoRecords, regions, carriedProps) {  const waters = {};
  const counts = { verified: 0, carried: 0, legacy: 0 };
  for (const id of [...ids].sort()) {
    const topo = topoRecords.get(id);
    if (topo) {
      waters[id] = verifiedProvenanceRecord(topo);
      counts.verified += 1;
    } else if (carriedProps.has(id)) {
      const { props, region } = carriedProps.get(id);
      waters[id] = carriedProvenanceRecord(props, region);
      counts.carried += 1;
    } else {
      waters[id] = legacyProvenanceRecord(canonicalById.get(id));
      counts.legacy += 1;
    }
  }
  const generated = [...regions.values()].sort().at(-1) ?? new Date().toISOString().slice(0, 10);
  const doc = {
    schema: 'trout/atlas-provenance/1',
    generated,
    regions: Object.fromEntries([...regions.entries()].sort()),
    waters,
  };
  return { doc, counts };
}

export function validateProvenanceWaters(waters, v) {
  for (const [id, rec] of Object.entries(waters)) {
    if (rec.status !== 'verified') continue;
    if (rec.verificationState !== 'PASS' && rec.verificationState !== 'UNRESOLVED') {
      v.add(id, `provenance verificationState ${rec.verificationState} not PASS/UNRESOLVED`);
    }
    if (rec.verificationState === 'PASS' && rec.verificationSources.length < 2) {
      v.add(id, 'provenance PASS requires >= 2 verificationSources');
    }
    if (rec.sourceIdentifiers.length === 0) v.add(id, 'provenance record has no sourceIdentifiers');
    for (const [i, seam] of (rec.rebuild?.midCourseSeams ?? []).entries()) {
      if (!Array.isArray(seam.at) || seam.at.length !== 2) v.add(id, `provenance midCourseSeam[${i}] missing [lon,lat]`);
      if (seam.nearestChainM >= 1000 && !(typeof seam.documented === 'string' && seam.documented.trim())) {
        v.add(id, `provenance midCourseSeam[${i}] over the 1 km policy without a documented note`);
      }
    }
    const lengths = rec.rebuild?.lengths;
    if (lengths?.lengthRatio != null && lengths.sourceLengthKm > 0 && lengths.deliveredLengthKm != null) {
      const expected = lengths.deliveredLengthKm / lengths.sourceLengthKm;
      if (Math.abs(lengths.lengthRatio - expected) > 0.005) {
        v.add(id, `provenance lengthRatio ${lengths.lengthRatio} != delivered/source ${expected.toFixed(4)}`);
      }
    }
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main() {
  const log = (...args) => console.log(...args);
  if (!existsSync(RIVERS_PATH)) {
    console.error(`[integrate] canonical atlas missing: ${RIVERS_PATH}`);
    process.exit(1);
  }
  if (!existsSync(PACK_PATH)) {
    console.error('[integrate] content pack missing — run: pnpm --filter @trout/content build');
    process.exit(1);
  }
  const catalogRaw = JSON.parse(readFileSync(PACK_PATH, 'utf8'));
  const catalogList = catalogRaw.streams ?? catalogRaw;
  const catalog = new Map(catalogList.map((s) => [s.id, s]));

  const rivers = JSON.parse(readFileSync(RIVERS_PATH, 'utf8'));
  const before = rivers.features.length;
  const lakesFc = existsSync(LAKES_PATH) ? JSON.parse(readFileSync(LAKES_PATH, 'utf8')) : { type: 'FeatureCollection', features: [] };
  const tnBoundary = existsSync(TN_BOUNDARY_PATH) ? JSON.parse(readFileSync(TN_BOUNDARY_PATH, 'utf8')).features?.[0] : null;

  const v = new Violations();
  const available = STAGING_FILES.filter((f) => existsSync(f.path));
  log(`[integrate] staging files present: ${available.length ? available.map((f) => f.rel).join(', ') : 'none'}`);
  if (available.length === 0) {
    log('[integrate] nothing to integrate — canonical atlas left unchanged.');
    log(`[integrate] features before/after: ${before}/${before}`);
    process.exit(0);
  }

  const seenIds = new Set();
  const seenPermanentIds = new Map();
  const seenGnisIds = new Map();
  const staged = [];
  for (const file of available) {
    const fc = JSON.parse(readFileSync(file.path, 'utf8'));
    if (fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
      console.error(`[integrate] ${file.rel}: not a FeatureCollection`);
      process.exit(1);
    }
    log(`[integrate] ${file.rel}: ${fc.features.length} staged feature(s)`);
    fc.features.forEach((feature, index) => {
      const id = feature?.properties?.id ?? `feature#${index}`;
      if (seenIds.has(id)) v.add(id, `duplicate staged id across staging files (second occurrence in ${file.rel})`);
      seenIds.add(id);
      const pid = feature?.properties?.permanentId ?? feature?.properties?.nhdPermanentId;
      if (pid) {
        if (seenPermanentIds.has(pid)) v.add(id, `duplicate NHD Permanent_Identifier ${pid} (also on "${seenPermanentIds.get(pid)}")`);
        seenPermanentIds.set(pid, id);
      }
      const gid = feature?.properties?.gnisId;
      if (gid) {
        if (seenGnisIds.has(gid)) v.add(id, `duplicate GNIS id ${gid} (also on "${seenGnisIds.get(gid)}")`);
        seenGnisIds.set(gid, id);
      }
      staged.push({ file: file.rel, index, feature });
    });
  }

  const canonicalById = new Map(
    rivers.features.filter((f) => f.properties?.id).map((f) => [f.properties.id, f]),
  );
  staged.forEach((entry, index) => validateStagedFeature(entry.feature, catalog, { index, canonicalById }, v));
  validateTopology(staged, rivers.features, lakesFc.features, tnBoundary, v);

  // Provenance inputs: topology records + carried markers for staged features
  // the topology files don't cover (TWRA winter ponds).
  const { records: topoRecords, regions: topoRegions } = loadTopologyRecords(v);
  const carriedProps = new Map();
  for (const s of staged) {
    const id = s.feature.properties?.id;
    const carriedFrom = s.feature.properties?.carriedFrom;
    if (id && carriedFrom && !topoRecords.has(id)) {
      carriedProps.set(id, { props: s.feature.properties, region: s.file.match(/([a-z-]+)\.geojson/)?.[1] ?? null });
    }
  }

  // Catalog coverage reports (informational — printed either way).
  const stagedIds = new Set(staged.map((s) => s.feature.properties?.id));
  const geometryIds = new Set([...rivers.features.map((f) => f.properties?.id), ...stagedIds]);
  const withoutGeometry = catalogList.filter((s) => !geometryIds.has(s.id)).map((s) => s.id);
  const orphans = [...geometryIds].filter((id) => id && !catalog.has(id));

  if (v.list.length > 0) {
    console.error(`[integrate] ${v.list.length} contract violation(s):`);
    for (const violation of v.list) console.error(`  ✗ ${violation.id}: ${violation.message}`);
    for (const warning of v.warnings) console.error(`  ⚠ ${warning.id}: ${warning.message}`);
    console.error('[integrate] FAIL — canonical atlas left unchanged.');
    process.exit(1);
  }
  for (const warning of v.warnings) log(`  ⚠ ${warning.id}: ${warning.message}`);

  if (DRY_RUN) {
    log(`[integrate] dry-run OK — ${staged.length} staged feature(s) would merge cleanly.`);
    log(`[integrate] would replace: ${staged.filter((s) => canonicalById.has(s.feature.properties.id)).map((s) => s.feature.properties.id).join(', ') || '(none)'}`);
    log(`[integrate] would append: ${staged.filter((s) => !canonicalById.has(s.feature.properties.id)).map((s) => s.feature.properties.id).join(', ') || '(none)'}`);
    log(`[integrate] catalog records without geometry: ${withoutGeometry.length ? withoutGeometry.join(', ') : '(none)'}`);
    log(`[integrate] geometry ids without catalog record: ${orphans.length ? orphans.join(', ') : '(none)'}`);
    const dryIds = new Set([...canonicalById.keys(), ...stagedIds]);
    const dryProv = buildProvenanceDoc(dryIds, canonicalById, topoRecords, topoRegions, carriedProps);
    const orphanTopo = [...topoRecords.keys()].filter((id) => !dryIds.has(id));
    log(`[integrate] would write provenance.json (trout/atlas-provenance/1): ${dryProv.counts.verified} verified, ${dryProv.counts.carried} carried, ${dryProv.counts.legacy} legacy of ${dryIds.size} waters${orphanTopo.length ? `; WARNING orphan topology records: ${orphanTopo.join(', ')}` : ''}`);
    process.exit(0);
  }

  // Merge: replace by id, append only genuinely new catalog waters.
  const replaced = [];
  const appended = [];
  const merged = new Map(rivers.features.filter((f) => f.properties?.id).map((f) => [f.properties.id, f]));
  for (const { feature } of staged) {
    const id = feature.properties.id;
    if (merged.has(id)) replaced.push(id);
    else appended.push(id);
    merged.set(id, mergeFeature(feature, catalog));
  }
  const outFeatures = [...merged.values()].sort((a, b) => String(a.properties.id).localeCompare(String(b.properties.id)));

  // Provenance disclosure: unified from staging topology (+ carried/legacy
  // markers), gated before anything is written. Single-shot: any violation
  // above already exited; provenance violations exit here, still write-free.
  const prov = buildProvenanceDoc(new Set(outFeatures.map((f) => f.properties.id)), canonicalById, topoRecords, topoRegions, carriedProps);
  for (const id of topoRecords.keys()) {
    if (!merged.has(id)) v.warn('provenance', `topology record without staged/canonical feature: ${id}`);
  }
  validateProvenanceWaters(prov.doc.waters, v);
  if (v.list.length > 0) {
    console.error(`[integrate] ${v.list.length} contract violation(s) while building provenance:`);
    for (const violation of v.list) console.error(`  ✗ ${violation.id}: ${violation.message}`);
    console.error('[integrate] FAIL — canonical atlas left unchanged.');
    process.exit(1);
  }

  // Drop passive lake twins that now render as interactive catalog features.
  const passiveTwinIds = new Set();
  for (const lake of lakesFc.features) {
    const id = lake.properties?.id;
    if (id && stagedIds.has(id) && STILL_CLASSES.has(catalog.get(id)?.waterbodyType)) passiveTwinIds.add(id);
  }
  const keptLakes = lakesFc.features.filter((f) => !passiveTwinIds.has(f.properties?.id));

  // Canonical atlas files are compact single-line JSON (existing pipeline
  // convention); the map index keeps its 2-space format.
  writeFileSync(RIVERS_PATH, JSON.stringify({ ...rivers, features: outFeatures }) + '\n');
  if (passiveTwinIds.size > 0) {
    writeFileSync(LAKES_PATH, JSON.stringify({ ...lakesFc, features: keptLakes }) + '\n');
  }
  const index = regenerateIndex(outFeatures);
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n');
  writeFileSync(PROVENANCE_PATH, JSON.stringify(prov.doc) + '\n');

  log(`[integrate] features before/after: ${before}/${outFeatures.length}`);
  log(`[integrate] replaced (${replaced.length}): ${replaced.join(', ') || '(none)'}`);
  log(`[integrate] appended (${appended.length}): ${appended.join(', ') || '(none)'}`);
  log(`[integrate] passive lake twins removed: ${passiveTwinIds.size ? [...passiveTwinIds].join(', ') : '(none)'}`);
  log(`[integrate] catalog records without geometry: ${withoutGeometry.length ? withoutGeometry.join(', ') : '(none)'}`);
  log(`[integrate] geometry ids without catalog record: ${orphans.length ? orphans.join(', ') : '(none)'}`);
  log(`[integrate] riverIndex regenerated: ${index.length} entries`);
  log(`[integrate] provenance.json written: ${prov.counts.verified} verified, ${prov.counts.carried} carried, ${prov.counts.legacy} legacy`);
  log('[integrate] OK — verify with: pnpm --filter @trout/web exec node scripts/validate-atlas.mjs && pnpm --filter @trout/web test');
}

/** Run the CLI only when executed directly (tests import the pure functions). */
const invoked = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (invoked) main();
