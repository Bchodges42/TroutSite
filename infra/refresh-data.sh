#!/usr/bin/env bash
# ROLE 1 — data heartbeat for hosts without a running trout-cron process.
# THE ROOT CAUSE of the 2026-09 outage was exactly this gap: nothing regenerated
# the snapshot trees after the cron process went quiet. Run this hourly from a
# schedule (install-schedules.sh registers it) so the feed stays fresh:
#   deploy-stamp guard → seed catalog → ingest fresh USGS gauge readings →
#   regenerate all snapshot JSON.
# Never touches portal data or the logbook; gauge-ingest failures are logged,
# not fatal. Skew and snapshot failures page the owner (alert.sh dedup).
#
# Skew guard (RUNBOOK §9): this script runs whatever code is on disk. If the
# checkout is not the last successfully deployed revision (backups/last-good-rev),
# running seed/snapshots here would rebuild the served trees from undeployed
# code against the deployed database — the 2026-09-06..16 code/data skew that
# errored hourly for ten days behind a green /healthz. Under skew the refresh
# is REFUSED and the owner paged: stale-but-honest data plus a loud alert
# beats silently regenerating on the wrong revision.
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
BACKUPS="$ROOT/backups"
mkdir -p "$BACKUPS"
LOG="$BACKUPS/refresh-data.log"
URL="${TROUT_API_URL:-http://127.0.0.1:8787}"

# Best-effort PATH for scheduled contexts (SYSTEM account lacks the user PATH)
export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files (x86)/nodejs:$HOME/AppData/Roaming/npm"
source "$ROOT/infra/runtime-env.sh"
trout_runtime_env "$ROOT"
source "$ROOT/infra/alert.sh"
trout_alert_init "$ROOT" "$BACKUPS/refresh-data.status" "$LOG"

log() { # tee is not guaranteed in portable shells — echo + append instead
  local line
  line="[refresh $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
  echo "$line"
  echo "$line" >> "$LOG"
}

if [ ! -f "$ROOT/apps/api/package.json" ]; then
  log "no apps/api here — nothing to refresh"
  exit 1
fi

# --- deploy-stamp guard: refuse to run new code against old/deployed data ----
# (capture the real exit code: inside `if ! cmd`, $? is the negated pipeline's)
stamp_rc=0
bash infra/deploy-stamp.sh check || stamp_rc=$?
if [ "$stamp_rc" != "0" ]; then
  if [ "$stamp_rc" = "24" ]; then
    skew="$(bash infra/deploy-stamp.sh show || true)"
    log "REFUSED — code/data skew: $skew. Hourly refresh skipped; run deploy.sh to deploy and verify the checkout."
    trout_set_status "REFUSED-SKEW"
    trout_maybe_push "REFUSED-SKEW" "Trout refresh skipped (code/data skew)" \
      "$(trout_alert_context "$skew — the checkout is ahead of the last verified deploy. Hourly refresh is refused so undeployed code cannot rebuild the served data. Fix: run 'bash infra/deploy.sh' on the host.")" "high"
    exit 24
  fi
  log "REFUSED — no verified deploy stamp ($(bash infra/deploy-stamp.sh show || true)); run deploy.sh once so a revision is verified."
  trout_set_status "REFUSED-NOSTAMP"
  trout_maybe_push "REFUSED-NOSTAMP" "Trout refresh skipped (no verified deploy)" \
    "$(trout_alert_context "No deploy stamp exists — no deploy has completed verification on this host, so the hourly refresh refuses to guess which code is safe to run. Fix: run 'bash infra/deploy.sh' on the host.")" "high"
  exit 24
fi
bash infra/deploy-stamp.sh show >> "$LOG" 2>&1 || true

log "runtime paths: db=$TROUT_DB_PATH snapshots=$TROUT_SNAPSHOTS_DIR"

# --- seed: the DB must match the shipped content pack before snapshots -------
# Deploy seeds too; repeating it here is cheap (idempotent upsert) and closes
# the last window where snapshots could be built from a stale catalog.
if pnpm --filter api seed >> "$LOG" 2>&1; then
  log "seed ok (catalog current with the content pack)"
else
  log "FAIL — seed errored (details above); snapshots NOT rebuilt from a stale catalog"
  trout_set_status "FAIL-SEED"
  trout_maybe_push "FAIL-SEED" "Trout hourly refresh failed at seed" \
    "$(trout_alert_context "Seed failed; the snapshot rebuild was skipped so stale catalog data cannot be published. Served data stays at the last-good state until this passes.")" "high"
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
  trout_set_status "FAIL-SNAPSHOTS"
  trout_maybe_push "FAIL-SNAPSHOTS" "Trout hourly snapshot rebuild failed" \
    "$(trout_alert_context "The hourly snapshot rebuild errored and was not published; the served data is the last-good state. This is the alert that was missing during the 2026-09-06..16 skew.")" "high"
  exit 1
fi

if bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
  log "verify ok — refreshing the last-good archive"
  bash infra/archive-snapshots.sh >> "$LOG" 2>&1 || log "WARN — archive refresh failed"
  trout_set_status "OK"
  exit 0
fi
log "verify FAILED after refresh — check $LOG; watchdog will attempt deeper heals"
trout_set_status "FAIL-VERIFY"
trout_maybe_push "FAIL-VERIFY" "Trout refresh failed read-path verify" \
  "$(trout_alert_context "The hourly refresh published data that fails read-path verification; the watchdog will attempt heals (regen → last-good archive).")" "high"
exit 1
