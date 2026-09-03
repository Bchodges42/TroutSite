import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Resolve @trout/contracts from source so tests run without a prior contracts build
// (same pattern as apps/api — ROLE 1).
const contractsSource = fileURLToPath(
  new URL('../../packages/contracts/src/index.ts', import.meta.url),
);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@trout/contracts': contractsSource,
    },
  },
  root: fileURLToPath(new URL('.', import.meta.url)),
});
