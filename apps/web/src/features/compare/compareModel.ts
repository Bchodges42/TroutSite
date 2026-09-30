import { decisionStatusText } from '../map/waterDecision';
import type { ConditionStatus } from '../map/riverMapSelectors';
import type { WaterOverview } from '../../lib/waterOverview';
import { TREND_LABEL, type FlowTrend } from '../../lib/conditions';
import { formatFlow, formatTemp } from '../../lib/units';
import { ageMinutes, shortDate } from '../../lib/time';
import type { SettingsRecord } from '../../lib/db';

/**
 * Side-by-side comparison model (feat/site-improvement 2026-09-30, lane COMPARE).
 *
 * PURE: everything here is deterministic given its inputs — the page feeds in
 * the ONE composed WaterOverview per water (buildWaterOverview, ADR 0013) plus
 * the water's own flow trend, and this module only formats and aligns. It never
 * re-scores conditions, re-classifies water, or invents freshness: every metric
 * cell carries the observation age that buildWaterOverview stamped on THAT
 * metric, so a fresh flow reading never makes an old temperature look fresh.
 *
 * HONESTY RULES (owner plan):
 *  - no overall winner, no cross-water ranking — same-shape rows, side by side;
 *  - an unassessed water stays unassessed (never "0", never a band it has no
 *    data for);
 *  - a missing metric reads "No data" — never zero, never a dash that implies
 *    bad;
 *  - raw flow is never ranked across different rivers as quality.
 */

/** The comparison holds up to THREE waters; extra ids are reported, not silently mixed in. */
export const MAX_COMPARE_WATERS = 3;

/** Fixed row order — desktop columns and mobile cards both walk this list so the sections stay mentally alignable. */
export const COMPARE_ROW_KEYS = [
  'identity',
  'opportunity',
  'assessment',
  'temperature',
  'flow',
  'stocking',
  'releases',
  'hatch',
] as const;

export type CompareRowKey = (typeof COMPARE_ROW_KEYS)[number];

export const COMPARE_ROW_LABELS: Record<CompareRowKey, string> = {
  identity: 'Water',
  opportunity: 'Opportunity',
  assessment: 'Assessment',
  temperature: 'Water temperature',
  flow: 'Flow',
  stocking: 'Stocking',
  releases: 'Dam releases',
  hatch: 'Match the hatch',
};

/** live/stale describe observation age; good/fair/poor are real assessment bands; neutral carries no quality claim. */
export type CompareCellTone = 'live' | 'stale' | 'neutral' | 'good' | 'fair' | 'poor';

export interface CompareCell {
  key: CompareRowKey;
  /** Display text. 'No data' only where data is genuinely missing. */
  text: string;
  /** Secondary line (observation age, precision, the assessment's own reason). */
  detail: string | null;
  tone: CompareCellTone;
}

export interface CompareColumnInput {
  overview: WaterOverview;
  /** This water's own gauge trend (lib/conditions flowTrend over ITS readings). */
  flowTrend: FlowTrend;
  /** The map/conditions band for the assessment row ('no-data' when unassessed). */
  status: ConditionStatus;
  /** Catalog fishery class, verbatim ('trout' | 'warmwater' | undefined = unknown). */
  species: 'trout' | 'warmwater' | undefined;
}

export interface CompareColumnCells {
  waterId: string;
  inCatalog: boolean;
  cells: Record<CompareRowKey, CompareCell>;
}

export interface CompareParams {
  waterIds: string[];
  /** Raw ?species= value (a focus species label or mode word) — null when absent. */
  species: string | null;
  /** Ids beyond the three-water cap, so the page can say so honestly. */
  overCap: string[];
}

export const COMPARE_HONESTY_NOTE =
  'Waters are shown side by side, not scored against each other — no overall winner is computed, and each row keeps its own observation age.';

