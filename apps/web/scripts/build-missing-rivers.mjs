// B15: real channel geometry for the 8 inventory rivers whose geometryStatus is
// 'missing-line' (docs/waterbody-inventory.json: mississippi-river, obion-river,
// hatchie-river, wolf-river-west-tennessee, tennessee-river, cumberland-river,
// buffalo-river, holston-river).
//
// Source: USGS NHDPlus HR named flowlines fetched by fetch-nhd-targets.mjs
// (public domain). No synthetic coordinates. Assembly discipline mirrors
// merge-rivers.mjs exactly: whole-part Tennessee filter (a part is kept only
// when EVERY vertex is inside the state boundary polygon — no interior
// coordinate deletion), same CLIP rectangle, same RDP tolerance.
//
// These ids are NOT in the content catalog yet (catalog lane owns
// packages/content), so merge-rivers.mjs cannot emit them; this step instead
// APPENDS contract-shaped features to public/atlas/rivers.geojson and never
// touches an existing feature. Idempotent: ids already present are skipped.
//
// Mississippi rule: the feature is the state-boundary corridor. Only mainstem
// parts ON the Tennessee line are kept — a vertex may sit at most CORRIDOR_M
// west of the boundary polygon (the channel itself), never the Arkansas/
// Mississippi backwater complex beyond it.
//
// Run: node scripts/build-missing-rivers.mjs            (all rows)
//      ONLY=mississippi-river node scripts/build-missing-rivers.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webDir = join(here, '..');
const ROOT = join(webDir, '..', '..');
const NHD = join(webDir, '.atlas-src', 'nhd');
const OUT = join(webDir, '.atlas-src', 'out');
const CLIP = [-90.6, 34.98, -81.45, 36.75]; // [minLon,minLat,maxLon,maxLat]
// Mississippi state-line corridor: max excursion beyond the boundary for an
// out-of-state vertex. Measured 2026-09-04 against the committed tn-boundary:
// 168/225 out-of-test mainstem vertices sit within 1 km (channel straddles the
// survey line); everything beyond 4 km is Kentucky water north of the slanting
// border (lat >= 36.53, also excluded by CORRIDOR_MAX_LAT) or Mississippi
// water south of the state's SW corner. The 2-4 km band is mainstem channel
// where the census line cuts inside a bend — still the named river, not
// Arkansas backwater (only 'Mississippi River' named flowlines are fetched).
const CORRIDOR_M = 4000;
// Mississippi corridor hard north cap: the KY line crosses the channel at
// ~36.50 (tn-boundary vertex -89.539,36.498); corridor vertices above this
// latitude are Kentucky water and reject the whole part.
const CORRIDOR_MAX_LAT = 36.51;
// Two NHD endpoints closer than this are the same network vertex (4dp fetch
// precision jitters ~1e-4 deg); real gaps are orders of magnitude larger.
const WELD_EPS = 0.0005;
const M_PER_DEG = 111320;

// Inventory is authoritative for ids and names — never renamed here.
const inventory = JSON.parse(readFileSync(join(ROOT, 'docs', 'waterbody-inventory.json'), 'utf8'));
const only = new Set((process.env.ONLY ?? '').split(',').filter(Boolean));
const rows = inventory.waterbodies.filter((w) => w.type === 'river' && w.geometryStatus === 'missing-line' && (!only.size || only.has(w.proposedFeatureId)));

// Per-river NHD takes: file key(s) in .atlas-src/nhd -> accepted gnis_name(s).
// Exact-name takes keep sibling features OUT (Little Buffalo River, South Fork
// Holston River, North Fork Obion River … are distinct waters).
const RIVERS = {
  'mississippi-river': { files: ['mississippi'], take: { 'Mississippi River': true }, corridor: true },
  'obion-river': { files: ['obion'], take: { 'Obion River': true } },
  'hatchie-river': { files: ['hatchie'], take: { 'Hatchie River': true } },
  'wolf-river-west-tennessee': { files: ['wolf-west'], take: { 'Wolf River': true } },
  'tennessee-river': { files: ['tennessee-river-east', 'tennessee-river-west'], take: { 'Tennessee River': true } },
  'cumberland-river': { files: ['cumberland-upper', 'cumberland-lower'], take: { 'Cumberland River': true } },
  'buffalo-river': { files: ['buffalo'], take: { 'Buffalo River': true } },
  'holston-river': { files: ['holston'], take: { 'Holston River': true } },
};

