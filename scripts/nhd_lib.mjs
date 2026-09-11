// nhd_lib.mjs — shared utilities for the NHD trace engine (zero dependencies).
// Conventions frozen in docs/NHD-CONVENTIONS.md. Pure Node stdlib; GDAL is never
// imported here (conversion happens once, upstream, via scripts/nhd_convert_gdb.sh).

import fs from 'node:fs';

export function readJsonl(path) {
  return fs
    .readFileSync(path, 'utf8')
    .trimEnd()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const M_PER_DEG_LAT = 111132;
// Equirectangular meters-per-degree helpers (±0.2% at Tennessee latitudes —
// good enough for snapping thresholds and simplification tolerance).
export function mPerDegLon(lat) {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

export function haversineM(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(s));
}

// Project p onto segment ab; returns distance in meters, param t (0..1) and point.
// Works in a per-axis scaled degree space so Euclidean math ≈ meters locally.
export function projectToSegment(p, a, b) {
  const sx = mPerDegLon((a[1] + b[1]) / 2);
  const px = p[0] * sx,
    py = p[1] * M_PER_DEG_LAT;
  const ax = a[0] * sx,
    ay = a[1] * M_PER_DEG_LAT;
  const bx = b[0] * sx,
    by = b[1] * M_PER_DEG_LAT;
  const dx = bx - ax,
    dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx,
    qy = ay + t * dy;
  const distM = Math.hypot(px - qx, py - qy);
  return { distM, t, point: [qx / sx, qy / M_PER_DEG_LAT] };
}

export function lineLengthKm(coords) {
  let m = 0;
  for (let i = 1; i < coords.length; i++) m += haversineM(coords[i - 1], coords[i]);
  return m / 1000;
}

// Douglas-Peucker with meter tolerance (equirectangular projection per segment).
export function dpSimplify(coords, tolM) {
  if (coords.length <= 2) return coords.slice();
  const keep = new Array(coords.length).fill(false);
  keep[0] = keep[coords.length - 1] = true;
  const stack = [[0, coords.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    if (j <= i + 1) continue;
    let maxD = -1,
      maxK = -1;
    for (let k = i + 1; k < j; k++) {
      const { distM } = projectToSegment(coords[k], coords[i], coords[j]);
      if (distM > maxD) {
        maxD = distM;
        maxK = k;
      }
    }
    if (maxD > tolM) {
      keep[maxK] = true;
      stack.push([i, maxK], [maxK, j]);
    }
  }
  return coords.filter((_, i) => keep[i]);
}

export function roundCoords(coords, decimals) {
  const f = 10 ** decimals;
  return coords.map(([lon, lat]) => [Math.round(lon * f) / f, Math.round(lat * f) / f]);
}

export function bboxOf(coords) {
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLon, minLat, maxLon, maxLat];
}

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function writeJson(path, obj, pretty = false) {
  fs.writeFileSync(path, JSON.stringify(obj, null, pretty ? 2 : 0) + '\n');
}
