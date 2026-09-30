import { afterEach, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const INFRA = join(REPO_ROOT, 'infra');

/**
 * F46/F47 regression (2026-09-29 senior code audit) — the alerting truthfulness
 * contract of infra/alert.sh and its callers, exercised through the REAL entry
 * scripts with the notifier stubbed (never a real notification):
 *
 *   F46: a caller that records the new status before dispatching used to erase
 *   its own transition (backup.sh / refresh-data.sh failure branches) and never
 *   paged. The prior state is now captured once at trout_alert_init, so call
 *   order cannot suppress an alert.
 *
 *   F47: watchdog.sh used to announce "recovered" before inspecting healthz, so
 *   a persistently degraded pipeline got a recovery announcement on every check
 *   while the real DEGRADED page was deduplicated away. The final state is now
 *   decided before any dispatch.
 *
 * Dedup model under test (RUNBOOK §9): page on state transitions only; a
 * first-ever high-priority failure still pages; identical repeats stay silent.
 */

const sandboxes: string[] = [];
const servers: Server[] = [];

afterEach(() => {
  for (const s of servers.splice(0)) s.close();
  for (const dir of sandboxes.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows: a just-exited bash child can still hold the sandbox for a
      // beat (AV/indexer lock) — rmSync then throws EPERM. Sandbox cleanup is
      // hygiene, not an assertion; leaking a temp dir beats failing the run.
    }
  }
});

function makeSandbox(): string {
  const root = mkdtempSync(join(tmpdir(), 'trout-alert-tx-'));
  sandboxes.push(root);
  cpSync(INFRA, join(root, 'infra'), { recursive: true });
  mkdirSync(join(root, 'backups'), { recursive: true });

  // The notifier is stubbed in EVERY test: one line per page, no network.
  writeFileSync(
    join(root, 'infra', 'push-notify.sh'),
    '#!/usr/bin/env bash\nprintf \'%s | %s\\n\' "${3:-default}" "${1:-}" >> "${TROUT_PUSH_CAPTURE:?}"\n',
  );
  // Local stubs for everything the entrypoints invoke beyond alert.sh. The
  // verify stub fails its first TROUT_STUB_VERIFY_FAILS calls (counted in a
  // sandbox file) so heal/retry chains can be scripted per run.
  writeFileSync(
    join(root, 'infra', 'verify-site.sh'),
    [
      '#!/usr/bin/env bash',
      'count_file="${TROUT_STUB_VERIFY_COUNT:?}"',
      'n="$(cat "$count_file" 2>/dev/null || echo 0)"',
      'n=$((n + 1))',
      'printf \'%s\\n\' "$n" > "$count_file"',
      '[ "$n" -gt "${TROUT_STUB_VERIFY_FAILS:-0}" ]',
    ].join('\n'),
  );
  writeFileSync(join(root, 'infra', 'archive-snapshots.sh'), '#!/usr/bin/env bash\nexit 0\n');
  writeFileSync(
    join(root, 'infra', 'deploy-stamp.sh'),
    [
      '#!/usr/bin/env bash',
      'case "${1:-}" in',
      '  check) exit "${TROUT_STUB_STAMP_RC:-0}" ;;',
      '  show) echo "[stamp] checkout=stub stamped=stub" ;;',
      'esac',
      'exit 0',
    ].join('\n'),
  );
  writeFileSync(
    join(root, 'infra', 'restore-snapshots.sh'),
    '#!/usr/bin/env bash\nexit "${TROUT_STUB_RESTORE_RC:-1}"\n',
  );
  return root;
}

/** A pnpm stand-in (skew-guards.test.mjs pattern) with env-driven outcomes. */
function makePnpmShim(root: string): string {
  const shimDir = join(root, 'shims');
  mkdirSync(shimDir, { recursive: true });
  writeFileSync(
    join(shimDir, 'pnpm'),
    [
      '#!/usr/bin/env bash',
      '# Test shim for the data pipeline steps; never touches real data.',
      'case "$*" in',
      '  *seed*) exit "${TROUT_SHIM_SEED_RC:-0}" ;;',
      '  *snapshots*) exit "${TROUT_SHIM_SNAPSHOTS_RC:-0}" ;;',
      '  *ingest*) exit 0 ;;',
      '  *) echo "unexpected pnpm invocation: $*" >&2; exit 97 ;;',
      'esac',
    ].join('\n'),
  );
  return shimDir;
}

