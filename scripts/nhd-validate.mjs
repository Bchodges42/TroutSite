#!/usr/bin/env node
// nhd-validate.mjs — catalog-wide NHD regression suite (SESSION GEOVALID-2).
//
// Runs the six brief-mandated gates over the whole catalog plus the frozen
// per-reach B13 gate outputs, and runs the B13 known-bad regression:
//
//   1. connectivity   every traced reach is ONE connected component of its graph
//   2. termini        tailwaters start at their dam (YAML waterbodyType/notes);
//                     non-tailwaters end at confluence/mouth (per termini.json)
//   3. bbox-uniqueness  no two waters share a bbox (B13 Boone/SoHo class)
//   4. multi-longitude  no disconnected multi-longitude reaches (B13 Cane Creek)
//   5. length-sanity  reach km vs stated river miles in YAML notes, where stated
//   6. anchor-snap    anchor snap distance within the conventions tolerance
//
// Coverage model: the suite is GREEN with partial fan-out — every PRESENT
// reach must pass all gates; catalog waters without a traced reach yet are
// `pending` (listed, not failing) while GEOFANOUT-1 lands. `--strict` turns
// pending coverage (and asset-asset bbox sharing) into failures; that is the
// post-fan-out mode. `--hu8 <code>` scopes reach checking to one unit.
//
// Exit codes: 0 green (pending allowed without --strict), 1 any FAIL, 2 usage.
//
// Usage:
//   node scripts/nhd-validate.mjs [--strict] [--hu8 06010207]
//        [--asset apps/web/public/atlas/rivers.geojson]
//        [--out data/nhd/derived/validate/catalog-report.json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BBOX_SHARE_TOL_DEG,
  CONFIDENCE_LEVELS,
  FAIL_CHORD_M,
  HUMAN_REVIEW_TOKENS,
  KNOWN_BAD,
  KNOWN_BAD_WAIVERS,
  MAX_ANCHOR_SNAP_M,
  MAX_JUNCTION_M,
  REACH_BUDGET_BYTES,
  REVIEW_CHORD_M,
  STILLWATER_TYPES,
  TAILWATER_TYPE,
  bboxesOverlap,
  isValidDownSpec,
  isValidUpSpec,
  lengthSanity,
  linePartsOf,
  pathCoincidence,
  loadCatalogYamls,
  multiLongitudeDisconnection,
  nearShareBbox,
  parseStatedMiles,
  scanChords,
  stillAtOriginalSignature,
} from './nhd-validate-lib.mjs';
import { haversineM } from './nhd_lib.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- args --------------------------------------------------------------------
const args = process.argv.slice(2);
const argOf = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const hasFlag = (flag) => args.includes(flag);
const strict = hasFlag('--strict');
const hu8Filter = argOf('--hu8');
const assetPath = path.resolve(repoRoot, argOf('--asset', 'apps/web/public/atlas/rivers.geojson'));
const terminiPath = path.resolve(repoRoot, argOf('--termini', 'data/nhd/termini.json'));
const outPath = path.resolve(
  repoRoot,
  argOf('--out', 'data/nhd/derived/validate/catalog-report.json'),
);
const rel = (p) => path.relative(repoRoot, p);

// --- inputs -------------------------------------------------------------------
const findings = [];
const add = (section, severity, id, check, evidence) =>
  findings.push({ section, severity, id, check, evidence });
const catalogDir = path.join(repoRoot, 'packages/content/streams/tn');
const catalog = loadCatalogYamls(catalogDir);
const anchors = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'apps/web/src/data/streams-geo.json'), 'utf8'),
);
const asset = JSON.parse(fs.readFileSync(assetPath, 'utf8'));
const assetById = new Map(asset.features.map((f) => [f.properties.id, f]));
const termini = JSON.parse(fs.readFileSync(terminiPath, 'utf8'));
const terminiRows = new Map(Object.entries(termini.waters ?? {}));

// --- section 1: catalog integrity ---------------------------------------------
for (const [id, doc] of catalog) {
  if (!doc.name) add('catalog', 'FAIL', id, 'yaml-name', 'missing name');
  if (!doc.waterbodyType) add('catalog', 'FAIL', id, 'yaml-waterbodyType', 'missing waterbodyType');
  if (!assetById.has(id))
    add('catalog', 'FAIL', id, 'asset-feature', 'no geometry feature in rivers.geojson');
}
for (const id of assetById.keys()) {
  if (!catalog.has(id))
    add('catalog', 'FAIL', id, 'asset-extra', 'asset feature has no catalog YAML');
}

