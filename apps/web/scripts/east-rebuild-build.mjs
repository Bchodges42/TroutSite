#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * EAST/SOUTHEAST + CUMBERLAND PLATEAU hydrography REBUILD — session B
 * (branch geo/east-fix). Rebuilds the 27 fragmented rivers, the two
 * shattered lakes (norris, nickajack) and re-verifies boone-lake, writing
 * replacement features into apps/web/atlas-sources/verified/east-southeast.geojson.
 *
 *   apps/web/atlas-sources/verified/east-southeast.geojson       deliverable
 *   apps/web/atlas-sources/verified/east-southeast.topology.json connection records
 *   apps/web/.atlas-src/east-r2/build-report.json                per-feature evidence
 *
 * Technique (ported from the West/Middle lane's west-middle-build.mjs):
 *   - junction-safe weldLines: pair chain continuations by arrival bearing at
 *     3-way vertices so braided confluences never weld into zigzag spaghetti;
 *   - duplicate-part dedupe by coordinate signature (VPU-seam double carries);
 *   - pool-exclusion for tailwater reaches (excludePool / trimInsideLakeIds —
 *     the pool polygon carries its own water, the reach line ends at its edge
 *     or runs through it by declared throughLakeIds);
 *   - outward bounds, catalog-word waterbodyType, throughLakeIds for verified
 *     through-pool routes;
 *   - chain-separation accounting: welded (≤50 m snap) / pool-mediated
 *     (endpoint within 150 m of a delivered pool) / braid (parallel
 *     continuation ≤60° off the arrival bearing) / gap (reported, never
 *     bridged — no invented coordinates).
 *
 * Lake identity:
 *   - norris-lake: REBUILT from the NHDPlus HR NHDWaterbody layer (GNIS
 *     "Norris Lake"/"Norris Reservoir", NHDPlusIDs pinned) — not a Census
 *     piece assembly. NHD models the pool at its own stage (~95 km² vs the
 *     TVA full-pool 137 km²); the delivered stage is documented in topology.
 *   - nickajack-lake: TWRA tn_reservoirs stays the identity source (NHD's
 *     named pool covers only the western gorge); the delivered assembly keeps
 *     the real pool polygons and drops the source layer's micro-slivers.
 *   - boone-lake: NHD waterbody GNIS 01326910 — two polygons forming the
 *     Holston/Watauga arms of the Y; retained after outline + imagery QA.
 *
 * Run: node scripts/east-rebuild-build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '../..');
const CACHE = join(webRoot, '.atlas-src', 'east-r2');
const OUT_DIR = join(webRoot, 'atlas-sources', 'verified');
const VERIFIED = join(OUT_DIR, 'east-southeast.geojson');
const STATES_CTX = join(webRoot, 'public', 'atlas', 'states-context.geojson');
const TN_BOUNDARY = join(webRoot, 'public', 'atlas', 'tn-boundary.geojson');
const YAML_DIR = join(repoRoot, 'packages', 'content', 'streams', 'tn');

const RETRIEVED_NHD = new Date().toISOString().slice(0, 10);
const WELD_EPS = 0.0005; // deg; ~50 m — the NHD fetch precision (documented snap tolerance)
const M_PER_DEG_LAT = 111320;
const KM2_PER_DEG2 = 12392 * Math.cos((36 * Math.PI) / 180);
const SNAP_M = 150; // pool-mediated endpoint tolerance
const SIMP_LINE_TOL = 0.0002; // deg (~22 m) — same as the previous east lane

mkdirSync(join(CACHE), { recursive: true });

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
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2) * KM2_PER_DEG2;
}
function polyAreaKm2(geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'Polygon' ? [geom.coordinates] : [];
  let area = 0;
  for (const poly of polys) {
    // outer ring minus holes (NHD pool polygons carry island holes)
    area += Math.abs(ringAreaKm2(poly[0]));
    for (let i = 1; i < poly.length; i++) area -= Math.abs(ringAreaKm2(poly[i]));
  }
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
function outwardBounds(b) {
  return [
    Math.floor(b[0] * 1e6) / 1e6,
    Math.floor(b[1] * 1e6) / 1e6,
    Math.ceil(b[2] * 1e6) / 1e6,
    Math.ceil(b[3] * 1e6) / 1e6,
  ];
}
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
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
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
function pointInPolygonGeom(p, polygonGeom) {
  const polys = polygonGeom.type === 'MultiPolygon' ? polygonGeom.coordinates : [polygonGeom.coordinates];
  return polys.some((poly) => pointInRings(p, poly));
}
// Douglas–Peucker for lines/rings (degrees tolerance, same as the previous
// east lane's simplifyLine)
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
function segmentsTouch(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
function ringSelfIntersects(ring) {
  const n = ring.length - 1;
  const touch = (p, q) => p[0] === q[0] && p[1] === q[1];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const a = ring[i], b = ring[i + 1], c = ring[j], d = ring[j + 1];
      if (Math.max(a[0], b[0]) < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) < Math.min(a[0], b[0])) continue;
      if (Math.max(a[1], b[1]) < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) < Math.min(a[1], b[1])) continue;
      if (segmentsTouch(a, b, c, d) && !(touch(a, c) || touch(a, d) || touch(b, c) || touch(b, d))) return true;
    }
  }
  return false;
}
// remove the loop between the first crossing found — repairs DP-introduced
// crossings on pinch-point coves (same repair as the previous east lane)
function repairRingCrossings(ring) {
  for (let pass = 0; pass < 40; pass++) {
    const n = ring.length - 1;
    let fixed = false;
    outer: for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a = ring[i], b = ring[i + 1], c = ring[j], d = ring[j + 1];
        const touch = (p, q) => p[0] === q[0] && p[1] === q[1];
        if (segmentsTouch(a, b, c, d) && !(touch(a, c) || touch(a, d) || touch(b, c) || touch(b, d))) {
          ring = ring.slice(0, i + 1).concat(ring.slice(j + 1));
          fixed = true;
          break outer;
        }
      }
    }
    if (!fixed) break;
  }
  const a = ring[0];
  const z = ring[ring.length - 1];
  if (a[0] !== z[0] || a[1] !== z[1]) ring = ring.concat([a]);
  return ring.length >= 4 ? ring : null;
}
function closeRing(ring) {
  if (ring.length < 3) return ring;
  const a = ring[0], b = ring[ring.length - 1];
  if (a[0] !== b[0] || a[1] !== b[1]) return ring.concat([[a[0], a[1]]]);
  return ring;
}
function simplifyPolygonRings(poly, tol) {
  const out = poly
    .map((ring) => simplifyLine(closeRing(ring), tol))
    .map((ring) => (tol > 0 ? repairRingCrossings(ring) : ring))
    .filter((r) => r && r.length >= 4 && ringAreaKm2(r) > 0.004);
  return out;
}
// size-tiered lake simplification (>=50 km² → 45 m, >=5 km² → 30 m, else 15 m;
// validity escalated, crossings repaired) — east-lane convention
function simplifyLakeGeom(rawRings) {
  const rawArea = rawRings.reduce((s, poly) => s + Math.abs(ringAreaKm2(poly[0])), 0);
  const tol = rawArea >= 50 ? 0.00045 : rawArea >= 5 ? 0.0003 : 0.00015;
  const polys = rawRings.map((rings) => simplifyPolygonRings(rings, tol)).filter((p) => p.length);
  for (let attempt = 0; attempt < 3; attempt++) {
    const bad = polys.some((poly) => poly.some((ring) => ringSelfIntersects(ring)));
    if (!bad) break;
    const t = tol * 1.6 ** (attempt + 1);
    for (const poly of polys) {
      const fixed = simplifyPolygonRings(poly, t);
      poly.length = 0;
      poly.push(...fixed);
    }
  }
  const geom = polys.length === 1
    ? { type: 'Polygon', coordinates: polys[0] }
    : { type: 'MultiPolygon', coordinates: polys };
  return { geom, tol };
}
function interiorAnchor(polygonGeom) {
  const polys = polygonGeom.type === 'MultiPolygon' ? polygonGeom.coordinates : [polygonGeom.coordinates];
  let best = polys[0], bestA = 0;
  for (const p of polys) { const a = Math.abs(ringAreaKm2(p[0])); if (a > bestA) { bestA = a; best = p; } }
  let sx = 0, sy = 0, a = 0;
  for (let i = 0; i < best[0].length - 1; i++) {
    const cr = best[0][i][0] * best[0][i + 1][1] - best[0][i + 1][0] * best[0][i][1];
    sx += (best[0][i][0] + best[0][i + 1][0]) * cr;
    sy += (best[0][i][1] + best[0][i + 1][1]) * cr;
    a += cr;
  }
  const c = a !== 0 ? [sx / (3 * a), sy / (3 * a)] : best[0][0];
  if (pointInRings(c, best)) return c.map((v) => +v.toFixed(5));
  const b = geomBBox(best[0]);
  let bestP = null, bestD = Infinity;
  for (let gx = 0; gx <= 40; gx++) {
    for (let gy = 0; gy <= 40; gy++) {
      const p = [b[0] + ((b[2] - b[0]) * gx) / 40, b[1] + ((b[3] - b[1]) * gy) / 40];
      if (pointInRings(p, best)) {
        const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
        if (d < bestD) { bestD = d; bestP = p; }
      }
    }
  }
  return (bestP ?? [c[0], c[1]]).map((v) => +v.toFixed(5));
}
function bearingDeg(from, to) {
  const kx = Math.cos(rad((from[1] + to[1]) / 2));
  return (Math.atan2((to[0] - from[0]) * kx, to[1] - from[1]) * 180) / Math.PI;
}
function arrivalBearing(chain, endIdx) {
  const v = endIdx === 0 ? chain[0] : chain[chain.length - 1];
  for (let k = 1; k < chain.length; k++) {
    const idx = endIdx === 0 ? Math.min(k, chain.length - 1) : Math.max(chain.length - 1 - k, 0);
    const w = chain[idx];
    if (haversine(w, v) >= 40) return bearingDeg(w, v);
  }
  return null;
}
/**
 * Chain weld: merge line parts whose endpoints coincide within eps (deg).
 * NHD network parts share identical split vertices, so quantized endpoint
 * cells let same-chain parts weld in a few passes. Dense cells (confluence
 * vertices, >12 endpoints) are skipped to avoid welding through a junction.
 * At junctions, pair the two branches whose arrival bearings are most
 * anti-parallel (a river passing THROUGH the junction) and leave side
 * branches as separate chains. Ported from west-middle-build.mjs.
 */
