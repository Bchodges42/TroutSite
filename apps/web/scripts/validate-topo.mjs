// Structural validator for public/atlas/topo (Task 6e Phase B, guide steps 6–7;
// B14 additions noted). Checks: manifest-vs-reality (band byte counts, feature
// counts, hillshade tile count and byte sum, top-level bytes), contour
// coordinates inside the TN clip (+0.01° epsilon), elevation multiples per band
// (100/50/20 m), hillshade tile names/zoom range/web-mercator ranges, WebP
// magic bytes, B14 shadow-alpha encoding (every tile reports hasAlpha:true;
// decoded spot-checks must be black-RGB with real shadow alpha; manifest pins
// the shadow-alpha contract + TN-boundary mask provenance), and the guide's
// size targets (contours ≤ 12 MB, hillshade ≤ 60 MB; warn within +20%, fail
// beyond it). Exits non-zero on failure. Fails cleanly (message only, never a
// stack trace) when the topo output or manifest isn't built yet.
//
// Run: node scripts/validate-topo.mjs
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const TOPO = join(here, '..', 'public', 'atlas', 'topo');
// Mirrors validate-atlas.mjs (frozen): [minLon, minLat, maxLon, maxLat], lon/lat.
const CLIP = [-90.6, 34.98, -81.45, 36.75];
const CLIP_EPS = 0.01; // degrees of slack around the clip for contour coordinates
const BANDS = [
  { file: 'contours-band0.geojson', intervalM: 100 },
  { file: 'contours-band1.geojson', intervalM: 50 },
  { file: 'contours-band2.geojson', intervalM: 20 },
];
const ZOOM_RANGE = [7, 11];
const TARGET_MB = { contours: 12, hillshade: 60 };
const FAIL_TOLERANCE = 1.2; // stop-condition: fail when a target is exceeded by more than +20%

// B14 pinned contract — must mirror build-topo.mjs.
const HILL_ENCODING = 'shadow-alpha';
const HILL_MAX_ALPHA = 235;
const MASK_SOURCE = 'public/atlas/tn-boundary.geojson';
const MASK_BUFFER_M = 3000;

const MB = 1024 * 1024;
const fmtMB = (bytes) => `${(bytes / MB).toFixed(1)} MB`;
const errors = [];
const warns = [];
const tilePaths = []; // collected during the walk, decoded in the B14 alpha pass

const fail = (reason) => {
  console.error(`validate-topo: FAIL — ${reason}`);
  process.exit(1);
};

// Read only the first n bytes (WebP magic check without loading whole tiles).
const readHead = (p, n = 12) => {
  const fd = openSync(p, 'r');
  try {
    const buf = Buffer.alloc(n);
    const got = readSync(fd, buf, 0, n, 0);
    return got === n ? buf : null;
  } finally {
    closeSync(fd);
  }
};

// Web-mercator tile math, only used for clip-vicinity sanity (warn-level).
const lonToTileX = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const latToTileY = (lat, z) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z);
};

const spotSamples = new Map(); // z → first tile seen (deterministic decode sample)

