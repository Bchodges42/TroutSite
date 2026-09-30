import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const INFRA = join(REPO_ROOT, 'infra');

/**
 * F23 regression (2026-09-29 senior code audit), fault-probed with the audit's
 * copied-script method: a sandbox checkout whose pnpm is a shim that records
 * every invocation (and the marketing data env) and can fail `-r build` on a
 * countdown, with verify-site stubbed green — "an old process answers health".
 *
 * The audit's probe recorded: install → failed new build → git reset → build
 * with NO reinstall for the restored lockfile, NO prerender and
 * MARKETING_DATA_DIR unset — then "ROLLED BACK — last-good state is serving
 * again". deploy.sh must instead:
 *   1. reinstall from the restored lockfile BEFORE the rollback rebuild,
 *   2. rebuild through the same real-data/SEO publication pipeline as the
 *      ordinary deploy (web prerender + MARKETING_DATA_DIR marketing build),
 *   3. refuse to announce rollback success when the rebuild failed.
 */

interface ShimResult {
  status: number;
  stdout: string;
  log: string[];
}

function makeSandbox(): { base: string; work: string; shims: string; pnpmLog: string; buildFails: string } {
  const base = mkdtempSync(join(tmpdir(), 'trout-f23-'));
  const origin = join(base, 'origin.git');
  const work = join(base, 'work');
  const shims = join(base, 'shims');
  mkdirSync(origin);
  mkdirSync(work);
  mkdirSync(shims);
  sh(base, `git init --bare -q -b main ${JSON.stringify(origin)}`);
  sh(work, 'git init -q -b main && git config user.email t@t && git config user.name t');
  mkdirSync(join(work, 'apps/web/public/v1'), { recursive: true });
  writeFileSync(join(work, 'apps/web/public/v1/streams.json'), '[]');
  cpSync(INFRA, join(work, 'infra'), { recursive: true });
  // An old process answering health: the premise the audit's false success
  // relied on. restart is a no-op stub for determinism.
  writeFileSync(join(work, 'infra/verify-site.sh'), '#!/usr/bin/env bash\nexit 0\n');
  writeFileSync(join(work, 'infra/restart-app.sh'), '#!/usr/bin/env bash\nexit 0\n');
  sh(work, 'git add -A && git commit -qm base && git remote add origin ../origin.git && git push -q -u origin main');
  // A commit on origin the checkout does not have, so the deploy's git pull is
  // a real mutation and its failure rolls back (infra-deploy.test.ts pattern).
  sh(work, 'git commit -q --allow-empty -m remote-change && git push -q origin main && git reset -q --hard HEAD~1');

  writeFileSync(
    join(shims, 'pnpm'),
    [
      '#!/usr/bin/env bash',
      'printf \'pnpm %s\\n\' "$*" >> "${TROUT_PNPM_LOG:?}"',
      'case "$*" in',
      '  *" @trout/marketing build"*)',
      '    printf \'marketing-env MARKETING_DATA_DIR=%s\\n\' "${MARKETING_DATA_DIR:-<UNSET>}" >> "$TROUT_PNPM_LOG" ;;',
      'esac',
      'if [ -f "${TROUT_BUILD_FAILS:-}" ]; then',
      '  case "$*" in',
      '    *"-r build"*)',
      '      n="$(cat "$TROUT_BUILD_FAILS" 2>/dev/null || echo 0)"',
      '      if [ "${n:-0}" -gt 0 ]; then',
      '        printf \'%s\' "$((n - 1))" > "$TROUT_BUILD_FAILS"',
      '        echo "shim: injected -r build failure" >&2',
      '        exit 1',
      '      fi ;;',
      '  esac',
      'fi',
      'exit 0',
    ].join('\n'),
  );
  const pnpmLog = join(base, 'pnpm.log');
  const buildFails = join(base, 'build-fails');
  writeFileSync(buildFails, '0');
  return { base, work, shims, pnpmLog, buildFails };
}

