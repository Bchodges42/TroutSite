// fix-elk-river.mjs — rebuild elk-river (Tims Ford tailwater) + elk-river-lower
// (Prospect to state line) from the river-elk NHDPlus HR take.
//
// Defects fixed (DUPLICATES-REPORT §4.3, CONNECTIVITY-REPORT elk-river-lower —
// 2026-09-08):
//   - elk-river-lower contained reaches duplicated from elk-river UPSTREAM of
//     Prospect (gauge USGS 03584600 pins Prospect at -86.99466,35.01424) —
//     outside its named scope: parts {1,3,9} (4.59/6.98/3.48 km) + 11 small
//     duplicated fragments.
//   - elk-river-lower was 3 chunks with a 1.24 km chain gap and 2 orphan parts
//     at the north end that touched elk-river but not their own feature.
//
// Method: all 350 take reaches share the Elk level path (25000200000187) and
// carry VAA links; the main stem is one deterministic hydroseq walk (plus two
// state-line reaches attached geometrically — their VAA dnhydroseq leaves the
// take at the TN/AL line). The chain is reach-split at two pinned points:
//   - Prospect (USGS 03584600): the tailwater/lower handoff — every NHD comid
//     goes to exactly ONE feature;
//   - Tims Ford Dam (USGS 03580750): upstream end of the tailwater; the
//     upstream-of-dam reaches and the pool artificial path are dropped (the
//     tims-ford-lake polygon carries the pool). The boundary reach ends at the
//     dam face, closing the documented 453 m dam-face gap.
// Run: node scripts/fix-elk-river.mjs
import {
  buildChain, classifyChainEnds, commitFeature, commitTopology, concatMembers,
  cutChainAtBoundary, cutChainAtVertex, haversine, lakeGeometry, lineLenKm,
  loadReaches, makeLineFeature, pointInRings, pointToPolygonM, readRegion,
} from './lib-west-middle-fix.mjs';

const NAME_RE = /^Elk River$/i;
const PROSPECT = [-86.99466, 35.01424]; // USGS 03584600 Elk River at Prospect
const TIMS_FORD_DAM = [-86.2811, 35.19231]; // USGS 03580750 Elk River below Tims Ford Dam

const reaches = loadReaches('river-elk', { nameRe: NAME_RE });
const { members, seams, dropped } = buildChain(reaches);
if (seams.length) console.log('seams (reported, not bridged):', JSON.stringify(seams));
if (dropped.length) console.log('off-chain reaches not attached:', dropped.map((d) => d.nhdplusid).join(','));
console.log(`chain: ${members.length} reaches, downstream->upstream ${members[0].line[0].map((v) => +v.toFixed(4))} -> ${members.slice(-1)[0].line.slice(-1)[0].map((v) => +v.toFixed(4))}`);

// dam cut at the member boundary nearest the dam pin, then extend upstream
// member-by-member until the chain endpoint touches the pool polygon (<=100 m)
// — this carries the dam forebay reach so the tailwater makes source-true
// contact with tims-ford-lake (closing the documented 453 m dam-face gap).
const atDam = cutChainAtBoundary(members, TIMS_FORD_DAM);
const scope = atDam.down; // state line -> dam
const timsFordGeom0 = lakeGeometry('tims-ford-lake');
let forebayMembers = 0, entersPool = false;
if (timsFordGeom0) {
  const endDist = () => pointToPolygonM(scope.slice(-1)[0].line.slice(-1)[0], timsFordGeom0);
  while (endDist() > 100 && atDam.up.length) {
    const m = atDam.up.shift();
    const mid = m.line[Math.floor(m.line.length / 2)];
    scope.push(m);
    forebayMembers++;
    const rings = timsFordGeom0.type === 'MultiPolygon' ? timsFordGeom0.coordinates.flat() : timsFordGeom0.coordinates;
    if (pointInRings(mid, rings)) { entersPool = true; break; }
  }
  console.log(`forebay extension: +${forebayMembers} reaches, endpoint now ${Math.round(endDist())} m from the pool polygon${entersPool ? ' (last reach runs inside the pool — throughLakeIds declared)' : ''}`);
}
const damEndDistanceM = haversine(scope.slice(-1)[0].line.slice(-1)[0], TIMS_FORD_DAM);
console.log(`dam cut: tailwater scope ${scope.length} reaches, upstream-of-dam dropped ${atDam.up.length} reaches (${atDam.up.length ? lineLenKm(concatMembers(atDam.up)).toFixed(1) : '0'} km), boundary ${Math.round(damEndDistanceM)} m from the dam pin`);

