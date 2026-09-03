/**
 * admin/portal.spec.ts — §12 #5, enabled at integration: token → report →
 * attributed entry in reports/recent.json, against the REAL API.
 *
 * The e2e API instance (:8791, started by playwright.config.ts) serves a temp
 * SQLite DB seeded by globalSetup from apps/api/fixtures/content, whose
 * test-fly-shop has reports enabled. The login token is minted with the real
 * operator CLI (`pnpm --filter api token`) and baked into the admin build via
 * VITE_API_BASE — the same-origin production posture, exercised end to end.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { RequestRecorder } from '../helpers/first-party';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.resolve(HERE, '..', '.portal', 'portal-token-latest.txt');
const E2E_API = 'http://127.0.0.1:8791';

let token: string;
test.beforeAll(() => {
  token = readFileSync(TOKEN_FILE, 'utf8').trim();
  expect(token, 'a minted v1 token exists (globalSetup)').toMatch(/^v1\.test-fly-shop\./);
});

test('portal loads first-party only and rejects a bogus token', async ({ page, baseURL }) => {
  const recorder = new RequestRecorder(page, baseURL!);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toContainText('Shop Portal');
  expect(recorder.thirdParty().map((r) => r.url())).toEqual([]);

  await page.getByLabel('Shop token').fill('v1.test-fly-shop.1.2.badSignature');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/not valid or has expired/i)).toBeVisible();
  // Failed sign-in must not persist anything (Role 4 guarantee).
  const stored = await page.evaluate(() => localStorage.getItem('trout.admin.token'));
  expect(stored).toBeNull();
});

test('shop token logs in and shows the composer', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Shop token').fill(token);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Test Fly Shop (fixture)' })).toBeVisible();
  await expect(page.getByText(/weekly report/i).first()).toBeVisible();
  await expect(page.getByLabel('Report body')).toBeVisible();
});

test('submitted report lands in reports/recent.json with attribution', async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByLabel('Shop token').fill(token);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Test Fly Shop (fixture)' })).toBeVisible();

  await page.getByLabel('Water').selectOption('watauga-river');
  await page.getByLabel('Report body').fill(
    'Blue-winged olives came off in the rain mid-afternoon; fish keyed on size 20 emergers in the slow seam below the bridge.',
  );
  await page.getByRole('button', { name: 'Publish report' }).click();
  await expect(page.getByText(/Published.+thank you/i)).toBeVisible();

  // The API regenerates the snapshot inline on accept — verify the public feed.
  const recent = await request.get(`${E2E_API}/v1/reports/recent.json`);
  expect(recent.ok()).toBeTruthy();
  const body = (await recent.json()) as {
    shopId: string;
    shopName: string;
    streamId?: string;
    body: string;
    attributionUrl: string;
    photoUrl?: string;
  }[];
  const mine = body.find((r) => r.streamId === 'watauga-river');
  expect(mine, 'the published report appears in the public feed').toBeTruthy();
  expect(mine?.shopId).toBe('test-fly-shop');
  expect(mine?.shopName).toBe('Test Fly Shop (fixture)');
  expect(mine?.attributionUrl).toMatch(/^https:\/\//);
  expect(mine?.body).not.toContain('<'); // sanitized plain text
});
