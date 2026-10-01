import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * F6 fishability UI (fixture data): the fixture catalog marks warmwater waters
 * with targetSpecies and the fixture tree ships per-water fishability
 * snapshots (dist/v1/fishability/<id>.json). These specs pin the species-mode
 * setting, the focus picker, and the comfort-only presentation end-to-end.
 *
 * The catalog is served via page.route from the fixture file: identical to
 * what the fixture build serves at /v1/streams (the generated tree copied into
 * dist), pinned here so the fishability semantics under test cannot drift with
 * the served build.
 */
const fixtureCatalog = fileURLToPath(new URL('../../apps/web/fixtures/data/v1/streams', import.meta.url));

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/streams', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: await readFile(fixtureCatalog, 'utf8'),
    }),
  );
});

test('all-fish mode + focus: map rows wear the species fishability', async ({ page }) => {
  await page.goto('/?species=all&focus=smallmouth-bass&atlas=1');
  await page.waitForSelector('[data-map-ready], [data-map-failed]', { timeout: 25_000 });
  const row = page.locator('.water-row', { hasText: 'Harpeth River' }).first();
  // Harpeth's typed species is smallmouth bass (species-evidence pass); its
  // fishability is computed deterministically from the fixture conditions
  // readings (curated warm plan → outside-optimal comfort = 40).
  // The index fetch (per-water files) lands after first paint under the SW
  // precache, hence the generous timeout. The status line wears the water's
  // adjudicated opportunity headline (mixed winter-trout stocking + warmwater
  // — ADR 0010); the fishability metric itself is the row's number.
  await expect(row.locator('.status-text')).toHaveText('Mixed fishery', { timeout: 15_000 });
  await expect(row.locator('.water-row-meta small')).toHaveText('40 / 100');
  // A trout water with no focus-species entry keeps its OWN trout-condition
  // metric (fixture: Doe River scores Poor; its year-round regulatory status
  // keeps the metric visible in September) — no fishability borrow.
  const doe = page.locator('.water-row', { hasText: 'Doe River' }).first();
  await expect(doe.locator('.status-text')).toHaveText('Poor');
});

test('picker writes the shareable ?focus= param and persists the choice', async ({ page }) => {
  await page.goto('/?atlas=1&species=all');
  await page.waitForSelector('[data-map-ready], [data-map-failed]', { timeout: 25_000 });
  const picker = page.getByTestId('focus-picker');
  await expect(picker).toContainText('Largemouth bass', { timeout: 15_000 });
  await picker.selectOption('largemouth-bass');
  await expect(page).toHaveURL(/focus=largemouth-bass/);
  // The persisted setting drives the conditions page too.
  await page.goto('/conditions');
  await expect(page.getByRole('heading', { name: 'Conditions' })).toBeVisible();
});

test('detail page shows the comfort-only fishability card', async ({ page }) => {
  await page.goto('/settings');
  const allFish = page.getByRole('button', { name: 'All fish' }).first();
  await allFish.click();
  await expect(allFish).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(300); // let the Dexie write land before navigating
  await page.goto('/conditions/harpeth-river?focus=smallmouth-bass');
  await expect(page.getByRole('heading', { name: /Harpeth/i, level: 1 })).toBeVisible();
  const card = page.locator('.fishability-card');
  await expect(card.getByRole('heading', { name: 'Smallmouth bass' })).toBeVisible();
  // Comfort value/band is computed deterministically from the fixture
  // conditions readings (species-reference bands) — pin the shape, not the
  // demo number.
  await expect(
    page.locator('[aria-label*="Smallmouth bass fishability"][aria-label*="out of 100"]'),
  ).toBeVisible();
  // F10: the activity outlook renders as transparent per-factor rows.
  await expect(card.getByText(/Activity outlook: \d+ \/ 100/)).toBeVisible();
  await expect(card.getByText('Water temperature', { exact: true })).toBeVisible();
});

test('drawer shows the fishability card on an inspected water', async ({ page }) => {
  await page.goto('/?river=harpeth-river&species=all&focus=smallmouth-bass');
  await page.waitForTimeout(300);
  await page.waitForSelector('[data-map-ready], [data-map-failed]', { timeout: 25_000 });
  const inspector = page.locator('#river-inspector');
  await expect(inspector).toBeVisible();
  await expect(
    inspector.locator('[aria-label*="Smallmouth bass fishability"][aria-label*="out of 100"]'),
  ).toBeVisible();
});

test.describe('focus wiring hotfix', () => {
  test('all-fish mode + settings only: the card renders with no URL param at all', async ({
    page,
  }) => {
    // Persist all-fish via Settings (no URL params anywhere).
    await page.goto('/settings');
    const allFish = page.getByRole('button', { name: 'All fish' }).first();
    await allFish.click();
    await expect(allFish).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(300); // let the Dexie write land before navigating
    await page.goto('/conditions/harpeth-river');
    // Default focus = the first species the snapshot carries. The reviewed
    // pack types Harpeth for smallmouth bass only — the card renders what the
    // water actually has.
    await expect(page.locator('.fishability-card')).toBeVisible();
    await expect(
      page.locator('.fishability-card').getByRole('heading', { name: 'Smallmouth bass' }),
    ).toBeVisible();
  });

  test('the card picker swaps the species shown and persists the choice', async ({ page }) => {
    // The picker only mounts on waters carrying MORE THAN ONE species; the
    // reviewed pack types Harpeth for smallmouth alone. Center Hill Lake
    // carries six (largemouth/smallmouth/spotted/crappie/bluegill/catfish).
    await page.goto('/settings');
    await page.getByRole('button', { name: 'All fish' }).first().click();
    await page.waitForTimeout(300);
    await page.goto('/conditions/center-hill-lake');
    const picker = page.getByTestId('fishability-species-picker');
    await expect(picker).toBeVisible();
    await picker.selectOption('bluegill');
    await expect(
      page.locator('.fishability-card').getByRole('heading', { name: 'Bluegill' }),
    ).toBeVisible();
    // The choice persists across a reload.
    await page.reload();
    await expect(
      page.locator('.fishability-card').getByRole('heading', { name: 'Bluegill' }),
    ).toBeVisible();
  });

  test('the Settings page offers the species select in all-fish mode', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByTestId('settings-species-focus')).toHaveCount(0);
    await page.getByRole('button', { name: 'All fish' }).first().click();
    await expect(page.getByTestId('settings-species-focus')).toBeVisible();
  });
});
