import { defineConfig, type Plugin } from 'vite';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlugins, fixtureDefine } from './vite.shared';

const webRoot = dirname(fileURLToPath(import.meta.url));

/**
 * DEV_FIXTURES dev-mode data server. The fixture files live on disk without a
 * `.json` extension (they mirror the frozen `/v1/*` URLs verbatim), and Vite's
 * transform pipeline treats such extensionless paths as JS modules — serving
 * them as `text/javascript` with an appended sourcemap, which breaks the
 * app's `res.json()`. This middleware runs before the transform pipeline and
 * serves the raw fixture bytes as application/json, so `DEV_FIXTURES=1 vite
 * dev` behaves exactly like the fixture `vite preview` build. Serve-only:
 * the production build is untouched.
 */
const devFixturesServer = (): Plugin => ({
  name: 'trout-dev-fixtures',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const raw = req.url ?? '';
      const q = raw.indexOf('?');
      const url = q === -1 ? raw : raw.slice(0, q);
      if (!url.startsWith('/fixtures/data/')) return next();
      const rel = normalize(decodeURIComponent(url).replace('/fixtures/data/', ''));
      const file = join(webRoot, 'fixtures', 'data', rel);
      if (!file.startsWith(join(webRoot, 'fixtures', 'data')) || !existsSync(file) || !statSync(file).isFile()) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(readFileSync(file));
    });
  },
});

export default defineConfig({
  plugins: [devFixturesServer(), ...buildPlugins()],
  define: fixtureDefine,
});
