// build-topo.mjs — Task 6e Phase B step 2: build the local Topo basemap data
// (contours + hillshade + manifest) from the 1 arc-second USGS 3DEP DEM tiles
// that scripts/fetch-tn-dem.mjs stages into apps/web/.atlas-src/dem/
// (USGS_1_n{LAT}w{LON}.tif, ~57 MB each, 1°×1°, north-edge naming: n36 spans
// lat 35–36, w086 spans lon −86..−85).
//
// OUTPUTS (all under apps/web/public/atlas/topo/):
//   contours-band0.geojson      100 m intervals (statewide zooms)
//   contours-band1.geojson       50 m intervals
//   contours-band2.geojson       20 m intervals (client styles gate to high zoom)
//   hillshade/{z}/{x}/{y}.webp   256×256 grayscale analytic shade, z7–11
//   manifest.json                pinned contract (see scripts/validate-topo.mjs)
//
// RULES this builder follows (do not regress):
// - TN clip [-90.6, 34.98, -81.45, 36.75] (lon/lat), the same frozen constant
//   as validate-atlas.mjs / validate-topo.mjs. No output coordinate leaves it.
// - The 1" source is aggregated 2×2 (mean of the ≤4 overlapping source pixels,
//   ignoring NoData pixels) into a ~60 m working grid — downsampling for
//   rendering at the max supported zoom z11 (~61 m/px at TN latitude), NOT
//   interpolation: cells with no valid source pixels stay NoData forever. No
//   elevation is ever fabricated for missing tiles or voids; gaps produce no
//   contours and no shading.
// - NoData (sentinel -32768, always below every contour threshold) reads as
//   "outside" to d3-contour, so gaps stay gaps. Contour rings hugging a NoData
//   edge for ≥85% of their vertices are closure artifacts around the gap, not
//   terrain — dropped.
// - Grid cells are rectangular in degrees (2" lat ≈ 61.8 m, 2" lon ≈
//   61.8·cos(lat) m): gradients and hillshade use per-axis meter spacing with
//   per-row cos(lat), so shading is not north–south stretched.
// - Hillshade tile coverage rule: a candidate tile is written only when ≥90%
//   of its pixels are inside the mosaic; kept tiles fill missing pixels with
//   mid-gray 127 (flat shade — invisible at the client's ~0.35 opacity).
//   Slivers below 90% are skipped entirely so the ground color shows through
//   instead of a hard edge. Tiles with zero mosaic intersection are never
//   written.
// - manifest.bytes = contour band bytes + hillshade tile bytes (exactly the
//   sum validate-topo.mjs recomputes). Coordinates are serialized at exactly
//   5 decimal places (the validator spot-checks precision). Band features
//   carry only { H }; zoom gating lives in client styles + manifest.
// - Targets: bands ≤ 12 MB total (per-band shares 4 + 3 + 5 MB), hillshade
//   ≤ 60 MB total. When a band overshoots its share, its RDP tolerance is
//   escalated (bands 1/2 first; band 0 only as a last resort) by rebuilding
//   the contours from the raw grid at the coarser tolerance — and the
//   escalation is reported in the summary. Bloat is never silent.
// - CRS: each GeoTIFF's own geo keys are honored. EPSG:4326/4269 geographic
//   tiles are used as-is; projected tiles are handled for the NAD83/WGS84 UTM
//   families via proj4 (nearest-sample fallback path — the staged 1" TIFFs
//   are EPSG:4326 in practice).
//
// Run: node scripts/build-topo.mjs   (full deterministic rebuild; re-run safe)
// Safe to run while fetch-tn-dem.mjs is still downloading: tiles that are
// still growing or undecodable are skipped and reported (re-run afterwards
// for the complete build). This script never writes into .atlas-src/.

import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from 'geotiff';
import proj4 from 'proj4';
import { contours } from 'd3-contour';
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const here = dirname(fileURLToPath(import.meta.url));
const WEB = join(here, '..');
const DEM_DIR = join(WEB, '.atlas-src', 'dem');
const ABSENT_FILE = join(DEM_DIR, '.absent.json');
const OUT = join(WEB, 'public', 'atlas', 'topo');
const HILLSHADE_DIR = join(OUT, 'hillshade');

// Frozen TN clip, identical to validate-atlas.mjs / validate-topo.mjs.
const CLIP = [-90.6, 34.98, -81.45, 36.75]; // [minLon, minLat, maxLon, maxLat]
const west = CLIP[0];
const south = CLIP[1];
const east = CLIP[2];
const north = CLIP[3];

// Working grid: 2 arc-seconds per cell (~61.8 m lat; ~61.8·cos(lat) m lon),
// i.e. the 1" source aggregated 2×2. Exact fit over the clip.
const CELL_DEG = 2 / 3600;
const W = Math.round((east - west) / CELL_DEG); // 16470
const H = Math.round((north - south) / CELL_DEG); // 3186

