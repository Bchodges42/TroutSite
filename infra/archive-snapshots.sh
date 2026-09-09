#!/usr/bin/env bash
# ROLE 1 — snapshot the generated, gitignored trees (apps/web/public/{v1,content,data})
# into backups/snapshots-last-good.tar.gz so a failed deploy or a dead cron can always
# be rolled back to the last known-good read path (RUNBOOK §9).
#
# The API reads these files from disk on every request (apps/api/src/app.ts:
# /v1/streams does existsSync + readFileSync per call), so restoring this archive
# IS the recovery — no database surgery, no rebuild required.
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

total=0
for d in "${DIRS[@]}"; do
  n="$(find "$PUBLIC/$d" -type f 2>/dev/null | wc -l)"
  total=$((total + n))
done
if [ "$total" -eq 0 ]; then
  echo "[archive] refusing to archive — every generated tree is empty (that is the broken state, not the good one)"
  exit 1
fi

tmp="$BACKUPS/.snapshots-last-good.tar.gz.tmp"
tar -czf "$tmp" -C "$PUBLIC" "${DIRS[@]}" || { rm -f "$tmp"; echo "[archive] tar failed"; exit 1; }
mv -f "$tmp" "$BACKUPS/snapshots-last-good.tar.gz"
printf 'archived %s dirs=%s files=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "${DIRS[*]}" "$total" \
  > "$BACKUPS/snapshots-last-good.stamp"
echo "[archive] saved $total files (${DIRS[*]}) → backups/snapshots-last-good.tar.gz"
