/**
 * qa/audit.ts — PURE geometry/connectivity defect audit over the atlas
 * rivers FeatureCollection. No DOM, no network, deterministic ordering.
 *
 * Consumed by `?qa=1` (QaPanel): the panel loads rivers.geojson through the
 * live style source (never a second fetch), runs `auditRivers` once on
 * toggle, caches the report for the session, and overlays the defects on a
 * TOP map layer. Defect kinds (all thresholds in meters, haversine):
 *
 *   - dangling-end:       a line endpoint with NO other water's geometry
 *                         within 50 m — unless the feature allows open ends
 *                         or the endpoint sits inside a lake polygon.
 *   - isolated-fragment:  a connected chunk of a feature (parts joined at
 *                         50 m) that is disconnected from the feature's main
 *                         (longest) chunk.
 *   - self-crossing:      a proper (transversal) segment crossing within one
 *                         part or between parts of the SAME feature. Endpoint
 *                         touches — forks and chain junctions — are not
 *                         crossings.
 *   - duplicate-corridor: near-parallel sustained overlap ≥ 2 km at ≤ 150 m
 *                         offset between two parts (same or different
 *                         features).
 *
 * Performance: one uniform vertex grid (~450 m cells) over all line vertices
 * keeps every check near O(n); the whole audit runs in well under a second on
 * the production atlas. Unit-tested with synthetic fixtures in
 * test/qa-audit.test.ts.
 */

export type QaDefectKind =
  | 'dangling-end'
  | 'isolated-fragment'
  | 'self-crossing'
  | 'duplicate-corridor';

export interface QaDefect {
  kind: QaDefectKind;
  featureId: string;
  featureName: string;
  regionId: string | null;
  /** Representative point (first occurrence) — marker + fly-to target. */
  point: [number, number];
  /** Partner corridor point (duplicate corridors). */
  second?: [number, number];
  /** Optional line to render (fragment geometry, corridor overlap segment). */
  line?: number[][];
  detail: string;
}

export interface QaReport {
  defects: QaDefect[];
  stats: {
    featureCount: number;
    lineFeatureCount: number;
    parts: number;
    vertices: number;
    duplicatePairsChecked: number;
    truncated: boolean;
  };
}

export interface QaOptions {
  /** Connectivity snap for dangling ends / fragments (default 50). */
  snapM?: number;
  /** Max lateral offset for duplicate corridors (default 150). */
  duplicateOffsetM?: number;
  /** Min sustained run for duplicate corridors (default 2000). */
  duplicateMinRunM?: number;
}

type LngLat = [number, number];
type Part = LngLat[];

const CELL_DEG = 0.005; // ~450 m at Tennessee latitudes
const EARTH_R = 6371000;
const DEG = Math.PI / 180;
const MAX_DEFECTS = 800;
const MAX_CROSSINGS_PER_FEATURE = 50;
const MAX_DUPLICATE_PAIRS = 30000;

function distanceM(a: LngLat, b: LngLat): number {
  const dLat = (b[1] - a[1]) * DEG;
  const dLon = (b[0] - a[0]) * DEG;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * DEG) * Math.cos(b[1] * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Point-to-segment distance in meters, planar around the point's latitude. */
function pointSegmentM(p: LngLat, a: LngLat, b: LngLat): number {
  const kx = Math.cos(((p[1] + a[1] + b[1]) / 3) * DEG);
  const px = p[0] * kx;
  const ax = a[0] * kx;
  const bx = b[0] * kx;
  const py = p[1];
  const ay = a[1];
  const by = b[1];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const mx = (px - cx) / kx;
  const my = py - cy;
  return Math.sqrt(mx * mx * kx * kx + my * my) * 111320;
}

function linePartsOf(geometry: { type: string; coordinates?: unknown }): Part[] {
  if (!geometry) return [];
  if (geometry.type === 'MultiLineString') return geometry.coordinates as Part[];
  if (geometry.type === 'LineString') return [geometry.coordinates as Part];
  return [];
}

function polygonsOf(geometry: { type: string; coordinates?: unknown }): Part[][] {
  if (!geometry) return [];
  // A polygon = rings = Part[]; a list of polygons = Part[][].
  if (geometry.type === 'Polygon') return [geometry.coordinates as Part[]];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates as Part[][];
  return [];
}

function pointInRings(point: LngLat, rings: Part[]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i]![0]!;
      const yi = ring[i]![1]!;
      const xj = ring[j]![0]!;
      const yj = ring[j]![1]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  return inside;
}

