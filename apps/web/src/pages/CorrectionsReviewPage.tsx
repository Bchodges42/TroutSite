import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card } from '@trout/ui';
import {
  REVIEW_ACTIONS,
  REVIEW_RISK_FLAGS,
  REVIEW_STATUSES,
  ModeratorAuthError,
  ModeratorUnavailableError,
  clearModeratorToken,
  fetchCorrectionDetail,
  fetchReviewQueue,
  hasModeratorToken,
  setModeratorToken,
  submitReviewAction,
} from '../features/corrections/review';
import type {
  ModeratorDetail,
  ModeratorReviewItem,
  ReviewAction,
  ReviewQueueFilters,
  ReviewStatus,
} from '../features/corrections/review';

/**
 * /corrections/review (ADR 0015 §10) — the minimal moderator review surface.
 * Not linked from any public navigation: the coordinator mounts this route and
 * access is the CORRECTIONS_MODERATOR_TOKEN, entered per session and kept in
 * module memory only (never localStorage). Accept deliberately does NOT change
 * public content — approved text flows through the reviewed YAML/PR pipeline
 * like every other edit; this queue only tracks the decision.
 */

const CORRECTION_CATEGORY_OPTIONS = [
  'water-identity',
  'species-or-season',
  'stocking-association',
  'gauge-or-source',
  'access',
  'regulations',
  'other',
] as const;

/** Actions that carry a moderator note (mandatory for reject). */
function noteRequiredFor(action: ReviewAction): boolean {
  return action === 'reject';
}

function humanizeAction(action: string): string {
  return action.charAt(0).toUpperCase() + action.slice(1).replace(/-/g, ' ');
}

interface Feedback {
  kind: 'auth' | 'unavailable' | 'request' | 'info';
  message: string;
}

