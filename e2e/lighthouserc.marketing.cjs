/* eslint-disable no-undef -- CommonJS config file run by Node (LHCI) */
/**
 * Lighthouse CI — marketing site (ROLE 5, DoD: Lighthouse SEO ≥ 95 on key
 * templates, a11y ≥ 90). Explicit URL list (via the zero-dep static server)
 * so every key template is audited, not a sample.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/static-server.mjs ../apps/marketing/dist 58630',
      startServerReadyPattern: 'static server on',
      url: [
        'http://127.0.0.1:58630/',
        'http://127.0.0.1:58630/install/',
        'http://127.0.0.1:58630/privacy/',
        'http://127.0.0.1:58630/about/',
        'http://127.0.0.1:58630/stocking/tn/',
        'http://127.0.0.1:58630/streams/tn/',
        'http://127.0.0.1:58630/streams/tn/south-holston-river/',
        'http://127.0.0.1:58630/hatch/tn/east-tailwaters/',
        'http://127.0.0.1:58630/when-does-tennessee-stock-trout/',
      ],
      numberOfRuns: 1,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        // Runner noise on shared CI hardware — tracked, not gating.
        'categories:performance': ['warn', { minScore: 0.8 }],
        'uses-long-cache-ttl': 'off',
        'canonical': 'off', // canonical points at SITE_URL (production) while LHCI audits localhost
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
