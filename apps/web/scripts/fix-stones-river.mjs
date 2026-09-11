// Rebuild the three Stones River waters from the NHDPlus HR take
// (.atlas-src/nhd/stones.geojson, fetched via fetch-nhd-targets.mjs stones).
//
// Problem (B13 follow-up, owner-verified 2026-09-05): the East and West Fork
// reaches stop short of each other and of Percy Priest Lake, leaving the
// named fishery visually broken between Murfreesboro and the dam.
//
// Method: weld each GNIS name's segments into maximal chains (4 dp endpoints,
// ~11 m snapping), keep the longest chain per fork, and rebuild stones-river
// from the main 'Stones River' stem (confluence -> through Percy Priest Lake
// via NHD artificial paths -> Cumberland mouth). Public domain (USGS).
// Run: node scripts/fix-stones-river.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const RIVERS = new URL('../public/atlas/rivers.geojson', import.meta.url);
const TAKE = new URL('../.atlas-src/nhd/stones.geojson', import.meta.url);
const SNAP = 2e-4; // ~22 m endpoint snap (source is 4 dp ≈ 11 m)

const atlas = JSON.parse(readFileSync(RIVERS, 'utf8'));
const take = JSON.parse(readFileSync(TAKE, 'utf8'));

const key = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lineLen = (line) => {
  let sum = 0;
  for (let i = 1; i < line.length; i++) sum += dist(line[i - 1], line[i]);
  return sum;
};

/** Weld segments sharing endpoints (within SNAP) into maximal chains. */
function weld(segments) {
  const chains = segments.map((s) => s.slice());
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < chains.length; i++) {
      for (let j = i + 1; j < chains.length; j++) {
        const a = chains[i];
        const b = chains[j];
        const combos = [
          [a[a.length - 1], b[0], () => [...a, ...b.slice(1)]],
          [a[a.length - 1], b[b.length - 1], () => [...a, ...b.reverse().slice(1)]],
          [a[0], b[b.length - 1], () => [...b, ...a.slice(1)]],
          [a[0], b[0], () => [...b.reverse(), ...a.slice(1)]],
        ];
        for (const [p, q, join] of combos) {
          if (dist(p, q) <= SNAP) {
            chains[i] = join();
            chains.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
  }
  return chains;
}

const byName = { 'East Fork Stones River': [], 'West Fork Stones River': [], 'Stones River': [] };
for (const f of take.features) {
  const name = f.properties.gnis_name;
  if (!byName[name]) continue;
  const geom = f.geometry;
  if (geom.type === 'LineString') byName[name].push(geom.coordinates);
  else if (geom.type === 'MultiLineString') byName[name].push(...geom.coordinates);
}

const chainsBy = {};
for (const [name, segs] of Object.entries(byName)) {
  const chains = weld(segs).sort((a, b) => lineLen(b) - lineLen(a));
  chainsBy[name] = chains;
  console.log(`${name}: ${segs.length} segs -> ${chains.length} chains; longest ${lineLen(chains[0]).toFixed(2)}°, next ${chains[1] ? lineLen(chains[1]).toFixed(2) : '-'}`);
}

// Longest chain per fork = the whole named reach.
const east = chainsBy['East Fork Stones River'][0];
const west = chainsBy['West Fork Stones River'][0];

// Main stem: NHD splits 'Stones River' at Percy Priest Dam — the through-lake
// chain and the below-dam chain end ~9 m apart (the dam structure itself).
// Drop degenerate fragments, then re-weld with a dam-tolerant snap so the
// main stem runs confluence -> lake -> dam -> Cumberland mouth unbroken.
const degenerate = (c) => c.length < 3 || lineLen(c) < 0.005;
const mainChains = chainsBy['Stones River'].filter((c) => !degenerate(c));
for (const c of chainsBy['Stones River']) if (degenerate(c)) console.log(`  dropped degenerate Stones fragment (${c.length} pts, ${lineLen(c).toFixed(4)}deg)`);
const DAM_SNAP = 1.2e-3;
const mainParts = mainChains.map((s) => s.slice());
{
  let m = true;
  while (m) {
    m = false;
    outer: for (let i = 0; i < mainParts.length; i++)
      for (let j = i + 1; j < mainParts.length; j++) {
        const a = mainParts[i], b = mainParts[j];
        const combos = [
          [a[a.length - 1], b[0], () => [...a, ...b.slice(1)]],
          [a[a.length - 1], b[b.length - 1], () => [...a, ...b.reverse().slice(1)]],
          [a[0], b[b.length - 1], () => [...b, ...a.slice(1)]],
          [a[0], b[0], () => [...b.reverse(), ...a.slice(1)]],
        ];
        for (const [p, q, join] of combos)
          if (dist(p, q) <= DAM_SNAP) { mainParts[i] = join(); mainParts.splice(j, 1); m = true; break outer; }
      }
  }
}
if (mainParts.length !== 1) throw new Error(`main stem did not weld to one chain (${mainParts.length} parts)`);
const main = mainParts[0];

// Connection audit: forks must meet each other and the main stem.
const eEnd = [east[east.length - 1], east[0]];
const wEnd = [west[west.length - 1], west[0]];
const sEnd = [main[0], main[main.length - 1]];
let best = Infinity;
for (const p of eEnd) for (const q of wEnd) best = Math.min(best, dist(p, q));
console.log(`fork-to-fork closest endpoints: ${(best * 111).toFixed(0)} m`);
let bestS = Infinity;
for (const p of eEnd) for (const q of sEnd) bestS = Math.min(bestS, dist(p, q));
for (const p of wEnd) for (const q of sEnd) bestS = Math.min(bestS, dist(p, q));
console.log(`fork-to-main closest endpoints: ${(bestS * 111).toFixed(0)} m`);

// Snap tiny confluence gaps (~<100 m) so the weld is seamless on the map.
function snapTo(chain, targets) {
  for (const end of [chain.length - 1, 0]) {
    for (const t of targets) {
      for (const p of t) {
        if (dist(chain[end], p) <= 1e-3) {
          chain[end] = p.slice();
          return;
        }
      }
    }
  }
}
snapTo(east, [west, main]);
snapTo(west, [east, main]);
snapTo(main, [east, west]);

function feature(id, name, chains, extraSource) {
  const f = atlas.features.find((x) => x.properties.id === id);
  const multi = { type: 'MultiLineString', coordinates: chains };
  let minX = 180, minY = 90, maxX = -180, maxY = -90, verts = 0;
  for (const line of chains)
    for (const p of line) {
      minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
      verts++;
    }
  f.geometry = multi;
  f.properties = {
    ...f.properties,
    bounds: [+minX.toFixed(4), +minY.toFixed(4), +maxX.toFixed(4), +maxY.toFixed(4)],
    source: ['nhd-hr', extraSource ?? 'welded chains (fix-stones-river 2026-09-05)'],
    partCount: chains.length,
    vertexCount: verts,
    approximate: false,
  };
  return f;
}

atlas.features.find((x) => x.properties.id === 'east-fork-stones-river');
feature('east-fork-stones-river', 'East Fork Stones River', [east]);
feature('west-fork-stones-river', 'West Fork Stones River', [west]);
feature('stones-river', 'Stones River', [main]);

writeFileSync(RIVERS, JSON.stringify(atlas));
console.log('rivers.geojson updated: east/west forks rebuilt, stones-river main stem rebuilt');
