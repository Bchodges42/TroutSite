import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WatchButton, WATCH_PRIVACY_LINE } from '../src/features/watches/WatchButton';
import { WatchesSettings } from '../src/features/watches/WatchesSettings';
import {
  addLocalRule,
  readLocalRules,
  storedSubscriptionId,
} from '../src/features/watches/useWatches';

/**
 * WATCHES lane — web surfaces (ADR 0016 §6). Two behaviors are pinned:
 * the happy push path (permission → subscribe → server rule, honest copy)
 * and the honest no-push fallback (device-only rule, "only works while the
 * site is open"). Plus the Settings list/delete surface. Nothing here may
 * claim a notice was scheduled when only a local row exists.
 */

// A VALID 87-char url-safe base64 P-256 key (65 raw bytes → 88 chars with one
// '=' pad). An invalid-length key makes atob throw inside urlBase64ToUint8Array,
// which is exactly the real-browser failure mode for a malformed server key.
const PUBLIC_KEY = 'B' + 'A'.repeat(86);
const SUBSCRIPTION_ID = 'AAAAAAAAAAAAAAAAAAAAAA';

interface Call {
  url: string;
  method: string;
  body?: unknown;
}

let calls: Call[] = [];
let serverRules: unknown[] = [];
let pushConfig: { pushSupported: boolean; publicKey: string | null } = {
  pushSupported: true,
  publicKey: PUBLIC_KEY,
};

function fetchMockImpl(url: string, init?: RequestInit): Response {
  const method = (init?.method ?? 'GET').toUpperCase();
  calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
  if (url === '/v1/watches/config') return json(pushConfig);
  if (url.startsWith('/v1/watches/rules?')) return json({ rules: serverRules });
  if (url === '/v1/watches/subscribe' && method === 'POST') {
    return json({ subscriptionId: SUBSCRIPTION_ID }, 201);
  }
  if (url === '/v1/watches/rules' && method === 'POST') {
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    const rule = {
      id: serverRules.length + 1,
      subscriptionId: body.subscriptionId,
      waterId: body.waterId,
      kind: body.kind,
      metric: body.metric,
      thresholdOp: body.thresholdOp,
      threshold: body.threshold,
      cooldownMinutes: body.cooldownMinutes,
      hysteresis: body.hysteresis,
      createdAt: '2026-09-30T12:00:00.000Z',
    };
    serverRules.push(rule);
    return json({ rule }, 201);
  }
  if (url.startsWith('/v1/watches/rules/') && method === 'DELETE') {
    const id = Number(url.split('?')[0]!.split('/').pop());
    serverRules = serverRules.filter((r) => (r as { id: number }).id !== id);
    return new Response(null, { status: 204 });
  }
  if (url.startsWith('/v1/watches/subscriptions/') && method === 'DELETE') {
    serverRules = [];
    return new Response(null, { status: 204 });
  }
  return new Response('not found', { status: 404 });
}

// ── jsdom push-API shims ──────────────────────────────────────────────────────

type PermissionState = 'granted' | 'denied' | 'default';
let permission: PermissionState = 'granted';
let subscribeShouldFail = false;

function installPushShims(): void {
  class FakePushManager {
    async subscribe(): Promise<unknown> {
      if (subscribeShouldFail) throw new Error('no push for you');
      return {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        getKey: (name: string) =>
          name === 'p256dh'
            ? new Uint8Array([1, 2, 3]).buffer
            : new Uint8Array([4, 5, 6]).buffer,
      };
    }
    async getSubscription(): Promise<null> {
      return null;
    }
  }
  Object.defineProperty(window, 'PushManager', { value: FakePushManager, configurable: true });
  Object.defineProperty(window, 'Notification', {
    value: class FakeNotification {
      static get permission(): PermissionState {
        return permission;
      }
      static requestPermission(): Promise<PermissionState> {
        return Promise.resolve(permission);
      }
    },
    configurable: true,
  });
  const registration = {
    pushManager: new FakePushManager(),
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(registration) },
    configurable: true,
  });
}

