#!/usr/bin/env bash
# ROLE 1 — nightly SQLite backup (00-SHARED-CONTEXT §9 laptop hygiene; RUNBOOK §5).
# Keeps the last 14 backups in ./backups (gitignored). Schedule via Windows Task Scheduler.
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
DB="apps/api/data/trout.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB" ]; then
  echo "[backup] no database at $DB — nothing to do"
  exit 0
fi

# Prefer SQLite's online .backup (consistent copy even while the API writes with WAL).
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB" ".backup '$BACKUP_DIR/trout-$STAMP.db'"
else
  echo "[backup] sqlite3 CLI not found — falling back to a plain copy (slightly less safe)"
  cp "$DB" "$BACKUP_DIR/trout-$STAMP.db"
fi

# Retention: keep newest 14.
ls -1t "$BACKUP_DIR"/trout-*.db | tail -n +15 | xargs -r rm --

echo "[backup] wrote $BACKUP_DIR/trout-$STAMP.db"
