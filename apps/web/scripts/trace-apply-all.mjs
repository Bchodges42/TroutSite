/* global console, process */
// Session-2 trace apply — merges the per-water rebuild artifacts from the
// trace crews (apps/web/.atlas-src/trace/{west,east}/out/<id>.json) into the
// region artifacts (atlas-sources/verified/{west-middle,east-southeast}.geojson
// + their topology records) and, for canonical-only waters, directly into
// public/atlas/rivers.geojson. Deterministic and idempotent: region waters
// flow into canonical afterwards via scripts/integrate-verified-atlas.mjs.
//
// Topology records for rebuilt waters are refreshed from the artifact
// evidence (sourceIds, delivered/source length, largest gap, verification
// source line) while preserving every other record field.
//
// Run: node scripts/trace-apply-all.mjs [--check]
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const REGIONS = {
  west: {
    geo: join(webRoot, 'atlas-sources', 'verified', 'west-middle.geojson'),
    topo: join(webRoot, 'atlas-sources', 'verified', 'west-middle.topology.json'),
    dir: join(webRoot, '.atlas-src', 'trace', 'west', 'out'),
  },
  east: {
    geo: join(webRoot, 'atlas-sources', 'verified', 'east-southeast.geojson'),
    topo: join(webRoot, 'atlas-sources', 'verified', 'east-southeast.topology.json'),
    dir: join(webRoot, '.atlas-src', 'trace', 'east', 'out'),
  },
};
const CANONICAL = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const VERIFY_LINE =
  'USGS NHDPlus HR level-path trace (VAA levelpathi/hydroseq ordering), retrieved 2026-09-09';

// Contract conformance for the traced geometry, each backed by the crew's
// through-lake evidence (NHD artificial paths) — see trace-*/out artifacts:
// a reach that follows the reservoir's artificial path THROUGH a pool must
// declare it; dam-face seams and state cuts use the established
// allowOpenEnds documentation.
const CONTRACT_FIXUPS = {
  'east-fork-stones-river': { addThroughLake: ['j-percy-priest-lake'] },
  'boiling-fork-creek': { addThroughLake: ['tims-ford-lake'] },
  'sinking-creek-wilson': { addThroughLake: ['j-percy-priest-lake'] },
  'white-oak-creek': { addThroughLake: ['kentucky-lake'] },
  'little-river': { addThroughLake: ['fort-loudoun-lake'] },
  'upper-roan-creek': { addThroughLake: ['watauga-lake'] },
  'watauga-river': {
    addThroughLake: ['boone-lake', 'wilbur-lake', 'watauga-lake'],
    allowOpenEnds: true,
    note: 'Dam-face/pool-head seams (Watauga 876 m, Wilbur) and the NC state cut are documented termini, not defects.',
  },
  'south-holston-river': {
    allowOpenEnds: true,
    note: 'South Holston dam-face seam (227 m) and VA state cut are documented termini, not defects.',
  },
};

function applyContractFixups(id, props) {
  const fix = CONTRACT_FIXUPS[id];
  if (!fix) return;
  if (fix.addThroughLake) {
    const set = new Set([...(props.throughLakeIds ?? []), ...fix.addThroughLake]);
    props.throughLakeIds = [...set];
  }
  if (fix.allowOpenEnds) props.allowOpenEnds = true;
  if (fix.note && !String(props.note ?? '').includes(fix.note)) {
    props.note = [props.note ? String(props.note) : '', fix.note].join(' ');
  }
}

// HEAD copies of the topology files — the pre-apply authority for scoped
// source lengths (see refreshRecord). null in a fresh clone without history.
const headTopo = Object.fromEntries(
  Object.entries({
    west: 'atlas-sources/verified/west-middle.topology.json',
    east: 'atlas-sources/verified/east-southeast.topology.json',
  }).map(([k, p]) => {
    try {
      const repoRoot = resolve(webRoot, '..', '..');
      return [
        k,
        JSON.parse(
          execSync('git show HEAD:apps/web/' + p, { cwd: repoRoot, maxBuffer: 1e8 }).toString(),
        ),
      ];
    } catch {
      return [k, {}];
    }
  }),
);

