#!/usr/bin/env node
// nhd-network-build.mjs — statewide NHD named-network build (GEONET lane).
// Turns the Caney Fork network proof (nhd-network-proof.mjs) into the
// owner-approved statewide architecture: NHD named network rendered as-is,
// zoom-gated, per-region on-demand files. No per-water tracing here.
//
//   node scripts/nhd-network-build.mjs
//
// Cluster contract (frozen): cluster = 4-digit HU8 prefix. Per line:
// dpSimplify 20 m → round 5 dp → collapseHairpins (nhd-validate-lib) →
// drop parts with <2 vertices. A cluster file over 3.5 MB is split by
// 8-digit unit code into alphabetical halves, recursively (0601 → 0601a/0601b
// → 0601aa/0601ab ...).
//
// One documented extension (GEONET 2026-09-11, flagged to owner): HU8
// 06010105 (Wheeler Lake area, 24,601 named lines) is 6.6 MB at the frozen
// 20 m pipeline — the unit-level split rule bottoms out before the 3.5 MB
// gate can be met. The recursion therefore continues INSIDE an over-cap
// unit: its features split into alphabetical halves by permanent_identifier,
// ids continuing the same suffix scheme (06010105a/06010105b → ...). The
// 4-digit cluster scheme, pipeline, and property shape are untouched.
//
// Output:
//   apps/web/public/atlas/network/<clusterId>.geojson
//   apps/web/public/atlas/network/manifest.json
//
// Proof-only predecessor: apps/web/public/atlas/network-caneyfork.geojson is
// owned by the map-swap lane (SESSION B / mapStyle.ts) — this builder does
// not touch it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dpSimplify, lineLengthKm, roundCoords } from './nhd_lib.mjs';
import { collapseHairpins } from './nhd-validate-lib.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hu8Dir = path.join(repoRoot, 'data/nhd/hu8');
const outDir = path.join(repoRoot, 'apps/web/public/atlas/network');

const SIMPLIFY_M = 20;
const ROUND_DP = 5;
const MAX_FILE_BYTES = 3.5 * 1024 * 1024;
const SCHEMA = 'trout/nhd-network/1';

// Reference totals from the owner-approved build plan (sanity band, not gates).
const REF = { lines: 169869, km: 93881, mb: 46 };

// ---------------------------------------------------------------------------
// 1. Process every HU8 unit into a serialized features array.
// Units are kept as pre-serialized `[f1,f2,...]` strings so cluster splitting
// never re-serializes feature objects (statewide payload ~46 MB of JSON).
// ---------------------------------------------------------------------------

function processUnit(hu8File) {
  const hu8 = hu8File.replace('.jsonl', '');
  const raw = fs.readFileSync(path.join(hu8Dir, hu8File), 'utf8').split('\n').filter(Boolean);
  const feats = []; // { pid, km, bbox, json } — json is the serialized Feature
  let droppedDegenerate = 0;
  let km = 0;

  for (const line of raw) {
    const f = JSON.parse(line);
    const coords = f.geometry?.coordinates;
    if (!coords || !f.properties.gnis_name) continue; // named flowlines with geometry only
    const parts = coords
      .map((lineCoords) => collapseHairpins(roundCoords(dpSimplify(lineCoords, SIMPLIFY_M), ROUND_DP)).coords)
      .filter((lineCoords) => lineCoords.length >= 2);
    if (parts.length === 0) {
      droppedDegenerate++;
      continue;
    }
    const fbbox = [Infinity, Infinity, -Infinity, -Infinity];
    for (const part of parts) {
      for (const [lon, lat] of part) {
        if (lon < fbbox[0]) fbbox[0] = lon;
        if (lat < fbbox[1]) fbbox[1] = lat;
        if (lon > fbbox[2]) fbbox[2] = lon;
        if (lat > fbbox[3]) fbbox[3] = lat;
      }
    }
    const featKm = parts.reduce((s, p) => s + lineLengthKm(p), 0);
    km += featKm;
    const pid = String(f.properties.permanent_identifier);
    feats.push({
      pid,
      km: featKm,
      bbox: fbbox,
      json: JSON.stringify({
        type: 'Feature',
        properties: {
          kind: 'minor-water',
          name: f.properties.gnis_name,
          ftype: f.properties.ftype,
          lengthKm: Math.round(featKm * 100) / 100,
          hu8,
          pid,
        },
        geometry: { type: 'MultiLineString', coordinates: parts },
      }),
    });
  }
  return {
    hu8,
    feats,
    source: raw.length,
    emitted: feats.length,
    droppedDegenerate,
    km,
    bbox: feats.length
      ? feats.reduce(
          (b, f) => [
            Math.min(b[0], f.bbox[0]),
            Math.min(b[1], f.bbox[1]),
            Math.max(b[2], f.bbox[2]),
            Math.max(b[3], f.bbox[3]),
          ],
          [Infinity, Infinity, -Infinity, -Infinity],
        )
      : null,
  };
}

