#!/usr/bin/env node
// nhd_build_graph.mjs — build the trace graph from committed NHD JSONL.
//
// Usage:
//   node scripts/nhd_build_graph.mjs --hu8 06010207 [--tolerance-m 12] [--data-dir data/nhd]
//
// Output: data/nhd/graphs/<hu8>.graph.json (see docs/NHD-CONVENTIONS.md).
//
// Topology rules (frozen):
//   - node identity = geometric endpoint snap at --tolerance-m (union-find over a
//     spatial hash). NHDPlus VAA fromnode/tonode would override when populated,
//     but the current Best Resolution product ships the VAA table all-NULL, so
//     snapping is the primary topology. The builder measures and reports merge
//     distances so the tolerance stays reviewable.
//   - edge direction = flowdir (1 = digitized direction is downstream; 2 = reverse;
//     other = keep digitized order and record a warning count). All named features
//     in 06010207 carry flowdir=1.
//   - multipart flowlines are rejected (measured: 0 in 06010207); a future
//     converter change must explode collections before committing JSONL.

import fs from "node:fs";
import path from "node:path";
import { haversineM, lineLengthKm, readJsonl, writeJson } from "./nhd_lib.mjs";

const args = process.argv.slice(2);
const argOf = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const hu8 = argOf("--hu8");
if (!hu8) {
  console.error("usage: nhd_build_graph.mjs --hu8 <code> [--tolerance-m 12] [--dam-gap-m 100] [--data-dir data/nhd]");
  process.exit(2);
}
const tolM = Number(argOf("--tolerance-m", "12"));
const damGapM = Number(argOf("--dam-gap-m", "100"));
const dataDir = argOf("--data-dir", "data/nhd");

const flowFeatures = readJsonl(path.join(dataDir, "hu8", `${hu8}.jsonl`));
const vaaRows = readJsonl(path.join(dataDir, "hu8", `${hu8}.vaa.jsonl`));
const wbRows = readJsonl(path.join(dataDir, "hu8", `${hu8}.waterbodies.jsonl`));
const waterbodies = new Map(
  wbRows.map((r) => [String(r.properties.permanent_identifier), r.properties]),
);
const LAKE_FTYPES = new Set([390, 436]); // LakePond, Reservoir

const vaaByPid = new Map();
let vaaPopulated = 0;
for (const row of vaaRows) {
  const p = row.properties;
  const hasAny = Object.entries(p).some(
    ([k, v]) => k !== "permanent_identifier" && v !== null && v !== undefined,
  );
  if (hasAny) {
    vaaPopulated++;
    vaaByPid.set(p.permanent_identifier, p);
  }
}

// --- endpoint snapping (union-find over spatial hash) -------------------------
class DSU {
  constructor() {
    this.p = new Map();
  }
  find(x) {
    const r = this.p.get(x);
    if (r === undefined) {
      this.p.set(x, x);
      return x;
    }
    if (r === x) return x;
    const root = this.find(r);
    this.p.set(x, root);
    return root;
  }
  union(a, b) {
    const ra = this.find(a),
      rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
}

const cellLatDeg = tolM / 111132; // conservative: lon cells at least this wide in meters
const cellKey = ([lon, lat]) => {
  const clon = tolM / (111320 * Math.cos((lat * Math.PI) / 180));
  return `${Math.floor(lon / clon)}:${Math.floor(lat / cellLatDeg)}`;
};

const endpoints = []; // {coord, edgeIdx, end: "from"|"to"}
for (let i = 0; i < flowFeatures.length; i++) {
  const g = flowFeatures[i].geometry;
  if (g.type !== "MultiLineString" || g.coordinates.length !== 1) {
    console.error(
      `error: multipart flowline pid=${flowFeatures[i].properties.permanent_identifier} — explode collections at convert time`,
    );
    process.exit(1);
  }
  const coords = g.coordinates[0];
  endpoints.push({ coord: coords[0], edgeIdx: i, end: "from" });
  endpoints.push({ coord: coords.at(-1), edgeIdx: i, end: "to" });
}

const dsu = new DSU();
const grid = new Map(); // cellKey -> [endpointIdx]
const mergeBuckets = { exact: 0, le5: 0, le10: 0, withinTol: 0 };
for (let e = 0; e < endpoints.length; e++) {
  const { coord } = endpoints[e];
  const k = cellKey(coord);
  let near = -1;
  let nearD = Infinity;
  const [cx, cy] = k.split(":").map(Number);
  const clon = tolM / (111320 * Math.cos((coord[1] * Math.PI) / 180));
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const bucket = grid.get(`${cx + dx}:${cy + dy}`);
      if (!bucket) continue;
      for (const o of bucket) {
        const d = haversineM(coord, endpoints[o].coord);
        if (d <= tolM && d < nearD) {
          nearD = d;
          near = o;
        }
      }
    }
  }
  if (near >= 0) {
    dsu.union(e, near);
    if (nearD === 0) mergeBuckets.exact++;
    else if (nearD <= 5) mergeBuckets.le5++;
    else if (nearD <= 10) mergeBuckets.le10++;
    else mergeBuckets.withinTol++;
  }
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(e);
}

