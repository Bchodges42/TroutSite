import { test, expect } from '@playwright/test';

test('mobile search recalls explicit water choices and clears device history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/conditions');
  const search = page.getByRole('banner').getByRole('combobox', { name: 'Search rivers' });
  await search.fill('Clinch River');
  await page.getByRole('option', { name: /^Clinch River/ }).first().click();
  await expect(page).toHaveURL(/[?&]river=clinch-river(?:&|$)/);
  await page.reload();
  // The water drawer traps focus while open. Close it as a visitor would
  // before using the header again; reload also exercises persisted recall.
  await page.getByRole('button', { name: 'Close river details', exact: true }).click();
  await search.focus();
  await expect(page.getByText('Recently selected on this device')).toBeVisible();
  await expect(page.getByRole('option', { name: /^Clinch River/ })).toBeVisible();
  await search.press('Enter');
  await expect(page.getByText('Recently selected on this device')).toBeVisible();
  await page.getByRole('button', { name: 'Clear recent selections' }).click();
  await expect(page.getByText('Recently selected on this device')).toHaveCount(0);
});

for (const width of [320, 390]) {
  test(`source-reviewed access and trip selection work offline without overflow at ${width}px`, async ({ page, context }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/conditions/little-river');
    await expect(page.getByTestId('access-section').getByText('Metcalf Bottoms Picnic Area')).toBeVisible();
    await expect(page.getByTestId('access-section').getByText(/Official source reviewed/)).toBeVisible();
    await expect(page.getByTestId('access-section').getByText(/no on-site visit/)).toBeVisible();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.goto('/trips?waters=little-river,west-prong-little-pigeon&title=Smokies');
    await page.getByRole('button', { name: 'Create trip', exact: true }).click();
    await page.getByRole('button', { name: 'Trip details', exact: true }).click();
    const choice = page.getByRole('checkbox', { name: 'Use Metcalf Bottoms Picnic Area' });
    await choice.check();
    await expect(choice).toBeChecked();
    await page.getByRole('button', { name: 'Check download size' }).click();
    await expect(page.getByText(/(?:Approximately|At least) [\d.]+ MB/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    await expect(page.getByRole('button', { name: 'Check download size' })).toBeDisabled();
    await expect(page.getByRole('checkbox', { name: 'Include terrain (larger download)' })).toBeDisabled();
    await expect(page.getByTestId('pack-download')).toBeDisabled();
    await context.setOffline(false);
    await expect(page.getByRole('button', { name: 'Check download size' })).toBeEnabled();
    await context.setOffline(true);
    await expect(page.getByRole('button', { name: 'Check download size' })).toBeDisabled();
    // Chromium's SW reload can reset navigator.onLine under Playwright's
    // emulation (see offline-cold-start.spec.ts). The checks above prove live
    // airplane-mode controls; this reload proves persisted trip/access data.
    await page.reload();
    await page.getByRole('button', { name: 'Trip details', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Use Metcalf Bottoms Picnic Area' })).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}
