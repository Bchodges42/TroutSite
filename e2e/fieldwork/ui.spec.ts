import { test, expect, type Page } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

type GeoFeature = {
  properties: { id?: string; source?: string } & Record<string, unknown>;
  geometry: { type: string; coordinates: number[][] | number[][][] };
};
type MapLike = {
  getContainer(): { clientWidth: number; clientHeight: number };
  queryRenderedFeatures(): GeoFeature[];
};
declare global {
  interface Window { __troutMap?: MapLike }
}


// Existing image library, used only to inspect rendered pixels in this UI regression.
const sharp = createRequire(new URL('../../apps/web/package.json', import.meta.url))('sharp');

const catalogPath = fileURLToPath(
  new URL('../../apps/web/public/v1/streams.json', import.meta.url),
);
const riversPath = fileURLToPath(
  new URL('../../apps/web/public/atlas/rivers.geojson', import.meta.url),
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
/** The header search is the one search surface visible in every state and at
 * every width (the sidebar search mounts hidden until a water/index opens).
 * Stage-2 update: the old "Search waters" FAB no longer exists. */
function headerSearch(page: Page) {
  return page.locator('.header-search').getByRole('combobox', { name: 'Search rivers' });
}
async function select(page: Page, name: string, optionName?: RegExp) {
  await headerSearch(page).fill(name);
  // The best match can be ambiguous ('Caney' matches the tailwater AND the
  // upper reach) — an explicit option pattern pins the water.
  await page.getByRole('option', { name: optionName ?? new RegExp(name, 'i') }).first().click();
  await expect(page.locator('#river-inspector')).toBeVisible();
}
async function ready(page: Page) {
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1');
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function mapViewportCoordinate(page: Page, longitude: number, latitude: number) {
  return page.getByTestId('river-map').evaluate(
    (el, target) => {
      const [lng, lat] = el.dataset.center!.split(',').map(Number);
      const scale = 512 * 2 ** Number(el.dataset.zoom);
      const merc = (value: number) => Math.log(Math.tan(Math.PI / 4 + (value * Math.PI) / 360));
      return {
        x: el.clientWidth / 2 + ((target.longitude - lng!) * scale) / 360,
        y: el.clientHeight / 2 - ((merc(target.latitude) - merc(lat!)) * scale) / (2 * Math.PI),
      };
    },
    { longitude, latitude },
  );
}
async function _clickMapCoordinate(page: Page, longitude: number, latitude: number) {
  const point = await mapViewportCoordinate(page, longitude, latitude);
  await page.locator('.maplibregl-canvas').click({ position: point });
}
/**
 * Find a screen point where the river LINE wins the app's hit test, clear of
 * every rendered label button (the H5 label pass puts name buttons directly
 * over corridor geometry, which intercepts fixed-coordinate clicks). Walks
 * the water's real geometry so thin corridors at statewide zoom are covered,
 * and mirrors the app's distance model, as scanPolygonPoint does for polygons.
 */
async function scanLinePoint(page: Page, riverId: string): Promise<{ x: number; y: number }> {
  // The conditions feed lands after first render and re-sorts label priority,
  // so the label snapshot (and the corridor's unblocked vertices) shift for a
  // few seconds. Retry the scan until a point wins.
  let lastError = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await scanLinePointOnce(page, riverId);
    } catch (e) {
      lastError = String(e);
      await page.waitForTimeout(900);
    }
  }
  throw new Error(`no tap point on ${riverId} after retries: ${lastError}`);
}
async function scanLinePointOnce(page: Page, riverId: string): Promise<{ x: number; y: number }> {
  return page.getByTestId('river-map').evaluate(async (el, target) => {
    const atlas = await (await fetch('/atlas/rivers.geojson')).json() as { features: GeoFeature[] };
    const feature = atlas.features.find((f) => f.properties.id === target);
    if (!feature) throw new Error('target water missing from rivers.geojson');
    const coords: Array<[number, number]> =
      feature.geometry.type === 'LineString'
        ? feature.geometry.coordinates
        : feature.geometry.coordinates.flat() as Array<[number, number]>;
    const m = window.__troutMap;
    if (!m) throw new Error('__troutMap not ready');
    // Bring the target corridor into view deterministically (zoom clicks keep
    // the statewide center, which can be nowhere near the water under test).
    const lons = coords.map((c) => c[0]!);
    const lats = coords.map((c) => c[1]!);
    m.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { duration: 0, padding: 60 },
    );
    await new Promise<void>((resolve) => m.once('idle', resolve));
    const layers = ['rivers-point-hit', 'rivers-water-hit', 'rivers-water-hit-outline', 'rivers-hit'];
    const origin = m.getContainer().getBoundingClientRect();
    const labels = [...document.querySelectorAll('.river-map-label')]
      .filter((el: Element) => el.getClientRects().length > 0)
      .map((el: Element) => {
        const b = el.getBoundingClientRect();
        return { x: b.x - origin.x, y: b.y - origin.y, w: b.width, h: b.height };
      });
    for (const [lon, lat] of coords) {
      const p = m.project([lon, lat]);
      if (p.x < 20 || p.y < 90 || p.x > m.getContainer().clientWidth - 20 || p.y > m.getContainer().clientHeight - 80) continue;
      if (labels.some((b: { x: number; y: number; w: number; h: number }) => p.x > b.x - 6 && p.x < b.x + b.w + 6 && p.y > b.y - 6 && p.y < b.y + b.h + 6)) continue;
      // Overlays (legend, chrome) cover the canvas — the app never sees a click here.
      const hitEl = document.elementFromPoint(origin.x + p.x, origin.y + p.y);
      if (!hitEl || !String(hitEl.className).includes('maplibregl-canvas')) continue;
      const feats = m.queryRenderedFeatures([[p.x - 5, p.y - 5], [p.x + 5, p.y + 5]], { layers });
      if (!feats.length) continue;
      // Mirror the app's own distance model exactly (TennesseeMap hit()).
      const segDist = (line: Array<[number, number]>) => {
        let nearest = Infinity;
        for (let i = 1; i < line.length; i++) {
          const a = m.project(line[i - 1]);
          const b = m.project(line[i]);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = dx * dx + dy * dy;
          const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
          nearest = Math.min(nearest, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
        }
        return nearest;
      };
      const best = feats
        .map((f) => ({
          id: String(f.properties.id),
          d:
            f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
              ? f.layer.id === 'rivers-water-hit'
                ? 6
                : 9
              : f.geometry.type === 'Point'
                ? Math.hypot(p.x - m.project(f.geometry.coordinates).x, p.y - m.project(f.geometry.coordinates).y)
                : segDist(
                  f.geometry.type === 'LineString'
                    ? [f.geometry.coordinates]
                    : f.geometry.coordinates,
                ),
        }))
        .sort((a, b) => a.d - b.d)[0];
      if (best?.id === target) return { x: p.x, y: p.y };
    }
    throw new Error(
      'no tap point; diag labels=' +
        labels.length +
        ' feats@center=' +
        m.queryRenderedFeatures().length +
        ' canvas=' +
        m.getContainer().clientWidth +
        'x' +
        m.getContainer().clientHeight +
        ' zoom=' +
        m.getZoom(),
    );
  }, riverId);
}
/**
 * Find a screen point where the oversized mock polygon WINS the app's hit
 * test (no real centerline within its 5px radius, clear of every rendered
 * label button) and click it. Catalog growth and the H5 label policy make
 * fixed coordinates flaky; the scan mirrors the app's own distance model.
 */