/** Localhost-only /healthz stub whose degraded flag can flip between runs. */
async function startHealthz(initial: 'ok' | 'degraded'): Promise<{ url: string; setMode(m: 'ok' | 'degraded'): void }> {
  let mode = initial;
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.url === '/healthz' && mode === 'degraded') {
      res.end(JSON.stringify({ ok: true, degraded: true, degradedReasons: ['jobs.snapshots status=error (test stub)'] }));
    } else {
      res.end(JSON.stringify({ ok: true }));
    }
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, setMode: (m: 'ok' | 'degraded') => (mode = m) };
}

/**
 * Async on purpose: the /healthz stub lives in THIS process, and a synchronous
 * spawn would block the event loop so the stub could never answer the child's
 * fetch (the watchdog would time out every healthz read and mask the bug).
 */
function run(root: string, script: string, env: Record<string, string> = {}): Promise<{ status: number; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [join(root, 'infra', script)], {
      cwd: root,
      env: {
        ...process.env,
        TROUT_PUSH_CAPTURE: join(root, 'backups', 'pushes.txt'),
        TROUT_STUB_VERIFY_COUNT: join(root, 'backups', 'verify-calls'),
        ...env,
      },
    });
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => (stdout += chunk));
    child.stderr.on('data', (chunk: string) => (stdout += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({ status: code ?? -1, stdout }));
  });
}

/** The stubbed pages so far: ["priority | title", ...] in send order. */
function pushes(root: string): string[] {
  try {
    return readFileSync(join(root, 'backups', 'pushes.txt'), 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== '');
  } catch {
    return [];
  }
}

function recordedStatus(root: string, file: string): string {
  try {
    return readFileSync(join(root, 'backups', file), 'utf8').split(' ')[0] ?? '';
  } catch {
    return '';
  }
}

describe('F46 — backup.sh failure branches page despite recording status first', () => {
  it('pages a first missing-database failure (the audit measured zero)', async () => {
    const root = makeSandbox();
    const out = await run(root, 'backup.sh', { TROUT_DB_PATH: join(root, 'no-such', 'trout.db') });
    expect(out.status).toBe(1);
    expect(pushes(root)).toEqual(['high | Trout DB backup could not find the database']);
    expect(recordedStatus(root, 'backup.status')).toBe('FAIL-NODB');
  });

  it('does not re-page a repeated identical failure (dedup)', async () => {
    const root = makeSandbox();
    const env = { TROUT_DB_PATH: join(root, 'no-such', 'trout.db') };
    await run(root, 'backup.sh', env);
    await run(root, 'backup.sh', env);
    expect(pushes(root)).toEqual(['high | Trout DB backup could not find the database']);
    expect(recordedStatus(root, 'backup.status')).toBe('FAIL-NODB');
  });

  it('pages again when a failure follows a green run (true prior state, not the just-written one)', async () => {
    const root = makeSandbox();
    const env = { TROUT_DB_PATH: join(root, 'no-such', 'trout.db') };
    await run(root, 'backup.sh', env);
    // A later green run leaves "OK" in the status file (same writer, same shape).
    writeFileSync(join(root, 'backups', 'backup.status'), 'OK 2026-09-30T00:00:00Z\n');
    await run(root, 'backup.sh', env);
    expect(pushes(root)).toEqual([
      'high | Trout DB backup could not find the database',
      'high | Trout DB backup could not find the database',
    ]);
  });
});

