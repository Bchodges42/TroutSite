// OWNER: DASHBOARD lane (ADR 0017). The read-only owner dashboard: feed health
// cards, pipeline jobs table, queue counts, corrections summary, research
// queue. NO action buttons — v1 deliberately has no operational power at all.
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Chip, EmptyState } from '@trout/ui';
import {
  OwnerApiError,
  clearOwnerToken,
  fetchOwnerCorrections,
  fetchOwnerDashboard,
  fetchOwnerResearchQueue,
  fetchPublicationPreview,
  type PublicationPreview,
  type OwnerCorrectionSummary,
  type OwnerDashboard as Dashboard,
  type OwnerResearchQueue,
} from './ownerClient.js';
import { PublicationPreviewView } from './PublicationPreview.js';

function isoToLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : '—';
}

function feedTone(feed: Dashboard['feeds'][number]): 'good' | 'fair' | 'poor' {
  if (!feed.present) return 'fair'; // never generated — attention, not failure
  return feed.healthy ? 'good' : 'poor';
}

function feedLabel(feed: Dashboard['feeds'][number]): string {
  if (!feed.present) return 'not generated';
  return feed.healthy ? 'healthy' : 'unhealthy';
}

function outcomeTone(outcome: string): 'good' | 'poor' | 'neutral' {
  if (outcome === 'ok') return 'good';
  if (outcome === 'error') return 'poor';
  return 'neutral';
}

