/* global console */
// Shared library for the west/middle geometry fix scripts (geometry lane
// 2026-09-08). Each scripts/fix-*.mjs rebuilds ONE affected water from its
// NHDPlus HR take (apps/web/.atlas-src/west-middle/<key>.json, fetched by
// west-middle-fetch-nhd.mjs) and writes the result into the region artifact
// (atlas-sources/verified/west-middle.geojson + west-middle.topology.json),
// which integrate-verified-atlas.mjs later merges into canonical BY ID.
//
// Rules honored (same as west-middle-build.mjs):
//   - whole-part discipline: NHD reaches (network parts) are kept whole; the
//     only mid-part operation allowed is the documented REACH-SPLIT at a
//     pinned vertex (caney-fork damCut precedent) used to hand a continuous
//     main stem between two reach-scoped features — the split vertex is shared
//     by both features, so no coordinate is lost or duplicated.
//   - authoritative-ID extraction: reaches are pinned by nhdplusid and ordered
//     by the NHDPlus VAA network topology (hydroseq / dnhydroseq /
//     levelpathi / pathlength) carried in the takes since 2026-09-08 — never
//     by endpoint-weld heuristics.
//   - snapping: only exact/<=50 m endpoint joins are welded implicitly by
//     concatenation; larger seams are measured and reported.
//   - connections through reservoirs use the NHD artificial paths (fcode
//     55800/46003) carried in the takes.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(webRoot, '.atlas-src', 'west-middle');
export const REGION_GEO = join(webRoot, 'atlas-sources', 'verified', 'west-middle.geojson');
export const REGION_TOPO = join(webRoot, 'atlas-sources', 'verified', 'west-middle.topology.json');

const rad = (d) => (d * Math.PI) / 180;
export const M_PER_DEG_LAT = 111320;
export function haversine(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}
export function lineLenKm(l) {
  let m = 0;
  for (let i = 1; i < l.length; i++) m += haversine(l[i - 1], l[i]);
  return m / 1000;
}
export function geomBBox(lines) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const l of lines) for (const [x, y] of l) {
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x;
    if (y > b[3]) b[3] = y;
  }
  return b;
}
export function outwardBounds(b) {
  return [Math.floor(b[0] * 1e6) / 1e6, Math.floor(b[1] * 1e6) / 1e6, Math.ceil(b[2] * 1e6) / 1e6, Math.ceil(b[3] * 1e6) / 1e6];
}
export function countVerts(coords) {
  let n = 0;
  (function walk(a) {
    if (Array.isArray(a[0]) && typeof a[0][0] === 'number') { n += a.length; return; }
    for (const c of a) walk(c);
  })(coords);
  return n;
}
export function pointInRings(p, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
export function pointToPolygonM(p, geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'Polygon' ? [geom.coordinates] : [];
  const kx = M_PER_DEG_LAT * Math.cos(rad(p[1]));
  let best = Infinity;
  for (const poly of polys) {
    if (pointInRings(p, poly)) return 0;
    for (const ring of poly) for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i], b = ring[i + 1];
      const px = p[0] * kx, py = p[1] * M_PER_DEG_LAT;
      const ax = a[0] * kx, ay = a[1] * M_PER_DEG_LAT, bx = b[0] * kx, by = b[1] * M_PER_DEG_LAT;
      const dx = bx - ax, dy = by - ay;
      const L2 = dx * dx + dy * dy;
      let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - ax - t * dx, py - ay - t * dy);
      if (d < best) best = d;
    }
  }
  return best;
}
function ringAreaKm2(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  const lat = (ring[0][1] + ring[Math.floor(ring.length / 2)][1]) / 2 || ring[0][1];
  const m2PerDeg2 = M_PER_DEG_LAT * (M_PER_DEG_LAT * Math.cos(rad(lat)));
  return Math.abs(sum / 2) * m2PerDeg2 / 1e6;
}
export function polyAreaKm2(geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'Polygon' ? [geom.coordinates] : [];
  let area = 0;
  for (const poly of polys) area += ringAreaKm2(poly[0]);
  return area;
}