/**
 * Parse ?waters=<id1,id2,id3>&species=<focus>. Order is preserved, duplicates
 * collapse, whitespace trims, and the three-water cap drops the rest into
 * `overCap` (the page reports them instead of quietly widening the board).
 */
export function parseCompareParams(params: URLSearchParams): CompareParams {
  const raw = params.get('waters') ?? '';
  const seen = new Set<string>();
  const waterIds: string[] = [];
  const overCap: string[] = [];
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    if (waterIds.length >= MAX_COMPARE_WATERS) {
      overCap.push(id);
      continue;
    }
    seen.add(id);
    waterIds.push(id);
  }
  const species = params.get('species')?.trim() || null;
  return { waterIds, species, overCap };
}

/**
 * Serialize back to a query string (no leading '?'). Private notes and any
 * other on-device state never enter the URL — only water ids and the shared
 * species context. Commas stay literal so shared links read
 * "?waters=a,b,c" instead of percent-encoded noise.
 */
export function serializeCompareParams(waterIds: string[], species: string | null): string {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of waterIds) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    if (ids.length >= MAX_COMPARE_WATERS) break;
    seen.add(id);
    ids.push(id);
  }
  const sp = species?.trim();
  if (!ids.length && !sp) return '';
  const parts: string[] = [];
  if (ids.length) parts.push(`waters=${ids.map(encodeURIComponent).join(',')}`);
  if (sp) parts.push(`species=${encodeURIComponent(sp)}`);
  return parts.join('&');
}

function noDataCell(key: CompareRowKey): CompareCell {
  return { key, text: 'No data', detail: null, tone: 'neutral' };
}

