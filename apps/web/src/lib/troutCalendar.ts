import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SnapshotResult } from './snapshots';

/**
 * The trout calendar (research lane, 2026-09-10): per water, the months the
 * water plausibly HOLDS TROUT and the months stocking events land, straight
 * from the sourced research row set (docs/research/build-classification.py →
 * packages/content/data/trout-calendar.json → bundled into the content pack).
 *
 * This is the layer that lets the site say "contains trout" honestly:
 * a winter put-and-take pond in July does NOT contain trout, no matter what
 * its catalog `species` field says. Absence of the file (pack not built /
 * older bundle) degrades to `null` — every surface then falls back to the
 * catalog-only view and never invents seasonality.
 */

export type CalendarPresence = 'year-round' | 'seasonal' | 'none' | 'uncertain';

export interface TroutCalendarEntry {
  name: string;
  classification: 'trout-wild' | 'trout-stocked' | 'tailwater-trout' | 'warmwater' | 'unknown-need-evidence';
  presence: CalendarPresence;
  /** Months (1=Jan..12=Dec) the water plausibly holds trout. */
  months: number[];
  /** Months stocking events land (may differ from presence — holdover reservoirs). */
  stockingMonths: number[];
  /** Research-sourced window sentence, display-ready. */
  window: string;
}

export interface TroutCalendar {
  generated: string;
  source: string;
  waters: Record<string, TroutCalendarEntry>;
}


export const TROUT_CALENDAR_URL = '/content-pack/trout-calendar.json';

/** Defensive parse of the generated file — our own generator, but never trust a bundle blindly. */
function parseCalendar(raw: unknown): TroutCalendar | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const doc = raw as Record<string, unknown>;
  if (typeof doc.generated !== 'string' || typeof doc.waters !== 'object' || doc.waters === null) return null;
  const waters: Record<string, TroutCalendarEntry> = {};
  for (const [id, v] of Object.entries(doc.waters as Record<string, unknown>)) {
    if (typeof v !== 'object' || v === null) return null;
    const w = v as Record<string, unknown>;
    if (
      typeof w.name !== 'string' ||
      typeof w.classification !== 'string' ||
      typeof w.presence !== 'string' ||
      !Array.isArray(w.months) ||
      !Array.isArray(w.stockingMonths)
    ) {
      return null;
    }
    waters[id] = {
      name: w.name,
      classification: w.classification as TroutCalendarEntry['classification'],
      presence: w.presence as CalendarPresence,
      months: (w.months as number[]).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12),
      stockingMonths: (w.stockingMonths as number[]).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12),
      window: typeof w.window === 'string' ? w.window : '',
    };
  }
  return { generated: doc.generated, source: String(doc.source ?? ''), waters };
}

