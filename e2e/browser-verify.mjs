/**
 * Owner-requested browser verification for fix/map-hit-selection.
 * Run: node browser-verify.mjs   (from e2e/ — resolves @playwright/test)
 * Serves against the REAL dist via the api dev server on :8792 (not fixtures).
 * Proves: click selection, hover cursor, thin-creek (reference tier) click,
 * selection after zoom (zoomend filter mutation), theme swaps — all with
 * ZERO console errors for the whole session. Screenshots into notes/.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:8792';
const SHOTS = '../notes';
mkdirSync(SHOTS, { recursive: true });

const consoleErrors = [];
const networkFailures = [];
const pageErrors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const text = m.text();
  // Dev-host data endpoints (conditions/gauges/stocking) legitimately 404/503
  // without a generated feed — tracked separately from script/map errors.
  if (/Failed to load resource/.test(text)) networkFailures.push(text);
  else consoleErrors.push(text);
});
page.on('response', (r) => {
  if (r.status() >= 400) networkFailures.push(`${r.status()} ${r.url()}`);
});
page.on('pageerror', (e) => pageErrors.push(String(e)));

const idle = () =>
  page.evaluate(
    () =>
      new Promise((res) => {
        const map = globalThis.__troutMap;
        if (map.isIdle?.() ?? false) return res();
        map.once('idle', res);
      }),
  );

async function hitPixel(waterId, anchor) {
  return page.evaluate(
    async ({ waterId, anchor }) => {
      const map = globalThis.__troutMap;
      const src = map.getSource('rivers');
      const data = await src.getData();
      const f = data.features.find((x) => String(x.properties?.id) === waterId);
      if (!f) return { ok: false, why: `feature ${waterId} not in source` };
      const lines =
        f.geometry.type === 'MultiLineString'
          ? f.geometry.coordinates
          : f.geometry.type === 'LineString'
            ? [f.geometry.coordinates]
            : [];
      const rect = map.getContainer().getBoundingClientRect();
      const a = map.project(anchor);
      const cands = lines
        .flat()
        .map((c) => map.project(c))
        .filter((p) => p.x > 60 && p.y > 60 && p.x < rect.width - 60 && p.y < rect.height - 60)
        .sort(
          (p, q) =>
            Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y),
        );
      const layers = [
        'rivers-point-hit',
        'rivers-water-hit',
        'rivers-water-hit-outline',
        'rivers-hit',
      ];
      for (const p of cands.slice(0, 25)) {
        const hits = map.queryRenderedFeatures(
          [
            [p.x - 5, p.y - 5],
            [p.x + 5, p.y + 5],
          ],
          { layers },
        );
        if (!hits.some((h) => String(h.properties?.id) === waterId)) continue;
        const under = document.elementFromPoint(rect.left + p.x, rect.top + p.y);
        if (!under || under.tagName !== 'CANVAS') continue;
        return { ok: true, x: rect.left + p.x, y: rect.top + p.y };
      }
      return { ok: false, why: `no hittable ${waterId} pixel under the canvas` };
    },
    { waterId, anchor },
  );
}

const results = [];
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!ok) process.exitCode = 1;
};

// --- 1. load
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(BASE + '/?qa=1', { waitUntil: 'domcontentloaded' });
await page.locator('[data-testid="river-map"][data-map-ready="1"]').waitFor({ timeout: 30000 });
check('map loads on the served dist', true);

// --- 2. jump to Caney Fork, hover-cursor, click-select
await page.evaluate(({ zoom, center }) => {
  globalThis.__troutMap.once('idle', () => {});
  globalThis.__troutMap.jumpTo({ zoom, center });
  return new Promise((res) => globalThis.__troutMap.once('idle', res));
}, { zoom: 10.5, center: [-85.8768, 36.1733] });
await idle();

const caney = await hitPixel('caney-fork-river', [-85.8437, 36.1176]);
check('Caney Fork pixel is hit-tested on the canvas', caney.ok, caney.why ?? '');
if (caney.ok) {
  await page.mouse.move(caney.x, caney.y);
  await page.waitForTimeout(150);
  const cursor = await page.evaluate(
    () => document.querySelector('[data-testid="river-map"] canvas').style.cursor,
  );
  check('hover sets pointer cursor', cursor === 'pointer', `cursor=${cursor}`);

  await page.mouse.click(caney.x, caney.y);
  await page.waitForURL(/river=caney-fork-river/, { timeout: 15000 });
  const drawer = page.getByRole('dialog', { name: /Caney Fork River/ });
  await drawer.waitFor({ state: 'visible', timeout: 15000 });
  check('canvas click selects Caney Fork (URL + drawer)', true);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOTS + '/verify-1-caney-selected.png' });
}

// --- 3. thin creek (reference tier): find one near Caney Fork from the live source
const creek = await page.evaluate(async () => {
  const map = globalThis.__troutMap;
  const data = await map.getSource('rivers').getData();
  const c = data.features.find(
    (f) =>
      f.geometry?.type === 'MultiLineString' &&
      String(f.properties?.displayTier ?? '') === 'reference' &&
      /creek/i.test(String(f.properties?.name ?? f.properties?.id ?? '')) &&
      String(f.properties?.id) !== 'caney-fork-river',
  );
  return c
    ? { id: String(c.properties.id), name: String(c.properties.name ?? c.properties.id), anchor: c.properties.labelAnchor ?? null }
    : null;
});
check('found a thin reference-tier creek in the served catalog', Boolean(creek), creek?.id ?? 'none');
if (creek) {
  const anchor = creek.anchor ?? [-85.9, 36.1];
  await page.evaluate(
    async ({ zoom, center }) => {
      const map = globalThis.__troutMap;
      await new Promise((res) => {
        map.once('idle', res);
        map.jumpTo({ zoom, center });
      });
    },
    { zoom: 11.5, center: anchor },
  );
  await idle();
  const px = await hitPixel(creek.id, anchor);
  check(`thin creek ${creek.id} is hit-tested`, px.ok, px.why ?? '');
  if (px.ok) {
    await page.mouse.click(px.x, px.y);
    await page.waitForURL(new RegExp(`river=${creek.id}`), { timeout: 15000 });
    await page.getByRole('dialog', { name: new RegExp(creek.name.slice(0, 20)) }).waitFor({
      state: 'visible',
      timeout: 15000,
    });
    check('thin creek click selects it (URL + drawer)', true);
  }
}

// --- 4. zoom in/out, click again after zoomend filter mutation
// Re-jump to the Caney view first: step 3 left the camera on the creek with
// the drawer open, which covers Caney's pixels — a sequencing artifact, not
// a hit-test failure.
await page.evaluate(
  async ({ zoom, center }) => {
    const map = globalThis.__troutMap;
    await new Promise((res) => {
      map.once('idle', res);
      map.jumpTo({ zoom, center });
    });
  },
  { zoom: 10.5, center: [-85.8768, 36.1733] },
);
await idle();
await page.mouse.wheel(0, -600); // zoom in
await idle();
await page.waitForTimeout(400);
await page.mouse.wheel(0, 900); // zoom back out
await idle();
const caney2 = await hitPixel('caney-fork-river', [-85.8437, 36.1176]);
if (caney2.ok) {
  await page.mouse.click(caney2.x, caney2.y);
  await page.waitForURL(/river=caney-fork-river/, { timeout: 15000 });
  check('click still selects after zoom in/out (zoomend filter mutation)', true);
} else {
  check('click still selects after zoom in/out (zoomend filter mutation)', false, caney2.why);
}

// --- 5. theme swaps with an active selection (flow-arrow re-registration path)
await page.getByRole('button', { name: 'Switch to Nightfall theme' }).click();
await page.locator('[data-testid="river-map"][data-map-theme="nightfall"]').waitFor({ timeout: 15000 });
await idle();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: 'Switch to Daybreak theme' }).click();
await page.locator('[data-testid="river-map"][data-map-theme="daybreak"]').waitFor({ timeout: 15000 });
await idle();
await page.waitForTimeout(1200);
check('theme swap both ways with active selection', true);
await page.screenshot({ path: SHOTS + '/verify-2-after-theme-swaps.png' });

// --- 6. console cleanliness for the ENTIRE session
check('ZERO script/map console errors across the whole session', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 900));
check('no maplibre-style console spam in network failures', networkFailures.every((t) => !/flow-arrow|WebGL|maplibre/i.test(t)), [...new Set(networkFailures)].join(' | ').slice(0, 900));
check('ZERO page errors across the whole session', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 600));

console.log(results.join('\n'));
await browser.close();