function sh(cwd: string, script: string, env: Record<string, string> = {}): { status: number; stdout: string; stderr: string } {
  const res = spawnSync('bash', ['-c', script], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: res.status ?? -1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

function runDeploy(
  sandbox: ReturnType<typeof makeSandbox>,
  injectedBuildFailures: number,
): ShimResult {
  writeFileSync(sandbox.buildFails, String(injectedBuildFailures));
  const res = sh(
    sandbox.work,
    'PATH="$PWD/../shims:$PATH" bash infra/deploy.sh',
    { TROUT_PNPM_LOG: sandbox.pnpmLog, TROUT_BUILD_FAILS: sandbox.buildFails },
  );
  const log = existsSync(sandbox.pnpmLog) ? readFileSync(sandbox.pnpmLog, 'utf8').split('\n').filter((l) => l !== '') : [];
  return { status: res.status, stdout: res.stdout + res.stderr, log };
}

describe('deploy.sh rollback pipeline (F23)', () => {
  let sandbox: ReturnType<typeof makeSandbox>;

  beforeEach(() => {
    sandbox = makeSandbox();
  });

  afterEach(() => {
    rmSync(sandbox.base, { recursive: true, force: true, maxRetries: 3 });
  });

  it('reinstalls from the restored lockfile BEFORE the rollback rebuild', { timeout: 120_000 }, () => {
    const out = runDeploy(sandbox, 1);
    expect(out.status).not.toBe(0); // the deploy itself failed
    expect(out.stdout).toContain('[deploy] ROLLBACK');

    // Sequence: install → -r build (fails) → install --frozen-lockfile (the
    // fix) → -r build. The old script never reinstalled: the rollback build
    // compiled the restored checkout against the FAILED deploy's node_modules.
    const failedBuild = out.log.indexOf('pnpm -r build');
    const reinstall = out.log.indexOf('pnpm install --frozen-lockfile', failedBuild + 1);
    const rollbackBuild = out.log.indexOf('pnpm -r build', failedBuild + 1);
    expect(failedBuild).toBeGreaterThanOrEqual(0);
    expect(reinstall).toBeGreaterThan(failedBuild);
    expect(rollbackBuild).toBeGreaterThan(reinstall);
  });

  it('rebuilds the last-good state through the real-data/SEO publication pipeline', { timeout: 120_000 }, () => {
    const out = runDeploy(sandbox, 1);

    // After the rollback rebuild, the same publication steps the ordinary
    // deploy runs must follow: web prerender over the restored snapshots and
    // a marketing build fed MARKETING_DATA_DIR (the audit found it unset —
    // marketing silently fell back to bundled fixture pages).
    const rollbackBuild = out.log.lastIndexOf('pnpm -r build');
    expect(rollbackBuild).toBeGreaterThan(0);
    const prerender = out.log.indexOf('pnpm --filter @trout/web prerender', rollbackBuild);
    const marketing = out.log.indexOf('pnpm --filter @trout/marketing build', rollbackBuild);
    expect(prerender).toBeGreaterThan(rollbackBuild);
    expect(marketing).toBeGreaterThan(prerender);

    const marketingEnv = out.log.find((l) => l.startsWith('marketing-env MARKETING_DATA_DIR='));
    expect(marketingEnv).toBeTruthy();
    expect(marketingEnv).toContain('apps/web/public');
    expect(marketingEnv).not.toContain('<UNSET>');

    // With every rollback step green, the success claim is honest.
    expect(out.stdout).toContain('[deploy] ROLLED BACK — last-good state is serving again');
  });

  it('does NOT announce rollback success when the rollback rebuild failed', { timeout: 120_000 }, () => {
    // Both builds fail; the stubbed verify (an old process answering health)
    // is green — exactly the audit's false-success scenario.
    const out = runDeploy(sandbox, 2);

    expect(out.status).not.toBe(0);
    const builds = out.log.filter((l) => l === 'pnpm -r build');
    expect(builds.length).toBe(2); // the new build AND the rollback rebuild both ran and failed
    expect(out.stdout).not.toContain('[deploy] ROLLED BACK');
    expect(out.stdout).toContain('[deploy] ROLLBACK INCOMPLETE');
    expect(out.stdout).toContain('rebuild of');
  });
});
