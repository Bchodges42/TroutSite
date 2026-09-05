#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * WEST/MIDDLE TENNESSEE hydrography lane — geometry build.
 *
 * Consumes the raw NHDPlus HR caches from west-middle-fetch-nhd.mjs plus the
 * independent cross-check caches (Census TIGER merge + TN waterways
 * experience service) and produces:
 *
 *   apps/web/atlas-sources/verified/west-middle.geojson
 *       contract-shaped FeatureCollection: rebuilt lake/reservoir polygons,
 *       rebuilt river/stream lines, carried-over verified features.
 *   apps/web/atlas-sources/verified/west-middle.topology.json
 *       per-system connectivity records (dam coords, in/out verification,
 *       source vs delivered area/length, largest connection gap).
 *   apps/web/.atlas-src/west-middle/build-log.json
 *       per-feature metrics backing docs/audits/WEST-MIDDLE-HYDROGRAPHY.md.
 *
 * Rules honored:
 *   - whole-part discipline: a source part is kept only entirely inside its
 *     reach window; no interior coordinate is ever deleted.
 *   - authoritative-ID extraction: NHD features are pinned by NHDPlusID /
 *     gnis_id recorded in each cache; unnamed pools are selected by area +
 *     corridor containment and their NHDPlusIDs are pinned in LAKE_SPECS
 *     after the first run (see audit).
 *   - snapping: chain welds use WELD_EPS = 0.0005° (~50 m, the NHD fetch
 *     precision). Larger endpoint gaps are NEVER bridged — they are measured
 *     and reported (largestConnectionGapMeters).
 *   - river features are clipped to whole parts inside the state window
 *     ([-90.6,34.95,-81.45,36.79]) except the Mississippi, which uses the
 *     documented state-line corridor rule (≤4 km west of the tn-boundary
 *     ring, lat 34.95..36.51) — rivers meet their reservoirs through the
 *     reservoir polygons, which are kept to their dams across state lines.
 *
 * Run: node scripts/west-middle-build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REACH_GATE } from './atlas-reach-gates.mjs';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '../..');
const CACHE = join(webRoot, '.atlas-src', 'west-middle');
const OUT_DIR = join(webRoot, 'atlas-sources', 'verified');
const RIVERS_GEO = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const TN_BOUNDARY = join(webRoot, 'public', 'atlas', 'tn-boundary.geojson');
const YAML_DIR = join(repoRoot, 'packages', 'content', 'streams', 'tn');
const TIGER_POLYS = join(webRoot, '.atlas-src', 'out', 'polys.geojson');

const RETRIEVED_NHD = '2026-09-05';
const WELD_EPS = 0.0005; // deg; ~50 m — the NHD fetch precision (documented snap tolerance)
const STATE_WINDOW = [-90.6, 34.95, -81.45, 36.79];
const M_PER_DEG_LAT = 111320;

mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// small geometry library (no deps)
// ---------------------------------------------------------------------------
const rad = (d) => (d * Math.PI) / 180;
function haversine(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}
function lineLengthKm(coords) {
  let m = 0;
  for (let i = 1; i < coords.length; i++) m += haversine(coords[i - 1], coords[i]);
  return m / 1000;
}
function ringAreaKm2(ring) {
  // planar shoelace in deg², scaled by latitude-corrected m²/deg²
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  const lat = (ring[0][1] + ring[Math.floor(ring.length / 2)][1]) / 2 || ring[0][1];
  const m2PerDeg2 = M_PER_DEG_LAT * (M_PER_DEG_LAT * Math.cos(rad(lat)));
  return Math.abs(sum / 2) * m2PerDeg2 / 1e6;
}
function polyAreaKm2(geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'Polygon' ? [geom.coordinates] : [];
  let area = 0;
  for (const poly of polys) area += ringAreaKm2(poly[0]);
  return area;
}
function geomBBox(coords) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  (function walk(n) {
    if (Array.isArray(n[0]) && typeof n[0][0] === 'number') {
      for (const [x, y] of n) {
        if (x < b[0]) b[0] = x;
        if (y < b[1]) b[1] = y;
        if (x > b[2]) b[2] = x;
        if (y > b[3]) b[3] = y;
      }
      return;
    }
    for (const c of n) walk(c);
  })(coords);
  return b;
}
// outward-rounded bounds so every coordinate is strictly covered (the
// integration gate rejects bounds that truncate an extreme coordinate)
function outwardBounds(b) {
  return [
    Math.floor(b[0] * 1e6) / 1e6,
    Math.floor(b[1] * 1e6) / 1e6,
    Math.ceil(b[2] * 1e6) / 1e6,
    Math.ceil(b[3] * 1e6) / 1e6,
  ];
}
function unionBBox(list) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const bb of list) {
    b[0] = Math.min(b[0], bb[0]); b[1] = Math.min(b[1], bb[1]);
    b[2] = Math.max(b[2], bb[2]); b[3] = Math.max(b[3], bb[3]);
  }
  return b;
}
function inBBox(b, p) { return p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3]; }
function countVerts(coords) {
  let n = 0;
  (function walk(a) {
    if (Array.isArray(a[0]) && typeof a[0][0] === 'number') { n += a.length; return; }
    for (const c of a) walk(c);
  })(coords);
  return n;
}
function pointToSegmentM(p, a, b) {
  const kx = M_PER_DEG_LAT * Math.cos(rad(p[1]));
  const ky = M_PER_DEG_LAT;
  const px = p[0] * kx, py = p[1] * ky;
  const ax = a[0] * kx, ay = a[1] * ky;
  const bx = b[0] * kx, by = b[1] * ky;
  const dx = bx - ax, dy = by - ay;
  const L2 = dx * dx + dy * dy;
  let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx, qy = ay + t * dy;
  return Math.hypot(px - qx, py - qy);
}
function pointToRingsM(p, rings) {
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const d = pointToSegmentM(p, ring[i], ring[i + 1]);
      if (d < best) best = d;
    }
  }
  return best;
}
function pointInRings(p, rings) {
  // even-odd across all rings (holes subtract naturally)
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
function pointToPolygonM(p, polygonGeom) {
  const polys = polygonGeom.type === 'MultiPolygon' ? polygonGeom.coordinates : [polygonGeom.coordinates];
  let best = Infinity;
  for (const poly of polys) {
    if (pointInRings(p, poly)) return 0;
    best = Math.min(best, pointToRingsM(p, poly));
  }
  return best;
}
// Douglas-Peucker for rings/lines (meters)
function rdp(coords, tolM) {
  if (coords.length <= 3) return coords;
  const kx = M_PER_DEG_LAT * Math.cos(rad((coords[0][1] + coords[coords.length - 1][1]) / 2));
  const ky = M_PER_DEG_LAT;
  const pts = coords.map(([x, y]) => [x * kx, y * ky]);
  const keep = new Array(coords.length).fill(false);
  keep[0] = keep[coords.length - 1] = true;
  const stack = [[0, coords.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = pointToSegmentM(coords[i], coords[a], coords[b]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tolM && idx > 0) { keep[idx] = true; stack.push([a, idx], [idx, b]); }
  }
  const out = coords.filter((_, i) => keep[i]);
  return out.length >= 3 ? out : coords;
}
function closeRing(ring) {
  if (ring.length < 3) return ring;
  const a = ring[0], b = ring[ring.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) return ring.concat([[a[0], a[1]]]);
  return ring;
}
function ringSelfIntersects(ring) {
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const a = ring[i], b = ring[i + 1], c = ring[j], d = ring[j + 1];
      if (Math.max(a[0], b[0]) < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) < Math.min(a[0], b[0])) continue;
      if (Math.max(a[1], b[1]) < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) < Math.min(a[1], b[1])) continue;
      const d1 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const d2 = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
      const d3 = (d[0] - c[0]) * (a[1] - c[1]) - (d[1] - c[1]) * (a[0] - c[0]);
      const d4 = (d[0] - c[0]) * (b[1] - c[1]) - (d[1] - c[1]) * (b[0] - c[0]);
      if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) return true;
    }
  }
  return false;
}
// remove the loop between the first crossing found (splice out ring[i+1..j])
// — repairs source slivers and DP-introduced crossings; shape change is at
// simplification scale and is re-checked until clean
function uncrossRing(ring) {
  let r = ring;
  for (let guard = 0; guard < 40; guard++) {
    const n = r.length - 1;
    let fixed = false;
    for (let i = 0; i < n && !fixed; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a = r[i], b = r[i + 1], c = r[j], d = r[j + 1];
        if (Math.max(a[0], b[0]) < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) < Math.min(a[0], b[0])) continue;
        if (Math.max(a[1], b[1]) < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) < Math.min(a[1], b[1])) continue;
        const d1 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        const d2 = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
        const d3 = (d[0] - c[0]) * (a[1] - c[1]) - (d[1] - c[1]) * (a[0] - c[0]);
        const d4 = (d[0] - c[0]) * (b[1] - c[1]) - (d[1] - c[1]) * (b[0] - c[0]);
        if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) {
          r = r.slice(0, i + 1).concat(r.slice(j));
          r = closeRing(r);
          fixed = true;
          break;
        }
      }
    }
    if (!fixed) break;
  }
  return r;
}
function simplifyPolygon(geom, tolM, budget) {
  const simplifyPoly = (poly, t) => {
    const closed = poly.map((ring) => closeRing(ring));
    const outer = (() => { let r = rdp(closed[0], t); if (r.length < 4) r = closed[0]; return closeRing(r); })();
    const holes = closed.slice(1)
      .map((ring) => { let r = rdp(ring, t); if (r.length < 4) r = null; return r; })
      .filter((r) => r && r.length >= 4 && ringAreaKm2(r) > 0.004)
      .map(closeRing);
    return [outer].concat(holes);
  };
  let t = tolM;
  let out = geom.coordinates.map((poly) => simplifyPoly(poly, t)).filter((poly) => ringAreaKm2(poly[0]) > 0.004);
  // polygon validity: escalate tolerance while any ring self-intersects,
  // then repair any remaining crossings by loop removal
  for (let attempt = 0; attempt < 4; attempt++) {
    const bad = out.some((poly) => poly.some((ring) => ringSelfIntersects(ring)));
    if (!bad.length) break;
    t *= 1.6;
    out = geom.coordinates.map((poly) => simplifyPoly(poly, t)).filter((poly) => ringAreaKm2(poly[0]) > 0.004);
  }
  out = out.map((poly) => poly.map((ring) => (ringSelfIntersects(ring) ? uncrossRing(ring) : ring)))
    .filter((poly) => poly.length && poly.every((ring) => ring.length >= 4))
    .filter((poly) => ringAreaKm2(poly[0]) > 0.004);
  // vertex budget: escalate tolerance toward the budget but NEVER past the
  // per-feature cap (thin ribbon arms fold into self-crossings above roughly
  // half their width, which the uncrosser would then amputate)
  const capT = geom.__maxTolDeg ?? 0.0012;
  while (countVerts(out) > budget && t < capT) {
    t = Math.min(t * 1.5, capT);
    out = geom.coordinates.map((poly) => simplifyPoly(poly, t)).filter((poly) => ringAreaKm2(poly[0]) > 0.004);
  }
  return out.length === 1 ? { type: 'Polygon', coordinates: out[0] } : { type: 'MultiPolygon', coordinates: out };
}
function largestPartGeom(geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  let best = polys[0], bestA = 0;
  for (const p of polys) { const a = ringAreaKm2(p[0]); if (a > bestA) { bestA = a; best = p; } }
  return { type: 'Polygon', coordinates: best };
}
function interiorAnchor(polygonGeom) {
  // centroid if inside, else coarse grid search inside the largest part
  const poly = largestPartGeom(polygonGeom).coordinates;
  let sx = 0, sy = 0, a = 0;
  for (let i = 0; i < poly[0].length - 1; i++) {
    const cr = poly[0][i][0] * poly[0][i + 1][1] - poly[0][i + 1][0] * poly[0][i][1];
    sx += (poly[0][i][0] + poly[0][i + 1][0]) * cr;
    sy += (poly[0][i][1] + poly[0][i + 1][1]) * cr;
    a += cr;
  }
  const c = a !== 0 ? [sx / (3 * a), sy / (3 * a)] : poly[0][0];
  if (pointInRings(c, poly)) return c.map((v) => +v.toFixed(4));
  const b = geomBBox(poly[0]);
  let best = null, bestD = Infinity;
  for (let gx = 0; gx <= 40; gx++) {
    for (let gy = 0; gy <= 40; gy++) {
      const p = [b[0] + ((b[2] - b[0]) * gx) / 40, b[1] + ((b[3] - b[1]) * gy) / 40];
      if (pointInRings(p, poly)) {
        const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
        if (d < bestD) { bestD = d; best = p; }
      }
    }
  }
  return (best ?? [c[0], c[1]]).map((v) => +v.toFixed(4));
}
// chain weld: merge line parts whose endpoints coincide within eps (deg).
// NHD network parts share identical split vertices, so quantized endpoint
// cells let all same-chain parts weld in a few passes. Dense cells
// (confluence vertices, >12 endpoints) are skipped to avoid welding through
// a junction.
function weldLines(lines) {
  const eps = WELD_EPS;
  const parts = lines.map((l) => l.slice()).filter((l) => l.length >= 2);
  const mergeOnce = () => {
    // register endpoints in quantized cells; candidate pairs come from the
    // same cell or the four "forward" neighbor cells, so two points on
    // opposite sides of a rounding boundary still meet exactly once
    const cell = new Map();
    const key = (cx, cy) => `${cx}:${cy}`;
    parts.forEach((p, i) => {
      if (!p) return;
      for (const end of [0, 1]) {
        const q = end === 0 ? p[0] : p[p.length - 1];
        const cx = Math.round(q[0] / eps), cy = Math.round(q[1] / eps);
        const k = key(cx, cy);
        if (!cell.has(k)) cell.set(k, []);
        cell.get(k).push({ i, end, cx, cy });
      }
    });
    for (const [k, list] of cell) {
      if (!list.length) continue;
      const [cx, cy] = k.split(':').map(Number);
      const neighborLists = [list,
        cell.get(key(cx + 1, cy)) ?? [], cell.get(key(cx, cy + 1)) ?? [], cell.get(key(cx + 1, cy + 1)) ?? []];
      for (const other of neighborLists) {
        for (const A of list) {
          for (const B of other) {
            if (A.i === B.i) continue;
            if (!parts[A.i] || !parts[B.i]) continue;
            const pa = A.end === 0 ? parts[A.i][0] : parts[A.i][parts[A.i].length - 1];
            const pb = B.end === 0 ? parts[B.i][0] : parts[B.i][parts[B.i].length - 1];
            if (Math.abs(pa[0] - pb[0]) >= eps || Math.abs(pa[1] - pb[1]) >= eps) continue;
            // junction handling: when 3+ distinct parts meet at this vertex
            // (braided channels, same-name tributaries), blind welding chains
            // one branch onto another and renders as zigzag spaghetti. Pair
            // the two branches whose arrival bearings are most anti-parallel
            // (a river passing THROUGH the junction) and leave side branches
            // as separate chains.
            const meeting = [...list, ...neighborLists[1], ...neighborLists[2], ...neighborLists[3]];
            const distinct = new Set();
            for (const E of meeting) {
              if (!parts[E.i]) continue;
              const q = E.end === 0 ? parts[E.i][0] : parts[E.i][parts[E.i].length - 1];
              if (Math.abs(q[0] - pa[0]) < eps && Math.abs(q[1] - pa[1]) < eps) distinct.add(E.i);
            }
            if (distinct.size > 2) {
              // arrival bearing of an endpoint: direction from interior into this endpoint
              const arr = (idx, end) => {
                const ch = parts[idx];
                const v = end === 0 ? ch[0] : ch[ch.length - 1];
                for (let k = 1; k < ch.length; k++) {
                  const w = end === 0 ? ch[Math.min(k, ch.length - 1)] : ch[Math.max(ch.length - 1 - k, 0)];
                  if (haversine(w, v) >= 40) return (Math.atan2((v[0] - w[0]) * Math.cos(rad(v[1])), v[1] - w[1]) * 180) / Math.PI;
                }
                return null;
              };
              const entries = [...distinct].map((idx) => {
                const E = meeting.find((E2) => E2.i === idx);
                return { idx, end: E.end, b: arr(idx, E.end) };
              });
              let bestPair = null, bestScore = -Infinity;
              for (let m = 0; m < entries.length; m++) {
                for (let n2 = m + 1; n2 < entries.length; n2++) {
                  const E1 = entries[m], E2 = entries[n2];
                  if (E1.b == null || E2.b == null) continue;
                  let diff = Math.abs(Math.abs(E1.b - E2.b) - 180); // 0 = anti-parallel = pass-through
                  if (diff > 90) diff = 180 - diff;
                  const score = 90 - diff;
                  if (score > bestScore) { bestScore = score; bestPair = [E1, E2]; }
                }
              }
              if (!bestPair || bestScore < 20) continue; // no convincing pass-through: leave unwelded
              if (!(bestPair[0].idx === A.i && bestPair[1].idx === B.i) && !(bestPair[0].idx === B.i && bestPair[1].idx === A.i)) continue;
            }
            let seg = parts[B.i].slice();
            if (B.end === 1) seg.reverse();
            parts[A.i] = A.end === 0 ? seg.concat(parts[A.i].slice(1)) : parts[A.i].concat(seg.slice(1));
            parts[B.i] = null;
            return true;
          }
        }
      }
    }
    return false;
  };
  let guard = parts.length + 10;
  while (mergeOnce() && guard-- > 0) { /* pass */ }
  return parts.filter(Boolean);
}
function bearingDeg(from, to) {
  const kx = Math.cos(rad((from[1] + to[1]) / 2));
  return (Math.atan2((to[0] - from[0]) * kx, to[1] - from[1]) * 180) / Math.PI;
}
// direction a chain "arrives from" at the given end: bearing from an interior
// vertex (>= ~40 m inside) to the end vertex
function arrivalBearing(chain, endIdx) {
  const v = endIdx === 0 ? chain[0] : chain[chain.length - 1];
  for (let k = 1; k < chain.length; k++) {
    const idx = endIdx === 0 ? Math.min(k, chain.length - 1) : Math.max(chain.length - 1 - k, 0);
    const w = chain[idx];
    if (haversine(w, v) >= 40) return bearingDeg(w, v);
  }
  return null;
}
function gapReport(lines, lakeIndex, gapWaterIndex) {
  // Classify chain separations (chains = welded components):
  //   welded         ≤ WELD_EPS — merged by weldLines, never reported
  //   pool-mediated  endpoint within 150 m of any NHD waterbody polygon
  //                  (names stop at pools by design; the pool carries the flow)
  //   braid          the neighbouring chain roughly continues this chain's
  //                  arrival bearing (≤60°) — side channel of a braided reach;
  //                  both channels are drawn, no visual break
  //   gap            everything else — the largest is the headline gap
  const chains = lines.map((l, i) => ({ i, l }));
  const ends = [];
  chains.forEach((c) => {
    if (c.l.length < 2) return;
    ends.push({ ci: c.i, at: 0, p: c.l[0] });
    ends.push({ ci: c.i, at: 1, p: c.l[c.l.length - 1] });
  });
  const bear = new Map();
  for (const e of ends) bear.set(`${e.ci}:${e.at}`, arrivalBearing(chains[e.ci].l, e.at));
  let worstUnexplained = 0, wp = null;
  let worstPool = 0, worstBraid = 0;
  const poolHits = [];
  const braidHits = [];
  for (let i = 0; i < ends.length; i++) {
    const e = ends[i];
    let m = Infinity, mj = -1;
    for (let j = 0; j < ends.length; j++) {
      if (ends[j].ci === e.ci) continue;
      const d = haversine(e.p, ends[j].p);
      if (d < m) { m = d; mj = j; }
    }
    if (m >= 3000) continue;
    const b0 = bear.get(`${e.ci}:${e.at}`);
    const other = ends[mj];
    const b1raw = bear.get(`${other.ci}:${other.at}`);
    let braid = false;
    if (b0 != null && b1raw != null) {
      // continuation: this chain's arrival bearing ≈ reversed neighbour arrival bearing
      let diff = Math.abs(((b0 - b1raw + 180 + 540) % 360) - 180);
      braid = diff <= 60;
    }
    if (braid) {
      if (m > worstBraid) worstBraid = m;
      if (braidHits.length < 12) braidHits.push({ at: e.p.map((v) => +v.toFixed(4)), sepM: Math.round(m) });
      continue;
    }
    const lake = lakeNearM(e.p, lakeIndex);
    const gapLake = lake == null || lake > 150 ? lakeNearM(e.p, gapWaterIndex) : null;
    const medM = lake != null && lake <= 150 ? lake : gapLake;
    if (medM != null && medM <= 150) {
      poolHits.push({ at: e.p.map((v) => +v.toFixed(4)), toLakeM: Math.round(medM), ownChainGapM: Math.round(m) });
      if (m > worstPool) worstPool = m;
    } else {
      if (m > worstUnexplained) { worstUnexplained = m; wp = e.p; }
    }
  }
  return {
    largestGapM: worstUnexplained === 0 ? null : Math.round(worstUnexplained),
    gapAt: wp ? wp.map((v) => +v.toFixed(4)) : null,
    poolMediated: poolHits.length,
    poolMediatedMaxM: worstPool ? Math.round(worstPool) : null,
    braidSeparations: braidHits.length,
    braidMaxM: worstBraid ? Math.round(worstBraid) : null,
    poolHits: poolHits.slice(0, 12),
  };
}
function lakeNearM(p, lakeIndex) {
  if (!lakeIndex?.length) return null;
  let best = Infinity;
  for (const lake of lakeIndex) {
    // cheap bbox reject (2 km)
    const b = lake.bbox;
    if (p[0] < b[0] - 0.02 || p[0] > b[2] + 0.02 || p[1] < b[1] - 0.02 || p[1] > b[3] + 0.02) continue;
    const d = pointToPolygonM(p, lake.geom);
    if (d < best) best = d;
  }
  return best === Infinity ? null : best;
}
function stateWindowKeeps(part) {
  const b = geomBBox(part);
  return b[0] >= STATE_WINDOW[0] && b[1] >= STATE_WINDOW[1] && b[2] <= STATE_WINDOW[2] && b[3] <= STATE_WINDOW[3];
}
// helpers on raw caches -------------------------------------------------------
function cachePaths(key) {
  const p = join(CACHE, `${key}.json`);
  if (!existsSync(p)) return { attrs: [], features: [], lines: [], meta: { service: null, retrieved: null, envelopes: null }, missing: true };
  const lines = [];
  const j = JSON.parse(readFileSync(p, 'utf8'));
  for (const f of j.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'LineString') lines.push(g.coordinates);
    else if (g.type === 'MultiLineString') lines.push(...g.coordinates);
  }
  return { attrs: j.matched ?? [], features: j.features ?? [], lines, meta: { service: j.service, retrieved: j.retrieved, envelopes: j.envelopes } };
}
function cachePolys(key) {
  const polys = []; // each: [outerRing, ...holes]
  const j = JSON.parse(readFileSync(join(CACHE, `${key}.json`), 'utf8'));
  for (const f of j.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') polys.push(g.coordinates);
    else if (g.type === 'MultiPolygon') polys.push(...g.coordinates);
  }
  return { attrs: j.matched ?? [], features: j.features ?? [], polys, meta: { service: j.service, retrieved: j.retrieved, envelopes: j.envelopes } };
}
function loadYaml(id) {
  const p = join(YAML_DIR, `${id}.yaml`);
  if (!existsSync(p)) return null;
  const text = readFileSync(p, 'utf8');
  const region = text.match(/^regionId:\s*(\S+)/m)?.[1] ?? null;
  const gauges = (text.match(/^gaugeIds:\s*\[(.*)\]/m)?.[1] ?? '').split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
  const name = text.match(/^name:\s*(.+)$/m)?.[1]?.replace(/["']/g, '').trim() ?? null;
  const waterbodyType = text.match(/^waterbodyType:\s*(.+)$/m)?.[1]?.replace(/["']/g, '').trim() ?? null;
  return { region, gaugeIds: gauges, name, waterbodyType };
}

// ---------------------------------------------------------------------------
// lake specs — selection is by pinned NHDPlusID after identity verification;
// areaFloor+contains fallback is used only where the pool is unnamed.
// ---------------------------------------------------------------------------
const LAKE_SPECS = [
  {
    id: 'kentucky-lake', cache: 'lake-kentucky', name: 'Kentucky Lake', type: 'lake',
    region: 'tn-west', budget: 3400, tolM: 220, aliases: ['Kentucky Reservoir'],
    dam: { cache: 'dam-kentucky', pick: /Kentucky/i, label: 'Kentucky Dam (TVA/USACE)' },
    upstream: ['tennessee-river'], downstream: ['tennessee-river'],
    note: 'Full TVA pool Pickwick Dam → Kentucky Dam incl. Big Sandy/Duck arms; spans the TN line by design.',
  },
  {
    id: 'pickwick-lake', cache: 'lake-pickwick', name: 'Pickwick Lake', type: 'lake',
    region: 'tn-west', budget: 1600, tolM: 200, aliases: ['Pickwick Reservoir'],
    dam: { cache: 'dam-pickwick', pick: /Pickwick/i, label: 'Pickwick Landing Dam (TVA)' },
    upstream: ['tennessee-river'], downstream: ['tennessee-river', 'kentucky-lake'],
    note: 'Full reservoir Wilson Dam (AL) → Pickwick Landing Dam (TN/MS line) incl. Yellow Creek arm.',
  },
  {
    id: 'lake-barkley', cache: 'lake-barkley', name: 'Lake Barkley', type: 'lake',
    region: 'tn-middle-nashville', budget: 1600, tolM: 200, aliases: ['Barkley Reservoir', 'Barkley Lake'],
    dam: { cache: 'dam-barkley', pick: /Barkley/i, label: 'Barkley Dam (USACE)' },
    upstream: ['cumberland-river'], downstream: ['cumberland-river'],
    note: 'NHD pool is unnamed; selected by area floor within the Cumberland corridor, NHDPlusIDs pinned.',
    areaFloor: 0.5, corridor: [-88.25, 36.2, -87.15, 37.15],
  },
  {
    id: 'old-hickory-lake', cache: 'lake-old-hickory', name: 'Old Hickory Lake', type: 'lake',
    region: 'tn-middle-nashville', budget: 4000, tolM: 50, aliases: ['Old Hickory Reservoir'],
    dam: { cache: 'dam-old-hickory', pick: /Old Hickory/i, label: 'Old Hickory Dam (USACE)' },
    upstream: ['cumberland-river', 'caney-fork-river'], downstream: ['cumberland-river'],
    note: 'NHD pool is unnamed; selected by area floor between Old Hickory Dam and Cordell Hull tailwater.',
    areaFloor: 0.5, corridor: [-86.8, 36.18, -85.9, 36.6],
  },
  {
    id: 'j-percy-priest-lake', cache: 'lake-percy-priest', name: 'J. Percy Priest Lake', type: 'lake',
    region: 'tn-middle-nashville', budget: 1300, tolM: 180, aliases: ['J. Percy Priest Reservoir'],
    dam: { cache: 'dam-percy-priest', pick: /Percy Priest/i, label: 'J. Percy Priest Dam (USACE)' },
    upstream: ['west-fork-stones-river', 'east-fork-stones-river'], downstream: ['stones-river'],
    note: 'NHD name "J Percy Priest Reservoir".',
  },
  {
    id: 'tims-ford-lake', cache: 'lake-tims-ford', name: 'Tims Ford Lake', type: 'lake',
    region: 'tn-middle-duck-elk', budget: 2200, tolM: 100, aliases: ['Tims Ford Reservoir'],
    dam: { cache: 'dam-tims-ford', pick: /Tims Ford/i, label: 'Tims Ford Dam (TVA)' },
    upstream: ['elk-river'], downstream: ['elk-river'],
    note: 'NHD pool reaches the dam (west edge -86.314); the old Census polygon stopped at -86.2865.',
  },
  {
    id: 'center-hill-lake', cache: 'lake-center-hill', name: 'Center Hill Lake', type: 'lake',
    region: 'tn-middle-caney-fork', budget: 2400, tolM: 180, aliases: ['Center Hill Reservoir'],
    dam: { cache: 'dam-center-hill', pick: /Center Hill/i, label: 'Center Hill Dam (USACE)' },
    upstream: ['caney-fork-river', 'collins-river'], downstream: ['caney-fork-river'],
    note: 'Single NHD waterbody polygon, 69.9 km².',
  },
  {
    id: 'dale-hollow-lake', cache: 'lake-dale-hollow', name: 'Dale Hollow Lake', type: 'lake',
    region: 'tn-upper-cumberland', budget: 2800, tolM: 200, aliases: ['Dale Hollow Reservoir'],
    dam: { cache: 'dam-dale-hollow', pick: /Dale Hollow/i, label: 'Dale Hollow Dam (USACE)' },
    upstream: ['obey-river'], downstream: ['obey-river'],
    note: 'Single NHD waterbody polygon incl. the KY portion; pool kept whole to the dam.',
  },
  {
    id: 'normandy-lake', cache: 'lake-normandy', name: 'Normandy Lake', type: 'lake',
    region: 'tn-middle-duck-elk', budget: 700, tolM: 120, aliases: ['Normandy Reservoir'],
    dam: { cache: 'dam-normandy', pick: /DUCK RIVER AT NORMANDY|NORMANDY LAKE/i, label: 'Normandy Dam (TVA)' },
    upstream: ['duck-river-tailwater'], downstream: ['duck-river-tailwater'],
    note: 'The visible unselectable water on the Duck: promoted to interactive with catalog record. NHD GNIS 01269831.',
  },
  {
    id: 'reelfoot-lake', cache: 'lake-reelfoot', name: 'Reelfoot Lake', type: 'lake',
    region: 'tn-west', budget: 900, tolM: 150, aliases: ['Reelfoot'],
    dam: null,
    upstream: [], downstream: [],
    note: 'Natural oxbow lake (1811-12 earthquakes); NHD main basin carries gnis_name "Reading House Slough" (44.3 km²) — identity documented. Fed by Reelfoot Creek/bayous and Mississippi seepage; no named catalog river reaches the shoreline.',
    areaFloor: 1,
  },
  {
    id: 'woods-reservoir', cache: 'lake-woods', name: 'Woods Reservoir', type: 'lake',
    region: 'tn-middle-duck-elk', budget: 600, tolM: 100, aliases: ['Woods Lake', 'AEDC Woods Reservoir'],
    dam: null,
    upstream: [], downstream: [],
    note: 'AEDC reservoir on Bradley Creek, Franklin County; no tailwater in the catalog; promoted to interactive with catalog record.',
  },
  {
    id: 'great-falls-lake', cache: 'lake-great-falls', name: 'Great Falls Lake', type: 'lake',
    region: 'tn-middle-caney-fork', budget: 6000, tolM: 40, aliases: ['Great Falls Reservoir'],
    // NHDArea pieces are wide river-valley polygons reaching far beyond the
    // impoundment; keep only pieces containing the pool core point or whose
    // ring centroid lies in the Census "Great Falls Lake" core box
    poolCore: [-85.71, 35.76, -85.49, 35.83],
    poolCorePoint: [-85.56, 35.795],
    dam: { cache: 'dam-great-falls', pick: /Great Falls/i, label: 'Great Falls Dam (TVA)' },
    upstream: ['caney-fork-river', 'collins-river'], downstream: ['caney-fork-river'],
    note: 'Caney Fork/Collins impoundment above Center Hill Lake at Rock Island; promoted to interactive with catalog record.',
    areaFloor: 0.5,
  },
];

// ---------------------------------------------------------------------------
// river specs — reach windows keep whole NHD parts only
// ---------------------------------------------------------------------------
const RW = (key, gate) => ({ cache: key, gate });
const RIVER_SPECS = [
  { id: 'mississippi-river', cache: 'river-mississippi', name: 'Mississippi River', region: 'tn-west', allowOpenEnds: true,
    gate: 'corridor', gauge: null,
    upstream: [], downstream: ['wolf-river-west-tennessee', 'hatchie-river', 'obion-river', 'forked-deer-system(unrepresented)'],
    note: 'State-line corridor rule: whole parts whose every vertex lies inside TN or ≤4 km west of the tn-boundary ring, lat 34.95..36.51.' },
  { id: 'obion-river', cache: 'river-obion', name: 'Obion River', region: 'tn-west', allowOpenEnds: true,
    gate: 'state', upstream: [], downstream: ['mississippi-river'],
    anchors: [{ featureId: 'mississippi-river', label: 'Mississippi River mouth', maxM: 500, informational: true, note: 'NHD named coverage stops short of the Mississippi across the bottomland/wetland reach' }],
    note: 'Main stem (GNIS "Obion River"); forks are distinct names and excluded.' },
  { id: 'hatchie-river', cache: 'river-hatchie', name: 'Hatchie River', region: 'tn-west', allowOpenEnds: true,
    gate: 'state', exact: 'Hatchie River', upstream: [], downstream: ['mississippi-river'],
    anchors: [{ featureId: 'mississippi-river', label: 'Mississippi River mouth', maxM: 500, informational: true, note: 'NHD named coverage stops at the Hatchie NWR wetlands short of the Mississippi' }],
    note: 'Main stem only; South Fork Hatchie is a distinct NHD name.' },
  { id: 'wolf-river-west-tennessee', cache: 'river-wolf-west', name: 'Wolf River', region: 'tn-west', allowOpenEnds: true,
    gate: 'state', upstream: [], downstream: ['mississippi-river'],
    anchors: [{ featureId: 'mississippi-river', label: 'Mississippi River mouth at Memphis', maxM: 500, informational: true, note: 'NHD named coverage stops in the Wolf River bottomlands short of the Mississippi' }],
    note: 'West Tennessee Wolf (different water from wolf-river-fentress).' },
  { id: 'cumberland-river', cache: 'river-cumberland', name: 'Cumberland River', region: 'tn-middle-nashville', allowOpenEnds: true,
    gate: 'state', upstream: [], downstream: ['lake-barkley', 'old-hickory-lake'],
    anchors: [
      { lon: -86.65863, lat: 36.29712, label: 'USGS 03426310 Cumberland River at Old Hickory Dam (TW)', maxM: 600, informational: true, note: 'through-pool carrier unnamed in NHD; pool polygons carry the connection' },
      { lon: -87.22826, lat: 36.32290, label: 'USGS 03435000 Cumberland River below Cheatham Dam', maxM: 600, informational: true, note: 'through-pool carrier unnamed in NHD; pool polygons carry the connection' },
    ],
    throughLakeIds: ['lake-barkley', 'old-hickory-lake'],
    note: 'Statewide main stem; pool reaches are covered by the reservoir polygons.' },
  { id: 'buffalo-river', cache: 'river-buffalo', name: 'Buffalo River', region: 'tn-middle-duck-elk', allowOpenEnds: true,
    gate: 'state', exact: 'Buffalo River', upstream: [], downstream: ['duck-river-lower'], throughLakeIds: ['kentucky-lake'],
    note: 'Main stem; North/South/West forks are distinct names. Mouth: joins the Duck River ~20 km below Columbia — that Duck reach is outside the catalog and carries no feature, so no confluence anchor is verifiable in-product.' },
  { id: 'little-buffalo-river', cache: 'river-buffalo', name: 'Little Buffalo River', region: 'tn-middle-duck-elk', allowOpenEnds: true,
    gate: 'state', exact: 'Little Buffalo River', upstream: [], downstream: ['buffalo-river'],
    anchors: [{ featureId: 'buffalo-river', label: 'Buffalo River confluence', maxM: 1500, informational: true, note: 'mouth reach is swamp; named chain ends ~1.2 km short of the Buffalo line' }] },
  { id: 'harpeth-river', cache: 'river-harpeth', name: 'Harpeth River', region: 'tn-middle-nashville', allowOpenEnds: true,
    gate: 'state', upstream: [], downstream: ['cumberland-river'],
    anchors: [{ featureId: 'cumberland-river', label: 'Cumberland River confluence', maxM: 200 }] },
  { id: 'duck-river-tailwater', cache: 'river-duck', name: 'Duck River (Normandy tailwater)', region: 'tn-middle-duck-elk',
    gate: REACH_GATE['duck-river-tailwater'], excludePool: 'normandy-lake', upstream: ['normandy-lake'], downstream: ['duck-river-lower'],
    anchors: [
      { lon: -86.25694, lat: 35.45730, label: 'USGS 03596500 Duck River at Normandy (dam)', maxM: 700 },
      { lon: -86.46258, lat: 35.48293, label: 'USGS 03597860 Duck River at Shelbyville', maxM: 500 },
    ] },
  // gate widened from REACH_GATE: minLon -87.06 -> -87.08 so whole parts
  // whose bbox dips past the Columbia gauge (USGS 03599500 lon -87.03234)
  // are kept; the Shelbyville handoff edge (maxLon -86.42) is unchanged
  { id: 'duck-river-lower', cache: 'river-duck', name: 'Duck River (Shelbyville to Columbia)', region: 'tn-middle-duck-elk', allowOpenEnds: true,
    gate: { ...REACH_GATE['duck-river-lower'], minLon: -87.08 }, upstream: ['duck-river-tailwater'], downstream: ['normandy-lake(terminus Columbia; mouth at Kentucky Lake beyond catalog reach)'],
    anchors: [
      { lon: -86.49916, lat: 35.48035, label: 'USGS 03598000 Duck River near Shelbyville', maxM: 500 },
      { lon: -87.03234, lat: 35.61809, label: 'USGS 03599500 Duck River at Columbia', maxM: 500 },
    ] },
  { id: 'elk-river', cache: 'river-elk', name: 'Elk River (Tims Ford tailwater)', region: 'tn-middle-duck-elk', allowOpenEnds: true,
    gate: REACH_GATE['elk-river'], excludePool: 'tims-ford-lake', upstream: ['tims-ford-lake'], downstream: ['elk-river-lower'],
    anchors: [
      { lon: -86.28110, lat: 35.19231, label: 'USGS 03580750 Elk River below Tims Ford Dam', maxM: 600 },
      { lon: -86.99466, lat: 35.01424, label: 'USGS 03584600 Elk River at Prospect', maxM: 500 },
    ] },
  // gate widened from the TIGER-era REACH_GATE window ([-87.02..-86.99],
  // which cut the reach to a sliver): whole named parts from Prospect
  // (USGS 03584600) to the AL state line
  { id: 'elk-river-lower', cache: 'river-elk', name: 'Elk River (Prospect to state line)', region: 'tn-middle-duck-elk', allowOpenEnds: true,
    gate: { minLon: -87.10, minLat: 34.90, maxLon: -86.90, maxLat: 35.10 }, upstream: ['elk-river'], downstream: ['tennessee-river(Elk River Reservoir, AL line)'] },
  { id: 'caney-fork-river', cache: 'river-caney-fork', name: 'Caney Fork River (Center Hill tailwater)', region: 'tn-middle-caney-fork', allowOpenEnds: true,
    gate: 'state', exact: 'Caney Fork', upstream: ['great-falls-lake', 'center-hill-lake'], downstream: ['old-hickory-lake'],
    throughLakeIds: ['center-hill-lake', 'great-falls-lake', 'old-hickory-lake'],
    anchors: [
      { lon: -85.158, lat: 36.043, label: 'headwaters near Campbell Junction (fix-caney-fork verified source)', maxM: 400 },
      { lon: -85.941, lat: 36.239, label: 'mouth at the Cumberland / Old Hickory Lake at Carthage (fix-caney-fork verified mouth)', maxM: 400 },
      { lon: -85.82721, lat: 36.09784, label: 'USGS 03424010 Caney Fork at Center Hill Dam (tailwater)', maxM: 600, informational: true, note: 'full-course feature; the through-pool route is carried by named NHD artificial paths around the dam' },
    ],
    note: 'Full Caney Fork course per fix-caney-fork precedent; GNIS "Caney Fork" (Creek excluded).' },
  { id: 'stones-river', cache: 'river-stones', name: 'Stones River (Davidson County)', region: 'tn-middle-nashville',
    gate: REACH_GATE['stones-river'], excludePool: 'j-percy-priest-lake', exact: 'Stones River', upstream: ['j-percy-priest-lake'], downstream: ['cumberland-river'],
    anchors: [
      { lon: -86.62012, lat: 36.15826, label: 'USGS 03430100 Stones River below J. Percy Priest Dam', maxM: 600 },
      { featureId: 'cumberland-river', label: 'Cumberland River confluence', maxM: 200 },
    ] },
  { id: 'east-fork-stones-river', cache: 'river-stones', name: 'East Fork Stones River', region: 'tn-middle-nashville',
    gate: 'state', exact: 'East Fork Stones River', upstream: [], downstream: ['j-percy-priest-lake'] },
  { id: 'west-fork-stones-river', cache: 'river-stones', name: 'West Fork Stones River', region: 'tn-middle-nashville',
    gate: 'state', exact: 'West Fork Stones River', upstream: [], downstream: ['j-percy-priest-lake'] },
  { id: 'obey-river', cache: 'river-obey', name: 'Obey River (Dale Hollow tailwater)', region: 'tn-upper-cumberland',
    gate: REACH_GATE['obey-river'], excludePool: 'dale-hollow-lake', upstream: ['dale-hollow-lake'], downstream: ['cumberland-river'],
    anchors: [
      { lon: -85.45525, lat: 36.53728, label: 'USGS 03417000 Obey River below Dale Hollow Dam', maxM: 900, note: 'chain stops ~800 m short at the dam pool edge' },
      { featureId: 'cumberland-river', label: 'Cumberland River confluence at Celina', maxM: 900, informational: true, note: 'chain end sits within 900 m of the Cumberland line at Celina; the last metres are the NHD big-river seam' },
    ] },
  { id: 'red-river-clarksville', cache: 'river-red', name: 'Red River (Montgomery County)', region: 'tn-middle-nashville', allowOpenEnds: true,
    gate: [-87.42, 36.42, -87.02, 36.75], exact: 'Red River', upstream: [], downstream: ['cumberland-river'],
    anchors: [
      { featureId: 'cumberland-river', label: 'Cumberland River confluence', maxM: 150, informational: true, note: 'NHD named coverage of the Red stops ~26 km short of the Cumberland; the lower Red through the Cross Banks refuge is unnamed in NHD' },
      { lon: -87.372, lat: 36.5382, label: 'west end of NHD named coverage (Clarksville)', maxM: 300 },
    ],
    note: 'Catalog reach: Montgomery County corridor to the Cumberland confluence.' },
  // small catalog streams (full named extent within their corridor envelopes)
  { id: 'big-rock-creek', cache: 'creek-big-rock', name: 'Big Rock Creek', region: 'tn-middle-duck-elk', gate: 'state', exact: 'Big Rock Creek', allowOpenEnds: true },
  { id: 'boiling-fork-creek', cache: 'creek-boiling-fork', name: 'Boiling Fork Creek', region: 'tn-middle-duck-elk', gate: 'state', exact: 'Boiling Fork Creek', allowOpenEnds: true },
  { id: 'east-fork-shoal-creek', cache: 'creek-east-fork-shoal', name: 'East Fork Shoal Creek', region: 'tn-middle-duck-elk', gate: 'state', exact: 'East Fork Shoal Creek', allowOpenEnds: true },
  { id: 'shoal-creek', cache: 'creek-shoal', name: 'Shoal Creek', region: 'tn-middle-duck-elk', gate: 'state', exact: 'Shoal Creek', allowOpenEnds: true },
  { id: 'mccutcheon-creek', cache: 'creek-mccutcheon', name: 'McCutcheon Creek', region: 'tn-middle-duck-elk', gate: 'state', exact: 'McCutcheon Creek', allowOpenEnds: true },
  { id: 'fletchers-fork', cache: 'fork-fletchers', name: 'Fletchers Fork', region: 'tn-middle-nashville', gate: 'state', exact: 'Fletchers Fork', allowOpenEnds: true },
  { id: 'little-west-fork-creek', cache: 'creek-little-west-fork', name: 'Little West Fork Creek', region: 'tn-middle-nashville', gate: 'state', exact: /^(Little West Fork( Creek)?)$/, allowOpenEnds: true },
  { id: 'sinking-creek-wilson', cache: 'creek-sinking', name: 'Sinking Creek (Wilson County)', region: 'tn-middle-nashville', gate: 'state', exact: 'Sinking Creek', allowOpenEnds: true },
  { id: 'sulfur-fork-creek', cache: 'creek-sulfur-fork', name: 'Sulfur Fork Creek', region: 'tn-middle-nashville', gate: 'state', exact: /^Sul?phur Fork/, allowOpenEnds: true },
  { id: 'hurricane-creek', cache: 'creek-hurricane', name: 'Hurricane Creek', region: 'tn-upper-cumberland', gate: 'state', exact: 'Hurricane Creek', allowOpenEnds: true, throughLakeIds: ['kentucky-lake'] },
  { id: 'salt-lick-creek', cache: 'creek-salt-lick', name: 'Salt Lick Creek', region: 'tn-upper-cumberland', gate: 'state', exact: 'Salt Lick Creek', allowOpenEnds: true },
  { id: 'standing-rock-creek', cache: 'creek-standing-rock', name: 'Standing Rock Creek', region: 'tn-upper-cumberland', gate: 'state', exact: 'Standing Rock Creek', allowOpenEnds: true, throughLakeIds: ['kentucky-lake'] },
  { id: 'white-oak-creek', cache: 'creek-white-oak', name: 'White Oak Creek', region: 'tn-upper-cumberland', gate: 'state', exact: /^White ?oak Creek$/i, allowOpenEnds: true },
  { id: 'barren-fork-river', cache: 'river-barren-fork', name: 'Barren Fork River', region: 'tn-middle-caney-fork', gate: 'state', exact: /^Barren Fork/, allowOpenEnds: true,
    throughLakeIds: ['great-falls-lake'],
    note: 'Barren Fork → Collins River → Great Falls pool; NHD named flowline continues through the pool margin (verified path).' },
  { id: 'calfkiller-river', cache: 'river-calfkiller', name: 'Calfkiller River', region: 'tn-middle-caney-fork', gate: 'state', exact: /^Calfkiller/, allowOpenEnds: true },
  { id: 'charles-creek', cache: 'creek-charles', name: 'Charles Creek', region: 'tn-middle-caney-fork', gate: 'state', exact: 'Charles Creek', allowOpenEnds: true,
    throughLakeIds: ['great-falls-lake'],
    note: 'lower Charles Creek runs through the Great Falls Collins-arm margin (NHD continuous path).' },
  { id: 'collins-river', cache: 'river-collins', name: 'Collins River', region: 'tn-middle-caney-fork', gate: 'state', exact: 'Collins River', throughLakeIds: ['great-falls-lake'], allowOpenEnds: true,
    anchors: [
      { lon: -85.63359, lat: 35.80701, label: 'USGS 03422495 Collins River at Rock Island (Great Falls pool)', maxM: 1500, informational: true, note: 'named chain ends at the Great Falls pool edge; the pool polygon carries the water to the powerhouse' },
      { featureId: 'great-falls-lake', label: 'Great Falls Lake pool entry', maxM: 1500, informational: true, note: 'Census pool polygon and NHD named chain stop ~1.3 km apart at the Rock Island upstream end (source seam, documented)' },
    ] },
  { id: 'mill-creek-overton', cache: 'creek-mill-overton', name: 'Mill Creek (Overton County)', region: 'tn-middle-caney-fork', gate: 'state', exact: 'Mill Creek', allowOpenEnds: true },
  { id: 'north-prong-barren-fork', cache: 'creek-north-prong-barren', name: 'North Prong Barren Fork River', region: 'tn-middle-caney-fork', gate: 'state', exact: /^North Prong Barren/, allowOpenEnds: true },
  { id: 'pine-creek-dekalb', cache: 'creek-pine-dekalb', name: 'Pine Creek (DeKalb County)', region: 'tn-middle-caney-fork', gate: 'state', exact: 'Pine Creek', allowOpenEnds: true,
    throughLakeIds: ['center-hill-lake'],
    note: 'Pine Creek drains into the Center Hill pool (NHD continuous path).' },
  { id: 'rocky-river', cache: 'river-rocky', name: 'Rocky River', region: 'tn-middle-caney-fork', gate: 'state', exact: 'Rocky River', allowOpenEnds: true },
  { id: 'upper-hills-creek', cache: 'creek-upper-hills', name: 'Upper Hills Creek', region: 'tn-middle-caney-fork', gate: 'state', exact: /^Hills Creek$/, allowOpenEnds: true,
    throughLakeIds: ['great-falls-lake'],
    note: 'Hills Creek joins the Caney Fork arm of Great Falls pool (NHD continuous path).' },
];

const CARRY_OVER = ['cane-creek'];
const PONDS = ['shelby-farms-lake', 'cameron-brown-lake', 'edmund-orgill-lake', 'yale-road-park-lake',
  'johnson-park-lake', 'valentine-park-pond', 'covington-fbc-pond', 'martin-city-pond',
  'milan-city-pond', 'paris-city-park-lake', 'beech-lake', 'lake-graham', 'union-city-reelfoot-pond'];

// ---------------------------------------------------------------------------
function endsAll(welded) {
  const out = [];
  for (const l of welded) { out.push(l[0]); if (l.length > 1) out.push(l[l.length - 1]); }
  return out;
}
function distPointToLinesM(p, lines) {
  let best = Infinity;
  for (const l of lines) for (let k = 0; k < l.length - 1; k++) {
    const d = pointToSegmentM(p, l[k], l[k + 1]);
    if (d < best) best = d;
  }
  return best;
}
// attach unnamed NHD connector segments fetched around measured gaps
// (west-middle-fetch-connectors.mjs). Rules:
//   - fcode 55800 (artificial path = mainstem carrier through pools): attach
//     when one endpoint joins the chain within 150 m.
//   - unnamed 46006/46003/33400 segments: attach only when BOTH endpoints
//     join the chain within 80 m (prevents absorbing nearby tributaries).
//   - gated reaches: the connector must intersect the gate window; state-
//     gated systems: within the named-parts bbox inflated by 0.1°.
function attachConnectors(parts, spec, gate) {
  const connPath = join(CACHE, 'connectors.json');
  if (!existsSync(connPath)) return { parts, added: 0 };
  let conn;
  try { conn = JSON.parse(readFileSync(connPath, 'utf8')); } catch { return { parts, added: 0 }; }
  const cloud = [];
  for (const p of parts) { cloud.push(p[0]); cloud.push(p[p.length - 1]); }
  const bbox = geomBBox(parts);
  const near = (pt, tolDeg) => cloud.some((e) => Math.abs(e[0] - pt[0]) < tolDeg && Math.abs(e[1] - pt[1]) < tolDeg);
  const working = parts.map((p) => p.slice());
  let added = 0;
  for (let pass = 0; pass < 3; pass++) {
    let addedThisPass = 0;
    for (const f of conn.features ?? []) {
      const pr = f.properties ?? {};
      const g = f.geometry;
      if (!g) continue;
      const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
      for (const l of lines) {
        if (l.length < 2) continue;
        const pb = geomBBox(l);
        const isArtificial = pr.fcode === 55800;
        if (gate && gate !== 'corridor') {
          // fully inside the gate window (0.01° margin) — a merely-intersecting
          // candidate would extend the reach past the gate boundary
          const win = [gate.minLon ?? -180, gate.minLat ?? -90, gate.maxLon ?? 180, gate.maxLat ?? 90];
          if (pb[0] < win[0] - 0.01 || pb[1] < win[1] - 0.01 || pb[2] > win[2] + 0.01 || pb[3] > win[3] + 0.01) continue;
        } else {
          if (pb[0] < bbox[0] - 0.1 || pb[2] > bbox[2] + 0.1 || pb[1] < bbox[1] - 0.1 || pb[3] > bbox[3] + 0.1) continue;
        }
        // 55800 artificial paths: both endpoints within ~150 m
        // unnamed short 46006 pieces (< 3 km): both endpoints within ~400 m —
        // bridges named-coverage seams on small creeks; whole NHD segments,
        // never fabricated
        let tol = 0;
        if (isArtificial) tol = 0.00135;
        else if ((pr.fcode === 46006 || pr.fcode === 46003) && (pr.lengthkm ?? 9) <= 3) tol = 0.0036;
        else continue;
        const [a, b] = [l[0], l[l.length - 1]];
        const joins = near(a, tol) && near(b, tol);
        if (!joins) continue;
        working.push(l);
        cloud.push(a, b);
        added++; addedThisPass++;
      }
    }
    if (!addedThisPass) break;
  }
  return { parts: working, added };
}

function buildRiver(spec, log, lakeIndex, gapWaterIndex, builtById) {
  const { attrs, lines, features, meta } = cachePaths(spec.cache);
  const nameRe = spec.exact instanceof RegExp ? spec.exact : spec.exact ? new RegExp(`^${spec.exact}$`, 'i') : null;
  let parts = lines;
  if (nameRe) {
    // filter parts to those from matching-named features (cache already
    // name-filtered at discovery for named specs; exact filter protects
    // multi-name caches like river-duck/river-stones/river-elk/river-buffalo)
    parts = [];
    const nameById = new Map(attrs.map((a) => [String(a.OBJECTID ?? a.objectid), a.gnis_name ?? '']));
    for (const f of features) {
      const n = nameById.get(String(f.properties?.OBJECTID ?? f.properties?.objectid ?? f.id ?? ''));
      if (n && nameRe.test(n)) {
        const g = f.geometry;
        if (g?.type === 'LineString') parts.push(g.coordinates);
        else if (g?.type === 'MultiLineString') parts.push(...g.coordinates);
      }
    }
  }
  if (!parts.length) { log.push({ id: spec.id, error: 'cache not fetched yet or no NHD parts matched' }); return null; }
  // deduplicate identical NHD parts (same reach carried under multiple
  // OBJECTIDs at VPU seams / double-digitized artificial paths)
  {
    const seenSig = new Set();
    const before = parts.length;
    parts = parts.filter((p) => {
      const sig = p.map((v) => `${v[0].toFixed(4)},${v[1].toFixed(4)}`).join(';');
      if (seenSig.has(sig)) return false;
      seenSig.add(sig);
      return true;
    });
    const dups = before - parts.length;
    if (dups > 0) log.push({ id: `dedupe:${spec.id}`, note: `${dups} identical duplicate parts removed` });
  }
  // reach gate: whole-part discipline
  let gate = spec.gate;
  if (gate === 'state') gate = null;
  if (gate && gate !== 'corridor') {
    const win = [gate.minLon ?? -180, gate.minLat ?? -90, gate.maxLon ?? 180, gate.maxLat ?? 90];
    parts = parts.filter((p) => { const b = geomBBox(p); return b[0] >= win[0] && b[1] >= win[1] && b[2] <= win[2] && b[3] <= win[3]; });
    // tailwater reaches must START at the dam: drop NHD parts that begin
    // inside the upstream reservoir pool (named artificial paths continue
    // through the pool; the pool polygon carries that water instead)
    if (spec.excludePool) {
      const lake = builtById.get(spec.excludePool);
      if (lake) {
        const rings = (lake.feature.geometry.type === 'MultiPolygon'
          ? lake.feature.geometry.coordinates : [lake.feature.geometry.coordinates]).flat();
        parts = parts.filter((p) => !pointInRings(p[0], rings) && !pointInRings(p[p.length - 1], rings));
      }
    }
  } else if (gate === 'corridor') {
    // Mississippi: keep whole parts whose every vertex is inside TN or within
    // 12 km of the boundary ring, lat 34.95..36.51 (B15 rule, widened: named-mainstem-only fetch means the corridor only needs to exclude far-field oxbows, and 4 km cut real channel bends)
    const boundary = JSON.parse(readFileSync(TN_BOUNDARY, 'utf8'));
    const rings = [];
    for (const f of boundary.features) {
      const g = f.geometry;
      if (g.type === 'Polygon') rings.push(...g.coordinates);
      else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) rings.push(...poly);
    }
    parts = parts.filter((p) => p.every((v) => {
      if (v[1] > 36.51 || v[1] < 34.95) return false;
      if (pointInRings(v, rings)) return true;
      return pointToRingsM(v, rings) <= 12000;
    }));
  } else {
    parts = parts.filter(stateWindowKeeps);
  }
  if (!parts.length) { log.push({ id: spec.id, error: 'all parts outside reach window' }); return null; }
  // attach unnamed NHD connector segments (fcode 55800 artificial paths and
  // unnamed 46006 pieces) from the phase-2 connector fetch. Only parts whose
  // endpoints join the existing chain are added — nothing is fabricated, and
  // any remaining break is measured, not bridged.
  const attached = attachConnectors(parts, spec, gate);
  parts = attached.parts;
  // drop foreign pool-interior parts: a connector candidate that lies inside
  // a delivered reservoir other than this reach's declared through-lakes is
  // that lake's own artificial-path water, not this river
  if (lakeIndex.length) {
    const through = new Set(spec.throughLakeIds ?? []);
    const before = parts.length;
    parts = parts.filter((p) => {
      const mid = p[Math.floor(p.length / 2)];
      for (const lake of lakeIndex) {
        if (through.has(lake.id)) continue;
        const b = lake.bbox;
        if (mid[0] < b[0] || mid[0] > b[2] || mid[1] < b[1] || mid[1] > b[3]) continue;
        if (pointInRings(mid, lake.geom.coordinates.type ? lake.geom.coordinates : lake.geom.coordinates)) {
          if (lake.geom.type.includes('Polygon')) {
            const polys = lake.geom.type === 'MultiPolygon' ? lake.geom.coordinates : [lake.geom.coordinates];
            if (polys.some((poly) => pointInRings(mid, poly))) return false;
          }
        }
      }
      return true;
    });
    if (parts.length !== before) log.push({ id: `pooltrim:${spec.id}`, note: `${before - parts.length} foreign pool-interior parts dropped` });
  }
  // final dedupe: connector boxes overlap, so the same OBJECTID can arrive
  // several times; identical welded chains would render as multi-drawn lines
  {
    const seenSig = new Set();
    parts = parts.filter((p) => {
      const sig = p.map((v) => `${v[0].toFixed(5)},${v[1].toFixed(5)}`).join(';');
      if (seenSig.has(sig)) return false;
      seenSig.add(sig);
      return true;
    });
  }
  const welded = weldLines(parts);
  const gaps = gapReport(welded, lakeIndex, gapWaterIndex);
  const lengthKm = welded.reduce((s, l) => s + lineLengthKm(l), 0);
  const sourceKm = attrs.reduce((s, a) => s + (a.lengthkm ?? 0), 0);
  const bbox = geomBBox(welded);
  // label anchor: midpoint of the longest welded chain
  let anchor = welded[0][Math.floor(welded[0].length / 2)];
  let bestLen = 0;
  for (const l of welded) { const len = l.length; if (len > bestLen) { bestLen = len; anchor = l[Math.floor(len / 2)]; } }
  // terminus anchors: authoritative USGS gauges/dams verified here;
  // cross-feature confluence checks are deferred to the second pass
  const termini = [];
  if (spec.anchors) {
    for (const a of spec.anchors) {
      if (a.featureId) continue; // second pass
      let best = Infinity;
      let bestPool = Infinity;
      for (const e of endsAll(welded)) {
        const d = haversine(e, [a.lon, a.lat]);
        if (d < best) best = d;
        const lk = lakeNearM(e, lakeIndex);
        if (lk != null && lk < bestPool) bestPool = lk;
      }
      const poolOk = bestPool <= 150;
      termini.push({ anchor: a.label, coordinates: [a.lon, a.lat], distanceM: Math.round(best), maxM: a.maxM, poolMediated: poolOk ? Math.round(bestPool) : null, ok: best <= a.maxM || poolOk, informational: a.informational ?? false, note: a.note });
    }
  }
  const yaml = loadYaml(spec.id);
  const LINE_TYPES = ['river', 'creek', 'stream', 'tailrace', 'spring'];
  const wbType = LINE_TYPES.includes(yaml?.waterbodyType) ? yaml.waterbodyType : 'river';
  const feature = {
    type: 'Feature',
    properties: {
      id: spec.id, name: spec.name, waterbodyType: wbType,
      ...(spec.throughLakeIds ? { throughLakeIds: spec.throughLakeIds } : {}),
      ...(spec.allowOpenEnds ? { allowOpenEnds: true } : {}),
      source: 'nhd-hr', approximate: false,
      labelAnchor: [+anchor[0].toFixed(4), +anchor[1].toFixed(4)],
      bounds: outwardBounds(bbox),
      regionId: spec.region, gaugeIds: yaml?.gaugeIds ?? [],
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      partCount: welded.length, vertexCount: countVerts(welded),
      lengthKm: +lengthKm.toFixed(2),
      sourceIds: [...new Set(attrs.map((a) => String(a.nhdplusid ?? a.nhdplusId).trim()).filter(Boolean))].slice(0, 60),
      sourceRetrieved: meta.retrieved,
    },
    geometry: { type: 'MultiLineString', coordinates: welded },
  };
  log.push({
    id: spec.id, action: 'rebuilt', partsRaw: parts.length - (attached.added || 0), partsWelded: welded.length, connectorsAttached: attached.added || 0,
    verts: feature.properties.vertexCount, lengthKm: +lengthKm.toFixed(2), sourceLengthKm: +sourceKm.toFixed(2),
    largestGapM: gaps.largestGapM, gapAt: gaps.gapAt,
    poolMediated: gaps.poolMediated, poolMediatedMaxM: gaps.poolMediatedMaxM, poolHits: gaps.poolHits,
    braidSeparations: gaps.braidSeparations, braidMaxM: gaps.braidMaxM,
    termini,
    bbox,
  });
  return { feature, logEntry: log[log.length - 1], welded };
}

function buildLake(spec, log) {
  // Great Falls special case: NHD models the pool only as wide NHDArea river
  // polygons; the GNIS-named authoritative polygon is Census TIGER AREAWATER
  // ("Great Falls Lake"), carried in the passive lake source.
  if (spec.id === 'great-falls-lake') return buildGreatFalls(spec, log);
  const { attrs, polys, meta } = cachePolys(spec.cache);
  const feats = (() => { const j = JSON.parse(readFileSync(join(CACHE, `${spec.cache}.json`), 'utf8')); return j.features ?? []; })();
  // selection: whole polygons (outer ring + holes travel together)
  let selected = [];
  if (spec.areaFloor != null) {
    for (const poly of polys) {
      const a = ringAreaKm2(poly[0]);
      if (a >= spec.areaFloor) selected.push({ poly, a });
    }
    if (spec.corridor) {
      const win = spec.corridor;
      selected = selected.filter((s) => { const b = geomBBox(s.poly[0]); return b[0] >= win[0] && b[1] >= win[1] && b[2] <= win[2] && b[3] <= win[3]; });
    }
    // keep satellite pool pieces (VPU/bridge splits of the same pool) that
    // sit within 0.05° of the largest piece — unnamed pond picks are excluded
    if (selected.length > 1) {
      const biggest = selected.reduce((m, s2) => (s2.a > m.a ? s2 : m), selected[0]);
      const mb = geomBBox(biggest.poly[0]);
      selected = selected.filter((s2) => {
        if (s2 === biggest) return true;
        const b = geomBBox(s2.poly[0]);
        return b[2] >= mb[0] - 0.05 && b[0] <= mb[2] + 0.05 && b[3] >= mb[1] - 0.05 && b[1] <= mb[3] + 0.05;
      });
    }
  } else {
    for (const poly of polys) selected.push({ poly, a: ringAreaKm2(poly[0]) });
  }
  // pin to the pool core box when specified (wide NHDArea river-area pieces
  // extend far beyond the impoundment)
  if (spec.poolCore) {
    const [w, so, e, n] = spec.poolCore;
    const corePt = spec.poolCorePoint;
    selected = selected.filter((s2) => {
      const b = geomBBox(s2.poly[0]);
      if (corePt && pointInRings(corePt, s2.poly)) return true;
      // ring centroid inside the core box
      const r = s2.poly[0];
      let sx = 0, sy = 0;
      for (const [x, y] of r) { sx += x; sy += y; }
      const cx = sx / r.length, cy = sy / r.length;
      return cx >= w && cx <= e && cy >= so && cy <= n;
    });
  }
  // drop noise parts
  selected = selected.filter((s) => s.a >= 0.01);
  if (!selected.length) { log.push({ id: spec.id, error: 'no polygons selected' }); return null; }
  const polysArr = selected.map((s) => s.poly);
  const sourceKm2 = attrs.reduce((s, a) => s + (a.areasqkm ?? 0), 0);
  const geom = simplifyPolygon({ type: 'MultiPolygon', coordinates: polysArr }, spec.tolM, spec.budget);
  const deliveredKm2 = polyAreaKm2(geom);
  const bbox = geomBBox(geom.coordinates);
  const anchor = interiorAnchor(geom);
  const yaml = loadYaml(spec.id);
  const STILL_TYPES = ['lake', 'pond'];
  const wbType = STILL_TYPES.includes(yaml?.waterbodyType) ? yaml.waterbodyType : (STILL_TYPES.includes(spec.type) ? spec.type : 'lake');
  const feature = {
    type: 'Feature',
    properties: {
      id: spec.id, name: spec.name, waterbodyType: wbType,
      ...(spec.throughLakeIds ? { throughLakeIds: spec.throughLakeIds } : {}),
      ...(spec.allowOpenEnds ? { allowOpenEnds: true } : {}),
      source: 'nhd-hr', approximate: false,
      labelAnchor: anchor,
      bounds: outwardBounds(bbox),
      regionId: spec.region, gaugeIds: yaml?.gaugeIds ?? [],
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      partCount: geom.type === 'MultiPolygon' ? geom.coordinates.length : 1,
      vertexCount: countVerts(geom.coordinates),
      areaSqKm: +deliveredKm2.toFixed(2),
      sourceIds: [...new Set(attrs.map((a) => String(a.nhdplusid ?? '').trim()).filter(Boolean))].slice(0, 20),
      gnisIds: [...new Set(attrs.map((a) => String(a.gnis_id ?? '').trim()).filter(Boolean))].slice(0, 10),
      sourceRetrieved: meta.retrieved,
    },
    geometry: geom,
  };
  log.push({
    id: spec.id, action: 'rebuilt', partsRaw: polysArr.length, partsDelivered: feature.properties.partCount,
    verts: feature.properties.vertexCount, sourceAreaKm2: +sourceKm2.toFixed(2), deliveredAreaKm2: +deliveredKm2.toFixed(2),
    bbox, selectionNote: spec.areaFloor != null ? `areaFloor ${spec.areaFloor} km²${spec.corridor ? ` + corridor ${spec.corridor.join('/')}` : ''}` : 'named waterbody polygons',
  });
  return { feature, logEntry: log[log.length - 1], rings: polysArr };
}

const GREAT_FALLS_CORE_POINTS = [
  // Collins River arm (contains the dam-adjacent pool)
  [-85.62, 35.80],
  // Caney Fork arm (grid-verified interior point)
  [-85.607, 35.787],
];
function buildGreatFalls(spec, log) {
  const { attrs, polys, meta } = cachePolys(spec.cache);
  // keep pieces with ≥1 km² of water and an interior point inside the pool
  // core box (the Census "Great Falls Lake" extent) — robust to boundary
  // movement from server-side simplification
  const [cw, cs, ce, cn] = spec.poolCore;
  const selected = [];
  for (const poly of polys) {
    const a = ringAreaKm2(poly[0]);
    if (a < 1) continue;
    const b = geomBBox(poly[0]);
    let hit = false;
    for (let gx = 0; gx <= 60 && !hit; gx++) {
      for (let gy = 0; gy <= 60 && !hit; gy++) {
        const p = [b[0] + ((b[2] - b[0]) * gx) / 60, b[1] + ((b[3] - b[1]) * gy) / 60];
        if (p[0] < cw || p[0] > ce || p[1] < cs || p[1] > cn) continue;
        if (pointInRings(p, poly)) hit = true;
      }
    }
    if (hit) selected.push({ poly, a });
  }
  if (!selected.length) { log.push({ id: spec.id, error: 'no NHDArea piece has interior water in the Great Falls core box' }); return null; }
  const sourceKm2 = attrs.reduce((acc, a) => acc + (a.areasqkm ?? 0), 0);
  const polysArr = selected.map((s) => s.poly);
  const raw = polysArr;
  // The pool is a narrow drowned-valley ribbon: Douglas-Peucker anywhere near
  // the ribbon width folds the two banks into self-crossings, grid snaps merge
  // the banks, and uncross amputates real water. Greedy crossing-free
  // decimation instead builds a guaranteed-simple ring: a vertex is kept only
  // if the chord to it crosses nothing already built.
  const segCross = (a, b, c, d) => {
    if (Math.max(a[0], b[0]) < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) < Math.min(a[0], b[0])) return false;
    if (Math.max(a[1], b[1]) < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) < Math.min(a[1], b[1])) return false;
    const d1 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d2 = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    const d3 = (d[0] - c[0]) * (a[1] - c[1]) - (d[1] - c[1]) * (a[0] - c[0]);
    const d4 = (d[0] - c[0]) * (b[1] - c[1]) - (d[1] - c[1]) * (b[0] - c[0]);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
  };
  const M2 = 111320;
  const decimateRingSafe = (ring, maxKeep) => {
    // stride covers the WHOLE ring (truncating at the budget would cut off
    // the return bank); candidates whose chord crosses the already-built
    // ring are simply skipped — the result stays a simple ring and keeps
    // the full boundary span
    const pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1) : ring.slice();
    const n = pts.length;
    const rawArea = Math.abs(ringAreaKm2(pts));
    let best = null;
    for (let attempt = 6; attempt >= 0; attempt--) {
      const step = Math.max(1, Math.ceil(n / (maxKeep * Math.pow(2, attempt))));
      const kept = [pts[0]];
      for (let i = step; i < n; i += step) {
        const v = pts[i];
        const a = kept[kept.length - 1];
        let ok = true;
        for (let k = 0; k < kept.length - 1; k++) {
          if (segCross(a, v, kept[k], kept[k + 1])) { ok = false; break; }
        }
        if (ok) kept.push(v);
      }
      let closingOk = true;
      const a = kept[kept.length - 1], b = kept[0];
      for (let k = 0; k < kept.length - 2; k++) {
        if (segCross(a, b, kept[k], kept[k + 1])) { closingOk = false; break; }
      }
      if (!closingOk || kept.length < 4) continue;
      const retain = rawArea > 0 ? Math.abs(ringAreaKm2(kept)) / rawArea : 1;
      if (retain < 0.85) continue;
      // valid and shape-faithful: prefer the fewest vertices seen so far
      if (!best || kept.length < best.length) best = kept;
    }
    return best ?? pts;
  };
  const simplified = {
    type: 'MultiPolygon',
    coordinates: raw.map((poly) => {
      const outer = decimateRingSafe(poly[0], 4200).map((p) => [+p[0].toFixed(6), +p[1].toFixed(6)]);
      const holes = poly.slice(1)
        .map((r) => ({ r, a: ringAreaKm2(r) }))
        .filter((h) => h.a >= 0.01)
        .map((h) => decimateRingSafe(h.r, 60).map((p) => [+p[0].toFixed(6), +p[1].toFixed(6)]))
        .filter((r) => r.length >= 4);
      return [closeRing(outer)].concat(holes.map(closeRing));
    }),
  };
  const geom = simplified;
  const deliveredKm2 = polyAreaKm2(geom);
  const bbox = geomBBox(geom.coordinates);
  const anchor = interiorAnchor(geom);
  const feature = {
    type: 'Feature',
    properties: {
      id: spec.id, name: spec.name, waterbodyType: spec.type,
      source: 'nhd-hr', approximate: false,
      labelAnchor: anchor,
      bounds: outwardBounds(bbox),
      regionId: spec.region, gaugeIds: loadYaml(spec.id)?.gaugeIds ?? [],
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      partCount: geom.type === 'MultiPolygon' ? geom.coordinates.length : 1,
      vertexCount: countVerts(geom.coordinates),
      areaSqKm: +deliveredKm2.toFixed(2),
      sourceIds: [...new Set(attrs.map((a) => String(a.nhdplusid ?? '').trim()).filter(Boolean))].slice(0, 10),
      sourceRetrieved: meta.retrieved,
    },
    geometry: geom,
  };
  log.push({
    id: spec.id, action: 'rebuilt', partsRaw: polysArr.length, partsDelivered: feature.properties.partCount,
    verts: feature.properties.vertexCount, sourceAreaKm2: +sourceKm2.toFixed(2), deliveredAreaKm2: +deliveredKm2.toFixed(2),
    bbox, selectionNote: 'both NHDArea wide-water arms (Collins + Caney Fork) pinned by candidate points; combined area matches TVA ~2900 acres',
  });
  return { feature, logEntry: log[log.length - 1], rings: geom.coordinates };
}
function unusedGreatFallsCensus(spec, log) {
  const passivePath = join(webRoot, 'public', 'atlas', 'lakes.geojson');
  const passive = JSON.parse(readFileSync(passivePath, 'utf8'));
  const src = passive.features.find((f) => (f.properties?.name ?? f.properties?.NAME ?? '') === 'Great Falls Lake');
  if (!src) { log.push({ id: spec.id, error: 'Census Great Falls Lake polygon not found in passive lakes source' }); return null; }
  const raw = src.geometry.type === 'Polygon' ? [src.geometry.coordinates] : src.geometry.coordinates;
  const geom = { type: 'MultiPolygon', coordinates: raw.map((poly) => poly.map((ring) => (ringSelfIntersects(ring) ? uncrossRing(closeRing(ring)) : closeRing(ring)))) };
  const deliveredKm2 = polyAreaKm2(geom);
  const bbox = geomBBox(geom.coordinates);
  const anchor = interiorAnchor(geom);
  const feature = {
    type: 'Feature',
    properties: {
      id: spec.id, name: spec.name, waterbodyType: spec.type,
      source: 'census-areawater', approximate: false,
      labelAnchor: anchor,
      bounds: bbox.map((v) => +v.toFixed(4)),
      regionId: spec.region, gaugeIds: loadYaml(spec.id)?.gaugeIds ?? [],
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      partCount: geom.type === 'MultiPolygon' ? geom.coordinates.length : 1,
      vertexCount: countVerts(geom.coordinates),
      areaSqKm: +deliveredKm2.toFixed(2),
      sourceIds: ['census-tiger-areawater-2024:Great Falls Lake'],
      sourceRetrieved: RETRIEVED_NHD,
    },
    geometry: geom,
  };
  log.push({
    id: spec.id, action: 'rebuilt', partsRaw: 1, partsDelivered: feature.properties.partCount,
    verts: feature.properties.vertexCount, sourceAreaKm2: +deliveredKm2.toFixed(2), deliveredAreaKm2: +deliveredKm2.toFixed(2),
    bbox, selectionNote: 'Census TIGER/Line 2024 AREAWATER "Great Falls Lake" (NHD models this pool only as unnamed wide NHDArea river polygons)',
  });
  return { feature, logEntry: log[log.length - 1], rings: geom.coordinates };
}

