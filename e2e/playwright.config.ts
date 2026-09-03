/**
 * Playwright config — canonical suite (ROLE 5, consolidated at integration by
 * Role 6: Role 2's apps/web specs were absorbed into e2e/web and the extra
 * apps/web config retired; see e2e/README.md + §12 #6).
 *
 * Projects: web / marketing / admin-portal + an e2e-only API instance for the
 * portal project. Runs on Windows/Git Bash and in .github/workflows/qa.yml.
 *
 * Prerequisite: built app dists (`pnpm -r build`) — globalSetup additionally
 * rebuilds web as the fixture flavor and admin against the e2e API origin.
 * The E2E_* env defaults below must mirror e2e/global-setup.mjs.
 */
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORTS = { marketing: 4321, web: 4173, admin: 4174, api: 8791 };
const E2E_PORTAL_SECRET = 'e2e-portal-secret-0123456789abcdef';
const PORTAL_ENV_DIR = path.join(HERE, 'test-results', 'portal-env');

process.env.E2E_PORTAL_ENV_DIR = PORTAL_ENV_DIR;
process.env.E2E_PORTAL_SECRET = E2E_PORTAL_SECRET;
process.env.E2E_API_BASE = `http://127.0.0.1:${PORTS.api}`;

export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,

  use: {
    trace: 'retain-on-failure',
    locale: 'en-US',
  },

  projects: [
    {
      name: 'marketing',
      testMatch: /marketing\/.*\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${PORTS.marketing}` },
    },
    {
      name: 'web',
      testMatch: /web\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${PORTS.web}` },
    },
    {
      name: 'admin-portal',
      testMatch: /admin\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${PORTS.admin}` },
    },
  ],

  webServer: [
    {
      // e2e-only API instance: temp DB (seeded by globalSetup from the api's
      // fixture content) + temp snapshot dir, so tests never touch real data.
      command: 'node dist/server.js',
      cwd: path.join(HERE, '..', 'apps', 'api'),
      url: `http://127.0.0.1:${PORTS.api}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        ...process.env,
        PORT: String(PORTS.api),
        HOST: '127.0.0.1',
        PORTAL_SECRET: E2E_PORTAL_SECRET,
        TROUT_DB_PATH: path.join(PORTAL_ENV_DIR, 'trout.db'),
        TROUT_SNAPSHOTS_DIR: path.join(PORTAL_ENV_DIR, 'snapshots'),
        TROUT_CONTENT_DIR: path.join(HERE, '..', 'apps', 'api', 'fixtures', 'content'),
      },
    },
    {
      command: 'pnpm --filter @trout/marketing preview --host 127.0.0.1 --port 4321',
      url: `http://127.0.0.1:${PORTS.marketing}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @trout/web preview --host 127.0.0.1 --port 4173 --strictPort',
      url: `http://127.0.0.1:${PORTS.web}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @trout/admin preview --host 127.0.0.1 --port 4174 --strictPort',
      url: `http://127.0.0.1:${PORTS.admin}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
