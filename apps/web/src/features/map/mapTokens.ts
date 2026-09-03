/**
 * Field Notes Atlas palette — paper-first, ink, and contour tones.
 * Condition colors map directly to src/lib/conditions.ts scoreBand:
 *   good >=70, fair >=40, poor <40, no-data otherwise.
 */
export const atlas = {
  paper: '#F2E9D5',
  paperRaised: '#F8F2E5',
  paperWarm: '#EDE6D3',
  ink: '#24352D',
  softInk: '#566158',
  inkFaint: '#7A8578',
  water: '#2E6F73',
  // condition — muted field-notes earth tones, still distinct at a glance
  good: '#5F7E4B', // moss — fishable
  fair: '#B98232', // amber — marginal
  poor: '#985446', // clay — poor
  noData: '#8B8A82',
  sulphur: '#D98232', // hatch halo
  contour: '#B8A986',
  hairline: '#D3C6AB',
  shadow: 'rgba(51, 45, 32, 0.16)',
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
