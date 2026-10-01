import { useSearchParams } from 'react-router-dom';
import { scoreBand } from '../lib/conditions';
import { SPECIES_LABELS, useFishabilityForWater } from '../lib/fishability';
import { useSettingsContext } from '../lib/settings';
import { ageMinutes as ageMinutesLabel } from '../lib/time';
import { isHistoricalAssessment } from '../features/map/waterDecision';
import { useOnline } from '../hooks/useOnline';
import { EmptyStateNote } from './EmptyStateNote';
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

/**
 * F48: "2 hours ago" for the pressure observation — keyed off its OWN
 * timestamp (pure: `nowMs` comes from the rendering component, the clock's
 * caller). An absent or unreadable observedAt yields no age claim at all;
 * freshness is never fabricated.
 */
export function pressureAgeText(pressure: PressureContext, nowMs: number): string | null {
  const observedMs = Date.parse(pressure.observedAt);
  if (!Number.isFinite(observedMs)) return null;
  return ageMinutesLabel(observedMs, nowMs);
}

/** Context rows are deliberately separate from the weighted activity factors. */
function ContextNotes({ pressure, rain, nowMs }: { pressure?: PressureContext; rain?: RainContext; nowMs: number }) {
  if (!pressure && !rain) return null;
  const pressureAge = pressure ? pressureAgeText(pressure, nowMs) : null;
  // Per-metric age discipline: the rain reading carries its OWN observed time,
  // independent of the pressure observation and of the comfort score.
  const rainObservedMs = rain ? Date.parse(rain.observedAt) : Number.NaN;
  const rainAge = rain && Number.isFinite(rainObservedMs) ? ageMinutesLabel(rainObservedMs, nowMs) : null;
  return (
    <div className="mt-2 flex flex-col gap-1" role="note" aria-label="Weather context">
      <p className="eyebrow">Weather context</p>
      {rain && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--trout-slate-100)', border: '1px solid var(--ui-border)' }}
        >
          {rain.label} — expect stain and rising water on rain-fed reaches.
          {rainAge ? ` · observed ${rainAge}` : ''}{' '}
          <span className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
            Measured gauge context only, not part of the score.
          </span>
        </p>
      )}
      {pressure && (
        <p className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
          {pressure.label}
          {pressureAge ? ` · observed ${pressureAge}` : ''} ({pressure.station}) — derived area
          context only, not part of the score.
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
function ActivityBreakdown({
  activity,
  nowMs,
}: {
  activity: { total: number; components: ActivityComponent[]; flowTrend?: FlowTrendContext };
  nowMs: number;
}) {
  if (!activity.components.length) {
    return <FlowTrendContextRow flowTrend={activity.flowTrend} nowMs={nowMs} />;
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
      <SourceAttribution components={activity.components} />
      <FlowTrendContextRow flowTrend={activity.flowTrend} nowMs={nowMs} />
    </div>
  );
}

const USGS_GAUGE_RE = /waterdata\.usgs\.gov\/monitoring-location\/([^/?#]+)/;

/**
 * The gauge id is read off the evidence URL the snapshot already carries —
 * the fishability contract has no gauge field, so source attribution is
 * derived ONLY from the sources the snapshot itself cites (never guessed).
 */
function gaugeIdFromUrl(url: string): string | null {
  return USGS_GAUGE_RE.exec(url)?.[1] ?? null;
}

/**
 * Which gauge(s) fed the assessment, with the attribution-culture "verify
 * with USGS" link (same family as ReleasesPanel's "Verify with TVA/USACE ↗").
 * Non-USGS evidence keeps its own source link per factor row above; here it
 * is named by host only.
 */
function SourceAttribution({ components }: { components: ActivityComponent[] }) {
  const urls = [...new Set(components.map((c) => c.evidenceUrl))];
  if (urls.length === 0) return null;
  const gaugeIds = [...new Set(urls.map(gaugeIdFromUrl).filter((g): g is string => g !== null))];
  const usgsUrl = urls.find((u) => gaugeIdFromUrl(u) !== null) ?? urls[0]!;
  const otherHosts = [
    ...new Set(
      urls
        .filter((u) => gaugeIdFromUrl(u) === null)
        .map((u) => {
          try {
            return new URL(u).hostname.replace(/^www\./, '');
          } catch {
            return null;
          }
        })
        .filter((h): h is string => h !== null),
    ),
  ];
  return (
    <p className="muted mt-2 text-xs" role="note" aria-label="Assessment sources">
      {gaugeIds.length > 0
        ? `Scored from USGS gauge${gaugeIds.length > 1 ? 's' : ''} ${gaugeIds.join(' · ')} — `
        : ''}
      <a
        className="font-bold underline"
        href={usgsUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        {gaugeIds.length > 0 ? 'verify with USGS ↗' : 'verify with the source ↗'}
      </a>
      {gaugeIds.length > 0 && otherHosts.length > 0 ? ` · plus ${otherHosts.join(', ')}` : ''}
    </p>
  );
}

function FlowTrendContextRow({ flowTrend, nowMs }: { flowTrend?: FlowTrendContext; nowMs: number }) {
  // Per-metric age discipline: the flow trend carries its OWN observation
  // time — a fresh temperature never refreshes it.
  const observedMs = flowTrend ? Date.parse(flowTrend.observedAt) : Number.NaN;
  const age = flowTrend && Number.isFinite(observedMs) ? ageMinutesLabel(observedMs, nowMs) : null;
  return (
    <p className="mt-2 text-sm" role="note">
      {flowTrend ? (
        <>
          <strong>{flowTrend.label}</strong>{' '}
          <span className="muted">
            Derived gauge context{age ? ` · observed ${age}` : ''} — not part of the activity
            score.
          </span>
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
  const { settings, update: updateSettings } = useSettingsContext();
  const [params, setParams] = useSearchParams();
  const query = useFishabilityForWater(streamId);
  const snap = query.data?.data;
  const online = useOnline();

  // Same override rule as the map: the shareable ?species= URL param wins.
  const mode = params.get('species') === 'all' || params.get('species') === 'trout'
    ? params.get('species')
    : settings.speciesMode;
  // F6 focus wiring hotfix: the focus species comes from the shareable
  // ?focus= param, else the persisted setting, else the first species the
  // snapshot actually carries — the card shows something useful immediately
  // instead of requiring a URL param nothing in the app ever set.
  const urlFocus = params.get('focus') as SpeciesKey | null;
  const snapSpecies = snap ? (Object.keys(snap.bySpecies) as SpeciesKey[]) : [];
  const preferred = urlFocus ?? ((settings.speciesFocus || null) as SpeciesKey | null);
  // A preferred species this water's snapshot doesn't carry falls back to the
  // first carried species — the card renders what the water actually has.
  const focus: SpeciesKey | null =
    (preferred && snapSpecies.includes(preferred) ? preferred : snapSpecies[0]) ?? null;

  const chooseFocus = (species: SpeciesKey) => {
    // Persist site-wide (map colors, lists, conditions/browse follow) and keep
    // the URL shareable: replace any ?focus= override with the new choice.
    updateSettings({ speciesFocus: species });
    if (params.has('focus')) {
      const next = new URLSearchParams(params);
      next.set('focus', species);
      setParams(next, { replace: true });
    }
  };

  if (mode !== 'all') return null;
  // Offline with nothing stored for this water: the honest empty state
  // (polish 5c), never silence and never a negative — the shared note keeps
  // the FreshnessChip "Offline · nothing saved yet" wording. It must not wait
  // on a focus species: with no snapshot there is no species to pick. Online
  // absence (the file is simply not published) stays the decision surfaces'
  // "not scored" verdict, so the card keeps rendering nothing there.
  if (!snap) {
    if (!online && !query.isFetching) {
      return (
        <div className="detail-section fishability-card" data-status="no-data">
          <EmptyStateNote variant="offline-unsaved" subject="fishability assessment" />
        </div>
      );
    }
    return null;
  }
  if (!focus) return null;
  const scored = snap.bySpecies[focus];
  if (!scored) return null;

  const label = SPECIES_LABELS[focus];
  const band = scoreBand(scored.comfort.value);
  const color = BAND_COLOR[band];
  const bandLabel = band === 'good' ? 'Good' : band === 'fair' ? 'Fair' : 'Poor';
  // F04: a cached assessment must not read as current forever. The data
  // boundary (the fishability hooks) stamped the freshness with the
  // observation's CURRENT age; past the shared reading window the score is
  // kept but presented as a clearly labeled historical assessment.
  const historical = isHistoricalAssessment(scored.comfort);
  // The component is the clock's caller for the context rows (F48); the
  // helpers downstream stay pure.
  const nowMs = Date.now();

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
        {snapSpecies.length > 1 && (
          <select
            className="filter-select"
            aria-label="Fishability species"
            value={focus}
            onChange={(e) => chooseFocus(e.target.value as SpeciesKey)}
            data-testid="fishability-species-picker"
          >
            {snapSpecies.map((sp) => (
              <option key={sp} value={sp}>
                {SPECIES_LABELS[sp]}
              </option>
            ))}
          </select>
        )}
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
        {historical && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ border: '1px solid var(--ui-border)', color: 'var(--ui-muted)' }}
            aria-label="Historical assessment"
          >
            Historical
          </span>
        )}
      </div>
      {scored.comfort.assessed ? (
        <>
          {/* Polish 6: the four information types stay visibly separate — the
          comfort section is labeled, the activity outlook carries its own
          header below, and the weather context renders under its own eyebrow
          (seasonal opportunity lives in OpportunityCard, outside this card). */}
          <p className="eyebrow mt-2">Comfort</p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {scored.comfort.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-2">
          <EmptyStateNote variant="unavailable-assessment" />
        </div>
      )}
      {scored.comfort.freshness && (
        <p className="muted mt-1 text-xs">
          {historical
            ? `Historical assessment — observed ${new Date(scored.comfort.freshness.observedAt).toLocaleString()} (not current conditions)`
            : `Observed ${new Date(scored.comfort.freshness.observedAt).toLocaleString()} · ${ageMinutesLabel(Date.parse(scored.comfort.freshness.observedAt), nowMs)}`}
        </p>
      )}
      <ContextNotes pressure={snap.pressureContext} rain={snap.rainContext} nowMs={nowMs} />
      <ActivityBreakdown activity={scored.activity} nowMs={nowMs} />
    </div>
  );
}
