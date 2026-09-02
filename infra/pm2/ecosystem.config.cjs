// ROLE 1 — pm2 process list (00-SHARED-CONTEXT §9): api, cron, cloudflared. No Docker, no systemd.
// Start with:  pm2 start infra/pm2/ecosystem.config.cjs   (from the repo root)
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

module.exports = {
  apps: [
    {
      name: 'trout-api',
      cwd: REPO_ROOT,
      script: 'apps/api/dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '8787',
        HOST: '127.0.0.1',
      },
      time: true,
      max_memory_restart: '400M',
    },
    {
      name: 'trout-cron',
      cwd: REPO_ROOT,
      script: 'apps/api/dist/cron.js',
      env: {
        NODE_ENV: 'production',
      },
      time: true,
      max_memory_restart: '300M',
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
