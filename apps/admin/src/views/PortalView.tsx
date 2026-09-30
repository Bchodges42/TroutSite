// OWNER: ROLE 4. Signed-in shell: shop identity header + composer/history tabs.
import { useState } from 'react';
import { Button, Chip } from '@trout/ui';
import type { Shop } from '@trout/contracts';
import { catalog } from '../pack.js';
import { ComposerView } from './ComposerView.js';
import { HistoryView } from './HistoryView.js';
import type { ReportDraft } from '../state/drafts.js';

export function PortalView({ shop, tokenExpiresAtMs, onSignOut }: {
  shop: Shop;
  tokenExpiresAtMs: number;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<'compose' | 'history'>('compose');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editDraft, setEditDraft] = useState<ReportDraft | null>(null);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <h1>{shop.name}</h1>
          <p className="portal-muted">
            {shop.town}, {shop.stateId} ·{' '}
            <a href={shop.websiteUrl} target="_blank" rel="noreferrer">
              {shop.websiteUrl}
            </a>
          </p>
        </div>
        <div className="portal-header__side">
          <Chip tone="good">{shop.reportsEnabled ? 'reports on' : 'reports pending'}</Chip>
          <Chip tone="neutral">
            token valid until {new Date(tokenExpiresAtMs).toLocaleDateString()}
          </Chip>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <nav className="portal-tabs" aria-label="Portal sections">
        <Button variant={tab === 'compose' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('compose')}>
          New report
        </Button>
        <Button variant={tab === 'history' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('history')}>
          My reports
        </Button>
      </nav>

      {tab === 'compose' ? (
        <ComposerView
          key={editDraft?.id ?? 'blank'}
          catalog={catalog}
          shopId={shop.id}
          initialDraft={editDraft}
          onSaved={() => setRefreshKey((k) => k + 1)}
          onPublished={() => {
            setEditDraft(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : (
        <HistoryView
          shop={shop}
          refreshKey={refreshKey}
          onEditDraft={(draft) => {
            setEditDraft(draft);
            setTab('compose');
          }}
        />
      )}
    </main>
  );
}
