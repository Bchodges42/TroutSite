#!/usr/bin/env node
// nhd_trace.mjs — trace one water across the graph: downstream to its mouth /
// confluence, upstream to a headwater or a dam (tailwaters), emitting a
// per-water reach GeoJSON in the rivers.geojson property shape plus additive
// trace provenance, and an audit sidecar.
//
// Usage:
//   node scripts/nhd_trace.mjs --graph data/nhd/graphs/06010207.graph.json \
//     --id clinch-river --name "Clinch River" --waterbody-type tailrace \
//     --anchor 36.2156,-84.0821 --up "dam:Norris Lake" --down mouth \
//     --out data/nhd/derived/reach-clinch-river.geojson
//
// Termini specs (frozen in docs/NHD-CONVENTIONS.md):
//   up:   "dam:<waterbody gnis_name>" | "headwater"
//   down: "mouth" | "confluence:<gnis_name>" | "point:<lat,lng>"
//
// Walk rules (frozen):
//   - direction: edges are stored downstream-first (flowdir), so "down" follows
//     from→to and "up" follows to→from.
//   - at a fork, candidates are ranked: (1) same gnis_name as the current edge
//     (name continuity through braids and reservoir artificial paths),
//     (2) longest total remaining path (memoized longest-flow-path proxy for
//     NHDPlus VAA, which is unpopulated in the Best Resolution product),
//     (3) deterministic tie-break on pid.
//   - "dam:<name>" stops when the NEXT upstream edge is an artificial path
//     (ftype 558) whose wbarea resolves to a waterbody named <name> — the dam
//     node is where the reservoir impoundment begins. Other reservoirs on the
//     path (e.g. Melton Hill Lake for clinch-river) are traversed, not stops.

import fs from 'node:fs';
import path from 'node:path';
import {
  bboxOf,
  dpSimplify,
  haversineM,
  lineLengthKm,
  projectToSegment,
  readJsonl,
  roundCoords,
  slugify,
  writeJson,
} from './nhd_lib.mjs';

const args = process.argv.slice(2);
const argOf = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const need = (flag, v) => {
  if (v === undefined) {
    console.error(`missing required flag ${flag}`);
    process.exit(2);
  }
  return v;
};
const graphPath = need('--graph', argOf('--graph'));
const waterId = need('--id', argOf('--id'));
const waterName = argOf('--name', waterId);
const gnisName = argOf('--gnis', waterName);
const waterbodyType = argOf('--waterbody-type', 'river');
const [anchorLat, anchorLon] = need('--anchor', argOf('--anchor')).split(',').map(Number);
const upSpec = argOf('--up', 'headwater');
const downSpec = argOf('--down', 'mouth');
const outPath = need('--out', argOf('--out'));
const simplifyTols = argOf('--simplify-m', '10,25,50').split(',').map(Number);
const budgetBytes = Number(argOf('--budget-bytes', '81920'));
const roundDecimals = Number(argOf('--round', '5'));

const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
const { nodes, edges } = graph;
const meta = graph.meta;

// waterbody index (for dam termini) from the hu8 JSONLs next to the graph
const hu8 = meta.hu8;
const dataDir = path.dirname(path.dirname(graphPath));
const waterbodies = new Map();
for (const row of readJsonl(path.join(dataDir, 'hu8', `${hu8}.waterbodies.jsonl`))) {
  waterbodies.set(String(row.properties.permanent_identifier), row.properties);
}

// adjacency
const outEdges = new Map();
const inEdges = new Map();
for (const [i, e] of edges.entries()) {
  if (!outEdges.has(e.from)) outEdges.set(e.from, []);
  if (!inEdges.has(e.to)) inEdges.set(e.to, []);
  outEdges.get(e.from).push(i);
  inEdges.get(e.to).push(i);
}

