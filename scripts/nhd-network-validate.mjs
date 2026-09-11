#!/usr/bin/env node
// nhd-network-validate.mjs — independent statewide gate for the NHD named-network
// cluster build (SESSION GEOQA). Companion to scripts/nhd-network-gates.mjs: the
// gates are the producing lane's acceptance evidence, this file is the QA lane's
// repeatable verification harness. It re-derives every check from the committed
// bytes (cluster files + manifest + source JSONLs) and FAILS LOUDLY on drift.
//
//   node scripts/nhd-network-validate.mjs [--out data/nhd/derived/validate/network-report.json]
//
// Checks:
//  M1 manifest shape: schema trout/nhd-network/1, simplifyM 20, unique sorted ids
//  M2 file set on disk == manifest set (no orphans, no missing)
//  C1 per cluster: JSON parses, FeatureCollection, feature count == manifest lines
//  C2 byte size <= 3.5 MB and byte count matches the manifest
//  C4 every feature has name + pid + hu8 (+ kind/ftype/lengthKm well-typed)
//  C5 nesting depth: coordinates[i][j] is a [lon,lat] position (triple-nest bug
//     class), every part >= 2 vertices, lon/lat finite and in range
//  C6 0 fold-backs + 0 duplicate vertices (turn >135 deg on <60 m segments —
//     collapseHairpins re-run per part must remove nothing)
//  C7 bbox matches contents: every feature's bounds inside the manifest bbox
//  U1 every cluster unit exists in the source set; multi-cluster units are
//     recorded as sub-unit splits (documented builder deviation #1) and gated
//     by U4 instead
//  U2 every source HU8 JSONL is claimed by some cluster (and vice versa)
//  U3 coverage reconciliation vs data/nhd/hu8/*.jsonl named-flowline counts:
//     every named line ships in exactly one cluster; a per-unit gap is only
//     legitimate when the missing lines are degenerate (pipeline re-run proves it)
//  U4 per-unit pid multiset equality: shipped (pid→count) == source — this is
//     the real "every named line in exactly one cluster" guarantee; it also
//     proves sub-unit-split siblings partition their unit (no pid instance in
//     two clusters). Gap units require shipped ≤ source per pid.
//
// Exit codes: 0 PASS, 1 any FAIL, 2 usage. The suite's --strict path imports
// runNetworkValidation() so future rebuilds gate on these checks automatically.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dpSimplify, roundCoords } from './nhd_lib.mjs';
import { collapseHairpins } from './nhd-validate-lib.mjs';

export const MAX_CLUSTER_BYTES = 3.5 * 1024 * 1024;
export const NETWORK_SCHEMA = 'trout/nhd-network/1';

/**
 * Validates the network build from disk. Pure-ish: all inputs are paths, so
 * tests can point it at synthetic fixture directories.
 */
