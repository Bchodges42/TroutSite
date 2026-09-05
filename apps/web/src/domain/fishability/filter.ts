// selectVisibleWaters — pure partitioning of decisions into the general
// list. Every exclusion and de-emphasis is explained; a selected water is
// always inspectable via `selected` even when excluded from the list;
// uncertain waters are de-emphasized, never silently discarded.

import { FISHABILITY_CONFIG } from './config';
import type { FilterExclusion, FilteredWaters, WaterDecision } from './types';

const RULES = FISHABILITY_CONFIG.filter.rules;

function exclusionRule(decision: WaterDecision): string {
  if (decision.troutApplicability === 'not-trout') return RULES.notTrout;
  if (decision.troutApplicability === 'seasonal-likely-absent')
    return RULES.likelyAbsentHighConfidence;
  return RULES.visibilityExclude;
}

/**
 * Partition decisions for the general waters list.
 *
 * - `include` decisions come first (stable input order), then
 *   `deemphasize` ones — uncertain waters stay visible, just ranked after.
 * - `exclude` decisions are returned in `excluded` with the named rule
 *   and the decision's reasons, so the UI can always explain the absence.
 * - The decision matching `options.selectedWaterId` is echoed in
 *   `selected` even when excluded: a selected water remains inspectable
 *   from the inspector even though it is filtered from the general list.
 */
export function selectVisibleWaters(
  decisions: readonly WaterDecision[],
  options: { selectedWaterId?: string } = {},
): FilteredWaters {
  const included: WaterDecision[] = [];
  const deemphasized: WaterDecision[] = [];
  const excluded: FilterExclusion[] = [];
  let selected: WaterDecision | null = null;

  for (const decision of decisions) {
    if (options.selectedWaterId !== undefined && decision.waterId === options.selectedWaterId) {
      selected = decision;
    }
    switch (decision.visibility) {
      case 'include':
        included.push(decision);
        break;
      case 'deemphasize':
        deemphasized.push(decision);
        break;
      case 'exclude':
        excluded.push({
          decision,
          rule: exclusionRule(decision),
          reasons: decision.reasons,
        });
        break;
    }
  }

  // The general list shows de-emphasized waters too — ranked after fully
  // included ones, stable within each group.
  return {
    included: [...included, ...deemphasized],
    deemphasized,
    excluded,
    selected,
  };
}