// longest remaining path (km) per edge — memoized DFS, cycle-safe.
const dlMemo = new Map();
const ulMemo = new Map();
function downstreamLen(i, seen = new Set()) {
  if (dlMemo.has(i)) return dlMemo.get(i);
  if (seen.has(i)) return 0;
  seen.add(i);
  const e = edges[i];
  let best = 0;
  for (const o of outEdges.get(e.to) ?? []) {
    if (o === i) continue;
    best = Math.max(best, downstreamLen(o, seen));
  }
  seen.delete(i);
  const v = e.km + best;
  dlMemo.set(i, v);
  return v;
}
function upstreamLen(i, seen = new Set()) {
  if (ulMemo.has(i)) return ulMemo.get(i);
  if (seen.has(i)) return 0;
  seen.add(i);
  const e = edges[i];
  let best = 0;
  for (const o of inEdges.get(e.from) ?? []) {
    if (o === i) continue;
    best = Math.max(best, upstreamLen(o, seen));
  }
  seen.delete(i);
  const v = e.km + best;
  ulMemo.set(i, v);
  return v;
}

// fork choice: same-name first, then longest remaining path, then pid.
function pick(cands, currentName, dir) {
  const rank = (i) => [
    edges[i].name === currentName ? 0 : 1,
    -(dir === 'down' ? downstreamLen(i) : upstreamLen(i)),
    String(edges[i].pid),
  ];
  return cands.slice().sort((a, b) => {
    const ra = rank(a),
      rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || (ra[2] < rb[2] ? -1 : 1);
  })[0];
}

function isDamStop(i, damName) {
  const e = edges[i];
  if (e.ftype !== 558) return false;
  const wb = waterbodies.get(String(e.wbarea));
  return !!wb && wb.gnis_name.toLowerCase() === damName.toLowerCase();
}

// --- anchor snap -------------------------------------------------------------
let anchorBest = null;
for (const [i, e] of edges.entries()) {
  const c = e.coords;
  for (let s = 1; s < c.length; s++) {
    const proj = projectToSegment([anchorLon, anchorLat], c[s - 1], c[s]);
    if (!anchorBest || proj.distM < anchorBest.distM) {
      anchorBest = { distM: proj.distM, t: proj.t, edgeIdx: i, seg: s, point: proj.point };
    }
  }
}
const startEdge = edges[anchorBest.edgeIdx];

// --- walks -------------------------------------------------------------------
const upWalk = [];
const downWalk = [];
const divergenceLog = [];

function walk(dir, spec) {
  const path = [];
  let cur = anchorBest.edgeIdx;
  const guard = new Set();
  while (true) {
    if (guard.has(cur + ':' + dir)) {
      return { path, reason: 'cycle-guard', node: dir === 'up' ? edges[cur].from : edges[cur].to };
    }
    guard.add(cur + ':' + dir);
    const nextNode = dir === 'up' ? edges[cur].from : edges[cur].to;
    const cands = (dir === 'up' ? inEdges : outEdges).get(nextNode) ?? [];
    const open = cands.filter((c) => c !== cur);
    if (open.length === 0)
      return { path, reason: dir === 'up' ? 'headwater' : 'terminal-node', node: nextNode };

    const [kind, value] = spec.split(':');
    if (dir === 'up' && kind === 'dam') {
      const damCandidates = open.filter((c) => isDamStop(c, value));
      if (damCandidates.length > 0) {
        return {
          path,
          reason: 'dam',
          node: nextNode,
          damEdges: damCandidates.map((c) => edges[c].pid),
        };
      }
    }
    // v2 (integration, owner-approved): upstream point/confluence stops mirror the
    // downstream rules exactly — same 150 m node snap / exact-name candidate match.
    // Behavior is unchanged unless a trace spec uses these kinds.
    if (dir === 'up' && kind === 'point') {
      const [plat, plon] = value.split(',').map(Number);
      if (haversineM(nodes[nextNode], [plon, plat]) <= 150) {
        return { path, reason: 'point', node: nextNode };
      }
    }
    if (dir === 'up' && kind === 'confluence') {
      const hit = open.filter((c) => edges[c].name.toLowerCase() === value.toLowerCase());
      if (hit.length > 0) {
        return {
          path,
          reason: 'confluence',
          node: nextNode,
          enteredNames: hit.map((c) => edges[c].name),
        };
      }
    }
    if (dir === 'down' && kind === 'point') {
      const [plat, plon] = value.split(',').map(Number);
      if (haversineM(nodes[nextNode], [plon, plat]) <= 150) {
        return { path, reason: 'point', node: nextNode };
      }
    }

    let choice;
    if (dir === 'down' && kind === 'mouth') {
      const sameName = open.filter((c) => edges[c].name === edges[cur].name);
      if (sameName.length === 0) {
        return {
          path,
          reason: 'name-change',
          node: nextNode,
          enteredNames: [...new Set(open.map((c) => edges[c].name))],
        };
      }
      choice = pick(sameName, edges[cur].name, dir);
    } else if (dir === 'down' && kind === 'confluence') {
      const hit = open.filter((c) => edges[c].name.toLowerCase() === value.toLowerCase());
      if (hit.length > 0) {
        return {
          path,
          reason: 'confluence',
          node: nextNode,
          enteredNames: hit.map((c) => edges[c].name),
        };
      }
      choice = pick(open, edges[cur].name, dir);
    } else {
      choice = pick(open, edges[cur].name, dir);
    }

    if (open.length > 1) {
      divergenceLog.push({
        dir,
        atNode: nextNode,
        currentEdge: edges[cur].pid,
        candidates: open.map((c) => ({ pid: edges[c].pid, name: edges[c].name, km: edges[c].km })),
        chosen: edges[choice].pid,
        rule: edges[choice].name === edges[cur].name ? 'name-continuity' : 'longest-remaining-path',
      });
    }
    path.push(choice);
    cur = choice;
  }
}

