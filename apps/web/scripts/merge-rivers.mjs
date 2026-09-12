/* global console, process */
// Final atlas assembly: TIGER LINEARWATER lines + TIGER AREAWATER wide-river
// polygons + USGS NHDPlus HR named reaches -> public/atlas/rivers.geojson.
// REAL DATA ONLY (Census TIGER/Line 2024 + USGS NHDPlus HR, both public
// domain). No synthetic coordinates. County discipline + reach notes come
// from the content catalog (packages/content/streams/tn/*.yaml notes).
// Run: node scripts/merge-rivers.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { open as openShape } from 'shapefile';
import { REACH_GATE, gateKeeps } from './atlas-reach-gates.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, '.atlas-src', 'out');
const CLIP = [-90.6, 34.98, -81.45, 36.75]; // [minLon,minLat,maxLon,maxLat]
const WORD = { RIV: 'RIVER', R: 'RIVER', CRK: 'CREEK', CR: 'CREEK', FRK: 'FORK', FK: 'FORK', BR: 'BRANCH', E: 'EAST', W: 'WEST', N: 'NORTH', S: 'SOUTH', SULFUR: 'SULPHUR', WHITEOAK: 'WHITE OAK' };
const GENERIC = new Set(['RIVER', 'CREEK', 'FORK', 'BRANCH', 'RUN', 'RIV', 'CRK', 'FRK', 'BR', 'PRONG']);
function normTiger(n) {
  return String(n ?? '').toUpperCase().replace(/[''.…]/g, '').replace(/\bMC\s+/g, 'MC').split(/[^A-Z0-9]+/).filter(Boolean).map((t) => WORD[t] ?? t).join(' ');
}
function stem(n) {
  const toks = n.split(' ').filter(Boolean);
  while (toks.length > 1 && GENERIC.has(toks[toks.length - 1])) toks.pop();
  return toks.join(' ');
}
const report = JSON.parse(readFileSync(path.join(OUT, 'match-report.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(path.join(ROOT, '..', '..', 'packages', 'content', 'dist', 'pack', 'streams.json'), 'utf8'));
const streams = catalog.streams ?? catalog;
const _byId = new Map(streams.map((s) => [s.id, s]));
const _repById = new Map(report.map((r) => [r.id, r]));
// ---- TIGER lines (from rivers-real.geojson, keyed by stream id) ----
const tigerLines = new Map(); // id -> {parts, names:Set}
{
  const g = JSON.parse(readFileSync(path.join(OUT, 'rivers-real.geojson'), 'utf8'));
  for (const f of g.features) {
    const e = tigerLines.get(f.properties.id) ?? { parts: [], names: new Set() };
    for (const part of f.geometry.coordinates) e.parts.push(part);
    e.names.add(f.properties.tigerName);
    tigerLines.set(f.properties.id, e);
  }
}
// ---- NHD named reaches ----
// B13 additions: the waters TIGER/Line names only sparsely (or not at all).
// TIGER 2024 LINEARWATER carries a single named "Clinch Riv" segment (Hancock
// Co., upstream of Norris Lake), one 7-point "South Fork Holston Riv" segment,
// and no "Watauga Riv" outside Watauga Lake, so the NHDPlus HR flowline is the
// primary (and for watauga-river the only) centerline source for these ids.
// NHDPlus HR is a national layer: envelope fetches near state lines return
// out-of-Tennessee flowlines (NC Hiwassee/French Broad, KY Cumberland-bend
// "Obey" connectors). This atlas carries Tennessee water only, so a part is
// kept only when EVERY vertex falls inside the state boundary polygon —
// whole-part rejection, no interior coordinate deletion (same discipline as
// the TN clip rectangle below).
const tnBoundary = JSON.parse(readFileSync(path.join(OUT, 'tn-boundary.geojson'), 'utf8'));
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
function partInTennessee(part) {
  return part.length > 0 && part.every(inTennessee);
}
const NHD = {
  'roan': { file: 'roan.geojson', take: { 'Roan Creek': ['upper-roan-creek'] } },
  'nprong-barren': { file: 'nprong-barren.geojson', take: { 'North Prong Barren Fork': ['north-prong-barren-fork'], 'Barren Fork': ['barren-fork-river'] } },
  'byrd-richardson': { file: 'byrd-richardson.geojson', take: { 'Richardson Creek': ['richardson-byrd-creek'] } },
  'mill-overton': { file: 'mill-overton.geojson', take: { 'Mill Creek': ['mill-creek-overton'] } },
  'stones': { file: 'stones.geojson', take: { 'East Fork Stones River': ['east-fork-stones-river'], 'West Fork Stones River': ['west-fork-stones-river'] } },
  'cane-hickman': { file: 'cane-hickman.geojson', take: { 'Cane Creek': ['cane-creek'] } },
  'piney-rhea': { file: 'piney-rhea.geojson', take: { 'Piney Creek': ['piney-river-rhea'] } },
  'clinch': { file: 'clinch.geojson', take: { 'Clinch River': ['clinch-river'] } },
  'watauga': { file: 'watauga.geojson', take: { 'Watauga River': ['watauga-river'] } },
  's-holston': { file: 's-holston.geojson', take: { 'South Fork Holston River': ['south-holston-river', 'boone-tailwater', 'ft-patrick-henry-tailwater'] } },
  'nolichucky': { file: 'nolichucky.geojson', take: { 'Nolichucky River': ['nolichucky-river'] } },
  'french-broad': { file: 'french-broad.geojson', take: { 'French Broad River': ['french-broad-river'] } },
  'hiwassee': { file: 'hiwassee.geojson', take: { 'Hiwassee River': ['hiwassee-river'] } },
  'obey': { file: 'obey.geojson', take: { 'Obey River': ['obey-river'] } },
  'stones-main': { file: 'stones.geojson', take: { 'Stones River': ['stones-river'] } },
  'ocoee': { file: 'ocoee.geojson', take: { 'Ocoee River': ['ocoee-river', 'parksville-tailwater'] } },
  'station-creek': { file: 'station-creek.geojson', take: { 'Station Creek': ['station-creek'] } },
  'mossy-creek-jefferson': { file: 'mossy-creek-jefferson.geojson', take: { 'Mossy Creek': ['mossy-creek-jefferson'] } },
  // GNIS spells it "Le Conte Creek" (2026-09-04 fetch); kept older spellings
  // in case a future refresh changes casing/spacing upstream.
  'leconte-creek': { file: 'leconte-creek.geojson', take: { 'Le Conte Creek': ['leconte-creek'], 'LeConte Creek': ['leconte-creek'], 'Leconte Creek': ['leconte-creek'] } },
  'forge-creek-johnson': { file: 'forge-creek-johnson.geojson', take: { 'Forge Creek': ['forge-creek-johnson'] } },
  'elk': { file: 'elk.geojson', take: { 'Elk River': ['elk-river', 'elk-river-lower'] } },
  'duck': { file: 'duck.geojson', take: { 'Duck River': ['duck-river-tailwater', 'duck-river-lower'] } },
  // CONTINUITY lane takes (2026-09-04): corridor fetches for waters whose
  // TIGER-only coverage rendered as multiple disconnected chunks (see
  // docs/CONTINUITY-AUDIT.md). Envelopes bound each water; takes are keyed by
  // exact gnis_name (or '*' for the name-less fbb-braid corridor file).
  'powell': { file: 'powell.geojson', take: { 'Powell River': ['powell-river'] } },
  'byrd-creek': { file: 'byrd-creek.geojson', take: { 'Byrd Creek': ['richardson-byrd-creek'] } },
  'harpeth': { file: 'harpeth.geojson', take: { 'Harpeth River': ['harpeth-river'] } },
  'collins': { file: 'collins.geojson', take: { 'Collins River': ['collins-river'] } },
  'clear-fork': { file: 'clear-fork.geojson', take: { 'Clear Fork': ['clear-fork'] } },
  // GNIS spells the water "Sulphur Fork Creek"; the upper reaches are carried
  // as "Sulphur Fork Red River" (the Sulphur Fork OF the Red River, rising in
  // Sumner Co, mouth at the Red River / Port Royal — same water, alternate
  // NHD name). Both spellings taken inside the Robertson/Sumner envelope.
  'sulfur-fork': { file: 'sulfur-fork.geojson', take: { 'Sulfur Fork Creek': ['sulfur-fork-creek'], 'Sulphur Fork Creek': ['sulfur-fork-creek'], 'Sulphur Fork Red River': ['sulfur-fork-creek'] } },
  'emory': { file: 'emory.geojson', take: { 'Emory River': ['emory-river'] } },
  'hurricane-houston': { file: 'hurricane-houston.geojson', take: { 'Hurricane Creek': ['hurricane-creek'] } },
  'sinking-wilson': { file: 'sinking-wilson.geojson', take: { 'Sinking Creek': ['sinking-creek-wilson'] } },
  'daddys': { file: 'daddys.geojson', take: { 'Daddys Creek': ['daddys-creek'] } },
  'efork-shoal': { file: 'efork-shoal.geojson', take: { 'East Fork Shoal Creek': ['east-fork-shoal-creek'] } },
  'indian-claiborne': { file: 'indian-claiborne.geojson', take: { 'Indian Creek': ['indian-creek-claiborne'] } },
  'laurel-johnson': { file: 'laurel-johnson.geojson', take: { 'Laurel Creek': ['laurel-creek-johnson'] } },
  'new-river-scott': { file: 'new-river-scott.geojson', take: { 'New River': ['new-river'] } },
  'n-chickamauga': { file: 'n-chickamauga.geojson', take: { 'North Chickamauga Creek': ['north-chickamauga-creek'] } },
  'obed': { file: 'obed.geojson', take: { 'Obed River': ['obed-river'] } },
  'sequatchie': { file: 'sequatchie.geojson', take: { 'Sequatchie River': ['sequatchie-river'], 'Sequatchie Creek': ['sequatchie-river'] } },
  'fletchers': { file: 'fletchers.geojson', take: { 'Fletchers Fork': ['fletchers-fork'] } },
  'horse-greene': { file: 'horse-greene.geojson', take: { 'Horse Creek': ['horse-creek-greene'] } },
  // Unnamed braid channels of the French Broad below Seven Islands (tight
  // envelope, name-less fetch). '*' take: every part in this file belongs to
  // the braid corridor of one water.
  'fbb-braid': { file: 'fbb-braid.geojson', take: { '*': ['french-broad-river'] } },
};
// "Piney River" is the NHD name of the lower Piney (Rhea Co) main stem; the
// existing take only carried "Piney Creek".
NHD['piney-rhea'].take['Piney River'] = ['piney-river-rhea'];
const nhdLines = new Map(); // streamId -> {parts, names:Set}
for (const { file, take } of Object.values(NHD)) {
  let feats = [];
  try { feats = JSON.parse(readFileSync(path.join(ROOT, '.atlas-src', 'nhd', file), 'utf8')).features ?? []; } catch { continue; }
  for (const f of feats) {
    const ids = take[f.properties.gnis_name] ?? take['*'];
    if (!ids) continue;
    let geoms = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : null;
    if (!geoms) continue;
    // keep Tennessee water only (whole-part test, see note above)
    geoms = geoms.filter(partInTennessee);
    if (!geoms.length) continue;
    for (const id of ids) {
      const e = nhdLines.get(id) ?? { parts: [], names: new Set() };
      for (const part of geoms) e.parts.push(part);
      e.names.add(f.properties.gnis_name);
      nhdLines.set(id, e);
    }
  }
}
// ---- AREAWATER wide-river polygons ----
const counties = JSON.parse(readFileSync(path.join(OUT, 'tn-counties.geojson'), 'utf8'));
const countyBox = new Map();
for (const f of counties.features) {
  const p = f.properties, g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const bb = [1e9, 1e9, -1e9, -1e9];
  for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
    if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y;
    if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y;
  }
  countyBox.set(String(p.NAME ?? '').toUpperCase(), bb);
}
const areaPolys = new Map(); // streamId -> {polys, names:Set}
{
  const repNorm = new Map(report.map((r) => [r.id, { want: r.want, hint: r.hint }]));
  const files = readdirSync(path.join(ROOT, '.atlas-src', 'awshp')).filter((f) => f.endsWith('.shp'));
  for (const f of files) {
    const src = await openShape(path.join(ROOT, '.atlas-src', 'awshp', f));
    let r;
    while ((r = await src.read()).done === false) {
      const name = r.value.properties.FULLNAME || '';
      if (!name.trim()) continue;
      const cn = normTiger(name), cs = stem(cn);
      const geom = r.value.geometry;
      if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') continue;
      for (const [id, { want, hint }] of repNorm) {
        if (want !== cn && stem(want) !== cs) continue;
        const allow = hint ? (Array.isArray(hint) ? hint : [hint]) : null;
        if (allow) {
          const boxes = allow.map((c) => countyBox.get(c)).filter(Boolean);
          if (!boxes.length) continue;
          // polygon kept when it touches an allowed county box
          const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
          const bb = [1e9, 1e9, -1e9, -1e9];
          for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
            if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y;
            if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y;
          }
          const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
          if (!boxes.some((b) => cx >= b[0] - 0.05 && cy >= b[1] - 0.05 && cx <= b[2] + 0.05 && cy <= b[3] + 0.05)) continue;
        }
        const e = areaPolys.get(id) ?? { polys: [], names: new Set() };
        if (geom.type === 'Polygon') e.polys.push(geom.coordinates);
        else for (const p of geom.coordinates) e.polys.push(p);
        e.names.add(name);
        areaPolys.set(id, e);
      }
    }
  }
}
// ---- assembly ----
function okPt(x, y) {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 180 && Math.abs(y) <= 90;
}
function lenDeg(parts) {
  let L = 0;
  for (const part of parts) {
    for (let i = 1; i < part.length; i++) {
      L += Math.abs(part[i][0] - part[i - 1][0]) + Math.abs(part[i][1] - part[i - 1][1]);
    }
  }
  return L;
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
function inClip([x, y]) {
  return x >= CLIP[0] && y >= CLIP[1] && x <= CLIP[2] && y <= CLIP[3];
}
function cleanLines(parts) {
  const out = [];
  for (const part of parts) {
    // Reject the whole source part rather than deleting an interior coordinate;
    // deleting an interior point can manufacture a straight connector segment.
    if (!Array.isArray(part) || part.length < 2 || !part.every(([x, y]) => okPt(x, y) && inClip([x, y]))) continue;
    const pts = simplifyRdp(part, 0.00012);
    if (pts.length >= 2) out.push(pts);
  }
  return out;
}
// Drop NHD parts whose vertices are already covered by TIGER cells
// (prevents duplicated overlapping spaghetti when both sources carry the same
// reach). TIGER is the preferred base; NHD is kept only where it adds new
// water. Disconnected parts stay separate MultiLineString members — never
// joined into artificial connector lines.
function dedupNhd(tigerParts, nhdParts, cell = 0.002) {
  if (!tigerParts.length || !nhdParts.length) return nhdParts;
  const covered = new Set();
  for (const part of tigerParts) {
    for (const [x, y] of part) covered.add(`${Math.round(x / cell)},${Math.round(y / cell)}`);
  }
  return nhdParts.filter((part) => {
    let seen = 0, total = 0;
    for (const [x, y] of part) {
      total++;
      if (covered.has(`${Math.round(x / cell)},${Math.round(y / cell)}`)) seen++;
    }
    // keep the part when fewer than half its vertices duplicate TIGER
    return total === 0 || seen / total < 0.5;
  });
}
function cleanPolys(polys) {
  const out = [];
  for (const poly of polys) {
    const rings = [];
    for (const ring of poly) {
      if (!Array.isArray(ring) || ring.length < 4 || !ring.every(([x, y]) => okPt(x, y) && inClip([x, y]))) continue;
      const open = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring.slice();
      const pts = simplifyRdp(open, 0.00018);
      if (pts.length >= 3) rings.push([...pts, pts[0]]);
    }
    if (rings.length) out.push(rings);
  }
  return out;
}
const features = [];
const summary = [];
// ---- continuity-aware source selection (CONTINUITY lane, 2026-09-04) ----
// TIGER-preferred dedup can leave a stream MORE fragmented than either source
// alone: TIGER named segments carry small gaps, and dropping NHD parts that
// overlap TIGER cells also drops the parts that bridge those gaps (elk-river:
// 9 chunks from 114 parts). Conversely, sparse-but-connected NHD stubs can add
// phantom chunks to a stream whose TIGER coverage is already continuous
// (duck-river-tailwater). Since every candidate set is REAL geometry, pick the
// most continuous one — fewest endpoint-stitched chunks (1 km haversine);
// ties keep the TIGER+NHD blend (max provenance), then the denser set. A
// stream never loses water wholesale: switching sources only happens when it
// strictly reduces fragmentation.
const R_KM = 6371.0088, RAD = Math.PI / 180;
function havKm([lon1, lat1], [lon2, lat2]) {
  const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(a));
}
function chunkCount(parts) {
  const n = parts.length;
  if (n <= 1) return n;
  const ends = parts.map((p) => [p[0], p[p.length - 1]]);
  const parent = parts.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = Math.min(
      havKm(ends[i][0], ends[j][0]), havKm(ends[i][0], ends[j][1]),
      havKm(ends[i][1], ends[j][0]), havKm(ends[i][1], ends[j][1]),
    );
    if (d <= 1.0) { const a = find(i), b = find(j); if (a !== b) parent[b] = a; }
  }
  return new Set(parts.map((_, i) => find(i))).size;
}
const _countVerts = (parts) => parts.reduce((n, p) => n + p.length, 0);
function partBbox(part) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of part) {
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y);
    b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y);
  }
  return b;
}
for (const st of streams) {
  const id = st.id;
  const gate = REACH_GATE[id] ?? null;
  const tigerParts = tigerLines.get(id)?.parts ?? [];
  const nhdParts = nhdLines.get(id)?.parts ?? [];
  const polys = areaPolys.get(id)?.polys ?? [];
  const ct = cleanLines(tigerParts);
  const cnRaw = cleanLines(nhdParts);
  // Reach gates (B13): tailwater / catalog-bracketed reaches keep only source
  // parts lying entirely inside the gated window (atlas-reach-gates.mjs).
  // Applied to NHD flowline parts and AREAWATER polygons here; TIGER line
  // parts were already gated at match time (belt-and-suspenders: gated again).
  const gFilter = (parts) => (gate ? parts.filter((p) => gateKeeps(gate, partBbox(p))) : parts);
  const ctG = gFilter(ct);
  const cnRawG = gFilter(cnRaw);
  const cn = dedupNhd(ctG, cnRawG);
  // candidate line sets. Base = TIGER + deduped NHD (max provenance, no
  // double-draw). 'tiger+nhd-full' also keeps the NHD parts the dedup would
  // drop — TIGER and NHD are both real centerlines of the same water, so the
  // overlapping reaches draw twice but read as one continuous water, and it
  // is the only set that can bridge holes each source has alone.
  const combos = [];
  if (ctG.length && cn.length) combos.push({ how: 'tiger+nhd', lines: [...ctG, ...cn] });
  if (ctG.length && cnRawG.length) combos.push({ how: 'tiger+nhd-full', lines: [...ctG, ...cnRawG] });
  if (cnRawG.length) combos.push({ how: 'nhd-hr', lines: cnRawG });
  if (ctG.length) combos.push({ how: 'tiger-linear', lines: ctG });
  let chosen = combos[0] ?? null;
  let selNote = '';
  if (combos.length > 1) {
    const base = combos[0];
    const bboxOf = (parts) => {
      const b = [Infinity, Infinity, -Infinity, -Infinity];
      for (const p of parts) { const pb = partBbox(p);
        b[0] = Math.min(b[0], pb[0]); b[1] = Math.min(b[1], pb[1]);
        b[2] = Math.max(b[2], pb[2]); b[3] = Math.max(b[3], pb[3]); }
      return b;
    };
    const baseBox = bboxOf(base.lines);
    // A candidate may only replace the blend when it is strictly more
    // continuous AND it still covers the blend's extent — every bbox side
    // must reach within 0.05 deg (~5 km) of the blend's edge, so a switch can
    // never silently truncate the water (cane-creek's far county reaches,
    // clear-fork's TIGER-only headwaters). Ties on chunks keep the set with
    // fewer parts (less double-draw). A vacuous one-part "1 chunk" bbox
    // cannot reach a multi-part blend's extent, so it is excluded here too.
    const reaches = (b) => b[0] <= baseBox[0] + 0.05 && b[1] <= baseBox[1] + 0.05
      && b[2] >= baseBox[2] - 0.05 && b[3] >= baseBox[3] - 0.05;
    const debugIds = (process.env.CONTINUITY_DEBUG ?? '').split(',').filter(Boolean);
    if (debugIds.includes(id)) {
      for (const c of combos) {
        const cb = bboxOf(c.lines);
        console.log(`  [dbg ${id}] ${c.how}: ${chunkCount(c.lines)}ch ${c.lines.length}p bbox[${cb.map((v) => v.toFixed(3))}] reaches=${reaches(cb)}`);
      }
    }
    for (const c of combos.slice(1)) {
      // switch ONLY for a strictly lower chunk count on full extent coverage —
      // no tie-switching, so the clean dedup blend wins every tie and
      // double-draw happens only where it is the only way to bridge holes
      if (reaches(bboxOf(c.lines)) && chunkCount(c.lines) < chunkCount(chosen.lines)) chosen = c;
    }
    if (chosen !== base) {
      const counts = combos.map((c) => `${c.how}=${chunkCount(c.lines)}ch`).join(' ');
      selNote = `sel:${base.how}->${chosen.how} (${counts})`;
    }
  }
  const cl = chosen ? chosen.lines : [];
  const cp = gFilter(cleanPolys(polys));
  const s2 = [];
  if (chosen?.how === 'tiger+nhd') {
    s2.push('tiger-linear', 'nhd-hr');
    if (cnRawG.length - cn.length > 0) s2.push(`nhd-dedup-${cnRawG.length - cn.length}`);
  } else if (chosen?.how === 'tiger+nhd-full') {
    s2.push('tiger-linear', 'nhd-hr', 'nhd-fulldraw');
  } else if (chosen) {
    s2.push(chosen.how);
  }
  if (cp.length) s2.push('tiger-area');
  if (gate) s2.push('reach-gated');
  if (selNote) s2.push(selNote);
  if (!cl.length && !cp.length) { summary.push(`${id}: UNRESOLVED`); continue; }
  // A GeoJSON feature has exactly one compatible geometry family. Prefer
  // centerlines when available; use AREAWATER polygons only as a fallback for
  // wide main stems omitted from LINEARWATER. Never nest/concatenate families.
  let geom = null;
  let usedLines = cl;
  let usedPolys = [];
  let usedSources = s2.filter((x) => x !== 'tiger-area');
  if (cl.length) geom = { type: 'MultiLineString', coordinates: cl };
  else { usedLines = []; usedPolys = cp; usedSources = ['tiger-area']; geom = { type: 'MultiPolygon', coordinates: cp }; }
  const bb = [1e9, 1e9, -1e9, -1e9];
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      if (c[0] < bb[0]) bb[0] = c[0]; if (c[1] < bb[1]) bb[1] = c[1];
      if (c[0] > bb[2]) bb[2] = c[0]; if (c[1] > bb[3]) bb[3] = c[1];
    } else for (const k of c) walk(k);
  };
  walk(geom.coordinates);
  let anchor = [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
  if (usedLines.length) {
    let best = usedLines[0];
    for (const p of usedLines) if (p.length > best.length) best = p;
    anchor = best[Math.floor(best.length / 2)];
  }
  let verts = 0;
  for (const p of usedLines) verts += p.length;
  for (const p of usedPolys) for (const r of p) verts += r.length;
  features.push({ type: 'Feature', properties: { id, name: st.name, regionId: st.regionId, gaugeIds: st.gaugeIds ?? [], bounds: bb, labelAnchor: anchor, source: usedSources, crs: 'EPSG:4326', coordinateOrder: 'longitude,latitude', partCount: usedLines.length + usedPolys.length, vertexCount: verts }, geometry: geom });
  const bits = [`L${usedLines.length}`, `P${usedPolys.length}`, `len${lenDeg(usedLines).toFixed(2)}`, usedSources.join('+')];
  summary.push(`${id}: ${bits.join(' ')}`);
}
writeFileSync(path.join(ROOT, 'public', 'atlas', 'rivers.geojson'), JSON.stringify({ type: 'FeatureCollection', features }));
writeFileSync(path.join(OUT, 'final-summary.txt'), summary.join('\n') + '\n');
console.log(`rivers: ${features.length}/${streams.length} resolved`);
console.log(summary.join('\n'));