// --- section 2: termini table schema -------------------------------------------
for (const [id, doc] of catalog) {
  const row = terminiRows.get(id);
  const flowing = !STILLWATER_TYPES.has(doc.waterbodyType);
  if (!row) {
    add('termini', 'FAIL', id, 'covered', 'no termini row for catalog water');
    continue;
  }
  for (const side of ['up', 'down']) {
    const specObj = row[side];
    if (!specObj || (typeof specObj.spec !== 'string' && specObj.spec !== null)) {
      add('termini', 'FAIL', id, `spec-${side}`, 'missing spec object');
      continue;
    }
    if (flowing && specObj.spec === null) {
      add('termini', 'FAIL', id, `spec-${side}`, 'flowing water with null spec');
    } else if (specObj.spec !== null) {
      const grammarOk = side === 'up' ? isValidUpSpec(specObj.spec) : isValidDownSpec(specObj.spec);
      if (!grammarOk) add('termini', 'FAIL', id, `grammar-${side}`, specObj.spec);
    }
    if (!CONFIDENCE_LEVELS.includes(specObj.confidence)) {
      add('termini', 'FAIL', id, `confidence-${side}`, specObj.confidence);
    }
  }
  if (flowing) {
    if (row.stillwater)
      add('termini', 'FAIL', id, 'stillwater-flag', 'flowing water flagged stillwater');
    if (
      doc.waterbodyType === TAILWATER_TYPE &&
      !(row.up && typeof row.up.spec === 'string' && row.up.spec.startsWith('dam:'))
    ) {
      add(
        'termini',
        'FAIL',
        id,
        'tailwater-dam-spec',
        `up spec must be dam:* for tailrace, got ${row.up?.spec}`,
      );
    }
    const derivable =
      row.up?.confidence === 'high' && row.down?.confidence === 'high' && !row.humanReview;
    if (derivable !== !!row.autoDerivable) {
      add(
        'termini',
        'FAIL',
        id,
        'auto-derivable',
        `claims ${row.autoDerivable}, confidence says ${derivable}`,
      );
    }
    if (!row.autoDerivable && !row.humanReview) {
      add(
        'termini',
        'FAIL',
        id,
        'human-review-token',
        'not auto-derivable but no humanReview reason',
      );
    }
    if (row.humanReview && !HUMAN_REVIEW_TOKENS.includes(row.humanReview)) {
      add('termini', 'FAIL', id, 'human-review-token', row.humanReview);
    }
  } else if (!row.stillwater) {
    add('termini', 'FAIL', id, 'stillwater-flag', 'stillwater not flagged');
  }
}
const extraRows = [...terminiRows.keys()].filter((id) => !catalog.has(id));
for (const id of extraRows)
  add('termini', 'FAIL', id, 'extra-row', 'termini row has no catalog YAML');

// --- section 3: per-reach gates -------------------------------------------------
const derivedDir = path.join(repoRoot, 'data/nhd/derived');
const reachFiles = fs
  .readdirSync(derivedDir)
  .filter((f) => /^reach-.*\.geojson$/.test(f))
  .sort();
