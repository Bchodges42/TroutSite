/* global console, process */
/**
 * Precache size budget (non-negotiable #5): the built app + precached content
 * must stay ≤ 25 MB. Runs after `vite build` / `vite build --config
 * vite.fixtures.config.ts` so CI catches bloat before it ships.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT_BYTES = 25 * 1024 * 1024;
const distDir = join(process.cwd(), 'dist');

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(p) : statSync(p).size;
  }
  return total;
}

try {
  const bytes = dirSize(distDir);
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  if (bytes > LIMIT_BYTES) {
    console.error(`size-budget: FAIL — dist is ${mb} MB (limit 25 MB). Trim content or assets.`);
    process.exit(1);
  }
  console.log(`size-budget: OK — dist is ${mb} MB (limit 25 MB)`);
} catch (err) {
  console.error(`size-budget: could not read ${distDir} — run vite build first. (${err.message})`);
  process.exit(1);
}
