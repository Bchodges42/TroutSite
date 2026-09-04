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
const byId = new Map(streams.map((s) => [s.id, s]));
const repById = new Map(report.map((r) => [r.id, r]));
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
};
const nhdLines = new Map(); // streamId -> {parts, names:Set}
for (const { file, take } of Object.values(NHD)) {
  let feats = [];
  try { feats = JSON.parse(readFileSync(path.join(ROOT, '.atlas-src', 'nhd', file), 'utf8')).features ?? []; } catch { continue; }
  for (const f of feats) {
    const ids = take[f.properties.gnis_name];
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
  const cl = [...ctG, ...cn];
  const cp = gFilter(cleanPolys(polys));
  const s2 = [];
  if (ctG.length) s2.push('tiger-linear');
  if (cn.length) s2.push('nhd-hr');
  if (cnRawG.length - cn.length > 0) s2.push(`nhd-dedup-${cnRawG.length - cn.length}`);
  if (cp.length) s2.push('tiger-area');
  if (gate) s2.push('reach-gated');
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
