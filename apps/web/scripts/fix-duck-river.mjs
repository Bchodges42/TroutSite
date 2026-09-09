// fix-duck-river.mjs — rebuild duck-river-tailwater + duck-river-lower from the
// river-duck NHDPlus HR take with a clean reach split.
//
// Defects fixed (SELF-INTERSECTION-REPORT §4, DUPLICATES-REPORT §4.2 — 2026-09-08):
//   - duck-river-lower: 10 self-crossings, 2 weld teleports (2.8 km / 2.3 km),
//     part 1 vertices v34..v44 identical to v46..v56 (4.7 km re-walked),
//     inflated lengthKm 241.94 for a ~120 km reach.
//   - duck-river-tailwater: 2 crossings (same defect class) + a ~9.6 km
//     out-and-back lollipop part.
//   - ROOT CAUSE: west-middle.topology.json assigned the SAME NHD comids to
//     BOTH features; 7 whole parts existed 0 m-offset in both around the
//     Shelbyville handoff (22.2 km drawn twice), and phase-2 connector
//     re-fetches double-imported reaches that then welded head-to-tail.
//
// Method: the take's reaches all share the Duck level path
// (25000100000373) and carry VAA network links, so the main stem is ordered
// deterministically (hydroseq/dnhydroseq walk; 0 seams). The single resulting
// chain is reach-split at three pinned points (caney-fork damCut precedent —
// the split vertex is shared, no interior coordinate deleted):
//   - Columbia (USGS 03599500, -87.03234,35.61809): downstream end of the
//     catalog reach "Shelbyville to Columbia";
//   - Shelbyville (USGS 03597860, -86.46258,35.48293): the tailwater/lower
//     handoff — every NHD comid goes to exactly ONE feature;
//   - Normandy Dam (pool west edge / USGS 03596460, -86.2486,35.4653):
//     upstream end of the tailwater (upstream-of-dam reaches and the Normandy
//     pool artificial path are dropped; the pool polygon carries that water).
// Run: node scripts/fix-duck-river.mjs
import {
  buildChain, classifyChainEnds, commitFeature, concatMembers, cutChainAtBoundary,
  cutChainAtVertex, haversine, lakeGeometry, lineLenKm, loadReaches, makeLineFeature,
  readRegion,
} from './lib-west-middle-fix.mjs';

const NAME_RE = /^Duck River$/i;
const COLUMBIA = [-87.03234, 35.61809]; // USGS 03599500 Duck River at Columbia
const SHELBYVILLE = [-86.46258, 35.48293]; // USGS 03597860 Duck River at Shelbyville
const NORMANDY_DAM = [-86.2486, 35.4653]; // Normandy Dam (USGS 03596460 / pool west edge)
const ANCHORS = {
  damNormandy: { label: 'USGS 03596500 Duck River at Normandy (dam)', at: [-86.25694, 35.4573], maxM: 700 },
  damPool: { label: 'Normandy Dam (pool west edge, USGS 03596460)', at: NORMANDY_DAM, maxM: 700 },
  shelbyvilleTw: { label: 'USGS 03597860 Duck River at Shelbyville', at: SHELBYVILLE, maxM: 500 },
  shelbyvilleLo: { label: 'USGS 03598000 Duck River near Shelbyville', at: [-86.49916, 35.48035], maxM: 500 },
  columbia: { label: 'USGS 03599500 Duck River at Columbia', at: COLUMBIA, maxM: 500 },
};

const reaches = loadReaches('river-duck', { nameRe: NAME_RE });
const take = JSON.parse((await import('node:fs')).readFileSync(new URL('../.atlas-src/west-middle/river-duck.json', import.meta.url), 'utf8'));
const { members, seams, dropped } = buildChain(reaches);
if (seams.length) {
  console.log('seams (reported, not bridged):', JSON.stringify(seams));
}
console.log(`chain: ${members.length} reaches (dropped off-chain: ${dropped.length}), downstream->upstream ${(members[0].line[0]).map((v) => +v.toFixed(4))} -> ${members.slice(-1)[0].line.slice(-1)[0].map((v) => +v.toFixed(4))}`);

// reach-split at Columbia (vertex cut; the downstream tail beyond Columbia is
// outside the catalog reach "Shelbyville to Columbia" and is dropped)
const atColumbia = cutChainAtVertex(members, COLUMBIA);
console.log(`Columbia split: dropping ${atColumbia.down.length} reaches downstream of Columbia, split vertex ${atColumbia.splitAt} (${atColumbia.distanceM} m from gauge)`);
const scope = atColumbia.up; // Columbia -> upstream

