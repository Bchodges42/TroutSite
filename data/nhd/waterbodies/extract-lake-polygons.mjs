#!/usr/bin/env node
/**
 * Match catalog lake slugs (packages/content/streams/tn/*.yaml, waterbodyType
 * lake/reservoir) to USGS NHD High Resolution waterbody polygons from
 * data/nhd/waterbodies/tn-waterbodies.geojson, and emit replacement geometries
 * for apps/web/public/atlas/rivers.geojson.
 *
 * Usage:
 *   node extract-lake-polygons.mjs [slug ...] [--all]
 *     e.g. node extract-lake-polygons.mjs kentucky-lake lake-barkley pickwick-lake
 *
 * Matching strategy per catalog slug:
 *   1. Direct keys: GNIS ids from the catalog YAML (gnisIds) and GNIS/PID ids
 *      parsed out of rivers.geojson sourceIds strings (e.g. "Dallas Lake
 *      (GNIS 01312639, PID 139293038, fcode 39009)").
 *   2. Name match: normalized gnis_name variants (Lake/Reservoir suffixes,
 *      punctuation) against the catalog water name.
 *   3. Location: candidate bbox must overlap the catalog feature's
 *      properties.bounds from rivers.geojson (or be near a reference point
 *      override for lakes whose catalog bounds are damaged, see OVERRIDES).
 *   4. Area closeness vs the catalog's expected size breaks ties; ties then
 *      prefer the larger polygon.
 *   5. Sanity rule (great-falls-lake case): reject any candidate whose bbox
 *      diagonal exceeds 4x the catalog bbox diagonal — that rejects the
 *      malformed 29x32 km geometry class.
 *
 * Output: data/nhd/waterbodies/matched-polygons.json
 *   [{ catalogId, nhdPermanentIdentifier, gnisId, gnisName, areaSqKm, bbox,
 *      ringCount, vertexCount, coordinates, ... }]
 *   coordinates = flat array of polygon rings [ [ [lon,lat], ... ], ... ],
 *   outer ring first within each polygon; `polygonRingCounts` records how many
 *   consecutive rings belong to each polygon (MultiPolygon-safe).
 *
 * No dependencies: uses only node stdlib. Catalog YAMLs are parsed with a
 * minimal top-level scalar reader (we only need id/name/waterbodyType).
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const EXTRACT = join(HERE, 'tn-waterbodies.geojson');
const RIVERS = join(REPO, 'apps', 'web', 'public', 'atlas', 'rivers.geojson');
const CATALOG_DIR = join(REPO, 'packages', 'content', 'streams', 'tn');
const OUT = join(HERE, 'matched-polygons.json');

/** Reference-point overrides for lakes whose catalog bounds are unusable
 * (e.g. great-falls-lake's malformed 29x32 km polygon poisoned its bounds).
 * lon/lat of the true lake center + expected area range in sqkm. */
const OVERRIDES = {
  'great-falls-lake': {
    refPoint: [-85.83, 35.97],
    refRadiusKm: 5,
    areaRangeSqKm: [0.05, 6],
    note: 'catalog bounds/area derive from the malformed polygon; match near Rock Island, TN',
  },
  'old-hickory-lake': {
    refPoint: [-86.3, 36.32],
    refRadiusKm: 8,
    areaRangeSqKm: [40, 120],
    note: 'NHD HR carries the lake UNNAMED (PID 137326489, bbox matches catalog bounds to 3 decimals); bare 22-digit sourceIds are not parseable by the PID regex',
  },
};

/** NHD retains historical/alternate names for some catalog waters. Used only
 * as fallback name candidates when direct GNIS/PID keys are absent. */
const NAME_ALIASES = {
  'chickamauga-lake': ['Dallas Lake', 'Chickamauga Reservoir'],
  'kentucky-lake': ['Kentucky Reservoir'],
  'pickwick-lake': ['Pickwick Reservoir', 'Pickwick Landing Lake'],
  'lake-barkley': ['Barkley Lake'],
  'watts-bar-lake': ['Watts Bar Reservoir'],
  'j-percy-priest-lake': ['Percy Priest Lake', 'J Percy Priest Reservoir'],
  'dale-hollow-lake': ['Dale Hollow Reservoir'],
  'center-hill-lake': ['Center Hill Reservoir'],
  'reelfoot-lake': ['Reelfoot Lake'],
  'great-falls-lake': ['Great Falls Lake', 'Great Falls Reservoir'],
};

