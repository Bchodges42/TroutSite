// OWNER: DASHBOARD lane (ADR 0017). The owner area: gate → read-only dashboard.
// Mounted by App.tsx for OWNER_MODE_HASH; completely disjoint from the
// shop-token boot path (the shop token is never read here, and the owner token
// lives in memory only).
import { useState } from 'react';
import { OwnerGate } from './OwnerGate.js';
import { OwnerDashboardView } from './OwnerDashboard.js';
import { clearOwnerToken, hasOwnerToken } from './ownerClient.js';
import './owner.css';

export { OWNER_MODE_HASH } from './ownerClient.js';

export function OwnerArea({ onExit }: { onExit: () => void }) {
  // Memory-only token: present → straight to the dashboard (a same-page
  // lock/unlock cycle), absent → the gate. A reload clears it either way.
  const [locked, setLocked] = useState(!hasOwnerToken());

  return (
    <div className="owner-area">
      <nav className="owner-exit" aria-label="Owner area navigation">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            clearOwnerToken();
            onExit();
          }}
        >
          ← Back to shop portal
        </a>
      </nav>
      {locked ? (
        <OwnerGate onUnlocked={() => setLocked(false)} />
      ) : (
        // A 401 or the Lock button drops back to the gate (token already cleared).
        <OwnerDashboardView onLock={() => setLocked(true)} />
      )}
    </div>
  );
}
