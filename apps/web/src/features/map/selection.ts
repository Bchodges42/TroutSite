export type ScreenPoint = [number, number];

export type ScreenGeometry =
  | { type: 'Point'; coordinates: ScreenPoint }
  | { type: 'MultiPoint'; coordinates: ScreenPoint[] }
  | { type: 'LineString'; coordinates: ScreenPoint[] }
  | { type: 'MultiLineString'; coordinates: ScreenPoint[][] }
  | { type: 'Polygon'; coordinates: ScreenPoint[][] }
  | { type: 'MultiPolygon'; coordinates: ScreenPoint[][][] };

export interface SelectionCandidate {
  id: string;
  layerId: string;
  geometry: ScreenGeometry;
  lengthKm?: number;
}

const square = (value: number) => value * value;

function pointToSegmentDistance(point: ScreenPoint, a: ScreenPoint, b: ScreenPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length))
    : 0;
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
}

function lineSegments(geometry: ScreenGeometry): Array<[ScreenPoint, ScreenPoint]> {
  const lines =
    geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.type === 'MultiLineString'
        ? geometry.coordinates
        : [];
  const segments: Array<[ScreenPoint, ScreenPoint]> = [];
  for (const line of lines) {
    for (let i = 1; i < line.length; i += 1) {
      segments.push([line[i - 1]!, line[i]!]);
    }
  }
  return segments;
}

function segmentDistance(a: [ScreenPoint, ScreenPoint], b: [ScreenPoint, ScreenPoint]): number {
  const cross = (o: ScreenPoint, p: ScreenPoint, q: ScreenPoint) =>
    (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const onSegment = (o: ScreenPoint, p: ScreenPoint, q: ScreenPoint) =>
    Math.min(o[0], p[0]) - 1e-9 <= q[0] &&
    q[0] <= Math.max(o[0], p[0]) + 1e-9 &&
    Math.min(o[1], p[1]) - 1e-9 <= q[1] &&
    q[1] <= Math.max(o[1], p[1]) + 1e-9;
  const ab = cross(a[0], a[1], b[0]);
  const ab2 = cross(a[0], a[1], b[1]);
  const ba = cross(b[0], b[1], a[0]);
  const ba2 = cross(b[0], b[1], a[1]);
  if (
    (ab === 0 && onSegment(a[0], a[1], b[0])) ||
    (ab2 === 0 && onSegment(a[0], a[1], b[1])) ||
    (ba === 0 && onSegment(b[0], b[1], a[0])) ||
    (ba2 === 0 && onSegment(b[0], b[1], a[1])) ||
    ((ab > 0) !== (ab2 > 0) && (ba > 0) !== (ba2 > 0))
  ) {
    return 0;
  }
  return Math.min(
    pointToSegmentDistance(a[0], b[0], b[1]),
    pointToSegmentDistance(a[1], b[0], b[1]),
    pointToSegmentDistance(b[0], a[0], a[1]),
    pointToSegmentDistance(b[1], a[0], a[1]),
  );
}

function overlappingLines(a: ScreenGeometry, b: ScreenGeometry): boolean {
  const aSegments = lineSegments(a);
  const bSegments = lineSegments(b);
  return aSegments.some((aSegment) =>
    bSegments.some((bSegment) => segmentDistance(aSegment, bSegment) <= 2),
  );
}

/**
 * Return a stable screen-space distance for a queried water feature.
 * Polygon distances intentionally stay synthetic: an open lake interior is
 * selectable, but a centerline under the same pointer wins deterministically.
 */
export function distanceToGeometry(
  point: ScreenPoint,
  geometry: ScreenGeometry,
  layerId: string,
): number {
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return layerId === 'rivers-water-hit' ? 6 : 9;
  }
  if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
    const points = geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates;
    return Math.min(...points.map((candidate) => Math.hypot(point[0] - candidate[0], point[1] - candidate[1])));
  }
  return Math.min(
    ...lineSegments(geometry).map(([a, b]) => pointToSegmentDistance(point, a, b)),
  );
}

/**
 * Choose a water id from rendered hit candidates. A longer line can win a
 * close tie only when the screen geometries really overlap, which covers a
 * confluence/main-stem tap without making nearby parallel reaches steal taps.
 */
export function chooseWaterCandidate(
  point: ScreenPoint,
  candidates: SelectionCandidate[],
  tieDistancePx = 4,
): string | null {
  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      distance: distanceToGeometry(point, candidate.geometry, candidate.layerId),
    }))
    .filter((candidate) => Number.isFinite(candidate.distance))
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.id.localeCompare(b.id) ||
        a.layerId.localeCompare(b.layerId),
    );
  const top = ranked[0];
  const second = ranked[1];
  if (!top) return null;
  if (
    second &&
    second.distance - top.distance < tieDistancePx &&
    (top.geometry.type === 'LineString' || top.geometry.type === 'MultiLineString') &&
    (second.geometry.type === 'LineString' || second.geometry.type === 'MultiLineString') &&
    overlappingLines(top.geometry, second.geometry) &&
    Number(second.lengthKm ?? 0) > Number(top.lengthKm ?? 0)
  ) {
    return second.id;
  }
  return top.id;
}

export const distanceToSegmentForTest = pointToSegmentDistance;
export const squaredDistanceForTest = (a: ScreenPoint, b: ScreenPoint) =>
  square(a[0] - b[0]) + square(a[1] - b[1]);
