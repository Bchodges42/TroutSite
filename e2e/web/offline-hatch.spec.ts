/**
 * web/offline-hatch.spec.ts — ROLE 5. Offline groundwork (§4 suite list; §12 #4/#6):
 * cold start → service worker ready → offline reload renders from the precache.
 *
 * Integration note (Role 6): the deep flows this file originally stubbed as
 * `test.fixme` are enabled for real in this canonical suite:
 *  - offline hatch ID flow + charts + last-known conditions → web/offline-cold-start.spec.ts
 *    (absorbed from Role 2's verified suite)
 *  - online conditions flow (score pills, reasons, verify-official links) →
 *    web/conditions-fixtures.spec.ts
 * The suite must contain zero test.fixme at integration (§12 #6).
 */
import { expect, test } from '@playwright/test';

test.describe('offline cold start (groundwork)', () => {
  test('PWA manifest + service worker register on first (online) visit', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const manifest = await page.evaluate(async () => {
      const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!link) return null;
      const res = await fetch(link.href);
      return res.ok ? ((await res.json()) as { name?: string; display?: string }) : null;
    });
    expect(manifest, 'a manifest link is present and fetchable').toBeTruthy();

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      return reg !== null;
    });
    expect(swRegistered, 'service worker becomes active').toBe(true);
  });

  test('offline reload still renders the app (precache works)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Give Workbox a beat to finish precaching before cutting the wire.
    await page.waitForTimeout(1000);

    await page.context().setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('#root')).not.toBeEmpty();
      await expect(page.locator('body')).toContainText('Trout');
    } finally {
      await page.context().setOffline(false);
    }
  });
});
