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
        'categories:pwa': ['error', { minScore: 0.9 }],
        'categories:seo': 'off', // the app shell is not the SEO surface
        'categories:performance': ['warn', { minScore: 0.8 }],
        'uses-long-cache-ttl': 'off',
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
