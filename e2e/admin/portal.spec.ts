/**
 * admin/portal.spec.ts — ROLE 5 (§4 deliverable: MSW-mode token login + composer
 * happy path).
 *
 * v1 status: the Phase-0 portal is a shell (Role 4 owns the real UI). Load +
 * first-party-only assertions run today; the token login and composer flows are
 * `test.fixme` with the frozen expected semantics, enabled at integration
 * (docs/integration-checklist.md #5).
 */
import { expect, test } from '@playwright/test';
import { RequestRecorder } from '../helpers/first-party';

test.describe('portal shell (runs today)', () => {
  test('portal loads and identifies itself', async ({ page, baseURL }) => {
    const recorder = new RequestRecorder(page, baseURL!);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Shop Portal');
    expect(recorder.thirdParty().map((r) => r.url())).toEqual([]);
  });
});

test.describe('token login + report composer (enabled when Role 4 ships the UI)', () => {
  // Frozen expectations (§12 #5): token → report → appears in reports/recent.json
  // with attribution. MSW mode lets these run without the live API.
  test.fixme('shop token logs in and shows the composer', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/shop token/i).fill('msw-test-token');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByTestId('report-composer')).toBeVisible();
    await expect(page.getByText(/signed in as/i)).toBeVisible();
  });

  test.fixme('submitted report lands in reports/recent.json with attribution', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    await page.getByLabel(/shop token/i).fill('msw-test-token');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByLabel(/stream/i).selectOption('south-holston-river');
    await page.getByLabel(/report/i).fill('Sulphur spinners at dusk, fish on 18 pheasant tails.');
    await page.getByRole('button', { name: /publish/i }).click();
    await expect(page.getByText(/published/i)).toBeVisible();

    const recent = await request.get(`${'http://127.0.0.1:8787'}/v1/reports/recent.json`);
    const body = (await recent.json()) as { attributionUrl?: string }[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]?.attributionUrl).toMatch(/^https?:\/\//);
  });
});
