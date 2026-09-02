/* eslint-disable no-undef -- CommonJS config file run by Node (LHCI) */
/**
 * Lighthouse CI — web PWA (ROLE 5). Accessibility gates at ≥ 90 today.
 * The full §12 #7 PWA gate (installable + offline pass) runs with `warn`
 * until the Integration phase flips them to `error` (see
 * docs/integration-checklist.md #7) — the shell's SW/manifest already pass,
 * but the real offline UX must be judged against the finished app.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/static-server.mjs ../apps/web/dist 58631',
      startServerReadyPattern: 'static server on',
      url: ['http://127.0.0.1:58631/'],
      numberOfRuns: 1,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.9 }],
        'categories:seo': 'off', // the app shell is not the SEO surface
        'categories:performance': ['warn', { minScore: 0.8 }],
        'uses-long-cache-ttl': 'off',
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
