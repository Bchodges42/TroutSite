import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Resolve @trout/contracts from source so tests run without a prior contracts build
// (same pattern as apps/api + @trout/content).
const contractsSource = fileURLToPath(
  new URL('../../packages/contracts/src/index.ts', import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom, not happy-dom: happy-dom's fetch double-reads response streams under msw/node
    // ("ReadableStream is locked"), which breaks res.json() in component tests.
    environment: 'jsdom',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    setupFiles: ['test/setup.ts'],
    // Privacy audit mindset: any request not covered by an MSW handler fails the test.
    onUnhandledRequest: 'error',
  },
  resolve: {
    alias: {
      '@trout/contracts': contractsSource,
      '@trout/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
      // Component tests run before `@trout/content build` — feed them a tiny pack mock.
      '^@trout/content/pack/(.*)$': fileURLToPath(new URL('./test/pack-mock/$1', import.meta.url)),
    },
  },
  root: fileURLToPath(new URL('.', import.meta.url)),
});
