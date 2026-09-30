import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const INFRA = join(REPO_ROOT, 'infra');
const SNAPSHOT_IO = join(INFRA, 'snapshot-io.mjs');

/**
 * F24 regression (2026-09-29 senior code audit): fs.rename cannot replace an
 * EXISTING directory on Windows, so archive/restore promotion used to be
 * delete-then-rename. The audit's fault-injected final rename (EPERM) made the
 * last-good archive and the live v1 tree DISAPPEAR while the staged copies
 * survived under paths nothing reads. Promotion is now retain-until-promoted:
 * rename the old generation aside → rename the new one in → only then delete
 * the aside, with failure paths that undo.
 *
 * The fault is injected through the TROUT_FAULT_RENAME seam (a substring of the
 * renamed file's source path; the first match throws a synthetic EPERM and the
 * seam is consumed so the undo paths run real code) — the audit's copied-script
 * method, without patching the script under test. It is the same pattern as
 * backup.sh's TROUT_BACKUP_NO_SQLITE3 test seam.
 */

function makeSandbox(): string {
  const root = mkdtempSync(join(tmpdir(), 'trout-f24-'));
  mkdirSync(join(root, 'apps', 'web', 'public', 'v1'), { recursive: true });
  mkdirSync(join(root, 'apps', 'web', 'public', 'content'), { recursive: true });
  return root;
}

function writeTree(base: string, gen: string): void {
  writeFileSync(join(base, 'v1', 'streams.json'), JSON.stringify({ gen }));
  writeFileSync(join(base, 'content', 'taxa.json'), JSON.stringify({ gen }));
}