export function CorrectionsReviewPage() {
  const [unlocked, setUnlocked] = useState(hasModeratorToken());
  const [tokenInput, setTokenInput] = useState('');

  const [filters, setFilters] = useState<ReviewQueueFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<ReviewQueueFilters>({});
  const [items, setItems] = useState<ModeratorReviewItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [actingId, setActingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ModeratorDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);

  const load = useCallback(async (active: ReviewQueueFilters) => {
    if (!hasModeratorToken()) {
      setUnlocked(false);
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const queue = await fetchReviewQueue(active);
      setItems(queue);
    } catch (err) {
      if (err instanceof ModeratorAuthError) {
        clearModeratorToken();
        setUnlocked(false);
        setFeedback({ kind: 'auth', message: 'That token was not accepted. Nothing was shown.' });
      } else if (err instanceof ModeratorUnavailableError) {
        setFeedback({ kind: 'unavailable', message: err.message });
      } else {
        setFeedback({
          kind: 'request',
          message: err instanceof Error ? err.message : 'The review service could not be reached.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked) void load(appliedFilters);
  }, [unlocked, appliedFilters, load]);

  function onTokenChange(e: ChangeEvent<HTMLInputElement>) {
    setTokenInput(e.target.value);
  }

  function handleUnlock(e: FormEvent) {
    e.preventDefault();
    setModeratorToken(tokenInput);
    if (!hasModeratorToken()) {
      setFeedback({ kind: 'auth', message: 'Enter the moderator token to open the queue.' });
      return;
    }
    setTokenInput('');
    setItems(null);
    setUnlocked(true);
  }

  function lock() {
    clearModeratorToken();
    setUnlocked(false);
    setItems(null);
    setDetail(null);
    setFeedback(null);
  }

  const setFilter = (key: keyof ReviewQueueFilters) => (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const value = e.target.value.trim();
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  function applyFilters() {
    setAppliedFilters({ ...filters });
  }

  function resetFilters() {
    setFilters({});
    setAppliedFilters({});
  }

  async function act(item: ModeratorReviewItem, action: ReviewAction) {
    const note = notes[item.id] ?? '';
    if (noteRequiredFor(action) && !note.trim()) {
      setFeedback({ kind: 'request', message: 'A rejection requires a reviewer note.' });
      return;
    }
    setActingId(item.id);
    setFeedback(null);
    try {
      const updated = await submitReviewAction(item.id, action, note);
      setItems((prev) => (prev ?? []).map((it) => (it.id === updated.id ? updated : it)));
      setNotes((prev) => ({ ...prev, [item.id]: '' }));
      setDetail(null);
      setFeedback({ kind: 'info', message: `Correction #${item.id} → ${updated.status}.` });
    } catch (err) {
      if (err instanceof ModeratorAuthError) {
        clearModeratorToken();
        setUnlocked(false);
        setFeedback({ kind: 'auth', message: 'That token was not accepted. Nothing was shown.' });
      } else if (err instanceof ModeratorUnavailableError) {
        setFeedback({ kind: 'unavailable', message: err.message });
      } else {
        setFeedback({
          kind: 'request',
          message: err instanceof Error ? err.message : 'The action could not be applied.',
        });
      }
    } finally {
      setActingId(null);
    }
  }

  async function toggleDetail(item: ModeratorReviewItem) {
    if (detail?.correction.id === item.id) {
      setDetail(null);
      return;
    }
    setDetailLoadingId(item.id);
    setFeedback(null);
    try {
      setDetail(await fetchCorrectionDetail(item.id));
    } catch (err) {
      setFeedback({
        kind: 'request',
        message: err instanceof Error ? err.message : 'The detail could not be loaded.',
      });
    } finally {
      setDetailLoadingId(null);
    }
  }

  if (!unlocked) {
    return (
      <main className="page">
        <h1 className="page-title">Corrections review</h1>
        <p className="page-subtitle">
          Moderator access only. The queue of visitor-suggested water corrections lives behind a
          per-session token.
        </p>
        <Card className="p-4" data-testid="review-gate">
          <form onSubmit={handleUnlock} noValidate>
            <label className="text-sm font-bold" htmlFor="review-token">
              Moderator token
            </label>
            <p className="muted mb-2 mt-1 text-xs">
              Kept in this page's memory only — never stored on the device, never sent anywhere but
              the review endpoints. Closing the tab forgets it.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="review-token"
                type="password"
                autoComplete="off"
                value={tokenInput}
                onChange={onTokenChange}
                data-testid="review-token-input"
              />
              <button
                type="submit"
                className="trout-btn trout-btn--primary"
                data-testid="review-unlock"
              >
                Open queue
              </button>
            </div>
          </form>
          {feedback && (
            <p className="mt-3 text-sm font-bold" role="alert" data-testid="review-gate-error">
              {feedback.message}
            </p>
          )}
        </Card>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">Corrections review</h1>
      <p className="page-subtitle">
        Visitor-suggested water corrections, newest first. Accepting never changes the public site
        by itself — approved text still goes through the reviewed content pipeline.
      </p>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-2" data-testid="review-filters">
          <div className="flex flex-col">
            <label className="text-xs font-bold" htmlFor="review-filter-status">
              Status
            </label>
            <select id="review-filter-status" value={filters.status ?? ''} onChange={setFilter('status')}>
              <option value="">Any</option>
              {REVIEW_STATUSES.map((s: ReviewStatus) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold" htmlFor="review-filter-category">
              Category
            </label>
            <select
              id="review-filter-category"
              value={filters.category ?? ''}
              onChange={setFilter('category')}
            >
              <option value="">Any</option>
              {CORRECTION_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold" htmlFor="review-filter-risk">
              Risk flag
            </label>
            <select id="review-filter-risk" value={filters.risk ?? ''} onChange={setFilter('risk')}>
              <option value="">Any</option>
              {REVIEW_RISK_FLAGS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold" htmlFor="review-filter-water">
              Water id
            </label>
            <input
              id="review-filter-water"
              type="text"
              value={filters.waterId ?? ''}
              onChange={setFilter('waterId')}
              placeholder="e.g. watauga-river"
            />
          </div>
          <button type="button" className="trout-btn trout-btn--primary" onClick={applyFilters}>
            Apply
          </button>
          <button type="button" className="trout-btn trout-btn--secondary" onClick={resetFilters}>
            Clear
          </button>
          <button
            type="button"
            className="trout-btn trout-btn--secondary"
            onClick={() => void load(appliedFilters)}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button type="button" className="trout-btn trout-btn--secondary" onClick={lock}>
            Lock
          </button>
        </div>

        {feedback && (
          <p
            className="mt-3 text-sm"
            role={feedback.kind === 'info' ? 'status' : 'alert'}
            data-testid={`review-feedback-${feedback.kind}`}
          >
            {feedback.message}
          </p>
        )}
      </Card>

      {loading && (
        <p className="page-subtitle mt-3" role="status">
          Loading the queue…
        </p>
      )}

      {items !== null && items.length === 0 && !loading && (
        <Card className="mt-3 p-4" data-testid="review-empty">
          <p className="text-sm">No corrections match these filters.</p>
        </Card>
      )}

      <div className="mt-3 flex flex-col gap-3" data-testid="review-queue">
        {(items ?? []).map((item) => (
          <Card key={item.id} className="p-4" data-testid="review-item">
            <p className="text-sm font-bold">
              #{item.id} · {item.status} · {item.category} ·{' '}
              <span className="font-mono text-xs">{item.waterId}</span>
              {item.waterName ? ` — ${item.waterName}` : ''} · receipt …{item.receiptLast4}
              {item.duplicateOf !== undefined ? ` · duplicate of #${item.duplicateOf}` : ''}
              {` · cluster ×${item.clusterSize}`}
            </p>
            {item.riskFlags.length > 0 && (
              <p className="muted mt-1 text-xs">Risk flags: {item.riskFlags.join(', ')}</p>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm">{item.proposedCorrection}</p>
            <dl className="muted mt-2 text-xs">
              {item.field && (
                <div>
                  <dt className="inline font-bold">Claim in question: </dt>
                  <dd className="inline">{item.field}</dd>
                </div>
              )}
              {item.currentValue && (
                <div>
                  <dt className="inline font-bold">Currently shown: </dt>
                  <dd className="inline">{item.currentValue}</dd>
                </div>
              )}
              {item.whatAppearsWrong && (
                <div>
                  <dt className="inline font-bold">What appears wrong: </dt>
                  <dd className="inline">{item.whatAppearsWrong}</dd>
                </div>
              )}
              {item.sourceUrl && (
                <div>
                  <dt className="inline font-bold">Source (inert — open by hand, never fetched by the site): </dt>
                  <dd className="inline font-mono break-all">{item.sourceUrl}</dd>
                </div>
              )}
              {item.sourcePubDate && (
                <div>
                  <dt className="inline font-bold">Source published: </dt>
                  <dd className="inline">{item.sourcePubDate}</dd>
                </div>
              )}
              {item.reviewerNote && (
                <div>
                  <dt className="inline font-bold">Reviewer note: </dt>
                  <dd className="inline">{item.reviewerNote}</dd>
                </div>
              )}
              <div>
                <dt className="inline font-bold">Received: </dt>
                <dd className="inline">{item.receivedAt}</dd>
              </div>
              {item.terminalAt && (
                <div>
                  <dt className="inline font-bold">Closed: </dt>
                  <dd className="inline">{item.terminalAt}</dd>
                </div>
              )}
            </dl>

            <div className="mt-3 flex flex-col gap-1">
              <label className="text-xs font-bold" htmlFor={`review-note-${item.id}`}>
                Reviewer note {`(required for reject)`}
              </label>
              <textarea
                id={`review-note-${item.id}`}
                rows={2}
                value={notes[item.id] ?? ''}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                data-testid={`review-note-${item.id}`}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {REVIEW_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  className={
                    'trout-btn ' +
                    (action === 'accept'
                      ? 'trout-btn--primary'
                      : 'trout-btn--secondary')
                  }
                  disabled={actingId === item.id || loading}
                  onClick={() => void act(item, action)}
                  data-testid={`review-action-${action}-${item.id}`}
                >
                  {humanizeAction(action)}
                </button>
              ))}
              <button
                type="button"
                className="trout-btn trout-btn--secondary"
                disabled={detailLoadingId === item.id}
                onClick={() => void toggleDetail(item)}
                data-testid={`review-detail-toggle-${item.id}`}
              >
                {detailLoadingId === item.id
                  ? 'Loading…'
                  : detail?.correction.id === item.id
                    ? 'Hide trail'
                    : 'Audit trail'}
              </button>
            </div>

            {detail?.correction.id === item.id && (
              <div className="mt-3" data-testid={`review-detail-${item.id}`}>
                <p className="text-sm font-bold">Audit trail</p>
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {detail.audit.map((entry) => (
                    <li key={entry.id}>
                      {entry.at} · {entry.actor} · {humanizeAction(entry.action)}
                      {entry.from_status || entry.to_status
                        ? ` (${entry.from_status ?? '—'} → ${entry.to_status ?? '—'})`
                        : ''}
                      {entry.note ? ` — ${entry.note}` : ''}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm font-bold">Duplicate cluster</p>
                {detail.cluster.parent && (
                  <p className="text-xs">
                    Parent: #{detail.cluster.parent.id} ({detail.cluster.parent.status}) —{' '}
                    {detail.cluster.parent.proposedCorrection.slice(0, 120)}
                  </p>
                )}
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {detail.cluster.children.map((child) => (
                    <li key={child.id}>
                      #{child.id} ({child.status}) received {child.createdAt}
                    </li>
                  ))}
                  {detail.cluster.children.length === 0 && !detail.cluster.parent && (
                    <li>No clustered duplicates.</li>
                  )}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