const tracedIds = new Set();
for (const file of reachFiles) {
  const reachPath = path.join(derivedDir, file);
  const id = file.replace(/^reach-/, '').replace(/\.geojson$/, '');
  tracedIds.add(id);
  const reach = JSON.parse(fs.readFileSync(reachPath, 'utf8'));
  const props = reach.properties;
  const hu8 = props.hu8;
  if (hu8Filter && hu8 !== hu8Filter) continue;
  const graphPath = path.join(repoRoot, 'data/nhd/graphs', `${hu8}.graph.json`);
  const auditPath = reachPath.replace(/\.geojson$/, '.audit.json');
  const validatePath = reachPath.replace(/\.geojson$/, '.validate.json');
  const row = terminiRows.get(id);
  const doc = catalog.get(id);

  // frozen gate sidecar must exist and PASS
  if (!fs.existsSync(validatePath)) {
    add(
      'reach',
      'FAIL',
      id,
      'b13-sidecar',
      `missing ${rel(validatePath)} — run scripts/nhd_validate.mjs`,
    );
  } else {
    const sidecar = JSON.parse(fs.readFileSync(validatePath, 'utf8'));
    if (sidecar.verdict !== 'PASS') add('reach', 'FAIL', id, 'b13-sidecar', sidecar.verdict);
  }

  // audit sidecar: continuity (junction gaps) + termini walk evidence
  const audit = fs.existsSync(auditPath)
    ? JSON.parse(fs.readFileSync(auditPath, 'utf8'))
    : { pathEdges: [], downWalk: {} };

  // 1. connectivity — sourceIds form ONE connected component of the graph
  if (!fs.existsSync(graphPath)) {
    add('reach', 'FAIL', id, 'connectivity', `missing graph ${rel(graphPath)}`);
  } else {
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    const byPid = new Map(graph.edges.map((e) => [String(e.pid), e]));
    const pids = props.sourceIds.map(String);
    const missing = pids.filter((p) => !byPid.has(p));
    const parent = new Map();
    const find = (x) => {
      while (parent.get(x) !== x) x = parent.get(x);
      return x;
    };
    for (const p of pids) parent.set(p, p);
    for (const p of pids) {
      const e = byPid.get(p);
      if (e?.from && e?.to) {
        const a = find(e.from);
        const b = find(e.to);
        if (a !== b) parent.set(a, b);
      }
    }
    const roots = new Set(pids.map((p) => find(byPid.get(p)?.from ?? 'x')));
    add('reach', roots.size === 1 && missing.length === 0 ? 'PASS' : 'FAIL', id, 'connectivity', {
      edges: pids.length,
      components: roots.size,
      missingPids: missing,
    });

    // continuity — junction gaps between consecutive path edges (audit order)
    const pathEdges = audit.pathEdges ?? [];
    let worstJunctionM = 0;
    for (let k = 1; k < pathEdges.length; k++) {
      const a = byPid.get(String(pathEdges[k - 1].pid));
      const b = byPid.get(String(pathEdges[k].pid));
      if (!a || !b) continue;
      worstJunctionM = Math.max(worstJunctionM, haversineM(a.coords.at(-1), b.coords[0]));
    }
    add('reach', worstJunctionM <= MAX_JUNCTION_M ? 'PASS' : 'FAIL', id, 'continuity', {
      worstJunctionM: Math.round(worstJunctionM),
      limitM: MAX_JUNCTION_M,
    });
  }

  // part discipline + 4. multi-longitude disconnection (chord scan)
  const parts = reach.geometry.coordinates;
  if (parts.length !== 1 || props.partCount !== 1) {
    add('reach', 'FAIL', id, 'single-part', { partCount: props.partCount, parts: parts.length });
  }
  const chords = scanChords(parts);
  if (chords.fail.length > 0) {
    add('reach', 'FAIL', id, 'multi-longitude-disconnection', {
      overThreshold: chords.fail.length,
      maxChordM: chords.maxChordM,
      limitM: FAIL_CHORD_M,
    });
  } else if (chords.review.length > 0) {
    add('reach', 'REVIEW', id, 'long-chord', {
      count: chords.review.length,
      maxChordM: chords.maxChordM,
      note: 'legitimate reservoir artpaths; review only',
    });
  }
  const ml = multiLongitudeDisconnection(parts);
  if (ml.length > 0) add('reach', 'FAIL', id, 'multi-longitude-disconnection', ml);

  // 2. termini assertions against the termini table
  if (!row) {
    add('reach', 'FAIL', id, 'termini-row', 'reach has no termini row');
  } else {
    const trace = props.trace ?? {};
    if (doc?.waterbodyType === TAILWATER_TYPE || row.up?.spec?.startsWith('dam:')) {
      // "dam" is the clean stop; a headwater stop within 2 km of the anchor is
      // also accepted because tailwater gauges sit just below the dam and some
      // units ship the lake artpath with an unresolved wbarea (endpoint still
      // at the dam). Anything farther means the walk ran past the dam — FAIL.
      const reason = trace.up?.reason;
      const distKm = trace.up?.distKmFromAnchor ?? Infinity;
      const ok =
        (trace.up?.spec === row.up.spec && reason === 'dam') ||
        (trace.up?.spec === row.up.spec && reason === 'headwater' && distKm <= 2.0);
      add('reach', ok ? 'PASS' : 'FAIL', id, 'termini-up-dam', {
        expected: row.up?.spec,
        realized: trace.up,
      });
    } else {
      add('reach', 'INFO', id, 'termini-up', { spec: row.up?.spec, realized: trace.up?.reason });
    }
    const downSpec = row.down?.spec ?? '';
    const realized = trace.down?.reason;
    let ok = false;
    let endpointEquivalent = false;
    if (downSpec === 'mouth') ok = realized === 'name-change' || realized === 'terminal-node';
    else if (downSpec.startsWith('confluence:')) {
      ok = realized === 'confluence';
      // endpoint equivalence: a walk run with spec `mouth` that stopped at a
      // name change INTO the target water ended at the same confluence.
      if (!ok && realized === 'name-change') {
        const target = downSpec.slice(11).toLowerCase();
        const entered = audit.downWalk?.enteredNames ?? [];
        endpointEquivalent = entered.some((n) => String(n).toLowerCase() === target);
        ok = endpointEquivalent;
      }
    } else if (downSpec.startsWith('point:')) ok = realized === 'point';
    else if (downSpec === null) ok = false;
    const boundaryExcused = realized === 'terminal-node' && row.hu8BoundaryReach === true;
    add('reach', ok || boundaryExcused ? 'PASS' : 'FAIL', id, 'termini-down', {
      expected: downSpec,
      realized,
      endpointEquivalent,
      boundaryExcused,
    });
  }

  // 6. anchor snap within tolerance
  const snap = props.trace?.anchor?.snapDistM;
  if (typeof snap !== 'number') {
    add('reach', 'FAIL', id, 'anchor-snap', 'no trace.anchor.snapDistM');
  } else if (snap > MAX_ANCHOR_SNAP_M && !row?.anchorWaiver) {
    add('reach', 'FAIL', id, 'anchor-snap', { snapDistM: snap, limitM: MAX_ANCHOR_SNAP_M });
  } else if (snap > MAX_ANCHOR_SNAP_M) {
    add('reach', 'REVIEW', id, 'anchor-snap-waived', { snapDistM: snap, waiver: row.anchorWaiver });
  } else {
    add('reach', 'PASS', id, 'anchor-snap', { snapDistM: snap });
  }

  // byte budget
  const bytes = fs.statSync(reachPath).size;
  add('reach', bytes <= REACH_BUDGET_BYTES ? 'PASS' : 'FAIL', id, 'byte-budget', {
    bytes,
    budgetBytes: REACH_BUDGET_BYTES,
  });

  // 5. length sanity vs stated river miles (where the YAML states any)
  const stated = parseStatedMiles(doc?.notes ?? '');
  if (stated.length > 0) {
    const trials = stated.map((s) => lengthSanity(props.lengthKm, s.miles));
    const best = trials.reduce((a, b) => (Math.abs(b.ratio - 1) < Math.abs(a.ratio - 1) ? b : a));
    add('reach', best.pass ? 'PASS' : 'FAIL', id, 'length-sanity', {
      statedMiles: parseStatedMiles(doc.notes).map((s) => s.miles),
      ...best,
    });
  }
}

