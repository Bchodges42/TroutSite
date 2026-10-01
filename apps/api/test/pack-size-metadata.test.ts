import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { makeTempDir } from './helpers.js';
import { buildApp } from '../src/app.js';

it('HEAD exposes actual UTF-8 asset size across public mounts and catalog without exposing private endpoints', async () => {
  const dir = makeTempDir();
  const publicDir = join(dir, 'public'); const distDir = join(dir, 'dist');
  for (const part of ['v1', 'content']) mkdirSync(join(publicDir, part), { recursive: true });
  mkdirSync(join(distDir, 'atlas'), { recursive: true });
  const content = JSON.stringify({ label: 'River — access', records: [] });
  writeFileSync(join(publicDir, 'v1', 'streams.json'), '[]');
  writeFileSync(join(publicDir, 'content', 'access.json'), content);
  writeFileSync(join(distDir, 'atlas', 'test.geojson'), content);
  writeFileSync(join(distDir, 'index.html'), '<html></html>');
  const app = buildApp({ logger: false, webPublicDir: publicDir, webDistDir: distDir });
  try {
    for (const url of ['/content/access.json', '/atlas/test.geojson']) {
      const head = await app.inject({ method: 'HEAD', url });
      expect(head.statusCode).toBe(200);
      expect(head.headers['x-trout-asset-bytes']).toBe(String(Buffer.byteLength(content)));
      expect(head.payload).toBe('');
    }
    expect((await app.inject({ method: 'HEAD', url: '/v1/streams' })).headers['x-trout-asset-bytes']).toBe('2');
    expect((await app.inject({ method: 'HEAD', url: '/v1/streams.json' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/v1/watches/config' })).headers['x-trout-asset-bytes']).toBeUndefined();
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true, maxRetries: 3 }); }
});
