/* eslint-disable no-undef -- Node test run directly (no bundler types) */
/**
 * Regression tests for the deploy-stamp skew guards (RUNBOOK §9, 2026-09-16
 * code/data skew: the host checkout ran a stricter NEW contracts builder
 * against the deployed OLD database for ten days — hourly "hydroIdentity is
 * required" errors behind a green /healthz).
 *
 * Covered here:
 *   - infra/deploy-stamp.sh  check/write/show matrix (the primitive every
 *     guard consumes)
 *   - infra/refresh-data.sh  refuses to seed/snapshot when the checkout is
 *     not the last verified deploy (exit 24, REFUSED-SKEW/REFUSED-NOSTAMP,
 *     and pnpm never invoked)
 *   - infra/alert.sh         status-transition dedup (page once per state)
 *   - infra/backup.sh        refuses to guess when the database is missing
 *     (the F6 audit finding: it used to back up a hardcoded wrong path or
 *     exit 0 "nothing to do")
 *
 * Run: node --test infra/skew-guards.test.mjs   (or `pnpm test:infra`)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const INFRA = resolve(import.meta.dirname);

/** Scripts a fixture needs so the copied entrypoints can run standalone. */
const SUPPORT_SCRIPTS = [
  'deploy-stamp.sh',
  'alert.sh',
  'runtime-env.sh',
  'refresh-data.sh',
  'push-notify.sh',
  'alert-context.sh',
  'alert-context.mjs',
];

function git(root, args) {
  return execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
}

function makeRepoFixture() {
  const root = mkdtempSync(join(tmpdir(), 'trout-skew-'));
  mkdirSync(join(root, 'infra'), { recursive: true });
  mkdirSync(join(root, 'apps', 'api'), { recursive: true });
  mkdirSync(join(root, 'backups'), { recursive: true });
  for (const f of SUPPORT_SCRIPTS) copyFileSync(join(INFRA, f), join(root, 'infra', f));
  writeFileSync(join(root, 'apps', 'api', 'package.json'), JSON.stringify({ name: 'fixture-api' }));
  writeFileSync(join(root, '.gitignore'), 'backups/\n');
  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-qm', 'fixture']);
  return root;
}

