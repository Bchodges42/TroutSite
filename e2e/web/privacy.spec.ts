/**
 * web/privacy.spec.ts — ROLE 5 (§12 #8: no third-party requests in apps/web;
 * location never in any request). This is the automated half of the privacy
 * claim: it intercepts every request the app makes and fails on any
 * cross-origin call or geolocation usage, per route.
 */
import { expect, test } from '@playwright/test';
import { GEOLOCATION_SPY, RequestRecorder, WEB_ROUTES } from '../helpers/first-party';

test.describe('privacy audit — zero third-party requests', () => {
  for (const route of WEB_ROUTES) {
    test(`route ${route} makes zero cross-origin requests`, async ({ page, baseURL }) => {
      const recorder = new RequestRecorder(page, baseURL!);
      await page.addInitScript(GEOLOCATION_SPY);

      const errors: string[] = [];
      page.on('requestfailed', (req) => {
        // Offline SW quirks aside, a failed request to a third party is still a leak attempt.
        if (req.failure()?.errorText !== 'net::ERR_ABORTED') {
          errors.push(`${req.url()} — ${req.failure()?.errorText}`);
        }
      });

      await page.goto(route, { waitUntil: 'networkidle' });

      const third = recorder.thirdParty();
      expect(
        third.map((r) => r.url()),
        `route ${route} must make no third-party requests`,
      ).toEqual([]);
      expect(errors, `route ${route} must have no failed (blocked) third-party requests`).toEqual(
        [],
      );
    });
  }
});

test.describe('privacy audit — location never leaves the device', () => {
  test('no geolocation API is invoked and no request body contains coordinates', async ({
    page,
    baseURL,
  }) => {
    const recorder = new RequestRecorder(page, baseURL!);
    await page.addInitScript(GEOLOCATION_SPY);
    await page.goto('/', { waitUntil: 'networkidle' });

    const geoCalls = (await page.evaluate(() => ({
      getCurrentPosition: (window as unknown as { __geoCalls: { getCurrentPosition: number } })
        .__geoCalls.getCurrentPosition,
      watchPosition: (window as unknown as { __geoCalls: { watchPosition: number } })
        .__geoCalls.watchPosition,
    }))) as { getCurrentPosition: number; watchPosition: number };
    expect(geoCalls.getCurrentPosition, 'no getCurrentPosition calls').toBe(0);
    expect(geoCalls.watchPosition, 'no watchPosition calls').toBe(0);

    // Belt & suspenders: any non-GET payload must not contain lat/long-looking data.
    for (const { url, postData } of recorder.sentBodies()) {
      expect(postData ?? '', `${url} body must not contain coordinates`).not.toMatch(
        /("?(lat|latitude|lng|lon|longitude)"?\s*[:=])/i,
      );
    }
  });

  // Ported from Role 2's privacy-audit spec at integration (canonical suite per §5):
  // "near me" computes distance on-device, so the granted coordinates must never
  // appear in ANY request URL while the feature is exercised for real.
  test('location coordinates never appear in any request while using near me', async ({
    page,
    baseURL,
  }) => {
    const LAT = 35.9643;
    const LON = -83.9207;
    const latTokens = [String(LAT), LAT.toFixed(4), LAT.toFixed(2), '35.96'];
    const lonTokens = [String(LON), LON.toFixed(4), LON.toFixed(2), '-83.92'];

    const requests: string[] = [];
    page.on('request', (req) => requests.push(req.url()));

    await page.context().grantPermissions(['geolocation'], { origin: baseURL! });
    await page.context().setGeolocation({ latitude: LAT, longitude: LON });

    await page.goto('/conditions');
    await expect(page.getByText('Tailwaters now')).toBeVisible();
    await page.getByRole('button', { name: 'Near me' }).click();
    await expect(page.getByText(/Closest \d+ waters/)).toBeVisible();
    // the nearest-waters list renders with on-device distance chips
    await expect(
      page.locator('li').filter({ hasText: /\d+(\.\d+)? mi/ }).first(),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');

    const leaked = requests.filter(
      (u) => latTokens.some((t) => u.includes(t)) || lonTokens.some((t) => u.includes(t)),
    );
    expect(leaked, `coordinates leaked into requests: ${leaked.join(', ')}`).toEqual([]);
  });

  test('denying the (hypothetical) permission prompt never breaks the app', async ({
    page,
    baseURL,
  }) => {
    await page.context().grantPermissions([], { origin: baseURL! }); // grant nothing
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('Trout');
  });
});

// Integration hook (§12 #8 full sweep): once Role 2 ships the real routes and
// the offline payloads, extend WEB_ROUTES in helpers/first-party.ts — the loop
// above then covers each route mechanically, no new tests needed.
