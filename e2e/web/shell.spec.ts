import { test, expect } from '@playwright/test';

test.describe('fullscreen map shell', () => {
  test('map route is edge-to-edge: no header, no page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Primary tabs"]')).toHaveCount(0);
    const overflow = await page.evaluate(() => ({
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(overflow.y).toBeLessThanOrEqual(0);
    expect(overflow.x).toBeLessThanOrEqual(0);
  });

  test('hamburger opens a drawer with primary links; Escape closes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    for (const label of ['Map', 'Match the Hatch', 'Logbook', 'Conditions', 'Stocking', 'Settings', 'About & Privacy']) {
      await expect(drawer.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
  });

  test('drawer link navigates and closes the drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Stocking', exact: true }).click();
    await expect(page).toHaveURL(/\/stocking/);
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
  });
});
