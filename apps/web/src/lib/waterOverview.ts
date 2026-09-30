import type { ConditionSnapshot, GaugeReading, Stream } from '@trout/contracts';
import { READING_STALE_MINUTES, readingsAreStale } from '@trout/contracts';
import { opportunityHeadlineText, type WaterDecisionView } from '../features/map/waterDecision';
import { waterIdentity, waterTypeLabel } from './presentation';

/**
 * Water Overview presentation model (ADR 0013): ONE composed view of a water
 * that the map inspector, detail page, saved-water cards, and comparison all
 * consume instead of each recomputing its own summary. This model COMPOSES
 * the existing authorities — it never re-scores conditions, re-classifies a
 * water, or invents facts. The catalog (ADR 0010 opportunity blocks) decides
 * identity/opportunity; `waterDecision.ts` decides classification; contracts
 * decide freshness.
 *
 * Core invariant: every metric carries its OWN observation age. A fresh flow
 * reading never makes an old temperature look fresh.
 */

export type MetricSource = 'measured' | 'derived' | 'heuristic' | 'catalog';

/** 'live' = fresh enough to lead; 'stale' = shown with its age, never hidden; 'unavailable' = no data, never a negative claim. */
export type AvailabilityState = 'live' | 'stale' | 'unavailable';

export interface OverviewMetric {
  key: 'flow' | 'temperature' | 'stage' | 'reservoir';
  label: string;
  value: number;
  unit: string;
  /** This metric's own observation time — independent of every other metric. */
  observedAt: number | null;
  ageMinutes: number | null;
  stale: boolean;
  source: MetricSource;
  gaugeId?: string;
}

export interface OverviewNotice {
  kind: 'restriction' | 'season' | 'source';
  severity: 'info' | 'warning';
  text: string;
}

export interface WaterOverview {
  identity: {
    id: string;
    name: string;
    reach?: string;
    typeLabel: string;
    counties: string[];
    regionId?: string;
  };
  opportunity: {
    headline: string | null;
    species: string[];
    stockingProgram: boolean;
    yearRound?: boolean;
  };
  /** The waterDecision view — null means the water is honestly unassessed. */
  assessment: WaterDecisionView | null;
  metrics: OverviewMetric[];
  availability: {
    conditions: AvailabilityState;
    /** True when a cached copy exists and the surface is being read offline. */
    offlineSaved: boolean;
    nextExpectedUpdate?: string;
  };
  stocking: {
    program: boolean;
    lastEvent?: { date: string; precision?: 'day' | 'week' | 'month'; species?: string };
  };
  hatch: { applicable: boolean };
  /** Dam-release waters with an ingestible schedule provider. */
  releases: { applicable: boolean };
  sources: { count: number };
  notices: OverviewNotice[];
  actions: {
    save: true;
    compare: true;
    prepareTrip: true;
    /** Match-the-hatch is contextual to trout-opportunity waters only. */
    matchHatch: boolean;
    logTrip: true;
  };
}

export interface WaterOverviewInput {
  stream: Stream;
  /** Composed by the caller via toWaterDecisionView (single classification authority). */
  decision?: WaterDecisionView | null;
  /** Latest conditions snapshot — may be an offline-saved copy. */
  conditions?: ConditionSnapshot | null;
  offlineSaved?: boolean;
  /** Deterministic clock (same discipline as contracts pure fns). */
  nowMs: number;
  lastStockingEvent?: { date: string; precision?: 'day' | 'week' | 'month'; species?: string };
  sourcesCount?: number;
}

interface MetricSpec {
  key: OverviewMetric['key'];
  label: string;
  unit: string;
  read: (r: GaugeReading) => number | undefined;
}

const METRIC_SPECS: MetricSpec[] = [
  { key: 'flow', label: 'Flow', unit: 'cfs', read: (r) => r.cfs },
  { key: 'temperature', label: 'Water temperature', unit: '°C', read: (r) => r.tempC },
  { key: 'stage', label: 'Stage', unit: 'ft', read: (r) => r.heightFt },
  { key: 'reservoir', label: 'Reservoir level', unit: 'ft', read: (r) => r.reservoirLevelFt },
];