// B14 alpha pass: every tile must report hasAlpha:true (shadow-only RGBA
// contract), and one decoded tile per zoom must be black-RGB with real
// shadow alpha. Header metadata is cheap for all tiles; full decode only on
// the per-zoom spot sample.
async function verifyShadowAlpha() {
  if (!tilePaths.length) return;
  let i = 0;
  let noAlpha = 0;
  let noAlphaExample = null;
  const worker = async () => {
    while (i < tilePaths.length) {
      const p = tilePaths[i++];
      try {
        const meta = await sharp(p).metadata();
        if (!meta.hasAlpha) {
          noAlpha++;
          if (!noAlphaExample) noAlphaExample = p;
        }
      } catch (e) {
        errors.push(`${p}: unreadable by sharp (${e.message})`);
      }
    }
  };
  await Promise.all(Array.from({ length: 16 }, worker));
  if (noAlpha) {
    errors.push(
      `${noAlpha}/${tilePaths.length} hillshade tiles without an alpha channel (opaque pre-B14 grayscale cannot blend onto a dark ground), e.g. ${noAlphaExample}`,
    );
  } else {
    console.log(`shadow-alpha: ${tilePaths.length}/${tilePaths.length} tiles report hasAlpha:true`);
  }
  for (const z of [...spotSamples.keys()].sort((a, b) => a - b)) {
    const p = spotSamples.get(z);
    let decoded;
    try {
      decoded = await sharp(p).raw().toBuffer({ resolveWithObject: true });
    } catch (e) {
      errors.push(`hillshade z${z} spot tile: decode failed (${e.message})`);
      continue;
    }
    const { data, info } = decoded;
    const rel = p.slice(p.indexOf('hillshade'));
    if (info.channels !== 4) {
      errors.push(`${rel}: decoded ${info.channels} channels, expected 4 (RGBA shadow-only)`);
      continue;
    }
    let nonBlack = 0;
    let maxAlpha = 0;
    for (let o = 0; o < data.length; o += 4) {
      if (data[o] !== 0 || data[o + 1] !== 0 || data[o + 2] !== 0) nonBlack++;
      if (data[o + 3] > maxAlpha) maxAlpha = data[o + 3];
    }
    if (nonBlack) errors.push(`${rel}: ${nonBlack} non-black RGB pixels — shadow-only contract violated`);
    if (maxAlpha === 0) errors.push(`${rel}: no shadow signal (all alpha 0) — tile should have been skipped`);
  }
}