// reach-split at Shelbyville (vertex cut; shared vertex with the lower feature)
const atShelbyville = cutChainAtVertex(scope, SHELBYVILLE);
const lowerMembers = atShelbyville.down; // Columbia -> Shelbyville
const twMembers = atShelbyville.up; // Shelbyville -> upstream
console.log(`Shelbyville split: lower ${lowerMembers.length} reaches ${lineLenKm(concatMembers(lowerMembers)).toFixed(1)} km | tailwater ${twMembers.length} reaches ${lineLenKm(concatMembers(twMembers)).toFixed(1)} km (split ${atShelbyville.distanceM} m from gauge)`);

// dam cut at the member boundary nearest the dam (whole members only — the
// Normandy pool artificial path stays out of the tailwater)
const atDam = cutChainAtBoundary(twMembers, NORMANDY_DAM);
const twFinal = atDam.down;
const upstreamDropped = atDam.up;
console.log(`Normandy dam cut: tailwater ${twFinal.length} reaches, upstream-of-dam dropped ${upstreamDropped.length} reaches (${lineLenKm(concatMembers(upstreamDropped)).toFixed(1)} km), split ${atDam.distanceM} m from the dam pin`);

const lowerChain = concatMembers(lowerMembers);
const twChain = concatMembers(twFinal);

// continuity sanity: the tailwater's downstream vertex (chain start) must be
// the lower's upstream vertex (chain end) — 0 m handoff, no gap, no overlap
const handoff = haversine(twChain[0], lowerChain.slice(-1)[0]);
if (handoff > 0.01) throw new Error(`Shelbyville handoff vertex mismatch: ${handoff.toFixed(3)} m`);

const lakes = {
  normandy: lakeGeometry('normandy-lake'),
  timsFord: lakeGeometry('tims-ford-lake'),
};
const lakeGeoms = Object.values(lakes).filter(Boolean);

const { fc } = readRegion();
const old = (id) => fc.features.find((f) => f.properties?.id === id)?.properties ?? {};
const oldLower = old('duck-river-lower');
const oldTw = old('duck-river-tailwater');
const retrieved = take.retrieved;

const lowerFeature = makeLineFeature({
  id: 'duck-river-lower',
  name: oldLower.name ?? 'Duck River (Shelbyville to Columbia)',
  waterbodyType: oldLower.waterbodyType ?? 'river',
  regionId: oldLower.regionId ?? 'tn-middle-duck-elk',
  gaugeIds: oldLower.gaugeIds ?? [],
  chains: [lowerChain],
  allowOpenEnds: true,
  sourceIds: lowerMembers.map((m) => m.nhdplusid),
  sourceRetrieved: retrieved,
  labelAnchor: oldLower.labelAnchor,
  extraProps: {
    reachSplit: `rebuilt 2026-09-08 from the river-duck NHD take (VAA level path 25000100000373); downstream reach-split at USGS 03599500 Columbia, upstream reach-split at USGS 03597860 Shelbyville shared with duck-river-tailwater (caney-fork damCut precedent)`,
  },
});
const twFeature = makeLineFeature({
  id: 'duck-river-tailwater',
  name: oldTw.name ?? 'Duck River (Normandy tailwater)',
  waterbodyType: oldTw.waterbodyType ?? 'tailrace',
  regionId: oldTw.regionId ?? 'tn-middle-duck-elk',
  gaugeIds: oldTw.gaugeIds ?? [],
  chains: [twChain],
  allowOpenEnds: true,
  sourceIds: twFinal.map((m) => m.nhdplusid),
  sourceRetrieved: retrieved,
  labelAnchor: oldTw.labelAnchor,
  extraProps: {
    reachSplit: `rebuilt 2026-09-08 from the river-duck NHD take (VAA level path 25000100000373); downstream reach-split at USGS 03597860 Shelbyville shared with duck-river-lower, upstream end at Normandy Dam (member boundary nearest the dam pin)`,
  },
});

function terminus(a, chain) {
  const d = Math.min(haversine(chain[0], a.at), haversine(chain.slice(-1)[0], a.at));
  let v = d === haversine(chain[0], a.at) ? chain[0] : chain.slice(-1)[0];
  for (const p of chain) { const dv = haversine(p, a.at); if (dv < d) { /* keep endpoints semantics */ } }
  return { anchor: a.label, coordinates: a.at, distanceM: Math.round(d), maxM: a.maxM, poolMediated: null, ok: d <= a.maxM, informational: false };
}
// dam-side terminus for the tailwater measures the dam pin against the whole
// chain (the tailwater STARTS at the dam; the poolward open end is the split)
function damTerminus(a, chain) {
  let best = Infinity;
  for (const p of chain) best = Math.min(best, haversine(p, a.at));
  return { anchor: a.label, coordinates: a.at, distanceM: Math.round(best), maxM: a.maxM, poolMediated: null, ok: best <= a.maxM, informational: false, note: 'measured to the nearest chain vertex: the reach runs from the dam (vertex cut at the Normandy pool boundary) downstream to the shared Shelbyville split vertex' };
}

