import { expect, test, type Page, type TestInfo } from '@playwright/test';

type BrowserDiagnostics = {
  __troutMap: {
    jumpTo(options: { zoom: number; center: [number, number] }): void;
    once(event: string, listener: () => void): void;
    getFilter(layer: string): unknown;
    getStyle(): { layers: Array<{ id: string }> };
    queryRenderedFeatures(options?: { layers?: string[] }): Array<{
      properties?: Record<string, unknown>;
    }>;
  };
  __troutMapMetrics?: { featureStateWrites: number; zoomTierCrossings: number; zoomFilterMutations: number };
  __troutNetwork?: { loadedIds: string[]; fetchedOnce: boolean; fetchedFiles: string[]; fetches: number };
};

test.setTimeout(90_000);

async function ready(page: Page) {
  await page.goto('/?qa=1&v=map-quality', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-ready', '1', {
    timeout: 30_000,
  });
}

async function jump(page: Page, zoom: number, center: [number, number] = [-86, 35.8]) {
  await page.evaluate(
    async ({ zoom: nextZoom, center: nextCenter }) => {
      const map = (globalThis as unknown as BrowserDiagnostics).__troutMap;
      await new Promise<void>((resolve) => {
        map.once('idle', resolve);
        map.jumpTo({ zoom: nextZoom, center: nextCenter });
      });
    },
    { zoom, center },
  );
}

async function settledFeatureStateWrites(page: Page): Promise<number> {
  let previous = -1;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const current = await page.evaluate(
      () => (globalThis as unknown as BrowserDiagnostics).__troutMapMetrics?.featureStateWrites ?? 0,
    );
    if (current === previous) return current;
    previous = current;
    await page.waitForTimeout(250);
  }
  return previous;
}

test('tier crossings mutate hit filters without rewriting per-water feature state', async ({
  page,
}, testInfo: TestInfo) => {
  await ready(page);
  await expect
    .poll(() => page.evaluate(() => (globalThis as unknown as BrowserDiagnostics).__troutMapMetrics?.featureStateWrites ?? 0))
    .toBeGreaterThan(0);
  // Let the initial catalog/conditions passes settle; the invariant under
  // test is that the zoom transition itself does not cause another pass.
  await page.waitForTimeout(4_000);
  const initial = await settledFeatureStateWrites(page);
  await page.screenshot({ path: testInfo.outputPath('statewide-featured.png') });

  await jump(page, 7.3);
  const regional = await page.evaluate(() => ({
    metrics: (globalThis as unknown as BrowserDiagnostics).__troutMapMetrics!,
    filter: (globalThis as unknown as BrowserDiagnostics).__troutMap.getFilter('rivers-hit'),
  }));
  expect(regional.metrics.featureStateWrites).toBe(initial);
  expect(JSON.stringify(regional.filter)).toContain('standard');
  expect(JSON.stringify(regional.filter)).not.toContain('reference');
  await page.screenshot({ path: testInfo.outputPath('regional-standard.png') });

  await jump(page, 9.1);
  await jump(page, 10.4);
  const local = await page.evaluate(() => ({
    metrics: (globalThis as unknown as BrowserDiagnostics).__troutMapMetrics!,
    filter: (globalThis as unknown as BrowserDiagnostics).__troutMap.getFilter('rivers-hit'),
  }));
  expect(local.metrics.zoomTierCrossings).toBeGreaterThanOrEqual(2);
  expect(local.metrics.zoomFilterMutations).toBeGreaterThanOrEqual(4);
  expect(local.metrics.featureStateWrites).toBe(initial);
  expect(JSON.stringify(local.filter)).toContain('reference');
  await page.screenshot({ path: testInfo.outputPath('local-reference.png') });
});

test('network context is bounded, PID-deduped, and fetches once across style reload', async ({
  page,
}, testInfo: TestInfo) => {
  await ready(page);
  await jump(page, 10, [-85.3, 36.4]);
  await expect
    .poll(() => page.evaluate(() => (globalThis as unknown as BrowserDiagnostics).__troutNetwork?.loadedIds?.length ?? 0), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  const before = await page.evaluate(() => (globalThis as unknown as BrowserDiagnostics).__troutNetwork!);
  expect(before.loadedIds.length).toBeLessThanOrEqual(6);
  expect(before.fetchedOnce).toBe(true);
  expect(before.fetchedFiles.length).toBe(before.fetches);
  const pidOverlap = await page.evaluate(async () => {
    const map = (globalThis as unknown as BrowserDiagnostics).__troutMap;
    const atlas = (await (await fetch('/atlas/rivers.geojson')).json()) as {
      features: Array<{ properties: { nhdPermanentIds?: string[] } }>;
    };
    const catalogPids = new Set(
      atlas.features.flatMap((feature) => (feature.properties.nhdPermanentIds ?? []).map(String)),
    );
    const networkLayers = map
      .getStyle()
      .layers.map((layer) => layer.id)
      .filter((id) => id.startsWith('network-minor-'));
    return map
      .queryRenderedFeatures({ layers: networkLayers })
      .map((feature) => String(feature.properties?.pid ?? ''))
      .filter((pid) => pid && catalogPids.has(pid));
  });
  expect(pidOverlap).toEqual([]);

  await page.getByRole('button', { name: /Switch to Nightfall theme/i }).click();
  await expect(page.getByTestId('river-map')).toHaveAttribute('data-map-theme', 'nightfall', {
    timeout: 20_000,
  });
  await expect
    .poll(() => page.evaluate(() => (globalThis as unknown as BrowserDiagnostics).__troutNetwork?.loadedIds?.length ?? 0), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
  const after = await page.evaluate(() => ({
    network: (globalThis as unknown as BrowserDiagnostics).__troutNetwork!,
    layers: (globalThis as unknown as BrowserDiagnostics).__troutMap
      .getStyle()
      .layers.map((layer: { id: string }) => layer.id),
  }));
  expect(after.network.fetches).toBe(before.fetches);
  expect(after.network.fetchedOnce).toBe(true);
  expect(after.layers.some((id: string) => id.startsWith('network-minor-'))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('local-nightfall-network.png') });
});
