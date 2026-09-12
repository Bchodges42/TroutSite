#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * STILLWATER lane — last-resort aerial trace tool for still waters that have
 * NO NHD polygon and NO usable hydrographic source (contract geometry
 * priority 4). Produces a contract-shaped Polygon flagged approximate=true,
 * source "aerial-trace" — never a point, circle, or bounding box.
 *
 * Imagery: Esri World Imagery tiles (server.arcgisonline.com), consumed at
 * build time only; traced geometry is our own digitization.
 *
 * Modes:
 *   node scripts/trace-stillwater.mjs fetch <id> <lon> <lat> <zoom> [span]
 *       Download a span×span tile mosaic centered on lon/lat, overlay a
 *       lon/lat graticule (every 64 px, labels in margins, center crosshair)
 *       and save .atlas-src/stillwater/trace/<id>-<zoom>.png (+ .meta.json).
 *       Read the PNG, pick shoreline pixels.
 *
 *   node scripts/trace-stillwater.mjs emit <id> <zoom> <vertices.json>
 *       vertices.json = [[x,y], ...] mosaic pixel coords (clockwise or ccw).
 *       Emits public/atlas/stillwater/<id>.geojson (contract shape,
 *       MultiPolygon, closed ring, labelAnchor = visual centroid,
 *       approximate: true).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TRACE_DIR = join(webRoot, '.atlas-src', 'stillwater', 'trace');
const OUT_DIR = join(webRoot, '.atlas-src', 'stillwater', 'extract');
const TILE = 256;
const SERVICE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const GRID = 64;
const SCALE = 2; // render mosaic at 2x so shoreline pixels can be picked finely

const [mode, id, lonS, latS, zoomS, spanS] = process.argv.slice(2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function lonLatToPixel(lon, lat, z) {
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n * TILE;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * n * TILE;
  return [x, y];
}

function pixelToLonLat(px, py, z) {
  const n = 2 ** z;
  const lon = (px / (n * TILE)) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * py) / (n * TILE)))) * 180) / Math.PI;
  return [lon, lat];
}

async function fetchTile(z, x, y, tries = 4) {
  const url = `${SERVICE}/${z}/${y}/${x}`;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'trout-atlas-stillwater/1.0 (build trace tool)' },
        signal: AbortSignal.timeout(60000),
      });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      console.log(`  retry ${i + 1}: http ${res.status} ${url}`);
    } catch (e) {
      console.log(`  retry ${i + 1}: ${String(e).slice(0, 80)}`);
    }
    await sleep(3000);
  }
  throw new Error(`tile fetch failed: ${url}`);
}

