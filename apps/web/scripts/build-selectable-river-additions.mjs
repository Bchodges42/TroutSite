#!/usr/bin/env node
/**
 * Append the curated statewide selectable-river expansion to the canonical
 * atlas from exact USGS NHDPlus HR GNIS identities. Existing features are
 * preserved unless --replace-existing is explicitly supplied. Re-runs are
 * deterministic and use the ignored fetch cache.
 *
 * Run: node scripts/build-selectable-river-additions.mjs [--force] [--replace-existing]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open as openShape } from 'shapefile';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(webRoot, 'atlas-sources', 'selectable-river-additions.json');
const atlasPath = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const cacheDir = join(webRoot, '.atlas-src', 'selectable-rivers');
const force = process.argv.includes('--force');
const replaceExisting = process.argv.includes('--replace-existing');
const only = new Set(
  (process.argv.find((arg) => arg.startsWith('--only='))?.slice(7) ?? '')
    .split(',')
    .filter(Boolean),
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const existing = new Set(atlas.features.map((feature) => feature.properties.id));
mkdirSync(cacheDir, { recursive: true });

const boundaryDoc = JSON.parse(
  readFileSync(join(webRoot, 'public', 'atlas', 'tn-boundary.geojson'), 'utf8'),
);
const boundaryGeometry = boundaryDoc.features?.[0]?.geometry ?? boundaryDoc.geometry;
const boundaryPolygons =
  boundaryGeometry.type === 'Polygon'
    ? [boundaryGeometry.coordinates]
    : boundaryGeometry.coordinates;

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [xi, yi] = ring[index],
      [xj, yj] = ring[previous];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inTennessee(point) {
  return boundaryPolygons.some(
    (polygon) =>
      pointInRing(point, polygon[0]) && !polygon.slice(1).some((ring) => pointInRing(point, ring)),
  );
}

const radians = (degrees) => (degrees * Math.PI) / 180;
function segmentLengthM(a, b) {
  const dLat = radians(b[1] - a[1]),
    dLon = radians(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 12_742_000 * Math.asin(Math.sqrt(h));
}

function lineLengthKm(line) {
  let meters = 0;
  for (let index = 1; index < line.length; index++)
    meters += segmentLengthM(line[index - 1], line[index]);
  return meters / 1000;
}

function boundsOf(lines) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const line of lines)
    for (const [x, y] of line) {
      bounds[0] = Math.min(bounds[0], x);
      bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x);
      bounds[3] = Math.max(bounds[3], y);
    }
  return bounds.map((value, index) =>
    index < 2 ? Math.floor(value * 1e6) / 1e6 : Math.ceil(value * 1e6) / 1e6,
  );
}

function labelAnchor(lines, bounds) {
  const target = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
  let best = lines[0][0],
    distance = Infinity;
  for (const line of lines)
    for (const point of line) {
      const candidate = (point[0] - target[0]) ** 2 + (point[1] - target[1]) ** 2;
      if (candidate < distance) {
        best = point;
        distance = candidate;
      }
    }
  return best.map((value) => +value.toFixed(6));
}

const TIGER_WORDS = {
  R: 'RIVER',
  RIV: 'RIVER',
  CR: 'CREEK',
  CRK: 'CREEK',
  FK: 'FORK',
  FRK: 'FORK',
};
const normalizeName = (value) =>
  String(value ?? '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((word) => TIGER_WORDS[word] ?? word)
    .join(' ');

async function loadTigerGeometry(candidates) {
  const selected = candidates.filter((candidate) => candidate.geometrySource === 'tiger-linear');
  const wanted = new Map(
    selected.flatMap((candidate) =>
      candidate.nhdNames.map((name) => [normalizeName(name), candidate]),
    ),
  );
  const result = new Map(
    selected.map((candidate) => [
      candidate.id,
      { lines: [], sourceIds: new Set(), seen: new Set() },
    ]),
  );
  if (!wanted.size) return result;
  const shapeDir = join(webRoot, '.atlas-src', 'shp');
  for (const file of readdirSync(shapeDir).filter((name) => name.endsWith('.shp'))) {
    const source = await openShape(join(shapeDir, file));
    for (;;) {
      const row = await source.read();
      if (row.done) break;
      const candidate = wanted.get(normalizeName(row.value.properties.FULLNAME));
      if (!candidate) continue;
      const parts =
        row.value.geometry.type === 'LineString'
          ? [row.value.geometry.coordinates]
          : row.value.geometry.type === 'MultiLineString'
            ? row.value.geometry.coordinates
            : [];
      const [west, south, east, north] = candidate.envelope;
      const bucket = result.get(candidate.id);
      for (const line of parts) {
        if (
          line.length < 2 ||
          !line.every(inTennessee) ||
          !line.some(([x, y]) => x >= west && x <= east && y >= south && y <= north)
        )
          continue;
        const forward = line.map((point) => point.join(',')).join(';');
        const reverse = [...line]
          .reverse()
          .map((point) => point.join(','))
          .join(';');
        const signature = forward < reverse ? forward : reverse;
        if (bucket.seen.has(signature)) continue;
        bucket.seen.add(signature);
        bucket.lines.push(line);
        if (row.value.properties.LINEARID)
          bucket.sourceIds.add(String(row.value.properties.LINEARID));
      }
    }
  }
  return result;
}

async function post(params) {
  const url = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer/3/query';
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams(params),
        signal: AbortSignal.timeout(180_000),
      });
      const text = await response.text();
      const json = JSON.parse(text);
      if (response.ok && !json.error) return json;
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 160)}`);
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolveSleep) => setTimeout(resolveSleep, 2_000 * attempt));
    }
  }
}

async function fetchCandidate(candidate) {
  const cachePath = join(cacheDir, `${candidate.id}.geojson`);
  if (!force && existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'));
  const quotedIds = candidate.gnisIds.map((id) => `'${id}'`).join(',');
  const where = `(fcode=46006 OR fcode=46003 OR fcode=55800) AND gnis_id IN (${quotedIds})`;
  const ids = await post({
    where,
    geometry: candidate.envelope.join(','),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    returnIdsOnly: 'true',
    f: 'json',
  });
  const objectIds = ids.objectIds ?? [];
  if (!objectIds.length) throw new Error(`${candidate.id}: NHD returned no matching OBJECTIDs`);
  const features = [];
  for (let offset = 0; offset < objectIds.length; offset += 150) {
    const chunk = objectIds.slice(offset, offset + 150);
    const geometry = await post({
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields: 'OBJECTID,gnis_name,gnis_id,nhdplusid,reachcode,fcode,lengthkm,streamorde',
      returnGeometry: 'true',
      geometryPrecision: '6',
      maxAllowableOffset: '0.00012',
      outSR: '4326',
      f: 'geojson',
    });
    features.push(...(geometry.features ?? []));
  }
  const collection = { type: 'FeatureCollection', features };
  writeFileSync(cachePath, JSON.stringify(collection));
  return collection;
}

function makeFeature(candidate, collection, tiger) {
  const sourceIds = new Set(),
    orders = [],
    seen = new Set(),
    lines = [];
  for (const feature of collection.features) {
    if (!candidate.gnisIds.includes(String(feature.properties.gnis_id))) continue;
    const parts =
      feature.geometry.type === 'LineString'
        ? [feature.geometry.coordinates]
        : feature.geometry.type === 'MultiLineString'
          ? feature.geometry.coordinates
          : [];
    for (const line of parts) {
      // The fetch envelopes intentionally include cross-state headwaters. Keep
      // only whole NHD reaches whose vertices all lie in Tennessee; never clip
      // or invent a boundary vertex.
      if (line.length < 2 || !line.every(inTennessee)) continue;
      const forward = line
        .map((point) => `${point[0].toFixed(6)},${point[1].toFixed(6)}`)
        .join(';');
      const reverse = [...line]
        .reverse()
        .map((point) => `${point[0].toFixed(6)},${point[1].toFixed(6)}`)
        .join(';');
      const signature = forward < reverse ? forward : reverse;
      if (seen.has(signature)) continue;
      seen.add(signature);
      lines.push(line);
      sourceIds.add(String(feature.properties.nhdplusid));
      orders.push(Number(feature.properties.streamorde) || 0);
    }
  }
  if (candidate.geometrySource === 'tiger-linear') {
    lines.splice(0, lines.length, ...(tiger?.lines ?? []));
    sourceIds.clear();
    for (const sourceId of tiger?.sourceIds ?? []) sourceIds.add(sourceId);
  }
  if (!lines.length)
    throw new Error(`${candidate.id}: no whole NHD reaches survived the Tennessee boundary gate`);
  const bounds = boundsOf(lines);
  return {
    type: 'Feature',
    properties: {
      id: candidate.id,
      name: candidate.name,
      ...(candidate.aliases?.length ? { aliases: candidate.aliases } : {}),
      waterbodyType: candidate.waterbodyType,
      regionId: candidate.regionId,
      gaugeIds: [],
      gnisIds: candidate.gnisIds,
      maxStreamOrder: Math.max(...orders),
      labelMinZoom: candidate.labelMinZoom,
      bounds,
      labelAnchor: labelAnchor(lines, bounds),
      source: candidate.geometrySource ?? 'nhd-hr',
      sourceRetrieved: manifest.generated,
      sourceIds: [...sourceIds].sort(),
      crs: 'EPSG:4326',
      coordinateOrder: 'longitude,latitude',
      partCount: lines.length,
      vertexCount: lines.reduce((sum, line) => sum + line.length, 0),
      lengthKm: +lines.reduce((sum, line) => sum + lineLengthKm(line), 0).toFixed(2),
      allowOpenEnds: true,
      inclusionSignals: candidate.signals,
    },
    geometry: { type: 'MultiLineString', coordinates: lines },
  };
}

const targets = manifest.candidates.filter(
  (candidate) =>
    (!only.size || only.has(candidate.id)) && (replaceExisting || !existing.has(candidate.id)),
);
const tiger = await loadTigerGeometry(targets);
const additions = [];
for (let offset = 0; offset < targets.length; offset += 6) {
  const batch = targets.slice(offset, offset + 6);
  const collections = await Promise.all(batch.map(fetchCandidate));
  additions.push(
    ...batch.map((candidate, index) =>
      makeFeature(candidate, collections[index], tiger.get(candidate.id)),
    ),
  );
  console.log(
    `selectable rivers: prepared ${Math.min(offset + batch.length, targets.length)}/${targets.length}`,
  );
}

if (!only.size) {
  if (replaceExisting) {
    const replacing = new Set(additions.map((feature) => feature.properties.id));
    atlas.features = atlas.features.filter((feature) => !replacing.has(feature.properties.id));
  }
  atlas.features.push(...additions);
  atlas.features.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
  writeFileSync(atlasPath, JSON.stringify(atlas));
}

for (const feature of additions) {
  const p = feature.properties;
  console.log(
    `+ ${p.id}: GNIS ${p.gnisIds.join(',')} · order ${p.maxStreamOrder} · ${p.lengthKm} km · ${p.partCount} parts`,
  );
}
console.log(
  only.size
    ? 'dry subset complete (canonical atlas not written)'
    : `selectable rivers: appended ${additions.length}; atlas now ${atlas.features.length} features`,
);
