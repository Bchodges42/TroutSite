/* global URL */
/* global console, process */
/**
 * Size budget, install-time semantics (T0-4 redesign).
 *
 * What the app costs a first-time visitor is what the service worker downloads at
 * install: the Workbox precache manifest (inlined into dist/sw.js as
 * `precacheAndRoute([{url, revision}, ...])`) plus sw.js itself. Everything else in
 * dist/ is fetched on demand and/or runtime-cached (CacheFirst) — it never counts
 * against the install-time budget.
 *
 * - HARD GATE: install-time bytes (manifest entries + sw.js) ≤ INSTALL_LIMIT_BYTES
 *   (25 MB). Exceeding this fails the build.
 * - REPORTED (not gated): on-demand bytes = every other file in dist/, broken out
 *   per top-level directory, with the topo DEM derivatives warned over 100 MB.
 *
 * Parsing the manifest keeps the gate honest: it measures exactly what Workbox will
 * precache, so a stray large asset in dist/ that the SW never touches can't fail
 * the build — and a bloated precached asset can't hide behind dist-level averages.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const INSTALL_LIMIT_BYTES = 25 * 1024 * 1024;
export const TOPO_WARN_BYTES = 100 * 1024 * 1024;

/** Extract the balanced `[ … ]` argument that follows `needle` in `source`. */
export function extractArrayArg(source, needle) {
  const start = source.indexOf(needle);
  if (start === -1) return null;
  const open = source.indexOf('[', start);
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let k = open; k < source.length; k++) {
    const c = source[k];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    if (depth === 0 && k > open) return source.slice(open, k + 1);
  }
  return null;
}

/** Extract the precache entries from a built service worker's source. */
export function parsePrecacheManifest(swSource) {
  // Workbox emits precacheAndRoute([{url:"…",revision:"…"},…]) — a minified JS
  // object literal (unquoted keys), possibly with a trailing options object. The
  // array is extracted by bracket balance (no `])` terminator to anchor on), and
  // only the url members are pulled out: they are all the budget needs.
  const marker = swSource.match(/__TROUT_PRECACHE_MANIFEST\s*=/)?.[0];
  const arraySrc = extractArrayArg(swSource, marker ?? 'precacheAndRoute(');
  if (arraySrc === null) return [];
  const urls = [...arraySrc.matchAll(/(?:"url"|\burl)\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
  if (urls.length === 0) {
    throw new Error('could not parse precacheAndRoute manifest from sw.js');
  }
  return urls.map((url) => ({ url }));
}

/**
 * Split a flat list of dist files (relative paths) into budget sets.
 * `manifestUrls` are the SW-precached paths; sw.js itself is install-time too.
 * Returns { installFiles, onDemandFiles } preserving input order.
 */
export function splitBudget(files, manifestUrls) {
  const precached = new Set(manifestUrls);
  precached.add('sw.js');
  const installFiles = [];
  const onDemandFiles = [];
  for (const f of files) {
    (precached.has(f) ? installFiles : onDemandFiles).push(f);
  }
  return { installFiles, onDemandFiles };
}

/** Sum the byte sizes of `files` resolved under `distDir` (throws on missing). */
export function totalBytes(distDir, files) {
  let total = 0;
  for (const f of files) total += statSync(join(distDir, f)).size;
  return total;
}

/** Walk dist/ and return every file's path relative to dist/. */
export function listDistFiles(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...listDistFiles(join(dir, entry.name), `${prefix}${entry.name}/`));
    else out.push(`${prefix}${entry.name}`);
  }
  return out;
}

/** Aggregate on-demand bytes per top-level dist/ directory, largest first. */
export function onDemandBreakdown(files, sizeOf) {
  const byTop = new Map();
  for (const f of files) {
    const top = f.includes('/') ? f.slice(0, f.indexOf('/')) : f;
    byTop.set(top, (byTop.get(top) ?? 0) + sizeOf(f));
  }
  return [...byTop.entries()].sort((a, b) => b[1] - a[1]);
}

const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

export function judge({ installBytes, _onDemandBytes, topoBytes }) {
  const problems = [];
  if (installBytes > INSTALL_LIMIT_BYTES) {
    problems.push(
      `size-budget: FAIL — install-time set is ${mb(installBytes)} MB (limit 25 MB). Trim what the service worker precaches.`,
    );
  }
  const warns = [];
  if (topoBytes > TOPO_WARN_BYTES) {
    warns.push(
      `size-budget: WARN — topo is ${mb(topoBytes)} MB (warn over 100 MB). Consider trimming hillshade zooms.`,
    );
  }
  return { ok: problems.length === 0, problems, warns };
}

async function main() {
  const distDir = join(process.cwd(), 'dist');
  let swSource;
  try {
    swSource = readFileSync(join(distDir, 'sw.js'), 'utf8');
  } catch (err) {
    console.error(`size-budget: could not read ${distDir}/sw.js — run vite build first. (${err.message})`);
    process.exit(1);
  }
  let manifest;
  try {
    manifest = parsePrecacheManifest(swSource);
  } catch (err) {
    console.error(`size-budget: ${err.message}`);
    process.exit(1);
  }
  if (manifest.length === 0) {
    console.error('size-budget: precacheAndRoute manifest in sw.js is empty — refusing to budget an empty install set.');
    process.exit(1);
  }

  const files = listDistFiles(distDir);
  const { installFiles, onDemandFiles } = splitBudget(files, manifest.map((e) => e.url));

  // Every manifest entry must exist on disk — a stale manifest is a broken install.
  const missing = manifest.filter((e) => !files.includes(e.url)).map((e) => e.url);
  if (missing.length > 0) {
    console.error(`size-budget: FAIL — ${missing.length} precache manifest entr${missing.length === 1 ? 'y' : 'ies'} missing from dist: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ' …' : ''}`);
    process.exit(1);
  }

  const installBytes = totalBytes(distDir, installFiles);
  const onDemandBytes = totalBytes(distDir, onDemandFiles);
  const topoBytes = onDemandFiles
    .filter((f) => f.startsWith('atlas/topo/'))
    .reduce((n, f) => n + statSync(join(distDir, f)).size, 0);

  const { ok, problems, warns } = judge({ installBytes, onDemandBytes, topoBytes });
  console.log(`install-time (SW precache, ${installFiles.length} files): ${mb(installBytes)} MB of 25 MB budget`);
  console.log(`on-demand / runtime-cached (${onDemandFiles.length} files): ${mb(onDemandBytes)} MB (not install-gated)`);
  for (const [top, bytes] of onDemandBreakdown(onDemandFiles, (f) => statSync(join(distDir, f)).size).slice(0, 5)) {
    console.log(`  on-demand ${top}/: ${mb(bytes)} MB`);
  }
  for (const w of warns) console.warn(w);
  if (!ok) {
    for (const p of problems) console.error(p);
    process.exit(1);
  }
  console.log('size-budget: OK — install-time set within the 25 MB budget');
}

// Run as CLI only when executed directly (import.meta.url check keeps the module
// importable by its unit tests).
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
