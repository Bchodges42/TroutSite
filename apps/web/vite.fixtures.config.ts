import { cpSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { buildPlugins, fixtureDefine } from './vite.shared';

/**
 * Fixture build (`pnpm build:fixtures`): the production app plus the fixture
 * snapshots copied into dist at their real URL paths (/v1/..., /content/...).
 * `vite preview` then serves exactly what Cloudflare would in production.
 * Built from buildPlugins({ fixtures: true }) rather than merged with
 * vite.config.ts so the service-worker precache globs know the fixture copies
 * are coming without warning-producing no-match globs in the plain build.
 */
const copyFixtures: Plugin = {
  name: 'copy-fixtures-into-dist',
  apply: 'build',
  closeBundle() {
    cpSync(new URL('./fixtures/data', import.meta.url), new URL('./dist', import.meta.url), {
      recursive: true,
    });
  },
};

export default defineConfig({
  plugins: [...buildPlugins({ fixtures: true }), copyFixtures],
  define: fixtureDefine,
});
