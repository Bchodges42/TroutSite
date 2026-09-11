/**
 * Flow-orientation core — PURE derivation logic, no fs, no DOM.
 *
 * Consumed by `build-flow-orientation.mjs` (the CLI that reads the atlas
 * GeoJSON + verified topology records and writes
 * `src/features/map/flowOrientation.json`) and by the vitest suite
 * (`test/flow-orientation.test.ts`), which exercises the same code against
 * small synthetic fixtures.
 *
 * DERIVATION (priority order — see docs/flow-orientation.md):
 *   (a) Verified topology: a record's `downstreamFeatureIds` /
 *       `upstreamFeatureIds` edge is accepted only when an endpoint of the
 *       feature actually lies near the referenced water's geometry
 *       (id strings are normalized: a "name (prose suffix)" id is stripped to
 *       its feature-id prefix and dropped when no such feature exists).
 *   (a) Dam anchors: for LINE features the verified dam sits at the feature's
 *       UPSTREAM end (every dammed line water in the atlas is the reach below
 *       a dam — tailrace/tailwater or a lake outflow reach). For lake
 *       POLYGONS the dam is the outlet (downstream end) — used only to orient
 *       through-lake rivers, never the lakes themselves.
 *   (b) Lake in/out: for a line feature with `throughLakeIds`, an endpoint
 *       INSIDE the lake polygon is where the water joins the pool — that end
 *       is downstream (flow exits toward the dam/outlet side). When both ends
 *       lie outside, the endpoint nearer the through-lake's dam is downstream.
 *   (c) Confluence graph: endpoints snapped (~50 m) onto other waters build a
 *       touch graph; verified topology edges form a directed network whose
 *       downstream termini (no verified outflow — the Mississippi itself,
 *       terminal lakes) anchor depth 0, with depth rising upstream. A touched
 *       neighbor SHALLOWER than this water is the recipient — the endpoint
 *       flows INTO it (an unranked touch neighbor is always the recipient).
 *       Touching a dammed lake AT its dam is an outflow, never an inflow.
 *       Cumberland/Tennessee main stems anchor to the Mississippi through the
 *       verified lake chain (cumberland → lake-barkley → kentucky-lake →
 *       tennessee-river) recorded in the topology files. Ties (braids,
 *       head-to-head continuations at equal depth) yield no evidence.
 *   (d) Part-junction chaining: an oriented part propagates its direction
 *       across a junction of EXACTLY TWO of its feature's part-ends. Junctions
 *       of 3+ ends (braids/forks) are never propagated — the continuation
 *       through a fork would be oriented backwards.
 *   Anything still unoriented stays 0 (unknown-safe: never guessed).
 */

export const SNAP_M = 50; // confluence / part-junction snap
export const VERIFY_SNAP_M = 900; // topology edge geometric verification budget
export const DAM_SNAP_M = 1200; // dam-to-endpoint budget (damPoolDistanceM can be ~1km)
export const CELL_DEG = 0.005; // vertex grid cell (~450 m at TN latitudes)

const EARTH_R = 6371000;
const DEG = Math.PI / 180;

