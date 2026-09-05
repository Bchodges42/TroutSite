#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Visual QA render for apps/web/atlas-sources/verified/east-southeast.geojson.
 * Draws the delivered features over Census TIGER 2024 state/county context
 * (authoritative reference linework, public domain) and screenshots the pages
 * with the repo's Playwright Chromium into .atlas-src/east-southeast/qa/*.png.
 * QA artifact only — never a geometry source.
 *
 * Run: node scripts/render-east-southeast-qa.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import shapefile from 'shapefile';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(webRoot, '.atlas-src', 'east-southeast');
const QA = path.join(CACHE, 'qa');
// playwright-core is installed in the workspace pnpm store (apps/e2e deps are
// not linked); resolve the chromium driver from there.
const pwStore = path.join(webRoot, '..', '..', 'node_modules', '.pnpm');
const pwDir = readdirSync(pwStore).find((n) => /^playwright-core@/.test(n));
const { chromium } = createRequire(path.join(pwStore, pwDir, 'package.json'))('playwright-core');

const fc = JSON.parse(readFileSync(path.join(webRoot, 'atlas-sources', 'verified', 'east-southeast.geojson'), 'utf8'));
const byId = Object.fromEntries(fc.features.map((f) => [f.properties.id, f]));
const buildReport = JSON.parse(readFileSync(path.join(CACHE, 'build-report.json'), 'utf8'));

// dams (same registry as the build)
const DAMS = {
  'Norris Dam': [-84.08214, 36.21563], 'Melton Hill Dam': [-84.30076, 35.88536],
  'Fort Loudoun Dam': [-84.24325, 35.79174], 'Watts Bar Dam': [-84.78328, 35.62035],
  'Chickamauga Dam': [-85.22968, 35.10313], 'Nickajack Dam': [-85.62108, 35.00258],
  'Tellico Dam': [-84.25445, 35.78768], 'Cherokee Dam': [-83.49934, 36.1662],
  'Douglas Dam': [-83.53878, 35.9612], 'South Holston Dam': [-82.09726, 36.52356],
  'Boone Dam': [-82.43792, 36.44066], 'Fort Patrick Henry Dam': [-82.50904, 36.49816],
  'Watauga Dam': [-82.12596, 36.33011], 'Wilbur Dam': [-82.12956, 36.34411],
  'Parksville Dam': [-84.6552, 35.0908], 'Ocoee Dam No3': [-84.4699, 35.0371],
  'Chilhowee Dam': [-84.0252, 35.5623], 'Calderwood Dam': [-83.9418, 35.4987],
};

async function contextShapes() {
  const counties = [];
  const src = await shapefile.open(path.join(webRoot, '.atlas-src', 'cb_2024_us_county_5m.shp'));
  let r;
  while ((r = await src.read()).value) {
    if (['47', '51', '37', '13', '01', '28', '21', '54', '11'].includes(r.value.properties.STATEFP)) {
      counties.push(r.value.geometry);
    }
  }
  const states = [];
  const src2 = await shapefile.open(path.join(webRoot, '.atlas-src', 'cb_2024_us_state_5m.shp'));
  while ((r = await src2.read()).value) {
    if (!['47'].includes(r.value.properties.STUSPS)) states.push(r.value.geometry);
  }
  const tn = [];
  const src3 = await shapefile.open(path.join(webRoot, '.atlas-src', 'cb_2024_us_state_5m.shp'));
  while ((r = await src3.read()).value) {
    if (r.value.properties.STUSPS === '47') tn.push(r.value.geometry);
  }
  return { counties, states, tn };
}

