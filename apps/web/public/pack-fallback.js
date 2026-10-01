/* global caches, fetch, self, URL, Response */
/**
 * Service-worker pack fallback (offline downloads lane, 2026-09-30).
 *
 * WHY THIS FILE EXISTS: user-pinned pack assets live in Cache Storage under
 * `trout-packs-v1` (src/lib/packBuilder.ts PACK_CACHE_NAME; terrain tiles are
 * pinned into the existing `topo-cache`, which the Workbox CacheFirst runtime
 * route already serves offline). vite-plugin-pwa builds this project's service
 * worker with generateSW, which cannot carry a custom fetch handler inline —
 * but `importScripts` IS a first-class generateSW option, so vite.shared.ts
 * wires `importScripts: ['pack-fallback.js']` and this plain classic-JS module
 * supplies the one handler generateSW cannot express: a LAST-RESORT response
 * for requests no Workbox route claimed, answered from the pack cache. That
 * makes a pinned pack serve offline to every consumer of plain `fetch`, not
 * only through the app layer's own fetchSnapshot recovery tier.
 *
 * ORDERING CONTRACT (load-bearing — proven in test/sw-pack-fallback.test.ts):
 * the generated sw.js calls importScripts() at the top, BEFORE Workbox attaches
 * its router fetch listener (which happens inside the precacheAndRoute() /
 * registerRoute() calls further down the generated file). Registering our
 * listener at the top level of this file would therefore put it FIRST and let
 * it shadow every Workbox route. Deferring the registration by one microtask
 * runs it after the entire sw.js evaluation task — i.e. always AFTER the router
 * listener — so:
 *
 *   1. If a Workbox route (precache, NavigationRoute, snapshot NetworkFirst,
 *      topo CacheFirst) claimed the event, it called respondWith()
 *      synchronously; our later respondWith() throws InvalidStateError, which
 *      is caught and dropped — the Workbox response stands and, thanks to the
 *      `claimed` guard, we never even start a duplicate network fetch.
 *   2. If NO route claimed the event, we answer from `trout-packs-v1`
 *      (ignoreSearch, so revisioned/queried key variants still match), or fall
 *      through to `fetch(request)` — exactly the pre-existing default behavior
 *      for unclaimed requests, online or off.
 *
 * Navigations, non-GET requests and cross-origin requests are never ours to
 * answer. `topo-cache` is deliberately NOT searched here: packs pin terrain
 * tiles into it, but every /atlas/topo/ URL is already claimed by the Workbox
 * CacheFirst route, so a lookup would be unreachable shadow-prone duplication.
 */
(function () {
  'use strict';

  /** Keep in sync with src/lib/packBuilder.ts PACK_CACHE_NAME (the sync is
   *  asserted in test/sw-pack-fallback.test.ts). */
  const PACK_CACHE_NAME = 'trout-packs-v1';

  /**
   * Respond from the pack cache, else the network. `wasClaimed` is checked
   * AFTER the (always-async) cache lookup: if Workbox won the event, whatever
   * this promise resolves to is discarded by the browser, so we return a
   * benign network-error Response instead of issuing a duplicate fetch.
   */
  function packCacheResponse(request, wasClaimed) {
    const lookup =
      typeof caches === 'undefined'
        ? Promise.resolve(undefined)
        : caches.match(request, { cacheName: PACK_CACHE_NAME, ignoreSearch: true });
    return lookup
      .catch(function () {
        // Cache Storage unavailable or failing — fall through to the network.
        return undefined;
      })
      .then(function (hit) {
        if (hit && hit.ok) return hit;
        if (wasClaimed()) return Response.error();
        return fetch(request);
      });
  }

  // One microtask of deference: runs after sw.js's top-level evaluation has
  // finished (Workbox listener included) but before any fetch event can be
  // dispatched (those arrive as separate tasks — a microtask checkpoint always
  // flushes first). Deterministic "last resort", no listener-order guesswork.
  Promise.resolve().then(function () {
    self.addEventListener('fetch', function (event) {
      const request = event.request;
      if (request.method !== 'GET' || request.mode === 'navigate') return;
      const url = new URL(request.url);
      if (url.origin !== self.location.origin) return;

      let claimed = false;
      const response = packCacheResponse(request, function () {
        return claimed;
      });
      try {
        event.respondWith(response);
      } catch {
        // Workbox's router listener registered earlier and responded first:
        // its response stands. Mark the event claimed so the still-pending
        // lookup (if any) never issues a duplicate network fetch, and swallow
        // our loser promise so it cannot surface as an unhandled rejection.
        claimed = true;
        response.catch(function () {});
      }
    });
  });
})();