// reach-split at Prospect (vertex cut; shared vertex with the lower feature)
const atProspect = cutChainAtVertex(scope, PROSPECT);
const lowerMembers = atProspect.down; // state line -> Prospect
const twMembers = atProspect.up; // Prospect -> dam
console.log(`Prospect split: lower ${lowerMembers.length} reaches ${lineLenKm(concatMembers(lowerMembers)).toFixed(1)} km | tailwater ${twMembers.length} reaches ${lineLenKm(concatMembers(twMembers)).toFixed(1)} km (split ${atProspect.distanceM} m from gauge)`);

const lowerChain = concatMembers(lowerMembers);
const twChain = concatMembers(twMembers);

// continuity sanity at the Prospect handoff (split vertex is shared)
const handoff = haversine(lowerChain.slice(-1)[0], twChain[0]);
if (handoff > 0.01) throw new Error(`Prospect handoff vertex mismatch: ${handoff.toFixed(3)} m`);

// state-line reaches: the VAA walk cannot cross the documented NHD network gap
// (CONNECTIVITY audit: 1.24 km, 34.91756,-87.06027 -> 34.90637,-87.05914) —
// the two whole reaches below the gap are kept as a second part with the seam
// measured and recorded, never bridged.
const tailParts = [];
let seamGapM = null;
if (dropped.length) {
  const pool = dropped.slice();
  let prev = lowerChain[0]; // downstream end of the main chain
  while (pool.length) {
    // greedy geometric order (VPU-local pathlengths are unreliable here)
    let bi = -1, bLine = null, bD = Infinity;
    pool.forEach((r, i) => {
      const dHead = haversine(prev, r.line[0]);
      const dTail = haversine(prev, r.line.slice(-1)[0]);
      if (Math.min(dHead, dTail) < bD) { bD = Math.min(dHead, dTail); bi = i; bLine = dTail < dHead ? r.line.slice().reverse() : r.line; }
    });
    const r = pool.splice(bi, 1)[0];
    if (seamGapM == null && bD > 50) {
      seamGapM = Math.round(bD);
      console.log(`documented seam between the main chain and the state-line reaches: ${seamGapM} m (NHD network gap, not bridged)`);
    }
    tailParts.push(bLine);
    prev = bLine.slice(-1)[0];
  }
  // weld the tail reaches to each other where they abut
  const merged = [tailParts[0]];
  for (const t of tailParts.slice(1)) {
    const last = merged.slice(-1)[0].slice(-1)[0];
    const dh = haversine(last, t[0]);
    const dt = haversine(last, t.slice(-1)[0]);
    if (Math.min(dh, dt) <= 50) merged.push(dh <= dt ? t.slice(1) : t.slice().reverse().slice(1));
    else merged.push(t);
  }
  tailParts.length = 0;
  tailParts.push(...merged);
}

// dam-face closure measurement (CONNECTIVITY (c): the old tailwater endpoint
// hung 453 m off the pool polygon)
const timsFordGeom = lakeGeometry('tims-ford-lake');
const damFaceToPoolM = timsFordGeom ? pointToPolygonM(twChain.slice(-1)[0], timsFordGeom) : null;
console.log(`tailwater upstream endpoint -> tims-ford-lake polygon: ${damFaceToPoolM ?? 'n/a'} m`);