// ---- state boundary (committed asset, same file merge-rivers uses) ----
const tnBoundary = JSON.parse(readFileSync(join(webDir, 'public', 'atlas', 'tn-boundary.geojson'), 'utf8'));
const TN_RINGS = [];
{
  const g = tnBoundary.features?.[0]?.geometry ?? tnBoundary.geometry;
  for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
    for (const ring of poly) TN_RINGS.push(ring);
  }
}
function inTennessee([x, y]) {
  let inside = false;
  for (const ring of TN_RINGS) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
// Shortest distance (meters, equirectangular local metric) from a point to the
// boundary rings. Only used for vertices that failed the inside test.
function distToBoundaryM([x, y]) {
  let best = Infinity;
  const kx = Math.cos((y * Math.PI) / 180) * M_PER_DEG;
  for (const ring of TN_RINGS) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[j];
      let dx = x2 - x1, dy = y2 - y1;
      let t = dx || dy ? ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy) : 0;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + dx * t, py = y1 + dy * t;
      const ddx = (x - px) * kx, ddy = (y - py) * M_PER_DEG;
      const d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d < best) best = d;
    }
  }
  return best;
}

// ---- helpers mirrored from merge-rivers.mjs (same constants/discipline) ----
function okPt(x, y) {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 180 && Math.abs(y) <= 90;
}
function inClip([x, y]) {
  return x >= CLIP[0] && y >= CLIP[1] && x <= CLIP[2] && y <= CLIP[3];
}
function pointSegmentDistSq([x, y], [x1, y1], [x2, y2]) {
  let dx = x2 - x1, dy = y2 - y1;
  if (dx || dy) {
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    x1 += dx * t; y1 += dy * t;
  }
  dx = x - x1; dy = y - y1;
  return dx * dx + dy * dy;
}
function simplifyRdp(points, epsilon) {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length); keep[0] = 1; keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  const sq = epsilon * epsilon;
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = sq, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = pointSegmentDistSq(points[i], points[a], points[b]);
      if (d > best) { best = d; idx = i; }
    }
    if (idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return points.filter((_, i) => keep[i]);
}
function cleanLines(parts) {
  const out = [];
  for (const part of parts) {
    // Reject the whole source part rather than deleting an interior coordinate;
    // deleting an interior point can manufacture a straight connector segment.
    if (!Array.isArray(part) || part.length < 2 || !part.every(([x, y]) => okPt(x, y) && inClip([x, y]))) continue;
    // 4dp truncation can collapse short fetch pieces to a zero-length point
    // pair; dedupe first so those vanish instead of shipping empty parts.
    const pts = simplifyRdp(dedupeConsecutive(part), 0.00012);
    if (pts.length >= 2) out.push(pts);
  }
  return out;
}

