import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ShopReportSchema } from '@trout/contracts';
import { z } from 'zod';
import type { Db } from '../db.js';
import { deterministicId } from '../lib/ids.js';
import { sanitizePlainText, sanitizeSlug } from '../lib/sanitize.js';
import { bearerToken, signShopToken, verifyShopToken } from './tokens.js';
import { buildSnapshots } from '../snapshots/build.js';

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
 * regenerates reports/recent.json.
 */
/** Attaches the verified shopId to the request once auth succeeds. */
interface AuthedRequest {
  shopId?: string;
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
      await deny(reply, 503, 'portal is not configured (missing PORTAL_SECRET)');
      return;
    }
    const token = bearerToken(req.headers.authorization);
    if (!token) {
      await deny(reply, 401, 'missing portal token');
      return;
    }
    const shopId = verifyShopToken(deps.secret, token);
    if (!shopId) {
      await deny(reply, 401, 'invalid portal token');
      return;
    }
    const shop = deps.db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId) as ShopRow | undefined;
    if (!shop) {
      await deny(reply, 403, 'unknown shop');
      return;
    }
    if (shop.reports_enabled !== 1) {
      await deny(reply, 403, 'reports are not enabled for this shop');
      return;
    }
    req.shopId = shopId;
  };

  app.get('/v1/portal/me', { onRequest: requireShop }, async (req) => {
    const shop = deps.db
      .prepare('SELECT * FROM shops WHERE id = ?')
      .get((req as FastifyRequest & AuthedRequest).shopId) as ShopRow | undefined;
    return {
      shop: {
        id: shop!.id,
        name: shop!.name,
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
      publishedAt,
    });
    if (!candidate.success) {
      return deny(reply, 422, `report failed contract validation: ${candidate.error.issues[0]?.message ?? 'unknown'}`);
    }
    const report = candidate.data;

    deps.db
      .prepare(
        `INSERT INTO shop_reports (id, shop_id, stream_id, date, body, hot_patterns, attribution_url, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        report.id,
        report.shopId,
        report.streamId ?? null,
        report.date,
        report.body,
        JSON.stringify(report.hotPatterns),
        report.attributionUrl,
        report.publishedAt,
      );

    // The report must appear in the next snapshot with attribution (DoD) — regenerate now.
    buildSnapshots({ db: deps.db, snapshotsDir: deps.snapshotsDir, now });

    return reply.code(201).send({ report });
    },
  );
}

export { signShopToken };
