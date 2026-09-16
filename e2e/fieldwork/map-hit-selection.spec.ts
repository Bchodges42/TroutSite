import { expect, test, type Page } from '@playwright/test';

/**
 * Map hit-selection regression (fix/map-hit-selection).
 *
 * Proves the CANVAS hit-test path end to end, not the label/search paths the
 * other fieldwork specs already cover:
 *   1. A click on a rendered Caney Fork centerline vertex (pixel computed from
 *      the live `rivers` source geometry + the feature's `labelAnchor`) must
 *      select the water: URL gains `river=caney-fork-river&tab=Water`, the
 *      inspector dialog opens, and the map container reports
 *      `data-map-selected="caney-fork-river"`.
 *   2. Hovering the same centerline must set the maplibre canvas cursor to
 *      `pointer` (mousemove hit handler in TennesseeMap).
 *
 * App seams used (all read-only):
 * - `?qa=1` → `qaDiagnostics()` in TennesseeMap exposes `window.__troutMap`
 *   (the maplibre Map) and `__troutMapMetrics`; `[data-testid="river-map"]`
 *   gets `data-map-ready="1"` on the map `load` event.
 * - Hit layers: `rivers-point-hit`, `rivers-water-hit`,
 *   `rivers-water-hit-outline`, `rivers-hit` (TennesseeMap `hit()`); their
 *   tier filters widen with zoom (`catalogTierFilter` in mapStyle.ts,
 *   MAP_ZOOM_TIERS.reference.start = 9.0) so the spec jumps to z10.5 where
 *   every catalog tier is hittable.
 * - `caney-fork-river` carries `labelAnchor: [-85.8437, 36.1176]` as a
 *   GeoJSON property (apps/web/public/atlas/rivers.geojson; mirrored as
 *   `anchor` in src/features/map/riverIndex.json) and `displayTier:
 *   "featured"`. The anchor is the label seat, not guaranteed to sit on a
 *   rendered tile vertex, so the pixel search projects the real line
 *   vertices and picks the one nearest the anchor.
 *
 * Determinism: reducedMotion is emulated (TennesseeMap/mapStyle honor it),
 * camera moves use `jumpTo` + one `idle` wait, and nothing screenshots.
 */

type TroutMap = {
  jumpTo(options: { zoom: number; center: [number, number] }): void;
  once(event: string, listener: () => void): void;
  project(lngLat: [number, number]): { x: number; y: number };
  getSource(id: string): { getData(): Promise<unknown> } | undefined;
  queryRenderedFeatures(
    box: [[number, number], [number, number]],
    options?: { layers?: string[] },
  ): Array<{ properties?: Record<string, unknown> }>;
  getCanvas(): HTMLCanvasElement;
  getContainer(): HTMLElement;
  triggerRepaint(): void;
};
type BrowserDiagnostics = { __troutMap: TroutMap };

test.setTimeout(90_000);

const WATER_ID = 'caney-fork-river';
/** GeoJSON `labelAnchor` of the feature (rivers.geojson properties). */
const LABEL_ANCHOR: [number, number] = [-85.8437, 36.1176];
/** Center of the feature's bounds [-85.95158, 36.09794, -85.80211, 36.24867]
 * at a zoom where the reference tier is hittable (>= MAP_ZOOM_TIERS.reference.start). */
const RIVER_VIEW = { zoom: 10.5, center: [-85.8768, 36.1733] as [number, number] };
/** Same hit-layer set TennesseeMap's `hit()` queries. */
const HIT_LAYERS = [
  'rivers-point-hit',
  'rivers-water-hit',
  'rivers-water-hit-outline',
  'rivers-hit',
];

async function ready(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // ?qa=1 exposes __troutMap; month=4 pins an in-season month so the
  // offseason presentation (dim/dash) can never shift the hit geometry.
  await page.goto('/?qa=1&month=4&v=map-hit-selection', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1', {
    timeout: 30_000,
  });
}

async function jumpToRiver(page: Page) {
  await page.evaluate(
    async ({ zoom, center }) => {
      const map = (globalThis as unknown as BrowserDiagnostics).__troutMap;
      await new Promise<void>((resolve) => {
        map.once('idle', resolve);
        map.jumpTo({ zoom, center });
      });
    },
    { zoom: RIVER_VIEW.zoom, center: RIVER_VIEW.center },
  );
}

type RiverPixel = { x: number; y: number; verified: boolean; tried: number; reason: string };

/**
 * Find a viewport pixel that (a) sits on a rendered caney-fork-river hit
 * surface, exactly like the app's `hit()` (±5px box on the hit layers), and
 * (b) is under the bare maplibre canvas — no `.river-map-label` button, QA
 * panel, or chrome intercepting the click. Reference point for ranking is
 * the feature's labelAnchor. Retries across an `idle` in case tiles are
 * still settling.
 */
