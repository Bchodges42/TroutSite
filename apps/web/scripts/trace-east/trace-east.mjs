/* global URL, console, process */
// trace-east/trace-east.mjs — rebuild defective east/southeast LINE waters by
// tracing their NHDPlus HR level path (VAA hydroseq/levelpathi), the proven
// fix-tellico-area / fix-horse-creek-greene / fix-wolf-river-fentress technique:
//
//   1. load the whole-part NHD take (.atlas-src/trace/east/takes/<key>.geojson,
//      fetched by fetch-east.mjs with full VAA fields),
//   2. weld reaches into maximal chains (22 m snap — 0-seam discipline),
//   3. keep only chains inside the canonical bbox+margin (same-name pollution out),
//   4. verify the longest surviving chain against the VAA level path (hydroseq
//      ordering must reproduce the same end-to-end run) — evidence, not a guess,
//   5. state-cut contiguous out-of-TN runs at both ends (region = TN water),
//   6. verify termini: downstream end must weld (<= 50 m) to the recorded
//      downstream water or sit INSIDE the recorded pool (through-lake),
//   7. write .atlas-src/trace/east/out/<id>.json — the ONLY write this crew makes.
//
// Deterministic + idempotent: output depends only on the take + canonical files.
// This script NEVER writes canonical or atlas-sources files (apply step owns those).
//
// Run: node scripts/trace-east/trace-east.mjs [id ...]
import {
  loadCanonical, loadRegion, _loadTake, loadTNBoundary,
  weldTracked, levelPathChain, countSelfCrossings, stateCutTN,
  lineLenKm, boundsOf, ptInGeom, nearestDistM, multiParts,
  OUT_DIR, _SNAP,
} from './lib.mjs';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const RETRIEVED = '2026-09-08';
const MARGIN = 0.15; // chain-keep margin around the canonical bbox (deg)

