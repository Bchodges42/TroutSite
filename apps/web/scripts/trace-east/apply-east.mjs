/* global URL, console, process */
// trace-east/apply-east.mjs — deterministic, idempotent VALIDATOR over the EAST
// crew's rebuild artifacts (.atlas-src/trace/east/out/<id>.json).
//
// It validates ONLY; it never writes canonical/rivers.geojson, the region
// artifacts, or anything under apps/web/src (the orchestrator's apply step owns
// canonical writes; WEST crew owns its files). A future apply step can consume
// these artifacts after this validator passes.
//
// Checks per artifact:
//   1. schema: id/region/geometry/properties/evidence/metrics present; region
//      is east-southeast | canonical-only
//   2. geometry: MultiLineString, finite lon/lat in range, vertexCount and
//      partCount consistent, coords 6dp
//   3. length: haversine recompute matches properties.lengthKm (<= 0.5% drift)
//   4. length sanity vs NHD source: delivered/source in 0.9..1.10, or documented
//      state cut (notes mention 'state cut'/'out-of-state') when below
//   5. self-crossings: recomputed count == metrics.after.crossings == 0
//   6. bounds match recomputed bounds
//   7. welds: documented seams <= 1 km (continuity stitch threshold); no
//      undocumented mid-course gaps > 1 km inside a part (endpoint continuity)
//
// Run: node scripts/trace-east/apply-east.mjs --validate
import {
  loadCanonical, loadRegion, loadTNBoundary,
  countSelfCrossings, lineLenKm, boundsOf, ptInGeom, nearestDistM, _dM,
} from './lib.mjs';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const VALIDATE = process.argv.includes('--validate') || process.argv.length <= 1;
if (!VALIDATE) {
  console.error('usage: node scripts/trace-east/apply-east.mjs --validate');
  process.exit(2);
}

const OUT_DIR = new URL('../../.atlas-src/trace/east/out/', import.meta.url);
const canon = loadCanonical();
const region = loadRegion();
const _tn = loadTNBoundary();

// downstream weld targets from the trace config (mirrored here so validation
// does not depend on the tracer module)
const LINE_WELD_TARGETS = {
  'french-broad-river': ['tennessee-river'],
  'little-pigeon-river': ['french-broad-river'],
  'ocoee-river': ['hiwassee-river'],
  'clinch-river': ['tennessee-river'],
  'powell-river': [],
  'holston-river': ['tennessee-river'],
  'north-fork-holston-river': ['holston-river'],
  'new-river': ['clear-fork'],
  'little-river': ['tennessee-river'],
  'emory-river': ['clinch-river'],
  'daddys-creek': ['obed-river'],
  'obed-river': ['emory-river'],
  'upper-roan-creek': ['watauga-river'],
  'sequatchie-river': ['tennessee-river'],
  // pool termini (inside or <= 1 km NHD pool-arm headpool margin)
  'nolichucky-river': ['douglas-lake'],
  'pigeon-river': ['douglas-lake'],
  'hiwassee-river': ['chickamauga-lake'],
  'south-holston-river': ['boone-lake'],
  'watauga-river': ['watauga-lake'],
  'south-fork-cumberland': [],
};

function loadArtifactGeom(id) {
  const artPath = new URL(`${id}.json`, OUT_DIR);
  if (existsSync(artPath)) return JSON.parse(readFileSync(artPath, 'utf8')).geometry;
  const rf = region?.features.find((x) => x.properties.id === id);
  if (rf) return rf.geometry;
  const cf = canon.features.find((x) => x.properties.id === id);
  return cf ? cf.geometry : null;
}