interface AuditVertex {
  x: number;
  y: number;
  li: number; // line-feature index (-1 for lake ring vertices)
  pi: number; // part index within feature
  vi: number; // vertex index within part
}

interface LineFeature {
  id: string;
  name: string;
  regionId: string | null;
  allowOpenEnds: boolean;
  parts: Part[];
  partLength: number[];
  /** first-and-last vertex of each part (dangling-end candidates) */
  endpoints: LngLat[];
}

export function auditRivers(
  fc: { features?: Array<Record<string, unknown>> },
  options: QaOptions = {},
): QaReport {
  const snapM = options.snapM ?? 50;
  const dupOffsetM = options.duplicateOffsetM ?? 150;
  const dupMinRunM = options.duplicateMinRunM ?? 2000;
  const features = fc.features ?? [];

  const lineFeatures: LineFeature[] = [];
  const lakePolygons: Part[][][] = []; // per lake feature: polygons → rings
  let vertexCount = 0;

  const grid = new Map<string, AuditVertex[]>();
  const addVertex = (v: AuditVertex) => {
    vertexCount++;
    const key = Math.floor(v.x / CELL_DEG) + ':' + Math.floor(v.y / CELL_DEG);
    let bucket = grid.get(key);
    if (!bucket) grid.set(key, (bucket = []));
    bucket.push(v);
  };

  // Segment grid: every segment is rasterized across ALL cells its bounding
  // box covers, so long low-vertex-count segments are found by neighbor
  // queries (a start-vertex-only index misses them entirely).
  interface SegRef {
    li: number;
    pi: number;
    vi: number;
  }
  const segGrid = new Map<string, SegRef[]>();
  const addSegment = (ref: SegRef, a: LngLat, b: LngLat) => {
    const x0 = Math.floor(Math.min(a[0], b[0]) / CELL_DEG);
    const x1 = Math.floor(Math.max(a[0], b[0]) / CELL_DEG);
    const y0 = Math.floor(Math.min(a[1], b[1]) / CELL_DEG);
    const y1 = Math.floor(Math.max(a[1], b[1]) / CELL_DEG);
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++) {
        const key = x + ':' + y;
        let bucket = segGrid.get(key);
        if (!bucket) segGrid.set(key, (bucket = []));
        bucket.push(ref);
      }
  };
  const nearbySegs = (x: number, y: number, meters: number): SegRef[] => {
    const r = Math.max(1, Math.ceil(meters / 420));
    const cx = Math.floor(x / CELL_DEG);
    const cy = Math.floor(y / CELL_DEG);
    const out: SegRef[] = [];
    for (let i = -r; i <= r; i++)
      for (let j = -r; j <= r; j++) {
        const bucket = segGrid.get(cx + i + ':' + (cy + j));
        if (bucket) out.push(...bucket);
      }
    return out;
  };

  features.forEach((raw) => {
    const props = (raw.properties ?? {}) as Record<string, unknown>;
    const geometry = raw.geometry as { type: string; coordinates?: unknown } | undefined;
    if (!geometry) return;
    const polys = polygonsOf(geometry);
    if (polys.length) {
      lakePolygons.push(polys);
      for (const poly of polys)
        for (const ring of poly)
          for (const c of ring) addVertex({ x: c[0]!, y: c[1]!, li: -1, pi: -1, vi: -1 });
      return;
    }
    const parts = linePartsOf(geometry);
    if (!parts.length) return;
    const partLength = parts.map((part) => {
      let len = 0;
      for (let i = 1; i < part.length; i++) len += distanceM(part[i - 1]!, part[i]!);
      return len;
    });
    const endpoints: LngLat[] = [];
    parts.forEach((part) => {
      endpoints.push(part[0]!);
      endpoints.push(part[part.length - 1]!);
    });
    const li = lineFeatures.length;
    lineFeatures.push({
      id: String(props.id ?? ''),
      name: String(props.name ?? props.id ?? ''),
      regionId: props.regionId != null ? String(props.regionId) : null,
      allowOpenEnds: Boolean(props.allowOpenEnds),
      parts,
      partLength,
      endpoints,
    });
    parts.forEach((part, pi) => {
      for (let vi = 0; vi < part.length; vi++)
        addVertex({ x: part[vi]![0]!, y: part[vi]![1]!, li, pi, vi });
      for (let vi = 0; vi + 1 < part.length; vi++)
        addSegment({ li, pi, vi }, part[vi]!, part[vi + 1]!);
    });
  });

  const nearby = (x: number, y: number, meters: number): AuditVertex[] => {
    const r = Math.max(1, Math.ceil(meters / 420));
    const cx = Math.floor(x / CELL_DEG);
    const cy = Math.floor(y / CELL_DEG);
    const out: AuditVertex[] = [];
    for (let i = -r; i <= r; i++)
      for (let j = -r; j <= r; j++) {
        const bucket = grid.get(cx + i + ':' + (cy + j));
        if (bucket) out.push(...bucket);
      }
    return out;
  };

  const lakeBboxes = lakePolygons.map((polys) => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const poly of polys)
      for (const ring of poly)
        for (const c of ring) {
          minX = Math.min(minX, c[0]!);
          maxX = Math.max(maxX, c[0]!);
          minY = Math.min(minY, c[1]!);
          maxY = Math.max(maxY, c[1]!);
        }
    return { minX, minY, maxX, maxY, polys };
  });
  const insideAnyLake = (point: LngLat): boolean => {
    for (const lake of lakeBboxes) {
      if (
        point[0] < lake.minX ||
        point[0] > lake.maxX ||
        point[1] < lake.minY ||
        point[1] > lake.maxY
      )
        continue;
      for (const poly of lake.polys) if (pointInRings(point, poly)) return true;
    }
    return false;
  };

  /** Min distance from a point to any OTHER part's geometry (true segment distance). */
  const minDistanceToOtherParts = (
    point: LngLat,
    selfLi: number,
    selfPi: number,
  ): number => {
    let best = Infinity;
    for (const s of nearbySegs(point[0], point[1], snapM * 2)) {
      if (s.li === selfLi && s.pi === selfPi) continue;
      const part = lineFeatures[s.li]!.parts[s.pi]!;
      const d = pointSegmentM(point, part[s.vi]!, part[s.vi + 1]!);
      if (d < best) best = d;
    }
    return best;
  };

  const defects: QaDefect[] = [];
  let truncated = false;
  const push = (defect: QaDefect) => {
    if (defects.length >= MAX_DEFECTS) {
      truncated = true;
      return;
    }
    defects.push(defect);
  };

  // ---- (a) dangling ends -----------------------------------------------------
  lineFeatures.forEach((f, li) => {
    if (f.allowOpenEnds) return;
    f.endpoints.forEach((point, ei) => {
      const pi = ei >> 1;
      if (insideAnyLake(point)) return; // continuity via the lake pool
      const d = minDistanceToOtherParts(point, li, pi);
      if (d > snapM) {
        push({
          kind: 'dangling-end',
          featureId: f.id,
          featureName: f.name,
          regionId: f.regionId,
          point: [point[0], point[1]],
          detail:
            'endpoint with no other water within ' +
            snapM +
            ' m' +
            (Number.isFinite(d) ? ' (nearest ' + Math.round(d) + ' m)' : ''),
        });
      }
    });
  });

  // ---- (b) isolated fragments ------------------------------------------------
  lineFeatures.forEach((f, li) => {
    if (f.parts.length < 2) return;
    const parent = new Int32Array(f.parts.length);
    for (let i = 0; i < parent.length; i++) parent[i] = i;
    const find = (a: number): number => {
      let root = a;
      while (parent[root] !== root) root = parent[root]!;
      while (parent[a] !== root) {
        const next = parent[a]!;
        parent[a] = root;
        a = next;
      }
      return root;
    };
    const union = (a: number, b: number) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
    };
    for (let pi = 0; pi < f.parts.length; pi++) {
      for (const c of f.parts[pi]!) {
        for (const v of nearby(c[0]!, c[1]!, snapM)) {
          if (v.li !== li || v.pi === pi) continue;
          if (distanceM([c[0]!, c[1]!], [v.x, v.y]) <= snapM) union(pi, v.pi);
        }
      }
    }
    const totals = new Map<number, number>();
    f.partLength.forEach((len, pi) => {
      const root = find(pi);
      totals.set(root, (totals.get(root) ?? 0) + len);
    });
    let mainRoot = 0;
    let mainLen = -1;
    for (const [root, len] of totals)
      if (len > mainLen) {
        mainLen = len;
        mainRoot = root;
      }
    const byRoot = new Map<number, number[]>();
    f.parts.forEach((_p, pi) => {
      const root = find(pi);
      if (root === mainRoot) return;
      if (!byRoot.has(root)) byRoot.set(root, []);
      byRoot.get(root)!.push(pi);
    });
    for (const refs of [...byRoot.entries()].sort((a, b) => a[0] - b[0])) {
      const longest = refs[1].reduce((best, cur) =>
        f.partLength[cur]! > f.partLength[best]! ? cur : best, refs[1][0]!);
      const part = f.parts[longest]!;
      const point = part[0]!;
      push({
        kind: 'isolated-fragment',
        featureId: f.id,
        featureName: f.name,
        regionId: f.regionId,
        point: [point[0]!, point[1]!],
        line: part,
        detail:
          'chunk of ' + refs[1].length + ' part(s), ' +
          (f.partLength[longest]! / 1000).toFixed(1) +
          ' km, disconnected from the main corridor at ' + snapM + ' m',
      });
    }
  });

  // ---- (c) self-crossings ----------------------------------------------------
  const crossPoint = (a: Part, ai: number, b: Part, bi: number): LngLat | null => {
    const p0 = a[ai]!, p1 = a[ai + 1]!, q0 = b[bi]!, q1 = b[bi + 1]!;
    const kx = Math.cos(p0[1] * DEG);
    const ax = p0[0] * kx, ay = p0[1];
    const bx = p1[0] * kx, by = p1[1];
    const cx = q0[0] * kx, cy = q0[1];
    const dx = q1[0] * kx, dy = q1[1];
    const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
    const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
    const d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
    // strict proper (transversal) crossing; collinear or touching → null
    if (!((d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0))) return null;
    const t = d1 / (d1 - d2);
    return [(ax + t * (bx - ax)) / kx, ay + t * (by - ay)];
  };
  lineFeatures.forEach((f) => {
    // per-feature rasterized segment grid (same bbox rasterization as the
    // global grid, so long segments are compared with their real neighbors)
    const localSegs = new Map<string, SegRef[]>();
    f.parts.forEach((part, pi) => {
      for (let vi = 0; vi + 1 < part.length; vi++) {
        const a = part[vi]!;
        const b = part[vi + 1]!;
        const x0 = Math.floor(Math.min(a[0], b[0]) / CELL_DEG);
        const x1 = Math.floor(Math.max(a[0], b[0]) / CELL_DEG);
        const y0 = Math.floor(Math.min(a[1], b[1]) / CELL_DEG);
        const y1 = Math.floor(Math.max(a[1], b[1]) / CELL_DEG);
        for (let x = x0; x <= x1; x++)
          for (let y = y0; y <= y1; y++) {
            const key = x + ':' + y;
            let bucket = localSegs.get(key);
            if (!bucket) localSegs.set(key, (bucket = []));
            bucket.push({ li: 0, pi, vi });
          }
      }
    });
    const found: LngLat[] = [];
    const seenPair = new Set<string>();
    outer: for (const [key, segs] of localSegs) {
      const [gx, gy] = key.split(':').map(Number) as [number, number];
      const neighbors: SegRef[] = [];
      for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++) {
          const bucket = localSegs.get(gx + i + ':' + (gy + j));
          if (bucket) neighbors.push(...bucket);
        }
      for (const s1 of segs)
        for (const s2 of neighbors) {
          if (s1.pi === s2.pi && Math.abs(s1.vi - s2.vi) <= 1) continue; // same/adjacent
          const a = s1.pi < s2.pi || (s1.pi === s2.pi && s1.vi < s2.vi) ? s1 : s2;
          const b = a === s1 ? s2 : s1;
          const pairKey = a.pi + ':' + a.vi + '|' + b.pi + ':' + b.vi;
          if (seenPair.has(pairKey)) continue;
          seenPair.add(pairKey);
          const p = crossPoint(f.parts[a.pi]!, a.vi, f.parts[b.pi]!, b.vi);
          if (!p) continue;
          // endpoint-touch junctions (forks/chains within snapM) are legit
          const partA = f.parts[a.pi]!;
          const partB = f.parts[b.pi]!;
          const touching =
            distanceM(partA[a.vi]!, partB[b.vi]!) <= snapM ||
            distanceM(partA[a.vi]!, partB[b.vi + 1]!) <= snapM ||
            distanceM(partA[a.vi + 1]!, partB[b.vi]!) <= snapM ||
            distanceM(partA[a.vi + 1]!, partB[b.vi + 1]!) <= snapM;
          if (touching) continue;
          found.push(p);
          if (found.length >= MAX_CROSSINGS_PER_FEATURE) break outer;
        }
    }
    for (const point of found.slice(0, 10)) {
      push({
        kind: 'self-crossing',
        featureId: f.id,
        featureName: f.name,
        regionId: f.regionId,
        point,
        detail:
          'proper crossing between segments of the same feature (' + found.length + ' found)',
      });
    }
  });

  // ---- (d) duplicate corridors ----------------------------------------------
  let duplicatePairsChecked = 0;
  {
    const cellParts = new Map<string, number[]>(); // cell -> global part ids (li<<16|pi)
    const gid = (li: number, pi: number) => (li << 16) | pi;
    lineFeatures.forEach((f, li) => {
      f.parts.forEach((part, pi) => {
        const id = gid(li, pi);
        const seen = new Set<string>();
        for (const c of part) {
          const key = Math.floor(c[0]! / CELL_DEG) + ':' + Math.floor(c[1]! / CELL_DEG);
          if (seen.has(key)) continue;
          seen.add(key);
          let list = cellParts.get(key);
          if (!list) cellParts.set(key, (list = []));
          list.push(id);
        }
      });
    });
    const pairs = new Set<string>();
    for (const list of cellParts.values()) {
      if (list.length < 2) continue;
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i]!;
          const b = list[j]!;
          if (a === b) continue;
          pairs.add(a < b ? a + '|' + b : b + '|' + a);
        }
    }
    const partByGid = new Map<number, { li: number; pi: number }>();
    lineFeatures.forEach((f, li) =>
      f.parts.forEach((_p, pi) => partByGid.set(gid(li, pi), { li, pi })),
    );
    const sortedPairs = [...pairs].sort();
    for (const pairKey of sortedPairs) {
      if (duplicatePairsChecked >= MAX_DUPLICATE_PAIRS) {
        truncated = true;
        break;
      }
      duplicatePairsChecked++;
      const [ga, gb] = pairKey.split('|').map(Number) as [number, number];
      const A = partByGid.get(ga)!;
      const B = partByGid.get(gb)!;
      const aPart = lineFeatures[A.li]!.parts[A.pi]!;
      // sustained-overlap walk along A, measuring true distance to B's segments
      let run = 0;
      let bestRun = 0;
      let runPoint: LngLat | null = null;
      let runSecond: LngLat | null = null;
      for (let i = 0; i < aPart.length; i++) {
        const v = aPart[i]!;
        let near: LngLat | null = null;
        for (const s of nearbySegs(v[0]!, v[1]!, dupOffsetM * 2)) {
          if (!(s.li === B.li && s.pi === B.pi)) continue;
          const bp = lineFeatures[B.li]!.parts[B.pi]!;
          const a2 = bp[s.vi]!;
          const b2 = bp[s.vi + 1]!;
          // closest point on the segment (planar lerp)
          const kx = Math.cos(((v[1] + a2[1] + b2[1]) / 3) * DEG);
          const px = v[0]! * kx;
          const ax = a2[0]! * kx;
          const bx = b2[0]! * kx;
          const dx = bx - ax;
          const dy = b2[1]! - a2[1]!;
          const len2 = dx * dx + dy * dy;
          const t = len2
            ? Math.max(0, Math.min(1, ((px - ax) * dx + (v[1]! - a2[1]!) * dy) / len2))
            : 0;
          const cx = ax + t * dx;
          const cy = a2[1]! + t * dy;
          const d = distanceM([v[0]!, v[1]!], [cx / kx, cy]);
          if (d <= dupOffsetM) {
            near = [cx / kx, cy];
            break;
          }
        }
        const step = i > 0 ? distanceM(aPart[i - 1]!, v) : 0;
        if (step > 1000) run = 0; // huge jump — never bridge across it
        if (near) {
          run += step;
          if (!runPoint) {
            runPoint = v;
            runSecond = near;
          }
          if (run > bestRun) bestRun = run;
        } else {
          run = 0;
          runPoint = null;
          runSecond = null;
        }
      }
      if (bestRun >= dupMinRunM && runPoint && runSecond) {
        const owner = lineFeatures[A.li]!;
        push({
          kind: 'duplicate-corridor',
          featureId: owner.id,
          featureName: owner.name,
          regionId: owner.regionId,
          point: [runPoint[0], runPoint[1]],
          second: [runSecond[0], runSecond[1]],
          line: [runPoint, runSecond],
          detail:
            (bestRun / 1000).toFixed(1) +
            ' km sustained within ' +
            dupOffsetM +
            ' m of ' +
            lineFeatures[B.li]!.name +
            (A.li === B.li ? ' (same feature)' : ''),
        });
      }
    }
  }

  // deterministic order
  const kindOrder: Record<QaDefectKind, number> = {
    'dangling-end': 0,
    'isolated-fragment': 1,
    'self-crossing': 2,
    'duplicate-corridor': 3,
  };
  defects.sort(
    (a, b) =>
      kindOrder[a.kind] - kindOrder[b.kind] ||
      a.featureId.localeCompare(b.featureId) ||
      a.point[1] - b.point[1] ||
      a.point[0] - b.point[0],
  );

  return {
    defects,
    stats: {
      featureCount: features.length,
      lineFeatureCount: lineFeatures.length,
      parts: lineFeatures.reduce((n, f) => n + f.parts.length, 0),
      vertices: vertexCount,
      duplicatePairsChecked,
      truncated,
    },
  };
}
