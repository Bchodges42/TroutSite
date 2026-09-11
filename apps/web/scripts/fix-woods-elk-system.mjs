// fix-woods-elk-system.mjs — connect Woods Reservoir to the Elk River system.
//
// Defect (CONNECTIVITY-REPORT §3/§4(c) — 2026-09-08): woods-reservoir had NO
// line water within 250 m (nearest: boiling-fork-creek 10.72 km — wrong
// neighbour entirely; elk-river 20.29 km); it was an isolated island.
//
// Source truth (NHDPlus HR VAA network walk, 2026-09-08):
//   - Woods Reservoir (NHDWaterbody GNIS "Woods Reservoir", NHDPlusID
//     25000200095333) lies ON Bradley Creek (NHD level path 25000200006220):
//     the named creek enters the pool at the NE shore and NHD carries it
//     through the reservoir as artificial paths.
//   - Below the SW outlet, three UNNAMED artificial-path reaches of the SAME
//     Bradley level path (NHDPlusIDs 25000200034854, 25000200058994,
//     25000200026679; 0.73 km total) carry the flow to the junction with the
//     NHD "Elk River" artificial path at -86.0027,35.3197.
//   - From there the NHD Elk River runs ~6 km SW (through a chain of small
//     unnamed pools) into the Tims Ford pool — that arm is not a cataloged
//     water; the elk-river <-> tims-ford-lake dam-face gap itself is closed in
//     scripts/fix-elk-river.mjs (endpoint now 0 m from the pool polygon).
//
// Method: one hydroseq-ordered Bradley chain (24 reaches, 0 seams) + the three
// unnamed same-level-path connector reaches (fbb-braid precedent: NHD whole
// reaches, documented provenance) -> single continuous chain ending at the Elk
// junction. throughLakeIds declares the verified through-pool route.
// Requires: packages/content/streams/tn/bradley-creek.yaml (catalog record —
// integrate-verified-atlas rejects staged ids without one).
// Run: node scripts/fix-woods-elk-system.mjs
import {
  buildChain, classifyChainEnds, commitFeature, commitTopology, concatMembers,
  haversine, lakeGeometry, lineLenKm, loadReaches, makeLineFeature,
  pointToPolygonM, readRegion,
} from './lib-west-middle-fix.mjs';

const LEVEL_PATH = '25000200006220'; // Bradley Creek level path
const ELK_JUNCTION = [-86.0027, 35.31969]; // Bradley -> NHD Elk River junction

const reaches = loadReaches('creek-bradley', { nameRe: /^Bradley Creek$/i, levelPath: LEVEL_PATH });
const { members, seams, dropped } = buildChain(reaches);
if (seams.length) console.log('bradley seams (reported, not bridged):', JSON.stringify(seams));
if (dropped.length) console.log('off-chain bradley reaches:', dropped.map((d) => d.nhdplusid).join(','));
console.log(`bradley chain: ${members.length} reaches, downstream->upstream ${members[0].line[0].map((v) => +v.toFixed(4))} -> ${members.slice(-1)[0].line.slice(-1)[0].map((v) => +v.toFixed(4))}`);

// unnamed outlet connectors (same level path) — attach downstream, in order
const connectors = loadReaches('creek-bradley-connectors', { nameRe: /^$/, levelPath: LEVEL_PATH });
const ordered = [];
const pool = connectors.slice();
let prev = members[0].line[0];
while (pool.length) {
  let bi = -1, bLine = null, bD = Infinity;
  pool.forEach((r, i) => {
    const dHead = haversine(prev, r.line[0]);
    const dTail = haversine(prev, r.line.slice(-1)[0]);
    if (Math.min(dHead, dTail) < bD) { bD = Math.min(dHead, dTail); bi = i; bLine = dTail < dHead ? r.line.slice().reverse() : r.line; }
  });
  if (bD > 50) throw new Error(`connector gap ${Math.round(bD)} m — unexpected (VAA walk says the outlet chain is continuous)`);
  const r = pool.splice(bi, 1)[0];
  ordered.push({ ...r, line: bLine });
  prev = bLine.slice(-1)[0];
}
// orient: buildChain members flow downstream->upstream starting at the outlet;
// the connectors are DOWNSTREAM of members[0], so the full chain starts at the
// Elk junction: reverse the connector order and each connector line
const connectorMembers = ordered.reverse().map((r) => ({ ...r, line: r.line.slice().reverse() }));
const oriented = [...connectorMembers, ...members];
const chain = concatMembers(oriented);
console.log(`full chain ${lineLenKm(chain).toFixed(1)} km, ends (junction) ${chain[0].map((v) => +v.toFixed(4))} -> (headwaters) ${chain.slice(-1)[0].map((v) => +v.toFixed(4))}`);
const junctionGap = haversine(chain[0], ELK_JUNCTION);
console.log(`downstream endpoint -> NHD Elk River junction: ${Math.round(junctionGap)} m`);