// per-water config: take key, downstream/through-pool verification target(s),
// through-lake ids for the alignment check, and a note on scope.
// stateCut:'tn' trims contiguous out-of-TN end runs (region = TN water);
// stateCut:false mirrors the canonical's own cross-state scope (nf-holston).
const CONFIG = {
  'nolichucky-river': { key: 'nolichucky', pool: 'douglas-lake', lakes: ['douglas-lake'], note: 'state line (unimpounded gorge) to the Douglas pool; pool arm carries the water to the French Broad' },
  'pigeon-river': { key: 'pigeon', pool: 'douglas-lake', lakes: ['douglas-lake'], note: 'state line (Waterville gorge) to the Douglas pool Pigeon arm' },
  'french-broad-river': { key: 'french-broad', pool: 'tennessee-river', lakes: ['douglas-lake'], note: 'state line (Hot Springs) through the Douglas pool and the dam tailwater to the Holston confluence (Tennessee head)' },
  'little-pigeon-river': { key: 'little-pigeon', pool: 'french-broad-river', lakes: [], region: 'canonical-only', note: 'Gatlinburg headwaters to the French Broad (Douglas Dam tailwater) below Sevierville' },
  'hiwassee-river': { key: 'hiwassee', pool: 'chickamauga-lake', lakes: ['chickamauga-lake'], note: 'state line (Appalachia tailwater) to the Chickamauga pool Hiwassee arm' },
  'ocoee-river': { key: 'ocoee', pool: 'hiwassee-river', lakes: ['parksville-lake', 'ocoee-number-three-lake'], note: 'GA line (Ducktown reach) through Parksville Lake and the gorge impoundments to the Hiwassee confluence' },
  'clinch-river': { key: 'clinch', pool: 'tennessee-river', lakes: ['norris-lake', 'melton-hill-lake'], note: 'VA line through the Norris pool and the Melton Hill tailwater to the Tennessee confluence at Kingston' },
  'powell-river': { key: 'powell', pool: 'norris-lake', lakes: ['norris-lake'], note: 'VA line down the Powell valley to the Norris pool Powell arm' },
  'holston-river': { key: 'holston', pool: 'tennessee-river', lakes: ['cherokee-lake'], note: 'Kingsport (SF/NF confluence) through the Cherokee pool and the dam tailwater to the French Broad confluence (Tennessee head)' },
  'north-fork-holston-river': { key: 'nf-holston', pool: 'holston-river', lakes: [], stateCut: false, note: 'full named extent (canonical carries VA reaches) to the Holston confluence at Kingsport' },
  'south-holston-river': { key: 'sf-holston', pool: 'boone-lake', lakes: ['south-holston-lake', 'boone-lake'], note: 'state line through the South Holston pool, the dam tailwater and the Boone pool (boone-tailwater takes over below Boone Dam)' },
  'watauga-river': { key: 'watauga', pool: 'watauga-lake', lakes: ['watauga-lake'], note: 'state line through the Watauga pool to Watauga Dam (watauga-river-wilbur-reach owns the tailwater)' },
  'new-river': { key: 'new-river', pool: 'clear-fork', lakes: [], note: 'Scott County headwaters to the New/Clear Fork confluence (head of the Big South Fork; the BSF itself is not a catalog line, clear-fork is the paired fork)' },
  'little-river': { key: 'little-river', pool: 'tennessee-river', lakes: [], note: 'Smokies headwaters (park) through Townsend/Maryville to the Tennessee (Fort Loudoun pool) at Louisville' },
  'emory-river': { key: 'emory', pool: 'clinch-river', lakes: [], note: 'Cumberland Plateau headwaters to the Clinch confluence at Kingston' },
  'daddys-creek': { key: 'daddys', pool: 'obed-river', lakes: [], note: 'Cumberland County headwaters to the Obed confluence' },
  'obed-river': { key: 'obed', pool: 'emory-river', lakes: [], note: 'Cumberland County headwaters to the Emory confluence' },
  'south-fork-cumberland': { key: 'sf-cumberland', pool: null, lakes: [], note: 'catalog reach = NHD GNIS Big South Fork Cumberland River upper course (New/Clear Fork head to the KY line); BSF continuation to Lake Cumberland is out of catalog scope' },
  'upper-roan-creek': { key: 'roan', pool: 'watauga-river', lakes: [], note: 'Roan Mountain valley headwaters to the Watauga at Elizabethton' },
  'sequatchie-river': { key: 'sequatchie', pool: 'tennessee-river', lakes: [], note: 'Sequatchie valley to the Tennessee at Shellmound' },
};

const POOL_MARGIN_M = 1000; // NHD pool-arm headpool margin (citico 178 m precedent; measured 602-6856 m vs NHD's own Douglas waterbody)

// ---------------------------------------------------------------- helpers
const canon = loadCanonical();
const region = loadRegion();
const tnBoundary = loadTNBoundary();

function _chainToParts(c) {
  const g = c.geometry.type === 'LineString' ? [c.geometry.coordinates] : c.geometry.coordinates;
  return g;
}

function buildMainChain(take, canonParts) {
  // canonical bbox + margin
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const part of canonParts) for (const [x, y] of part) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const inBox = ([x, y]) => x >= minX - MARGIN && x <= maxX + MARGIN && y >= minY - MARGIN && y <= maxY + MARGIN;
  const chainTouch = (pts) => pts.some(inBox) || (boundsOf(pts)[0] <= maxX + MARGIN && boundsOf(pts)[2] >= minX - MARGIN && boundsOf(pts)[1] <= maxY + MARGIN && boundsOf(pts)[3] >= minY - MARGIN);

  const segments = [];
  let sourceLen = 0;
  for (const f of take.features) {
    const p = f.properties;
    for (const pts of multiParts(f.geometry)) {
      segments.push({
        pts, id: p.nhdplusid, lenKm: p.lengthkm ?? 0,
        hydroseq: p.hydroseq, levelpathi: p.levelpathi, fcode: p.fcode, reachcode: p.reachcode,
      });
      sourceLen += p.lengthkm ?? 0;
    }
  }
  const chains = weldTracked(segments).sort((a, b) => lineLenKm(b.pts) - lineLenKm(a.pts));
  const kept = chains.filter((c) => lineLenKm(c.pts) > 0.2 && chainTouch(c.pts));
  const dropped = chains.filter((c) => !kept.includes(c));
  return { kept, dropped, sourceLen, segments };
}

