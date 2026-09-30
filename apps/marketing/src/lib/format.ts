/** Small display-formatting helpers shared by the Astro templates. */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function monthName(month: number): string {
  return MONTHS[Math.min(12, Math.max(1, month)) - 1];
}

export function monthShort(month: number): string {
  return monthName(month).slice(0, 3);
}

/** "Feb 10, 2026" — data fixture dates are YYYY-MM-DD. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${monthShort(m)} ${d}, ${y}`;
}

/** "Aug 28, 2026 · 21:15 UTC" from an ISO datetime string. */
export function formatDateTime(iso: string): string {
  const [datePart, timePart = ''] = iso.split('T');
  const date = formatDate(datePart);
  const hhmm = timePart.slice(0, 5);
  return hhmm ? `${date} · ${hhmm} UTC` : date;
}

export function formatCfs(cfs: number): string {
  return `${Math.round(cfs).toLocaleString('en-US')} cfs`;
}

// ---------------------------------------------------------------------------
// Fishability score presentation (F07, 2026-09-29 audit)
// ---------------------------------------------------------------------------

/**
 * Score-band boundaries — PARITY with the PWA (F07): apps/web/src/lib/
 * conditions.ts `scoreBand()` and the map legend band at 70/40. The
 * contracts package does not export these constants, so they are defined
 * here with this comment as the parity anchor; change both together.
 */
export const SCORE_GOOD_MIN = 70;
export const SCORE_FAIR_MIN = 40;

const BAND_COLOR = {
  good: '#15803d',
  fair: '#d97706',
  poor: '#b91c1c',
  none: '#94a3b8',
} as const;

export interface ScorePresentation {
  label: 'Good' | 'Fair' | 'Poor' | 'No data';
  /** Hex dot/badge color matching the band (gray for unavailable). */
  color: string;
  /** Whether this presentation states a real assessment. */
  assessed: boolean;
}

/**
 * Assessment-aware score presentation (F07):
 *  - `assessed: false` (and legacy snapshots whose 0 cannot be distinguished
 *    from the unassessed sentinel) render the honest unavailable state —
 *    unassessed data must NEVER become a verdict;
 *  - an assessed 0 is a REAL assessment (a lethal clamp, exactly like the
 *    PWA's scoreConditions/scoreFishability semantics) and renders as Poor;
 *  - bands are the PWA's 70/40 (see SCORE_GOOD_MIN/SCORE_FAIR_MIN above).
 */
export function scorePresentation(value: number, assessed?: boolean): ScorePresentation {
  // A nonzero value proves assessment: every unassessed result is exactly 0.
  const reallyAssessed = assessed ?? value > 0;
  if (!reallyAssessed) return { label: 'No data', color: BAND_COLOR.none, assessed: false };
  if (value >= SCORE_GOOD_MIN) return { label: 'Good', color: BAND_COLOR.good, assessed: true };
  if (value >= SCORE_FAIR_MIN) return { label: 'Fair', color: BAND_COLOR.fair, assessed: true };
  return { label: 'Poor', color: BAND_COLOR.poor, assessed: true };
}

/** Plain-English fishability label (assessment-aware — see scorePresentation). */
export function scoreLabel(value: number, assessed?: boolean): string {
  return scorePresentation(value, assessed).label;
}

// ---------------------------------------------------------------------------
// Stocking presentation (F08, 2026-09-29 audit)
// ---------------------------------------------------------------------------

export type StockingPrecision = 'day' | 'week' | 'month';

/**
 * Precision-aware date label: a published month window must never render as
 * an exact day (date=2026-12-01 + datePrecision=month is "December 2026",
 * NOT "Dec 1, 2026" — the ISO day is only the window's first-day placeholder).
 * Week rows keep the "week of" framing. Legacy rows without a precision flag
 * are exact-day entries (the placeholder problem only exists once a window
 * precision was published).
 */
export function stockingPrecisionDate(date: string, precision?: StockingPrecision): string {
  if (precision === 'week') return `Week of ${formatDate(date)}`;
  if (precision === 'month') {
    const [y, m] = date.split('-').map((n) => Number.parseInt(n, 10));
    if (!y || !m) return date;
    return `${monthName(m)} ${y}`;
  }
  return formatDate(date);
}

/**
 * Evidence-aware stocking status. The StockingEvent feed carries NO
 * completed-release status (packages/contracts/src/schemas/stocking.ts is
 * read-only truth here), so NO row is ever presented as a TWRA release
 * record: entries stay Scheduled (future) or Past-scheduled (date passed)
 * until a completed-release source exists in the contract to say otherwise.
 * Vocabulary mirrors apps/web StockingPage.tsx `stockingEventState` and the
 * PWA prerender `stockingWhen` — change all three together.
 */
export function stockingStatusLabel(
  date: string,
  precision: StockingPrecision | undefined,
  todayIso: string,
): string {
  const future = date >= todayIso;
  if (precision === 'month') return future ? 'Month window · scheduled' : 'Month window · past-scheduled';
  if (precision === 'week') return future ? 'Week of · scheduled' : 'Week of · past-scheduled';
  return future ? 'Scheduled' : 'Past-scheduled';
}
