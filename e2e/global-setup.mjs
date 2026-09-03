/* eslint-disable no-undef -- Node script run by Playwright (no bundler types) */
/**
 * e2e globalSetup — canonical suite (Role 6 consolidation of Role 2's harness).
 *
 * 1. Rebuild apps/web as the FIXTURE flavor (deterministic data served at the
 *    frozen /v1/* + /content/* URLs through `vite preview`) — the web project's
 *    specs assert against this data.
 * The portal project is served the production way (ADR 0004): infra/static-server.mjs
 * serves apps/admin/dist on :4174 and proxies /v1/portal/* to the e2e API —
 * same-origin, exactly like the deployed PORTAL hostname. The e2e API instance
 * itself is started by the playwright.config.ts webServer entry via
 * `scripts/api-e2e-server.mjs`, which seeds a temp DB from
 * apps/api/fixtures/content and mints a real portal token on startup (the
 * operator flow from apps/admin/TOKENS.md). Playwright starts webServers
 * before globalSetup, so all server-side setup lives in that script.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

function run(cmd, opts = {}) {
  console.log(`[e2e-setup] ${cmd}`);
  execSync(cmd, { cwd: REPO, stdio: 'inherit', ...opts });
}

export default function globalSetup() {
  // 1. Deterministic fixture build for the web project (also runs the size gate).
  run('pnpm --filter @trout/web build:fixtures');

  // 2. Fresh admin build in its same-origin default (no VITE_API_BASE) so the
  //    portal talks to its own origin — the /v1/portal proxy handles the API.
  run('pnpm --filter @trout/admin build', {
    env: { ...process.env, VITE_API_BASE: '' },
  });
}
