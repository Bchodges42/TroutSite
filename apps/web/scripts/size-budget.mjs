/* global console, process */
/**
 * Precache size budget (non-negotiable #5): the built app + precached content
 * must stay ≤ 25 MB. Runs after `vite build` / `vite build --config
 * vite.fixtures.config.ts` so CI catches bloat before it ships.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT_BYTES = 25 * 1024 * 1024;
// Topo DEM derivatives (Task 6e Phase B) live in dist but are runtime-cached
// (CacheFirst) — they never count against the install-time budget. They get
// their own line + warn threshold instead.
const TOPO_WARN_BYTES = 100 * 1024 * 1024;
const distDir = join(process.cwd(), 'dist');
const topoDir = join(distDir, 'atlas', 'topo');

function dirSize(dir, skipDir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (skipDir && entry.isDirectory() && p === skipDir) continue;
    total += entry.isDirectory() ? dirSize(p, skipDir) : statSync(p).size;
  }
  return total;
}

try {
  let topoBytes = 0;
  try {
    topoBytes = dirSize(topoDir);
  } catch {
    /* topo not built yet — 0 MB */
  }
  const bytes = dirSize(distDir, topoDir);
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  const topoMb = (topoBytes / (1024 * 1024)).toFixed(2);
  console.log(`topo (runtime-cached, not precached): ${topoMb} MB`);
  if (topoBytes > TOPO_WARN_BYTES) {
    console.warn(`size-budget: WARN — topo is ${topoMb} MB (warn over 100 MB). Consider trimming hillshade zooms.`);
  }
  if (bytes > LIMIT_BYTES) {
    console.error(`size-budget: FAIL — dist is ${mb} MB (limit 25 MB). Trim content or assets.`);
    process.exit(1);
  }
  console.log(`size-budget: OK — dist is ${mb} MB (limit 25 MB, topo excluded)`);
} catch (err) {
  console.error(`size-budget: could not read ${distDir} — run vite build first. (${err.message})`);
  process.exit(1);
}
