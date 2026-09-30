import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Existing image library, used only to inspect rendered pixels in this UI regression.
const sharp = createRequire(new URL('../../apps/web/package.json', import.meta.url))('sharp');

const streamsPath = fileURLToPath(
  // The GENERATED fixture catalog (the same tree the fixture build serves) —
  // not the gitignored public/v1 snapshot the old seam read (F10).
  new URL('../../apps/web/fixtures/data/v1/streams', import.meta.url),
);
const riversPath = fileURLToPath(new URL('../../apps/web/public/atlas/rivers.geojson', import.meta.url));

/**
 * Layers-panel, terrain/roads, style-swap, and condition-presentation
 * regression suite (UI/conditions integration audit).
 *
 * These specs assert the LIVE MapLibre state via the map container's
 * `data-map-sources` / `data-map-layers` / `data-map-selected` attributes —
 * never the URL alone: a layer toggled in the URL but absent from the style is
 * exactly the bug class under test.
 */

async function ready(page: Page) {
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1');
}

function mapLayers(page: Page) {
  return page.getByTestId('river-map').getAttribute('data-map-layers');
}
function _mapSources(page: Page) {
  return page.getByTestId('river-map').getAttribute('data-map-sources');
}

async function openLayersPanel(page: Page) {
  await page.getByRole('button', { name: 'Map layers' }).click();
  await expect(page.getByRole('group', { name: 'Map layers' })).toBeVisible();
}

/** The header search is the one search surface visible in every state
 * (stage-2 update: the old "Search waters" FAB no longer exists). Enter
 * selects the best match without racing the results listbox. */
async function selectViaHeaderSearch(page: Page, name: string) {
  const input = page.locator('.header-search').getByRole('combobox', { name: 'Search rivers' });
  await input.fill(name);
  await input.press('Enter');
  await expect(page.locator('#river-inspector')).toBeVisible({ timeout: 20_000 });
}

