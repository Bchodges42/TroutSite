import { Link } from 'react-router-dom';
import { Chip, cx } from '@trout/ui';
import type { OpportunityView } from '../features/map/waterDecision';
import { opportunityEvidenceText, opportunityHeadlineText } from '../features/map/waterDecision';

/**
 * EmptyStateNote — the shared "honest state" note (polish wave 2026-09-30).
 *
 * One component, four honest states, one vocabulary: availability wording is
 * the overview/FreshnessChip set ("Live" / "Last known" / "No data" /
 * "Offline · …" — overviewStatus.ts is the authority, no synonyms), an absent
 * assessment is never a negative ("nothing here should be read as 'no
 * fish'"), and every state pairs with the ONE action that helps in it. For the
 * offline-unsaved state that action is reopening the water while connected —
 * stated in place (pack downloads live with trips and saved waters; the
 * settings page only verifies and removes), never a second, less-helpful link.
 */
export type EmptyStateNoteProps =
  | {
      /**
       * Offline (or never fetched) with NO stored copy for this surface — the
       * FreshnessChip "Offline · nothing saved yet" wording, published here so
       * every surface can reuse it verbatim.
       */
      variant: 'offline-unsaved';
      /** What is missing, in plain words ("fishability assessment"). */
      subject?: string;
      className?: string;
    }
  | {
      /**
       * An assessment that cannot be computed right now — the plain-language
       * sentence says what is missing and that the absence is not a negative.
       */
      variant: 'unavailable-assessment';
      className?: string;
    }
  | {
      /**
       * The gauge reports a metric this surface's models do not score —
       * "Not assessed for <metric>", never silence, never a dash implying
       * zero.
       */
      variant: 'unsupported-metric';
      metric: string;
      /** Official reading source for the paired verify action. */
      officialUrl?: string;
      className?: string;
    }
  | {
      /**
       * The catalog's adjudicated "unresolved" fishery claim, rendered with
       * its evidence wording (opportunityEvidenceText) — unresolved stays
       * visible as unresolved, never a hidden negative.
       */
      variant: 'unresolved-claim';
      opportunity: OpportunityView;
      /** Routes the paired "Suggest a correction" action. */
      waterId?: string;
      className?: string;
    };

const MUTED = { color: 'var(--trout-color-text-muted)' } as const;

export function EmptyStateNote(props: EmptyStateNoteProps) {
  const { className } = props;

  if (props.variant === 'offline-unsaved') {
    const subject = props.subject ?? 'assessment';
    return (
      <div
        className={cx('empty-note', className)}
        role="note"
        aria-label="Offline — nothing saved yet"
        data-availability="unavailable"
      >
        <Chip tone="neutral">Offline · nothing saved yet</Chip>
        <p className="mt-2 text-sm">
          No {subject} is stored on this device for this water yet. It appears here once you open
          this water while connected — an absent assessment says nothing about whether the water
          holds fish.
        </p>
      </div>
    );
  }

  if (props.variant === 'unavailable-assessment') {
    return (
      <div
        className={className}
        role="note"
        aria-label="Assessment unavailable"
        data-availability="unavailable"
      >
        <p className="text-sm" style={MUTED}>
          No usable temperature or flow reading for this water right now — nothing here should be
          read as “no fish”.
        </p>
      </div>
    );
  }

  if (props.variant === 'unsupported-metric') {
    return (
      <div
        className={cx('rounded-lg px-3 py-2', className)}
        role="note"
        aria-label={`Not assessed for ${props.metric}`}
        data-availability="unavailable"
        style={{ background: 'var(--trout-slate-100)', border: '1px solid var(--ui-border)' }}
      >
        <p className="text-sm">
          <strong>Not assessed for {props.metric}.</strong> The gauge reports it, but the
          assessment models on this page do not score it — the raw reading is still in the gauge
          readings below.{' '}
          {props.officialUrl ? (
            <a
              className="font-bold underline"
              href={props.officialUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Verify with the official source ↗
            </a>
          ) : (
            <span style={MUTED}>Verify with the official source before relying on it.</span>
          )}
        </p>
      </div>
    );
  }

  // unresolved-claim — the decisionStatusText 'unresolved' vocabulary: the
  // headline and evidence wording come from the waterDecision authorities.
  const { opportunity, waterId } = props;
  const headline = opportunityHeadlineText({ opportunity });
  const evidence = opportunityEvidenceText({ opportunity });
  return (
    <div
      className={cx('empty-note', className)}
      role="note"
      aria-label="Unresolved fishery claim"
      data-claim="unresolved"
    >
      <div className="flex flex-wrap items-center gap-2">
        {evidence && <Chip tone="neutral">{evidence}</Chip>}
        {headline && <strong className="text-sm">{headline}</strong>}
      </div>
      {opportunity.statement && <p className="mt-1 text-sm">{opportunity.statement}</p>}
      {opportunity.unresolvedQuestion && (
        <p className="mt-1 text-sm">{opportunity.unresolvedQuestion}</p>
      )}
      {opportunity.caveats.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-sm" style={MUTED}>
          {opportunity.caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      )}
      {waterId && (
        <p className="mt-2">
          <Link
            className="text-action text-sm"
            to={`/corrections?water=${encodeURIComponent(waterId)}`}
          >
            Suggest a correction
          </Link>
        </p>
      )}
    </div>
  );
}
