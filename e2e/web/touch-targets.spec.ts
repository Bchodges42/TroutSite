import { test, expect } from '@playwright/test';

/**
 * T2-41 — shared touch targets ≥ 44px. Real measurements on live pages:
 * map FABs, filter chips (coarse pointer), and the shared ConfirmButton /
 * dialog-close classes (checked via the same classes the components render,
 * since the seams only appear in specific flows).
 */

test('map control FABs meet the 44px minimum', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-map-ready], [data-map-failed]', { timeout: 25_000 });
  for (const name of ['Center map on Tennessee', 'Map layers', 'Use my location']) {
    const box = (await page.getByRole('button', { name }).boundingBox())!;
    expect(box.width, name + ' width').toBeGreaterThanOrEqual(44);
    expect(box.height, name + ' height').toBeGreaterThanOrEqual(44);
  }
});

test.describe('coarse-pointer surfaces', () => {
  test.use({ hasTouch: true });

  test('filter chips keep a 44px touch target on touch devices', async ({ page }) => {
    await page.goto('/?atlas=1');
    await page.waitForSelector('[data-map-ready], [data-map-failed]', { timeout: 25_000 });
    const chip = page.locator('.filter-chip').first();
    await chip.waitFor({ state: 'visible', timeout: 15_000 });
    const box = (await chip.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});

test('shared ConfirmButton and dialog-close classes meet 44px', async ({ page }) => {
  await page.goto('/');
  const dims = await page.evaluate(() => {
    const measure = (cls: string) => {
      const el = document.createElement('button');
      el.className = cls;
      // The confirm entry animation scales from 0.9 on mount — measure the
      // settled state, not the first animation frame.
      el.style.animation = 'none';
      document.body.appendChild(el);
      const r = el.getBoundingClientRect();
      el.remove();
      return { w: r.width, h: r.height };
    };
    return {
      dialogClose: measure('trout-dialog__close'),
      confirmArm: measure('trout-confirm__arm'),
      confirmCommit: measure('trout-confirm__commit'),
    };
  });
  expect(dims.dialogClose.w).toBeGreaterThanOrEqual(44);
  expect(dims.dialogClose.h).toBeGreaterThanOrEqual(44);
  expect(dims.confirmArm.h).toBeGreaterThanOrEqual(44);
  expect(dims.confirmCommit.h).toBeGreaterThanOrEqual(44);
});
