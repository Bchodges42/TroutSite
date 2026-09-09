#!/usr/bin/env bash
# ROLE 1 — restore the last-good generated snapshot trees from
# backups/snapshots-last-good.tar.gz (written by infra/archive-snapshots.sh).
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
ARCHIVE="$ROOT/backups/snapshots-last-good.tar.gz"
PUBLIC="$ROOT/apps/web/public"

if [ ! -f "$ARCHIVE" ]; then
  echo "[restore] no archive at backups/snapshots-last-good.tar.gz — nothing to restore."
  echo "[restore] create one with: bash infra/archive-snapshots.sh  (deploy.sh does this automatically)"
  exit 1
fi

stamp="$(date -u '+%Y%m%d-%H%M%S')"
stage="$PUBLIC/.restore-staging-$stamp"
mkdir -p "$stage"
if ! tar -xzf "$ARCHIVE" -C "$stage"; then
  echo "[restore] archive is unreadable — refusing to touch the live trees"
  rm -rf "$stage"
  exit 1
fi

restored=0
shopt -s nullglob
for src in "$stage"/*; do
  name="$(basename "$src")"
  target="$PUBLIC/$name"
  [ -e "$target" ] && mv -f "$target" "$PUBLIC/$name.bak-$stamp"
  mv -f "$src" "$target"
  restored=1
  echo "[restore] swapped in $name ($(find "$target" -type f | wc -l) files)"
done
rm -rf "$stage"
for bak in "$PUBLIC"/*.bak-"$stamp"; do
  [ -e "$bak" ] && rm -rf "$bak"
done

if [ "$restored" -ne 1 ]; then
  echo "[restore] archive contained no trees — nothing restored"
  exit 1
fi

echo "[restore] done — last-good trees are serving."
echo "[restore] verify with: bash infra/verify-site.sh   (a 'pm2 reload trout-api' is harmless but not required:"
echo "[restore] the API re-reads these files on every request.)"
