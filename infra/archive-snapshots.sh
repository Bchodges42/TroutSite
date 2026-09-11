#!/usr/bin/env bash
# ROLE 1 — archive the generated, gitignored trees (apps/web/public/{v1,content,data})
# into backups/snapshots-last-good/ so a failed deploy or a dead data heartbeat can
# always be rolled back to the last known-good read path (RUNBOOK §9).
#
# The API reads these files from disk on every request (apps/api/src/app.ts:
# /v1/streams does existsSync + readFileSync per call), so restoring this archive
# IS the recovery — no database surgery, no rebuild required.
#
# Implementation is bash + node only: portable server shells lack coreutils
# (sleep/tar/find were the 2026-09-09 deployment failure).
#
# Usage:  bash infra/archive-snapshots.sh
# Env:    TROUT_ROOT  repo root override (tests); default: this repo
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="${TROUT_ROOT:-$(pwd)}"
PUBLIC="$ROOT/apps/web/public"
BACKUPS="$ROOT/backups"

mkdir -p "$BACKUPS"

DIRS=()
for d in v1 content data; do
  [ -d "$PUBLIC/$d" ] && DIRS+=("$d")
done
if [ "${#DIRS[@]}" -eq 0 ]; then
  echo "[archive] nothing to archive — $PUBLIC has no generated trees (v1/content/data)"
  exit 1
fi

node "$(dirname "$0")/snapshot-io.mjs" archive "$PUBLIC" "$BACKUPS/snapshots-last-good"