// ---------------------------------------------------------------------------
// take loading + VAA network chain
// ---------------------------------------------------------------------------
export function loadReaches(key, { nameRe = null, levelPath = null } = {}) {
  const j = JSON.parse(readFileSync(join(CACHE, `${key}.json`), 'utf8'));
  const nameById = new Map(j.matched.map((a) => [String(a.OBJECTID), a.gnis_name ?? '']));
  const reaches = [];
  for (const f of j.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    const p = f.properties ?? {};
    const name = nameById.get(String(p.OBJECTID ?? p.objectid ?? p.id ?? '')) ?? p.gnis_name ?? '';
    if (nameRe && !nameRe.test(name)) continue;
    if (levelPath != null && String(p.levelpathi ?? '') !== String(levelPath)) continue;
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    for (const l of lines) reaches.push({ ...p, gnis_name: name, line: l });
  }
  // whole-part dedupe: identical NHD reaches fetched twice (VPU seams)
  const seen = new Set();
  return reaches.filter((r) => {
    const sig = r.line.map((v) => `${v[0].toFixed(4)},${v[1].toFixed(4)}`).join(';');
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

/**
 * Order reaches into the downstream->upstream network chain. The VAA links
 * (reach.dnhydroseq === downstream.hydroseq) nominate the neighbour set at
 * every step; geometry (endpoint distance <= eps) picks the pairing and
 * orientation. Starts from every downstream-terminal reach and keeps the
 * longest walk, then geometrically attaches any leftover whole reaches that
 * abut either chain end (e.g. reaches across a VPU seam whose dnhydroseq
 * leaves the take). Returns { members, seams, dropped } where seams records
 * endpoint gaps > 50 m between consecutive members (never silently bridged).
 * Members are emitted in walk order with `.line` flipped so every member
 * starts at its downstream end (concatenation-ready).
 */
export function buildChain(reaches, eps = 0.0005) {
  if (!reaches.length) throw new Error('buildChain: no reaches');
  const bySeq = new Map(reaches.map((r) => [r.hydroseq, r]));
  const upByDn = new Map();
  for (const r of reaches) {
    if (!upByDn.has(r.dnhydroseq)) upByDn.set(r.dnhydroseq, []);
    upByDn.get(r.dnhydroseq).push(r);
  }
  const starts = reaches.filter((r) => !bySeq.has(r.dnhydroseq));
  let best = [];
  for (const s of starts.length ? starts : [reaches[0]]) {
    const chain = [];
    const seen = new Set();
    let cur = s;
    let walkEnd = null; // the free upstream end of the accumulated chain
    while (cur && !seen.has(cur.hydroseq)) {
      seen.add(cur.hydroseq);
      // orient: if we are walking, attach at walkEnd; else orient toward the
      // upstream candidates (the far end becomes the walk end)
      let line = cur.line;
      const candsHere = (upByDn.get(cur.hydroseq) ?? []).filter((r) => !seen.has(r.hydroseq));
      if (walkEnd) {
        const dHead = haversine(walkEnd, line[0]);
        const dTail = haversine(walkEnd, line.slice(-1)[0]);
        if (dTail < dHead) line = line.slice().reverse();
      } else if (candsHere.length) {
        const endDist = (l) => Math.min(...candsHere.map((c) => Math.min(haversine(l.slice(-1)[0], c.line[0]), haversine(l.slice(-1)[0], c.line.slice(-1)[0]))));
        if (endDist(line.slice().reverse()) < endDist(line)) line = line.slice().reverse();
      }
      chain.push({ ...cur, line });
      walkEnd = line.slice(-1)[0];
      // candidate upstream neighbours: reaches whose downstream link is here
      if (!candsHere.length) break; // network leaves the take
      let next = null, nextD = Infinity;
      for (const c of candsHere) {
        const d = Math.min(haversine(walkEnd, c.line[0]), haversine(walkEnd, c.line.slice(-1)[0]));
        if (d < nextD) { nextD = d; next = c; }
      }
      cur = next;
    }
    if (chain.length > best.length) best = chain;
  }
  const members = best;
  const used = new Set(members.map((r) => r.nhdplusid));
  // geometric tail/head attachment for reaches the VAA links leave outside
  let attached = true;
  while (attached) {
    attached = false;
    for (const r of reaches) {
      if (used.has(r.nhdplusid)) continue;
      const head = members[0].line[0];
      const tail = members[members.length - 1].line.slice(-1)[0];
      const dTailHead = haversine(r.line[0], tail);
      const dTailTail = haversine(r.line.slice(-1)[0], tail);
      const dHeadHead = haversine(r.line.slice(-1)[0], head);
      const dHeadTail = haversine(r.line[0], head);
      if (Math.min(dTailHead, dTailTail) <= eps) {
        members.push({ ...r, line: dTailHead <= dTailTail ? r.line : r.line.slice().reverse() });
        used.add(r.nhdplusid);
        attached = true;
      } else if (Math.min(dHeadHead, dHeadTail) <= eps) {
        const line = dHeadHead <= dHeadTail ? r.line.slice().reverse() : r.line;
        members.unshift({ ...r, line });
        used.add(r.nhdplusid);
        attached = true;
      }
    }
  }
  // measure seams (documented, never bridged): consecutive member ends
  const seams = [];
  for (let i = 0; i < members.length - 1; i++) {
    const d = haversine(members[i].line.slice(-1)[0], members[i + 1].line[0]);
    if (d > 50) seams.push({ afterNhdplusId: members[i].nhdplusid, at: members[i].line.slice(-1)[0].map((v) => +v.toFixed(5)), gapM: Math.round(d) });
  }
  return { members, seams, dropped: reaches.filter((r) => !used.has(r.nhdplusid)) };
}

/**
 * Walk the members, orienting each to flow downstream->upstream, and emit the
 * concatenated chain LineString. Adjacency must be <= eps at every join.
 */
export function concatMembers(members, eps = 0.0005) {
  const out = [];
  let prevEnd = null;
  for (const m of members) {
    let line = m.line;
    if (prevEnd) {
      const dHead = haversine(prevEnd, line[0]);
      const dTail = haversine(prevEnd, line.slice(-1)[0]);
      if (dTail < dHead) line = line.slice().reverse();
      const d = Math.min(dHead, dTail);
      if (d > eps) throw new Error(`concatMembers: ${Math.round(d)} m seam after nhdplusid ${m.nhdplusid} (seams must be reported, not concatenated)`);
      out.push(...line.slice(1));
    } else {
      out.push(...line);
    }
    prevEnd = out.slice(-1)[0];
  }
  return out;
}

/** Split members into [downstream, upstream] at the member BOUNDARY vertex
 * nearest `point` (no mid-member cut; the two features share the vertex). */
export function cutChainAtBoundary(members, point) {
  let best = { d: Infinity, idx: -1 };
  for (let i = 0; i < members.length - 1; i++) {
    const v = members[i].line.slice(-1)[0];
    const d = haversine(v, point);
    if (d < best.d) best = { d, idx: i + 1, at: v };
  }
  if (best.idx < 0) throw new Error('cutChainAtBoundary: single-member chain');
  return { down: members.slice(0, best.idx), up: members.slice(best.idx), splitAt: best.at, distanceM: Math.round(best.d) };
}

/** Split the chain at the chain VERTEX nearest `point` (caney-fork damCut
 * precedent reach-split: the boundary member is cut AT the shared vertex and
 * the vertex travels with both sides; no interior coordinate is deleted). */
export function cutChainAtVertex(members, point) {
  let best = { d: Infinity, mi: -1, vi: -1, at: null };
  members.forEach((m, mi) => {
    m.line.forEach((v, vi) => {
      const d = haversine(v, point);
      if (d < best.d) best = { d, mi, vi, at: v };
    });
  });
  const lo = members.slice(0, best.mi).concat([{ ...members[best.mi], line: members[best.mi].line.slice(0, best.vi + 1) }]);
  const hi = [{ ...members[best.mi], line: members[best.mi].line.slice(best.vi) }].concat(members.slice(best.mi + 1));
  return { down: lo, up: hi, splitAt: best.at, distanceM: Math.round(best.d) };
}

/** Keep only members whose midpoint lies inside none of the given polygons
 * (excludePool semantics), reporting how many were dropped. */
export function dropPoolMembers(members, polys) {
  const kept = members.filter((m) => {
    const mid = m.line[Math.floor(m.line.length / 2)];
    return !polys.some((rings) => pointInRings(mid, rings));
  });
  return { kept, droppedCount: members.length - kept.length };
}

// ---------------------------------------------------------------------------
// chain-end classification (gapReport semantics, leaner)
// ---------------------------------------------------------------------------
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
/** lines: array of LineStrings (the feature's chains); lakeGeoms: delivered
 * pool polygons [{geom}] for pool mediation. Mirrors west-middle-build
 * gapReport: braid = neighbour continues the arrival bearing (<=60 deg);
 * pool = endpoint within 150 m of a pool; gap = the rest. */
export function classifyChainEnds(lines, lakeGeoms = []) {
  const ends = [];
  lines.forEach((l, ci) => {
    if (l.length < 2) return;
    ends.push({ ci, at: 0, p: l[0] });
    ends.push({ ci, at: 1, p: l[l.length - 1] });
  });
  const bear = new Map();
  for (const e of ends) bear.set(`${e.ci}:${e.at}`, arrivalBearing(lines[e.ci], e.at));
  let worstGap = 0, gapAt = null, worstPool = 0, poolCount = 0, worstBraid = 0, braidCount = 0;
  for (const e of ends) {
    let m = Infinity;
    for (const o of ends) {
      if (o.ci === e.ci) continue;
      m = Math.min(m, haversine(e.p, o.p));
    }
    if (m >= 3000) continue;
    const b0 = bear.get(`${e.ci}:${e.at}`);
    let braid = false;
    let bestB = Infinity;
    for (const o of ends) {
      if (o.ci === e.ci) continue;
      const d = haversine(e.p, o.p);
      if (d > m + 1) continue;
      const b1 = bear.get(`${o.ci}:${o.at}`);
      if (b0 == null || b1 == null) continue;
      const diff = Math.abs(((b0 - b1 + 180 + 540) % 360) - 180);
      bestB = Math.min(bestB, diff);
    }
    if (b0 != null && bestB <= 60) braid = true;
    if (braid) { braidCount++; worstBraid = Math.max(worstBraid, m); continue; }
    let pool = Infinity;
    for (const g of lakeGeoms) pool = Math.min(pool, pointToPolygonM(e.p, g));
    if (pool <= 150) { poolCount++; worstPool = Math.max(worstPool, m); continue; }
    if (m > worstGap) { worstGap = m; gapAt = e.p; }
  }
  return {
    largestGapM: worstGap ? Math.round(worstGap) : null,
    gapAt: gapAt ? gapAt.map((v) => +v.toFixed(4)) : null,
    poolMediated: poolCount,
    poolMediatedMaxM: worstPool ? Math.round(worstPool) : null,
    braidSeparations: braidCount,
    braidMaxM: worstBraid ? Math.round(worstBraid) : null,
  };
}

// ---------------------------------------------------------------------------
// region artifact writers (schema/format preserved)
// ---------------------------------------------------------------------------
export function readRegion() {
  return {
    fc: JSON.parse(readFileSync(REGION_GEO, 'utf8')),
    topo: JSON.parse(readFileSync(REGION_TOPO, 'utf8')),
  };
}
function writeRegion(fc, topo) {
  writeFileSync(REGION_GEO, JSON.stringify(fc, null, 1));
  writeFileSync(REGION_TOPO, JSON.stringify(topo, null, 1));
}
/** Replace (or append) the feature with properties.id === feature.properties.id
 * and patch its topology record (fields merged into the existing record). */
export function commitFeature(feature, topoPatch) {
  const { fc, topo } = readRegion();
  const idx = fc.features.findIndex((f) => f.properties?.id === feature.properties.id);
  if (idx >= 0) fc.features[idx] = feature;
  else fc.features.push(feature);
  const rid = topo.records.findIndex((r) => r.featureId === feature.properties.id);
  if (rid >= 0) topo.records[rid] = { ...topo.records[rid], ...topoPatch };
  else topo.records.push({ featureId: feature.properties.id, ...topoPatch });
  writeRegion(fc, topo);
  console.log(`committed ${feature.properties.id} to west-middle.geojson + topology.json`);
}
/** Patch the topology record of ANOTHER feature (e.g. a lake's connections). */
export function commitTopology(featureId, patch) {
  const { fc, topo } = readRegion();
  const rid = topo.records.findIndex((r) => r.featureId === featureId);
  if (rid < 0) throw new Error(`no topology record for ${featureId}`);
  topo.records[rid] = { ...topo.records[rid], ...patch };
  writeRegion(fc, topo);
  console.log(`committed topology patch for ${featureId}`);
}
/** Delivered lake polygon lookup for connection measurements. */
export function lakeGeometry(id) {
  const { fc } = readRegion();
  const f = fc.features.find((x) => x.properties?.id === id);
  if (!f) return null;
  return f.geometry;
}
/** Shorthand feature builder matching the builder contract. */
export function makeLineFeature({ id, name, waterbodyType, regionId, gaugeIds = [], chains, throughLakeIds = null, allowOpenEnds = false, sourceIds, sourceRetrieved, labelAnchor, extraProps = {} }) {
  const b = geomBBox(chains);
  let anchor = labelAnchor;
  if (!anchor) {
    const longest = chains.slice().sort((x, y) => y.length - x.length)[0];
    anchor = longest[Math.floor(longest.length / 2)].map((v) => +v.toFixed(4));
  }
  return {
    type: 'Feature',
    properties: {
      id, name, waterbodyType,
      ...(throughLakeIds ? { throughLakeIds } : {}),
      ...(allowOpenEnds ? { allowOpenEnds: true } : {}),
      source: 'nhd-hr', approximate: false,
      labelAnchor: anchor,
      bounds: outwardBounds(b),
      regionId, gaugeIds,
      crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude',
      partCount: chains.length,
      vertexCount: countVerts(chains),
      lengthKm: +chains.reduce((s, l) => s + lineLenKm(l), 0).toFixed(2),
      sourceIds: [...new Set(sourceIds.map(String))].slice(0, 60),
      sourceRetrieved,
      ...extraProps,
    },
    geometry: { type: 'MultiLineString', coordinates: chains },
  };
}