const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

function mergedFeature(existing, artifact) {
  const props = { ...existing.properties };
  for (const [k, v] of Object.entries(artifact.properties)) {
    if (v !== undefined && v !== null) props[k] = v;
  }
  let geometry = artifact.geometry;
  if (geometry.type === 'MultiLineString') {
    const { geometry: clipped, partsDropped } = clipLineToTnWindow(geometry);
    if (partsDropped > 0) {
      props.note = [
        ...(props.note ? [String(props.note)] : []),
        `2026-09-09 statewide trace: ${partsDropped} out-of-window part(s) dropped by the TN clip.`,
      ].join(' ');
    }
    geometry = clipped;
    // the clip changes the shape — recompute the derived properties so the
    // feature stays self-consistent (partCount/vertexCount/bounds/lengthKm,
    // haversine km — same convention as the trace crews)
    let vertexCount = 0;
    let lengthKm = 0;
    let w = 180, s = 90, e = -180, n = -90;
    const rad = Math.PI / 180;
    const hav = (a, b) => {
      const dLat = (b[1] - a[1]) * rad;
      const dLon = (b[0] - a[0]) * rad;
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
      return 2 * 6371000 * Math.asin(Math.sqrt(h));
    };
    for (const part of geometry.coordinates) {
      vertexCount += part.length;
      for (let i = 0; i < part.length; i++) {
        const [lon, lat] = part[i];
        if (lon < w) w = lon;
        if (lon > e) e = lon;
        if (lat < s) s = lat;
        if (lat > n) n = lat;
        if (i > 0) lengthKm += hav(part[i - 1], part[i]);
      }
    }
    props.partCount = geometry.coordinates.length;
    props.vertexCount = vertexCount;
    props.bounds = [w, s, e, n];
    props.lengthKm = Math.round(lengthKm / 100) / 10;
    applyContractFixups(artifact.id, props);
  }
  return { ...existing, geometry, properties: props };
}

function refreshRecord(record, artifact, headRecord, mergedProps) {
  const next = { ...record };
  const props = mergedProps ?? artifact.properties;
  if (props.sourceIds?.length) next.sourceIdentifiers = props.sourceIds;
  // Source length policy, most-specific first: a measured in-scope figure
  // (state-cut corridors where the raw level path spans out-of-scope states),
  // else the take's own level-path length with the corridor reality recorded
  // in reachScope ('gated' = state/corridor cut, floor 50%); HEAD is only a
  // fallback for artifacts without source evidence.
  if (artifact.evidence?.inScopeSourceLengthKm != null) {
    next.sourceLengthKm = artifact.evidence.inScopeSourceLengthKm;
  } else if (artifact.evidence?.sourceLengthKm != null) {
    next.sourceLengthKm = artifact.evidence.sourceLengthKm;
    const scope = String(artifact.evidence.scope ?? '');
    // 'gated' = the delivered corridor is a cut of a larger multi-state level
    // path (VA/NC/GA/KY line cuts, pool-margin corridors) — floor 50%.
    next.reachScope =
      /(VA|NC|SC|GA|AL|KY|MS)\s+(line|state|head)|state (line|cut)|corridor/i.test(scope)
        ? 'gated'
        : 'full-named-extent';
  } else if (headRecord?.sourceLengthKm != null) {
    next.sourceLengthKm = headRecord.sourceLengthKm;
    if (headRecord.reachScope != null) next.reachScope = headRecord.reachScope;
  }
  if (props.lengthKm != null) next.deliveredLengthKm = props.lengthKm;
  if (next.sourceLengthKm && next.deliveredLengthKm) {
    next.lengthRatio = Math.round((next.deliveredLengthKm / next.sourceLengthKm) * 1000) / 1000;
  }
  const gapKm = artifact.metrics?.after?.largestGapKm;
  if (gapKm != null) next.largestConnectionGapMeters = Math.round(gapKm * 1000);
  const seams = artifact.evidence?.documentedSeams ?? [];
  if (seams.length) next.documentedSeams = seams;
  next.verificationSources = [
    ...new Set([...(record.verificationSources ?? []), VERIFY_LINE]),
  ];
  const lpLabel = (artifact.evidence?.levelPathIs ?? [])
    .map((x) => (typeof x === 'string' ? x : x.levelPathI ?? JSON.stringify(x)))
    .join(', ');
  next.note = [
    ...(record.note ? [record.note] : []),
    `2026-09-09 session-2 statewide trace: level path(s) ${lpLabel}; ` +
      `before parts=${artifact.metrics?.before?.parts} crossings=${artifact.metrics?.before?.crossings ?? 0} ` +
      `→ after parts=${props.partCount ?? artifact.metrics?.after?.parts} crossings=0.`,
  ].join(' ');
  return next;
}

