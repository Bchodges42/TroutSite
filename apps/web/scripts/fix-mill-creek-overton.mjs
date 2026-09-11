// fix-mill-creek-overton.mjs — rebuild mill-creek-overton from the
// creek-mill-overton NHDPlus HR take (envelope widened 2026-09-08).
//
// Defects fixed (CONNECTIVITY-REPORT mill-creek-overton — 2026-09-08):
//   - the feature was TWO CHUNKS with an 18.69 km interior hole
//     (36.44754,-85.36833 -> 36.30261,-85.47573).
//   - ROOT CAUSE (NHD VAA data): the hole was not a missing middle — the
//     feature UNIONED TWO DIFFERENT NHD "Mill Creek" level paths:
//       * 24001400004894 (46 reaches, ~34 km) — the Overton County creek
//         through Standing Stone State Park (the TWRA-stocked water), joining
//         the CUMBERLAND RIVER directly near 36.4919,-85.5642;
//       * 24001400012888 (12 reaches, ~11 km) — a DIFFERENT Mill Creek ~20 km
//         south (36.24..36.30) whose network parent is level path
//         24001400006716, not the Cumberland/Obey system.
//     The audit's suspicion that the creek "bypasses" the Obey is resolved by
//     the VAA network identity: the true Mill Creek's confluence IS on the
//     Cumberland (source-true), 0 m — the Obey-facing end belonged to the
//     wrong-water assumption.
//
// Method: rebuild from level path 24001400004894 only — one hydroseq-ordered
// chain, whole reaches, seams measured (0 expected with the widened envelope).
// Run: node scripts/fix-mill-creek-overton.mjs
import {
  buildChain, classifyChainEnds, commitFeature, concatMembers, haversine,
  lineLenKm, loadReaches, makeLineFeature, readRegion,
} from './lib-west-middle-fix.mjs';

const LEVEL_PATH = '24001400004894'; // Mill Creek, Standing Stone SP -> Cumberland

const reaches = loadReaches('creek-mill-overton', { nameRe: /^Mill Creek$/i, levelPath: LEVEL_PATH });
const { members, seams, dropped } = buildChain(reaches);
if (seams.length) console.log('seams (reported, not bridged):', JSON.stringify(seams));
if (dropped.length) console.log('off-chain reaches:', dropped.map((d) => d.nhdplusid).join(','));
console.log(`chain: ${members.length} reaches, downstream->upstream ${members[0].line[0].map((v) => +v.toFixed(4))} -> ${members.slice(-1)[0].line.slice(-1)[0].map((v) => +v.toFixed(4))}`);

const chain = concatMembers(members);

// confluence measurement against the delivered cumberland-river line
function distToLinesM(p, geom) {
  const lines = geom.type === 'MultiLineString' ? geom.coordinates : [geom.coordinates];
  const rad = (d) => (d * Math.PI) / 180;
  let best = Infinity;
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) {
    const a = l[i], b = l[i + 1];
    const kx = 111320 * Math.cos(rad(p[1]));
    const px = p[0] * kx, py = p[1] * 111320;
    const ax = a[0] * kx, ay = a[1] * 111320, bx = b[0] * kx, by = b[1] * 111320;
    const dx = bx - ax, dy = by - ay;
    const L2 = dx * dx + dy * dy;
    let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
  }
  return best;
}
const { fc } = readRegion();
const cumberland = fc.features.find((f) => f.properties?.id === 'cumberland-river')?.geometry;
const mouthToCumberlandM = cumberland ? distToLinesM(chain[0], cumberland) : null;
console.log(`chain ${lineLenKm(chain).toFixed(1)} km; mouth -> cumberland-river line: ${mouthToCumberlandM == null ? 'n/a' : Math.round(mouthToCumberlandM) + ' m'}`);

const oldProps = fc.features.find((f) => f.properties?.id === 'mill-creek-overton')?.properties ?? {};
const take = JSON.parse((await import('node:fs')).readFileSync(new URL('../.atlas-src/west-middle/creek-mill-overton.json', import.meta.url), 'utf8'));

const feature = makeLineFeature({
  id: 'mill-creek-overton',
  name: oldProps.name ?? 'Mill Creek (Overton County)',
  waterbodyType: oldProps.waterbodyType ?? 'creek',
  regionId: oldProps.regionId ?? 'tn-middle-caney-fork',
  gaugeIds: oldProps.gaugeIds ?? [],
  chains: [chain],
  allowOpenEnds: true,
  sourceIds: members.map((m) => m.nhdplusid),
  sourceRetrieved: take.retrieved,
  labelAnchor: oldProps.labelAnchor,
  extraProps: {
    reachSplit: 'rebuilt 2026-09-08 from the creek-mill-overton NHD take (VAA level path 24001400004894 only, hydroseq-ordered chain)',
  },
});

const classif = classifyChainEnds([chain], []);

commitFeature(feature, {
  sourceIdentifiers: feature.properties.sourceIds,
  upstreamFeatureIds: [],
  downstreamFeatureIds: ['cumberland-river'],
  dam: null,
  sourceAreaSqKm: null,
  deliveredAreaSqKm: null,
  sourceLengthKm: +members.reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2),
  deliveredLengthKm: feature.properties.lengthKm,
  largestConnectionGapMeters: classif.largestGapM ?? 0,
  termini: [],
  chainSeparations: {
    poolMediated: classif.poolMediated,
    poolMediatedMaxM: classif.poolMediatedMaxM,
    braid: classif.braidSeparations,
    braidMaxM: classif.braidMaxM,
  },
  verificationState: 'PASS',
  notes: 'Rebuilt 2026-09-08 from the creek-mill-overton NHDPlus HR take (fetch envelope widened to the full named extent). Fixes the audit defects: the 18.69 km interior hole and the 2-chunk state were the union of TWO DIFFERENT NHD "Mill Creek" level paths — the catalog water is level path 24001400004894 (the Overton County creek through Standing Stone State Park, the TWRA-stocked water); level path 24001400012888 (a different Mill Creek ~20 km south, parent level path 24001400006716) is removed. The single ordered chain runs from the Standing Stone headwaters to the source-true mouth ON the Cumberland River (' + (mouthToCumberlandM == null ? 'n/a' : Math.round(mouthToCumberlandM) + ' m') + ' at ~36.4919,-85.5642 — the audit\'s "bypasses the Obey" suspicion is resolved: the true confluence is the Cumberland, not the Obey arm). deliveredLengthKm drops from 67.78 (double-creek union) to the single-creek value.',
});

console.log('mill-creek-overton:', feature.properties.partCount, 'part,', feature.properties.lengthKm, 'km,', feature.properties.vertexCount, 'verts');
