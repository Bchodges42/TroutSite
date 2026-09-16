#!/usr/bin/env bash
# ROLE 1 — the deploy-stamp guard (RUNBOOK §9). deploy.sh records the revision
# it just verified in backups/last-good-rev ("<sha> <utc-iso>"), but ONLY after
# verify-site --deep passes. Anything that would run NEW code against the data
# on disk (refresh-data's snapshots, watchdog's regen heal) must first prove
# the checkout IS that revision. Without this check the hourly jobs can
# rebuild the served trees from code that was never deployed: the 2026-09-06
# .. 09-16 skew had the host running a stricter new contracts builder against
# an unseeded old DB — an hourly "hydroIdentity is required" error loop behind
# a green /healthz for ten days.
#
#   bash infra/deploy-stamp.sh check   # exit 0  checkout == last verified deploy
#                                      # exit 24  SKEW — checkout moved ahead
#                                      # exit 1   no stamp (nothing verified here yet)
#   bash infra/deploy-stamp.sh write   # deploy.sh only: stamp HEAD + UTC time
#   bash infra/deploy-stamp.sh show    # print both revs (log/alert context)
set -uo pipefail
cd "$(dirname "$0")/.."

STAMP="backups/last-good-rev"

head_rev="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
stamped_rev=""
if [ -f "$STAMP" ]; then
  # "<sha> <timestamp>" — the timestamp is advisory; every consumer parses the
  # leading sha only (autoupdate.sh reads the same file with the same rule).
  IFS= read -r stamped_rev _ < "$STAMP" || true
  stamped_rev="${stamped_rev%% *}"
fi

case "${1:-}" in
  write)
    mkdir -p backups
    printf '%s %s\n' "$head_rev" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$STAMP"
    echo "[stamp] recorded verified deploy $head_rev"
    ;;
  show)
    echo "[stamp] checkout=$head_rev stamped=${stamped_rev:-none}"
    ;;
  check)
    if [ "$head_rev" = "unknown" ]; then
      echo "[stamp] FAIL — not a git checkout; cannot prove which code is on disk"
      exit 1
    fi
    if [ -z "$stamped_rev" ]; then
      echo "[stamp] FAIL — no deploy stamp at $STAMP; no deploy has verified on this host yet (run deploy.sh first)"
      exit 1
    fi
    if [ "$head_rev" != "$stamped_rev" ]; then
      echo "[stamp] SKEW — checkout ${head_rev:0:9} != last verified deploy ${stamped_rev:0:9}"
      exit 24
    fi
    exit 0
    ;;
  *)
    echo "usage: bash infra/deploy-stamp.sh check|write|show" >&2
    exit 2
    ;;
esac
