import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const PORTAL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.portal');
let ownerToken: string;
let shopToken: string;
test.beforeAll(() => {
  ownerToken = readFileSync(path.join(PORTAL, 'owner-token-latest.txt'), 'utf8').trim();
  shopToken = readFileSync(path.join(PORTAL, 'portal-token-latest.txt'), 'utf8').trim();
});

test('owner reads work through the real portal proxy with separate auth, private candidates and no-store', async ({ request }) => {
  for (const token of [null, shopToken]) {
    const denied = await request.get('/v1/owner/dashboard', { headers: token ? { authorization: `Bearer ${token}` } : {} });
    expect(denied.status()).toBe(401);
    expect(denied.headers()['cache-control']).toBe('no-store');
  }
  const headers = { authorization: `Bearer ${ownerToken}` };
  for (const endpoint of ['dashboard', 'corrections', 'research-queue', 'publication-preview']) {
    const response = await request.get(`/v1/owner/${endpoint}`, { headers });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');
    const body = await response.json();
    if (endpoint === 'dashboard') {
      expect(body.operations).toEqual(expect.arrayContaining([
        expect.objectContaining({ area: 'backup', state: 'OK' }),
        expect.objectContaining({ area: 'watchdog', state: 'not-collected' }),
      ]));
    }
    if (endpoint === 'publication-preview') {
      expect(body.state).toBe('ready');
      expect(body.publication.waters).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'watauga-river', changes: expect.arrayContaining([
          expect.objectContaining({ field: 'notes', after: 'E2E candidate note: source review is pending.' }),
        ]) }),
      ]));
    }
  }
  const live = await request.get('http://127.0.0.1:8791/v1/streams');
  expect(live.status()).toBe(200);
  const catalog = await live.json() as { id: string; notes?: string }[];
  expect(catalog.find((water) => water.id === 'watauga-river')?.notes).toBe('Tailrace below Wilbur Dam; blue-winged olive and caddis activity much of the year.');
  expect((await request.post('/v1/owner/publication-preview', { headers })).status()).toBe(405);
});

for (const width of [320, 390]) {
  test(`owner can review an actual candidate on mobile at ${width}px and reload locks the token`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#/owner');
    await page.getByLabel('Owner token', { exact: true }).fill(ownerToken);
    await page.getByRole('button', { name: 'Unlock dashboard', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Owner Dashboard', exact: true })).toBeVisible();
    const preview = page.getByRole('region', { name: 'Publication candidate', exact: true });
    await expect(preview.getByText('Ready for owner review. Live data is unchanged.')).toBeVisible();
    await preview.locator('summary').filter({ hasText: /^Watauga River/ }).click();
    await expect(preview.getByRole('heading', { name: 'Current public wording' })).toBeVisible();
    await expect(preview.getByRole('heading', { name: 'Candidate public wording' })).toBeVisible();
    await preview.getByText('notes', { exact: true }).click();
    await expect(preview.locator('pre').filter({ hasText: /^E2E candidate note: source review is pending\.$/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const jobs = page.getByRole('region', { name: 'Pipeline job details', exact: true });
    await jobs.focus();
    await jobs.press('ArrowRight');
    await expect.poll(() => jobs.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const persisted = await page.evaluate(() => [...Object.values(localStorage), ...Object.values(sessionStorage)]);
    expect(persisted).not.toContain(ownerToken);
    await page.reload();
    await expect(page.getByLabel('Owner token', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Publication candidate', exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Pipeline jobs', exact: true })).toHaveCount(0);
  });
}
