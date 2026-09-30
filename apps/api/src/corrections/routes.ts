import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from '../db.js';
import { bearerToken } from '../portal/tokens.js';
import {
  CorrectionSubmissionSchema,
  CORRECTION_CATEGORIES,
  fieldErrorsFromZod,
  type CorrectionCategory,
} from './schema.js';
import {
  applyReviewAction,
  duplicateClusterOf,
  findCorrectionByReceiptHash,
  getCorrectionById,
  insertCorrection,
  listAuditFor,
  listCorrectionsForReview,
  ReviewActionError,
  REVIEW_ACTIONS,
  type CorrectionRow,
  type ReviewAction,
} from './service.js';
import {
  constantTimeEqual,
  generateReceiptCode,
  normalizeReceiptCode,
  RECEIPT_CODE_RE,
  receiptHash,
  receiptLast4,
} from './receipts.js';

/**
 * Public + moderator routes for user-suggested corrections (ADR 0015).
 *
 * Public (no credential, the second unauthenticated write in the product):
 *   POST /v1/corrections          — 16 KiB cap, strict same-origin, per-IP sliding
 *                                   windows, zod re-validation, honeypot 202-discard.
 *   GET  /v1/corrections/status/:code — no-store, rate-limited, hash-only lookup.
 * Moderator (CORRECTIONS_MODERATOR_TOKEN, constant-time compare, fail-closed 503):
 *   GET  /v1/corrections/review           — filtered queue, newest first, bounded.
 *   GET  /v1/corrections/review/:id       — full record + audit trail + cluster.
 *   POST /v1/corrections/review/:id       — one decision; never touches public data.
 *
 * Privacy: no IP, user agent, or body is ever logged or persisted; the receipt
 * code exists only in the 202 response. sourceUrl is stored opaque and is never
 * fetched by this server (SSRF floor, ADR 0015 §6).
 */

/** Hard request-body cap for the public POST (the global limit is 128 KiB). */
export const CORRECTIONS_BODY_LIMIT_BYTES = 16 * 1024;

/** ADR 0015 §5: per-water burst cap on OPEN corrections blunts targeted flooding. */
export const PER_WATER_OPEN_CAP = 10;

/** Largest moderator note accepted on the wire. */
const MODERATOR_NOTE_MAX = 2000;

export interface CorrectionsRateLimits {
  submissionsPerHour: number;
  submissionsPerDay: number;
  statusPerHour: number;
}

export interface CorrectionsDeps {
  db: Db;
  /** Receipt HMAC pepper; when unset EVERY corrections route answers 503 (fail-closed). */
  pepper?: string;
  /** Moderator shared token; review routes fail closed (503) without it. */
  moderatorToken?: string;
  /** Deployed origins allowed to drive the public routes (Origin/Referer checks). */
  siteOrigins?: string[];
  /** Test seam for the sliding windows. */
  limits?: Partial<CorrectionsRateLimits>;
  /** Test seam: injectable clock for the rate limiter. */
  now?: () => number;
}

const DEFAULT_LIMITS: CorrectionsRateLimits = {
  submissionsPerHour: 5,
  submissionsPerDay: 20,
  statusPerHour: 30,
};

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Evict expired limiter entries at least this often (checks, not wall time). */
const EVICT_EVERY_CHECKS = 128;
/** Hard bound on tracked keys per limiter — an IP-spoofing burst cannot grow the map without bound. */
const MAX_TRACKED_KEYS = 10_000;

export interface RateWindow {
  max: number;
  windowMs: number;
}

export interface RateDecision {
  allowed: boolean;
  /** Seconds until the binding window frees a slot (Retry-After), minimum 1. */
  retryAfterSeconds: number;
}

/**
 * Per-key sliding-window limiter over a BOUNDED map (F14 bounded-fan-out
 * discipline): expired entries are swept periodically and under pressure, and
 * the oldest-inserted keys are dropped when still over budget. In-memory only —
 * per process, best-effort abuse mitigation, not a distributed guard; entries
 * never outlive the longest window (+ prune()) so request metadata is bounded
 * well under the 30-day retention ceiling.
 */
