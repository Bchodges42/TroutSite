import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Connect, Plugin, PluginOption } from 'vite';
import type { ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve as resolvePath, extname, sep } from 'node:path';
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
  // Fonts ship in the shell: offline installs must render Fraunces/Plex from
  // the precache, not fall back to system faces (B10).
  const patterns = ['**/*.{js,css,html,svg,woff2}', 'icons/*.png'];
  if (fixtures || existsSync(join(webRoot, 'public', 'content'))) patterns.push('content/**/*.json');
  // Bundled catalog fallback (live-catalog resilience, 2026-09-09): the pack
  // copy lands in public/content-pack before `vite build`
  // (scripts/copy-pack-fallback.mjs) and must precache so a cold/offline
  // install can still render the catalog when the live /v1/streams feed is
  // down. Presence-driven like every other generated tree.
  if (existsSync(join(webRoot, 'public', 'content-pack'))) patterns.push('content-pack/*.json');
  if (existsSync(join(webRoot, 'public', 'atlas'))) {
    // Non-recursive on purpose: every precache-worthy atlas file (rivers,
    // places, tn-boundary/counties, states-context) sits directly in atlas/.
    // 'atlas/**' would also match atlas/topo/** (771 runtime-cached tiles),
    // and workbox's '!…' negation inside globPatterns proved unreliable in
    // this pipeline — a non-recursive glob can't reach the nested dir at all.
    patterns.push('atlas/*');
  }
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

/**
 * Frozen extensionless snapshot routes (GET /v1/streams — the stream catalog —
 * among them) are shipped as <name>.json files. Dev/preview must resolve them
 * BEFORE the SPA fallback: otherwise a fresh browser's JSON fetch receives
 * index.html with status 200 and the schema parse fails into a hard error.
 * Mirrors infra/static-server.mjs: non-HTML misses are a real 404, not HTML.
 */
export const snapshotRoutesPlugin = (): Plugin => ({
  name: 'trout-snapshot-routes',
  apply: 'serve',
  configureServer(server) {
    attachSnapshotRoutes(server.middlewares, () => server.config.publicDir);
  },
  configurePreviewServer(server) {
    const outDir = resolvePath(webRoot, server.config.build.outDir ?? 'dist');
    attachSnapshotRoutes(server.middlewares, () => outDir);
  },
});

function attachSnapshotRoutes(middlewares: Connect.Server, rootDir: () => string): void {
  middlewares.use((req, res, next) => {
    const pathname = (req.url ?? '').split('?')[0] ?? '';
    if (!/^\/(v1|data|content)\//.test(pathname) || extname(pathname)) return next();
    let decoded: string;
    try { decoded = decodeURIComponent(pathname); } catch { res.statusCode = 400; res.end(); return; }
    const base = resolvePath(rootDir());
    let candidate = join(base, decoded + '.json');
    if (!candidate.startsWith(base + sep)) { res.statusCode = 403; res.end(); return; }
    if (!existsSync(candidate) && pathname === '/v1/streams') candidate = join(base, 'v1', 'streams');
    if (!existsSync(candidate) || !statSync(candidate).isFile()) return next();
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    createReadStream(candidate).pipe(res);
  });
}

/**
 * Cloudflare Web Analytics beacon — build-time opt-in only (Session 3, ops
 * task). The beacon is injected into index.html ONLY when
 * VITE_CF_ANALYTICS_TOKEN is set in the build environment, so dev, fixture,
 * CI, and privacy-audit builds contain no analytics code at all (the
 * zero-cross-origin e2e spec keeps passing); production enables it by adding
 * the token to the deploy env. Cloudflare Web Analytics is cookie-free and
 * does not fingerprint; the off switch is building without the token. See
 * docs/OPERATIONS-ANALYTICS.md for the token + kill-switch runbook.
 */
export const analyticsBeaconPlugin = (): Plugin => ({
  name: 'trout-analytics-beacon',
  apply: 'build',
  transformIndexHtml() {
    const token = process.env.VITE_CF_ANALYTICS_TOKEN;
    if (!token) return [];
    return [
      {
        tag: 'script',
        attrs: {
          type: 'module',
          src: 'https://static.cloudflareinsights.com/beacon.min.js',
          'data-cf-beacon': JSON.stringify({ token }),
        },
        injectTo: 'head',
      },
    ];
  },
});

export function buildPlugins({ fixtures = false }: { fixtures?: boolean } = {}) {
  return [
    react(),
    snapshotHeadersPlugin(),
    snapshotRoutesPlugin(),
    analyticsBeaconPlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: { enabled: true, type: 'module' },
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
        background_color: '#0a100e',
        theme_color: '#0a100e',
        categories: ['sports', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // One Workbox catch handler covers both precache and runtime errors.
        globPatterns: precacheGlobPatterns(fixtures),
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
      },
    }),
  ] satisfies PluginOption[];
}

/** DEV_FIXTURES=1 wires TanStack Query to apps/web/fixtures/data in `vite dev`. */
export const fixtureDefine = {
  'import.meta.env.DEV_FIXTURES': JSON.stringify(process.env.DEV_FIXTURES === '1'),
};
