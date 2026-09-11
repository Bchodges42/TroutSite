#!/usr/bin/env node
// nhd-network-gates.mjs — acceptance gates for the statewide NHD named-network
// build (GEONET lane). Reads ONLY the committed outputs (network/*.geojson +
// manifest.json) and the source JSONLs; shares the sanitizer with the builder
// via nhd-validate-lib so a gate pass means the shipped bytes are clean.
//
//   node scripts/nhd-network-gates.mjs
//
// Gates (all must pass, evidence printed):
//  G1 manifest shape: schema trout/nhd-network/1, simplifyM 20, unique sorted ids
//  G2 file set on disk == manifest set (no orphans, no missing)
//  G3 every file ≤ 3.5 MiB (3,670,016 bytes) and byte count matches manifest
//  G4 every feature: kind/name/pid/hu8/ftype/lengthKm present and well-typed
//  G5 nesting: coordinates[i][j] is a [lon,lat] number pair (triple-nest bug
//     class), every part ≥ 2 vertices, lon/lat in range
//  G6 0 fold-backs + 0 duplicate vertices: collapseHairpins re-run per part
//     removes nothing (turn angle >135° on segments <60 m)
//  G7 feature bounds inside its manifest cluster bbox
//  G8 pid faithfulness: shipped per-pid occurrence counts == source counts
//     (source ships 90 border-shared pids twice — inherited, not build-added)
//  G9 coverage reconciliation: emitted-per-unit (from shipped files, grouped
//     by properties.hu8) == source named-flowline count per JSONL, minus
//     degenerate drops (units with a gap are re-run through the pipeline)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dpSimplify, lineLengthKm, roundCoords } from './nhd_lib.mjs';
import { collapseHairpins } from './nhd-validate-lib.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(repoRoot, 'apps/web/public/atlas/network');
const hu8Dir = path.join(repoRoot, 'data/nhd/hu8');
const MAX_FILE_BYTES = 3.5 * 1024 * 1024;

const failures = [];
const fail = (msg) => failures.push(msg);
const check = (ok, msg) => {
  if (!ok) fail(msg);
  return ok;
};

// G1 — manifest shape
const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
check(manifest.schema === 'trout/nhd-network/1', `G1 schema: ${manifest.schema}`);
check(manifest.simplifyM === 20, `G1 simplifyM: ${manifest.simplifyM}`);
check(Array.isArray(manifest.clusters) && manifest.clusters.length > 0, 'G1 clusters array empty');
const ids = manifest.clusters.map((c) => c.id);
check(new Set(ids).size === ids.length, 'G1 duplicate cluster ids');
check(JSON.stringify(ids) === JSON.stringify([...ids].sort()), 'G1 cluster ids not sorted');

// G2 — disk set == manifest set
const diskFiles = fs.readdirSync(outDir).filter((f) => f.endsWith('.geojson')).sort();
const manifestFiles = manifest.clusters.map((c) => `${c.id}.geojson`).sort();
check(
  JSON.stringify(diskFiles) === JSON.stringify(manifestFiles),
  `G2 file set mismatch: disk [${diskFiles}] vs manifest [${manifestFiles}]`,
);

// G3 + G4 + G5 + G6 + G7 + G8 — full scan of every shipped feature
const perUnitEmitted = new Map(); // hu8 -> count (from shipped bytes)
const shippedPidCounts = new Map(); // pid -> occurrence count
let totalLines = 0;
let totalKm = 0;
let hairpinRemoved = 0;
let partsChecked = 0;
let verticesChecked = 0;
const clusterById = new Map(manifest.clusters.map((c) => [c.id, c]));