async function scanPolygonPoint(page: Page): Promise<{ x: number; y: number }> {
  return page.getByTestId('river-map').evaluate(async () => {
    const m = window.__troutMap;
    if (!m) throw new Error('__troutMap not ready');
    // Verify the mock polygon actually reached the map (the SW can serve the
    // cached original, bypassing page.route — hence serviceWorkers:'block').
    const atlas = await (await fetch('/atlas/rivers.geojson')).json() as { features: GeoFeature[] };
    const mock = atlas.features.find((f) => f.properties.id === 'beech-lake');
    if (mock?.properties?.source !== 'test-only-architecture-fixture')
      throw new Error('mock polygon not served (source=' + (mock?.properties?.source ?? 'none') + ')');
    // Fit the oversized mock polygon deterministically before scanning.
    m.fitBounds(
      [
        [-87.12, 36.23],
        [-86.48, 36.67],
      ],
      { duration: 0, padding: 60 },
    );
    await new Promise<void>((resolve) => m.once('idle', resolve));
    const layers = ['rivers-point-hit', 'rivers-water-hit', 'rivers-water-hit-outline', 'rivers-hit'];
    // Label rects are viewport-based; project() is container-based — align them.
    const origin = m.getContainer().getBoundingClientRect();
    const labels = [...document.querySelectorAll('.river-map-label')]
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => {
        const b = el.getBoundingClientRect();
        return { x: b.x - origin.x, y: b.y - origin.y, w: b.width, h: b.height };
      });
    const distance = (f: { layer: { id: string }; geometry: { type: string }; coordinates?: [number, number] }, point: { x: number; y: number }) => {
      if (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
        return f.layer.id === 'rivers-water-hit' ? 6 : 9;
      if (f.geometry.type === 'Point') {
        const pr = m.project(f.coordinates as [number, number]);
        return Math.hypot(point.x - pr.x, point.y - pr.y);
      }
      return 5.5;
    };
    for (let lon = -87.1; lon <= -86.5; lon += 0.008) {
      for (let lat = 36.24; lat <= 36.66; lat += 0.008) {
        const p = m.project([lon, lat]);
        if (p.x < 20 || p.y < 90 || p.x > m.getContainer().clientWidth - 20 || p.y > m.getContainer().clientHeight - 80) continue;
        if (labels.some((b) => p.x > b.x - 6 && p.x < b.x + b.w + 6 && p.y > b.y - 6 && p.y < b.y + b.h + 6)) continue;
        const hitEl = document.elementFromPoint(origin.x + p.x, origin.y + p.y);
        if (!hitEl || !String(hitEl.className).includes('maplibregl-canvas')) continue;
        const feats = m.queryRenderedFeatures([[p.x - 5, p.y - 5], [p.x + 5, p.y + 5]], { layers });
        if (!feats.length) continue;
        let bestId: string | null = null;
        let bestD = Infinity;
        for (const f of feats) {
          const d = distance(f, p);
          if (d < bestD) {
            bestD = d;
            bestId = String(f.properties.id);
          }
        }
        if (bestId === 'beech-lake') return { x: p.x, y: p.y };
      }
    }
    throw new Error(
        'no tap point; renderedBeech=' +
          m.queryRenderedFeatures().filter((f) => f.properties.id === 'beech-lake').length +
          ' labels=' +
          labels.length +
          ' zoom=' +
          m.getZoom(),
      );
  });
}
async function clickPolygonInterior(page: Page, urlPattern: RegExp): Promise<void> {
  // Two passes ~700ms apart must agree — the conditions feed re-sorts labels
  // as it lands. Under load that window is longer, so retry scan+click until
  // the selection actually lands.
  for (let attempt = 0; attempt < 6; attempt++) {
    const point = await scanPolygonPoint(page);
    const canvas = await page.locator('.maplibregl-canvas').boundingBox();
    const vx = canvas!.x + point.x;
    const vy = canvas!.y + point.y;
    await page.mouse.click(vx, vy);
    try {
      await page.waitForURL(urlPattern, { timeout: 2500 });
      return;
    } catch {
      // A late label re-sort can shadow the tap point — log what the click hit.
      const diag = await page.evaluate(
        ([x, y]) => {
          const el = document.elementFromPoint(x as number, y as number);
          return {
            at: el ? el.tagName + '.' + String(el.className).slice(0, 60) : 'none',
            url: location.search,
          };
        },
        [vx, vy],
      );
      console.log('POLY-CLICK-DIAG', JSON.stringify(diag));
    }
  }
  throw new Error('mock polygon tap point never stabilized');
}
async function mockCatalogPolygon(page: Page) {
  await page.route('**/atlas/rivers.geojson', async (route) => {
    const atlas = JSON.parse(await readFile(riversPath, 'utf8')) as {
      features: Array<{
        properties: Record<string, unknown> & { id: string };
        geometry: { type: string; coordinates: unknown };
      }>;
    };
    const feature = atlas.features.find((candidate) => candidate.properties.id === 'beech-lake')!;
    // Central Tennessee keeps the artificial polygon on-screen at the
    // product's enforced mobile minimum zoom. This is never persisted.
    const longitude = -86.8;
    const latitude = 36.45;
    feature.geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [longitude - 0.32, latitude - 0.22],
          [longitude + 0.32, latitude - 0.22],
          [longitude + 0.32, latitude + 0.22],
          [longitude - 0.32, latitude + 0.22],
          [longitude - 0.32, latitude - 0.22],
        ],
      ],
    };
    feature.properties = {
      ...feature.properties,
      waterbodyType: 'lake',
      source: 'test-only-architecture-fixture',
      approximate: true,
      bounds: [longitude - 0.32, latitude - 0.22, longitude + 0.32, latitude + 0.22],
      labelAnchor: [longitude, latitude],
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify(atlas),
    });
  });
}

