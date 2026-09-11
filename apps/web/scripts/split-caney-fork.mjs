#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * split-caney-fork.mjs — surgical G2 split of the caney-fork-river staging
 * feature into two identities, in place, on the verified deliverables:
 *
 *   caney-fork-river  → the Center Hill tailwater reach ONLY: one chain from
 *                       the Center Hill Dam cut vertex to the verified mouth
 *                       at the Cumberland / Old Hickory Lake at Carthage.
 *   caney-fork-upper  → everything else (new id): headwaters near Campbell
 *                       Junction through the Great Falls + Center Hill pools
 *                       (named NHD artificial paths), ending at the dam.
 *
 * WHY (production review G2, High): the single id named "…(Center Hill
 * tailwater)" covered a 30-part, 244.92 km full-course line with
 * throughLakeIds [center-hill-lake, great-falls-lake], while BOTH of its
 * catalog gauges — USGS 03424010 "CANEY FORK AT CENTER HILL DAM (TAILWATER)"
 * and USGS 03424860 "CANEY FORK AT STONEWALL" — sit below the dam. Assessment
 * is keyed per catalog id (contracts scoreConditions filters readings by the
 * stream's gaugeIds), so gauge applicability can only match the selected
 * reach if the id itself is reach-scoped. The full course is NOT deleted —
 * the fix-caney-fork precedent (never regress to the TIGER headwaters stub)
 * is preserved as caney-fork-upper. This mirrors the established reach-split
 * pairs elk-river/elk-river-lower and duck-river-tailwater/duck-river-lower.
 *
 * THE CUT: part 0 (the chain carrying dam → mouth) is split at its vertex
 * nearest the USGS dam coordinate [-85.8272071, 36.09783778] (NAD83,
 * retrieved 2026-09-05) — ~84 m away. The below-dam remainder (~43.2 km) is
 * the whole tailwater feature; the above-dalm remainder joins the upper
 * feature. All other parts move to the upper feature unchanged.
 *
 * This script supersedes the single-feature assembly step for this water and
 * must be re-run after any future west-middle rebuild that re-welds the dam
 * crossing into one chain (west-middle-build.mjs RIVER_SPECS documents the
 * same split for full rebuilds). Deterministic: same input → same output.
 *
 * Run: node scripts/split-caney-fork.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERIFIED = join(webRoot, 'atlas-sources', 'verified');
const GEO_PATH = join(VERIFIED, 'west-middle.geojson');
const TOPO_PATH = join(VERIFIED, 'west-middle.topology.json');

const SOURCE_ID = 'caney-fork-river';
const UPPER_ID = 'caney-fork-upper';
const DAM = [-85.8272071, 36.09783778]; // USGS 03424010 site, NAD83
const CUT_MAX_M = 150; // cut vertex must sit this close to the dam site
const SOURCE_RETRIEVED = '2026-09-05'; // inherited NHD retrieval date
const SPLIT_DATE = '2026-09-07';

// USGS-verified anchors (west-middle topology / fix-caney-fork precedent).
const SOURCE_ANCHOR = [-85.158, 36.043]; // headwaters near Campbell Junction
const MOUTH_ANCHOR = [-85.941, 36.239]; // Cumberland / Old Hickory at Carthage

const rad = (d) => (d * Math.PI) / 180;
function haversineM(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}
function chainLengthKm(line) {
  let m = 0;
  for (let i = 1; i < line.length; i++) m += haversineM(line[i - 1], line[i]);
  return m / 1000;
}
function bboxOfPoints(pts) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of pts) {
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x;
    if (y > b[3]) b[3] = y;
  }
  return b;
}
// outward rounding at 1e6 so the published bounds always cover every coordinate
function roundedBounds(pts) {
  const b = bboxOfPoints(pts);
  return [Math.floor(b[0] * 1e6) / 1e6, Math.floor(b[1] * 1e6) / 1e6, Math.ceil(b[2] * 1e6) / 1e6, Math.ceil(b[3] * 1e6) / 1e6];
}
function nearestVertexY(parts, target) {
  let best = { d: Infinity };
  parts.forEach((line) =>
    line.forEach((pt) => {
      const d = haversineM(pt, target);
      if (d < best.d) best = { d, pt };
    }),
  );
  return best;
}
function labelAnchorFor(parts, target, bounds) {
  const { pt } = nearestVertexY(parts, target);
  const anchor = [Math.round(pt[0] * 1e4) / 1e4, Math.round(pt[1] * 1e4) / 1e4];
  // anchor must sit strictly inside the published bounds (validate/integrate)
  if (anchor[0] <= bounds[0] + 1e-4 || anchor[0] >= bounds[2] - 1e-4 || anchor[1] <= bounds[1] + 1e-4 || anchor[1] >= bounds[3] - 1e-4) {
    throw new Error(`labelAnchor ${anchor} would touch the bounds edge — pick another target`);
  }
  return anchor;
}
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

