import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Chip, cx } from '@trout/ui';
import type { WaterOverview, OverviewMetric } from '../../lib/waterOverview';
import { formatFlow, formatHeight, formatTemp } from '../../lib/units';
import { ageMinutes, shortDate } from '../../lib/time';
import { useSettingsContext } from '../../lib/settings';
import { isSaved, toggleSaved } from '../../lib/savedWaters';
import { addEntry, LOGBOOK_NOTE } from '../../lib/logbook';
import {
  availabilityLabel,
  availabilityTone,
  conditionStatusTone,
  overviewConditionStatus,
  type DecisionContext,
} from './overviewStatus';

export interface WaterOverviewCardProps {
  overview: WaterOverview;
  /** 'full' = stream detail page top; 'compact' = map inspector top. */
  variant: 'full' | 'compact';
  /**
   * Classification context the calling surface already holds (catalog
   * species + adjudicated status). With it, the condition label comes from
   * `decisionStatusText` directly; without it the same authority is asked
   * with what the overview honestly knows.
   */
  decisionContext?: DecisionContext | null;
  /** Route overrides so each surface keeps its own deep-link context. */
  hatchHref?: string;
  compareHref?: string;
  logbookHref?: string;
  className?: string;
}

function metricValueText(metric: OverviewMetric, tempUnit: 'C' | 'F'): string {
  if (metric.key === 'flow') return formatFlow(metric.value);
  if (metric.key === 'temperature') return formatTemp(metric.value, tempUnit);
  return formatHeight(metric.value);
}

/**
 * WaterOverviewCard (ADR 0013) — the ONE consistent overview both the map
 * inspector and the stream detail page lead with. It renders a built
 * `WaterOverview` verbatim: it never re-scores conditions, re-classifies a
 * water, or invents facts. Summary first (identity, opportunity headline,
 * focused-species condition status in the established decisionStatusText
 * vocabulary — never a score, per-metric freshness, availability, notices);
 * sources/stocking/gauge ids live behind the Details disclosure, which the
 * summary never requires.
 */
