// Build public/atlas/roads-{major,mid,minor}.geojson + roads-manifest.json
// from Census TIGER/Line 2024 ROADS ("All Roads") — public domain (US
// Government work; verdict in docs/roads-sources.md). Context cartography for
// the angling basemap, NOT navigation: whole-part Tennessee clip, welded
// same-name chains (endpoint-exact at 5dp, no invented coordinates), per-LOD
// Douglas–Peucker simplification with endpoints preserved, per-LOD coordinate
// rounding, escalating until the size gate is met.
//
// Coverage decisions (measured against TIGER 2024, all documented in
// docs/roads-sources.md):
// - TIGER stores local streets (S1400) as single per-block edges — ~296k
//   statewide with no weldable adjacency (75% of name groups are single-edge),
//   so full local-street fabric cannot fit any sane asset budget (~40+ MB
//   before simplification does anything). mid therefore keeps S1400 CHAINS of
//   at least a length threshold (rural through-roads) plus all ramps/service
//   drives; dense urban block fabric is out of scope for this layer.
// - Non-through vehicular classes are dropped outright: S1730 alleys,
//   S1740 private service roads (gated logging roads), S1750 private
//   driveways, S1780 parking-lot roads, S1710 walkways.
//
// Property conventions: per-feature properties stay minimal ({mtfcc, name})
// because roads are uniform single-source geometry — file-level provenance
// lives in roads-manifest.json (same pattern as the topo manifest). Repeating
// the rivers-style per-feature source/crs/coordinateOrder fields would add
// ~90 bytes × ~300k features of pure convention text and sink the size gate.
// Per-feature ids are omitted for the same reason (no consumer addresses a
// road feature by id); add them with the same weld ordering if a future lane
// ever needs stable road ids.
//
// Run: node scripts/build-roads.mjs
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { open as openShapefile } from 'shapefile';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '..');
const shpDir = join(webDir, '.atlas-src', 'roadshp');
const atlasDir = join(webDir, 'public', 'atlas');
const TARGET_BYTES = 6 * 1000 * 1000; // aim ≤ 6 MB raw across all roads files

const KEY_DP = 1e5; // welding-key precision: 5dp ≈ 1.1 m
const M_PER_DEG_LAT = 110574;

// LOD classification by MTFCC (docs/roads-sources.md has the full table).
const MAJOR_MTFCC = new Set(['S1100', 'S1200']);
const MID_MTFCC = new Set(['S1400', 'S1630', 'S1640']);
const MINOR_MTFCC = new Set(['S1500', 'S1820', 'S1830']);
const DROPPED_MTFCC = new Set(['S1710', 'S1730', 'S1740', 'S1750', 'S1780']);

function lodOf(mtfcc) {
  if (MAJOR_MTFCC.has(mtfcc)) return 'major';
  if (MID_MTFCC.has(mtfcc)) return 'mid';
  if (MINOR_MTFCC.has(mtfcc)) return 'minor';
  if (DROPPED_MTFCC.has(mtfcc)) return 'drop';
  return 'drop';
}

// --- Tennessee clip: whole-part rejection against the published boundary ---
// ring + BUFFER_M tolerance (cartographic boundary vs legal road edges can
// disagree by a few hundred meters along generalized border segments).
const BUFFER_M = 1000;
const boundary = JSON.parse(readFileSync(join(atlasDir, 'tn-boundary.geojson'), 'utf8'));
const ringLL = boundary.features[0].geometry.coordinates[0];
const ring = [];
for (const [x, y] of ringLL) ring.push(x, y);

