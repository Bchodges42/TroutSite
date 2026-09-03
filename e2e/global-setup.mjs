/* eslint-disable no-undef -- Node script run by Playwright (no bundler types) */
/**
 * e2e globalSetup — canonical suite (Role 6 consolidation of Role 2's harness).
 *
 * 1. Rebuild apps/web as the FIXTURE flavor (deterministic data served at the
 *    frozen /v1/* + /content/* URLs through `vite preview`) — the web project's
 *    specs assert against this data.
 * 2. Rebuild apps/admin with VITE_API_BASE pointing at the e2e API instance
 *    (:8791) so the portal project exercises the REAL write path (§12 #5).
 * 3. Prepare that API instance's environment: temp SQLite DB seeded from
 *    apps/api/fixtures/content (test-fly-shop has reports enabled), and a real
 *    portal token minted with the api token CLI — exactly the operator flow in
 *    apps/admin/TOKENS.md.
 *
 * The playwright.config.ts sets E2E_* env vars; the defaults below must match.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

const PORTAL_ENV_DIR = process.env.E2E_PORTAL_ENV_DIR ?? path.join(HERE, 'test-results', 'portal-env');
const PORTAL_TOKEN_FILE = process.env.E2E_PORTAL_TOKEN_FILE ?? path.join(HERE, 'test-results', 'portal-token.txt');
const PORTAL_SECRET = process.env.E2E_PORTAL_SECRET ?? 'e2e-portal-secret-0123456789abcdef';
const API_BASE = process.env.E2E_API_BASE ?? 'http://127.0.0.1:8791';

function run(cmd, opts = {}) {
  console.log(`[e2e-setup] ${cmd}`);
  execSync(cmd, { cwd: REPO, stdio: 'inherit', ...opts });
}

export default function globalSetup() {
  // 1. Deterministic fixture build for the web project (also runs the size gate).
  run('pnpm --filter @trout/web build:fixtures');

  // 2. Admin production build baked against the e2e API origin.
  run('pnpm --filter @trout/admin build', {
    env: { ...process.env, VITE_API_BASE: API_BASE },
  });

  // 3. Fresh portal environment: DB + snapshots + one real minted token.
  rmSync(PORTAL_ENV_DIR, { recursive: true, force: true });
  mkdirSync(PORTAL_ENV_DIR, { recursive: true });
  const portalEnv = {
    ...process.env,
    PORTAL_SECRET,
    TROUT_DB_PATH: path.join(PORTAL_ENV_DIR, 'trout.db'),
    TROUT_CONTENT_DIR: path.join(REPO, 'apps', 'api', 'fixtures', 'content'),
    TROUT_SNAPSHOTS_DIR: path.join(PORTAL_ENV_DIR, 'snapshots'),
  };
  run('pnpm --filter api seed', { env: portalEnv });

  const token = execSync('pnpm --filter api token -- --shop=test-fly-shop --days=30', {
    cwd: REPO,
    env: portalEnv,
    encoding: 'utf8',
    shell: true,
  }).trim();
  const lastLine = token.split('\n').pop()?.trim() ?? '';
  if (!lastLine.startsWith('v1.test-fly-shop.')) {
    throw new Error(`token CLI produced an unexpected token: ${lastLine.slice(0, 24)}…`);
  }
  writeFileSync(PORTAL_TOKEN_FILE, lastLine, 'utf8');

  if (!existsSync(path.join(PORTAL_ENV_DIR, 'trout.db'))) {
    throw new Error('portal env DB was not created');
  }
  console.log('[e2e-setup] portal env ready (DB seeded, token minted)');
}