describe('F46 — refresh-data.sh failure branches page despite recording status first', () => {
  interface Fixture {
    root: string;
    env: Record<string, string>;
  }

  function makeRefreshFixture(): Fixture {
    const root = makeSandbox();
    // refresh-data refuses to run without an apps/api checkout.
    mkdirSync(join(root, 'apps', 'api'), { recursive: true });
    writeFileSync(join(root, 'apps', 'api', 'package.json'), '{"name":"fixture-api"}\n');
    const shimDir = makePnpmShim(root);
    return { root, env: { PATH: `${shimDir}:${process.env.PATH}` } };
  }

  it('pages a first no-stamp refusal and dedups the hourly repeat', async () => {
    const { root, env } = makeRefreshFixture();
    const refusal = { ...env, TROUT_STUB_STAMP_RC: '1' };
    const out = await run(root, 'refresh-data.sh', refusal);
    expect(out.status).toBe(24);
    expect(pushes(root)).toEqual(['high | Trout refresh skipped (no verified deploy)']);
    expect(recordedStatus(root, 'refresh-data.status')).toBe('REFUSED-NOSTAMP');
    await run(root, 'refresh-data.sh', refusal);
    expect(pushes(root)).toEqual(['high | Trout refresh skipped (no verified deploy)']);
  });

  it('pages a seed failure once across repeated runs (FAIL-SEED)', async () => {
    const { root, env } = makeRefreshFixture();
    const seedFails = { ...env, TROUT_SHIM_SEED_RC: '1' };
    const out = await run(root, 'refresh-data.sh', seedFails);
    expect(out.status).toBe(1);
    expect(pushes(root)).toEqual(['high | Trout hourly refresh failed at seed']);
    expect(recordedStatus(root, 'refresh-data.status')).toBe('FAIL-SEED');
    await run(root, 'refresh-data.sh', seedFails);
    expect(pushes(root)).toEqual(['high | Trout hourly refresh failed at seed']);
  }, 60_000);

  it('pages a snapshot failure once across repeated runs (FAIL-SNAPSHOTS)', async () => {
    const { root, env } = makeRefreshFixture();
    const snapsFail = { ...env, TROUT_SHIM_SNAPSHOTS_RC: '1' };
    const out = await run(root, 'refresh-data.sh', snapsFail);
    expect(out.status).toBe(1);
    expect(pushes(root)).toEqual(['high | Trout hourly snapshot rebuild failed']);
    expect(recordedStatus(root, 'refresh-data.status')).toBe('FAIL-SNAPSHOTS');
    await run(root, 'refresh-data.sh', snapsFail);
    expect(pushes(root)).toEqual(['high | Trout hourly snapshot rebuild failed']);
  }, 60_000);

  it('pages a failed read-path verify (FAIL-VERIFY), then recovers silently', async () => {
    const { root, env } = makeRefreshFixture();
    // First verify call fails; every later one passes (countdown stub).
    const first = { ...env, TROUT_STUB_VERIFY_FAILS: '1' };
    const out = await run(root, 'refresh-data.sh', first);
    expect(out.status).toBe(1);
    expect(pushes(root)).toEqual(['high | Trout refresh failed read-path verify']);
    expect(recordedStatus(root, 'refresh-data.status')).toBe('FAIL-VERIFY');
    // Next hourly run is green: status advances to OK without buzzing.
    const second = await run(root, 'refresh-data.sh', env);
    expect(second.status).toBe(0);
    expect(recordedStatus(root, 'refresh-data.status')).toBe('OK');
    expect(pushes(root)).toEqual(['high | Trout refresh failed read-path verify']);
  }, 60_000);

  it('a green refresh writes OK and never buzzes', async () => {
    const { root, env } = makeRefreshFixture();
    const out = await run(root, 'refresh-data.sh', env);
    expect(out.status).toBe(0);
    expect(recordedStatus(root, 'refresh-data.status')).toBe('OK');
    expect(pushes(root)).toEqual([]);
    await run(root, 'refresh-data.sh', env);
    expect(pushes(root)).toEqual([]);
  }, 60_000);
});