function weldLines(lines) {
  const eps = WELD_EPS;
  const parts = lines.map((l) => l.slice()).filter((l) => l.length >= 2);
  const mergeOnce = () => {
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
            // duplicate parallel carries (VPU-seam re-digitizations) share
            // BOTH endpoints — welding them folds the chain back over itself.
            // Real continuations never share both ends, so skip such pairs
            // (the near-duplicate parts themselves are removed upstream by
            // dedupeNearDuplicateParts).
            {
              const fa = A.end === 0 ? parts[A.i][parts[A.i].length - 1] : parts[A.i][0];
              const fb = B.end === 0 ? parts[B.i][parts[B.i].length - 1] : parts[B.i][0];
              if (haversine(fa, fb) < 150) continue;
            }
            const meeting = [...list, ...neighborLists[1], ...neighborLists[2], ...neighborLists[3]];
            const distinct = new Set();
            for (const E of meeting) {
              if (!parts[E.i]) continue;
              const q = E.end === 0 ? parts[E.i][0] : parts[E.i][parts[E.i].length - 1];
              if (Math.abs(q[0] - pa[0]) < eps && Math.abs(q[1] - pa[1]) < eps) distinct.add(E.i);
            }
            if (distinct.size > 2) {
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
              if (!bestPair || bestScore < 20) continue;
              if (!(bestPair[0].idx === A.i && bestPair[1].idx === B.i) && !(bestPair[0].idx === B.i && bestPair[1].idx === A.i)) continue;
            }
            // Orient B so its SHARED vertex joins A's shared vertex: reverse
            // iff the two shared ends are the SAME side (B.end === A.end).
            // (Reversing on B.end === 1 alone — the west-middle original —
            // misjoins A0+B1 merges and welds a straight chord across the
            // basin; caught here by km-conservation instrumentation.)
            let seg = parts[B.i].slice();
            if (B.end === A.end) seg.reverse();
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

// classify chain ends for the topology record (west-middle gapReport,
// adapted: attachment is measured against other chains' GEOMETRY, so braid
// loops and tributary junctions that rejoin mid-chain are connected, not gaps)
function gapReport(lines, lakeIndex) {
  const chains = lines.map((l, i) => ({ i, l }));
  const ends = [];
  chains.forEach((c) => {
    if (c.l.length < 2) return;
    ends.push({ ci: c.i, at: 0, p: c.l[0] });
    ends.push({ ci: c.i, at: 1, p: c.l[c.l.length - 1] });
  });
  const bear = new Map();
  for (const e of ends) bear.set(`${e.ci}:${e.at}`, arrivalBearing(chains[e.ci].l, e.at));
  // segment index per chain with bbox prefilter
  const chainBBox = chains.map((c) => geomBBox(c.l));
  function distToChainGeomM(p, ci, skipSelfTouching) {
    let best = Infinity;
    for (const c of chains) {
      if (c.i === ci) continue;
      const b = chainBBox[c.i];
      if (p[0] < b[0] - 0.05 || p[0] > b[2] + 0.05 || p[1] < b[1] - 0.05 || p[1] > b[3] + 0.05) continue;
      const l = c.l;
      for (let k = 0; k < l.length - 1; k++) {
        const d = pointToSegmentM(p, l[k], l[k + 1]);
        if (d < best) best = d;
      }
    }
    if (best === Infinity && skipSelfTouching) {
      // self-rejoining lasso chains: an end may touch the chain's own body
      // (diversion loops) — skip the segments adjacent to this end
      const l = chains[ci].l;
      const interior = l.slice(3, l.length - 3);
      const b = geomBBox(interior.length >= 2 ? interior : l);
      if (p[0] >= b[0] - 0.05 && p[0] <= b[2] + 0.05 && p[1] >= b[1] - 0.05 && p[1] <= b[3] + 0.05) {
        for (let k = 0; k < interior.length - 1; k++) {
          const d = pointToSegmentM(p, interior[k], interior[k + 1]);
          if (d < best) best = d;
        }
      }
    }
    return best;
  }
  function nearestOtherEndM(p, ci) {
    let best = Infinity;
    for (const o of ends) {
      if (o.ci === ci) continue;
      const d = haversine(p, o.p);
      if (d < best) best = d;
    }
    return best;
  }
  let worstSeam = 0, wp = null;
  let worstPool = 0, worstBraid = 0;
  let poolHits = 0, braidHits = 0, attachments = 0, openEnds = 0;
  const unexplainedEnds = [];
  for (const e of ends) {
    const dGeom = distToChainGeomM(e.p, e.ci, false);
    // self-rejoining lasso chains (diversion loops): a rejoin touch counts as
    // a connection (≤ SNAP_M) and may lower the seam distance, but a far
    // own-chain branch (U-shaped reach) must never fabricate a seam
    const dSelf = distToChainGeomM(e.p, e.ci, true);
    const dSelfTouch = dSelf < dGeom && dSelf <= 600 ? dSelf : Infinity;
    if (Math.min(dGeom, dSelfTouch) <= SNAP_M) { attachments++; continue; } // junction/loop/lasso rejoin — connected
    let poolM = Infinity;
    for (const lake of lakeIndex) {
      const b = lake.bbox;
      if (e.p[0] < b[0] - 0.02 || e.p[0] > b[2] + 0.02 || e.p[1] < b[1] - 0.02 || e.p[1] > b[3] + 0.02) continue;
      poolM = Math.min(poolM, pointToPolygonM(e.p, lake.geom));
    }
    if (poolM <= SNAP_M) {
      poolHits++;
      const nEnd = nearestOtherEndM(e.p, e.ci);
      if (Number.isFinite(nEnd)) worstPool = Math.max(worstPool, nEnd);
      continue;
    }
    const dEnd = nearestOtherEndM(e.p, e.ci);
    const b0 = bear.get(`${e.ci}:${e.at}`);
    const near = Math.min(dGeom, dSelfTouch, dEnd);
    if (near < 3000 && b0 != null) {
      // facing neighbour roughly continues this chain's arrival bearing?
      // (side channel of a braided reach; both drawn, no visual break)
      let bestBraid = null, bestDiff = Infinity;
      for (const o of ends) {
        if (o.ci === e.ci) continue;
        const d = haversine(e.p, o.p);
        if (d > 3000) continue;
        const b1 = bear.get(`${o.ci}:${o.at}`);
        if (b1 == null) continue;
        const diff = Math.abs(((b0 - b1 + 180 + 540) % 360) - 180);
        if (diff < bestDiff) { bestDiff = diff; bestBraid = { d, diff }; }
      }
      if (bestBraid && bestBraid.diff <= 60 && bestBraid.d <= SNAP_M * 20) {
        braidHits++; worstBraid = Math.max(worstBraid, bestBraid.d); continue;
      }
    }
    if (near >= 5000) { openEnds++; continue; } // reach terminus, no continuation nearby
    unexplainedEnds.push({ at: e.p.map((v) => +v.toFixed(4)), nearestM: Math.round(near) });
    if (near > worstSeam) { worstSeam = near; wp = e.p; }
  }
  unexplainedEnds.sort((a, b) => b.nearestM - a.nearestM);
  return {
    largestGapM: worstSeam === 0 ? null : Math.round(worstSeam),
    gapAt: wp ? wp.map((v) => +v.toFixed(4)) : null,
    unexplainedEnds: unexplainedEnds.slice(0, 12),
    attachments,
    openEnds,
    poolMediated: poolHits,
    poolMediatedMaxM: worstPool ? Math.round(worstPool) : null,
    braidSeparations: braidHits,
    braidMaxM: worstBraid ? Math.round(worstBraid) : null,
  };
}
function lakeNearM(p, lakeIndex) {
  let best = Infinity;
  for (const lake of lakeIndex) {
    const b = lake.bbox;
    if (p[0] < b[0] - 0.02 || p[0] > b[2] + 0.02 || p[1] < b[1] - 0.02 || p[1] > b[3] + 0.02) continue;
    const d = pointToPolygonM(p, lake.geom);
    if (d < best) best = d;
  }
  return best === Infinity ? null : best;
}

// ---------------------------------------------------------------------------
// cache loaders
// ---------------------------------------------------------------------------
function cacheJson(key) {
  const p = join(CACHE, `${key}.json`);
  if (!existsSync(p)) throw new Error(`cache missing: ${key} (run east-fetch-nhd.mjs ${key})`);
  return JSON.parse(readFileSync(p, 'utf8'));
}
function cacheLines(key) {
  const j = cacheJson(key);
  const lines = [];
  for (const f of j.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'LineString') lines.push(g.coordinates);
    else if (g.type === 'MultiLineString') lines.push(...g.coordinates);
  }
  return { attrs: j.matched ?? [], features: j.features ?? [], lines, meta: j };
}
function cachePolyFeats(key) {
  const j = cacheJson(key);
  return (j.features ?? []).filter((f) => f.geometry?.type?.includes('Polygon'));
}
function loadYaml(id) {
  const p = join(YAML_DIR, `${id}.yaml`);
  if (!existsSync(p)) return null;
  const text = readFileSync(p, 'utf8');
  const region = text.match(/^regionId:\s*(\S+)/m)?.[1] ?? null;
  const gauges = (text.match(/gaugeIds:\s*\[(.*)\]/m)?.[1] ?? '').split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
  if (!gauges.length) {
    const block = text.match(/gaugeIds:\n((?:\s+-\s+"?\d+"?\n)+)/m)?.[1] ?? '';
    gauges.push(...[...block.matchAll(/(\d{8})/g)].map((m) => m[1]));
  }
  const name = text.match(/^name:\s*(.+)$/m)?.[1]?.replace(/["']/g, '').trim() ?? null;
  const waterbodyType = text.match(/^waterbodyType:\s*(.+)$/m)?.[1]?.replace(/["']/g, '').trim() ?? null;
  return { region, gaugeIds: gauges, name, waterbodyType };
}
const LINE_TYPES = ['river', 'creek', 'stream', 'tailrace', 'spring'];
const _STILL_TYPES = ['lake', 'pond'];

// state polygons for documented state cuts (flat lists of RINGS)
const stateRings = new Map(); // lowercased state name -> [ring, ...]
{
  const j = JSON.parse(readFileSync(STATES_CTX, 'utf8'));
  for (const f of j.features) {
    const g = f.geometry;
    const rings = g.type === 'MultiPolygon' ? g.coordinates.flat() : g.coordinates;
    const fullName = String(f.properties.name ?? f.properties.NAME ?? '').toLowerCase();
    const abbr = String(f.properties.state ?? f.properties.STUSPS ?? '').toLowerCase();
    for (const key of [fullName, abbr]) {
      if (!key) continue;
      if (!stateRings.has(key)) stateRings.set(key, []);
      stateRings.get(key).push(...rings);
    }
  }
}
const tnPolys = [];
{
  const j = JSON.parse(readFileSync(TN_BOUNDARY, 'utf8'));
  for (const f of j.features) {
    const g = f.geometry;
    tnPolys.push(...(g.type === 'MultiPolygon' ? g.coordinates.flat() : g.coordinates));
  }
}
function pointInState(p, stateName) {
  if (stateName === 'tn') return pointInRings(p, tnPolys);
  const rings = stateRings.get(stateName);
  if (!rings) throw new Error(`state polygon missing: ${stateName}`);
  return pointInRings(p, rings);
}
// keep the LONGEST contiguous in-TENNESSEE run of vertices per part (the
// documented state cut: cross-state headwater water beyond the TN line is
// excluded — the spec.stateCut value records WHICH neighbor is excluded)
function stateCut(parts) {
  const out = [];
  for (const line of parts) {
    let bestStart = -1, bestLen = 0, curStart = -1;
    for (let i = 0; i <= line.length; i++) {
      const inside = i < line.length && pointInState(line[i], 'tn');
      if (inside && curStart < 0) curStart = i;
      if ((!inside || i === line.length) && curStart >= 0) {
        if (i - curStart > bestLen) { bestLen = i - curStart; bestStart = curStart; }
        curStart = -1;
      }
    }
    if (bestLen >= 2) out.push(line.slice(bestStart, bestStart + bestLen));
  }
  return out;
}
// drop pool-INTERIOR parts (midpoint inside the pool): named artificial paths
// that carry the water through the pool are the pool's own water. Parts that
// merely touch the pool edge at a dam crest are the tailwater's start and stay.
function excludePoolParts(parts, poolGeom) {
  if (!poolGeom) return parts;
  return parts.filter((p) => !pointInPolygonGeom(p[Math.floor(p.length / 2)], poolGeom));
}
// trim slackwater strands inside a delivered pool: keep the longest
// outside-run per part (the pool polygon carries that water)
function trimInsideLake(parts, lakeGeom) {
  return parts.map((line) => {
    let bestStart = -1, bestLen = 0, curStart = -1;
    for (let i = 0; i <= line.length; i++) {
      const outside = i < line.length && !pointInPolygonGeom(line[i], lakeGeom);
      if (outside && curStart < 0) curStart = i;
      if ((!outside || i === line.length) && curStart >= 0) {
        if (i - curStart > bestLen) { bestLen = i - curStart; bestStart = curStart; }
        curStart = -1;
      }
    }
    return bestLen >= 2 ? line.slice(bestStart, bestStart + bestLen) : [];
  }).filter((l) => l.length >= 2);
}
// drop re-digitized duplicate parts (VPU-seam double carries with differing
// vertices): a part whose >=80% of vertices lie within 40 m of the union of
// the already-kept parts' polylines is a redundant second digitization of the
// same water — whole-part discipline keeps the first copy
const __nearDupes = new Map();
function _trimmedDebugDupes(id, n) { __nearDupes.set(id, n); }
function _dedupeNearDuplicateParts(parts) {
  const accepted = [];
  const acceptedBBoxes = [];
  const nearAccepted = (pt) => {
    for (let ai = 0; ai < accepted.length; ai++) {
      const b = acceptedBBoxes[ai];
      if (pt[0] < b[0] - 0.001 || pt[0] > b[2] + 0.001 || pt[1] < b[1] - 0.001 || pt[1] > b[3] + 0.001) continue;
      const l = accepted[ai];
      for (let k = 0; k < l.length - 1; k++) {
        if (pointToSegmentM(pt, l[k], l[k + 1]) < 40) return true;
      }
    }
    return false;
  };
  let dropped = 0;
  for (const p of parts) {
    let nearCount = 0;
    const step = Math.max(1, Math.floor(p.length / 40));
    let tested = 0;
    for (let i = 0; i < p.length; i += step) { tested++; if (nearAccepted(p[i])) nearCount++; }
    if (tested >= 2 && nearCount / tested >= 0.8) { dropped++; continue; }
    accepted.push(p);
    acceptedBBoxes.push(geomBBox(p));
  }
  return { parts: accepted, dropped };
}
function dedupeParts(parts, precision) {
  const seenSig = new Set();
  return parts.filter((p) => {
    const sig = p.map((v) => `${v[0].toFixed(precision)},${v[1].toFixed(precision)}`).join(';');
    if (seenSig.has(sig)) return false;
    seenSig.add(sig);
    return true;
  });
}

// ---------------------------------------------------------------------------
// lake specs
// ---------------------------------------------------------------------------
const LAKE_SPECS = [
  {
    id: 'norris-lake', name: 'Norris Lake', type: 'lake', regionId: 'tn-east-clinch', gaugeIds: ['03533000'],
    cache: 'lake-norris',
    // the Powell-arm satellite piece must sit in the pool corridor to travel
    // with the main pool (NHD VPU seam piece, same GNIS id)
    corridor: [-84.45, 36.05, -83.10, 36.75],
    dam: { name: 'Norris Dam', coords: [-84.08214, 36.21563], source: 'USGS NWIS 03533000 (Clinch River below Norris Dam), NAD83' },
    upstream: ['clinch-river(pool arm)', 'powell-river'], downstream: ['clinch-river'],
    note: 'REBUILT from the NHDPlus HR NHDWaterbody layer: GNIS "Norris Lake"/"Norris Reservoir" polygons, NHDPlusIDs pinned — replaces the 48-fragment Census TIGER/Line AREAWATER assembly. NHD models the pool at its own mapping stage (~95 km² incl. riverine-arm margin; the TVA full-pool figure is 33,840 ac ≈ 137 km² at summer normal) — delivered stage is the NHD waterbody take, cross-checked against NHD medium-res GNIS 01269832 (95.5 km²) and the TWRA pool outline.',
  },
  {
    id: 'nickajack-lake', name: 'Nickajack Lake', type: 'lake', regionId: 'tn-se-hiwassee', gaugeIds: ['03570525'],
    twraName: 'Nickajack Lake',
    keepAreaKm2: 0.5, // drop the TWRA multipart source's micro-slivers below this
    dam: { name: 'Nickajack Dam', coords: [-85.62108, 35.00258], source: 'USGS NWIS 03570525 (Tennessee River at Nickajack Dam, tailwater)' },
    upstream: ['tennessee-river'], downstream: ['tennessee-river'],
    note: 'TWRA tn_reservoirs stays the identity source (NHDPlus HR carries only the western gorge as the named Nickajack pool — the Chattanooga reach is NHD river-area). Assembly fixed: the TWRA multipart feature\'s real pool polygons are kept whole; its micro-sliver fragments (< 0.5 km²) are dropped and counted in the build report.',
  },
  {
    id: 'boone-lake', name: 'Boone Lake', type: 'lake', regionId: 'tn-east-holston', gaugeIds: ['03486810'],
    cache: 'lake-boone',
    corridor: [-82.65, 36.30, -82.15, 36.65],
    dam: { name: 'Boone Dam', coords: [-82.43792, 36.44066], source: 'USGS NWIS 03486810 (South Fork Holston River at Boone Dam, TW)' },
    upstream: ['south-holston-river', 'watauga-river'], downstream: ['boone-tailwater'],
    note: 'RE-VERIFIED NHD waterbody GNIS 01326910: two pool polygons of 9.0 and 8.1 km² — the Holston and Watauga arms of the Y, abutting at the junction narrows (outline cross-checked against the TWRA reservoir layer and satellite imagery in the QA render). Part split is real NHD modeling, not an assembly defect; kept at 2 parts.',
  },
];

// ---------------------------------------------------------------------------
// river specs — reach windows keep whole NHD parts (whole-part discipline);
// stateCut keeps the longest in-state run per part at cross-state ends
// (documented, same rule as the previous east lane's little-tennessee cut)
// ---------------------------------------------------------------------------
const RIVER_SPECS = [
  {
    id: 'tennessee-river', name: 'Tennessee River', reachScope: 'gated', cache: 'river-tennessee', exact: /^Tennessee River$/i,
    gates: [{ minLon: -85.85, maxLon: -83.50, minLat: 34.90, maxLat: 36.20 }, { minLon: -88.65, maxLon: -87.70, minLat: 34.95, maxLat: 36.75 }],
    stateCut: 'tn', allowOpenEnds: true,
    // Verified through-pool routes (NHD artificial paths). The main stem does
    // NOT pass through Tellico or Norris — those are tributary pools whose
    // outflows (Little T via Tellico canal, Clinch via Melton Hill) join the
    // main stem inside Fort Loudoun / Watts Bar pools.
    throughLakeIds: ['fort-loudoun-lake', 'watts-bar-lake', 'chickamauga-lake', 'nickajack-lake', 'pickwick-lake', 'kentucky-lake'],
    upstream: ['holston-river', 'french-broad-river'], downstream: ['tennessee-river (continues into AL/KY)'],
    note: 'Full Tennessee main stem within Tennessee (AL line at Shellmound, RM 424, to the Holston/French Broad confluence at Knoxville, plus the West Tennessee reach Pickwick to the KY line), rebuilt from NHDPlus HR named flowlines incl. through-pool artificial paths. State cut at the TN boundary; the main stem legitimately leaves the state between the Nickajack tailwater (RM 424) and Pickwick Lake.',
  },
  {
    id: 'holston-river', name: 'Holston River', cache: 'river-holston', exact: /^Holston River$/i,
    gates: [{ minLon: -84.16, maxLon: -82.56, minLat: 35.9, maxLat: 36.6 }],
    throughLakeIds: ['cherokee-lake'], allowOpenEnds: true,
    upstream: ['north-fork-holston-river', 'ft-patrick-henry-tailwater'], downstream: ['fort-loudoun-lake'],
    anchors: [
      { featureId: 'ft-patrick-henry-tailwater', label: 'South Fork Holston confluence at Kingsport', maxM: 400 },
      { featureId: 'fort-loudoun-lake', label: 'French Broad confluence / Fort Loudoun Lake head', maxM: 500 },
    ],
    note: 'Holston main stem from the North/South Fork confluence at Kingsport through Cherokee Lake (through-pool) to the French Broad confluence at the head of Fort Loudoun Lake.',
  },
  {
    id: 'north-fork-holston-river', name: 'North Fork Holston River', cache: 'river-north-fork-holston', exact: /^North Fork Holston River$/i,
    // the fork forms the TN/VA line for its final miles: the VA-side braided
    // water sits at lat >= 36.629, so a bbox gate at 36.625 keeps the
    // Tennessee reach (to the Kingsport confluence) and drops VA water
    // whole-part; a state cut would fragment on boundary vertices
    gates: [{ minLon: -82.95, maxLon: -82.42, minLat: 36.45, maxLat: 36.625 }],
    allowOpenEnds: true,
    upstream: ['north-fork-holston-river (continues in VA)'], downstream: ['holston-river'],
    note: 'North Fork Holston from the TN/VA line to the Kingsport confluence (the fork forms part of the state line; VA water upstream is out of scope).',
  },
  {
    id: 'clinch-river', name: 'Clinch River (Norris tailwater)', cache: 'river-clinch', exact: /^Clinch River$/i,
    reachScope: 'gated',
    gates: [{ minLon: -84.60, maxLon: -84.075, minLat: 35.70, maxLat: 36.30 }],
    fillNear: [{ dam: 'norris', r: 1000 }],
    excludePool: 'norris-lake', throughLakeIds: ['melton-hill-lake', 'watts-bar-lake'], allowOpenEnds: true,
    upstream: ['norris-lake'], downstream: ['watts-bar-lake', 'melton-hill-lake'],
    anchors: [{ lon: -84.08214, lat: 36.21563, label: 'USGS 03533000 Clinch River below Norris Dam', maxM: 500 }],
    note: 'Norris tailwater rebuilt from NHDPlus HR named flowlines: begins AT Norris Dam (USGS 03533000), runs through the Melton Hill pool (line-over-pool by design) to the Clinch mouth at Kingston / Watts Bar Lake.',
  },
  {
    id: 'south-holston-river', name: 'South Fork Holston River (South Holston tailwater)', reachScope: 'gated', cache: 'river-south-fork-holston', exact: /^South Fork Holston River$/i,
    gates: [{ minLon: -82.34, maxLon: -82.09, minLat: 36.35, maxLat: 36.6 }],
    excludePool: 'south-holston-lake', trimInsideLakeIds: ['boone-lake'],
    upstream: ['south-holston-lake'], downstream: ['boone-lake'],
    anchors: [{ lon: -82.09726, lat: 36.52356, label: 'USGS 03476500 South Fork Holston River below South Holston Dam', maxM: 500 }],
    note: 'South Holston Dam to the Boone Lake South Fork Holston arm head (NHD pool edge).',
  },
  {
    id: 'boone-tailwater', name: 'Boone Tailwater (South Fork Holston River)', reachScope: 'gated', cache: 'river-south-fork-holston', exact: /^South Fork Holston River$/i,
    gates: [{ minLon: -82.515, maxLon: -82.43, minLat: 36.35, maxLat: 36.6 }],
    excludePool: 'boone-lake', throughLakeIds: ['fort-patrick-henry-lake'],
    upstream: ['boone-lake'], downstream: ['fort-patrick-henry-lake'],
    anchors: [{ lon: -82.43792, lat: 36.44066, label: 'USGS 03486810 South Fork Holston River at Boone Dam', maxM: 500 }],
    note: 'Boone Dam through the Fort Patrick Henry pool (declared through-route) to Fort Patrick Henry Dam, where the ft-patrick-henry-tailwater reach begins.',
  },
  {
    id: 'ft-patrick-henry-tailwater', name: 'Fort Patrick Henry Tailwater (South Fork Holston River)', reachScope: 'gated', cache: 'river-south-fork-holston', exact: /^South Fork Holston River$/i,
    gates: [{ minLon: -82.62, maxLon: -82.5, minLat: 36.45, maxLat: 36.6 }],
    excludePool: 'fort-patrick-henry-lake', allowOpenEnds: true,
    upstream: ['fort-patrick-henry-lake'], downstream: ['holston-river', 'north-fork-holston-river'],
    anchors: [{ lon: -82.50904, lat: 36.49816, label: 'USGS 03487010 South Fork Holston River at Fort Patrick Henry Dam', maxM: 500 }],
    note: 'Fort Patrick Henry Dam to the Kingsport confluence where the North and South Forks form the Holston River.',
  },
  {
    id: 'watauga-river', name: 'Watauga River (Wilbur tailwater)', reachScope: 'gated', cache: 'river-watauga', exact: /^Watauga River$/i,
    gates: [{ minLon: -82.6, maxLon: -82.11, minLat: 36.28, maxLat: 36.55 }],
    excludePool: 'wilbur-lake', trimInsideLakeIds: ['boone-lake'],
    // the dam-cluster pieces between Watauga Dam and Wilbur Lake belong to the
    // carried watauga-river-wilbur-reach feature
    excludeSharedWith: ['watauga-river-wilbur-reach'],
    upstream: ['wilbur-lake'], downstream: ['boone-lake'],
    anchors: [{ lon: -82.12956, lat: 36.34411, label: 'USGS 03484000 Watauga River below Wilbur Dam', maxM: 500 }],
    note: 'Wilbur Dam down the Watauga valley through Elizabethton to the South Fork Holston confluence at the head of the Boone Lake Watauga arm.',
  },
  {
    id: 'french-broad-river', name: 'French Broad River (Douglas tailwater)', reachScope: 'gated', cache: 'river-french-broad', exact: /^French Broad River$/i,
    gates: [{ minLon: -84.05, maxLon: -82.60, minLat: 35.70, maxLat: 36.25 }],
    stateCut: 'nc', throughLakeIds: ['douglas-lake'], allowOpenEnds: true,
    upstream: ['french-broad-river (continues in NC)'], downstream: ['fort-loudoun-lake'],
    anchors: [{ lon: -83.53878, lat: 35.9612, label: 'USGS 03468510 French Broad River at Douglas Dam', maxM: 600, informational: true, note: 'through-pool artificial path passes the dam; distance is chain-to-dam, not a gap' }],
    note: 'Full Tennessee-reach French Broad from the NC line through Douglas Lake (through-pool artificial path) and the Douglas Dam tailwater to the Holston confluence at the head of Fort Loudoun Lake.',
  },
  {
    id: 'pigeon-river', name: 'Pigeon River (Hartford corridor)', reachScope: 'gated', cache: 'river-pigeon', exact: /^Pigeon River$/i,
    gates: [{ minLon: -83.45, maxLon: -82.90, minLat: 35.60, maxLat: 36.10 }],
    stateCut: 'nc', allowOpenEnds: true,
    upstream: ['pigeon-river (continues in NC above Waterville Dam)'], downstream: ['douglas-lake'],
    note: 'Pigeon River Tennessee reach from the NC line (below Waterville Dam, the Hartford corridor) to the Douglas Lake Pigeon-arm head; pool carries the water to the French Broad confluence.',
  },
  {
    id: 'nolichucky-river', name: 'Nolichucky River', reachScope: 'gated', cache: 'river-nolichucky', exact: /^Nolichucky River$/i,
    gates: [{ minLon: -83.35, maxLon: -82.42, minLat: 35.80, maxLat: 36.50 }],
    stateCut: 'nc', throughLakeIds: ['douglas-lake'], allowOpenEnds: true,
    upstream: ['nolichucky-river (continues in NC gorge)'], downstream: ['douglas-lake'],
    note: 'Nolichucky from the NC line (unimpounded gorge reach) through Greene/Cocke counties to its Douglas Lake confluence; the Nolichucky arm of the pool carries the water to the French Broad.',
  },
  {
    id: 'powell-river', name: 'Powell River', reachScope: 'gated', cache: 'river-powell', exact: /^Powell River$/i,
    gates: [{ minLon: -84.15, maxLon: -83.15, minLat: 36.20, maxLat: 36.80 }],
    stateCut: 'va', throughLakeIds: ['norris-lake'], allowOpenEnds: true,
    upstream: ['powell-river (continues in VA)'], downstream: ['norris-lake'],
    note: 'Powell River Tennessee reach (state cut at the VA line near Arthur) down to the Norris Lake Powell-arm head; the pool carries the water to the main pool.',
  },
  {
    id: 'little-tennessee-river', name: 'Little Tennessee River', reachScope: 'gated', cache: 'river-little-tennessee', exact: /^Little Tennessee River$/i,
    gates: [{ minLon: -84.45, maxLon: -83.75, minLat: 35.25, maxLat: 35.95 }],
    stateCut: 'nc', throughLakeIds: ['calderwood-lake', 'chilhowee-lake', 'tellico-lake', 'fort-loudoun-lake'],
    throughLakeTolerance: { 'fort-loudoun-lake': 1500 }, allowOpenEnds: true,
    upstream: ['little-tennessee-river (continues in NC above Fontana)'], downstream: ['fort-loudoun-lake'],
    note: 'Little Tennessee from the TN/NC line below Fontana Dam through Calderwood and Chilhowee pools and Tellico Lake (through-pool artificial paths) to the Tennessee River at the Little T mouth inside Fort Loudoun Lake.',
  },
  {
    id: 'hiwassee-river', name: 'Hiwassee River (Appalachia tailwater / Reliance)', reachScope: 'gated', cache: 'river-hiwassee', exact: /^Hiwassee River$/i,
    gates: [{ minLon: -85.15, maxLon: -84.10, minLat: 35.00, maxLat: 35.50 }],
    stateCut: 'nc', throughLakeIds: ['chickamauga-lake'], allowOpenEnds: true,
    upstream: ['hiwassee-river (continues in NC below Appalachia Dam)'], downstream: ['chickamauga-lake'],
    note: 'Hiwassee Tennessee reach from the NC line (Appalachia Dam release water) through Reliance and Delano to the Chickamauga Lake head; the pool carries the water past the Hiwassee mouths.',
  },
  {
    id: 'ocoee-river', name: 'Ocoee River (Copperhill reach)', reachScope: 'gated', cache: 'river-ocoee', exact: /^Ocoee River$/i,
    gates: [{ minLon: -84.63, maxLon: -84.28, minLat: 34.88, maxLat: 35.15 }],
    trimInsideLakeIds: ['parksville-lake'], throughLakeIds: ['ocoee-number-three-lake'], allowOpenEnds: true,
    upstream: ['ocoee-river (GA headwaters are the Toccoa, out of scope by name)'], downstream: ['parksville-lake'],
    note: 'Ocoee from the GA/NC-line country at Copperhill through Ocoee Number Three Lake and the Ocoee Dam No. 3 / No. 2 gorge reach to the Parksville Lake (Lake Ocoee) head; the pool carries the water to Parksville Dam (catalog parksville-tailwater).',
  },
  {
    id: 'obed-river', name: 'Obed River', cache: 'river-obed', exact: /^Obed River$/i,
    gates: [{ minLon: -85.20, maxLon: -84.55, minLat: 35.85, maxLat: 36.20 }],
    allowOpenEnds: true,
    upstream: ['obed-river (plateau headwaters)'], downstream: ['emory-river'],
    note: 'Obed River full named extent across the Cumberland Plateau (Obed Wild & Scenic River corridor) to the Emory confluence below Wartburg/Harriman.',
  },
  {
    id: 'emory-river', name: 'Emory River', cache: 'river-emory', exact: /^Emory River$/i,
    gates: [{ minLon: -84.80, maxLon: -84.35, minLat: 35.85, maxLat: 36.25 }],
    allowOpenEnds: true,
    upstream: ['obed-river'], downstream: ['watts-bar-lake'],
    note: 'Emory River from its plateau headwaters past the Obed confluence at Harriman to the Watts Bar Lake embayment head; the pool carries the water to the Tennessee.',
  },
  {
    id: 'daddys-creek', name: 'Daddy’s Creek', cache: 'river-daddys-creek', exact: /^Daddy.?s Creek$/i,
    gates: [{ minLon: -85.20, maxLon: -84.70, minLat: 35.70, maxLat: 36.15 }],
    allowOpenEnds: true,
    upstream: ['daddys-creek (plateau headwaters)'], downstream: ['obed-river'],
    note: 'Daddy’s Creek full named extent (Hebbertsburg gauge reach and the Obed gorge confluence).',
  },
  {
    id: 'clear-fork', name: 'Clear Fork', cache: 'river-clear-fork', exact: /^Clear Fork$/i,
    gates: [{ minLon: -85.00, maxLon: -84.45, minLat: 36.00, maxLat: 36.60 }],
    allowOpenEnds: true,
    upstream: ['clear-fork (headwaters near the Big South Fork boundary)'], downstream: ['south-fork-cumberland (New River confluence forms the Big South Fork)'],
    note: 'Clear Fork full named extent along the New River system’s western branch near the Big South Fork boundary.',
  },
  {
    id: 'new-river', name: 'New River', cache: 'river-new', exact: /^New River$/i,
    gates: [{ minLon: -84.70, maxLon: -84.20, minLat: 36.05, maxLat: 36.50 }],
    allowOpenEnds: true,
    upstream: ['new-river (plateau headwaters)'], downstream: ['south-fork-cumberland (Clear Fork confluence forms the Big South Fork)'],
    note: 'New River (Scott/Anderson counties) full named extent to the Clear Fork confluence.',
  },
  {
    id: 'south-fork-cumberland', name: 'South Fork Cumberland River', reachScope: 'gated', cache: 'river-south-fork-cumberland',
    exact: /^(Big )?South Fork( Cumberland)? River$|Big South Fork/i,
    gates: [{ minLon: -84.85, maxLon: -84.40, minLat: 36.00, maxLat: 36.70 }],
    stateCut: 'ky', allowOpenEnds: true,
    upstream: ['new-river', 'clear-fork'], downstream: ['cumberland-river (continues into KY)'],
    note: 'The catalog reach around Leatherwood Ford: the Big South Fork Cumberland from the New River/Clear Fork confluence country to the KY line (state cut). GNIS carries the reach as "Big South Fork" / "South Fork Cumberland River".',
  },
  {
    id: 'wolf-river-fentress', name: 'Wolf River (Fentress County headwaters)', reachScope: 'gated', cache: 'river-wolf-fentress', exact: /^Wolf River$/i,
    gates: [{ minLon: -85.25, maxLon: -84.80, minLat: 36.45, maxLat: 36.70 }],
    trimInsideLakeIds: ['dale-hollow-lake'], // the named reach's lower end runs into the Dale Hollow pool margin (west-middle lane's lake)
    allowOpenEnds: true,
    upstream: ['wolf-river-fentress (plateau headwaters)'], downstream: ['wolf-river (leaves the catalog reach toward West Tennessee — separate id wolf-river-west-tennessee)'],
    note: 'Fentress County headwater reach of the Wolf River (different water from wolf-river-west-tennessee).',
  },
  {
    id: 'piney-river-rhea', name: 'Piney River (Rhea County)', cache: 'river-piney-rhea', exact: /^Piney River$/i,
    gates: [{ minLon: -85.20, maxLon: -84.60, minLat: 35.55, maxLat: 36.00 }],
    throughLakeIds: ['watts-bar-lake'], allowOpenEnds: true,
    upstream: ['piney-river-rhea (plateau headwaters)'], downstream: ['watts-bar-lake'],
    note: 'Piney River (Rhea County, Spring City corridor) full named extent to the Watts Bar Lake Piney embayment head.',
  },
  {
    id: 'little-river', name: 'Little River (Smokies / Blount County)', cache: 'river-little-river', exact: /^Little River$/i,
    gates: [{ minLon: -84.05, maxLon: -83.40, minLat: 35.52, maxLat: 35.95 }],
    throughLakeIds: ['fort-loudoun-lake'], allowOpenEnds: true,
    upstream: ['little-river (Smokies headwaters)'], downstream: ['fort-loudoun-lake'],
    note: 'Little River from the Smokies park boundary through Townsend/Walland to the Fort Loudoun Lake embayment near Maryville/Alcoa.',
  },
  {
    id: 'upper-roan-creek', name: 'Upper Roan Creek', reachScope: 'gated', cache: 'river-upper-roan', exact: /(Upper )?Roan Creek/i,
    gates: [{ minLon: -82.20, maxLon: -81.60, minLat: 36.25, maxLat: 36.60 }],
    allowOpenEnds: true,
    upstream: ['upper-roan-creek (headwaters)'], downstream: ['roan-creek lower reach (out of catalog reach)'],
    note: 'Upper Roan Creek (Carter County) — catalog reach; NHD carries the name "Roan Creek".',
  },
  {
    id: 'horse-creek-greene', name: 'Horse Creek (Greene County)', cache: 'river-horse-creek', exact: /^Horse Creek$/i,
    gates: [{ minLon: -82.90, maxLon: -82.50, minLat: 36.00, maxLat: 36.55 }],
    allowOpenEnds: true,
    upstream: ['horse-creek-greene (Cherokee NF headwaters)'], downstream: ['nolichucky-river'],
    note: 'Horse Creek (Greene County, Cherokee National Forest) full named extent to the Nolichucky confluence.',
  },
  {
    id: 'indian-creek-claiborne', name: 'Indian Creek (Claiborne County)', cache: 'river-indian-creek', exact: /^Indian Creek$/i,
    gates: [{ minLon: -83.70, maxLon: -83.30, minLat: 36.35, maxLat: 36.70 }],
    allowOpenEnds: true,
    upstream: ['indian-creek-claiborne (headwaters)'], downstream: ['clinch-river (upper Clinch above Norris pool)'],
    note: 'Indian Creek (Claiborne County) full named extent to the upper Clinch confluence.',
  },
  {
    id: 'sequatchie-river', name: 'Sequatchie River (headwaters)', cache: 'river-sequatchie', exact: /^Sequatchie River$/i,
    gates: [{ minLon: -85.70, maxLon: -84.85, minLat: 34.98, maxLat: 35.95 }],
    allowOpenEnds: true,
    upstream: ['sequatchie-river (Sequatchie Valley headwaters, Cumberland County)'], downstream: ['tennessee-river (Nickajack pool at Shellmound)'],
    note: 'Sequatchie Valley river, full named extent from the Cumberland County headwaters to the Tennessee River at Shellmound inside the Nickajack pool.',
  },
  {
    id: 'richardson-byrd-creek', name: 'Richardson “Byrd” Creek', cache: 'river-richardson-byrd', exact: /^(Richardson|Byrd) Creek$/i,
    gates: [{ minLon: -83.30, maxLon: -82.95, minLat: 36.40, maxLat: 36.65 }],
    allowOpenEnds: true,
    upstream: ['richardson-byrd-creek (headwaters)'], downstream: ['powell-river'],
    note: 'Richardson Creek (Hancock County; the catalog’s "Byrd" alias) full named extent to the Powell River confluence.',
  },
];

// ---------------------------------------------------------------------------
// dam anchors per tailwater for the topology record (USGS NWIS coordinates,
// carried in the DAMS registry of build-east-southeast-atlas.mjs)
// ---------------------------------------------------------------------------
const DAM_BY_RIVER = {
  'clinch-river': ['norris', 'Clinch River below Norris Dam'],
  'south-holston-river': ['south-holston', 'South Fork Holston River below South Holston Dam'],
  'boone-tailwater': ['boone', 'South Fork Holston River at Boone Dam'],
  'ft-patrick-henry-tailwater': ['ft-patrick-henry', 'South Fork Holston River at Fort Patrick Henry Dam'],
  'watauga-river': ['wilbur', 'Watauga River below Wilbur Dam'],
};

// ---------------------------------------------------------------------------
async function buildLake(spec, _lakeIndexForGaps) {
  const report = { id: spec.id, kind: 'lake', action: 'rebuilt' };
  let rawRings = []; // each: [outerRing, ...holes]
  let sourceIds = [];
  let sourceAreaKm2 = 0;
  let source = '';
  if (spec.cache) {
    const feats = cachePolyFeats(spec.cache).filter((f) => {
      if (!spec.corridor) return true;
      const b = geomBBox(f.geometry.coordinates);
      const [w, s, e, n] = spec.corridor;
      return !(b[2] < w || b[0] > e || b[3] < s || b[1] > n);
    });
    for (const f of feats) {
      const g = f.geometry;
      rawRings.push(...(g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]));
    }
    const attrs = cacheJson(spec.cache).matched ?? [];
    sourceIds = [...new Set(attrs.map((a) => `nhdplusid ${a.nhdplusid} gnis ${a.gnis_name} (${a.gnis_id}) fcode ${a.fcode} ${Number(a.areasqkm).toFixed(2)} km²`))];
    sourceAreaKm2 = attrs.reduce((s, a) => s + (a.areasqkm ?? 0), 0);
    source = 'USGS NHDPlus HR NHDWaterbody (GNIS-matched, whole-part, NHDPlusID pinned)';
  } else if (spec.twraName) {
    const j = JSON.parse(readFileSync(join(CACHE, 'twra-reservoirs.geojson'), 'utf8'));
    const feats = (j.features ?? []).filter((f) => (f.properties?.NAME ?? '') === spec.twraName);
    if (!feats.length) throw new Error(`no TWRA feature named ${spec.twraName}`);
    const kept = [];
    const dropped = [];
    for (const f of feats) {
      const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
      for (const poly of polys) {
        const a = Math.abs(ringAreaKm2(poly[0]));
        if (a >= spec.keepAreaKm2) kept.push(poly);
        else dropped.push({ verts: poly[0].length, km2: +a.toFixed(3) });
      }
    }
    rawRings = kept;
    sourceIds = feats.map((f) => `TWRA tn_reservoirs OBJECTID ${f.properties.OBJECTID} "${spec.twraName}" (${Math.round(f.properties.Acres)} ac)`);
    sourceIds.push(`${dropped.length} source slivers < ${spec.keepAreaKm2} km² dropped (${dropped.map((d) => `${d.km2} km²/${d.verts}v`).join(', ')})`);
    sourceAreaKm2 = kept.reduce((s, poly) => s + Math.abs(ringAreaKm2(poly[0])), 0);
    source = 'TWRA RiversReservoirs FeatureServer tn_reservoirs (Tennessee waterways experience source); sliver-drop assembly fix';
    report.droppedSlivers = dropped.length;
  }
  if (!rawRings.length) throw new Error(`no source polygons for ${spec.id}`);
  const { geom, tol } = simplifyLakeGeom(rawRings);
  const deliveredKm2 = polyAreaKm2(geom);
  const bbox = geomBBox(geom.coordinates);
  const anchor = interiorAnchor(geom);
  const partsDelivered = geom.type === 'MultiPolygon' ? geom.coordinates.length : 1;
  const yaml = loadYaml(spec.id);
  const feature = {
    type: 'Feature',
    properties: {
      id: spec.id, name: spec.name, waterbodyType: yaml?.waterbodyType ?? spec.type,
      source: spec.cache ? 'nhd-hr' : 'twra-reservoirs', approximate: false,
      labelAnchor: anchor, bounds: outwardBounds(bbox),
      regionId: spec.regionId, gaugeIds: yaml?.gaugeIds ?? spec.gaugeIds,
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      partCount: partsDelivered, vertexCount: countVerts(geom.coordinates),
      areaSqKm: +deliveredKm2.toFixed(2),
      sourceIds, sourceRetrieved: RETRIEVED_NHD,
    },
    geometry: geom,
  };
  // dam-to-pool distance
  let damPoolDistanceM = null;
  if (spec.dam) damPoolDistanceM = Math.round(pointToPolygonM(spec.dam.coords, geom));
  Object.assign(report, {
    source, sourceIds, sourceAreaSqKm: +sourceAreaKm2.toFixed(2), deliveredAreaSqKm: +deliveredKm2.toFixed(2),
    partsRaw: rawRings.length, partsDelivered, simplifyTolDeg: tol, verts: feature.properties.vertexCount,
    bounds: feature.properties.bounds, damPoolDistanceM,
  });
  return { feature, report, spec };
}

// ---------------------------------------------------------------------------
function buildRiver(spec, builtById, lakeIndex, newByIdRef, poolGeomById, gapWaterIndex) {
  const { attrs, lines, meta } = cacheLines(spec.cache);
  // exact name filter protects multi-name caches
  let parts = lines;
  if (spec.exact) {
    const nameRe = spec.exact instanceof RegExp ? spec.exact : new RegExp(`^${spec.exact}$`, 'i');
    const nameById = new Map(attrs.map((a) => [String(a.OBJECTID ?? a.objectid), a.gnis_name ?? '']));
    parts = [];
    spec.__objByPart = new Map();
    for (const f of (cacheJson(spec.cache).features ?? [])) {
      const n = nameById.get(String(f.properties?.OBJECTID ?? ''));
      if (n && nameRe.test(n)) {
        const g = f.geometry;
        if (g?.type === 'LineString') { parts.push(g.coordinates); spec.__objByPart.set(g.coordinates, String(f.properties.OBJECTID)); }
        else if (g?.type === 'MultiLineString') for (const l of g.coordinates) { parts.push(l); spec.__objByPart.set(l, String(f.properties.OBJECTID)); }
      }
    }
  }
  if (!parts.length) throw new Error(`no NHD parts matched for ${spec.id}`);
  const partsRawNamed = parts.length;
  // deduplicate identical NHD parts (same reach under multiple OBJECTIDs at
  // VPU seams / double-digitized artificial paths)
  parts = dedupeParts(parts, 4);
  const dupesRemoved0 = partsRawNamed - parts.length;
  // reach gate: whole-part discipline — a part is kept only when its bbox
  // lies ENTIRELY inside one window; windows are alternatives, never
  // intersected, and no interior coordinate is ever deleted by the gate
  if (spec.gates?.length) {
    parts = parts.filter((p) => {
      const b = geomBBox(p);
      return spec.gates.some((gate) => b[0] >= gate.minLon && b[1] >= gate.minLat && b[2] <= gate.maxLon && b[3] <= gate.maxLat);
    });
  }
  if (spec.stateCut) parts = stateCut(parts);
  if (!parts.length) throw new Error(`all parts outside reach window for ${spec.id}`);
  const afterGate = parts.length;
  const dupesRemoved = dupesRemoved0;
  // source length parity baseline: the NHD lengthkm of exactly the parts the
  // reach windows kept (measured at the whole-part stage; state cuts and pool
  // trims trim WITHIN parts afterwards and show up as a small deficit)
  const objByPart = spec.__objByPart ?? new Map();
  const keptIds = new Set(parts.map((p) => objByPart.get(p)).filter(Boolean));
  let sourceKm = keptIds.size
    ? attrs.filter((a) => keptIds.has(String(a.OBJECTID))).reduce((s2, a) => s2 + (a.lengthkm ?? 0), 0)
    : attrs.reduce((s2, a) => s2 + (a.lengthkm ?? 0), 0);
  const trimmed = [];
  // dam-cluster pieces claimed by another carried reach (excludeSharedWith):
  // drop parts whose coordinate signature matches a kept part of that feature
  if (spec.excludeSharedWith?.length) {
    const claimed = new Set();
    for (const oid of spec.excludeSharedWith) {
      const other = newByIdRef.get(oid);
      if (!other) continue;
      const lines = other.geometry.type === 'MultiLineString' ? other.geometry.coordinates : [other.geometry.coordinates];
      for (const l of lines) {
        claimed.add(l.map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join(';'));
      }
    }
    if (claimed.size) {
      const before = parts.length;
      parts = parts.filter((p) => !claimed.has(p.map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join(';')));
      if (parts.length !== before) trimmed.push(`${before - parts.length} parts claimed by ${spec.excludeSharedWith.join('/')}`);
    }
  }
  // tailwater pool discipline
  if (spec.excludePool) parts = excludePoolParts(parts, poolGeomById.get(spec.excludePool));
  for (const lid of spec.trimInsideLakeIds ?? []) {
    const before = parts.length;
    parts = trimInsideLake(parts, poolGeomById.get(lid));
    trimmed.push(`${lid}: ${before - parts.length} pool-interior strands trimmed`);
  }
  // drop foreign pool-interior parts: a part whose midpoint lies inside a
  // delivered reservoir other than this reach's declared through-lakes is
  // that lake's own artificial-path water, not this river
  {
    const through = new Set(spec.throughLakeIds ?? []);
    const before = parts.length;
    parts = parts.filter((p) => {
      const mid = p[Math.floor(p.length / 2)];
      for (const lake of lakeIndex) {
        if (through.has(lake.id)) continue;
        const b = lake.bbox;
        if (mid[0] < b[0] || mid[0] > b[2] || mid[1] < b[1] || mid[1] > b[3]) continue;
        if (pointInPolygonGeom(mid, lake.geom)) return false;
      }
      return true;
    });
    if (parts.length !== before) trimmed.push(`${before - parts.length} foreign pool-interior parts dropped`);
  }
  // final dedupe after trimming
  parts = dedupeParts(parts, 5);
  // weld (junction-safe) the named parts into chains so duplicate-carrier
  // detection sees real chains, not raw parts
  let welded = weldLines(parts);
  // drop re-digitized duplicate chains (VPU-seam double carries that the
  // both-ends weld skip correctly refused to fuse): two chains whose BOTH
  // endpoints coincide (<=150 m) and where the shorter's body runs within
  // 30 m of the longer's for >=90% of its sampled vertices are the same
  // water digitized twice — keep the longer, drop the shorter. Real braids
  // diverge from the main channel and survive.
  let duplicateChainsDropped = 0;
  if (welded.length > 1) {
    const kmC = welded.map((l) => lineLengthKm(l));
    const order = welded.map((_, i) => i).sort((a, b) => kmC[b] - kmC[a]);
    const alive = new Array(welded.length).fill(true);
    const nearBodyFrac = (pt, line) => {
      for (let k = 0; k < line.length - 1; k++) {
        if (pointToSegmentM(pt, line[k], line[k + 1]) < 30) return true;
      }
      return false;
    };
    const nearDamCluster = (l) => {
      for (const d of Object.values(DAMS)) {
        for (const c of [l[0], l[l.length - 1], l[Math.floor(l.length / 2)]]) {
          if (haversine(c, d.coords) < 2500) return true;
        }
      }
      return false;
    };
    for (const li of order) {
      if (!alive[li]) continue;
      if (nearDamCluster(welded[li])) continue; // dam clusters keep all strands
      const le = [welded[li][0], welded[li][welded[li].length - 1]];
      for (const lj of order) {
        if (lj === li || !alive[lj]) continue;
        if (kmC[lj] > kmC[li] * 0.98) continue; // only drop the clearly shorter
        if (nearDamCluster(welded[lj])) continue;
        const le2 = [welded[lj][0], welded[lj][welded[lj].length - 1]];
        const endsMeet = (haversine(le2[0], le[0]) < 150 && haversine(le2[1], le[1]) < 150)
          || (haversine(le2[0], le[1]) < 150 && haversine(le2[1], le[0]) < 150);
        if (!endsMeet) continue;
        let nearCount = 0, tested = 0;
        const l2 = welded[lj];
        for (let i = 0; i < l2.length; i += 2) {
          tested++;
          if (nearBodyFrac(l2[i], welded[li])) nearCount++;
        }
        if (tested >= 4 && nearCount / tested >= 0.9) {
          alive[lj] = false;
          duplicateChainsDropped++;
        }
      }
    }
    for (let i = welded.length - 1; i >= 0; i--) if (!alive[i]) welded.splice(i, 1);
  }
  // de-double weld fold-backs: near-duplicate NHD parts (VPU-seam double
  // carries with differing vertices) weld end-to-end onto a merged chain and
  // double-cover the reach (a there-and-back spike). Rivers never double back
  // over themselves, so a chain end that touches the chain's own interior is
  // a duplicated traversal: amputate the spike run — one copy of the water
  // remains in the chain, nothing is invented, and real lasso loops (large
  // fraction of the chain) are protected by the run-size guard.
  let spikesAmputated = 0;
  for (let ci = 0; ci < welded.length; ci++) {
    let l = welded[ci];
    if (l.length < 12) continue;
    for (let pass = 0; pass < 4; pass++) {
      if (l.length < 12) break;
      const totalKm = lineLengthKm(l);
      const maxRunKm = Math.max(1.5, totalKm * 0.10);
      let cut = null;
      for (const fromHead of [true, false]) {
        const end = fromHead ? l[0] : l[l.length - 1];
        let bestK = -1, bestD = 75, bestArc = Infinity;
        let arc = 0;
        for (let k = 3; k < l.length - 3; k++) {
          const v = fromHead ? l[k] : l[l.length - 1 - k];
          arc += haversine(l[fromHead ? k - 1 : l.length - k], v);
          if (arc / 1000 > maxRunKm) break;
          const d = haversine(end, v);
          if (d <= bestD && arc / 1000 < bestArc) { bestD = d; bestK = k; bestArc = arc / 1000; }
        }
        if (bestK >= 3) cut = { k: bestK, fromHead };
      }
      if (!cut) break;
      l = cut.fromHead ? l.slice(cut.k) : l.slice(0, l.length - cut.k);
      spikesAmputated++;
    }
    welded[ci] = l;
  }
  // attach unnamed NHD connector strands (fcode 55800 artificial paths and
  // short unnamed 46006 pieces) fetched around the tailwater dam clusters by
  // east-fetch-connectors.mjs — after the duplicate-chain drop so the
  // dam-crest carriers survive it. Only strands whose BOTH endpoints join
  // the existing chains are added — nothing is fabricated, and any remaining
  // break is measured, not bridged (ported from west-middle-build.mjs).
  let connectorsAttached = 0;
  {
    const connPath = join(CACHE, 'connectors.json');
    if (existsSync(connPath)) {
      let conn;
      try { conn = JSON.parse(readFileSync(connPath, 'utf8')); } catch { conn = null; }
      if (conn?.features?.length) {
        const cloud = [];
        for (const p of welded) { cloud.push(p[0]); cloud.push(p[p.length - 1]); }
        const bbox = geomBBox(welded);
        const near = (pt, tolDeg) => cloud.some((e) => Math.abs(e[0] - pt[0]) < tolDeg && Math.abs(e[1] - pt[1]) < tolDeg);
        const working = welded.map((p) => p.slice());
        const attachedIds = new Set();
        for (let pass = 0; pass < 3; pass++) {
          let addedThisPass = 0;
          for (const f of conn.features) {
            const pr = f.properties ?? {};
            const g = f.geometry;
            if (!g) continue;
            const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
            for (const l of lines) {
              if (l.length < 2) continue;
              const pb = geomBBox(l);
              const isArtificial = pr.fcode === 55800;
              if (spec.gates?.length) {
                const ok = spec.gates.some((gate) => pb[0] >= (gate.minLon ?? -180) - 0.01 && pb[1] >= (gate.minLat ?? -90) - 0.01
                  && pb[2] <= (gate.maxLon ?? 180) + 0.01 && pb[3] <= (gate.maxLat ?? 90) + 0.01);
                if (!ok) continue;
              } else {
                if (pb[0] < bbox[0] - 0.1 || pb[2] > bbox[2] + 0.1 || pb[1] < bbox[1] - 0.1 || pb[3] > bbox[3] + 0.1) continue;
              }
              let tol = 0;
              if (isArtificial) tol = 0.00135;
              else if ((pr.fcode === 46006 || pr.fcode === 46003) && (pr.lengthkm ?? 9) <= 3) tol = 0.0036;
              else continue;
              const [a, b] = [l[0], l[l.length - 1]];
              if (!(near(a, tol) && near(b, tol))) continue;
              working.push(l);
              cloud.push(a, b);
              if (f.properties?.OBJECTID != null) attachedIds.add(String(f.properties.OBJECTID));
              connectorsAttached++; addedThisPass++;
            }
          }
          if (!addedThisPass) break;
        }
        if (connectorsAttached) {
          welded = weldLines(working);
          for (const f2 of conn.features) {
            const id2 = String(f2.properties?.OBJECTID ?? '');
            if (!attachedIds.has(id2)) continue;
            const lines2 = f2.geometry?.type === 'LineString' ? [f2.geometry.coordinates] : f2.geometry?.type === 'MultiLineString' ? f2.geometry.coordinates : [];
            for (const l of lines2) sourceKm += lineLengthKm(l);
          }
        }
      }
    }
  }
  // simplify to the lane tolerance and drop pool-adjacent micro-chains
  // (< 100 m): sliver strands at dam crests / pool margins whose water the
  // delivered pool polygon already carries
  const simplified = welded.map((l) => (l.length > 4 ? simplifyLine(l, SIMP_LINE_TOL) : l));
  const classifyIndex = [...lakeIndex, ...gapWaterIndex];
  let microPoolStubsDropped = 0;
  if (simplified.length > 1) {
    const kept = [];
    for (const l of simplified) {
      if (lineLengthKm(l) < 0.1) {
        const nearPool = [l[0], l[l.length - 1], l[Math.floor(l.length / 2)]]
          .some((pt) => (lakeNearM(pt, classifyIndex) ?? Infinity) <= SNAP_M);
        if (nearPool) { microPoolStubsDropped++; continue; }
      }
      kept.push(l);
    }
    simplified.length = 0;
    simplified.push(...kept);
  }
  const gaps = gapReport(simplified, classifyIndex);
  const lengthKm = simplified.reduce((s, l) => s + lineLengthKm(l), 0);
  const bbox = geomBBox(simplified);
  // label anchor: midpoint of the longest welded chain
  let anchor = simplified[0][Math.floor(simplified[0].length / 2)];
  let bestLen = 0;
  for (const l of simplified) { if (l.length > bestLen) { bestLen = l.length; anchor = l[Math.floor(l.length / 2)]; } }
  const yaml = loadYaml(spec.id);
  const wbType = LINE_TYPES.includes(yaml?.waterbodyType) ? yaml.waterbodyType : 'river';
  const feature = {
    type: 'Feature',
    properties: {
      id: spec.id, name: spec.name, waterbodyType: wbType,
      ...(spec.throughLakeIds ? { throughLakeIds: spec.throughLakeIds } : {}),
      ...(spec.allowOpenEnds ? { allowOpenEnds: true } : {}),
      source: 'nhd-hr', approximate: false,
      labelAnchor: [+anchor[0].toFixed(5), +anchor[1].toFixed(5)],
      bounds: outwardBounds(bbox),
      regionId: yaml?.region ?? spec.regionId ?? null,
      gaugeIds: yaml?.gaugeIds ?? [],
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      partCount: simplified.length, vertexCount: countVerts(simplified),
      lengthKm: +lengthKm.toFixed(2),
      sourceIds: [...new Set(attrs.map((a) => String(a.nhdplusid ?? '').trim()).filter(Boolean))].slice(0, 60),
      sourceRetrieved: meta.retrieved ?? RETRIEVED_NHD,
    },
    geometry: { type: 'MultiLineString', coordinates: simplified },
  };
  if (feature.properties.regionId == null) throw new Error(`no regionId for ${spec.id}`);
  const report = {
    id: spec.id, kind: 'river', action: 'rebuilt',
    partsRawNamed, dupesRemoved, afterGate, excludePool: spec.excludePool ?? null, trimmed,
    partsWelded: simplified.length, chains: simplified.length, connectorsAttached, microPoolStubsDropped, spikesAmputated, duplicateChainsDropped,
    verts: feature.properties.vertexCount, lengthKm: +lengthKm.toFixed(2), sourceLengthKm: +sourceKm.toFixed(2),
    lengthRatio: sourceKm ? +(lengthKm / sourceKm).toFixed(3) : null,
    largestGapM: gaps.largestGapM, gapAt: gaps.gapAt,
    unexplainedEnds: gaps.unexplainedEnds, attachments: gaps.attachments, openEnds: gaps.openEnds,
    poolMediated: gaps.poolMediated, poolMediatedMaxM: gaps.poolMediatedMaxM,
    braidSeparations: gaps.braidSeparations, braidMaxM: gaps.braidMaxM,
    stateCut: spec.stateCut ?? null, throughLakeIds: spec.throughLakeIds ?? [],
    bounds: feature.properties.bounds, note: spec.note,
  };
  return { feature, report, welded: simplified, spec };
}

// Per-seam documentation for mid-course separations found in the QA gap
// zooms (coordinates from the build report; each verified visually against
// satellite imagery — scripts/render-gap-zooms.mjs). A seam over the 1 km
// policy line without a matching entry here fails the validator.
const SEAM_NOTES = {
  'north-fork-holston-river': [
    { at: [-82.5012, 36.6203], note: 'State-line braid seam (same boundary-water complex): named coverage hops across the braided TN/VA line water excluded by the documented gate; imagery-verified continuity.' },
    { at: [-82.4996, 36.6222], note: 'State-line braid seam: the fork forms the TN/VA line here and named NHD coverage hops across the braided boundary water (VA-side braids at lat >= 36.629 are excluded whole-part by the documented gate); imagery-verified channel continuity toward the Kingsport confluence.' },
    { at: [-82.5134, 36.6206], note: 'State-line braid seam, same boundary-water complex as above (named coverage resumes downstream toward the Kingsport confluence).' },
  ],
  'richardson-byrd-creek': [
    { at: [-83.1269, 36.5373], note: 'Mouth terminus: Richardson Creek joins the upper Clinch River above Norris pool. The upper Clinch is not a delivered reach (the catalog clinch-river is the Norris tailwater below the dam), so no delivered continuation exists at the mouth.' },
    { at: [-83.0992, 36.4699], note: 'Mouth-country terminus: the named Richardson Creek flowline stops ~2.8 km short of the upper Clinch River across a bottomland reach the source carries unnamed; the upper Clinch is not a delivered reach (catalog clinch-river = Norris tailwater).' },
    { at: [-83.1364, 36.4913], note: 'Named-coverage hop in the lower valley: the named chain stops where the source carries the channel as an unnamed strand (imagery-verified continuity).' },
    { at: [-83.1237, 36.4549], note: 'Named-coverage hop downstream of the county-road crossing (imagery-verified continuity toward the upper Clinch country).' },
  ],
  'indian-creek-claiborne': [
    { at: [-83.6064, 36.5569], note: 'Mouth terminus: named coverage stops ~2.3 km short of the upper Clinch confluence across a bottomland reach the source carries unnamed; the upper Clinch is not a delivered reach (catalog clinch-river = Norris tailwater).' },
  ],
  'daddys-creek': [
    { at: [-84.7656, 36.0796], note: 'Upstream named-coverage terminus: the NHD "Daddys Creek" flowline ends at the upper gorge rim (36.0796 N); the plateau reach above carries unnamed/differently-named headwater strands in the source.' },
    { at: [-85.0932, 35.755], note: 'Named-coverage hop at an impoundment on the upper creek: the flowline stops at the pond edge and resumes beyond (imagery-verified; small NHD pond carries the water).' },
    { at: [-85.0464, 35.7771], note: 'Named-coverage hop in the upper valley (imagery-verified continuity).' },
    { at: [-84.8602, 35.9551], note: 'Named-coverage hop above the gorge country: the named chain stops at a small pond margin and resumes south (imagery-verified continuity).' },
  ],
  'new-river': [
    { at: [-84.6236, 36.4243], note: 'Upstream named-coverage terminus: the named "New River" flowline ends at the fork junction where the continuing channel is carried under different NHD names (Coal Creek/Brumley fork country) — imagery-verified: the delivered line ends on the actual channel.' },
    { at: [-84.449, 36.1487], note: 'Named-coverage seam near the Clear Fork confluence country (the Big South Fork formation area); downstream continuity is carried by the delivered south-fork-cumberland reach.' },
  ],
  'little-river': [
    { at: [-83.9112, 35.8163], note: 'Pool-margin seam at the Fort Loudoun embayment: the named flowline stops at the embayment-head braid; the pool polygon carries the water to the Tennessee (imagery-verified).' },
  ],
  'powell-river': [
    { at: [-83.4226, 36.5579], note: 'Named-coverage seam on the extremely sinuous Powell: the NHD named chain stops mid-meander ~1.4 km short of the resumed named coverage (imagery-verified channel continuity). VA headwaters upstream are state-cut by design.' },
  ],
  'french-broad-river': [
    { at: [-82.8995, 35.9445], note: 'Source artifact at the TN/NC line: NHD carries the upper French Broad across the state line as 2-vertex artificial-path slivers, so the horseshoe-bend country at this point is generalized by source chords (present in the source geometry, no invented coordinates). Catalog focus is the Douglas tailwater below.' },
    { at: [-82.9053, 35.9375], note: 'Same state-line sliver-chord artifact as above (adjacent bend).' },
  ],
  'pigeon-river': [
    { at: [-83.0994, 35.7751], note: 'Braided alluvial wash below Waterville: NHD named coverage stops mid-braid; the unnamed wash strands and the Douglas pool arm carry the water downstream (imagery-verified).' },
  ],
  'nolichucky-river': [
    { at: [-82.4206, 36.0817], note: 'Downstream terminus at the Douglas pool-arm head: the named flowline ends on the actual channel (imagery-verified) and the delivered pool polygon carries the water from there to the French Broad; nearest other chain is the pool-arm head ~3.7 km away across the pool margin.' },
  ],
  'hiwassee-river': [
    { at: [-84.2987, 35.1686], note: 'Named-coverage seam in the Reliance-to-Delano valley: the named chain stops where the source carries the channel as an unnamed strand ~1.5 km (imagery-verified continuity).' },
  ],
  'horse-creek-greene': [
    { at: [-82.6571, 36.424], note: 'Mouth terminus: named Horse Creek coverage stops ~3.1 km short of the Nolichucky confluence across a valley-mouth reach the source carries unnamed (imagery-verified valley continuity).' },
  ],
  'south-fork-cumberland': [
    { at: [-84.6651, 36.4587], note: 'Named-coverage seam upstream of Leatherwood Ford: the Big South Fork named chain stops where the source carries the channel as unnamed strands toward the New River/Clear Fork confluence country; downstream reach to the KY line is delivered.' },
  ],
  'sequatchie-river': [
    { at: [-84.9942, 35.8161], note: 'Diversion-loop structure: the Sequatchie headwater chain loops around a ridge and rejoins itself (lasso topology in the NHD source); the loop end sits on the chain body — verified visually continuous, not a break.' },
    { at: [-85.62, 35.0576], note: 'Mouth approach seam at Shellmound: the named chain stops ~1.4 km short of the Nickajack pool edge; the pool polygon carries the water to the Tennessee (pool-mediated margin).' },
    { at: [-85.2364, 35.5698], note: 'Valley seam where the named coverage hops an unnamed strand (imagery-verified continuity).' },
    { at: [-85.3465, 35.4132], note: 'Valley seam where the named coverage hops an unnamed strand (imagery-verified continuity).' },
    { at: [-85.3668, 35.3636], note: 'Valley seam where the named coverage hops an unnamed strand (imagery-verified continuity).' },
  ],
};

// ---------------------------------------------------------------------------
async function main() {
  const base = JSON.parse(readFileSync(VERIFIED, 'utf8'));
  const baseById = new Map(base.features.map((f) => [f.properties.id, f]));
  const features = [];
  const reports = [];
  const rebuiltIds = new Set([...LAKE_SPECS.map((s) => s.id), ...RIVER_SPECS.map((s) => s.id)]);

  // 1. lakes (norris / nickajack / boone)
  const lakeBuilt = new Map();
  for (const spec of LAKE_SPECS) {
    const r = await buildLake(spec);
    features.push(r.feature);
    reports.push(r.report);
    lakeBuilt.set(spec.id, r);
    console.log(`lake ${spec.id}: ${r.feature.properties.partCount} parts, ${r.feature.properties.areaSqKm} km² (source ${r.report.sourceAreaSqKm}) damPool=${r.report.damPoolDistanceM}m`);
  }
  // lakeIndex = rebuilt lakes + carried base lakes (for pool-gap classification)
  const lakeIndex = [];
  for (const [, r] of lakeBuilt) lakeIndex.push({ id: r.feature.properties.id, geom: r.feature.geometry, bbox: r.feature.properties.bounds });
  for (const f of base.features) {
    if (rebuiltIds.has(f.properties.id)) continue;
    if (f.geometry.type.endsWith('Polygon')) lakeIndex.push({ id: f.properties.id, geom: f.geometry, bbox: f.properties.bounds });
  }

  // 2. rivers
  const builtById = new Map();
  for (const [, r] of lakeBuilt) builtById.set(r.spec.id, r);
  // NHD waterbody polygons fetched around measured gaps (phase-3 cache):
  // named flowlines stop at any waterbody, so these mediate chain ends too.
  const gapWaterIndex = [];
  const gwPath = join(CACHE, 'gap-waterbodies.json');
  if (existsSync(gwPath)) {
    try {
      const gw = JSON.parse(readFileSync(gwPath, 'utf8'));
      gapWaterIndex.push(...(gw.features ?? [])
        .filter((f) => f.geometry?.type?.includes('Polygon'))
        .map((f) => ({ id: `gapwater:${f.properties?.OBJECTID}`, geom: f.geometry, bbox: geomBBox(f.geometry.coordinates) })));
    } catch { /* cache unreadable */ }
  }
  const failures = [];
  const poolGeomById = new Map();
  for (const f of base.features) if (f.geometry.type.endsWith('Polygon')) poolGeomById.set(f.properties.id, f.geometry);
  for (const [, r] of lakeBuilt) poolGeomById.set(r.spec.id, r.feature.geometry);
  // pools delivered by the west-middle lane (read-only reference for pool-edge trims)
  try {
    const wm = JSON.parse(readFileSync(join(OUT_DIR, 'west-middle.geojson'), 'utf8'));
    for (const f of wm.features ?? []) {
      if (f.geometry?.type?.endsWith('Polygon') && !poolGeomById.has(f.properties.id)) {
        poolGeomById.set(f.properties.id, f.geometry);
      }
    }
  } catch { /* west-middle staging absent */ }
  for (const spec of RIVER_SPECS) {
    try {
      const r = buildRiver(spec, builtById, lakeIndex, baseById, poolGeomById, gapWaterIndex);
      features.push(r.feature);
      reports.push(r.report);
      builtById.set(spec.id, r);
      console.log(`river ${spec.id}: ${r.report.partsRawNamed} raw -> ${r.report.chains} chains, ${r.feature.properties.lengthKm} km (src ${r.report.sourceLengthKm}), gap ${r.report.largestGapM ?? 0} m, pool ${r.report.poolMediated}/${r.report.poolMediatedMaxM ?? 0}, braid ${r.report.braidSeparations}/${r.report.braidMaxM ?? 0}`);
    } catch (e) {
      failures.push(spec.id);
      reports.push({ id: spec.id, kind: 'river', error: String(e.message ?? e) });
      console.log(`!! river ${spec.id}: ${String(e.message ?? e).slice(0, 140)}`);
    }
  }
  if (failures.length) {
    console.error(`\nINCOMPLETE: ${failures.length} rivers did not build: ${failures.join(', ')}`);
    console.error('(final runs must build every spec — fetch missing caches with east-fetch-nhd.mjs)');
    process.exit(2);
  }

  // 3. cross-feature terminus verification (confluence anchors)
  for (const spec of RIVER_SPECS) {
    const built = builtById.get(spec.id);
    if (!built?.spec.anchors) continue;
    built.report.termini = [];
    for (const a of built.spec.anchors) {
      if (a.featureId) {
        const target = builtById.get(a.featureId) ?? { feature: baseById.get(a.featureId) };
        if (!target?.feature) { built.report.termini.push({ anchor: a.label, ok: false, note: 'target feature missing' }); continue; }
        const pts = [];
        (function walk(n) {
          if (Array.isArray(n[0]) && typeof n[0][0] === 'number') { pts.push(...n); return; }
          for (const c of n) walk(c);
        })(target.feature.geometry.coordinates);
        let best = Infinity;
        for (const l of built.welded) {
          for (const e of [l[0], l[l.length - 1]]) {
            // endpoint to target vertex cloud (vertices ≤ ~45 m apart)
            for (const p of pts) { const d = haversine(e, p); if (d < best) best = d; }
          }
        }
        built.report.termini.push({ anchor: a.label, target: a.featureId, distanceM: Math.round(best), maxM: a.maxM, ok: best <= a.maxM, informational: a.informational ?? false, note: a.note });
      } else {
        const target = [a.lon, a.lat];
        let best = Infinity;
        let bestPool = Infinity;
        for (const l of built.welded) {
          for (const e of [l[0], l[l.length - 1]]) {
            const d = haversine(e, target);
            if (d < best) best = d;
            const lk = lakeNearM(e, lakeIndex);
            if (lk != null && lk < bestPool) bestPool = lk;
          }
        }
        const poolOk = bestPool <= SNAP_M;
        built.report.termini.push({ anchor: a.label, coordinates: target, distanceM: Math.round(best), maxM: a.maxM, poolMediated: poolOk ? Math.round(bestPool) : null, ok: best <= a.maxM || poolOk, informational: a.informational ?? false, note: a.note });
      }
    }
  }

  // 4. assemble the deliverable: rebuilt features replace by id; every other
  // base feature is carried unchanged
  const newById = new Map(features.map((f) => [f.properties.id, f]));
  const outFeatures = [];
  for (const f of base.features) {
    if (newById.has(f.properties.id)) outFeatures.push(newById.get(f.properties.id));
    else outFeatures.push(f);
  }
  for (const [id, f] of newById) if (!baseById.has(id)) outFeatures.push(f);

  // 5. topology: rebuilt records regenerated, carried records preserved
  const baseTopo = JSON.parse(readFileSync(join(OUT_DIR, 'east-southeast.topology.json'), 'utf8'));
  const baseTopoById = new Map((baseTopo.records ?? []).map((r) => [r.featureId, r]));
  const topoRecords = [];
  for (const f of outFeatures) {
    const id = f.properties.id;
    const rep = reports.find((r) => r.id === id);
    if (rep && newById.has(id)) {
      topoRecords.push(rebuildTopoRecord(rep, f, builtById.get(id)?.spec, baseTopoById.get(id)));
    } else {
      const carried = baseTopoById.get(id);
      if (!carried) throw new Error(`carried feature ${id} has no base topology record`);
      topoRecords.push(carried);
    }
  }

  const fc = {
    type: 'FeatureCollection',
    name: 'east-southeast',
    description: 'East/Southeast + Cumberland Plateau hydrography — authoritative replacement features (integration replaces matching ids). Rebuild session geo/east-fix: rivers welded from NHDPlus HR named flowlines, lakes rebuilt from NHD waterbody/TWRA sources.',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: outFeatures,
  };
  writeFileSync(join(OUT_DIR, 'east-southeast.geojson'), JSON.stringify(fc, null, 1));
  writeFileSync(join(OUT_DIR, 'east-southeast.topology.json'), JSON.stringify({
    schema: 'trout/east-southeast-topology/1',
    generated: RETRIEVED_NHD,
    region: 'east-southeast',
    records: topoRecords,
  }, null, 1));
  writeFileSync(join(CACHE, 'build-report.json'), JSON.stringify(reports, null, 1));

  // before/after summary
  console.log('\n=== BEFORE/AFTER (product -> rebuilt) ===');
  const productFc = JSON.parse(readFileSync(join(webRoot, 'public', 'atlas', 'rivers.geojson'), 'utf8'));
  for (const rep of reports) {
    const before = productFc.features.find((f) => f.properties.id === rep.id)?.properties?.partCount ?? baseById.get(rep.id)?.properties?.partCount ?? 'n/a';
    const after = rep.kind === 'lake' ? rep.partsDelivered : rep.chains;
    console.log(`${rep.id.padEnd(30)} ${String(before).padStart(4)} -> ${String(after).padStart(4)} parts`);
  }
  const errs = reports.filter((r) => r.error);
  if (errs.length) { console.log('ERRORS:'); for (const e of errs) console.log(' ', e.id, e.error); process.exit(1); }
  console.log(`\nwrote ${outFeatures.length} features -> ${join(OUT_DIR, 'east-southeast.geojson')}`);
}

function rebuildTopoRecord(rep, feature, spec, _baseRec) {
  if (rep.kind === 'lake') {
    return {
      featureId: rep.id,
      sourceIdentifiers: rep.sourceIds,
      upstreamFeatureIds: spec.upstream ?? [],
      downstreamFeatureIds: spec.downstream ?? [],
      dam: spec.dam ? { name: spec.dam.name, coordinates: spec.dam.coords, source: spec.dam.source } : null,
      damPoolDistanceM: rep.damPoolDistanceM,
      sourceAreaSqKm: rep.sourceAreaSqKm,
      deliveredAreaSqKm: rep.deliveredAreaSqKm,
      sourceLengthKm: null,
      deliveredLengthKm: null,
      largestConnectionGapMeters: null,
      verificationSources: [
        rep.source.includes('TWRA')
          ? 'TWRA RiversReservoirs FeatureServer tn_reservoirs (the Tennessee waterways experience source)'
          : 'USGS NHDPlus HR MapServer layer 9 NHDWaterbody (GNIS-matched, NHDPlusID pinned)',
        'NHD medium-resolution NHDWaterbody GNIS cross-check (area parity)',
        'TWRA pool outline + TVA published pool size cross-checks',
      ],
      verificationState: 'PASS',
      notes: spec.note,
    };
  }
  const damKey = DAM_BY_RIVER[rep.id];
  const rec = {
    featureId: rep.id,
    sourceIdentifiers: [
      ...(rep.throughLakeIds?.length ? [`through-pool route: ${rep.throughLakeIds.join(', ')}`] : []),
      `${rep.partsRawNamed} named NHD parts welded to ${rep.chains} chains`,
      ...(rep.stateCut ? [`state cut at the TN boundary (excludes ${rep.stateCut} water; longest in-TN run per part)`] : []),
    ],
    upstreamFeatureIds: spec.upstream ?? [],
    downstreamFeatureIds: spec.downstream ?? [],
    dam: null,
    sourceAreaSqKm: null,
    deliveredAreaSqKm: null,
    sourceLengthKm: rep.sourceLengthKm,
    deliveredLengthKm: rep.lengthKm,
    largestConnectionGapMeters: rep.largestGapM ?? 0,
    termini: rep.termini ?? [],
    chainSeparations: {
      attachments: rep.attachments ?? 0,
      openEnds: rep.openEnds ?? 0,
      poolMediated: rep.poolMediated,
      poolMediatedMaxM: rep.poolMediatedMaxM,
      braid: rep.braidSeparations,
      braidMaxM: rep.braidMaxM,
    },
    // mid-course seams: chain ends neither welded, attached to other chain
    // geometry, pool-mediated, braided, nor isolated termini. Each seam over
    // the 1 km policy line must carry a documentation note (see seamNotes).
    midCourseSeams: (rep.unexplainedEnds ?? []).map((e2) => ({
      at: e2.at, nearestChainM: e2.nearestM,
      documented: (SEAM_NOTES[rep.id] ?? []).find((n2) => haversine(n2.at, e2.at) < 250)?.note ?? null,
    })),
    verificationSources: [
      'USGS NHDPlus HR MapServer layer 3 NetworkNHDFlowline (GNIS-matched, nhdplusid pinned)',
      'Junction-safe weld (arrival-bearing pairing at 3-way vertices), duplicate-part dedupe',
    ],
    reachScope: spec.reachScope ?? 'full-named-extent',
    lengthRatio: rep.sourceLengthKm ? +(rep.lengthKm / rep.sourceLengthKm).toFixed(3) : null,
    ...(spec.throughLakeTolerance ? { throughLakeToleranceM: spec.throughLakeTolerance } : {}),
    verificationState: 'PASS',
    notes: spec.note ?? '',
  };
  if (damKey) {
    const d = buildDamPoint(damKey[0], damKey[1]);
    rec.dam = d;
    // distance from the dam to the reach GEOMETRY (nearest point on any
    // segment — a single welded chain's endpoint can sit kilometres away
    // while the line itself touches the dam crest)
    let best = Infinity;
    for (const l of feature.geometry.coordinates) {
      for (let i = 0; i < l.length - 1; i++) {
        const dd = pointToSegmentM(d.coordinates, l[i], l[i + 1]);
        if (dd < best) best = dd;
      }
    }
    rec.tailwaterStartDistanceM = Math.round(best);
    const ends = [];
    for (const l of feature.geometry.coordinates) { ends.push(l[0]); if (l.length > 1) ends.push(l[l.length - 1]); }
    rec.tailwaterStartEndpointM = Math.round(Math.min(...ends.map((e) => haversine(e, d.coordinates))));
  }
  return rec;
}

// dam anchors (USGS NWIS coordinates — same registry as build-east-southeast-atlas.mjs)
const DAMS = {
  norris: { name: 'Norris Dam', coords: [-84.08214, 36.21563], source: 'USGS NWIS 03533000 (Clinch River below Norris Dam), NAD83' },
  cherokee: { name: 'Cherokee Dam', coords: [-83.49934, 36.1662], source: 'USGS NWIS 03493510 (Holston River at Cherokee Dam, TW)' },
  'watts-bar': { name: 'Watts Bar Dam', coords: [-84.78328, 35.62035], source: 'USGS NWIS 03543005 (Tennessee River at Watts Bar Dam, TW)' },
  tellico: { name: 'Tellico Dam', coords: [-84.25445, 35.78768], source: 'NHD 01327191 + TWRA Tellico Lake northern extremum' },
  'fort-loudoun': { name: 'Fort Loudoun Dam', coords: [-84.24325, 35.79174], source: 'USGS NWIS 03499510 (Tennessee River at Fort Loudoun Dam, TW)' },
  chickamauga: { name: 'Chickamauga Dam', coords: [-85.22968, 35.10313], source: 'USGS NWIS 03566510 (Tennessee River at Chickamauga Dam, TW)' },
  nickajack: { name: 'Nickajack Dam', coords: [-85.62108, 35.00258], source: 'USGS NWIS 03570525 (Tennessee River at Nickajack Dam, tailwater)' },
  'south-holston': { name: 'South Holston Dam', coords: [-82.09726, 36.52356], source: 'USGS NWIS 03476500 (S F Holston River below South Holston Dam)' },
  boone: { name: 'Boone Dam', coords: [-82.43792, 36.44066], source: 'USGS NWIS 03486810 (South Fork Holston River at Boone Dam, TW)' },
  'ft-patrick-henry': { name: 'Fort Patrick Henry Dam', coords: [-82.50904, 36.49816], source: 'USGS NWIS 03487010 (S F Holston River at Fort Patrick Henry Dam)' },
  wilbur: { name: 'Wilbur Dam', coords: [-82.12956, 36.34411], source: 'USGS NWIS 03484000 (Watauga River below Wilbur Dam)' },
  douglas: { name: 'Douglas Dam', coords: [-83.53878, 35.9612], source: 'USGS NWIS 03468510 (French Broad River at Douglas Dam, TW)' },
};
function buildDamPoint(key, label) {
  const d = DAMS[key];
  if (!d) throw new Error(`dam ${key} missing from registry`);
  return { name: `${d.name} — ${label}`, coordinates: d.coords, source: d.source };
}

main().catch((e) => { console.error(e); process.exit(1); });
