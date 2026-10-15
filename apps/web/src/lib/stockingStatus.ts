import type { StockingEvent } from '@trout/contracts';
import { shortDate } from './time';

/**
 * Stocking data-state helpers shared by the Stocking page, the stream detail
 * page and the map drawer, so every surface tells the same story (ADR 0012).
 */

/** The angler's local calendar day (UTC would flip to tomorrow every Tennessee evening). */
const TODAY = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function addDays(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Last day a published entry's window can still happen. TWRA: a "week of"
 * Sunday stocking "occurs within 5 days after" it; a month window runs to the
 * month's end; an exact day is itself.
 */
export function stockingWindowEnd(event: StockingEvent): string {
  if (event.datePrecision === 'week') return addDays(event.date, 5);
  if (event.datePrecision === 'month') {
    const d = new Date(`${event.date}T12:00:00Z`);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  }
  return event.date;
}

/**
 * Data-state copy (ADR 0012). Only a row from TWRA's completed-stockings
 * report may read as stocked. A schedule row stays a plan — once its window
 * has passed it is "date passed", never "reported" or "completed": TWRA made
 * no completion claim for it.
 */
export function stockingEventState(event: StockingEvent): { label: string; note: string; future: boolean } {
  if (event.status === 'reported')
    return {
      label: 'Stocked · TWRA report',
      note: `TWRA's Trout Stocking Locations Report lists this stocking on ${shortDate(event.date)}.`,
      future: false,
    };
  const future = stockingWindowEnd(event) >= TODAY();
  const passed = 'TWRA scheduled this; a completion is only confirmed by its Locations Report.';
  if (event.datePrecision === 'month')
    return {
      label: future ? 'Month window · scheduled' : 'Month window · passed',
      note: future ? 'Published as a month window, not an exact day.' : passed,
      future,
    };
  if (event.datePrecision === 'week')
    return {
      label: future ? 'Week of · scheduled' : 'Week of · date passed',
      note: future ? `Published as the week of ${shortDate(event.date)}; stocking falls within 5 days after.` : passed,
      future,
    };
  return {
    label: future ? 'Scheduled' : 'Scheduled · date passed',
    note: future ? 'Exact published day — a plan that can still change.' : passed,
    future,
  };
}

/** TWRA data older than this is called stale (the ingest runs at least daily). */
export const STOCKING_SOURCE_STALE_MS = 2 * 24 * 60 * 60_000;

/** When TWRA was last read successfully — the newest event fetchedAt, never the download time. */
export function stockingSourceFetchedAt(events: readonly StockingEvent[]): number | null {
  let newest: number | null = null;
  for (const e of events) {
    const t = Date.parse(e.fetchedAt);
    if (Number.isFinite(t) && (newest === null || t > newest)) newest = t;
  }
  return newest;
}

/** Precision-aware date label: an exact day never borrows a week's vagueness. */
export function stockingPrecisionDate(event: StockingEvent): string {
  if (event.datePrecision === 'week') return 'Week of ' + shortDate(event.date);
  if (event.datePrecision === 'month')
    return new Date(event.date + 'T12:00:00').toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  return shortDate(event.date);
}
