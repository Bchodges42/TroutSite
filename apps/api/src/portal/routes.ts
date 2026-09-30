import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ShopReportSchema } from '@trout/contracts';
import type { ShopReport } from '@trout/contracts';
import { z } from 'zod';
import type { Db } from '../db.js';
import { deterministicId } from '../lib/ids.js';
import { sanitizePlainText, sanitizeSlug } from '../lib/sanitize.js';
import { bearerToken, signShopToken, verifyShopToken } from './tokens.js';
import { publishReportFeed } from '../snapshots/build.js';

/** In-memory rate limit per shop token (privacy: nothing persisted, no IPs). */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}
  /** True when allowed; records the hit. */
  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

export const ReportBodySchema = z.object({
  streamId: z.string().min(1).max(80).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
  body: z.string().min(1).max(4000),
  hotPatterns: z
    .array(
      z.object({
        patternId: z.string().min(1).max(80),
        hookSize: z.number().int().min(1).max(24).optional(),
      }),
    )
    .max(25)
    .default([]),
  // Additive in contracts-v1.0.1 (ADR 0002): optional https photo URL, passed through
  // to the public report. The composer validates client-side; re-validated here.
  photoUrl: z
    .string()
    .max(2048)
    .refine((v) => /^https:\/\/\S+$/.test(v), { message: 'photoUrl must be an https URL' })
    .optional(),
});
export type ReportBody = z.infer<typeof ReportBodySchema>;

export interface PortalDeps {
  db: Db;
  /** Portal routes fail closed (503) when unset. */
  secret?: string;
  snapshotsDir: string;
  rateLimit?: { max: number; windowMs: number };
}

interface ShopRow {
  id: string;
  name: string;
  state_id: string;
  town: string;
  website_url: string;
  reports_enabled: number;
}

function deny(reply: { code: (n: number) => { send: (b: unknown) => void } }, code: number, message: string): void {
  reply.code(code).send({ error: message });
}

/**
 * The only live write surface in the product (§6): GET /v1/portal/me and
 * POST /v1/portal/reports. Auth = HMAC shop token; content = sanitized plain text
 * plus structured pattern references; every accepted report lands in SQLite and
 * regenerates ONLY the reports/recent.json feed (F02, 2026-09-29 audit — never
 * the whole snapshot set; see publishReportFeed in snapshots/build.ts).
 */
/** Attaches the verified shopId to the request once auth succeeds. */
interface AuthedRequest {
  shopId?: string;
}

/** Feed half of the POST /v1/portal/reports response (F02 truthfulness). */
interface FeedStatus {
  published: boolean;
}

/** Printable ASCII without spaces, 1–200 chars (an opaque client-chosen token). */
const IDEMPOTENCY_KEY_PATTERN = /^[\x21-\x7E]{1,200}$/;

/**
 * F02 idempotency mechanism: an optional `Idempotency-Key` request header
 * (migration 018 adds the partial UNIQUE index on (shop_id, idempotency_key)).
 * Retrying an accepted report with the same key replays the stored report
 * instead of inserting a second row. Reports published without a key behave
 * exactly as before (each POST is a new report).
 */
function idempotencyKeyFrom(headers: FastifyRequest['headers']): { key?: string; invalid?: boolean } {
  const raw = headers['idempotency-key'];
  if (raw === undefined) return {};
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!value || !IDEMPOTENCY_KEY_PATTERN.test(value)) return { invalid: true };
  return { key: value };
}

interface StoredReportRow {
  id: string;
  shop_id: string;
  stream_id: string | null;
  date: string;
  body: string;
  hot_patterns: string;
  attribution_url: string;
  photo_url: string | null;
  published_at: string;
  shop_name: string;
}

/** The stored report behind an idempotency key, revalidated against the contract. */
function storedReport(db: Db, shopId: string, idempotencyKey: string): ShopReport | undefined {
  const row = db
    .prepare(
      `SELECT r.id, r.shop_id, r.stream_id, r.date, r.body, r.hot_patterns, r.attribution_url, r.photo_url, r.published_at,
              s.name AS shop_name
       FROM shop_reports r JOIN shops s ON s.id = r.shop_id
       WHERE r.shop_id = ? AND r.idempotency_key = ?`,
    )
    .get(shopId, idempotencyKey) as StoredReportRow | undefined;
  if (!row) return undefined;
  return ShopReportSchema.parse({
    id: row.id,
    shopId: row.shop_id,
    shopName: row.shop_name,
    streamId: row.stream_id ?? undefined,
    date: row.date,
    body: row.body,
    hotPatterns: JSON.parse(row.hot_patterns),
    attributionUrl: row.attribution_url,
    ...(row.photo_url ? { photoUrl: row.photo_url } : {}),
    publishedAt: row.published_at,
  });
}

/**
 * Best-effort report-feed refresh (F02): acceptance and feed publication are
 * separate steps. A feed-write failure never rejects an accepted report — it is
 * reported truthfully in the response and healed by the scheduled snapshots job,
 * which writes the same feed via buildSnapshots → publishReportFeed.
 */
function tryPublishFeed(deps: PortalDeps, now: Date, log: { warn(obj: unknown, msg: string): void }): FeedStatus {
  try {
    publishReportFeed({ db: deps.db, snapshotsDir: deps.snapshotsDir, now });
    return { published: true };
  } catch (err) {
    log.warn({ err }, 'report feed refresh failed — report accepted; scheduled snapshots job will refresh the feed');
    return { published: false };
  }
}