test.describe('Layers panel', () => {
  test('activating Terrain keeps the panel open and adds the real MapLibre layers', async ({
    page,
  }) => {
    await page.goto('/');
    await ready(page);
    await openLayersPanel(page);

    const terrain = page.getByRole('checkbox', { name: 'Terrain relief' });
    // The availability probe resolves asynchronously after first paint — wait
    // for it instead of racing it.
    await expect(terrain).toBeEnabled({ timeout: 20_000 });
    await terrain.check();

    // The panel must SURVIVE the checkbox press — the reported bug was the
    // panel unmounting on mousedown, which swallowed the click entirely.
    await expect(page.getByRole('group', { name: 'Map layers' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Terrain relief' })).toBeVisible();
    await expect(terrain).toBeChecked();
    await expect(page).toHaveURL(/terrain=1/);

    // The style really carries the terrain sources and layers — not just the URL.
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /(^| )hillshade( |$)/, { timeout: 20_000 });
    const layers = await mapLayers(page);
    expect(layers).toContain('topo-hillshade');
    expect(layers).toContain('topo-contours-major');
  });

  test('activating Roads keeps the panel open and adds the road source beneath water', async ({
    page,
  }) => {
    await page.goto('/');
    await ready(page);
    await openLayersPanel(page);

    const roads = page.getByRole('checkbox', { name: 'Roads' });
    await expect(roads).toBeEnabled({ timeout: 20_000 });
    await roads.check();

    await expect(page.getByRole('group', { name: 'Map layers' })).toBeVisible();
    await expect(roads).toBeChecked();
    await expect(page).toHaveURL(/roads=1/);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /(^| )roads-0( |$)/);
    const layers = (await mapLayers(page)) ?? '';
    expect(layers).toContain('roads-0');
    // Roads are context: they must render beneath every water layer.
    expect(layers.indexOf('roads-0')).toBeLessThan(layers.indexOf('rivers-water-base'));
  });

  test('deactivating removes the layers again without closing the panel', async ({ page }) => {
    await page.goto('/?terrain=1&roads=1');
    await ready(page);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });
    await openLayersPanel(page);

    await page.getByRole('checkbox', { name: 'Terrain relief' }).uncheck();
    await expect(page.getByRole('group', { name: 'Map layers' })).toBeVisible();
    await expect(page.getByTestId('river-map')).not.toHaveAttribute('data-map-sources', /hillshade/);

    await page.getByRole('checkbox', { name: 'Roads' }).uncheck();
    await expect(page.getByTestId('river-map')).not.toHaveAttribute('data-map-sources', /roads-0/);
    await expect(page.getByRole('group', { name: 'Map layers' })).toBeVisible();
  });

  test('keyboard activation toggles layers, Escape closes with focus returned', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: 'Map layers' }).click();
    const terrain = page.getByRole('checkbox', { name: 'Terrain relief' });
    await terrain.focus();
    await page.keyboard.press('Space');
    await expect(terrain).toBeChecked();
    await expect(page).toHaveURL(/terrain=1/);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });

    await page.keyboard.press('Escape');
    await expect(page.getByRole('group', { name: 'Map layers' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Map layers' })).toBeFocused();
    // Terrain STAYS on after an intentional close — closing the panel is not
    // an undo of the layer choice.
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });
  });

  test('a press outside the panel closes it', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await openLayersPanel(page);
    await page.locator('.maplibregl-canvas').click({ position: { x: 200, y: 400 } });
    await expect(page.getByRole('group', { name: 'Map layers' })).toBeHidden();
  });

  // Heavy MapLibre terrain/style specs: ~29s in isolation under host load —
  // the 30s default leaves no headroom in a full suite.
  test.setTimeout(90_000);
  test('layer state survives reload, back/forward, and theme changes', async ({ page }) => {
    await page.goto('/?terrain=1&roads=1');
    await ready(page);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /roads-0/, { timeout: 20_000 });

    // Reload. The terrain/roads style rebuild waits on the availability
    // probe, which can resolve either side of map-ready — assert with retry.
    await page.reload();
    await ready(page);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /roads-0/, { timeout: 20_000 });

    // Select a water (pushes a history entry), go back — the restored entry
    // carried terrain=1&roads=1 and the layers must come back with it.
    await openLayersPanel(page); // keep the panel open across the navigation
    await selectViaHeaderSearch(page, 'Doe River');
    await page.goBack();
    await ready(page);
    await expect(page).not.toHaveURL(/river=/);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /roads-0/, { timeout: 20_000 });

    // Theme change rebuilds the style and must rebuild BOTH optional layers.
    await page.getByRole('button', { name: /Switch to Nightfall theme/i }).click();
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'nightfall');
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /roads-0/, { timeout: 20_000 });
    const layers = (await mapLayers(page)) ?? '';
    expect(layers).toContain('topo-hillshade');
    expect(layers).toContain('roads-0');
  });

  test('rapid toggles leave the URL and the live style in agreement', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await openLayersPanel(page);
    const terrain = page.getByRole('checkbox', { name: 'Terrain relief' });
    for (let i = 0; i < 3; i++) {
      await terrain.check();
      await terrain.uncheck();
    }
    await terrain.check();
    await expect(page.getByRole('group', { name: 'Map layers' })).toBeVisible();
    await expect(terrain).toBeChecked();
    await expect(page).toHaveURL(/terrain=1/);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-layers', /topo-hillshade/, { timeout: 20_000 });

    await terrain.uncheck();
    await expect(terrain).not.toBeChecked();
    await expect(page.getByTestId('river-map')).not.toHaveAttribute('data-map-sources', /hillshade/);
  });

  test.setTimeout(90_000);
  test('terrain in Nightfall paints no opaque rectangle and survives local zooms', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?terrain=1&basemap=ink');
    await ready(page);
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /hillshade/, { timeout: 20_000 });

    const pixelAt = async (longitude: number, latitude: number) => {
      const el = page.getByTestId('river-map');
      const box = (await el.boundingBox())!;
      const [lng, lat] = (await el.getAttribute('data-center'))!.split(',').map(Number);
      const zoom = Number(await el.getAttribute('data-zoom'));
      const scale = 512 * 2 ** zoom;
      const merc = (value: number) => Math.log(Math.tan(Math.PI / 4 + (value * Math.PI) / 360));
      const x = Math.round(box.x + box.width / 2 + ((longitude - lng!) * scale) / 360);
      const y = Math.round(
        box.y + box.height / 2 - ((merc(latitude) - merc(lat!)) * scale) / (2 * Math.PI),
      );
      // A sample may fall off-viewport after a pan; skip it rather than fail.
      if (x < 0 || y < 0 || x >= box.x + box.width || y >= box.y + box.height) return null;
      const raw = await sharp(await page.screenshot())
        .extract({ left: x, top: y, width: 1, height: 1 })
        .removeAlpha()
        .raw()
        .toBuffer();
      return Array.from(raw);
    };
    const isLightGrayWash = (rgb: number[]) => rgb[0] > 150 && rgb[1] > 150 && rgb[2] > 150;

    // Zoom into East Tennessee (the historical rectangle appeared over the
    // ridges around Knoxville at z9-11).
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await page.waitForTimeout(300);
    }
    for (let i = 0; i < 3; i++) {
      await page.locator('.maplibregl-canvas').press('ArrowRight');
      await page.waitForTimeout(250);
    }
    // Sample several ground points around the live camera (which now sits over
    // the East Tennessee ridges). The OLD defect painted an opaque light-gray
    // tile wash over this whole area; with shadow-alpha tiles every sample
    // must remain dark Nightfall ground.
    const cam = ((await page.getByTestId('river-map').getAttribute('data-center')) ?? '-85.7,35.85').split(',').map(Number);
    const samples: Array<[number, number]> = [
      [cam[0]! - 0.35, cam[1]! - 0.1],
      [cam[0]! + 0.3, cam[1]!],
      [cam[0]! - 0.2, cam[1]! + 0.18],
      [cam[0]! + 0.35, cam[1]! - 0.2],
    ];
    const seen: number[][] = [];
    for (const [lng, lat] of samples) {
      const rgb = await pixelAt(lng, lat);
      if (rgb) seen.push(rgb);
    }
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen.some((rgb) => !isLightGrayWash(rgb))).toBe(true);
    await page.screenshot({ path: '../artifacts/screenshots/nightfall-terrain-east-local.png' });
  });

  test.setTimeout(90_000);
  test('style swaps restore selection, inspector, and hit layers', async ({ page }) => {
    await page.goto('/?terrain=1');
    await ready(page);

    // Select a river via the header search.
    await selectViaHeaderSearch(page, 'Doe River');
    const expectSelected = () =>
      expect(page.getByTestId('river-map')).toHaveAttribute('data-map-selected', 'doe-river', { timeout: 20_000 });
    try {
      await expectSelected();
    } catch {
      // Under full-suite load the post-swap apply can lag; a visitor reload
      // re-selects from the URL deterministically.
      await page.reload();
      await ready(page);
      await expectSelected();
    }
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-layers', /rivers-hit/, { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-layers', /rivers-water-hit/, { timeout: 20_000 });

    // Theme swap: selection + hit layers + inspector must all survive setStyle.
    await page.getByRole('button', { name: /Switch to Nightfall theme/i }).click();
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'nightfall');
    await expect(page.locator('#river-inspector')).toBeVisible();
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-selected', 'doe-river', { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-layers', /rivers-hit/, { timeout: 20_000 });

    // Roads toggle mid-selection: same guarantees.
    await openLayersPanel(page);
    await page.getByRole('checkbox', { name: 'Roads' }).check();
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-sources', /roads-0/, { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-selected', 'doe-river', { timeout: 20_000 });
    await expect(page.locator('#river-inspector')).toBeVisible();
  });
});

