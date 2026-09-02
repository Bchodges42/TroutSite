import { defineConfig } from '@playwright/test';

/**
 * ROLE 2 e2e harness. Specs live in `e2e/web/*.spec.ts` (role scope #10) and
 * run against the FIXTURE BUILD through `vite preview` — the same static
 * hosting layout Cloudflare serves in production (real /v1/* URLs, real
 * service worker, real IndexedDB).
 *
 * Run: pnpm --filter @trout/web test:e2e
 * (Chromium must be installed once: `pnpm exec playwright install chromium`)
 */
export default defineConfig({
  testDir: '../../e2e/web',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    colorScheme: 'light',
  },
  globalSetup: './e2e.global-setup.cjs',
  webServer: {
    command: 'pnpm exec vite preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
