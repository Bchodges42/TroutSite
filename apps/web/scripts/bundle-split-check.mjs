/* global URL, console, process */
/**
 * F31 bundle-split gate — runs after `vite build` (see package.json build /
 * build:fixtures) and asserts the split actually happened in the real dist:
 *
 *  1. MAP ISOLATION: the eager graph (index.html's module entry + its static
 *     import closure) contains no MapLibre code. MapLibre must ship only in
 *     lazy route chunks, so a cold non-map start never downloads it.
 *  2. MAP CHUNK: the lazy MapPage chunk exists, lives OUTSIDE the eager
 *     closure, and carries the MapLibre code (the map is the home route —
 *     this proves the map still has its code, just behind the boundary).
 *  3. OFFLINE COVERAGE: every built assets/*.js chunk is in the Workbox
 *     precache manifest in dist/sw.js — the precache glob (the all-JS pattern
 *     in vite.shared.ts) must keep covering split chunks, or an offline cold
 *     start of a lazily-visited route breaks.
 *  4. SIZE BUDGET: the install-time set (precache manifest + sw.js) stays
 *     within the 25 MB PWA budget (same rule size-budget.mjs enforces; both
 *     gates must hold).
 *
 * Pure helpers are exported for unit tests (test/bundle-splitting.test.ts).
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  INSTALL_LIMIT_BYTES,
  judge,
  listDistFiles,
  parsePrecacheManifest,
  splitBudget,
} from './size-budget.mjs';

/** Marker that a chunk carries MapLibre code (minified output keeps the name). */
export const MAPLIBRE_MARKER = 'maplibre';

/** Pull the module entry chunk path (`assets/…js`) out of a built index.html. */
export function parseHtmlEntry(html) {
  const m = html.match(/<script[^>]*type="module"[^>]*src="\/([^"]+\.js)"/);
  return m ? m[1] : null;
}

/**
 * Static (eager) import closure of `entry` across dist chunk sources.
 * Minified Vite output imports statically as `from"./x.js"` or `import"./x.js"`;
 * dynamic imports are `import("./x.js")` — the quote (not paren) after
 * `import` keeps them out of this set, which is the whole point: dynamic
 * imports are exactly the lazy boundaries this gate protects.
 */