// ---------------------------------------------------------------------------
// 2. Cluster splitting: alphabetical halves of the sorted unit list,
// recursive, ids like 0601a/0601b (0601aa/0601ab on a second level).
// When a single unit alone exceeds the cap (06010105), the recursion drops
// to feature level inside that unit: alphabetical halves by pid, ids like
// 06010105a/06010105b (see header note — the one documented extension).
// ---------------------------------------------------------------------------

const fcBytes = (feats) =>
  Buffer.byteLength('{"type":"FeatureCollection","features":[' + feats.map((f) => f.json).join(',') + ']}');

function splitCluster(clusterId, units) {
  const files = [];
  const walk = (id, feats, units) => {
    const bytes = fcBytes(feats);
    if (bytes <= MAX_FILE_BYTES) {
      files.push({ id, feats, units, bytes });
      return;
    }
    if (units.length > 1) {
      const mid = Math.ceil(units.length / 2);
      const unitSet = new Set(units.slice(0, mid));
      walk(
        id + 'a',
        feats.filter((f) => unitSet.has(f.hu8)),
        units.slice(0, mid),
      );
      walk(id + 'b', feats.filter((f) => !unitSet.has(f.hu8)), units.slice(mid));
      return;
    }
    if (feats.length === 1) {
      throw new Error(
        `single feature ${feats[0].pid} (HU8 ${units[0]}) is ${bytes} bytes > ${MAX_FILE_BYTES} — ` +
          `split rule exhausted; the cluster contract needs a decision (smaller simplify or per-feature files).`,
      );
    }
    // feature-level fallback: alphabetical halves by pid
    const sorted = feats.slice().sort((a, b) => (a.pid < b.pid ? -1 : a.pid > b.pid ? 1 : 0));
    const mid = Math.ceil(sorted.length / 2);
    walk(id + 'a', sorted.slice(0, mid), units);
    walk(id + 'b', sorted.slice(mid), units);
  };
  const all = units.flatMap((u) => u.feats.map((f) => ({ ...f, hu8: u.hu8 })));
  walk(clusterId, all, units.map((u) => u.hu8));
  return files;
}

// ---------------------------------------------------------------------------
// 3. Build, write, manifest.
// ---------------------------------------------------------------------------

const unitFiles = fs
  .readdirSync(hu8Dir)
  .filter((f) => /^\d{8}\.jsonl$/.test(f))
  .sort();
console.log(`nhd-network-build: ${unitFiles.length} HU8 units, simplify ${SIMPLIFY_M} m, round ${ROUND_DP} dp, cap ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(1)} MB`);

const units = unitFiles.map(processUnit);
const totalDropped = units.reduce((s, u) => s + u.droppedDegenerate, 0);
if (totalDropped > 0) {
  for (const u of units.filter((u) => u.droppedDegenerate > 0)) {
    console.log(`  note: ${u.hu8}: ${u.droppedDegenerate} degenerate line(s) dropped (all parts <2 vertices after sanitize)`);
  }
}