/** True when the anchor sits within ~60 m of ANY vertex of the geometry. */
function anchorOnGeometry(anchor, geometry) {
  if (!anchor) return false;
  const parts = geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates];
  const tol = 60 / 111320;
  for (const part of parts) {
    for (const [lon, lat] of part) {
      if (Math.abs(lon - anchor[0]) < tol && Math.abs(lat - anchor[1]) < tol) return true;
    }
  }
  return false;
}

// The atlas clip window (same as validate-atlas). Traces of multi-state level
// paths are cut to it — the documented state-cut precedent (little-tennessee,
// watauga) — never allowed to ship out-of-window geometry.
const TN_WINDOW = { w: -90.6, s: 34.6, e: -81.4, n: 37.3 };

function clipPartToWindow(part) {
  const inside = ([lon, lat]) =>
    lon >= TN_WINDOW.w && lon <= TN_WINDOW.e && lat >= TN_WINDOW.s && lat <= TN_WINDOW.n;
  const out = [];
  let dropped = 0;
  const latCut = (a, b) => {
    const t = (TN_WINDOW.s - a[1]) / (b[1] - a[1]);
    return [a[0] + t * (b[0] - a[0]), TN_WINDOW.s];
  };
  let prev = null;
  for (const v of part) {
    if (inside(v)) {
      if (prev && !inside(prev)) {
        if (out.length) out.push(latCut(v, prev)); // re-entry: join across the cut
        else out.push(latCut(prev, v));
      }
      out.push(v);
    } else {
      if (prev && inside(prev)) out.push(latCut(prev, v)); // exit
      dropped += 1;
    }
    prev = v;
  }
  return { part: out, dropped };
}

function clipLineToTnWindow(geometry) {
  if (geometry.type !== 'MultiLineString') return { geometry, partsDropped: 0 };
  const parts = [];
  let partsDropped = 0;
  for (const part of geometry.coordinates) {
    const { part: clipped, dropped } = clipPartToWindow(part);
    if (clipped.length >= 2) parts.push(clipped);
    else partsDropped += dropped;
  }
  return { geometry: { type: 'MultiLineString', coordinates: parts }, partsDropped };
}

function midpointAnchor(geometry) {
  const parts = geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates];
  let longest = parts[0] ?? [];
  for (const p of parts) if (p.length > longest.length) longest = p;
  return longest[Math.floor(longest.length / 2)] ?? null;
}

let appliedRegion = 0;
let appliedCanonical = 0;
const skipped = [];
const canonicalFc = load(CANONICAL);

// Targeting is MEMBERSHIP-driven, not crew/label-driven: a water belongs to
// whichever region file actually contains its id (crews have mislabeled
// region fields before — e.g. tennessee-river is east-southeast though the
// west crew produced it); only ids in NO region file go to canonical.
const regionFcs = Object.fromEntries(
  Object.entries(REGIONS).map(([k, cfg]) => [k, load(cfg.geo)]),
);
const dirty = Object.fromEntries(Object.keys(REGIONS).map((k) => [k, false]));

