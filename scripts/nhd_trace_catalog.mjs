#!/usr/bin/env node
// nhd_trace_catalog.mjs — GEOFANOUT-1 integration driver: trace every catalog
// stream water from the committed NHD graphs and assemble a new
// public/atlas/rivers.geojson (schema unchanged) + riverIndex.json.
//
// Phases (run in order, or `all`):
//   discover  — per catalog water: pick HU8 unit(s) by anchor proximity, find
//               the water's NHD gnis_name from the nearest graph edge
//               -> data/nhd/derived/catalog-discovery.json
//   trace     — run scripts/nhd_trace.mjs + scripts/nhd_validate.mjs per water
//               (per-water overrides from data/nhd/derived/trace-specs.json)
//               -> data/nhd/derived/reach-<id>.geojson + .audit.json +
//                  .validate.json + catalog-trace-results.json
//   assemble  — replace PASS waters' geometry in rivers.geojson (lakes/ponds/
//               point anchors keep existing geometry; FAIL waters keep their
//               existing linework as the conventions §8 fallback), enforce the
//               ≤2.0 MB statewide budget by re-tracing the largest reaches,
//               regenerate riverIndex.json, run validate-atlas + continuity
//               audit.
//
// Scope guards: existing engine scripts are NOT modified; lakes/ponds are not
// traced (no flowline geometry exists for them in the frozen intermediate);
// waters that fail keep their shipped geometry and are flagged in the report.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSET = path.join(ROOT, 'apps/web/public/atlas/rivers.geojson');
const ANCHORS = path.join(ROOT, 'apps/web/src/data/streams-geo.json');
const DERIVED = path.join(ROOT, 'data/nhd/derived');
const GRAPHS = path.join(ROOT, 'data/nhd/graphs');
const SPECS = path.join(DERIVED, 'trace-specs.json');
const RESULTS = path.join(DERIVED, 'catalog-trace-results.json');
const DISCOVERY = path.join(DERIVED, 'catalog-discovery.json');
const RIVER_INDEX_SCRIPT = path.join(ROOT, 'apps/web/scripts/regenerate-river-index.mjs');
const VALIDATE_ATLAS = path.join(ROOT, 'apps/web/scripts/validate-atlas.mjs');
const CONTINUITY = path.join(ROOT, 'apps/web/scripts/audit-river-continuity.mjs');
const TOTAL_BUDGET = 1_900_000; // statewide rivers.geojson target (conventions §6.5: ≤2.0 MB)
const MIN_REACH_BUDGET = 6_000;
const TRACEABLE = new Set(['river', 'creek', 'tailrace', 'spring']);

const argPos = (i, def) => process.argv[i + 2] ?? def;
const phase = process.argv[2] ?? 'all';
const onlyIds = (process.argv.indexOf('--only') >= 0)
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null;
const budgetIdx = process.argv.indexOf('--budget');
const baseBudget = budgetIdx >= 0 ? Number(process.argv[budgetIdx + 1]) : 81_920;
const resultsIdx = process.argv.indexOf('--results-out');
// per-chunk result files let parallel workers trace disjoint water sets safely
const RESULTS_OUT = resultsIdx >= 0
  ? path.resolve(ROOT, process.argv[resultsIdx + 1])
  : RESULTS;

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
// specs: base file + any trace-specs.<name>.json fragments (parallel workers write
// disjoint fragments; later alphabetical fragments win on key conflicts)
function loadSpecs() {
  const dir = path.dirname(SPECS);
  const base = fs.existsSync(SPECS) ? readJson(SPECS) : {};
  const frags = fs.readdirSync(dir)
    .filter((f) => /^trace-specs\..+\.json$/.test(f))
    .sort();
  const merged = { ...base };
  for (const f of frags) Object.assign(merged, readJson(path.join(dir, f)));
  delete merged._comment;
  return merged;
}
let specsCache;
const getSpecs = () => (specsCache ??= loadSpecs());
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const R_EARTH = 6371000;
const hav = (a, b) => {
  const t = Math.PI / 180;
  const dLa = (b[1] - a[1]) * t, dLo = (b[0] - a[0]) * t;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * t) * Math.cos(b[1] * t) * Math.sin(dLo / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(h));
};
// distance anchor->[lon,lat] point, degrees treated equirectangularly (fast, fine <5 km)
const ptDistM = (anchor, x, y) => {
  const midLat = ((anchor[1] + y) / 2) * (Math.PI / 180);
  const dx = (x - anchor[0]) * 111320 * Math.cos(midLat);
  const dy = (y - anchor[1]) * 110540;
  return Math.hypot(dx, dy);
};
const segDistM = (anchor, x0, y0, x1, y1) => {
  const midLat = ((anchor[1] + (y0 + y1) / 2) / 2) * (Math.PI / 180);
  const px = (v) => v[0] * 111320 * Math.cos(midLat);
  const py = (v) => v[1] * 110540;
  const ax = px([x0, y0]), ay = py([x0, y0]), bx = px([x1, y1]), by = py([x1, y1]);
  const mx = px(anchor), my = py(anchor);
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((mx - ax) * dx + (my - ay) * dy) / len2)) : 0;
  return Math.hypot(mx - (ax + t * dx), my - (ay + t * dy));
};