function run(root, script, args = [], env = {}) {
  // Forward slashes only — bash treats backslashes as escapes.
  return spawnSync('bash', [`infra/${script}`, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

const read = (root, rel) => readFileSync(join(root, rel), 'utf8');
const headSha = (root) => git(root, ['rev-parse', 'HEAD']);

test('deploy-stamp: no stamp → check exits 1 and says what to do', () => {
  const root = makeRepoFixture();
  try {
    const r = run(root, 'deploy-stamp.sh', ['check']);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /no deploy stamp/);
    assert.match(r.stdout, /deploy\.sh/);
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
});

test('deploy-stamp: write then check matches; skew (foreign stamp) exits 24', () => {
  const root = makeRepoFixture();
  try {
    // The deploy-time stamp carries "<sha> <utc>" — check must parse the sha only.
    const w = run(root, 'deploy-stamp.sh', ['write']);
    assert.equal(w.status, 0);
    const stamp = read(root, join('backups', 'last-good-rev'));
    assert.match(stamp, new RegExp(`^${headSha(root)} \\d{4}-\\d{2}-\\d{2}T`));
    assert.equal(run(root, 'deploy-stamp.sh', ['check']).status, 0);

    const foreign = '0'.repeat(40);
    writeFileSync(join(root, 'backups', 'last-good-rev'), `${foreign} 2026-09-16T00:00:00Z\n`);
    const skew = run(root, 'deploy-stamp.sh', ['check']);
    assert.equal(skew.status, 24, 'checkout ahead of verified deploy must exit 24');
    assert.match(skew.stdout, /SKEW/);

    const show = run(root, 'deploy-stamp.sh', ['show']);
    assert.match(show.stdout, new RegExp(`checkout=${headSha(root)}`));
    assert.match(show.stdout, new RegExp(`stamped=${foreign}`));
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
});

test('refresh-data: refuses with SKEW when checkout ≠ verified deploy (pnpm never invoked)', () => {
  const root = makeRepoFixture();
  try {
    // Stub pnpm that screams if it is ever reached — the guard must exit long
    // before any data-mutating step would run.
    const stubDir = join(root, 'backups', 'stub-path');
    mkdirSync(stubDir, { recursive: true });
    writeFileSync(
      join(stubDir, 'pnpm'),
      '#!/usr/bin/env bash\necho "PNPM MUST NOT RUN UNDER SKEW" >> backups/pnpm-ran\nexit 99\n',
    );
    const foreign = '1'.repeat(40);
    writeFileSync(join(root, 'backups', 'last-good-rev'), `${foreign} 2026-09-16T00:00:00Z\n`);

    const r = run(root, 'refresh-data.sh', [], { PATH: `${stubDir}:${process.env.PATH}` });
    assert.equal(r.status, 24, `expected 24, got ${r.status}; stdout: ${r.stdout} stderr: ${r.stderr}`);
    assert.match(r.stdout, /REFUSED — code\/data skew/);
    assert.match(read(root, join('backups', 'refresh-data.status')), /^REFUSED-SKEW /);
    assert.ok(!existsSync(join(root, 'backups', 'pnpm-ran')), 'pnpm ran despite the skew guard');
    assert.ok(!read(root, join('backups', 'refresh-data.log')).includes('seed ok'));
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
});

test('refresh-data: refuses with NO-STAMP when nothing has verified on this host', () => {
  const root = makeRepoFixture();
  try {
    const r = run(root, 'refresh-data.sh');
    assert.equal(r.status, 24);
    assert.match(r.stdout, /no verified deploy stamp/);
    assert.match(read(root, join('backups', 'refresh-data.status')), /^REFUSED-NOSTAMP /);
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
});

test('alert.sh: pages on first high-priority state and on transitions, not on repeats', () => {
  const root = makeRepoFixture();
  try {
    // Stub the notifier so assertions are local: every real page appends a line.
    // ($PWD = the fixture root — alert.sh invokes infra/push-notify.sh with the
    // caller's cwd; prio is the stub's $3, matching push-notify's contract.)
    writeFileSync(
      join(root, 'infra', 'push-notify.sh'),
      '#!/usr/bin/env bash\necho "$1 | $3" >> "$PWD/backups/pushes.txt"\n',
    );
    const driver = [
      'set -uo pipefail',
      `cd '${root.replace(/'/g, "'\\''")}'`,
      'source infra/alert.sh',
      'trout_alert_init "$PWD" "backups/t.status" "backups/t.log"',
      // Real callers pair every push with a status write (push-then-record).
      'trout_maybe_push "BROKEN" "first-high" "m" "high"; trout_set_status "BROKEN"', // first-ever high → page
      'trout_maybe_push "BROKEN" "repeat-high" "m" "high"; trout_set_status "BROKEN"', // same state → silent
      'trout_maybe_push "BROKEN" "repeat-default" "m" "default"; trout_set_status "BROKEN"', // same state → silent
      'trout_maybe_push "OK" "transition" "m" "default"; trout_set_status "OK"', // transition → page
    ].join('\n');
    spawnSync('bash', ['-c', driver], { encoding: 'utf8' });
    const pushes = read(root, join('backups', 'pushes.txt')).trim().split('\n');
    assert.deepEqual(pushes, ['first-high | high', 'transition | default']);
    assert.match(read(root, join('backups', 't.status')), /^OK /, 'status file reflects the last recorded state');
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
});

test('backup: missing database fails loudly (F6 — the old script exited 0)', () => {
  const root = makeRepoFixture();
  try {
    copyFileSync(join(INFRA, 'backup.sh'), join(root, 'infra', 'backup.sh'));
    const r = run(root, 'backup.sh', [], { TROUT_DB_PATH: join(root, 'no-such', 'trout.db') });
    assert.equal(r.status, 1, `expected failure, got ${r.status}; stdout: ${r.stdout}`);
    assert.match(r.stdout, /database not found/);
    assert.match(read(root, join('backups', 'backup.status')), /^FAIL-NODB /);
    const dbs = existsSync(join(root, 'backups'))
      ? read(root, join('backups', 'backup.log'))
      : '';
    assert.ok(!/wrote /.test(dbs), 'must not claim a backup was written');
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
});
