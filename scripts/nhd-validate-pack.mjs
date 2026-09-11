#!/usr/bin/env node
// nhd-validate-pack.mjs — owner review pack renderer (SESSION GEOVALID-2).
//
// Renders before/after map panels for the pack set (all 12 catalog tailwaters
// + 20 featured waters) and writes one SVG per water under docs/nhd-before-after/.
// BEFORE = current shipped linework in apps/web/public/atlas/rivers.geojson
// (read-only, pre-flip). AFTER = the traced NHD reach when one exists, otherwise
// an annotated "pending fan-out" plan panel driven by data/nhd/termini.json.
//
// SVG is the committed source of truth. `--png` additionally captures PNGs via
// headless Chrome (a maintainer render step, never a build/CI dependency):
//   node scripts/nhd-validate-pack.mjs            # SVGs only
//   node scripts/nhd-validate-pack.mjs --png      # SVGs + headless Chrome PNGs
//   node scripts/nhd-validate-pack.mjs --water clinch-river --png
//
// Zero geometry dependencies; reuses nhd_lib/nhd-validate-lib helpers.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { haversineM } from './nhd_lib.mjs';
import { STILLWATER_TYPES, loadCatalogYamls } from './nhd-validate-lib.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wantPng = args.includes('--png');
const waterArg = args.includes('--water') ? args[args.indexOf('--water') + 1] : null;

const asset = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'apps/web/public/atlas/rivers.geojson'), 'utf8'),
);
const assetById = new Map(asset.features.map((f) => [f.properties.id, f]));
const catalog = loadCatalogYamls(path.join(repoRoot, 'packages/content/streams/tn'));
const termini = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/nhd/termini.json'), 'utf8'));
const derivedDir = path.join(repoRoot, 'data/nhd/derived');
const outDir = path.join(repoRoot, 'docs/nhd-before-after');
fs.mkdirSync(outDir, { recursive: true });

// --- pack set: 12 tailwaters + 20 featured (stocked, gauge-anchored first) -----
const flowing = [...catalog.keys()].filter(
  (id) => !STILLWATER_TYPES.has(catalog.get(id).waterbodyType),
);
const tailraces = flowing.filter((id) => catalog.get(id).waterbodyType === 'tailrace').sort();
const gaugeFlowing = flowing.filter(
  (id) =>
    !tailraces.includes(id) &&
    catalog.get(id).stockingProgram === true &&
    termini.waters[id]?.anchor?.source === 'streams-geo',
);
const stockedFlowing = flowing.filter(
  (id) => !tailraces.includes(id) && catalog.get(id).stockingProgram === true,
);
const restFlowing = flowing.filter((id) => !tailraces.includes(id));
const featured = [...new Set([...gaugeFlowing, ...stockedFlowing, ...restFlowing])]
  .sort()
  .slice(0, 20);
const packSet = waterArg ? [waterArg] : [...tailraces, ...featured].sort();

