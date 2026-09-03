// pm2 process list (00-SHARED-CONTEXT §9) — api, cron, the two static origins,
// cloudflared. No Docker, no systemd. Updated at integration (ROLE 6, ADR 0004):
//   - the API serves the PWA dist + the live /v1 snapshot tree (read path, same origin)
//   - the shop portal (:8788) and marketing (:8789) run on infra/static-server.mjs;
//     the portal process proxies /v1/portal/* to the API (same-origin, no CORS)
// Start with:  pm2 start infra/pm2/ecosystem.config.cjs   (from the repo root)
//
// PORTAL_SECRET / USGS_USER_AGENT / PORTAL_ORIGINS are read from the environment
// (or apps/api/.env) — never committed. See infra/RUNBOOK.md §3.
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Paths are absolute so process cwd never matters (pm2 cwd = REPO_ROOT here).
const API_ENV = {
  NODE_ENV: 'production',
  PORT: '8787',
  HOST: '127.0.0.1',
  TROUT_DB_PATH: path.join(REPO_ROOT, 'apps', 'api', 'data', 'trout.db'),
  TROUT_SNAPSHOTS_DIR: path.join(REPO_ROOT, 'apps', 'web', 'public'),
  TROUT_WEB_DIST_DIR: path.join(REPO_ROOT, 'apps', 'web', 'dist'),
  TROUT_RAW_DIR: path.join(REPO_ROOT, 'apps', 'api', 'data', 'raw'),
};

module.exports = {
  apps: [
    {
      // Fastify: portal write routes + health + GET /v1/streams (live, ?state=)
      // + static serving of apps/web/public (v1/**, content/**) and web/dist (PWA).
      name: 'trout-api',
      cwd: REPO_ROOT,
      script: 'apps/api/dist/server.js',
      env: API_ENV,
      time: true,
      max_memory_restart: '400M',
    },
    {
      name: 'trout-cron',
      cwd: REPO_ROOT,
      script: 'apps/api/dist/cron.js',
      env: API_ENV,
      time: true,
      max_memory_restart: '300M',
    },
    {
      // Shop portal (ROLE 4 build). --proxy forwards the two live portal routes
      // to the API so the browser only ever talks to this origin.
      name: 'trout-portal-static',
      cwd: REPO_ROOT,
      script: 'infra/static-server.mjs',
      args: 'apps/admin/dist 8788 --proxy /v1/portal=http://127.0.0.1:8787',
      time: true,
      max_memory_restart: '150M',
    },
    {
      // Marketing / SEO site (ROLE 5 build).
      name: 'trout-marketing-static',
      cwd: REPO_ROOT,
      script: 'infra/static-server.mjs',
      args: 'apps/marketing/dist 8789',
      time: true,
      max_memory_restart: '150M',
    },
    {
      name: 'trout-cloudflared',
      cwd: REPO_ROOT,
      script: 'cloudflared',
      args: 'tunnel run trout',
      interpreter: 'none', // native binary, not a Node script
      time: true,
    },
  ],
};
