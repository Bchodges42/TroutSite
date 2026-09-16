import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const SCRIPT = join(REPO_ROOT, 'infra', 'alert-context.mjs');
const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('alert-context.mjs', () => {
  it('sends a bounded, redacted tail from the updater and WinSW logs', () => {
    const root = mkdtempSync(join(tmpdir(), 'trout-alert-context-'));
    dirs.push(root);
    const backups = join(root, 'backups');
    const serviceLogs = join(root, 'winsw-logs');
    mkdirSync(backups, { recursive: true });
    mkdirSync(serviceLogs, { recursive: true });
    const updateLog = join(backups, 'autoupdate.log');

    writeFileSync(
      updateLog,
      [
        'old update detail must not be included',
        ...Array.from({ length: 11 }, (_, index) => `deploy detail ${index + 1}`),
        'WATCHDOG_TOKEN=do-not-send-this',
        'Authorization: Basic do-not-send-this-either',
      ].join('\n'),
    );
    writeFileSync(
      join(serviceLogs, 'TroutSite.err.log'),
      [...Array.from({ length: 7 }, (_, index) => `old service detail ${index + 1}`), 'service failure one', 'service failure two'].join('\n'),
    );

    const result = spawnSync(process.execPath, [SCRIPT, root, updateLog], {
      encoding: 'utf8',
      env: {
        ...process.env,
        TROUT_WINDOWS_SERVICE: 'TroutSite',
        TROUT_SERVICE_LOG_DIR: serviceLogs,
        TROUT_ALERT_LOG_LINES: '3',
        TROUT_ALERT_SERVICE_LOG_LINES: '2',
      },
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Failure context (bounded; secrets redacted):');
    expect(result.stdout).toContain('deploy detail 11');
    expect(result.stdout).not.toContain('deploy detail 10');
    expect(result.stdout).not.toContain('old update detail');
    expect(result.stdout).toContain('Service log');
    expect(result.stdout).toContain('service failure one');
    expect(result.stdout).toContain('service failure two');
    expect(result.stdout).not.toContain('old service detail');
    expect(result.stdout).not.toContain('do-not-send-this');
    expect(result.stdout).toContain('[redacted]');
  });
});
