import Database from 'better-sqlite3';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Db = Database.Database;

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

/** migrations/ lives next to the compiled file's parent (src/ or dist/ → apps/api/migrations). */
export function migrationsDir(): string {
  return resolve(THIS_DIR, '../migrations');
}

interface AppliedMigration {
  name: string;
}

/** Apply pending migrations (filename order) inside transactions. Idempotent. */
export function applyMigrations(db: Db): void {
  db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, applied_at TEXT NOT NULL)',
  );
  const applied = new Set(
    (db.prepare('SELECT name FROM schema_migrations').all() as AppliedMigration[]).map((r) => r.name),
  );
  const files = readdirSync(migrationsDir())
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const insert = db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)');
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir(), file), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      insert.run(file, new Date().toISOString());
    })();
  }
}

/** Open (creating if needed) the SQLite database and ensure migrations are applied. */
export function openDb(dbPath: string): Db {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  applyMigrations(db);
  return db;
}
