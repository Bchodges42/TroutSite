import { expect, test } from '@playwright/test';

/** Install manifest sanity (ROLE 2 scope 10) — installability groundwork for §12 #7. */
test('manifest is served, complete, and points at real icons', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
  const manifest = (await res.json()) as {
    name: string;
    short_name: string;
    start_url: string;
    display: string;
    icons: { src: string; sizes: string; type: string; purpose?: string }[];
  };

  expect(manifest.name).toContain('Trout');
  expect(manifest.short_name).toBe('Trout');
  expect(manifest.start_url).toBe('/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

  const maskable = manifest.icons.filter((i) => i.purpose?.includes('maskable'));
  expect(maskable.length).toBeGreaterThanOrEqual(1);
  expect(manifest.icons.some((i) => parseInt(i.sizes, 10) >= 192)).toBe(true);

  for (const icon of manifest.icons) {
    const iconRes = await request.get(icon.src);
    expect(iconRes.ok(), `icon ${icon.src} not reachable`).toBeTruthy();
  }
});

test('the service worker registers and takes control of the page', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 20_000,
  });

  const swUrl = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? '');
  expect(swUrl).toContain('/sw.js');

  // the offline fallback document is reachable (precache intact)
  const res = await page.request.get('/');
  expect(res.ok()).toBeTruthy();
  expect(await res.text()).toContain('Trout');
});