const DEFAULT_SLUGS = [
  'kentucky-lake',
  'lake-barkley',
  'pickwick-lake',
  'dale-hollow-lake',
  'center-hill-lake',
  'reelfoot-lake',
  'j-percy-priest-lake',
  'chickamauga-lake',
  'watts-bar-lake',
  'watts-bar-reservoir',
  'great-falls-lake',
];

// ---------- tiny YAML subset reader (top-level "key: value" scalars) ----------
function readCatalogBasics(yamlPath) {
  const out = {};
  for (const line of readFileSync(yamlPath, 'utf8').split(/\r?\n/)) {
    if (/^\s/.test(line)) continue; // only top-level scalars
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (!val || val === '|' || val === '>' || val.startsWith('[')) continue;
    val = val.replace(/^["']|["']$/g, '');
    out[key] = val;
  }
  return out;
}

// ---------- geometry helpers ----------
function walkCoords(c, fn) {
  if (Array.isArray(c[0])) for (const x of c) walkCoords(x, fn);
  else fn(c);
}
function bboxOf(geomCoords) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  walkCoords(geomCoords, ([lon, lat]) => {
    if (lon < w) w = lon; if (lon > e) e = lon;
    if (lat < s) s = lat; if (lat > n) n = lat;
  });
  return [w, s, e, n];
}
function bboxesOverlap(a, b) {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}
function bboxDiagKm([w, s, e, n]) {
  const midLat = (s + n) / 2;
  const dxKm = (e - w) * 111.32 * Math.cos((midLat * Math.PI) / 180);
  const dyKm = (n - s) * 110.57;
  return Math.hypot(dxKm, dyKm);
}
function kmBetween([lon1, lat1], [lon2, lat2]) {
  const dx = (lon2 - lon1) * 111.32 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  const dy = (lat2 - lat1) * 110.57;
  return Math.hypot(dx, dy);
}
function sanitizeRings(coords) {
  // Keep every finite vertex; drop only non-finite ones. Returns flat ring list
  // plus per-polygon ring counts to preserve MultiPolygon grouping.
  const isMulti = Array.isArray(coords[0][0][0]);
  const polygons = isMulti ? coords : [coords];
  const rings = [];
  const polygonRingCounts = [];
  let vertexCount = 0;
  let dropped = 0;
  for (const poly of polygons) {
    let n = 0;
    for (const ring of poly) {
      const clean = [];
      for (const [lon, lat] of ring) {
        if (Number.isFinite(lon) && Number.isFinite(lat)) clean.push([lon, lat]);
        else dropped++;
      }
      if (clean.length >= 4) { rings.push(clean); n++; vertexCount += clean.length; }
    }
    polygonRingCounts.push(n);
  }
  return { rings, polygonRingCounts, vertexCount, dropped };
}

// ---------- naming helpers ----------
function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/\b(lake|reservoir)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function nameVariants(catalogName, slug) {
  const variants = new Set([catalogName, slug.replace(/-/g, ' ')]);
  for (const alias of NAME_ALIASES[slug] ?? []) variants.add(alias);
  // swap "lake X" <-> "X lake/reservoir"
  for (const v of [...variants]) {
    const m = /^lake (.+)$/i.exec(v);
    if (m) { variants.add(`${m[1]} Lake`); variants.add(`${m[1]} Reservoir`); }
  }
  return [...variants];
}
function parseIdsFromSourceIds(sourceIds = []) {
  const gnis = new Set();
  const pids = new Set();
  for (const raw of sourceIds) {
    const s = String(raw);
    const g = /GNIS[:\s=]+(\d{8,10})/i.exec(s); if (g) gnis.add(g[1].replace(/^0+/, ''));
    const p = /PID[:\s=]+([A-Za-z0-9{}-]+)/i.exec(s); if (p) pids.add(p[1]);
  }
  return { gnis, pids };
}

// ---------- main ----------
function parseArgs(argv) {
  const slugs = [];
  let all = false;
  for (const a of argv.slice(2)) {
    if (a === '--all') all = true;
    else if (!a.startsWith('--')) slugs.push(a);
  }
  return { slugs, all };
}

function main() {
  const { slugs: slugArgs, all } = parseArgs(process.argv);
  const nhd = JSON.parse(readFileSync(EXTRACT, 'utf8')).features;
  const rivers = JSON.parse(readFileSync(RIVERS, 'utf8')).features;
  const riversById = new Map(rivers.map((f) => [f.properties.id, f]));

  const catalogFiles = readdirSync(CATALOG_DIR).filter((f) => f.endsWith('.yaml'));
  const lakes = [];
  for (const f of catalogFiles) {
    const y = readCatalogBasics(join(CATALOG_DIR, f));
    if (!['lake', 'reservoir'].includes(y.waterbodyType)) continue;
    lakes.push({ slug: y.id, name: y.name, file: f });
  }
  const targets = all
    ? lakes.map((l) => l.slug)
    : (slugArgs.length ? slugArgs : DEFAULT_SLUGS);

  const results = [];
  const table = [];

  for (const slug of targets) {
    const cat = lakes.find((l) => l.slug === slug);
    const riverFeat = riversById.get(slug);
    if (!cat || !riverFeat) {
      table.push({ catalogId: slug, match: `NO MATCH — ${!cat ? 'no catalog YAML' : 'not in rivers.geojson'}` });
      results.push({ catalogId: slug, matched: false, reason: !cat ? 'catalog yaml not found' : 'id not found in rivers.geojson' });
      continue;
    }
    const p = riverFeat.properties;
    const catBbox = p.bounds;
    const { gnis: srcGnis, pids: srcPids } = parseIdsFromSourceIds(p.sourceIds ?? []);
    const catGnis = new Set((p.gnisIds ?? []).map((g) => String(g).replace(/^0+/, '')));
    for (const g of srcGnis) catGnis.add(g);
    const ov = OVERRIDES[slug];
    const variants = nameVariants(cat.name, slug).map(normalizeName).filter(Boolean);

    const candidates = [];
    for (const f of nhd) {
      const pr = f.properties;
      const cb = bboxOf(f.geometry.coordinates);
      const nrm = normalizeName(pr.gnis_name);
      const nameExact = nrm && variants.includes(nrm);
      const gnisKey = pr.gnis_id && catGnis.has(String(pr.gnis_id).replace(/^0+/, ''));
      const pidKey = srcPids.has(String(pr.permanent_identifier));
      const containment = catBbox ? bboxesOverlap(cb, catBbox) : false;
      let nearRef = false;
      if (ov) {
        const c = [(cb[0] + cb[2]) / 2, (cb[1] + cb[3]) / 2];
        nearRef = kmBetween(c, ov.refPoint) <= ov.refRadiusKm;
      }
      const keyed = gnisKey || pidKey;
      if (!keyed && !nameExact && !(ov && nearRef)) continue;
      // sanity: reject the malformed 29x32 km class
      const diagRatio = catBbox ? bboxDiagKm(cb) / bboxDiagKm(catBbox) : 1;
      if (diagRatio > 4) continue;
      if (ov && ov.areaRangeSqKm && !keyed && !nameExact) {
        const [lo, hi] = ov.areaRangeSqKm;
        if (pr.area_sqkm < lo || pr.area_sqkm > hi) continue;
      }
      candidates.push({
        feat: f,
        bbox: cb,
        gnisKey, pidKey, nameExact, containment, nearRef, diagRatio,
        areaRatio: p.areaSqKm ? pr.area_sqkm / p.areaSqKm : null,
      });
    }

    // De-dup by permanent identifier, prefer keys: gnis/pid > exact name; area ratio closeness; larger area
    const seen = new Map();
    for (const c of candidates) {
      const pid = c.feat.properties.permanent_identifier;
      const prev = seen.get(pid);
      if (!prev || scoreOf(c) > scoreOf(prev)) seen.set(pid, c);
    }
    function scoreOf(c) {
      let s = 0;
      if (c.gnisKey || c.pidKey) s += 4;
      if (c.nameExact) s += 3;
      if (c.containment || c.nearRef) s += 1;
      if (c.areaRatio != null) s += Math.max(0, 1 - Math.min(2, Math.abs(Math.log(c.areaRatio))));
      return s;
    }
    const ranked = [...seen.values()].sort((a, b) =>
      scoreOf(b) - scoreOf(a) || b.feat.properties.area_sqkm - a.feat.properties.area_sqkm);

    if (ranked.length === 0) {
      table.push({ catalogId: slug, match: 'NO CONFIDENT MATCH — no keyed/named polygon in NHD extract' });
      results.push({ catalogId: slug, matched: false, reason: ov ? `no named polygon near ${ov.refPoint} (NHD has only unnamed slivers; see NOTES.md)` : 'no keyed or name-matched polygon' });
      continue;
    }

    const confident = (c) => (c.gnisKey || c.pidKey || c.nameExact) && (c.containment || c.nearRef || scoreOf(c) >= 4);
    const primary = ranked[0];
    if (!confident(primary)) {
      const c = primary;
      table.push({
        catalogId: slug,
        match: `LOW CONFIDENCE — ${c.feat.properties.gnis_name ?? '(unnamed)'} ${c.feat.properties.area_sqkm.toFixed(2)}sqkm (keys: gnis=${c.gnisKey} pid=${c.pidKey} name=${c.nameExact} contain=${c.containment})`,
      });
      results.push({
        catalogId: slug, matched: false, reason: 'best candidate lacked key+location agreement',
        bestCandidate: {
          nhdPermanentIdentifier: c.feat.properties.permanent_identifier,
          gnisName: c.feat.properties.gnis_name,
          areaSqKm: c.feat.properties.area_sqkm,
        },
      });
      continue;
    }

    // Accept primary + any additional keyed/name-matched polygons (multi-part lakes)
    const accepted = ranked.filter((c) => confident(c));
    accepted.forEach((c, i) => {
      const pr = c.feat.properties;
      const { rings, polygonRingCounts, vertexCount, dropped } = sanitizeRings(c.feat.geometry.coordinates);
      results.push({
        catalogId: slug,
        catalogName: cat.name,
        role: i === 0 ? 'primary' : 'part',
        matched: true,
        nhdPermanentIdentifier: pr.permanent_identifier,
        gnisId: pr.gnis_id,
        gnisName: pr.gnis_name,
        ftype: pr.ftype,
        fcode: pr.fcode,
        areaSqKm: pr.area_sqkm,
        bbox: c.bbox,
        ringCount: rings.length,
        polygonCount: polygonRingCounts.length,
        polygonRingCounts,
        vertexCount,
        droppedNonFiniteVertices: dropped,
        coordinates: rings,
        confidence: {
          nameMatch: c.nameExact ? 'exact' : c.gnisKey ? 'gnis-key' : c.pidKey ? 'pid-key' : 'none',
          containment: c.containment || c.nearRef,
          areaRatioVsCatalog: c.areaRatio,
          bboxDiagRatioVsCatalog: +c.diagRatio.toFixed(3),
        },
      });
    });
    const pr = primary.feat.properties;
    table.push({
      catalogId: slug,
      gnis_name: pr.gnis_name,
      areaSqKm: +pr.area_sqkm.toFixed(2),
      vertices: results.filter((r) => r.catalogId === slug).reduce((s, r) => s + r.vertexCount, 0),
      parts: accepted.length,
      how: primary.gnisKey ? 'gnis-key' : primary.pidKey ? 'pid-key' : 'name',
    });
  }

  writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log('\n== MATCH TABLE ==');
  console.log(
    'catalogId'.padEnd(22), 'gnis_name'.padEnd(30), 'areaSqKm'.padStart(9),
    'verts'.padStart(8), 'parts', 'how'
  );
  for (const r of table) {
    if (r.gnis_name) {
      console.log(r.catalogId.padEnd(22), String(r.gnis_name).padEnd(30), String(r.areaSqKm).padStart(9), String(r.vertices).padStart(8), String(r.parts).padStart(3), r.how);
    } else {
      console.log(r.catalogId.padEnd(22), r.match);
    }
  }
  console.log(`\nwrote ${OUT} (${results.filter((r) => r.matched).length} matched polygon entries)`);
}

main();
