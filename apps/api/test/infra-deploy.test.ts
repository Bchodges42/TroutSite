import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const INFRA = join(REPO_ROOT, 'infra');

function sh(cwd: string, script: string, env: Record<string, string> = {}): { status: number; stdout: string; stderr: string } {
  const res = spawnSync('bash', ['-c', script], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: res.status ?? -1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

/**
 * A throwaway git repo + checkout pair the deploy/autoupdate scripts can run
 * against: a bare "origin" and a clone whose only content is a snapshot tree
 * and a copy of infra/ (the scripts cd relative to their own location, so the
 * copy keeps every mutation inside the sandbox). pnpm steps fail fast here —
 * exactly the "early failure after the first mutation" T0-2 is about.
 */
function makeSandbox(): { base: string; work: string } {
  const base = mkdtempSync(join(tmpdir(), 'trout-t02-'));
  const origin = join(base, 'origin.git');
  const work = join(base, 'work');
  mkdirSync(origin);
  sh(base, `git init --bare -q -b main ${JSON.stringify(origin)}`);
  mkdirSync(work);
  sh(work, 'git init -q -b main && git config user.email t@t && git config user.name t');
  mkdirSync(join(work, 'apps/web/public/v1'), { recursive: true });
  writeFileSync(join(work, 'apps/web/public/v1/streams.json'), '[]');
  cpSync(INFRA, join(work, 'infra'), { recursive: true });
  sh(work, 'git add -A && git commit -qm base && git remote add origin ../origin.git && git push -q -u origin main && git fetch -q origin');
  return { base, work };
}

describe('deploy.sh failure paths (T0-2)', () => {
  let sandbox: { base: string; work: string };

  beforeEach(() => {
    sandbox = makeSandbox();
  });

  afterEach(() => {
    rmSync(sandbox.base, { recursive: true, force: true });
  });

  it('archives the rollback point BEFORE the first mutation (git pull)', { timeout: 120_000 }, () => {
    const out = sh(sandbox.work, 'bash infra/deploy.sh');
    const archiveIdx = out.stdout.indexOf('[deploy] archive the currently-served snapshots BEFORE any mutation');
    const pullIdx = out.stdout.indexOf('[deploy] git pull (first mutation');
    expect(archiveIdx).toBeGreaterThanOrEqual(0);
    expect(pullIdx).toBeGreaterThan(archiveIdx);
  });

  it('rolls the checkout back and exits non-zero when a post-pull step fails', { timeout: 120_000 }, () => {
    // Put a commit on origin that the local checkout does NOT have, so the
    // deploy's git pull is a real mutation of HEAD.
    sh(sandbox.work, 'git commit -q --allow-empty -m remote-change && git push -q origin main && git reset -q --hard HEAD~1');
    const before = sh(sandbox.work, 'git rev-parse HEAD').stdout.trim();
    expect(sh(sandbox.work, 'git rev-parse origin/main').stdout.trim()).not.toBe(before);

    const out = sh(sandbox.work, 'bash infra/deploy.sh');
    expect(out.status).not.toBe(0);
    expect(out.stdout).toContain('[deploy] ROLLBACK');

    const after = sh(sandbox.work, 'git rev-parse HEAD').stdout.trim();
    expect(after).toBe(before);
  });

  it('writes backups/last-good-rev only on the verified success path (source contract)', () => {
    // A full green deploy needs the real workspace; the success-path contract
    // is asserted on the script source: the stamp write (via deploy-stamp.sh,
    // which also backs the refresh-data/watchdog skew guards) happens after
    // the verify gate and before "done".
    const src = readFileSync(join(INFRA, 'deploy.sh'), 'utf8');
    const writeIdx = src.indexOf('bash infra/deploy-stamp.sh write');
    const verifyIdx = src.indexOf('bash infra/verify-site.sh --url "$VERIFY_URL" --wait 30 --deep || FAIL=1');
    const doneIdx = src.indexOf('[deploy] done — all endpoints green.');
    expect(writeIdx).toBeGreaterThan(verifyIdx);
    expect(doneIdx).toBeGreaterThan(writeIdx);
  });
});

describe('autoupdate.sh retry semantics (T0-2)', () => {
  let sandbox: { base: string; work: string };

  beforeEach(() => {
    sandbox = makeSandbox();
  });

  afterEach(() => {
    rmSync(sandbox.base, { recursive: true, force: true });
  });

  // The deploy command runs via unquoted $DEPLOY_CMD expansion, so it must be
  // a single space-separated command with no quoted arguments (like the real
  // default 'bash infra/deploy.sh'): touch a relative marker in the sandbox.
  function runAutoupdate(deployCommand = 'touch deployed.marker'): { status: number; stdout: string } {
    const out = sh(sandbox.work, `bash ${JSON.stringify(join(INFRA, 'autoupdate.sh'))}`, {
      TROUT_ROOT: sandbox.work,
      TROUT_DEPLOY_BRANCH: 'main',
      TROUT_DEPLOY_CMD: deployCommand,
    });
    return { status: out.status, stdout: out.stdout + out.stderr };
  }

  const markerPath = () => join(sandbox.work, 'deployed.marker');

  function statusFile(): string {
    return existsSync(join(sandbox.work, 'backups/autoupdate.status'))
      ? readFileSync(join(sandbox.work, 'backups/autoupdate.status'), 'utf8')
      : '';
  }

  it('retries the deploy when HEAD==origin but no verified-good revision is recorded', { timeout: 120_000 }, () => {
    // HEAD == origin/main already (fresh sandbox). Old behavior: UP-TO-DATE, no deploy.
    const out = runAutoupdate();
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('a previous deploy failed; retrying');
    expect(existsSync(markerPath())).toBe(true); // the deploy ran
    expect(statusFile()).toContain('DEPLOYED');
  });

  it('reports UP-TO-DATE without deploying when last-good-rev matches HEAD', () => {
    const head = sh(sandbox.work, 'git rev-parse HEAD').stdout.trim();
    mkdirSync(join(sandbox.work, 'backups'), { recursive: true });
    writeFileSync(join(sandbox.work, 'backups/last-good-rev'), `${head}\n`);

    const out = runAutoupdate();
    expect(out.status).toBe(0);
    expect(existsSync(markerPath())).toBe(false);
    expect(statusFile()).toContain('UP-TO-DATE');
  });

  it('deploys normally when origin moves ahead of a verified-good HEAD', { timeout: 120_000 }, () => {
    const head = sh(sandbox.work, 'git rev-parse HEAD').stdout.trim();
    mkdirSync(join(sandbox.work, 'backups'), { recursive: true });
    writeFileSync(join(sandbox.work, 'backups/last-good-rev'), `${head}\n`);
    sh(sandbox.work, 'git commit -q --allow-empty -m remote-change && git push -q origin main && git reset -q --hard HEAD~1 && git fetch -q origin');

    const out = runAutoupdate();
    expect(out.status).toBe(0);
    expect(existsSync(markerPath())).toBe(true);
  });

  it('pages a first deploy failure with bounded diagnostic context', { timeout: 120_000 }, () => {
    // Keep this local and deterministic: replace the transport with a small
    // capture script, then make the deploy command fail immediately.
    writeFileSync(
      join(sandbox.work, 'infra', 'push-notify.sh'),
      '#!/usr/bin/env bash\nprintf "%s\\n%s\\n" "$1" "$2" > "$PWD/push-capture.txt"\n',
    );
    // The real updater refuses a dirty checkout. Commit the fake transport in
    // the isolated fixture so this exercises the deploy-failure path instead.
    sh(sandbox.work, 'git add infra/push-notify.sh && git commit -qm fake-push-transport');

    const out = runAutoupdate('false');

    expect(out.status).toBe(1);
    const push = readFileSync(join(sandbox.work, 'push-capture.txt'), 'utf8');
    expect(push).toContain('Trout auto-deploy failed');
    expect(push).toContain('Automatic deploy to');
    expect(push).toContain('Failure context (bounded; secrets redacted):');
    expect(push).toContain('DEPLOY FAILED');
  });
});
