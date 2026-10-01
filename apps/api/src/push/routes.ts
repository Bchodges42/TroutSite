import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from '../db.js';
import { SlidingWindowRateLimiter, requestOriginAllowed } from '../corrections/routes.js';
import {
  SubscribeSchema,
  WATCH_BODY_LIMIT_BYTES,
  WatchRuleSchema,
  watchFieldErrorsFromZod,
} from './schema.js';
import {
  WatchRuleError,
  SubscriptionConflictError,
  deleteSubscription,
  deleteWatchRule,
  getSubscription,
  getWatchRule,
  insertWatchRule,
  listWatchRules,
  touchSubscription,
  upsertSubscription,
  type WatchRuleRow,
} from './service.js';
import type { VapidConfig } from './notifier.js';

/**
 * Watchlist routes (ADR 0016 §4) — the ONE server-side subscription surface in
 * a local-first product. Pseudonymous only: the subscription id IS the
 * credential; there are no accounts, no cookies, no IP storage.
 *
 *   GET    /v1/watches/config              → { pushSupported, publicKey } (honest, always 200)
 *   POST   /v1/watches/subscribe           → 201 { subscriptionId } (upsert by endpoint hash)
 *   POST   /v1/watches/rules               → 201 { rule }
 *   GET    /v1/watches/rules?subscriptionId= → 200 { rules } (that subscription's rules only)
 *   DELETE /v1/watches/rules/:id?subscriptionId= → 204 (id is enumerable; possession of the
 *            subscription id is required with it)
 *   DELETE /v1/watches/subscriptions/:id   → 204 (unsubscribe + cascade)
 *
 * Fail-closed posture: with VAPID unconfigured, subscribe answers 503 — the
 * server refuses to collect push endpoint tokens it could never honor. Rule
 * CRUD/subscriptions cleanup still answer (they only serve already-registered
 * ids and store no push material), and config stays honest (pushSupported:
 * false) so the web renders its local-only fallback.
 *
 * Hardening mirrors corrections (ADR 0015 §5): strict same-origin, JSON-only
 * content type, route-level body caps, per-IP sliding windows in front of body
 * parsing, zod re-validation, no-store. Request metadata (IP) lives only in
 * the in-memory rate limiter and is bounded by its own eviction — never
 * persisted, never logged.
 */

export interface WatchDeps {
  db: Db;
  /** VAPID keys; when absent the push parts fail closed (subscribe → 503). */
  vapid?: VapidConfig | null;
  /** Deployed origins allowed to drive the routes (Origin/Referer checks). */
  siteOrigins?: string[];
  /** Test seams. */
  limits?: Partial<WatchRateLimits>;
  now?: () => number;
}

export interface WatchRateLimits {
  subscribePerHour: number;
  subscribePerDay: number;
  ruleWritesPerHour: number;
  ruleReadsPerHour: number;
}

const DEFAULT_LIMITS: WatchRateLimits = {
  subscribePerHour: 10,
  subscribePerDay: 30,
  ruleWritesPerHour: 60,
  ruleReadsPerHour: 120,
};

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** `content-type` must be the JSON media type (copy of the corrections check —
 *  the original is module-private there; duplication noted, one guard each). */
function isJsonContentType(headers: FastifyRequest['headers']): boolean {
  const raw = headers['content-type'];
  if (typeof raw !== 'string' || raw.trim() === '') return false;
  const media = (raw.split(';')[0] ?? '').trim().toLowerCase();
  return media === 'application/json';
}

function deny(
  reply: FastifyReply,
  code: number,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): FastifyReply {
  reply.header('cache-control', 'no-store');
  for (const [k, v] of Object.entries(extraHeaders ?? {})) reply.header(k, v);
  return reply.code(code).send(body);
}