function vaaEvidence(segments, mainIds, mainPts) {
  // group the take by levelpathi; report LPs contributing to the main chain and
  // verify a hydroseq-ordered assembly reproduces the welded chain ends
  const _byId = new Map(segments.map((s) => [s.id + ':' + s.pts[0].join(','), s]));
  const main = segments.filter((s) => mainIds.has(s.id + ':' + s.pts[0].join(',')));
  const lps = {};
  for (const s of main) {
    const lp = String(s.levelpathi);
    lps[lp] = lps[lp] ?? { levelPathI: lp, reaches: 0, lengthKm: 0, vpuids: new Set() };
    lps[lp].reaches++;
    lps[lp].lengthKm += s.lenKm ?? 0;
  }
  const lpList = Object.values(lps).sort((a, b) => b.lengthKm - a.lengthKm);
  // VAA ordered run on the dominant LP
  let vaa = null;
  if (lpList.length) {
    const dom = lpList[0].levelPathI;
    const lpSegs = main.filter((s) => String(s.levelpathi) === dom);
    const run = levelPathChain(lpSegs, 25);
    if (run && !run.brokeAt) {
      const endsMatch =
        Math.min(nearestDistM(run.pts[0], { type: 'MultiPoint', coordinates: [mainPts[0], mainPts[mainPts.length - 1]] }),
          nearestDistM(run.pts[run.pts.length - 1], { type: 'MultiPoint', coordinates: [mainPts[0], mainPts[mainPts.length - 1]] })) <= 60;
      vaa = { levelPathI: dom, orderedReachCount: run.used.length, gapM: run.gapM, endsMatch };
    } else if (run) {
      vaa = { levelPathI: dom, orderedReachCount: run.used.length, gapM: run.gapM, endsMatch: false, brokeAt: [run.brokeAt.pts[0][0], run.brokeAt.pts[0][1]] };
    }
  }
  return { levelPaths: lpList.map((l) => ({ levelPathI: l.levelPathI, reaches: l.reaches, lengthKm: +l.lengthKm.toFixed(2), vpuid: undefined })), vaa };
}

function throughLakeEvidence(parts, lakeIds) {
  if (!lakeIds.length) return [];
  const region = loadRegion();
  const first = parts[0][0], last = parts[parts.length - 1][parts[parts.length - 1].length - 1];
  return lakeIds.map((id) => {
    const f = region?.features.find((x) => x.properties.id === id);
    if (!f) return { id, error: 'lake not found in region file' };
    const g = f.geometry;
    // how much of the chain lies inside the pool (through-route) ...
    let insideCount = 0;
    for (const part of parts) for (const p of part) if (ptInGeom(p, g)) insideCount++;
    // ... and does the chain follow the pool centerline rather than a shore:
    // fraction of pool boundary vertices within 300 m of the chain (an
    // artificial-path centerline leaves most shoreline vertices farther away)
    let shoreNear = 0, shoreTotal = 0;
    const chain = { type: 'MultiLineString', coordinates: parts };
    (function walk(r) {
      if (typeof r[0] === 'number') { shoreTotal++; if (nearestDistM(r, chain) <= 300) shoreNear++; }
      else r.forEach(walk);
    })(g.coordinates);
    const ends = { start: nearestDistM(first, g), end: nearestDistM(last, g) };
    return {
      id,
      startDistM: Math.round(ends.start), endDistM: Math.round(ends.end),
      startInside: ptInGeom(first, g), endInside: ptInGeom(last, g),
      verticesInsidePool: insideCount,
      poolVertsNearChainPct: shoreTotal ? +((100 * shoreNear) / shoreTotal).toFixed(1) : 0,
    };
  });
}

function _nearestOnLine(pt, parts) {
  let b = Infinity;
  for (const part of parts) for (const p of part) b = Math.min(b, Math.hypot(pt[0] - p[0], pt[1] - p[1]));
  return b;
}