export function useTroutCalendar(): UseQueryResult<SnapshotResult<TroutCalendar | null>> {
  return useQuery({
    queryKey: ['snapshot', TROUT_CALENDAR_URL],
    queryFn: async (): Promise<SnapshotResult<TroutCalendar | null>> => {
      const res = await fetch(TROUT_CALENDAR_URL);
      if (res.status === 404) {
        // Older bundle / pack not built: honest absence, not an error state.
        return { data: null, fetchedAt: Date.now(), live: false };
      }
      if (!res.ok) throw new Error(`trout calendar ${res.status}`);
      const parsed = parseCalendar(await res.json());
      if (!parsed) throw new Error('trout calendar failed validation');
      return { data: parsed, fetchedAt: Date.now(), live: true };
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** Days since a stocking event plausibly landed, or null when unknowable. */
export function daysSinceStocking(entry: TroutCalendarEntry | undefined, now = new Date()): number | null {
  if (!entry || entry.stockingMonths.length === 0) return null;
  const month = now.getMonth() + 1;
  // In-window: days elapsed since the window opened (approximated to the 1st).
  if (entry.stockingMonths.includes(month)) {
    return now.getDate() - 1;
  }
  // Window was last month: days since it opened then.
  const prevMonth = month === 1 ? 12 : month - 1;
  if (entry.stockingMonths.includes(prevMonth)) {
    const daysInPrev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    return daysInPrev + now.getDate() - 1;
  }
  return null;
}

/** Rough "recently stocked" verdict — within ~3 weeks of a plausible stocking event. */
export function recentlyStocked(entry: TroutCalendarEntry | undefined, now = new Date()): boolean {
  const days = daysSinceStocking(entry, now);
  return days !== null && days <= 21;
}

export type TroutPresenceNow =
  | { state: 'present'; note: string; fresh: boolean }
  | { state: 'absent'; note: string; fresh: false }
  | { state: 'uncertain'; note: string; fresh: false }
  | { state: 'none'; note: string; fresh: false };

/**
 * Does this water contain trout THIS MONTH? Pure + local-time (the angler's
 * clock, CST). Uncertain waters never resolve to a presence claim.
 */
export function troutPresenceNow(
  entry: TroutCalendarEntry | undefined,
  now = new Date(),
): TroutPresenceNow {
  if (!entry) return { state: 'uncertain', note: 'No trout-season data for this water yet.', fresh: false };
  const month = now.getMonth() + 1;
  const fresh = recentlyStocked(entry, now);
  if (entry.presence === 'none') {
    return { state: 'none', note: entry.window || 'No trout program on this water.', fresh: false };
  }
  if (entry.presence === 'uncertain') {
    return { state: 'uncertain', note: entry.window || 'Trout presence unverified — needs on-the-water evidence.', fresh: false };
  }
  if (entry.presence === 'year-round') {
    return {
      state: 'present',
      note: entry.window || 'Trout present year-round.',
      fresh,
    };
  }
  if (entry.months.includes(month)) {
    return { state: 'present', note: entry.window || 'In season this month.', fresh };
  }
  const labels = entry.months
    .slice()
    .sort((a, b) => a - b)
    .map((m) => MONTH_ABBRS[m - 1]!);
  const windowLabel = compressMonthList(labels);
  return {
    state: 'absent',
    note: `Out of season — trout expected ${windowLabel}. ${entry.window}`.trim(),
    fresh: false,
  };
}

/** ["Dec","Jan","Feb"] → "Dec–Feb"; ["Mar","Apr","May","Oct"] → "Mar–May, Oct".
 *  A window that wraps the year end merges into one run (Dec + Jan–Feb = "Dec–Feb"). */
function compressMonthList(labels: string[]): string {
  if (labels.length === 0) return 'no documented window';
  const idx = labels.map((l) => monthIndex(l));
  // Split into contiguous runs…
  const runs: Array<[number, number]> = [];
  let start = 0;
  for (let i = 1; i <= idx.length; i++) {
    const contiguous = i < idx.length && idx[i] === idx[i - 1]! + 1;
    if (!contiguous) {
      runs.push([idx[start]!, idx[i - 1]!]);
      start = i;
    }
  }
  // …then merge a year-end wrap (first run starts at Jan, last ends at Dec).
  if (runs.length > 1 && runs[0]![0] === 0 && runs[runs.length - 1]![1] === 11) {
    const last = runs.pop()!;
    runs[0] = [last[0], runs[0]![1]];
  }
  return runs.map(([a, b]) => (a === b ? MONTH_ABBRS[a]! : `${MONTH_ABBRS[a]}–${MONTH_ABBRS[b]}`)).join(', ');
}

/** [3,4,5,12] → "Mar–May, Dec"; a year-end wrap merges into one run (Nov+Dec+Jan → "Nov–Jan"). */
export function monthWindowLabel(months: number[]): string {
  return compressMonthList(
    months
      .slice()
      .sort((a, b) => a - b)
      .map((m) => MONTH_ABBRS[m - 1] ?? '')
      .filter(Boolean),
  );
}

const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthIndex(abbr: string): number {
  return MONTH_ABBRS.indexOf(abbr);
}
