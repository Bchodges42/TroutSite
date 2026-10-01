import { existsSync, readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { StreamSchema } from '@trout/contracts';
import type { Stream } from '@trout/contracts';
import type { Db } from './db.js';
import { latestJobRuns, jobDegradation } from './jobs/run.js';
import { conditionsFeedHealth, fishabilityFeedHealth } from './snapshots/health.js';
import { registerPortalRoutes, type PortalDeps } from './portal/routes.js';
import { registerCorrectionsRoutes, type CorrectionsDeps } from './corrections/routes.js';
import { registerWatchRoutes, type WatchDeps } from './push/routes.js';
import { vapidConfigFromEnv } from './push/notifier.js';
import { registerOwnerRoutes } from './owner/routes.js';
import { loadEnv } from './env.js';
import { createGaugeNowCache, GaugeNowBusyError, type GaugeNowCache } from './lib/gauge-now.js';

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
  /**
   * Corrections lane (ADR 0015). Omitted → the secrets and site origin come
   * from the environment (CORRECTIONS_RECEIPT_PEPPER, CORRECTIONS_MODERATOR_TOKEN,
   * SITE_URL); with no pepper configured every corrections route fail-closes 503.
   */
  corrections?: Omit<CorrectionsDeps, 'db'>;
  /**
   * Watchlist lane (ADR 0016). Omitted → the VAPID keys and site origin come
   * from the environment (VAPID_*, SITE_URL); with no VAPID configured the
   * push parts fail closed (subscribe 503, config pushSupported:false) while
   * config and rule CRUD stay available for already-registered ids.
   */
  watchlists?: Omit<WatchDeps, 'db'>;
  /** Live per-gauge readings for the map's gauge layer (injectable in tests). */
  gaugesNow?: GaugeNowCache;
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
 * Corrections config straight from the environment (ADR 0015): the receipt
 * pepper, the moderator token, and the site origin allowlist (from SITE_URL).
 * Unset secrets stay undefined — the routes then fail closed (503) rather than
 * running without their keying material.
 */
function correctionsDepsFromEnv(): Pick<CorrectionsDeps, 'pepper' | 'moderatorToken' | 'siteOrigins'> {
  const env = loadEnv();
  let siteOrigin = env.SITE_URL.trim();
  try {
    siteOrigin = new URL(env.SITE_URL).origin;
  } catch {
    // keep the raw value; the origin check compares parsed origins anyway
  }
  return {
    pepper: env.CORRECTIONS_RECEIPT_PEPPER,
    moderatorToken: env.CORRECTIONS_MODERATOR_TOKEN,
    siteOrigins: siteOrigin ? [siteOrigin] : [],
  };
}

/**
 * Watchlist config straight from the environment (ADR 0016): the VAPID keys
 * (via the shared vapidConfigFromEnv — app + cron can never disagree) and the
 * site origin allowlist.
 */
function watchlistsDepsFromEnv(): Pick<WatchDeps, 'vapid' | 'siteOrigins'> {
  const env = loadEnv();
  let siteOrigin = env.SITE_URL.trim();
  try {
    siteOrigin = new URL(env.SITE_URL).origin;
  } catch {
    // keep the raw value; the origin check compares parsed origins anyway
  }
  return { vapid: vapidConfigFromEnv(env), siteOrigins: siteOrigin ? [siteOrigin] : [] };
}

/**
 * Fastify app factory. Without deps: only GET /healthz → { ok: true } (contract shape).
 * With db: /healthz additionally reports per-job health (additive, §6-consumable), the
 * shop portal write routes mount, and the corrections lanes mount (public POST/status
 * + moderator review; fail-closed 503 until their env secrets are set). Logs never
 * include authorization headers or IPs.
 *
 * Read path (ADR 0004): GET /v1/streams is answered live from the regenerated
 * v1/streams.json (so `?state=` filtering works); every other /v1/* + /content/*
 * URL is the static JSON file the snapshot builder writes, served from
 * apps/web/public; everything else comes from the built PWA in apps/web/dist.
 */
export function publicLogUrl(rawUrl: string): string {
  return rawUrl.split('?')[0]!
    .replace(/^(\/v1\/corrections\/status\/)[^/]+/i, '$1[redacted]')
    .replace(/^(\/v1\/watches\/subscriptions\/)[^/]+/i, '$1[redacted]');
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const watches = options.db ? (options.watchlists ?? watchlistsDepsFromEnv()) : { vapid: null };
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            serializers: {
              req: (req) => ({ method: req.method, url: publicLogUrl(req.url), host: req.headers.host }),
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.remoteAddress',
                'req.remotePort',
              ],
              remove: true,
            },
          },
    bodyLimit: 128 * 1024,
  });

  // T2-47 (audit GHSA-83w8-p2f5-377r reachability probe): double-slash paths
  // route differently through @fastify/static 7 and bypass the static mount's
  // allowedPath guard ('/v1//streams.json' served the blocked implementation
  // file). No legitimate surface uses '//' or encoded slashes in the path;
  // reject instead of rewriting (rewriting changes what every later hook sees).
  app.addHook('onRequest', async (req, reply) => {
    const path = (req.raw.url ?? '').split('?')[0] ?? '';
    if (path.includes('//') || /%2f/i.test(path)) {
      return reply.code(404).send({ error: 'not found' });
    }
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
        req.log.warn(
          { url: publicLogUrl(req.url) },
          'suppressed duplicate reply.send on HEAD (fastify-static conditional-304 double-send)',
        );
        return reply;
      }
      sent = true;
      return originalSend(payload);
    }) as typeof reply.send;
  });

  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('Strict-Transport-Security', 'max-age=63072000');
    reply.header('X-Content-Type-Options', 'nosniff');
    const path = (_req.raw.url ?? '').split('?')[0] ?? '';
    if (path === '/v1/widgets/conditions-embed.html') {
      // ADR 0018: the shop conditions widget is MEANT to be framed cross-origin.
      // XFO cannot be overridden by CSP — it must be absent on this one path.
      reply.removeHeader('X-Frame-Options');
      reply.header('Content-Security-Policy', 'frame-ancestors *');
    } else {
      reply.header('X-Frame-Options', 'DENY');
    }
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
    // 2026-09-16 skew retro: `ok` alone hid a ten-day snapshots error loop —
    // the failure was IN this payload (jobs.snapshots.status === 'error') but
    // nothing read it. degraded/degradedReasons are the additive,
    // contract-safe surface (ASSUMPTIONS §6-consumable) that lifts job health
    // to the top level without turning a stale-but-serving site into a
    // verify/rollback event. See jobDegradation in jobs/run.ts.
    const degradedReasons = jobDegradation(jobs, new Date(), Boolean(watches.vapid));
    return {
      ok: conditions.healthy && fishability.healthy,
      degraded: degradedReasons.length > 0,
      degradedReasons,
      conditions,
      fishability,
      jobs,
    };
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
      streams = (JSON.parse(readFileSync(file, 'utf8')) as unknown[]).map((s) =>
        StreamSchema.parse(s),
      );
    } catch (err) {
      req.log.error({ err }, 'streams snapshot unreadable');
      return reply.code(503).send({ error: 'streams snapshot unreadable' });
    }
    const state = (req.query as { state?: string }).state?.trim().toUpperCase();
    const filtered = state ? streams.filter((s) => s.stateId === state) : streams;
    return reply.header('cache-control', 'no-store').send(filtered);
  });

  // Map gauge layer: one live reading per tapped gauge. The gauge catalog is a
  // static asset (/atlas/gauges-tn.geojson); only the tapped gauge is fetched,
  // cached (TTL + negative + in-flight dedupe) and served stale if USGS is
  // down — an upstream blip degrades, never 500s the map. F14: the cache also
  // bounds upstream fan-out (global concurrency cap + bounded wait queue);
  // overflow answers 503 busy instead of piling up. On-demand route,
  // deliberately not part of the frozen /v1 snapshot surface.
  const gaugeNow = options.gaugesNow ?? createGaugeNowCache();
  app.get('/v1/gauges/:gaugeId/now', async (req, reply) => {
    const { gaugeId } = req.params as { gaugeId: string };
    reply.header('Cache-Control', 'no-store');
    // USGS site ids are 8 digits WITH leading zeros — never coerce.
    if (!/^\d{8}$/.test(gaugeId)) {
      return reply.code(400).send({ error: 'gaugeId must be an 8-digit USGS site number' });
    }
    try {
      const entry = await gaugeNow.get(gaugeId);
      if (!entry) return reply.code(404).send({ error: 'no current reading for this gauge' });
      return {
        ...entry.reading,
        stale: entry.stale,
        fetchedAt: new Date(entry.fetchedAt).toISOString(),
      };
    } catch (err) {
      if (err instanceof GaugeNowBusyError) {
        return reply.code(503).send({ error: 'gauge service busy, retry shortly' });
      }
      req.log.warn({ err }, 'gauge-now: USGS fetch failed');
      return reply.code(502).send({ error: 'gauge source unavailable' });
    }
  });

  if (options.db) {
    const portal = options.portal ?? { snapshotsDir: '' };
    registerPortalRoutes(app, { db: options.db, ...portal });
    // Corrections lane (ADR 0015): public POST + status lookup, moderator
    // review surface. Fail-closed 503 on every route until the env secrets
    // are set; registration itself is unconditional so the honest 503 (which
    // the web renders as "opens when the review service ships") is what an
    // unconfigured deployment answers. Explicit options are authoritative
    // (tests stay deterministic); otherwise config comes from the environment.
    registerCorrectionsRoutes(app, {
      db: options.db,
      ...(options.corrections ?? correctionsDepsFromEnv()),
    });
    // Watchlist lane (ADR 0016): the one deliberate server-side subscription
    // surface. Registration is unconditional (an unconfigured deployment still
    // answers the honest 503 / pushSupported:false, which the web renders);
    // explicit options are authoritative (tests stay deterministic).
    registerWatchRoutes(app, {
      db: options.db,
      ...watches,
    });
    // Owner dashboard lane (ADR 0017): read-only operator visibility. The
    // factory registers NOTHING when the token is unset — an unconfigured
    // deployment simply has no owner surface (fail-closed by absence).
    registerOwnerRoutes(app, {
      db: options.db,
      snapshotsDir: options.webPublicDir,
      contentDir: options.webPublicDir ? join(options.webPublicDir, 'content-pack') : undefined,
      ownerToken: loadEnv().OWNER_DASHBOARD_TOKEN,
    });
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
  // @fastify/static v10 hands setHeaders a Fastify Reply (.header), older
  // majors handed the raw ServerResponse (.setHeader) — support both so the
  // no-store rule survives dependency majors.
  const noStore = (
    res: { setHeader?: (k: string, v: string) => void; header?: (k: string, v: string) => void },
    path: string,
  ): void => {
    // The service worker + Dexie are the offline layer; HTTP caching would
    // masquerade as live data (apps/web/vite.shared.ts note).
    if (/[/\\](v1|content)[/\\]/.test(path)) {
      if (typeof res.setHeader === 'function') res.setHeader('Cache-Control', 'no-store');
      else res.header?.('Cache-Control', 'no-store');
    }
  };
  if (options.webPublicDir && existsSync(join(options.webPublicDir, 'v1'))) {
    app.register(fastifyStatic, {
      root: join(options.webPublicDir, 'v1'),
      prefix: '/v1',
      decorateReply: false,
      // /v1/streams is the frozen contract route. The backing JSON file is an
      // implementation detail and must not become a second public endpoint.
      // Case-insensitive comparison: on case-insensitive filesystems (NTFS in
      // production) '/v1/STREAMS.JSON' would otherwise resolve the same file
      // (T2-47 audit probe).
      allowedPath: (pathname) => pathname.toLowerCase() !== '/streams.json',
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
      setHeaders: (
        res: {
          setHeader?: (k: string, v: string) => void;
          header?: (k: string, v: string) => void;
        },
        path,
      ) => {
        const set = (k: string, v: string) => {
          if (typeof res.setHeader === 'function') res.setHeader(k, v);
          else res.header?.(k, v);
        };
        if (/[/\\]assets[/\\]/.test(path)) {
          set('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (path.endsWith('.html')) {
          set('Cache-Control', 'no-cache');
        }
      },
    });
  }

  // SPA fallback for client-side routes (react-router): unknown non-API paths
  // serve the PWA shell. F28: the fallback answers ONLY for real app routes —
  // /v1/* and /content/* stay 404 (they are API surface), every static asset
  // namespace stays 404 when the file is missing (a readiness probe fetching
  // an absent /atlas/ tile must never receive the HTML shell with a 200), and
  // any path whose final segment looks like a file (contains a dot) is an
  // asset request, never a client route.
  if (distIndex) {
    const ASSET_NAMESPACES = ['/atlas', '/assets', '/content-pack', '/fonts', '/icons', '/img'];
    const isAssetPath = (url: string) => {
      if (ASSET_NAMESPACES.some((ns) => url === ns || url.startsWith(ns + '/'))) return true;
      const lastSegment = url.slice(url.lastIndexOf('/') + 1);
      return lastSegment.includes('.');
    };
    app.setNotFoundHandler((req, reply) => {
      const url = req.url.split('?')[0] ?? '/';
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return reply.code(405).header('Allow', 'GET, HEAD').send({ error: 'method not allowed' });
      }
      if (
        url.startsWith('/v1/') ||
        url === '/v1' ||
        url.startsWith('/content/') ||
        url === '/content' ||
        isAssetPath(url)
      ) {
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
