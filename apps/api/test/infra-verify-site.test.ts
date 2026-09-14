import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const API_DIR = join(REPO_ROOT, 'apps', 'api');
const INFRA = join(REPO_ROOT, 'infra');
const token = 'verify-site-test-secret';

// The hardened API runs as a REAL child process: the verifier is itself a
// spawned node, and this suite's sandbox only allows child-to-child localhost
// connections. The launcher imports buildApp by absolute path so module
// resolution stays anchored inside apps/api.
const LAUNCHER = `
import { buildApp } from ${JSON.stringify(join(API_DIR, 'src', 'app.ts'))};
const app = buildApp({ logger: false, webPublicDir: process.env.TROUT_PUBLIC_DIR, watchdogToken: ${JSON.stringify(token)} });
await app.listen({ port: 0, host: '127.0.0.1' });
console.log('PORT ' + app.server.address().port);
`;

/**
 * T0-3 regression: the healing verifier must succeed against a HEALTHY
 * HARDENED instance — watchdog token required on /healthz, and /v1/streams.json
 * deliberately 404 (blocked implementation file). The old verifier sent no
 * token and probed the blocked file, so a healthy hardened deploy FAILED
 * verification and triggered spurious rollbacks.
 */
describe('verify-site.sh against a hardened local instance (T0-3)', () => {
  let dir: string;
  let launcherFile: string;
  let child: ReturnType<typeof spawn> | null = null;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'trout-t03-'));
    const pub = join(dir, 'public');
    for (const d of ['v1/conditions', 'v1/stocking', 'v1/shops', 'v1/reports', 'content']) {
      mkdirSync(join(pub, d), { recursive: true });
    }

    // One contract-valid stream (reuse the generated snapshot's first row).
    const realSnapshot = join(REPO_ROOT, 'apps', 'web', 'public', 'v1', 'streams.json');
    const stream = existsSync(realSnapshot)
      ? JSON.parse(readFileSync(realSnapshot, 'utf8'))[0]
      : {
          id: 'test-stream',
          name: 'Test stream',
          stateId: 'TN',
          waterbodyType: 'river',
          regionId: 'tn-east-holston',
          gaugeIds: [],
          stockingProgram: false,
          idealFlow: [],
          officialSources: [],
        };
    writeFileSync(join(pub, 'v1', 'streams.json'), JSON.stringify([stream]));

    const now = new Date();
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    writeFileSync(
      join(pub, 'v1', 'conditions', 'latest.json'),
      JSON.stringify([{ score: { assessed: true }, fetchedAt: now.toISOString(), nextExpectedUpdate: later.toISOString() }]),
    );
    writeFileSync(join(pub, 'v1', 'stocking', 'TN.json'), '[{"item":1}]');
    writeFileSync(join(pub, 'v1', 'stocking', 'TN-recent.json'), '[{"item":1}]');
    writeFileSync(join(pub, 'v1', 'shops', 'TN.json'), '[{"shop":1}]');
    writeFileSync(join(pub, 'v1', 'reports', 'recent.json'), '[]');
    writeFileSync(join(pub, 'content', 'taxa.json'), '[{"taxon":1}]');
    writeFileSync(join(pub, 'content', 'patterns.json'), '[{"pattern":1}]');
    writeFileSync(join(pub, 'content', 'fishing.json'), '{"waters":{}}');

    launcherFile = join(dir, 'launcher.mjs');
    writeFileSync(launcherFile, LAUNCHER);
  });

  afterEach(() => {
    if (child?.exitCode === null) child.kill('SIGTERM');
    child = null;
    rmSync(dir, { recursive: true, force: true });
  });

  function startHardened(): Promise<string> {
    return new Promise((resolve, reject) => {
      child = spawn('node', ['--import', 'tsx', launcherFile], {
        cwd: API_DIR,
        env: { ...process.env, TROUT_PUBLIC_DIR: join(dir, 'public') },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let out = '';
      const timer = setTimeout(() => reject(new Error(`API child did not start: ${out}`)), 30_000);
      child.stdout!.on('data', (chunk: Buffer) => {
        out += chunk.toString();
        const m = out.match(/PORT (\d+)/);
        if (m) {
          clearTimeout(timer);
          resolve(`http://127.0.0.1:${m[1]}`);
        }
      });
      child.on('exit', (code) => reject(new Error(`API child exited early (${code}): ${out}`)));
    });
  }

  function verify(baseUrl: string, tokenEnv: string): { status: number; stdout: string } {
    const res = spawnSync('bash', [join(INFRA, 'verify-site.sh'), '--url', baseUrl], {
      encoding: 'utf8',
      env: { ...process.env, WATCHDOG_TOKEN: tokenEnv },
      cwd: REPO_ROOT,
      timeout: 60_000,
    });
    return { status: res.status ?? -1, stdout: res.stdout + res.stderr };
  }

  it('is green against a token-protected instance when WATCHDOG_TOKEN is set', async () => {
    const base = await startHardened();
    const out = verify(base, token);
    expect(out.status, out.stdout).toBe(0);
    expect(out.stdout).toContain('all surfaces green');
    // The blocked implementation file is not part of the contract surface.
    expect(out.stdout).not.toContain('GET /v1/streams.json');
  });

  it('fails (not silently passes) against a hardened instance without the token', async () => {
    const base = await startHardened();
    const out = verify(base, '');
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('GET /healthz 401');
  });
});
