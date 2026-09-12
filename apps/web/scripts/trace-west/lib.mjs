// trace-west/lib.mjs — trace-crew WEST extensions on the shared geometry lane
// library (2026-09-08). Geometry primitives are imported from
// scripts/lib-west-middle-fix.mjs (never edited); everything here is NEW
// capability needed to trace NHDPlus HR LEVEL PATHS for the west/middle
// rebuild worklist:
//
//   - loadTake: reach loading from trace/west/takes (named + unnamed refill)
//   - levelPathGroups: group reaches by VAA levelpathi, keep the water's
//     level paths (named-coverage weighted, stray same-name fragments out)
//   - buildLevelPathChain: hydroseq/dnhydroseq walk of ONE level path
//     (wraps lib buildChain) with whole-reach corridor filters
//   - membersToChains: emit welded chains, SPLITTING at seams > eps (seams
//     are documented, never bridged — gap tolerance respected)
//   - chunkStats: continuity-audit chunk semantics (1 km stitch) for
//     before/after metrics
//   - windowFilterMembers: whole-reach state-window / corridor gate
//   - braidGuard: drop secondary chains that merely re-run the main chain
//     (duplicate-corridor rule) with a report
//   - makeArtifact: the out/<id>.json deliverable writer
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  haversine, lineLenKm, geomBBox, outwardBounds, countVerts, buildChain,
  _concatMembers, makeLineFeature,
} from '../lib-west-middle-fix.mjs';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TAKES = join(webRoot, '.atlas-src', 'trace', 'west', 'takes');
export const OUT = join(webRoot, '.atlas-src', 'trace', 'west', 'out');
export const REGION_GEO = join(webRoot, 'atlas-sources', 'verified', 'west-middle.geojson');
export const CANONICAL = join(webRoot, 'public', 'atlas', 'rivers.geojson');
export const SELF_X = join(webRoot, '.atlas-src', 'trace', 'west', 'self-x.json');
export const WELD_EPS = 0.0005; // deg ~= 50 m, the documented snap tolerance

// ---------------------------------------------------------------------------
// reaches
// ---------------------------------------------------------------------------
export function reachesOf(feature) {
  const g = feature.geometry;
  if (!g) return [];
  const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
  return lines.map((line) => ({ ...feature.properties, line }));
}

/** Load every reach (named + unnamed refill) from a trace take. Refill
 * reaches carry _refill=true. Whole-part dedupe by geometry signature. */
export function loadTake(key) {
  const file = join(TAKES, `${key}.json`);
  if (!existsSync(file)) throw new Error(`trace take missing: ${file} (run scripts/trace-west/fetch-west.mjs ${key})`);
  const j = JSON.parse(readFileSync(file, 'utf8'));
  const reaches = [];
  for (const f of j.features ?? []) reaches.push(...reachesOf(f));
  const seen = new Set();
  return {
    take: j,
    reaches: reaches.filter((r) => {
      const sig = r.line.map((v) => `${v[0].toFixed(4)},${v[1].toFixed(4)}`).join(';');
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    }),
  };
}

// ---------------------------------------------------------------------------
// level-path selection
// ---------------------------------------------------------------------------
/**
 * Group the reaches matching `nameRe` by VAA levelpathi and keep the level
 * paths that carry this water: total named reach length >= max(minKm, keep
 * fraction of the largest group). Stray same-name fragments on off-path
 * divergences (usually < 1 km) are excluded and reported. Returns
 * [{ levelPath, namedKm, reachCount }] sorted by namedKm desc.
 */
export function levelPathGroups(reaches, nameRe, { minKm = 2, keepFrac = 0.08 } = {}) {
  const named = reaches.filter((r) => nameRe.test(r.gnis_name ?? ''));
  const byLp = new Map();
  for (const r of named) {
    const lp = String(r.levelpathi ?? '');
    if (!byLp.has(lp)) byLp.set(lp, { levelPath: lp, namedKm: 0, reachCount: 0 });
    const g = byLp.get(lp);
    g.namedKm += r.lengthkm ?? 0;
    g.reachCount++;
  }
  const groups = [...byLp.values()].sort((a, b) => b.namedKm - a.namedKm);
  if (!groups.length) return [];
  const max = groups[0].namedKm;
  const kept = groups.filter((g) => g.namedKm >= Math.max(minKm, keepFrac * max));
  return { kept, dropped: groups.filter((g) => !kept.includes(g)) };
}

