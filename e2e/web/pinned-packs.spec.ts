import { test, expect } from '@playwright/test';

test('a downloaded water survives restart and airplane mode after disposable caches are removed', async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.goto('/conditions/harpeth-river');
  await expect(page.getByRole('heading', { level: 1, name: 'Harpeth River' })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.getByTestId('pack-download').click();
  try {
    await expect(page.getByTestId('pack-state')).toContainText('Ready offline', { timeout: 10_000 });
  } catch (error) {
    const diagnostics = await page.evaluate(async () => {
      const cache = await caches.open('trout-packs-v1');
      const plans = JSON.parse(localStorage.getItem('trout:pack-plans:v1') ?? '{}');
      const matches = await Promise.all((await cache.keys()).map(async (request) => ({ url: request.url,
        byUrl: Boolean(await cache.match(request.url)), vary: (await cache.match(request, { ignoreVary: true }))?.headers.get('vary') })));
      return { plans, matches };
    });
    throw new Error(`${String(error)}; pack diagnostics: ${JSON.stringify(diagnostics)}`);
  }
  const saved = await page.evaluate(async () => (await (await caches.open('trout-packs-v1')).keys()).map((r) => r.url));
  expect(saved.some((url) => url.endsWith('/v1/conditions/latest.json'))).toBe(true);
  await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      if (name === 'trout-packs-v1') continue;
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (/^\/(?:v1|content|atlas\/topo)\//.test(new URL(request.url).pathname)) await cache.delete(request);
      }
    }
    // No application-level saved snapshots may conceal a broken worker fallback.
    await new Promise<void>((resolve, reject) => {
      const opening = indexedDB.open('trout-web');
      opening.onerror = () => reject(opening.error);
      opening.onsuccess = () => {
        const db = opening.result;
        const tx = db.transaction('snapshots', 'readwrite');
        tx.objectStore('snapshots').clear();
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Harpeth River' })).toBeVisible();
  await expect(page.getByTestId('pack-state')).toContainText('Ready offline');
  const conditions = await page.evaluate(async () => {
    const response = await fetch('/v1/conditions/latest.json');
    return { status: response.status, body: await response.json() };
  });
  expect(conditions.status).toBe(200);
  expect(Array.isArray(conditions.body)).toBe(true);
  await expect(page.getByRole('button', { name: 'Verify', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByTestId('pack-state')).toContainText('Ready offline');
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Remove pack', exact: true }).click();
  await page.getByRole('button', { name: 'Really remove this pack', exact: true }).click();
  await expect(page.getByTestId('pack-download')).toBeVisible();
});

test('private status/rule requests are never replayed from offline caches', async ({ page, context }) => {
  await page.goto('/settings');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.evaluate(async () => {
    const cache = await caches.open('snapshot-cache');
    await cache.put('/v1/watches/rules?subscriptionId=review-capability', new Response('{"rules":[{"id":999}]}', { headers: { 'content-type': 'application/json' } }));
  });
  await context.setOffline(true);
  const failed = await page.evaluate(async () => {
    try { await fetch('/v1/watches/rules?subscriptionId=review-capability'); return false; }
    catch { return true; }
  });
  expect(failed).toBe(true);
});
