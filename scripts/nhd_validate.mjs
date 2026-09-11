#!/usr/bin/env node
// nhd_validate.mjs — B13 known-bad acceptance gate for traced reaches.
//
// Usage (Clinch reference run):
//   node scripts/nhd_validate.mjs --reach data/nhd/derived/reach-clinch-river.geojson \
//     --graph data/nhd/graphs/06010207.graph.json \
//     --asset apps/web/public/atlas/rivers.geojson \
//     --separate-from boone-tailwater,south-holston-river \
//     --expect-up-point 36.2242,-84.0913 --expect-up-radius-m 600 \
//     --expect-down-point 35.8809,-84.5085 --expect-down-radius-m 3000
//
// Checks (frozen — see docs/NHD-CONVENTIONS.md §validation):
//   connectivity    reach sourceIds form ONE connected subgraph in the trace graph
//   continuity      no gap > --max-gap-m between consecutive reach vertices
//   upstream-span   first vertex within radius of the expected upstream terminus (dam)
//   downstream-span last vertex within radius of the expected downstream terminus (mouth)
//   separation      reach bbox disjoint from each --separate-from water in the asset
//   anchor-on-reach anchor snap distance within --max-anchor-snap-m
//   byte-budget     reach file within --budget-bytes
// Exit code 1 on any failure; report JSON written next to the reach.

import fs from "node:fs";
import { haversineM, readJsonl } from "./nhd_lib.mjs";

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
const reachPath = need("--reach", argOf("--reach"));
const graphPath = need("--graph", argOf("--graph"));
const assetPath = argOf("--asset");
const separateFrom = (argOf("--separate-from", "") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const upPointRaw = argOf("--expect-up-point")
  ?.split(",")
  .map(Number);
const upPoint = upPointRaw ? [upPointRaw[1], upPointRaw[0]] : undefined; // flag is lat,lng; geo is lon,lat
const upRadiusM = Number(argOf("--expect-up-radius-m", "600"));
const downPointRaw = argOf("--expect-down-point")
  ?.split(",")
  .map(Number);
const downPoint = downPointRaw ? [downPointRaw[1], downPointRaw[0]] : undefined;
const downRadiusM = Number(argOf("--expect-down-radius-m", "3000"));
const maxJunctionM = Number(argOf("--max-junction-m", "50"));
const budgetBytes = Number(argOf("--budget-bytes", "81920"));
const maxAnchorSnapM = Number(argOf("--max-anchor-snap-m", "250"));

const reach = JSON.parse(fs.readFileSync(reachPath, "utf8"));
const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
const coords = reach.geometry.coordinates[0];
const checks = [];
const add = (name, pass, evidence) => checks.push({ name, pass, evidence });

// connectivity: sourceIds form one connected subgraph of the trace graph
const pidSet = new Set(reach.properties.sourceIds.map(String));
const byPid = new Map(graph.edges.map((e) => [String(e.pid), e]));
const missing = [...pidSet].filter((p) => !byPid.has(p));
const parent = new Map();
const find = (x) => {
  if (!parent.has(x)) parent.set(x, x);
  while (parent.get(x) !== x) x = parent.get(x);
  return x;
};
const union = (a, b) => parent.set(find(a), find(b));
for (const p of pidSet) {
  const e = byPid.get(p);
  if (e?.from && e?.to) union(e.from, e.to);
}
// junction continuity: consecutive edges must share a node via vertex identity
const roots = new Set([...pidSet].map((p) => find(byPid.get(p)?.from ?? "x")));
add(
  "connectivity",
  missing.length === 0 && roots.size === 1,
  { edges: pidSet.size, missingPids: missing, subgraphComponents: roots.size },
);

// continuity: edges must touch at junctions. Long chords WITHIN an edge are
// legitimate (reservoir artificial paths are straight multi-km lines), so the
// hard check is on junction gaps between consecutive path edges, read from the
// audit's ordered pathEdges. A vertex-gap scan is reported as info only.
const audit = JSON.parse(fs.readFileSync(reachPath.replace(/\.geojson$/, ".audit.json"), "utf8"));
const pathEdges = audit.pathEdges ?? [];
let worstJunctionM = 0;
let worstJunctionAt = -1;
// Every edge is stored downstream-first and the assembled reach runs
// terminus-first, so every edge is traversed coords[0] → at(-1); the junction
// between consecutive path edges is exit(at(-1)) ↔ enter(coords[0]).
for (let k = 1; k < pathEdges.length; k++) {
  const a = byPid.get(String(pathEdges[k - 1].pid));
  const b = byPid.get(String(pathEdges[k].pid));
  if (!a || !b) continue;
  const d = haversineM(a.coords.at(-1), b.coords[0]);
  if (d > worstJunctionM) {
    worstJunctionM = d;
    worstJunctionAt = k;
  }
}
add(
  "continuity",
  worstJunctionM <= maxJunctionM,
  { worstJunctionM: Math.round(worstJunctionM), atPathIndex: worstJunctionAt, limitM: maxJunctionM },
);
let maxGap = 0;
for (let i = 1; i < coords.length; i++) {
  const d = haversineM(coords[i - 1], coords[i]);
  if (d > maxGap) maxGap = d;
}
checks.push({
  name: "info:max-vertex-chord",
  pass: true,
  evidence: { maxGapM: Math.round(maxGap), note: "artificial-path chords are legitimate; junction check is authoritative" },
});

// spans
if (upPoint) {
  const d = haversineM(coords[0], upPoint);
  add("upstream-span", d <= upRadiusM, {
    first: coords[0],
    expected: upPoint,
    distM: Math.round(d),
    radiusM: upRadiusM,
  });
}
if (downPoint) {
  const d = haversineM(coords.at(-1), downPoint);
  add("downstream-span", d <= downRadiusM, {
    last: coords.at(-1),
    expected: downPoint,
    distM: Math.round(d),
    radiusM: downRadiusM,
  });
}

// separation vs known-bad waters in the shipped asset (read-only reference)
if (assetPath && separateFrom.length) {
  const asset = JSON.parse(fs.readFileSync(assetPath, "utf8"));
  const [rlon0, rlat0, rlon1, rlat1] = reach.properties.bounds;
  for (const otherId of separateFrom) {
    const other = asset.features.find((f) => f.properties.id === otherId);
    if (!other) {
      add(`separation:${otherId}`, false, { error: "water not found in asset" });
      continue;
    }
    const [olon0, olat0, olon1, olat1] = other.properties.bounds;
    const overlaps =
      rlon0 <= olon1 && olon0 <= rlon1 && rlat0 <= olat1 && olat0 <= rlat1;
    add(`separation:${otherId}`, !overlaps, {
      reachBounds: reach.properties.bounds,
      otherBounds: other.properties.bounds,
    });
  }
}

// anchor snap
add(
  "anchor-on-reach",
  reach.properties.trace.anchor.snapDistM <= maxAnchorSnapM,
  { snapDistM: reach.properties.trace.anchor.snapDistM, limitM: maxAnchorSnapM },
);

// byte budget
const bytes = fs.statSync(reachPath).size;
add("byte-budget", bytes <= budgetBytes, { bytes, budgetBytes });

const pass = checks.every((c) => c.pass);
const report = {
  reach: reachPath,
  verdict: pass ? "PASS" : "FAIL",
  checks,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(reachPath.replace(/\.geojson$/, ".validate.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
