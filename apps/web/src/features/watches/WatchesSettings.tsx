import { Button, Card, Chip } from '@trout/ui';
import {
  WATCH_PRIVACY_LINE,
  unsubscribeAll,
  deleteServerRule,
  removeLocalRule,
  useWatches,
  type WatchRule,
} from './useWatches';


/**
 * The Settings "Watches" section (ADR 0016 §6): every rule this browser's
 * pseudonymous subscription holds, plus the local-only fallback list, each
 * with a delete. The section states plainly what the server knows and does
 * not — no accounts, no location, no logbook data.
 */

function ruleSummary(rule: WatchRule): string {
  if (rule.kind === 'stocking') return 'New stocking events';
  if (rule.kind === 'report') return 'New shop reports';
  const metric = rule.metric === 'cfs' ? 'flow' : 'water temp';
  const op = rule.thresholdOp === 'above' ? 'rises above' : 'drops below';
  const unit = rule.metric === 'cfs' ? ' cfs' : ' °C';
  return `${metric.charAt(0).toUpperCase()}${metric.slice(1)} ${op} ${rule.threshold}${unit}`;
}

function relativeDay(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const days = Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

export function WatchesSettings() {
  const { mode, serverRules, localRules, refresh } = useWatches();

  async function onUnsubscribeAll(): Promise<void> {
    try {
      await unsubscribeAll();
    } finally {
      // Even on transport failure the local secret is cleared — the honest
      // next render is "no watches", and a dead subscription id must not linger.
      refresh();
    }
  }

  const loading = mode === 'checking';
  const unavailable = serverRules === undefined && !loading;

  return (
    <Card>
      <p className="text-sm">
        A watch pings you when a water&apos;s conditions cross your line — one pseudonymous
        subscription, no account. {WATCH_PRIVACY_LINE}
      </p>

      {loading && (
        <p className="muted mt-3 text-sm" role="status" data-testid="watches-loading">
          Loading watches…
        </p>
      )}

      {unavailable && (
        <p className="muted mt-3 text-sm" role="status" data-testid="watches-unavailable">
          The watch service is not reachable right now. Your rules are safe on the server — try
          again later.
        </p>
      )}

      {!loading && !unavailable && (serverRules ?? []).length === 0 && localRules.length === 0 && (
        <p className="muted mt-3 text-sm" data-testid="watches-empty">
          No watches yet — open any water and tap <strong>Watch</strong>.
        </p>
      )}

      {!loading && (serverRules ?? []).length > 0 && (
        <ul className="mt-3 flex flex-col" aria-label="Server watches" data-testid="watches-server-list">
          {(serverRules ?? []).map((rule) => (
            <li
              key={rule.id}
              className="flex flex-wrap items-center gap-2 border-t py-2 first:border-0 first:pt-0"
              style={{ borderColor: 'var(--trout-color-border)' }}
            >
              <strong className="text-sm">{rule.waterId}</strong>
              <Chip>{ruleSummary(rule)}</Chip>
              <span className="muted text-xs">
                added {relativeDay(rule.createdAt)}
                {rule.lastNotifiedAt ? ` · last notice ${relativeDay(rule.lastNotifiedAt)}` : ''}
              </span>
              <span className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`watch-delete-${rule.id}`}
                  aria-label={`Stop watching ${rule.waterId}`}
                  onClick={() => void deleteServerRule(rule.id).then(refresh).catch(refresh)}
                >
                  Remove
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {!loading && localRules.length > 0 && (
        <>
          <p className="mt-4 text-sm font-bold">On this device only</p>
          <p className="muted text-xs">Reminders only work while the site is open — this browser has no push.</p>
          <ul className="mt-2 flex flex-col" aria-label="Device-only watches" data-testid="watches-local-list">
            {localRules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center gap-2 border-t py-2 first:border-0 first:pt-0"
                style={{ borderColor: 'var(--trout-color-border)' }}
              >
                <strong className="text-sm">{rule.waterId}</strong>
                <span className="muted text-xs">{relativeDay(rule.createdAt)}</span>
                <span className="ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove the device-only watch for ${rule.waterId}`}
                    onClick={() => {
                      removeLocalRule(rule.waterId);
                      refresh();
                    }}
                  >
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {!loading && (serverRules ?? []).length > 0 && (
        <div className="mt-4">
          <Button variant="secondary" data-testid="watches-unsubscribe" onClick={() => void onUnsubscribeAll()}>
            Unsubscribe from all watches
          </Button>
          <p className="muted mt-2 text-xs">
            Unsubscribing deletes the subscription and every rule on the server — nothing to
            request, nothing retained.
          </p>
        </div>
      )}
    </Card>
  );
}