export function WaterOverviewCard({
  overview,
  variant,
  decisionContext = null,
  hatchHref,
  compareHref,
  logbookHref,
  className,
}: WaterOverviewCardProps) {
  const { settings } = useSettingsContext();
  const full = variant === 'full';
  const { identity, opportunity, assessment, metrics, availability, stocking, notices, actions } =
    overview;

  const statusLabel = overviewConditionStatus(assessment, decisionContext ?? undefined);

  // Source notices sit WITH the metrics they describe; season/restriction
  // notices sit with the identity/opportunity they describe.
  const sourceNotices = notices.filter((n) => n.kind === 'source');
  const topNotices = notices.filter((n) => n.kind !== 'source');

  const waterId = identity.id;
  const toCompare = compareHref ?? `/compare?waters=${encodeURIComponent(waterId)}`;
  const toLogbook = logbookHref ?? `/logbook?stream=${encodeURIComponent(waterId)}`;
  const toHatch = hatchHref ?? '/hatch-key';

  // Save state rides the My Waters store (ADR 0012) — the same store the
  // saved-waters surfaces read, so every toggle is visible everywhere.
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let alive = true;
    isSaved(waterId)
      .then((v) => {
        if (alive) setSaved(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [waterId]);

  // Quick-log state: streamId/streamName/date prefilled; full editing stays
  // in /logbook?stream=<id>.
  const [logOpen, setLogOpen] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logNotes, setLogNotes] = useState('');
  const [logSaved, setLogSaved] = useState(false);

  const submitLog = (e: FormEvent) => {
    e.preventDefault();
    if (!logDate) return;
    void addEntry({
      streamId: waterId,
      streamName: identity.name,
      date: logDate,
      notes: logNotes.trim() || undefined,
    })
      .then(() => {
        setLogSaved(true);
        setLogNotes('');
      })
      .catch(() => {});
  };

  return (
    <Card
      className={cx('water-overview', full ? 'p-5' : 'p-4', className)}
      data-variant={variant}
      aria-label={`${identity.name} overview`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={cx('font-extrabold leading-tight', full ? 'text-xl' : 'text-lg')}>
            {identity.name}
          </h3>
          <p className="muted mt-0.5 text-sm">
            {[identity.reach, identity.typeLabel, full ? identity.counties.join(' · ') || null : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Chip tone={availabilityTone(availability.conditions, availability.offlineSaved)}>
          {availabilityLabel(availability.conditions, availability.offlineSaved)}
        </Chip>
      </div>

      {opportunity.headline && (
        <p className="mt-1.5 text-sm font-bold">{opportunity.headline}</p>
      )}

      {/* Reserve (visual-hierarchy lane): the assessment line keeps its slot
          while notices/status settle, so nothing below shifts under a tap. */}
      <div className="reserve-assessment mt-2 flex flex-wrap items-center gap-2">
        <Chip tone={conditionStatusTone(statusLabel)} title="Focused-species condition status from the current assessment — never a score.">
          {statusLabel}
        </Chip>
        {full && opportunity.species.length > 0 && (
          <span className="muted text-xs">Target: {opportunity.species.join(', ')}</span>
        )}
        {full && stocking.program && !stocking.lastEvent && (
          <span className="muted text-xs">Stocking program listed</span>
        )}
      </div>

      {topNotices.map((n) => (
        <p key={n.text} className="mt-2 flex items-start gap-1.5 text-sm">
          <Chip tone={n.severity === 'warning' ? 'fair' : 'neutral'} className="shrink-0">
            {n.severity === 'warning' ? 'Check' : 'Note'}
          </Chip>
          <span>{n.text}</span>
        </p>
      ))}

      {/* Reserve: the metric row holds its height until snapshot data lands,
          so the action row beneath never jumps mid-tap. */}
      <div
        className="reserve-metrics mt-3 flex flex-wrap items-end gap-x-5 gap-y-2"
        data-testid="overview-metrics"
      >
        {metrics.length === 0 && (
          <p className="muted text-sm">No gauge readings reported for this water.</p>
        )}
        {metrics.map((m) => (
          <div key={m.key} className="min-w-[7rem]">
            <p className="muted text-xs">{m.label}</p>
            <p className="data-value text-base">{metricValueText(m, settings.tempUnit)}</p>
            {m.observedAt != null &&
              (m.stale ? (
                <Chip
                  tone="fair"
                  className="mt-0.5"
                  title="This reading carries its own age — a fresher flow never refreshes an older temperature."
                >
                  {/* No .data-unit here: the chip's fair (amber) TEXT is the
                      status reinforcement, and .data-unit's dimmed gray would
                      neutralize it (and wash out on the fixed light amber
                      fill in dark themes). The chip owns its color. */}
                  observed {ageMinutes(m.observedAt)}
                </Chip>
              ) : (
                <span
                  className="data-unit"
                  title="This reading carries its own age — each metric is timed independently."
                >
                  observed {ageMinutes(m.observedAt)}
                </span>
              ))}
          </div>
        ))}
        {sourceNotices.map((n) => (
          <p key={n.text} className="flex w-full items-start gap-1.5 text-sm">
            <Chip tone={n.severity === 'warning' ? 'fair' : 'neutral'} className="shrink-0">
              {n.severity === 'warning' ? 'Check' : 'Note'}
            </Chip>
            <span>{n.text}</span>
          </p>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="overview-actions">
        <Button
          variant={saved ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={saved}
          onClick={() => {
            void toggleSaved({ waterId, name: identity.name, regionId: identity.regionId })
              .then(setSaved)
              .catch(() => {});
          }}
        >
          {saved ? 'Saved' : 'Save'}
        </Button>
        <Link className="secondary-action" to={toCompare}>
          Compare
        </Link>
        <Link className="secondary-action" to={`/trips?waters=${encodeURIComponent(waterId)}`}>
          Prepare trip
        </Link>
        {actions.matchHatch && (
          <Link className="text-action" to={toHatch}>
            Match hatch
          </Link>
        )}
        <Button variant="ghost" size="sm" onClick={() => setLogOpen((v) => !v)}>
          {logOpen ? 'Close quick log' : 'Log trip'}
        </Button>
      </div>

      {logOpen && (
        <form className="mt-2 flex flex-col gap-2" onSubmit={submitLog} data-testid="quick-log-form">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold">
              Date{' '}
              <input
                type="date"
                value={logDate}
                required
                onChange={(e) => setLogDate(e.target.value)}
                className="ml-1 rounded border px-2 py-1 text-sm"
                style={{ borderColor: 'var(--trout-color-border)' }}
              />
            </label>
            <Link className="text-action text-sm" to={toLogbook}>
              Edit in logbook
            </Link>
          </div>
          <textarea
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            rows={2}
            aria-label="Log notes"
            placeholder="Flies, conditions, what you saw…"
            className="rounded border px-2 py-1 text-sm"
            style={{ borderColor: 'var(--trout-color-border)' }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm">
              Save entry
            </Button>
            <span className="muted text-xs">{LOGBOOK_NOTE}</span>
          </div>
          {logSaved && (
            <p role="status" className="text-sm font-bold">
              Entry saved for {logDate}.
            </p>
          )}
        </form>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-bold">Details</summary>
        <div className="muted mt-2 flex flex-col gap-1 text-sm">
          <p>
            {availability.offlineSaved ? 'Served from the snapshot saved on this device. ' : ''}
            {availability.nextExpectedUpdate
              ? `Next expected update ${new Date(availability.nextExpectedUpdate).toLocaleString()}.`
              : 'No update schedule published by the feed.'}
          </p>
          <p>
            Official sources listed: {overview.sources.count}
            {!full && identity.counties.length > 0 ? ` · Counties: ${identity.counties.join(', ')}` : ''}
          </p>
          <p>
            {stocking.program
              ? stocking.lastEvent
                ? `Last published stocking: ${shortDate(stocking.lastEvent.date)}${
                    stocking.lastEvent.species ? ` · ${stocking.lastEvent.species} trout` : ''
                  }${stocking.lastEvent.precision === 'month' ? ' (month-level schedule)' : ''}`
                : 'Stocking program listed — no published event matched this water.'
              : 'No stocking program listed.'}
          </p>
          {metrics.length > 0 && (
            <div>
              <p className="mt-1 font-bold">Gauge readings</p>
              <ul>
                {metrics.map((m) => (
                  <li key={m.key}>
                    {m.label} {metricValueText(m, settings.tempUnit)}
                    {m.gaugeId ? ` · gauge ${m.gaugeId}` : ''}
                    {m.observedAt != null ? ` · observed ${ageMinutes(m.observedAt)}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {overview.releases.applicable && (
            <p>Dam-release water — a generation schedule may govern conditions.</p>
          )}
        </div>
      </details>
    </Card>
  );
}
