#!/usr/bin/env node
// nhd_snap_anchors.mjs — snap gauge anchors (apps/web/src/data/streams-geo.json,
// read-only) onto the trace graph, recording anchor-to-edge distance so bad
// snaps are reviewable. Never writes outside data/nhd/derived/.
//
// Usage:
//   node scripts/nhd_snap_anchors.mjs --hu8 06010207 \
//     [--anchors apps/web/src/data/streams-geo.json] [--max-snap-m 250] [--margin-km 5]

import fs from 'node:fs';
import path from 'node:path';
import { bboxOf, projectToSegment, readJsonl, writeJson } from './nhd_lib.mjs';

const args = process.argv.slice(2);
const argOf = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const hu8 = argOf('--hu8');
if (!hu8) {
  console.error('usage: nhd_snap_anchors.mjs --hu8 <code> [--anchors <path>] [--max-snap-m 250]');
  process.exit(2);
}
const anchorsPath = argOf('--anchors', 'apps/web/src/data/streams-geo.json');
const maxSnapM = Number(argOf('--max-snap-m', '250'));
const marginKm = Number(argOf('--margin-km', '5'));
const dataDir = argOf('--data-dir', 'data/nhd');

const graph = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'graphs', `${hu8}.graph.json`), 'utf8'),
);
const anchorsRaw = JSON.parse(fs.readFileSync(anchorsPath, 'utf8'));

const [minLon, minLat, maxLon, maxLat] = bboxOf(Object.values(graph.nodes));
const degPerKmLat = 1 / 111.132;
const marginDeg = marginKm * degPerKmLat;

function nearestOnGraph(lon, lat) {
  let best = null;
  for (const e of graph.edges) {
    const c = e.coords;
    for (let i = 1; i < c.length; i++) {
      const proj = projectToSegment([lon, lat], c[i - 1], c[i]);
      if (!best || proj.distM < best.distM) {
        best = {
          distM: proj.distM,
          point: proj.point,
          t: proj.t,
          edgeId: e.id,
          edgePid: e.pid,
          name: e.name,
          ftype: e.ftype,
          kmAlongEdgeKm: (e.km * (i - 1 + proj.t)) / (c.length - 1),
        };
      }
    }
  }
  return best;
}

const out = { hu8, anchorsPath, maxSnapM, anchors: {} };
let snapped = 0,
  far = 0,
  outside = 0;
for (const [waterId, a] of Object.entries(anchorsRaw)) {
  if (waterId.startsWith('_')) continue;
  const { lat, lon, gauge } = a;
  const inBbox =
    lon >= minLon - marginDeg &&
    lon <= maxLon + marginDeg &&
    lat >= minLat - marginDeg &&
    lat <= maxLat + marginDeg;
  if (!inBbox) {
    out.anchors[waterId] = { lat, lon, gauge, status: 'out-of-hu8' };
    outside++;
    continue;
  }
  const snap = nearestOnGraph(lon, lat);
  const status = snap.distM <= maxSnapM ? 'ok' : 'far';
  if (status === 'ok') snapped++;
  else far++;
  out.anchors[waterId] = {
    lat,
    lon,
    gauge,
    status,
    snap: {
      distM: Math.round(snap.distM * 10) / 10,
      snappedPoint: snap.point,
      edgeId: snap.edgeId,
      edgePid: snap.edgePid,
      edgeName: snap.name,
      ftype: snap.ftype,
    },
  };
}

fs.mkdirSync(path.join(dataDir, 'derived'), { recursive: true });
const outPath = path.join(dataDir, 'derived', `${hu8}.anchors.json`);
writeJson(outPath, out, true);
console.log(JSON.stringify({ hu8, snapped, far, outside, outPath }, null, 2));