// Even-odd point-in-ring with a latitude-band edge index (O(1) per query).
function buildPointInRing(ring) {
  const BAND = 0.002;
  let minLat = Infinity, maxLat = -Infinity;
  for (let i = 1; i < ring.length; i += 2) {
    if (ring[i] < minLat) minLat = ring[i];
    if (ring[i] > maxLat) maxLat = ring[i];
  }
  const nBands = Math.ceil((maxLat - minLat) / BAND) + 1;
  const bands = Array.from({ length: nBands }, () => []);
  const closed = ring[0] === ring[ring.length - 2] && ring[1] === ring[ring.length - 1];
  const last = ring.length - (closed ? 2 : 0);
  for (let i = 0; i < last; i += 2) {
    const x1 = ring[i], y1 = ring[i + 1];
    const j = (i + 2) % ring.length;
    const x2 = ring[j], y2 = ring[j + 1];
    if (y1 === y2) continue;
    const b0 = Math.max(0, Math.floor((Math.min(y1, y2) - minLat) / BAND));
    const b1 = Math.min(nBands - 1, Math.floor((Math.max(y1, y2) - minLat) / BAND));
    for (let b = b0; b <= b1; b++) bands[b].push(i);
  }
  return function inside(x, y) {
    if (y < minLat || y > maxLat) return false;
    const list = bands[Math.min(nBands - 1, Math.max(0, Math.floor((y - minLat) / BAND)))];
    let cross = 0;
    for (const i of list) {
      const x1 = ring[i], y1 = ring[i + 1];
      const j = (i + 2) % ring.length;
      const x2 = ring[j], y2 = ring[j + 1];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        const t = (y - y1) / (y2 - y1);
        if (x1 + t * (x2 - x1) < x) cross++;
      }
    }
    return (cross & 1) === 1;
  };
}
const inside = buildPointInRing(ring);