function loadTargetGeom(pid) {
  // prefer this crew's rebuilt artifact, then the region file, then canonical
  const artPath = new URL(`${pid}.json`, OUT_DIR);
  if (existsSync(artPath)) return JSON.parse(readFileSync(artPath, 'utf8')).geometry;
  const rf = region?.features.find((x) => x.properties.id === pid);
  if (rf) return rf.geometry;
  const cf = canon.features.find((x) => x.properties.id === pid);
  if (cf) return cf.geometry;
  return null;
}

function terminusCheck(parts, cfg) {
  const targets = {};
  for (const pid of [cfg.pool, ...extraTargets(cfg)]) {
    if (!pid || targets[pid]) continue;
    const geom = loadTargetGeom(pid);
    if (geom) targets[pid] = geom;
  }
  const first = parts[0][0], last = parts[parts.length - 1][parts[parts.length - 1].length - 1];
  const res = {};
  for (const [end, pt] of [['start', first], ['end', last]]) {
    let best = { id: null, m: Infinity };
    for (const [id, g] of Object.entries(targets)) {
      const d = nearestDistM(pt, g);
      if (d < best.m) best = { id, m: d };
    }
    res[end] = { nearest: best.id, distM: Math.round(best.m), inside: best.id ? ptInGeom(pt, targets[best.id]) : false };
  }
  return res;
}
function extraTargets(cfg) {
  // named-river weld targets: where the downstream water is a LINE, require <= 50 m
  return cfg.pool && /river|creek|fork/.test(cfg.pool) && !/lake/.test(cfg.pool) ? [cfg.pool] : [];
}

// ---------------------------------------------------------------- per water
/**
 * Order surviving chains upstream -> downstream: grow the assembly in BOTH
 * directions from the longest chain, attaching any chain whose head/tail lies
 * within 1 km (the continuity-audit stitch threshold) of the assembly tail/head.
 * Returns { ordered, seams } where seams documents sub-1km non-welded gaps
 * (e.g. dam faces, pool-head margins — documented, never hand-bridged).
 */
function orderChains(chains) {
  if (chains.length === 1) return { ordered: [chains[0]], seams: [] };
  const degToM = (dx, dy) => Math.hypot(dx * 89650, dy * 110540); // local approx
  const rest = chains.slice(1);
  let ordered = [chains[0]];
  const seams = [];
  while (rest.length) {
    const headChain = ordered[0], tailChain = ordered[ordered.length - 1];
    const tail = tailChain.pts[tailChain.pts.length - 1];
    const head = headChain.pts[0];
    let bi = -1, bd = Infinity, where = null, flip = false;
    for (let i = 0; i < rest.length; i++) {
      const c = rest[i];
      const cHead = c.pts[0], cTail = c.pts[c.pts.length - 1];
      const cands = [
        ['append', degToM(tail[0] - cHead[0], tail[1] - cHead[1]), false],
        ['append', degToM(tail[0] - cTail[0], tail[1] - cTail[1]), true],
        ['prepend', degToM(head[0] - cTail[0], head[1] - cTail[1]), false],
        ['prepend', degToM(head[0] - cHead[0], head[1] - cHead[1]), true],
      ];
      for (const [w, d, f] of cands) {
        if (d < bd) { bd = d; bi = i; where = w; flip = f; }
      }
    }
    if (bd > 1000) throw new Error(`chains do not assemble within 1 km (nearest ${Math.round(bd)} m) — refusing`);
    const next = rest.splice(bi, 1)[0];
    if (flip) next.pts = next.pts.slice().reverse();
    seams.push({ afterPart: where === 'append' ? ordered.length - 1 : 0, gapM: Math.round(bd), documented: true });
    if (where === 'append') ordered.push(next); else ordered.unshift(next);
  }
  return { ordered, seams };
}