const main = async () => {
  // ---- manifest exists + parses ------------------------------------------
  const manifestPath = join(TOPO, 'manifest.json');
  if (!existsSync(manifestPath)) {
    fail(
      'public/atlas/topo/manifest.json not found — topo output not built yet (run: node scripts/fetch-tn-dem.mjs, then node scripts/build-topo.mjs)',
    );
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    fail(`manifest.json does not parse as JSON (${e.message})`);
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail('manifest.json is not a JSON object');
  }

  // ---- manifest shape (pinned contract) -----------------------------------
  if (typeof manifest.generated !== 'string' || Number.isNaN(Date.parse(manifest.generated))) {
    errors.push(`manifest.generated missing or not ISO-parseable (${JSON.stringify(manifest.generated)})`);
  }
  if (manifest.minZoom !== ZOOM_RANGE[0] || manifest.maxZoom !== ZOOM_RANGE[1]) {
    errors.push(`top-level minZoom/maxZoom ${manifest.minZoom}/${manifest.maxZoom}, expected ${ZOOM_RANGE[0]}/${ZOOM_RANGE[1]}`);
  }
  if (!Number.isInteger(manifest.bytes)) errors.push('top-level manifest.bytes missing or not an integer');
  if (!Array.isArray(manifest.bands)) {
    errors.push('manifest.bands missing or not an array');
  } else {
    if (manifest.bands.length !== BANDS.length) {
      errors.push(`manifest.bands has ${manifest.bands.length} entries, expected ${BANDS.length}`);
    }
    for (const entry of manifest.bands) {
      if (!entry || !BANDS.some((b) => b.file === entry.file)) {
        errors.push(`manifest.bands has unexpected entry ${JSON.stringify(entry && entry.file)}`);
      }
    }
  }
  const hill = manifest.hillshade;
  if (!hill || typeof hill !== 'object') {
    errors.push('manifest.hillshade missing');
  } else {
    if (hill.pattern !== 'hillshade/{z}/{x}/{y}.webp') {
      errors.push(`manifest.hillshade.pattern ${JSON.stringify(hill.pattern)} !== "hillshade/{z}/{x}/{y}.webp"`);
    }
    if (hill.minZoom !== ZOOM_RANGE[0] || hill.maxZoom !== ZOOM_RANGE[1]) {
      errors.push(`manifest.hillshade minZoom/maxZoom ${hill.minZoom}/${hill.maxZoom}, expected ${ZOOM_RANGE[0]}/${ZOOM_RANGE[1]}`);
    }
    if (!Number.isInteger(hill.tiles)) errors.push('manifest.hillshade.tiles missing or not an integer');
    if (!Number.isInteger(hill.bytes)) errors.push('manifest.hillshade.bytes missing or not an integer');
    // B14 pinned contract: shadow-only alpha encoding.
    if (hill.encoding !== HILL_ENCODING) {
      errors.push(`manifest.hillshade.encoding ${JSON.stringify(hill.encoding)} !== ${JSON.stringify(HILL_ENCODING)} (pre-B14 grayscale tiles cannot blend onto a dark ground)`);
    }
    if (hill.maxAlpha !== HILL_MAX_ALPHA) {
      errors.push(`manifest.hillshade.maxAlpha ${JSON.stringify(hill.maxAlpha)} !== ${HILL_MAX_ALPHA}`);
    }
  }
  // B14 pinned contract: state-boundary clip provenance.
  const mask = manifest.mask;
  if (!mask || typeof mask !== 'object') {
    errors.push('manifest.mask missing (B14 TN-boundary clip provenance)');
  } else {
    if (mask.source !== MASK_SOURCE) {
      errors.push(`manifest.mask.source ${JSON.stringify(mask.source)} !== ${JSON.stringify(MASK_SOURCE)}`);
    }
    if (mask.bufferM !== MASK_BUFFER_M) {
      errors.push(`manifest.mask.bufferM ${JSON.stringify(mask.bufferM)} !== ${MASK_BUFFER_M}`);
    }
  }

  // ---- contour bands: bytes, feature counts, structure, coords, elevations -
  const bandStats = [];
  for (const b of BANDS) {
    const p = join(TOPO, b.file);
    if (!existsSync(p)) {
      errors.push(`${b.file}: missing (referenced by manifest)`);
      bandStats.push({ ...b, bytes: 0, features: 0, coords: 0 });
      continue;
    }
    const bytes = statSync(p).size;
    const entry = Array.isArray(manifest.bands) ? manifest.bands.find((x) => x && x.file === b.file) : undefined;
    if (entry) {
      if (entry.intervalM !== b.intervalM) {
        errors.push(`${b.file}: manifest intervalM ${entry.intervalM}, expected ${b.intervalM}`);
      }
      if (entry.bytes !== bytes) errors.push(`${b.file}: manifest bytes ${entry.bytes}, actual ${bytes}`);
    }

    let features = 0;
    let coords = 0;
    let geo = null;
    let text = null;
    try {
      text = readFileSync(p, 'utf8');
    } catch (e) {
      errors.push(`${b.file}: unreadable (${e.message})`);
    }
    if (text !== null) {
      // Light feature count: substring occurrences instead of walking the parse tree.
      features = (text.match(/"type"\s*:\s*"Feature"/g) || []).length;
      // Pinned-contract spot-check: positions serialized at 5 decimal places.
      const positions = text.match(/\[\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\]/g) || [];
      let badPrecision = 0;
      for (const raw of positions) {
        const nums = raw.slice(1, -1).split(',');
        if (!nums.every((s) => /^-?\d+\.\d{5}$/.test(s.trim()))) badPrecision++;
      }
      if (positions.length > 0 && badPrecision > 0) {
        warns.push(`${b.file}: ${badPrecision}/${positions.length} coordinates not at the pinned 5 decimal places`);
      }
      try {
        geo = JSON.parse(text);
      } catch (e) {
        errors.push(`${b.file}: does not parse as JSON (${e.message})`);
      }
    }

    if (geo) {
      if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) {
        errors.push(`${b.file}: not a FeatureCollection`);
      } else {
        if (geo.features.length !== features) {
          errors.push(`${b.file}: parsed ${geo.features.length} features but counted ${features} "type":"Feature" occurrences`);
        }
        const minLon = CLIP[0] - CLIP_EPS;
        const minLat = CLIP[1] - CLIP_EPS;
        const maxLon = CLIP[2] + CLIP_EPS;
        const maxLat = CLIP[3] + CLIP_EPS;
        let outside = 0;
        let nonFinite = 0;
        let badElev = 0;
        let outsideExample = null;
        let elevExample = null;
        const walk = (node, H) => {
          if (Array.isArray(node) && typeof node[0] === 'number') {
            coords++;
            const [x, y] = node;
            if (!Number.isFinite(x) || !Number.isFinite(y)) nonFinite++;
            else if (x < minLon || y < minLat || x > maxLon || y > maxLat) {
              outside++;
              if (!outsideExample) outsideExample = `[${x}, ${y}] (H=${H})`;
            }
            return;
          }
          if (!Array.isArray(node)) return;
          for (const child of node) walk(child, H);
        };
        for (const f of geo.features) {
          const H = f && f.properties ? f.properties.H : undefined;
          if (!Number.isFinite(H) || H % b.intervalM !== 0) {
            badElev++;
            if (!elevExample) elevExample = JSON.stringify(H);
          }
          if (f && f.geometry && f.geometry.coordinates) walk(f.geometry.coordinates, H);
        }
        if (badElev) {
          errors.push(`${b.file}: ${badElev}/${geo.features.length} features with H not a multiple of ${b.intervalM} m (e.g. H=${elevExample})`);
        }
        if (nonFinite) errors.push(`${b.file}: ${nonFinite} non-finite coordinates`);
        if (outside) {
          errors.push(`${b.file}: ${outside} coordinates outside TN clip ±${CLIP_EPS}° (e.g. ${outsideExample})`);
        }
      }
    }
    bandStats.push({ ...b, bytes, features, coords });
  }
  const bandBytes = bandStats.reduce((n, b) => n + b.bytes, 0);

  // ---- hillshade tree: names, ranges, magic bytes, totals -----------------
  const hillDir = join(TOPO, 'hillshade');
  const perZoom = new Map();
  let tileCount = 0;
  let tileBytes = 0;
  let outsideVicinity = 0;
  let vicinityExample = null;
  const [zMin, zMax] = ZOOM_RANGE;
  if (!existsSync(hillDir)) {
    errors.push('hillshade/ directory missing');
  } else {
    for (const zEntry of readdirSync(hillDir, { withFileTypes: true })) {
      if (!zEntry.isDirectory()) {
        warns.push(`hillshade/: unexpected non-directory entry ${zEntry.name}`);
        continue;
      }
      const z = Number(zEntry.name);
      if (!Number.isInteger(z) || String(z) !== zEntry.name) {
        errors.push(`hillshade/${zEntry.name}: not a plain numeric zoom directory`);
        continue;
      }
      if (z < zMin || z > zMax) {
        errors.push(`hillshade/${z}: zoom outside ${zMin}–${zMax}`);
        continue;
      }
      const n = 2 ** z; // web-mercator tile count per axis at z
      // Tile range covering the clip (+1-tile buffer) for a warn-level vicinity check.
      const xs = [lonToTileX(CLIP[0], z), lonToTileX(CLIP[2], z)];
      const ys = [latToTileY(CLIP[1], z), latToTileY(CLIP[3], z)];
      const buf = 1;
      const xLo = Math.min(...xs) - buf;
      const xHi = Math.max(...xs) + buf;
      const yLo = Math.min(...ys) - buf;
      const yHi = Math.max(...ys) + buf;
      let zTiles = 0;
      let zBytes = 0;
      const zDir = join(hillDir, zEntry.name);
      for (const xEntry of readdirSync(zDir, { withFileTypes: true })) {
        if (!xEntry.isDirectory()) {
          warns.push(`hillshade/${z}: unexpected non-directory entry ${xEntry.name}`);
          continue;
        }
        const x = Number(xEntry.name);
        if (!Number.isInteger(x) || String(x) !== xEntry.name) {
          errors.push(`hillshade/${z}/${xEntry.name}: not a plain numeric x directory`);
          continue;
        }
        if (x < 0 || x >= n) {
          errors.push(`hillshade/${z}/${x}: x outside web-mercator range 0..${n - 1}`);
          continue;
        }
        const xDir = join(zDir, xEntry.name);
        for (const yEntry of readdirSync(xDir, { withFileTypes: true })) {
          const m = /^(\d+)\.webp$/.exec(yEntry.name);
          if (!yEntry.isFile() || !m) {
            errors.push(`hillshade/${z}/${x}/${yEntry.name}: expected {y}.webp`);
            continue;
          }
          const y = Number(m[1]);
          const rel = `hillshade/${z}/${x}/${y}.webp`;
          if (y < 0 || y >= n) {
            errors.push(`${rel}: y outside web-mercator range 0..${n - 1}`);
            continue;
          }
          const tilePath = join(xDir, yEntry.name);
          let size = 0;
          try {
            size = statSync(tilePath).size;
          } catch (e) {
            errors.push(`${rel}: unreadable (${e.message})`);
            continue;
          }
          const head = readHead(tilePath);
          if (!head || head.toString('latin1', 0, 4) !== 'RIFF' || head.toString('latin1', 8, 12) !== 'WEBP') {
            errors.push(`${rel}: not a valid WebP (missing RIFF/WEBP magic bytes)`);
          }
          tilePaths.push(tilePath);
          if (!spotSamples.has(z)) spotSamples.set(z, tilePath);
          if (x < xLo || x > xHi || y < yLo || y > yHi) {
            outsideVicinity++;
            if (!vicinityExample) vicinityExample = rel;
          }
          tileCount++;
          tileBytes += size;
          zTiles++;
          zBytes += size;
        }
      }
      perZoom.set(z, { tiles: zTiles, bytes: zBytes });
    }
  }
  if (existsSync(hillDir) && tileCount === 0) errors.push('hillshade/ contains no {z}/{x}/{y}.webp tiles');
  if (outsideVicinity > 0) {
    warns.push(`${outsideVicinity} tiles outside the TN clip vicinity (+1 tile), e.g. ${vicinityExample}`);
  }

  // ---- manifest totals vs reality -----------------------------------------
  if (Number.isInteger(hill?.tiles) && hill.tiles !== tileCount) {
    errors.push(`manifest.hillshade.tiles ${hill.tiles}, counted ${tileCount} tiles on disk`);
  }
  if (Number.isInteger(hill?.bytes) && hill.bytes !== tileBytes) {
    errors.push(`manifest.hillshade.bytes ${hill.bytes}, actual tile bytes ${tileBytes}`);
  }
  if (Number.isInteger(manifest.bytes) && manifest.bytes !== bandBytes + tileBytes) {
    errors.push(`manifest.bytes ${manifest.bytes}, actual bands ${bandBytes} + hillshade ${tileBytes} = ${bandBytes + tileBytes}`);
  }

  // ---- size targets (guide): warn within +20%, fail beyond -----------------
  const checkTarget = (label, bytes, targetMB) => {
    const failLimitMB = (targetMB * FAIL_TOLERANCE).toFixed(1); // e.g. 14.4, not 14.399999999999999
    if (bytes > Number(failLimitMB) * MB) {
      errors.push(`${label} ${fmtMB(bytes)} exceeds the ${targetMB} MB target beyond the +20% stop-condition tolerance (limit ${failLimitMB} MB)`);
    } else if (bytes > targetMB * MB) {
      warns.push(`${label} ${fmtMB(bytes)} is over the ${targetMB} MB target (within the +20% tolerance)`);
    }
  };
  checkTarget(`contour bands (${BANDS.length} files)`, bandBytes, TARGET_MB.contours);
  checkTarget('hillshade tiles', tileBytes, TARGET_MB.hillshade);

  // ---- B14 shadow-alpha pass (hasAlpha on every tile, decode spot-checks) --
  await verifyShadowAlpha();

  // ---- report ---------------------------------------------------------------
  console.log(`topo: ${TOPO}`);
  console.log(`manifest: generated ${manifest.generated ?? '?'} · declared bytes ${manifest.bytes ?? '?'}`);
  for (const b of bandStats) {
    console.log(`  ${b.file}: ${fmtMB(b.bytes)} · ${b.features} features · ${b.coords} coordinates · ${b.intervalM} m interval`);
  }
  console.log(`  bands total: ${fmtMB(bandBytes)} (target ≤ ${TARGET_MB.contours} MB)`);
  console.log(`hillshade: ${tileCount} tiles · ${fmtMB(tileBytes)} (target ≤ ${TARGET_MB.hillshade} MB)`);
  for (const z of [...perZoom.keys()].sort((a, b) => a - b)) {
    const s = perZoom.get(z);
    console.log(`  z${z}: ${s.tiles} tiles · ${fmtMB(s.bytes)}`);
  }
  for (const w of warns) console.warn(`WARN: ${w}`);
  if (errors.length) {
    console.error(`${errors.length} error(s):`);
    for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
    fail(`${errors.length} error(s) — first: ${errors[0]}`);
  }
  console.log('validate-topo: PASS');
};

(async () => {
  try {
    await main();
  } catch (e) {
    fail(`unexpected failure: ${e && e.message ? e.message : String(e)}`);
  }
})();
