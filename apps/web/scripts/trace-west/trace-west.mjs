#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * trace-west/trace-west.mjs — trace-crew WEST level-path tracer (2026-09-08).
 *
 * Rebuilds every defective west/middle line water by tracing its NHDPlus HR
 * level path (fix-duck-river/fix-elk-river technique, generalized): fetch the
 * whole level path (named reaches + unnamed corridor refill, see
 * fetch-west.mjs), order reaches by the VAA network topology
 * (hydroseq/dnhydroseq via scripts/lib-west-middle-fix.mjs buildChain), weld
 * 0-seam (<= 50 m), split into chains only at documented seams, and write ONE
 * artifact apps/web/.atlas-src/trace/west/out/<id>.json per water.
 *
 * NO canonical/region/source file is written here — scripts/trace-west/
 * apply-west.mjs validates the artifacts and the orchestrator applies them.
 *
 * Usage: node scripts/trace-west/trace-west.mjs [id ...]   (default: all)
 *        node scripts/trace-west/trace-west.mjs --report   (summary only)
 */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadTake, levelPathGroups, traceWater, makeArtifact, beforeMetrics,
  _loadCanonicalProps, westMiddleMembership, loadSelfX, lineLenKm, chunkStats,
  membersToChains, OUT,
} from './lib.mjs';
import { cutChainAtVertex } from '../lib-west-middle-fix.mjs';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CANONICAL = join(webRoot, 'public', 'atlas', 'rivers.geojson');
const CANON = JSON.parse(readFileSync(CANONICAL, 'utf8'));
const canonById = new Map(CANON.features.map((f) => [f.properties.id, f]));