function projectFactory(bb, W, H) {
  const [w, s, e, n] = bb;
  const midLat = (s + n) / 2;
  const kx = W / (e - w);
  const ky = H / (n - s) * (1 / Math.cos((midLat * Math.PI) / 180));
  const k = Math.min(kx, ky) * 0.94;
  const cx = (w + e) / 2, cy = (s + n) / 2;
  return ([lon, lat]) => [W / 2 + (lon - cx) * k, H / 2 - (lat - cy) * k * Math.cos((midLat * Math.PI) / 180)];
}
function ringPath(ring, proj) {
  return ring.map((c, i) => `${i ? 'L' : 'M'}${proj(c).map((v) => v.toFixed(1)).join(', ')}`).join(' ') + 'Z';
}
function geomPaths(geom, proj) {
  const out = [];
  if (geom.type === 'Polygon') out.push(ringPath(geom.coordinates[0], proj));
  else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) out.push(ringPath(p[0], proj));
  else if (geom.type === 'LineString') out.push(ringPath(geom.coordinates, proj).replace(/Z$/, ''));
  else if (geom.type === 'MultiLineString') for (const l of geom.coordinates) out.push(ringPath(l, proj).replace(/Z$/, ''));
  return out;
}
function multiGeomRings(geom) {
  const rings = [];
  if (geom.type === 'Polygon') rings.push(geom.coordinates[0]);
  else if (geom.type === 'MultiPolygon') for (const p of geom.coordinates) rings.push(p[0]);
  return rings;
}