// --- projection helpers ----------------------------------------------------------
function unionBboxes(list) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [a, c, d, e] of list) {
    b[0] = Math.min(b[0], a);
    b[1] = Math.min(b[1], c);
    b[2] = Math.max(b[2], d);
    b[3] = Math.max(b[3], e);
  }
  return b;
}
function geoBbox(parts) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const part of parts)
    for (const [lon, lat] of part) {
      b[0] = Math.min(b[0], lon);
      b[1] = Math.min(b[1], lat);
      b[2] = Math.max(b[2], lon);
      b[3] = Math.max(b[3], lat);
    }
  return b;
}
function makeProjector(bbox, x0, y0, w, h, padM) {
  const midLat = (bbox[1] + bbox[3]) / 2;
  const mPerDegLon = 111320 * Math.cos((midLat * Math.PI) / 180);
  const mPerDegLat = 111132;
  const wM = (bbox[2] - bbox[0]) * mPerDegLon + 2 * padM;
  const hM = (bbox[3] - bbox[1]) * mPerDegLat + 2 * padM;
  const scale = Math.min(w / wM, h / hM);
  const offX = x0 + (w - (bbox[2] - bbox[0]) * mPerDegLon * scale) / 2;
  const offY = y0 + (h + (bbox[3] - bbox[1]) * mPerDegLat * scale) / 2;
  return ([lon, lat]) => [
    offX + (lon - bbox[0]) * mPerDegLon * scale,
    offY - (lat - bbox[1]) * mPerDegLat * scale,
  ];
}
function pathOf(parts, project) {
  return parts
    .map((part) =>
      part
        .map(
          (pt, i) =>
            `${i === 0 ? 'M' : 'L'}${project(pt)
              .map((v) => v.toFixed(1))
              .join(' ')}`,
        )
        .join(' '),
    )
    .join(' ');
}
function scaleBar(bbox, project, x, y) {
  const midLat = (bbox[1] + bbox[3]) / 2;
  const mPerDegLon = 111320 * Math.cos((midLat * Math.PI) / 180);
  const targets = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000];
  const spanM = (bbox[2] - bbox[0]) * mPerDegLon;
  const target = targets.find((t) => t > spanM / 6) ?? 500000;
  const p1 = project([bbox[0], bbox[1]]);
  const p2 = project([bbox[0] + target / mPerDegLon, bbox[1]]);
  const px = Math.abs(p2[0] - p1[0]);
  const label = target >= 1000 ? `${target / 1000} km` : `${target} m`;
  return `<g><line x1="${x}" y1="${y}" x2="${x + px}" y2="${y}" stroke="#8ea2bd" stroke-width="2"/><line x1="${x}" y1="${y - 4}" x2="${x}" y2="${y + 4}" stroke="#8ea2bd" stroke-width="2"/><line x1="${x + px}" y1="${y - 4}" x2="${x + px}" y2="${y + 4}" stroke="#8ea2bd" stroke-width="2"/><text x="${x + px / 2}" y="${y - 8}" fill="#8ea2bd" font-size="13" text-anchor="middle" font-family="Menlo,monospace">${label}</text></g>`;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- per-water SVG ------------------------------------------------------------------
const W = 1560;
const H = 900;
const PAN = { x1: 40, x2: 800, y: 96, w: 720, h: 700 };

