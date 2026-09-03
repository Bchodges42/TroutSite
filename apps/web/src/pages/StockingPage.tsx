import { useMemo, useState } from 'react';
import { Card, Chip, EmptyState } from '@trout/ui';
import { StockingEventSchema } from '@trout/contracts';
import type { Species, StockingEvent } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useSettingsContext } from '../lib/settings';
import { shortDate } from '../lib/time';
import { FreshnessChip } from '../components/FreshnessChip';

const SPECIES_LABEL: Record<Species, string> = {
  rainbow: 'Rainbow', brown: 'Brown', cutbow: 'Cutbow', brook: 'Brook', other: 'Other',
};

const SPECIES_TONE: Record<Species, 'neutral' | 'accent' | 'good' | 'fair' | 'poor'> = {
  rainbow: 'good', brown: 'accent', cutbow: 'fair', brook: 'poor', other: 'neutral',
};

const WINDOW_DAYS = [30, 90, 3650] as const;

/** Stocking browser (scope 5): filterable, newest-first, source-linked. */
export function StockingPage() {
  const { settings } = useSettingsContext();
  const stateId = settings.defaultState;
  const [county, setCounty] = useState('all');
  const [species, setSpecies] = useState<'all' | Species>('all');
  const [days, setDays] = useState<number>(90);

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

  const filtered = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 3600_000;
    return [...events]
      .filter((e) => (county === 'all' ? true : e.county === county))
      .filter((e) => (species === 'all' ? true : e.species === species))
      .filter((e) => Date.parse(`${e.date}T12:00:00`) >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date) || a.streamName.localeCompare(b.streamName));
  }, [events, county, species, days]);

  return (
    <main className="page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">Stocking</h1>
        <FreshnessChip fetchedAt={stockingQuery.data?.fetchedAt} live={stockingQuery.data?.live ?? false} />
      </div>
      <p className="page-subtitle mt-1">
        Weekly TWRA schedule for {stateId}, cached on your device. Verify every entry at the
        official source — this app is never authoritative.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-bold">County</span>
          <select
            className="focus-ring min-h-[44px] rounded-lg border px-3"
            style={{ borderColor: 'var(--trout-color-border)' }}
            value={county}
            onChange={(e) => setCounty(e.target.value)}
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
            onChange={(e) => setSpecies(e.target.value as 'all' | Species)}
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
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={WINDOW_DAYS[0]}>Last 30 days</option>
            <option value={WINDOW_DAYS[1]}>Last 90 days</option>
            <option value={WINDOW_DAYS[2]}>All dates</option>
          </select>
        </label>
      </div>

      {stockingQuery.isError && events.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🐟"
            title="Stocking data not on this device yet"
            description="Open once while online; the last fetched schedule stays available offline."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon="🎣" title="No stockings match those filters" description="Widen the window or clear a filter." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {filtered.map((e: StockingEvent) => (
            <li key={e.id} className="list-row" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold">{e.streamName}</span>
                  <Chip tone={SPECIES_TONE[e.species]}>{SPECIES_LABEL[e.species]}</Chip>
                  {e.county && <Chip>{e.county}</Chip>}
                </span>
                <span className="mt-1 block text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
                  {shortDate(e.date)}
                  {e.count ? ` · ${e.count.toLocaleString()} fish` : ''}
                </span>
              </span>
              <a className="focus-ring shrink-0 text-sm font-bold underline" href={e.sourceUrl} target="_blank" rel="noreferrer noopener">
                Verify at TWRA ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      <Card className="mt-6">
        <p className="text-sm">
          <span className="font-bold">Coming in v2:</span> instant stocking alerts. v1 shows the
          published schedule on the same weekly cycle TWRA does.
        </p>
      </Card>
    </main>
  );
}
