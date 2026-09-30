// Root ESLint flat config. Each workspace package runs `eslint .` from its own directory;
// ESLint discovers this config by walking up the tree.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// F19: globals for scripts that Node executes directly (no bundler, no
// tsconfig lib injected). Curated Node 20 runtime globals rather than a
// blanket `browser: true`, so a genuinely misspelled global still fails.
const nodeRuntimeGlobals = {
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  fetch: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  FormData: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  queueMicrotask: 'readonly',
  structuredClone: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  performance: 'readonly',
};

// e2e .mjs harnesses are Node-hosted but embed browser-context callbacks for
// page.evaluate()/page.evaluateHandle(), where these are the real runtime.
const browserEmbedGlobals = {
  document: 'readonly',
  window: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  history: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  getComputedStyle: 'readonly',
  matchMedia: 'readonly',
  HTMLElement: 'readonly',
  Element: 'readonly',
  Node: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  MutationObserver: 'readonly',
  ResizeObserver: 'readonly',
  IntersectionObserver: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.astro/**',
      '**/data/**',
      '**/backups/**',
      // Generated Playwright outputs (HTML report assets, traces, error
      // contexts) — build artifacts, not source; a failing local run writes
      // them under e2e/ and would otherwise turn the lint gate red.
      '**/playwright-report/**',
      '**/test-results/**',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Node-run scripts that declare their runtime instead of carrying the
    // per-file `eslint-disable no-undef` header the other scripts use.
    files: [
      'apps/web/scripts/audit-selectable-rivers.mjs',
      'apps/web/scripts/build-selectable-river-additions.mjs',
      'apps/web/scripts/generate-fixtures.mjs',
    ],
    languageOptions: { globals: nodeRuntimeGlobals },
  },
  {
    files: ['e2e/**/*.mjs'],
    languageOptions: { globals: { ...nodeRuntimeGlobals, ...browserEmbedGlobals } },
  },
);