console.log('id          units  lines      km     MB  gate-scan');
for (const c of manifest.clusters) {
  const file = path.join(outDir, `${c.id}.geojson`);
  const bytes = fs.statSync(file).size;
  check(bytes <= MAX_FILE_BYTES, `G3 ${c.id}: ${bytes} > ${MAX_FILE_BYTES}`);
  check(bytes === c.bytes, `G3 ${c.id}: on-disk ${bytes} != manifest ${c.bytes}`);
  const fc = JSON.parse(fs.readFileSync(file, 'utf8'));
  check(fc.type === 'FeatureCollection', `G4 ${c.id}: not a FeatureCollection`);
  let lines = 0;
  let km = 0;
  for (const f of fc.features) {
    lines++;
    const p = f.properties ?? {};
    check(
      p.kind === 'minor-water',
      `G4 ${c.id}/${p.pid}: kind ${JSON.stringify(p.kind)}`,
    );
    check(typeof p.name === 'string' && p.name.length > 0, `G4 ${c.id}/${p.pid}: bad name`);
    check(typeof p.pid === 'string' && p.pid.length > 0, `G4 ${c.id}: bad pid`);
    check(/^\d{8}$/.test(p.hu8 ?? ''), `G4 ${c.id}/${p.pid}: bad hu8 ${JSON.stringify(p.hu8)}`);
    check(typeof p.ftype === 'number', `G4 ${c.id}/${p.pid}: bad ftype`);
    // lengthKm rounds to 2dp: 0 is legitimate for <5 m stub lines (590 statewide)
    check(
      typeof p.lengthKm === 'number' && Number.isFinite(p.lengthKm) && p.lengthKm >= 0,
      `G4 ${c.id}/${p.pid}: bad lengthKm`,
    );
    if (shippedPidCounts.has(p.pid)) shippedPidCounts.set(p.pid, shippedPidCounts.get(p.pid) + 1);
    else shippedPidCounts.set(p.pid, 1);
    perUnitEmitted.set(p.hu8, (perUnitEmitted.get(p.hu8) ?? 0) + 1);
    km += p.lengthKm;

    check(f.geometry?.type === 'MultiLineString', `G5 ${c.id}/${p.pid}: geometry type`);
    const parts = f.geometry?.coordinates;
    check(Array.isArray(parts) && parts.length > 0, `G5 ${c.id}/${p.pid}: no parts`);
    let fMinLon = Infinity,
      fMinLat = Infinity,
      fMaxLon = -Infinity,
      fMaxLat = -Infinity;
    for (const [pi, part] of (parts ?? []).entries()) {
      partsChecked++;
      if (!check(Array.isArray(part) && part.length >= 2, `G5 ${c.id}/${p.pid} part ${pi}: <2 vertices`)) continue;
      for (const [vi, v] of part.entries()) {
        verticesChecked++;
        if (
          !check(
            Array.isArray(v) && v.length === 2 && Number.isFinite(v[0]) && Number.isFinite(v[1]),
            `G5 ${c.id}/${p.pid} part ${pi} vertex ${vi}: not a [lon,lat] pair (nesting bug)`,
          )
        ) {
          break;
        }
        if (
          !check(
            v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90,
            `G5 ${c.id}/${p.pid}: coordinate out of range ${v}`,
          )
        ) {
          break;
        }
        if (v[0] < fMinLon) fMinLon = v[0];
        if (v[1] < fMinLat) fMinLat = v[1];
        if (v[0] > fMaxLon) fMaxLon = v[0];
        if (v[1] > fMaxLat) fMaxLat = v[1];
      }
      const { removed } = collapseHairpins(part);
      if (removed > 0) {
        hairpinRemoved += removed;
        fail(`G6 ${c.id}/${p.pid} part ${pi}: ${removed} fold-back/duplicate vertex(es) survived`);
      }
    }
    check(
      fMinLon >= c.bbox[0] - 1e-9 &&
        fMinLat >= c.bbox[1] - 1e-9 &&
        fMaxLon <= c.bbox[2] + 1e-9 &&
        fMaxLat <= c.bbox[3] + 1e-9,
      `G7 ${c.id}/${p.pid}: feature bounds outside cluster bbox`,
    );
  }
  totalLines += lines;
  totalKm += km;
  console.log(
    `${c.id.padEnd(10)} ${String(c.units.length).padStart(5)} ${String(lines).padStart(6)} ${String(c.km).padStart(7)} ${(bytes / 1024 / 1024).toFixed(2).padStart(6)}  ${failures.length === 0 ? 'ok' : `FAIL(${failures.length})`}`,
  );
}
// G8 — pid faithfulness: the shipped per-pid occurrence counts must exactly
// match the source's. The source itself ships 90 border-shared pids twice
// (identical geometry in two neighboring HU8 JSONLs — measured 2026-09-11);
// the build must neither add nor lose duplication relative to that baseline.
const sourcePidCounts = new Map();
const sourcePidUnits = new Map(); // pid -> Set(hu8)
for (const file of fs.readdirSync(hu8Dir).filter((f) => /^\d{8}\.jsonl$/.test(f)).sort()) {
  const hu8 = file.replace('.jsonl', '');
  for (const l of fs.readFileSync(path.join(hu8Dir, file), 'utf8').split('\n').filter(Boolean)) {
    const pid = String(JSON.parse(l).properties.permanent_identifier);
    sourcePidCounts.set(pid, (sourcePidCounts.get(pid) ?? 0) + 1);
    if (!sourcePidUnits.has(pid)) sourcePidUnits.set(pid, new Set());
    sourcePidUnits.get(pid).add(hu8);
  }
}
let pidMismatches = 0;
for (const [pid, n] of shippedPidCounts) {
  const src = sourcePidCounts.get(pid) ?? 0;
  if (n !== src) {
    pidMismatches++;
    if (pidMismatches <= 5) fail(`G8 pid ${pid}: shipped ${n}x, source ${src}x`);
  }
}
for (const [pid, n] of sourcePidCounts) {
  if ((shippedPidCounts.get(pid) ?? 0) !== n) {
    pidMismatches++;
    if (pidMismatches <= 5) fail(`G8 pid ${pid}: source ${n}x, shipped ${shippedPidCounts.get(pid) ?? 0}x`);
  }
}
check(pidMismatches === 0, `G8 pid occurrence mismatch vs source: ${pidMismatches} pid(s)`);
const borderPairs = new Map();
let borderPidTotal = 0;
for (const [, units] of sourcePidUnits) {
  if (units.size > 1) {
    borderPidTotal++;
    const key = [...units].sort().join('+');
    borderPairs.set(key, (borderPairs.get(key) ?? 0) + 1);
  }
}
console.log(
  `G8 note: ${borderPidTotal} border-shared pid(s) ship in 2 units, inherited from source ` +
    `(not added by the build): ${[...borderPairs.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`,
);

