/* global AbortSignal, Buffer, console, fetch, process, setTimeout */
// Fetch USGS 1 arc-second DEM GeoTIFF tiles (The National Map / 3DEP "NED"
// staged products, public domain) covering the Tennessee clip
// [-90.6, 34.98, -81.45, 36.75] plus ~0.4 deg margin, into
// apps/web/.atlas-src/dem/ (git-ignored). Re-runs skip tiles already on disk.
//
// RESOLUTION DECISION: 1 arc-second (~30 m), NOT the guide's 1/3 arc-second.
// The guide's "3DEP Products  1/3 arc-second" dataset slug returns ZERO
// results from the TNM products API (dead), and a 1/3" tile HEAD-checks at
// ~474 MB (~13 GB for TN). A 1 arc-second tile is ~50-58 MB (~1.7 GB for all
// 30), which is ample for the z7-11 hillshade and 20 m contours that the topo
// build derives from it. Document in the provenance report.
//
// VERIFIED URL PATTERN (current, undated staged copy; HEAD 200, ~57 MB for
// n35w086 — lon zero-padded to 3 digits):
//   https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1/TIFF/current/n{LAT}w{LON}/USGS_1_n{LAT}w{LON}.tif
// (The TNM API's downloadURL fields point at dated /TIFF/historical/.../
// copies, e.g. USGS_1_n38w095_20210607.tif; we normalise tile IDs from the
// API but always download the undated /current/ path above.)
//
// DISCOVERY: we query the TNM products API first
//   https://tnmaccess.nationalmap.gov/api/v1/products
//     ?datasets=National Elevation Dataset (NED)&bbox=<clip>&max=100&offset=N
// as a cross-check (the guide's state=TN variant intermittently returns zero
// downloadable items, and the API times out often — bbox is the reliable
// filter). The API is auxiliary only: we deterministically enumerate the
// 30-tile grid of direct URLs and HEAD-probe each regardless, so if the API
// stalls we silently fall back to direct grid enumeration. A HEAD 404 means
// the tile is genuinely absent upstream: logged as a GAP, recorded in
// .absent.json, and treated as satisfied by --check (which is pure
// filesystem / offline and never hits the network).
//
// Run: node scripts/fetch-tn-dem.mjs [--check]
//   --check: every grid tile must exist on disk, be > 1 MB, and start with
//   the little-endian TIFF magic bytes 49 49 2A 00. Prints
//   "dem sources: complete" (exit 0) or "dem sources: N missing (of 30)".
import { existsSync, mkdirSync, statSync, openSync, readSync, closeSync, unlinkSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const DEM = join(here, '..', '.atlas-src', 'dem');
const CHECK = process.argv.includes('--check');

const CLIP = { west: -90.6, south: 34.98, east: -81.45, north: 36.75 };
// 1x1 degree tiles: the name gives the NORTH edge for latitude (n{r} spans
// lat [r-1, r] — verified: n35w082 bbox is 33.998..35.002) and the WEST edge
// for longitude (w{c} spans lon [-c, -c+1]). Rows n35..n37 therefore cover
// the clip bottom 34.98 (n35 spans 34-35) through the clip top 36.75 (n37
// spans 36-37); n34 tiles (33-34) lie entirely below the clip. These
// rows/cols cover the clip plus margin.
const ROWS = [35, 36, 37];
const COLS = [82, 83, 84, 85, 86, 87, 88, 89, 90, 91];
const TILE_IDS = ROWS.flatMap((r) => COLS.map((c) => `n${r}w${String(c).padStart(3, '0')}`));

const CURRENT = (t) => `https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1/TIFF/current/${t}/USGS_1_${t}.tif`;
const API = 'https://tnmaccess.nationalmap.gov/api/v1/products';
const ABSENT_FILE = join(DEM, '.absent.json');
const MIN_BYTES = 1024 * 1024; // real 1" tiles are ~50-58 MB; 1 MB floor catches truncation/HTML pages

const tilePath = (t) => join(DEM, `USGS_1_${t}.tif`);

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

// A tile is complete on disk when it exists, is non-trivial, and is a TIFF.
function tileComplete(t) {
  const p = tilePath(t);
  try {
    return statSync(p).size > MIN_BYTES && hasTiffMagic(p);
  } catch {
    return false;
  }
}

// Cross-check via the TNM products API. Best-effort: any failure rejects and
// the caller falls back to the deterministic grid enumeration.
async function apiDiscoverTiles() {
  const bbox = `${CLIP.west},${CLIP.south},${CLIP.east},${CLIP.north}`;
  const found = new Map();
  for (let page = 0; page < 4; page++) {
    const url = `${API}?datasets=${encodeURIComponent('National Elevation Dataset (NED)')}&bbox=${bbox}&max=100&offset=${page * 100}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const items = Array.isArray(body.items) ? body.items : [];
    for (const it of items) {
      const u = it.downloadURL || (it.urls && it.urls.TIFF) || '';
      const m = /Elevation\/1\/TIFF\/[a-z]+\/(n\d{2}w\d{3})\//i.exec(u);
      if (m) found.set(m[1], u);
    }
    if (items.length < 100) break;
  }
  if (found.size === 0) throw new Error('no 1-arc TIFF items in API response');
  return found;
}

function headStatus(url) {
  try {
    const out = execFileSync('curl', ['-s', '-I', '-m', '40', url], { encoding: 'utf8' });
    const m = /^HTTP\/[\d.]+\s+(\d{3})/m.exec(out);
    return m ? Number(m[1]) : 0;
  } catch {
    return 0;
  }
}

function download(url, dest) {
  execSync(`curl -fL --retry 3 --retry-delay 5 -o ${JSON.stringify(dest)} ${JSON.stringify(url)}`, { stdio: 'inherit' });
}

// ---- --check: pure filesystem, works offline -------------------------------
if (CHECK) {
  const absent = new Set(existsSync(ABSENT_FILE) ? JSON.parse(readFileSync(ABSENT_FILE, 'utf8')) : []);
  const missing = [];
  const absentUpstream = [];
  for (const t of TILE_IDS) {
    if (tileComplete(t)) continue;
    if (absent.has(t)) absentUpstream.push(t);
    else missing.push(t);
  }
  for (const t of absentUpstream) console.log(`ABSENT-UPSTREAM ${t} (no staged tile at USGS — not an error)`);
  if (missing.length === 0) {
    console.log('dem sources: complete');
    process.exit(0);
  }
  console.log(`dem sources: ${missing.length} missing (of ${TILE_IDS.length})`);
  for (const t of missing) console.log(`MISSING ${t}`);
  process.exit(1);
}

// ---- fetch mode ------------------------------------------------------------
mkdirSync(DEM, { recursive: true });

console.log('discovery: querying TNM products API (datasets=National Elevation Dataset (NED), bbox) ...');
let apiTiles = null;
for (let attempt = 1; attempt <= 2 && !apiTiles; attempt++) {
  try {
    apiTiles = await apiDiscoverTiles();
  } catch (e) {
    if (attempt === 2) console.log(`api unavailable (${String(e.message || e).slice(0, 120)}) — falling back to direct grid enumeration`);
    else await new Promise((r) => setTimeout(r, 3000));
  }
}
if (apiTiles) {
  const gridSet = new Set(TILE_IDS);
  const overlap = TILE_IDS.filter((t) => apiTiles.has(t));
  const apiOnly = [...apiTiles.keys()].filter((t) => !gridSet.has(t));
  console.log(`api: ${apiTiles.size} 1-arc TIFF tiles in bbox; ${overlap.length}/${TILE_IDS.length} grid tiles confirmed by api${apiOnly.length ? `; api-only (outside grid, ignored): ${apiOnly.join(' ')}` : ''}`);
} else {
  console.log(`api: skipped — using deterministic HEAD probes of ${TILE_IDS.length} grid URLs`);
}

const report = []; // { tile, status: present|absent|FAILED, bytes }
const confirmedPresent = new Set();
const notFound = new Set();
let hardFail = 0;

for (const t of TILE_IDS) {
  const p = tilePath(t);
  if (tileComplete(t)) {
    confirmedPresent.add(t);
    report.push({ tile: t, status: 'present', bytes: statSync(p).size });
    console.log(`skip ${t} (already fetched)`);
    continue;
  }
  const status = headStatus(CURRENT(t));
  if (status === 404 || status === 403) {
    notFound.add(t);
    report.push({ tile: t, status: 'absent', bytes: 0 });
    console.log(`absent ${t}: upstream has no staged tile (HEAD ${status})`);
    continue;
  }
  console.log(`fetch ${t} (HEAD ${status || 'no-response'})`);
  try {
    download(CURRENT(t), p);
    const size = statSync(p).size;
    if (!(size > MIN_BYTES)) throw new Error(`truncated response: ${size} bytes`);
    if (!hasTiffMagic(p)) throw new Error('bad magic bytes — not a TIFF (HTML/error page?)');
    confirmedPresent.add(t);
    report.push({ tile: t, status: 'present', bytes: size });
  } catch (e) {
    try { unlinkSync(p); } catch { /* best-effort cleanup */ }
    // upstream DEM gap at this tile — nothing to fetch, skip
    hardFail++;
    report.push({ tile: t, status: 'FAILED', bytes: 0 });
    console.log(`GAP: ${t} failed after retries: ${String(e.message || e).slice(0, 160)}`);
  }
}

// Persist upstream-absence so --check stays correct offline. Keep prior
// records unless the tile has since been confirmed present.
const prevAbsent = existsSync(ABSENT_FILE) ? JSON.parse(readFileSync(ABSENT_FILE, 'utf8')) : [];
const absentNow = [...new Set([...prevAbsent, ...notFound])].filter((t) => !confirmedPresent.has(t));
writeFileSync(ABSENT_FILE, `${JSON.stringify(absentNow, null, 2)}\n`);

console.log(`\ncoverage report (rows n${ROWS[0]}-n${ROWS[ROWS.length - 1]} x cols w082-w091, 1x1 deg tiles):`);
for (const r of report) {
  const mb = r.bytes ? `${(r.bytes / 1048576).toFixed(1).padStart(6)} MB` : '       -';
  console.log(`  ${r.tile}  ${r.status.padEnd(7)} ${mb}`);
}
const present = report.filter((r) => r.status === 'present');
const total = present.reduce((s, r) => s + r.bytes, 0);
for (const r of report) if (r.status === 'absent') console.log(`GAP: ${r.tile} absent upstream (HEAD 404, no staged tile)`);
for (const r of report) if (r.status === 'FAILED') console.log(`GAP: ${r.tile} failed after retries`);
console.log(`\ntiles present: ${present.length} of ${TILE_IDS.length}`);
console.log(`total: ${total} bytes (${(total / 1073741824).toFixed(2)} GB)`);
console.log(hardFail === 0 ? 'dem fetch complete.' : `dem fetch finished with ${hardFail} failure(s) — re-run to retry.`);
process.exit(hardFail === 0 ? 0 : 1);