test('the map opens full-bleed and the water atlas is summonable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.water-sidebar')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Use my location' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Map layers', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Center map on Tennessee' })).toBeVisible();
  // Stage-2 UI: search lives in the header, always visible — it is the atlas'
  // single path (DESIGN §identity), and typing summons results over the map.
  await expect(headerSearch(page)).toBeVisible();
  await ready(page);
  await headerSearch(page).fill('Caney');
  await expect(page.getByRole('option', { name: /caney/i }).first()).toBeVisible();
  await page.keyboard.press('Escape');
  // The field-atlas index (list + filters) remains reachable at ?atlas=1.
  await page.goto('/?atlas=1');
  await expect(page.getByRole('heading', { name: 'Find your water.' })).toBeVisible();
  // 148-water pack: trout mode = 103 trout + 37 unverified-species + 1 stocked warmwater.
  await expect(page.locator('.water-row')).toHaveCount(141);
  await page.getByRole('button', { name: 'Close water list' }).click();
  // The atlas has one chrome path: the layers panel no longer duplicates it,
  // and the menu no longer carries 'Open water atlas' or 'Browse all waters'.
  await page.getByRole('button', { name: 'Map layers', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Map layers' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Browse \d+ waters/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('group', { name: 'Map layers' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open water atlas' })).toHaveCount(0);
  await expect(
    page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Explore waters' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Browse all waters' }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await noOverflow(page);
});