// G9 — coverage reconciliation vs source JSONLs
const sourceCounts = new Map();
for (const file of fs.readdirSync(hu8Dir).filter((f) => /^\d{8}\.jsonl$/.test(f)).sort()) {
  const hu8 = file.replace('.jsonl', '');
  const raw = fs.readFileSync(path.join(hu8Dir, file), 'utf8').split('\n').filter(Boolean);
  sourceCounts.set(hu8, raw.length);
}
const sourceTotal = [...sourceCounts.values()].reduce((a, b) => a + b, 0);
const gapUnits = [];
for (const [hu8, src] of sourceCounts) {
  const emitted = perUnitEmitted.get(hu8) ?? 0;
  if (emitted !== src) gapUnits.push({ hu8, src, emitted });
}
check(gapUnits.every(({ src, emitted }) => emitted < src), 'G9 emitted > source is never legitimate');
// A gap is only legitimate when the missing lines are degenerate: re-run the
// builder pipeline for gapped units and require an exact count match.
let degenerateTotal = 0;
for (const { hu8, src, emitted } of gapUnits) {
  const raw = fs.readFileSync(path.join(hu8Dir, `${hu8}.jsonl`), 'utf8').split('\n').filter(Boolean);
  let expected = 0;
  for (const line of raw) {
    const f = JSON.parse(line);
    const coords = f.geometry?.coordinates;
    if (!coords || !f.properties.gnis_name) continue;
    const parts = coords
      .map((c) => collapseHairpins(roundCoords(dpSimplify(c, 20), 5)).coords)
      .filter((c) => c.length >= 2);
    if (parts.length > 0) expected++;
  }
  check(
    expected === emitted,
    `G9 ${hu8}: pipeline expects ${expected} surviving lines, shipped files carry ${emitted}`,
  );
  degenerateTotal += src - emitted;
  console.log(`G9 ${hu8}: source ${src}, emitted ${emitted}, degenerate drops ${src - emitted} (verified by re-run)`);
}
for (const [hu8, emitted] of perUnitEmitted) {
  if (!sourceCounts.has(hu8)) fail(`G9 emitted hu8 ${hu8} has no source JSONL`);
}
check(
  totalLines + degenerateTotal === sourceTotal,
  `G9 totals do not reconcile: ${totalLines} emitted + ${degenerateTotal} drops != ${sourceTotal}`,
);

console.log(
  `\ngate scan: ${totalLines.toLocaleString()} features, ${shippedPidCounts.size.toLocaleString()} unique pids, ` +
    `${partsChecked.toLocaleString()} parts / ${verticesChecked.toLocaleString()} vertices checked, ` +
    `${hairpinRemoved} hairpins/duplicates found, total ${Math.round(totalKm).toLocaleString()} km`,
);
console.log(
  `coverage: ${perUnitEmitted.size}/${sourceCounts.size} units emitted, ${gapUnits.length} unit(s) with degenerate-only gaps, ` +
    `reconciliation ${totalLines + degenerateTotal}/${sourceTotal}`,
);

if (failures.length > 0) {
  console.error(`\nGATES FAILED (${failures.length}):`);
  for (const f of failures.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('ALL GATES PASS');
