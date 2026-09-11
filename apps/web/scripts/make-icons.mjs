/* global console */
/**
 * Renders the Trout PWA icons (192, 512, maskable 512) from an inline SVG via
 * Playwright's Chromium — deterministic, no image tooling required. Output
 * lands in public/icons/ and is committed; re-run only when the mark changes.
 *
 * Run: node scripts/make-icons.mjs   (from apps/web, after `playwright install chromium`)
 */
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function iconSvg({ size, maskable }) {
  const scale = maskable ? 0.62 : 0.72;
  const cx = size / 2;
  const cy = size / 2;
  return `<!doctype html>
<html><body style="margin:0">
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${maskable ? 0 : 110}" fill="#0f172a"/>
  <g transform="translate(${cx} ${cy}) scale(${(size / 512) * scale}) translate(-256 -256)">
    <path fill="#22c55e" d="M96 268 C 140 214, 226 196, 292 218 C 332 231, 362 250, 388 250
      L 428 214 C 422 250, 422 278, 428 314 L 388 278 C 362 278, 332 297, 292 310
      C 226 332, 140 322, 96 268 Z"/>
    <circle cx="146" cy="258" r="10" fill="#0f172a"/>
    <path d="M120 292 C 160 306, 240 308, 300 292" fill="none" stroke="#166534" stroke-width="12" stroke-linecap="round"/>
    <circle cx="300" cy="130" r="20" fill="#f59e0b"/>
    <path d="M300 150 C 300 176, 316 184, 316 202" fill="none" stroke="#f59e0b" stroke-width="10" stroke-linecap="round"/>
  </g>
</svg>
</body></html>`;
}

async function render(browser, { size, maskable, file }) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(iconSvg({ size, maskable }));
  await page.locator('svg').screenshot({ path: join(appRoot, 'public', 'icons', file) });
  await page.close();
  console.log(`icons: wrote public/icons/${file}`);
}

const iconsDir = join(appRoot, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const browser = await chromium.launch();
try {
  await render(browser, { size: 192, maskable: false, file: 'icon-192.png' });
  await render(browser, { size: 512, maskable: false, file: 'icon-512.png' });
  await render(browser, { size: 512, maskable: true, file: 'maskable-512.png' });
} finally {
  await browser.close();
}
console.log('icons: done');
