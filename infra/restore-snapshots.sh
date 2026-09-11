#!/usr/bin/env bash
# ROLE 1 — restore the last-good generated snapshot trees from
# backups/snapshots-last-good/ (written by infra/archive-snapshots.sh).
#
# This is the recovery for "Catalog unavailable" caused by missing/empty
# apps/web/public/{v1,content} trees: the API reads those files from disk on
# every request, so a swap-in heals /v1/streams, /v1/*.json, /content/* and
# turns /healthz ok:true again without touching the database or rebuilding.
#
# Usage:  bash infra/restore-snapshots.sh
# Env:    TROUT_ROOT  repo root override (tests); default: this repo
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="${TROUT_ROOT:-$(pwd)}"
ARCHIVE="$ROOT/backups/snapshots-last-good"
PUBLIC="$ROOT/apps/web/public"

if [ ! -d "$ARCHIVE" ]; then
  echo "[restore] no archive at backups/snapshots-last-good/ — nothing to restore."
  echo "[restore] create one with: bash infra/archive-snapshots.sh  (deploy.sh does this automatically)"
  exit 1
fi

node "$(dirname "$0")/snapshot-io.mjs" restore "$ARCHIVE" "$PUBLIC" || exit 1

echo "[restore] done — last-good trees are serving."
echo "[restore] verify with: bash infra/verify-site.sh (a service restart is harmless but not"
echo "[restore] required: the API re-reads these files on every request)."