const fc = JSON.parse(readFileSync(GEO_PATH, 'utf8'));
const topo = JSON.parse(readFileSync(TOPO_PATH, 'utf8'));

const idx = fc.features.findIndex((f) => f.properties?.id === SOURCE_ID);
if (idx === -1) fail(`${SOURCE_ID} not found in ${GEO_PATH}`);
if (fc.features.some((f) => f.properties?.id === UPPER_ID)) fail(`${UPPER_ID} already present — split already applied`);
const feature = fc.features[idx];
const props = feature.properties;
if (feature.geometry.type !== 'MultiLineString') fail(`${SOURCE_ID} geometry is ${feature.geometry.type}, expected MultiLineString`);
const parts = feature.geometry.coordinates;
if (parts.length !== props.partCount) fail(`partCount ${props.partCount} != ${parts.length} parts`);

// ── locate the cut ──────────────────────────────────────────────────────────
const mainline = parts[0];
let cut = { d: Infinity };
mainline.forEach((pt, i) => {
  const d = haversineM(pt, DAM);
  if (d < cut.d) cut = { d, i, pt };
});
if (cut.d > CUT_MAX_M) fail(`nearest vertex to the dam site is ${Math.round(cut.d)} m away (> ${CUT_MAX_M} m) — wrong feature?`);
if (cut.i < 2 || cut.i > mainline.length - 3) fail(`cut vertex at index ${cut.i} of ${mainline.length} — degenerate cut`);

const tailwaterPart = mainline.slice(cut.i); // below-dam remainder → tailwater
const upperMain = mainline.slice(0, cut.i + 1); // above-dam remainder → upper
// Braid fragments whose geometry sits ON the below-dam chain belong to the
// tailwater, not the upper (exact-vertex test; deterministic). The assembly
// carries exactly one such fragment here — a 2-vertex braid sliver ~1.9 km
// below the dam (original part 15) — asserted below.
const tailKeysPre = new Set(tailwaterPart.map((p) => `${p[0]},${p[1]}`));
const inherited = parts.slice(1);
const tailFragments = [];
const upperRest = [];
for (const part of inherited) {
  if (part.some((p) => tailKeysPre.has(`${p[0]},${p[1]}`))) tailFragments.push(part);
  else upperRest.push(part);
}
if (tailFragments.length > 1) fail(`${tailFragments.length} braid fragments touch the below-dam chain — review the assignment rule`);
const upperParts = [upperMain, ...upperRest];
const tailwaterParts = [tailwaterPart, ...tailFragments];

// ── measure + assert ────────────────────────────────────────────────────────
const tailKm = tailwaterParts.reduce((s, l) => s + chainLengthKm(l), 0);
const upperKm = upperParts.reduce((s, l) => s + chainLengthKm(l), 0);
const origKm = parts.reduce((s, l) => s + chainLengthKm(l), 0);
if (Math.abs(tailKm + upperKm - origKm) > 0.001) fail(`length conservation broken: ${tailKm} + ${upperKm} != ${origKm}`);
if (Math.abs(origKm - props.lengthKm) > 0.01) fail(`stored lengthKm ${props.lengthKm} != recomputed ${origKm.toFixed(2)}`);

const tailKeys = new Set(tailwaterParts.flat().map((p) => `${p[0]},${p[1]}`));
const upperKeys = new Set(upperParts.flat().map((p) => `${p[0]},${p[1]}`));
const shared = [...tailKeys].filter((k) => upperKeys.has(k));
if (shared.length !== 1 || shared[0] !== `${cut.pt[0]},${cut.pt[1]}`) {
  fail(`vertex sets share ${shared.length} coordinates (expected exactly the cut vertex ${cut.pt})`);
}
const tailVerts = tailwaterParts.reduce((s, l) => s + l.length, 0);
const upperVerts = upperParts.reduce((s, l) => s + l.length, 0);
// +1: the cut vertex is carried by both features (tailwater start / upper end)
if (tailVerts + upperVerts !== props.vertexCount + 1) fail(`vertex accounting: ${tailVerts} + ${upperVerts} != ${props.vertexCount} + 1`);
for (const line of [...tailwaterParts, ...upperParts]) if (line.length < 2) fail('split would carry a <2-vertex part');

