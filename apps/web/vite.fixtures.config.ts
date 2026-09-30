import { cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { buildPlugins, fixtureDefine } from './vite.shared';

/**
 * Fixture build (`pnpm build:fixtures`): the production app plus the fixture
 * snapshots copied into dist at their real URL paths (/v1/..., /content/...).
 * `vite preview` then serves exactly what Cloudflare would in production.
 * Built from buildPlugins({ fixtures: true }) rather than merged with
 * vite.config.ts so the service-worker precache globs know the fixture copies
 * are coming without warning-producing no-match globs in the plain build.
 *
 * Isolation (F10): the /v1, /content and /data namespaces are WIPED from the
 * bundle before the fixture tree is copied in. The plain `public/` copy step
 * would otherwise let gitignored local snapshots (apps/web/public/v1|data|content
 * — ROLE 3/6 regeneration outputs of whatever checkout runs the build) fill
 * gaps under those URLs; after the wipe, the served fixture surface comes ONLY
 * from the generated tree. The source tree defaults to the committed
 * fixtures/data; e2e's global-setup points FIXTURES_SOURCE_DIR at the fresh
 * `fixtures/.e2e-data` tree it generates right before the build.
 */
const fixtureSourceDir = process.env.FIXTURES_SOURCE_DIR ?? './fixtures/data';

const copyFixtures: Plugin = {
  name: 'copy-fixtures-into-dist',
  apply: 'build',
  closeBundle() {
    const dist = new URL('./dist', import.meta.url);
    for (const ns of ['v1', 'content', 'data']) {
      rmSync(join(dist.pathname, ns), { recursive: true, force: true });
    }
    cpSync(new URL(fixtureSourceDir, import.meta.url), dist, { recursive: true });
  },
};

export default defineConfig({
  plugins: [...buildPlugins({ fixtures: true }), copyFixtures],
  define: {
    ...fixtureDefine,
    // Provenance stamped unconditionally: this config IS the synthetic-data
    // build — the flag must not depend on an env var being set (B11).
    'import.meta.env.FIXTURE_BUILD': JSON.stringify(true),
  },
});
