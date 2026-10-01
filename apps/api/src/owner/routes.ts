import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { bearerToken } from '../portal/tokens.js';
import { constantTimeEqual } from '../corrections/receipts.js';
import { SlidingWindowRateLimiter, type RateWindow } from '../corrections/routes.js';
import {
  OWNER_DEFAULT_LIMITS,
  type OwnerDeps,
  type OwnerRateLimits,
} from './schema.js';
import { ownerCorrectionsSummary, ownerDashboard, ownerResearchQueue } from './service.js';

/**
 * Owner dashboard routes (ADR 0017) — the publication-review surface.
 *
 * SELF-CONTAINED registration factory (same pattern as
 * registerCorrectionsRoutes): app.ts wires exactly ONE line —
 *
 *   registerOwnerRoutes(app, { db: options.db, snapshotsDir: options.webPublicDir,
 *     contentDir: options.webPublicDir ? join(options.webPublicDir, 'content-pack') : undefined,
 *     ownerToken: loadEnv().OWNER_DASHBOARD_TOKEN });
 *
 * Credential boundary (ADR 0017 §2): every route requires
 * `Authorization: Bearer <OWNER_DASHBOARD_TOKEN>` compared constant-time.
 * This token is its OWN credential — never the shop portal HMAC (PORTAL_SECRET),
 * never CORRECTIONS_MODERATOR_TOKEN, never WATCHDOG_TOKEN. The shop token grants
 * zero owner powers; the owner token grants zero operator powers: this lane is
 * GET-only in v1 and registers NOTHING when the env var is unset (fail-closed
 * by absence — an unconfigured deployment answers 404, not 503-with-shape).
 *
 * Payload hygiene (§4): no watchdog token, no ntfy topics, no credentials, no
 * raw jobs_log detail, no receipt hashes — job names/outcomes are sanitized to
 * enumerated values in service.ts and every route answers no-store.
 */

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

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

export function registerOwnerRoutes(app: FastifyInstance, deps: OwnerDeps): void {
  // Fail-closed by absence: without OWNER_DASHBOARD_TOKEN there is no owner
  // surface at all (the routes don't exist, so the honest answer is 404).
  if (!deps.ownerToken) return;

  const limits: OwnerRateLimits = { ...OWNER_DEFAULT_LIMITS, ...deps.limits };
  const now = deps.now ?? (() => Date.now());

  // Modest sliding windows per IP, in front of the auth compare so token
  // guessing is bounded (60 tries/hour against a high-entropy secret is the
  // point: slow the brute force, never throttle the one legitimate reader).
  const windows: RateWindow[] = [
    { max: limits.requestsPerHour, windowMs: HOUR_MS },
    { max: limits.requestsPerDay, windowMs: DAY_MS },
  ];
  const limiter = new SlidingWindowRateLimiter(windows, now);

  const requireOwner = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const decision = limiter.check(req.ip);
    if (!decision.allowed) {
      await deny(
        reply,
        429,
        { error: 'too many requests — try again later' },
        { 'retry-after': String(decision.retryAfterSeconds) },
      );
      return;
    }
    const token = bearerToken(req.headers.authorization);
    if (!token || !constantTimeEqual(deps.ownerToken!, token)) {
      // Identical answer for missing, malformed, and wrong — the response
      // never reveals which part failed (same discipline as the moderator lane).
      await deny(reply, 401, { error: 'unauthorized' });
    }
  };

  // ------------------------------------------------------------------
  // GET /v1/owner/dashboard — jobs, feed health, freshness, counts
  // ------------------------------------------------------------------
  app.get('/v1/owner/dashboard', { onRequest: [requireOwner] }, async (_req, reply) => {
    reply.header('cache-control', 'no-store');
    return ownerDashboard(deps.db, {
      snapshotsDir: deps.snapshotsDir,
      contentDir: deps.contentDir,
      now: new Date(now()),
    });
  });

  // ------------------------------------------------------------------
  // GET /v1/owner/corrections?status=&limit= — queue SUMMARY (read-only)
  // ------------------------------------------------------------------
  app.get('/v1/owner/corrections', { onRequest: [requireOwner] }, async (req, reply) => {
    reply.header('cache-control', 'no-store');
    const q = req.query as Record<string, string | undefined>;
    const status = q.status && /^[a-z-]{1,40}$/.test(q.status) ? q.status : undefined;
    const limitRaw = q.limit !== undefined ? Number(q.limit) : undefined;
    const limit =
      limitRaw !== undefined && Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
    return {
      corrections: ownerCorrectionsSummary(deps.db, { status, limit }),
    };
  });

  // ------------------------------------------------------------------
  // GET /v1/owner/research-queue — editorial evidence queue from the pack
  // ------------------------------------------------------------------
  app.get('/v1/owner/research-queue', { onRequest: [requireOwner] }, async (_req, reply) => {
    reply.header('cache-control', 'no-store');
    const queue = ownerResearchQueue(deps.contentDir);
    // No content pack wired/parseable → an honest empty queue, never a failure.
    return queue ?? { total: 0, truncated: false, queue: [] };
  });
}
