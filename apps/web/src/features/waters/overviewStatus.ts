import type { FishabilityFocus, WaterDecisionView } from '../map/waterDecision';
import { decisionStatusText } from '../map/waterDecision';

/**
 * Classification context the CALLING surface already holds (the map feature's
 * catalog species + adjudicated status, and the focus-species fishability).
 * `waterOverview.ts` composes the overview from the WaterDecisionView alone,
 * so these fields ride along as props instead of living in the model.
 */
export interface DecisionContext {
  species: 'trout' | 'warmwater' | undefined;
  status: 'good' | 'fair' | 'poor' | 'no-data';
  fishability?: FishabilityFocus;
}

/**
 * The focused-species condition status for the overview header, in the
 * established `decisionStatusText` vocabulary — never a score.
 *
 * When the surface supplies its DecisionContext the single classification
 * authority answers directly. When it does not (overview-only renders, saved
 * cards), the same authority is asked with what the overview honestly knows —
 * no band context — which yields the same precedence and wording without a
 * second, divergent copy of the rules. A null assessment is "Not assessed":
 * an honest absence, never a negative and never a borrowed verdict.
 */
export function overviewConditionStatus(
  assessment: WaterDecisionView | null,
  context?: DecisionContext,
): string {
  if (!assessment) return 'Not assessed';
  if (context) {
    return decisionStatusText(
      assessment,
      { species: context.species, status: context.status },
      context.fishability,
    );
  }
  return decisionStatusText(assessment, { species: undefined, status: 'no-data' });
}

/** Chip tone for a status word — only the scored band words carry a tone. */
export function conditionStatusTone(label: string): 'neutral' | 'good' | 'fair' | 'poor' {
  if (label === 'Good') return 'good';
  if (label === 'Fair') return 'fair';
  if (label === 'Poor') return 'poor';
  return 'neutral';
}

/** Availability wording shared with FreshnessChip's vocabulary. */
export function availabilityLabel(
  conditions: 'live' | 'stale' | 'unavailable',
  offlineSaved: boolean,
): string {
  if (offlineSaved && conditions !== 'unavailable') return 'Offline · last known';
  if (conditions === 'live') return 'Live';
  if (conditions === 'stale') return 'Last known';
  return 'No data';
}

export function availabilityTone(
  conditions: 'live' | 'stale' | 'unavailable',
  offlineSaved: boolean,
): 'neutral' | 'good' | 'fair' {
  if (conditions === 'unavailable') return 'neutral';
  if (conditions === 'live' && !offlineSaved) return 'good';
  return 'fair';
}
