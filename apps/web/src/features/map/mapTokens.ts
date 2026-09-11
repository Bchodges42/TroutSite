import { themes } from '../../theme/themes';
/** Compatibility exports for retained atlas consumers; colors originate in theme definitions. */
export const atlas = themes.nightfall.map;
export const atlasLight = themes.daybreak.map;
export const TN_BOUNDS: [[number, number], [number, number]] = [
  [-90.31, 35],
  [-81.6, 36.7],
];
export const TN_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-92, 26.5],
  [-79.5, 45.2],
];
// H1 (2026-09-07): the maxBounds BOX is what actually clamps the overview.
// MapLibre refuses to zoom out past the point where maxBounds still covers
// the viewport — with the old 33.5→38.2 box that floor was ~z 6.56 at phone
// widths, ABOVE the ~z 4.79 needed to fit Tennessee's 8.71° span, so every
// mobile overview cropped both extremities no matter what minZoom allowed.
// The wider latitude span drops that floor to ~z 4.70 while keeping the pan
// guard: pan freedom is zero at overview zoom and grows as the user zooms in.
export const TN_CENTER: [number, number] = [-86.35, 35.75];

/**
 * Shared overview camera (H1): ONE definition of the statewide fit, consumed
 * by both the initial map load and the "Show all Tennessee" recenter. Returns
 * the fitBounds padding plus the zoom floor the map must accept so the fit is
 * never clamped. Two clamps had to be reconciled: the old fixed minZoom 5.3,
 * and — the one that actually bit on phones — TN_MAX_BOUNDS, whose lat span
 * must cover the viewport at the overview zoom (see the note there). Desktop
 * numbers are unchanged: the computed fit there exceeds 5.3.
 */
export function statewideCamera(width: number, height: number): {
  padding: number;
  maxZoom: number;
  minZoom: number;
  fitZoom: number;
} {
  const padding = width < 650 ? 24 : 46;
  const maxZoom = 7;
  const availW = Math.max(60, width - padding * 2);
  const availH = Math.max(60, height - padding * 2);
  const [[w, s], [e, n]] = TN_BOUNDS;
  // Web-mercator fit: longitude span is linear in world pixels; latitude goes
  // through the isometric y = ln(tan(π/4 + φ/2)). The tighter axis wins.
  const worldSize = 512;
  const zLon = Math.log2((availW * 360) / ((e - w) * worldSize));
  const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const zLat = Math.log2((availH * 2 * Math.PI) / ((mercY(n) - mercY(s)) * worldSize));
  const fitZoom = Math.min(zLon, zLat, maxZoom);
  // Never RAISE the floor above the product's 5.3 — this only extends how far
  // out the map may go when a narrow viewport needs a wider framing.
  const minZoom = Math.min(5.3, fitZoom);
  return { padding, maxZoom, minZoom, fitZoom };
}
export type MapMode = 'conditions' | 'hatches';
export type ConditionStatus = 'good' | 'fair' | 'poor' | 'no-data';
export function conditionColor(score: number | null, hasData: boolean): string {
  if (!hasData || score == null) return atlas.noData;
  return score >= 70 ? atlas.good : score >= 40 ? atlas.fair : atlas.poor;
}
export function conditionColorForStatus(status: ConditionStatus) {
  return status === 'no-data' ? atlas.noData : atlas[status];
}
export const MAP_CSS_VARS = {
  '--map-paper': atlas.paper,
  '--map-ink': atlas.ink,
  '--map-hairline': atlas.hairline,
  '--map-contour': atlas.contour,
};