// ---------------------------------------------------------------------------
// Water configs. window = whole-reach catalog gate (whole parts only, no
// interior clipping). pins = dam/gauge anchors checked near the chain.
// ---------------------------------------------------------------------------
const WATERS = [
  // ---------------- priority: owner-visible ----------------
  {
    id: 'tennessee-river', take: 'river-tennessee',
    nameRe: /^(Tennessee River|Guntersville Lake|Wheeler Lake|Wilson Lake|Kentucky Lake|Pickwick Lake|Watts Bar Lake|Chickamauga Lake|Nickajack Lake|Fort Loudoun Lake)$/i,
    minKm: 10, // only the main-stem level path(s) with real named coverage
    notes: 'Main stem rebuilt from the NHD artificial paths through EVERY reservoir (dash-through-lake follows the reservoir centerline; Watts Bar flagged by the owner is the NHD artificial path). The through-pool carriers in the big main-stem pools carry the reservoir gnis_name in NHD, so the trace selects the union of river+pool names and orders the whole main stem by VAA hydroseq. throughLakeIds preserved from canonical.',
    pins: [
      { label: 'Watts Bar Dam (TVA)', at: [-84.7786, 35.7803] },
      { label: 'Chickamauga Dam (TVA)', at: [-85.2253, 35.0933] },
      { label: 'Nickajack Dam (TVA)', at: [-85.6192, 34.9911] },
      { label: 'Pickwick Landing Dam (TVA)', at: [-88.1786, 35.0644] },
      { label: 'Kentucky Dam (TVA/USACE)', at: [-88.2722, 37.0125] },
      { label: 'Fort Loudoun Dam (TVA)', at: [-84.2397, 35.7914] },
    ],
  },
  {
    id: 'cumberland-river', take: 'river-cumberland', nameRe: /^Cumberland River$/i,
    minKm: 10,
    throughLakeIds: ['lake-barkley', 'old-hickory-lake'],
    notes: 'Statewide main stem, one hydroseq-ordered chain; the unnamed through-pool carriers (Cordell Hull / Old Hickory / Cheatham / Barkley — "through-pool carrier unnamed in NHD" per west-middle-build) come from the unnamed corridor refill and chain 0-seam. throughLakeIds preserved (lake-barkley, old-hickory-lake).',
    pins: [
      { label: 'USGS 03426310 Cumberland River at Old Hickory Dam', at: [-86.65863, 36.29712] },
      { label: 'USGS 03435000 Cumberland River below Cheatham Dam', at: [-87.22826, 36.3229] },
      { label: 'USGS 03416645 Cumberland River at Celina (Obey confluence)', at: [-85.4881, 36.5514] },
    ],
  },
  // ---------------- west Tennessee ----------------
  {
    id: 'wolf-river-west-tennessee', take: 'river-wolf-west', nameRe: /^Wolf River$/i,
    minKm: 10,
    notes: 'West Tennessee Wolf (distinct from wolf-river-fentress). 16 self-crossings + 12 chunks rebuilt as one hydroseq-ordered main-stem chain; bottomland braids off the level path are dropped and reported.',
    pins: [{ label: 'USGS 03503800 Wolf River at La Grange TN', at: [-89.2347, 35.1608] }, { label: 'USGS 03504000 Wolf River at Germantown', at: [-89.8455, 35.1019] }],
  },
  {
    id: 'hatchie-river', take: 'river-hatchie', nameRe: /^Hatchie River$/i,
    minKm: 10,
    notes: 'Main stem only (South Fork Hatchie is a distinct NHD name and stays excluded per the catalog spec); NWR wetland braids off-path dropped.',
    pins: [{ label: 'USGS 03596000 Hatchie River near Rives', at: [-89.4867, 36.0761] }, { label: 'USGS 07028500 Hatchie River near Brownsville', at: [-89.1872, 35.5561] }],
  },
  {
    id: 'obion-river', take: 'river-obion', nameRe: /^Obion River$/i,
    minKm: 10,
    notes: 'Main stem (GNIS "Obion River"); forks are distinct names and excluded per the catalog spec.',
    pins: [{ label: 'USGS 07028100 Obion River near Martin', at: [-88.8467, 36.3436] }],
  },
  {
    id: 'harpeth-river', take: 'river-harpeth', nameRe: /^Harpeth River$/i,
    minKm: 10,
    notes: '9 crossings / 13 chunks rebuilt as one chain; downstream end keeps the Cumberland confluence anchor (maxM 200).',
    pins: [{ label: 'USGS 03581800 Harpeth River at Franklin', at: [-86.8683, 35.9186] }, { label: 'USGS 03582400 Harpeth River near Kingston Springs', at: [-87.1353, 36.0705] }],
  },
  {
    id: 'buffalo-river', take: 'river-buffalo', nameRe: /^Buffalo River$/i,
    minKm: 10,
    notes: 'Main stem (North/South/West forks distinct names). The documented 2.7 km named-hole (lat 35.364-35.389) is retraced with the unnamed corridor refill — if NHD carries the level path unnamed there, the hole closes; otherwise the seam is documented, not bridged.',
    pins: [{ label: 'USGS 03598950 Buffalo River near Flat Woods', at: [-87.7428, 35.7314] }, { label: 'USGS 03599000 Buffalo River below Tallpine (Betty Branch)', at: [-87.7939, 35.4133] }],
  },
  // ---------------- middle Tennessee ----------------
  {
    id: 'cane-creek', take: 'creek-cane-hickman', nameRe: /^Cane Creek$/i,
    minKm: 8,
    notes: 'ONE catalog id deliberately covers TWO same-named Cane Creeks (Bledsoe/Van Buren water + Hickman/Perry water, ~2.3 deg apart; DELIBERATE allowlist). Each water is traced from its OWN level path; both chains are delivered under the catalog id with 0 internal crossings — splitting the id remains a content-lane decision.',
  },
  {
    id: 'calfkiller-river', take: 'river-calfkiller', nameRe: /^Calfkiller/i, minKm: 5,
    notes: '12 intra-part crossings from out-of-order welds; rebuilt as one chain.',
  },
  {
    id: 'red-river-clarksville', take: 'river-red', nameRe: /^Red River$/i,
    minKm: 10, window: [-87.42, 36.42, -87.02, 36.75],
    notes: 'Catalog reach: Montgomery County corridor (west-middle-build gate); whole reaches inside the window only. NHD named coverage stops ~26 km short of the Cumberland (documented) — the delivered chain ends at the same documented terminus.',
    pins: [{ label: 'USGS 03437000 Red River near Adams', at: [-87.0669, 36.6689] }, { label: 'Port Royal FR 3 crossing (west end of named coverage)', at: [-87.372, 36.5382] }],
  },
  {
    id: 'salt-lick-creek', take: 'creek-salt-lick', nameRe: /^Salt Lick Creek$/i, minKm: 5,
    notes: 'Rebuilt from the widened take. VAA tracing shows the catalog id covers TWO same-named Salt Lick Creeks on distinct level paths (24001200002436 Jackson Co, to the Cordell Hull pool; 24001400008307 Putnam Co ~15 km SE) — both delivered as internally continuous chains (0 seams) under the one catalog id (same-name precedent; splitting the id is a content-lane decision). The old 9.21 km "gap" was the distance between the two waters plus weld defects.',
  },
  {
    id: 'white-oak-creek', take: 'creek-white-oak', nameRe: /White ?Oak Creek/i, minKm: 5,
    notes: '34 parts / 2 crossings / 4 chunks rebuilt as one chain (Houston County White Oak Creek, envelope-scoped against same-name waters).',
  },
  {
    id: 'hurricane-creek', take: 'creek-hurricane', nameRe: /^Hurricane Creek$/i, minKm: 3,
    notes: 'LEFT-OPEN allowlist RESOLVED: the old "34.5 km hole between 2 chains" is NOT a NHD discontinuity — it is TWO same-named Hurricane Creeks on distinct level paths (25000100002843 Decatur/Perry Co, ~37.6 km, runs into kentucky-lake through-pool; 25000100004003 Benton/Houston Co, ~16.7 km, ~25 km NW). Each is one hydroseq-ordered 0-seam chain under the one catalog id (same-name precedent); the content lane may want to split the id or update the CONTINUITY allowlist entry.',
  },
  {
    id: 'sulfur-fork-creek', take: 'creek-sulfur-fork', nameRe: /^Sul?phur Fork/i, minKm: 5,
    notes: '5 chunks / 6 anti-parallel runs rebuilt. VAA tracing shows the catalog id covers TWO same-named Sulfur Fork waters on distinct level paths (24001400002813 Robertson Co, ~72.8 km highly meandering main fork; 24001200004661 Sumner/Macon Co, ~19.4 km, ~25 km E) — both delivered as 0-seam chains under the one catalog id (same-name precedent).',
  },
  {
    id: 'east-fork-stones-river', take: 'river-stones', nameRe: /^East Fork Stones River$/i, minKm: 5,
    notes: '6 crossings / 11 chunks rebuilt as one chain; the fork is a distinct NHD name off the Stones take.',
  },
  {
    id: 'west-fork-stones-river', take: 'river-stones', nameRe: /^West Fork Stones River$/i, minKm: 5,
    notes: '1 crossing / 8 chunks rebuilt as one chain.',
  },
  {
    id: 'little-west-fork-creek', take: 'creek-little-west-fork', nameRe: /^(Little West Fork( Creek)?)$/i, minKm: 3,
    notes: '6 crossings / 3 chunks rebuilt as one chain.',
  },
  {
    id: 'big-rock-creek', take: 'creek-big-rock', nameRe: /^Big Rock Creek$/i, minKm: 3,
    notes: '2 crossings / 6 chunks rebuilt as one chain.',
  },
  {
    id: 'pine-creek-dekalb', take: 'creek-pine-dekalb', nameRe: /^Pine Creek$/i, minKm: 3,
    notes: 'DeKalb County Pine Creek (envelope-scoped); 7 intra-part crossings rebuilt as one chain draining to the Center Hill pool.',
  },
  {
    id: 'rocky-river', take: 'river-rocky', nameRe: /^Rocky River$/i, minKm: 3,
    notes: '2 crossings / 4 chunks rebuilt as one chain.',
  },
  {
    id: 'upper-hills-creek', take: 'creek-upper-hills', nameRe: /^Hills Creek$/i, minKm: 2,
    notes: '3 intra-part crossings rebuilt as one chain joining the Great Falls Caney Fork arm.',
  },
  {
    id: 'barren-fork-river', take: 'river-barren-fork', nameRe: /^Barren Fork( River)?$/i, minKm: 5,
    notes: '1 crossing / 2 chunks rebuilt as one chain (North Prong Barren Fork is a distinct id/name).',
  },
  {
    id: 'charles-creek', take: 'creek-charles', nameRe: /^Charles Creek$/i, minKm: 2,
    notes: '1 crossing / 2 chunks rebuilt as one chain.',
  },
  {
    id: 'fletchers-fork', take: 'fork-fletchers', nameRe: /^Fletchers Fork$/i, minKm: 2,
    notes: '1 crossing / 2 chunks rebuilt as one chain.',
  },
  {
    id: 'standing-rock-creek', take: 'creek-standing-rock', nameRe: /^Standing Rock Creek$/i, minKm: 2,
    notes: '1 intra-part crossing rebuilt as one chain.',
  },
  {
    id: 'mccutcheon-creek', take: 'creek-mccutcheon', nameRe: /^McCutcheon Creek$/i, minKm: 3,
    notes: '2 chunks rebuilt as one chain (0 crossings; weld-level fix).',
  },
  {
    id: 'boiling-fork-creek', take: 'creek-boiling-fork', nameRe: /^Boiling Fork Creek$/i, minKm: 2,
    notes: '2 chunks rebuilt as one chain (0 crossings; weld-level fix).',
  },
  {
    id: 'shoal-creek', take: 'creek-shoal', nameRe: /^Shoal Creek$/i, minKm: 5,
    notes: '2 crossings / 5 chunks rebuilt as one chain (envelope-scoped against same-name waters).',
  },
  {
    id: 'north-prong-barren-fork', take: 'creek-north-prong-barren', nameRe: /^North Prong Barren/i, minKm: 2,
    notes: '1 intra-part crossing rebuilt as one chain.',
  },
  {
    id: 'sinking-creek-wilson', take: 'creek-sinking', nameRe: /^Sinking Creek$/i, minKm: 2,
    notes: 'LEFT-OPEN allowlist RESOLVED: the documented "12.15 km west hole and 3.69 km mid hole" are the distances between THREE same-named Sinking Creeks on distinct level paths (24001400014142 ~13.9 km, 24001400012911 ~12.0 km, 24001400023404 ~4.7 km, Wilson/DeKalb area) — each traces 0-seam. All three delivered as continuous chains under the one catalog id (same-name precedent); the content lane may want to update the CONTINUITY allowlist entry.',
  },
  {
    id: 'east-fork-shoal-creek', take: 'creek-east-fork-shoal', nameRe: /^East Fork Shoal Creek$/i, minKm: 2,
    notes: 'LEFT-OPEN allowlist investigation: the documented 6.06 km upper-reach hole is retraced on the VAA level path — if NHD carries no reach there the seam stays documented (never bridged); each connected stretch is delivered 0-seam.',
  },
  // ---------------- follow-up wave 2 (orchestrator follow-up) ----------------
  {
    id: 'caney-fork-upper', take: 'river-caney-fork', nameRe: /^Caney Fork( River)?$/i, minKm: 5,
    damSplit: { role: 'upstream', at: [-85.826276, 36.097941], pin: 'Center Hill Dam (USGS 03424010 / west-middle-build damCut partVertex)' },
    notes: 'One level path traced for BOTH Caney Fork identities, reach-split at the Center Hill Dam pinned vertex (caney-fork damCut precedent — the split vertex is shared, no interior coordinate deleted). Upstream identity: full named course above the dam through the Great Falls + Center Hill pools (throughLakeIds preserved; pool artificial paths are on the level path).',
  },
  {
    id: 'caney-fork-river', take: 'river-caney-fork', nameRe: /^Caney Fork( River)?$/i, minKm: 5,
    damSplit: { role: 'downstream', at: [-85.826276, 36.097941], pin: 'Center Hill Dam (USGS 03424010 / west-middle-build damCut partVertex)' },
    notes: 'Center Hill tailwater identity: the same level path reach-split at the dam vertex (shared with caney-fork-upper, 0 m handoff); runs from the dam face to the Cumberland confluence at Carthage.',
    pins: [{ label: 'USGS 03424010 Caney Fork at Center Hill Dam', at: [-85.82721, 36.09784] }, { label: 'mouth at the Cumberland / Old Hickory Lake at Carthage', at: [-85.941, 36.239] }],
  },
  {
    id: 'collins-river', take: 'river-collins', nameRe: /^Collins River$/i, minKm: 5,
    notes: 'Duplicate corridor was fixed earlier; the fragmentation is rebuilt from the named Collins level path as one 0-seam chain. The through-pool relationship with great-falls-lake must survive (barren-fork/charles/upper-hills already end inside the pool) — verified by the through-lake touch check.',
    pins: [{ label: 'USGS 03422495 Collins River at Rock Island (Great Falls pool)', at: [-85.63359, 35.80701] }],
  },
  {
    id: 'little-buffalo-river', take: 'river-buffalo', nameRe: /^Little Buffalo River$/i, minKm: 3,
    notes: 'Distinct water from buffalo-river (own level path off the same take). The catalog documents the mouth reach as swamp where the named chain ends ~1.2 km short of the Buffalo line — if the level path does not chain there, the seam stays documented.',
  },
  {
    id: 'laurel-creek-johnson', take: 'creek-laurel-johnson', nameRe: /^Laurel Creek$/i, minKm: 2,
    notes: 'Johnson County Laurel Creek (envelope-scoped against the many same-named Laurel Creeks/Forks elsewhere; NOT a Laurel Fork identity). 4 intra-feature crossings rebuilt as one 0-seam level-path chain.',
  },
  {
    id: 'middle-prong-little-pigeon', take: 'creek-middle-prong-little-pigeon', nameRe: /^Middle Prong( of )?\s*Little Pigeon/i, minKm: 2,
    notes: 'Sevier County Middle Prong of the Little Pigeon (Greenbrier). Traced on its OWN level path — distinct tributary from little-pigeon-river (just traced by the east crew); the two share only the confluence, so no double-draw of the main river.',
  },
  {
    id: 'north-chickamauga-creek', take: 'creek-north-chickamauga', nameRe: /^North Chickamauga Creek$/i, minKm: 5,
    notes: 'Hamilton County North Chickamauga Creek; 2 crossings rebuilt as one 0-seam level-path chain to the Tennessee River confluence corridor.',
  },
];