function distToRingMeters(x, y) {
  const cosLat = Math.cos((y * Math.PI) / 180);
  const px = x * cosLat, py = y;
  let best = Infinity;
  const closed = ring[0] === ring[ring.length - 2] && ring[1] === ring[ring.length - 1];
  const last = ring.length - (closed ? 2 : 0);
  for (let i = 0; i < last; i += 2) {
    const j = (i + 2) % ring.length;
    const ax = ring[i] * cosLat, ay = ring[i + 1];
    const bx = ring[j] * cosLat, by = ring[j + 1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = px - (ax + t * dx), ey = py - (ay + t * dy);
    const d2 = ex * ex + ey * ey;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best) * M_PER_DEG_LAT;
}

const allowed = (x, y) => inside(x, y) || distToRingMeters(x, y) <= BUFFER_M;

// --- Douglas–Peucker on flat [x,y,...] arrays, endpoints always kept ---
function rdpFlat(f, tol) {
  const n = f.length / 2;
  if (n <= 2) return f;
  const keep = new Uint8Array(n);
  keep[0] = 1; keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  const tol2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const ax = f[2 * a], ay = f[2 * a + 1], bx = f[2 * b], by = f[2 * b + 1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let idx = -1, maxD2 = 0;
    for (let i = a + 1; i < b; i++) {
      const px = f[2 * i], py = f[2 * i + 1];
      let d2;
      if (len2 === 0) {
        const ex = px - ax, ey = py - ay;
        d2 = ex * ex + ey * ey;
      } else {
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = px - (ax + t * dx), ey = py - (ay + t * dy);
        d2 = ex * ex + ey * ey;
      }
      if (d2 > maxD2) { maxD2 = d2; idx = i; }
    }
    if (maxD2 > tol2) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(f[2 * i], f[2 * i + 1]);
  return out;
}

// --- Fetch/read phase -------------------------------------------------------
if (!existsSync(shpDir) || readdirSync(shpDir).filter((n) => n.endsWith('.shp')).length === 0) {
  console.error('build-roads: no TIGER ROADS shapefiles — run `node scripts/fetch-roads.mjs` first.');
  process.exit(1);
}

// groups: key `${mtfcc}|${name}` → { mtfcc, name, lod, segs: [flat,...] }
const groups = new Map();
const mtfccCounts = new Map();
let keptSegs = 0, keptVerts = 0, rejectedParts = 0, keptParts = 0, droppedFeatures = 0;

for (const f of readdirSync(shpDir).filter((n) => n.endsWith('.shp')).sort()) {
  const src = await openShapefile(join(shpDir, f));
  let rec;
  while ((rec = await src.read()).done === false) {
    const mtfcc = String(rec.value.properties.MTFCC ?? '');
    mtfccCounts.set(mtfcc, (mtfccCounts.get(mtfcc) ?? 0) + 1);
    const lod = lodOf(mtfcc);
    if (lod === 'drop') { droppedFeatures++; continue; }
    const g = rec.value.geometry;
    const parts = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    const name = String(rec.value.properties.FULLNAME ?? '').trim();
    for (const part of parts) {
      const flat = [];
      let px = NaN, py = NaN;
      let outside = false;
      for (const pt of part) {
        const x = Math.round(pt[0] * KEY_DP) / KEY_DP;
        const y = Math.round(pt[1] * KEY_DP) / KEY_DP;
        if (x === px && y === py) continue;
        if (!allowed(x, y)) { outside = true; break; }
        flat.push(x, y);
        px = x; py = y;
      }
      if (outside) { rejectedParts++; continue; }
      if (flat.length < 4) continue;
      const key = `${mtfcc}|${name}`;
      let grp = groups.get(key);
      if (!grp) { grp = { mtfcc, name, lod, segs: [] }; groups.set(key, grp); }
      grp.segs.push(flat);
      keptParts++; keptSegs++; keptVerts += flat.length / 2;
    }
  }
}

// --- Welding: endpoint-exact chains within (MTFCC, FULLNAME) groups ---------
// Greedy continuation at forks (first unused candidate in insertion order);
// only existing endpoints are joined — no coordinates are invented.
function weldGroup(segs) {
  const used = new Uint8Array(segs.length);
  const endpointMap = new Map();
  const pushEnd = (key, si) => {
    let list = endpointMap.get(key);
    if (!list) { list = []; endpointMap.set(key, list); }
    list.push(si);
  };
  segs.forEach((s, i) => {
    pushEnd(`${s[0]},${s[1]}`, i);
    pushEnd(`${s[s.length - 2]},${s[s.length - 1]}`, i);
  });
  // Straightest continuation: among unused candidates at `key`, prefer the one
  // whose far end continues the incoming direction (smallest turn). Without
  // this the greedy walk zigzags between parallel carriageways at shared nodes
  // and produces out-and-back paths that RDP then over-collapses. Ties keep
  // insertion order (deterministic). (fromX,fromY) is the chain-side neighbor.
  const pickStraightest = (key, fromX, fromY) => {
    const cands = endpointMap.get(key);
    if (!cands) return -1;
    const comma = key.indexOf(',');
    const tx = +key.slice(0, comma), ty = +key.slice(comma + 1);
    const inX = tx - fromX, inY = ty - fromY;
    const inLen = Math.hypot(inX, inY) || 1e-12;
    let best = -1, bestScore = -Infinity;
    for (const si of cands) {
      if (used[si]) continue;
      const s = segs[si];
      const forward = `${s[0]},${s[1]}` === key;
      const fx = forward ? s[s.length - 2] : s[0];
      const fy = forward ? s[s.length - 1] : s[1];
      const outX = fx - tx, outY = fy - ty;
      const outLen = Math.hypot(outX, outY) || 1e-12;
      const score = (inX * outX + inY * outY) / (inLen * outLen);
      if (score > bestScore) { bestScore = score; best = si; }
    }
    return best;
  };
  const chains = [];
  // Corridor self-proximity: coarse grid of the chain's own vertices (~55 m
  // cells). Used to refuse walk steps that double back over ground the chain
  // already covered — a forced reverse-carriageway step at a dead-end node
  // would otherwise create an out-and-back path that RDP then collapses into a
  // single long chord, silently erasing both carriageways' geometry.
  const CELL = 0.0005;
  const newCorridor = (flat) => {
    const grid = new Map();
    const add = (x, y) => {
      const k = `${Math.round(x / CELL)},${Math.round(y / CELL)}`;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push([x, y]);
    };
    for (let k = 0; k < flat.length; k += 2) add(flat[k], flat[k + 1]);
    return {
      add,
      near(x, y) {
        const gx = Math.round(x / CELL), gy = Math.round(y / CELL);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const list = grid.get(`${gx + dx},${gy + dy}`);
          if (!list) continue;
          for (const [px, py] of list) {
            if (Math.hypot((px - x) * 88000, (py - y) * 111000) < 60) return true;
          }
        }
        return false;
      },
    };
  };
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const chain = segs[i].slice();
    const corridor = newCorridor(chain);
    for (;;) { // extend tail (moves with each append)
      const n = chain.length;
      const pick = pickStraightest(`${chain[n - 2]},${chain[n - 1]}`, chain[n - 4], chain[n - 3]);
      if (pick < 0) break;
      const cand = segs[pick];
      const cForward = `${cand[0]},${cand[1]}` === `${chain[n - 2]},${chain[n - 1]}`;
      const fx = cForward ? cand[cand.length - 2] : cand[0];
      const fy = cForward ? cand[cand.length - 1] : cand[1];
      // refusal test BEFORE consuming: sharp reversal (cos < -0.5) whose far
      // end lands back on the chain's own corridor = an out-and-back walk.
      const inX = chain[n - 2] - chain[n - 4], inY = chain[n - 1] - chain[n - 3];
      const outX = fx - chain[n - 2], outY = fy - chain[n - 1];
      const turn = (inX * outX + inY * outY) / ((Math.hypot(inX, inY) || 1e-12) * (Math.hypot(outX, outY) || 1e-12));
      if (turn < -0.5 && corridor.near(fx, fy)) break;
      used[pick] = 1;
      const s = cand;
      if (cForward) for (let k = 2; k < s.length; k++) { chain.push(s[k]); }
      else for (let k = s.length - 4; k >= 0; k -= 2) chain.push(s[k], s[k + 1]);
      corridor.add(chain[chain.length - 2], chain[chain.length - 1]);
    }
    const headPieces = [];
    let headKey = `${chain[0]},${chain[1]}`;
    for (;;) { // extend head (collect oriented pieces, then assemble once)
      const pick = pickStraightest(headKey, chain[2], chain[3]);
      if (pick < 0) break;
      const cand = segs[pick];
      const endMatches = `${cand[cand.length - 2]},${cand[cand.length - 1]}` === headKey;
      const fx = endMatches ? cand[0] : cand[cand.length - 2];
      const fy = endMatches ? cand[1] : cand[cand.length - 1];
      const inX = chain[0] - chain[2], inY = chain[1] - chain[3];
      const outX = fx - chain[0], outY = fy - chain[1];
      const turn = (inX * outX + inY * outY) / ((Math.hypot(inX, inY) || 1e-12) * (Math.hypot(outX, outY) || 1e-12));
      if (turn < -0.5 && corridor.near(fx, fy)) break;
      used[pick] = 1;
      headPieces.push({ s: cand, endMatches });
      headKey = endMatches ? `${cand[0]},${cand[1]}` : `${cand[cand.length - 2]},${cand[cand.length - 1]}`;
      // head pieces are prepended later; their vertices join the corridor then
      for (let k = 0; k < cand.length; k += 2) corridor.add(cand[k], cand[k + 1]);
    }
    let out = chain;
    // prepend in PICK order: piece h+1 attaches to the far end of piece h,
    // i.e. to the LEFT edge of what's assembled so far. Iterating descending
    // would mirror the walk and splice far-apart sections together.
    for (let h = 0; h < headPieces.length; h++) {
      const { s, endMatches } = headPieces[h];
      out = (endMatches ? s : reverseFlat(s)).concat(out);
    }
    if (out.length >= 4) chains.push(out);
  }
  return chains;
}

