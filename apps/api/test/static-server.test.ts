import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { once } from 'node:events';
import { afterEach, describe, expect, it } from 'vitest';

const repoRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const staticServer = resolve(repoRoot, 'infra/static-server.mjs');

async function freePort(): Promise<number> {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('could not allocate a test port');
  const port = address.port;
  await new Promise<void>((resolveClose, rejectClose) => probe.close((err) => (err ? rejectClose(err) : resolveClose())));
  return port;
}

async function startStaticServer(distDir: string): Promise<{ child: ChildProcessWithoutNullStreams; port: number }> {
  const port = await freePort();
  const child = spawn(process.execPath, [staticServer, distDir, String(port)], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ready = new Promise<void>((resolveReady, reject) => {
    const timer = setTimeout(() => reject(new Error('static server did not start')), 5_000);
    child.stdout.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('static server on')) {
        clearTimeout(timer);
        resolveReady();
      }
    });
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`static server exited before ready: ${code}`)));
  });
  await ready;
  return { child, port };
}

describe('secondary-origin static server path safety', () => {
  let tempDir: string | undefined;
  let child: ChildProcessWithoutNullStreams | undefined;

  afterEach(() => {
    child?.kill();
    child = undefined;
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  });

  it('rejects encoded traversal, malformed escapes, and non-GET methods', async () => {
    tempDir = mkdtempSync(join('/tmp', 'trout-static-test-'));
    const distDir = join(tempDir, 'dist');
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, 'index.html'), '<html>safe shell</html>');
    writeFileSync(join(tempDir, 'secret.txt'), 'should never be served');
    const started = await startStaticServer(distDir);
    child = started.child;
    const base = `http://127.0.0.1:${started.port}`;

    for (const attack of ['/%2e%2e%2fsecret.txt', '/..%2fsecret.txt', `/${'..%2f'.repeat(120)}secret.txt`]) {
      const response = await fetch(`${base}${attack}`);
      expect(response.status, attack).toBe(404);
      expect(await response.text(), attack).not.toContain('should never be served');
    }

    const malformed = await fetch(`${base}/%E0%A4%A`);
    expect(malformed.status).toBe(404);

    const method = await fetch(`${base}/index.html`, { method: 'POST' });
    expect(method.status).toBe(405);
    expect(method.headers.get('allow')).toBe('GET, HEAD');

    const navigation = await fetch(`${base}/client-route`, { headers: { accept: 'text/html' } });
    expect(navigation.status).toBe(200);
    expect(await navigation.text()).toContain('safe shell');
  });
});
