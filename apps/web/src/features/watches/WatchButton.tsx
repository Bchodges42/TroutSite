import { useState } from 'react';
import { Button } from '@trout/ui';
import {
  DEFAULT_WATCH,
  WATCH_PRIVACY_LINE,
  WatchTransportUnavailable,
  addLocalRule,
  createServerRule,
  deleteServerRule,
  pushApiSupported,
  rememberSubscriptionId,
  removeLocalRule,
  storedSubscriptionId,
  subscribeToPush,
  useWatches,
} from './useWatches';

/**
 * The one-tap watch toggle on a water page (ADR 0016 §6). ON = a real server
 * rule (pseudonymous subscription, temp-below-threshold default). When the
 * deployment has no push keys or the browser lacks Web Push, the tap saves an
 * honest LOCAL reminder instead and says exactly what that means.
 *
 * Privacy line, repeated in every state: no location, no logbook data — ever.
 */

export { WATCH_PRIVACY_LINE };

const LOCAL_ONLY_LINE = 'Reminder saved on this device — it only works while the site is open.';

function BellIcon({ filled }: { filled: boolean }) {
  // Filled = watching. Inline SVG keeps the button dependency-free.
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function watchLabel(rules: Array<{ waterId: string }>, waterId: string): boolean {
  return rules.some((r) => r.waterId === waterId);
}

export interface WatchButtonProps {
  waterId: string;
  /** Catalog name for notice-friendly copy (optional). */
  waterName?: string;
  /** Transport overrides are unnecessary — hooks are exercised via fetch mocks. */
  className?: string;
}

type ToggleState = 'idle' | 'busy' | 'error';

export function WatchButton({ waterId, waterName, className }: WatchButtonProps) {
  const { mode, serverRules, localRules, config, refresh } = useWatches();
  const [toggleState, setToggleState] = useState<ToggleState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const watchingServer = mode === 'server' && watchLabel(serverRules ?? [], waterId);
  const watchingLocal = mode === 'local' && watchLabel(localRules, waterId);
  const watching = watchingServer || watchingLocal;

  const summary = watchingServer
    ? `Watching — you'll get a notice when the water temp drops below ${DEFAULT_WATCH.threshold} °C.`
    : watchingLocal
      ? LOCAL_ONLY_LINE
      : `Watch this water — one notice when the water temp drops below ${DEFAULT_WATCH.threshold} °C.`;

  async function toggleOn(): Promise<void> {
    setToggleState('busy');
    setMessage(null);
    try {
      if (config?.pushSupported && pushApiSupported() && config.publicKey) {
        let subscriptionId = storedSubscriptionId();
        if (!subscriptionId) {
          subscriptionId = await subscribeToPush(config.publicKey);
          rememberSubscriptionId(subscriptionId);
        }
        await createServerRule(subscriptionId, waterId);
      } else {
        addLocalRule(waterId);
        setMessage(LOCAL_ONLY_LINE);
      }
      refresh();
    } catch (err) {
      if (err instanceof WatchTransportUnavailable && err.message.includes('blocked')) {
        setMessage('Notifications are blocked in your browser settings, so the watch cannot be saved.');
      } else {
        setMessage('The watch service is not available right now — nothing was saved.');
      }
      setToggleState('error');
      return;
    }
    setToggleState('idle');
  }

  async function toggleOff(): Promise<void> {
    setToggleState('busy');
    setMessage(null);
    try {
      if (watchingServer) {
        const rule = (serverRules ?? []).find((r) => r.waterId === waterId);
        if (rule) await deleteServerRule(rule.id);
      } else {
        removeLocalRule(waterId);
      }
      refresh();
    } catch {
      setMessage('The watch service is not available right now — try again in a moment.');
      setToggleState('error');
      return;
    }
    setToggleState('idle');
  }

  const busy = toggleState === 'busy';

  return (
    <div className={className} data-testid="watch-button">
      <Button
        variant={watching ? 'secondary' : 'primary'}
        aria-pressed={watching}
        aria-label={
          watching
            ? `Stop watching ${waterName ?? waterId}`
            : `Watch ${waterName ?? waterId} for cooler water`
        }
        data-testid="watch-toggle"
        disabled={mode === 'checking' || busy}
        onClick={() => void (watching ? toggleOff() : toggleOn())}
      >
        <span className="inline-flex items-center gap-2">
          <BellIcon filled={watching} />
          {watching ? 'Watching' : mode === 'checking' ? 'Checking…' : 'Watch'}
        </span>
      </Button>
      <p className="mt-2 text-xs" style={{ color: 'var(--trout-color-text-muted)' }} data-testid="watch-summary">
        {message ?? summary}
      </p>
      <p className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
        {WATCH_PRIVACY_LINE}
      </p>
    </div>
  );
}
