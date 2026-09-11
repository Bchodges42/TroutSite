// OWNER: ROLE 4. Portal root: token boot → sign-in → signed-in portal.
import { useEffect, useState } from 'react';
import type { Shop } from '@trout/contracts';
import { ApiError, clearToken, fetchMe, storedTokenState } from './api/client.js';
import { LoginView } from './views/LoginView.js';
import { PortalView } from './views/PortalView.js';

type Boot = { state: 'boot' } | { state: 'login' } | { state: 'ready'; shop: Shop; tokenExpiresAtMs: number };

export function App() {
  const [boot, setBoot] = useState<Boot>({ state: 'boot' });

  useEffect(() => {
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
  }, []);

  if (boot.state === 'boot') {
    return <main className="portal-shell portal-muted">Checking your shop token…</main>;
  }

  if (boot.state === 'login') {
    return (
      <LoginView
        onSignedIn={(shop) => {
          const stored = storedTokenState();
          setBoot({ state: 'ready', shop, tokenExpiresAtMs: stored?.expiresAtMs ?? Date.now() });
        }}
      />
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