function loadCatalogStreams() {
  const asset = readJson(ASSET);
  const anchors = readJson(ANCHORS);
  const specs = getSpecs();
  const streams = asset.features.filter(
    (f) => f.geometry.type === 'MultiLineString' && TRACEABLE.has(f.properties.waterbodyType),
  );
  return { asset, anchors, specs, streams };
}

// ---------- discover ----------
function discover() {
  const { anchors, specs, streams } = loadCatalogStreams();
  console.log(`loading graphs for unit index…`);
  const units = fs.readdirSync(GRAPHS).filter((f) => f.endsWith('.graph.json')).map((f) => f.replace('.graph.json', ''));
  const index = new Map(); // unit -> {bbox, edges:[[x0,y0,x1,y1,name,pid]]}
  for (const unit of units) {
    const g = readJson(path.join(GRAPHS, `${unit}.graph.json`));
    const bbox = [180, 90, -180, -90];
    const edges = [];
    for (const e of g.edges) {
      const cs = e.coords;
      const x0 = cs[0][0], y0 = cs[0][1], x1 = cs[cs.length - 1][0], y1 = cs[cs.length - 1][1];
      for (const [x, y] of [[x0, y0], [x1, y1]]) {
        if (x < bbox[0]) bbox[0] = x; if (x > bbox[2]) bbox[2] = x;
        if (y < bbox[1]) bbox[1] = y; if (y > bbox[3]) bbox[3] = y;
      }
      edges.push([x0, y0, x1, y1, e.name, e.pid]);
    }
    index.set(unit, { bbox, edges });
    console.log(`  ${unit}: ${edges.length} edges`);
  }
  const M = 0.25; // bbox margin (degrees) for candidate filtering
  const out = { generatedAt: new Date().toISOString(), waters: {} };
  for (const f of streams) {
    const id = f.properties.id;
    const gauge = anchors[id];
    const la = f.properties.labelAnchor;
    const anchorLonLat = gauge ? [gauge.lon, gauge.lat] : Array.isArray(la) ? la : null;
    if (!anchorLonLat) { out.waters[id] = { error: 'no anchor available' }; continue; }
    const cand = [...index.entries()].filter(([, u]) =>
      anchorLonLat[0] >= u.bbox[0] - M && anchorLonLat[0] <= u.bbox[2] + M &&
      anchorLonLat[1] >= u.bbox[1] - M && anchorLonLat[1] <= u.bbox[3] + M);
    if (!cand.length) { out.waters[id] = { error: 'anchor outside every unit bbox', anchor: anchorLonLat }; continue; }
    // nearest edges across candidate units, name-match bonus from catalog name
    const want = norm(f.properties.name);
    const scored = [];
    for (const [unit, u] of cand) {
      for (const e of u.edges) {
        const d = segDistM(anchorLonLat, e[0], e[1], e[2], e[3]);
        const bonus = e[4] && norm(e[4]) === want ? 2500 : 0; // meters of effective closeness
        scored.push({ unit, dist: d - bonus, rawDist: d, name: e[4], pid: e[5] });
      }
    }
    scored.sort((a, b) => a.dist - b.dist);
    const best = scored[0];
    // majority gnis name among 5 nearest edges
    const tally = new Map();
    for (const s of scored.slice(0, 5)) if (s.name) tally.set(s.name, (tally.get(s.name) ?? 0) + 1);
    const nhdName = best.name ?? [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const altUnits = [...new Set(scored.slice(0, 12).map((s) => s.unit))].filter((u) => u !== best.unit);
    out.waters[id] = {
      anchor: anchorLonLat,
      anchorSource: gauge ? 'gauge' : 'labelAnchor',
      unit: best.unit,
      snapDistM: Math.round(best.rawDist),
      nhdName,
      altUnits,
      hasSpec: Boolean(specs[id]),
    };
  }
  writeJson(DISCOVERY, out);
  const bad = Object.entries(out.waters).filter(([, v]) => v.error);
  console.log(`discovery: ${Object.keys(out.waters).length} waters, ${bad.length} without unit/anchor`);
  for (const [id, v] of bad) console.log(`  !! ${id}: ${v.error}`);
}

// ---------- trace ----------
function run(cmd, args) {
  try {
    return { ok: true, out: execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { ok: false, out: String(e.stdout ?? ''), err: String(e.stderr ?? e.message) };
  }
}

function traceOne(id, water, spec, budget, forceRound4 = false) {
  const unit = spec?.unit ?? water.unit; // spec.unit pins waters discovered in the wrong HU8
  const reachPath = path.join(DERIVED, `reach-${id}.geojson`);
  const up = spec?.up ?? (water.waterbodyType === 'tailrace' ? null : 'headwater');
  const down = spec?.down ?? 'mouth';
  if (!up) return { ok: false, stage: 'spec', err: 'tailrace without up spec in trace-specs.json' };
  const traceArgs = [
    'scripts/nhd_trace.mjs',
    '--graph', `data/nhd/graphs/${unit}.graph.json`,
    '--id', id,
    '--name', water.catalogName,
    '--gnis', water.nhdName,
    '--waterbody-type', water.waterbodyType,
    '--anchor', `${(spec?.anchor ?? water.anchor)[1]},${(spec?.anchor ?? water.anchor)[0]}`,
    '--up', up, '--down', down,
    '--simplify-m', forceRound4 ? '150' : budget <= 12_000 ? '50,100,150' : budget <= 60_000 ? '25,50,100' : '10,25,50',
    '--round', forceRound4 || budget <= 6_000 ? '4' : '5',
    '--budget-bytes', String(budget),
    '--out', `data/nhd/derived/reach-${id}.geojson`,
  ];
  const t = run('node', traceArgs);
  if (!t.ok) return { ok: false, stage: 'trace', err: (t.err || t.out).split('\n').slice(-3).join(' | ') };
  const vArgs = [
    'scripts/nhd_validate.mjs',
    '--reach', `data/nhd/derived/reach-${id}.geojson`,
    '--graph', `data/nhd/graphs/${unit}.graph.json`,
    '--asset', 'apps/web/public/atlas/rivers.geojson',
    '--budget-bytes', String(budget),
  ];
  if (spec?.separateFrom) vArgs.push('--separate-from', spec.separateFrom.join(','));
  if (spec?.expectUp) vArgs.push('--expect-up-point', spec.expectUp.join(','), '--expect-up-radius-m', String(spec.expectUpRadiusM ?? 600));
  if (spec?.expectDown) vArgs.push('--expect-down-point', spec.expectDown.join(','), '--expect-down-radius-m', String(spec.expectDownRadiusM ?? 3000));
  const v = run('node', vArgs);
  let report = null;
  try { report = readJson(path.join(DERIVED, `reach-${id}.validate.json`)); } catch { /* validator wrote nothing */ }
  const reach = fs.existsSync(reachPath) ? readJson(reachPath) : null;
  return {
    ok: v.ok,
    stage: 'validate',
    verdict: report?.verdict ?? 'UNKNOWN',
    failures: (report?.checks ?? []).filter((c) => !c.pass).map((c) => c.name),
    bytes: reach ? fs.statSync(reachPath).size : 0,
    lengthKm: reach?.properties?.lengthKm,
    vertexCount: reach?.properties?.vertexCount,
    throughLakeIds: reach?.properties?.throughLakeIds ?? [],
  };
}

function trace() {
  const discovery = readJson(DISCOVERY);
  const { specs, streams } = loadCatalogStreams();
  const byId = new Map(streams.map((f) => [f.properties.id, f]));
  const results = {};
  const ids = (onlyIds ?? Object.keys(discovery.waters)).filter((id) => byId.has(id));
  let done = 0;
  for (const id of ids) {
    const d = discovery.waters[id];
    const feature = byId.get(id);
    const water = {
      catalogName: feature.properties.name,
      waterbodyType: feature.properties.waterbodyType,
      ...d,
    };
    done += 1;
    if (d.error) { results[id] = { verdict: 'NO-UNIT', error: d.error }; console.log(`[${done}/${ids.length}] ${id}: NO-UNIT`); continue; }
    const spec = specs[id] ?? {};
    let r = traceOne(id, water, spec, baseBudget);
    // retry once with the discovered NHD name if the trace died late (name mismatch on walk)
    if (!r.ok && r.stage === 'trace' && spec.up) {
      r = traceOne(id, water, spec, baseBudget);
    }
    results[id] = {
      unit: d.unit,
      nhdName: d.nhdName,
      snapDistM: d.snapDistM,
      spec: { up: spec.up ?? 'headwater', down: spec.down ?? 'mouth' },
      verdict: r.ok ? r.verdict : 'FAIL',
      failures: r.failures ?? [],
      bytes: r.bytes ?? 0,
      lengthKm: r.lengthKm,
      vertexCount: r.vertexCount,
      throughLakeIds: r.throughLakeIds ?? [],
      error: r.err ?? null,
    };
    console.log(`[${done}/${ids.length}] ${id}: ${results[id].verdict}${r.failures?.length ? ' (' + r.failures.join(',') + ')' : ''} ${r.err ? 'ERR:' + r.err.slice(0, 120) : ''}`);
  }
  writeJson(RESULTS_OUT, { generatedAt: new Date().toISOString(), budget: baseBudget, results });
  const pass = Object.values(results).filter((r) => r.verdict === 'PASS').length;
  console.log(`trace: ${pass}/${ids.length} PASS`);
}

// ---------- assemble ----------
// Trace throughLakeIds are slugs of NHD waterbody names; the asset's lake
// features use catalog ids. Reconcile so the map never gets a dangling id.
function buildLakeReconciler(asset) {
  const lakes = asset.features
    .filter((f) => ['lake', 'pond'].includes(f.properties.waterbodyType) || f.geometry.type === 'MultiPolygon' || f.geometry.type === 'Polygon')
    .map((f) => f.properties.id);
  const lakeTokens = new Map(lakes.map((id) => [id, new Set(norm(id).split(' '))]));
  const GENERIC = new Set(['lake', 'pond', 'reservoir']);
  const cache = new Map();
  const dropped = new Set();
  const reconcile = (slug) => {
    if (!slug) return slug;
    if (cache.has(slug)) return cache.get(slug);
    let mapped = slug;
    if (!lakes.includes(slug)) {
      const s = new Set(norm(slug).split(' ').filter((t) => !GENERIC.has(t)));
      let best = null;
      for (const [id, toks] of lakeTokens) {
        const core = [...toks].filter((t) => !GENERIC.has(t));
        const overlap = core.filter((t) => s.has(t)).length;
        if (overlap > 0 && (!best || overlap > best.overlap)) best = { id, overlap, coreLen: core.length };
      }
      if (best) mapped = best.id; else { mapped = null; dropped.add(slug); }
    }
    cache.set(slug, mapped);
    return mapped;
  };
  reconcile.dropped = dropped;
  return reconcile;
}

function assemble() {
  const { asset, streams } = loadCatalogStreams();
  const results = readJson(RESULTS).results;
  const byId = new Map(streams.map((f) => [f.properties.id, f]));
  const reconcileLake = buildLakeReconciler(asset);
  const budgets = new Map(); // id -> tightened budget for the global pass
  for (const [id, r] of Object.entries(results)) if (r.verdict === 'PASS') budgets.set(id, baseBudget);

  const totalBytes = () => {
    let n = 0;
    for (const f of asset.features) {
      n += budgets.has(f.properties.id)
        ? fs.statSync(path.join(DERIVED, `reach-${f.properties.id}.geojson`)).size
        : JSON.stringify(f).length;
    }
    return n;
  };
  const rebuildFeature = (id, oldFeature) => {
    const reach = readJson(path.join(DERIVED, `reach-${id}.geojson`));
    const p = reach.properties;
    const coords = reach.geometry.coordinates; // single part array of [lon,lat]
    const next = {
      id: p.id,
      name: p.name,
      waterbodyType: p.waterbodyType,
      throughLakeIds: [...new Set((p.throughLakeIds ?? []).map(reconcileLake).filter(Boolean))],
      allowOpenEnds: oldFeature.properties.allowOpenEnds ?? false,
      source: 'nhd',
      approximate: false,
      labelAnchor: oldFeature.properties.labelAnchor ?? coords[Math.floor(coords.length / 2)],
      bounds: p.bounds,
      regionId: oldFeature.properties.regionId,
      gaugeIds: oldFeature.properties.gaugeIds ?? [],
      crs: 'EPSG:4326',
      coordinateOrder: 'longitude,latitude',
      partCount: 1,
      vertexCount: p.vertexCount,
      lengthKm: p.lengthKm,
      sourceIds: p.sourceIds,
      sourceRetrieved: p.sourceRetrieved,
      // additive keys — consumers must ignore what they don't know (conventions §6.4)
      geometrySource: 'nhd',
      hu8: p.hu8,
      simplification: p.simplification,
      trace: p.trace,
    };
    return { type: 'Feature', properties: next, geometry: { type: 'MultiLineString', coordinates: [coords] } };
  };

  // Global budget pass: re-trace the largest reaches with tightened budgets.
  console.log(`initial total (approx): ${(totalBytes() / 1e6).toFixed(2)} MB`);
  const round4 = new Set();
  let guard = 0;
  let noProgress = 0;
  while (guard++ < 400) {
    const total = totalBytes();
    if (total <= TOTAL_BUDGET) break;
    if (noProgress >= 3) { console.log(`no progress squeezing largest reaches; total ${(total / 1e6).toFixed(2)} MB`); break; }
    const traced = [...budgets.entries()]
      .map(([id, b]) => ({ id, b, bytes: fs.statSync(path.join(DERIVED, `reach-${id}.geojson`)).size }))
      .sort((a, b) => b.bytes - a.bytes);
    const big = traced[0];
    const before = big.bytes;
    const nextBudget = Math.max(MIN_REACH_BUDGET, Math.floor(big.b * 0.6));
    budgets.set(big.id, nextBudget);
    const r4 = nextBudget === MIN_REACH_BUDGET; // at the geometric floor: squeeze with 150 m + 4 dp
    if (r4) round4.add(big.id);
    const d = readJson(DISCOVERY).waters[big.id];
    const spec = getSpecs()[big.id] ?? {};
    const feature = byId.get(big.id);
    const r = traceOne(big.id, {
      catalogName: feature.properties.name, waterbodyType: feature.properties.waterbodyType, ...d,
    }, spec, r4 ? 6_000 : nextBudget, r4);
    const after = fs.statSync(path.join(DERIVED, `reach-${big.id}.geojson`)).size;
    if (after >= before) noProgress += 1; else noProgress = 0;
    console.log(`  squeeze ${big.id}: ${before} -> ${after} bytes (budget ${r4 ? 6_000 : nextBudget}${r4 ? ', round4' : ''})${r.ok ? '' : ' [trace failed, kept previous]'}`);
  }
  console.log(`final total: ${(totalBytes() / 1e6).toFixed(2)} MB`);

  const applied = [];
  const kept = [];
  const nextFeatures = asset.features.map((f) => {
    const id = f.properties.id;
    if (!budgets.has(id)) return f;
    const r = results[id];
    if (r.verdict !== 'PASS') {
      kept.push(id);
      const next = structuredClone(f);
      next.properties.geometrySource = 'tiger-fallback';
      return next;
    }
    applied.push(id);
    return rebuildFeature(id, f);
  });
  fs.writeFileSync(ASSET, JSON.stringify({ type: 'FeatureCollection', features: nextFeatures }));
  console.log(`assembled: ${applied.length} waters replaced with NHD traces, ${kept.length} kept on fallback, ${asset.features.length - applied.length - kept.length} untouched (lakes/points)`);
  if (reconcileLake.dropped.size) console.log(`throughLake slugs with no catalog lake match (dropped): ${[...reconcileLake.dropped].join(', ')}`);

  console.log('regenerating riverIndex…');
  run('node', [RIVER_INDEX_SCRIPT]);
  console.log('validate-atlas…');
  const va = run('node', [VALIDATE_ATLAS]);
  console.log(va.ok ? va.out.split('\n').slice(-6).join('\n') : `VALIDATE-ATLAS FAILED:\n${(va.err || va.out).split('\n').slice(-15).join('\n')}`);
  if (fs.existsSync(CONTINUITY)) {
    const ca = run('node', [CONTINUITY]);
    console.log(ca.ok ? `continuity audit: ok\n${ca.out.split('\n').slice(-4).join('\n')}` : `CONTINUITY AUDIT FAILED:\n${(ca.err || ca.out).split('\n').slice(-15).join('\n')}`);
  }
  writeJson(path.join(DERIVED, 'catalog-trace-results.json'), {
    generatedAt: new Date().toISOString(),
    results: Object.fromEntries(Object.entries(results).map(([id, r]) => [id, { ...r, finalBudget: budgets.get(id) ?? null }])),
    assembly: { applied, kept, totalBytes: totalBytes() },
  });
}

if (phase === 'discover') discover();
else if (phase === 'trace') trace();
else if (phase === 'assemble') assemble();
else if (phase === 'all') { discover(); trace(); assemble(); }
else { console.error('usage: nhd_trace_catalog.mjs discover|trace|assemble|all [--only id1,id2] [--budget N]'); process.exit(2); }
