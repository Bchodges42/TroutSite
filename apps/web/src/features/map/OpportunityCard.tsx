import type { Stream } from '@trout/contracts';
import { toWaterDecisionView, opportunityHeadlineText, opportunityEvidenceText } from './waterDecision';
import type { SpeciesMode } from './waterDecision';

/**
 * Fishery-opportunity card (ADR 0010) — the documented angling-opportunity
 * headline with its evidence type and year, reach scope when the claim does
 * not cover the whole feature, material caveats, and links to supporting
 * sources. Renders NOTHING for waters that have not been through evidence
 * adjudication: an unauthored block must never read as any classification,
 * including a negative one.
 *
 * Reads ONLY the durable catalog block — never live conditions — so the same
 * card serves drawer and detail page.
 */
export function OpportunityCard({
  stream,
  species = null,
  mode = 'trout',
  month,
}: {
  stream: Stream;
  species?: Stream['species'] | null;
  mode?: SpeciesMode;
  month?: number;
}) {
  const decision = toWaterDecisionView(
    { stream, status: 'no-data', score: null, snapshot: undefined, species: species ?? undefined },
    mode,
    month,
  );
  const opportunity = decision.opportunity;
  if (!opportunity) return null;
  const headline = opportunityHeadlineText(decision);
  const evidence = opportunityEvidenceText(decision);
  const sources = stream.opportunity?.sources ?? [];
  return (
    <div
      className="opportunity-card"
      data-state={opportunity.evidenceState}
      data-headline={opportunity.trout}
      data-testid="opportunity-card"
    >
      <div className="season-head">
        <span className="eyebrow">Fishery opportunity</span>
        {evidence && <span className="opportunity-evidence">{evidence}</span>}
      </div>
      <strong>{headline}</strong>
      {opportunity.reachScope && <p className="opportunity-reach">Documented for: {opportunity.reachScope}</p>}
      {opportunity.statement && <p>{opportunity.statement}</p>}
      {opportunity.trout === 'unresolved' && opportunity.unresolvedQuestion && (
        <p className="opportunity-unresolved">{opportunity.unresolvedQuestion}</p>
      )}
      {opportunity.caveats.length > 0 && (
        <ul className="opportunity-caveats">
          {opportunity.caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      )}
      {sources.length > 0 && (
        <p className="opportunity-sources">
          {sources.slice(0, 3).map((source, index) => (
            <span key={source.url}>
              {index > 0 && ' · '}
              <a href={source.url} target="_blank" rel="noreferrer noopener">
                {source.label}
              </a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