function panel(title, subtitle, parts, opts) {
  const planCount = (opts.plan ?? []).length;
  const planYBase = PAN.y + PAN.h - (planCount * 24 + 40);
  const stripTop = planCount > 0 ? planYBase + 18 : Infinity;

  // project geometry + marks; if a mark would land inside the plan strip
  // (anchors can sit outside the pre-flip linework — that is exactly the kind
  // of pre-flip defect the pack shows), retry with growing padding to make
  // room, then render.
  let padM = opts.padM ?? 1500;
  let project = null;
  let markPx = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    project = makeProjector(opts.view, opts.x, PAN.y, PAN.w, PAN.h, padM);
    markPx = (opts.marks ?? []).map((m) => ({ ...m, px: project(m.coord) }));
    const intrudes = planCount > 0 && markPx.some((m) => m.px[1] > stripTop);
    if (!intrudes) break;
    padM *= 1.8;
  }

  const lines = [];
  if (parts && parts.length > 0) {
    lines.push(
      `<path d="${pathOf(parts, project)}" fill="none" stroke="${opts.color}" stroke-width="${opts.width ?? 3}" stroke-linejoin="round" stroke-linecap="round" ${opts.dash ? `stroke-dasharray="${opts.dash}"` : ''} opacity="${opts.opacity ?? 1}"/>`,
    );
  }
  const marks = [];
  for (const m of markPx) {
    const [x, y] = m.px;
    marks.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${m.color}" stroke="#0b111c" stroke-width="2"/>`,
    );
  }
  // labels drawn on a second pass, with a dark halo; skip the anchor label when
  // it would collide with a terminus label at pixel scale (dam and anchor sit
  // within meters at the head of a tailwater)
  for (const m of markPx) {
    if (!m.label) continue;
    if (m.label === 'anchor') {
      const near = markPx.some(
        (o) =>
          o !== m &&
          o.label &&
          o.label !== 'anchor' &&
          Math.hypot(o.px[0] - m.px[0], o.px[1] - m.px[1]) < 40,
      );
      if (near) continue;
    }
    const [x, y] = m.px;
    const above = m.label.startsWith('UP');
    const ly = y + (above ? -14 : m.label.startsWith('DOWN') ? 24 : 5);
    // clamp the label inside its panel: anchor text away from the nearest edge
    const nearLeft = x < opts.x + 150;
    const nearRight = x > opts.x + PAN.w - 150;
    const lx = nearLeft
      ? x + 11
      : nearRight
        ? x - 11
        : m.label.startsWith('DOWN')
          ? x - 11
          : x + 11;
    const anchor = lx > x ? 'start' : 'end';
    marks.push(
      `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${m.color}" font-size="14" font-family="Menlo,monospace" font-weight="bold" text-anchor="${anchor}" paint-order="stroke" stroke="#0b111c" stroke-width="4">${esc(m.label)}</text>`,
    );
  }
  const note = opts.note
    ? `<text x="${opts.x + PAN.w / 2}" y="${PAN.y + PAN.h / 2 - 10}" fill="${opts.noteColor ?? '#5b6b82'}" font-size="19" text-anchor="middle" font-family="Menlo,monospace">${esc(opts.note)}</text>`
    : '';
  const plan = (opts.plan ?? [])
    .map(
      (p, i) =>
        `<text x="${opts.x + 20}" y="${planYBase + 34 + i * 24}" fill="#93a6c2" font-size="15" font-family="Menlo,monospace" paint-order="stroke" stroke="#0b111c" stroke-width="4">${esc(p)}</text>`,
    )
    .join('');
  const planBox =
    (opts.plan ?? []).length > 0
      ? `<rect x="${opts.x + 8}" y="${planYBase + 18}" width="${PAN.w - 16}" height="${(opts.plan ?? []).length * 24 + 22}" rx="6" fill="#0b111c" opacity="0.82"/>${plan}`
      : '';
  return `<g>
<rect x="${opts.x}" y="${PAN.y}" width="${PAN.w}" height="${PAN.h}" rx="10" fill="#111a29"/>
<rect x="${opts.x}" y="${PAN.y}" width="${PAN.w}" height="${PAN.h}" rx="10" fill="none" stroke="#26354e" stroke-width="1.5"/>
<text x="${opts.x + 18}" y="${PAN.y + 34}" fill="${opts.color}" font-size="17" font-family="Menlo,monospace" font-weight="bold">${esc(title)}</text>
<text x="${opts.x + 18}" y="${PAN.y + 56}" fill="#7488a5" font-size="13" font-family="Menlo,monospace">${esc(subtitle)}</text>
${lines.join('\n')}
${marks.join('\n')}
${note}
${planBox}
${scaleBar(opts.view, project, opts.x + 24, planBox ? planYBase - 4 : PAN.y + PAN.h - 24)}
</g>`;
}

