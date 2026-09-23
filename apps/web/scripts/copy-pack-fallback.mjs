#!/usr/bin/env node
/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Pack-fallback copy (live-catalog resilience, 2026-09-09).
 *
 * When the host's generated snapshot trees disappear (2026-09-06+ incident:
 * /healthz ok:false, GET /v1/streams → 503 "streams snapshot not generated
 * yet", fresh visitors get the "Catalog unavailable" hard error because they
 * have no Dexie cache to fall back on), the PWA can still render the catalog
 * from the reviewed content pack bundled into dist.
 *
 * This script copies packages/content/dist/pack/streams.json →
 * public/content-pack/streams.json before `vite build`, so the file ships in
 * dist (served by the API's static handler like any other dist asset) and is
 * precached by the service worker (presence-driven glob in vite.shared.ts).
 *
 * Runtime order stays honest — live /v1/streams → last Dexie snapshot →
 * bundled pack (live:false, unassessed waters). The pack is LAST resort only.
 *
 * Tolerates a missing pack (exit 0, existing fallback left in place) so builds
 * without a content package keep working — the fallback is then absent and
 * behavior is unchanged. Fresh pack: pnpm --filter @trout/content build
 */
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..', '..');
const outDir = join(webRoot, 'public', 'content-pack');
const packName = 'streams.json';
const packPath = join(repoRoot, 'packages', 'content', 'dist', 'pack', packName);
// A prior build may have left the retired presence calendar in public. Vite
// copies public verbatim, so prune this exact obsolete file on every build.
rmSync(join(outDir, 'trout-calendar.json'), { force: true });

if (!existsSync(packPath)) {
  console.log(
    '[pack-fallback] content pack not built — no bundled catalog fallback this build ' +
      '(run: pnpm --filter @trout/content build)',
  );
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(packPath, join(outDir, packName));
console.log(`[pack-fallback] bundled catalog fallback ready: ${outDir} (${packName})`);
