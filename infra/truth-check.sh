#!/usr/bin/env bash
# ROLE 1 — daily data truth check (audit 2026-10-14 guardrail). Compares the
# PUBLISHED snapshot files with USGS / TVA / TWRA right now and pages the owner
# when the site disagrees with a source, lags it, or cannot read its rows.
# Read-only (no DB writes, no snapshot writes). refresh-data.sh calls it once a
# day after a verified refresh; it can also be run by hand on any host:
#   bash infra/truth-check.sh
# Exit: 0 agree · 1 findings (paged on transition) · 3 a source unreachable.
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
BACKUPS="$ROOT/backups"
mkdir -p "$BACKUPS"
LOG="$BACKUPS/truth-check.log"

export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files (x86)/nodejs:$HOME/AppData/Roaming/npm"
source "$ROOT/infra/runtime-env.sh"
trout_runtime_env "$ROOT"
source "$ROOT/infra/alert.sh"
trout_alert_init "$ROOT" "$BACKUPS/truth-check.status" "$LOG"

out="$(pnpm --filter api truth-check 2>&1)"
rc=$?
printf '%s\n' "$out" >> "$LOG"

if [ "$rc" = "0" ]; then
  trout_maybe_push "OK" "Trout data matches its sources again" "The daily truth check found the published data in agreement with USGS, TVA and TWRA." "default"
  trout_set_status "OK"
  exit 0
fi
if [ "$rc" = "1" ]; then
  summary="$(printf '%s\n' "$out" | grep -E '^\[truth-check\] (MISMATCH|STALE|UNPARSED)' | head -5)"
  trout_maybe_push "MISMATCH" "Trout data disagrees with its sources" \
    "$(trout_alert_context "The daily truth check found published data that differs from, lags, or cannot read the upstream source:
$summary")" "high"
  trout_set_status "MISMATCH"
  exit 1
fi
# Unreachable sources are recorded but do not page: the hourly jobs and
# /healthz degraded already report failing fetches.
trout_set_status "UNREACHABLE"
exit "$rc"
