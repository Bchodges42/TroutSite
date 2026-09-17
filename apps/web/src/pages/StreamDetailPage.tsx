import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { RiverContextBar, riverWorkflowUrl, validMonth } from '../lib/riverContext';
import { Card, DataBadge, EmptyState } from '@trout/ui';
import {
  ConditionSnapshotSchema,
  StockingEventSchema,
  newestReadingAt,
} from '@trout/contracts';
import type { ConditionSnapshot, GaugeReading, Stream, StockingEvent } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { useStreamsCatalog } from '../lib/useStreamsCatalog';
import { useSettingsContext } from '../lib/settings';
import { matchStocking } from '../lib/stockingMatch';
import {
  flowTrend,
  rememberSeen,
  readSeen,
      TREND_LABEL,
  whatChanged,
} from '../lib/conditions';
import { formatFlow, formatHeight, formatNum, formatTemp } from '../lib/units';
import { ageMinutes } from '../lib/time';
import { FreshnessChip } from '../components/FreshnessChip';
import { ScorePill } from '../components/ScorePill';
import { conditionReason, waterTypeLabel } from '../lib/presentation';
import { statusForScore } from '../features/map/riverMapSelectors';
import { toWaterDecisionView, seasonalChipText } from '../features/map/waterDecision';
import { FishabilityCard } from '../components/FishabilityCard';
import { SolarWindowsCard } from '../components/SolarWindowsCard';
import { stockingEventState, stockingPrecisionDate } from './StockingPage';
import { itemsForWater, useFishingInfo } from '../lib/fishingInfo';
import { useSpeciesOccurrences } from '../lib/useSpeciesOccurrences';
import { WaterSpeciesCard } from '../components/WaterSpeciesCard';

const CONDITIONS_TTL_MIN = 60;