/** Great-circle distance in meters (haversine). */
export function distanceM(a, b) {
  const dLat = (b[1] - a[1]) * DEG;
  const dLon = (b[0] - a[0]) * DEG;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * DEG) * Math.cos(b[1] * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function lineParts(feature) {
  if (!feature || !feature.geometry) return [];
  if (feature.geometry.type === 'MultiLineString') return feature.geometry.coordinates;
  if (feature.geometry.type === 'LineString') return [feature.geometry.coordinates];
  return [];
}

/** Vertex grid over every feature vertex (line parts + polygon rings):
 *  cell -> [x, y, fi]. Lakes participate so endpoint-to-lake verification,
 *  shore confluences, and the touch graph can see impoundment termini. */
function buildVertexGrid(features) {
  const grid = new Map();
  const add = (x, y, fi) => {
    const k = Math.floor(x / CELL_DEG) + ':' + Math.floor(y / CELL_DEG);
    let bucket = grid.get(k);
    if (!bucket) grid.set(k, (bucket = []));
    bucket.push([x, y, fi]);
  };
  features.forEach((f, fi) => {
    lineParts(f).forEach((part) => {
      for (const [x, y] of part) add(x, y, fi);
    });
    for (const poly of polygonsOf(f)) for (const ring of poly) for (const [x, y] of ring) add(x, y, fi);
  });
  return grid;
}

function gridRadiusCells(meters) {
  // 0.005° of latitude ≈ 555 m; of longitude ≈ 450 m at TN latitudes. Round up.
  return Math.max(1, Math.ceil(meters / 420));
}

function nearVertices(grid, x, y, meters) {
  const cx = Math.floor(x / CELL_DEG);
  const cy = Math.floor(y / CELL_DEG);
  const r = gridRadiusCells(meters);
  const out = [];
  for (let i = -r; i <= r; i++) {
    for (let j = -r; j <= r; j++) {
      const bucket = grid.get(cx + i + ':' + (cy + j));
      if (bucket) out.push(...bucket);
    }
  }
  return out;
}

/** Feature ids near a point (distinct, excluding `excludeFi`) within meters. */
function touchingFeatureIds(grid, point, meters, excludeFi) {
  const found = new Map(); // fi -> min distance
  for (const [x, y, fi] of nearVertices(grid, point[0], point[1], meters)) {
    if (fi === excludeFi) continue;
    const d = distanceM(point, [x, y]);
    if (d <= meters && d < (found.get(fi) ?? Infinity)) found.set(fi, d);
  }
  return found;
}

/**
 * Geometric verification for a topology edge feature(fi) -> targetId: some
 * endpoint of fi's line parts lies within VERIFY_SNAP_M of the target's
 * geometry, or inside one of the target's polygons (deep-in-lake mouths that
 * are far from every shore vertex).
 */
function verifiedTopologyEndpoint(features, grid, fi, targetId, _topologyRecords) {
  const targetFi = features.findIndex((f) => f.properties?.id === targetId);
  if (targetFi < 0) return false;
  const target = features[targetFi];
  const isPolygonTarget = polygonsOf(target).length > 0;
  for (const part of lineParts(features[fi])) {
    for (const endpoint of [part[0], part[part.length - 1]]) {
      if (isPolygonTarget && pointInFeaturePolygons(endpoint, target)) return true;
      for (const [x, y, gf] of nearVertices(grid, endpoint[0], endpoint[1], VERIFY_SNAP_M)) {
        if (gf !== targetFi) continue;
        if (distanceM(endpoint, [x, y]) <= VERIFY_SNAP_M) return true;
      }
    }
  }
  return false;
}

/** Topology id strings normalize: "normandy-lake(terminus ...)" -> "normandy-lake". */
export function normalizeTopologyIds(rawIds, knownIds, selfId) {
  const out = [];
  for (const raw of rawIds ?? []) {
    const id = String(raw).replace(/\s*\(.*$/, '').trim();
    if (id && knownIds.has(id) && id !== selfId) out.push(id);
  }
  return out;
}

function pointInRing(point, ring) {
  // Ray casting; ring = [x,y][] (GeoJSON linear ring, closed or not).
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonsOf(feature) {
  if (!feature || !feature.geometry) return [];
  if (feature.geometry.type === 'Polygon') return [feature.geometry.coordinates];
  if (feature.geometry.type === 'MultiPolygon') return feature.geometry.coordinates;
  return [];
}

function pointInFeaturePolygons(point, feature) {
  return polygonsOf(feature).some((poly) => pointInRing(point, poly[0]));
}

/**
 * Derive per-feature, per-part downstream orientation flags.
 *
 * @param {object} input
 * @param {Array} input.features  rivers.geojson features (lines + lake polygons)
 * @param {Array} input.topologyRecords  records from atlas-sources/verified/*.topology.json
 * @returns {{ waters: Record<string, {parts: number[], confidence: string, methods: string[]}>, stats: object }}
 */
export function deriveFlowOrientation({ features, topologyRecords }) {
  // Index space = ALL features (lakes included) so lakes act as graph nodes and
  // verification targets; orientation output only covers line features.
  const knownIds = new Set(features.map((f) => f.properties?.id).filter(Boolean));
  const indexById = new Map(features.map((f, i) => [f.properties.id, i]));
  const isLine = features.map((f) => lineParts(f).length > 0);
  const topoById = new Map(
    (topologyRecords ?? []).filter((r) => r && indexById.has(r.featureId)).map((r) => [r.featureId, r]),
  );
  const grid = buildVertexGrid(features);

  // ---- graph edges: endpoint touches + dam coincidences ----------------------
  const adjacency = new Map(); // fi -> Set<fi> (undirected)
  const addEdge = (a, b) => {
    if (a === b) return;
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a).add(b);
  };
  features.forEach((f, fi) => {
    if (!isLine[fi]) return;
    lineParts(f).forEach((part) => {
      for (const endpoint of [part[0], part[part.length - 1]]) {
        for (const otherFi of touchingFeatureIds(grid, endpoint, SNAP_M, fi).keys()) {
          addEdge(fi, otherFi);
          addEdge(otherFi, fi);
        }
      }
    });
  });
  // Verified topology edges: both an UNDIRECTED graph edge set (letting hop
  // distance flow through record-verified joins whose raw geometry gap exceeds
  // the 50 m touch snap) and a DIRECTED edge set (downstream direction) used to
  // rank waters by hop-depth to the network's downstream termini.
  const verifiedUndirected = new Set(); // 'a|b' with a < b
  const verifiedDirected = new Map(); // fi -> Set<fi> (flows into)
  const markDirected = (from, to) => {
    verifiedUndirected.add(from < to ? from + '|' + to : to + '|' + from);
    if (!verifiedDirected.has(from)) verifiedDirected.set(from, new Set());
    verifiedDirected.get(from).add(to);
  };
  for (const [id, record] of topoById) {
    const fi = indexById.get(id);
    if (!isLine[fi] && polygonsOf(features[fi]).length === 0) continue;
    for (const nid of normalizeTopologyIds(record.downstreamFeatureIds, knownIds, id)) {
      if (verifiedTopologyEndpoint(features, grid, fi, nid)) markDirected(fi, indexById.get(nid));
    }
    for (const nid of normalizeTopologyIds(record.upstreamFeatureIds, knownIds, id)) {
      if (verifiedTopologyEndpoint(features, grid, fi, nid)) markDirected(indexById.get(nid), fi);
    }
  }
  // Dam coincidences: a lake's dam and its tailwater's dam are the same works —
  // two records whose dam coordinates coincide (~100 m) are physically joined.
  const dammed = [...topoById.entries()].filter(([, r]) => r.dam?.coordinates);
  for (let i = 0; i < dammed.length; i++) {
    for (let j = i + 1; j < dammed.length; j++) {
      if (distanceM(dammed[i][1].dam.coordinates, dammed[j][1].dam.coordinates) <= 100) {
        markDirected(indexById.get(dammed[i][0]), indexById.get(dammed[j][0]));
        markDirected(indexById.get(dammed[j][0]), indexById.get(dammed[i][0]));
      }
    }
  }
  for (const key of verifiedUndirected) {
    const [a, b] = key.split('|').map(Number);
    addEdge(a, b);
    addEdge(b, a);
  }

  // ---- hop depth to the verified network's downstream termini ----------------
  // depth 0 = a verified-network member with no verified outflow edge (its
  // water leaves the catalog or is unrecorded — the Mississippi, terminal
  // lakes...). Deeper = more joins away from the terminus. Waters with NO
  // verified edges at all stay Infinity (unranked: the confluence rule can
  // still orient them INTO ranked waters).
  const hasVerifiedEdge = new Set(verifiedDirected.keys());
  for (const set of verifiedDirected.values()) for (const to of set) hasVerifiedEdge.add(to);
  const depth = new Array(features.length).fill(Infinity);
  features.forEach((_f, fi) => {
    if (hasVerifiedEdge.has(fi) && !(verifiedDirected.get(fi)?.size > 0)) depth[fi] = 0;
  });
  for (let iter = 0; iter <= features.length; iter++) {
    let changed = false;
    for (const [from, tos] of verifiedDirected) {
      let best = Infinity;
      for (const to of tos) best = Math.min(best, depth[to]);
      if (best !== Infinity && 1 + best < depth[from]) {
        depth[from] = 1 + best;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // ---- endpoint evidence -----------------------------------------------------
  // polarity per (fi, pi, which): 'down' (flows out here) | 'up' (flows in here)
  const evidence = new Map(); // key -> { polarity, method }
  const setEv = (fi, pi, which, polarity, method) => {
    const key = fi + ':' + pi + ':' + which;
    const prev = evidence.get(key);
    // priority: don't overwrite a topo/dam-derived polarity with weaker methods
    const rank = { 'topo-down': 0, 'topo-up': 0, termini: 1, dam: 1, lake: 2, confluence: 3, chain: 4 };
    if (!prev || (rank[method] ?? 9) < (rank[prev.method] ?? 9)) evidence.set(key, { polarity, method });
  };

  features.forEach((f, fi) => {
    if (!isLine[fi]) return;
    const id = f.properties.id;
    const record = topoById.get(id);
    const parts = lineParts(f);
    const upIds = normalizeTopologyIds(record?.upstreamFeatureIds, knownIds, id).filter((x) => indexById.has(x));
    const downIds = normalizeTopologyIds(record?.downstreamFeatureIds, knownIds, id).filter((x) => indexById.has(x));

    const throughLakeIds = f.properties.throughLakeIds ?? [];
    const throughLakes = throughLakeIds
      .map((lid) => features.find((x) => x.properties?.id === lid))
      .filter((x) => x && polygonsOf(x).length > 0);

    parts.forEach((part, pi) => {
      const endpoints = { start: part[0], end: part[part.length - 1] };

      for (const [which, point] of Object.entries(endpoints)) {
        // (a) verified topology up/down + termini — nearest verified target first
        const nearTargets = touchingFeatureIds(grid, point, VERIFY_SNAP_M, fi);
        let best = null;
        for (const [tfi, d] of nearTargets) {
          const tid = features[tfi].properties.id;
          if (downIds.includes(tid) && (!best || d < best.d)) best = { d, polarity: 'down', method: 'topo-down' };
          if (upIds.includes(tid) && (!best || d < best.d)) best = { d, polarity: 'up', method: 'topo-up' };
          if (
            !best &&
            record?.termini?.some(
              (t) => t.target === tid && typeof t.anchor === 'string' && /mouth|confluence/i.test(t.anchor),
            )
          )
            best = { d, polarity: 'down', method: 'termini' };
        }
        if (best && best.d <= VERIFY_SNAP_M) setEv(fi, pi, which, best.polarity, best.method);

        // (a) dam anchor — dammed LINE waters are reaches BELOW their dam,
        // so the dam end is the upstream (inflow) end. Verified by real records:
        // every dammed line feature's dam sits within DAM_SNAP_M of one endpoint.
        if (record?.dam?.coordinates) {
          const d = distanceM(record.dam.coordinates, point);
          if (d <= DAM_SNAP_M) setEv(fi, pi, which, 'up', 'dam');
        }
      }

      // (b) through-lake in/out — an endpoint INSIDE a through-lake is where
      // this water joins the lake's pool: that end is DOWNSTREAM (flow exits
      // the water into the lake, toward the lake's dam/outlet). When both ends
      // lie outside, flow exits toward the through-lake's dam/outlet end.
      if (throughLakes.length) {
        const inStart = throughLakes.some((l) => pointInFeaturePolygons(endpoints.start, l));
        const inEnd = throughLakes.some((l) => pointInFeaturePolygons(endpoints.end, l));
        if (inStart !== inEnd) {
          setEv(fi, pi, 'start', inStart ? 'down' : 'up', 'lake');
          setEv(fi, pi, 'end', inEnd ? 'down' : 'up', 'lake');
        } else if (!inStart && !inEnd) {
          // Both ends outside: flow exits toward the through-lake's dam/outlet.
          const dammedLakes = throughLakes
            .map((l) => topoById.get(l.properties.id)?.dam?.coordinates)
            .filter(Boolean);
          if (dammedLakes.length) {
            const dStart = Math.min(...dammedLakes.map((c) => distanceM(c, endpoints.start)));
            const dEnd = Math.min(...dammedLakes.map((c) => distanceM(c, endpoints.end)));
            if (dStart !== dEnd) {
              setEv(fi, pi, 'start', dStart < dEnd ? 'down' : 'up', 'lake');
              setEv(fi, pi, 'end', dEnd < dStart ? 'down' : 'up', 'lake');
            }
          }
        }
      }

      // (c) confluence: the endpoint touches exactly one other water, and
      // verified-network depth ranks the pair — water flows from deeper
      // (further from the terminus) INTO the shallower recipient.
      for (const [which, point] of Object.entries(endpoints)) {
        if (evidence.has(fi + ':' + pi + ':' + which)) continue;
        const touches = touchingFeatureIds(grid, point, SNAP_M, fi);
        const targetFis = [...touches.keys()];
        if (targetFis.length !== 1) continue; // ambiguous junction or nothing
        const tfi = targetFis[0];
        // Dam-outlet guard: touching a (dammed) lake right at its dam means
        // this water EXITS the lake there (tailwater), never flows into it.
        const recipient = features[tfi];
        const recipientDam = topoById.get(recipient.properties.id)?.dam?.coordinates;
        if (polygonsOf(recipient).length > 0 && recipientDam && distanceM(recipientDam, point) <= DAM_SNAP_M) {
          setEv(fi, pi, which, 'up', 'lake');
          continue;
        }
        const dHere = depth[fi];
        const dThere = depth[tfi];
        if (dThere === Infinity) continue;
        if (dHere === Infinity || dHere > dThere) setEv(fi, pi, which, 'down', 'confluence');
        else if (dHere < dThere) setEv(fi, pi, which, 'up', 'confluence');
      }
    });
  });

  // ---- per-part orientation + (d) chain propagation --------------------------
  const partsFlags = new Map(); // fi -> number[]
  const partMethod = new Map();
  const polarityOf = (fi, pi, which) => evidence.get(fi + ':' + pi + ':' + which)?.polarity ?? null;

  features.forEach((f, fi) => {
    if (!isLine[fi]) return;
    const parts = lineParts(f);
    const flags = new Array(parts.length).fill(0);
    const methods = new Array(parts.length).fill(null);
    parts.forEach((part, pi) => {
      const a = polarityOf(fi, pi, 'start');
      const b = polarityOf(fi, pi, 'end');
      if (a === 'up' && b === 'down') {
        flags[pi] = 1;
        methods[pi] = evidence.get(fi + ':' + pi + ':start').method;
      } else if (a === 'down' && b === 'up') {
        flags[pi] = -1;
        methods[pi] = evidence.get(fi + ':' + pi + ':start').method;
      } else if (a === 'down') {
        flags[pi] = -1;
        methods[pi] = evidence.get(fi + ':' + pi + ':start').method;
      } else if (b === 'down') {
        flags[pi] = 1;
        methods[pi] = evidence.get(fi + ':' + pi + ':end').method;
      } else if (a === 'up') {
        // start is the upstream end — stored order already runs downstream.
        flags[pi] = 1;
        methods[pi] = evidence.get(fi + ':' + pi + ':start').method;
      } else if (b === 'up') {
        flags[pi] = -1;
        methods[pi] = evidence.get(fi + ':' + pi + ':end').method;
      }
      // both-same-polarity (a==='down'&&b==='down' etc.) stays 0: ambiguous.
    });
    partsFlags.set(fi, flags);
    partMethod.set(fi, methods);
  });

  // (d) chain propagation across 2-way junctions of the SAME feature.
  features.forEach((f, fi) => {
    if (!isLine[fi]) return;
    const parts = lineParts(f);
    const flags = partsFlags.get(fi);
    // junction endpoints: [pi, which]
    const ends = [];
    parts.forEach((part, pi) => {
      ends.push({ pi, which: 'start', point: part[0] });
      ends.push({ pi, which: 'end', point: part[part.length - 1] });
    });
    // pair up endpoints within SNAP_M
    for (let i = 0; i < ends.length; i++) {
      for (let j = i + 1; j < ends.length; j++) {
        if (ends[i].pi === ends[j].pi) continue;
        if (distanceM(ends[i].point, ends[j].point) > SNAP_M) continue;
        // only safe when exactly these two ends meet (no third end of the
        // feature — forks/braids stay unpropagated)
        const third = ends.some(
          (e, k) => k !== i && k !== j && distanceM(e.point, ends[i].point) <= SNAP_M,
        );
        if (third) continue;
        const [src, dst] = flags[ends[i].pi] !== 0 ? [ends[i], ends[j]] : flags[ends[j].pi] !== 0 ? [ends[j], ends[i]] : [null, null];
        if (!src || flags[dst.pi] !== 0) continue;
        // Water flows THROUGH a chain junction: if src EXITS at the junction
        // (its downstream end), dst ENTERS there (the junction is dst's
        // upstream end), and vice versa.
        const srcExitsAtJunction =
          (src.which === 'end' && flags[src.pi] === 1) || (src.which === 'start' && flags[src.pi] === -1);
        const dstJunctionIsDown = !srcExitsAtJunction;
        const dstFlip =
          dst.which === 'start' ? (dstJunctionIsDown ? -1 : 1) : dstJunctionIsDown ? 1 : -1;
        flags[dst.pi] = dstFlip;
        partMethod.get(fi)[dst.pi] = 'chain';
      }
    }
  });

  // ---- assemble ---------------------------------------------------------------
  const waters = {};
  const stats = {
    lineFeatures: features.filter((_, fi) => isLine[fi]).length,
    parts: 0,
    orientedParts: 0,
    high: 0,
    medium: 0,
    low: 0,
    byMethod: {},
  };
  features.forEach((f, fi) => {
    if (!isLine[fi]) return;
    const flags = partsFlags.get(fi);
    const methods = partMethod.get(fi);
    const oriented = flags.filter((v) => v !== 0).length;
    stats.parts += flags.length;
    stats.orientedParts += oriented;
    for (const m of methods) if (m) stats.byMethod[m] = (stats.byMethod[m] ?? 0) + 1;
    const strongest = methods.reduce(
      (acc, m) => {
        if (!m) return acc;
        if (acc === 'high') return acc;
        if (m === 'topo-down' || m === 'topo-up' || m === 'dam' || m === 'lake' || m === 'termini') return 'high';
        return 'medium';
      },
      null,
    );
    const confidence = oriented === 0 ? 'low' : strongest === 'high' ? 'high' : 'medium';
    stats[confidence] += 1;
    waters[f.properties.id] = { parts: flags, confidence };
  });
  return { waters, stats };
}