const onlyIds = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const reportOnly = process.argv.includes('--report');
const want = new Set(onlyIds.flatMap((a) => a.split(',')).filter(Boolean));

const wmSet = westMiddleMembership();
const selfXMap = loadSelfX();

// delivered lake polygons for throughLakeIds touch verification (both region
// artifacts — the Tennessee main stem crosses east-southeast pools)
const LAKE_IDS = ['fort-loudoun-lake', 'watts-bar-lake', 'chickamauga-lake', 'nickajack-lake',
  'pickwick-lake', 'kentucky-lake', 'lake-barkley', 'old-hickory-lake', 'center-hill-lake',
  'great-falls-lake', 'j-percy-priest-lake', 'tims-ford-lake', 'normandy-lake', 'dale-hollow-lake'];
const lakeGeoms = (() => {
  const out = new Map();
  for (const file of ['atlas-sources/verified/east-southeast.geojson', 'atlas-sources/verified/west-middle.geojson']) {
    const fc = JSON.parse(readFileSync(join(webRoot, file), 'utf8'));
    for (const f of fc.features) {
      if (LAKE_IDS.includes(f.properties?.id) && f.geometry) out.set(f.properties.id, f.geometry);
    }
  }
  return out;
})();

function ringsOf(geom) {
  // Polygon coordinates = [outer, hole...] (already a list of rings);
  // MultiPolygon coordinates = [polygon][rings] -> flatten to a ring list.
  return geom.type === 'MultiPolygon' ? geom.coordinates.flat() : geom.coordinates;
}
function pointInRings(p, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
/** Verify a chain actually passes through each declared lake: some chain
 * vertex inside the polygon (artificial path) or within 150 m of it. */
function verifyThroughLakes(chains, lakeIds) {
  if (!lakeIds) return null;
  const report = {};
  for (const id of lakeIds) {
    const g = lakeGeoms.get(id);
    if (!g) { report[id] = 'lake polygon not found'; continue; }
    const rings = ringsOf(g);
    let inside = false, near = Infinity;
    for (const c of chains) {
      for (const p of c) {
        if (pointInRings(p, rings)) { inside = true; break; }
        let d = Infinity;
        for (const ring of rings) for (let i = 0; i < ring.length - 1; i++) d = Math.min(d, h2(p, ring[i]));
        near = Math.min(near, d);
      }
      if (inside) break;
    }
    report[id] = inside ? 'chain runs inside the pool polygon (NHD artificial path)' : `${Math.round(near)} m from the polygon`;
  }
  return report;
}

function traceOne(w) {
  const canon = canonById.get(w.id);
  if (!canon) throw new Error(`${w.id}: not in canonical rivers.geojson`);
  const { take, reaches } = loadTake(w.take);
  const lp = levelPathGroups(reaches, w.nameRe, { minKm: w.minKm ?? 2 });
  console.log(`\n== ${w.id} (take ${w.take}) — level paths: ${lp.kept.map((g) => `${g.levelPath}@${g.namedKm?.toFixed(1)}km`).join(', ') || 'NONE'}`);
  if (lp.dropped.length) console.log(`   dropped same-name level-path fragments: ${lp.dropped.map((g) => `${g.levelPath}@${g.namedKm?.toFixed(2)}km`).join(', ')}`);

  const t = traceWater(reaches, w.nameRe, {
    window: w.window ?? null,
    levelPathOpts: { minKm: w.minKm ?? 2 },
  });
  let usedMembers = t.members;
  let perLp = t.perLp;
  if (w.damSplit) {
    // caney-fork precedent: ONE level path serves TWO reach-scoped catalog
    // identities; reach-split at the pinned dam vertex (shared vertex, no
    // interior coordinate deleted).
    const cut = cutChainAtVertex(t.members, w.damSplit.at);
    usedMembers = w.damSplit.role === 'upstream' ? cut.up : cut.down;
    const rebuilt = membersToChains(usedMembers);
    t.chains = rebuilt.chains;
    t.seamsExtra = rebuilt.seams;
    perLp = perLp.map((p) => ({
      ...p,
      reachCount: usedMembers.length,
      vaaKm: +usedMembers.reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2),
      damSplit: { role: w.damSplit.role, pin: w.damSplit.pin, splitDistanceM: cut.distanceM, splitAt: cut.splitAt },
    }));
    console.log(`   dam split (${w.damSplit.role}): ${usedMembers.length} reaches, split vertex ${cut.distanceM} m from ${w.damSplit.pin} (shared with the other identity)`);
  }
  const chains = t.chains;
  if (!chains.length) throw new Error(`${w.id}: trace produced 0 chains`);
  const chainsKm = chains.map((c) => +lineLenKm(c).toFixed(2));
  const afterChunks = chunkStats(chains);
  const vaaKmUsed = +usedMembers.reduce((s, m) => s + (m.lengthkm ?? 0), 0).toFixed(2);
  console.log(`   chains: ${chains.length} [${chainsKm.join(', ')}] km | reaches used ${usedMembers.length} (VAA ${vaaKmUsed} km) | level-path seams ${t.perLp.reduce((s, p) => s + p.networkSeams + p.seams.length, 0)}${(t.seamsExtra ?? []).length ? ` | dam-split seams ${JSON.stringify(t.seamsExtra)}` : ''}`);
  for (const p of perLp) {
    if (p.networkSeamList?.length || p.seams?.length) {
      console.log(`   level path ${p.levelPath}: seams ${JSON.stringify((p.networkSeamList ?? []).concat(p.seams ?? []))}`);
    }
  }
  if (t.braidDropped.length) console.log(`   braid guard dropped: ${JSON.stringify(t.braidDropped)}`);
  if (t.windowDropped.length) console.log(`   window gate dropped ${t.windowDropped.length} reaches (${t.windowDropped.reduce((s, r) => s + (r.lengthkm ?? 0), 0).toFixed(1)} km)`);

  const ends = [];
  for (const c of chains) { ends.push(c[0], c[c.length - 1]); }
  const pins = (w.pins ?? []).map((p) => {
    let d = Infinity;
    for (const c of chains) for (const v of c) d = Math.min(d, h2(v, p.at));
    return { ...p, distanceM: Math.round(d) };
  });

  const before = beforeMetrics(w.id, canon, selfXMap);
  console.log(`   before: parts ${before.parts}, ${before.lengthKm} km, ${before.crossings} crossings, ${before.chunks} chunks | after: parts ${chains.length}, ${chainsKm.reduce((s, k) => s + k, 0).toFixed(1)} km, chunks ${afterChunks.chunks}`);
  const lakeCheck = verifyThroughLakes(chains, w.throughLakeIds ?? canon.properties.throughLakeIds ?? null);
  if (lakeCheck) console.log(`   through-lake touch: ${JSON.stringify(lakeCheck)}`);

  if (reportOnly) return null;
  const { file } = makeArtifact({
    id: w.id,
    chains,
    reachesUsed: usedMembers,
    perLp,
    opts: {
      throughLakeIds: w.throughLakeIds ?? canon.properties.throughLakeIds ?? null,
      allowOpenEnds: canon.properties.allowOpenEnds ?? true,
      notes: w.notes,
      pins,
      throughLakeTouch: lakeCheck,
    },
    before,
    canonicalProps: canon.properties,
    wmSet,
    take,
  });
  console.log(`   wrote ${file}`);
  return file;
}

function h2(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}

const written = [];
for (const w of WATERS) {
  if (want.size && !want.has(w.id)) continue;
  try {
    const f = traceOne(w);
    if (f) written.push(f);
  } catch (e) {
    console.log(`!! ${w.id}: ${String(e).slice(0, 400)}`);
  }
}
if (!reportOnly) console.log(`\nwrote ${written.length} artifacts to ${OUT}`);