/** All reaches (named or unnamed refill) on the given level paths. */
export function reachesOnLevelPaths(reaches, levelPaths) {
  const set = new Set(levelPaths.map(String));
  return reaches.filter((r) => set.has(String(r.levelpathi ?? '')));
}

/** Whole-reach window gate (state window / catalog corridor): keep only
 * reaches whose EVERY vertex lies inside the window (whole-part discipline —
 * no interior coordinate is ever clipped). */
export function windowFilterMembers(members, win) {
  if (!win) return { kept: members, dropped: [] };
  const kept = [], dropped = [];
  for (const m of members) {
    const inside = m.line.every(([x, y]) => x >= win[0] && y >= win[1] && x <= win[2] && y <= win[3]);
    (inside ? kept : dropped).push(m);
  }
  return { kept, dropped };
}

// ---------------------------------------------------------------------------
// chains
// ---------------------------------------------------------------------------
/**
 * Walk members in order and emit welded LineStrings. A new chain starts at
 * any seam > eps (reported, NEVER bridged); consecutive vertices closer than
 * 0.01 m are deduplicated so exact joins weld 0-seam.
 */
export function membersToChains(members, eps = WELD_EPS) {
  const chains = [];
  const seams = [];
  let cur = null;
  let prevEnd = null;
  let lastId = null;
  for (const m of members) {
    let line = m.line;
    if (prevEnd) {
      const dHead = haversine(prevEnd, line[0]);
      const dTail = haversine(prevEnd, line.slice(-1)[0]);
      if (dTail < dHead) line = line.slice().reverse();
      const d = Math.min(dHead, dTail);
      if (d > eps) {
        seams.push({ afterNhdplusId: lastId, nextNhdplusId: m.nhdplusid, gapM: Math.round(d) });
        if (cur && cur.length > 1) chains.push(cur);
        cur = [];
        prevEnd = null;
      }
    }
    if (!cur) cur = [];
    const start = cur.length && haversine(cur.slice(-1)[0], line[0]) < 0.01 ? 1 : 0;
    for (let i = start; i < line.length; i++) cur.push(line[i]);
    prevEnd = cur.slice(-1)[0];
    lastId = m.nhdplusid;
  }
  if (cur && cur.length > 1) chains.push(cur);
  return { chains, seams };
}

/** Continuity-audit chunk semantics: maximal sets of parts stitched at
 * endpoints within stitchKm. Returns { chunks, largestGapKm, stitchList }. */
export function chunkStats(chains, stitchKm = 1.0) {
  const n = chains.length;
  if (!n) return { chunks: 0, largestGapKm: null };
  const ends = chains.map((l, i) => [{ i, p: l[0] }, { i, p: l[l.length - 1] }]).flat();
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  const union = (a, b) => { parent[find(a)] = find(b); };
  const stitchList = [];
  for (let a = 0; a < ends.length; a++) {
    for (let b = a + 1; b < ends.length; b++) {
      if (ends[a].i === ends[b].i) continue;
      const dKm = haversine(ends[a].p, ends[b].p) / 1000;
      if (dKm <= stitchKm) {
        union(ends[a].i, ends[b].i);
        stitchList.push({ partA: ends[a].i, partB: ends[b].i, gapM: Math.round(dKm * 1000) });
      }
    }
  }
  const rootSet = new Set(chains.map((_, i) => find(i)));
  // largest gap = largest distance from any chain end to the nearest end of
  // ANOTHER chunk (approximates the continuity audit's gaps<=X metric)
  let largestGapKm = 0;
  if (rootSet.size > 1) {
    const chunkOf = (i) => find(i);
    for (const e of ends) {
      let m = Infinity;
      for (const o of ends) {
        if (chunkOf(o.i) === chunkOf(e.i)) continue;
        m = Math.min(m, haversine(e.p, o.p));
      }
      if (Number.isFinite(m)) largestGapKm = Math.max(largestGapKm, m / 1000);
    }
  }
  return { chunks: rootSet.size, largestGapKm: largestGapKm ? +largestGapKm.toFixed(2) : 0, stitchList };
}

