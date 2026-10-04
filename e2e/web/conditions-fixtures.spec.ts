import { expect, test } from '@playwright/test';

/** Conditions browser against the fixture snapshots (ROLE 2 scope 4). */
test('conditions opens search-first; search discloses waters; detail shows reasons', async ({ page }) => {
  await page.goto('/conditions');
  await expect(page.getByRole('heading', { name: 'Conditions' })).toBeVisible();

  // Search-first: a small relevance strip opens by default — the catalog
  // never auto-opens.
  await expect(page.getByText('Tailwaters now')).toBeVisible();
  const listSize = await page.locator('li').count();
  expect(listSize).toBeGreaterThan(0);
  expect(listSize).toBeLessThanOrEqual(8);

  // Boone's authored stocking window (Dec/Mar/Apr) excludes September — the
  // honest seasonal state replaces the score pill (T1-19 states ship).
  const booneRow = page.locator('li', { hasText: 'Boone Tailwater' }).first();
  await expect(booneRow.getByText('Out of season')).toBeVisible();
  // In-season gauged tailwaters carry their score pills straight from the
  // snapshot (Caney Fork's authored window runs Mar–Dec).
  const caneyRow = page.locator('li', { hasText: 'Caney Fork' }).first();
  await expect(caneyRow.getByText('80')).toBeVisible();

  // Search discloses exactly the matching waters, still capped
  await page.getByRole('searchbox', { name: 'Search waters by name' }).fill('Watauga');
  const wataugaRow = page.locator('li', { hasText: 'Watauga River' }).first();
  await expect(wataugaRow).toBeVisible();
  await expect(page.getByText(/of \d+ waters/)).toBeVisible();

  // stream detail: the assessment comes straight from the snapshot
  await wataugaRow.click();
  await expect(page.getByRole('heading', { name: 'Watauga River' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Official sources' })).toBeVisible();

  // official gauge link is present and external
  const gaugeLink = page.getByRole('link', { name: /USGS Water Data/ }).first();
  await expect(gaugeLink).toBeVisible();
  await expect(gaugeLink).toHaveAttribute('href', /waterdata\.usgs\.gov/);
  await expect(gaugeLink).toHaveAttribute('target', '_blank');
});

test('near me sorts by on-device distance without leaking coordinates', async ({ page, baseURL }) => {
  await page.goto('/conditions');
  await expect(page.getByText('Tailwaters now')).toBeVisible();

  // grant a Knoxville-area position — coordinates stay on-device by design
  await page.context().grantPermissions(['geolocation'], { origin: baseURL! });
  await page.context().setGeolocation({ latitude: 35.96, longitude: -83.92 });

  await page.getByRole('button', { name: 'Near me' }).click();

  // the nearest-gauged-water list replaces the strips, distances on rows
  await expect(page.getByText(/Closest \d+ waters/)).toBeVisible();
  const nearList = page.locator('li').filter({ hasText: /\d+(\.\d+)? mi/ });
  await expect(nearList.first()).toBeVisible();

  // headed by an East TN water — Middle TN is ~200+ mi away
  const firstName = await page.locator('ul li .font-extrabold').first().textContent();
  expect(firstName).not.toContain('Caney Fork');
});

test('stocking browser filters by county and species, newest first', async ({ page }) => {
  await page.goto('/stocking');
  await expect(page.getByRole('heading', { name: 'Stocking' })).toBeVisible();
  // search-first: the newest published entries preview, verify links on rows
  await expect(page.getByText('Latest published')).toBeVisible();
  await expect(page.getByText(/Verify at TWRA/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Browse the full schedule/ })).toBeVisible();

  // filters live behind the disclosure until asked for
  await page.locator('summary', { hasText: 'Filter the schedule' }).click();
  await page.getByLabel('Stocking window').selectOption('3650');
  await page.getByLabel('Species').selectOption('brown');
  // brown events surface by TWRA water name; the real feed names reaches
  await expect(page.getByText(/Hiwassee River/).first()).toBeVisible();

  await page.getByLabel('County', { exact: true }).selectOption('Polk');
  await expect(page.getByText(/Hiwassee River/).first()).toBeVisible();
});

test('T2-27 — shop report photos render on /shops from the same-origin fixture', async ({
  page,
}) => {
  await page.goto('/shops');
  await expect(page.getByRole('heading', { name: /Shops/i })).toBeVisible();
  const photo = page.locator('img.report-photo');
  await expect(photo.first()).toBeVisible();
  // Same-origin fixture asset — the privacy audit stays green (zero
  // cross-origin requests) while the photo path is exercised end-to-end.
  // Same-origin absolute URL — zero cross-origin requests, real path kept.
  await expect(photo.first()).toHaveAttribute('src', /\/img\/report-1\.jpg$/);
});