export function runNetworkValidation({
  outDir,
  hu8Dir,
  maxFileBytes = MAX_CLUSTER_BYTES,
  onProgress = null,
}) {
  const failures = [];
  const fail = (check, id, evidence) => failures.push({ check, id, evidence });
  const perCluster = [];

  // --- M1: manifest shape -----------------------------------------------------
  const manifestPath = path.join(outDir, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    fail('M1', 'manifest.json', `unparseable: ${e.message}`);
    return { ok: false, failures, perCluster, summary: { clusters: 0 } };
  }
  if (manifest.schema !== NETWORK_SCHEMA) fail('M1', 'manifest.json', `schema ${manifest.schema}`);
  if (manifest.simplifyM !== 20) fail('M1', 'manifest.json', `simplifyM ${manifest.simplifyM}`);
  const clusters = Array.isArray(manifest.clusters) ? manifest.clusters : [];
  if (clusters.length === 0) fail('M1', 'manifest.json', 'clusters array empty');
  const ids = clusters.map((c) => c.id);
  if (new Set(ids).size !== ids.length) fail('M1', 'manifest.json', 'duplicate cluster ids');
  if (JSON.stringify(ids) !== JSON.stringify([...ids].sort()))
    fail('M1', 'manifest.json', 'cluster ids not sorted');

  // --- M2: file set on disk == manifest set ------------------------------------
  const diskFiles = fs.existsSync(outDir)
    ? fs
        .readdirSync(outDir)
        .filter((f) => f.endsWith('.geojson'))
        .sort()
    : [];
  const manifestFiles = clusters.map((c) => `${c.id}.geojson`).sort();
  if (JSON.stringify(diskFiles) !== JSON.stringify(manifestFiles))
    fail('M2', 'file-set', `disk [${diskFiles}] vs manifest [${manifestFiles}]`);

  // --- C1..C7: full scan of every shipped feature --------------------------------
  const perUnitEmitted = new Map(); // hu8 -> emitted count from shipped bytes
  const shippedPidByUnit = new Map(); // hu8 -> Map(pid -> count)
  const unitsToClusters = new Map(); // hu8 -> Set(cluster id)
  let totalLines = 0;
  let totalKm = 0;
  for (const c of clusters) {
    const file = path.join(outDir, `${c.id}.geojson`);
    const row = { id: c.id, lines: 0, bytes: 0 };
    if (!fs.existsSync(file)) {
      fail('M2', c.id, 'manifest cluster has no file on disk');
      perCluster.push({ id: c.id, ok: false });
      continue;
    }
    row.bytes = fs.statSync(file).size;
    if (row.bytes > maxFileBytes) fail('C2', c.id, `${row.bytes} bytes > ${maxFileBytes}`);
    if (typeof c.bytes === 'number' && row.bytes !== c.bytes)
      fail('C2', c.id, `on-disk ${row.bytes} != manifest ${c.bytes}`);

    let fc;
    try {
      fc = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      fail('C1', c.id, `unparseable JSON: ${e.message}`);
      perCluster.push({ ...row, ok: false });
      continue;
    }
    if (fc.type !== 'FeatureCollection' || !Array.isArray(fc.features))
      fail('C1', c.id, 'not a FeatureCollection');
    row.lines = fc.features.length;
    if (typeof c.lines === 'number' && row.lines !== c.lines)
      fail('C1', c.id, `${row.lines} features != manifest lines ${c.lines}`);

    for (const f of fc.features) {
      const p = f?.properties ?? {};
      const fid = `${c.id}/${p.pid ?? '?'}`;
      if (typeof p.name !== 'string' || p.name.length === 0) fail('C4', fid, 'missing name');
      if (typeof p.pid !== 'string' || p.pid.length === 0) fail('C4', fid, 'missing pid');
      if (!/^\d{8}$/.test(p.hu8 ?? '')) fail('C4', fid, `bad hu8 ${JSON.stringify(p.hu8)}`);
      if (p.kind !== 'minor-water') fail('C4', fid, `kind ${JSON.stringify(p.kind)}`);
      if (typeof p.ftype !== 'number') fail('C4', fid, 'bad ftype');
      if (typeof p.lengthKm !== 'number' || !Number.isFinite(p.lengthKm) || p.lengthKm < 0)
        fail('C4', fid, `bad lengthKm ${JSON.stringify(p.lengthKm)}`);
      perUnitEmitted.set(p.hu8, (perUnitEmitted.get(p.hu8) ?? 0) + 1);
      if (!shippedPidByUnit.has(p.hu8)) shippedPidByUnit.set(p.hu8, new Map());
      const pidCounts = shippedPidByUnit.get(p.hu8);
      pidCounts.set(p.pid, (pidCounts.get(p.pid) ?? 0) + 1);
      if (!unitsToClusters.has(p.hu8)) unitsToClusters.set(p.hu8, new Set());
      unitsToClusters.get(p.hu8).add(c.id);
      totalKm += p.lengthKm ?? 0;

      // C5 — nesting depth: coordinates[i][j] must be a position pair.
      if (f?.geometry?.type !== 'MultiLineString') {
        fail('C5', fid, `geometry type ${f?.geometry?.type}`);
        continue;
      }
      const parts = f.geometry.coordinates;
      if (!Array.isArray(parts) || parts.length === 0) {
        fail('C5', fid, 'no parts');
        continue;
      }
      let fMinLon = Infinity,
        fMinLat = Infinity,
        fMaxLon = -Infinity,
        fMaxLat = -Infinity;
      for (const [pi, part] of parts.entries()) {
        if (!Array.isArray(part) || part.length < 2) {
          fail(
            'C5',
            fid,
            `part ${pi}: ${Array.isArray(part) ? `${part.length} vertices` : 'not an array'}`,
          );
          continue;
        }
        for (const [vi, v] of part.entries()) {
          if (
            !Array.isArray(v) ||
            v.length !== 2 ||
            !Number.isFinite(v[0]) ||
            !Number.isFinite(v[1])
          ) {
            fail('C5', fid, `part ${pi} vertex ${vi}: not a [lon,lat] position (nesting bug)`);
            break;
          }
          if (v[0] < -180 || v[0] > 180 || v[1] < -90 || v[1] > 90) {
            fail('C5', fid, `part ${pi} vertex ${vi}: out of range ${JSON.stringify(v)}`);
            break;
          }
          if (v[0] < fMinLon) fMinLon = v[0];
          if (v[1] < fMinLat) fMinLat = v[1];
          if (v[0] > fMaxLon) fMaxLon = v[0];
          if (v[1] > fMaxLat) fMaxLat = v[1];
        }
        // C6 — 0 fold-backs + 0 duplicate vertices must survive the sanitizer.
        const { removed } = collapseHairpins(part);
        if (removed > 0)
          fail('C6', fid, `part ${pi}: ${removed} fold-back/duplicate vertex(es) survived`);
      }
      // C7 — manifest bbox must match contents.
      if (
        Array.isArray(c.bbox) &&
        (fMinLon < c.bbox[0] - 1e-9 ||
          fMinLat < c.bbox[1] - 1e-9 ||
          fMaxLon > c.bbox[2] + 1e-9 ||
          fMaxLat > c.bbox[3] + 1e-9)
      )
        fail(
          'C7',
          fid,
          `bounds [${fMinLon},${fMinLat},${fMaxLon},${fMaxLat}] outside cluster bbox ${JSON.stringify(c.bbox)}`,
        );
    }
    totalLines += row.lines;
    perCluster.push({
      ...row,
      ok: !failures.some((x) => x.id.startsWith(`${c.id}/`) || x.id === c.id),
    });
    onProgress?.(row);
  }

  // --- U1: cluster unit claims vs source, sub-unit splits recorded -------------------
  const unitToManifestClusters = new Map();
  for (const c of clusters)
    for (const hu8 of c.units ?? []) {
      if (!unitToManifestClusters.has(hu8)) unitToManifestClusters.set(hu8, new Set());
      unitToManifestClusters.get(hu8).add(c.id);
    }
  const subUnitSplits = [];
  for (const [hu8, set] of unitToManifestClusters) {
    if (set.size === 1) continue;
    subUnitSplits.push({ hu8, clusters: [...set].sort() });
    // Features must actually span those clusters, and only those.
    const featureClusters = unitsToClusters.get(hu8);
    if (
      !featureClusters ||
      featureClusters.size !== set.size ||
      [...set].some((id) => !featureClusters.has(id))
    )
      fail(
        'U1',
        hu8,
        `manifest split [${[...set]}] does not match feature distribution [${[...(featureClusters ?? [])]}]`,
      );
  }
  for (const [hu8, set] of unitsToClusters) {
    const claimed = unitToManifestClusters.get(hu8);
    if (!claimed || set.size !== claimed.size || [...set].some((id) => !claimed.has(id)))
      fail(
        'U1',
        hu8,
        `features land in [${[...set]}] but manifest claims [${[...(claimed ?? [])]}]`,
      );
  }

  // --- U2/U3: source JSONL reconciliation -------------------------------------------
  const sourceCounts = new Map();
  const sourcePidByUnit = new Map(); // hu8 -> Map(pid -> count)
  if (fs.existsSync(hu8Dir)) {
    for (const file of fs
      .readdirSync(hu8Dir)
      .filter((f) => /^\d{8}\.jsonl$/.test(f))
      .sort()) {
      const hu8 = file.replace('.jsonl', '');
      const raw = fs.readFileSync(path.join(hu8Dir, file), 'utf8').split('\n').filter(Boolean);
      sourceCounts.set(hu8, raw.length);
      const pids = new Map();
      for (const line of raw) {
        const pid = String(JSON.parse(line).properties.permanent_identifier);
        pids.set(pid, (pids.get(pid) ?? 0) + 1);
      }
      sourcePidByUnit.set(hu8, pids);
    }
  } else {
    fail('U2', hu8Dir, 'source hu8 directory missing');
  }
  for (const hu8 of sourceCounts.keys())
    if (!unitToManifestClusters.has(hu8) && !unitsToClusters.has(hu8))
      fail('U2', hu8, 'source unit claimed by no cluster');

  const gapUnits = [];
  for (const [hu8, src] of sourceCounts) {
    const emitted = perUnitEmitted.get(hu8) ?? 0;
    if (emitted > src) fail('U3', hu8, `emitted ${emitted} > source ${src} — never legitimate`);
    else if (emitted < src) gapUnits.push({ hu8, src, emitted });
  }
  // A gap is only legitimate when the missing lines are degenerate (collapse to
  // nothing under the frozen pipeline): re-run the pipeline per gapped unit and
  // require an exact count match.
  let degenerateTotal = 0;
  for (const { hu8, src, emitted } of gapUnits) {
    const raw = fs
      .readFileSync(path.join(hu8Dir, `${hu8}.jsonl`), 'utf8')
      .split('\n')
      .filter(Boolean);
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
    if (expected !== emitted)
      fail(
        'U3',
        hu8,
        `pipeline expects ${expected} surviving lines, shipped files carry ${emitted}`,
      );
    degenerateTotal += src - emitted;
  }
  // U4 — per-unit pid multiset: the line-level "every named line in exactly one
  // cluster" guarantee. Non-gap units must match the source exactly; gap units
  // may only undershoot (and U3's pipeline re-run proves the deficit is all
  // degenerate lines). Exceeding the source count anywhere is a duplicate ship.
  const gapByUnit = new Map(gapUnits.map((g) => [g.hu8, g]));
  for (const [hu8, shipped] of shippedPidByUnit) {
    const source = sourcePidByUnit.get(hu8);
    if (!source) {
      fail('U4', hu8, 'shipped unit has no source JSONL');
      continue;
    }
    const isGap = gapByUnit.has(hu8);
    let mismatches = 0;
    for (const [pid, n] of shipped) {
      const src = source.get(pid) ?? 0;
      if (n > src || (!isGap && n !== src)) {
        mismatches++;
        if (mismatches <= 3) fail('U4', `${hu8}/${pid}`, `shipped ${n}x, source ${src}x`);
      }
    }
    if (!isGap)
      for (const [pid, n] of source) {
        if (!shipped.has(pid)) {
          mismatches++;
          if (mismatches <= 3) fail('U4', `${hu8}/${pid}`, `source ${n}x, shipped 0x`);
        }
      }
    if (mismatches > 3) fail('U4', hu8, `... ${mismatches} pid mismatch(es) total in unit`);
  }
  const sourceTotal = [...sourceCounts.values()].reduce((a, b) => a + b, 0);
  if (totalLines + degenerateTotal !== sourceTotal)
    fail(
      'U3',
      'totals',
      `${totalLines} emitted + ${degenerateTotal} degenerate drops != ${sourceTotal} source`,
    );

  const summary = {
    clusters: perCluster.length,
    filesOnDisk: diskFiles.length,
    lines: totalLines,
    km: Math.round(totalKm),
    units: sourceCounts.size,
    gapUnits: gapUnits.length,
    degenerateDrops: degenerateTotal,
    sourceLines: sourceTotal,
    reconciliation: `${totalLines + degenerateTotal}/${sourceTotal}`,
    subUnitSplits,
  };
  return { ok: failures.length === 0, failures, perCluster, summary };
}

