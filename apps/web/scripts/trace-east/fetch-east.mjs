/* global URL, console, process */
// trace-east/fetch-east.mjs — EAST crew NHDPlus HR takes (own copy of the
// scripts/fetch-nhd-fixes.mjs pattern; shared files are not edited).
//
// Layer 3 = NetworkNHDFlowline with full VAA (hydroseq, levelpathi, pathlength...)
// fetched per water with a county/watershed-scoped envelope for same-name
// disambiguation, then whole-feature re-fetch by OBJECTID (never clipped).
// Takes -> .atlas-src/trace/east/takes/<key>.geojson
//
// Run: node scripts/trace-east/fetch-east.mjs [key ...]   (default: all not yet fetched)
import { fetchTake, TAKES_DIR } from './lib.mjs';
import { existsSync } from 'node:fs';

// envelope scoping notes (same-name disambiguation, fetch-nhd-fixes convention):
//  nolichucky   'Nolichucky River' — unique name; envelope caps the NC headwaters fetch
//  pigeon       'Pigeon River' exact — prefix LIKE would add Pigeon Roost/Creek; NC Canton reach included for state cut
//  holston      'Holston River' exact — 'South/North Fork Holston River' are separate targets/ids
//  little-river 'Little River' — common name; Blount County window (Little T confluence to the park)
//  little-pigeon 'Little Pigeon River' — Sevier County window
//  new-river    'New River' — Scott County window (THE New River VA/NC is far away)
//  daddys       'Daddys Creek' — Cumberland/Coffee window
export const TARGETS = [
  { key: 'nolichucky', gnis: 'Nolichucky River', env: '-83.35,35.90,-82.20,36.35', streams: ['nolichucky-river'] },
  { key: 'pigeon', gnis: 'Pigeon River', env: '-83.35,35.55,-82.85,36.15', streams: ['pigeon-river'] },
  { key: 'french-broad', gnis: 'French Broad River', env: '-84.00,35.70,-82.90,36.15', streams: ['french-broad-river'] },
  { key: 'little-pigeon', gnis: 'Little Pigeon River', env: '-83.70,35.60,-83.35,35.95', streams: ['little-pigeon-river'] },
  { key: 'hiwassee', gnis: 'Hiwassee River', env: '-85.10,34.90,-84.25,35.55', streams: ['hiwassee-river'] },
  { key: 'ocoee', gnis: 'Ocoee River', env: '-84.95,34.90,-84.30,35.25', streams: ['ocoee-river'] },
  { key: 'clinch', gnis: 'Clinch River', env: '-84.60,35.80,-82.60,36.80', streams: ['clinch-river'] },
  { key: 'powell', gnis: 'Powell River', env: '-84.20,36.25,-83.05,36.75', streams: ['powell-river'] },
  { key: 'holston', gnis: 'Holston River', env: '-83.95,35.85,-82.25,36.70', streams: ['holston-river'] },
  { key: 'nf-holston', gnis: 'North Fork Holston River', env: '-82.95,36.40,-82.00,37.00', streams: ['north-fork-holston-river'] },
  { key: 'sf-holston', gnis: 'South Fork Holston River', env: '-82.50,36.25,-81.80,36.75', streams: ['south-holston-river'] },
  { key: 'watauga', gnis: 'Watauga River', env: '-82.45,36.15,-81.85,36.55', streams: ['watauga-river'] },
  { key: 'new-river', gnis: 'New River', env: '-84.75,36.05,-84.25,36.50', streams: ['new-river'] },
  { key: 'little-river', gnis: 'Little River', env: '-84.05,35.55,-83.40,35.95', streams: ['little-river'] },
  { key: 'emory', gnis: 'Emory River', env: '-84.80,35.80,-84.35,36.30', streams: ['emory-river'] },
  { key: 'daddys', gnis: 'Daddys Creek', env: '-85.25,35.70,-84.70,36.15', streams: ['daddys-creek'] },
  { key: 'obed', gnis: 'Obed River', env: '-85.25,35.75,-84.55,36.15', streams: ['obed-river'] },
  { key: 'sf-cumberland', gnis: 'Big South Fork Cumberland River', env: '-84.80,36.28,-84.45,36.70', streams: ['south-fork-cumberland'] },
  { key: 'roan', gnis: 'Roan Creek', env: '-82.05,36.30,-81.55,36.50', streams: ['upper-roan-creek'] },
  { key: 'sequatchie', gnis: 'Sequatchie River', env: '-85.75,35.00,-84.90,35.90', streams: ['sequatchie-river'] },
];

const FCODE_WHERE = `(fcode=46006 OR fcode=46003 OR fcode=55800)`;
const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--')));

for (const t of TARGETS.filter((t) => !only.size || only.has(t.key))) {
  const path = new URL(`${t.key}.geojson`, TAKES_DIR);
  const fresh = process.argv.includes('--refetch') ? false : existsSync(path);
  console.log(`== ${t.key} gnis=[${t.gnis}] env=${t.env}${fresh ? ' (cached, skip)' : ''}`);
  if (fresh) continue;
  const feats = await fetchTake({
    key: t.key,
    where: `${FCODE_WHERE} AND gnis_name = '${t.gnis}'`,
    env: t.env,
  });
  if (!feats.length) {
    console.log(`  0 features with exact name — retrying prefix LIKE '${t.gnis.split(' ')[0]}%'`);
    await fetchTake({
      key: t.key,
      where: `${FCODE_WHERE} AND gnis_name LIKE '${t.gnis.split(' ')[0]}%'`,
      env: t.env,
    });
  }
}
console.log('east takes complete.');
