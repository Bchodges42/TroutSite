/**
 * web/offline-hatch.spec.ts — ROLE 5. The CANONICAL deep version of the offline
 * flow (§4 suite list; §12 #4/#6): cold start → service worker ready → go
 * offline → full hatch flow from the precached payload.
 *
 * The Phase-0 app is still a shell (Role 2 owns the hatch UI), so the deep flow
 * steps are `test.fixme` with their exact expected selectors/semantics — they
 * are mechanically enabled at integration by deleting the fixme call once the
 * UI lands (see docs/integration-checklist.md #4/#6). The offline cold-start
 * groundwork below runs for real today.
 */
import { expect, test } from '@playwright/test';

test.describe('offline cold start (runs today)', () => {
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

test.describe('canonical offline hatch flow (enabled at integration)', () => {
  // Expected flow, frozen here so the UI is built to a testable contract:
  // 1. cold start OFFLINE (context.setOffline before goto)
  // 2. open the ID key: page.getByRole('button', { name: /identify a bug|id key/i })
  // 3. work the key: size 18, tails 2, gills lamellae, shape slender, color olive,
  //    month + region pickers
  // 4. submit → ranked taxa list renders ≥1 result with confidence + matched attrs
  // 5. follow to the top taxon's detail → stages → fly patterns render
  // 6. "last updated" chips render from the precached payload timestamps

  test.fixme('cold start in airplane mode → full hatch ID flow works offline', async ({
    page,
  }) => {
    await page.context().setOffline(true);
    await page.goto('/');
    await page.getByRole('button', { name: /identify a bug|id key/i }).click();
    await page.getByLabel(/hook size/i).selectOption('18');
    await page.getByLabel(/tails/i).selectOption('2');
    await page.getByLabel(/gills/i).selectOption('lamellae');
    await page.getByLabel(/body shape/i).selectOption('slender');
    await page.getByLabel(/body color/i).fill('olive');
    await page.getByRole('button', { name: /match/i }).click();
    await expect(page.getByTestId('ranked-taxon')).not.toHaveCount(0);
    await expect(page.getByTestId('last-updated-chip').first()).toBeVisible();
  });

  test.fixme('online conditions flow: gauge snapshot + score + reasons render', async ({
    page,
  }) => {
    await page.goto('/conditions');
    await expect(page.getByTestId('condition-score')).toBeVisible();
    await expect(page.getByTestId('condition-reasons')).toContainText(/\w+/);
    await expect(page.getByRole('link', { name: /verify.*usgs/i })).toBeVisible();
  });
});
