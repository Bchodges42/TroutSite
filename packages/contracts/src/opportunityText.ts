import type { EvidenceState, OpportunityHeadline } from './schemas/stream.js';

/** Shared public card copy: the owner candidate preview uses the visitor's wording. */
export function opportunityHeadlineLabel(trout: OpportunityHeadline): string {
  const labels: Record<OpportunityHeadline, string> = {
    'year-round-trout': 'Year-round trout opportunity',
    'seasonal-stocked-trout': 'Seasonal stocked trout opportunity',
    'warmwater-focus': 'Warmwater fishing focus',
    mixed: 'Mixed fishery (warmwater + stocked trout)',
    unresolved: 'Trout status unresolved',
  };
  return labels[trout];
}

export function opportunityEvidenceLabel(state: EvidenceState, asOf?: string): string {
  const labels: Record<EvidenceState, string> = {
    documented: 'Documented', limited: 'Limited', historical: 'Historical',
    conflicting: 'Conflicting', unresolved: 'Unresolved',
  };
  return asOf ? `${labels[state]} · ${asOf}` : labels[state];
}