export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();
  private checks = 0;
  private readonly maxWindowMs: number;

  constructor(
    private readonly windows: RateWindow[],
    private readonly now: () => number = () => Date.now(),
  ) {
    this.maxWindowMs = Math.max(...windows.map((w) => w.windowMs));
  }

  check(key: string): RateDecision {
    this.checks += 1;
    const at = this.now();
    if (this.checks % EVICT_EVERY_CHECKS === 0) this.prune(at);

    const relevant = (this.hits.get(key) ?? []).filter((t) => at - t < this.maxWindowMs);
    if (relevant.length === 0) this.hits.delete(key);

    let retryAfterSeconds = 0;
    for (const window of this.windows) {
      const inWindow = relevant.filter((t) => at - t < window.windowMs);
      if (inWindow.length >= window.max) {
        const oldestAt = inWindow[0]!;
        retryAfterSeconds = Math.max(
          1,
          Math.ceil((oldestAt + window.windowMs - at) / 1000),
        );
        this.hits.set(key, relevant);
        return { allowed: false, retryAfterSeconds };
      }
    }
    relevant.push(at);
    this.hits.set(key, relevant);

    // Bound AFTER insert so the steady-state size never exceeds the cap: sweep
    // expired keys first, then drop the oldest-inserted entries under pressure.
    if (this.hits.size > MAX_TRACKED_KEYS) {
      this.prune(at);
      while (this.hits.size > MAX_TRACKED_KEYS) {
        const oldest = this.hits.keys().next();
        if (oldest.done) break;
        this.hits.delete(oldest.value);
      }
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  /** Drop every key whose newest hit has aged out of the longest window. */
  prune(at: number = this.now()): number {
    let removed = 0;
    for (const [key, stamps] of this.hits) {
      const alive = stamps.filter((t) => at - t < this.maxWindowMs);
      if (alive.length === 0) {
        this.hits.delete(key);
        removed += 1;
      } else if (alive.length !== stamps.length) {
        this.hits.set(key, alive);
      }
    }
    return removed;
  }
}

function originOf(headerValue: string): string | null {
  try {
    return new URL(headerValue).origin.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Strict same-origin check (ADR 0015 §5): Origin/Referer, when present, must
 * match the deployed origin allowlist. No Origin and no Referer = server-to-
 * server traffic (curl, monitors, tests) and is allowed; a present-but-
 * unparseable or cross-site value is 403. An empty allowlist fails closed for
 * any browser-style request rather than trusting an unconfigured deployment.
 */
export function requestOriginAllowed(
  headers: FastifyRequest['headers'],
  siteOrigins: string[],
): boolean {
  const origin = typeof headers.origin === 'string' ? headers.origin.trim() : '';
  const referer = typeof headers.referer === 'string' ? headers.referer.trim() : '';
  if (!origin && !referer) return true;
  if (siteOrigins.length === 0) return false;
  const allowed = siteOrigins.map((o) => o.toLowerCase());
  if (origin) return allowed.includes(originOf(origin) ?? '');
  return allowed.includes(originOf(referer) ?? '');
}

/** `content-type` must be the JSON media type (parameters tolerated). */
function isJsonContentType(headers: FastifyRequest['headers']): boolean {
  const raw = headers['content-type'];
  if (typeof raw !== 'string' || raw.trim() === '') return false;
  const media = (raw.split(';')[0] ?? '').trim().toLowerCase();
  return media === 'application/json';
}

/** Shape a stored row for the moderator surface (camelCase, no receipt hash). */
function toReviewItem(db: Db, row: CorrectionRow): Record<string, unknown> {
  const clusterChildren = db
    .prepare('SELECT COUNT(*) AS n FROM corrections WHERE duplicate_of = ?')
    .get(row.id) as { n: number };
  const item: Record<string, unknown> = {
    id: row.id,
    status: row.status,
    category: row.category,
    waterId: row.water_id,
    proposedCorrection: row.proposed_correction,
    riskFlags: row.risk_flags ? row.risk_flags.split(',').filter(Boolean) : [],
    receiptLast4: row.receipt_last4,
    receivedAt: row.created_at,
    updatedAt: row.updated_at,
    clusterSize: 1 + clusterChildren.n,
  };
  if (row.water_name !== null) item.waterName = row.water_name;
  if (row.field !== null) item.field = row.field;
  if (row.current_value !== null) item.currentValue = row.current_value;
  if (row.what_appears_wrong !== null) item.whatAppearsWrong = row.what_appears_wrong;
  if (row.source_url !== null) item.sourceUrl = row.source_url;
  if (row.source_pub_date !== null) item.sourcePubDate = row.source_pub_date;
  if (row.duplicate_of !== null) item.duplicateOf = row.duplicate_of;
  if (row.reviewer_note !== null) item.reviewerNote = row.reviewer_note;
  if (row.terminal_at !== null) item.terminalAt = row.terminal_at;
  return item;
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

export function registerCorrectionsRoutes(app: FastifyInstance, deps: CorrectionsDeps): void {
  const limits = { ...DEFAULT_LIMITS, ...deps.limits };
  const now = deps.now ?? (() => Date.now());
  const siteOrigins = (deps.siteOrigins ?? []).map((o) => o.trim()).filter(Boolean);

  // Feature fail-closed: without the pepper the whole lane answers 503, exactly
  // like PORTAL_SECRET for the portal routes. The web already renders an honest
  // unavailable state for that code.
  const requirePepper = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!deps.pepper) {
      await deny(reply, 503, { error: 'service unavailable' });
    }
  };

  const requireSameOrigin = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!requestOriginAllowed(req.headers, siteOrigins)) {
      await deny(reply, 403, { error: 'cross-origin submissions are not accepted' });
    }
  };

  // Sliding windows, in front of body parsing: over-limit requests never reach
  // JSON.parse, and repeated 429s are the limiter's own answer (no risk flag
  // writeback — request metadata is never persisted for this lane).
  const submissionLimiter = new SlidingWindowRateLimiter(
    [
      { max: limits.submissionsPerHour, windowMs: HOUR_MS },
      { max: limits.submissionsPerDay, windowMs: DAY_MS },
    ],
    now,
  );
  const statusLimiter = new SlidingWindowRateLimiter(
    [{ max: limits.statusPerHour, windowMs: HOUR_MS }],
    now,
  );

  const rateLimit = (
    limiter: SlidingWindowRateLimiter,
  ): ((req: FastifyRequest, reply: FastifyReply) => Promise<void>) => {
    return async (req, reply) => {
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
  };

  const requireModerator = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!deps.moderatorToken) {
      await deny(reply, 503, { error: 'service unavailable' });
      return;
    }
    const token = bearerToken(req.headers.authorization);
    if (!token || !constantTimeEqual(deps.moderatorToken, token)) {
      await deny(reply, 401, { error: 'unauthorized' });
    }
  };

  // ------------------------------------------------------------------
  // POST /v1/corrections — public submission
  // ------------------------------------------------------------------
  app.post(
    '/v1/corrections',
    {
      bodyLimit: CORRECTIONS_BODY_LIMIT_BYTES, // route-level 413 below the global 128 KiB
      onRequest: [
        requirePepper,
        async (req, reply) => {
          if (!isJsonContentType(req.headers)) {
            await deny(reply, 415, { error: 'content-type must be application/json' });
          }
        },
        requireSameOrigin,
        rateLimit(submissionLimiter),
      ],
    },
    async (req, reply) => {
      const raw = req.body as unknown;

      // Honeypot on the RAW body, before validation: any content ⇒ 202 with a
      // receipt-SHAPED response and a silent discard. No row, no error, no
      // distinguishable signal — spammers must not learn they were caught.
      const honeypot = (raw as Record<string, unknown> | null)?.honeypot;
      if (typeof honeypot === 'string' && honeypot.trim() !== '') {
        return reply.code(202).send({ receiptCode: generateReceiptCode() });
      }

      const parsed = CorrectionSubmissionSchema.safeParse(raw);
      if (!parsed.success) {
        return deny(reply, 422, { errors: fieldErrorsFromZod(parsed.error) });
      }
      const submission = parsed.data;

      // waterId must resolve in the current catalog (archived rows still count —
      // a correction about a removed water is still checkable).
      const known = deps.db.prepare('SELECT 1 FROM streams WHERE id = ?').get(submission.waterId);
      if (!known) {
        return deny(reply, 422, {
          errors: {
            waterId: 'That water id is not in the catalog — use the id from the water page.',
          },
        });
      }

      // Per-water open cap (ADR 0015 §5): a flood against one page stops at 10
      // open corrections without burning an unbounded queue.
      const openForWater = deps.db
        .prepare(
          `SELECT COUNT(*) AS n FROM corrections
           WHERE water_id = ? AND status IN ('received','needs-more-evidence')`,
        )
        .get(submission.waterId) as { n: number };
      if (openForWater.n >= PER_WATER_OPEN_CAP) {
        return deny(
          reply,
          429,
          { error: 'too many open corrections for this water — try again later' },
          { 'retry-after': String(HOUR_MS / 1000) },
        );
      }

      // The code exists ONLY in this response; storage is the keyed hash + last4.
      const code = generateReceiptCode();
      const normalized = normalizeReceiptCode(code);
      insertCorrection(deps.db, {
        submission,
        receiptHash: receiptHash(deps.pepper!, normalized),
        receiptLast4: receiptLast4(normalized),
      });
      return reply.code(202).send({ receiptCode: code });
    },
  );

  // ------------------------------------------------------------------
  // GET /v1/corrections/status/:code — public receipt lookup
  // ------------------------------------------------------------------
  app.get(
    '/v1/corrections/status/:code',
    { onRequest: [requirePepper, requireSameOrigin, rateLimit(statusLimiter)] },
    async (req, reply) => {
      reply.header('cache-control', 'no-store');
      const normalized = normalizeReceiptCode((req.params as { code: string }).code ?? '');
      if (!RECEIPT_CODE_RE.test(normalized)) {
        return reply.code(400).send({ error: 'malformed receipt code' });
      }
      const hash = receiptHash(deps.pepper!, normalized);
      const row = findCorrectionByReceiptHash(deps.db, hash);
      if (!row) {
        // Identical answer for "typo", "never existed", and "expunged": the
        // response must not reveal whether a code ever existed.
        return reply.code(404).send({ status: 'unknown' });
      }
      const body: Record<string, unknown> = {
        code: normalized,
        status: row.status,
        waterId: row.water_id,
        category: row.category,
        updatedAt: row.updated_at,
      };
      if (row.reviewer_note) body.note = row.reviewer_note;
      return body;
    },
  );

  // ------------------------------------------------------------------
  // Moderator review surface — CORRECTIONS_MODERATOR_TOKEN, fail-closed 503
  // ------------------------------------------------------------------
  app.get(
    '/v1/corrections/review',
    { onRequest: [requireModerator] },
    async (req, reply) => {
      reply.header('cache-control', 'no-store');
      const q = req.query as Record<string, string | undefined>;
      const rows = listCorrectionsForReview(deps.db, {
        status: q.status,
        category: q.category,
        waterId: q.waterId,
        risk: q.risk,
        limit: q.limit ? Number(q.limit) : undefined,
      });
      return { corrections: rows.map((row) => toReviewItem(deps.db, row)) };
    },
  );

  app.get(
    '/v1/corrections/review/:id',
    { onRequest: [requireModerator] },
    async (req, reply) => {
      reply.header('cache-control', 'no-store');
      const id = Number((req.params as { id: string }).id);
      if (!Number.isInteger(id) || id <= 0) {
        return reply.code(404).send({ error: 'not found' });
      }
      const row = getCorrectionById(deps.db, id);
      if (!row) return reply.code(404).send({ error: 'not found' });
      return {
        correction: toReviewItem(deps.db, row),
        audit: listAuditFor(deps.db, id),
        cluster: duplicateClusterOf(deps.db, row),
      };
    },
  );

  app.post(
    '/v1/corrections/review/:id',
    { onRequest: [requireModerator] },
    async (req, reply) => {
      reply.header('cache-control', 'no-store');
      const id = Number((req.params as { id: string }).id);
      if (!Number.isInteger(id) || id <= 0) {
        return reply.code(404).send({ error: 'not found' });
      }
      const body = (req.body ?? {}) as Record<string, unknown>;
      const action = body.action;
      if (typeof action !== 'string' || !REVIEW_ACTIONS.includes(action as ReviewAction)) {
        return reply.code(422).send({ error: `action must be one of: ${REVIEW_ACTIONS.join(', ')}` });
      }
      const note = typeof body.note === 'string' ? body.note.slice(0, MODERATOR_NOTE_MAX) : undefined;
      try {
        const row = applyReviewAction(deps.db, id, action as ReviewAction, note);
        return { correction: toReviewItem(deps.db, row) };
      } catch (err) {
        if (err instanceof ReviewActionError) {
          if (err.code === 'not-found') return reply.code(404).send({ error: err.message });
          return reply.code(422).send({ error: err.message });
        }
        throw err;
      }
    },
  );
}

/** Exported for the review UI + tests: the exact category enum the API accepts. */
export const CORRECTION_CATEGORY_LIST: readonly CorrectionCategory[] = CORRECTION_CATEGORIES;
