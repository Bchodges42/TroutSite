// OWNER: ROLE 4. Portal root: token boot → sign-in → signed-in portal.
// DASHBOARD lane (ADR 0017): adds the Owner area as a SEPARATE boot entry
// reached by deep link (OWNER_MODE_HASH). The owner path never reads or
// reuses the shop-token state below — the two credential spaces are disjoint,
// and the owner token lives in memory only (see features/owner/ownerClient.ts).
import { useCallback, useEffect, useState } from 'react';
import type { Shop } from '@trout/contracts';
import { ApiError, clearToken, fetchMe, storedTokenState } from './api/client.js';
import { LoginView } from './views/LoginView.js';
import { PortalView } from './views/PortalView.js';
import { OwnerArea, OWNER_MODE_HASH } from './features/owner/OwnerArea.js';

type Boot =
  | { state: 'boot' }
  | { state: 'login' }
  | { state: 'ready'; shop: Shop; tokenExpiresAtMs: number }
  | { state: 'owner' };

function isOwnerRoute(): boolean {
  return typeof window !== 'undefined' && window.location.hash === OWNER_MODE_HASH;
}

export function App() {
  const [boot, setBoot] = useState<Boot>({ state: 'boot' });

  // Owner deep link: checked FIRST and never touches the shop-token flow.
  // Functional update bails out when already in owner mode (safe to re-check).
  const recompute = useCallback(() => {
    if (isOwnerRoute()) {
      setBoot((prev) => (prev.state === 'owner' ? prev : { state: 'owner' }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    recompute(); // mount-time deep-link check
    const onHashChange = () => {
      if (!recompute() && boot.state === 'owner') {
        // Left the owner deep link (Back / hash edit): re-run the shop boot.
        setBoot({ state: 'boot' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });

  useEffect(() => {
    if (boot.state !== 'boot' || isOwnerRoute()) return;
    const stored = storedTokenState();
    if (!stored) {
      setBoot({ state: 'login' });
      return;
    }
    fetchMe()
      .then((shop) => setBoot({ state: 'ready', shop, tokenExpiresAtMs: stored.expiresAtMs }))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) clearToken();
        setBoot({ state: 'login' });
      });
  }, [boot.state]);

  if (boot.state === 'boot') {
    return <main className="portal-shell portal-muted">Checking your shop token…</main>;
  }

  if (boot.state === 'owner') {
    return <OwnerArea onExit={() => { window.location.hash = ''; }} />;
  }

  if (boot.state === 'login') {
    return (
      <>
        <LoginView
          onSignedIn={(shop) => {
            const stored = storedTokenState();
            setBoot({ state: 'ready', shop, tokenExpiresAtMs: stored?.expiresAtMs ?? Date.now() });
          }}
        />
        {/* App-owned entry to the owner area (ADR 0017): a plain deep link —
            it shares nothing with the shop sign-in above. */}
        <p className="portal-footnote" style={{ textAlign: 'center' }}>
          <a href={OWNER_MODE_HASH}>Site owner? Open the owner dashboard</a>
        </p>
      </>
    );
  }

  return (
    <PortalView
      shop={boot.shop}
      tokenExpiresAtMs={boot.tokenExpiresAtMs}
      onSignOut={() => {
        clearToken();
        setBoot({ state: 'login' });
      }}
    />
  );
}
