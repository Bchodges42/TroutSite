#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * trace-west/apply-west.mjs — deterministic, idempotent validator for the
 * trace-crew WEST artifacts (2026-09-08).
 *
 * Reads EVERY apps/web/.atlas-src/trace/west/out/<id>.json and validates:
 *   1. schema: id / region / geometry / properties / evidence / metrics
 *   2. coordinates: finite, WGS84 lon/lat in the TN workspace box
 *      (lon -92..-80, lat 32..38), every chain >= 2 vertices
 *   3. declared vs recomputed: partCount, vertexCount, lengthKm (haversine,
 *      <= 1% drift), bounds contain the geometry
 *   4. length sanity vs source: artifact lengthKm within ±10% of the VAA
 *      lengthkm sum of the chained reaches (evidence.levelPathDetail)
 *   5. 0 self-crossings: the S2 detector
 *      (.atlas-src/audit-s2/detect-self-intersections.mjs) is RE-INVOKED on
 *      the artifact geometry — the authoritative gate
 *
 * This script NEVER writes to canonical/atlas-sources — the orchestrator
 * applies. It writes nothing outside .atlas-src/trace/west/.
 *
 * Run: node scripts/trace-west/apply-west.mjs              (validate + summary)
 *      node scripts/trace-west/apply-west.mjs --validate   (same; CI mode —
 *                  exit code 1 on any validation failure)
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { haversine } from '../lib-west-middle-fix.mjs';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(webRoot, '.atlas-src', 'trace', 'west', 'out');
const DETECTOR = join(webRoot, '.atlas-src', 'audit-s2', 'detect-self-intersections.mjs');
const TMP = join(webRoot, '.atlas-src', 'trace', 'west', '.apply-tmp');
const CI = process.argv.includes('--validate');

function lineLenKm(l) {
  let m = 0;
  for (let i = 1; i < l.length; i++) m += haversine(l[i - 1], l[i]);
  return m / 1000;
}

function bboxOf(lines) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const l of lines) for (const [x, y] of l) {
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x;
    if (y > b[3]) b[3] = y;
  }
  return b;
}

function countVerts(coords) {
  let n = 0;
  (function walk(a) {
    if (Array.isArray(a[0]) && typeof a[0][0] === 'number') { n += a.length; return; }
    for (const c of a) walk(c);
  })(coords);
  return n;
}

const failures = [];
const rows = [];

for (const file of readdirSync(OUT_DIR).filter((f) => f.endsWith('.json')).sort()) {
  const path = join(OUT_DIR, file);
  const errs = [];
  let a = null;
  try {
    a = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    failures.push({ id: file, errs: [`unparseable JSON: ${e.message}`] });
    continue;
  }
  const id = a.id ?? file;
  const add = (m) => errs.push(m);

  // 1. schema
  for (const k of ['id', 'region', 'geometry', 'properties', 'evidence', 'metrics']) if (!(k in a)) add(`missing top-level ${k}`);
  if (a.region !== 'west-middle' && a.region !== 'canonical-only') add(`bad region ${a.region}`);
  if (a.geometry?.type !== 'MultiLineString') add(`geometry.type ${a.geometry?.type} != MultiLineString`);
  if (a.properties?.source !== 'nhd-hr' && a.source !== 'nhd-hr') add('source != nhd-hr');

  // 2. coordinates
  const chains = a.geometry?.coordinates ?? [];
  if (!chains.length) add('0 chains');
  let verts = 0;
  let badCoord = 0;
  let shortChain = 0;
  for (const c of chains) {
    if (c.length < 2) shortChain++;
    verts += c.length;
    for (const [x, y] of c) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) badCoord++;
      else if (x < -92 || x > -80 || y < 32 || y > 38) badCoord++;
    }
  }
  if (badCoord) add(`${badCoord} invalid/out-of-box coordinates`);
  if (shortChain) add(`${shortChain} degenerate (<2 vertex) chains`);

  // 3. declared vs recomputed
  const km = chains.reduce((s, l) => s + lineLenKm(l), 0);
  const b = bboxOf(chains);
  if (a.properties?.partCount !== chains.length) add(`partCount ${a.properties?.partCount} != geometry ${chains.length}`);
  if (a.properties?.vertexCount !== verts) add(`vertexCount ${a.properties?.vertexCount} != geometry ${verts}`);
  if (Math.abs((a.properties?.lengthKm ?? 0) - km) > 0.01 * Math.max(1, km)) add(`lengthKm ${a.properties?.lengthKm} != recomputed ${km.toFixed(2)}`);
  const pb = a.properties?.bounds;
  if (pb && (pb[0] > b[0] + 1e-6 || pb[1] > b[1] + 1e-6 || pb[2] < b[2] - 1e-6 || pb[3] < b[3] - 1e-6)) add(`bounds ${pb} do not contain geometry ${b.map((v) => +v.toFixed(4))}`);

  // 4. length sanity vs VAA source
  const vaaKm = (a.evidence?.levelPathDetail ?? []).reduce((s, p) => s + (p.vaaKm ?? 0), 0);
  if (vaaKm > 0) {
    const drift = (km - vaaKm) / vaaKm;
    if (Math.abs(drift) > 0.10) add(`lengthKm ${km.toFixed(1)} drifts ${(+drift * 100).toFixed(1)}% from VAA source ${vaaKm.toFixed(1)} km (>10%)`);
  }

  // 5. 0 self-crossings via the authoritative S2 detector
  let crossings = null;
  try {
    mkdirSync(TMP, { recursive: true });
    const tmpFile = join(TMP, `${id}.geojson`);
    writeFileSync(tmpFile, JSON.stringify({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { id, name: id }, geometry: a.geometry }],
    }));
    const out = execFileSync(process.execPath, [DETECTOR, tmpFile], { encoding: 'utf8', timeout: 300000 });
    rmSync(tmpFile, { force: true });
    const summary = JSON.parse(out.slice(out.indexOf('[')));
    const row = summary.find((r) => r.id === id);
    crossings = row?.crossings ?? -1;
    if (crossings !== 0) add(`${crossings} self-crossings reported by detect-self-intersections.mjs`);
  } catch (e) {
    add(`detector failed: ${String(e.message ?? e).slice(0, 200)}`);
  }

  rows.push({
    id,
    region: a.region,
    parts: chains.length,
    km: +km.toFixed(2),
    vaaKm: +vaaKm.toFixed(2),
    crossings,
    before: a.metrics?.before ?? null,
    after: a.metrics?.after ?? null,
    errs,
  });
  if (errs.length) failures.push({ id, errs });
}

// ---- summary table ----
console.log('trace-west artifact validation — ' + new Date().toISOString());
console.log('');
console.log('id                                region          parts     km  x  | before parts/km/x | errors');
console.log('-'.repeat(120));
for (const r of rows) {
  console.log(
    r.id.padEnd(33),
    String(r.region).padEnd(15),
    String(r.parts).padStart(5),
    String(r.km).padStart(8),
    String(r.crossings).padStart(3),
    ' | ' + String(r.before?.parts ?? '?').padStart(4) + '/' + String(r.before?.lengthKm ?? '?').padStart(7) + '/' + String(r.before?.crossings ?? '?').padStart(3),
    ' | ' + (r.errs.length ? 'FAIL: ' + r.errs.join(' ; ') : 'ok'),
  );
}
console.log('-'.repeat(120));
console.log(`${rows.length} artifacts, ${failures.length} failing`);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log(`  ${f.id}: ${f.errs.join(' ; ')}`);
}
if (CI && failures.length) process.exit(1);
