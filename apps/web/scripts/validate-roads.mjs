/* global console, process */
// Structural validator for public/atlas/roads-*.geojson + roads-manifest.json
// (B12). Checks: LineString/MultiLineString geometry only, per-file MTFCC
// whitelist, WGS84 lon/lat order + in-Tennessee bounds (+buffer), no
// empty/degenerate parts, no consecutive duplicate points, no NaN, manifest-
// vs-reality (file bytes, feature/vertex counts, bbox), provenance fields
// (public-domain TIGER source), and the size gate (≤ 6 MB total raw; warn
// within +20%, fail beyond — topo convention). Exits non-zero on failure.
// Fails cleanly (message only) when the roads output or manifest isn't built.
//
// Run: node scripts/validate-roads.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ATLAS = join(here, '..', 'public', 'atlas');
// Mirrors validate-atlas.mjs (frozen): [minLon, minLat, maxLon, maxLat], lon/lat.
const CLIP = [-90.6, 34.98, -81.45, 36.75];
const CLIP_EPS = 0.02; // degrees of slack around the clip for road coordinates
const TARGET_BYTES = 6 * 1000 * 1000;
const FAIL_TOLERANCE = 1.2; // fail when the total exceeds the target by > +20%

const LOD_MTFCC = {
  major: new Set(['S1100', 'S1200']),
  mid: new Set(['S1400', 'S1630', 'S1640']),
  minor: new Set(['S1500', 'S1820', 'S1830']),
};

const errors = [];
const notes = [];

const fail = (reason) => {
  console.error(`validate-roads: FAIL — ${reason}`);
  process.exit(1);
};

// ---- manifest ----
let manifest;
try {
  manifest = JSON.parse(readFileSync(join(ATLAS, 'roads-manifest.json'), 'utf8'));
} catch {
  fail('roads-manifest.json missing or unparsable — run scripts/build-roads.mjs first.');
}

if (!manifest.source || !manifest.source.dataset || !manifest.source.urls) errors.push('manifest: missing source provenance');
if (!manifest.source || !/public domain/i.test(manifest.source.license ?? '')) errors.push('manifest: source.license must state public-domain terms');
if (!manifest.source || !/census\.gov/.test(manifest.source.urls ?? '')) errors.push('manifest: source.urls must point at census.gov');
if (!manifest.clip || manifest.clip.rule !== 'whole-part rejection') errors.push('manifest: missing clip rule');
if (!manifest.files || !Array.isArray(manifest.files) || manifest.files.length === 0) errors.push('manifest: no files');

let totalBytes = 0;
const seenFiles = new Set();
for (const entry of manifest.files ?? []) {
  seenFiles.add(entry.file);
  totalBytes += entry.bytes;
  if (!LOD_MTFCC[entry.lod]) errors.push(`manifest: unknown lod ${entry.lod}`);
  if (!entry.file || !/^roads-(major|mid|minor)\.geojson$/.test(entry.file)) errors.push(`manifest: unexpected file name ${entry.file}`);
  if (!Number.isFinite(entry.bytes) || entry.bytes <= 0) errors.push(`manifest: bad bytes for ${entry.file}`);
  if (!Number.isFinite(entry.rdpDeg) || entry.rdpDeg <= 0) errors.push(`manifest: bad rdpDeg for ${entry.file}`);
  if (![4, 5].includes(entry.precisionDp)) errors.push(`manifest: bad precisionDp for ${entry.file}`);
  const [w, s, e, n] = entry.bbox ?? [];
  if ([w, s, e, n].some((v) => !Number.isFinite(v))) errors.push(`manifest: bad bbox for ${entry.file}`);
  else if (w < CLIP[0] - CLIP_EPS || s < CLIP[1] - CLIP_EPS || e > CLIP[2] + CLIP_EPS || n > CLIP[3] + CLIP_EPS) {
    errors.push(`manifest: ${entry.file} bbox outside TN clip+eps`);
  }
}
if (manifest.totals?.bytes !== totalBytes) errors.push('manifest: totals.bytes != sum of file bytes');
if (manifest.totals?.features !== (manifest.files ?? []).reduce((s, f) => s + (f.features ?? 0), 0)) errors.push('manifest: totals.features mismatch');
if (manifest.totals?.vertices !== (manifest.files ?? []).reduce((s, f) => s + (f.vertices ?? 0), 0)) errors.push('manifest: totals.vertices mismatch');

