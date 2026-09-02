import Fastify, { type FastifyInstance } from 'fastify';
import type { Db } from './db.js';
import { latestJobRuns } from './jobs/run.js';
import { registerPortalRoutes, type PortalDeps } from './portal/routes.js';

export interface BuildAppOptions {
  logger?: boolean;
  /** When wired, /healthz gains a jobs summary and the portal routes mount. */
  db?: Db;
  portal?: Omit<PortalDeps, 'db'>;
}

/**
 * Fastify app factory. Without deps: only GET /healthz → { ok: true } (contract shape).
 * With db: /healthz additionally reports per-job health (additive, §6-consumable), and
 * the shop portal write routes mount. Logs never include authorization headers or IPs.
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

  app.get('/healthz', async () => {
    if (!options.db) return { ok: true };
    const jobs = latestJobRuns(options.db);
    return { ok: true, jobs };
  });

  if (options.db) {
    const portal = options.portal ?? { snapshotsDir: '' };
    registerPortalRoutes(app, { db: options.db, ...portal });
  }

  return app;
}
