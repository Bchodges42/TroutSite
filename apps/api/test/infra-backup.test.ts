import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const INFRA = join(REPO_ROOT, 'infra');

/**
 * T1-12 regression: the old no-sqlite3 fallback `cp`-ed the main .db while the
 * connection was open, and the database runs in WAL mode — every commit still
 * sitting in the -wal file was silently missing from the "backup" (review
 * PASS7-2 verified a committed insert lost). The fallback is now a real online
 * backup via node + better-sqlite3 .backup(), and the script fails loudly when
 * no consistent path exists.
 */
describe('backup.sh WAL consistency (T1-12)', () => {
  let sandbox: string;
  // Held open across the backup run so the WAL-only row stays in the -wal
  // file (closing the connection would checkpoint it away).
  let keepOpen: Database.Database | null = null;

  beforeEach(() => {
    sandbox = join(tmpdir(), `trout-t112-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    cpSync(INFRA, join(sandbox, 'infra'), { recursive: true });
    mkdirSync(join(sandbox, 'apps', 'api'), { recursive: true });
    // The script resolves better-sqlite3 from apps/api/node_modules; the
    // sandbox reuses this package's installed copy.
    symlinkSync(join(REPO_ROOT, 'apps', 'api', 'node_modules'), join(sandbox, 'apps', 'api', 'node_modules'));
  });

  afterEach(() => {
    keepOpen?.close();
    keepOpen = null;
    rmSync(sandbox, { recursive: true, force: true });
  });

  /** WAL DB with one checkpointed row and one row that exists only in the -wal file. */
  function makeWalDb(): void {
    const dbPath = join(sandbox, 'apps', 'api', 'data', 'trout.db');
    mkdirSync(join(sandbox, 'apps', 'api', 'data'), { recursive: true });
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT)');
    db.prepare('INSERT INTO notes (body) VALUES (?)').run('checkpointed-row');
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.prepare('INSERT INTO notes (body) VALUES (?)').run('wal-only-row');
    keepOpen = db; // deliberate: the API holds its connection open in production too
  }

  function runBackup(): { status: number; stdout: string; stderr: string } {
    // NODE_PATH is vitest's worker env leaking in; production scheduled tasks
    // have no NODE_PATH, and the fail-loud case depends on the module being
    // unresolvable — so it is stripped here like it is absent on the host.
    const { NODE_PATH: _ignored, ...env } = process.env;
    const res = spawnSync('bash', [join(sandbox, 'infra', 'backup.sh')], {
      cwd: sandbox,
      encoding: 'utf8',
      env: { ...env, TROUT_BACKUP_NO_SQLITE3: '1' },
    });
    return { status: res.status ?? -1, stdout: res.stdout + '', stderr: res.stderr + '' };
  }

  function newestBackup(): string {
    const dir = join(sandbox, 'backups');
    const files = readdirSync(dir).filter((f) => f.startsWith('trout-') && f.endsWith('.db')).sort();
    expect(files.length).toBeGreaterThan(0);
    return join(dir, files[files.length - 1]!);
  }

  it('online backup includes the commit that lived only in the WAL', () => {
    makeWalDb();
    const out = runBackup();
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('better-sqlite3 online backup');

    const restored = new Database(newestBackup(), { readonly: true });
    const bodies = restored.prepare('SELECT body FROM notes ORDER BY id').all() as { body: string }[];
    restored.close();
    expect(bodies.map((r) => r.body)).toEqual(['checkpointed-row', 'wal-only-row']);
  });

  it('a plain main-file copy demonstrably LOSES the WAL-only commit (the old bug, for contrast)', () => {
    makeWalDb();
    const plain = join(sandbox, 'plain-copy.db');
    cpSync(join(sandbox, 'apps', 'api', 'data', 'trout.db'), plain);
    const copied = new Database(plain, { readonly: true });
    let bodies: { body: string }[] = [];
    try {
      bodies = copied.prepare('SELECT body FROM notes ORDER BY id').all() as { body: string }[];
    } catch {
      // A copied main file without its WAL can even fail to open its schema.
    }
    copied.close();
    expect(bodies.map((r) => r.body)).not.toContain('wal-only-row');
  });

  it('fails loudly instead of copying when the node backup is unavailable', () => {
    makeWalDb();
    // Remove the module resolution path so require('better-sqlite3') throws.
    rmSync(join(sandbox, 'apps', 'api', 'node_modules'));
    const out = runBackup();
    expect(out.status).not.toBe(0);
    expect(out.stderr).toContain('The database is NOT backed up');
    // No fake backup file may exist.
    const dir = join(sandbox, 'backups');
    const written = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith('trout-')) : [];
    expect(written).toEqual([]);
  });
});