// --- CLI ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const argOf = (flag, def) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : def);
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const outDir = path.resolve(repoRoot, argOf('--dir', 'apps/web/public/atlas/network'));
  const hu8Dir = path.resolve(repoRoot, argOf('--hu8-dir', 'data/nhd/hu8'));
  const outPath = path.resolve(
    repoRoot,
    argOf('--out', 'data/nhd/derived/validate/network-report.json'),
  );

  console.log(`network validation — ${path.relative(repoRoot, outDir)}`);
  const { ok, failures, perCluster, summary } = runNetworkValidation({ outDir, hu8Dir });

  console.log('id         lines      MB');
  for (const row of perCluster)
    console.log(
      `${row.id.padEnd(10)} ${String(row.lines).padStart(6)} ${((row.bytes ?? 0) / 1024 / 1024).toFixed(2).padStart(6)}`,
    );
  console.log(
    `totals: ${summary.clusters} clusters, ${summary.lines.toLocaleString()} lines, ` +
      `${summary.km.toLocaleString()} km, units ${summary.units}, reconciliation ${summary.reconciliation}`,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    lane: 'GEOQA',
    suite: 'scripts/nhd-network-validate.mjs',
    verdict: ok ? 'PASS' : 'FAIL',
    summary,
    failures,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`report: ${path.relative(repoRoot, outPath)}`);

  if (!ok) {
    console.error(`NETWORK VALIDATION FAILED (${failures.length}):`);
    for (const f of failures.slice(0, 50)) console.error(`  - [${f.check}] ${f.id}: ${f.evidence}`);
    process.exit(1);
  }
  console.log('NETWORK VALIDATION PASS');
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
)
  main();