const NODATA = -32768; // Int16 sentinel; always below any real threshold
const V_MIN = -500; // sanity elevation bounds (m) — outside ⇒ treated as NoData
const V_MAX = 10000;
const METERS_PER_DEG = 111320; // ≈ 30.9 m per 1" latitude at TN
const CELL_LAT_M = METERS_PER_DEG * CELL_DEG; // ≈ 61.84 m

const BANDS = [
  { file: 'contours-band0.geojson', intervalM: 100 },
  { file: 'contours-band1.geojson', intervalM: 50 },
  { file: 'contours-band2.geojson', intervalM: 20 },
];
const RDP_TOL_BASE = 0.0004; // degrees, guide's value
const BAND_TARGET_BYTES = 12 * 1024 * 1024;
const HILLSHADE_TARGET_BYTES = 60 * 1024 * 1024;

const Z_MIN = 7;
const Z_MAX = 11;
const TILE_PX = 256;
const HILL_COVERAGE_MIN = 0.9; // coverage rule: keep tiles ≥90% inside the mosaic
const HILL_FILL = 127; // mid-gray flat fill for the missing fraction of kept tiles
const HILL_QUALITY = 75;
const ENCODE_CONCURRENCY = 8;

// Expected fetch grid (informational — discovery reads whatever *.tif is on
// disk). NOTE: staged 1" tiles are named by their NORTH edge — n{X} covers
// lat [X-1, X] (verified: USGS_1_n36w086 spans 34.99833–36.00167) — so the
// clip 34.98–36.75 needs rows 35/36/37, not the 34/35/36 originally assumed.
const ROWS = [35, 36, 37];
const COLS = [82, 83, 84, 85, 86, 87, 88, 89, 90, 91];
const EXPECTED = ROWS.flatMap((r) => COLS.map((c) => `n${r}w${String(c).padStart(3, '0')}`));

const MB = 1024 * 1024;
const fmtMB = (b) => `${(b / MB).toFixed(2)} MB`;
const DEG = Math.PI / 180;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now();
const since = (label) => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
const clampInt = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const r5 = (x) => Math.round(x * 1e5) / 1e5;
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Windows AV/indexer locks can flake UNKNOWN on big rewrites; write temp +
// rename, with a few retries. Deterministic content either way.
function writeFileSyncAtomic(p, data) {
  const tmp = `${p}.tmp`;
  for (let attempt = 1; ; attempt++) {
    try {
      writeFileSync(tmp, data);
      rmSync(p, { force: true });
      renameSync(tmp, p);
      return;
    } catch (e) {
      if (attempt >= 4) throw e;
      sleepSync(300 * attempt);
    }
  }
}

// Web-mercator helpers (t = tile-space fraction 0..1 top→bottom).
const mercLat = (t) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * t))) * 180) / Math.PI;
const mercT = (lat) => (1 - Math.asinh(Math.tan(lat * DEG)) / Math.PI) / 2;

// ---------------------------------------------------------------------------
// Stage 1 — discover ready DEM tiles (read-only; tolerant of in-flight curls)
// ---------------------------------------------------------------------------

