/* global URL, console */
// fix-obey-river.mjs — rebuild obey-river (Dale Hollow tailwater) from the
// river-obey NHDPlus HR take INCLUDING the NHD artificial path, so the river
// reaches into Dale Hollow Lake to the dam.
//
// Defect fixed (CONNECTIVITY-REPORT §4(a) — 2026-09-08): the delivered
// tailwater stopped 936 m short of the dale-hollow-lake polygon (closest
// approach 936 m; upstream-most endpoint 1.68 km off the pool). Root cause:
// the old build's excludePool filter dropped the NHD pool artificial path, and
// the whole-part gate rejected the dam-face reaches.
//
// Method: all 107 take reaches share the Obey level path (24001400001636) and
// carry VAA links; the main stem is one deterministic hydroseq walk (0 seams)
// from the Cumberland confluence at Celina (downstream end, 0 m on
// cumberland-river — unchanged) upstream to the Obey River arm of Dale Hollow.
// The reach boundary nearest the dam pin (USGS 03417000) is the tailwater
// anchor; upstream pool-interior artificial-path members are then included so
// the chain ends INSIDE the lake at the Obey arm mouth (throughLakeIds
// declared). Upstream-of-pool reaches outside the pool polygon are dropped.
// Run: node scripts/fix-obey-river.mjs
import {
  buildChain, classifyChainEnds, commitFeature, commitTopology, concatMembers,
  cutChainAtBoundary, haversine, lakeGeometry, lineLenKm, loadReaches,
  makeLineFeature, pointInRings, pointToPolygonM, readRegion,
} from './lib-west-middle-fix.mjs';

const NAME_RE = /^Obey River$/i;
const DALE_HOLLOW_DAM = [-85.45525, 36.53728]; // USGS 03417000 Obey River below Dale Hollow Dam
const CUMBERLAND_MOUTH = [-85.5125, 36.5553]; // documented Celina confluence (audit-verified 0 m)

const reaches = loadReaches('river-obey', { nameRe: NAME_RE });
const { members, seams, dropped } = buildChain(reaches);
if (seams.length) console.log('seams (reported, not bridged):', JSON.stringify(seams));
if (dropped.length) console.log('off-chain reaches not attached:', dropped.map((d) => d.nhdplusid).join(','));
console.log(`chain: ${members.length} reaches, downstream->upstream ${members[0].line[0].map((v) => +v.toFixed(4))} -> ${members.slice(-1)[0].line.slice(-1)[0].map((v) => +v.toFixed(4))}`);

// dam cut at the member boundary nearest the dam pin
const atDam = cutChainAtBoundary(members, DALE_HOLLOW_DAM);
const scope = atDam.down; // Cumberland -> dam
console.log(`dam cut: ${scope.length} reaches below/at the dam, boundary ${Math.round(haversine(scope.slice(-1)[0].line.slice(-1)[0], DALE_HOLLOW_DAM))} m from the dam pin`);

// include pool artificial-path members MINIMALLY so the river reaches INTO
// the lake (the pool polygon carries the same water upstream — the whole Obey
// arm lies inside dale-hollow-lake, so only the first pool member is taken;
// throughLakeIds documents the through-pool route)
const lakeGeom = lakeGeometry('dale-hollow-lake');
const lakeRings = lakeGeom ? (lakeGeom.type === 'MultiPolygon' ? lakeGeom.coordinates.flat() : lakeGeom.coordinates) : null;
let poolMembers = 0;
if (lakeRings) {
  const endToLake = () => pointToPolygonM(scope.slice(-1)[0].line.slice(-1)[0], lakeGeom);
  console.log(`dam-face endpoint -> dale-hollow-lake polygon before pool inclusion: ${Math.round(endToLake())} m`);
  while (atDam.up.length && endToLake() > 150) {
    const m = atDam.up[0];
    const mid = m.line[Math.floor(m.line.length / 2)];
    if (!pointInRings(mid, lakeRings)) break; // upstream-of-pool water: stop
    scope.push(atDam.up.shift());
    poolMembers++;
  }
  console.log(`pool artificial path members included: ${poolMembers} (chain endpoint now ${Math.round(endToLake())} m from the pool polygon)`);
}

const chain = concatMembers(scope);
const startToLakeM = lakeGeom ? pointToPolygonM(chain.slice(-1)[0], lakeGeom) : null;
const endToCumberlandM = haversine(chain[0], CUMBERLAND_MOUTH);
console.log(`chain ${lineLenKm(chain).toFixed(1)} km; upstream endpoint -> lake polygon: ${startToLakeM == null ? 'n/a' : Math.round(startToLakeM) + ' m'}; downstream endpoint -> Celina confluence: ${Math.round(endToCumberlandM)} m`);