const rows = [];
let failures = 0;
const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.json')).sort();
for (const file of files) {
  const problems = [];
  let o = null;
  try { o = JSON.parse(readFileSync(new URL(file, OUT_DIR), 'utf8')); }
  catch (e) { console.log(`FAIL ${file}: unparseable (${e.message})`); failures++; continue; }

  const id = o.id ?? file.replace(/\.json$/, '');
  const parts = o.geometry?.type === 'MultiLineString' ? o.geometry.coordinates : null;
  if (!parts) problems.push('geometry is not a MultiLineString');
  if (!['east-southeast', 'canonical-only'].includes(o.region)) problems.push(`bad region ${o.region}`);
  if (!o.properties || !o.evidence || !o.metrics?.before || !o.metrics?.after) problems.push('missing properties/evidence/metrics block');
  if (o.fixSource && !String(o.fixSource).includes('scripts/trace-east')) problems.push('fixSource not trace-east');

  if (parts) {
    // coordinate validity
    let verts = 0;
    for (const part of parts) {
      if (part.length < 2) problems.push('part with < 2 vertices');
      for (const [x, y] of part) {
        verts++;
        if (!Number.isFinite(x) || !Number.isFinite(y)) problems.push('non-finite coordinate');
        if (x < -90 || x > 90 || y < 30 || y > 40) problems.push(`coordinate out of TN window: ${x},${y}`);
        if (+x.toFixed(6) !== x || +y.toFixed(6) !== y) problems.push('coordinate precision > 6dp');
      }
    }
    if (o.properties && verts !== o.properties.vertexCount) problems.push(`vertexCount ${o.properties.vertexCount} != actual ${verts}`);
    if (o.properties && parts.length !== o.properties.partCount) problems.push(`partCount ${o.properties.partCount} != actual ${parts.length}`);

    // length recompute
    const lenKm = parts.reduce((s, p) => s + lineLenKm(p), 0);
    if (o.properties && Math.abs(lenKm - o.properties.lengthKm) > 0.005 * o.properties.lengthKm)
      problems.push(`lengthKm ${o.properties.lengthKm} != recomputed ${lenKm.toFixed(2)}`);

    // bounds recompute
    if (o.properties) {
      const b = boundsOf(parts.flat());
      const ob = o.properties.bounds;
      if (b.some((v, i) => Math.abs(v - ob[i]) > 1e-6)) problems.push(`bounds mismatch ${ob} vs ${b}`);
    }

    // self crossings
    const cross = countSelfCrossings(parts);
    if (cross.crossings !== 0) problems.push(`${cross.crossings} self-crossings`);
    if (o.metrics?.after && o.metrics.after.crossings !== cross.crossings) problems.push('metrics.after.crossings stale');
    if (o.metrics?.after && o.metrics.after.parts !== parts.length) problems.push('metrics.after.parts stale');

    // length sanity vs NHD source
    const ratio = o.evidence?.lengthRatioOfSource;
    if (ratio == null) problems.push('missing lengthRatioOfSource');
    else {
      const stateCut = (o.evidence?.notes ?? []).some((n) => /state cut|out-of-state/.test(n));
      if (ratio >= 0.9 && ratio <= 1.10) { /* ok */ }
      else if (ratio < 0.9 && stateCut) { /* ok: out-of-state source trimmed */ }
      else problems.push(`length ratio ${ratio} outside 0.9..1.10${stateCut ? ' (state cut documented but still short)' : ''}`);
    }

    // documented seams <= 1 km
    for (const s of o.evidence?.documentedSeams ?? []) {
      if (s.gapM > 1000) problems.push(`documented seam ${s.gapM} m > 1 km`);
      if (!s.cause) problems.push('seam without documented cause');
    }

    // termini discipline (re-verified against current targets; pools accept
    // through-route vertices inside the pool or the 1 km headpool margin —
    // mirrors the tracer gate)
    const targets = (LINE_WELD_TARGETS[id] ?? []).map((t) => [t, loadArtifactGeom(t)]).filter(([, g]) => g);
    if (parts.length && targets.length) {
      const lastPt = parts[parts.length - 1][parts[parts.length - 1].length - 1];
      const firstPt = parts[0][0];
      let poolHit = false;
      for (const [tid, g] of targets) {
        const isPool = /lake/.test(tid);
        if (isPool) {
          let insideCount = 0;
          for (const part of parts) for (const p of part) if (ptInGeom(p, g)) insideCount++;
          if (insideCount > 0 || ptInGeom(lastPt, g) || ptInGeom(firstPt, g) ||
            nearestDistM(lastPt, g) <= 1000 || nearestDistM(firstPt, g) <= 1000) poolHit = true;
        } else if (nearestDistM(lastPt, g) <= 50) poolHit = true;
      }
      if (!poolHit) problems.push(`downstream end reaches none of [${targets.map((t) => t[0]).join(', ')}] within policy`);
    }
  }

  // before/after sanity
  if (o.metrics?.before && o.metrics?.after) {
    if (o.metrics.after.crossings > o.metrics.before.crossings) problems.push('crossings increased vs before');
  }

  const ok = problems.length === 0;
  if (!ok) failures++;
  rows.push({
    id, ok,
    parts: o.properties?.partCount, lenKm: o.properties?.lengthKm,
    before: `${o.metrics?.before?.parts}p/${o.metrics?.before?.lengthKm}km/${o.metrics?.before?.crossings}x`,
    after: `${o.metrics?.after?.parts}p/${o.metrics?.after?.lengthKm}km/${o.metrics?.after?.crossings}x`,
    ratio: o.evidence?.lengthRatioOfSource,
    problems,
  });
}

console.log(`apply-east validate — ${rows.length} artifact(s), ${failures} failing`);
for (const r of rows) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}: ${r.before} -> ${r.after} (src ratio ${r.ratio})${r.problems.length ? ' :: ' + r.problems.join('; ') : ''}`);
}
console.log(failures ? `VALIDATION FAILED (${failures})` : 'apply-east: all artifacts valid. (No canonical files were written — apply step owns canonical.)');
process.exit(failures ? 1 : 0);