export function registerPortalRoutes(app: FastifyInstance, deps: PortalDeps): void {
  const limiter = new RateLimiter(deps.rateLimit?.max ?? 20, deps.rateLimit?.windowMs ?? 3_600_000);

  /**
   * Auth runs in onRequest — BEFORE Fastify's content-type parser touches the body —
   * so an unauthenticated request is answered 401/403/503 regardless of body shape,
   * and untrusted bytes are never even parsed without a valid token.
   */
  const requireShop = async (
    req: FastifyRequest & Partial<AuthedRequest>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!deps.secret) {
      await deny(reply, 503, 'service unavailable');
      return;
    }
    const token = bearerToken(req.headers.authorization);
    if (!token) {
      await deny(reply, 401, 'unauthorized');
      return;
    }
    const shopId = verifyShopToken(deps.secret, token, Date.now(), (reason) => {
      req.log.info({ tokenFail: reason }, 'portal token rejected');
    });
    if (!shopId) {
      await deny(reply, 401, 'unauthorized');
      return;
    }
    const shop = deps.db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId) as ShopRow | undefined;
    if (!shop) {
      await deny(reply, 403, 'forbidden');
      return;
    }
    if (shop.reports_enabled !== 1) {
      await deny(reply, 403, 'forbidden');
      return;
    }
    req.shopId = shopId;
  };

  app.get('/v1/portal/me', { onRequest: requireShop }, async (req) => {
    const shop = deps.db
      .prepare('SELECT * FROM shops WHERE id = ?')
      .get((req as FastifyRequest & AuthedRequest).shopId) as ShopRow | undefined;
    // Full contract Shop shape (the admin validates with ShopSchema — stateId included).
    return {
      shop: {
        id: shop!.id,
        name: shop!.name,
        stateId: shop!.state_id,
        town: shop!.town,
        websiteUrl: shop!.website_url,
        reportsEnabled: shop!.reports_enabled === 1,
      },
    };
  });

  app.post(
    '/v1/portal/reports',
    { onRequest: requireShop },
    async (req: FastifyRequest & AuthedRequest, reply) => {
      const shopId = req.shopId!;

      // F02 idempotent replay, BEFORE the rate limiter: a retry of an accepted
      // report returns the stored report without burning another window slot.
      const key = idempotencyKeyFrom(req.headers);
      if (key.invalid) return deny(reply, 400, 'invalid idempotency key');
      if (key.key) {
        const existing = storedReport(deps.db, shopId, key.key);
        if (existing) {
          const feed = tryPublishFeed(deps, new Date(), req.log);
          return reply.code(200).send({ report: existing, idempotentReplay: true, feed });
        }
      }

      if (!limiter.allow(shopId)) return deny(reply, 429, 'too many reports — try again later');
      const shop = deps.db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId) as ShopRow;

      const parsed = ReportBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return deny(reply, 422, `invalid report: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
      }
      const input = parsed.data;

    const streamId = input.streamId ? sanitizeSlug(input.streamId) : null;
    if (input.streamId && !streamId) return deny(reply, 422, 'invalid streamId');
    if (streamId) {
      const exists = deps.db.prepare('SELECT 1 FROM streams WHERE id = ?').get(streamId);
      if (!exists) return deny(reply, 422, `unknown streamId: ${streamId}`);
    }

    const patternIds: { patternId: string; hookSize?: number }[] = [];
    for (const p of input.hotPatterns) {
      const id = sanitizeSlug(p.patternId);
      if (!id) return deny(reply, 422, `invalid patternId: ${p.patternId}`);
      patternIds.push({ patternId: id, ...(p.hookSize !== undefined ? { hookSize: p.hookSize } : {}) });
    }

    const body = sanitizePlainText(input.body);
    if (body.length === 0) return deny(reply, 422, 'report body is empty after sanitization');

    const now = new Date();
    const publishedAt = now.toISOString();
    const date = input.date ?? publishedAt.slice(0, 10);
    const candidate = ShopReportSchema.safeParse({
      id: deterministicId('report', shopId, publishedAt, randomUUID()),
      shopId: shop.id,
      shopName: shop.name,
      streamId: streamId ?? undefined,
      date,
      body,
      hotPatterns: patternIds,
      attributionUrl: shop.website_url,
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
      publishedAt,
    });
    if (!candidate.success) {
      return deny(reply, 422, `report failed contract validation: ${candidate.error.issues[0]?.message ?? 'unknown'}`);
    }
    const report = candidate.data;

    // Durable acceptance (F02): this row IS the accepted report. Acceptance and
    // feed publication are separate steps — a feed failure below must neither
    // reject the POST nor hide the accepted write (no more 500-after-INSERT).
    try {
      deps.db
        .prepare(
          `INSERT INTO shop_reports (id, shop_id, stream_id, date, body, hot_patterns, attribution_url, photo_url, published_at, idempotency_key)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          report.id,
          report.shopId,
          report.streamId ?? null,
          report.date,
          report.body,
          JSON.stringify(report.hotPatterns),
          report.attributionUrl,
          report.photoUrl ?? null,
          report.publishedAt,
          key.key ?? null,
        );
    } catch (err) {
      // Concurrent twins of one retry: the partial UNIQUE index on
      // (shop_id, idempotency_key) let exactly one row win — replay it.
      if (key.key) {
        const existing = storedReport(deps.db, shopId, key.key);
        if (existing) {
          const feed = tryPublishFeed(deps, now, req.log);
          return reply.code(200).send({ report: existing, idempotentReplay: true, feed });
        }
      }
      throw err;
    }

    // The report must appear in the next feed refresh with attribution (DoD) —
    // publish ONLY the feed now (F02: never the whole snapshot set, which would
    // overwrite species assessments without their reference pack).
    const feed = tryPublishFeed(deps, now, req.log);

    return reply.code(201).send({ report, feed });
    },
  );
}

export { signShopToken };
