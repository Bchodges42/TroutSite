/* global AbortSignal, URL, URLSearchParams, console, fetch, setTimeout */
// trace-east/lib.mjs — shared helpers for the EAST trace crew.
// Copied from the proven fix scripts (fix-tellico-area.mjs, fix-horse-creek-greene.mjs,
// fix-wolf-river-fentress.mjs, fetch-nhd-fixes.mjs) plus VAA level-path ordering.
// This file is owned by trace-east; nothing canonical is written here.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const WEB = fileURLToPath(new URL('../..', import.meta.url)); // apps/web/
export const TAKES_DIR = new URL('../../.atlas-src/trace/east/takes/', import.meta.url);
export const OUT_DIR = new URL('../../.atlas-src/trace/east/out/', import.meta.url);
export const SNAP = 2e-4; // ~22 m endpoint snap (source geometry is 4 dp ≈ 11 m)

// ---------------------------------------------------------------- geo basics
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function dM(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const lineLenKm = (line) => { let s = 0; for (let i = 1; i < line.length; i++) s += dM(line[i - 1], line[i]); return s / 1000; };

export function boundsOf(pts) {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return [+minX.toFixed(6), +minY.toFixed(6), +maxX.toFixed(6), +maxY.toFixed(6)];
}

export function ptInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function ptInGeom(pt, geom) {
  if (!geom) return false;
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'Polygon' ? [geom.coordinates] : [];
  for (const poly of polys) if (ptInRing(pt, poly[0]) && !poly.slice(1).some((h) => ptInRing(pt, h))) return true;
  return false;
}
export function nearestDistM(pt, geom) {
  if (!geom) return Infinity;
  let b = Infinity;
  (function w(r) { if (typeof r[0] === 'number') { const d = dM(pt, r); if (d < b) b = d; } else r.forEach(w); })(geom.coordinates);
  return b;
}
export const multiParts = (geom) => (geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates);

// ---------------------------------------------------------------- NHD fetch
const SVC = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function post(layer, params, tries = 4) {
  const body = new URLSearchParams(params);
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${SVC}/${layer}/query`, { method: 'POST', body, signal: AbortSignal.timeout(120000) });
      const text = await res.text();
      if (res.ok && (text.startsWith('{') || text.startsWith(' '))) return JSON.parse(text);
      console.log(`  retry ${i + 1}: http ${res.status} ${text.slice(0, 80)}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 100)}`);
    }
    await sleep(5000);
  }
  throw new Error('query failed after retries');
}

export const VAA_FIELDS = 'gnis_name,gnis_id,nhdplusid,reachcode,fcode,ftype,lengthkm,streamorde,hydroseq,levelpathi,pathlength,dnlevelpat,uplevelpat,dnhydroseq,mainpath,innetwork,vpuid,arbolatesu';

/**
 * Fetch a whole-part NHDPlus HR take (layer 3 NetworkNHDFlowline by default):
 * OBJECTID discovery inside an envelope, then whole-feature geometry re-fetch by
 * OBJECTID so every part is returned whole — never clipped (fetch-nhd-fixes pattern).
 */
export async function fetchTake({ key, where, env, layer = 3, outFields = VAA_FIELDS, outDir = TAKES_DIR }) {
  const ids = [];
  let offset = 0;
  for (;;) {
    const p = {
      where,
      geometry: env, geometryType: 'esriGeometryEnvelope', inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects', returnIdsOnly: 'true',
      resultOffset: String(offset), f: 'pjson',
    };
    const j = await post(layer, p);
    const batch = j.objectIds ?? [];
    ids.push(...batch);
    console.log(`  ids offset=${offset} got=${batch.length} total=${ids.length} exceeded=${j.exceededTransferLimit ?? false}`);
    if (batch.length < 1000 || !j.exceededTransferLimit) break;
    offset += batch.length;
    await sleep(2000);
  }
  const feats = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150);
    const j = await post(layer, {
      where: `OBJECTID IN (${chunk.join(',')})`,
      outFields,
      returnGeometry: 'true', geometryPrecision: '4', maxAllowableOffset: '0.0005',
      outSR: '4326', f: 'geojson',
    });
    feats.push(...(j.features ?? []));
    console.log(`  geom ${Math.min(i + 150, ids.length)}/${ids.length}`);
    await sleep(2000);
  }
  const names = {};
  for (const f of feats) names[f.properties.gnis_name] = (names[f.properties.gnis_name] ?? 0) + 1;
  console.log(`  names: ${JSON.stringify(names)}`);
  mkdirSync(outDir, { recursive: true });
  const path = new URL(`${key}.geojson`, outDir);
  writeFileSync(path, JSON.stringify({ type: 'FeatureCollection', features: feats }));
  console.log(`  wrote ${path.pathname || path}`);
  return feats;
}

// ---------------------------------------------------------------- welding
/** Weld segments into maximal chains, tracking the nhdplusids that built each (proven weldTracked). */
export function weldTracked(segments, snap = SNAP) {
  const chains = segments.map((s) => ({ pts: s.pts.slice(), ids: [s.id], lenKm: s.lenKm ?? lineLenKm(s.pts), segs: [s] }));
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < chains.length; i++) {
      for (let j = i + 1; j < chains.length; j++) {
        const a = chains[i], b = chains[j];
        const combos = [
          [a.pts[a.pts.length - 1], b.pts[0], () => [...a.pts, ...b.pts.slice(1)]],
          [a.pts[a.pts.length - 1], b.pts[b.pts.length - 1], () => [...a.pts, ...b.pts.reverse().slice(1)]],
          [a.pts[0], b.pts[b.pts.length - 1], () => [...b.pts, ...a.pts.slice(1)]],
          [a.pts[0], b.pts[0], () => [...b.pts.reverse(), ...a.pts.slice(1)]],
        ];
        for (const [p, q, join] of combos) {
          if (dist(p, q) <= snap) {
            chains[i] = { pts: join(), ids: [...a.ids, ...b.ids], lenKm: a.lenKm + b.lenKm, segs: [...a.segs, ...b.segs] };
            chains.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
  }
  return chains;
}

/**
 * VAA level-path assembly: for one levelpathi, order reaches by hydroseq
 * (headwater -> mouth; hydroseq decreases downstream) and concatenate with
 * orientation repair so consecutive reaches chain 0-seam. Returns null when the
 * level path does not chain end-to-end within snap.
 */
export function levelPathChain(segments, snapM = 25) {
  const segs = segments.filter((s) => s.levelpathi != null).sort((a, b) => b.hydroseq - a.hydroseq);
  if (!segs.length) return null;
  let pts = segs[0].pts.slice();
  const used = [segs[0]];
  for (let k = 1; k < segs.length; k++) {
    const s = segs[k];
    const head = pts[0], tail = pts[pts.length - 1];
    const cands = [
      [dM(tail, s.pts[0]), () => [...pts, ...s.pts.slice(1)]],
      [dM(tail, s.pts[s.pts.length - 1]), () => [...pts, ...s.pts.slice(0, -1).reverse()]],
      [dM(head, s.pts[s.pts.length - 1]), () => [...s.pts.slice(0, -1), ...pts]],
      [dM(head, s.pts[0]), () => [...s.pts.slice(1).reverse(), ...pts]],
    ].sort((a, b) => a[0] - b[0]);
    if (cands[0][0] > snapM) return { pts, used, brokeAt: s, gapM: cands[0][0] };
    pts = cands[0][1]();
    used.push(s);
  }
  return { pts, used, gapM: 0 };
}

// ---------------------------------------------------------------- self crossings
// Compact port of the strict-crossing core of
// .atlas-src/audit-s2/detect-self-intersections.mjs (same tunables, grid-accelerated).
export function countSelfCrossings(parts) {
  const M_PER_DEG_LAT = 110540;
  const COS = (d) => Math.cos((d * Math.PI) / 180);
  const CELL_M = 600, TOUCH_EPS_M = 0.5;
  let latSum = 0, n = 0;
  for (const p of parts) for (const c of p) { latSum += c[1]; n++; }
  if (!n) return { crossings: 0, events: [] };
  const lat0 = latSum / n;
  const mLon = 111320 * COS(lat0);
  const P = parts.map((part) => part.map((c) => ({ x: c[0] * mLon, y: c[1] * M_PER_DEG_LAT })));
  const segs = [];
  for (let pi = 0; pi < P.length; pi++) {
    const pts = P[pi];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 0.01) continue;
      segs.push({ pi, i, ax: a.x, ay: a.y, bx: b.x, by: b.y, len });
    }
  }
  const grid = new Map();
  segs.forEach((s, si) => {
    s.si = si;
    const x0 = Math.floor(Math.min(s.ax, s.bx) / CELL_M), x1 = Math.floor(Math.max(s.ax, s.bx) / CELL_M);
    const y0 = Math.floor(Math.min(s.ay, s.by) / CELL_M), y1 = Math.floor(Math.max(s.ay, s.by) / CELL_M);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const k = cx + '_' + cy;
      let arr = grid.get(k);
      if (!arr) grid.set(k, (arr = []));
      arr.push(si);
    }
  });
  const _pointSegDist = (px, py, s) => {
    const dx = s.bx - s.ax, dy = s.by - s.ay, L2 = dx * dx + dy * dy;
    let t = L2 ? ((px - s.ax) * dx + (py - s.ay) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (s.ax + t * dx), py - (s.ay + t * dy));
  };
  const rawHits = [];
  const pairSeen = new Set();
  for (const arr of grid.values()) {
    for (let a = 0; a < arr.length; a++) {
      for (let b = a + 1; b < arr.length; b++) {
        const A = segs[arr[a]], B = segs[arr[b]];
        if (A.pi === B.pi && Math.abs(A.i - B.i) <= 1) continue;
        const pk = Math.min(A.si, B.si) * 10000000 + Math.max(A.si, B.si);
        if (pairSeen.has(pk)) continue;
        pairSeen.add(pk);
        if (Math.max(Math.min(A.ax, A.bx), Math.min(B.ax, B.bx)) > Math.min(Math.max(A.ax, A.bx), Math.max(B.ax, B.bx))) continue;
        if (Math.max(Math.min(A.ay, A.by), Math.min(B.ay, B.by)) > Math.min(Math.max(A.ay, A.by), Math.max(B.ay, B.by))) continue;
        // strictly interior crossing (transversal)
        const d1x = A.bx - A.ax, d1y = A.by - A.ay, d2x = B.bx - B.ax, d2y = B.by - B.ay;
        const den = d1x * d2y - d1y * d2x;
        if (Math.abs(den) < 1e-12) continue;
        const ex = B.ax - A.ax, ey = B.ay - A.ay;
        const t = (ex * d2y - ey * d2x) / den, u = (ex * d1y - ey * d1x) / den;
        if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) continue;
        const s1 = Math.sign((A.bx - A.ax) * (B.ay - A.ay) - (A.by - A.ay) * (B.ax - A.ax));
        const s2 = Math.sign((A.bx - A.ax) * (B.by - A.ay) - (A.by - A.ay) * (B.bx - A.ax));
        const s3 = Math.sign((B.bx - B.ax) * (A.ay - A.ay) - (B.by - B.ay) * (A.ax - B.ax));
        const s4 = Math.sign((B.bx - B.ax) * (A.by - A.ay) - (B.by - B.ay) * (A.bx - B.ax));
        const strict = s1 * s2 < 0 && s3 * s4 < 0;
        if (strict) {
          const x = A.ax + t * d1x, y = A.ay + t * d1y;
          rawHits.push({ x, y });
          continue;
        }
        // T-cross: intersection interior to one segment, other path passes through
        const x = A.ax + t * d1x, y = A.ay + t * d1y;
        const atA1 = Math.hypot(x - A.ax, y - A.ay) < TOUCH_EPS_M;
        const atA2 = Math.hypot(x - A.bx, y - A.by) < TOUCH_EPS_M;
        const atB1 = Math.hypot(x - B.ax, y - B.ay) < TOUCH_EPS_M;
        const atB2 = Math.hypot(x - B.bx, y - B.by) < TOUCH_EPS_M;
        const xIntA = !atA1 && !atA2, xIntB = !atB1 && !atB2;
        if (xIntA && xIntB) continue; // endpoint-to-endpoint touch
        const ptOf = (pi, i) => (P[pi] && P[pi][i]) || null;
        const crossesLineAt = (P0, P1, P2, L) => {
          if (!P0 || !P2) return false;
          const sa = Math.sign((L.bx - L.ax) * (P0.y - L.ay) - (L.by - L.ay) * (P0.x - L.ax));
          const sb = Math.sign((L.bx - L.ax) * (P2.y - L.ay) - (L.by - L.ay) * (P2.x - L.ax));
          return sa !== 0 && sb !== 0 && sa !== sb;
        };
        let passThrough = false;
        if (xIntA && atB1) passThrough = crossesLineAt(ptOf(B.pi, B.i - 1), { x: B.ax, y: B.ay }, { x: B.bx, y: B.by }, A);
        else if (xIntA && atB2) passThrough = crossesLineAt({ x: B.ax, y: B.ay }, { x: B.bx, y: B.by }, ptOf(B.pi, B.i + 2), A);
        else if (xIntB && atA1) passThrough = crossesLineAt(ptOf(A.pi, A.i - 1), { x: A.ax, y: A.ay }, { x: A.bx, y: A.by }, B);
        else if (xIntB && atA2) passThrough = crossesLineAt({ x: A.ax, y: A.ay }, { x: A.bx, y: A.by }, ptOf(A.pi, A.i + 2), B);
        if (passThrough) rawHits.push({ x, y });
      }
    }
  }
  // cluster hits within 12 m
  rawHits.sort((p, q) => p.x - q.x || p.y - q.y);
  const clusters = [];
  for (const h of rawHits) {
    let placed = false;
    for (const c of clusters) {
      if (Math.hypot(c.x - h.x, c.y - h.y) < 12) { c.hits.push(h); placed = true; break; }
    }
    if (!placed) clusters.push({ x: h.x, y: h.y, hits: [h] });
  }
  const events = clusters.map((c) => ({
    lon: +(c.x / mLon).toFixed(6),
    lat: +(c.y / M_PER_DEG_LAT).toFixed(6),
  }));
  return { crossings: events.length, events };
}

// ---------------------------------------------------------------- state cut
/**
 * Trim the contiguous out-of-TN vertex run at the chain end(s) (little-tennessee/
 * tellico state-cut precedent). which: 'lead' | 'trail' | 'both'. A run is only
 * trimmed when the remaining in-TN run stays >= 5 km (never destroys the in-state
 * water; out-of-state runs of any length at an end are catalog-scope, not geometry).
 */
export function stateCutTN(pts, tnGeom, which = 'both') {
  const inTN = pts.map((p) => ptInGeom(p, tnGeom));
  let lead = 0;
  while (lead < pts.length && !inTN[lead]) lead++;
  let trail = 0;
  while (trail < pts.length && !inTN[pts.length - 1 - trail]) trail++;
  if (lead + trail >= pts.length - 8) return { pts, cutNote: '', lead, trail, skipped: true };
  let from = 0, to = pts.length;
  const notes = [];
  if ((which === 'lead' || which === 'both') && lead > 0) {
    if ((pts.length - lead) * 111 >= 5) { from = lead; notes.push(`state cut at the TN boundary (dropped ${lead}-vertex out-of-state headwater run)`); }
  }
  if ((which === 'trail' || which === 'both') && trail > 0) {
    if ((pts.length - trail) * 111 >= 5) { to = pts.length - trail; notes.push(`state cut at the TN boundary (dropped ${trail}-vertex out-of-state mouth run)`); }
  }
  if (from === 0 && to === pts.length) return { pts, cutNote: notes.join('; '), lead, trail, skipped: true };
  return { pts: pts.slice(from, to), cutNote: notes.join('; '), lead, trail, skipped: false };
}

// ---------------------------------------------------------------- loaders
export function loadCanonical() {
  return JSON.parse(readFileSync(new URL('../../public/atlas/rivers.geojson', import.meta.url), 'utf8'));
}
export function loadRegion() {
  const p = new URL('../../atlas-sources/verified/east-southeast.geojson', import.meta.url);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}
export function loadTNBoundary() {
  return JSON.parse(readFileSync(new URL('../../public/atlas/tn-boundary.geojson', import.meta.url), 'utf8')).features[0].geometry;
}
export function loadTake(key) {
  const p = new URL(`${key}.geojson`, TAKES_DIR);
  return JSON.parse(readFileSync(p, 'utf8'));
}
export function regionFeature(id) {
  const region = loadRegion();
  return region ? region.features.find((f) => f.properties.id === id) ?? null : null;
}
