import { expect, test } from '@playwright/test';

/**
 * Privacy audit (non-negotiable #1 + #2, §12 #8 groundwork):
 *  1. Zero third-party network requests in apps/web — everything is same-origin
 *     (or local blob/data URLs created by the app itself).
 *  2. Geolocation coordinates never appear in ANY request URL — "near me" is
 *     computed on-device.
 */

test('no third-party requests across a full tour of the app', async ({ page }) => {
  const foreign: string[] = [];
  const origin = 'http://localhost:4173'; // baseURL from playwright.config.ts

  page.on('request', (req) => {
    const url = new URL(req.url());
    const local = url.origin === origin || url.protocol === 'data:' || url.protocol === 'blob:';
    if (!local) foreign.push(req.url());
  });

  for (const path of ['/', '/hatch-key', '/charts', '/charts/tn-east-tailwaters/5', '/conditions', '/conditions/south-holston-river', '/stocking', '/shops', '/logbook', '/settings', '/about']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }

  // run the wizard once too
  await page.goto('/hatch-key');
  await page.getByRole('button', { name: '#16', exact: true }).click();
  await page.getByRole('button', { name: 'olive', exact: true }).click();
  await page.getByRole('button', { name: '2 tails', exact: true }).click();
  await page.getByRole('button', { name: /lamellae/i }).click();
  await page.getByRole('button', { name: 'slender', exact: true }).click();
  await page.getByRole('button', { name: 'See matches' }).click();
  await page.waitForLoadState('networkidle');

  expect(foreign, `third-party requests found: ${foreign.join(', ')}`).toEqual([]);
});

test('location coordinates never appear in any request while using near me', async ({ page }) => {
  const LAT = 35.9643;
  const LON = -83.9207;
  const latTokens = [String(LAT), LAT.toFixed(4), LAT.toFixed(2), '35.96'];
  const lonTokens = [String(LON), LON.toFixed(4), LON.toFixed(2), '-83.92'];

  const requests: string[] = [];
  page.on('request', (req) => requests.push(req.url()));

  await page.context().grantPermissions(['geolocation'], { origin: 'http://localhost:4173' });
  await page.context().setGeolocation({ latitude: LAT, longitude: LON });

  await page.goto('/conditions');
  await expect(page.getByText('South Holston River')).toBeVisible();
  await page.getByRole('button', { name: 'Near me' }).click();
  await expect(page.locator('li', { hasText: 'South Holston River' }).first().getByText(/\d+(\.\d+)? mi/)).toBeVisible();
  await page.waitForLoadState('networkidle');

  const leaked = requests.filter((u) => latTokens.some((t) => u.includes(t)) || lonTokens.some((t) => u.includes(t)));
  expect(leaked, `coordinates leaked into requests: ${leaked.join(', ')}`).toEqual([]);
});