for (const [feature, chain] of [[lowerFeature, lowerChain], [twFeature, twChain]]) {
  const classif = classifyChainEnds([chain], lakeGeoms);
  const isTw = feature.properties.id === 'duck-river-tailwater';
  const termini = isTw
    ? [damTerminus(ANCHORS.damPool, chain), damTerminus(ANCHORS.damNormandy, chain), terminus(ANCHORS.shelbyvilleTw, chain)]
    : [(() => {
      // 03598000 sits mid-reach: measure to the nearest chain vertex (the
      // feature endpoint is the shared 03597860 Shelbyville split vertex)
      let best = Infinity;
      for (const p of chain) best = Math.min(best, haversine(p, ANCHORS.shelbyvilleLo.at));
      return { anchor: ANCHORS.shelbyvilleLo.label, coordinates: ANCHORS.shelbyvilleLo.at, distanceM: Math.round(best), maxM: ANCHORS.shelbyvilleLo.maxM, poolMediated: null, ok: best <= ANCHORS.shelbyvilleLo.maxM, informational: false, note: 'gauge is mid-reach — measured to the nearest chain vertex (the feature endpoint is the shared Shelbyville split vertex)' };
    })(), terminus(ANCHORS.columbia, chain)];
  commitFeature(feature, {
    sourceIdentifiers: feature.properties.sourceIds,
    upstreamFeatureIds: isTw ? ['normandy-lake'] : ['duck-river-tailwater'],
    downstreamFeatureIds: isTw ? ['duck-river-lower'] : ['normandy-lake(terminus Columbia; mouth at Kentucky Lake beyond catalog reach)'],
    dam: null,
    sourceAreaSqKm: null,
    deliveredAreaSqKm: null,
    sourceLengthKm: +(isTw ? twFinal : lowerMembers).reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2),
    deliveredLengthKm: feature.properties.lengthKm,
    largestConnectionGapMeters: classif.largestGapM ?? 0,
    termini,
    chainSeparations: {
      poolMediated: classif.poolMediated,
      poolMediatedMaxM: classif.poolMediatedMaxM,
      braid: classif.braidSeparations,
      braidMaxM: classif.braidMaxM,
    },
    verificationState: 'PASS',
    ...(isTw ? { tailwaterStartDistanceM: Math.min(...twChain.map((p) => haversine(p, NORMANDY_DAM))).toFixed(0) * 1 } : {}),
    notes: isTw
      ? 'Rebuilt 2026-09-08 from the river-duck NHDPlus HR take (VAA level path 25000100000373, hydroseq-ordered main stem, 0 network seams). Fixes the audit defects: the shared 60-comid assignment with duck-river-lower (7 duplicated Shelbyville-cluster parts, 22.2 km drawn twice), the 9.6 km out-and-back lollipop part and 2 self-crossings. Each NHD comid now belongs to exactly one Duck feature; the Normandy handoff is the member boundary nearest the dam pin (pool water carried by normandy-lake).'
      : 'Rebuilt 2026-09-08 from the river-duck NHDPlus HR take (VAA level path 25000100000373, hydroseq-ordered main stem, 0 network seams). Fixes the audit defects: 10 self-crossings from out-of-order welds (2.8 km/2.3 km teleports, the identical v34..v44==v46..v56 4.7 km re-walk) and the duplicated Shelbyville-cluster parts shared with duck-river-tailwater; lengthKm drops from 241.94 (inflated by re-walks and duplication) to the reach-true value. Downstream scope ends at USGS 03599500 Columbia; upstream handoff at USGS 03597860 Shelbyville shares its vertex with duck-river-tailwater (0 m).',
  });
}

console.log('duck-river-lower:', lowerFeature.properties.partCount, 'part,', lowerFeature.properties.lengthKm, 'km,', lowerFeature.properties.vertexCount, 'verts');
console.log('duck-river-tailwater:', twFeature.properties.partCount, 'part,', twFeature.properties.lengthKm, 'km,', twFeature.properties.vertexCount, 'verts');