const up = walk('up', upSpec);
const down = walk('down', downSpec);

// --- path assembly -----------------------------------------------------------
// Output runs upstream terminus → anchor → downstream terminus. Edges are all
// stored downstream-first, so every edge is pushed in STORED orientation; the
// upstream walk's edges appear in reverse walk order (last walked = nearest the
// terminus = first in the output). The anchor edge is split at the anchor point.
const t = anchorBest.t;
const anchorPoint = anchorBest.point;
const startCoords = startEdge.coords;
const fi = t * (startCoords.length - 1);
const iLo = Math.floor(fi);

const startHeadPart = [...startCoords.slice(0, iLo + 1), anchorPoint];
const startTailPart = [anchorPoint, ...startCoords.slice(iLo + 1)];

const fullPath = [];
const pushCoords = (c) => {
  for (const pt of c) {
    const last = fullPath.at(-1);
    if (!last || last[0] !== pt[0] || last[1] !== pt[1]) fullPath.push(pt);
  }
};
for (let k = up.path.length - 1; k >= 0; k--) {
  pushCoords(edges[up.path[k]].coords);
}
pushCoords(startHeadPart);
pushCoords(startTailPart);
for (const i of down.path) pushCoords(edges[i].coords);

const upDistKm = up.path.reduce((s, i) => s + edges[i].km, 0) + startEdge.km * t;
const downDistKm = down.path.reduce((s, i) => s + edges[i].km, 0) + startEdge.km * (1 - t);

// terminus coords
const upNode = up.node ? nodes[up.node] : null;
const downNode = down.node ? nodes[down.node] : null;
const throughLakes = [
  ...new Set(
    [anchorBest.edgeIdx, ...up.path, ...down.path]
      .filter((i) => edges[i].ftype === 558 && edges[i].wbarea)
      .map((i) => waterbodies.get(String(edges[i].wbarea))?.gnis_name)
      .filter((n) => n && n.toLowerCase() !== gnisName.toLowerCase()),
  ),
];