function hasTiffMagic(p) {
  let fd;
  try {
    fd = openSync(p, 'r');
    const b = Buffer.alloc(4);
    const n = readSync(fd, b, 0, 4, 0);
    return n === 4 && b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

// A tile is ready when it is a >1 MB TIFF whose size is stable (the fetcher
// curls straight onto the final path, so partial files can exist mid-run).
async function tileReady(p) {
  try {
    const st = statSync(p);
    if (st.size < 1024 * 1024 || !hasTiffMagic(p)) return false;
    if (Date.now() - st.mtimeMs < 30_000) {
      const a = statSync(p).size;
      await sleep(3000);
      if (statSync(p).size !== a) return false; // still downloading
    }
    return true;
  } catch {
    return false;
  }
}

async function discoverTiles() {
  if (!existsSync(DEM_DIR)) return { tiles: [], absentKnown: [] };
  const names = readdirSync(DEM_DIR).filter((f) => /\.tif$/i.test(f));
  const tiles = [];
  const notReady = [];
  for (const name of names) {
    const p = join(DEM_DIR, name);
    if (await tileReady(p)) tiles.push({ name, path: p });
    else notReady.push(name);
  }
  let absentKnown = [];
  try {
    absentKnown = JSON.parse(readFileSync(ABSENT_FILE, 'utf8'));
    if (!Array.isArray(absentKnown)) absentKnown = [];
  } catch {
    /* fetcher's gap list is optional */
  }
  if (notReady.length) console.log(`tiles: ${notReady.length} on disk but not ready yet (partial/download), skipped:\n  ${notReady.join('\n  ')}`);
  return { tiles, absentKnown };
}

// ---------------------------------------------------------------------------
// Stage 2 — mosaic: aggregate every ready tile into the clipped working grid
// ---------------------------------------------------------------------------

// UTM families only; anything else fails loudly rather than misprojecting.
function proj4DefFor(geoKeys) {
  const projected = geoKeys && geoKeys.ProjectedType;
  if (!projected) return null; // geographic (EPSG:4326 / 4269 NAD83 ≈ WGS84 here)
  if (projected >= 32601 && projected <= 32660) {
    return `+proj=utm +zone=${projected - 32600} +datum=WGS84 +units=m +no_defs`;
  }
  if (projected >= 26901 && projected <= 26923) {
    return `+proj=utm +zone=${projected - 26900} +datum=NAD83 +units=m +no_defs`;
  }
  throw new Error(`unsupported projected CRS EPSG:${projected}`);
}

const STRIP_ROWS = 512; // working-grid rows per accumulation strip (~34 MB buffers)

async function buildMosaic(tiles) {
  const values = new Int16Array(W * H).fill(NODATA);
  const bbox = { c0: W, c1: -1, r0: H, r1: -1 };
  let ingested = 0;

  for (const tile of tiles) {
    let img;
    let meta;
    try {
      const tif = await fromFile(tile.path);
      img = await tif.getImage();
      const origin = img.getOrigin();
      const res = img.getResolution();
      meta = {
        ox: origin[0],
        oy: origin[1],
        sx: res[0],
        sy: Math.abs(res[1]),
        wt: img.getWidth(),
        ht: img.getHeight(),
        nodata: img.getGDALNoData(),
        def: proj4DefFor(img.getGeoKeys()),
      };
      const tEast = meta.ox + meta.wt * meta.sx;
      const tSouth = meta.oy - meta.ht * meta.sy;
      if (tEast <= west || meta.ox >= east || meta.oy <= south || tSouth >= north) {
        console.log(`tile ${tile.name}: bbox outside clip, skipped`);
        continue;
      }
    } catch (e) {
      console.log(`tile ${tile.name}: unreadable (${e.message}), skipped — re-run once the fetch settles`);
      continue;
    }

    if (meta.def) ingested += await ingestProjected(img, meta, values, bbox);
    else ingested += await ingestGeographic(img, meta, values, bbox);
    console.log(`tile ${tile.name}: ingested (${ingested}/${tiles.length} so far) · ${since()}`);
  }

  if (bbox.c1 < 0) throw new Error('no DEM data could be ingested — is .atlas-src/dem/ populated?');
  return { values, bbox, ingested };
}

// Geographic (EPSG:4326-ish) path: strip-wise windowed reads, per-pixel bin
// into working cells, mean of the (≤4, at 1") overlapping valid source pixels.
async function ingestGeographic(img, meta, values, bbox) {
  const { ox, oy, sx, sy, wt, ht, nodata } = meta;
  const nd = nodata === null ? NaN : nodata;
  const stride = Math.max(1, Math.round(CELL_DEG / sx / 2)); // 1 for the 1" source
  const iLo = clampInt(Math.floor((west - ox) / sx - 0.5) - 2, 0, wt - 1);
  const iHi = clampInt(Math.ceil((east - ox) / sx - 0.5) + 2, 0, wt - 1);
  if (iLo > iHi) return 0;

  const sum = new Int32Array(W * STRIP_ROWS);
  const cnt = new Uint16Array(W * STRIP_ROWS);
  for (let r0 = 0; r0 < H; r0 += STRIP_ROWS) {
    const r1 = Math.min(H, r0 + STRIP_ROWS);
    const latHi = north - r0 * CELL_DEG;
    const latLo = north - r1 * CELL_DEG;
    const jLo = clampInt(Math.floor((oy - latHi) / sy - 0.5) - 2, 0, ht - 1);
    const jHi = clampInt(Math.ceil((oy - latLo) / sy - 0.5) + 2, 0, ht - 1);
    if (jLo > jHi) continue;
    sum.fill(0);
    cnt.fill(0);

    const ras = await img.readRasters({ window: [iLo, jLo, iHi + 1, jHi + 1], samples: [0] });
    const src = ras[0];
    const sw = iHi - iLo + 1;
    for (let jj = 0; jj < jHi - jLo + 1; jj += stride) {
      const lat = oy - (jLo + jj + 0.5) * sy;
      const R = Math.floor((north - lat) / CELL_DEG);
      if (R < r0 || R >= r1) continue;
      const rowBase = (R - r0) * W;
      const srcBase = jj * sw;
      for (let ii = 0; ii < sw; ii += stride) {
        const v = src[srcBase + ii];
        if (v <= V_MIN || v >= V_MAX || v === nd) continue;
        const C = Math.floor((ox + (iLo + ii + 0.5) * sx - west) / CELL_DEG);
        if (C < 0 || C >= W) continue;
        const o = rowBase + C;
        sum[o] += Math.round(v);
        cnt[o]++;
      }
    }

    for (let rr = 0; rr < r1 - r0; rr++) {
      for (let c = 0; c < W; c++) {
        const o = rr * W + c;
        if (!cnt[o]) continue;
        values[(r0 + rr) * W + c] = Math.round(sum[o] / cnt[o]);
        if (c < bbox.c0) bbox.c0 = c;
        if (c > bbox.c1) bbox.c1 = c;
        if (r0 + rr < bbox.r0) bbox.r0 = r0 + rr;
        if (r0 + rr > bbox.r1) bbox.r1 = r0 + rr;
      }
    }
  }
  return 1;
}

// Projected (UTM) fallback: nearest-sample per working cell via proj4. Not the
// expected path (staged 1" TIFFs are geographic); kept as a safety net.
async function ingestProjected(img, meta, values, bbox) {
  const { ox, oy, sx, sy, wt, ht, nodata, def } = meta;
  const nd = nodata === null ? NaN : nodata;
  const conv = proj4(proj4.WGS84, def); // forward: lon/lat → easting/northing
  const ras = await img.readRasters({ samples: [0] });
  const src = ras[0];
  const lonLo = Math.max(west, conv.inverse([ox, oy - ht * sy])[0]);
  const lonHi = Math.min(east, conv.inverse([ox + wt * sx, oy])[0]);
  const latLo = Math.max(south, conv.inverse([ox, oy])[1]);
  const latHi = Math.min(north, conv.inverse([ox + wt * sx, oy - ht * sy])[1]);
  const r0 = clampInt(Math.floor((north - latHi) / CELL_DEG), 0, H - 1);
  const r1 = clampInt(Math.ceil((north - latLo) / CELL_DEG), 0, H - 1);
  for (let R = r0; R <= r1; R++) {
    const lat = north - (R + 0.5) * CELL_DEG;
    for (let C = 0; C < W; C++) {
      const lon = west + (C + 0.5) * CELL_DEG;
      if (lon < lonLo || lon > lonHi) continue;
      const [e, n2] = conv.forward([lon, lat]);
      const i = Math.floor((e - ox) / sx);
      const j = Math.floor((oy - n2) / sy);
      if (i < 0 || j < 0 || i >= wt || j >= ht) continue;
      const v = src[j * wt + i];
      if (v <= V_MIN || v >= V_MAX || v === nd) continue;
      values[R * W + C] = Math.round(v);
      if (C < bbox.c0) bbox.c0 = C;
      if (C > bbox.c1) bbox.c1 = C;
      if (R < bbox.r0) bbox.r0 = R;
      if (R > bbox.r1) bbox.r1 = R;
    }
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Stage 3 — contours: d3-contour rings per band, gap-aware, RDP-simplified
// ---------------------------------------------------------------------------

function buildNearGapMask(values) {
  const gap = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (values[i] === NODATA) gap[i] = 1;
  const near = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (!gap[r * W + c]) continue;
      for (let rr = Math.max(0, r - 1); rr <= Math.min(H - 1, r + 1); rr++) {
        for (let cc = Math.max(0, c - 1); cc <= Math.min(W - 1, c + 1); cc++) {
          near[rr * W + cc] = 1;
        }
      }
    }
  }
  return near;
}

// A ring whose vertices overwhelmingly sit next to a NoData cell is just the
// closure loop around a gap — drop it so gaps stay clean edges, not fake
// "contours" tracing the data boundary.
function isGapHugger(ring, nearGap) {
  const n = ring.length;
  const step = Math.max(1, n >> 9); // sample ≤512 vertices
  let near = 0;
  let tot = 0;
  for (let i = 0; i < n; i += step) {
    const gx = clampInt(Math.round(ring[i][0]), 0, W - 1);
    const gy = clampInt(Math.round(ring[i][1]), 0, H - 1);
    if (nearGap[gy * W + gx]) near++;
    tot++;
  }
  return tot > 0 && near / tot >= 0.85;
}

// Iterative RDP on one open segment [i0..i1]; marks kept vertices.
function rdpSeg(pts, i0, i1, tol, keep) {
  keep[i0] = 1;
  keep[i1] = 1;
  const stack = [[i0, i1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const ax = pts[a][0];
    const ay = pts[a][1];
    const dx = pts[b][0] - ax;
    const dy = pts[b][1] - ay;
    const len = Math.hypot(dx, dy);
    let best = -1;
    let bi = -1;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i][0] - ax;
      const py = pts[i][1] - ay;
      const d = len === 0 ? Math.hypot(px, py) : Math.abs(px * dy - py * dx) / len;
      if (d > best) {
        best = d;
        bi = i;
      }
    }
    if (best > tol) {
      keep[bi] = 1;
      stack.push([a, bi], [bi, b]);
    }
  }
}

// Simplify one closed ring (degree space), round to 5 dp, dedupe, re-close.
function simplifyRingDeg(ring, tol) {
  const n = ring.length;
  if (n < 4) return [];
  const mid = n >> 1;
  const keep = new Uint8Array(n);
  rdpSeg(ring, 0, mid, tol, keep);
  rdpSeg(ring, mid, n - 1, tol, keep);
  const out = [];
  for (let i = 0; i < n; i++) {
    if (!keep[i]) continue;
    const x = r5(ring[i][0]);
    const y = r5(ring[i][1]);
    const last = out[out.length - 1];
    if (!last || last[0] !== x || last[1] !== y) out.push([x, y]);
  }
  if (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
  if (out.length < 3) return [];
  out.push([out[0][0], out[0][1]]);
  return out;
}

function thresholdsFor(iv, elevMin, elevMax) {
  const list = [];
  for (let T = Math.ceil(elevMin / iv) * iv; T <= elevMax; T += iv) list.push(T);
  return list;
}

// Build one band's features: per threshold one Feature (MultiLineString, or
// LineString when a single ring) carrying { H: threshold }.
function buildBandFeats(values, nearGap, iv, elevMin, elevMax, tol) {
  const feats = [];
  let ringCount = 0;
  let rawPts = 0;
  for (const T of thresholdsFor(iv, elevMin, elevMax)) {
    const [mp] = contours().size([W, H]).thresholds([T])(values);
    const ringsDeg = [];
    for (const poly of mp.coordinates) {
      for (const ringGrid of poly) {
        if (isGapHugger(ringGrid, nearGap)) continue;
        rawPts += ringGrid.length;
        const ring = ringGrid.map(([gx, gy]) => [west + (gx + 0.5) * CELL_DEG, north - (gy + 0.5) * CELL_DEG]);
        const s = simplifyRingDeg(ring, tol);
        if (s.length >= 4) {
          ringsDeg.push(s);
          ringCount += s.length;
        }
      }
    }
    if (ringsDeg.length) feats.push({ H: T, rings: ringsDeg });
  }
  return { feats, ringCount, rawPts };
}

// Hand serializer: coordinates MUST hit exactly 5 decimal places (the
// validator's pinned precision spot-check), which JSON.stringify cannot
// guarantee (it drops trailing zeros).
const ringJson = (r) => `[${r.map((p) => `[${p[0].toFixed(5)},${p[1].toFixed(5)}]`).join(',')}]`;

function serializeBand(feats) {
  let s = '{"type":"FeatureCollection","features":[';
  for (let i = 0; i < feats.length; i++) {
    const f = feats[i];
    if (i) s += ',';
    s += `{"type":"Feature","properties":{"H":${f.H}},"geometry":{"type":`;
    s += f.rings.length === 1 ? `"LineString","coordinates":${ringJson(f.rings[0])}` : `"MultiLineString","coordinates":[${f.rings.map(ringJson).join(',')}]`;
    s += '}}';
  }
  return s + ']}';
}

function writeBandFile(spec, feats) {
  const json = serializeBand(feats);
  JSON.parse(json); // self-check: must be valid JSON
  const p = join(OUT, spec.file);
  writeFileSyncAtomic(p, json);
  return { bytes: Buffer.byteLength(json), features: feats.length };
}

// Bands are built to per-band shares of the 12 MB budget. Contour mass scales
// strongly with tolerance, so when a band overshoots its share we re-run the
// contour build (d3-contour from the raw grid) at a proportionally larger RDP
// tolerance and re-measure — re-simplifying already-simplified rings converges
// far too slowly to be useful. Bands 1/2 are coarsened first (guide's
// instruction); band 0 only when its own share forces it, which the summary
// reports explicitly.
const BAND_SHARES = [4.0, 3.0, 5.0].map((mb) => Math.round(mb * MB)); // band0/1/2
const TOL_MAX = 0.008; // ≈ 800 m — coarser than this, contours are noise

function buildContours(values, nearGap, elevMin, elevMax) {
  const stats = BANDS.map((spec) => ({ spec, bytes: 0, features: 0, tol: RDP_TOL_BASE, escalated: false }));
  for (const bi of [1, 2, 0]) {
    const spec = BANDS[bi];
    let tol = RDP_TOL_BASE;
    for (let attempt = 1; ; attempt++) {
      process.stdout.write(`contours ${spec.file} (interval ${spec.intervalM} m, tol ${tol.toFixed(5)}°) … `);
      const built = buildBandFeats(values, nearGap, spec.intervalM, elevMin, elevMax, tol);
      const w = writeBandFile(spec, built.feats);
      if (w.bytes <= BAND_SHARES[bi] || attempt >= 4 || tol >= TOL_MAX) {
        stats[bi] = { spec, bytes: w.bytes, features: w.features, tol, escalated: tol !== RDP_TOL_BASE };
        console.log(`${w.features} features · ${fmtMB(w.bytes)}${w.bytes > BAND_SHARES[bi] ? ' (over share)' : ''} · ${since()}`);
        break;
      }
      const next = Math.min(TOL_MAX, tol * Math.min(5, Math.pow(w.bytes / BAND_SHARES[bi], 0.9)));
      console.log(`${fmtMB(w.bytes)} > ${fmtMB(BAND_SHARES[bi])} share → rebuild at ${next.toFixed(5)}°`);
      tol = next;
    }
  }
  const total = stats.reduce((n, s) => n + s.bytes, 0);
  if (total > BAND_TARGET_BYTES) {
    console.log(`WARNING: bands total ${fmtMB(total)} exceeds the 12 MB target (shares ${BAND_SHARES.map((s) => fmtMB(s)).join(' + ')}) — reported, not silent`);
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Stage 4 — hillshade grid, mip pyramid, and WebP tiles z7–11
// ---------------------------------------------------------------------------

function buildShade(values) {
  const shade = new Uint8Array(W * H);
  const valid = new Uint8Array(W * H);
  // Light from azimuth 315° (NW), altitude 45°. Surface normal
  // N = (-dz/dx, -dz/dy_north, 1); intensity = N·L / |N|, clamped to [0,1].
  const LE = -0.5; // sin(315°)·cos(45°)
  const LN = 0.5; //  cos(315°)·cos(45°)
  const LU = Math.SQRT1_2; //  sin(45°)
  const dym = METERS_PER_DEG * CELL_DEG;
  for (let r = 0; r < H; r++) {
    const rN = r > 0 ? r - 1 : 0;
    const rS = r < H - 1 ? r + 1 : H - 1;
    const lat = north - (r + 0.5) * CELL_DEG;
    const dxm = METERS_PER_DEG * CELL_DEG * Math.cos(lat * DEG); // per-row cos correction
    const rowBase = r * W;
    const rowN = rN * W;
    const rowS = rS * W;
    for (let c = 0; c < W; c++) {
      const i = rowBase + c;
      const zc = values[i];
      if (zc === NODATA) continue;
      const cW = c > 0 ? c - 1 : 0;
      const cE = c < W - 1 ? c + 1 : W - 1;
      // 3×3 window a b c / d . f / g h i (rows N→S); NoData neighbors fold to center.
      let a = values[rowN + cW];
      let b = values[rowN + c];
      let c2 = values[rowN + cE];
      let d = values[rowBase + cW];
      let f = values[rowBase + cE];
      let g = values[rowS + cW];
      let h = values[rowS + c];
      let i2 = values[rowS + cE];
      if (a === NODATA) a = zc;
      if (b === NODATA) b = zc;
      if (c2 === NODATA) c2 = zc;
      if (d === NODATA) d = zc;
      if (f === NODATA) f = zc;
      if (g === NODATA) g = zc;
      if (h === NODATA) h = zc;
      if (i2 === NODATA) i2 = zc;
      const dzdx = (c2 + 2 * f + i2 - (a + 2 * d + g)) / (8 * dxm);
      const dzdyn = (a + 2 * b + c2 - (g + 2 * h + i2)) / (8 * dym); // +north
      const nlen = Math.sqrt(dzdx * dzdx + dzdyn * dzdyn + 1);
      let inten = (0.5 * dzdx - 0.5 * dzdyn + LU) / nlen; // (N·L)/|N| expanded
      if (inten < 0) inten = 0;
      else if (inten > 1) inten = 1;
      shade[i] = (inten * 255 + 0.5) | 0;
      valid[i] = 1;
    }
  }
  return { shade, valid };
}

function buildMips(shade, valid) {
  const mips = [{ w: W, h: H, data: shade, valid }];
  for (let L = 1; L <= 4; L++) {
    const p = mips[L - 1];
    const w = p.w >> 1;
    const h = p.h >> 1;
    const data = new Uint8Array(w * h);
    const v2 = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = 2 * y * p.w + 2 * x;
        let s = 0;
        let n = 0;
        if (p.valid[a]) { s += p.data[a]; n++; }
        if (p.valid[a + 1]) { s += p.data[a + 1]; n++; }
        if (p.valid[a + p.w]) { s += p.data[a + p.w]; n++; }
        if (p.valid[a + p.w + 1]) { s += p.data[a + p.w + 1]; n++; }
        if (n) {
          const o = y * w + x;
          v2[o] = 1;
          data[o] = Math.round(s / n);
        }
      }
    }
    mips.push({ w, h, data, valid: v2 });
  }
  return mips;
}

// Bilinear sample of a mip level; gx/gy are level-0 grid coordinates.
// Returns -1 when any contributing cell is invalid (gap stays gap).
function sampleMip(m, fx, fy) {
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  if (x0 < 0 || y0 < 0 || x0 + 1 >= m.w || y0 + 1 >= m.h) return -1;
  const i00 = y0 * m.w + x0;
  if (!(m.valid[i00] && m.valid[i00 + 1] && m.valid[i00 + m.w] && m.valid[i00 + m.w + 1])) return -1;
  const tx = fx - x0;
  const ty = fy - y0;
  const v00 = m.data[i00];
  const v10 = m.data[i00 + 1];
  const v01 = m.data[i00 + m.w];
  const v11 = m.data[i00 + m.w + 1];
  return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty;
}

async function buildHillshade(mips, dataBbox) {
  rmSync(HILLSHADE_DIR, { recursive: true, force: true });
  mkdirSync(HILLSHADE_DIR, { recursive: true });

  const dataWest = west + dataBbox.c0 * CELL_DEG;
  const dataEast = west + (dataBbox.c1 + 1) * CELL_DEG;
  const dataNorth = north - dataBbox.r0 * CELL_DEG;
  const dataSouth = north - (dataBbox.r1 + 1) * CELL_DEG;

  const perZoom = new Map();
  const jobs = [];
  for (let z = Z_MIN; z <= Z_MAX; z++) {
    const n = 2 ** z;
    const x0 = Math.floor(((west + 180) / 360) * n);
    const x1 = Math.floor(((east + 180) / 360) * n);
    const y0 = Math.floor(mercT(north) * n);
    const y1 = Math.floor(mercT(south) * n);
    let candidates = 0;
    for (let x = x0; x <= x1; x++) {
      const lon0 = (360 * x) / n - 180;
      const lon1 = (360 * (x + 1)) / n - 180;
      if (lon1 <= dataWest || lon0 >= dataEast) continue;
      for (let y = y0; y <= y1; y++) {
        const lat1 = mercLat(y / n);
        const lat0 = mercLat((y + 1) / n);
        if (lat1 <= dataSouth || lat0 >= dataNorth) continue;
        candidates++;
        jobs.push({ z, x, y, lon0, lon1, lat0, lat1 });
      }
    }
    perZoom.set(z, { candidates, written: 0, skipped: 0, bytes: 0 });
  }
  console.log(`hillshade: ${jobs.length} candidate tiles (clip ∩ mosaic) across z${Z_MIN}–${Z_MAX}`);

  let ji = 0;
  const worker = async () => {
    const scratch = new Uint8Array(TILE_PX * TILE_PX); // worker-local: 1 = valid pixel
    while (ji < jobs.length) {
      const t = jobs[ji++];
      const n = 2 ** t.z;
      // Pick the mip whose cell size best matches this zoom's ground resolution.
      const latMid = (t.lat0 + t.lat1) / 2;
      const mpp = (156543.034 * Math.cos(latMid * DEG)) / n; // m/px at this latitude
      const L = clampInt(Math.round(Math.log2(mpp / CELL_LAT_M)), 0, 4);
      const mip = mips[L];
      const buf = Buffer.alloc(TILE_PX * TILE_PX);
      let invalid = 0;
      for (let py = 0; py < TILE_PX; py++) {
        const lat = mercLat((t.y + (py + 0.5) / TILE_PX) / n);
        const gy = (north - lat) / CELL_DEG - 0.5;
        const rowO = py * TILE_PX;
        for (let px = 0; px < TILE_PX; px++) {
          const lon = t.lon0 + ((px + 0.5) / TILE_PX) * (t.lon1 - t.lon0);
          const gx = (lon - west) / CELL_DEG - 0.5;
          const v = sampleMip(mip, gx / 2 ** L - 0.5, gy / 2 ** L - 0.5);
          const o = rowO + px;
          if (v < 0) {
            invalid++;
            scratch[o] = 0;
          } else {
            buf[o] = v;
            scratch[o] = 1;
          }
        }
      }
      const zs = perZoom.get(t.z);
      const coverage = 1 - invalid / (TILE_PX * TILE_PX);
      if (coverage < HILL_COVERAGE_MIN) {
        zs.skipped++;
        continue; // edge sliver — client's ground color shows through instead
      }
      for (let o = 0; o < buf.length; o++) if (!scratch[o]) buf[o] = HILL_FILL;
      const dir = join(HILLSHADE_DIR, String(t.z), String(t.x));
      mkdirSync(dir, { recursive: true });
      const file = join(dir, `${t.y}.webp`);
      await sharp(buf, { raw: { width: TILE_PX, height: TILE_PX, channels: 1 } })
        .webp({ quality: HILL_QUALITY })
        .toFile(file);
      zs.written++;
      zs.bytes += statSync(file).size;
    }
  };
  await Promise.all(Array.from({ length: ENCODE_CONCURRENCY }, worker));

  const stats = [];
  for (const [z, s] of [...perZoom.entries()].sort((a, b) => a[0] - b[0])) {
    stats.push({ z, ...s });
    console.log(`  z${z}: ${s.written} written · ${s.skipped} skipped slivers (<${HILL_COVERAGE_MIN * 100}% covered) · ${fmtMB(s.bytes)} of ${s.candidates} candidates`);
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Stage 5 — manifest (pinned contract) + final size table
// ---------------------------------------------------------------------------

async function main() {
  console.log(`build-topo: clip ${JSON.stringify(CLIP)} · working grid ${W}×${H} @ ${(CELL_DEG * 3600).toFixed(0)}" (~${CELL_LAT_M.toFixed(0)} m)`);
  mkdirSync(OUT, { recursive: true });

  const { tiles, absentKnown } = await discoverTiles();
  console.log(`tiles: ${tiles.length} ready of ${EXPECTED.length} expected (fetcher reports ${absentKnown.length} absent upstream)`);
  if (tiles.length === 0) {
    console.error('no DEM tiles ready yet — run scripts/fetch-tn-dem.mjs first (or re-run once tiles land)');
    process.exit(1);
  }

  // Stage 2: mosaic
  const mosaic = await buildMosaic(tiles);
  const { values, bbox, ingested } = mosaic;
  let elevMin = Infinity;
  let elevMax = -Infinity;
  for (let i = 0; i < W * H; i++) {
    const v = values[i];
    if (v === NODATA) continue;
    if (v < elevMin) elevMin = v;
    if (v > elevMax) elevMax = v;
  }
  const gaps = values.reduce((n, v) => (v === NODATA ? n + 1 : n), 0);
  console.log(`mosaic: ${W}×${H} cells · data bbox cols ${bbox.c0}–${bbox.c1}, rows ${bbox.r0}–${bbox.r1} · elev ${elevMin}–${elevMax} m · gaps ${(gaps / (W * H) * 100).toFixed(1)}% · ${since()}`);

  // Stage 3: contours
  console.log('contours: building gap mask …');
  const nearGap = buildNearGapMask(values);
  const bandStats = await buildContours(values, nearGap, elevMin, elevMax);

  // Stage 4: hillshade
  console.log('hillshade: shading grid …');
  const { shade, valid } = buildShade(values);
  const mips = buildMips(shade, valid);
  console.log(`hillshade: mip pyramid 0–4 built (${since()})`);
  const hillStats = await buildHillshade(mips, bbox);

  // Stage 5: manifest
  const bandBytes = bandStats.reduce((n, b) => n + b.bytes, 0);
  const hillTiles = hillStats.reduce((n, s) => n + s.written, 0);
  const hillBytes = hillStats.reduce((n, s) => n + s.bytes, 0);
  const manifest = {
    generated: new Date().toISOString(),
    bands: BANDS.map((spec, i) => ({
      file: spec.file,
      intervalM: spec.intervalM,
      bytes: bandStats[i].bytes,
      features: bandStats[i].features,
    })),
    hillshade: {
      pattern: 'hillshade/{z}/{x}/{y}.webp',
      minZoom: Z_MIN,
      maxZoom: Z_MAX,
      tiles: hillTiles,
      bytes: hillBytes,
    },
    minZoom: Z_MIN,
    maxZoom: Z_MAX,
    bytes: bandBytes + hillBytes,
  };
  writeFileSyncAtomic(join(OUT, 'manifest.json'), JSON.stringify(manifest));

  // Final size table
  const total = bandBytes + hillBytes;
  console.log('\n──────── build-topo summary ────────');
  for (const [i, spec] of BANDS.entries()) {
    const s = bandStats[i];
    const tolNote = s.escalated ? ` · RDP ${s.tol.toFixed(5)}° (coarsened to fit)` : ` · RDP ${s.tol.toFixed(5)}°`;
    console.log(`  ${spec.file.padEnd(24)} ${fmtMB(s.bytes).padStart(10)}  ${String(s.features).padStart(5)} features  ${spec.intervalM} m${tolNote}`);
  }
  console.log(`  ${'bands total'.padEnd(24)} ${fmtMB(bandBytes).padStart(10)}  (target ≤ 12.00 MB${bandBytes > BAND_TARGET_BYTES ? ' — OVER' : ''})`);
  for (const s of hillStats) {
    console.log(`  hillshade z${s.z}             ${fmtMB(s.bytes).padStart(10)}  ${String(s.written).padStart(5)} tiles    (${s.skipped} slivers skipped)`);
  }
  console.log(`  ${'hillshade total'.padEnd(24)} ${fmtMB(hillBytes).padStart(10)}  (target ≤ 60.00 MB${hillBytes > HILLSHADE_TARGET_BYTES ? ' — OVER' : ''}) · ${hillTiles} tiles`);
  console.log(`  ${'TOTAL'.padEnd(24)} ${fmtMB(total).padStart(10)}`);
  console.log(`absent DEM tiles: ${EXPECTED.length - ingested} of ${EXPECTED.length} (treated as NoData gaps)`);
  console.log(`done in ${since()}`);
}

main().catch((e) => {
  console.error(`build-topo: FAILED — ${e && e.stack ? e.stack : e}`);
  process.exit(1);
});
