#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * WEST/MIDDLE lane — preview renders for the visual inspection gate.
 *
 * Renders each verified feature at three zooms (statewide / regional / local)
 * with county-line context, the independent TN state-layer reference (where
 * available) in a second color, and Census TIGER water context. Produces
 * contact sheets in .atlas-src/west-middle/render/ for judge review:
 *
 *   sheet-statewide.png   all features on the TN frame with id labels
 *   sheet-<group>-regional.png   grouped regional frames
 *   local/<id>.png        per-feature local frames (a subset sheet each)
 *
 * Run: node scripts/west-middle-render.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(webRoot, '.atlas-src', 'west-middle');
const VERIFIED = join(webRoot, 'atlas-sources', 'verified');
const COUNTIES = join(webRoot, '.atlas-src', 'out', 'tn-counties.geojson');
const RENDER = join(CACHE, 'render');

const W = 1100, H = 620;
const TN = [-90.4, 34.9, -81.5, 36.8]; // statewide frame

mkdirSync(RENDER, { recursive: true });
mkdirSync(join(RENDER, 'local'), { recursive: true });

const fc = JSON.parse(readFileSync(join(VERIFIED, 'west-middle.geojson'), 'utf8'));
const counties = existsSync(COUNTIES) ? JSON.parse(readFileSync(COUNTIES, 'utf8')) : { features: [] };
let stateRef = null;
const refPath = join(CACHE, 'state-reservoirs.json');
if (existsSync(refPath)) stateRef = JSON.parse(readFileSync(refPath, 'utf8'));

function makeProj(bbox, w, h, pad = 0.06) {
  const [x0, y0, x1, y1] = bbox;
  const dx = (x1 - x0) || 0.01, dy = (y1 - y0) || 0.01;
  const px = dx * pad, py = dy * pad;
  const bx0 = x0 - px, bx1 = x1 + px, by0 = y0 - py, by1 = y1 + py;
  const kx = w / (bx1 - bx0), ky = h / (by1 - by0);
  const k = Math.min(kx, ky);
  const ox = (w - (bx1 - bx0) * k) / 2, oy = (h - (by1 - by0) * k) / 2;
  return ([lon, lat]) => [ox + (lon - bx0) * k, h - (oy + (lat - by0) * k)];
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function pathFor(geom, proj) {
  const ringsToPath = (rings) => rings.map((r) => {
    const d = r.map((p, i) => `${i ? 'L' : 'M'}${proj(p).map((v) => v.toFixed(1)).join(' ')}`).join('') + 'Z';
    return d;
  }).join('');
  if (geom.type === 'Polygon') return [{ d: ringsToPath(geom.coordinates), fill: true }];
  if (geom.type === 'MultiPolygon') return geom.coordinates.map((poly) => ({ d: ringsToPath(poly), fill: true }));
  if (geom.type === 'LineString') return [{ d: geom.coordinates.map((p, i) => `${i ? 'L' : 'M'}${proj(p).map((v) => v.toFixed(1)).join(' ')}`).join(''), fill: false }];
  if (geom.type === 'MultiLineString') return geom.coordinates.map((l) => ({ d: l.map((p, i) => `${i ? 'L' : 'M'}${proj(p).map((v) => v.toFixed(1)).join(' ')}`).join(''), fill: false }));
  return [];
}

function countyPaths(proj) {
  const out = [];
  for (const f of counties.features) {
    const g = f.geometry;
    if (g.type === 'Polygon') out.push(ringsToPath(g.coordinates, proj));
    else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) out.push(ringsToPath(poly, proj));
  }
  return out.join('');
}
function ringsToPath(rings, proj) {
  return rings.map((r) => r.map((p, i) => `${i ? 'L' : 'M'}${proj(p).map((v) => v.toFixed(1)).join(' ')}`).join('') + 'Z').join('');
}
function stateRefPaths(name, proj) {
  if (!stateRef) return '';
  let d = '';
  for (const f of stateRef.features) {
    if (String(f.properties?.NAME ?? '').toLowerCase() !== name.toLowerCase()) continue;
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) d += poly[0].map((p, i) => `${i ? 'L' : 'M'}${proj(p).map((v) => v.toFixed(1)).join(' ')}`).join('') + 'Z';
  }
  return d ? `<path d="${d}" fill="none" stroke="#d33" stroke-width="1.6" stroke-dasharray="5 3" opacity="0.9"/>` : '';
}

