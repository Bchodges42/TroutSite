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
#
# F6 (2026-09-16 infra audit): this used to hardcode apps/api/data/trout.db and
# ignore the injected TROUT_DB_PATH — on the host the durable DB lives at
# C:\ProgramData\TroutSite\Data\trout.db (runtime-env.sh), so the nightly task
# backed up the wrong file or exited 0 "nothing to do" on a missing checkout DB,
# silently. The path now resolves through runtime-env.sh, retention is node-only
# (the portable Bash lacks tail/xargs), and failures page via alert.sh dedup.
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
BACKUP_DIR="backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$ROOT/backups/backup.log"

# Best-effort PATH for scheduled contexts (SYSTEM account lacks the user PATH)
export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files (x86)/nodejs:$HOME/AppData/Roaming/npm"
source "$ROOT/infra/runtime-env.sh"
trout_runtime_env "$ROOT"
source "$ROOT/infra/alert.sh"
mkdir -p "$BACKUP_DIR"
trout_alert_init "$ROOT" "$BACKUP_DIR/backup.status" "$LOG"

log() { # tee is not guaranteed in portable shells — echo + append instead
  local line
  line="[backup $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
  echo "$line"
  echo "$line" >> "$LOG"
}

DB_PATH="$TROUT_DB_PATH"

if [ ! -f "$DB_PATH" ]; then
  log "FAIL — database not found at $DB_PATH (TROUT_DB_PATH); nothing backed up"
  echo "[backup] The database is NOT backed up. Fix TROUT_DB_PATH (runtime-env.sh)." >&2
  trout_set_status "FAIL-NODB"
  trout_maybe_push "FAIL-NODB" "Trout DB backup could not find the database" \
    "$(trout_alert_context "The nightly backup refused to guess: no database at the resolved TROUT_DB_PATH ($DB_PATH). Check runtime-env.sh paths on the host.")" "high"
  exit 1
fi

DEST="$BACKUP_DIR/trout-$STAMP.db"

if command -v sqlite3 >/dev/null 2>&1 && [ "${TROUT_BACKUP_NO_SQLITE3:-}" != "1" ]; then
  if ! sqlite3 "$DB_PATH" ".backup '$DEST'"; then
    log "FAIL — sqlite3 CLI online backup failed; the database is NOT backed up"
    trout_set_status "FAIL-BACKUP"
    trout_maybe_push "FAIL-BACKUP" "Trout DB backup failed" \
      "$(trout_alert_context "The sqlite3 CLI online backup errored — the database is NOT backed up tonight.")" "high"
    exit 1
  fi
else
  # better-sqlite3 ships with the API package and runs SQLite's online backup
  # API — a consistent snapshot INCLUDING committed WAL data (the CLI is not
  # installed on the production host; node is).
  log "sqlite3 CLI unavailable — using node + better-sqlite3 online backup"
  if ! (cd apps/api && node -e "
    const Database = require('better-sqlite3');
    const db = new Database(process.argv[1], { readonly: true });
    db.backup(process.argv[2])
      .then(() => { db.close(); })
      .catch((err) => { console.error('[backup] node backup failed:', err.message); process.exit(1); });
  " "$DB_PATH" "$ROOT/$DEST"); then
    log "FAIL — no consistent backup path available (no sqlite3 CLI, node backup failed). The database is NOT backed up."
    echo "[backup] The database is NOT backed up. Install the sqlite3 CLI or fix better-sqlite3." >&2
    trout_set_status "FAIL-BACKUP"
    trout_maybe_push "FAIL-BACKUP" "Trout DB backup failed" \
      "$(trout_alert_context "Neither sqlite3 CLI nor the better-sqlite3 online backup produced a copy — the database is NOT backed up tonight.")" "high"
    exit 1
  fi
fi

# Retention: keep newest 14. Node-only — the server's portable Bash has no
# tail/xargs (2026-09-09 deployment failure).
node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const [dir, keepArg] = process.argv.slice(1);
  const keep = parseInt(keepArg, 10) || 14;
  const files = fs.readdirSync(dir)
    .filter((f) => /^trout-\d{8}-\d{6}\.db$/.test(f))
    .sort()
    .reverse();
  for (const f of files.slice(keep)) {
    try { fs.unlinkSync(path.join(dir, f)); } catch { /* best effort */ }
  }
' "$ROOT/$BACKUP_DIR" 14 || log "WARN — retention pass failed (old backups kept)"

log "wrote $DEST from $DB_PATH"
trout_set_status "OK"
