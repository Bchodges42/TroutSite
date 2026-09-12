import { test, expect } from '@playwright/test';

/**
 * Atlas verification — canonical Playwright style (page fixture, relative URLs,
 * baseURL from the `web` project). Runs against the fixture build served by
 * `vite preview` on :4173 (see global-setup.mjs).
 *
 * NOTE: the fixture pack has no condition plan for east-fork-stones-river, so
 * these specs assert map behavior (render, search, select, panel/sheet,
 * overflow) — not live condition values.
 */

test.setTimeout(90_000);

async function waitForMap(page: import('@playwright/test').Page) {
  await page.waitForSelector('canvas.maplibregl-canvas', { timeout: 30_000 });
  // Deterministic readiness: TennesseeMap sets data-map-ready on the container
  // when MapLibre first goes idle, or data-map-failed when its 12s watchdog
  // trips. Waiting on the pair (not a fixed sleep) is what keeps a failing map
  // from passing these tests.
  await page.waitForSelector('[data-map-ready], [data-map-failed]', { timeout: 25_000 });
  await expect(page.getByText(/didn't finish loading/i)).toHaveCount(0);
  await page.waitForTimeout(1500); // settle animations before screenshots
}

test('statewide renders rivers, counties, cities', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

  await page.goto('/?v=atlasqa', { waitUntil: 'domcontentloaded' });
  await waitForMap(page);
  // City labels render as designed; individual cities may yield to river
  // labels in the overlap pass, so assert the class, not one city.
  await expect(page.locator('.atlas-place--city').filter({ visible: true }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/atlas-statewide.png' });
  expect(errors.join('\n')).not.toMatch(/TypeError|Failed to load resource|maplibre-gl-worker/i);
});

test('select East Fork Stones via search, desktop panel', async ({ page }) => {
  // Brief-required acceptance viewport (was previously Playwright's 1280x720 default)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?v=atlasqa', { waitUntil: 'domcontentloaded' });
  await waitForMap(page);
  // The header search is the always-visible atlas path on fresh load (the
  // sidebar — and its own search — stays hidden until a water is open).
  const search = page.locator('.header-search').getByRole('combobox', { name: 'Search rivers' });
  await search.fill('East Fork Stones');
  await page.getByRole('option', { name: /east fork stones/i }).first().click();
  await expect(page.getByRole('heading', { name: 'East Fork Stones River' }).first()).toBeVisible({ timeout: 15_000 });
  // the inspector shows the water's metrics and every tab
  await expect(page.getByText('Streamflow', { exact: true })).toBeVisible();
  // all five tabs reachable
  for (const tab of ['Conditions', 'Hatches', 'Stocking', 'Reports', 'Log']) {
    await expect(page.getByRole('tab', { name: tab }).first()).toBeVisible();
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/atlas-selected-desktop.png' });
  const panel = await page.evaluate(() => {
    const host = document.querySelector('#river-inspector') as HTMLElement | null;
    if (!host) return { found: false };
    const r = host.getBoundingClientRect();
    const blank = document.elementFromPoint(r.left + r.width / 2, r.top + 40);
    return { found: true, top: Math.round(r.top), h: Math.round(r.height), midTopEl: (blank as HTMLElement)?.className?.toString().slice(0, 80) };
  });
  console.log('PANEL ' + JSON.stringify(panel));
  expect(panel.found).toBe(true);
  // desktop panel is the single scroll region; the page itself must not scroll
  const overflow = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
  expect(overflow.x).toBeLessThanOrEqual(1);
  expect(overflow.y).toBeLessThanOrEqual(1);
  // close button works
  await page.getByRole('button', { name: /close river details/i }).click();
  await expect(page.getByRole('heading', { name: 'East Fork Stones River' })).toHaveCount(0);
});

test('tablet 1024x768 selection', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/?v=atlasqa&river=east-fork-stones-river', { waitUntil: 'domcontentloaded' });
  await waitForMap(page);
  await expect(page.getByRole('heading', { name: 'East Fork Stones River' }).first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: 'test-results/atlas-selected-tablet.png' });
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('TABLET overflowX=' + overflowX);
  expect(overflowX).toBeLessThanOrEqual(1);
});

test('mobile 390x844 sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?v=atlasqa&river=east-fork-stones-river', { waitUntil: 'domcontentloaded' });
  await waitForMap(page);
  await expect(page.locator('[role="dialog"]:visible').getByRole('heading', { name: 'East Fork Stones River' })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: 'test-results/atlas-selected-mobile.png' });
});
