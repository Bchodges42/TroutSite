/**
 * e2e-only API instance (§12 #5) — started by playwright.config.ts.
 *
 * On startup it prepares a throwaway environment, then imports the real API
 * server entry:
 *   - temp SQLite DB + temp snapshot dir (never the developer's real data)
 *   - DB seeded from apps/api/fixtures/content (test-fly-shop has reports enabled)
 *   - one real portal token minted with the operator CLI (`pnpm --filter api token`)
 *     and written to .portal/portal-token-latest.txt for the admin portal specs
 *   - a distinct synthetic owner token, private candidate and host-status files
 *     for owner specs; preparation does not publish or touch real host records
 *
 * Playwright starts webServers before globalSetup, so ALL server-side setup
 * lives here rather than in global-setup.mjs.
 */
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const E2E_ROOT = path.resolve(HERE, '..');
const REPO = path.resolve(E2E_ROOT, '..');
const PORTAL = path.join(E2E_ROOT, '.portal');
const PORTAL_SECRET = 'e2e-portal-secret-0123456789abcdef';
const OWNER_TOKEN = 'e2e-owner-only-0123456789abcdef';

// Run-unique env dir: a stale Windows handle on a previous run's directory must
// never block startup — prune old ones best-effort, create a fresh one.
for (const entry of existsSync(PORTAL) ? readdirSync(PORTAL) : []) {
  const oldEnv = path.resolve(PORTAL, entry);
  if (/^env-\d+-\d+$/.test(entry) && path.dirname(oldEnv) === path.resolve(PORTAL)) {
    try {
      rmSync(oldEnv, { recursive: true, force: true });
    } catch {
      /* previous-run leftovers are harmless */
    }
  }
}
const ENV_DIR = path.join(PORTAL, `env-${process.pid}-${Date.now()}`);
mkdirSync(ENV_DIR, { recursive: true });

const env = {
  ...process.env,
  PORTAL_SECRET,
  OWNER_DASHBOARD_TOKEN: OWNER_TOKEN,
  TROUT_DB_PATH: path.join(ENV_DIR, 'trout.db'),
  TROUT_CONTENT_DIR: path.join(REPO, 'apps', 'api', 'fixtures', 'content'),
  TROUT_SNAPSHOTS_DIR: path.join(ENV_DIR, 'snapshots'),
  TROUT_PUBLICATION_DIR: path.join(ENV_DIR, 'private-publication'),
  TROUT_OPS_STATUS_DIR: path.join(ENV_DIR, 'private-status'),
};

function run(cmd) {
  console.log(`[api-e2e] ${cmd}`);
  execSync(cmd, { cwd: REPO, stdio: 'inherit', env, shell: true });
}

run('pnpm --filter api seed');
run('pnpm --filter api snapshots');

// Change only the throwaway DB after building the public baseline. The real
// preparation CLI should expose this change in a private candidate, while
// /v1/streams.json continues to serve the original public notes.
const apiRequire = createRequire(path.join(REPO, 'apps', 'api', 'package.json'));
const Database = apiRequire('better-sqlite3');
const candidateDb = new Database(env.TROUT_DB_PATH, { fileMustExist: true });
try {
  const update = candidateDb.prepare('UPDATE streams SET notes = ? WHERE id = ?')
    .run('E2E candidate note: source review is pending.', 'watauga-river');
  if (update.changes !== 1) throw new Error('The owner candidate fixture water is missing.');
} finally { candidateDb.close(); }
run('pnpm --filter api publication -- --action=prepare');
mkdirSync(env.TROUT_OPS_STATUS_DIR, { recursive: true });
writeFileSync(path.join(env.TROUT_OPS_STATUS_DIR, 'backup.status'), `OK ${new Date().toISOString()}\n`);
writeFileSync(path.join(PORTAL, 'owner-token-latest.txt'), OWNER_TOKEN, 'utf8');

const minted = execSync('pnpm --filter api token -- --shop=test-fly-shop --days=30', {
  cwd: REPO,
  env,
  encoding: 'utf8',
  shell: true,
});
// stdout = token only (stderr carries pnpm/CLI metadata); find the v1 line.
const token = minted.split('\n').map((l) => l.trim()).find((l) => l.startsWith('v1.')) ?? '';
if (!token.startsWith('v1.test-fly-shop.')) {
  throw new Error(`token CLI produced an unexpected token: ${token.slice(0, 24)}…`);
}
writeFileSync(path.join(PORTAL, 'portal-token-latest.txt'), token, 'utf8');

console.log('[api-e2e] portal env ready — starting API on :8791');
process.env.PORT = '8791';
process.env.HOST = '127.0.0.1';
process.env.PORTAL_SECRET = PORTAL_SECRET;
process.env.OWNER_DASHBOARD_TOKEN = OWNER_TOKEN;
process.env.TROUT_DB_PATH = env.TROUT_DB_PATH;
process.env.TROUT_CONTENT_DIR = env.TROUT_CONTENT_DIR;
process.env.TROUT_SNAPSHOTS_DIR = env.TROUT_SNAPSHOTS_DIR;
process.env.TROUT_PUBLICATION_DIR = env.TROUT_PUBLICATION_DIR;
process.env.TROUT_OPS_STATUS_DIR = env.TROUT_OPS_STATUS_DIR;
// Windows: dynamic import() of an absolute path needs a file:// URL.
await import(pathToFileURL(path.join(REPO, 'apps', 'api', 'dist', 'server.js')).href);