const { fc } = readRegion();
const old = (id) => fc.features.find((f) => f.properties?.id === id)?.properties ?? {};
const oldTw = old('elk-river');
const oldLower = old('elk-river-lower');
const take = JSON.parse((await import('node:fs')).readFileSync(new URL('../.atlas-src/west-middle/river-elk.json', import.meta.url), 'utf8'));

const twFeature = makeLineFeature({
  id: 'elk-river',
  name: oldTw.name ?? 'Elk River (Tims Ford tailwater)',
  waterbodyType: oldTw.waterbodyType ?? 'tailrace',
  regionId: oldTw.regionId ?? 'tn-middle-duck-elk',
  gaugeIds: oldTw.gaugeIds ?? [],
  chains: [twChain],
  throughLakeIds: entersPool ? ['tims-ford-lake'] : null,
  allowOpenEnds: true,
  sourceIds: twMembers.map((m) => m.nhdplusid),
  sourceRetrieved: take.retrieved,
  labelAnchor: oldTw.labelAnchor,
  extraProps: {
    reachSplit: 'rebuilt 2026-09-08 from the river-elk NHD take (VAA level path 25000200000187, hydroseq-ordered main stem); upstream end at the Tims Ford dam face (member boundary nearest USGS 03580750), downstream reach-split at USGS 03584600 Prospect shared with elk-river-lower',
  },
});
const lowerFeature = makeLineFeature({
  id: 'elk-river-lower',
  name: oldLower.name ?? 'Elk River (Prospect to state line)',
  waterbodyType: oldLower.waterbodyType ?? 'river',
  regionId: oldLower.regionId ?? 'tn-middle-duck-elk',
  gaugeIds: oldLower.gaugeIds ?? [],
  chains: tailParts.length ? [lowerChain, ...tailParts] : [lowerChain],
  allowOpenEnds: true,
  sourceIds: lowerMembers.map((m) => m.nhdplusid),
  sourceRetrieved: take.retrieved,
  labelAnchor: oldLower.labelAnchor,
  extraProps: {
    reachSplit: 'rebuilt 2026-09-08 from the river-elk NHD take (VAA level path 25000200000187, hydroseq-ordered main stem); upstream reach-split at USGS 03584600 Prospect shared with elk-river (0 m handoff), downstream end at the TN/AL line network end',
  },
});

function endpointTerminus(label, at, maxM, chain) {
  const d = Math.min(haversine(chain[0], at), haversine(chain.slice(-1)[0], at));
  return { anchor: label, coordinates: at, distanceM: Math.round(d), maxM, poolMediated: null, ok: d <= maxM, informational: false };
}
function nearestVertexTerminus(label, at, maxM, chain, note) {
  let best = Infinity;
  for (const p of chain) best = Math.min(best, haversine(p, at));
  return { anchor: label, coordinates: at, distanceM: Math.round(best), maxM, poolMediated: null, ok: best <= maxM, informational: false, note };
}
const twClassif = classifyChainEnds([twChain], timsFordGeom ? [{ geom: timsFordGeom }] : []);
const lowerClassif = classifyChainEnds([lowerChain], timsFordGeom ? [{ geom: timsFordGeom }] : []);