// --- dam-junction bridge (narrow exception, auditable) ------------------------
// NHD leaves the unmapped dam structure as a 10–100 m gap between a reservoir's
// artificial path and the tailwater's first flowline. Bridging applies ONLY to
// an artificial-path endpoint whose wbarea resolves to a named lake/reservoir:
// it may join the nearest endpoint within --dam-gap-m belonging to a different
// waterbody. Streams never merge through this rule. Every bridge is recorded.
const isLakeArtPath = (edgeIdx) => {
  const e = flowFeatures[edgeIdx].properties;
  if (e.ftype !== 558) return false;
  const wb = waterbodies.get(String(e.wbarea_permanent_identifier));
  return !!wb && LAKE_FTYPES.has(wb.ftype);
};
const bridges = [];
const bridgeOverride = new Map(); // root -> representative coord (non-lake side)
const lakeEndpointIdx = [];
for (let e = 0; e < endpoints.length; e++) {
  if (isLakeArtPath(endpoints[e].edgeIdx)) lakeEndpointIdx.push(e);
}
for (const le of lakeEndpointIdx.sort((a, b) => a - b)) {
  const rootA = dsu.find(le);
  const lakeEdgeIdx = endpoints[le].edgeIdx;
  let best = -1,
    bestD = Infinity;
  for (let o = 0; o < endpoints.length; o++) {
    if (endpoints[o].edgeIdx === lakeEdgeIdx) continue;
    const rootO = dsu.find(o);
    if (rootO === rootA) continue;
    const wbOther = waterbodies.get(
      String(flowFeatures[endpoints[o].edgeIdx].properties.wbarea_permanent_identifier),
    );
    if (wbOther && LAKE_FTYPES.has(wbOther.ftype)) {
      const sameLake =
        String(flowFeatures[endpoints[o].edgeIdx].properties.wbarea_permanent_identifier) ===
        String(flowFeatures[lakeEdgeIdx].properties.wbarea_permanent_identifier);
      if (sameLake) continue;
    }
    const d = haversineM(endpoints[le].coord, endpoints[o].coord);
    if (d <= damGapM && d < bestD) {
      bestD = d;
      best = o;
    }
  }
  if (best >= 0) {
    dsu.union(le, best);
    bridges.push({
      lakePid: flowFeatures[lakeEdgeIdx].properties.permanent_identifier,
      joinedPid: flowFeatures[endpoints[best].edgeIdx].properties.permanent_identifier,
      distM: Math.round(bestD * 10) / 10,
      coord: endpoints[best].coord,
    });
    bridgeOverride.set(dsu.find(le), endpoints[best].coord);
  }
}

// --- nodes: deterministic ids from sorted representative coords --------------
const groups = new Map(); // root -> [endpointIdx]
for (let e = 0; e < endpoints.length; e++) {
  const root = dsu.find(e);
  if (!groups.has(root)) groups.set(root, []);
  groups.get(root).push(e);
}
const nodeCoords = [];
const repByRoot = new Map(); // root -> coord, computed once for determinism
for (const [root, members] of groups) {
  let lon, lat;
  if (bridgeOverride.has(root)) {
    [lon, lat] = bridgeOverride.get(root);
  } else {
    lon = members.reduce((s, m) => s + endpoints[m].coord[0], 0) / members.length;
    lat = members.reduce((s, m) => s + endpoints[m].coord[1], 0) / members.length;
  }
  repByRoot.set(root, [lon, lat]);
  nodeCoords.push([lon, lat]);
}
nodeCoords.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const nodeIdByRoot = new Map();
for (const [root] of groups) {
  const [lon, lat] = repByRoot.get(root);
  const idx = nodeCoords.findIndex(([a, b]) => a === lon && b === lat);
  nodeIdByRoot.set(root, `n${idx}`);
}
const nodes = {};
nodeCoords.forEach((coord, i) => (nodes[`n${i}`] = coord));