// ---- per-river assembly ----
const summary = [];
const newFeatures = [];
let failures = 0;
for (const row of rows) {
  const id = row.proposedFeatureId;
  const cfg = RIVERS[id];
  if (!cfg) { summary.push(`${id}: UNRESOLVED (no take map for inventory row)`); failures++; continue; }
  // collect + dedupe source features across the (possibly split) envelopes
  const seen = new Set();
  let feats = [];
  let fetched = 0;
  for (const key of cfg.files) {
    let file = [];
    try { file = JSON.parse(readFileSync(join(NHD, `${key}.geojson`), 'utf8')).features ?? []; } catch { file = []; }
    fetched += file.length;
    for (const f of file) {
      const p = f.properties ?? {};
      const dedupeKey = `${p.gnis_id ?? ''}|${p.nhdplusid ?? ''}|${p.reachcode ?? ''}|${f.geometry?.coordinates?.[0]?.[0] ?? ''}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      feats.push(f);
    }
  }
  let parts = [];
  for (const f of feats) {
    if (!cfg.take[f.properties.gnis_name]) continue;
    const g = f.geometry;
    if (g.type !== 'LineString' && g.type !== 'MultiLineString') continue;
    for (const part of g.type === 'LineString' ? [g.coordinates] : g.coordinates) {
      // whole-part Tennessee filter (merge-rivers discipline)
      if (!partInTn(part, cfg.corridor)) continue;
      parts.push(part);
    }
  }
  parts = cleanLines(weldParts(parts));
  if (!parts.length) { summary.push(`${id}: UNRESOLVED (0 kept parts from ${fetched} fetched NHD features)`); failures++; continue; }
  const bb = [1e9, 1e9, -1e9, -1e9];
  let verts = 0;
  let longest = parts[0];
  for (const p of parts) {
    if (p.length > longest.length) longest = p;
    for (const [x, y] of p) {
      if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y;
      if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y;
    }
    verts += p.length;
  }
  const anchor = longest[Math.floor(longest.length / 2)];
  const feature = {
    type: 'Feature',
    properties: {
      id,
      name: row.normalizedName,
      waterbodyType: 'river',
      source: ['nhd-hr'],
      approximate: false,
      bounds: bb,
      labelAnchor: anchor,
      crs: 'EPSG:4326',
      coordinateOrder: 'longitude,latitude',
      partCount: parts.length,
      vertexCount: verts,
    },
    geometry: { type: 'MultiLineString', coordinates: parts },
  };
  newFeatures.push(feature);
  // connected-component count (chunks): endpoints welded at ~1e-4 deg
  const comps = countComponents(parts);
  summary.push(`${id}: P${parts.length} V${verts} chunks${comps} bbox[${bb.map((v) => v.toFixed(4)).join(' ')}] anchor[${anchor.map((v) => v.toFixed(4)).join(',')}] from ${fetched} fetched`);
}

function partInTn(part, corridor) {
  for (const v of part) {
    if (inTennessee(v)) continue;
    if (!corridor) return false;
    if (v[1] > CORRIDOR_MAX_LAT) return false;
    if (distToBoundaryM(v) > CORRIDOR_M) return false;
  }
  return true;
}

// Weld parts whose endpoints coincide exactly, or within WELD_EPS (NHD network
// vertices jitter ~1e-4 deg after the 4dp fetch; real gaps are orders of
// magnitude larger). Pass 1: exact endpoint equality. Pass 2: single-linkage
// nearest-pair within WELD_EPS. No invented coordinates — joining keeps both
// real endpoints. The contract forbids splitting connected reaches merely to
// simplify files; parts beyond WELD_EPS stay separate MultiLineString members.
function weldParts(parts) {
  const key = (v) => `${v[0]},${v[1]}`;
  const consumed = new Uint8Array(parts.length);
  const start = new Map();
  const end = new Map();
  parts.forEach((p, i) => {
    const sk = key(p[0]), ek = key(p[p.length - 1]);
    if (!start.has(sk)) start.set(sk, i);
    if (!end.has(ek)) end.set(ek, i);
  });
  let chains = [];
  for (let i = 0; i < parts.length; i++) {
    if (consumed[i]) continue;
    consumed[i] = 1;
    let chain = dedupeConsecutive(parts[i]);
    for (;;) {
      const nxt = start.get(key(chain[chain.length - 1]));
      if (nxt != null && !consumed[nxt]) {
        consumed[nxt] = 1;
        chain = chain.concat(dedupeConsecutive(parts[nxt]).slice(1));
        continue;
      }
      const prv = end.get(key(chain[0]));
      if (prv != null && !consumed[prv]) {
        consumed[prv] = 1;
        chain = dedupeConsecutive(parts[prv]).slice(0, -1).concat(chain);
        continue;
      }
      break;
    }
    chains.push(chain);
  }
  // pass 2: nearest jittered endpoint pairs (single-linkage, nearest first).
  // Physical vertices = connected components of chain-endpoint nodes under the
  // accepted pairs; chains = edges between the two vertices at their ends.
  const N = chains.length;
  const ends = [];
  chains.forEach((c, ci) => {
    ends.push([c[0][0], c[0][1]]);
    ends.push([c[c.length - 1][0], c[c.length - 1][1]]);
  });
  const nodeParent = new Map([...Array(2 * N).keys()].map((i) => [i, i]));
  const findNode = (i) => { while (nodeParent.get(i) !== i) { nodeParent.set(i, nodeParent.get(nodeParent.get(i))); i = nodeParent.get(i); } return i; };
  const pairs = [];
  const CELL = WELD_EPS;
  const buckets = new Map();
  ends.forEach((e, n) => {
    const k = `${Math.round(e[0] / CELL)},${Math.round(e[1] / CELL)}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(n);
  });
  ends.forEach((e, n) => {
    const cx = Math.round(e[0] / CELL), cy = Math.round(e[1] / CELL);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const m of buckets.get(`${cx + dx},${cy + dy}`) ?? []) {
        if (m <= n || (m >> 1) === (n >> 1)) continue;
        if (Math.abs(ends[m][0] - e[0]) > CELL || Math.abs(ends[m][1] - e[1]) > CELL) continue;
        if (findNode(m) === findNode(n)) continue;
        pairs.push({ a: n, b: m, d: Math.abs(ends[m][0] - e[0]) + Math.abs(ends[m][1] - e[1]) });
      }
    }
  });
  pairs.sort((a, b) => a.d - b.d);
  for (const { a, b } of pairs) {
    if (findNode(a) === findNode(b)) continue;
    nodeParent.set(findNode(a), findNode(b));
  }
  const V = (n) => findNode(n);
  const edgesAt = new Map(); // vertex -> [chain ids]
  const deg = new Map();
  for (let e = 0; e < N; e++) {
    for (const n of [2 * e, 2 * e + 1]) {
      const v = V(n);
      if (!edgesAt.has(v)) edgesAt.set(v, []);
      edgesAt.get(v).push(e);
    }
    const vs = [V(2 * e), V(2 * e + 1)];
    for (const v of vs) deg.set(v, (deg.get(v) ?? 0) + 1);
    if (vs[0] === vs[1]) deg.set(vs[0], deg.get(vs[0]) - 1); // closed loop counts once per end pair… keep simple
  }
  const used = new Uint8Array(N);
  const appendSeg = (coords, seg) => {
    const d = dedupeConsecutive(seg);
    if (!coords.length) return d;
    const tail = coords[coords.length - 1], head = d[0];
    return Math.abs(tail[0] - head[0]) < 1e-9 && Math.abs(tail[1] - head[1]) < 1e-9 ? coords.concat(d.slice(1)) : coords.concat(d);
  };
  const out = [];
  // seed from edges touching a degree-1 vertex (line ends) first
  const order = [...Array(N).keys()].sort((a, b) => {
    const da = Math.min(deg.get(V(2 * a)) ?? 1, deg.get(V(2 * a + 1)) ?? 1);
    const db = Math.min(deg.get(V(2 * b)) ?? 1, deg.get(V(2 * b + 1)) ?? 1);
    return da - db;
  });
  for (const e of order) {
    if (used[e]) continue;
    // enter the edge at its degree-1 end when it has one
    let node = (deg.get(V(2 * e)) ?? 0) === 1 ? 2 * e : (deg.get(V(2 * e + 1)) ?? 0) === 1 ? 2 * e + 1 : 2 * e;
    let coords = [];
    for (;;) {
      const c = node >> 1;
      if (used[c]) break;
      used[c] = 1;
      coords = appendSeg(coords, V(node) === V(2 * c) ? chains[c] : chains[c].slice().reverse());
      const exit = V(node) === V(2 * c) ? V(2 * c + 1) : V(2 * c);
      let next = null;
      for (const e2 of edgesAt.get(exit) ?? []) {
        if (!used[e2]) { next = (V(e2 * 2) === exit) ? e2 * 2 : e2 * 2 + 1; break; }
      }
      if (next == null) break;
      node = next;
    }
    if (coords.length >= 2) out.push(coords);
  }
  return out;
}