function svgFrame({ title, bbox, feature, sub = '' }) {
  const proj = makeProj(bbox, W, H);
  const isPoly = feature.geometry.type.includes('Polygon');
  const paths = pathFor(feature.geometry, proj);
  const ref = isPoly ? stateRefPaths(feature.properties.name, proj) : '';
  const body = countyPaths(proj);
  const dashes = isPoly
    ? paths.map((p) => `<path d="${p.d}" fill="#a8c8e8" stroke="#1d4e79" stroke-width="1.4"/>`).join('')
    : paths.map((p) => `<path d="${p.d}" fill="none" stroke="#c94f30" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`).join('');
  const label = `<text x="14" y="26" font-family="Segoe UI,Arial" font-size="17" font-weight="600" fill="#111">${esc(title)}</text>
  <text x="14" y="46" font-family="Segoe UI,Arial" font-size="12" fill="#444">${esc(sub)}</text>`;
  const legend = ref ? '<text x="' + (W - 240) + '" y="26" font-family="Segoe UI,Arial" font-size="12" fill="#d33">red dashed = TN state layer ref</text>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#f4f2ed"/>
<g>${body ? `<path d="${body}" fill="none" stroke="#b9b3a6" stroke-width="0.7"/>` : ''}</g>
${dashes}${ref}${label}${legend}
</svg>`;
}

async function toPng(svg, out) {
  const sharp = (await import('sharp')).default;
  await sharp(Buffer.from(svg), { density: 110 }).png().toFile(out);
}

function framesFor(f) {
  const b = f.properties.bounds;
  const id = f.properties.id;
  const out = [];
  out.push({ key: 'state', title: `${id} — statewide`, bbox: TN, feature: f, sub: 'TN frame · blue fill = delivered polygon · red line = delivered river' });
  const dx = (b[2] - b[0]) || 0.02, dy = (b[3] - b[1]) || 0.02;
  const rb = [b[0] - dx * 1.0, b[1] - dy * 1.0, b[2] + dx * 1.0, b[3] + dy * 1.0];
  out.push({ key: 'regional', title: `${id} — regional`, bbox: rb, feature: f, sub: 'context = TN county lines; red dashed = independent state layer' });
  const lb = [b[0] - dx * 0.25, b[1] - dy * 0.25, b[2] + dx * 0.25, b[3] + dy * 0.25];
  out.push({ key: 'local', title: `${id} — local`, bbox: lb, feature: f, sub: 'bounds box + vertex detail' });
  return out;
}

async function main() {
  const lakeFeats = fc.features.filter((f) => f.geometry.type.includes('Polygon') && f.properties.partCount !== undefined);
  const riverFeats = fc.features.filter((f) => f.geometry.type.includes('LineString'));
  const stillFeats = fc.features.filter((f) => f.geometry.type.includes('Polygon'));

  // statewide sheet: all features, one frame
  {
    const proj = makeProj(TN, W, H);
    let body = '';
    for (const f of fc.features) {
      const isPoly = f.geometry.type.includes('Polygon');
      const col = isPoly ? '#4d8fce' : '#c94f30';
      for (const p of pathFor(f.geometry, proj)) {
        body += `<path d="${p.d}" fill="${isPoly ? '#7fb2dd' : 'none'}" stroke="${col}" stroke-width="${isPoly ? 0.9 : 2.2}" opacity="0.95"/>`;
      }
      const [lx, ly] = proj(f.properties.labelAnchor);
      body += `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.6" fill="#111"/><text x="${(lx + 4).toFixed(1)}" y="${(ly + 3).toFixed(1)}" font-family="Segoe UI,Arial" font-size="8.5" fill="#222">${esc(f.properties.id)}</text>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#f4f2ed"/>
<path d="${countyPaths(proj)}" fill="none" stroke="#b9b3a6" stroke-width="0.6"/>
${body}
<text x="14" y="24" font-family="Segoe UI,Arial" font-size="16" font-weight="600">west-middle.geojson — ${fc.features.length} features · statewide</text>
</svg>`;
    await toPng(svg, join(RENDER, 'sheet-statewide.png'));
  }

  // regional + local sheets, grouped
  const groups = [
    ['lakes-major', stillFeats.filter((f) => ['kentucky-lake', 'pickwick-lake', 'lake-barkley', 'old-hickory-lake', 'j-percy-priest-lake', 'tims-ford-lake'].includes(f.properties.id))],
    ['lakes-middle', stillFeats.filter((f) => ['center-hill-lake', 'dale-hollow-lake', 'normandy-lake', 'reelfoot-lake', 'woods-reservoir', 'great-falls-lake'].includes(f.properties.id))],
    ['rivers-west', riverFeats.filter((f) => ['mississippi-river', 'obion-river', 'hatchie-river', 'wolf-river-west-tennessee', 'tennessee-river'].includes(f.properties.id))],
    ['rivers-middle', riverFeats.filter((f) => ['cumberland-river', 'buffalo-river', 'little-buffalo-river', 'harpeth-river', 'duck-river-tailwater', 'duck-river-lower', 'elk-river', 'elk-river-lower', 'caney-fork-river', 'caney-fork-upper', 'stones-river', 'east-fork-stones-river', 'west-fork-stones-river', 'obey-river'].includes(f.properties.id))],
    ['streams', riverFeats.filter((f) => !['mississippi-river', 'obion-river', 'hatchie-river', 'wolf-river-west-tennessee', 'tennessee-river', 'cumberland-river', 'buffalo-river', 'little-buffalo-river', 'harpeth-river', 'duck-river-tailwater', 'duck-river-lower', 'elk-river', 'elk-river-lower', 'caney-fork-river', 'caney-fork-upper', 'stones-river', 'east-fork-stones-river', 'west-fork-stones-river', 'obey-river'].includes(f.properties.id))],
  ];
  for (const [name, feats] of groups) {
    if (!feats.length) continue;
    for (const zoom of ['regional', 'local']) {
      const cols = 2, cellW = W / cols, cellH = 480;
      const rows = Math.ceil(feats.length / cols);
      const SH = rows * cellH + 60;
      let cells = '';
      for (const [i, f] of feats.entries()) {
        const fr = framesFor(f).find((x) => x.key === zoom);
        const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
        const proj = makeProj(fr.bbox, cellW - 20, cellH - 40);
        let d = '';
        const isPoly = f.geometry.type.includes('Polygon');
        for (const p of pathFor(f.geometry, proj)) {
          d += isPoly
            ? `<path d="${p.d}" fill="#7fb2dd" stroke="#1d4e79" stroke-width="1.1"/>`
            : `<path d="${p.d}" fill="none" stroke="#c94f30" stroke-width="2.6"/>`;
        }
        if (isPoly) d += stateRefPaths(f.properties.name, proj);
        const cellCounties = countyPaths(proj);
        cells += `<g transform="translate(${cx + 10},${cy + 30})"><rect width="${cellW - 20}" height="${cellH - 40}" fill="#f9f8f4" stroke="#ddd"/>
<path d="${cellCounties}" fill="none" stroke="#cfc9bd" stroke-width="0.7"/>
${d}
<text x="8" y="-8" font-family="Segoe UI,Arial" font-size="13" font-weight="600" fill="#111">${esc(f.properties.id)}</text></g>`;
      }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${SH}" viewBox="0 0 ${W} ${SH}">
<rect width="${W}" height="${SH}" fill="#ffffff"/>
<text x="14" y="24" font-family="Segoe UI,Arial" font-size="16" font-weight="600">${esc(name)} — ${zoom} (${feats.length})</text>
${cells}
</svg>`;
      await toPng(svg, join(RENDER, `sheet-${name}-${zoom}.png`));
    }
  }

  // per-feature local renders (full frames)
  for (const f of fc.features) {
    for (const fr of framesFor(f)) {
      if (fr.key === 'state') continue;
      await toPng(svgFrame(fr), join(RENDER, 'local', `${f.properties.id}-${fr.key}.png`));
    }
  }
  console.log(`rendered sheets + ${fc.features.length * 2} per-feature frames → ${RENDER}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