export function OwnerDashboardView({ onLock }: { onLock: () => void }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [corrections, setCorrections] = useState<OwnerCorrectionSummary[] | null>(null);
  const [research, setResearch] = useState<OwnerResearchQueue | null>(null);
  const [preview, setPreview] = useState<PublicationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchOwnerDashboard();
      setDashboard(d);
      // Best-effort companions: a failure degrades the section, not the page.
      fetchOwnerCorrections().then((r) => setCorrections(r.corrections)).catch(() => setCorrections(null));
      fetchOwnerResearchQueue().then(setResearch).catch(() => setResearch(null));
      setPreview(null);
      fetchPublicationPreview().then(setPreview).catch((err: unknown) => {
        setPreview(null);
        if (err instanceof OwnerApiError && err.status === 401) onLock();
      });
    } catch (err) {
      if (err instanceof OwnerApiError && err.status === 401) {
        onLock(); // token died mid-session — back to the gate
        return;
      }
      setError(err instanceof OwnerApiError ? err.message : 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, [onLock]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !dashboard) {
    return <main className="portal-shell portal-muted">Loading the owner dashboard…</main>;
  }
  if (error && !dashboard) {
    return (
      <main className="portal-shell">
        <EmptyState
          heading="h1"
          icon="⚠️"
          title="Dashboard unavailable"
          description={error}
          action={
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              Try again
            </Button>
          }
        />
      </main>
    );
  }
  if (!dashboard) return null;

  const conditions = dashboard.feeds.find((f) => f.area === 'conditions');
  const fishability = dashboard.feeds.find((f) => f.area === 'fishability');
  const counts = dashboard.counts;

  return (
    <main className="portal-shell owner-shell">
      <header className="portal-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p className="portal-muted">
            Publication review · generated {isoToLabel(dashboard.generatedAt)}
          </p>
        </div>
        <div className="portal-header__side">
          <Chip tone="neutral">read-only</Chip>
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearOwnerToken();
              onLock();
            }}
          >
            Lock
          </Button>
        </div>
      </header>

      <p className="owner-readonly-note" role="note">
        This surface is strictly <strong>read-only</strong>: it can look, never touch. There are
        no operational actions here — any future action (content edits, job triggers, queue
        decisions) requires its own authorization and audit trail (ADR 0017).
      </p>

      {error ? (
        <p className="portal-error" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-label="Feed health" className="owner-cards">
        {[conditions, fishability].map(
          (feed) =>
            feed && (
              <Card key={feed.area} className="owner-feed-card">
                <h2 className="owner-card-title">{feed.area}</h2>
                <p className="owner-feed-status">
                  <Chip tone={feedTone(feed)}>{feedLabel(feed)}</Chip>
                </p>
                {feed.reason ? <p className="owner-feed-reason">{feed.reason}</p> : null}
                <dl className="owner-kv">
                  <div>
                    <dt>Snapshot mtime</dt>
                    <dd>{isoToLabel(feed.fileMtime)}</dd>
                  </div>
                  <div>
                    <dt>Age (min)</dt>
                    <dd>{feed.ageMinutes ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Records</dt>
                    <dd>
                      {typeof feed.extra.records === 'number' ? feed.extra.records : '—'}
                      {typeof feed.extra.files === 'number' ? feed.extra.files : ''}
                    </dd>
                  </div>
                </dl>
              </Card>
            ),
        )}
      </section>

      <section aria-label="Pipeline jobs">
        <h2 className="owner-section-title">Pipeline jobs</h2>
        <table className="owner-table">
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Last attempt</th>
              <th scope="col">Last success</th>
              <th scope="col">Outcome</th>
              <th scope="col">Runs 24h</th>
              <th scope="col">Next expected</th>
              <th scope="col">Flags</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.jobs.map((job) => (
              <tr key={job.name}>
                <td>
                  {job.name}
                  {job.expected ? '' : ' (unscheduled)'}
                </td>
                <td>{isoToLabel(job.lastAttemptAt)}</td>
                <td>{isoToLabel(job.lastSuccessAt)}</td>
                <td>
                  <Chip tone={outcomeTone(job.lastOutcome)}>{job.lastOutcome}</Chip>
                </td>
                <td>{job.runsLast24h}</td>
                <td>{isoToLabel(job.nextExpectedRun)}</td>
                <td>{job.neverRun ? <Chip tone="poor">never ran</Chip> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {dashboard.omittedJobNames > 0 ? (
          <p className="portal-muted">
            {dashboard.omittedJobNames} jobs_log entr
            {dashboard.omittedJobNames === 1 ? 'y' : 'ies'} omitted (unrecognized job name).
          </p>
        ) : null}
      </section>

      <section aria-label="Build and host status">
        <h2 className="owner-section-title">Build and host status</h2>
        <p className="portal-muted">Snapshot builds are recorded in Pipeline jobs. Host statuses below come from collected status files; a missing record does not prove success. A successful backup does not prove that a restore was tested.</p>
        {dashboard.operations.length === 0 ? <p className="portal-muted">Host status has not been collected.</p> : <ul>
          {dashboard.operations.map((op) => <li key={op.area}>{op.area}: {op.state} · {isoToLabel(op.recordedAt)}{op.revision ? ` · ${op.revision.slice(0, 9)}` : ''}</li>)}
        </ul>}
      </section>

      <PublicationPreviewView preview={preview} />

      <section aria-label="Queue counts" className="owner-cards">
        <Card className="owner-feed-card">
          <h2 className="owner-card-title">Corrections</h2>
          <p className="owner-feed-status">
            <Chip tone={counts.correctionsOpen > 0 ? 'fair' : 'good'}>
              {counts.correctionsOpen} open
            </Chip>
          </p>
          <ul className="owner-chip-list">
            {Object.entries(counts.correctionsByStatus).map(([status, n]) => (
              <li key={status}>
                {status}: {n}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="owner-feed-card">
          <h2 className="owner-card-title">Watch rules</h2>
          <p className="owner-feed-status">
            <Chip tone="neutral">{counts.watchRules === null ? 'table not present' : String(counts.watchRules)}</Chip>
          </p>
        </Card>
        <Card className="owner-feed-card">
          <h2 className="owner-card-title">Push subscriptions</h2>
          <p className="owner-feed-status">
            <Chip tone="neutral">
              {counts.pushSubscriptions === null ? 'table not present' : String(counts.pushSubscriptions)}
            </Chip>
          </p>
        </Card>
        {dashboard.unresolvedEvidence ? (
          <Card className="owner-feed-card">
            <h2 className="owner-card-title">Evidence states</h2>
            <ul className="owner-chip-list">
              {Object.entries(dashboard.unresolvedEvidence.byState).map(([state, n]) => (
                <li key={state}>
                  {state}: {n}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </section>

      <section aria-label="Corrections queue summary">
        <h2 className="owner-section-title">Corrections queue (summary)</h2>
        {corrections === null ? (
          <p className="portal-muted">Corrections summary unavailable right now.</p>
        ) : corrections.length === 0 ? (
          <p className="portal-muted">No corrections recorded.</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Status</th>
                <th scope="col">Category</th>
                <th scope="col">Water</th>
                <th scope="col">Proposed correction</th>
                <th scope="col">Risks</th>
                <th scope="col">Received</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    <Chip tone={c.status === 'received' || c.status === 'needs-more-evidence' ? 'fair' : 'neutral'}>
                      {c.status}
                    </Chip>
                  </td>
                  <td>{c.category}</td>
                  <td>{c.waterName ?? c.waterId}</td>
                  <td className="owner-clamp">{c.proposedCorrection}</td>
                  <td>{c.riskFlags.join(', ') || '—'}</td>
                  <td>{isoToLabel(c.receivedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-label="Research queue">
        <h2 className="owner-section-title">Research queue (editorial)</h2>
        {research === null ? (
          <p className="portal-muted">Research queue unavailable (no content pack wired?).</p>
        ) : research.queue.length === 0 ? (
          <p className="portal-muted">
            Nothing on the research queue — no waters sit in conflicting / unresolved /
            historical evidence states.
          </p>
        ) : (
          <>
            <p className="portal-muted">
              {research.total} water{research.total === 1 ? '' : 's'} need evidence
              {research.truncated ? ` (showing first ${research.queue.length})` : ''}.
            </p>
            <table className="owner-table">
              <thead>
                <tr>
                  <th scope="col">Water</th>
                  <th scope="col">Region</th>
                  <th scope="col">Evidence</th>
                  <th scope="col">Headline</th>
                  <th scope="col">As of</th>
                  <th scope="col">Open question</th>
                  <th scope="col">Claims needing evidence</th>
                </tr>
              </thead>
              <tbody>
                {research.queue.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.regionId}</td>
                    <td>
                      <Chip tone="fair">{item.evidenceState}</Chip>
                    </td>
                    <td>{item.headline ?? '—'}</td>
                    <td>{item.asOf ?? '—'}</td>
                    <td className="owner-clamp">{item.unresolvedQuestion ?? '—'}</td>
                    <td>{item.claimsNeedingEvidence.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </main>
  );
}
