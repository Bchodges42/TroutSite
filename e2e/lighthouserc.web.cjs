/* eslint-disable no-undef -- CommonJS config file run by Node (LHCI) */
/**
 * Lighthouse CI — web PWA (ROLE 5; PWA gate flipped to error at integration
 * per §12 #7): installable + offline pass + a11y ≥ 90 are all mandatory.
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
        // NOTE (integration, §12 #7): Lighthouse 12 removed the PWA category
        // upstream, so 'categories:pwa' can never assert — the gate is covered
        // instead by Playwright: e2e/web/manifest.spec.ts (manifest complete,
        // SW registers + takes control) and offline-cold-start/offline-hatch
        // specs (airplane-mode flows). See docs/integration-report.md.
        'categories:seo': 'off', // the app shell is not the SEO surface
        'categories:performance': ['warn', { minScore: 0.8 }],
        'uses-long-cache-ttl': 'off',
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