/**
 * Braid guard: a secondary chain that merely re-runs the main chain (within
 * 150 m of it for a sustained > 2 km span, the duplicate-corridor rule) is
 * dropped with a report instead of shipping parallel overlapping parts.
 */
export function braidGuard(chains) {
  if (chains.length < 2) return { chains, dropped: [] };
  const kest = [chains[0]];
  const dropped = [];
  const main = chains[0];
  const mainSegs = main.length - 1;
  for (let ci = 1; ci < chains.length; ci++) {
    const c = chains[ci];
    // sample c at ~200 m and measure distance to main's vertices (coarse but
    // sufficient for the 150 m / 2 km sustained test)
    let span = 0, best = 0;
    let acc = 0;
    for (let i = 1; i < c.length; i++) {
      acc += haversine(c[i - 1], c[i]);
      if (acc < 200) continue;
      acc = 0;
      const p = c[i];
      let m = Infinity;
      for (let j = 0; j < main.length; j += 1) {
        const d = haversine(p, main[j]);
        if (d < m) m = d;
        if (m < 150) break;
      }
      if (m < 150) { span += 200; best = Math.max(best, span); } else span = 0;
      void mainSegs;
    }
    if (best > 2000) dropped.push({ chainIndex: ci, lengthKm: +lineLenKm(c).toFixed(2), why: `runs within 150 m of the main chain for ${Math.round(best)} m sustained (braid/duplicate corridor)` });
    else kest.push(c);
  }
  return { chains: kest, dropped };
}

// ---------------------------------------------------------------------------
// full trace of one water
// ---------------------------------------------------------------------------
/**
 * Trace one water's level path(s) end to end.
 *   reaches    — take reaches (loadTake)
 *   nameRe     — the water's NHD gnis_name test
 *   opts.levelPaths — explicit level paths; default: auto via
 *                     levelPathGroups
 *   opts.window     — whole-reach gate [minX,minY,maxX,maxY] (default none)
 * Returns { chains, members, seams, seamList, offPath, windowDropped,
 *           levelPaths, levelPathDropped, vaaKm, sourceIds }.
 */
export function traceWater(reaches, nameRe, opts = {}) {
  const { kept: groups, dropped: lpDropped } = opts.levelPaths
    ? { kept: opts.levelPaths.map((lp) => ({ levelPath: String(lp), namedKm: null, reachCount: null })), dropped: [] }
    : levelPathGroups(reaches, nameRe, opts.levelPathOpts ?? {});
  if (!groups.length) throw new Error(`traceWater: no level path found for ${nameRe}`);
  const allChains = [];
  const allMembers = [];
  const sourceIds = [];
  let vaaKm = 0;
  const windowDropped = [];
  const perLp = [];
  for (const g of groups) {
    const onPath = reachesOnLevelPaths(reaches, [g.levelPath]);
    // window-gate the reaches WHOLE before chaining
    const { kept: gated } = windowFilterMembers(onPath, opts.window ?? null);
    const droppedHere = onPath.filter((r) => !gated.includes(r));
    windowDropped.push(...droppedHere);
    const { members, seams, dropped } = buildChain(gated);
    const { chains, seams: seamList } = membersToChains(members);
    for (const c of chains) allChains.push(c);
    allMembers.push(...members);
    for (const m of members) { sourceIds.push(m.nhdplusid); vaaKm += m.lengthkm ?? 0; }
    perLp.push({
      levelPath: g.levelPath, namedKm: g.namedKm == null ? null : +g.namedKm.toFixed(2),
      reachCount: members.length, chains: chains.length,
      vaaKm: +members.reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2),
      seams: seamList.map((s) => ({ ...s, gapM: s.gapM })),
      droppedOffChain: dropped.length,
      windowDropped: droppedHere.length,
      networkSeams: seams.length,
    });
    if (seams.length) perLp[perLp.length - 1].networkSeamList = seams.map((s) => ({ gapM: s.gapM, at: s.at }));
  }
  const guard = braidGuard(allChains);
  return {
    chains: guard.chains,
    braidDropped: guard.dropped,
    members: allMembers,
    levelPaths: groups.map((g) => g.levelPath),
    levelPathDropped: lpDropped,
    windowDropped,
    perLp,
    vaaKm,
    sourceIds,
  };
}

