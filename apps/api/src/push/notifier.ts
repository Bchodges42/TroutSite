/**
 * Push delivery seam (ADR 0016 §3). The rest of the system talks to the
 * `Notifier` interface, never to web-push — so tests run the StubNotifier and
 * the runtime swaps in WebPushNotifier only when VAPID keys exist.
 *
 * web-push is an OPTIONAL runtime dep: it is loaded through a dynamic import
 * with a variable specifier (invisible to the type checker, so the tree stays
 * green even before the coordinator installs it). Any load or send failure
 * degrades to the stub + a warn — push problems must never crash the cron.
 */

import { isAllowedPushEndpoint } from './schema.js';
import { createECDH } from 'node:crypto';

export interface PushKeys {
  p256dh: string;
  auth: string;
}

export interface PushTarget {
  subscriptionId: string;
  endpoint: string;
  keys: PushKeys;
}

export type SendStatus = 'sent' | 'gone' | 'failed';

export interface Notifier {
  /** Deliver one payload; 'gone' means the endpoint is dead (404/410). */
  send(target: PushTarget, payload: unknown): Promise<SendStatus>;
  /** True when this notifier can actually deliver (VAPID keys configured). */
  readonly canPush: boolean;
  /** Stub-only: the delivery ring tests assert against (capped, in-memory). */
  recent(): Array<{ target: PushTarget; payload: unknown; at: string }>;
}

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  /** mailto: or https: contact for the push service (web-push requirement). */
  subject: string;
}

/** In-memory ring cap — delivery evidence never outlives a process. */
const RING_CAP = 100;

export class StubNotifier implements Notifier {
  readonly canPush = false;
  private ring: Array<{ target: PushTarget; payload: unknown; at: string }> = [];

  async send(target: PushTarget, payload: unknown): Promise<SendStatus> {
    this.ring.push({ target, payload, at: new Date().toISOString() });
    if (this.ring.length > RING_CAP) this.ring = this.ring.slice(-RING_CAP);
    return 'sent'; // recorded, not delivered — honest only because canPush is false
  }

  recent(): Array<{ target: PushTarget; payload: unknown; at: string }> {
    return [...this.ring];
  }
}

/** Minimal structural type for the dynamically imported web-push module. */
export interface WebPushLike {
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  sendNotification(
    subscription: { endpoint: string; keys: PushKeys },
    payload: string,
    options: { TTL?: number; urgency?: string; timeout?: number },
  ): Promise<unknown>;
}

export class WebPushNotifier implements Notifier {
  readonly canPush = true;
  constructor(
    private readonly webpush: WebPushLike,
    private readonly vapid: VapidConfig,
  ) {
    this.webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  }

  async send(target: PushTarget, payload: unknown): Promise<SendStatus> {
    // Covers legacy DB rows as well as newly validated enrollment requests.
    if (!isAllowedPushEndpoint(target.endpoint)) return 'gone';
    try {
      await this.webpush.sendNotification(
        { endpoint: target.endpoint, keys: target.keys },
        JSON.stringify(payload),
        { TTL: 3600, urgency: 'normal', timeout: 10_000 },
      );
      return 'sent';
    } catch (err) {
      const statusCode =
        typeof err === 'object' && err !== null && 'statusCode' in err
          ? Number((err as { statusCode?: unknown }).statusCode)
          : NaN;
      // 404/410: the browser (or push service) dropped this subscription —
      // the caller prunes it so a dead watchlist does not linger for 180 days.
      if (statusCode === 404 || statusCode === 410) return 'gone';
      return 'failed';
    }
  }

  recent(): Array<{ target: PushTarget; payload: unknown; at: string }> {
    return [];
  }
}

/**
 * Factory: stub unless all three VAPID values exist AND web-push loads. The
 * dynamic import uses a VARIABLE specifier so TypeScript never resolves the
 * module (the dep is optional at runtime and optional at typecheck time).
 */
export async function createNotifier(
  vapid: VapidConfig | null,
  warn: (message: string) => void = () => {},
): Promise<Notifier> {
  if (!vapid) return new StubNotifier();
  try {
    const specifier = 'web-push';
    const imported = await import(specifier);
    const mod = (imported.default ?? imported) as WebPushLike;
    return new WebPushNotifier(mod, vapid);
  } catch {
    warn('web-push unavailable or configuration invalid — delivery disabled.');
    return new StubNotifier();
  }
}

/**
 * VAPID config from the parsed environment (ADR 0016): configured only when
 * BOTH keys exist (a half-configured keypair is worse than none); the subject
 * falls back to a mailto: built from SITE_URL. Single source for app.ts and
 * cron.ts so the two processes can never disagree about whether push is on.
 */
export function vapidConfigFromEnv(env: {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  SITE_URL?: string;
}): VapidConfig | null {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null;
  try {
    const pair = createECDH('prime256v1');
    pair.setPrivateKey(Buffer.from(env.VAPID_PRIVATE_KEY, 'base64url'));
    if (pair.getPublicKey().toString('base64url') !== env.VAPID_PUBLIC_KEY.replace(/=+$/, '')) return null;
  } catch { return null; }
  const siteOrigin = (env.SITE_URL ?? '').trim();
  let host = 'localhost';
  try { host = new URL(siteOrigin).hostname; } catch { /* local fallback */ }
  const subject = env.VAPID_SUBJECT ?? `mailto:watchlists@${host}`;
  try {
    const url = new URL(subject);
    if (url.protocol !== 'https:' && (url.protocol !== 'mailto:' || !/^[^\s@]+@[^\s@]+$/.test(url.pathname))) return null;
    if (url.username || url.password) return null;
  } catch { return null; }
  return {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject,
  };
}