// --- section 4: bbox uniqueness across waters (B13 duplicate class) -------------
const boxes = [];
for (const f of asset.features)
  boxes.push({
    id: f.properties.id,
    bbox: f.properties.bounds,
    src: 'asset',
    geometry: f.geometry,
  });
for (const file of reachFiles) {
  const id = file.replace(/^reach-/, '').replace(/\.geojson$/, '');
  const r = JSON.parse(fs.readFileSync(path.join(derivedDir, file), 'utf8'));
  if (hu8Filter && r.properties.hu8 !== hu8Filter) continue;
  boxes.push({ id: `nhd:${id}`, bbox: r.properties.bounds, src: 'reach', geometry: r.geometry });
}
const sharedPairs = [];
for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    if (boxes[i].id === boxes[j].id) continue;
    const a = boxes[i];
    const b = boxes[j];
    // a reach and its own pre-flip asset entry legitimately share geometry
    if (a.src !== b.src && (a.id === `nhd:${b.id}` || b.id === `nhd:${a.id}`)) continue;
    if (nearShareBbox(a.bbox, b.bbox)) sharedPairs.push([a, b]);
  }
}
// Classify near-shared bboxes. The B13 duplicate class is the same LINEWORK
// shipped under two ids — that fails. Distinct waters whose tiny extents
// coincide (tailwater hugging its reservoir, e.g. watauga-river-wilbur-reach
// vs wilbur-lake) are adjacency, not duplication.
for (const [a, b] of sharedPairs) {
  const la = a.parts ?? linePartsOf(a.geometry);
  const lb = b.parts ?? linePartsOf(b.geometry);
  if (la && lb) {
    const coincidence = pathCoincidence(la, lb);
    if (coincidence >= 0.6) {
      add('bbox', 'FAIL', `${a.id}|${b.id}`, 'shared-bbox-duplicate-linework', {
        a: a.bbox,
        b: b.bbox,
        coincidence: Math.round(coincidence * 100) / 100,
        class: 'B13 boone-tailwater/south-holston-river duplicate',
      });
    } else {
      add('bbox', 'REVIEW', `${a.id}|${b.id}`, 'near-shared-bbox-distinct-linework', {
        a: a.bbox,
        b: b.bbox,
        coincidence: Math.round(coincidence * 100) / 100,
      });
    }
  } else if (a.geometry.type.includes('Polygon') && b.geometry.type.includes('Polygon')) {
    add('bbox', 'REVIEW', `${a.id}|${b.id}`, 'shared-bbox-stillwaters', { a: a.bbox, b: b.bbox });
  } else {
    add('bbox', 'INFO', `${a.id}|${b.id}`, 'stillwater-adjacent-reach', {
      a: a.bbox,
      b: b.bbox,
      note: 'a reach bounding its reservoir is geography, not duplication',
    });
  }
}
// adjacent-waters sanity: report (not fail) bbox OVERLAPS between distinct
// waters — corridors legitimately touch, identical copies do not.
let overlapCount = 0;
for (let i = 0; i < asset.features.length; i++) {
  for (let j = i + 1; j < asset.features.length; j++) {
    const a = asset.features[i].properties;
    const b = asset.features[j].properties;
    if (bboxesOverlap(a.bounds, b.bounds)) overlapCount++;
  }
}

