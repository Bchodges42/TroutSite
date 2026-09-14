import { useSearchParams } from 'react-router-dom';
import { scoreBand } from '../lib/conditions';
import { SPECIES_LABELS, useFishabilityForWater } from '../lib/fishability';
import { useSettingsContext } from '../lib/settings';
import type { ActivityComponent, FlowTrendContext, PressureContext, RainContext, SpeciesKey } from '@trout/contracts';

const BAND_COLOR: Record<string, string> = {
  good: 'var(--trout-status-good)',
  fair: 'var(--trout-status-fair)',
  poor: 'var(--trout-status-poor)',
};

const CONFIDENCE_LABEL: Record<ActivityComponent['confidence'], string> = {
  measured: 'measured',
  derived: 'derived',
  heuristic: 'heuristic',
};

/** F10: pressure is an AREA signal (NWS station mapped to the catalog region)
 *  — the row never presents it as a per-water measurement. */
function rowLabel(component: ActivityComponent): string {
  if (component.factor === 'pressure-trend') return 'Area pressure';
  return component.label;
}

/** Context rows are deliberately separate from the weighted activity factors. */
function ContextNotes({ pressure, rain }: { pressure?: PressureContext; rain?: RainContext }) {
  if (!pressure && !rain) return null;
  return (
    <div className="mt-2 flex flex-col gap-1" role="note" aria-label="Weather context">
      {rain && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--trout-slate-100)', border: '1px solid var(--ui-border)' }}
        >
          {rain.label} — expect stain and rising water on rain-fed reaches.{' '}
          <span className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
            Measured gauge context only, not part of the score.
          </span>
        </p>
      )}
      {pressure && (
        <p className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
          {pressure.label} ({pressure.station}) — derived area context only, not part of the score.
        </p>
      )}
    </div>
  );
}

/**
 * F10 (stage 4): the transparent activity outlook — one ordered row per
 * factor with its value, its weighted contribution, its source link, and a
 * confidence label. The wording is "activity outlook", never a claim that
 * fish will bite. An empty outlook is honest "no activity data", never a
 * score of zero.
 */
function ActivityBreakdown({ activity }: { activity: { total: number; components: ActivityComponent[]; flowTrend?: FlowTrendContext } }) {
  if (!activity.components.length) {
    return <FlowTrendContextRow flowTrend={activity.flowTrend} />;
  }
  return (
    <div className="mt-3 activity-outlook">
      <p className="text-sm font-bold">
        Activity outlook: {activity.total} / 100{' '}
        <span className="font-normal" style={{ color: 'var(--trout-color-text-muted)' }}>
          (50 = neutral — factors move it, it does not predict a catch)
        </span>
      </p>
      <ol className="mt-2 flex flex-col gap-1.5 text-sm" aria-label="Activity factors">
        {activity.components.map((c) => {
          const pts = c.contribution >= 0 ? `+${c.contribution}` : `${c.contribution}`;
          return (
            <li key={c.factor} className="flex flex-wrap items-baseline gap-x-2">
              <strong>{rowLabel(c)}</strong>
              <span>
                {c.value} / 100 · {pts} pts
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  border: '1px solid var(--ui-border)',
                  color: 'var(--ui-muted)',
                }}
                aria-label={`Confidence: ${CONFIDENCE_LABEL[c.confidence]}`}
              >
                {CONFIDENCE_LABEL[c.confidence]}
              </span>
              <a
                className="text-xs font-bold underline"
                href={c.evidenceUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                source ↗
              </a>
            </li>
          );
        })}
      </ol>
      <p className="muted mt-1 text-xs">
        Each factor's contribution is its weight × (value − 50). Context, not a
        promise.
      </p>
      <FlowTrendContextRow flowTrend={activity.flowTrend} />
    </div>
  );
}

function FlowTrendContextRow({ flowTrend }: { flowTrend?: FlowTrendContext }) {
  return (
    <p className="mt-2 text-sm" role="note">
      {flowTrend ? (
        <>
          <strong>{flowTrend.label}</strong>{' '}
          <span className="muted">Derived gauge context — not part of the activity score.</span>
        </>
      ) : (
        <span style={{ color: 'var(--trout-color-text-muted)' }}>
          No activity data yet — the outlook appears once its factors have sources on this water.
        </span>
      )}
    </p>
  );
}

/**
 * F6 (TASK 2/3): one water's focus-species fishability — the comfort score
 * with its own reasons, honest "No data" when the snapshot carried the
 * species but could not assess. Comfort ONLY this stage: the activity
 * breakdown is Stage 4 (F10) and stays out of the UI.
 * Renders nothing outside all-fish mode, without a focus species, or when
 * the water has no snapshot/score for the focus species.
 */
export function FishabilityCard({ streamId, compact = false }: { streamId: string; compact?: boolean }) {
  const { settings } = useSettingsContext();
  const [params] = useSearchParams();
  const focus = params.get('focus') as SpeciesKey | null;
  const query = useFishabilityForWater(streamId);
  const snap = query.data?.data;

  // Same override rule as the map: the shareable ?species= URL param wins.
  const mode = params.get('species') === 'all' || params.get('species') === 'trout'
    ? params.get('species')
    : settings.speciesMode;
  if (mode !== 'all' || !focus || !snap) return null;
  const scored = snap.bySpecies[focus];
  if (!scored) return null;

  const label = SPECIES_LABELS[focus];
  const band = scoreBand(scored.comfort.value);
  const color = BAND_COLOR[band];
  const bandLabel = band === 'good' ? 'Good' : band === 'fair' ? 'Fair' : 'Poor';

  return (
    <div
      className="detail-section fishability-card"
      data-status={scored.comfort.assessed ? band : 'no-data'}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="eyebrow">Fishability</span>
          <h3 className={compact ? 'text-base font-bold' : 'text-lg font-bold'}>
            {label}
          </h3>
        </div>
        {scored.comfort.assessed ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-extrabold"
            style={{ background: 'var(--trout-slate-100)', color, border: `1px solid ${color}` }}
            aria-label={`${label} fishability ${scored.comfort.value} out of 100 — ${bandLabel}`}
          >
            {scored.comfort.value}
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
              {bandLabel}
            </span>
          </span>
        ) : (
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--trout-color-text-muted)' }}
          >
            No data
          </span>
        )}
      </div>
      {scored.comfort.assessed ? (
        <ul className="mt-2 list-disc pl-5 text-sm">
          {scored.comfort.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          No fresh enough temperature was available to score this species on this water.
        </p>
      )}
      {scored.comfort.freshness && (
        <p className="muted mt-1 text-xs">
          Observed {new Date(scored.comfort.freshness.observedAt).toLocaleString()}
        </p>
      )}
      <ContextNotes pressure={snap.pressureContext} rain={snap.rainContext} />
      <ActivityBreakdown activity={scored.activity} />
    </div>
  );
}