// ---- geometry files ----
let totalFeatures = 0;
let totalVertices = 0;
let totalBytesOnDisk = 0;
for (const entry of manifest.files ?? []) {
  const path = join(ATLAS, entry.file);
  let bytesOnDisk;
  try {
    bytesOnDisk = statSync(path).size;
  } catch {
    errors.push(`${entry.file}: missing — run scripts/build-roads.mjs`);
    continue;
  }
  totalBytesOnDisk += bytesOnDisk;
  if (bytesOnDisk !== entry.bytes) errors.push(`${entry.file}: ${bytesOnDisk} bytes on disk, manifest says ${entry.bytes}`);

  let fc;
  try {
    fc = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    errors.push(`${entry.file}: unparsable JSON`);
    continue;
  }
  if (fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    errors.push(`${entry.file}: not a FeatureCollection`);
    continue;
  }
  if (fc.features.length !== entry.features) errors.push(`${entry.file}: ${fc.features.length} features, manifest says ${entry.features}`);
  const allowed = LOD_MTFCC[entry.lod];
  let verts = 0;
  for (const f of fc.features) {
    const p = f.properties ?? {};
    const geom = f.geometry ?? {};
    if (geom.type !== 'LineString' && geom.type !== 'MultiLineString') {
      errors.push(`${entry.file}: non-line geometry ${geom.type} (${p.name ?? p.mtfcc ?? '?'})`);
      continue;
    }
    if (!allowed.has(p.mtfcc)) errors.push(`${entry.file}: mtfcc ${p.mtfcc} not allowed for lod ${entry.lod}`);
    if (p.name !== undefined && (typeof p.name !== 'string' || p.name.length === 0)) errors.push(`${entry.file}: empty name property (must be omitted)`);
    const parts = geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;
    if (parts.length === 0) errors.push(`${entry.file}: ${p.name ?? p.mtfcc} zero parts`);
    for (const part of parts) {
      if (!Array.isArray(part) || part.length < 2) {
        errors.push(`${entry.file}: ${p.name ?? p.mtfcc} part with < 2 points`);
        continue;
      }
      let prev = null;
      for (const [x, y] of part) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) { errors.push(`${entry.file}: non-finite coordinate`); break; }
        if (Math.abs(x) > 180 || Math.abs(y) > 90) { errors.push(`${entry.file}: out-of-range [${x},${y}]`); break; }
        if (x > -50 && y < -50) { errors.push(`${entry.file}: suspected lat/lon swap [${x},${y}]`); break; }
        if (x < CLIP[0] - CLIP_EPS || y < CLIP[1] - CLIP_EPS || x > CLIP[2] + CLIP_EPS || y > CLIP[3] + CLIP_EPS) {
          errors.push(`${entry.file}: outside TN clip+eps [${x},${y}]`);
          break;
        }
        if (prev && prev[0] === x && prev[1] === y) errors.push(`${entry.file}: consecutive duplicate point [${x},${y}]`);
        prev = [x, y];
        verts++;
      }
    }
  }
  if (verts !== entry.vertices) errors.push(`${entry.file}: ${verts} vertices, manifest says ${entry.vertices}`);
  totalFeatures += fc.features.length;
  totalVertices += verts;
  notes.push(`${entry.file}: ${fc.features.length} features / ${verts} verts / ${(bytesOnDisk / 1048576).toFixed(2)} MB (lod ${entry.lod}, rdp ${entry.rdpDeg}°, ${entry.precisionDp}dp)`);
}

// stray roads files not in the manifest
for (const f of readdirSync(ATLAS)) {
  if (/^roads-(major|mid|minor)\.geojson$/.test(f) && !seenFiles.has(f)) errors.push(`stray roads file ${f} not covered by manifest`);
}

if (totalFeatures !== manifest.totals?.features) errors.push(`feature total ${totalFeatures} != manifest ${manifest.totals?.features}`);
if (totalVertices !== manifest.totals?.vertices) errors.push(`vertex total ${totalVertices} != manifest ${manifest.totals?.vertices}`);

console.log(notes.join('\n'));
console.log(`roads total: ${totalFeatures} features / ${totalVertices} verts / ${(totalBytesOnDisk / 1048576).toFixed(2)} MB`);

// ---- size gate (topo convention: warn within +20%, fail beyond) ----
if (totalBytesOnDisk > TARGET_BYTES) {
  const msg = `roads total ${(totalBytesOnDisk / 1048576).toFixed(2)} MB vs ${TARGET_BYTES / 1048576} MB target`;
  if (totalBytesOnDisk > TARGET_BYTES * FAIL_TOLERANCE) errors.push(msg + ' (over fail limit +20%)');
  else notes.push(`WARN: ${msg} (within +20% tolerance)`);
}

if (errors.length) {
  console.error(`validate-roads: FAIL — ${errors.length} errors`);
  for (const e of errors.slice(0, 30)) console.error(`  ${e}`);
  process.exit(1);
}
console.log('validate-roads: PASS (structure, bounds, provenance, manifest agreement, size gate)');
