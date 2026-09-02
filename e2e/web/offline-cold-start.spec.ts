import { expect, test, type Page } from '@playwright/test';

/**
 * §12 #4-style offline gate for the PWA (ROLE 2 scope DoD):
 * visit online (service worker installs, content pack precaches, snapshots
 * cache into IndexedDB) → airplane mode → run the full hatch flow, charts,
 * and a never-before-visited conditions surface.
 *
 * Note on emulation: Playwright's offline emulation does not survive a
 * document reload in some Chromium/SW combinations, so the offline phase uses
 * in-app (SPA) navigation after `setOffline(true)` — the way a visitor actually
 * moves through the app at a riverbank — and a final reload that proves the
 * shell and data survive a restart.
 */

test('offline: hatch flow, charts, and last-known conditions stay fully functional', async ({ page }) => {
  // ---- online pass: install + warm the caches ----------------------------
  await page.goto('/conditions');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByText('South Holston River')).toBeVisible();

  // ---- airplane mode ------------------------------------------------------
  await page.context().setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);

  // SPA navigation into the hatch key (never reloads the document)
  await page.getByRole('link', { name: 'Hatch Key' }).click();
  await expect(page.getByRole('heading', { name: 'Hatch Key' })).toBeVisible();

  await runWizard(page);

  // results render offline; Blue-Winged Olive scores a perfect 8/8 for this bug
  await expect(page.getByText('Top matches')).toBeVisible();
  const firstResult = page.locator('ol > li').first();
  await expect(firstResult).toContainText('Blue-Winged Olive');
  await expect(firstResult).toContainText('8/8');

  // taxon detail renders offline
  await firstResult.getByRole('link').first().click();
  await expect(page.getByRole('heading', { name: 'Blue-Winged Olive' })).toBeVisible();
  await expect(page.getByText('Key attributes')).toBeVisible();
  await expect(page.getByText('Fly patterns that imitate it')).toBeVisible();

  // hatch chart renders offline (region × month)
  await page.getByRole('link', { name: 'Hatch Charts' }).click();
  await page.getByRole('link', { name: /May/ }).click();
  await expect(page.getByRole('heading', { name: /May/ })).toBeVisible();
  await expect(page.getByText('Sulphur Mayfly').first()).toBeVisible();

  // a never-visited conditions surface: navigate in-app (a document reload
  // would reset Playwright's offline emulation), the query refetches while
  // offline and the freshness chip must read "Offline · last known …"
  await page.getByRole('link', { name: 'Conditions' }).click();
  await expect(page.getByRole('heading', { name: 'Conditions' })).toBeVisible();
  await page.getByText('South Holston River').click();
  await expect(page.getByRole('heading', { name: 'South Holston River' })).toBeVisible();
  await expect(page.getByText(/Fishability/)).toBeVisible();
  await expect(page.getByText(/within the ideal range/)).toBeVisible();
  await expect(page.getByText(/Offline · last known/).first()).toBeVisible();

  // restart resilience: the shell, catalog, and cached data survive a reload
  await page.reload();
  await expect(page.getByRole('heading', { name: 'South Holston River' })).toBeVisible();
  await expect(page.getByText(/Verify officially/)).toBeVisible();
});

test('wizard offers a clean start-over after an unremarkable bug', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.goto('/hatch-key');

  await page.getByRole('button', { name: '#8', exact: true }).click();
  await page.getByRole('button', { name: 'red', exact: true }).click();
  await page.getByRole('button', { name: '2 tails', exact: true }).click();
  await page.getByRole('button', { name: /No visible gills/ }).click();
  await page.getByRole('button', { name: 'robust', exact: true }).click();
  await page.getByRole('button', { name: 'See matches' }).click();

  await expect(page.getByText('Top matches')).toBeVisible();
  // the flow never dead-ends: zero or more matches, always a way back
  await page.getByRole('button', { name: 'Start over' }).first().click();
  await expect(page.getByRole('heading', { name: 'How big was it? (hook size)' })).toBeVisible();
});

async function runWizard(page: Page): Promise<void> {
  await page.getByRole('button', { name: '#16', exact: true }).click();
  await page.getByRole('button', { name: 'olive', exact: true }).click();
  await page.getByRole('button', { name: '2 tails', exact: true }).click();
  await page.getByRole('button', { name: /Flat plates \(lamellae\)/ }).click();
  await page.getByRole('button', { name: 'slender', exact: true }).click();
  await page.getByRole('button', { name: 'See matches' }).click();
}
