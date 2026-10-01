import { useCallback, useEffect, useState } from 'react';

/**
 * Client transport + storage for the watchlist lane (ADR 0016). The browser
 * holds exactly ONE secret — the server-issued pseudonymous subscription id,
 * kept in localStorage — and every server call is keyed by it. No account, no
 * cookies, no location, and logbook data never leaves this device.
 *
 * When the deployment has no VAPID keys (config.pushSupported:false) or the
 * browser lacks Web Push, watches fall back to an honest LOCAL list in
 * localStorage: same shape as the server rules, clearly labeled
 * "reminders only work while the site is open".
 */

export const WATCHES_CONFIG_URL = '/v1/watches/config';
export const WATCHES_SUBSCRIBE_URL = '/v1/watches/subscribe';
export const WATCHES_RULES_URL = '/v1/watches/rules';
export const WATCHES_SUBSCRIPTIONS_URL = '/v1/watches/subscriptions';

const SUBSCRIPTION_ID_KEY = 'trout.watch.subscriptionId';
const LOCAL_RULES_KEY = 'trout.watch.localRules';

export type WatchKind = 'condition' | 'stocking' | 'report';
export type WatchMetric = 'tempC' | 'cfs';

/** Wire shape of a watch rule (mirrors the server's toRuleItem). */
export interface WatchRule {
  id: number;
  waterId: string;
  kind: WatchKind;
  metric?: WatchMetric;
  thresholdOp?: 'above' | 'below';
  threshold?: number;
  cooldownMinutes: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  hysteresis: number;
  createdAt: string;
  lastNotifiedAt?: string;
}

/** The honest local-only fallback rule (same fields, device-held id). */
export interface LocalWatchRule {
  id: string;
  waterId: string;
  kind: WatchKind;
  metric?: WatchMetric;
  thresholdOp?: 'above' | 'below';
  threshold?: number;
  createdAt: string;
}

export interface WatchConfig {
  pushSupported: boolean;
  publicKey: string | null;
}

export class WatchTransportUnavailable extends Error {
  constructor(message = 'The watch service is not available right now.') {
    super(message);
    this.name = 'WatchTransportUnavailable';
  }
}

/** The one honest sentence every watch surface carries (ADR 0016 §6). */
export const WATCH_PRIVACY_LINE =
  'Watches are pseudonymous — no name, no location, no logbook data is ever collected.';

function isUnavailableStatus(status: number): boolean {
  return status === 404 || status === 405 || status === 501 || status === 503;
}

async function requestJson(url: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new WatchTransportUnavailable();
  }
  return res;
}

export async function fetchWatchConfig(): Promise<WatchConfig> {
  const res = await requestJson(WATCHES_CONFIG_URL);
  if (!res.ok) throw new WatchTransportUnavailable();
  const body = (await res.json()) as Partial<WatchConfig>;
  return { pushSupported: body.pushSupported === true, publicKey: body.publicKey ?? null };
}

// ── push subscription ─────────────────────────────────────────────────────────

function base64Url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = '';
  for (const b of view) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** True when THIS browser can hold a real Web Push subscription at all. */
export function pushApiSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Full browser-side subscription: permission (if needed) → pushManager.subscribe
 * under the active service worker → POST /v1/watches/subscribe. Resolves with
 * the pseudonymous subscription id, which the caller persists.
 */
export async function subscribeToPush(publicKey: string): Promise<string> {
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'denied') {
      throw new WatchTransportUnavailable('Notifications are blocked for this site.');
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new WatchTransportUnavailable('Notifications are blocked for this site.');
      }
    }
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const sub =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
    }));
  const p256dh = sub.getKey('p256dh');
  const auth = sub.getKey('auth');
  if (!p256dh || !auth) throw new WatchTransportUnavailable('This browser sent an unusable push key.');
  const res = await requestJson(WATCHES_SUBSCRIBE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh: base64Url(p256dh), auth: base64Url(auth) },
      userAgent: navigator.userAgent.slice(0, 300),
    }),
  });
  if (isUnavailableStatus(res.status)) {
    throw new WatchTransportUnavailable();
  }
  if (!res.ok) throw new WatchTransportUnavailable(`subscribe failed (HTTP ${res.status})`);
  const body = (await res.json()) as { subscriptionId?: string };
  if (typeof body.subscriptionId !== 'string') {
    throw new WatchTransportUnavailable('subscribe returned no id');
  }
  return body.subscriptionId;
}

// ── subscription id storage (the one client-side secret) ─────────────────────

export function storedSubscriptionId(): string | null {
  try {
    return localStorage.getItem(SUBSCRIPTION_ID_KEY);
  } catch {
    return null;
  }
}

function storeSubscriptionId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(SUBSCRIPTION_ID_KEY);
    else localStorage.setItem(SUBSCRIPTION_ID_KEY, id);
  } catch {
    // private-mode localStorage failures degrade to in-session watching only
  }
}

/** Persist the server-issued id after a successful subscribe (the one secret). */
export function rememberSubscriptionId(id: string): void {
  storeSubscriptionId(id);
}

// ── server rules ──────────────────────────────────────────────────────────────

export async function listServerRules(subscriptionId: string): Promise<WatchRule[]> {
  const res = await requestJson(`${WATCHES_RULES_URL}?subscriptionId=${encodeURIComponent(subscriptionId)}`);
  if (!res.ok) throw new WatchTransportUnavailable();
  const body = (await res.json()) as { rules?: WatchRule[] };
  return Array.isArray(body.rules) ? body.rules : [];
}