/** "smallmouth-bass" → "Smallmouth bass" (catalog/targetSpecies keys render human, not raw). */
export function speciesKeyLabel(key: string): string {
  return key
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function stockingEventDetail(
  event: NonNullable<WaterOverview['stocking']['lastEvent']>,
): string {
  const precision = event.precision ?? 'day';
  if (precision === 'week') return `Week of ${shortDate(event.date)} (published schedule)`;
  if (precision === 'month') return `Month of ${shortDate(event.date)} (published schedule)`;
  return `Last event ${shortDate(event.date)}`;
}

/**
 * One water's aligned cells, keyed like every other column so rows line up.
 * `input === null` = the id is not in the catalog (retired or mistyped): every
 * cell stays honestly "No data" — the column still renders, with its remove
 * action, and never borrows another water's numbers.
 */
export function buildCompareColumn(
  waterId: string,
  input: CompareColumnInput | null,
  opts: { tempUnit: SettingsRecord['tempUnit']; nowMs: number },
): CompareColumnCells {
  if (!input) {
    const identity: CompareCell = {
      key: 'identity',
      text: waterId,
      detail: 'Not in the water catalog — it may have been retired.',
      tone: 'neutral',
    };
    return {
      waterId,
      inCatalog: false,
      cells: {
        identity,
        opportunity: noDataCell('opportunity'),
        assessment: noDataCell('assessment'),
        temperature: noDataCell('temperature'),
        flow: noDataCell('flow'),
        stocking: noDataCell('stocking'),
        releases: noDataCell('releases'),
        hatch: noDataCell('hatch'),
      },
    };
  }

  const { overview, flowTrend, status, species } = input;
  const nowMs = opts.nowMs;

  // Row 1 — identity (always present; the catalog is the identity authority).
  const identityDetail = [
    overview.identity.typeLabel,
    overview.identity.counties.length ? overview.identity.counties.join(', ') : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const identity: CompareCell = {
    key: 'identity',
    text: overview.identity.reach
      ? `${overview.identity.name} — ${overview.identity.reach}`
      : overview.identity.name,
    detail: identityDetail || null,
    tone: 'neutral',
  };

  // Row 2 — species & opportunity headline. The adjudicated headline leads;
  // the fishery class is the honest fallback when the block is unauthored.
  const speciesLine = overview.opportunity.species.length
    ? overview.opportunity.species.map(speciesKeyLabel).join(', ')
    : null;
  const opportunityText =
    overview.opportunity.headline ??
    (species === 'trout' ? 'Trout water' : species === 'warmwater' ? 'Warmwater water' : null);
  const opportunity: CompareCell = opportunityText
    ? { key: 'opportunity', text: opportunityText, detail: speciesLine, tone: 'neutral' }
    : noDataCell('opportunity');

  // Row 3 — assessment. An UNASSESSED water stays unassessed: no score, no
  // band, and never a clamped zero dressed up as a finding.
  let assessment: CompareCell;
  if (!overview.assessment) {
    assessment = {
      key: 'assessment',
      text: 'Unassessed',
      detail: 'Not adjudicated yet — shown without a score, never ranked as zero.',
      tone: 'neutral',
    };
  } else {
    const text = decisionStatusText(overview.assessment, { species, status });
    const tone: CompareCellTone =
      status === 'good' || status === 'fair' || status === 'poor' ? status : 'neutral';
    const reason = overview.assessment.reasons[0] ?? null;
    assessment = { key: 'assessment', text, detail: reason, tone };
  }

  // Rows 4–5 — each metric's OWN age, straight from the overview metric.
  const tempMetric = overview.metrics.find((m) => m.key === 'temperature');
  const tempAge = tempMetric?.observedAt != null ? ageMinutes(tempMetric.observedAt, nowMs) : null;
  const temperature: CompareCell = tempMetric
    ? {
        key: 'temperature',
        text: formatTemp(tempMetric.value, opts.tempUnit),
        detail: tempMetric.stale ? `Stale — observed ${tempAge}` : `Observed ${tempAge}`,
        tone: tempMetric.stale ? 'stale' : 'live',
      }
    : noDataCell('temperature');

  const flowMetric = overview.metrics.find((m) => m.key === 'flow');
  const trendSuffix = TREND_LABEL[flowTrend];
  const flowAge = flowMetric?.observedAt != null ? ageMinutes(flowMetric.observedAt, nowMs) : null;
  const flow: CompareCell = flowMetric
    ? {
        key: 'flow',
        text: trendSuffix ? `${formatFlow(flowMetric.value)} ${trendSuffix}` : formatFlow(flowMetric.value),
        detail: flowMetric.stale ? `Stale — observed ${flowAge}` : `Observed ${flowAge}`,
        tone: flowMetric.stale ? 'stale' : 'live',
      }
    : noDataCell('flow');

  // Row 6 — stocking program + last event with its published precision.
  const lastEvent = overview.stocking.lastEvent;
  const stocking: CompareCell = {
    key: 'stocking',
    text: overview.stocking.program ? 'TWRA stocking program' : 'No listed stocking program',
    detail: lastEvent
      ? stockingEventDetail(lastEvent)
      : overview.stocking.program
        ? 'No event in the current schedule feed.'
        : null,
    tone: 'neutral',
  };

  // Rows 7–8 — applicability facts (not quality claims): a non-tailrace water
  // is not "failing" releases, it just isn't dam-controlled.
  const releases: CompareCell = overview.releases.applicable
    ? {
        key: 'releases',
        text: 'Release schedule applies',
        detail: 'Dam-controlled — check the generation schedule before you go.',
        tone: 'neutral',
      }
    : { key: 'releases', text: 'Not a dam-release water', detail: null, tone: 'neutral' };

  const hatch: CompareCell = overview.hatch.applicable
    ? { key: 'hatch', text: 'Applies to this water', detail: null, tone: 'neutral' }
    : { key: 'hatch', text: 'No trout-opportunity signals', detail: null, tone: 'neutral' };

  return {
    waterId,
    inCatalog: true,
    cells: { identity, opportunity, assessment, temperature, flow, stocking, releases, hatch },
  };
}
