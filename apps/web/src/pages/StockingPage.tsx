import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Chip, EmptyState } from '@trout/ui';
import { StockingEventSchema } from '@trout/contracts';
import type { Species, StockingEvent } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useSettingsContext } from '../lib/settings';
import { shortDate } from '../lib/time';
import { FreshnessChip } from '../components/FreshnessChip';
import { CloseIcon, SearchIcon } from '../components/icons';

const SPECIES_LABEL: Record<Species, string> = {
  rainbow: 'Rainbow', brown: 'Brown', cutbow: 'Cutbow', brook: 'Brook', other: 'Other',
};

const SPECIES_TONE: Record<Species, 'neutral' | 'accent' | 'good' | 'fair' | 'poor'> = {
  rainbow: 'good', brown: 'accent', cutbow: 'fair', brook: 'poor', other: 'neutral',
};

const WINDOW_DAYS = [30, 90, 3650] as const;
const PREVIEW_COUNT = 6;
const FILTERED_CAP = 20;

const TODAY = () => new Date().toISOString().slice(0, 10);

/** Data-state copy: schedules are plans; past-dated entries are reports, not field-verified facts. */
export function stockingEventState(event: StockingEvent): { label: string; note: string; future: boolean } {
  const future = event.date >= TODAY();
  if (event.datePrecision === 'month')
    return {
      label: future ? 'Month window · scheduled' : 'Month window · reported',
      note: 'Published as a month window, not an exact day.',
      future,
    };
  if (event.datePrecision === 'week')
    return {
      label: future ? 'Week of · scheduled' : 'Week of · reported',
      note: `Published as the week of ${shortDate(event.date)}.`,
      future,
    };
  return {
    label: future ? 'Scheduled' : 'Reported completed',
    note: future
      ? 'Exact published day — a plan that can still change.'
      : 'Past-dated published entry — not field-verified.',
    future,
  };
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

function EventRow({ event }: { event: StockingEvent }) {
  const state = stockingEventState(event);
  return (
    <li className="list-row stocking-card" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold">{event.streamName}</span>
          <Chip tone={SPECIES_TONE[event.species]}>{SPECIES_LABEL[event.species]}</Chip>
          <span className={'data-state' + (state.future ? ' is-future' : '')}>{state.label}</span>
        </span>
        <span className="mt-1 block text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          {stockingPrecisionDate(event)}
          {event.count ? ` · ${event.count.toLocaleString()} fish` : ''}
          {event.county ? ` · ${event.county}` : ''}
        </span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--ui-faint)' }}>
          {state.note}
        </span>
      </span>
      <a
        className="focus-ring shrink-0 text-sm font-bold underline"
        href={event.sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        Verify at TWRA ↗
      </a>
    </li>
  );
}

/**
 * Stocking browser (scope 5) — search-first progressive disclosure. The page
 * opens with a search field, the most recent published entries, and an
 * explicit control before the full schedule appears; a filtered or searched
 * view shows matching entries (capped, expandable). Filters live in the URL
 * so a filtered view is shareable and survives reload.
 */
export function StockingPage() {
  const { settings } = useSettingsContext();
  const stateId = settings.defaultState;
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  // Filters live in the URL so a filtered view is shareable and survives reload.
  const county = searchParams.get('county') ?? 'all';
  const species = (searchParams.get('species') as 'all' | Species) || 'all';
  const days = Number(searchParams.get('days') ?? 90) || 90;
  const expanded = searchParams.get('all') === '1';
  const setFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    }, { replace: true });
  };

  const stockingQuery = useSnapshotQuery(
    snapshotUrls.stocking(stateId),
    StockingEventSchema.array(),
    60 * 24,
    true,
  );

  const events = useMemo(() => stockingQuery.data?.data ?? [], [stockingQuery.data]);
  const counties = useMemo(
    () => Array.from(new Set(events.map((e) => e.county).filter((c): c is string => Boolean(c)))).sort(),
    [events],
  );

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const filtered = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 3600_000;
    const q = normalize(query);
    return [...events]
      .filter((e) => (county === 'all' ? true : e.county === county))
      .filter((e) => (species === 'all' ? true : e.species === species))
      .filter((e) => Date.parse(`${e.date}T12:00:00`) >= cutoff)
      .filter(
        (e) =>
          !q ||
          normalize(e.streamName).includes(q) ||
          normalize(SPECIES_LABEL[e.species]).includes(q) ||
          (e.county ? normalize(e.county).includes(q) : false),
      )
      .sort((a, b) => b.date.localeCompare(a.date) || a.streamName.localeCompare(b.streamName));
  }, [events, county, species, days, query]);

  const filtersActive = county !== 'all' || species !== 'all' || days !== WINDOW_DAYS[1] || query.trim() !== '';
  const preview = useMemo(
    () =>
      [...events]
        .sort((a, b) => b.date.localeCompare(a.date) || a.streamName.localeCompare(b.streamName))
        .slice(0, PREVIEW_COUNT),
    [events],
  );
  const visible = filtersActive || expanded ? filtered.slice(0, expanded ? Infinity : FILTERED_CAP) : [];

  useEffect(() => {
    document.title = 'Stocking — Trout field atlas';
    return () => {
      document.title = 'Trout — The Field Atlas';
    };
  }, []);

  return (
    <main className="page stocking-discovery">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">Stocking</h1>
        <FreshnessChip fetchedAt={stockingQuery.data?.fetchedAt} live={stockingQuery.data?.live ?? false} />
      </div>
      <p className="page-subtitle mt-1">
        The published TWRA schedule for {stateId}, cached on your device. A schedule is a plan —
        verify every entry at the official source; this app is never authoritative.
      </p>

      <div className="discovery-search mt-4">
        <div className="search-field">
          <SearchIcon size={18} className="search-icon" />
          <input
            className="search-input"
            type="search"
            aria-label="Search stocking entries by water or county"
            placeholder="Search a water or county…"
            value={query}
            onChange={(e) => setFilter('q', e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="discovery-clear"
              aria-label="Clear search"
              onClick={() => setFilter('q', '')}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>
      </div>

      <details className="filter-disclosure mt-3" open={filtersActive}>
        <summary>Filter the schedule</summary>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-bold">County</span>
            <select
              className="focus-ring min-h-[44px] rounded-lg border px-3"
              style={{ borderColor: 'var(--trout-color-border)' }}
              value={county}
              onChange={(e) => setFilter('county', e.target.value)}
            >
              <option value="all">All counties</option>
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-bold">Species</span>
            <select
              className="focus-ring min-h-[44px] rounded-lg border px-3"
              style={{ borderColor: 'var(--trout-color-border)' }}
              value={species}
              onChange={(e) => setFilter('species', e.target.value)}
            >
              <option value="all">All species</option>
              {(Object.keys(SPECIES_LABEL) as Species[]).map((s) => (
                <option key={s} value={s}>{SPECIES_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-bold">Window</span>
            <select
              className="focus-ring min-h-[44px] rounded-lg border px-3"
              style={{ borderColor: 'var(--trout-color-border)' }}
              value={days}
              onChange={(e) => setFilter('days', e.target.value)}
            >
              <option value={WINDOW_DAYS[0]}>Last 30 days</option>
              <option value={WINDOW_DAYS[1]}>Last 90 days</option>
              <option value={WINDOW_DAYS[2]}>All dates</option>
            </select>
          </label>
        </div>
      </details>

      {stockingQuery.isLoading ? (
        <p className="page-subtitle mt-6" role="status">Loading schedule…</p>
      ) : stockingQuery.isError && events.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🐟"
            title="Stocking data not on this device yet"
            description="Open once while online; the last fetched schedule stays available offline."
          />
        </div>
      ) : filtersActive || expanded ? (
        <section className="mt-4" aria-label="Matching stocking entries">
          <p className="muted text-sm" role="status">
            {filtered.length === 0
              ? 'No entries match — widen the window or clear a filter.'
              : `${visible.length} of ${filtered.length} matching entries${!expanded && filtered.length > FILTERED_CAP ? ' — show all below' : ''}`}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {visible.map((e: StockingEvent) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
          {!expanded && filtered.length > visible.length && (
            <button
              type="button"
              className="secondary-action mt-3"
              onClick={() => setFilter('all', '1')}
            >
              Show all {filtered.length} entries
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="mt-6" aria-label="Most recent published entries">
            <h2 className="section-title !mt-0">Latest published</h2>
            <p className="muted text-sm">
              The newest entries in the schedule. Past-dated entries are reported, not
              field-verified — “scheduled” means the plan, not a confirmed event.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {preview.map((e: StockingEvent) => (
                <EventRow key={e.id} event={e} />
              ))}
            </ul>
          </section>
          <button
            type="button"
            className="secondary-action mt-4"
            onClick={() => setFilter('all', '1')}
          >
            Browse the full schedule — {events.length} entries
          </button>
        </>
      )}

      <Card className="mt-6">
        <p className="text-sm">
          <span className="font-bold">Never authoritative:</span> this app mirrors what TWRA
          publishes, re-read on every refresh — schedules are never cached forever. Verify timing,
          water, and rules at the official source before you plan a trip.
        </p>
      </Card>
    </main>
  );
}