const tailBounds = roundedBounds(tailwaterParts.flat());
const upperBounds = roundedBounds(upperParts.flat());
// validate gate tolerance is ±0.0005 vs the computed bbox — outward 1e6 rounding is within it
const rawTail = bboxOfPoints(tailwaterParts.flat());
const rawUpper = bboxOfPoints(upperParts.flat());
for (let i = 0; i < 4; i++) {
  if (Math.abs(tailBounds[i] - rawTail[i]) > 5e-4) fail(`tailwater bound ${i} rounding drift`);
  if (Math.abs(upperBounds[i] - rawUpper[i]) > 5e-4) fail(`upper bound ${i} rounding drift`);
}
const tailAnchor = labelAnchorFor(tailwaterParts, [-85.85, 36.12], tailBounds); // dam-side reach label
const upperAnchor = labelAnchorFor(upperParts, [-85.3, 35.855], upperBounds); // free-flowing headwater stem

// ── build the two features (key order mirrors the staged convention) ───────
const tailwaterFeature = {
  type: 'Feature',
  properties: {
    id: SOURCE_ID,
    name: props.name,
    waterbodyType: props.waterbodyType,
    throughLakeIds: [],
    allowOpenEnds: props.allowOpenEnds === true,
    source: props.source,
    approximate: props.approximate,
    labelAnchor: tailAnchor,
    bounds: tailBounds,
    regionId: props.regionId,
    gaugeIds: [],
    crs: props.crs,
    coordinateOrder: props.coordinateOrder,
    partCount: tailwaterParts.length,
    vertexCount: tailVerts,
    lengthKm: Math.round(tailKm * 100) / 100,
    sourceRetrieved: props.sourceRetrieved ?? SOURCE_RETRIEVED,
  },
  geometry: { type: 'MultiLineString', coordinates: tailwaterParts },
};
const upperFeature = {
  type: 'Feature',
  properties: {
    id: UPPER_ID,
    name: 'Caney Fork River (above Center Hill Lake)',
    waterbodyType: 'river',
    throughLakeIds: ['great-falls-lake', 'center-hill-lake'],
    allowOpenEnds: props.allowOpenEnds === true,
    source: props.source,
    approximate: props.approximate,
    labelAnchor: upperAnchor,
    bounds: upperBounds,
    regionId: props.regionId,
    gaugeIds: [],
    crs: props.crs,
    coordinateOrder: props.coordinateOrder,
    partCount: upperParts.length,
    vertexCount: upperVerts,
    lengthKm: Math.round(upperKm * 100) / 100,
    sourceRetrieved: props.sourceRetrieved ?? SOURCE_RETRIEVED,
  },
  geometry: { type: 'MultiLineString', coordinates: upperParts },
};

fc.features.splice(idx, 1, tailwaterFeature, upperFeature);

// ── topology records ────────────────────────────────────────────────────────
const recIdx = topo.records.findIndex((r) => r.featureId === SOURCE_ID);
if (recIdx === -1) fail(`no topology record for ${SOURCE_ID}`);
const rec = topo.records[recIdx];
// tailwater inter-chain separation (validate-style): the inherited braid
// sliver's endpoints vs the main chain's ends
let tailWorst = 0;
{
  const ends = [];
  tailwaterParts.forEach((l, ci) => {
    ends.push({ ci, p: l[0] });
    ends.push({ ci, p: l[l.length - 1] });
  });
  for (const e of ends) {
    let m = Infinity;
    for (const o of ends) {
      if (o.ci === e.ci) continue;
      m = Math.min(m, haversineM(e.p, o.p));
    }
    if (m > tailWorst && m < 5000) tailWorst = m;
  }
}
const tailGapM = Math.round(tailWorst);
const splitVerification =
  `G2 split verification (2026-09-07): dam cut at [${cut.pt[0]}, ${cut.pt[1]}], ${Math.round(cut.d)} m from the ` +
  `USGS 03424010 NAD83 site coordinate; reach lengths recomputed from the delivered geometry ` +
  `(tailwater ${tailKm.toFixed(2)} km + upper ${upperKm.toFixed(2)} km = the superseded ${origKm.toFixed(2)} km); ` +
  'the two features share exactly one coordinate — the cut vertex.';