/**
 * Newest reading carrying each metric, kept per-metric on purpose: gauges
 * report temperature and discharge on independent cadences, so one shared
 * "as of" stamp would lie about half the data.
 */
function extractMetrics(readings: GaugeReading[], nowMs: number): OverviewMetric[] {
  const out: OverviewMetric[] = [];
  for (const spec of METRIC_SPECS) {
    let newest: { value: number; at: number; gaugeId: string } | null = null;
    for (const r of readings) {
      const value = spec.read(r);
      if (typeof value !== 'number' || Number.isNaN(value)) continue;
      const at = Date.parse(r.timestamp);
      if (!Number.isFinite(at)) continue;
      if (!newest || at > newest.at) newest = { value, at, gaugeId: r.gaugeId };
    }
    if (!newest) continue;
    const ageMinutes = Math.max(0, (nowMs - newest.at) / 60_000);
    out.push({
      key: spec.key,
      label: spec.label,
      value: newest.value,
      unit: spec.unit,
      observedAt: newest.at,
      ageMinutes,
      stale: ageMinutes > READING_STALE_MINUTES,
      source: 'measured',
      gaugeId: newest.gaugeId,
    });
  }
  return out.sort((a, b) => (b.observedAt ?? 0) - (a.observedAt ?? 0));
}

/** Any trout-opportunity signal makes hatch guidance relevant. */
function hatchApplicable(stream: Stream): boolean {
  return Boolean(stream.targetSpecies?.length) || stream.stockingProgram || stream.fishery !== undefined;
}

/** Dam-release waters are the ones a published generation schedule can serve. */
function releasesApplicable(stream: Stream): boolean {
  return stream.waterbodyType === 'tailrace' || stream.fishery === 'tailwater';
}

export function buildWaterOverview(input: WaterOverviewInput): WaterOverview {
  const { stream, decision, conditions, nowMs } = input;
  const readings = conditions?.readings ?? [];
  const metrics = extractMetrics(readings, nowMs);

  const conditionsState: AvailabilityState =
    readings.length === 0 ? 'unavailable' : readingsAreStale(readings, nowMs) ? 'stale' : 'live';

  const notices: OverviewNotice[] = [];
  const stalest = metrics.reduce<number | null>(
    (acc, m) => (m.ageMinutes !== null && (acc === null || m.ageMinutes > acc) ? m.ageMinutes : acc),
    null,
  );
  if (conditionsState === 'stale' && stalest !== null) {
    const hours = Math.round(stalest / 60);
    notices.push({
      kind: 'source',
      severity: 'warning',
      text: `Latest reading is about ${hours} hour${hours === 1 ? '' : 's'} old — verify with the source agency before relying on it.`,
    });
  }
  if (conditionsState === 'unavailable') {
    notices.push({
      kind: 'source',
      severity: 'info',
      text: 'No usable gauge data right now — this says nothing about whether the water holds fish.',
    });
  }

  const identity = waterIdentity(stream.name);
  return {
    identity: {
      id: stream.id,
      name: identity.name,
      reach: identity.reach,
      typeLabel: waterTypeLabel(stream.waterbodyType),
      counties: stream.hydroIdentity?.counties ?? [],
      regionId: stream.regionId,
    },
    opportunity: {
      headline: decision ? opportunityHeadlineText(decision) : null,
      species: stream.targetSpecies ?? [],
      stockingProgram: stream.stockingProgram,
      yearRound: stream.yearRound,
    },
    assessment: decision ?? null,
    metrics,
    availability: {
      conditions: conditionsState,
      offlineSaved: input.offlineSaved ?? false,
      nextExpectedUpdate: conditions?.nextExpectedUpdate,
    },
    stocking: {
      program: stream.stockingProgram,
      lastEvent: input.lastStockingEvent,
    },
    hatch: { applicable: hatchApplicable(stream) },
    releases: { applicable: releasesApplicable(stream) },
    sources: { count: input.sourcesCount ?? 0 },
    notices,
    actions: {
      save: true,
      compare: true,
      prepareTrip: true,
      matchHatch: hatchApplicable(stream),
      logTrip: true,
    },
  };
}
