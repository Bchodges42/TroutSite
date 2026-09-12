#!/usr/bin/env bash
# ROLE 1 — nightly SQLite backup (00-SHARED-CONTEXT §9 laptop hygiene; RUNBOOK §5).
# Keeps the last 14 backups in ./backups (gitignored). Schedule via Windows Task Scheduler.
#
# T1-12: the database runs in WAL mode, so committed data can live in the
# -wal file. A plain file copy of just the main .db (the old no-sqlite3
# fallback) silently drops every commit that has not been checkpointed.
# Both supported paths below are consistent ONLINE backups; a plain copy is
# never taken, and the script fails loudly when neither tool is available.
# TROUT_BACKUP_NO_SQLITE3=1 skips the CLI branch (test seam to exercise the
# node fallback on hosts that have sqlite3).
set -euo pipefail
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
BACKUP_DIR="backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
DB="apps/api/data/trout.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB" ]; then
  echo "[backup] no database at $DB — nothing to do"
  exit 0
fi

DEST="$BACKUP_DIR/trout-$STAMP.db"

if command -v sqlite3 >/dev/null 2>&1 && [ "${TROUT_BACKUP_NO_SQLITE3:-}" != "1" ]; then
  sqlite3 "$DB" ".backup '$DEST'"
else
  # better-sqlite3 ships with the API package and runs SQLite's online backup
  # API — a consistent snapshot INCLUDING committed WAL data (the CLI is not
  # installed on the production host; node is).
  echo "[backup] sqlite3 CLI unavailable — using node + better-sqlite3 online backup"
  if ! (cd apps/api && node -e "
    const Database = require('better-sqlite3');
    const db = new Database(process.argv[1], { readonly: true });
    db.backup(process.argv[2])
      .then(() => { db.close(); })
      .catch((err) => { console.error('[backup] node backup failed:', err.message); process.exit(1); });
  " "$ROOT/$DB" "$ROOT/$DEST"); then
    echo "[backup] FAIL — no consistent backup path available (no sqlite3 CLI, node backup failed)." >&2
    echo "[backup] The database is NOT backed up. Install the sqlite3 CLI or fix better-sqlite3." >&2
    exit 1
  fi
fi

# Retention: keep newest 14.
ls -1t "$BACKUP_DIR"/trout-*.db | tail -n +15 | xargs -r rm --

echo "[backup] wrote $DEST"