function readTree(base: string, rel: string): string {
  return JSON.parse(readFileSync(join(base, rel), 'utf8')).gen;
}

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function runSnapshotIo(args: string[], env: Record<string, string> = {}): RunResult {
  const res = spawnSync(process.execPath, [SNAPSHOT_IO, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: res.status ?? -1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

function siblings(dir: string, suffix: string): string[] {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.includes(suffix)) : [];
}

describe('snapshot-io archive promotion (F24)', () => {
  let root: string;
  let publicDir: string;
  let dst: string;
  let backups: string;

  beforeEach(() => {
    root = makeSandbox();
    publicDir = join(root, 'apps', 'web', 'public');
    backups = join(root, 'backups');
    dst = join(backups, 'snapshots-last-good');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  });

  it('success replaces the previous generation and deletes the old one only afterwards', () => {
    writeTree(publicDir, 'A');
    expect(runSnapshotIo(['archive', publicDir, dst]).status).toBe(0);
    writeTree(publicDir, 'B');
    const out = runSnapshotIo(['archive', publicDir, dst]);
    expect(out.status).toBe(0);

    expect(readTree(dst, join('v1', 'streams.json'))).toBe('B');
    expect(readFileSync(dst + '.stamp', 'utf8')).toContain('files=2');
    // The old generation must not linger beside the archive after success.
    expect(siblings(backups, '.prev-')).toEqual([]);
    expect(siblings(backups, '.tmp')).toEqual([]);
  });

  it('a failed final rename (EPERM) keeps the last-good archive in place', () => {
    writeTree(publicDir, 'A');
    expect(runSnapshotIo(['archive', publicDir, dst]).status).toBe(0);
    writeTree(publicDir, 'B');

    // Fault the staged-copy → archive rename (its source path ends in .tmp).
    const out = runSnapshotIo(['archive', publicDir, dst], { TROUT_FAULT_RENAME: '.tmp' });
    expect(out.status).not.toBe(0);

    // The old behaviour deleted dst BEFORE renaming: the last-good archive
    // vanished while the staged copy survived unreferenced. Now the archive
    // must still hold generation A, described by its stamp.
    expect(readTree(dst, join('v1', 'streams.json'))).toBe('A');
    expect(readTree(dst, join('content', 'taxa.json'))).toBe('A');
    expect(readFileSync(dst + '.stamp', 'utf8')).toContain('files=2');
    // No unreferenced half-generation left behind either.
    expect(siblings(backups, '.tmp')).toEqual([]);
    expect(siblings(backups, '.prev-')).toEqual([]);
  });
});

describe('snapshot-io restore promotion (F24)', () => {
  let root: string;
  let publicDir: string;
  let archive: string;

  beforeEach(() => {
    root = makeSandbox();
    publicDir = join(root, 'apps', 'web', 'public');
    archive = join(root, 'archive');
    mkdirSync(join(archive, 'v1'), { recursive: true });
    mkdirSync(join(archive, 'content'), { recursive: true });
    writeTree(archive, 'B');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  });

  it('success swaps the live trees in and cleans up the old generation', () => {
    writeTree(publicDir, 'A');
    const out = runSnapshotIo(['restore', archive, publicDir]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('restored v1');
    expect(readTree(publicDir, join('v1', 'streams.json'))).toBe('B');
    expect(readTree(publicDir, join('content', 'taxa.json'))).toBe('B');
    expect(siblings(publicDir, '.restore-')).toEqual([]);
    expect(siblings(publicDir, '.prev-')).toEqual([]);
  });

  it('a failed final rename (EPERM) keeps the live tree serving', () => {
    writeTree(publicDir, 'A');

    // Fault the first tree's staging → target rename (source contains
    // .restore-): the old code had already deleted the live v1 tree at that
    // point — the audit watched it disappear.
    const out = runSnapshotIo(['restore', archive, publicDir], { TROUT_FAULT_RENAME: '.restore-' });
    expect(out.status).not.toBe(0);

    expect(readTree(publicDir, join('v1', 'streams.json'))).toBe('A');
    expect(readTree(publicDir, join('content', 'taxa.json'))).toBe('A');
    expect(siblings(publicDir, '.restore-')).toEqual([]);
    expect(siblings(publicDir, '.prev-')).toEqual([]);
  });

  it('a failure on a later tree undoes the trees swapped before it', () => {
    writeTree(publicDir, 'A');

    // Fault ONLY the content tree's swap (v1 swaps first and must be undone).
    const out = runSnapshotIo(['restore', archive, publicDir], {
      TROUT_FAULT_RENAME: 'content.restore-',
    });
    expect(out.status).not.toBe(0);

    // The read path must never end up half-restored: both trees stay on A.
    expect(readTree(publicDir, join('v1', 'streams.json'))).toBe('A');
    expect(readTree(publicDir, join('content', 'taxa.json'))).toBe('A');
    expect(siblings(publicDir, '.prev-')).toEqual([]);
  });

  it('a first-time restore with no live tree yet still promotes by rename', () => {
    // Fresh bootstrap: no generated trees to move aside — plain rename in.
    const out = runSnapshotIo(['restore', archive, publicDir]);
    expect(out.status).toBe(0);
    expect(readTree(publicDir, join('v1', 'streams.json'))).toBe('B');
  });
});

describe('snapshot-io shell entrypoints stay compatible (F24 callers)', () => {
  let root: string;

  beforeEach(() => {
    root = makeSandbox();
    // A full infra copy keeps every mutation inside the sandbox and the
    // scripts' `cd "$(dirname "$0")/.."` inside it (infra-deploy.test.ts
    // pattern); TROUT_ROOT points the entrypoint at the sandbox root.
    cpSync(INFRA, join(root, 'infra'), { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  });

  function sh(script: string): RunResult {
    const res = spawnSync('bash', ['-c', script], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, TROUT_ROOT: root },
    });
    return { status: res.status ?? -1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
  }

  it('archive-snapshots.sh / restore-snapshots.sh round-trip through the new promotion', () => {
    const publicDir = join(root, 'apps', 'web', 'public');
    writeTree(publicDir, 'A');
    expect(sh('bash infra/archive-snapshots.sh').status).toBe(0);
    expect(existsSync(join(root, 'backups', 'snapshots-last-good', 'v1', 'streams.json'))).toBe(true);

    // The live tree breaks (the "Catalog unavailable" incident); restore heals.
    writeTree(publicDir, 'BROKEN');
    const restore = sh('bash infra/restore-snapshots.sh');
    expect(restore.status).toBe(0);
    expect(readTree(publicDir, join('v1', 'streams.json'))).toBe('A');
    expect(readTree(publicDir, join('content', 'taxa.json'))).toBe('A');
  });
});