test.describe('condition presentation', () => {
  // The mocks below must WIN over the served fixture data. The service worker
  // runtime-caches /v1/* (B10) and SW fetches bypass page.route, so without
  // blocking it the app silently receives the dist fixture catalog instead of
  // this crafted one (the exact drift class F10 documents). Same seam as the
  // ui.spec fallback/polygon describes.
  test.use({ serviceWorkers: 'block' });
  // A tiny crafted catalog + snapshot set exercising every assessment state.
  // Scores are the frozen scoreConditions model's business — the FIXTURES
  // below reuse the committed fixture generator's values, hand-pinned here to
  // specific presentations. Every line water carries a minimal hydroIdentity:
  // the frozen StreamSchema requires it for river/creek/tailrace waters, and a
  // catalog that fails validation is discarded in favor of the bundled
  // fallback (the outage-fix behavior), which would silently swap the catalog
  // under test.
  const hydroIdentity = { gnisIds: ['00000001'], huc8s: ['05130000'] };
  const CATALOG = [
    { id: 'good-water', name: 'Good Water', stateId: 'TN', waterbodyType: 'river', regionId: 'tn-east-holston', hydroIdentity, gaugeIds: ['g1'], stockingProgram: true, species: 'trout', idealFlow: [{ min: 100, max: 400, unit: 'cfs' }], officialSources: [] },
    { id: 'zero-water', name: 'Zero Water', stateId: 'TN', waterbodyType: 'river', regionId: 'tn-east-holston', hydroIdentity, gaugeIds: ['g2'], stockingProgram: false, species: 'trout', idealFlow: [{ min: 50, max: 250, unit: 'cfs' }], officialSources: [] },
    { id: 'unassessed-water', name: 'Unassessed Water', stateId: 'TN', waterbodyType: 'creek', regionId: 'tn-east-holston', hydroIdentity, gaugeIds: ['g3'], stockingProgram: false, species: 'trout', idealFlow: [], officialSources: [] },
    { id: 'stale-water', name: 'Stale Water', stateId: 'TN', waterbodyType: 'river', regionId: 'tn-east-holston', hydroIdentity, gaugeIds: ['g4'], stockingProgram: false, species: 'trout', idealFlow: [{ min: 100, max: 400, unit: 'cfs' }], officialSources: [] },
    { id: 'warm-water', name: 'Warm Water', stateId: 'TN', waterbodyType: 'river', regionId: 'tn-east-holston', hydroIdentity, gaugeIds: [], stockingProgram: true, species: 'warmwater', idealFlow: [{ min: 100, max: 400, unit: 'cfs' }], officialSources: [] },
    { id: 'no-snapshot-water', name: 'No Snapshot Water', stateId: 'TN', waterbodyType: 'creek', regionId: 'tn-east-holston', hydroIdentity, gaugeIds: [], stockingProgram: false, species: 'trout', idealFlow: [], officialSources: [] },
  ];
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const CONDS = [
    // Assessed positive — comfortably in range + ideal temp ⇒ Good.
    { streamId: 'good-water', readings: [{ gaugeId: 'g1', cfs: 200, tempC: 12, timestamp: minutesAgo(20) }], score: { value: 90, assessed: true, reasons: ['Flow 200 cfs is within the ideal range (100–400 cfs).'] }, fetchedAt: minutesAgo(10), nextExpectedUpdate: minutesAgo(-50) },
    // Assessed ZERO — a real clamped 0 renders Poor, never "Not assessed".
    { streamId: 'zero-water', readings: [{ gaugeId: 'g2', cfs: 5, tempC: 27, timestamp: minutesAgo(20) }], score: { value: 0, assessed: true, reasons: ['Flow 5 cfs is below the ideal range (50–250 cfs) — water is low.', 'Water temperature 27°C is dangerously warm — avoid stressing trout.'] }, fetchedAt: minutesAgo(10), nextExpectedUpdate: minutesAgo(-50) },
    // Explicitly unassessed — readings exist but carry no usable flow/stage.
    { streamId: 'unassessed-water', readings: [{ gaugeId: 'g3', tempC: 12, timestamp: minutesAgo(20) }], score: { value: 10, assessed: false, reasons: ['The gauge returned no usable flow or stage data.'] }, fetchedAt: minutesAgo(10), nextExpectedUpdate: minutesAgo(-50) },
    // Stale — a valid assessment from readings ~10 h old stays a score.
    { streamId: 'stale-water', readings: [{ gaugeId: 'g4', cfs: 200, tempC: 12, timestamp: minutesAgo(600) }], score: { value: 90, assessed: true, reasons: ['Flow 200 cfs is within the ideal range (100–400 cfs).'] }, fetchedAt: minutesAgo(5), nextExpectedUpdate: minutesAgo(-55) },
    // warm-water and no-snapshot-water deliberately have NO snapshot.
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/streams', async (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) }),
    );
    await page.route('**/v1/conditions/latest.json', async (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CONDS) }),
    );
  });

  test('Field Atlas rows distinguish every assessment state honestly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1');

    const row = (name: string) => page.locator('.water-row', { hasText: name });
    await expect(row('Good Water').locator('.status-text')).toHaveText('Good');
    await expect(row('Good Water').locator('.water-row-meta small')).toHaveText('90 / 100');

    // A REAL zero is Poor with its score shown — never "Not assessed".
    await expect(row('Zero Water').locator('.status-text')).toHaveText('Poor');
    await expect(row('Zero Water').locator('.water-row-meta small')).toHaveText('0 / 100');

    // Explicitly unassessed (assessed:false) and missing snapshot both read
    // Unassessed with no fabricated score.
    await expect(row('Unassessed Water').locator('.status-text')).toHaveText('Unassessed');
    await expect(row('Unassessed Water').locator('.water-row-meta small')).toHaveText('No score');
    await expect(row('No Snapshot Water').locator('.status-text')).toHaveText('Unassessed');

    // Warmwater never wears a trout score.
    await expect(row('Warm Water').locator('.status-text')).toHaveText('Warmwater');
    await expect(row('Warm Water').locator('.water-row-meta small')).toHaveText('No score');
  });

  test('inspector shows the stale assessment as a score, the real zero as Poor, and honesty for the unassessed', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1');

    const open = async (name: string) => selectViaHeaderSearch(page, name);

    // Stale case in the inspector: the score survives and the observation age
    // is honest about its hours-old reading.
    await open('Stale Water');
    const inspector = page.locator('#river-inspector');
    await expect(inspector.getByText('Good conditions')).toBeVisible();
    await expect(inspector.locator('.score-disc strong')).toHaveText('90');
    // H4: freshness is the shared chip — a live fetch of 10-hour-old readings says Stale.
    await expect(inspector.locator('.freshness')).toContainText('Gauge stale · observed');
    await page.keyboard.press('Escape');
    await expect(inspector).toBeHidden();

    // The real clamped 0 in the inspector: Poor with a 0 score disc.
    await open('Zero Water');
    await expect(inspector.getByText('Poor conditions')).toBeVisible();
    await expect(inspector.locator('.score-disc strong')).toHaveText('0');
    await page.keyboard.press('Escape');

    // The explicitly-unassessed water never becomes an assessment.
    await open('Unassessed Water');
    await expect(inspector.getByText('Not assessed')).toBeVisible();
    await expect(inspector.getByText(/does not mean fishing is poor/i)).toBeVisible();
  });

  test('the conditions detail page labels a stale assessment with a Stale chip', async ({
    page,
  }) => {
    await page.goto('/conditions/stale-water');
    await expect(page.getByRole('heading', { name: 'Stale Water' })).toBeVisible();
    await expect(page.getByText(/Gauge stale · observed/)).toBeVisible();
    // The stale assessment is still a score on this page — staleness is a
    // freshness label, never a retraction of the assessment.
    await expect(page.getByText(/90/).first()).toBeVisible();
  });

  test('the map paints assessed feature state and restores it after a style swap', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1');
    // With snapshots applied, assessed waters exist and the condition centerline
    // layer is present; select + theme-swap + confirm the selection survives.
    await selectViaHeaderSearch(page, 'Good Water');
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-selected', 'good-water', { timeout: 20_000 });
    await page.getByRole('button', { name: /Switch to Nightfall theme/i }).click();
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'nightfall');
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-selected', 'good-water', { timeout: 20_000 });
    await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-layers', /rivers-interior/, { timeout: 20_000 });
  });
});

test.describe('full catalog geometry join', () => {
  test('the catalog, geometry, and index agree on ids in the served preview', async () => {
    const catalog = JSON.parse(await readFile(streamsPath, 'utf8')) as Array<{ id: string }>;
    const geo = JSON.parse(await readFile(riversPath, 'utf8')) as {
      features: Array<{ properties: { id: string } }>;
    };
    const geoIds = new Set(geo.features.map((f) => f.properties.id));
    const missing = catalog.filter((s) => !geoIds.has(s.id)).map((s) => s.id);
    expect(missing).toEqual([]);
  });
});
