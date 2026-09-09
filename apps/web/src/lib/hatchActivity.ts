import { useQueries } from '@tanstack/react-query';
import { HatchChartSchema } from '@trout/contracts';
import type { HatchChart, HatchEntry } from '@trout/contracts';
import { snapshotUrls } from './endpoints';
import { fetchSnapshot, type SnapshotResult } from './snapshots';

/**
 * Expected-activity vocabulary for hatch charts. Abundance stays the 1–5
 * integer the content pack ships, but the UI speaks in tiers: something is
 * always hatching somewhere in Tennessee, so a chart never renders "quiet" —
 * the weakest month is "light", not empty.
 */
export const ACTIVITY_LABEL: Record<number, string> = {
  1: 'light',
  2: 'steady',
  3: 'strong',
  4: 'strong',
  5: 'peak',
};

export function activityLabel(abundance: number): string {
  return ACTIVITY_LABEL[abundance] ?? 'light';
}

/** Top abundance across a chart's entries (0 when there is no chart). */
export function chartTopAbundance(chart: HatchChart | null | undefined): number {
  if (!chart || chart.entries.length === 0) return 0;
  return chart.entries.reduce((max, e) => Math.max(max, e.abundance), 0);
}

/** Overall summary word for a region-month chart. */
export function chartActivityLabel(chart: HatchChart | null | undefined): string {
  const top = chartTopAbundance(chart);
  return top === 0 ? 'light' : activityLabel(top);
}

export interface TaxonYearActivity {
  /** Max abundance per month, index 0 = January. */
  byMonth: number[];
  /** Inclusive active span [firstMonth, lastMonth] across the year. */
  span: [number, number];
  peakMonth: number;
  peakAbundance: number;
}

/**
 * A taxon's year at a glance, derived from the region's twelve monthly
 * charts. Multiple stage entries for one taxon collapse to the strongest.
 */
export function taxonYearActivity(
  yearCharts: Array<HatchChart | null | undefined>,
  taxonId: string,
): TaxonYearActivity | null {
  const byMonth = Array.from({ length: 12 }, () => 0);
  for (const chart of yearCharts) {
    if (!chart) continue;
    for (const entry of chart.entries) {
      if (entry.taxonId !== taxonId) continue;
      const slot = byMonth[chart.month - 1];
      if (slot != null) byMonth[chart.month - 1] = Math.max(slot, entry.abundance);
    }
  }
  const active = byMonth
    .map((a, i) => ({ a, month: i + 1 }))
    .filter((x) => x.a > 0);
  const first = active[0];
  if (!first) return null;
  let peak = first;
  for (const x of active) if (x.a > peak.a) peak = x;
  const last = active[active.length - 1] ?? first;
  return {
    byMonth,
    span: [first.month, last.month],
    peakMonth: peak.month,
    peakAbundance: peak.a,
  };
}

/** Span text like "Mar–Jun · peak May" (single-month spans stay short). */
export function spanLabel(activity: TaxonYearActivity, monthNames: (m: number) => string): string {
  const [first, last] = activity.span;
  if (first === last) return `Peak ${monthNames(activity.peakMonth)}`;
  return `${monthNames(first)}–${monthNames(last)} · peak ${monthNames(activity.peakMonth)}`;
}

/** Entries for one month, strongest first (stable by taxon then stage). */
export function monthEntriesByStrength(entries: HatchEntry[]): HatchEntry[] {
  return [...entries].sort(
    (a, b) =>
      b.abundance - a.abundance ||
      a.taxonId.localeCompare(b.taxonId) ||
      a.stage.localeCompare(b.stage),
  );
}

export type YearChartsStatus = 'loading' | 'error' | 'ready' | 'partial';

/**
 * All twelve monthly charts for one region, via the offline-first snapshot
 * fetcher (Dexie-cached, so a region's year is only fetched once). Partial
 * success still renders: `charts[m-1]` is null for months not (yet) on this
 * device, and the calendar never waits for the full year to show something.
 */
export function useYearCharts(regionId: string, enabled: boolean) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const queries = useQueries({
    queries: months.map((m) => ({
      queryKey: ['snapshot', snapshotUrls.hatch(regionId, m)],
      queryFn: () => fetchSnapshot(snapshotUrls.hatch(regionId, m), HatchChartSchema, 60 * 24 * 30),
      enabled,
      staleTime: 60 * 24 * 30 * 60_000,
      gcTime: Number.POSITIVE_INFINITY,
      networkMode: 'offlineFirst' as const,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });
  const charts: Array<HatchChart | null> = months.map((m, i) => {
    const q = queries[i];
    if (!q || !q.data) return null;
    const chart = (q.data as SnapshotResult<HatchChart>).data;
    return chart.month === m ? chart : null;
  });
  const loaded = charts.filter(Boolean).length;
  const status: YearChartsStatus =
    loaded === 0 && queries.some((q) => q.isLoading)
      ? 'loading'
      : loaded === 0 && queries.every((q) => q.isError)
        ? 'error'
        : loaded === 12
          ? 'ready'
          : 'partial';
  const fetchedAt = queries
    .map((q) => (q.data as SnapshotResult<HatchChart> | undefined)?.fetchedAt ?? null)
    .find((t): t is number => t != null);
  const live =
    queries.some((q) => (q.data as SnapshotResult<HatchChart> | undefined)?.live) ?? false;
  return { charts, status, fetchedAt: fetchedAt ?? null, live };
}