for (const crew of Object.keys(REGIONS)) {
  const cfg = REGIONS[crew];
  if (!existsSync(cfg.dir)) continue;
  for (const file of readdirSync(cfg.dir).filter((f) => f.endsWith('.json'))) {
    const artifact = load(join(cfg.dir, file));
    const id = artifact.id;
    if (!id || !artifact.geometry) {
      skipped.push(`${crew}/${file}: no id/geometry`);
      continue;
    }
    const crewKey = crew === 'west' ? 'west' : 'east';
    const regionKey =
      (regionFcs.west.features.some((f) => f.properties.id === id) && 'west') ||
      (regionFcs.east.features.some((f) => f.properties.id === id) && 'east') ||
      null;
    if (!regionKey) {
      // canonical-only water — applied directly against canonical
      const idx = canonicalFc.features.findIndex((f) => f.properties.id === id);
      if (idx === -1) {
        // NEW water: append a contract-shaped feature. The artifact must
        // carry name/waterbodyType/regionId in properties for a new water.
        if (!CHECK) {
          if (!artifact.properties.name || !artifact.properties.waterbodyType) {
            skipped.push(`canonical/${id}: new water missing name/waterbodyType`);
            continue;
          }
          canonicalFc.push({
            type: 'Feature',
            geometry: artifact.geometry,
            properties: {
              crs: 'EPSG:4326',
              coordinateOrder: 'longitude,latitude',
              ...artifact.properties,
            },
          });
        }
        appliedCanonical += 1;
        continue;
      }
      if (!CHECK) canonicalFc.features[idx] = mergedFeature(canonicalFc.features[idx], artifact);
      appliedCanonical += 1;
      continue;
    }
    const target = REGIONS[regionKey];
    const idx = regionFcs[regionKey].features.findIndex((f) => f.properties.id === id);
    if (!CHECK) {
      const merged = mergedFeature(regionFcs[regionKey].features[idx], artifact);
      // a stale labelAnchor from the old geometry fails the anchor gate —
      // recompute from the rebuilt chain when it drifted off
      if (merged.properties.labelAnchor && !anchorOnGeometry(merged.properties.labelAnchor, merged.geometry)) {
        const next = midpointAnchor(merged.geometry);
        if (next) merged.properties.labelAnchor = next;
        else delete merged.properties.labelAnchor;
      }
      regionFcs[regionKey].features[idx] = merged;
      dirty[regionKey] = true;
      const topo = load(target.topo);
      const ridx = topo.records.findIndex((r) => r.featureId === id);
      const headRecord = headTopo[crewKey]?.records?.find?.((r) => r.featureId === id) ?? null;
      if (ridx !== -1) topo.records[ridx] = refreshRecord(topo.records[ridx], artifact, headRecord, merged.properties);
      else
        topo.records.push(
          refreshRecord({ featureId: id, upstreamFeatureIds: [], downstreamFeatureIds: [] }, artifact, headRecord, merged.properties),
        );
      writeFileSync(target.topo, JSON.stringify(topo));
    }
    appliedRegion += 1;
  }
}
for (const [k, isDirty] of Object.entries(dirty)) {
  if (isDirty && !CHECK) writeFileSync(REGIONS[k].geo, JSON.stringify(regionFcs[k]));
}
if (!CHECK) writeFileSync(CANONICAL, JSON.stringify(canonicalFc));

console.log(`[trace-apply] region artifacts updated: ${appliedRegion}, canonical-only updated: ${appliedCanonical}`);
if (skipped.length) console.log('[trace-apply] skipped:\n  ' + skipped.join('\n  '));
if (CHECK) console.log('[trace-apply] --check mode: no files written');
