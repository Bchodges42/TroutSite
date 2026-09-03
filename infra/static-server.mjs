/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Static file server for the secondary origins (infra / ROLE 6, ADR 0004).
 *
 *   node infra/static-server.mjs <distDir> <port> [--proxy v1/portal=http://127.0.0.1:8787]
 *
 * (The proxy prefix deliberately has NO leading slash: Git Bash on Windows
 * converts leading-slash arguments into Windows paths, which would mangle the
 * spec. The prefix is normalized to /v1/portal internally.)
 *
 * Zero dependencies (Node http/fs). Used for:
 *   - the shop portal (apps/admin/dist, :8788) — with the proxy flag, so the
 *     portal's two live routes (/v1/portal/me, /v1/portal/reports) are forwarded
 *     to the Fastify API and the portal build stays environment-neutral
 *     (same-origin fetches, no CORS anywhere);
 *   - the marketing site (apps/marketing/dist, :8789) — static only.
 *
 * SPA fallback: unknown paths serve index.html (both apps are SPAs / static
 * sites with client-side routes); real 404s keep their own page where present.
 */
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.argv[2] ?? '.');
const port = Number(process.argv[3] ?? 58630);

const proxyArgIdx = process.argv.indexOf('--proxy');
const PROXY = proxyArgIdx > -1 ? parseProxy(process.argv[proxyArgIdx + 1] ?? '') : null;
function parseProxy(spec) {
  const [rawPrefix, target] = String(spec).split('=');
  if (!rawPrefix || !target) return null;
  const prefix = rawPrefix.startsWith('/') ? rawPrefix : `/${rawPrefix}`;
  const url = new URL(target);
  return { prefix, hostname: url.hostname, port: url.port || 80 };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
};

function serveFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    // Static assets are fingerprinted by the build; HTML must revalidate.
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (PROXY && url.pathname.startsWith(PROXY.prefix)) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const upstream = http.request(
        {
          hostname: PROXY.hostname,
          port: PROXY.port,
          path: url.pathname + url.search,
          method: req.method,
          headers: { ...req.headers, host: `${PROXY.hostname}:${PROXY.port}` },
        },
        (up) => {
          res.writeHead(up.statusCode ?? 502, up.headers);
          up.pipe(res);
        },
      );
      upstream.on('error', (err) => {
        res.writeHead(502, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: `portal API unreachable: ${err.message}` }));
      });
      if (chunks.length > 0) upstream.write(Buffer.concat(chunks));
      upstream.end();
    });
    return;
  }

  let filePath = path.join(distDir, decodeURIComponent(url.pathname));
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!existsSync(filePath)) {
    // SPA fallback → index.html; if the build ships a 404 page for truly
    // missing assets, it is reachable at /404.html directly.
    filePath = path.join(distDir, 'index.html');
  }
  serveFile(req, res, filePath);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`static server on http://127.0.0.1:${port} → ${distDir}${PROXY ? ` (proxy ${PROXY.prefix} → :${PROXY.port})` : ''}`);
});
