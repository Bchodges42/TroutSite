import { Card } from '@trout/ui';
import { occurrencesForWater } from '@trout/contracts';
import type { SpeciesOccurrenceCatalog, SpeciesOccurrenceEvidenceType } from '@trout/contracts';

const EVIDENCE_LABEL: Record<SpeciesOccurrenceEvidenceType, string> = {
  'agency-fishery-list': 'Agency fishery list',
  'stocking-record': 'Stocking record',
  'wild-population': 'Wild population record',
  regulation: 'Regulation context',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Source-backed fish inventory for a single water. This intentionally says
 * "recorded" rather than "all species": the static collection is additive and
 * unknown waters remain visibly unknown until a curator adds evidence.
 */
export function WaterSpeciesCard({
  waterId,
  catalog,
  loading = false,
}: {
  waterId: string;
  catalog?: SpeciesOccurrenceCatalog;
  loading?: boolean;
}) {
  const occurrences = occurrencesForWater(catalog, waterId);

  return (
    <section aria-labelledby="recorded-species-heading" className="mt-6">
      <h2 className="section-title" id="recorded-species-heading">
        Recorded fish species
      </h2>
      <Card>
        {loading ? (
          <p className="text-sm" role="status">Loading the static species record…</p>
        ) : occurrences.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
            No species record has been collected for this water yet. That is an evidence gap, not
            proof that the water is fishless.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-2" data-testid="recorded-species-list">
              {occurrences.map((occurrence) => (
                <li key={`${occurrence.waterId}-${occurrence.species.id}-${occurrence.evidenceType}`} className="list-row">
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{occurrence.species.displayName}</span>
                    <span className="mt-1 block text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
                      <em>{occurrence.species.scientificName}</em> · {EVIDENCE_LABEL[occurrence.evidenceType]} · {occurrence.confidence} evidence
                      {occurrence.seasonMonths ? ` · ${formatMonths(occurrence.seasonMonths)}` : ''}
                    </span>
                  </span>
                  <a
                    className="focus-ring shrink-0 text-sm font-bold underline"
                    href={occurrence.source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Source ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className="muted mt-3 text-xs">
              Static source-backed collection, last reviewed {catalog?.updatedAt}. It is not a
              complete biological survey; verify current regulations and stocking information with
              the linked agency source.
            </p>
          </>
        )}
      </Card>
    </section>
  );
}

function formatMonths(months: number[]): string {
  return `seasonal: ${months.map((month) => MONTHS[month - 1]).join(', ')}`;
}
