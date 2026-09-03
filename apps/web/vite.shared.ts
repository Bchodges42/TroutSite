import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Connect, Plugin, PluginOption } from 'vite';
import type { ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shared Vite bits for both build flavors (ROLE 2):
 *  - vite.config.ts          → the production build
 *  - vite.fixtures.config.ts → the same build plus fixture snapshots copied into
 *    dist so `vite preview` and the Playwright suite exercise the real static
 *    hosting layout (files served at the frozen /v1/* URLs).
 */

const webRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Precache globs are presence-driven so every build flavor stays warning-free.
 *
 * Production (ADR 0005): the content pack + hatch charts are static between
 * content deploys, so they precache (offline match-the-hatch on a cold install).
 * The remaining /v1 snapshots (conditions/stocking/shops/reports) change hourly
 * via cron, so they must NOT precache — precaching would serve build-time data
 * until the next deploy. They are runtime-cached (NetworkFirst) instead; the
 * fixture build (fixtures: true) still precaches everything it serves.
 */
function precacheGlobPatterns(fixtures: boolean): string[] {
  const patterns = ['**/*.{js,css,html,svg}', 'icons/*.png'];
  if (fixtures || existsSync(join(webRoot, 'public', 'content'))) patterns.push('content/**/*.json');
  if (fixtures) {
    patterns.push('v1/**');
  } else if (existsSync(join(webRoot, 'public', 'v1', 'hatch'))) {
    patterns.push('v1/hatch/**');
  }
  if (existsSync(join(webRoot, 'public', 'data'))) patterns.push('data/**');
  return patterns;
}

function noStoreMiddleware(req: Connect.IncomingMessage, res: ServerResponse, next: () => void): void {
  if (req.url && /^\/(v1|data|content)\//.test(req.url)) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
}

/**
 * Snapshot responses must never be cached by the HTTP cache — the service
 * worker (plus the app's Dexie store) is the offline layer, and an HTTP-cached
 * snapshot would masquerade as live data. Deploy note: production must send
 * `Cache-Control: no-store` (or revalidate) for /v1/* and /data/* too.
 */
export const snapshotHeadersPlugin = (): Plugin => ({
  name: 'trout-snapshot-no-store',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(noStoreMiddleware);
  },
  configurePreviewServer(server) {
    server.middlewares.use(noStoreMiddleware);
  },
});

export function buildPlugins({ fixtures = false }: { fixtures?: boolean } = {}) {
  return [
    react(),
    snapshotHeadersPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: { enabled: true },
      manifest: {
        id: '/',
        name: 'Trout — Match the Hatch & Stream Conditions',
        short_name: 'Trout',
        description:
          'Offline-first, privacy-first decision tool for trout anglers: match the hatch, stream conditions, stocking schedules, shop reports.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f8fafc',
        theme_color: '#0f172a',
        categories: ['sports', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Precache the app shell, the bundled content pack, and any snapshot
        // files that exist at build time (fixture builds). Regenerated /v1 and
        // /data snapshots are served stale-while-revalidate at runtime.
        globPatterns: precacheGlobPatterns(fixtures),
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/v1\//, /^\/data\//, /^\/content\//],
        runtimeCaching: [
          {
            // RegExp (not a function) so generateSW can serialize it into sw.js.
            urlPattern: /^\/(v1|data)\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'snapshot-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 128, maxAgeSeconds: 14 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ] satisfies PluginOption[];
}

/** DEV_FIXTURES=1 wires TanStack Query to apps/web/fixtures/data in `vite dev`. */
export const fixtureDefine = {
  'import.meta.env.DEV_FIXTURES': JSON.stringify(process.env.DEV_FIXTURES === '1'),
};