// ---------------------------------------------------------------------------
// artifacts
// ---------------------------------------------------------------------------
export function loadCanonicalProps(id) {
  const fc = JSON.parse(readFileSync(CANONICAL, 'utf8'));
  const f = fc.features.find((x) => x.properties?.id === id);
  return f ? f.properties : null;
}

export function westMiddleMembership() {
  const fc = JSON.parse(readFileSync(REGION_GEO, 'utf8'));
  return new Set(fc.features.map((f) => f.properties?.id));
}

export function loadSelfX() {
  const j = JSON.parse(readFileSync(SELF_X, 'utf8'));
  return new Map(j.results.map((r) => [r.id, r]));
}

export function makeArtifact({ id, chains, reachesUsed, perLp, opts, before, canonicalProps, wmSet, take }) {
  mkdirSync(OUT, { recursive: true });
  const region = wmSet.has(id) ? 'west-middle' : 'canonical-only';
  const lineLen = +chains.reduce((s, l) => s + lineLenKm(l), 0).toFixed(2);
  const bounds = outwardBounds(geomBBox(chains));
  const afterChunks = chunkStats(chains);
  const throughLakeIds = opts.throughLakeIds ?? null;
  const artifact = {
    id,
    region,
    generatedBy: 'scripts/trace-west/trace-west.mjs',
    source: 'nhd-hr',
    retrieved: take.retrieved,
    geometry: { type: 'MultiLineString', coordinates: chains },
    properties: {
      bounds,
      partCount: chains.length,
      vertexCount: countVerts(chains),
      lengthKm: lineLen,
      sourceIds: [...new Set(reachesUsed.map((m) => String(m.nhdplusid)))].slice(0, 200),
      ...(throughLakeIds ? { throughLakeIds } : {}),
      ...(opts.allowOpenEnds ? { allowOpenEnds: true } : {}),
    },
    evidence: {
      levelPathIs: perLp.map((p) => p.levelPath),
      levelPathDetail: perLp,
      reachCount: reachesUsed.length,
      unnamedRefillReaches: reachesUsed.filter((m) => m._refill).length,
      damOrGaugePins: opts.pins ?? [],
      throughLakeTouch: opts.throughLakeTouch ?? null,
      carryOverNotes: opts.notes ?? null,
    },
    metrics: {
      before,
      after: {
        parts: chains.length,
        lengthKm: lineLen,
        // crossings are measured by apply-west.mjs via the S2 detector; the
        // tracer records the seam/gap structure it can see locally
        chunks: afterChunks.chunks,
        largestGapKm: afterChunks.largestGapKm,
        networkSeams: afterChunks.chunks - 1,
      },
    },
  };
  // preserve the canonical catalog fields the applier must not lose
  artifact.properties.canonical = canonicalProps
    ? {
      name: canonicalProps.name, waterbodyType: canonicalProps.waterbodyType,
      regionId: canonicalProps.regionId, gaugeIds: canonicalProps.gaugeIds ?? [],
      labelAnchor: canonicalProps.labelAnchor ?? null,
      throughLakeIdsBefore: canonicalProps.throughLakeIds ?? null,
    }
    : null;
  const file = join(OUT, `${id}.json`);
  writeFileSync(file, JSON.stringify(artifact));
  return { file, artifact };
}

/** before-metrics for the artifact: canonical parts/length + S2 detector
 * crossings/overlapRuns + continuity-audit chunk semantics. */
export function beforeMetrics(id, canonicalFeature, selfXMap) {
  const x = selfXMap.get(id);
  const coords = canonicalFeature?.geometry?.type === 'MultiLineString'
    ? canonicalFeature.geometry.coordinates
    : canonicalFeature?.geometry?.type === 'LineString'
      ? [canonicalFeature.geometry.coordinates] : [];
  const ch = coords.length ? chunkStats(coords) : null;
  return {
    parts: canonicalFeature?.properties?.partCount ?? x?.partCount ?? coords.length,
    lengthKm: canonicalFeature?.properties?.lengthKm ?? null,
    crossings: (x?.crossings ?? []).length ?? 0,
    overlapRuns: x?.overlapRunCount ?? (x?.overlapRuns ?? []).length ?? 0,
    chunks: ch?.chunks ?? null,
    largestGapKm: ch?.largestGapKm ?? null,
  };
}

export { lineLenKm, geomBBox, outwardBounds, countVerts, makeLineFeature, chunkStats as chunks };
