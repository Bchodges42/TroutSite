/* eslint-disable no-undef -- Node script run directly (no bundler types) */
/**
 * Minimal static file server for Lighthouse CI — ROLE 5.
 * Zero dependencies (Node http/fs) so qa.yml needs no extra tooling.
 * Usage: node scripts/static-server.mjs <distDir> [port]
 */
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.argv[2] ?? '.');
const port = Number(process.argv[3] ?? 58630);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let filePath = path.join(distDir, decodeURIComponent(url.pathname));

  // Directory → index.html; fall back to SPA-ish 404 page for the app shell.
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!existsSync(filePath)) {
    filePath = path.join(distDir, url.pathname.endsWith('/') ? 'index.html' : '404.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('content-type', MIME[ext] ?? 'application/octet-stream');
  createReadStream(filePath)
    .on('error', () => {
      res.statusCode = 404;
      res.end('not found');
    })
    .pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`static server on http://127.0.0.1:${port} serving ${distDir}`);
});
