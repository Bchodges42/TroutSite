/**
 * Tailwater palette — a dark, high-contrast field atlas. Deep pine-black
 * ground, luminous condition-colored rivers, one warm amber accent for
 * interaction. Condition hues map to src/lib/conditions.ts scoreBand:
 *   good >=70, fair >=40, poor <40, no-data otherwise.
 * `atlasLight` restores the paper variant ('paper' basemap); every UI surface
 * is driven by the same tokens so map and chrome read as one object.
 */
export const atlas = {
  // ground
  paper: '#0B120F', // map background (outside TN)
  paperRaised: '#101B16', // Tennessee fill
  paperWarm: '#0E1713',
  ink: '#040806', // river casing — a shadow that makes data lines glow
  softInk: '#9FB5AA', // secondary text
  inkFaint: '#6B8177',
  water: '#49B3C4',
  // conditions — vivid on dark ground
  good: '#4CC38A', // jade — fishable
  fair: '#E5A83B', // amber — marginal
  poor: '#E0684B', // coral — poor
  noData: '#54685E', // slate — visible, never "missing"
  warmwater: '#B5854F', // bronze — bass/panfish rivers (not trout-scored)
  sulphur: '#F09A4E', // hatch halo
  selection: '#FFD97A', // selected-river outline
  // structure
  contour: '#223429',
  hairline: '#3A5448',
  // lakes/reservoirs — a shade bluer and deeper than the land they sit on
  lakeFill: '#0F2A31',
  lakeShore: '#1E4750',
  shadow: 'rgba(0, 0, 0, 0.5)',
  // place-label markers
  placeText: '#D9E4DC',
  placeHalo: 'rgba(4, 9, 7, 0.9)',
} as const;

/** Paper day variant — the classic cream atlas, refined for stronger line contrast. */
export const atlasLight = {
  paper: '#EFE8D8',
  paperRaised: '#F5EFDF',
  paperWarm: '#EDE5D1',
  ink: '#1C2B23',
  softInk: '#4A584F',
  inkFaint: '#77826F',
  contour: '#A79778',
  hairline: '#B7A680',
  lakeFill: '#C9DAE4',
  lakeShore: '#9FB4C4',
  noData: '#6E7A6F',
  sulphur: '#D98232',
  selection: '#D98232',
  placeText: '#1C2B23',
  placeHalo: 'rgba(245, 239, 223, 0.95)',
} as const;

/** Tennessee bounding box (lon/lat) — padded for maxBounds. */
export const TN_BOUNDS: [[number, number], [number, number]] = [
  [-90.31, 35.0],
  [-81.6, 36.7],
];

/** Padded maxBounds to keep pan bounded but not claustrophobic. */
export const TN_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-91.2, 34.4],
  [-80.6, 37.1],
];

export const TN_CENTER: [number, number] = [-86.35, 35.75];

export type MapMode = 'conditions' | 'hatches';

export type ConditionStatus = 'good' | 'fair' | 'poor' | 'no-data';

/**
 * Condition color — mirrors scoreBand(score):
 *   >=70 good, >=40 fair, else poor. No data → noData.
 */
export function conditionColor(score: number | null, hasData: boolean): string {
  if (!hasData || score == null) return atlas.noData;
  if (score >= 70) return atlas.good;
  if (score >= 40) return atlas.fair;
  return atlas.poor;
}

export function conditionColorForStatus(status: ConditionStatus): string {
  if (status === 'good') return atlas.good;
  if (status === 'fair') return atlas.fair;
  if (status === 'poor') return atlas.poor;
  return atlas.noData;
}

/** CSS variables map for docs/tests. */
export const MAP_CSS_VARS: Record<string, string> = {
  '--map-paper': atlas.paper,
  '--map-ink': atlas.ink,
  '--map-hairline': atlas.hairline,
  '--map-contour': atlas.contour,
};