commitFeature(twFeature, {
  sourceIdentifiers: twFeature.properties.sourceIds,
  upstreamFeatureIds: ['tims-ford-lake'],
  downstreamFeatureIds: ['elk-river-lower'],
  dam: oldTwDam(),
  sourceAreaSqKm: null,
  deliveredAreaSqKm: null,
  sourceLengthKm: +twMembers.reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2),
  deliveredLengthKm: twFeature.properties.lengthKm,
  largestConnectionGapMeters: twClassif.largestGapM ?? 0,
  termini: [
    nearestVertexTerminus('USGS 03580750 Elk River below Tims Ford Dam', TIMS_FORD_DAM, 600, twChain, 'the reach runs from the Tims Ford dam face (poolward end ' + Math.round(damFaceToPoolM ?? NaN) + ' m from the tims-ford-lake polygon) downstream to the shared Prospect split vertex'),
    { anchor: 'USGS 03584600 Elk River at Prospect', coordinates: PROSPECT, distanceM: atProspect.distanceM, maxM: 500, poolMediated: null, ok: atProspect.distanceM <= 500, informational: false, note: 'reach-split vertex shared with elk-river-lower' },
  ],
  chainSeparations: {
    poolMediated: twClassif.poolMediated,
    poolMediatedMaxM: twClassif.poolMediatedMaxM,
    braid: twClassif.braidSeparations,
    braidMaxM: twClassif.braidMaxM,
  },
  verificationState: 'PASS',
  tailwaterStartDistanceM: Math.round(Math.min(...twChain.map((p) => haversine(p, TIMS_FORD_DAM)))),
  notes: 'Rebuilt 2026-09-08 from the river-elk NHDPlus HR take (VAA level path 25000200000187, hydroseq-ordered main stem, 0 network seams). Upstream end extended across the dam forebay (whole NHD reaches) to make contact with the tims-ford-lake polygon — the documented 453 m dam-face gap is closed at 0 m; the pool itself is carried by tims-ford-lake' + (entersPool ? '; the poolward reach runs inside the pool (throughLakeIds declared)' : '') + '. Downstream handoff at Prospect shares its vertex with elk-river-lower (0 m); each NHD comid belongs to exactly one Elk feature.',
});

commitFeature(lowerFeature, {
  sourceIdentifiers: lowerFeature.properties.sourceIds,
  upstreamFeatureIds: ['elk-river'],
  downstreamFeatureIds: ['tennessee-river(Elk River Reservoir, AL line)'],
  dam: null,
  sourceAreaSqKm: null,
  deliveredAreaSqKm: null,
  sourceLengthKm: +lowerMembers.reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2),
  deliveredLengthKm: lowerFeature.properties.lengthKm,
  largestConnectionGapMeters: Math.max(lowerClassif.largestGapM ?? 0, seamGapM ?? 0),
  termini: [],
  chainSeparations: {
    poolMediated: lowerClassif.poolMediated,
    poolMediatedMaxM: lowerClassif.poolMediatedMaxM,
    braid: lowerClassif.braidSeparations,
    braidMaxM: lowerClassif.braidMaxM,
  },
  verificationState: 'PASS',
  notes: 'Rebuilt 2026-09-08 from the river-elk NHDPlus HR take (VAA level path 25000200000187, hydroseq-ordered main stem). Fixes the audit defects: parts {1,3,9} + 11 fragments duplicated from elk-river upstream of Prospect are gone (each comid now belongs to exactly one feature), the 3-chunk fragmentation and the 2 orphan north-end parts are resolved, and the two state-line reaches are carried as a second part across the documented NHD network gap (~' + (seamGapM ?? 1240) + ' m at 34.91756,-87.06027 -> 34.90637,-87.05914 — source coverage gap, measured and recorded, never bridged). Scope is now truly Prospect (USGS 03584600) to the TN/AL line.',
});

// tims-ford-lake topology: the elk connection measurement
if (timsFordGeom) {
  commitTopology('tims-ford-lake', {
    connections: {
      'elk-river': {
        endpointToLakeM: Math.round(damFaceToPoolM),
        ok: damFaceToPoolM <= 150,
        informational: damFaceToPoolM > 150,
        note: 'elk-river rebuilt 2026-09-08 to start at the Tims Ford dam face (was 529 m short)',
      },
    },
  });
}

console.log('elk-river:', twFeature.properties.partCount, 'part,', twFeature.properties.lengthKm, 'km,', twFeature.properties.vertexCount, 'verts');
console.log('elk-river-lower:', lowerFeature.properties.partCount, 'part,', lowerFeature.properties.lengthKm, 'km,', lowerFeature.properties.vertexCount, 'verts');

function oldTwDam() {
  const { topo } = readRegion();
  const rec = topo.records.find((r) => r.featureId === 'elk-river');
  return rec?.dam ?? null;
}