test('fluid tooltips appear on hover and keyboard focus and never trap focus', async ({
  page,
}) => {
  await page.goto('/');
  await ready(page);
  const layers = page.getByRole('button', { name: 'Map layers', exact: true });
  const tooltipOpacity = () => layers.evaluate((el) => getComputedStyle(el, '::after').opacity);
  expect(await tooltipOpacity()).toBe('0');
  await layers.hover();
  await expect.poll(tooltipOpacity).toBe('1');
  await layers.focus();
  await expect.poll(tooltipOpacity).toBe('1');
  // Focus moves straight through the group — no tooltip trap.
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.className)).toContain('map-fab');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
    'Use my location',
  );
});

test('control group buttons meet the 44px touch minimum', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  for (const name of ['Center map on Tennessee', 'Map layers', 'Use my location']) {
    const box = (await page.getByRole('button', { name }).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('Tennessee recentering resets the camera from a zoomed view', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page
    .getByRole('button', { name: 'Zoom in', exact: true })
    .click();
  await expect
    .poll(async () => Number(await page.getByTestId('river-map').getAttribute('data-zoom')))
    .toBeGreaterThan(8);
  await page.getByRole('button', { name: 'Center map on Tennessee' }).click();
  // The statewide fit sits at the product's enforced state zoom, far below the
  // zoomed-in view.
  await expect
    .poll(async () => Number(await page.getByTestId('river-map').getAttribute('data-zoom')))
    .toBeLessThan(7.5);
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
  // Focus lands back on the visible search surface (the header search).
  await expect(headerSearch(page)).toBeFocused();
});

test('legend speaks trout conditions in trout mode and stays honest in all-fish mode', async ({
  page,
}) => {
  await page.goto('/?atlas=1');
  await ready(page);
  // The legend collapses to a corner chip; summon the panel first. Stage-2
  // legend markup: the glass panel carries the title text directly (the old
  // .map-legend .legend-title classes are gone with the restyle).
  await page.getByRole('button', { name: 'Show legend' }).click();
  // The panel's aria-label carries the mode title (see MapLegend panelLabel).
  const troutLegend = page.locator('[aria-label="Trout conditions legend"]');
  await expect(troutLegend).toContainText('Trout conditions');
  await expect(troutLegend).not.toContainText('Warmwater');
  await expect(troutLegend).not.toContainText('Fishability');
  await page.getByRole('button', { name: 'All fish', exact: true }).click();
  const guideLegend = page.locator('[aria-label="Water guide legend"]');
  await expect(guideLegend).toContainText('Water guide');
  await expect(guideLegend).toContainText('Warmwater — bass & panfish');
  await expect(page.locator('.map-help')).toContainText(
    'Good, Fair, and Poor describe trout waters only',
  );
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
  await select(page, 'Caney', /center hill tailwater/i);
  await page.waitForTimeout(450); // Wait for the defined 300 ms camera transition, not network readiness.
  const camera = await page.getByTestId('river-map').getAttribute('data-center');
  await select(page, 'Tellico lake');
  await page.waitForTimeout(450);
  await page.goBack();
  await expect(page).toHaveURL(/river=caney-fork-river/);
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-center', camera!);
  await page.goForward();
  await expect(page).toHaveURL(/river=tellico-lake/);
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
    // Stage-2 UI: the mobile inspector is the vaul bottom sheet (.river-sheet),
    // not the old CSS .water-sidebar.is-inspecting panel.
    const sheet = page.locator('.river-sheet');
    const box = await sheet.boundingBox();
    expect(box!.y).toBeGreaterThan(300);
    for (const label of ['Conditions', 'Hatches', 'Stocking', 'Reports', 'Log'])
      await expect(page.getByRole('tab', { name: label, exact: true })).toBeInViewport();
    await page.getByRole('button', { name: 'Expand details', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Show map', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close river details', exact: true }).click();
    await expect(headerSearch(page)).toBeFocused();
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

test.describe('a missing served catalog falls back to the bundled catalog', () => {
  // The SW runtime-caches /v1/streams (B10 fix made that route live) and SW
  // fetches bypass page.route — block the worker so the 503 mock is honored.
  test.use({ serviceWorkers: 'block' });

  // 2026-09-08 outage fix: when the served catalog is unavailable the app loads
  // the BUNDLED client catalog and keeps working — it must NOT show the old
  // "Catalog unavailable" error state.
  test('keeps map tools and serves the bundled catalog fallback', async ({ page }) => {
    await page.route('**/v1/streams', (route) =>
      route.fulfill({ status: 503, body: 'Unavailable' }),
    );
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Map layers', exact: true })).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
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
  // Full catalog: all 148 waters, every species state.
  await expect(page.locator('.list-row')).toHaveCount(148);
});

test('offline and unassessed presentation never claim live or zero Poor', async ({
  page,
  context,
}) => {
  await page.goto('/?river=brush-creek-cocke');
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Not assessed', exact: true })).toBeVisible();
  await expect(page.locator('.score-disc')).toHaveCount(0);
  await context.setOffline(true);
  await expect(page.locator('.offline-banner')).toContainText('Offline');
  await expect(page.locator('.freshness')).toContainText('Offline');
  await expect(page.locator('.assessment')).not.toContainText('Live');
});

test('clicking actual river geometry opens its inspector', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await expect(page.locator('.water-sidebar')).toBeHidden();
  // At statewide zoom the corridor's tappable surface sits under the H5
  // labels and lake surfaces; zoom in first so the corridor spreads clear.
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.waitForTimeout(250);
  }
  // The tap point is scanned at runtime: fixed coordinates sit under the
  // label buttons, which correctly win the pointer.
  const point = await scanLinePoint(page, 'caney-fork-river');
  await page.locator('.maplibregl-canvas').click({ position: point });
  await expect(page).toHaveURL(/river=caney-fork-river/);
  await expect(page.locator('#river-inspector')).toBeVisible();
});

test('clicking river geometry opens the same inspector as a mobile sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await ready(page);
  await expect(page.locator('.water-sidebar')).toBeHidden();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(250);
  }
  const point = await scanLinePoint(page, 'caney-fork-river');
  await page.locator('.maplibregl-canvas').click({ position: point });
  await expect(page).toHaveURL(/river=caney-fork-river/);
  const sheet = page.locator('.river-sheet');
  await expect(sheet).toBeVisible();
  expect((await sheet.boundingBox())!.y).toBeGreaterThan(300);
});

test('still waters are labeled, tappable, and honestly presented', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  // H5 prominence: every catalog still water carries its label; major lakes
  // stay visible statewide, pocket ponds appear at local zooms.
  await expect(page.locator('.still-water-label')).toHaveCount(43);
  // Edmund Orgill Lake: a catalog trout still water whose label is visible at
  // the default camera (assessed pocket lakes title at any zoom; Kentucky
  // Lake is unverified-species and correctly titles only in all-fish mode,
  // and Dale Hollow's anchor sits above the default camera's top cover).
  await expect(page.locator('[data-river-id="edmund-orgill-lake"]')).toBeVisible();
  await page.locator('[data-river-id="edmund-orgill-lake"]').click();
  await expect(page).toHaveURL(/river=edmund-orgill-lake/);
  await expect(page.getByRole('heading', { name: 'Edmund-Orgill Park', exact: true })).toBeVisible();
  // A pocket pond reached by search: trout species + no assessment reads
  // "Not assessed" — never a fabricated band.
  await select(page, 'Cameron Brown');
  await expect(page).toHaveURL(/river=cameron-brown-lake/);
  await expect(page.getByRole('heading', { name: 'Cameron Brown Lake', exact: true })).toBeVisible();
  // M2: the catalog's waterbody type is presented verbatim — no invented size
  // classification, so even a small lake never reads "small". (The demo feed
  // assesses this water; the honest-unassessed copy is covered above.)
  await expect(page.getByText('Lake · Stocking program listed')).toBeVisible();
});

test.describe('mocked-polygon selection', () => {
  // The SW precache serves /atlas/rivers.geojson from cache, bypassing
  // page.route — block the worker so the mock is honored.
  test.use({ serviceWorkers: 'block' });
  test('a catalog polygon uses the shared label, filter, and inspector path', async ({ page }) => {
    await mockCatalogPolygon(page);
    await page.goto('/');
    await ready(page);
    await expect(page.locator('.water-sidebar')).toBeHidden();
    await expect(page.locator('[data-river-id="beech-lake"]')).toHaveClass(/still-water-label/);
  // Deliberately oversized test geometry keeps its open surface separable from
  // the label at state zoom; no production geometry is written. The tap point
  // is scanned at runtime — the 146-pack's line density defeats fixed points.
  await clickPolygonInterior(page, /river=beech-lake/);
  await expect(page).toHaveURL(/river=beech-lake/);
  await expect(page.getByRole('heading', { name: 'Beech Lake', exact: true })).toBeVisible();
  // The demo feed assesses beech-lake; the inspector path itself is the point.
    await expect(page.locator('#river-inspector .assessment')).toBeVisible();
  });
});

test.describe('touch polygon selection', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  test('opens the same mobile fiche from the polygon surface', async ({ page }) => {
    await mockCatalogPolygon(page);
    await page.goto('/');
    await ready(page);
    // H1: the mobile overview is wider now — zoom in twice so the oversized
    // mock polygon fills enough screen for a raw interior tap to win. The tap
    // point is scanned at runtime for the same reason as the desktop test.
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(900);
    let tap: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 6 && !tap; attempt++) {
      try {
        tap = await page.getByTestId('river-map').evaluate(() => {
          const m = window.__troutMap;
    if (!m) throw new Error('__troutMap not ready');
          const layers = ['rivers-point-hit', 'rivers-water-hit', 'rivers-water-hit-outline', 'rivers-hit'];
          const origin = m.getContainer().getBoundingClientRect();
          const labels = [...document.querySelectorAll('.river-map-label')]
            .filter((el) => el.getClientRects().length > 0)
            .map((el) => {
              const b = el.getBoundingClientRect();
              return { x: b.x - origin.x, y: b.y - origin.y, w: b.width, h: b.height };
            });
          for (let lon = -87.1; lon <= -86.5; lon += 0.008) {
            for (let lat = 36.24; lat <= 36.66; lat += 0.008) {
              const p = m.project([lon, lat]);
              if (p.x < 20 || p.y < 150 || p.x > m.getContainer().clientWidth - 20 || p.y > m.getContainer().clientHeight - 260) continue;
              if (labels.some((b) => p.x > b.x - 6 && p.x < b.x + b.w + 6 && p.y > b.y - 6 && p.y < b.y + b.h + 6)) continue;
              const hitEl = document.elementFromPoint(origin.x + p.x, origin.y + p.y);
              if (!hitEl || !String(hitEl.className).includes('maplibregl-canvas')) continue;
              const feats = m.queryRenderedFeatures([[p.x - 5, p.y - 5], [p.x + 5, p.y + 5]], { layers });
              let bestId: string | null = null;
              let bestD = Infinity;
              for (const f of feats) {
                const d = f.geometry.type === 'Polygon' ? (f.layer.id === 'rivers-water-hit' ? 6 : 9) : 5.5;
                if (d < bestD) {
                  bestD = d;
                  bestId = String(f.properties.id);
                }
              }
              if (bestId === 'beech-lake') return { x: p.x, y: p.y };
            }
          }
          throw new Error('no touchable point where the mock polygon wins');
        });
      } catch {
        await page.waitForTimeout(900);
      }
    }
    if (!tap) throw new Error('mock polygon tap point never stabilized');
    const canvas = await page.locator('.maplibregl-canvas').boundingBox();
    await page.touchscreen.tap(canvas!.x + tap.x, canvas!.y + tap.y);
    await expect(page).toHaveURL(/river=beech-lake/);
    await expect(page.locator('.river-sheet')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Beech Lake', exact: true })).toBeVisible();
  });
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
  // The tails and shape cards carry descriptive sub-lines, so their accessible
  // names extend past the headline — match the headline prefix.
  await page.getByRole('button', { name: /^2 tails/ }).click();
  await page
    .getByRole('button', { name: 'Flat plates (lamellae) along the sides', exact: true })
    .click();
  await page.getByRole('button', { name: /^slender/ }).click();
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
  const mapBounds = (await page.getByTestId('river-map').boundingBox())!;
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect
    .poll(async () =>
      Math.round(Number(await page.getByTestId('river-map').getAttribute('data-zoom'))),
    )
    .toBe(8);
  // A fixed North Carolina coordinate beyond East Tennessee remains map ground,
  // not the former rectangular terrain acquisition extent.
  let outside = await mapViewportCoordinate(page, -82.9, 35.4);
  await checkPixel(
    Math.round(mapBounds.x + outside.x),
    Math.round(mapBounds.y + outside.y),
    [16, 33, 37],
  );
  await page.screenshot({ path: screenshots + '/nightfall-east-8.png' });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page.locator('.maplibregl-canvas').press('ArrowRight');
    await page.waitForTimeout(250);
  }
  await expect
    .poll(async () =>
      Math.round(Number(await page.getByTestId('river-map').getAttribute('data-zoom'))),
    )
    .toBe(9);
  outside = await mapViewportCoordinate(page, -82.9, 35.4);
  await checkPixel(
    Math.round(mapBounds.x + outside.x),
    Math.round(mapBounds.y + outside.y),
    [16, 33, 37],
  );
  await page.screenshot({ path: screenshots + '/nightfall-east-9.png' });
  await page.getByRole('button', { name: 'Switch to Daybreak theme', exact: true }).click();
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'daybreak');
  await checkPixel(
    Math.round(mapBounds.x + outside.x),
    Math.round(mapBounds.y + outside.y),
    [221, 228, 223],
  );
  await page.screenshot({ path: screenshots + '/daybreak-east-9.png' });
});

