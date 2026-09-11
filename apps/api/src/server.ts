import { resolve } from 'node:path';
import { buildApp } from './app.js';
import { openDb } from './db.js';
import { loadEnv, portalOrigins } from './env.js';

const env = loadEnv();
const db = openDb(resolve(env.TROUT_DB_PATH));
const app = buildApp({
  logger: true,
  db,
  portal: { secret: env.PORTAL_SECRET, snapshotsDir: resolve(env.TROUT_SNAPSHOTS_DIR ?? '../web/public') },
  webPublicDir: resolve(env.TROUT_SNAPSHOTS_DIR ?? '../web/public'),
  webDistDir: resolve(env.TROUT_WEB_DIST_DIR ?? '../web/dist'),
  portalOrigins: portalOrigins(env),
  watchdogToken: env.WATCHDOG_TOKEN,
});

app
  .listen({ port: env.PORT, host: env.HOST })
  .then((address) => {
    app.log.info(`trout api listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.close()
      .then(() => db.close())
      .finally(() => process.exit(0));
  });
}