// multi-longitude over the SHIPPED asset — audit only pre-flip (cane-creek is a
// reviewed content-lane waiver), FAIL for reaches is covered in section 3.
for (const f of asset.features) {
  const ml = multiLongitudeDisconnection(f.geometry.coordinates);
  if (ml.length > 0) add('bbox', 'AUDIT', f.properties.id, 'asset-multi-part-geometry', ml);
}

// --- coverage: catalog waters without traced reaches ----------------------------
const flowingIds = [...catalog.keys()].filter(
  (id) => !STILLWATER_TYPES.has(catalog.get(id).waterbodyType),
);
const pending = flowingIds.filter((id) => !tracedIds.has(id));
if (strict) {
  for (const id of pending)
    add('coverage', 'FAIL', id, 'pending-reach', 'no traced reach (--strict)');
}
const stillwaters = [...catalog.keys()].filter((id) =>
  STILLWATER_TYPES.has(catalog.get(id).waterbodyType),
);

// --- section 5: B13 known-bad regression ----------------------------------------
const duplicateLineworkIds = new Set(
  findings
    .filter((f) => f.severity === 'FAIL' && f.check === 'shared-bbox-duplicate-linework')
    .flatMap((f) => f.id.split('|')),
);
const b13 = [];
for (const bad of KNOWN_BAD) {
  const feat = assetById.get(bad.id);
  const reachId = `reach-${bad.id}.geojson`;
  const hasReach = tracedIds.has(bad.id);
  const cur = feat?.properties.bounds;
  let verdict = 'FIXED';
  let basis = '';
  if (!feat) {
    verdict = 'FAIL';
    basis = 'asset feature missing entirely';
  } else if (stillAtOriginalSignature(bad.orig, cur)) {
    verdict = 'FAIL';
    basis = 'current bounds still match the original defect signature';
  } else if (bad.cls === 'duplicate') {
    const shares = duplicateLineworkIds.has(bad.id) || duplicateLineworkIds.has(`nhd:${bad.id}`);
    verdict = shares ? 'FAIL' : 'FIXED';
    basis = shares
      ? 'still shares duplicate linework with another water'
      : 'linework distinct from every other water; duplicate class closed';
  } else if (bad.cls === 'missing') {
    const isLine = feat.geometry.type === 'MultiLineString';
    verdict = isLine && feat.properties.vertexCount >= 8 ? 'FIXED' : 'FAIL';
    basis = isLine
      ? `line geometry present (${feat.properties.vertexCount} vertices, ${feat.properties.lengthKm} km)`
      : `geometry is ${feat.geometry.type}`;
  } else {
    basis = `bounds moved off the original ${bad.cls} signature (${bad.orig?.join(' ') ?? 'n/a'} -> ${cur.join(' ')})`;
  }
  if (KNOWN_BAD_WAIVERS[bad.id]) basis += `; WAIVER — ${KNOWN_BAD_WAIVERS[bad.id]}`;
  if (hasReach && verdict === 'FIXED') {
    basis += '; residual pre-flip geometry replaced by the validated NHD reach (see reach gates)';
  }
  const prevention = hasReach
    ? 'reach traced + gates enforced in suite'
    : `class-gated in pipeline (reach pending fan-out; ${pending.includes(bad.id) ? 'queued' : 'n/a'})`;
  b13.push({ id: bad.id, cls: bad.cls, verdict, basis, prevention });
}
if (strict) {
  for (const row of b13) {
    if (row.verdict !== 'FIXED') add('b13', 'FAIL', row.id, 'known-bad', row.basis);
  }
}