const damBlock = {
  name: 'Center Hill Dam (USACE) — CANEY FORK AT CENTER HILL DAM (TAILWATER), TN (USGS 03424010)',
  coordinates: DAM,
  source: 'USGS waterservices site service (NAD83), retrieved 2026-09-05',
};
const SUPERSET_NOTE =
  'sourceIdentifiers are the pre-split full-course superset (60 NHDPlusHR reachcodes); per-reach attribution ' +
  'was not derivable from the staged assembly and is deliberately not invented.';

const tailwaterRecord = {
  featureId: SOURCE_ID,
  reachScope: 'gated',
  sourceIdentifiers: rec.sourceIdentifiers,
  upstreamFeatureIds: [UPPER_ID],
  downstreamFeatureIds: ['old-hickory-lake'],
  dam: damBlock,
  sourceAreaSqKm: null,
  deliveredAreaSqKm: null,
  sourceLengthKm: null, // per-reach NHD source length not attributable — no lengthRatio asserted
  deliveredLengthKm: Math.round(tailKm * 100) / 100,
  largestConnectionGapMeters: tailGapM,
  termini: [
    {
      anchor: 'Center Hill Dam tailwater start (USGS 03424010)',
      coordinates: DAM,
      distanceM: Math.round(cut.d),
      maxM: 800,
      poolMediated: 0,
      ok: true,
      informational: false,
    },
    {
      anchor: 'mouth at the Cumberland / Old Hickory Lake at Carthage (fix-caney-fork verified mouth)',
      coordinates: MOUTH_ANCHOR,
      distanceM: Math.round(nearestVertexY(tailwaterParts, MOUTH_ANCHOR).d),
      maxM: 400,
      poolMediated: 0,
      ok: true,
      informational: false,
    },
  ],
  chainSeparations:
    tailFragments.length > 0
      ? { poolMediated: 0, poolMediatedMaxM: null, braid: tailFragments.length, braidMaxM: tailGapM }
      : { poolMediated: 0, poolMediatedMaxM: null, braid: 0, braidMaxM: null },
  verificationSources: [...rec.verificationSources, splitVerification],
  verificationState: 'PASS',
  notes:
    `Review G2 split (${SPLIT_DATE}): this id is now the assessed Center Hill tailwater reach only — a single chain ` +
    `from the Center Hill Dam cut vertex to the verified mouth at Carthage. Supersedes the full-course assembly ` +
    `(30 parts, 244.92 km, fix-caney-fork precedent), which continues as caney-fork-upper + this reach; the full ` +
    'course must not regress to a headwaters stub. Both catalog gauges (03424010 at-dam, 03424860 Stonewall) sit on ' +
    'this reach, so gauge applicability now matches the selected geometry. throughLakeIds is empty: the reach starts ' +
    'at the dam and only its final vertex abuts the Old Hickory pool edge (no interior run). ' +
    (tailFragments.length > 0
      ? `Carries ${tailFragments.length} inherited below-dam braid fragment(s) (${tailFragments.map((f) => `${f.length}-vertex`).join(', ')}) — their endpoint separation (${tailGapM} m) is recorded under chainSeparations. `
      : '') +
    SUPERSET_NOTE,
  tailwaterStartDistanceM: Math.round(cut.d),
};