/** Stream detail (scope 4): readings, score + reasons, what changed, official links. */
export function StreamDetailPage() {
  const { streamId = '' } = useParams();
  const [params] = useSearchParams();
  const { settings } = useSettingsContext();
  const decisionMode = params.get('species') === 'all' || params.get('species') === 'trout'
    ? (params.get('species') as 'all' | 'trout')
    : settings.speciesMode;

  const streamsQuery = useStreamsCatalog(60 * 24, true);
  const conditionsQuery = useSnapshotQuery(
    snapshotUrls.conditionsLatest,
    ConditionSnapshotSchema.array(),
    CONDITIONS_TTL_MIN,
    true,
  );
  const stockingQuery = useSnapshotQuery(
    snapshotUrls.stocking('TN'),
    StockingEventSchema.array(),
    60 * 24,
    true,
  );
  const speciesOccurrencesQuery = useSpeciesOccurrences();
  const stream = streamsQuery.data?.data.find((s) => s.id === streamId);
  const snapshot = conditionsQuery.data?.data.find((s) => s.streamId === streamId);

  // Canonical stocking association (B05) — the same matcher the map uses, so
  // the detail page and the map can never tell different stocking stories.
  const stockingEvents = useMemo(() => {
    if (!stream) return [];
    const events = stockingQuery.data?.data ?? [];
    return (matchStocking(streamsQuery.data?.data ?? [], events).byStream.get(stream.id) ?? [])
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6) as StockingEvent[];
  }, [stream, stockingQuery.data, streamsQuery.data]);

  const [changes, setChanges] = useState<string[] | null>(null);
  const seenHandled = useRef(false);

  // "What changed since your last visit": diff against the stored baseline,
  // then remember the current readings as the new baseline.
  useEffect(() => {
    if (!snapshot || seenHandled.current) return;
    seenHandled.current = true;
    void (async () => {
      const previous = await readSeen(snapshot.streamId);
      if (previous) setChanges(whatChanged(previous, snapshot.readings));
      await rememberSeen(snapshot);
    })();
  }, [snapshot]);

  if (streamsQuery.isLoading) {
    return (
      <main className="page">
        <p className="page-subtitle" role="status">
          Loading stream…
        </p>
      </main>
    );
  }

  if (!stream) {
    return (
      <main className="page">
        <EmptyState
          title="Stream not found"
          description="It may not be in the cached catalog yet."
          action={
            <Link to="/conditions" className="focus-ring font-bold underline">
              Back to Conditions
            </Link>
          }
        />
      </main>
    );
  }

  const readings = snapshot?.readings ?? [];
  const trend = flowTrend(readings);
  const newestCfs = newestValue(readings, 'cfs');
  const newestTemp = newestValue(readings, 'tempC');
  const newestHeight = newestValue(readings, 'heightFt');
  const newestReservoirLevel = newestValue(readings, 'reservoirLevelFt');
  const newestDissolvedOxygen = newestValue(readings, 'dissolvedOxygenMgL');
  const lakeLike = ['lake', 'pond'].includes(stream.waterbodyType);
  const month = validMonth(params.get('month'));
  const status = snapshot
    ? statusForScore(snapshot.score.value, snapshot.readings.length > 0, snapshot.score.assessed)
    : 'no-data';
  const decision = snapshot
    ? toWaterDecisionView(
        {
          stream,
          status,
          score: status !== 'no-data' ? snapshot.score.value : null,
          snapshot,
          species: stream.species,
        },
        decisionMode,
        month,
      )
    : null;
  const seasonal = decision ? seasonalChipText(decision) : null;

  return (
    <main className="page">
      <RiverContextBar />
      <Link to="/conditions" className="focus-ring text-sm font-bold underline">
        ← Conditions
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{stream.name}</h1>
          <p className="page-subtitle capitalize">
            {waterTypeLabel(stream.waterbodyType)} ·{' '}
            {stream.stockingProgram ? 'stocking program listed' : 'no stocking program listed'}
          </p>
          {snapshot != null && (
            <DetailSeasonChip
              stream={stream}
              snapshot={snapshot}
              month={month}
              mode={decisionMode}
            />
          )}
        </div>
        <FreshnessChip
          fetchedAt={snapshot ? Date.parse(snapshot.fetchedAt) : null}
          live={conditionsQuery.data?.live ?? false}
          observedAt={newestReadingAt(snapshot?.readings ?? [])}
          nextExpectedAt={snapshot ? Date.parse(snapshot.nextExpectedUpdate) : null} />
      </div>

      {/* T2-37: mobile leads with the decision — state, observation age, flow,
      temp, and one next action. Desktop keeps the full card flow below. */}
      <div className="mobile-decision-header" data-testid="mobile-decision-header">
        <dl className="mobile-decision-grid">
          <div>
            <dt>Now</dt>
            <dd data-testid="mobile-state">
              {(() => {
                if (seasonal?.includes('out of season')) return 'Out of season';
                if (seasonal) return 'Seasonal';
                return stream.species === 'warmwater'
                  ? 'Warmwater'
                  : stream.species == null
                    ? 'Unverified'
                    : status === 'good'
                      ? 'Good'
                      : status === 'fair'
                        ? 'Fair'
                        : status === 'poor'
                          ? 'Poor'
                          : 'Not assessed';
              })()}
            </dd>
          </div>
          <div>
            <dt>Observed</dt>
            <dd>
              {snapshot?.readings.length
                ? ageMinutes(newestReadingAt(snapshot.readings) ?? Date.parse(snapshot.fetchedAt))
                : '—'}
            </dd>
          </div>
          <div>
            <dt>Flow</dt>
            <dd>{newestCfs != null ? formatFlow(newestCfs) : '—'}</dd>
          </div>
          <div>
            <dt>{lakeLike ? 'Level' : 'Temp'}</dt>
            <dd>
              {lakeLike
                ? newestReservoirLevel != null
                  ? formatHeight(newestReservoirLevel)
                  : '—'
                : newestTemp != null
                  ? formatTemp(newestTemp, settings.tempUnit)
                  : '—'}
            </dd>
          </div>
        </dl>
        <Link
          to={riverWorkflowUrl('/hatch-key', stream, month)}
          className="primary-action mobile-next-action focus-ring"
        >
          Match this water <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {/* F6: the focus species' fishability card — independent of the trout
      conditions snapshot; a water can carry one, both, or neither. */}
      <FishabilityCard streamId={stream.id} />
      {/* F11: today's dawn/dusk windows (client-side solar math, heuristic). */}
      <SolarWindowsCard streamId={stream.id} />
      {!snapshot ? (
        <div className="mt-6">
          <EmptyState
            icon="📡"
            title="No conditions cached for this stream"
            description="Reopen this page once while online to store the latest gauge snapshot."
          />
        </div>
      ) : (
        <>
          <Card className="mt-4">
            {(() => {
              // Same classification the map and list use (waterDecision is the
              // single authority): an assessed clamped-0 score is Poor here too.
              const status = statusForScore(
                snapshot.score.value,
                snapshot.readings.length > 0,
                snapshot.score.assessed,
              );
              const decision = toWaterDecisionView(
                {
                  stream,
                  status,
                  score: status !== 'no-data' ? snapshot.score.value : null,
                  snapshot,
                  species: stream.species,
                },
                decisionMode,
                month,
              );
              const troutMetric = decision.displayMetric === 'trout-condition';
              const seasonal = seasonalChipText(decision);
              return (
                <div className="flex flex-wrap items-center gap-4">
                  {troutMetric && <ScorePill score={snapshot.score.value} size="lg" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {stream.species === 'warmwater'
                        ? 'Warmwater — raw readings shown; the trout model does not apply'
                        : stream.species == null
                          ? 'Species unverified — the catalog does not document trout for this water; raw readings shown'
                          : seasonal?.includes('out of season')
                            ? `${seasonal}; raw readings shown`
                            : seasonal
                              ? seasonal
                              : troutMetric
                                ? 'Trout condition assessment'
                                : 'Assessment unavailable in this snapshot'}
                      {troutMetric && trend !== 'unknown' && (
                        <span className="ml-2 font-semibold">{TREND_LABEL[trend]}</span>
                      )}
                    </p>
                    {troutMetric && (
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {snapshot.score.reasons.map((r) => (
                          <li key={r}>{conditionReason(r, settings.tempUnit)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })()}
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            <DataBadge
              label="Flow"
              value={newestCfs != null ? formatFlow(newestCfs) : 'Not reported'}
              status={
                stream.species === 'trout' && newestCfs != null
                  ? statusForFlow(stream, newestCfs)
                  : 'unknown'
              }
            />
            {['lake', 'pond'].includes(stream.waterbodyType) ? (
              <DataBadge
                label="Reservoir level"
                value={newestReservoirLevel != null ? formatHeight(newestReservoirLevel) : 'Not reported'}
                status="unknown"
              />
            ) : (
              <DataBadge
                label="Water temp"
                value={newestTemp != null ? formatTemp(newestTemp, settings.tempUnit) : 'Not reported'}
                status={stream.species === 'trout' && newestTemp != null ? statusForTemp(newestTemp) : 'unknown'}
              />
            )}
            {newestDissolvedOxygen != null && (
              <DataBadge
                label="Dissolved oxygen"
                value={`${formatNum(newestDissolvedOxygen)} mg/L${dissolvedOxygenConstraintText(newestDissolvedOxygen, stream.species) ? ` — ${dissolvedOxygenConstraintText(newestDissolvedOxygen, stream.species)}` : ''}`}
                status="unknown"
              />
            )}
            {newestHeight != null && (
              <DataBadge label="Stage" value={formatHeight(newestHeight)} status="unknown" />
            )}
            <DataBadge
              label="Ideal flow"
              value={
                stream.idealFlow.length
                  ? stream.idealFlow
                      .map((r) => `${formatNum(r.min)}–${formatNum(r.max)}`)
                      .join(', ') + ' cfs' + (stream.idealFlowSource ? ` (typical range — ${stream.idealFlowSource})` : '')
                  : 'Not listed'
              }
              status="unknown"
            />
          </div>

          {changes && changes.length > 0 && (
            <Card className="mt-4">
              <p className="text-sm font-bold">What changed since your last visit</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* T2-37: mobile folds the history into a disclosure; desktop keeps
          the table open. */}
          <details className="gauge-disclosure mobile-only summary-anchor">
            <summary className="section-title">
              Gauge readings <span className="muted text-xs">({readings.length})</span>
            </summary>
            <ReadingsTable readings={readings} tempUnit={settings.tempUnit} />
          </details>
          <div className="desktop-only">
            <h2 className="section-title">Gauge readings</h2>
            <ReadingsTable readings={readings} tempUnit={settings.tempUnit} />
          </div>
        </>
      )}

      <WaterRegulations streamId={streamId} />

      <WaterSpeciesCard
        waterId={streamId}
        catalog={speciesOccurrencesQuery.data?.data}
        loading={speciesOccurrencesQuery.isLoading}
      />

      <section aria-labelledby="stocking-history-heading">
        <h2 className="section-title" id="stocking-history-heading">
          Stocking history
        </h2>
        {stockingQuery.isLoading ? (
          <p className="page-subtitle" role="status">
            Loading stocking schedule…
          </p>
        ) : stockingEvents.length === 0 ? (
          <Card>
            <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
              No published TWRA entry matches this water in the current schedule. That is not
              confirmation that it is unstocked — check the{' '}
              <Link to="/stocking" className="focus-ring font-bold underline">
                full schedule
              </Link>{' '}
              and the official source.
            </p>
          </Card>
        ) : (
          <>
            <ul className="mt-3 flex flex-col gap-2">
              {stockingEvents.map((event) => {
                const state = stockingEventState(event);
                return (
                  <li
                    key={event.id}
                    className="list-row"
                    style={{ borderRadius: 'var(--trout-radius-lg)' }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold">{stockingPrecisionDate(event)}</span>
                        <span
                          className={'data-state' + (state.future ? ' is-future' : '')}
                        >
                          {state.label}
                        </span>
                      </span>
                      <span
                        className="mt-1 block text-sm"
                        style={{ color: 'var(--trout-color-text-muted)' }}
                      >
                        {event.species} trout
                        {event.count ? ` · ${event.count.toLocaleString()} fish` : ''}
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
              })}
            </ul>
            <p className="muted text-xs mt-2">
              Reported entries are past-dated published schedules, not field-verified stockings.
              Cached from the TWRA feed fetched{' '}
              {stockingQuery.data?.fetchedAt
                ? new Date(stockingQuery.data.fetchedAt).toLocaleString()
                : 'at an unknown time'}
              ; the schedule is re-read on refresh, never cached indefinitely.
            </p>
          </>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="secondary-action"
          to={riverWorkflowUrl('/', stream, month)}
        >
          View on map
        </Link>
        <Link
          className="primary-action"
          to={riverWorkflowUrl('/hatch-key', stream, month)}
        >
          Match this water
        </Link>
        <Link
          className="secondary-action"
          to={riverWorkflowUrl('/logbook', stream, month)}
        >
          Log this water
        </Link>
      </div>
      {stream.notes && (
        <>
          <h2 className="section-title">Notes</h2>
          <Card>
            <p className="text-sm">{stream.notes}</p>
          </Card>
        </>
      )}

      <h2 className="section-title">Verify officially</h2>
      <Card>
        <p className="mb-2 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          This app is never authoritative on flows, regulations, or fees. Confirm at the official
          sources:
        </p>
        <ul className="list-disc pl-5 text-sm">
          {stream.officialSources.map((src) => (
            <li key={src.url}>
              <a
                className="focus-ring font-semibold underline"
                href={src.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {src.label}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}

/** T1-18/19 — the water's seasonal state as a first-class chip. */
function DetailSeasonChip({
  stream,
  snapshot,
  month,
  mode,
}: {
  stream: Stream;
  snapshot: ConditionSnapshot;
  month: number;
  mode: 'trout' | 'all';
}) {
  const hasData = snapshot.readings.length > 0;
  const status = statusForScore(snapshot.score.value, hasData, snapshot.score.assessed);
  const text = seasonalChipText(
    toWaterDecisionView(
      {
        stream,
        status,
        score: status !== 'no-data' ? snapshot.score.value : null,
        snapshot,
        species: stream.species,
      },
      mode,
      month,
    ),
  );
  if (!text) return null;
  return <p className="seasonal-chip">{text}</p>;
}

function ReadingsTable({
  readings,
  tempUnit,
}: {
  readings: GaugeReading[];
  tempUnit: 'C' | 'F';
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr
            className="text-left text-xs uppercase tracking-wide"
            style={{ color: 'var(--trout-color-text-muted)' }}
          >
            <th className="py-2 pr-3">Gauge</th>
            <th className="py-2 pr-3">Flow</th>
            <th className="py-2 pr-3">Stage</th>
            <th className="py-2 pr-3">Reservoir level</th>
            <th className="py-2 pr-3">Temp</th>
            <th className="py-2">Observed</th>
          </tr>
        </thead>
        <tbody>
          {[...readings]
            .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
            .map((r, i) => (
              <tr
                key={`${r.gaugeId}-${r.timestamp}-${i}`}
                className="border-t"
                style={{ borderColor: 'var(--trout-color-border)' }}
              >
                <td className="py-2 pr-3 font-mono text-xs">{r.gaugeId}</td>
                <td className="py-2 pr-3 font-semibold">
                  {r.cfs != null ? formatFlow(r.cfs) : '—'}
                </td>
                <td className="py-2 pr-3">
                  {r.heightFt != null ? formatHeight(r.heightFt) : '—'}
                </td>
                <td className="py-2 pr-3">
                  {r.reservoirLevelFt != null ? formatHeight(r.reservoirLevelFt) : '—'}
                </td>
                <td className="py-2 pr-3">
                  {r.tempC != null ? formatTemp(r.tempC, tempUnit) : '—'}
                </td>
                <td className="py-2" style={{ color: 'var(--trout-color-text-muted)' }}>
                  {ageMinutes(Date.parse(r.timestamp))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function newestValue(
  readings: GaugeReading[],
  key: 'cfs' | 'tempC' | 'heightFt' | 'reservoirLevelFt' | 'dissolvedOxygenMgL',
): number | null {
  const sorted = [...readings]
    .filter((r) => typeof r[key] === 'number')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const top = sorted[0];
  return top ? (top[key] as number) : null;
}

/** Gold Book constraint context: this is a warning about a floor, never a score bonus. */
export function dissolvedOxygenConstraintText(value: number, species: Stream['species']): string | null {
  if (species === 'warmwater' && value < 4) return 'below approx. 4.0 mg/L warmwater floor';
  if (species === 'trout' && value < 2) return 'below 2.0 mg/L coldwater instantaneous floor';
  if (species === 'trout' && value < 5) return 'below approx. 5.0 mg/L coldwater 7-day floor';
  return null;
}

function statusForFlow(
  stream: { idealFlow: { min: number; max: number }[] },
  cfs: number,
): 'good' | 'fair' | 'poor' {
  if (stream.idealFlow.some((r) => cfs >= r.min && cfs <= r.max)) return 'good';
  const nearest = stream.idealFlow.reduce(
    (best, r) => {
      const d = cfs < r.min ? r.min - cfs : cfs > r.max ? cfs - r.max : 0;
      return d < best.d ? { d } : best;
    },
    { d: Number.POSITIVE_INFINITY },
  );
  return nearest.d <= (stream.idealFlow[0]?.min ?? 100) * 0.5 ? 'fair' : 'poor';
}

function statusForTemp(tempC: number): 'good' | 'fair' | 'poor' {
  if (tempC >= 11 && tempC <= 19) return 'good';
  if (tempC < 2 || tempC >= 25) return 'poor';
  return 'fair';
}

/** Per-water special regulations from the fishing-information pack file —
 *  hidden entirely when the catalog lists no special rule for this water. */
function WaterRegulations({ streamId }: { streamId: string }) {
  const info = useFishingInfo();
  const items = itemsForWater(info.data?.data, 'special-regulations', streamId);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="water-regs-heading">
      <h2 className="section-title" id="water-regs-heading">
        Special regulations on this water
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <Card key={i}>
            <p className="text-sm font-bold">{item.title}</p>
            <p className="mt-1 text-sm">{item.text}</p>
            <p className="muted mt-1 text-xs">
              {item.authority}
              {item.effectiveFrom ? ` · effective ${item.effectiveFrom}` : ''} · verified against{' '}
              {(() => {
                try {
                  return new URL(item.sourceUrl).hostname.replace(/^www\./, '');
                } catch {
                  return 'official source';
                }
              })()}
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-2">
        <Link to="/regulations" className="focus-ring text-sm font-bold underline">
          All Tennessee fishing regulations →
        </Link>
      </p>
    </section>
  );
}
