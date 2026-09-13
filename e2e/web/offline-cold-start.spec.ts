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
  await expect(page.getByText('Tailwaters now')).toBeVisible();

  // warm the hatch chart the offline pass reopens: previously-fetched
  // surfaces stay available offline; a never-fetched chart honestly cannot.
  await page.goto('/charts/tn-east-holston/5');
  await expect(page.getByText(/Sulphur/).first()).toBeVisible();
  await page.goto('/conditions');
  await expect(page.getByText('Tailwaters now')).toBeVisible();

  // ---- airplane mode ------------------------------------------------------
  await page.context().setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);

  // SPA navigation into the hatch key (never reloads the document)
  const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await drawer.getByRole('link', { name: 'Match the hatch' }).click();
  await expect(page.getByRole('heading', { name: 'Match the hatch.' })).toBeVisible();

  await runWizard(page);

  // results render offline; Blue-Winged Olive leads with high confidence.
  // The real content pack corrected BWO to 3 tails, so the '2 tails' answer
  // misses tails: 4 attribute matches + hatching-now (+2) + in-season (+1)
  // = an honest 7/8, not the synthetic pack's perfect 8/8.
  await expect(page.getByText('Top matches')).toBeVisible();
  const firstResult = page.locator('ol > li').first();
  await expect(firstResult).toContainText('Blue-Winged Olive');
  await expect(firstResult).toContainText('7/8');
  await expect(firstResult).toContainText('high confidence');

  // taxon detail renders offline
  await firstResult.getByRole('link').first().click();
  await expect(page.getByRole('heading', { name: 'Blue-Winged Olive' })).toBeVisible();
  await expect(page.getByText('Key attributes')).toBeVisible();
  await expect(page.getByText('Fly patterns that imitate it')).toBeVisible();

  // hatch chart renders offline (region × month)
  // Step 6c.4 pattern: the nav links live in the hamburger drawer now —
  // open it before each drawer-only navigation, not just the first one.
  await page.getByRole('button', { name: 'Open menu' }).click();
  await drawer.getByRole('link', { name: 'Hatch calendar' }).click();
  await page.getByRole('link', { name: /May/ }).click();
  await expect(page.getByRole('heading', { name: /May/, level: 1 })).toBeVisible();
  await expect(page.getByText(/Sulphur/).first()).toBeVisible(); // sulphur duns hatch in May

  // a never-visited conditions surface: navigate in-app (a document reload
  // would reset Playwright's offline emulation), the query refetches while
  // offline and the freshness chip must read "Offline · last known …"
  await page.getByRole('button', { name: 'Open menu' }).click();
  await drawer.getByRole('link', { name: 'Conditions' }).click();
  await expect(page.getByRole('heading', { name: 'Conditions' })).toBeVisible();
  // search-first page, fed entirely from the cached snapshots while offline
  await expect(page.getByText('Tailwaters now')).toBeVisible();
  await page.locator('li', { hasText: 'Boone Tailwater' }).first().click();
  await expect(page.getByRole('heading', { name: 'Boone Tailwater' })).toBeVisible();
  await expect(page.getByText(/Trout condition assessment/)).toBeVisible();
  await expect(page.getByText(/Offline · last known/).first()).toBeVisible();

  // restart resilience: the shell, catalog, and cached data survive a reload
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Boone Tailwater' })).toBeVisible();
  await expect(page.getByText(/Verify officially/)).toBeVisible();
});

test('wizard offers a clean start-over after an unremarkable bug', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.goto('/hatch-key');

  await page.getByRole('button', { name: /^#8/ }).click();
  await page.getByRole('button', { name: 'red', exact: true }).click();
  await page.getByRole('button', { name: /2 tails/ }).click();
  await page.getByRole('button', { name: /No visible gills/ }).click();
  await page.getByRole('button', { name: /robust/ }).click();
  await page.getByRole('button', { name: 'See matches' }).click();

  await expect(page.getByText('Top matches')).toBeVisible();
  // the flow never dead-ends: zero or more matches, always a way back
  await page.getByRole('button', { name: 'Start over' }).first().click();
  await expect(page.getByRole('heading', { name: 'How big was it? (hook size)' })).toBeVisible();
});

async function runWizard(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^#16/ }).click();
  await page.getByRole('button', { name: 'olive', exact: true }).click();
  await page.getByRole('button', { name: /2 tails/ }).click();
  await page.getByRole('button', { name: /Flat plates \(lamellae\)/ }).click();
  await page.getByRole('button', { name: /slender/ }).click();
  await page.getByRole('button', { name: 'See matches' }).click();
}
