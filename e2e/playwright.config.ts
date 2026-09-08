/**
 * Playwright config — canonical suite (ROLE 5, consolidated at integration by
 * Role 6: Role 2's apps/web specs were absorbed into e2e/web and the extra
 * apps/web config retired; see e2e/README.md + §12 #6).
 *
 * Projects: web / marketing / admin-portal + an e2e-only API instance for the
 * portal project. Runs on Windows/Git Bash and in .github/workflows/qa.yml.
 *
 * Prerequisite: built app dists (`pnpm -r build`) — globalSetup additionally
 * rebuilds web as the fixture flavor, rebuilds admin against the e2e API
 * origin, seeds the e2e API's temp DB and generates its launcher script.
 */
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORTS = { marketing: 4321, web: 4173, admin: 4174, api: 8791 };

export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.mjs',
  fullyParallel: true,
  // Serialized on purpose: parallel workers each boot a MapLibre WebGL context
  // and a service-worker install; on constrained machines (and 2-core CI) that
  // starves SW activation/render budgets and fails offline specs. All projects
  // pass green at workers=1; deterministic > fast for this suite.
  workers: 1,
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
    {
      // Fieldwork map-UI suite (ui.spec.ts, layers-conditions.spec.ts) — the
      // specs were committed without a matching project and never ran; this
      // wires them to the built web dist like the web project.
      name: 'fieldwork',
      testMatch: /fieldwork\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${PORTS.web}` },
    },
  ],

  webServer: [
    {
      // e2e-only API instance — scripts/api-e2e-server.mjs seeds a temp DB from
      // the api's fixture content and mints a real portal token on startup,
      // then imports the built server. Tests never touch real data.
      command: 'node scripts/api-e2e-server.mjs',
      cwd: HERE,
      url: `http://127.0.0.1:${PORTS.api}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
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
      // Portal served the production way (ADR 0004): static dist + /v1/portal
      // proxy to the e2e API — same-origin, no CORS anywhere.
      command: 'node ../infra/static-server.mjs ../apps/admin/dist 4174 --proxy v1/portal=http://127.0.0.1:8791',
      cwd: HERE,
      url: `http://127.0.0.1:${PORTS.admin}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