async function riverPixel(page: Page): Promise<RiverPixel> {
  const search = () =>
    page.evaluate(
      async ({ waterId, anchor, hitLayers }) => {
        const map = (globalThis as unknown as BrowserDiagnostics).__troutMap;
        const source = map.getSource('rivers');
        if (!source)
          return { x: 0, y: 0, verified: false, tried: 0, reason: 'rivers source missing' };
        const data = (await source.getData()) as {
          features?: Array<{
            properties?: Record<string, unknown>;
            geometry?: { type: string; coordinates: unknown };
          }>;
        };
        const feature = (data.features ?? []).find(
          (f) => String(f.properties?.id ?? '') === waterId,
        );
        if (!feature?.geometry)
          return {
            x: 0,
            y: 0,
            verified: false,
            tried: 0,
            reason: `feature ${waterId} absent from the rivers source`,
          };
        const lines: number[][][] =
          feature.geometry.type === 'MultiLineString'
            ? (feature.geometry.coordinates as number[][][])
            : feature.geometry.type === 'LineString'
              ? [feature.geometry.coordinates as number[][]]
              : [];
        const rect = map.getContainer().getBoundingClientRect();
        const anchorPx = map.project(anchor);
        const MARGIN = 48;
        const onScreen = lines
          .flat()
          .map((c) => map.project([c[0]!, c[1]!]))
          .filter(
            (p) =>
              p.x > MARGIN &&
              p.y > MARGIN &&
              p.x < rect.width - MARGIN &&
              p.y < rect.height - MARGIN,
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - anchorPx.x, a.y - anchorPx.y) -
              Math.hypot(b.x - anchorPx.x, b.y - anchorPx.y),
          );
        if (onScreen.length === 0)
          return { x: 0, y: 0, verified: false, tried: 0, reason: 'no line vertices in viewport' };
        let tried = 0;
        for (const p of onScreen.slice(0, 25)) {
          tried += 1;
          const hits = map.queryRenderedFeatures(
            [
              [p.x - 5, p.y - 5],
              [p.x + 5, p.y + 5],
            ],
            { layers: hitLayers },
          );
          if (!hits.some((f) => String(f.properties?.id ?? '') === waterId)) continue;
          const vx = rect.left + p.x;
          const vy = rect.top + p.y;
          const under = document.elementFromPoint(vx, vy);
          // The click must land on the canvas itself, not on a label marker,
          // the QA panel, or any other chrome that would select the water
          // without exercising the hit-test.
          if (!under || under.tagName !== 'CANVAS') continue;
          return { x: vx, y: vy, verified: true, tried, reason: 'ok' };
        }
        return {
          x: 0,
          y: 0,
          verified: false,
          tried,
          reason: `no on-screen vertex of ${waterId} both rendered in the hit layers and under the bare canvas`,
        };
      },
      { waterId: WATER_ID, anchor: LABEL_ANCHOR, hitLayers: HIT_LAYERS },
    );
  let result = (await search()) as RiverPixel;
  for (let attempt = 0; attempt < 2 && !result.verified; attempt += 1) {
    // Late tile load: force one more render cycle, then re-search.
    await page.evaluate(async () => {
      const map = (globalThis as unknown as BrowserDiagnostics).__troutMap;
      await new Promise<void>((resolve) => {
        map.once('idle', resolve);
        map.triggerRepaint();
      });
    });
    result = (await search()) as RiverPixel;
  }
  return result;
}

test('clicking the rendered Caney Fork centerline selects it — URL gains river= and the drawer opens', async ({
  page,
}) => {
  await ready(page);
  await jumpToRiver(page);
  const pixel = await riverPixel(page);
  expect(pixel.verified, `hit pixel search failed: ${pixel.reason}`).toBe(true);

  await page.mouse.click(pixel.x, pixel.y);

  // setRiver writes {river, tab: 'Water'} via useSearchParams (push, not replace).
  await expect(page).toHaveURL(/river=caney-fork-river/);
  await expect(page).toHaveURL(/tab=Water/);
  // Desktop layout renders RiverDrawer as section#river-inspector with
  // role="dialog" and aria-label "<catalog name> details" (loading state
  // first says "River details" — the name matcher waits for the water).
  const dialog = page.getByRole('dialog', { name: /Caney Fork River/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Caney Fork River' })).toBeVisible();
  // The presentation pass mirrors the selection onto the container…
  await expect(page.getByTestId('river-map')).toHaveAttribute(
    'data-map-selected',
    'caney-fork-river',
  );
});

test('hovering a rendered centerline turns the map canvas cursor into a pointer', async ({
  page,
}) => {
  await ready(page);
  await jumpToRiver(page);
  const pixel = await riverPixel(page);
  expect(pixel.verified, `hit pixel search failed: ${pixel.reason}`).toBe(true);

  // TennesseeMap's mousemove handler: map.getCanvas().style.cursor = id ? 'pointer' : ''.
  await page.mouse.move(pixel.x, pixel.y);
  await expect(page.getByTestId('river-map').locator('canvas')).toHaveCSS('cursor', 'pointer');
});