test('representative desktop and mobile inspector views remain readable', async ({ page }) => {
  const screenshots = fileURLToPath(new URL('../../artifacts/screenshots/', import.meta.url));
  await mkdir(screenshots, { recursive: true });
  await page.goto('/?river=caney-fork-river&month=9&terrain=1&basemap=paper');
  await ready(page);
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'daybreak');
  // Month 9 has an abundance tie; dominantHatch breaks it by taxonId, which
  // lands on the midge — deterministic against the committed fixture pack.
  await expect(page.locator('.hatch-preview')).toContainText('Midge Larva');
  await page.screenshot({ path: screenshots + '/daybreak-desktop-inspector.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch to Nightfall theme', exact: true }).click();
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'nightfall');
  const selectedLabel = page.locator('.river-map-label.selected');
  await expect(selectedLabel).toBeVisible();
  const labelBounds = await selectedLabel.boundingBox();
  const sheetBounds = await page.locator('.river-sheet').boundingBox();
  expect(labelBounds!.y + labelBounds!.height).toBeLessThan(sheetBounds!.y);
  await expect(page.getByRole('tab', { name: 'Log', exact: true })).toBeInViewport();
  await noOverflow(page);
  await page.screenshot({ path: screenshots + '/nightfall-mobile-inspector.png' });
  await page.getByRole('button', { name: 'Expand details', exact: true }).click();
  await expect(page.locator('.river-map-label').filter({ visible: true })).toHaveCount(0);
  // Stage-2 UI: the vaul sheet element is always 100dvh tall — the snap
  // point moves it via transform. Expanded snap is 0.82, so the sheet's top
  // edge sits at ~18% of the viewport.
  const viewportHeight = page.viewportSize()!.height;
  await expect
    .poll(async () => (await page.locator('.river-sheet').boundingBox())!.y / viewportHeight)
    .toBeLessThan(0.2);
  await expect(page.locator('.metrics')).toBeInViewport();
  await page.screenshot({ path: screenshots + '/nightfall-mobile-expanded.png' });
});
