import { existsSync, readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { StreamSchema } from '@trout/contracts';
import type { Stream } from '@trout/contracts';
import type { Db } from './db.js';
import { latestJobRuns } from './jobs/run.js';
import { conditionsFeedHealth, fishabilityFeedHealth } from './snapshots/health.js';
import { registerPortalRoutes, type PortalDeps } from './portal/routes.js';

export interface BuildAppOptions {
  logger?: boolean;
  /** When wired, /healthz gains a jobs summary and the portal routes mount. */
  db?: Db;
  portal?: Omit<PortalDeps, 'db'>;
  /**
   * apps/web/public — source of v1/streams.json for GET /v1/streams (the one GET
   * endpoint answered live, so ?state= filtering works) and of the /v1/* + /content/*
   * static snapshot files. Optional in tests.
   */
  webPublicDir?: string;
  /**
   * apps/web/dist — the built PWA, served by this process (same-origin snapshot
   * fetches, no CORS anywhere on the read path). Registered only when it exists.
   */
  webDistDir?: string;
  /** Portal (apps/admin) origins allowed to call the live portal routes. */
  portalOrigins?: string[];
  /** Optional shared secret for the private watchdog health probe. */
  watchdogToken?: string;
}

function constantTimeEqual(expected: string, actual: string): boolean {
  const expectedBytes = Buffer.from(expected, 'utf8');
  const actualBytes = Buffer.from(actual, 'utf8');
  const length = Math.max(expectedBytes.length, actualBytes.length);
  const paddedExpected = Buffer.alloc(length);
  const paddedActual = Buffer.alloc(length);
  expectedBytes.copy(paddedExpected);
  actualBytes.copy(paddedActual);
  const equal = timingSafeEqual(paddedExpected, paddedActual);
  return equal && expectedBytes.length === actualBytes.length;
}

/**
 * Fastify app factory. Without deps: only GET /healthz → { ok: true } (contract shape).
 * With db: /healthz additionally reports per-job health (additive, §6-consumable), and
 * the shop portal write routes mount. Logs never include authorization headers or IPs.
 *
 * Read path (ADR 0004): GET /v1/streams is answered live from the regenerated
 * v1/streams.json (so `?state=` filtering works); every other /v1/* + /content/*
 * URL is the static JSON file the snapshot builder writes, served from
 * apps/web/public; everything else comes from the built PWA in apps/web/dist.
 */
export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie', 'req.remoteAddress', 'req.remotePort'],
              remove: true,
            },
          },
    bodyLimit: 128 * 1024,
  });

  // T0-1: @fastify/static 7.0.4 (the last Fastify-4 line) answers a conditional
  // HEAD 304 by calling reply.send TWICE — once from its PassThrough flush()
  // with '' and once from the 'finish' listener with the stream. The second
  // send reaches Fastify's writeHead after headers went out and throws
  // ERR_HTTP_HEADERS_SENT, killing the process. Keep the first (correct, empty
  // 304) send and drop duplicates.
  app.addHook('onRequest', async (req, reply) => {
    if (req.method !== 'HEAD') return;
    const originalSend = reply.send.bind(reply);
    let sent = false;
    reply.send = ((payload?: unknown) => {
      if (sent) {
        req.log.warn({ url: req.url }, 'suppressed duplicate reply.send on HEAD (fastify-static conditional-304 double-send)');
        return reply;
      }
      sent = true;
      return originalSend(payload);
    }) as typeof reply.send;
  });

  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('Strict-Transport-Security', 'max-age=63072000');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
    return payload;
  });

  app.get('/healthz', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (options.watchdogToken) {
      const supplied = req.headers['x-watchdog-token'];
      if (typeof supplied !== 'string' || !constantTimeEqual(options.watchdogToken, supplied)) {
        return reply.code(401).send({ error: 'unauthorized' });
      }
    }
    if (!options.db) return { ok: true };
    const jobs = latestJobRuns(options.db);
    // C1: ok now reflects conditions-feed health, not merely "the process is
    // up". A served feed with catalog-wide zero observations and the builder's
    // stale stamp (the 2026-09-06 incident) reports ok:false with a reason.
    const conditions = conditionsFeedHealth(options.webPublicDir);
    // F5 (contract v2): the fishability snapshots join the same gate. A
    // missing fishability directory is the honest "nothing cataloged" state
    // (healthy); an emitted snapshot that fails its contract fails health.
    const fishability = fishabilityFeedHealth(options.webPublicDir);
    return { ok: conditions.healthy && fishability.healthy, conditions, fishability, jobs };
  });

  // The one dynamic GET: /v1/streams?state=TN filters the regenerated snapshot.
  // Snapshots are contract-validated at build time; unknown states → empty array.
  app.get('/v1/streams', async (req, reply) => {
    const file = options.webPublicDir ? join(options.webPublicDir, 'v1', 'streams.json') : '';
    if (!file || !existsSync(file)) {
      return reply.code(503).send({ error: 'streams snapshot not generated yet' });
    }
    let streams: Stream[];
    try {
      streams = (JSON.parse(readFileSync(file, 'utf8')) as unknown[]).map((s) => StreamSchema.parse(s));
    } catch (err) {
      req.log.error({ err }, 'streams snapshot unreadable');
      return reply.code(503).send({ error: 'streams snapshot unreadable' });
    }
    const state = (req.query as { state?: string }).state?.trim().toUpperCase();
    const filtered = state ? streams.filter((s) => s.stateId === state) : streams;
    return reply.header('cache-control', 'no-store').send(filtered);
  });

  if (options.db) {
    const portal = options.portal ?? { snapshotsDir: '' };
    registerPortalRoutes(app, { db: options.db, ...portal });
  }

  // Portal SPA origins only — the read path is same-origin static files, so CORS
  // exists solely for the shop portal (the one dynamic write surface). Calls with
  // no Origin header (curl, same-origin) pass through and simply get no CORS headers.
  app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin || (options.portalOrigins ?? []).includes(origin)) return cb(null, true);
      cb(null, false);
    },
  });

  // Snapshots + content pack: served from apps/web/public so cron updates them
  // without touching the built app. Each tree mounts at its own prefix —
  // two prefix:'/' statics collide (find-my-way '/*' route clash, trout-api
  // crash-loop — found at integration pm2 verification, §12 #10).
  const noStore = (res: { setHeader: (k: string, v: string) => void }, path: string): void => {
    // The service worker + Dexie are the offline layer; HTTP caching would
    // masquerade as live data (apps/web/vite.shared.ts note).
    if (/[/\\](v1|content)[/\\]/.test(path)) {
      res.setHeader('Cache-Control', 'no-store');
    }
  };
  if (options.webPublicDir && existsSync(join(options.webPublicDir, 'v1'))) {
    app.register(fastifyStatic, {
      root: join(options.webPublicDir, 'v1'),
      prefix: '/v1',
      decorateReply: false,
      // /v1/streams is the frozen contract route. The backing JSON file is an
      // implementation detail and must not become a second public endpoint.
      allowedPath: (pathname) => pathname !== '/streams.json',
      setHeaders: noStore,
    });
  }
  if (options.webPublicDir && existsSync(join(options.webPublicDir, 'content'))) {
    app.register(fastifyStatic, {
      root: join(options.webPublicDir, 'content'),
      prefix: '/content',
      decorateReply: false,
      setHeaders: noStore,
    });
  }

  // The built PWA (index.html + hashed assets). Assets are content-hashed and
  // immutable; index.html must revalidate so service-worker updates land.
  const distIndex =
    options.webDistDir && existsSync(join(options.webDistDir, 'index.html'))
      ? join(options.webDistDir, 'index.html')
      : null;
  if (options.webDistDir && distIndex) {
    app.register(fastifyStatic, {
      root: options.webDistDir,
      prefix: '/',
      setHeaders: (res, path) => {
        if (/[/\\]assets[/\\]/.test(path)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    });
  }

  // SPA fallback for client-side routes (react-router): unknown non-API paths
  // serve the PWA shell. /v1/* and /content/* stay 404 (they are API surface).
  if (distIndex) {
    app.setNotFoundHandler((req, reply) => {
      const url = req.url.split('?')[0] ?? '/';
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return reply.code(405).header('Allow', 'GET, HEAD').send({ error: 'method not allowed' });
      }
      if (url.startsWith('/v1/') || url === '/v1' || url.startsWith('/content/') || url === '/content') {
        return reply.code(404).send({ error: 'not found' });
      }
      return reply
        .header('Cache-Control', 'no-cache')
        .header('content-type', 'text/html; charset=utf-8')
        .send(readFileSync(distIndex, 'utf8'));
    });
  }

  return app;
}
