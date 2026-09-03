/**
 * Playwright config — ROLE 5 (§4 deliverable: projects web / marketing /
 * admin-portal; runs on Windows/Git Bash and in .github/workflows/qa.yml).
 *
 * Prerequisite: built app dists (`pnpm -r build`) — the servers below serve
 * dists, so CI and local runs are fixture-driven and never need the live API.
 */
import { defineConfig, devices } from '@playwright/test';

const PORTS = { marketing: 4321, web: 4173, admin: 4174 };

export default defineConfig({
  testDir: '.',
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
