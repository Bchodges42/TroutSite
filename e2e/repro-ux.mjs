/* global console, document, getComputedStyle, process, window */
// UX remediation reproduction/verification sweep (fix/production-review-a)
// Usage: node scripts-ux/repro.mjs <baseUrl> <outDir> [before|after]
// Captures the review findings H1/H2/H3/H5/M1/M2 as screenshots + JSON measurements.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8797';
const OUT = process.argv[3] ?? 'artifacts/ux-remediation/before';
const LABEL = process.argv[4] ?? 'before';
mkdirSync(OUT, { recursive: true });

const results = {};
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});

async function newPage(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      (results.console ??= []).push({ tag: LABEL, type: m.type(), text: m.text().slice(0, 300) });
    }
  });
  return { ctx, page };
}

async function waitMapReady(page) {
  await page.waitForSelector('.maplibregl-canvas', { timeout: 20000 });
  await page.waitForFunction(
    () => {
      const c = document.querySelector('.maplibregl-canvas');
      return c && c.width > 0 && document.querySelector('.maplibregl-map, .field-map, [class*=map]');
    },
    { timeout: 20000 },
  );
  await page.waitForTimeout(2500); // style+labels settle
}

// ---------- H1: mobile recenter cannot fit Tennessee ----------
for (const [w, h] of [[390, 844], [320, 568]]) {
  const { ctx, page } = await newPage(w, h);
  await page.goto(`${BASE}/`);
  await waitMapReady(page);
  await page.getByRole('button', { name: 'Center map on Tennessee' }).click();
  await page.waitForTimeout(1200);
  const cam = await page.evaluate(() => {
    const el = document.querySelector('.maplibregl-map');
    const _map = el?.map ?? window.__troutMap ?? null;
    // Fallback: read dataset written by syncCamera
    const ds = el?.dataset ?? {};
    return { center: ds.center ?? null, zoom: ds.zoom ?? null };
  });
  results[`h1-${w}x${h}`] = cam;
  await page.screenshot({ path: join(OUT, `h1-recenter-${w}x${h}.png`) });
  await ctx.close();
}

// ---------- H2a: 320x568 expanded sheet overlap ----------
{
  const { ctx, page } = await newPage(320, 568);
  await page.goto(`${BASE}/?river=caney-fork-river`);
  await waitMapReady(page);
  await page.waitForTimeout(800);
  // expand the sheet
  const expand = page.getByRole('button', { name: /expand/i }).first();
  if (await expand.count()) {
    await expand.click();
    await page.waitForTimeout(900);
  }
  const geo = await page.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom, right: b.right };
    };
    const inter = (a, b) =>
      a && b && !(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y);
    const toggle = r('.sheet-toggle');
    const tools = r('.mobile-map-tools');
    const search = r('.mobile-search-row');
    return { toggle, tools, search, toggleOverlapsTools: inter(toggle, tools), toggleOverlapsSearch: inter(toggle, search) };
  });
  results['h2a-320x568-expanded'] = geo;
  await page.screenshot({ path: join(OUT, 'h2a-expanded-320x568.png') });
  await ctx.close();
}

// ---------- H2b: duplicate search in atlas mode ----------
{
  const { ctx, page } = await newPage(390, 844);
  await page.goto(`${BASE}/?atlas=1`);
  await waitMapReady(page);
  await page.waitForTimeout(800);
  const searches = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input.search-input, input[type=search], .search-wrap input')]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => ({ placeholder: el.placeholder, y: Math.round(el.getBoundingClientRect().y) }));
    return { visibleSearchInputs: inputs.length, inputs };
  });
  results['h2b-atlas-390x844'] = searches;
  await page.screenshot({ path: join(OUT, 'h2b-atlas-390x844.png') });
  await ctx.close();
}

// ---------- H5: statewide labels desktop ----------
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/`);
  await waitMapReady(page);
  await page.waitForTimeout(1000);
  const labels = await page.evaluate(() => {
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return b.width > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };
    const rivers = [...document.querySelectorAll('.river-map-label')];
    const still = rivers.filter((el) => el.classList.contains('still-water-label'));
    return {
      riverLabelsTotal: rivers.length,
      riverLabelsVisible: rivers.filter(vis).length,
      stillWaterVisible: still.filter(vis).length,
      visibleNames: rivers.filter(vis).map((el) => el.textContent).slice(0, 60),
    };
  });
  results['h5-statewide-1440x900'] = labels;
  await page.screenshot({ path: join(OUT, 'h5-statewide-1440x900.png') });
  await ctx.close();
}

// ---------- M1: hatch-mode legend ----------
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/?mode=hatches&month=9`);
  await waitMapReady(page);
  await page.waitForTimeout(1000);
  const legend = await page.evaluate(() => {
    const el = document.querySelector('.map-legend');
    return { title: el?.querySelector('.legend-title')?.textContent ?? null, text: el?.textContent ?? null };
  });
  results['m1-hatch-legend'] = legend;
  await page.screenshot({ path: join(OUT, 'm1-hatch-legend-1440x900.png') });
  await ctx.close();
}

// ---------- H3: trout-mode atlas count ----------
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/?atlas=1`);
  await waitMapReady(page);
  await page.waitForTimeout(800);
  const h3 = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h1,h2,h3')].map((e) => e.textContent).find((t) => /waters/i.test(t ?? ''));
    const rows = [...document.querySelectorAll('.water-row, [data-river-id]')].length;
    return { heading: h ?? null, approxRows: rows };
  });
  results['h3-atlas-count'] = h3;
  await ctx.close();
}

writeFileSync(join(OUT, `results-${LABEL}.json`), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
