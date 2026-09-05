import { test, expect } from '@playwright/test';

test.describe('fullscreen map shell', () => {
  // Refreshed for the discovery redesign: the map route keeps the app header
  // above a full-bleed map — the shell must simply never scroll.
  test('map route is full-height: header + full-bleed map, no page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('banner')).toHaveCount(1);
    const overflow = await page.evaluate(() => ({
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(overflow.y).toBeLessThanOrEqual(0);
    expect(overflow.x).toBeLessThanOrEqual(0);
  });

  test('hamburger opens the navigation menu with primary links; Escape closes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(drawer).toBeVisible();
    // No duplicate atlas paths: the menu links real destinations only.
    for (const label of [
      'Match the hatch',
      'Logbook',
      'Conditions',
      'Hatch calendar',
      'Stocking schedules',
      'Fishing information',
      'Shops & reports',
      'Settings',
      'About & privacy',
    ]) {
      await expect(drawer.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(drawer.getByRole('link', { name: 'Open water atlas' })).toHaveCount(0);
    await expect(drawer.getByRole('link', { name: 'Browse all waters' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
  });

  test('drawer link navigates and closes the drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
      .getByRole('dialog', { name: 'Navigation menu' })
      .getByRole('link', { name: 'Stocking schedules', exact: true })
      .click();
    await expect(page).toHaveURL(/\/stocking/);
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toHaveCount(0);
  });
});