function renderWater(id) {
  const doc = catalog.get(id);
  const row = termini.waters[id];
  const before = assetById.get(id);
  const reachPath = path.join(derivedDir, `reach-${id}.geojson`);
  const hasReach = fs.existsSync(reachPath);
  const reach = hasReach ? JSON.parse(fs.readFileSync(reachPath, 'utf8')) : null;

  const beforeParts = before.geometry.coordinates;
  const afterParts = reach ? reach.geometry.coordinates : before.geometry.coordinates;
  const anchorCoord = row?.anchor
    ? [row.anchor.lon, row.anchor.lat]
    : (before.properties.labelAnchor ?? null);
  const viewParts = [geoBbox(beforeParts), geoBbox(afterParts)];
  if (anchorCoord) viewParts.push([anchorCoord[0], anchorCoord[1], anchorCoord[0], anchorCoord[1]]);
  const view = unionBboxes(viewParts);

  const beforeMarks = [];
  if (anchorCoord) beforeMarks.push({ coord: anchorCoord, color: '#e8b64c', label: 'anchor' });
  const trunc = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  const beforeSub = `pre-flip linework · ${before.properties.partCount} part(s) · ${before.properties.lengthKm ?? '?'} km · src ${trunc(String(before.properties.source ?? '—').split(' ')[0], 22)}`;
  const afterMarks = [];
  if (reach) {
    const t = reach.properties.trace;
    if (t?.up?.terminus)
      afterMarks.push({
        coord: t.up.terminus,
        color: '#7ec8ff',
        label: 'UP ' + (t.up.reason ?? ''),
      });
    if (t?.down?.terminus)
      afterMarks.push({
        coord: t.down.terminus,
        color: '#7ec8ff',
        label: 'DOWN ' + (t.down.reason ?? ''),
      });
    afterMarks.push({ coord: [t.anchor.lon, t.anchor.lat], color: '#59d8a0', label: 'anchor' });
  } else if (anchorCoord) {
    afterMarks.push({ coord: anchorCoord, color: '#59d8a0', label: 'anchor' });
  }

  const badge = reach
    ? `<rect x="${W - 330}" y="26" width="290" height="40" rx="20" fill="#12351f"/><text x="${W - 185}" y="52" fill="#59d8a0" font-size="16" text-anchor="middle" font-family="Menlo,monospace" font-weight="bold">NHD REACH READY</text>`
    : `<rect x="${W - 380}" y="26" width="340" height="40" rx="20" fill="#33270f"/><text x="${W - 210}" y="52" fill="#e8b64c" font-size="16" text-anchor="middle" font-family="Menlo,monospace" font-weight="bold">PENDING FAN-OUT (PLAN SHOWN)</text>`;

  const planLines = reach
    ? []
    : [
        `plan  UP   ${row?.up?.spec ?? 'n/a'}  (${row?.up?.confidence ?? 'n/a'})`,
        `plan  DOWN ${row?.down?.spec ?? 'n/a'}  (${row?.down?.confidence ?? 'n/a'})`,
        row?.humanReview
          ? `needs human review: ${row.humanReview}`
          : 'termini auto-derivable from catalog YAML',
      ];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#0b111c"/>
<text x="40" y="44" fill="#e8eef7" font-size="24" font-family="Menlo,monospace" font-weight="bold">${esc(before.properties.name)}</text>
<text x="40" y="70" fill="#7488a5" font-size="14" font-family="Menlo,monospace">${esc(id)} · ${esc(doc?.waterbodyType ?? '')} · ${esc(row?.hu8 ?? 'hu8 pending')} · termini ${esc(row?.autoDerivable ? 'auto-derivable' : 'human review: ' + (row?.humanReview ?? ''))}</text>
${badge}
${panel('BEFORE', beforeSub, beforeParts, { view, x: PAN.x1, color: '#e8b64c', width: 2.5, dash: before.properties.partCount > 1 ? '10 6' : null, marks: beforeMarks })}
${
  reach
    ? panel(
        'AFTER',
        `NHD trace ${reach.properties.hu8} · ${reach.properties.partCount} part · ${reach.properties.lengthKm} km · snap ${reach.properties.trace.anchor.snapDistM} m`,
        afterParts,
        { view, x: PAN.x2, color: '#59d8a0', width: 3, marks: afterMarks },
      )
    : panel('AFTER', 'NHD reach not traced yet — ghost = current linework', afterParts, {
        view,
        x: PAN.x2,
        color: '#3a4a63',
        width: 2,
        opacity: 0.45,
        marks: afterMarks,
        note: 'AFTER panel renders here once GEOFANOUT-1 traces this unit',
        plan: planLines,
      })
}
<text x="40" y="${H - 22}" fill="#5b6b82" font-size="13" font-family="Menlo,monospace">GEOVALID-2 owner review pack · before/after linework · TroutSite NHD flip lane</text>
<text x="${W - 40}" y="${H - 22}" fill="#5b6b82" font-size="13" text-anchor="end" font-family="Menlo,monospace">generated ${new Date().toISOString().slice(0, 10)}</text>
</svg>`;
  return svg;
}

let n = 0;
for (const id of packSet) {
  if (!assetById.has(id)) {
    console.error(`skip ${id}: no asset feature`);
    continue;
  }
  const svg = renderWater(id);
  fs.writeFileSync(path.join(outDir, `${id}.svg`), svg);
  n++;
}
console.log(`wrote ${n} SVG panels to ${path.relative(repoRoot, outDir)}`);
console.log(
  `pack set: ${packSet.length} waters (${tailraces.length} tailwaters + ${featured.length} featured)`,
);

// --- optional PNG capture via headless Chrome ---------------------------------------
// headless Chrome's --window-size includes a browser-UI band, so the viewport
// is shorter than requested and a plain screenshot clips the footer. Capture
// 300 CSS px taller than needed, then crop the bitmap to the exact target
// size (zero-dep PNG decode -> crop -> re-encode).
function decodePng(buf) {
  let pos = 8;
  const idat = [];
  let w = 0;
  let h = 0;
  let colorType = 0;
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      w = buf.readUInt32BE(pos + 8);
      h = buf.readUInt32BE(pos + 12);
      colorType = buf[pos + 17];
    }
    if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = w * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const cur = raw[y * (stride + 1) + 1 + x];
      const left = x >= bpp ? out[y * stride + x - bpp] : 0;
      const up = y > 0 ? out[(y - 1) * stride + x] : 0;
      const ul = y > 0 && x >= bpp ? out[(y - 1) * stride + x - bpp] : 0;
      let v;
      if (ft === 0) v = cur;
      else if (ft === 1) v = cur + left;
      else if (ft === 2) v = cur + up;
      else if (ft === 3) v = cur + ((left + up) >> 1);
      else v = cur + paeth(left, up, ul);
      out[y * stride + x] = v & 0xff;
    }
  }
  return { w, h, bpp, data: out };
}
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function encodePng(w, h, rgb) {
  const stride = w * 3;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4);
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
  };
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function cropPng(buf, targetW, targetH) {
  const img = decodePng(buf);
  const { bpp, data } = img;
  const cropped = Buffer.alloc(targetW * targetH * 3);
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const src = (y * img.w + x) * bpp;
      const dst = (y * targetW + x) * 3;
      cropped[dst] = data[src];
      cropped[dst + 1] = data[src + 1];
      cropped[dst + 2] = data[src + 2];
    }
  }
  return encodePng(targetW, targetH, cropped);
}

if (wantPng) {
  const chromeCandidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/chromium',
    'chromium',
    'google-chrome',
  ];
  const chrome = chromeCandidates.find((c) => {
    try {
      return spawnSync(c, ['--version'], { stdio: 'ignore' }).status === 0;
    } catch {
      return false;
    }
  });
  if (!chrome) {
    console.error('no headless Chrome found; SVGs are the committed source of truth');
    process.exit(2);
  }
  const CAPTURE_H = H + 300; // headless UI band eats viewport height; crop after
  for (const id of packSet) {
    const svgPath = path.join(outDir, `${id}.svg`);
    if (!fs.existsSync(svgPath)) continue;
    const rawOut = path.join(outDir, `.capture-${id}.png`);
    const out = path.join(outDir, `${id}.png`);
    const htmlPath = path.join(outDir, `.capture-${id}.html`);
    fs.writeFileSync(
      htmlPath,
      `<!doctype html><html><head><style>*{margin:0;padding:0}body{background:#0b111c;overflow:hidden}` +
        `img{display:block;width:${W}px;height:${H}px}</style></head>` +
        `<body><img src="${id}.svg"></body></html>`,
    );
    const r = spawnSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1.5',
        `--screenshot=${rawOut}`,
        `--window-size=${W},${CAPTURE_H}`,
        `file://${htmlPath}`,
      ],
      { stdio: 'ignore', timeout: 60000 },
    );
    fs.unlinkSync(htmlPath);
    if (r.status !== 0 || !fs.existsSync(rawOut)) {
      console.log(`PNG FAILED ${id}`);
      continue;
    }
    fs.writeFileSync(out, cropPng(fs.readFileSync(rawOut), W * 1.5, H * 1.5));
    fs.unlinkSync(rawOut);
    console.log(`png ${id}`);
  }
}
