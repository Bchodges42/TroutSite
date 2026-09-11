import { Link, useParams, useSearchParams } from 'react-router-dom';
import { RiverContextBar, contextUrl } from '../lib/riverContext';
import { Card, Chip, EmptyState } from '@trout/ui';
import type { BugTaxon, FlyPattern, HatchChart, HatchEntry } from '@trout/contracts';
import { useContentPack } from '../lib/content';
import {
  activityLabel,
  monthEntriesByStrength,
  spanLabel,
  taxonYearActivity,
  useYearCharts,
  type TaxonYearActivity,
} from '../lib/hatchActivity';
import { monthName, monthShort, REGIONS, regionName } from '../data/regions';
import { FreshnessChip } from '../components/FreshnessChip';

const STAGE_LABEL: Record<HatchEntry['stage'], string> = {
  nymph: 'nymph',
  larva: 'larva',
  dun: 'dun',
  spinner: 'spinner',
  adult: 'adult',
};

const TIME_LABEL: Record<HatchEntry['timeOfDay'], string> = {
  am: 'morning',
  midday: 'midday',
  pm: 'afternoon',
  evening: 'evening',
};

/** One region-month hatch chart (scope 3) — month → expected activity, never empty. */
export function HatchChartDetailPage() {
  const { regionId = '', month = '' } = useParams();
  const [params] = useSearchParams();
  const contextual = (path: string) => contextUrl(path, params, { region: regionId, month });
  const monthNum = Number(month);
  const valid = REGIONS.some((r) => r.id === regionId) && monthNum >= 1 && monthNum <= 12;

  const year = useYearCharts(regionId, valid);
  const pack = useContentPack();
  const taxaById = new Map((pack.data?.taxa ?? []).map((t) => [t.id, t]));

  if (!valid) {
    return (
      <main className="page">
        <EmptyState
          heading="h1"
          title="Unknown region or month"
          action={
            <Link to={contextUrl('/charts', params)} className="focus-ring font-bold underline">
              Back to the hatch calendar
            </Link>
          }
        />
      </main>
    );
  }

  const chart = year.charts[monthNum - 1];
  const entries = chart?.entries ?? [];

  // Always-something guarantee: charted taxa first, then anything whose
  // catalog seasonal range covers this month but has no chart entry. A dead
  // "quiet month" view is a bug — Tennessee waters host activity year-round.
  const chartedTaxonIds = new Set(entries.map((e) => e.taxonId));
  const expectedTaxa = (pack.data?.taxa ?? []).filter(
    (t) =>
      !chartedTaxonIds.has(t.id) &&
      (t.monthsActiveByRegion[regionId] ?? t.monthsActiveByRegion['*'] ?? []).includes(monthNum),
  );

  const isLoading = year.status === 'loading';
  const isMissing = year.status === 'error' && !chart;
  const topEntry = monthEntriesByStrength(entries)[0];
  const topTaxon = topEntry ? taxaById.get(topEntry.taxonId) : undefined;

  return (
    <main className="page">
      <RiverContextBar />
      <Link to={contextual('/charts')} className="focus-ring text-sm font-bold underline">
        ← Hatch calendar
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">
          {regionName(regionId)} · {monthName(monthNum)}
        </h1>
        <FreshnessChip fetchedAt={year.fetchedAt} live={year.live} />
      </div>

      {isLoading ? (
        <p className="page-subtitle mt-6" role="status">
          Loading the year at a glance…
        </p>
      ) : isMissing ? (
        <div className="mt-6">
          <EmptyState
            icon="🗓️"
            title="Charts not on this device yet"
            description="Open this calendar once while online — the whole year then stays available offline."
            action={
              <Link to={contextual('/charts')} className="focus-ring font-bold underline">
                Pick another region
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {chart && (
            <p className="page-subtitle mt-2" data-testid="activity-summary">
              {topTaxon && topEntry ? (
                <>
                  Expected activity is <strong>{activityLabel(topEntry.abundance)}</strong>
                  {topEntry.abundance >= 4 ? '' : ' or better'} — led by{' '}
                  <Link
                    to={contextual(`/taxa/${topTaxon.id}`)}
                    className="focus-ring font-bold underline"
                  >
                    {topTaxon.commonName}
                  </Link>
                  {topEntry.abundance >= 5 ? ' at peak' : ''}. {entries.length} charted entr
                  {entries.length === 1 ? 'y' : 'ies'} this month.
                </>
              ) : (
                'Something is always active on these waters — the strips below show when each insect is expected.'
              )}
            </p>
          )}

          <MonthActivityNav
            charts={year.charts}
            regionId={regionId}
            month={monthNum}
            contextual={contextual}
          />

          <section className="mt-5" aria-label="Expected activity by insect">
            <h2 className="mb-2 text-base font-bold">What to expect in {monthName(monthNum)}</h2>
            {entries.length === 0 && expectedTaxa.length === 0 && (
              <p className="muted text-sm">
                No chart entry for this month yet — the strongest nearby activity is marked in the
                strip above.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {monthEntriesByStrength(entries).map((entry, i) => (
                <ActivityRow
                  key={`${entry.taxonId}-${entry.stage}-${i}`}
                  entry={entry}
                  taxon={taxaById.get(entry.taxonId)}
                  yearActivity={taxonYearActivity(year.charts, entry.taxonId)}
                  patterns={pack.data?.patterns ?? []}
                  contextual={contextual}
                  month={monthNum}
                />
              ))}
              {expectedTaxa.map((taxon) => (
                <div
                  key={taxon.id}
                  className="list-row"
                  style={{ borderRadius: 'var(--trout-radius-lg)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={contextual(`/taxa/${taxon.id}`)}
                        className="focus-ring font-extrabold underline-offset-2 hover:underline"
                      >
                        {taxon.commonName}
                      </Link>
                      <Chip>expected · light</Chip>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
                      In its catalog season for this region, but no hatch entry recorded this month.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Card className="mt-6">
            <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
              Strips show each insect's expected season — brighter cells are stronger activity, the
              ring marks the peak month. Regional guidance from the content pack, cached on your
              device; verify on the water.
            </p>
          </Card>
        </>
      )}
    </main>
  );
}

/** The twelve-month strip with per-month expected activity — the calendar's navigation. */
function MonthActivityNav({
  charts,
  regionId,
  month,
  contextual,
}: {
  charts: Array<HatchChart | null>;
  regionId: string;
  month: number;
  contextual: (path: string) => string;
}) {
  return (
    <nav className="activity-strip-nav mt-4" aria-label="Month by expected activity">
      {charts.map((chart, i) => {
        const m = i + 1;
        const top = chart ? Math.max(0, ...chart.entries.map((e) => e.abundance)) : 0;
        const isPeakMonth =
          top > 0 &&
          top === Math.max(0, ...charts.flatMap((c) => (c ? c.entries.map((e) => e.abundance) : [0])));
        return (
          <Link
            key={m}
            to={contextual(`/charts/${regionId}/${m}`)}
            aria-current={m === month ? 'page' : undefined}
            className={'activity-cell focus-ring' + (m === month ? ' is-current' : '')}
            aria-label={`${monthName(m)} — ${top === 0 ? 'no data yet' : `${activityLabel(top)} activity`}`}
          >
            <span className="activity-cell-month">{monthShort(m)}</span>
            <span
              className={'activity-cell-bar' + (isPeakMonth && top >= 5 ? ' is-peak' : '')}
              data-level={top}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </nav>
  );
}

/** One charted entry: identity, expected strength, and the insect's year strip. */
function ActivityRow({
  entry,
  taxon,
  yearActivity,
  patterns,
  contextual,
  month,
}: {
  entry: HatchEntry;
  taxon: BugTaxon | undefined;
  yearActivity: TaxonYearActivity | null;
  patterns: FlyPattern[];
  contextual: (path: string) => string;
  month: number;
}) {
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
          <Chip tone={entry.abundance >= 4 ? 'good' : entry.abundance >= 2 ? 'accent' : 'neutral'}>
            {activityLabel(entry.abundance)}
          </Chip>
          <span className="muted text-sm">{TIME_LABEL[entry.timeOfDay]}</span>
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
        {taxon && yearActivity && (
          <div className="mt-2 flex items-center gap-2">
            <TaxonActivityStrip activity={yearActivity} month={month} />
            <span className="muted whitespace-nowrap text-xs">
              {spanLabel(yearActivity, monthName)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Twelve tiny cells: the insect's year. Brighter = stronger; ring = peak; outline = current month. */
function TaxonActivityStrip({
  activity,
  month,
}: {
  activity: TaxonYearActivity;
  month: number;
}) {
  return (
    <span
      className="activity-strip"
      role="img"
      aria-label={`Expected activity by month: ${activity.byMonth
        .map((a, i) => (a > 0 ? `${monthShort(i + 1)} ${activityLabel(a)}` : null))
        .filter(Boolean)
        .join(', ')}`}
    >
      {activity.byMonth.map((a, i) => {
        const m = i + 1;
        return (
          <span
            key={m}
            className={
              'activity-strip-cell' +
              (a >= 5 ? ' is-peak' : '') +
              (m === month ? ' is-current' : '')
            }
            data-level={a}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}
