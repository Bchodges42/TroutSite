// OWNER: ROLE 4. Token sign-in. The shop pastes the HMAC token minted offline via
// `pnpm --filter @trout/admin mint-token` — there are no accounts, passwords, or cookies.
import { useState, type FormEvent } from 'react';
import { Button, Card, EmptyState } from '@trout/ui';
import { ApiError, fetchMe, saveToken, storedTokenState } from '../api/client.js';
import type { Shop } from '@trout/contracts';

export function LoginView({ onSignedIn }: { onSignedIn: (shop: Shop) => void }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = storedTokenState();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = token.trim();
    if (!trimmed.startsWith('v1.')) {
      setError('That does not look like a shop token — it should start with "v1.".');
      return;
    }
    setBusy(true);
    try {
      const shop = await fetchMe(trimmed);
      saveToken(trimmed); // store only after the portal accepted it
      onSignedIn(shop);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed — is the portal reachable?');
      setBusy(false);
    }
  }

  return (
    <main className="portal-shell portal-shell--narrow">
      <Card>
        <h1>Trout Shop Portal</h1>
        <p className="portal-muted">
          Post attributed weekly fishing reports for your shop. Sign in with the shop token your
          contact at Trout shared — no account needed, nothing tracked.
        </p>
        <form onSubmit={handleSubmit} className="portal-form">
          <label className="field">
            <span className="field__label">Shop token</span>
            <textarea
              aria-label="Shop token"
              rows={3}
              placeholder="v1.<shopId>.<issued>.<expires>.<signature>"
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
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        {existing ? (
          <p className="portal-muted">
            A previously stored token was found but is no longer valid. Sign in again to refresh it.
          </p>
        ) : null}
      </Card>
      <div className="portal-footnote">
        <EmptyState
          icon="🔒"
          title="Privacy note"
          description="This portal stores your token and draft reports in this browser only. No analytics, no cookies, no third-party requests."
        />
      </div>
    </main>
  );
}
