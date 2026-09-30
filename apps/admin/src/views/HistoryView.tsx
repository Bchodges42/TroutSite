// OWNER: ROLE 4. "My reports": locally-stored drafts scoped to the signed-in shop (F16,
// editable until published) + published reports (read-only, from the public attributed feed
// filtered to this shop). Quarantined legacy drafts get an explicit one-time disclosure/clear
// path — never auto-claimed, never displayed. Honest empty states throughout.
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Chip, ConfirmButton, EmptyState } from '@trout/ui';
import type { Shop, ShopReport } from '@trout/contracts';
import { fetchRecentReports } from '../api/client.js';
import { clearLegacyDrafts, countLegacyDrafts, deleteDraft, listDrafts, type ReportDraft } from '../state/drafts.js';

export function HistoryView({
  shop,
  refreshKey,
  onEditDraft,
}: {
  shop: Shop;
  refreshKey: number;
  onEditDraft: (draft: ReportDraft) => void;
}) {
  const [drafts, setDrafts] = useState<ReportDraft[]>([]);
  const [legacyCount, setLegacyCount] = useState(0);
  const [published, setPublished] = useState<ShopReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reloadDrafts = useCallback(() => {
    // Only this shop's namespace is readable here — another shop's unpublished
    // notes are unreachable by construction (F16).
    setDrafts(listDrafts(shop.id));
    setLegacyCount(countLegacyDrafts());
  }, [shop.id]);

  useEffect(() => {
    reloadDrafts();
  }, [reloadDrafts, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setPublished(null);
    setError(null);
    fetchRecentReports()
      .then((reports) => {
        if (!cancelled) setPublished(reports.filter((r) => r.shopId === shop.id));
      })
      .catch(() => {
        if (!cancelled) setError('Could not load published reports right now.');
      });
    return () => {
      cancelled = true;
    };
  }, [shop.id, refreshKey]);

  return (
    <div className="portal-history">
      <Card>
        <h2>Drafts (stored in this browser)</h2>
        {legacyCount > 0 ? (
          <div className="portal-list__item" role="note">
            <p className="portal-muted">
              This browser holds {legacyCount} unfinished report{legacyCount === 1 ? '' : 's'} from
              an older version of the portal. They were saved without a shop attribution, so they
              are not shown, claimed, or editable by {shop.name} — or any shop. You can clear them
              permanently.
            </p>
            <ConfirmButton
              label="Clear old unattributed drafts"
              confirmLabel="Permanently clear"
              cancelLabel="Keep them"
              onConfirm={() => {
                try {
                  clearLegacyDrafts();
                } catch {
                  // Storage refusal must not break the page; the disclosure simply stays.
                }
                reloadDrafts();
              }}
            />
          </div>
        ) : null}
        {drafts.filter((d) => d.body.trim().length > 0).length === 0 ? (
          <EmptyState
            icon="📝"
            title="No drafts yet"
            description="Start a report in the composer and hit “Save draft” — it will wait here until you publish it."
          />
        ) : (
          <ul className="portal-list">
            {drafts
              .filter((d) => d.body.trim().length > 0)
              .map((d) => (
                <li key={d.id} className="portal-list__item">
                  <div className="portal-list__meta">
                    <strong>{d.streamId ?? 'General report'}</strong>
                    <span>
                      {d.date} · edited {new Date(d.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="portal-list__body">{d.body.slice(0, 140)}{d.body.length > 140 ? '…' : ''}</p>
                  <div className="portal-actions">
                    <Button size="sm" variant="secondary" onClick={() => onEditDraft(d)}>
                      Edit
                    </Button>
                    <ConfirmButton
                      label="Delete"
                      confirmLabel="Delete draft"
                      cancelLabel="Keep"
                      onConfirm={() => {
                        deleteDraft(shop.id, d.id);
                        reloadDrafts();
                      }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2>Published reports</h2>
        <p className="portal-muted">
          Published reports are attributed to {shop.name} ({shop.websiteUrl}) and are public — they
          can no longer be edited here.
        </p>
        {error ? <p className="portal-error" role="alert">{error}</p> : null}
        {published === null ? (
          <p className="portal-muted">Loading…</p>
        ) : published.length === 0 ? (
          <EmptyState
            icon="🐟"
            title="Nothing published yet"
            description="Your shop's first published weekly report will show up here with attribution."
          />
        ) : (
          <ul className="portal-list">
            {published.map((r) => (
              <li key={r.id} className="portal-list__item">
                <div className="portal-list__meta">
                  <strong>{r.streamId ?? 'General report'}</strong>
                  <span>
                    {r.date} · published {new Date(r.publishedAt).toLocaleString()}
                  </span>
                </div>
                <p className="portal-list__body">{r.body}</p>
                {r.hotPatterns.length > 0 ? (
                  <div className="portal-chips">
                    {r.hotPatterns.map((hp, i) => (
                      <Chip key={i} tone="good">
                        {hp.patternId}
                        {hp.hookSize ? ` · #${hp.hookSize}` : ''}
                      </Chip>
                    ))}
                  </div>
                ) : null}
                <a className="portal-muted" href={r.attributionUrl} target="_blank" rel="noreferrer">
                  {r.attributionUrl}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
