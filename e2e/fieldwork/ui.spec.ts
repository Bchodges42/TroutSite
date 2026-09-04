import { test, expect, type Page } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Existing image library, used only to inspect rendered pixels in this UI regression.
const sharp = createRequire(new URL('../../apps/web/package.json', import.meta.url))('sharp');

const catalogPath = fileURLToPath(
  new URL('../../apps/web/public/v1/streams.json', import.meta.url),
);

// Test-only transport seam for BACKEND-ISSUES B01. This serves the unchanged
// baseline catalog to a browser test; it does NOT patch the production adapter.
test.beforeEach(async ({ page }) => {
  await page.route('**/v1/streams', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: await readFile(catalogPath, 'utf8'),
    }),
  );
});
async function select(page: Page, name: string) {
  const search = page.getByRole('combobox', { name: 'Search rivers' }).filter({ visible: true });
  await search.fill(name);
  await search.press('Enter');
  await expect(page.locator('#river-inspector')).toBeVisible();
}
async function ready(page: Page) {
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1');
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('controls and water index are immediately accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Search rivers' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use my location' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Map layers', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Find your water.' })).toBeVisible();
  await expect(page.locator('.water-row')).toHaveCount(92);
  await ready(page);
  await noOverflow(page);
});

test('search, inspector tabs, Escape hierarchy, and focus restoration', async ({ page }) => {
  await page.goto('/');
  await select(page, 'Caney');
  await ready(page);
  await expect(page.locator('#river-inspector')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Caney Fork River', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Conditions', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Hatches', exact: true })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Hatches', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#app-menu')).toHaveCount(0);
  await expect(page.locator('#river-inspector')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#river-inspector')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Search rivers' }).first()).toBeFocused();
});

test('named map waters are independently selectable', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const label = page.locator('.river-map-label').filter({ visible: true }).first();
  const id = await label.getAttribute('data-river-id');
  await label.click();
  await expect(page).toHaveURL(new RegExp('river=' + id));
  await expect(page.locator('.river-map-label.selected')).toHaveAttribute('aria-pressed', 'true');
});

test('theme toggle coordinates map and chrome, persists across reload', async ({ page }) => {
  await page.goto('/?river=caney-fork-river&month=5');
  await ready(page);
  await page.getByRole('button', { name: 'Switch to Nightfall theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'nightfall');
  await expect(page.locator('[data-basemap]')).toHaveAttribute('data-basemap', 'ink');
  await page.reload();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'nightfall');
  await page.getByRole('button', { name: 'Switch to Daybreak theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'daybreak');
});

test('hatch and pattern workflows retain river and month', async ({ page }) => {
  await page.goto('/?river=caney-fork-river&tab=Hatch&month=5');
  const pattern = page.locator('.hatch-patterns a').first();
  await expect(pattern).toBeVisible();
  await ready(page);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.waitForTimeout(350);
  const zoom = await page.getByTestId('river-map').getAttribute('data-zoom');
  await pattern.click();
  await expect(page).toHaveURL(/\/patterns\/.*river=caney-fork-river.*month=5/);
  await expect(page.locator('.river-context')).toContainText('Caney Fork River');
  await expect(page.getByRole('link', { name: 'Match the hatch', exact: true })).toHaveAttribute(
    'href',
    /month=5/,
  );
  await page.locator('.river-context a').click();
  await expect(page).toHaveURL(/river=caney-fork-river.*tab=Hatch.*month=5/);
  await ready(page);
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-zoom', zoom!);
  await expect(page.getByRole('tab', { name: 'Hatches', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('browser history restores the river and map camera', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await select(page, 'Caney');
  await page.waitForTimeout(450); // Wait for the defined 300 ms camera transition, not network readiness.
  const camera = await page.getByTestId('river-map').getAttribute('data-center');
  await select(page, 'Tellico');
  await page.waitForTimeout(450);
  await page.goBack();
  await expect(page).toHaveURL(/river=caney-fork-river/);
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-center', camera!);
  await page.goForward();
  await expect(page).toHaveURL(/river=tellico-river/);
});

test('logbook opens with the selected river, without writing an entry', async ({ page }) => {
  await page.goto('/?river=caney-fork-river&month=5');
  await page.getByRole('link', { name: 'Logbook', exact: true }).click();
  await expect(page).toHaveURL(/logbook\?river=caney-fork-river.*month=5/);
  await expect(
    page.locator('select').filter({ has: page.locator('option[value="caney-fork-river"]') }),
  ).toHaveValue('caney-fork-river');
  await expect(page.locator('.river-context')).toContainText('Caney Fork River');
});

for (const width of [768, 390, 320]) {
  test(`responsive sheet and controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await select(page, 'Caney');
    await ready(page);
    await noOverflow(page);
    const sheet = page.locator('.water-sidebar.is-inspecting');
    const box = await sheet.boundingBox();
    expect(box!.y).toBeGreaterThan(300);
    for (const label of ['Conditions', 'Hatches', 'Stocking', 'Reports', 'Log'])
      await expect(page.getByRole('tab', { name: label, exact: true })).toBeInViewport();
    await page.getByRole('button', { name: 'Expand details', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Show map', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close river details', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Search rivers' }).filter({ visible: true }),
    ).toBeFocused();
  });
}

test('reduced motion keeps zoom usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await ready(page);
  const before = Number(await page.getByTestId('river-map').getAttribute('data-zoom'));
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect
    .poll(async () => Number(await page.getByTestId('river-map').getAttribute('data-zoom')))
    .toBeGreaterThan(before);
});

test.describe('a missing catalog keeps map tools and a clear error state', () => {
  // The SW runtime-caches /v1/streams (B10 fix made that route live) and SW
  // fetches bypass page.route — block the worker so the 503 mock is honored.
  test.use({ serviceWorkers: 'block' });

  test('keeps map tools and shows a clear error', async ({ page }) => {
    await page.route('**/v1/streams', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Map layers', exact: true })).toBeVisible();
    await expect(page.getByText('Catalog unavailable', { exact: true })).toBeVisible();
  });
});

test('WebGL failure has a usable list alternative', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
      return original.apply(this, [kind, ...args] as never);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Explore without the map.' })).toBeVisible();
  await page.getByRole('link', { name: 'Browse all waters →', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Browse streams', exact: true })).toBeVisible();
  await expect(page.locator('.list-row')).toHaveCount(92);
});

test('offline and unassessed presentation never claim live or zero Poor', async ({
  page,
  context,
}) => {
  await page.goto('/?river=clinch-river');
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Not assessed', exact: true })).toBeVisible();
  await expect(page.locator('.score-disc')).toHaveCount(0);
  await context.setOffline(true);
  await expect(page.locator('.offline-banner')).toContainText('Offline');
  await expect(page.locator('.freshness')).toContainText('Saved offline');
  await expect(page.locator('.assessment')).not.toContainText('Live');
});

test('clicking actual river geometry opens its inspector', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  // The unchanged geometry's Caney anchor, projected into the initial unpadded map.
  const point = await page.getByTestId('river-map').evaluate((el) => {
    const [lng, lat] = el.dataset.center!.split(',').map(Number);
    const scale = 512 * 2 ** Number(el.dataset.zoom);
    const merc = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
    return {
      x: el.clientWidth / 2 + ((-85.7264 - lng!) * scale) / 360,
      y: el.clientHeight / 2 - ((merc(35.9783) - merc(lat!)) * scale) / (2 * Math.PI),
    };
  });
  await page.locator('.maplibregl-canvas').click({ position: point });
  await expect(page).toHaveURL(/river=caney-fork-river/);
});

test('granted location moves the map and shows an on-device marker', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ longitude: -84.1, latitude: 35.6 });
  await page.goto('/');
  await ready(page);
  const before = await page.getByTestId('river-map').getAttribute('data-center');
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.locator('.user-location')).toBeVisible();
  await expect(page.getByTestId('river-map')).not.toHaveAttribute('data-center', before!);
  await expect(page.locator('.map-location-note')).toContainText(
    'Location is used only in this session',
  );
});

test('guided hatch choices move focus and carry context into results', async ({ page }) => {
  await page.goto('/hatch-key?river=caney-fork-river&region=tn-middle-caney-fork&month=5');
  await page.getByRole('button', { name: '#16', exact: true }).click();
  await expect(page.locator('#hatch-step-heading')).toBeFocused();
  await page.getByRole('button', { name: 'olive', exact: true }).click();
  await page.getByRole('button', { name: '2 tails', exact: true }).click();
  await page
    .getByRole('button', { name: 'Flat plates (lamellae) along the sides', exact: true })
    .click();
  await page.getByRole('button', { name: 'slender', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Month', exact: true })).toHaveValue('5');
  await page.getByRole('button', { name: 'See matches', exact: true }).click();
  await expect(page.locator('#hatch-results-heading')).toBeFocused();
  await page.locator('ol .list-row').first().click();
  await expect(page).toHaveURL(/taxa\/.*river=caney-fork-river.*month=5/);
});

test('location permission denial provides actionable feedback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_success: unknown, error: (e: { code: number }) => void) =>
          error({ code: 1 }),
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Location permission was declined');
});

test('East Tennessee relief never paints a rectangle outside the state at zoom 8 or 9', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?terrain=1&basemap=ink');
  await ready(page);
  for (let i = 0; i < 4; i++) {
    await page.locator('.maplibregl-canvas').press('ArrowRight');
    await page.waitForTimeout(350);
  }
  const screenshots = fileURLToPath(new URL('../../artifacts/screenshots/', import.meta.url));
  await mkdir(screenshots, { recursive: true });
  const checkPixel = async (x: number, y: number, color: number[]) => {
    await expect
      .poll(async () => {
        const rgb = await sharp(await page.screenshot())
          .extract({ left: x, top: y, width: 1, height: 1 })
          .removeAlpha()
          .raw()
          .toBuffer();
        return Array.from(rgb);
      })
      .toEqual(color);
  };
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-zoom', '8');
  // Includes the South Carolina corner absent from the immediate-neighbor data.
  await checkPixel(1150, 895, [16, 33, 37]);
  await checkPixel(1150, 720, [16, 33, 37]);
  await page.screenshot({ path: screenshots + '/nightfall-east-8.png' });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-zoom', '9');
  await checkPixel(1200, 740, [16, 33, 37]);
  await page.screenshot({ path: screenshots + '/nightfall-east-9.png' });
  await page.getByRole('button', { name: 'Switch to Daybreak theme', exact: true }).click();
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'daybreak');
  await checkPixel(1200, 740, [221, 228, 223]);
  await page.screenshot({ path: screenshots + '/daybreak-east-9.png' });
});

test('representative desktop and mobile inspector views remain readable', async ({ page }) => {
  const screenshots = fileURLToPath(new URL('../../artifacts/screenshots/', import.meta.url));
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?river=caney-fork-river&month=9&terrain=1&basemap=paper');
  await ready(page);
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'daybreak');
  await expect(page.locator('.hatch-preview')).toContainText('Blood Midge');
  await page.screenshot({ path: screenshots + '/daybreak-desktop-inspector.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch to Nightfall theme', exact: true }).click();
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'nightfall');
  const selectedLabel = page.locator('.river-map-label.selected');
  await expect(selectedLabel).toBeVisible();
  const labelBounds = await selectedLabel.boundingBox();
  const sheetBounds = await page.locator('.water-sidebar.is-inspecting').boundingBox();
  expect(labelBounds!.y + labelBounds!.height).toBeLessThan(sheetBounds!.y);
  await expect(page.getByRole('tab', { name: 'Log', exact: true })).toBeInViewport();
  await noOverflow(page);
  await page.screenshot({ path: screenshots + '/nightfall-mobile-inspector.png' });
  await page.getByRole('button', { name: 'Expand details', exact: true }).click();
  await expect(page.locator('.river-map-label').filter({ visible: true })).toHaveCount(0);
  const fullMapHeight = (await page.locator('.field-map').boundingBox())!.height;
  await expect
    .poll(async () =>
      Math.round((await page.locator('.water-sidebar.is-expanded').boundingBox())!.height),
    )
    .toBe(Math.round(fullMapHeight * 0.82));
  await expect(page.locator('.metrics')).toBeInViewport();
  await page.screenshot({ path: screenshots + '/nightfall-mobile-expanded.png' });
});