/**
 * The default rule the Watch button toggles: tell me when the water cools to
 * trout-comfortable (below 21 °C), checked with 1 °C hysteresis, at most one
 * notice per 4 hours. Fixed defaults keep the one-tap flow honest — tuning UI
 * is a later feature, not a hidden behavior.
 */
export const DEFAULT_WATCH = {
  kind: 'condition',
  metric: 'tempC',
  thresholdOp: 'below',
  threshold: 21,
  hysteresis: 1,
  cooldownMinutes: 240,
} as const;

export async function createServerRule(
  subscriptionId: string,
  waterId: string,
  rule: Partial<typeof DEFAULT_WATCH> = {},
): Promise<WatchRule> {
  const res = await requestJson(WATCHES_RULES_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      subscriptionId,
      waterId,
      ...DEFAULT_WATCH,
      ...rule,
    }),
  });
  if (!res.ok) throw new WatchTransportUnavailable(`watch create failed (HTTP ${res.status})`);
  const body = (await res.json()) as { rule?: WatchRule };
  if (!body.rule) throw new WatchTransportUnavailable('watch create returned no rule');
  return body.rule;
}

export async function deleteServerRule(ruleId: number): Promise<void> {
  const subscriptionId = storedSubscriptionId() ?? '';
  const res = await requestJson(
    `${WATCHES_RULES_URL}/${ruleId}?subscriptionId=${encodeURIComponent(subscriptionId)}`,
    { method: 'DELETE' },
  );
  if (!res.ok && res.status !== 404) throw new WatchTransportUnavailable(`delete failed (HTTP ${res.status})`);
}

/** Unsubscribe everything: server cascade + forget the local secret. */
export async function unsubscribeAll(): Promise<void> {
  const subscriptionId = storedSubscriptionId();
  if (subscriptionId) {
    const res = await requestJson(`${WATCHES_SUBSCRIPTIONS_URL}/${subscriptionId}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 404) throw new WatchTransportUnavailable(`unsubscribe failed (HTTP ${res.status})`);
  }
  storeSubscriptionId(null);
}

// ── local-only rules (no-push fallback) ───────────────────────────────────────

export function readLocalRules(): LocalWatchRule[] {
  try {
    const raw = localStorage.getItem(LOCAL_RULES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as LocalWatchRule[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRules(rules: LocalWatchRule[]): void {
  try {
    localStorage.setItem(LOCAL_RULES_KEY, JSON.stringify(rules));
  } catch {
    // same private-mode story as the subscription id
  }
}

function randomLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `local-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function addLocalRule(waterId: string, kind: WatchKind = 'condition'): LocalWatchRule {
  const rules = readLocalRules().filter((r) => r.waterId !== waterId);
  const rule: LocalWatchRule = {
    id: randomLocalId(),
    waterId,
    kind,
    ...(kind === 'condition' ? { metric: DEFAULT_WATCH.metric, thresholdOp: DEFAULT_WATCH.thresholdOp, threshold: DEFAULT_WATCH.threshold } : {}),
    createdAt: new Date().toISOString(),
  };
  rules.push(rule);
  writeLocalRules(rules);
  return rule;
}

export function removeLocalRule(waterId: string): void {
  writeLocalRules(readLocalRules().filter((r) => r.waterId !== waterId));
}

// ── the hook the components consume ───────────────────────────────────────────

export type WatchMode = 'checking' | 'server' | 'local' | 'off';

export interface WatchesState {
  mode: WatchMode;
  /** Server rules for this subscription (empty when mode !== 'server'). */
  serverRules: WatchRule[] | undefined;
  localRules: LocalWatchRule[];
  config: WatchConfig | undefined;
  refresh: () => void;
}

/**
 * One loader for both surfaces (WatchButton + WatchesSettings): resolves the
 * config, the stored subscription id, and that subscription's rules. `refresh`
 * re-runs the load after a toggle.
 */
export function useWatches(): WatchesState {
  const [nonce, setNonce] = useState(0);
  const [config, setConfig] = useState<WatchConfig | undefined>(undefined);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(() => storedSubscriptionId());
  const [serverRules, setServerRules] = useState<WatchRule[] | undefined>(undefined);
  const [localRules, setLocalRules] = useState<LocalWatchRule[]>(() => readLocalRules());

  useEffect(() => {
    let alive = true;
    void (async () => {
      const nextConfig = await fetchWatchConfig().catch(() => undefined);
      if (!alive) return;
      setConfig(nextConfig);
      const id = storedSubscriptionId();
      setSubscriptionId(id);
      if (id) {
        const rules = await listServerRules(id).catch(() => undefined);
        if (!alive) return;
        setServerRules(rules);
      } else {
        setServerRules([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [nonce]);

  const refresh = useCallback(() => {
    setLocalRules(readLocalRules());
    setSubscriptionId(storedSubscriptionId());
    setNonce((n) => n + 1);
  }, []);

  const mode: WatchMode =
    config === undefined
      ? 'checking'
      : subscriptionId && serverRules !== undefined
        ? 'server'
        : config.pushSupported && pushApiSupported()
          ? 'off'
          : 'local';

  return { mode, serverRules, localRules, config, refresh };
}
