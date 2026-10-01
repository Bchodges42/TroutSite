/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { isPrivatePath, pinnedResponse } from './lib/swPinnedResponse';
import '../public/push-handler.js';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  __TROUT_PRECACHE_MANIFEST: Array<{ url: string; revision: string | null }>;
};

void self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
// Stable property lets the install budget inspect the actual injected manifest
// even when Rollup minifies the Workbox function names.
self.__TROUT_PRECACHE_MANIFEST = self.__WB_MANIFEST;
precacheAndRoute(self.__TROUT_PRECACHE_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/v1\//, /^\/data\//, /^\/content\//, /^\/atlas\//],
}));
registerRoute(({ url, sameOrigin }) => sameOrigin && isPrivatePath(url.pathname), new NetworkOnly());

const rejectFailedResponse = {
  fetchDidSucceed: async ({ response }: { response: Response }) => {
    if (!response.ok) throw new Error('Public resource request failed');
    return response;
  },
};
registerRoute(({ url, sameOrigin }) => sameOrigin && /^\/(?:v1|data|content)\//.test(url.pathname), new NetworkFirst({
  cacheName: 'snapshot-cache', networkTimeoutSeconds: 4,
  plugins: [rejectFailedResponse, new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 14 * 24 * 3600 })],
}));
registerRoute(({ url, sameOrigin }) => sameOrigin && /^\/atlas\//.test(url.pathname), new CacheFirst({
  cacheName: 'topo-cache',
  plugins: [rejectFailedResponse, new CacheableResponsePlugin({ statuses: [200] }),
    new ExpirationPlugin({ maxEntries: 512, maxAgeSeconds: 90 * 24 * 3600 })],
}));
// This runs after either a precached route or a runtime route fails.
setCatchHandler(({ request }) => pinnedResponse(request, self.location.origin));

// Earlier workers cached capability responses in the broad snapshot rule.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (!(await caches.keys()).includes('snapshot-cache')) return;
    const cache = await caches.open('snapshot-cache');
    for (const request of await cache.keys()) {
      if (isPrivatePath(new URL(request.url).pathname)) await cache.delete(request);
    }
  })());
});
