/**
 * e2e globalSetup — canonical suite (Role 6 consolidation of Role 2's harness).
 *
 * 1. Regenerate the fixture tree FRESH (explicit clock = this run) into the
 *    dedicated gitignored directory apps/web/fixtures/.e2e-data, then rebuild
 *    apps/web as the FIXTURE flavor from exactly that tree (deterministic data
 *    served at the frozen /v1/* + /content/* URLs through `vite preview`) — the
 *    web project's specs assert against this data. Generating here is what
 *    keeps the gate independent of whatever ignored snapshots or stale
 *    fixture files a working checkout happens to carry (F10): the served
 *    /v1|/content surface comes only from this generated tree.
 * 2. The portal project is served the production way (ADR 0004): infra/static-server.mjs
 *    serves apps/admin/dist on :4174 and proxies /v1/portal/* to the e2e API —
 *    same-origin, exactly like the deployed PORTAL hostname. The e2e API instance
 *    itself is started by the playwright.config.ts webServer entry via
 *    `scripts/api-e2e-server.mjs`, which seeds a temp DB from
 *    apps/api/fixtures/content and mints a real portal token on startup (the
 *    operator flow from apps/admin/TOKENS.md). Playwright starts webServers
 *    before globalSetup, so all server-side setup lives in that script.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const WEB = path.join(REPO, 'apps', 'web');

function run(cmd, opts = {}) {
  console.log(`[e2e-setup] ${cmd}`);
  execSync(cmd, { cwd: REPO, stdio: 'inherit', ...opts });
}

export default function globalSetup() {
  // 1. Fresh fixture tree with an explicit clock, then the fixture build that
  //    consumes ONLY that tree (vite.fixtures.config wipes dist's /v1, /content
  //    and /data namespaces before copying it in). Also runs the size gate.
  run('node scripts/generate-fixtures.mjs --out fixtures/.e2e-data', { cwd: WEB });
  run('pnpm --filter @trout/web build:fixtures', {
    env: { ...process.env, FIXTURES_SOURCE_DIR: 'fixtures/.e2e-data' },
  });

  // 2. Fresh admin build in its same-origin default (no VITE_API_BASE) so the
  //    portal talks to its own origin — the /v1/portal proxy handles the API.
  run('pnpm --filter @trout/admin build', {
    env: { ...process.env, VITE_API_BASE: '' },
  });
}