// clean previous build outputs (this builder's files only — never the proof file)
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  if (/^[\dab]+\.geojson$/.test(f) || f === 'manifest.json') fs.unlinkSync(path.join(outDir, f));
}

const clusterIds = [...new Set(units.map((u) => u.hu8.slice(0, 4)))].sort();
const clusters = [];
for (const cid of clusterIds) {
  const runs = units.filter((u) => u.hu8.startsWith(cid));
  for (const file of splitCluster(cid, runs)) {
    const outName = `${file.id}.geojson`;
    const payload = '{"type":"FeatureCollection","features":[' + file.feats.map((f) => f.json).join(',') + ']}';
    const outPath = path.join(outDir, outName);
    fs.writeFileSync(outPath, payload);
    const bytes = fs.statSync(outPath).size;
    if (bytes !== file.bytes) throw new Error(`${outName}: wrote ${bytes} bytes, expected ${file.bytes}`);
    const bboxUnion = file.feats.reduce(
      (b, f) => [
        Math.min(b[0], f.bbox[0]),
        Math.min(b[1], f.bbox[1]),
        Math.max(b[2], f.bbox[2]),
        Math.max(b[3], f.bbox[3]),
      ],
      [Infinity, Infinity, -Infinity, -Infinity],
    );
    clusters.push({
      id: file.id,
      file: `network/${outName}`,
      units: file.units,
      bbox: bboxUnion.map((v) => Math.round(v * 1e5) / 1e5),
      bytes,
      lines: file.feats.length,
      km: Math.round(file.feats.reduce((s, f) => s + f.km, 0) * 10) / 10,
    });
  }
}
clusters.sort((a, b) => (a.id < b.id ? -1 : 1));

const manifest = {
  schema: SCHEMA,
  generated: new Date().toISOString(),
  simplifyM: SIMPLIFY_M,
  clusters,
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');

// ---------------------------------------------------------------------------
// 4. Report: per-cluster table + coverage reconciliation vs source JSONLs.
// ---------------------------------------------------------------------------

console.log('\nper-cluster output:');
console.log('id          units  lines      km     MB  file');
for (const c of clusters) {
  console.log(
    `${c.id.padEnd(10)} ${String(c.units.length).padStart(5)} ${String(c.lines).padStart(6)} ${String(c.km).padStart(7)} ${String((c.bytes / 1024 / 1024).toFixed(2)).padStart(6)}  ${c.file}`,
  );
}
const totLines = clusters.reduce((s, c) => s + c.lines, 0);
const totKm = clusters.reduce((s, c) => s + c.km, 0);
const totBytes = clusters.reduce((s, c) => s + c.bytes, 0);
console.log(
  `total (${clusters.length} files) ${String(units.length).padStart(5)} ${String(totLines).padStart(6)} ${String(Math.round(totKm)).padStart(7)} ${(totBytes / 1024 / 1024).toFixed(2)}  (reference band: ~${REF.lines.toLocaleString()} lines / ~${REF.km.toLocaleString()} km / ~${REF.mb} MB)`,
);

console.log('\ncoverage reconciliation (source named flowlines vs emitted per unit):');
const mismatches = [];
for (const u of units) {
  const ok = u.emitted + u.droppedDegenerate === u.source;
  if (!ok) mismatches.push(u);
  console.log(
    `${u.hu8}: source ${String(u.source).padStart(5)} emitted ${String(u.emitted).padStart(5)} dropped ${String(u.droppedDegenerate).padStart(3)} ${ok ? 'ok' : 'MISMATCH'}`,
  );
}
if (mismatches.length > 0) {
  throw new Error(`coverage reconciliation failed for ${mismatches.length} unit(s)`);
}
console.log(
  `reconciliation: ${units.length}/${units.length} units ok — every named flowline landed in exactly one cluster ` +
    `(${totLines} emitted + ${totalDropped} degenerate drops = ${totLines + totalDropped} source lines)`,
);