function pageHtml(bb, opts, ctx) {
  const W = 1500, H = 1050;
  const proj = projectFactory(bb, W, H);
  const parts = [];
  // county context
  for (const g of ctx.counties) {
    for (const ringPathStr of geomPaths(g, proj)) parts.push(`<path d="${ringPathStr}" fill="none" stroke="#cccccc" stroke-width="0.6"/>`);
  }
  // state context (non-TN slightly darker)
  for (const g of ctx.states) {
    for (const p of geomPaths(g, proj)) parts.push(`<path d="${p}" fill="none" stroke="#989898" stroke-width="1.1"/>`);
  }
  for (const g of ctx.tn) {
    for (const p of geomPaths(g, proj)) parts.push(`<path d="${p}" fill="none" stroke="#555555" stroke-width="1.6"/>`);
  }
  // lakes
  for (const f of fc.features) {
    if (f.geometry.type.endsWith('Polygon')) {
      const sel = !opts.ids || opts.ids.includes(f.properties.id);
      if (!sel) continue;
      for (const p of geomPaths(f.geometry, proj)) parts.push(`<path d="${p}" fill="#7fb3d5" fill-opacity="0.85" stroke="#34648c" stroke-width="0.8"/>`);
    }
  }
  // context lines from the canonical interactive source (existing reaches not replaced by this lane)
  if (opts.context) {
    for (const f of existing.features) {
      if (!opts.contextIds.includes(f.properties?.id)) continue;
      if (!f.geometry.type.endsWith('LineString')) continue;
      const w = ((opts.lineWidth ?? 1.8) * 0.7).toFixed(2);
      for (const p of geomPaths(f.geometry, proj)) {
        parts.push(`<path d="${p}" fill="none" stroke="#e67e22" stroke-opacity="0.9" stroke-width="${w}" stroke-linecap="round"/>`);
      }
    }
  }
  // rivers
  for (const f of fc.features) {
    if (f.geometry.type.endsWith('LineString')) {
      const sel = !opts.ids || opts.ids.includes(f.properties.id);
      if (!sel) continue;
      const isTail = f.properties.waterbodyType === 'tailrace';
      for (const p of geomPaths(f.geometry, proj)) parts.push(`<path d="${p}" fill="none" stroke="${isTail ? '#b06ab3' : '#2e86c1'}" stroke-width="${opts.lineWidth ?? 1.8}" stroke-linecap="round"/>`);
    }
  }
  // dams
  for (const [name, c] of Object.entries(DAMS)) {
    if (c[0] < bb[0] - 0.3 || c[0] > bb[2] + 0.3 || c[1] < bb[1] - 0.3 || c[1] > bb[3] + 0.3) continue;
    const [x, y] = proj(c);
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="none" stroke="#c0392b" stroke-width="2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="#c0392b"/>`);
    if (!opts.noDamLabels) parts.push(`<text x="${(x + 7).toFixed(1)}" y="${(y + 3).toFixed(1)}" font-size="11" fill="#c0392b" font-family="sans-serif">${name}</text>`);
  }
  // labels
  if (!opts.noLabels) {
    for (const f of fc.features) {
      const sel = !opts.ids || opts.ids.includes(f.properties.id);
      if (!sel) continue;
      const a = f.properties.labelAnchor;
      if (!a || a[0] < bb[0] || a[0] > bb[2] || a[1] < bb[1] || a[1] > bb[3]) continue;
      const [x, y] = proj(a);
      parts.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="12" fill="#12324a" text-anchor="middle" font-family="sans-serif" stroke="#ffffff" stroke-width="2.5" paint-order="stroke">${f.properties.name}</text>`);
    }
  }
  return `<!doctype html><html><body style="margin:0"><svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#f7f4ee"/>${parts.join('')}</svg></body></html>`;
}

const existing = JSON.parse(readFileSync(path.join(webRoot, 'public', 'atlas', 'rivers.geojson'), 'utf8'));
const CONTEXT_IDS = ['ocoee-river','parksville-tailwater','hiwassee-river','french-broad-river','pigeon-river','little-pigeon-river','nolichucky-river','doe-river','tellico-river','citico-creek','little-river','little-sequatchie-river','north-chickamauga-creek','sequatchie-river','emory-river','powell-river','holston-river','clinch-river','tennessee-river','south-holston-river','boone-tailwater','ft-patrick-henry-tailwater','watauga-river','west-prong-little-pigeon','middle-prong-little-pigeon','little-tennessee-river'];
const PAGES = [
  { name: 'ctx-ocoee-hiwassee', bb: [-84.95, 34.95, -84.1, 35.5], opts: { contextIds: CONTEXT_IDS, lineWidth: 2.2, context: true } },
  { name: 'ctx-frenchbroad-pigeon', bb: [-83.75, 35.55, -82.7, 36.3], opts: { contextIds: CONTEXT_IDS, lineWidth: 2.2, context: true } },
  { name: 'ctx-ne-system', bb: [-82.75, 36.15, -81.85, 36.72], opts: { contextIds: CONTEXT_IDS, lineWidth: 2.2, context: true } },
  { name: 'statewide', bb: [-90.5, 34.9, -81.6, 36.8], opts: { noLabels: false, noDamLabels: true, lineWidth: 1.2 } },
  { name: 'northeast-system', bb: [-82.75, 36.15, -81.85, 36.72], opts: {} },
  { name: 'knoxville-system', bb: [-84.45, 35.5, -83.4, 36.3], opts: {} },
  { name: 'wattsbar-chickamauga', bb: [-85.35, 35.0, -84.15, 36.05], opts: {} },
  { name: 'nickajack-chattanooga', bb: [-85.75, 34.9, -85.1, 35.45], opts: {} },
  { name: 'ocoee-parksville', bb: [-84.85, 34.9, -84.0, 35.45], opts: {} },
  { name: 'norris-local', bb: [-84.35, 36.1, -83.3, 36.65], opts: {} },
  { name: 'watauga-dams-local', bb: [-82.2, 36.26, -82.05, 36.42], opts: { lineWidth: 2.6 } },
  { name: 'boone-fph-local', bb: [-82.62, 36.3, -82.0, 36.62], opts: { lineWidth: 2.6 } },
  { name: 'cherokee-douglas-local', bb: [-83.7, 35.85, -82.5, 36.62], opts: {} },
];

mkdirSync(QA, { recursive: true });
const ctx = await contextShapes();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 1070 } });
for (const p of PAGES) {
  const html = pageHtml(p.bb, p.opts, ctx);
  const file = path.join(QA, `${p.name}.png`);
  await page.setContent(html);
  await page.screenshot({ path: file });
  console.log('rendered', file);
  if (existsSync(file)) writeFileSync(file.replace('.png', '.html'), html);
}
await browser.close();
console.log('QA renders done.');
