// After-fix verification sweep for fix/production-review-a.
// Usage: node verify-ux.mjs <baseUrl> <outDir>
// Re-measures every finding + captures evidence screenshots (both themes).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8797';
const OUT = process.argv[3] ?? '../artifacts/ux-remediation/after';
mkdirSync(OUT, { recursive: true });
const results = {};
const consoleErrs = [];
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});

async function newPage(width, height, theme = null) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrs.push({ url: page.url(), text: m.text().slice(0, 200) });
  });
  if (theme) await page.addInitScript((t) => localStorage.setItem('trout-theme', t), theme);
  return { ctx, page };
}
async function waitMapReady(page) {
  await page.waitForSelector('.maplibregl-canvas', { timeout: 20000 });
  await page.waitForTimeout(2500);
}

// ---- healthz verdict (C1) ----
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(BASE);
  await page.waitForTimeout(500);
  results.healthz = await page.evaluate(async () => {
    const r = await fetch('/healthz', { cache: 'no-store' });
    const j = await r.json();
    return { ok: j.ok, conditions: j.conditions };
  });
  await ctx.close();
}

// ---- H1: recenter fits both extremities ----
for (const [w, h] of [[390, 844], [320, 568], [1440, 900]]) {
  const { ctx, page } = await newPage(w, h);
  await page.goto(`${BASE}/`);
  await waitMapReady(page);
  await page.getByRole('button', { name: 'Center map on Tennessee' }).click();
  await page.waitForTimeout(1200);
  const cam = await page.evaluate(() => {
    const el = document.querySelector('.maplibregl-map');
    return { center: el?.dataset.center ?? null, zoom: el?.dataset.zoom ?? null };
  });
  results[`h1-${w}x${h}`] = cam;
  await page.screenshot({ path: join(OUT, `h1-recenter-${w}x${h}.png`) });
  await ctx.close();
}

// ---- H2a: expanded sheet toggle operable at 320x568 ----
{
  const { ctx, page } = await newPage(320, 568);
  await page.goto(`${BASE}/?river=caney-fork-river`);
  await waitMapReady(page);
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
    return {
      toggle,
      tools,
      search,
      toggleVisible: !!toggle && toggle.w > 0,
      toggleOverlapsTools: inter(toggle, tools),
      toggleOverlapsSearch: inter(toggle, search),
    };
  });
  results['h2a-320x568-expanded'] = geo;
  await page.screenshot({ path: join(OUT, 'h2a-expanded-320x568.png') });
  await ctx.close();
}

// ---- H2b: one search in atlas mode; toolbar hidden ----
{
  const { ctx, page } = await newPage(390, 844);
  await page.goto(`${BASE}/?atlas=1`);
  await waitMapReady(page);
  const state = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input.search-input')]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => Math.round(el.getBoundingClientRect().y));
    const topbar = document.querySelector('.map-topbar');
    const topbarHidden = !topbar || getComputedStyle(topbar).visibility === 'hidden';
    const explore = document.querySelector('.mobile-explore');
    return {
      visibleSearchInputs: inputs.length,
      inputs,
      topbarHidden,
      mobileExploreRendered: !!explore,
    };
  });
  results['h2b-atlas-390x844'] = state;
  await page.screenshot({ path: join(OUT, 'h2b-atlas-390x844.png') });
  await ctx.close();
}

// ---- H5: statewide labels (daybreak + nightfall) ----
for (const theme of [null, 'nightfall']) {
  const { ctx, page } = await newPage(1440, 900, theme);
  await page.goto(`${BASE}/`);
  await waitMapReady(page);
  await page.waitForTimeout(800);
  const labels = await page.evaluate(() => {
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && getComputedStyle(el).display !== 'none';
    };
    const rivers = [...document.querySelectorAll('.river-map-label')].filter(vis);
    return {
      visible: rivers.length,
      stillWater: rivers.filter((el) => el.classList.contains('still-water-label')).length,
      names: rivers.map((el) => el.textContent),
    };
  });
  results[`h5-statewide-${theme ?? 'daybreak'}`] = labels;
  await page.screenshot({ path: join(OUT, `h5-statewide-${theme ?? 'daybreak'}.png`) });
  await ctx.close();
}

