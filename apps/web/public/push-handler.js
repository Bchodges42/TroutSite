/* global self, URL */
// Classic worker script: notification handling works when no app tab is open.
(function () {
  'use strict';
  function localTarget(value) {
    try {
      const url = new URL(typeof value === 'string' ? value : '/conditions', self.location.origin);
      if (url.origin === self.location.origin && /^\/conditions(?:\/[a-z0-9-]+)?\/?$/.test(url.pathname)) {
        return url.origin + url.pathname;
      }
    } catch { /* malformed notification URL */ }
    return self.location.origin + '/conditions';
  }
  function text(value, fallback, max) {
    return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
  }
  self.addEventListener('push', function (event) {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch { /* show a generic notice */ }
    if (!payload || typeof payload !== 'object') payload = {};
    const body = payload.kind === 'watch-digest' && Array.isArray(payload.waters)
      ? payload.waters.slice(0, 4).map(function (item) { return text(item && item.title, 'Water update', 60); }).join(' · ')
      : text(payload.body, 'Open Trout to check the latest source information.', 240);
    event.waitUntil(self.registration.showNotification(text(payload.title, 'Trout watch update', 120), {
      body: body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: localTarget(payload.url) },
    }));
  });
  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const target = localTarget(event.notification.data && event.notification.data.url);
    event.waitUntil((async function () {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        if (client.navigate) await client.navigate(target);
        await client.focus();
        return;
      }
      await self.clients.openWindow(target);
    })());
  });
})();
