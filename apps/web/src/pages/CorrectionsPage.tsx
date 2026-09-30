import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, EmptyState } from '@trout/ui';
import { useStreamsCatalog } from '../lib/useStreamsCatalog';
import { CorrectionForm } from '../features/corrections/CorrectionForm';
import type { PostCorrection } from '../features/corrections/CorrectionForm';
import { CorrectionStatus } from '../features/corrections/CorrectionStatus';
import type { FetchCorrectionStatus } from '../features/corrections/CorrectionStatus';

/**
 * /corrections (ADR 0015): the user-suggested water-correction workflow —
 * compose a suggestion, or check a receipt's review status. Corrections attach
 * to a specific water, so the suggestion tab needs ?water=<catalog id> (the
 * "Suggest a correction" link on a water page provides it); without it the
 * page explains how to find the water first. The coordinator registers the
 * route in App.tsx.
 */
export interface CorrectionsPageProps {
  /** Test seam — omitted in production, where the default transport POSTs /v1/corrections. */
  postCorrection?: PostCorrection;
  /** Test seam — omitted in production, where the default transport GETs /v1/corrections/status/:code. */
  fetchCorrectionStatus?: FetchCorrectionStatus;
}

export function CorrectionsPage({ postCorrection, fetchCorrectionStatus }: CorrectionsPageProps) {
  const [params] = useSearchParams();
  const waterId = (params.get('water') ?? '').trim();
  const fieldParam = (params.get('field') ?? '').trim();
  const [tab, setTab] = useState<'suggest' | 'status'>(
    params.get('tab') === 'status' ? 'status' : 'suggest',
  );

  const streamsQuery = useStreamsCatalog(60);
  const stream = waterId
    ? streamsQuery.data?.data.find((s) => s.id === waterId)
    : undefined;

  const showForm = (() => {
    if (!waterId) return false; // no water chosen yet — explainer below
    if (streamsQuery.isLoading) return false; // catalog still resolving
    return stream !== undefined; // unknown id → honest "not in catalog" state
  })();

  return (
    <main className="page">
      <h1 className="page-title">Suggest a correction</h1>
      <p className="page-subtitle">
        Spotted something wrong on a water page? Tell us what and why — a reviewer checks every
        suggestion against sources before any content changes.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Corrections sections">
        <button
          type="button"
          role="tab"
          id="corrections-tab-suggest"
          aria-selected={tab === 'suggest'}
          aria-controls="corrections-panel-suggest"
          className={'trout-btn ' + (tab === 'suggest' ? 'trout-btn--primary' : 'trout-btn--secondary')}
          onClick={() => setTab('suggest')}
          data-testid="tab-suggest"
        >
          Suggest a correction
        </button>
        <button
          type="button"
          role="tab"
          id="corrections-tab-status"
          aria-selected={tab === 'status'}
          aria-controls="corrections-panel-status"
          className={'trout-btn ' + (tab === 'status' ? 'trout-btn--primary' : 'trout-btn--secondary')}
          onClick={() => setTab('status')}
          data-testid="tab-status"
        >
          Check a receipt
        </button>
      </div>

      <div
        role="tabpanel"
        id="corrections-panel-suggest"
        aria-labelledby="corrections-tab-suggest"
        hidden={tab !== 'suggest'}
      >
        {showForm ? (
          <div className="mt-3">
            <CorrectionForm
              waterId={waterId}
              waterName={stream?.name}
              initialField={fieldParam}
              postCorrection={postCorrection}
            />
          </div>
        ) : waterId && !streamsQuery.isLoading && !stream ? (
          <div className="mt-3">
            <EmptyState
              icon="🔎"
              title="That water is not in the cached catalog"
              description={`No catalog entry matches "${waterId}", so there is nothing to correct here yet. Open the water's page and use its “Suggest a correction” link.`}
              action={
                <Link to="/browse" className="focus-ring font-bold underline">
                  Browse waters
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState
              icon="🎣"
              title="Find the water first"
              description="Corrections attach to one specific water, so this form opens from a water page. Find the water, open it, and choose “Suggest a correction” near the official sources."
              action={
                <Link to="/browse" className="focus-ring font-bold underline">
                  Browse waters
                </Link>
              }
            />
            {waterId && streamsQuery.isLoading && (
              <p className="page-subtitle" role="status">
                Checking the catalog for that water…
              </p>
            )}
          </div>
        )}
      </div>

      <div
        role="tabpanel"
        id="corrections-panel-status"
        aria-labelledby="corrections-tab-status"
        hidden={tab !== 'status'}
      >
        <div className="mt-3">
          <CorrectionStatus fetchCorrectionStatus={fetchCorrectionStatus} />
        </div>
      </div>

      <Card className="mt-6 p-4">
        <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          Privacy, plainly: this page collects only what you type into the form — no location, no
          device data, no logbook data, and nothing stored on your device. Approved corrections are
          published as cited content edits; rejected or duplicate suggestions are never published.
        </p>
      </Card>
    </main>
  );
}