// --- edges -------------------------------------------------------------------
const edges = [];
const seenEdgeKeys = new Set();
const reversedCount = { flowdir2: 0, other: 0 };
for (let i = 0; i < flowFeatures.length; i++) {
  const p = flowFeatures[i].properties;
  let coords = flowFeatures[i].geometry.coordinates[0];
  if (p.flowdir === 2) {
    coords = coords.slice().reverse();
    reversedCount.flowdir2++;
  } else if (p.flowdir !== 1) {
    reversedCount.other++;
  }
  const from = nodeIdByRoot.get(dsu.find(2 * i));
  const to = nodeIdByRoot.get(dsu.find(2 * i + 1));
  const key = `${from}|${to}|${p.permanent_identifier}|${coords.length}`;
  if (seenEdgeKeys.has(key)) continue;
  seenEdgeKeys.add(key);
  const vaa = vaaByPid.get(p.permanent_identifier) ?? null;
  edges.push({
    id: `e${edges.length}`,
    pid: p.permanent_identifier,
    name: p.gnis_name,
    gnisId: p.gnis_id,
    ftype: p.ftype,
    fcode: p.fcode,
    reachcode: p.reachcode,
    wbarea: p.wbarea_permanent_identifier,
    flowdir: p.flowdir,
    vaa,
    from,
    to,
    km: lineLengthKm(coords),
    coords: coords.map(([lon, lat]) => [lon, lat]),
  });
}

// --- connectivity stats ------------------------------------------------------
const degree = new Map();
const adj = new Map();
for (const e of edges) {
  for (const [n, other] of [
    [e.from, e.to],
    [e.to, e.from],
  ]) {
    degree.set(n, (degree.get(n) ?? 0) + 1);
    if (!adj.has(n)) adj.set(n, []);
    adj.get(n).push(other);
  }
}
const comp = new Map();
let compCount = 0;
for (const n of Object.keys(nodes)) {
  if (comp.has(n)) continue;
  compCount++;
  const q = [n];
  comp.set(n, compCount);
  while (q.length) {
    const c = q.pop();
    for (const o of adj.get(c) ?? []) {
      if (!comp.has(o)) {
        comp.set(o, compCount);
        q.push(o);
      }
    }
  }
}
const dangling = [...degree.values()].filter((d) => d === 1).length;
const compSizes = {};
for (const c of comp.values()) compSizes[c] = (compSizes[c] ?? 0) + 1;
const largestComp = Math.max(...Object.values(compSizes));

const meta = {
  hu8,
  generatedAt: new Date().toISOString(),
  toleranceM: tolM,
  damGapM,
  nodeScheme: "snapped-endpoint union-find, deterministic ids by sorted coord",
  directionRule: "flowdir 1=as-digitized (downstream), 2=reversed, other=as-digitized+counted",
  vaaPopulated,
  counts: {
    nodes: Object.keys(nodes).length,
    edges: edges.length,
    components: compCount,
    largestComponentEdges: largestComp,
    danglingEndpoints: dangling,
    reversedFlowdir2: reversedCount.flowdir2,
    nonStandardFlowdir: reversedCount.other,
  },
  endpointMerges: mergeBuckets,
  damBridges: bridges,
};
if (vaaPopulated > 0) {
  console.warn(
    `note: ${vaaPopulated} VAA rows are populated in this product — build uses them only as recorded attributes; snapping remains the topology source until conventions v2`,
  );
}

const outDir = path.join(dataDir, "graphs");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${hu8}.graph.json`);
writeJson(outPath, { meta, nodes, edges });
console.log(JSON.stringify(meta, null, 2));
console.log(`→ ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