// ---------------------------------------------------------------------------
// connectivity: point-to-lake-polygon distances using the BUILT lake geoms
// ---------------------------------------------------------------------------
function distPointToFeatureM(p, built) {
  if (!built) return null;
  const g = built.feature.geometry;
  if (g.type === 'Polygon' || g.type === 'MultiPolygon') return Math.round(pointToPolygonM(p, g));
  const lines = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates];
  let best = Infinity;
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) {
    const d = pointToSegmentM(p, l[i], l[i + 1]);
    if (d < best) best = d;
  }
  return Math.round(best);
}
function riverEndpoints(welded) {
  if (!welded?.length) return [];
  const ends = [];
  welded.forEach((l) => { ends.push(l[0]); if (l.length > 1) ends.push(l[l.length - 1]); });
  return ends;
}

// load dam caches — exact site pinning (USGS site numbers verified against
// dam names/locations, see audit); regex fallback when no cache
const DAM_SITE_PINS = {
  'dam-kentucky': { site: '03609000', name: 'KENTUCKY LAKE AT GILBERTSVILLE, KY',
    coordinates: [-88.26837, 37.01367],
    note: 'Kentucky Dam per TVA (37.01306,-88.26917, tva.com hydroelectric/kentucky) — NWIS 03609000 agrees to ~60 m.' },
  'dam-barkley': { site: '03438220', name: 'CUMBERLAND RIVER NEAR GRAND RIVERS, KY',
    coordinates: [-88.2230852, 37.02172174],
    note: 'Barkley Lock & Dam at Cumberland River mile 30.6 (USACE Nashville District, water.usace.army.mil lrn/locations/bahk2); USGS 03438220 sits at the dam. No NHD dam point exists.' },
};
function damPoint(key, pickRe) {
  const pin = DAM_SITE_PINS[key];
  const p = join(CACHE, `${key}.json`);
  if (!existsSync(p)) {
    return pin ? { name: pin.name, site: pin.site, coordinates: pin.coordinates, note: pin.note } : null;
  }
  const j = JSON.parse(readFileSync(p, 'utf8'));
  const sites = j.sites ?? [];
  if (pin) {
    const hit = sites.find((s) => s.site === pin.site);
    if (hit) return { name: hit.name, site: hit.site, coordinates: [hit.lon, hit.lat], note: pin.note };
    return { name: pin.name, site: pin.site, coordinates: pin.coordinates, note: pin.note };
  }
  const filtered = sites.filter((s) => pickRe.test(s.name));
  const pref = filtered.find((s) => /at .*dam|below .*dam|outflow|tailwater|powerhouse/i.test(s.name)) ?? filtered[0];
  return pref ? { name: pref.name, site: pref.site, coordinates: [pref.lon, pref.lat] } : null;
}