function graticuleSvg(w, h, z, originPx, gridPx) {
  const lines = [];
  const labels = [];
  for (let gx = 0; gx <= w; gx += gridPx) {
    const [lon] = pixelToLonLat(originPx[0] + gx / SCALE, originPx[1] + h / 2 / SCALE, z);
    lines.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${h}" stroke="#00E5FF" stroke-width="0.6" stroke-opacity="0.55"/>`);
    labels.push(`<rect x="${gx - 26}" y="0" width="52" height="12" fill="#000" fill-opacity="0.55"/>`);
    labels.push(`<text x="${gx}" y="9" fill="#00E5FF" font-size="9" font-family="monospace" text-anchor="middle">${lon.toFixed(5)}</text>`);
    labels.push(`<rect x="${gx - 26}" y="${h - 12}" width="52" height="12" fill="#000" fill-opacity="0.55"/>`);
    labels.push(`<text x="${gx}" y="${h - 3}" fill="#00E5FF" font-size="9" font-family="monospace" text-anchor="middle">${lon.toFixed(5)}</text>`);
  }
  for (let gy = 0; gy <= h; gy += gridPx) {
    const [, lat] = pixelToLonLat(originPx[0] + w / 2 / SCALE, originPx[1] + gy / SCALE, z);
    lines.push(`<line x1="0" y1="${gy}" x2="${w}" y2="${gy}" stroke="#00E5FF" stroke-width="0.6" stroke-opacity="0.55"/>`);
    labels.push(`<rect x="0" y="${gy - 6}" width="58" height="12" fill="#000" fill-opacity="0.55"/>`);
    labels.push(`<text x="1" y="${gy + 3}" fill="#00E5FF" font-size="9" font-family="monospace">${lat.toFixed(5)}</text>`);
    labels.push(`<rect x="${w - 58}" y="${gy - 6}" width="58" height="12" fill="#000" fill-opacity="0.55"/>`);
    labels.push(`<text x="${w - 57}" y="${gy + 3}" fill="#00E5FF" font-size="9" font-family="monospace">${lat.toFixed(5)}</text>`);
  }
  // center crosshair
  lines.push(`<line x1="${w / 2 - 12}" y1="${h / 2}" x2="${w / 2 + 12}" y2="${h / 2}" stroke="#FF3D00" stroke-width="1.4"/>`);
  lines.push(`<line x1="${w / 2}" y1="${h / 2 - 12}" x2="${w / 2}" y2="${h / 2 + 12}" stroke="#FF3D00" stroke-width="1.4"/>`);
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${lines.join('')}${labels.join('')}</svg>`;
}

async function main() {
  const sharp = (await import('sharp')).default;
  mkdirSync(TRACE_DIR, { recursive: true });

  if (mode === 'fetch') {
    const lon = Number(lonS), lat = Number(latS), z = Number(zoomS);
    const span = Number(spanS ?? 2);
    const [cpx, cpy] = lonLatToPixel(lon, lat, z);
    const cxTile = Math.floor(cpx / TILE), cyTile = Math.floor(cpy / TILE);
    const x0Tile = cxTile - Math.floor((span - 1) / 2), y0Tile = cyTile - Math.floor((span - 1) / 2);
    const w = span * TILE * SCALE, h = span * TILE * SCALE;
    const composites = [];
    for (let ty = 0; ty < span; ty++) {
      for (let tx = 0; tx < span; tx++) {
        const buf = await fetchTile(z, x0Tile + tx, y0Tile + ty);
        const png = await sharp(buf).png().toBuffer();
        composites.push({ input: png, left: tx * TILE, top: ty * TILE });
      }
      await sleep(300);
    }
    const originPx = [x0Tile * TILE, y0Tile * TILE];
    const upscaled = [];
    for (const c of composites) {
      const big = await sharp(c.input).resize(TILE * SCALE, TILE * SCALE, { kernel: 'lanczos3' }).png().toBuffer();
      upscaled.push({ input: big, left: c.left * SCALE, top: c.top * SCALE });
    }
    const base = await sharp({ create: { width: w, height: h, channels: 3, background: '#202020' } })
      .composite(upscaled)
      .png()
      .toBuffer();
    const svg = Buffer.from(graticuleSvg(w, h, z, originPx, GRID * SCALE));
    const out = await sharp(base)
      .composite([{ input: svg, left: 0, top: 0 }])
      .png()
      .toBuffer();
    const pngPath = join(TRACE_DIR, `${id}-${z}.png`);
    writeFileSync(pngPath, out);
    writeFileSync(join(TRACE_DIR, `${id}-${z}.meta.json`), JSON.stringify({ id, lon, lat, z, span, originPx, scale: SCALE }, null, 1));
    console.log(`wrote ${pngPath} (${w}x${h}, origin px ${originPx}, scale ${SCALE})`);
    return;
  }

  if (mode === 'emit') {
    const z = Number(lonS); // emit argv: [mode, id, zoom, vertsfile]
    const meta = JSON.parse(readFileSync(join(TRACE_DIR, `${id}-${z}.meta.json`), 'utf8'));
    const pixels = JSON.parse(readFileSync(latS, 'utf8'));
    const scale = meta.scale ?? 1;
    if (!Array.isArray(pixels) || pixels.length < 8) throw new Error('need ≥ 8 [x,y] vertices');
    const originPx = meta.originPx;
    const ring = pixels.map(([x, y]) => {
      const [lon, lat] = pixelToLonLat(originPx[0] + x / scale, originPx[1] + y / scale, z);
      return [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5];
    });
    const [fx, fy] = ring[0];
    const [lx, ly] = ring[ring.length - 1];
    if (fx !== lx || fy !== ly) ring.push([fx, fy]);
    // signed area → enforce right-hand rule (CCW exterior)
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    if (a < 0) { ring.reverse(); a = -a; } // normalize CCW, keep `a` consistent
    const geometry = { type: 'MultiPolygon', coordinates: [ring] };
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of ring) {
      if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y;
      if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
    }
    const _R = ring.map(([x]) => x), _Ry = ring.map(([, y]) => y);
    // area centroid (visual), with first-interior-vertex fallback
    let cx = 0, cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
      const cross = x1 * y2 - x2 * y1;
      cx += (x1 + x2) * cross; cy += (y1 + y2) * cross;
    }
    // shoelace sum `a` = 2·signedArea, so the centroid divisor is 6·(a/2) = 3a
    cx /= 3 * a; cy /= 3 * a;
    const inRing = (() => {
      let ins = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if (yi > cy !== yj > cy && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) ins = !ins;
      }
      return ins;
    })();
    if (!inRing) { cx = ring[0][0]; cy = ring[0][1]; }
    const labelAnchor = [Math.round(cx * 1e5) / 1e5, Math.round(cy * 1e5) / 1e5];
    const verts = ring.length;
    const feature = {
      type: 'Feature',
      properties: {
        id,
        name: meta.name ?? id,
        waterbodyType: meta.waterbodyType ?? 'pond',
        source: 'aerial-trace twra-winter-ponds',
        approximate: true,
        regionId: meta.regionId ?? 'tn-west',
        labelAnchor,
        bounds: b.map((v) => Math.round(v * 1e5) / 1e5),
        partCount: 1,
        vertexCount: verts,
        crs: 'EPSG:4326',
        coordinateOrder: 'longitude,latitude',
      },
      geometry,
    };
    const outPath = join(OUT_DIR, `${id}.geojson`);
    writeFileSync(outPath, `${JSON.stringify(feature)}\n`);
    console.log(`wrote ${outPath} ring=${verts} bounds=${feature.properties.bounds.join(',')} anchor=${labelAnchor.join(',')}`);
    return;
  }

  if (mode === 'preview') {
    // overlay the emitted geojson polygon (or a vertices json) on the mosaic
    const z = Number(lonS); // preview argv: [mode, id, zoom]
    const meta = JSON.parse(readFileSync(join(TRACE_DIR, `${id}-${z}.meta.json`), 'utf8'));
    const scale = meta.scale ?? 1;
    const originPx = meta.originPx;
    const geo = JSON.parse(readFileSync(join(OUT_DIR, `${id}.geojson`), 'utf8'));
    const ring = geo.geometry.coordinates[0];
    const pts = ring.map(([lon, lat]) => {
      const [px, py] = lonLatToPixel(lon, lat, z);
      return [((px - originPx[0]) * scale).toFixed(1), ((py - originPx[1]) * scale).toFixed(1)];
    });
    const poly = `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="#FF00FF" fill-opacity="0.25" stroke="#FF00FF" stroke-width="2"/>`;
    const dots = pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#FF00FF"/>`).join('');
    const W = meta.span * 256 * scale, H = meta.span * 256 * scale;
    const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${poly}${dots}</svg>`);
    const baseImg = sharp(join(TRACE_DIR, `${id}-${z}.png`));
    const out = await baseImg.composite([{ input: svg, left: 0, top: 0 }]).png().toBuffer();
    const outPath = join(TRACE_DIR, `${id}-${z}.preview.png`);
    writeFileSync(outPath, out);
    console.log(`wrote ${outPath}`);
    return;
  }

  throw new Error('mode must be fetch|emit|preview');
}

main().catch((e) => { console.error(e); process.exit(1); });