function dedupeConsecutive(part) {
  const out = [part[0]];
  for (let i = 1; i < part.length; i++) {
    if (part[i][0] !== out[out.length - 1][0] || part[i][1] !== out[out.length - 1][1]) out.push(part[i]);
  }
  return out;
}

function countComponents(parts) {
  // weld parts sharing an endpoint (rounded to 4dp) into components
  const parent = new Map(parts.map((_, i) => [i, i]));
  const find = (i) => { while (parent.get(i) !== i) { parent.set(i, parent.get(parent.get(i))); i = parent.get(i); } return i; };
  const union = (a, b) => { parent.set(find(a), find(b)); };
  const endpoint = new Map(); // 'x,y' -> part index
  parts.forEach((p, i) => {
    for (const idx of [0, p.length - 1]) {
      const k = `${p[idx][0].toFixed(4)},${p[idx][1].toFixed(4)}`;
      if (endpoint.has(k)) union(endpoint.get(k), i);
      else endpoint.set(k, i);
    }
  });
  return new Set(parts.map((_, i) => find(i))).size;
}

// ---- append (never modify existing features; idempotent) ----
const atlasPath = join(webDir, 'public', 'atlas', 'rivers.geojson');
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const existing = new Set(atlas.features.map((f) => f.properties?.id));
const skipped = [];
const added = [];
for (const f of newFeatures) {
  if (existing.has(f.properties.id)) { skipped.push(f.properties.id); continue; }
  atlas.features.push(f);
  added.push(f.properties.id);
}
if (added.length && !process.env.DRY_RUN) writeFileSync(atlasPath, JSON.stringify({ type: 'FeatureCollection', features: atlas.features }));
if (process.env.DRY_RUN) console.log('DRY_RUN — nothing written');

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'missing-rivers-summary.txt'), summary.join('\n') + '\n');
// Assembled features (inspection input for the corridor QA probes)
writeFileSync(join(OUT, 'missing-rivers.json'), JSON.stringify({ type: 'FeatureCollection', features: newFeatures }));console.log(summary.join('\n'));
if (skipped.length) console.log(`already present, skipped: ${skipped.join(', ')}`);
console.log(`appended: ${added.length} [${added.join(', ')}]`);
if (failures) {
  console.error(`FAIL: ${failures} inventory rivers unresolved`);
  process.exit(1);
}
console.log('build-missing-rivers: OK');