describe('F47 — watchdog announces recovery only after a real recovery', () => {
  it('a persistently degraded pipeline pages ONCE and never announces recovery', async () => {
    const healthz = await startHealthz('degraded');
    const root = makeSandbox();
    const env = { TROUT_API_URL: healthz.url, TROUT_STUB_STAMP_RC: '0' };
    for (let i = 0; i < 3; i++) {
      const out = await run(root, 'watchdog.sh', env);
      expect(out.status, out.stdout).toBe(0);
      expect(recordedStatus(root, 'watchdog.status')).toBe('DEGRADED');
    }
    // The audited bug sent "recovered" on checks 2 and 3 and deduped the real
    // degradation alert away; truthful behavior is exactly one DEGRADED page.
    expect(pushes(root)).toEqual(['high | Trout pipeline degraded (read path still green)']);
  }, 60_000);

  it('announces recovery exactly once when a degraded pipeline becomes healthy', async () => {
    const healthz = await startHealthz('degraded');
    const root = makeSandbox();
    const env = { TROUT_API_URL: healthz.url, TROUT_STUB_STAMP_RC: '0' };
    await run(root, 'watchdog.sh', env);
    expect(pushes(root)).toEqual(['high | Trout pipeline degraded (read path still green)']);
    healthz.setMode('ok');
    await run(root, 'watchdog.sh', env);
    expect(recordedStatus(root, 'watchdog.status')).toBe('OK');
    await run(root, 'watchdog.sh', env);
    expect(pushes(root)).toEqual([
      'high | Trout pipeline degraded (read path still green)',
      'default | Trout server recovered',
    ]);
  }, 60_000);

  it('a healthy read path over a healthy pipeline never buzzes', async () => {
    const healthz = await startHealthz('ok');
    const root = makeSandbox();
    const env = { TROUT_API_URL: healthz.url, TROUT_STUB_STAMP_RC: '0' };
    await run(root, 'watchdog.sh', env);
    await run(root, 'watchdog.sh', env);
    expect(recordedStatus(root, 'watchdog.status')).toBe('OK');
    expect(pushes(root)).toEqual([]);
  }, 60_000);

  it('broken read path pages once, heals announce once, then recovery once', async () => {
    const healthz = await startHealthz('ok');
    const root = makeSandbox();
    const env = { TROUT_API_URL: healthz.url };
    // Checks 1-2: verify fails, heal 1 disabled (skew), restore fails → BROKEN.
    const broken = { ...env, TROUT_STUB_STAMP_RC: '24', TROUT_STUB_VERIFY_FAILS: '3', TROUT_STUB_RESTORE_RC: '1' };
    const out1 = await run(root, 'watchdog.sh', broken);
    expect(out1.status).toBe(1);
    expect(recordedStatus(root, 'watchdog.status')).toBe('BROKEN');
    expect(pushes(root)).toEqual(['high | Trout server DOWN (read path)']);
    await run(root, 'watchdog.sh', broken);
    expect(pushes(root)).toEqual(['high | Trout server DOWN (read path)']);
    // Check 3: verify still fails on entry (call 3), restore succeeds, retry
    // verify passes (call 4) → HEALED-RESTORE pages exactly once.
    const healed = { ...env, TROUT_STUB_STAMP_RC: '24', TROUT_STUB_VERIFY_FAILS: '3', TROUT_STUB_RESTORE_RC: '0' };
    const out3 = await run(root, 'watchdog.sh', healed);
    expect(out3.status).toBe(0);
    expect(recordedStatus(root, 'watchdog.status')).toBe('HEALED-RESTORE');
    expect(pushes(root)).toEqual([
      'high | Trout server DOWN (read path)',
      'default | Trout server healed (last-good data)',
    ]);
    // Check 4: fully green → the BROKEN→…→OK recovery is announced exactly once.
    const green = { ...env, TROUT_STUB_STAMP_RC: '0' };
    await run(root, 'watchdog.sh', green);
    expect(recordedStatus(root, 'watchdog.status')).toBe('OK');
    expect(pushes(root)).toEqual([
      'high | Trout server DOWN (read path)',
      'default | Trout server healed (last-good data)',
      'default | Trout server recovered',
    ]);
    // Check 5: still green → silent.
    await run(root, 'watchdog.sh', green);
    expect(pushes(root)).toHaveLength(3);
  }, 90_000);
});
