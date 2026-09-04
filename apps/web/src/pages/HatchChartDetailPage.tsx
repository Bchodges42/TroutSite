import { Link, useParams, useSearchParams } from 'react-router-dom';
import { RiverContextBar, contextUrl } from '../lib/riverContext';
import { Card, Chip, EmptyState } from '@trout/ui';
import { HatchChartSchema } from '@trout/contracts';
import type { BugTaxon, FlyPattern, HatchEntry, TimeOfDay } from '@trout/contracts';
import { useContentPack } from '../lib/content';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { FreshnessChip } from '../components/FreshnessChip';
import { monthName, REGIONS, regionName } from '../data/regions';

const TIME_ORDER: TimeOfDay[] = ['am', 'midday', 'pm', 'evening'];
const TIME_LABEL: Record<TimeOfDay, string> = {
  am: 'Morning',
  midday: 'Midday',
  pm: 'Afternoon',
  evening: 'Evening',
};
const STAGE_LABEL: Record<HatchEntry['stage'], string> = {
  nymph: 'nymph',
  larva: 'larva',
  dun: 'dun',
  spinner: 'spinner',
  adult: 'adult',
};

/** One region-month hatch chart (scope 3) — snapshot-served, cached, offline. */
export function HatchChartDetailPage() {
  const { regionId = '', month = '' } = useParams();
  const [params] = useSearchParams();
  const contextual = (path: string) => contextUrl(path, params, { region: regionId, month });
  const monthNum = Number(month);
  const valid = REGIONS.some((r) => r.id === regionId) && monthNum >= 1 && monthNum <= 12;

  const chartQuery = useSnapshotQuery(
    valid ? snapshotUrls.hatch(regionId, monthNum) : '',
    HatchChartSchema,
    60 * 24 * 30,
    valid,
  );
  const pack = useContentPack();

  if (!valid) {
    return (
      <main className="page">
        <EmptyState
          heading="h1"
          title="Unknown region or month"
          action={
            <Link to={contextUrl('/charts', params)} className="focus-ring font-bold underline">
              Back to Hatch Charts
            </Link>
          }
        />
      </main>
    );
  }

  const entries = chartQuery.data?.data.entries ?? [];
  const taxaById = new Map((pack.data?.taxa ?? []).map((t) => [t.id, t]));

  const byTime = TIME_ORDER.map((tod) => ({
    timeOfDay: tod,
    entries: entries.filter((e) => e.timeOfDay === tod),
  })).filter((g) => g.entries.length > 0);

  return (
    <main className="page">
      <RiverContextBar />
      <Link to={contextual('/charts')} className="focus-ring text-sm font-bold underline">
        ← Hatch Charts
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">
          {regionName(regionId)} · {monthName(monthNum)}
        </h1>
        <FreshnessChip
          fetchedAt={chartQuery.data?.fetchedAt}
          live={chartQuery.data?.live ?? false}
        />
      </div>

      {chartQuery.isLoading ? (
        <p className="page-subtitle mt-6" role="status">
          Loading chart…
        </p>
      ) : chartQuery.isError && entries.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🗓️"
            title="Chart not on this device yet"
            description="Open this chart once while online — it then stays available offline."
            action={
              <Link to={contextual('/charts')} className="focus-ring font-bold underline">
                Pick another chart
              </Link>
            }
          />
        </div>
      ) : byTime.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🌙"
            title="Quiet month"
            description="No hatch entries recorded for this region and month."
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {byTime.map(({ timeOfDay, entries: group }) => (
            <section key={timeOfDay} aria-label={TIME_LABEL[timeOfDay]}>
              <h2 className="mb-2 text-base font-bold">{TIME_LABEL[timeOfDay]}</h2>
              <div className="flex flex-col gap-2">
                {group.map((entry, i) => (
                  <ChartEntryRow
                    key={`${entry.taxonId}-${entry.stage}-${i}`}
                    entry={entry}
                    taxaById={taxaById}
                    patterns={pack.data?.patterns ?? []}
                    contextual={contextual}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          Abundance is 1–5. Everything here is cached on your device — no connection needed after
          the first visit.
        </p>
      </Card>
    </main>
  );
}

function ChartEntryRow({
  entry,
  taxaById,
  patterns,
  contextual,
}: {
  entry: HatchEntry;
  taxaById: Map<string, BugTaxon>;
  patterns: FlyPattern[];
  contextual: (path: string) => string;
}) {
  const taxon = taxaById.get(entry.taxonId);
  return (
    <div className="list-row" style={{ borderRadius: 'var(--trout-radius-lg)' }}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {taxon ? (
            <Link
              to={contextual(`/taxa/${taxon.id}`)}
              className="focus-ring font-extrabold underline-offset-2 hover:underline"
            >
              {taxon.commonName}
            </Link>
          ) : (
            <span className="font-extrabold">Insect reference unavailable</span>
          )}
          <Chip>{STAGE_LABEL[entry.stage]}</Chip>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {entry.patterns.map((pid) => {
            const pattern = patterns.find((x) => x.id === pid);
            return pattern ? (
              <Link key={pid} to={contextual(`/patterns/${pattern.id}`)} className="focus-ring">
                <Chip tone="accent">{pattern.name}</Chip>
              </Link>
            ) : (
              <Chip key={pid}>Pattern reference unavailable</Chip>
            );
          })}
        </div>
      </div>
      <span
        className="flex shrink-0 items-center gap-1"
        role="img"
        aria-label={`Abundance ${entry.abundance} of 5`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`abundance-dot ${i < entry.abundance ? 'is-on' : ''}`} />
        ))}
      </span>
    </div>
  );
}