export function eagerClosure(entry, readAsset) {
  const seen = new Set([entry]);
  const queue = [entry];
  while (queue.length) {
    const current = queue.pop();
    const source = readAsset(current);
    if (source === null) continue;
    const imports = source.matchAll(/(?:from|import)"\.\/([^"]+)"/g);
    for (const m of imports) {
      const next = `assets/${m[1]}`;
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/** All built JS chunk paths under assets/, relative to dist. */
export function builtJsChunks(files) {
  return files.filter((f) => f.startsWith('assets/') && f.endsWith('.js'));
}

/**
 * Core gate. `readAsset(distRel)` returns a chunk's source text or null;
 * `sizeOf(distRel)` returns its size on disk in bytes.
 * Returns { ok, problems, info } — info carries the evidence numbers.
 */
export function checkBundleSplit({ files, readAsset, html, sizeOf }) {
  const problems = [];
  const entry = parseHtmlEntry(html);
  if (!entry) {
    return {
      ok: false,
      problems: ['bundle-split: no type=module script entry found in dist/index.html'],
      info: {},
    };
  }
  const closure = eagerClosure(entry, readAsset);

  // 1. MapLibre must not be in the eager graph.
  const eagerMaplibre = [...closure].filter((f) => (readAsset(f) ?? '').includes(MAPLIBRE_MARKER));
  const eagerMaplibreFree = eagerMaplibre.length === 0;
  if (!eagerMaplibreFree) {
    problems.push(
      `bundle-split: MapLibre code found in the eager entry graph: ${eagerMaplibre.join(', ')} — keep it behind the lazy map boundary (F31)`,
    );
  }

  // 2. The lazy map chunk exists, outside the eager closure, carrying MapLibre.
  const jsChunks = builtJsChunks(files);
  const mapChunk = jsChunks.find(
    (f) => /^assets\/MapPage-[^/]*\.js$/.test(f) && (readAsset(f) ?? '').includes(MAPLIBRE_MARKER),
  );
  if (!mapChunk) {
    problems.push(
      'bundle-split: no assets/MapPage-*.js chunk carrying MapLibre — the lazy map boundary regressed (F31)',
    );
  } else if (closure.has(mapChunk)) {
    problems.push(
      `bundle-split: ${mapChunk} is statically reachable from the entry — the map route boundary regressed (F31)`,
    );
  }

  // 3. Every built JS chunk must be in the SW precache manifest (offline).
  const swSource = readAsset('sw.js');
  let installBytes = null;
  if (swSource === null) {
    problems.push('bundle-split: dist/sw.js missing — run vite build first');
  } else {
    const manifestUrls = parsePrecacheManifest(swSource).map((e) => e.url);
    const precached = new Set(manifestUrls);
    const uncovered = jsChunks.filter((f) => !precached.has(f));
    if (uncovered.length > 0) {
      problems.push(
        `bundle-split: ${uncovered.length} built chunk(s) missing from the SW precache manifest (offline cold start would break): ${uncovered.slice(0, 5).join(', ')}${uncovered.length > 5 ? ' …' : ''}`,
      );
    }

    // 4. Install-time size budget (same rule as size-budget.mjs).
    const { installFiles } = splitBudget(files, manifestUrls);
    installBytes = installFiles.reduce((n, f) => n + (sizeOf(f) ?? 0), 0);
    const { ok: budgetOk, problems: budgetProblems } = judge({
      installBytes,
      onDemandBytes: 0,
      topoBytes: 0,
    });
    if (!budgetOk) problems.push(...budgetProblems);
  }

  const closureBytes = [...closure].reduce((n, f) => n + (sizeOf(f) ?? 0), 0);
  const mapBytes = mapChunk ? sizeOf(mapChunk) ?? 0 : 0;
  return {
    ok: problems.length === 0,
    problems,
    info: {
      entry,
      eagerChunks: [...closure].sort(),
      eagerBytes: closureBytes,
      eagerMaplibreFree,
      mapChunk,
      mapBytes,
      installBytes,
    },
  };
}

export function main({ distDir = join(process.cwd(), 'dist'), cwd = process.cwd() } = {}) {
  const files = listDistFiles(distDir);
  const readAsset = (f) => {
    try {
      return readFileSync(join(distDir, f), 'utf8');
    } catch {
      return null;
    }
  };
  const sizeOf = (f) => {
    try {
      return statSync(join(distDir, f)).size;
    } catch {
      return null;
    }
  };
  let html;
  try {
    html = readFileSync(join(distDir, 'index.html'), 'utf8');
  } catch {
    console.error(`bundle-split: could not read ${join(cwd, 'dist', 'index.html')} — run vite build first.`);
    process.exit(1);
  }
  const { ok, problems, info } = checkBundleSplit({ files, readAsset, html, sizeOf });
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`bundle-split: entry ${info.entry}`);
  console.log(
    `bundle-split: eager graph ${info.eagerChunks.length} chunk(s), ${kb(info.eagerBytes)} — maplibre-free: ${info.eagerMaplibreFree}`,
  );
  console.log(`bundle-split: lazy map chunk ${info.mapChunk ?? 'MISSING'} (${kb(info.mapBytes)})`);
  if (info.installBytes !== null) {
    console.log(`bundle-split: install-time set ${kb(info.installBytes)} of ${kb(INSTALL_LIMIT_BYTES)} budget`);
  }
  if (!ok) {
    for (const p of problems) console.error(p);
    process.exit(1);
  }
  console.log('bundle-split: OK — map isolated behind the lazy boundary, all chunks precached, budget holds');
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
