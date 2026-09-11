#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Visual QA render for apps/web/atlas-sources/verified/east-southeast.geojson.
 * Draws the delivered features over Census-derived county/state context (the
 * in-repo tn-counties / states-context / tn-boundary sources, public domain)
 * and screenshots the pages with the repo's Playwright Chromium into
 * .atlas-src/east-r2/qa/*.png. Lake verification pages additionally overlay
 * the TWRA reservoir pool outline and Esri World Imagery tiles (fetched
 * fresh, QA artifact only — never a geometry source).
 *
 * Run: node scripts/render-east-southeast-qa.mjs [page ...]   (default: all)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(webRoot, '.atlas-src', 'east-r2');
const QA = path.join(CACHE, 'qa');
// playwright-core is installed in the workspace pnpm store (apps/e2e deps are
// not linked); resolve the chromium driver from there.
const pwStore = path.join(webRoot, '..', '..', 'node_modules', '.pnpm');
const pwDir = readdirSync(pwStore).find((n) => /^playwright-core@/.test(n));
if (!pwDir) throw new Error('playwright-core not found in pnpm store (run pnpm install)');
const { chromium } = createRequire(path.join(pwStore, pwDir, 'package.json'))('playwright-core');


const fc = JSON.parse(readFileSync(path.join(webRoot, 'atlas-sources', 'verified', 'east-southeast.geojson'), 'utf8'));
const byId = Object.fromEntries(fc.features.map((f) => [f.properties.id, f]));
const buildReport = existsSync(path.join(CACHE, 'build-report.json'))
  ? JSON.parse(readFileSync(path.join(CACHE, 'build-report.json'), 'utf8'))
  : [];
const repById = Object.fromEntries(buildReport.map((r) => [r.id, r]));

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

// TWRA pool outlines (identity cross-check layer)
let twraFeatures = [];
const twraPath = path.join(CACHE, 'twra-reservoirs.geojson');
if (existsSync(twraPath)) {
  twraFeatures = JSON.parse(readFileSync(twraPath, 'utf8')).features ?? [];
}

// Esri World Imagery tile fetch (QA background only)
const imageryCache = new Map();
async function imageryTile(z, x, y) {
  const k = `${z}/${x}/${y}`;
  if (imageryCache.has(k)) return imageryCache.get(k);
  const url = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const data = `data:image/jpeg;base64,${buf.toString('base64')}`;
    imageryCache.set(k, data);
    return data;
  } catch (e) {
    console.log(`  imagery tile ${k} unavailable (${String(e).slice(0, 60)})`);
    imageryCache.set(k, null);
    return null;
  }
}
function lonToTileX(lon, z) { return Math.floor(((lon + 180) / 360) * 2 ** z); }
function latToTileY(lat, z) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}
function tileToLon(x, z) { return (x / 2 ** z) * 360 - 180; }
function tileToLat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
async function imageryLayer(bb, proj, maxTiles = 36) {
  // pick the zoom whose tile grid covers the bbox in ≤ maxTiles tiles
  let z = 14;
  for (; z >= 8; z--) {
    const nx = (lonToTileX(bb[2], z) - lonToTileX(bb[0], z) + 1);
    const ny = (latToTileY(bb[1], z) - latToTileY(bb[3], z) + 1);
    if (nx * ny <= maxTiles) break;
  }
  const parts = [];
  const x0 = lonToTileX(bb[0], z), x1 = lonToTileX(bb[2], z);
  const y0 = latToTileY(bb[3], z), y1 = latToTileY(bb[1], z);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const data = await imageryTile(z, x, y);
      if (!data) continue;
      const nw = proj([tileToLon(x, z), tileToLat(y, z)]);
      const se = proj([tileToLon(x + 1, z), tileToLat(y + 1, z)]);
      const w = (se[0] - nw[0]).toFixed(1), h = (se[1] - nw[1]).toFixed(1);
      parts.push(`<image href="${data}" x="${nw[0].toFixed(1)}" y="${nw[1].toFixed(1)}" width="${w}" height="${h}" preserveAspectRatio="none" opacity="0.85"/>`);
    }
  }
  return parts.join('');
}

const counties = JSON.parse(readFileSync(path.join(webRoot, 'public', 'atlas', 'tn-counties.geojson'), 'utf8')).features;
const states = JSON.parse(readFileSync(path.join(webRoot, 'public', 'atlas', 'states-context.geojson'), 'utf8')).features;
const tnBoundary = JSON.parse(readFileSync(path.join(webRoot, 'public', 'atlas', 'tn-boundary.geojson'), 'utf8')).features;

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

async function pageHtml(bb, opts) {
  const W = 1500, H = 1050;
  const proj = projectFactory(bb, W, H);
  const parts = [];
  if (opts.imagery) parts.push(await imageryLayer(bb, proj));
  for (const g of counties) {
    for (const p of geomPaths(g.geometry, proj)) parts.push(`<path d="${p}" fill="none" stroke="#cccccc" stroke-width="0.6"/>`);
  }
  for (const g of states) {
    for (const p of geomPaths(g.geometry, proj)) parts.push(`<path d="${p}" fill="none" stroke="#989898" stroke-width="1.1"/>`);
  }
  for (const g of tnBoundary) {
    for (const p of geomPaths(g.geometry, proj)) parts.push(`<path d="${p}" fill="none" stroke="#555555" stroke-width="1.6"/>`);
  }
  // TWRA pool outlines (identity cross-check)
  if (opts.twraNames?.length) {
    for (const f of twraFeatures) {
      if (!opts.twraNames.includes(f.properties?.NAME)) continue;
      for (const p of geomPaths(f.geometry, proj)) parts.push(`<path d="${p}" fill="none" stroke="#c0392b" stroke-width="${opts.twraWidth ?? 1.4}" stroke-dasharray="5 3" opacity="0.9"/>`);
    }
  }
  // lakes
  for (const f of fc.features) {
    if (f.geometry.type.endsWith('Polygon')) {
      const sel = !opts.ids || opts.ids.includes(f.properties.id);
      if (!sel) continue;
      for (const p of geomPaths(f.geometry, proj)) parts.push(`<path d="${p}" fill="#7fb3d5" fill-opacity="${opts.imagery ? 0.55 : 0.85}" stroke="#34648c" stroke-width="0.8"/>`);
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
  const legend = opts.legend
    ? `<g font-family="sans-serif" font-size="12"><rect x="${W - 260}" y="${H - 78}" width="250" height="66" fill="#ffffff" opacity="0.9" stroke="#999"/>` +
      `<rect x="${W - 248}" y="${H - 64}" width="24" height="10" fill="#7fb3d5" stroke="#34648c"/><text x="${W - 218}" y="${H - 56}">delivered waterbody</text>` +
      `<line x1="${W - 248}" y1="${H - 42}" x2="${W - 224}" y2="${H - 42}" stroke="#2e86c1" stroke-width="2.5"/><text x="${W - 218}" y="${H - 38}">delivered reach (purple = tailrace)</text>` +
      `<line x1="${W - 248}" y1="${H - 20}" x2="${W - 224}" y2="${H - 20}" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="5 3"/><text x="${W - 218}" y="${H - 16}">TWRA pool outline (cross-check)</text></g>`
    : '';
  return `<!doctype html><html><body style="margin:0"><svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#f7f4ee"/>${parts.join('')}${legend}</svg></body></html>`;
}

const RIVER_PAGES = [
  ['river-tennessee-r2', [-85.85, 34.9, -83.5, 36.2], ['tennessee-river'], { lineWidth: 2.2 }],
  ['river-holston-r2', [-84.16, 35.9, -82.56, 36.6], ['holston-river'], {}],
  ['river-nolichucky-r2', [-83.35, 35.8, -82.42, 36.5], ['nolichucky-river'], {}],
  ['river-powell-r2', [-84.15, 36.2, -83.15, 36.75], ['powell-river', 'norris-lake'], {}],
  ['river-little-tennessee-r2', [-84.45, 35.25, -83.9, 35.95], ['little-tennessee-river'], {}],
  ['river-clinch-r2', [-84.6, 35.7, -84.05, 36.3], ['clinch-river', 'norris-lake', 'melton-hill-lake'], {}],
  ['river-hiwassee-r2', [-85.05, 35.0, -84.2, 35.5], ['hiwassee-river'], {}],
  ['river-obed-emory-r2', [-85.2, 35.85, -84.35, 36.25], ['obed-river', 'emory-river', 'daddys-creek'], {}],
  ['river-plateau-new-clearfork-r2', [-85.0, 36.0, -84.4, 36.62], ['new-river', 'clear-fork', 'south-fork-cumberland'], {}],
  ['river-ocoee-r2', [-84.85, 34.88, -84.25, 35.25], ['ocoee-river', 'parksville-lake', 'ocoee-number-three-lake'], {}],
  ['river-pigeon-r2', [-83.45, 35.6, -82.9, 36.1], ['pigeon-river'], {}],
  ['river-watauga-r2', [-82.6, 36.28, -82.1, 36.55], ['watauga-river', 'wilbur-lake'], {}],
  ['river-south-holston-r2', [-82.34, 36.35, -82.05, 36.62], ['south-holston-river', 'south-holston-lake'], {}],
  ['river-french-broad-r2', [-84.0, 35.7, -82.6, 36.25], ['french-broad-river'], {}],
  ['river-little-river-r2', [-84.05, 35.52, -83.4, 35.95], ['little-river'], {}],
  ['river-sequatchie-r2', [-85.7, 34.98, -84.85, 35.95], ['sequatchie-river'], {}],
  ['river-piney-rhea-r2', [-85.2, 35.55, -84.6, 36.0], ['piney-river-rhea'], {}],
  ['river-creeks-northeast-r2', [-82.95, 36.3, -81.6, 36.7], ['upper-roan-creek', 'horse-creek-greene', 'indian-creek-claiborne', 'richardson-byrd-creek', 'north-fork-holston-river'], {}],
  ['river-wolf-fentress-r2', [-85.25, 36.4, -84.75, 36.72], ['wolf-river-fentress'], {}],
];

const LAKE_PAGES = [
  ['lake-norris-r2', [-84.4, 36.1, -83.3, 36.55], ['norris-lake'], { twraNames: ['Norris Lake'], legend: true }],
  ['lake-norris-imagery', [-84.2, 36.15, -83.75, 36.5], ['norris-lake'], { imagery: true, twraNames: ['Norris Lake'], legend: true }],
  ['lake-nickajack-r2', [-85.75, 34.9, -85.1, 35.4], ['nickajack-lake'], { twraNames: ['Nickajack Lake'], legend: true }],
  ['lake-boone-verify', [-82.65, 36.3, -82.15, 36.65], ['boone-lake'], { twraNames: ['Boone Lake'], legend: true }],
  ['lake-boone-imagery', [-82.6, 36.32, -82.25, 36.6], ['boone-lake', 'south-holston-river', 'watauga-river'], { imagery: true, twraNames: ['Boone Lake'], legend: true }],
];

const SYSTEM_PAGES = [
  ['statewide-r2', [-90.5, 34.9, -81.6, 36.8], null, { noLabels: false, noDamLabels: true, lineWidth: 1.1 }],
  ['northeast-system-r2', [-82.75, 36.15, -81.85, 36.72], null, {}],
  ['knoxville-system-r2', [-84.45, 35.5, -83.4, 36.3], null, {}],
  ['wattsbar-chickamauga-r2', [-85.35, 35.0, -84.15, 36.05], null, {}],
  ['nickajack-chattanooga-r2', [-85.75, 34.9, -85.1, 35.45], null, {}],
];

const PAGES = [
  ...SYSTEM_PAGES.map(([name, bb, ids, opts]) => ({ name, bb, ids, opts })),
  ...LAKE_PAGES.map(([name, bb, ids, opts]) => ({ name, bb, ids, opts })),
  ...RIVER_PAGES.map(([name, bb, ids, opts]) => ({ name, bb, ids, opts })),
];

const onlyPages = process.argv.slice(2).filter((a) => !a.startsWith('--'));
mkdirSync(QA, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1520, height: 1070 } });
for (const p of PAGES) {
  if (onlyPages.length && !onlyPages.includes(p.name)) continue;
  const html = await pageHtml(p.bb, { ...(p.opts ?? {}), ...(p.ids ? { ids: p.ids } : {}) });
  const file = path.join(QA, `${p.name}.png`);
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: file });
  writeFileSync(file.replace('.png', '.html'), html);
  const rep = p.ids?.length === 1 ? repById[p.ids[0]] : null;
  console.log('rendered', path.basename(file), rep ? `(${rep.kind}: ${rep.chains ?? rep.partsDelivered} parts, gap ${rep.largestGapM ?? 0} m)` : '');
}
await browser.close();
console.log('QA renders done.');