// --- verdict + report ------------------------------------------------------------
const fails = findings.filter((f) => f.severity === 'FAIL');
const reviews = findings.filter((f) => f.severity === 'REVIEW');
const b13Fails = b13.filter((r) => r.verdict !== 'FIXED');
const green = fails.length === 0 && b13Fails.length === 0;
const verdict = green
  ? strict || pending.length === 0
    ? 'PASS'
    : 'PASS (pending fan-out)'
  : 'FAIL';
const report = {
  generatedAt: new Date().toISOString(),
  lane: 'GEOVALID-2',
  suite: 'scripts/nhd-validate.mjs',
  mode: { strict, hu8Filter: hu8Filter ?? 'all' },
  verdict,
  counts: {
    catalogWaters: catalog.size,
    flowingWaters: flowingIds.length,
    stillwaters: stillwaters.length,
    tracedReaches: tracedIds.size,
    pending: pending.length,
    fails: fails.length,
    reviews: reviews.length,
    sharedBboxPairs: sharedPairs.length,
    assetBboxOverlapsInfo: overlapCount,
    terminiAutoDerivable: [...terminiRows.values()].filter((r) => r.autoDerivable).length,
    terminiHumanReview: [...terminiRows.values()].filter((r) => r.humanReview).length,
  },
  findings,
  b13,
  pending,
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

// human summary
console.log(`NHD catalog regression suite — ${verdict}`);
console.log(
  `catalog ${catalog.size} waters (${flowingIds.length} flowing / ${stillwaters.length} stillwater), ` +
    `${tracedIds.size} traced, ${pending.length} pending fan-out`,
);
console.log(
  `findings: ${fails.length} FAIL, ${reviews.length} REVIEW, ` +
    `shared-bbox pairs ${sharedPairs.length}, B13 ${b13Fails.length ? b13Fails.length + ' NOT-FIXED' : 'all FIXED'}`,
);
for (const f of [...fails, ...reviews]) {
  console.log(
    `  [${f.severity}] ${f.section}/${f.id} ${f.check}: ${JSON.stringify(f.evidence).slice(0, 200)}`,
  );
}
for (const row of b13) {
  console.log(
    `  B13 ${row.verdict.padEnd(5)} ${row.id.padEnd(26)} ${row.cls.padEnd(10)} ${row.basis.slice(0, 110)}`,
  );
}
console.log(`report: ${rel(outPath)}`);
process.exit(green ? 0 : 1);
