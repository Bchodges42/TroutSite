/* global console, process, require, module, __filename */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Builds the fixture app before the e2e webServer starts (see
 * playwright.config.ts). Running the real production pipeline — vite build +
 * fixture copy + size budget — is part of the test's value.
 *
 * In restricted environments that cannot spawn child processes (hardened CI
 * sandboxes), setup falls back to an existing `pnpm build:fixtures` output so
 * the suite still runs; the spawnless path refuses to continue with no build.
 */
const { execFileSync, spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join, dirname } = require('node:path');

module.exports = async function globalSetup() {
  const appRoot = dirname(__filename); // this file lives in apps/web
  const vite = join(appRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const sizeBudget = join(appRoot, 'scripts', 'size-budget.mjs');
  const buildMarker = join(appRoot, 'dist', 'v1', 'streams');

  // Probing first avoids unhelpful ENOENT noise where spawning is forbidden.
  const probe = spawnSync(process.execPath, ['--version']);
  if (probe.error) {
    if (existsSync(buildMarker)) {
      console.log('e2e globalSetup: spawning unavailable in this environment — reusing the existing fixture build in apps/web/dist.');
      return;
    }
    throw new Error(
      'Cannot spawn processes and no fixture build found. Run `pnpm --filter @trout/web build:fixtures` first.',
    );
  }

  console.log('e2e globalSetup: building fixture app…');
  execFileSync(process.execPath, [vite, 'build', '--config', 'vite.fixtures.config.ts'], {
    cwd: appRoot,
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [sizeBudget], { cwd: appRoot, stdio: 'inherit' });
  console.log('e2e globalSetup: fixture build ready.');
};
