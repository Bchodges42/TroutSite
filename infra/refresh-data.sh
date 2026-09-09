#!/usr/bin/env bash
# ROLE 1 — data heartbeat for hosts without a running trout-cron process.
# THE ROOT CAUSE of the 2026-09 outage was exactly this gap: nothing regenerated
# the snapshot trees after the cron process went quiet. Run this hourly from a
# schedule (install-schedules.sh registers it) so the feed stays fresh:
#   ingest fresh USGS gauge readings → regenerate all snapshot JSON.
# Never touches portal data or the logbook; failures are logged, not fatal.
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
BACKUPS="$ROOT/backups"
mkdir -p "$BACKUPS"
LOG="$BACKUPS/refresh-data.log"
URL="${TROUT_API_URL:-http://127.0.0.1:8787}"

# Best-effort PATH for scheduled contexts (SYSTEM account lacks the user PATH)
export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files (x86)/nodejs:$HOME/AppData/Roaming/npm"

log() { echo "[refresh $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$LOG"; }

if [ ! -f "$ROOT/apps/api/package.json" ]; then
  log "no apps/api here — nothing to refresh"
  exit 1
fi

if pnpm --filter api ingest --job=gauges >> "$LOG" 2>&1; then
  log "gauge ingestion ok"
else
  log "WARN — gauge ingestion failed (network/USGS?); regenerating from last-known readings"
fi

if pnpm --filter api snapshots >> "$LOG" 2>&1; then
  log "snapshots regenerated"
else
  log "FAIL — snapshot regeneration errored (details above)"
  exit 1
fi

if bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
  log "verify ok — refreshing the last-good archive"
  bash infra/archive-snapshots.sh >> "$LOG" 2>&1 || log "WARN — archive refresh failed"
  exit 0
fi
log "verify FAILED after refresh — check $LOG; watchdog will attempt deeper heals"
exit 1