// Reverse a flat [x,y,...] polyline preserving coordinate pairs —
// Array.prototype.reverse() would swap every pair into [y,x].
function reverseFlat(f) {
  const out = new Array(f.length);
  const n = f.length / 2;
  for (let i = 0; i < n; i++) {
    out[2 * i] = f[2 * (n - 1 - i)];
    out[2 * i + 1] = f[2 * (n - 1 - i) + 1];
  }
  return out;
}

function chainLengthMeters(flat) {
  let total = 0;
  for (let k = 2; k < flat.length; k += 2) {
    const lat = (flat[k + 1] + flat[k - 1]) / 2;
    const dx = (flat[k] - flat[k - 2]) * 111320 * Math.cos((lat * Math.PI) / 180);
    const dy = (flat[k + 1] - flat[k - 1]) * M_PER_DEG_LAT;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

const LODS = ['major', 'mid', 'minor'];
const chainsByLod = new Map(LODS.map((l) => [l, []]));
let weldedChains = 0;
for (const grp of groups.values()) {
  for (const chain of weldGroup(grp.segs)) {
    chainsByLod.get(grp.lod).push({ flat: chain, mtfcc: grp.mtfcc, name: grp.name, meters: chainLengthMeters(chain) });
    weldedChains++;
  }
}

// --- Escalation ladder: settle coarsest-LOD-first until the size gate holds --
// The mid knob is the S1400 minimum chain length (rural through-roads stay,
// short urban block fabric goes); ramps/service drives are exempt.
const THRESHOLD_EXEMPT = new Set(['S1630', 'S1640']);
const LADDER = [
  { label: 'base (mid ≥ 800 m)', minChainM: 800, rdp: { major: 0.0003, mid: 0.0008, minor: 0.0012 } },
  { label: 'rung1 (mid ≥ 1200 m)', minChainM: 1200, rdp: { major: 0.0003, mid: 0.001, minor: 0.0016 } },
  { label: 'rung2 (mid ≥ 2000 m)', minChainM: 2000, rdp: { major: 0.0004, mid: 0.0012, minor: 0.002 } },
  { label: 'rung3 (mid ≥ 3200 m)', minChainM: 3200, rdp: { major: 0.0005, mid: 0.0016, minor: 0.0025 } },
];
const PRECISION_DP = { major: 5, mid: 4, minor: 4 };

function buildFile(lod, rung) {
  const rdp = rung.rdp[lod];
  const dp = 10 ** PRECISION_DP[lod];
  // Collapse chains into one feature per (MTFCC, FULLNAME) group — the repo's
  // MultiLineString convention (rivers.geojson ships partCount > 1 features).
  // Same geometry, far fewer JSON feature wrappers.
  const byGroup = new Map();
  for (const c of chainsByLod.get(lod)) {
    if (lod === 'mid' && !THRESHOLD_EXEMPT.has(c.mtfcc) && c.meters < rung.minChainM) continue;
    let flat = rdpFlat(c.flat, rdp);
    const coords = [];
    let px = NaN, py = NaN;
    for (let k = 0; k < flat.length; k += 2) {
      const x = Math.round(flat[k] * dp) / dp;
      const y = Math.round(flat[k + 1] * dp) / dp;
      if (x === px && y === py) continue;
      coords.push([x, y]);
      px = x; py = y;
    }
    if (coords.length < 2) continue;
    const key = `${c.mtfcc}|${c.name}`;
    let entry = byGroup.get(key);
    if (!entry) {
      entry = { mtfcc: c.mtfcc, name: c.name, parts: [], verts: 0, bbox: [Infinity, Infinity, -Infinity, -Infinity] };
      byGroup.set(key, entry);
    }
    entry.parts.push(coords);
    entry.verts += coords.length;
    for (const [x, y] of coords) {
      if (x < entry.bbox[0]) entry.bbox[0] = x;
      if (y < entry.bbox[1]) entry.bbox[1] = y;
      if (x > entry.bbox[2]) entry.bbox[2] = x;
      if (y > entry.bbox[3]) entry.bbox[3] = y;
    }
  }
  const entries = [...byGroup.values()].sort((a, z) =>
    a.name.localeCompare(z.name) || a.mtfcc.localeCompare(z.mtfcc) ||
    a.bbox[0] - z.bbox[0] || a.bbox[1] - z.bbox[1]);
  const fileBbox = [Infinity, Infinity, -Infinity, -Infinity];
  let vertices = 0;
  const clean = entries.map((e) => {
    for (let i = 0; i < 2; i++) {
      if (e.bbox[i] < fileBbox[i]) fileBbox[i] = e.bbox[i];
      if (e.bbox[i + 2] > fileBbox[i + 2]) fileBbox[i + 2] = e.bbox[i + 2];
    }
    vertices += e.verts;
    const properties = { mtfcc: e.mtfcc };
    if (e.name) properties.name = e.name;
    return {
      type: 'Feature',
      properties,
      geometry: {
        type: e.parts.length === 1 ? 'LineString' : 'MultiLineString',
        coordinates: e.parts.length === 1 ? e.parts[0] : e.parts,
      },
    };
  });
  const json = `${JSON.stringify({ type: 'FeatureCollection', features: clean })}\n`;
  return { json, bytes: Buffer.byteLength(json, 'utf8'), features: clean.length, vertices, bbox: fileBbox };
}

let settled = null;
const attempts = [];
for (const rung of LADDER) {
  const files = LODS.map((lod) => ({ lod, ...buildFile(lod, rung) }));
  const total = files.reduce((s, f) => s + f.bytes, 0);
  attempts.push({ label: rung.label, totalBytes: total, perFileBytes: Object.fromEntries(files.map((f) => [f.lod, f.bytes])) });
  console.log(`ladder ${rung.label}: ${files.map((f) => `${f.lod} ${(f.bytes / 1048576).toFixed(2)} MB (${f.features} features)`).join('  ')}  total ${(total / 1048576).toFixed(2)} MB`);
  settled = { rung, files, total };
  if (total <= TARGET_BYTES) break;
}
if (settled.total > TARGET_BYTES) {
  console.warn(`build-roads: WARN — size gate not met at the coarsest ladder rung (${(settled.total / 1048576).toFixed(2)} MB > ${TARGET_BYTES / 1e6} MB). Report per docs/roads-sources.md; do NOT adopt restricted sources.`);
}

// --- Write (stale roads files removed first) --------------------------------
for (const f of readdirSync(atlasDir)) {
  if (/^roads-(major|mid|minor)\.geojson$|^roads-manifest\.json$/.test(f)) {
    rmSync(join(atlasDir, f));
  }
}
for (const f of settled.files) {
  writeFileSync(join(atlasDir, `roads-${f.lod}.geojson`), f.json);
}

const manifest = {
  generated: new Date().toISOString().slice(0, 10),
  source: {
    dataset: 'Census TIGER/Line 2024 ROADS (All Roads), Tennessee per-county shapefiles',
    urls: 'https://www2.census.gov/geo/tiger/TIGER2024/ROADS/tl_2024_47NNN_roads.zip (FIPS 47001..47189)',
    license: 'Public domain (US Government work, 17 U.S.C. § 105)',
    licenseDoc: 'docs/roads-sources.md',
  },
  clip: { mask: 'public/atlas/tn-boundary.geojson', bufferM: BUFFER_M, rule: 'whole-part rejection' },
  lod: {
    major: ['S1100', 'S1200'],
    mid: ['S1400 (chains ≥ settled minChainM)', 'S1630 (ramps)', 'S1640 (service drives)'],
    minor: ['S1500 (vehicular trails)', 'S1820', 'S1830'],
    dropped: {
      mtfcc: ['S1710', 'S1730', 'S1740', 'S1750', 'S1780'],
      meaning: 'walkways, alleys, private service roads, private driveways, parking-lot roads',
      features: droppedFeatures,
    },
  },
  welding: 'endpoint-exact at 5dp within (MTFCC, FULLNAME) groups; greedy continuation at forks; no invented coordinates',
  ladder: { settled: settled.rung.label, targetBytes: TARGET_BYTES, attempts, minChainM: settled.rung.minChainM },
  files: settled.files.map((f) => ({
    file: `roads-${f.lod}.geojson`,
    lod: f.lod,
    bytes: f.bytes,
    features: f.features,
    vertices: f.vertices,
    bbox: f.bbox.map((v) => Math.round(v * 1e5) / 1e5),
    rdpDeg: settled.rung.rdp[f.lod],
    precisionDp: PRECISION_DP[f.lod],
  })),
  totals: {
    bytes: settled.total,
    features: settled.files.reduce((s, f) => s + f.features, 0),
    vertices: settled.files.reduce((s, f) => s + f.vertices, 0),
  },
  counts: {
    sourceSegments: keptSegs,
    sourceVertices: keptVerts,
    keptParts,
    rejectedPartsOutsideTn: rejectedParts,
    weldedChains,
    mtfccHistogram: Object.fromEntries([...mtfccCounts.entries()].sort()),
  },
};
writeFileSync(join(atlasDir, 'roads-manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);

console.log(`roads: ${manifest.totals.features} features / ${manifest.totals.vertices} verts / ${(settled.total / 1048576).toFixed(2)} MB (settled: ${settled.rung.label})`);
console.log(`clip: kept ${keptParts} parts, rejected ${rejectedParts} outside TN+${BUFFER_M}m; dropped ${droppedFeatures} non-through features; welded ${weldedChains} chains from ${keptSegs} segments`);
