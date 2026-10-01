import { createHash, randomBytes } from 'node:crypto';
import { constantTimeEqual } from '../corrections/receipts.js';
import type { Db } from '../db.js';
import { SUBSCRIPTION_ID_RE, WATCH_LIMITS, canonicalizeRuleInput, type SubscribeInput, type WatchRuleInput } from './schema.js';

/**
 * SQLite service for the watchlist lane (ADR 0016). Pure data access — no
 * Fastify types here — so the cron evaluation job imports this module without
 * dragging the HTTP surface in.
 *
 * Privacy shape (the one deliberate server-side exception to local-first):
 * pseudonymous rows only. The random subscription id IS the credential; the
 * endpoint is stored for delivery plus its SHA-256 for upsert/dedup; nothing
 * here ever sees an IP, a location, or logbook data.
 */

/** Subscriptions unseen for this long are pruned by the cron job (ADR 0016 §7). */
export const SUBSCRIPTION_STALE_DAYS = 180;

export interface SubscriptionRow {
  id: number;
  subscription_id: string;
  endpoint: string;
  endpoint_hash: Buffer;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface WatchRuleRow {
  id: number;
  subscription_id: string;
  water_id: string;
  kind: 'condition' | 'stocking' | 'report';
  metric: 'tempC' | 'cfs' | null;
  threshold_op: 'above' | 'below' | null;
  threshold: number | null;
  arm_state: 'above' | 'below' | null;
  cooldown_minutes: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  hysteresis: number;
  created_at: string;
  last_notified_at: string | null;
  last_feed_key?: string | null;
  quiet_time_zone?: string | null;
}

export class WatchRuleError extends Error {
  readonly code: 'not-found' | 'rule-cap' | 'unknown-water' | 'unknown-subscription';
  constructor(code: typeof WatchRuleError.prototype.code, message: string) {
    super(message);
    this.name = 'WatchRuleError';
    this.code = code;
  }
}

/** 128 bits of CSPRNG, base64url — unguessable, uncorrelatable, 22 chars. */
export function generateSubscriptionId(): string {
  return randomBytes(16).toString('base64url');
}

export function endpointHash(endpoint: string): Buffer {
  return createHash('sha256').update(endpoint, 'utf8').digest();
}

function rowMapper(row: Record<string, unknown>): SubscriptionRow {
  return row as unknown as SubscriptionRow;
}

function ruleMapper(row: Record<string, unknown>): WatchRuleRow {
  return row as unknown as WatchRuleRow;
}

/**
 * Upsert by endpoint hash: the same browser re-subscribing (permission grant,
 * service-worker update, new session) keeps its subscription row, refreshes the
 * keys + last_seen_at, and — the part that matters — KEEPS its rules, so a
 * re-subscribe is never a silent watchlist wipe.
 */
export function upsertSubscription(db: Db, input: SubscribeInput, now: Date = new Date()): SubscriptionRow {
  const hash = endpointHash(input.endpoint);
  const at = now.toISOString();
  const existing = db
    .prepare('SELECT * FROM push_subscriptions WHERE endpoint_hash = ?')
    .get(hash) as Record<string, unknown> | undefined;
  if (existing) {
    // The endpoint alone is not proof of possession. Do not reveal the
    // capability or replace encryption keys without the original auth secret.
    if (!constantTimeEqual(String(existing.auth), input.keys.auth)
      || !constantTimeEqual(String(existing.p256dh), input.keys.p256dh)) {
      throw new SubscriptionConflictError();
    }
    db.prepare(
      `UPDATE push_subscriptions
       SET endpoint = ?, p256dh = ?, auth = ?, user_agent = ?, last_seen_at = ?
       WHERE endpoint_hash = ?`,
    ).run(input.endpoint, input.keys.p256dh, input.keys.auth, input.userAgent ?? null, at, hash);
    return rowMapper(
      db.prepare('SELECT * FROM push_subscriptions WHERE endpoint_hash = ?').get(hash) as Record<string, unknown>,
    );
  }
  const subscriptionId = generateSubscriptionId();
  db.prepare(
    `INSERT INTO push_subscriptions
       (subscription_id, endpoint, endpoint_hash, p256dh, auth, user_agent, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(subscriptionId, input.endpoint, hash, input.keys.p256dh, input.keys.auth, input.userAgent ?? null, at, at);
  return rowMapper(
    db.prepare('SELECT * FROM push_subscriptions WHERE subscription_id = ?').get(subscriptionId) as Record<
      string,
      unknown
    >,
  );
}

export class SubscriptionConflictError extends Error {
  constructor() { super('This subscription cannot be registered with those keys.'); }
}

export function getSubscription(db: Db, subscriptionId: string): SubscriptionRow | undefined {
  if (!SUBSCRIPTION_ID_RE.test(subscriptionId)) return undefined;
  const row = db
    .prepare('SELECT * FROM push_subscriptions WHERE subscription_id = ?')
    .get(subscriptionId) as Record<string, unknown> | undefined;
  return row ? rowMapper(row) : undefined;
}

/** Bump last_seen_at (retention clock) on authenticated-by-id rule activity. */
export function touchSubscription(db: Db, subscriptionId: string, now: Date = new Date()): void {
  db.prepare('UPDATE push_subscriptions SET last_seen_at = ? WHERE subscription_id = ?').run(
    now.toISOString(),
    subscriptionId,
  );
}

/**
 * Unsubscribe + cascade. SQLite FK enforcement is off by default in this
 * process (db.ts sets journal_mode only), so the cascade is explicit: rules
 * first, then the subscription. Same transaction, all or nothing.
 */
export function deleteSubscription(db: Db, subscriptionId: string): boolean {
  return db.transaction(() => {
    const res = db
      .prepare('DELETE FROM push_subscriptions WHERE subscription_id = ?')
      .run(subscriptionId);
    db.prepare('DELETE FROM watch_rules WHERE subscription_id = ?').run(subscriptionId);
    return res.changes > 0;
  })();
}

export function insertWatchRule(
  db: Db,
  input: WatchRuleInput,
  now: Date = new Date(),
): WatchRuleRow {
  const subscription = getSubscription(db, input.subscriptionId);
  if (!subscription) {
    throw new WatchRuleError('unknown-subscription', 'Subscribe before creating watch rules.');
  }
  const count = db
    .prepare('SELECT COUNT(*) AS n FROM watch_rules WHERE subscription_id = ?')
    .get(input.subscriptionId) as { n: number };
  if (count.n >= WATCH_LIMITS.maxRulesPerSubscription) {
    throw new WatchRuleError(
      'rule-cap',
      `A watchlist holds at most ${WATCH_LIMITS.maxRulesPerSubscription} waters — remove one first.`,
    );
  }
  const known = db.prepare('SELECT 1 FROM streams WHERE id = ? AND archived_at IS NULL').get(input.waterId);
  if (!known) {
    throw new WatchRuleError('unknown-water', 'That water id is not in the catalog.');
  }
  const rule = canonicalizeRuleInput(input);
  const res = db
    .prepare(
      `INSERT INTO watch_rules
         (subscription_id, water_id, kind, metric, threshold_op, threshold, arm_state,
          cooldown_minutes, quiet_hours_start, quiet_hours_end, hysteresis, created_at, last_notified_at, quiet_time_zone)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, ?)`,
    )
    .run(
      rule.subscriptionId,
      rule.waterId,
      rule.kind,
      rule.metric ?? null,
      rule.thresholdOp ?? null,
      rule.threshold ?? null,
      rule.cooldownMinutes,
      rule.quietHoursStart ?? null,
      rule.quietHoursEnd ?? null,
      rule.hysteresis,
      now.toISOString(),
      rule.quietHoursTimeZone ?? 'America/Chicago',
    );
  return getWatchRule(db, Number(res.lastInsertRowid))!;
}

export function getWatchRule(db: Db, id: number): WatchRuleRow | undefined {
  const row = db.prepare('SELECT * FROM watch_rules WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? ruleMapper(row) : undefined;
}

/** Only ever called with a subscriptionId — pseudonymous access, no accounts. */
export function listWatchRules(db: Db, subscriptionId: string): WatchRuleRow[] {
  if (!SUBSCRIPTION_ID_RE.test(subscriptionId)) return [];
  return (
    db
      .prepare('SELECT * FROM watch_rules WHERE subscription_id = ? ORDER BY created_at, id')
      .all(subscriptionId) as Record<string, unknown>[]
  ).map(ruleMapper);
}

/** Every rule, joined with its subscription's delivery keys — the cron's read. */
export function listAllRulesWithSubscriptions(db: Db): Array<{ rule: WatchRuleRow; subscription: SubscriptionRow }> {
  const rows = db
    .prepare(
      `SELECT r.*, s.subscription_id AS s_id, s.endpoint, s.endpoint_hash, s.p256dh, s.auth,
              s.user_agent, s.created_at AS s_created, s.last_seen_at
       FROM watch_rules r
       JOIN push_subscriptions s ON s.subscription_id = r.subscription_id
       ORDER BY r.id`,
    )
    .all() as Record<string, unknown>[];
  return rows.map((row) => {
    const { s_id, endpoint, endpoint_hash, p256dh, auth, user_agent, s_created, last_seen_at, ...rule } = row;
    return {
      rule: ruleMapper(rule as Record<string, unknown>),
      subscription: rowMapper({
        id: 0,
        subscription_id: s_id,
        endpoint,
        endpoint_hash,
        p256dh,
        auth,
        user_agent,
        created_at: s_created,
        last_seen_at,
      } as Record<string, unknown>),
    };
  });
}

export function deleteWatchRule(db: Db, id: number, subscriptionId: string): boolean {
  // The rule must belong to the caller's subscription: sequential integer ids
  // are enumerable, so possession of the subscription id is required too.
  const res = db
    .prepare('DELETE FROM watch_rules WHERE id = ? AND subscription_id = ?')
    .run(id, subscriptionId);
  return res.changes > 0;
}

/** Persist the evaluation outcome for one fired rule (ADR 0016 §5). */
export function recordFiredRule(db: Db, ruleId: number, armState: 'above' | 'below', now: Date, feedKey?: string): void {
  db.prepare('UPDATE watch_rules SET arm_state = ?, last_notified_at = ?, last_feed_key = COALESCE(?, last_feed_key) WHERE id = ?').run(
    armState,
    now.toISOString(),
    feedKey ?? null,
    ruleId,
  );
}

/** Persist arm-state movement that did NOT fire (armed on a first decisive reading). */
export function recordArmState(db: Db, ruleId: number, armState: 'above' | 'below'): void {
  db.prepare('UPDATE watch_rules SET arm_state = ? WHERE id = ?').run(armState, ruleId);
}

export function recordFeedState(db: Db, ruleId: number, feedKey: string): void {
  db.prepare('UPDATE watch_rules SET last_feed_key = ? WHERE id = ?').run(feedKey, ruleId);
}

/**
 * Retention (ADR 0016 §7): subscriptions unseen for SUBSCRIPTION_STALE_DAYS are
 * deleted WITH their rules. Called once per cron run — cheap, and an inactive
 * watchlist forgets itself.
 */
export function pruneStaleSubscriptions(db: Db, now: Date = new Date()): number {
  const cutoff = new Date(now.getTime() - SUBSCRIPTION_STALE_DAYS * 86_400_000).toISOString();
  return db.transaction(() => {
    const doomed = db
      .prepare('SELECT subscription_id FROM push_subscriptions WHERE last_seen_at < ?')
      .all(cutoff) as { subscription_id: string }[];
    for (const { subscription_id } of doomed) {
      db.prepare('DELETE FROM watch_rules WHERE subscription_id = ?').run(subscription_id);
      db.prepare('DELETE FROM push_subscriptions WHERE subscription_id = ?').run(subscription_id);
    }
    return doomed.length;
  })();
}
