import { defineConfig } from '@playwright/test';

/** UI-only checks against the explicitly started, isolated preview. No server lifecycle changes. */
export default defineConfig({
  testDir: './fieldwork',
  outputDir: '../artifacts/fieldwork-tests',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  workers: 2,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    // The documented fieldwork preview is 5197. Another live checkout's server
    // may own that port during parallel sessions — override with
    // FIELDWORK_PORT to point the suite at this checkout's own preview.
    baseURL: `http://127.0.0.1:${process.env.FIELDWORK_PORT ?? 5197}`,
    viewport: { width: 1440, height: 960 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
});