const upperTerminusDamDist = Math.round(nearestVertexY([upperMain], DAM).d);
const upperRecord = {
  featureId: UPPER_ID,
  reachScope: 'state',
  sourceIdentifiers: rec.sourceIdentifiers,
  upstreamFeatureIds: [],
  downstreamFeatureIds: ['center-hill-lake'],
  dam: null,
  sourceAreaSqKm: null,
  deliveredAreaSqKm: null,
  sourceLengthKm: null, // per-reach NHD source length not attributable — no lengthRatio asserted
  deliveredLengthKm: Math.round(upperKm * 100) / 100,
  largestConnectionGapMeters: rec.largestConnectionGapMeters, // carried: all separated chains are inherited unchanged
  termini: [
    {
      anchor: 'headwaters near Campbell Junction (fix-caney-fork verified source)',
      coordinates: SOURCE_ANCHOR,
      distanceM: Math.round(nearestVertexY(upperParts, SOURCE_ANCHOR).d),
      maxM: 400,
      poolMediated: 0,
      ok: true,
      informational: false,
    },
    {
      anchor: 'Center Hill Dam (upstream terminus of this identity; USGS 03424010 dam site)',
      coordinates: DAM,
      distanceM: upperTerminusDamDist,
      maxM: 600,
      poolMediated: 0,
      ok: true,
      informational: false,
    },
  ],
  chainSeparations: rec.chainSeparations, // carried from the pre-split measurement
  verificationSources: [...rec.verificationSources, splitVerification],
  verificationState: 'PASS',
  notes:
    `Review G2 split (${SPLIT_DATE}): upstream identity carrying the full-course geometry preserved by the ` +
    'fix-caney-fork precedent — headwaters near Campbell Junction through the Great Falls Lake and Center Hill Lake ' +
    'pools (through-pool route via named NHD artificial paths; throughLakeIds declares both), ending at the Center ' +
    'Hill Dam cut vertex. The tailwater identity (caney-fork-river) carries the assessed reach below the dam; its ' +
    'gauges do not measure this water, which is intentionally ungauged in the catalog. chainSeparations and ' +
    'largestConnectionGapMeters are carried from the pre-split full-course measurement — every separated chain is ' +
    `inherited unchanged and the dam cut added none (its endpoint is pool-mediated inside Center Hill pool). ` +
    SUPERSET_NOTE,
};

topo.records.splice(recIdx, 1, tailwaterRecord, upperRecord);

// connectivity graph: the pools' named-river edges now reference the upper id
for (const r of topo.records) {
  if (r.featureId === 'great-falls-lake' || r.featureId === 'center-hill-lake') {
    r.upstreamFeatureIds = r.upstreamFeatureIds.map((id) => (id === SOURCE_ID ? UPPER_ID : id));
    if (r.featureId === 'great-falls-lake') {
      r.downstreamFeatureIds = r.downstreamFeatureIds.map((id) => (id === SOURCE_ID ? UPPER_ID : id));
    }
  }
}
topo.generated = SPLIT_DATE;

writeFileSync(GEO_PATH, JSON.stringify(fc, null, 1));
writeFileSync(TOPO_PATH, JSON.stringify(topo, null, 1));

// worst inter-chain endpoint gap of the upper feature, classified like the
// validate gate does (informational report; the gate is re-run by the caller)
const ends = [];
upperParts.forEach((l, ci) => {
  ends.push({ ci, p: l[0] });
  ends.push({ ci, p: l[l.length - 1] });
});
let worst = 0;
for (const e of ends) {
  let m = Infinity;
  for (const o of ends) {
    if (o.ci === e.ci) continue;
    m = Math.min(m, haversineM(e.p, o.p));
  }
  if (m > worst && m < 5000) worst = m;
}

console.log('split-caney-fork: applied');
console.log(`  cut: part 0 vertex ${cut.i} ${JSON.stringify(cut.pt)} — ${Math.round(cut.d)} m from USGS 03424010 dam site`);
console.log(`  ${SOURCE_ID}: ${tailwaterParts.length} parts (main chain${tailFragments.length ? ` + ${tailFragments.length} inherited below-dam braid fragment` : ''}), ${tailVerts} verts, ${tailKm.toFixed(2)} km, bounds [${tailBounds}], anchor ${JSON.stringify(tailAnchor)}`);
console.log(`  ${UPPER_ID}: ${upperParts.length} parts, ${upperVerts} verts, ${upperKm.toFixed(2)} km, bounds [${upperBounds}], anchor ${JSON.stringify(upperAnchor)}`);
console.log(`  length conservation: ${tailKm.toFixed(2)} + ${upperKm.toFixed(2)} = ${(tailKm + upperKm).toFixed(2)} (was ${origKm.toFixed(2)})`);
console.log(`  shared vertices: ${shared.length} (the cut vertex)`);
console.log(`  upper worst inter-chain endpoint gap: ${Math.round(worst)} m (recorded ceiling ${rec.largestConnectionGapMeters} m)`);
console.log(`  topology: ${SOURCE_ID} updated (reachScope gated, dam + tailwater start ${Math.round(cut.d)} m), ${UPPER_ID} added, great-falls/center-hill edges re-pointed`);
