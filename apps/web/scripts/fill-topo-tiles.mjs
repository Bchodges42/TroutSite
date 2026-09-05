// Fill missing hillshade tiles with fully transparent WebP padding.
//
// The TOPO build skips tiles whose masked (TN+3 km) neighborhood contains no
// relief — correct semantics for such a tile are "fully transparent", but a
// MISSING tile is answered by the dev server's SPA fallback with index.html,
// which MapLibre then fails to decode ("The source image could not be
// decoded") and terrain silently breaks. Padding the grid with transparent
// tiles keeps every in-bounds request decodable in dev AND production.
//
// Usage: node scripts/fill-topo-tiles.mjs
// Deterministic; safe to re-run (only writes tiles that are missing).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TOPO_DIR = path.resolve('public/atlas/topo');

// The hillshade source request bounds (mapStyle.ts) — the map can ask for
// any tile intersecting this box, so padding must cover it, not just TN+3 km.
const TN_BBOX = { west: -90.6, south: 34.98, east: -81.45, north: 36.75 };

const lngToX = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z);
const latToY = (lat, z) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z);
};

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(TOPO_DIR, 'manifest.json'), 'utf8'));
  const { minZoom, maxZoom } = manifest.hillshade;
  let written = 0;
  let checked = 0;

  for (let z = minZoom; z <= maxZoom; z++) {
    const x0 = lngToX(TN_BBOX.west, z);
    const x1 = lngToX(TN_BBOX.east, z);
    const y0 = latToY(TN_BBOX.north, z);
    const y1 = latToY(TN_BBOX.south, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        checked++;
        const file = path.join(TOPO_DIR, 'hillshade', String(z), String(x), `${y}.webp`);
        try {
          await fs.access(file);
          continue;
        } catch {
          /* missing — write transparent padding */
        }
        await fs.mkdir(path.dirname(file), { recursive: true });
        await sharp({
          create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
        })
          .webp({ lossless: true })
          .toFile(file);
        written++;
      }
    }
  }
  console.log(`fill-topo-tiles: checked ${checked} in-bounds tiles, wrote ${written} transparent padding tiles`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
