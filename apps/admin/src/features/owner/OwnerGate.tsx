// OWNER: DASHBOARD lane (ADR 0017). Owner token entry — the gate in front of
// the read-only dashboard. The token is verified with a real dashboard fetch
// and then held IN MEMORY ONLY (see ownerClient.ts): never localStorage, never
// the shop-token path. A refresh signs the owner out by design.
import { useState, type FormEvent } from 'react';
import { Button, Card, EmptyState } from '@trout/ui';
import {
  OwnerApiError,
  clearOwnerToken,
  fetchOwnerDashboard,
  setOwnerToken,
} from './ownerClient.js';

export function OwnerGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = token.trim();
    if (trimmed.length === 0) return;
    setBusy(true);
    clearOwnerToken();
    setOwnerToken(trimmed);
    try {
      // Verify-before-use: the first dashboard load doubles as the credential
      // check (a 401 clears the in-memory token and lands back here).
      await fetchOwnerDashboard();
      setBusy(false);
      onUnlocked();
    } catch (err) {
      clearOwnerToken();
      setError(
        err instanceof OwnerApiError
          ? err.message
          : 'Sign-in failed — is the dashboard API reachable?',
      );
      setBusy(false);
    }
  }

  return (
    <main className="portal-shell portal-shell--narrow">
      <Card>
        <h1>Owner Dashboard</h1>
        <p className="portal-muted">
          Publication review for the site owner: feed health, pipeline jobs, and the
          editorial queues. Sign in with the owner token — this is a separate credential
          from any shop or moderator token.
        </p>
        <form onSubmit={handleSubmit} className="portal-form">
          <label className="field">
            <span className="field__label">Owner token</span>
            <input
              aria-label="Owner token"
              type="password"
              autoComplete="off"
              placeholder="OWNER_DASHBOARD_TOKEN"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              spellCheck={false}
            />
          </label>
          {error ? (
            <p className="portal-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy || token.trim().length === 0}>
            {busy ? 'Unlocking…' : 'Unlock dashboard'}
          </Button>
        </form>
      </Card>
      <div className="portal-footnote">
        <EmptyState
          icon="🔒"
          title="Held in memory only"
          description="The owner token is never written to this browser's storage — refreshing the page signs you out again. The dashboard is strictly read-only."
        />
      </div>
    </main>
  );
}