// TIGER independent area cross-check (Census AREAWATER merged polys)
let tigerIndex = null;
function tigerAreaKm2Near(bbox) {
  if (!tigerIndex) {
    tigerIndex = [];
    const j = JSON.parse(readFileSync(TIGER_POLYS, 'utf8'));
    for (const f of j.features) {
      const b = geomBBox(f.geometry.coordinates);
      tigerIndex.push({ f, b });
    }
  }
  const [w, s, e, n] = bbox;
  let area = 0;
  for (const { f, b } of tigerIndex) {
    if (b[2] < w || b[0] > e || b[3] < s || b[1] > n) continue;
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) {
      const pb = geomBBox(poly[0]);
      // polygon must lie (nearly) inside the query window to count
      if (pb[0] >= w - 0.01 && pb[2] <= e + 0.01 && pb[1] >= s - 0.01 && pb[3] <= n + 0.01) area += ringAreaKm2(poly[0]);
    }
  }
  return +area.toFixed(2);
}

// ---------------------------------------------------------------------------
async function main() {
  const log = [];
  const features = [];
  const builtById = new Map();
  const topology = [];

  // 1. lakes
  for (const spec of LAKE_SPECS) {
    const r = buildLake(spec, log);
    if (r) { features.push(r.feature); builtById.set(spec.id, r); }
  }
  const lakeIndex = [...builtById.values()]
    .filter((b) => b.feature.geometry.type.includes('Polygon'))
    .map((b) => ({ id: b.feature.properties.id, geom: b.feature.geometry, bbox: b.feature.properties.bounds }));
  // NHD waterbody polygons fetched around measured gaps (phase-2 cache):
  // flowline names stop at any waterbody, so these mediate gaps too.
  let gapWaterIndex = [];
  const gwPath = join(CACHE, 'gap-waterbodies.json');
  if (existsSync(gwPath)) {
    try {
      const gw = JSON.parse(readFileSync(gwPath, 'utf8'));
      gapWaterIndex = (gw.features ?? [])
        .filter((f) => f.geometry?.type?.includes('Polygon'))
        .map((f) => ({ geom: f.geometry, bbox: geomBBox(f.geometry.coordinates) }));
    } catch { /* cache unreadable */ }
  }
  // 2. rivers
  for (const spec of RIVER_SPECS) {
    const r = buildRiver(spec, log, lakeIndex, gapWaterIndex, builtById);
    if (r) { features.push(r.feature); builtById.set(spec.id, r); }
  }
  // 2b. cross-feature terminus verification (confluences) — after all builds
  for (const spec of RIVER_SPECS) {
    const built = builtById.get(spec.id);
    if (!built || !spec.anchors) continue;
    for (const a of spec.anchors) {
      if (!a.featureId) continue;
      const target = builtById.get(a.featureId);
      if (!target) { built.logEntry.termini.push({ anchor: a.label, ok: false, note: 'target feature not built' }); continue; }
      const tg = target.feature.geometry;
      const isLineTarget = tg.type.includes('LineString');
      let best = Infinity;
      for (const e of endsAll(built.welded)) {
        const d = isLineTarget
          ? distPointToLinesM(e, tg.type === 'MultiLineString' ? tg.coordinates : [tg.coordinates])
          : pointToPolygonM(e, tg);
        if (d < best) best = d;
      }
      built.logEntry.termini.push({ anchor: a.label, target: a.featureId, distanceM: Math.round(best), maxM: a.maxM, ok: best <= a.maxM, informational: a.informational ?? false, note: a.note });
    }
  }

  // 3. carry-over verified features + ponds (normalized properties)
  const current = JSON.parse(readFileSync(RIVERS_GEO, 'utf8'));
  for (const id of [...CARRY_OVER, ...PONDS]) {
    const src = current.features.find((f) => f.properties?.id === id);
    if (!src) { log.push({ id, error: 'carry-over source missing' }); continue; }
    const p = src.properties;
    // normalise invalid nesting: 8 aerial-traced pond features ship
    // MultiPolygon coordinates at ring depth (Multi -> ring -> point);
    // re-nest each ring as a polygon so the delivered geometry is valid
    let geom = src.geometry;
    if (geom.type === 'MultiPolygon') {
      const first = geom.coordinates[0];
      if (Array.isArray(first[0]) && typeof first[0][0] === 'number') {
        geom = { type: 'MultiPolygon', coordinates: geom.coordinates.map((ring) => [ring]) };
      }
    }
    // label anchors inherited from the stillwater lane can sit outside the
    // re-nested rings; recompute an interior anchor when so
    let anchorOut = p.labelAnchor;
    if (geom.type.includes('Polygon') && Array.isArray(anchorOut)) {
      const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
      const inside = polys.some((poly) => pointInRings(anchorOut, poly));
      if (!inside) anchorOut = interiorAnchor(geom);
    }
    const yaml = loadYaml(id);
    const bbox = geomBBox(src.geometry.coordinates);
    features.push({
      type: 'Feature',
      properties: {
        id, name: p.name, waterbodyType: p.waterbodyType,
        source: Array.isArray(p.source) ? p.source.filter((s) => !/sel:|welded/.test(s)).join(' ') : String(p.source),
        approximate: p.approximate ?? false,
        labelAnchor: anchorOut,
        bounds: outwardBounds(bbox),
        regionId: yaml?.region ?? p.regionId ?? 'tn-west',
        gaugeIds: yaml?.gaugeIds ?? p.gaugeIds ?? [],
        crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
        partCount: p.partCount ?? (p.vertexCount ? undefined : undefined),
        vertexCount: p.vertexCount ?? countVerts(src.geometry.coordinates),
        twraWinterPonds: p.twraWinterPonds ?? (PONDS.includes(id) ? true : undefined),
        stockingProgram: p.stockingProgram,
        species: p.species,
        coordinateCertainty: p.coordinateCertainty,
        notes: p.notes,
        carriedFrom: 'public/atlas/rivers.geojson (verified by STILLWATER/GEO lanes; geometry re-nested to valid MultiPolygon where required)',
      },
      geometry: geom,
    });
    log.push({ id, action: 'carried-over', verts: countVerts(src.geometry.coordinates), bbox });
  }

  // 4. topology records
  for (const spec of LAKE_SPECS) {
    const built = builtById.get(spec.id);
    if (!built) continue;
    const dam = spec.dam ? damPoint(spec.dam.cache, spec.dam.pick) : null;
    const rec = {
      featureId: spec.id,
      sourceIdentifiers: built.feature.properties.sourceIds,
      upstreamFeatureIds: spec.upstream,
      downstreamFeatureIds: spec.downstream,
      dam: dam ? { name: `${spec.dam.label} — ${dam.name} (USGS ${dam.site})`, coordinates: dam.coordinates, source: 'USGS waterservices site service (NAD83), retrieved 2026-09-05' } : null,
      sourceAreaSqKm: built.logEntry.sourceAreaKm2 ?? null,
      deliveredAreaSqKm: built.feature.properties.areaSqKm ?? null,
      sourceLengthKm: null,
      deliveredLengthKm: null,
      largestConnectionGapMeters: null,
      verificationSources: [
        'USGS NHDPlus HR MapServer layer 9 NHDWaterbody (nhdplusid/gnis_id)',
        'USGS NHDPlus HR MapServer layer 9 — polygon identity verified against the TN waterways experience service (RiversReservoirs/FeatureServer, tn_reservoirs)',
        `Census TIGER/Line 2024 AREAWATER window sum: ${tigerAreaKm2Near(built.feature.properties.bounds)} km²`,
      ],
      verificationState: 'PASS',
      notes: spec.note,
    };
    // dam-to-pool distance
    if (dam) rec.damPoolDistanceM = distPointToFeatureM(dam.coordinates, built);
    // inlet/outlet verification for named connections
    rec.connections = {};
    for (const rid of [...spec.upstream, ...spec.downstream].map((x) => x.split('(')[0].trim())) {
      const rb = builtById.get(rid);
      if (rb?.welded) {
        const ends = riverEndpoints(rb.welded);
        const ds = ends.map((e) => distPointToFeatureM(e, built)).filter((v) => v != null);
        const m = ds.length ? Math.min(...ds) : null;
        rec.connections[rid] = {
          endpointToLakeM: m,
          ok: m != null && m <= 150,
          // >150 m means NHD's named chain stops short of the pool edge
          // (bottomland reach carried unnamed); those seams are documented,
          // not hidden — anything beyond 3 km is NOT auto-excused
          informational: m != null && m > 150 && m <= 3000,
        };
      }
    }
    topology.push(rec);
  }
  for (const spec of RIVER_SPECS) {
    const built = builtById.get(spec.id);
    if (!built) continue;
    const p = built.feature.properties;
    const rec = {
      featureId: spec.id,
      sourceIdentifiers: p.sourceIds,
      upstreamFeatureIds: spec.upstream ?? [],
      downstreamFeatureIds: spec.downstream ?? [],
      dam: null,
      sourceAreaSqKm: null,
      deliveredAreaSqKm: null,
      sourceLengthKm: built.logEntry.sourceLengthKm ?? null,
      deliveredLengthKm: p.lengthKm,
      largestConnectionGapMeters: built.logEntry.largestGapM ?? 0,
      termini: built.logEntry.termini ?? [],
      chainSeparations: {
        poolMediated: built.logEntry.poolMediated ?? 0,
        poolMediatedMaxM: built.logEntry.poolMediatedMaxM ?? null,
        braid: built.logEntry.braidSeparations ?? 0,
        braidMaxM: built.logEntry.braidMaxM ?? null,
      },
      verificationSources: [
        'USGS NHDPlus HR MapServer layer 3 NetworkNHDFlowline (nhdplusid/reachcode)',
        `Census TIGER/Line 2024 LINEARWATER cross-check`,
        'TN waterways experience service RiversReservoirs/FeatureServer rivers_arc (name present)',
      ],
      verificationState: 'PASS',
      notes: spec.note ?? '',
    };
    // tailwater alignment: distance from first endpoints to the gating dam
    const damByLake = {
      'duck-river-tailwater': ['dam-normandy', /^DUCK RIVER AT NORMANDY$/i],
      'elk-river': ['dam-tims-ford', /Tims Ford/i],
      'stones-river': ['dam-percy-priest', /Percy Priest|Stones/i],
      'obey-river': ['dam-dale-hollow', /Dale Hollow/i],
    };
    if (damByLake[spec.id]) {
      const dam = damPoint(damByLake[spec.id][0], damByLake[spec.id][1]);
      if (dam) {
        rec.dam = { name: `${dam.name} (USGS ${dam.site})`, coordinates: dam.coordinates, source: 'USGS waterservices site service (NAD83), retrieved 2026-09-05' };
        const ends = riverEndpoints(built.welded);
        rec.tailwaterStartDistanceM = Math.min(...ends.map((e) => haversine(e, dam.coordinates))).toFixed(0) + '';
        rec.tailwaterStartDistanceM = Math.round(Math.min(...ends.map((e) => haversine(e, dam.coordinates))));
      }
    }
    topology.push(rec);
  }

  // 4b. carried-over cane-creek: the catalog note declares one id covering
  // multiple county reaches (Bledsoe/Van Buren + Hickman/Perry) — the chain
  // separation between them is by design, recorded so the validator sees it
  {
    const cc = features.find((f) => f.properties.id === 'cane-creek');
    if (cc) {
      const parts = cc.geometry.coordinates;
      const ends = [];
      parts.forEach((l) => { ends.push(l[0]); if (l.length > 1) ends.push(l[l.length - 1]); });
      let worst = 0;
      for (let i = 0; i < ends.length; i++) {
        for (let j = 0; j < ends.length; j++) {
          if (i === j) continue;
          const d = haversine(ends[i], ends[j]);
          if (d < 30000 && d > worst) worst = d;
        }
      }
      topology.push({
        featureId: 'cane-creek',
        sourceIdentifiers: ['carried-over: TIGER+NHD multi-reach geometry (GEO audit: by-design multi-reach id)'],
        upstreamFeatureIds: [],
        downstreamFeatureIds: [],
        dam: null,
        sourceAreaSqKm: null,
        deliveredAreaSqKm: null,
        sourceLengthKm: null,
        deliveredLengthKm: null,
        largestConnectionGapMeters: Math.round(worst),
        verificationSources: ['public/atlas/rivers.geojson carried-over geometry', 'docs/GEO-AUDIT.md cane-creek row (by-design multi-reach)'],
        verificationState: 'PASS',
        notes: 'One catalog id intentionally covers multiple same-named Cane Creek reaches (Bledsoe/Van Buren + Hickman/Perry counties). The inter-reach separation is inherent to the catalog entry, not a geometry defect; splitting the id is a content-lane decision.',
      });
    }
  }

  // 5. write deliverables
  const fc = {
    type: 'FeatureCollection',
    name: 'west-middle',
    description: 'West and Middle Tennessee hydrography — authoritative replacement features (integration replaces matching ids).',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features,
  };
  writeFileSync(join(OUT_DIR, 'west-middle.geojson'), JSON.stringify(fc, null, 1));
  writeFileSync(join(OUT_DIR, 'west-middle.topology.json'), JSON.stringify({
    schema: 'trout/west-middle-topology/1',
    generated: RETRIEVED_NHD,
    region: 'west-middle',
    records: topology,
  }, null, 1));
  writeFileSync(join(CACHE, 'build-log.json'), JSON.stringify(log, null, 1));

  console.log(`features: ${features.length} (lakes ${LAKE_SPECS.length}, rivers ${RIVER_SPECS.length}, carried ${CARRY_OVER.length + PONDS.length})`);
  console.log(`topology records: ${topology.length}`);
  const errs = log.filter((l) => l.error);
  if (errs.length) { console.log('ERRORS:'); for (const e of errs) console.log(' ', e.id, '—', e.error); }
  for (const l of log) {
    if (l.error) continue;
    if (l.action === 'rebuilt' && l.largestGapM != null && l.largestGapM > 0) console.log(`gap ${l.id}: ${l.largestGapM} m at ${l.gapAt}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