// ---- M1: hatch-mode legend + halo ----
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/?mode=hatches&month=9`);
  await waitMapReady(page);
  await page.waitForTimeout(800);
  results['m1-hatch-legend'] = await page.evaluate(() => {
    const el = document.querySelector('.map-legend');
    const halo = document.querySelector('.legend-line.halo');
    return {
      title: el?.querySelector('.legend-title')?.textContent ?? null,
      text: el?.textContent ?? null,
      hasHaloSample: !!halo,
    };
  });
  await page.screenshot({ path: join(OUT, 'm1-hatch-legend-1440x900.png') });
  await ctx.close();
}

// ---- C1 UI: coverage explainer on Assessed filter + footer + drawer chip ----
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/?atlas=1&assessed=1`);
  await waitMapReady(page);
  await page.waitForTimeout(600);
  results['c1-atlas-assessed'] = await page.evaluate(() => {
    const note = document.querySelector('.water-index .empty-note');
    const footer = document.querySelector('.index-footer span');
    return {
      coverageNote: note?.textContent ?? null,
      footer: footer?.textContent ?? null,
    };
  });
  await page.screenshot({ path: join(OUT, 'c1-atlas-coverage-note.png') });
  // drawer freshness chip on an unassessed water (overdue feed)
  await page.goto(`${BASE}/?river=caney-fork-river`);
  await page.waitForTimeout(1500);
  results['c1-drawer-chip'] = await page.evaluate(() => {
    const chip = document.querySelector('.freshness [class*=chip], .freshness span, .freshness *');
    return { freshness: document.querySelector('.freshness')?.textContent ?? null };
  });
  // map-state help line
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(1200);
  results['c1-map-help'] = await page.evaluate(
    () => document.querySelector('.map-help')?.textContent ?? null,
  );
  await page.screenshot({ path: join(OUT, 'c1-map-coverage-help.png') });
  await ctx.close();
}

// ---- H3: unverified species presentation ----
{
  const { ctx, page } = await newPage(1440, 900);
  await page.goto(`${BASE}/?atlas=1`);
  await waitMapReady(page);
  await page.waitForTimeout(600);
  results['h3-atlas-trout-count'] = await page.evaluate(() => {
    const heading = [...document.querySelectorAll('.index-heading strong, strong')].map((e) => e.textContent).find((t) => /waters/.test(t ?? ''));
    const rows = [...document.querySelectorAll('.water-row')].slice(0, 200);
    const unverified = rows.filter((r) => /Unverified/.test(r.textContent ?? '')).length;
    const warm = rows.filter((r) => /Warmwater/.test(r.textContent ?? '')).length;
    return { heading, totalRows: rows.length, unverifiedRows: unverified, warmwaterRows: warm };
  });
  await page.goto(`${BASE}/?river=norris-lake`);
  await page.waitForTimeout(1500);
  results['h3-norris-inspector'] = await page.evaluate(() => ({
    subtitle: document.querySelector('.inspector-subtitle')?.textContent ?? null,
    assessmentTitle: document.querySelector('.assessment-name')?.textContent ?? null,
    assessmentLabel: document.querySelector('.assessment-label')?.textContent ?? null,
    reason: document.querySelector('.assessment-reason')?.textContent?.slice(0, 120) ?? null,
    freshness: document.querySelector('.freshness')?.textContent ?? null,
    scoreDisc: !!document.querySelector('.score-disc'),
  }));
  await page.screenshot({ path: join(OUT, 'h3-m2-norris-inspector.png') });
  await ctx.close();
}

results.consoleErrors = consoleErrs.slice(0, 12);
writeFileSync(join(OUT, 'results-after.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