// --- simplify + budget enforcement -------------------------------------------
let chosen = null;
for (const tol of simplifyTols) {
  const simplified = roundCoords(dpSimplify(fullPath, tol), roundDecimals);
  const candidate = buildReach(simplified, tol);
  const bytes = Buffer.byteLength(JSON.stringify(candidate));
  chosen = { tol, simplified, candidate, bytes };
  if (bytes <= budgetBytes) break;
}
if (chosen.bytes > budgetBytes) {
  console.error(
    `error: reach ${waterId} is ${chosen.bytes} bytes at max tolerance ${chosen.tol}m — over budget ${budgetBytes}. ` +
      `Widen --simplify-m or raise --budget-bytes explicitly (never silently).`,
  );
  process.exit(1);
}

function buildReach(coords, tol) {
  const pidsUp = up.path.map((i) => edges[i].pid);
  const pidsDown = down.path.map((i) => edges[i].pid);
  const vertexCount = coords.length;
  return {
    type: 'Feature',
    properties: {
      id: waterId,
      name: waterName,
      waterbodyType,
      throughLakeIds: throughLakes.map(slugify),
      allowOpenEnds: false,
      source: `nhd-hu8-${hu8}`,
      approximate: false,
      labelAnchor: anchorBest.point.map((v) => Math.round(v * 1e5) / 1e5),
      bounds: bboxOf(coords),
      crs: 'EPSG:4326',
      coordinateOrder: 'longitude,latitude',
      partCount: 1,
      vertexCount,
      lengthKm: Math.round(lineLengthKm(coords) * 100) / 100,
      sourceIds: [...new Set([startEdge.pid, ...pidsUp, ...pidsDown])],
      sourceRetrieved: meta.generatedAt.slice(0, 10),
      // additive properties (rivers.geojson schema unchanged otherwise):
      geometrySource: 'nhd',
      hu8,
      simplification: {
        toleranceM: tol,
        verticesBefore: fullPath.length,
        verticesAfter: vertexCount,
        budgetBytes,
      },
      trace: {
        anchor: {
          lat: anchorLat,
          lon: anchorLon,
          snapDistM: Math.round(anchorBest.distM * 10) / 10,
        },
        up: {
          spec: upSpec,
          reason: up.reason,
          terminus: upNode,
          distKmFromAnchor: Math.round(upDistKm * 100) / 100,
        },
        down: {
          spec: downSpec,
          reason: down.reason,
          terminus: downNode,
          enteredNames: down.enteredNames ?? null,
          distKmFromAnchor: Math.round(downDistKm * 100) / 100,
        },
        vaaUsed: false,
        toleranceM: meta.toleranceM,
      },
    },
    geometry: { type: 'MultiLineString', coordinates: [coords] },
  };
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(chosen.candidate) + '\n');
const audit = {
  waterId,
  graphPath,
  hu8,
  anchorSnap: anchorBest,
  upWalk: { spec: upSpec, ...up, edgePids: up.path.map((i) => edges[i].pid) },
  downWalk: { spec: downSpec, ...down, edgePids: down.path.map((i) => edges[i].pid) },
  // ordered directed path, upstream terminus → anchor → downstream terminus
  pathEdges: [
    ...up.path
      .slice()
      .reverse()
      .map((i) => ({ pid: edges[i].pid, dir: 'up' })),
    { pid: startEdge.pid, dir: 'anchor' },
    ...down.path.map((i) => ({ pid: edges[i].pid, dir: 'down' })),
  ],
  divergenceLog,
  throughLakes,
  simplify: { tried: simplifyTols, chosenToleranceM: chosen.tol, bytes: chosen.bytes, budgetBytes },
  output: outPath,
};
writeJson(outPath.replace(/\.geojson$/, '.audit.json'), audit, true);
console.log(
  JSON.stringify(
    {
      waterId,
      edges: up.path.length + 1 + down.path.length,
      vertices: chosen.candidate.properties.vertexCount,
      lengthKm: chosen.candidate.properties.lengthKm,
      bounds: chosen.candidate.properties.bounds,
      up: { reason: up.reason, terminus: upNode, distKm: Math.round(upDistKm * 100) / 100 },
      down: { reason: down.reason, terminus: downNode, distKm: Math.round(downDistKm * 100) / 100 },
      bytes: chosen.bytes,
      out: outPath,
    },
    null,
    2,
  ),
);
