#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
// Close RESIDUAL continuity gaps: where a stream's committed geometry still
// renders as multiple chunks after the NHD/TIGER merge, and the gap between
// two chunks is at most 1 km AND public-domain sources carry no intermediate
// segment (by construction: merge-rivers already consumed every matching
// NHD/TIGER part in the corridor), the two chunk endpoints are joined so the
// water reads as one line. Every join is logged to
// .atlas-src/out/residual-joins.json and rendered into docs/CONTINUITY-AUDIT.md.
//
// NO fabrication: gaps larger than 1 km are left open and documented, never
// bridged. Run after merge-rivers.mjs, before fix-caney-fork.mjs.
//
//   node scripts/close-residual-gaps.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(here, '..');
const riversPath = join(webDir, 'public', 'atlas', 'rivers.geojson');
const joinsPath = join(webDir, '.atlas-src', 'out', 'residual-joins.json');
const STITCH_KM = 1.0;

const R_KM = 6371.0088, RAD = Math.PI / 180;
function havKm([lon1, lat1], [lon2, lat2]) {
  const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(a));
}
function chunkGroups(parts) {
  const ends = parts.map((p) => [p[0], p[p.length - 1]]);
  const parent = parts.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
    const d = Math.min(
      havKm(ends[i][0], ends[j][0]), havKm(ends[i][0], ends[j][1]),
      havKm(ends[i][1], ends[j][0]), havKm(ends[i][1], ends[j][1]),
    );
    if (d <= STITCH_KM) { const a = find(i), b = find(j); if (a !== b) parent[b] = a; }
  }
  const groups = new Map();
  for (let i = 0; i < parts.length; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  }
  return [...groups.values()];
}

const g = JSON.parse(readFileSync(riversPath, 'utf8'));
const joins = [];
for (const f of g.features) {
  if (f.geometry.type !== 'MultiLineString') continue; // point anchors + wide-water polygons untouched
  const id = f.properties.id;
  let parts = f.geometry.coordinates.filter((p) => Array.isArray(p) && p.length >= 2);
  let groups = chunkGroups(parts);
  let guard = 0;
  while (groups.length > 1 && guard++ < 50) {
    // closest endpoint pair between any two chunks
    let best = null;
    for (let c = 0; c < groups.length; c++) for (let d = c + 1; d < groups.length; d++) {
      for (const i of groups[c]) for (const j of groups[d]) {
        for (const ei of [0, 1]) for (const ej of [0, 1]) {
          const km = havKm(parts[i][ei ? parts[i].length - 1 : 0], parts[j][ej ? parts[j].length - 1 : 0]);
          if (!best || km < best.km) best = { km, i, j, ei, ej };
        }
      }
    }
    if (!best || best.km > STITCH_KM) break; // real coverage gap — leave open, document
    const { i, j, ei, ej, km } = best;
    const a = ei === 0 ? [...parts[i]].reverse() : [...parts[i]]; // ends at the join point
    const b = ej === 1 ? [...parts[j]].reverse() : [...parts[j]]; // starts at the join point
    const mergedPart = [...a, ...b];
    parts = parts.filter((_, k) => k !== i && k !== j);
    parts.push(mergedPart);
    joins.push({
      id,
      index: joins.length + 1,
      from: a[a.length - 1].map((v) => +v.toFixed(4)).join(','),
      to: b[0].map((v) => +v.toFixed(4)).join(','),
      km: Math.round(km * 1000) / 1000,
    });
    console.log(`  join ${id}: ${joins[joins.length - 1].from} -> ${joins[joins.length - 1].to} (${km.toFixed(3)} km)`);
    groups = chunkGroups(parts);
  }
  // rewrite feature (cheap even when unchanged in structure)
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  let verts = 0;
  for (const p of parts) for (const [x, y] of p) {
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
    b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
    verts++;
  }
  if (joins.some((j2) => j2.id === id)) {
    if (!f.properties.source.includes('residual-join')) f.properties.source.push('residual-join');
    f.geometry.coordinates = parts;
    f.properties.partCount = parts.length;
    f.properties.vertexCount = verts;
    f.properties.bounds = b.map((v) => Math.round(v * 1e4) / 1e4);
  }
}

writeFileSync(joinsPath, JSON.stringify(joins, null, 1));
console.log(`close-residual-gaps: ${joins.length} join(s) logged -> ${joinsPath}`);

// Atomic-ish write only when something changed
if (joins.length) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'rivers-')), 'rivers.geojson');
  writeFileSync(tmp, JSON.stringify(g));
  renameSync(tmp, riversPath);
  console.log(`rivers.geojson rewritten with ${joins.length} logged endpoint join(s)`);
}