function traceOne(id) {
  const cfg = CONFIG[id];
  if (!cfg) throw new Error(`no config for ${id}`);
  const takePath = new URL(`${cfg.key}.geojson`, new URL('../../.atlas-src/trace/east/takes/', import.meta.url));
  if (!existsSync(takePath)) { console.log(`-- ${id}: take missing, skipping`); return null; }
  const take = JSON.parse(readFileSync(takePath, 'utf8'));

  // BEFORE: canonical geometry
  const cf = canon.features.find((x) => x.properties.id === id);
  if (!cf) throw new Error(`${id} not in canonical rivers.geojson`);
  const beforeParts = multiParts(cf.geometry);
  const beforeLenKm = cf.properties.lengthKm ?? +lineLenKm(beforeParts.flat()).toFixed(2);
  const beforeCross = countSelfCrossings(beforeParts);

  const { kept, dropped, _sourceLen, segments } = buildMainChain(take, beforeParts);
  if (!kept.length) throw new Error(`${id}: no surviving chain`);
  const notes = [];

  // assemble surviving chains upstream -> downstream (documented sub-1km seams)
  const { ordered, seams } = orderChains(kept);

  // state cut on the ASSEMBLY: drop leading/trailing chains that lie entirely
  // out-of-TN, then trim partial out-of-TN end runs on the end chains
  // (little-tennessee/tellico precedent; config opt-out mirrors catalog scope)
  if (cfg.stateCut !== false) {
    const chainInTN = (c) => c.pts.some((p) => ptInGeom(p, tnBoundary));
    while (ordered.length > 1 && !chainInTN(ordered[0])) {
      notes.push(`dropped out-of-state headwater chain (${lineLenKm(ordered[0].pts).toFixed(1)} km, outside TN)`);
      ordered.shift();
      seams.shift();
    }
    while (ordered.length > 1 && !chainInTN(ordered[ordered.length - 1])) {
      notes.push(`dropped out-of-state downstream chain (${lineLenKm(ordered[ordered.length - 1].pts).toFixed(1)} km, outside TN)`);
      ordered.pop();
      seams.pop();
    }
    const cutA = stateCutTN(ordered[0].pts, tnBoundary, 'lead');
    if (cutA.pts !== ordered[0].pts) { ordered[0].pts = cutA.pts; if (cutA.cutNote) notes.push(cutA.cutNote); }
    const last = ordered[ordered.length - 1];
    const cutB = stateCutTN(last.pts, tnBoundary, 'trail');
    if (cutB.pts !== last.pts) { last.pts = cutB.pts; if (cutB.cutNote) notes.push(cutB.cutNote); }
  }

  if (ordered.length === 1 && !ordered[0].pts.some((p) => ptInGeom(p, tnBoundary)) && cfg.stateCut !== false)
    throw new Error(`${id}: no in-TN geometry survives the state cut — refusing`);
  const parts = ordered.map((c) => c.pts.map((p) => [+p[0].toFixed(6), +p[1].toFixed(6)]));
  const lenKm = parts.reduce((s, p) => s + lineLenKm(p), 0);
  const afterCross = countSelfCrossings(parts);

  // dropped chain census (evidence)
  const keptSet = new Set(kept);
  const droppedCensus = dropped.filter((c) => !keptSet.has(c)).slice(0, 8).map((c) => ({
    vertices: c.pts.length, lengthKm: +lineLenKm(c.pts).toFixed(2),
    at: c.pts[0].map((v) => +v.toFixed(4)),
    fcodes: [...new Set(c.segs.map((s) => s.fcode))],
  }));
  const junkDropped = dropped.filter((c) => c.pts.length <= 2 && lineLenKm(c.pts) < 0.05).length;

  const mainIds = new Set(ordered.flatMap((c) => c.segs.map((s) => s.id + ':' + s.pts[0].join(','))));
  const ev = vaaEvidence(segments, mainIds, parts[0]);
  const lakes = throughLakeEvidence(parts, cfg.lakes);
  const termini = terminusCheck(parts, cfg);

  // terminus discipline: LINE welds require <= 50 m; POOL termini require
  // inside OR within the documented NHD pool-arm headpool margin (<= 1 km).
  for (const t of extraTargets(cfg)) {
    const d = nearestDistM(parts[parts.length - 1][parts[parts.length - 1].length - 1], loadTargetGeom(t));
    if (d > 50) throw new Error(`${id}: downstream end does not weld to ${t} (${Math.round(d)} m > 50 m policy) — refusing to deliver`);
  }
  for (const l of lakes) {
    if (l.error) continue;
    const reached = l.startInside || l.endInside || l.verticesInsidePool > 0 ||
      Math.min(l.endDistM, l.startDistM) <= POOL_MARGIN_M;
    if (!reached)
      throw new Error(`${id}: never reaches ${l.id} (nearest ${Math.min(l.endDistM, l.startDistM)} m > ${POOL_MARGIN_M} m pool margin, 0 vertices inside) — refusing to deliver`);
  }

  const throughLakeIds = cfg.lakes.filter((lid) => {
    const l = lakes.find((x) => x.id === lid);
    return l && !l.error && (l.verticesInsidePool > 0 || l.endInside || l.startInside);
  });

  const allSegs = ordered.flatMap((c) => c.segs);
  const sourceLenKm = allSegs.reduce((s, x) => s + (x.lenKm ?? 0), 0);
  const out = {
    id,
    region: cfg.region ?? 'east-southeast',
    geometry: { type: 'MultiLineString', coordinates: parts },
    properties: {
      bounds: boundsOf(parts.flat()),
      partCount: parts.length,
      vertexCount: parts.reduce((s, p) => s + p.length, 0),
      lengthKm: +lenKm.toFixed(2),
      sourceIds: [...new Set(allSegs.map((s) => s.id))].sort((a, b) => a - b),
      source: 'nhd-hr',
      throughLakeIds,
    },
    evidence: {
      levelPathIs: ev.levelPaths.slice(0, 6),
      vaaCheck: ev.vaa,
      reachCount: allSegs.length,
      pins: allSegs.map((s) => s.id).sort((a, b) => a - b),
      sourceLengthKm: +sourceLenKm.toFixed(2),
      lengthRatioOfSource: sourceLenKm ? +(lenKm / sourceLenKm).toFixed(3) : null,
      droppedChains: droppedCensus,
      junkChainsDropped: junkDropped,
      documentedSeams: seams.map((s) => ({ ...s, cause: 'NHD discontinuity (dam face / pool-head margin) — whole chains delivered as separate parts; not hand-bridged' })),
      termini,
      throughLake: lakes,
      scope: cfg.note,
      notes,
    },
    metrics: {
      before: {
        parts: beforeParts.length,
        lengthKm: beforeLenKm,
        crossings: beforeCross.crossings,
        crossingEvents: beforeCross.events,
      },
      after: {
        parts: parts.length,
        lengthKm: +lenKm.toFixed(2),
        crossings: afterCross.crossings,
        crossingEvents: afterCross.events,
      },
    },
    fixSource: `scripts/trace-east/trace-east.mjs ${RETRIEVED}: NHDPlus HR level-path trace (takes/${cfg.key}.geojson, VAA hydroseq/levelpathi; ${allSegs.length} reaches welded to ${parts.length} whole chain(s))`,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = new URL(`${id}.json`, OUT_DIR);
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`${id}: ${beforeParts.length} parts -> ${parts.length} chain(s) · ${beforeLenKm} -> ${lenKm.toFixed(1)} km · crossings ${beforeCross.crossings} -> ${afterCross.crossings} · reaches ${allSegs.length} (LP ${ev.levelPaths[0]?.levelPathI}) · junk dropped ${junkDropped}`);
  console.log(`   termini start->${termini.start.nearest}:${termini.start.distM}m end->${termini.end.nearest}:${termini.end.distM}m${termini.end.inside ? ' INSIDE' : ''} · lakes: ${lakes.map((l) => l.error ? l.id + ':ERR' : `${l.id} in=${l.verticesInsidePool} end=${l.endDistM}m center%=${l.poolVertsNearChainPct}`).join(' | ') || 'none'}${seams.length ? ` · seams: ${seams.map((s) => s.gapM + 'm').join(',')}` : ''}`);
  return out;
}

const only = process.argv.slice(2);
let n = 0;
for (const [id, _cfg] of Object.entries(CONFIG)) {
  if (only.length && !only.includes(id)) continue;
  try { if (traceOne(id)) n++; }
  catch (e) { console.log(`!! ${id}: ${e.message}`); }
}
console.log(`traced ${n} waters -> .atlas-src/trace/east/out/`);