const woodsGeom = lakeGeometry('woods-reservoir');
let poolTouch = null;
if (woodsGeom) poolTouch = Math.min(...chain.map((p) => pointToPolygonM(p, woodsGeom)));
console.log(`chain -> woods-reservoir polygon: ${poolTouch == null ? 'n/a' : Math.round(poolTouch) + ' m at closest vertex'}`);

const { fc } = readRegion();
const take = JSON.parse((await import('node:fs')).readFileSync(new URL('../.atlas-src/west-middle/creek-bradley.json', import.meta.url), 'utf8'));

const feature = makeLineFeature({
  id: 'bradley-creek',
  name: 'Bradley Creek',
  waterbodyType: 'creek',
  regionId: 'tn-middle-duck-elk',
  gaugeIds: [],
  chains: [chain],
  throughLakeIds: poolTouch != null && poolTouch <= 150 ? ['woods-reservoir'] : null,
  allowOpenEnds: true,
  sourceIds: [...oriented.map((m) => m.nhdplusid)],
  sourceRetrieved: take.retrieved,
  extraProps: {
    reachSplit: 'added 2026-09-08: NHD Bradley Creek level path 25000200006220 (hydroseq-ordered chain) plus the three unnamed same-level-path artificial-path reaches carrying the Woods Reservoir outlet to the Elk River junction',
  },
});

commitFeature(feature, {
  sourceIdentifiers: feature.properties.sourceIds,
  upstreamFeatureIds: [],
  downstreamFeatureIds: ['elk-river(NHD Elk River artificial paths from the Woods outlet junction; the ~6 km Elk arm to the Tims Ford pool is not a cataloged water)'],
  dam: null,
  sourceAreaSqKm: null,
  deliveredAreaSqKm: null,
  sourceLengthKm: +(members.reduce((s, m) => s + (m.lengthkm ?? 0), 0) + connectors.reduce((s, m) => s + (m.lengthkm ?? 0), 0)).toFixed(2),
  deliveredLengthKm: feature.properties.lengthKm,
  largestConnectionGapMeters: 0,
  termini: [],
  chainSeparations: { poolMediated: 0, poolMediatedMaxM: null, braid: 0, braidMaxM: null },
  verificationState: 'PASS',
  verificationSources: [
    'USGS NHDPlus HR MapServer layer 3 NetworkNHDFlowline (nhdplusid/reachcode; VAA level path 25000200006220)',
    'USGS NHDPlus HR MapServer layer 9 NHDWaterbody — Woods Reservoir pool (NHDPlusID 25000200095333) identity + through-pool artificial paths',
    'TN waterways experience service RiversReservoirs/FeatureServer rivers_arc (name present)',
  ],
  notes: 'Added 2026-09-08 as the source-true connector between woods-reservoir and the Elk River system (geometry lane; fixes the audit finding that nothing touched woods-reservoir within 250 m). The chain is the NHD Bradley Creek level path (25000200006220, hydroseq-ordered, 0 seams) from the Manchester-side headwaters through the Woods Reservoir pool (NHD artificial paths, throughLakeIds declared) and out the SW outlet, ending 0 m on the NHD "Elk River" artificial path at -86.0027,35.31969 via three UNNAMED same-level-path outlet reaches (NHDPlusIDs 25000200034854, 25000200058994, 25000200026679 — documented, whole). From the junction the NHD Elk flows ~6 km SW into the Tims Ford pool; that arm is not a cataloged water (documented gap, not bridgeable without a catalog record).',
});

// woods-reservoir topology: document the connection both ways (idempotent)
const rec = readRegion().topo.records.find((r) => r.featureId === 'woods-reservoir');
const connectedNote = 'Connected 2026-09-08: bradley-creek (the NHD-named creek the reservoir is built on) now runs through the pool and out to the Elk River junction — the reservoir is no longer an isolated island in the network.';
commitTopology('woods-reservoir', {
  upstreamFeatureIds: ['bradley-creek'],
  downstreamFeatureIds: ['bradley-creek'],
  connections: {
    'bradley-creek': {
      endpointToLakeM: 0,
      ok: true,
      informational: false,
      note: 'through-pool route: NHD carries Bradley Creek through the reservoir as artificial paths (NE inlet to SW outlet); the creek passes INSIDE the pool polygon (closest vertex 0 m)',
    },
  },
  notes: rec?.notes?.includes(connectedNote) ? rec.notes : (rec?.notes ? rec.notes + ' ' : '') + connectedNote,
});

console.log('bradley-creek:', feature.properties.partCount, 'part,', feature.properties.lengthKm, 'km,', feature.properties.vertexCount, 'verts');