/** Wire shape of a stored rule (camelCase; nothing but the rule itself). */
function toRuleItem(row: WatchRuleRow): Record<string, unknown> {
  const item: Record<string, unknown> = {
    id: row.id,
    subscriptionId: row.subscription_id,
    waterId: row.water_id,
    kind: row.kind,
    cooldownMinutes: row.cooldown_minutes,
    hysteresis: row.hysteresis,
    createdAt: row.created_at,
  };
  if (row.metric !== null) item.metric = row.metric;
  if (row.threshold_op !== null) item.thresholdOp = row.threshold_op;
  if (row.threshold !== null) item.threshold = row.threshold;
  if (row.quiet_hours_start !== null) item.quietHoursStart = row.quiet_hours_start;
  if (row.quiet_hours_end !== null) item.quietHoursEnd = row.quiet_hours_end;
  if (row.quiet_time_zone) item.quietHoursTimeZone = row.quiet_time_zone;
  if (row.last_notified_at !== null) item.lastNotifiedAt = row.last_notified_at;
  return item;
}

export function registerWatchRoutes(app: FastifyInstance, deps: WatchDeps): void {
  const limits = { ...DEFAULT_LIMITS, ...deps.limits };
  const now = deps.now ?? (() => Date.now());
  const siteOrigins = (deps.siteOrigins ?? []).map((o) => o.trim()).filter(Boolean);

  const requireSameOrigin = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!requestOriginAllowed(req.headers, siteOrigins)) {
      await deny(reply, 403, { error: 'cross-origin watch requests are not accepted' });
    }
  };

  const requireJson = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!isJsonContentType(req.headers)) {
      await deny(reply, 415, { error: 'content-type must be application/json' });
    }
  };

  const subscribeLimiter = new SlidingWindowRateLimiter(
    [
      { max: limits.subscribePerHour, windowMs: HOUR_MS },
      { max: limits.subscribePerDay, windowMs: DAY_MS },
    ],
    now,
  );
  const writeLimiter = new SlidingWindowRateLimiter(
    [{ max: limits.ruleWritesPerHour, windowMs: HOUR_MS }],
    now,
  );
  const readLimiter = new SlidingWindowRateLimiter(
    [{ max: limits.ruleReadsPerHour, windowMs: HOUR_MS }],
    now,
  );

  const rateLimit =
    (limiter: SlidingWindowRateLimiter) =>
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const decision = limiter.check(req.ip);
      if (!decision.allowed) {
        await deny(
          reply,
          429,
          { error: 'too many requests — try again later' },
          { 'retry-after': String(decision.retryAfterSeconds) },
        );
      }
    };

  const failClosedVapid = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!deps.vapid) {
      await deny(reply, 503, { error: 'service unavailable' });
    }
  };

  // ------------------------------------------------------------------
  // GET /v1/watches/config — honest capability probe (never fails closed:
  // the web needs to know the truth to render its fallback).
  // ------------------------------------------------------------------
  app.get('/v1/watches/config', { onRequest: [rateLimit(readLimiter)] }, async (_req, reply) => {
    reply.header('cache-control', 'no-store');
    return {
      pushSupported: Boolean(deps.vapid),
      publicKey: deps.vapid?.publicKey ?? null,
      maxRulesPerSubscription: 50,
    };
  });

  // ------------------------------------------------------------------
  // POST /v1/watches/subscribe — upsert by endpoint hash
  // ------------------------------------------------------------------
  app.post(
    '/v1/watches/subscribe',
    {
      bodyLimit: WATCH_BODY_LIMIT_BYTES.subscribe,
      onRequest: [failClosedVapid, requireJson, requireSameOrigin, rateLimit(subscribeLimiter)],
    },
    async (req, reply) => {
      const parsed = SubscribeSchema.safeParse(req.body);
      if (!parsed.success) {
        return deny(reply, 422, { errors: watchFieldErrorsFromZod(parsed.error) });
      }
      let subscription;
      try { subscription = upsertSubscription(deps.db, parsed.data, new Date(now())); }
      catch (err) {
        if (err instanceof SubscriptionConflictError) return deny(reply, 409, { error: err.message });
        throw err;
      }
      return reply.header('cache-control', 'no-store').code(201).send({
        subscriptionId: subscription.subscription_id,
      });
    },
  );

  // ------------------------------------------------------------------
  // POST /v1/watches/rules — create one rule
  // ------------------------------------------------------------------
  app.post(
    '/v1/watches/rules',
    {
      bodyLimit: WATCH_BODY_LIMIT_BYTES.rule,
      onRequest: [requireJson, requireSameOrigin, rateLimit(writeLimiter)],
    },
    async (req, reply) => {
      const parsed = WatchRuleSchema.safeParse(req.body);
      if (!parsed.success) {
        return deny(reply, 422, { errors: watchFieldErrorsFromZod(parsed.error) });
      }
      try {
        const rule = insertWatchRule(deps.db, parsed.data, new Date(now()));
        touchSubscription(deps.db, rule.subscription_id, new Date(now()));
        return reply.header('cache-control', 'no-store').code(201).send({ rule: toRuleItem(rule) });
      } catch (err) {
        if (err instanceof WatchRuleError) {
          if (err.code === 'unknown-subscription') {
            return deny(reply, 404, { error: err.message });
          }
          return deny(reply, 422, { error: err.message });
        }
        throw err;
      }
    },
  );

  // ------------------------------------------------------------------
  // GET /v1/watches/rules?subscriptionId= — pseudonymous read
  // ------------------------------------------------------------------
  app.get('/v1/watches/rules', { onRequest: [requireSameOrigin, rateLimit(readLimiter)] }, async (req, reply) => {
    reply.header('cache-control', 'no-store');
    const subscriptionId = (req.query as { subscriptionId?: string }).subscriptionId?.trim() ?? '';
    if (!subscriptionId) {
      return deny(reply, 422, { error: 'subscriptionId query parameter is required' });
    }
    const rows = listWatchRules(deps.db, subscriptionId);
    // Possession of the id grants access to an EMPTY list just as happily as a
    // real one — but an unknown id is distinguishable from an empty watchlist
    // only by content (never by status code timing games we play here: both 200).
    return { rules: rows.map(toRuleItem) };
  });

  // ------------------------------------------------------------------
  // DELETE /v1/watches/rules/:id?subscriptionId=
  // ------------------------------------------------------------------
  app.delete(
    '/v1/watches/rules/:id',
    { onRequest: [requireSameOrigin, rateLimit(writeLimiter)] },
    async (req, reply) => {
      const id = Number((req.params as { id: string }).id);
      const subscriptionId =
        (req.query as { subscriptionId?: string }).subscriptionId?.trim() ?? '';
      if (!Number.isInteger(id) || id <= 0 || !subscriptionId) {
        return deny(reply, 422, { error: 'rule id and subscriptionId are required' });
      }
      const rule = getWatchRule(deps.db, id);
      // Same answer whether the rule is missing or belongs to someone else.
      if (!rule || rule.subscription_id !== subscriptionId) {
        return deny(reply, 404, { error: 'not found' });
      }
      deleteWatchRule(deps.db, id, subscriptionId);
      touchSubscription(deps.db, subscriptionId, new Date(now()));
      return reply.header('cache-control', 'no-store').code(204).send();
    },
  );

  // ------------------------------------------------------------------
  // DELETE /v1/watches/subscriptions/:id — unsubscribe + cascade
  // ------------------------------------------------------------------
  app.delete(
    '/v1/watches/subscriptions/:id',
    { onRequest: [requireSameOrigin, rateLimit(writeLimiter)] },
    async (req, reply) => {
      const subscriptionId = (req.params as { id: string }).id?.trim() ?? '';
      if (!getSubscription(deps.db, subscriptionId)) {
        return deny(reply, 404, { error: 'not found' });
      }
      deleteSubscription(deps.db, subscriptionId);
      return reply.header('cache-control', 'no-store').code(204).send();
    },
  );
}