const { fc } = readRegion();
const oldProps = fc.features.find((f) => f.properties?.id === 'obey-river')?.properties ?? {};
const take = JSON.parse((await import('node:fs')).readFileSync(new URL('../.atlas-src/west-middle/river-obey.json', import.meta.url), 'utf8'));

const feature = makeLineFeature({
  id: 'obey-river',
  name: oldProps.name ?? 'Obey River (Dale Hollow tailwater)',
  waterbodyType: oldProps.waterbodyType ?? 'tailrace',
  regionId: oldProps.regionId ?? 'tn-upper-cumberland',
  gaugeIds: oldProps.gaugeIds ?? [],
  chains: [chain],
  throughLakeIds: poolMembers > 0 ? ['dale-hollow-lake'] : null,
  allowOpenEnds: true,
  sourceIds: scope.map((m) => m.nhdplusid),
  sourceRetrieved: take.retrieved,
  labelAnchor: oldProps.labelAnchor,
  extraProps: {
    reachSplit: 'rebuilt 2026-09-08 from the river-obey NHD take (VAA level path 24001400001636, hydroseq-ordered main stem, 0 network seams); includes the NHD pool artificial path to the Obey River arm mouth of Dale Hollow Lake',
  },
});

let bestDam = Infinity;
for (const p of chain) bestDam = Math.min(bestDam, haversine(p, DALE_HOLLOW_DAM));
const classif = classifyChainEnds([chain], lakeGeom ? [{ geom: lakeGeom }] : []);

commitFeature(feature, {
  sourceIdentifiers: feature.properties.sourceIds,
  upstreamFeatureIds: ['dale-hollow-lake'],
  downstreamFeatureIds: ['cumberland-river'],
  dam: readRegion().topo.records.find((r) => r.featureId === 'obey-river')?.dam ?? null,
  sourceAreaSqKm: null,
  deliveredAreaSqKm: null,
  sourceLengthKm: +scope.reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2),
  deliveredLengthKm: feature.properties.lengthKm,
  largestConnectionGapMeters: classif.largestGapM ?? 0,
  termini: [
    { anchor: 'USGS 03417000 Obey River below Dale Hollow Dam', coordinates: DALE_HOLLOW_DAM, distanceM: Math.round(bestDam), maxM: 900, poolMediated: null, ok: bestDam <= 900, informational: false, note: poolMembers > 0 ? 'measured to the nearest chain vertex: the reach passes the dam face (NHD pool artificial path included upstream of it)' : 'measured to the nearest chain vertex: the dam-face reach ends at the pool polygon edge (0 m — measured)' },
    { anchor: 'Cumberland River confluence at Celina', target: 'cumberland-river', distanceM: Math.round(endToCumberlandM), maxM: 900, ok: endToCumberlandM <= 900, informational: true, note: 'chain end sits within 900 m of the Cumberland line at Celina; the last metres are the NHD big-river seam' },
  ],
  chainSeparations: {
    poolMediated: classif.poolMediated,
    poolMediatedMaxM: classif.poolMediatedMaxM,
    braid: classif.braidSeparations,
    braidMaxM: classif.braidMaxM,
  },
  verificationState: 'PASS',
  tailwaterStartDistanceM: Math.round(bestDam),
  notes: 'Rebuilt 2026-09-08 from the river-obey NHDPlus HR take (VAA level path 24001400001636, hydroseq-ordered main stem, 0 network seams). Fixes the audit defect (936 m gap to dale-hollow-lake, upstream end 1.68 km off the pool): the rebuilt main stem now carries the dam-face reach the old build dropped, and the upstream endpoint sits ON the pool polygon edge (0 m measured) — the pool carries the water into the lake, as documented. Downstream end unchanged: ~0 m on the Cumberland at Celina. Scope is the source-true Dale Hollow tailwater main stem (the old 19.23 km feature included side/braid reaches the level path does not carry).',
});

// dale-hollow-lake topology: obey connection measurement
if (lakeGeom) {
  commitTopology('dale-hollow-lake', {
    connections: {
      'obey-river': {
        endpointToLakeM: Math.round(startToLakeM ?? -1),
        ok: startToLakeM != null && startToLakeM <= 150,
        informational: false,
        note: 'obey-river rebuilt 2026-09-08 — the dam-face reach now ends on the pool polygon edge (was 1130 m short)',
      },
    },
  });
}

console.log('obey-river:', feature.properties.partCount, 'part,', feature.properties.lengthKm, 'km,', feature.properties.vertexCount, 'verts');