beforeEach(() => {
  calls = [];
  serverRules = [];
  permission = 'granted';
  subscribeShouldFail = false;
  pushConfig = { pushSupported: true, publicKey: PUBLIC_KEY };
  localStorage.clear();
  installPushShims();
  vi.stubGlobal('fetch', vi.fn(fetchMockImpl as typeof fetch));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, 'PushManager');
  Reflect.deleteProperty(window, 'Notification');
  // @ts-expect-error test shim teardown
  delete navigator.serviceWorker;
});

// Silence an intentional marker import so the test stays honest about unused copy.

describe('WatchButton — push happy path', () => {
  it('subscribes, creates the default threshold rule, and renders the watching state', async () => {
    const user = userEvent.setup();
    render(<WatchButton waterId="watauga-river" waterName="Watauga River" />);

    // Idle copy states the default behavior honestly.
    await waitFor(() => expect(screen.getByTestId('watch-toggle')).toBeEnabled());
    expect(screen.getByTestId('watch-summary').textContent).toContain('below 21 °C');
    expect(screen.getByText(/no name, no location, no logbook/i).textContent).toBe(
      WATCH_PRIVACY_LINE,
    );

    await user.click(screen.getByTestId('watch-toggle'));

    await waitFor(() => expect(screen.getByTestId('watch-toggle').textContent).toContain('Watching'));
    // The wire: subscribe (keys, endpoint) then the rule with the fixed default.
    const subscribe = calls.find((c) => c.url === '/v1/watches/subscribe');
    expect(subscribe?.body).toMatchObject({
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: { p256dh: 'AQID', auth: 'BAUG' },
    });
    expect(storedSubscriptionId()).toBe(SUBSCRIPTION_ID);
    const create = calls.find((c) => c.url === '/v1/watches/rules' && c.method === 'POST');
    expect(create?.body).toMatchObject({
      subscriptionId: SUBSCRIPTION_ID,
      waterId: 'watauga-river',
      kind: 'condition',
      metric: 'tempC',
      thresholdOp: 'below',
      threshold: 21,
    });
    // aria state reflects watching.
    expect(screen.getByTestId('watch-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles an existing watch OFF with a delete scoped to this subscription', async () => {
    serverRules = [
      {
        id: 7,
        waterId: 'watauga-river',
        kind: 'condition',
        metric: 'tempC',
        thresholdOp: 'below',
        threshold: 21,
        cooldownMinutes: 240,
        hysteresis: 1,
        createdAt: '2026-09-30T12:00:00.000Z',
      },
    ];
    localStorage.setItem('trout.watch.subscriptionId', SUBSCRIPTION_ID);
    const user = userEvent.setup();
    render(<WatchButton waterId="watauga-river" />);

    await waitFor(() => expect(screen.getByTestId('watch-toggle').textContent).toContain('Watching'));
    await user.click(screen.getByTestId('watch-toggle'));
    await waitFor(() => expect(screen.getByTestId('watch-toggle').textContent).not.toContain('Watching'));
    const del = calls.find((c) => c.method === 'DELETE' && c.url.includes('/v1/watches/rules/7'));
    expect(del?.url).toBe(`/v1/watches/rules/7?subscriptionId=${SUBSCRIPTION_ID}`);
  });
});

describe('WatchButton — honest no-push fallback', () => {
  it('saves a device-only rule and SAYS it only works while the site is open', async () => {
    pushConfig = { pushSupported: false, publicKey: null };
    const user = userEvent.setup();
    render(<WatchButton waterId="harpeth-river" />);

    await waitFor(() => expect(screen.getByTestId('watch-toggle')).toBeEnabled());
    await user.click(screen.getByTestId('watch-toggle'));

    await waitFor(() =>
      expect(screen.getByTestId('watch-summary').textContent).toContain(
        'only works while the site is open',
      ),
    );
    expect(readLocalRules()).toHaveLength(1);
    expect(readLocalRules()[0]!.waterId).toBe('harpeth-river');
    // Nothing was sent to the server — no subscribe, no rule create.
    expect(calls.some((c) => c.url === '/v1/watches/subscribe')).toBe(false);
    expect(calls.some((c) => c.url === '/v1/watches/rules')).toBe(false);
  });

  it('says the watch cannot be saved when notification permission is denied', async () => {
    permission = 'denied';
    const user = userEvent.setup();
    render(<WatchButton waterId="harpeth-river" />);

    await waitFor(() => expect(screen.getByTestId('watch-toggle')).toBeEnabled());
    await user.click(screen.getByTestId('watch-toggle'));
    await waitFor(() =>
      expect(screen.getByTestId('watch-summary').textContent).toContain(
        'Notifications are blocked',
      ),
    );
    // A denial saves nothing — not silently downgraded to a local reminder.
    expect(readLocalRules()).toHaveLength(0);
    expect(calls.some((c) => c.url === '/v1/watches/subscribe')).toBe(false);
  });

  it('tells the truth when the transport answers 503 (nothing was saved)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(((url: string, init?: RequestInit) => {
        if (String(url) === '/v1/watches/config') {
          return new Response(JSON.stringify({ pushSupported: true, publicKey: PUBLIC_KEY }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (String(url) === '/v1/watches/subscribe') {
          return new Response(JSON.stringify({ error: 'service unavailable' }), { status: 503 });
        }
        return fetchMockImpl(String(url), init);
      }) as typeof fetch),
    );
    const user = userEvent.setup();
    render(<WatchButton waterId="harpeth-river" />);
    await waitFor(() => expect(screen.getByTestId('watch-toggle')).toBeEnabled());
    await user.click(screen.getByTestId('watch-toggle'));
    await waitFor(() =>
      expect(screen.getByTestId('watch-summary').textContent).toContain('nothing was saved'),
    );
    expect(storedSubscriptionId()).toBeNull();
  });
});

describe('WatchesSettings — list, delete, unsubscribe', () => {
  it('renders the honest empty state first', async () => {
    render(<WatchesSettings />);
    await waitFor(() => expect(screen.getByTestId('watches-empty')).toBeInTheDocument());
    expect(screen.getByText(/no name, no location, no logbook/i)).toBeInTheDocument();
  });

  it('lists server rules with a scoped delete and an unsubscribe-all cascade', async () => {
    serverRules = [
      {
        id: 7,
        waterId: 'watauga-river',
        kind: 'condition',
        metric: 'tempC',
        thresholdOp: 'below',
        threshold: 21,
        cooldownMinutes: 240,
        hysteresis: 1,
        createdAt: '2026-09-30T12:00:00.000Z',
      },
      {
        id: 8,
        waterId: 'harpeth-river',
        kind: 'stocking',
        cooldownMinutes: 240,
        hysteresis: 0,
        createdAt: '2026-09-28T12:00:00.000Z',
      },
    ];
    localStorage.setItem('trout.watch.subscriptionId', SUBSCRIPTION_ID);
    const user = userEvent.setup();
    render(<WatchesSettings />);

    await waitFor(() => expect(screen.getByTestId('watches-server-list')).toBeInTheDocument());
    expect(screen.getByText('watauga-river')).toBeInTheDocument();
    expect(screen.getByText(/drops below 21 °C/i)).toBeInTheDocument();
    expect(screen.getByText(/new stocking events/i)).toBeInTheDocument();

    await user.click(screen.getByTestId('watch-delete-7'));
    await waitFor(() => {
      const del = calls.find((c) => c.method === 'DELETE' && c.url.includes('/v1/watches/rules/7'));
      expect(del?.url).toBe(`/v1/watches/rules/7?subscriptionId=${SUBSCRIPTION_ID}`);
    });

    await user.click(screen.getByTestId('watches-unsubscribe'));
    await waitFor(() => {
      expect(
        calls.some(
          (c) => c.method === 'DELETE' && c.url === `/v1/watches/subscriptions/${SUBSCRIPTION_ID}`,
        ),
      ).toBe(true);
    });
    expect(storedSubscriptionId()).toBeNull();
  });

  it('shows device-only rules under their honest label', async () => {
    addLocalRule('harpeth-river');
    render(<WatchesSettings />);
    await waitFor(() => expect(screen.getByTestId('watches-local-list')).toBeInTheDocument());
    expect(screen.getByText('On this device only')).toBeInTheDocument();
    expect(screen.getByText(/only work while the site is open/i)).toBeInTheDocument();
    expect(screen.getByText('harpeth-river')).toBeInTheDocument();
  });
});
