import { themes } from '../../theme/themes';
/** Compatibility exports for retained atlas consumers; colors originate in theme definitions. */
export const atlas = themes.nightfall.map;
export const atlasLight = themes.daybreak.map;
export const TN_BOUNDS: [[number, number], [number, number]] = [
  [-90.31, 35],
  [-81.6, 36.7],
];
export const TN_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-92, 33.5],
  [-79.5, 38.2],
];
export const TN_CENTER: [number, number] = [-86.35, 35.75];
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
