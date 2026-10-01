#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * QA gap zooms: for each rebuilt river with an unexplained chain separation
 * ≥ 300 m, render a tight view around the gap point with the two facing chain
 * endpoints marked, plus the delivered lakes and imagery context.
 * QA artifact only. Run: node scripts/render-gap-zooms.mjs [id …]
 */
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(webRoot, '.atlas-src', 'east-r2');
const QA = path.join(CACHE, 'qa');
const pwStore = path.join(webRoot, '..', '..', 'node_modules', '.pnpm');
const pwDir = readdirSync(pwStore).find((n) => /^playwright-core@/.test(n));
const { chromium } = createRequire(path.join(pwStore, pwDir, 'package.json'))('playwright-core');

const fc = JSON.parse(readFileSync(path.join(webRoot, 'atlas-sources', 'verified', 'east-southeast.geojson'), 'utf8'));
const byId = Object.fromEntries(fc.features.map((f) => [f.properties.id, f]));
const report = JSON.parse(readFileSync(path.join(CACHE, 'build-report.json'), 'utf8'));

async function tile(z, x, y) {
  try {
    const res = await fetch(`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch { return null; }
}
const lonTx = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const latTy = (lat, z) => Math.floor(((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * 2 ** z);
const txLon = (x, z) => (x / 2 ** z) * 360 - 180;
const tyLat = (y, z) => { const n = Math.PI - (2 * Math.PI * y) / 2 ** z; return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };

function projectFactory(bb, W, H) {
  const [w, s, e, n] = bb;
  const midLat = (s + n) / 2;
  const k = Math.min(W / (e - w), H / (n - s) * (1 / Math.cos((midLat * Math.PI) / 180))) * 0.94;
  const cx = (w + e) / 2, cy = (s + n) / 2;
  return ([lon, lat]) => [W / 2 + (lon - cx) * k, H / 2 - (lat - cy) * k * Math.cos((midLat * Math.PI) / 180)];
}

mkdirSync(QA, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1020, height: 820 } });
const only = process.argv.slice(2);
const W = 1000, H = 800;
const SEAMS = [];
for (const r of report) {
  if (r.kind !== 'river') continue;
  if (only.length && !only.includes(r.id)) continue;
  for (const e of r.unexplainedEnds ?? []) {
    if (e.nearestM < 300) continue;
    SEAMS.push({ id: r.id, at: e.at, nearestM: e.nearestM });
  }
  if (!SEAMS.some((s2) => s2.id === r.id) && r.largestGapM != null && r.largestGapM >= 300) {
    SEAMS.push({ id: r.id, at: r.gapAt, nearestM: r.largestGapM });
  }
}
console.log(`seam zooms to render: ${SEAMS.length}`);
for (const seam of SEAMS) {
  const r = report.find((x) => x.id === seam.id);
  const [gx, gy] = seam.at;
  const bb = [gx - 0.03, gy - 0.022, gx + 0.03, gy + 0.022];
  const proj = projectFactory(bb, W, H);
  const parts = [];
  // imagery backdrop
  const z = 14;
  const x0 = lonTx(bb[0], z), x1 = lonTx(bb[2], z), y0 = latTy(bb[3], z), y1 = latTy(bb[1], z);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const data = await tile(z, x, y);
      if (!data) continue;
      const nw = proj([txLon(x, z), tyLat(y, z)]);
      const se = proj([txLon(x + 1, z), tyLat(y + 1, z)]);
      parts.push(`<image href="${data}" x="${nw[0].toFixed(1)}" y="${nw[1].toFixed(1)}" width="${(se[0] - nw[0]).toFixed(1)}" height="${(se[1] - nw[1]).toFixed(1)}" preserveAspectRatio="none" opacity="0.9"/>`);
    }
  }
  // the reach itself + nearby delivered lakes
  const f = byId[r.id];
  for (const l of f.geometry.coordinates) {
    const d = l.map((c, i) => `${i ? 'L' : 'M'}${proj(c).map((v) => v.toFixed(1)).join(',')}`).join(' ');
    parts.push(`<path d="${d}" fill="none" stroke="#2e86c1" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  for (const ft of fc.features) {
    if (!ft.geometry.type.endsWith('Polygon') || ft.properties.id === r.id) continue;
    const b = ft.properties.bounds;
    if (b[2] < bb[0] || b[0] > bb[2] || b[3] < bb[1] || b[1] > bb[3]) continue;
    const polys = ft.geometry.type === 'MultiPolygon' ? ft.geometry.coordinates : [ft.geometry.coordinates];
    for (const poly of polys) {
      const d = poly[0].map((c, i) => `${i ? 'L' : 'M'}${proj(c).map((v) => v.toFixed(1)).join(',')}`).join(' ') + 'Z';
      parts.push(`<path d="${d}" fill="#7fb3d5" fill-opacity="0.5" stroke="#34648c" stroke-width="0.8"/>`);
    }
  }
  // mark every chain endpoint near the gap
  for (const l of f.geometry.coordinates) {
    for (const [_k, e] of [[0, l[0]], [1, l[l.length - 1]]]) {
      const d = Math.hypot((e[0] - gx) * 88, (e[1] - gy) * 111);
      if (d > 0.035) continue;
      const [x, y] = proj(e);
      parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="none" stroke="#e67e22" stroke-width="2.5"/>`);
    }
  }
  const [gx2, gy2] = proj([gx, gy]);
  parts.push(`<circle cx="${gx2.toFixed(1)}" cy="${gy2.toFixed(1)}" r="4" fill="#c0392b"/>`);
  parts.push(`<text x="12" y="24" font-size="16" font-family="sans-serif" fill="#111">${r.id} — seam ${seam.nearestM} m (${gx.toFixed(4)}, ${gy.toFixed(4)}); orange = chain ends</text>`);
  const html = `<!doctype html><body style="margin:0"><svg width="${W + 20}" height="${H + 20}" xmlns="http://www.w3.org/2000/svg"><rect width="${W + 20}" height="${H + 20}" fill="#ddd"/>${parts.join('')}</svg></body>`;
  const file = path.join(QA, `gap-${r.id}-${gx.toFixed(3)}-${gy.toFixed(3)}.png`);
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: file });
  console.log('rendered', path.basename(file));
}
await browser.close();
