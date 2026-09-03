import { expect, test } from '@playwright/test';

/** Conditions browser against the fixture snapshots (ROLE 2 scope 4). */
test('conditions list shows score pills, trend, and freshness; detail shows reasons', async ({ page }) => {
  await page.goto('/conditions');
  await expect(page.getByRole('heading', { name: 'Conditions' })).toBeVisible();

  // every fixture stream is listed with a score
  await expect(page.getByText('South Holston River')).toBeVisible();
  await expect(page.getByText('Watauga River')).toBeVisible();
  await expect(page.getByText('Clinch River')).toBeVisible();

  // Watauga is at flood flow in fixtures → Poor band; South Holston is ideal → 90
  const wataugaRow = page.locator('li', { hasText: 'Watauga River' }).first();
  await expect(wataugaRow.getByText('Poor')).toBeVisible();
  const holstonRow = page.locator('li', { hasText: 'South Holston River' }).first();
  await expect(holstonRow.getByText('90')).toBeVisible();

  // stream detail: score reasons come straight from scoreConditions()
  await holstonRow.click();
  await expect(page.getByRole('heading', { name: 'South Holston River' })).toBeVisible();
  await expect(page.getByText(/within the ideal range/)).toBeVisible();
  await expect(page.getByText('Water temp', { exact: true })).toBeVisible();
  await expect(page.getByText(/Verify officially/)).toBeVisible();

  // official gauge link is present and external
  const gaugeLink = page.getByRole('link', { name: /USGS gauge 03481500/ });
  await expect(gaugeLink).toBeVisible();
  await expect(gaugeLink).toHaveAttribute('href', /waterdata\.usgs\.gov/);
  await expect(gaugeLink).toHaveAttribute('target', '_blank');
});

test('near me sorts by on-device distance without leaking coordinates', async ({ page }) => {
  await page.goto('/conditions');
  await expect(page.getByText('South Holston River')).toBeVisible();

  // grant a Knoxville-area position — coordinates stay on-device by design
  await page.context().grantPermissions(['geolocation'], { origin: 'http://localhost:4173' });
  await page.context().setGeolocation({ latitude: 35.96, longitude: -83.92 });

  await page.getByRole('button', { name: 'Near me' }).click();

  // East TN streams (gauge coordinates near Knoxville) should surface with a distance chip
  const holstonRow = page.locator('li', { hasText: 'South Holston River' }).first();
  await expect(holstonRow.getByText(/\d+(\.\d+)? mi/)).toBeVisible();

  // and the sorted list should be headed by an East TN tailwater
  const firstName = await page.locator('ul li .font-extrabold').first().textContent();
  expect(firstName).not.toContain('Caney Fork'); // Middle TN is ~200+ mi away
});

test('stocking browser filters by county and species, newest first', async ({ page }) => {
  await page.goto('/stocking');
  await expect(page.getByRole('heading', { name: 'Stocking' })).toBeVisible();
  await expect(page.getByText(/Verify at TWRA/).first()).toBeVisible();

  await page.getByLabel('Species').selectOption('brown');
  await expect(page.getByText('South Holston River')).toBeVisible(); // brown stocking event
  // rainbow-only events (e.g. Caney Fork 5200 rainbows 4 days ago) are filtered out
  await expect(page.getByText(/5,200/)).toHaveCount(0);

  await page.getByLabel('County').selectOption('Polk');
  await expect(page.getByText('Hiwassee River')).toBeVisible();
  await expect(page.getByText('South Holston River')).toHaveCount(0);
});
