#!/usr/bin/env bash
# ROLE 1 — snapshot-sync fallback (RUNBOOK §8, 2026-09-08 incident).
# Pushes the laptop's fresh apps/web/public/{v1,content} trees to the host over
# SSH/SCP when the host's own pipeline (trout-cron + infra/deploy.sh, RUNBOOK §3)
# is untrusted. This is a FALLBACK: the real fix is the host's cron + deploy.
# The host serves the same apps/web/public tree the laptop builds (ADR 0005),
# so publishing laptop snapshots restores the read path without touching the
# host database (portal writes are unaffected; host cron keeps its data).
set -euo pipefail
cd "$(dirname "$0")/.."

# --- configuration (env, with flag equivalents for the main knobs) -----------
HOST="${TROUT_SYNC_HOST:-}"                       # user@host — REQUIRED (unset = today's state)
REMOTE_ROOT="${TROUT_SYNC_PATH:-/opt/trout}"      # remote repo root; public dir derived from it
PORT="${TROUT_SYNC_PORT:-22}"
IDENTITY="${TROUT_SYNC_IDENTITY:-}"               # ssh -i key
PUBLIC_URL="${TROUT_SYNC_PUBLIC_URL:-https://trout.tntechclimb.com}"
# Unset → default reload; set to empty string → same as --no-reload.
RELOAD_CMD="${TROUT_SYNC_RELOAD_CMD-pm2 reload trout-api --update-env}"
# Test seam: source public dir (defaults to the real generated tree).
SRC_PUBLIC="${TROUT_SYNC_SRC:-apps/web/public}"

DRY_RUN=0
PRUNE=0
DO_RELOAD=1
LOCAL_DIR=""

usage() {
  cat <<'EOF'
Usage: bash infra/sync-snapshots.sh [--dry-run] [--prune] [--no-reload] [--local <dir>]

Pushes the local apps/web/public/{v1,content} snapshot trees to the host's
apps/web/public (path derived from TROUT_SYNC_PATH, default /opt/trout).
See infra/RUNBOOK.md §8 (snapshot-sync fallback, 2026-09-08 incident).

Env:
  TROUT_SYNC_HOST        user@host              (required; unset is today's state)
  TROUT_SYNC_PATH        remote repo root       (default /opt/trout)
  TROUT_SYNC_PORT        ssh port               (default 22)
  TROUT_SYNC_IDENTITY    ssh -i identity file   (optional)
  TROUT_SYNC_PUBLIC_URL  verification base URL  (default https://trout.tntechclimb.com)
  TROUT_SYNC_RELOAD_CMD  post-sync remote cmd   (default: pm2 reload trout-api --update-env)
  TROUT_SYNC_SRC         source public dir      (default apps/web/public; test seam)

Flags:
  --dry-run       print the plan (files + bytes per tree, remote targets) and exit
  --prune         delete remote files not in the new set (rsync --delete; on the
                  scp path: drop the superseded <tree>.prev generation instead of keeping it)
  --no-reload     skip the post-sync remote reload command
  --local <dir>   dev/test seam: copy into <dir> instead of over SSH (no reload,
                  verification checks the local files)
  --host/--path/--port/--identity <v>   flag equivalents of the TROUT_SYNC_* vars
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --prune) PRUNE=1 ;;
    --no-reload) DO_RELOAD=0; RELOAD_CMD="" ;;
    --local)
      if [ "$#" -lt 2 ]; then echo "[sync] ERROR — --local needs a directory argument"; exit 2; fi
      LOCAL_DIR="$2"; shift ;;
    --host) HOST="${2:?--host needs a value}"; shift ;;
    --path) REMOTE_ROOT="${2:?--path needs a value}"; shift ;;
    --port) PORT="${2:?--port needs a value}"; shift ;;
    --identity) IDENTITY="${2:?--identity needs a value}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "[sync] ERROR — unknown flag: $1"; usage; exit 2 ;;
  esac
  shift
done

# ssh/scp option arrays (scp uses -P, ssh uses -p).
SSH_OPTS=(-p "$PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
SCP_OPTS=(-P "$PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
if [ -n "$IDENTITY" ]; then
  SSH_OPTS+=(-i "$IDENTITY")
  SCP_OPTS+=(-i "$IDENTITY")
fi

fail() { echo "[sync] ERROR — $*"; exit 2; }

# --- preflight ---------------------------------------------------------------
if [ -z "$LOCAL_DIR" ] && [ -z "$HOST" ]; then
  fail "TROUT_SYNC_HOST is not set. The laptop currently has no SSH path to the host (2026-09-08 incident): ask the owner for access, then run e.g.
  TROUT_SYNC_HOST=user@host bash infra/sync-snapshots.sh --dry-run
See infra/RUNBOOK.md §8."
fi

[ -d "$SRC_PUBLIC/v1" ] || fail "source tree $SRC_PUBLIC/v1 is missing — run the pipeline first (bash infra/deploy.sh, RUNBOOK §3)"
[ -d "$SRC_PUBLIC/content" ] || fail "source tree $SRC_PUBLIC/content is missing — run the pipeline first (bash infra/deploy.sh, RUNBOOK §3)"

# Per-tree size/counts (GNU find/du ship with Git Bash).
tree_files() { find "$1" -type f | wc -l; }
tree_bytes() { find "$1" -type f -printf '%s\n' | awk '{t+=$1} END {print t+0}'; }

# --- plan --------------------------------------------------------------------
# scp path: upload to <tree>.staging-<stamp>, then swap on the remote so a
# half-copy never serves. rsync path syncs in place (per-file atomic).
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
if [ -n "$LOCAL_DIR" ]; then
  TRANSPORT="local (test seam)"
  PUB="$LOCAL_DIR"
  RELOAD_LABEL="skipped (local mode)"
elif command -v rsync >/dev/null 2>&1; then
  TRANSPORT="rsync over ssh"
  PUB="$REMOTE_ROOT/apps/web/public"
  RELOAD_LABEL="$RELOAD_CMD"
else
  TRANSPORT="scp (staging dir + atomic rename)"
  PUB="$REMOTE_ROOT/apps/web/public"
  RELOAD_LABEL="$RELOAD_CMD"
fi

echo "[sync] plan — transport: $TRANSPORT"
if [ "$PRUNE" = 1 ]; then echo "[sync] plan — prune: yes"; else echo "[sync] plan — prune: no"; fi
echo "[sync] plan — reload: $RELOAD_LABEL"
for tree in v1 content; do
  echo "[sync] plan — $tree: $(tree_files "$SRC_PUBLIC/$tree") files, $(tree_bytes "$SRC_PUBLIC/$tree") bytes"
  echo "[sync]          $SRC_PUBLIC/$tree → $PUB/$tree"
done
echo "[sync] plan — verify after sync: $PUBLIC_URL/v1/conditions/latest.json + /content/taxa.json"

if [ "$DRY_RUN" = 1 ]; then
  echo "[sync] dry-run — nothing copied."
  exit 0
fi

# --- execute -----------------------------------------------------------------
remote_run() { ssh "${SSH_OPTS[@]}" "$HOST" "$1"; }

sync_tree() {
  tree="$1"
  src="$SRC_PUBLIC/$tree"
  dst="$PUB/$tree"
  if [ -n "$LOCAL_DIR" ]; then
    # Same staging + swap as the scp path, executed locally.
    mkdir -p "$PUB"
    rm -rf "$dst.staging-$STAMP"
    cp -R "$src" "$dst.staging-$STAMP"
    rm -rf "$dst.prev"
    if [ -e "$dst" ]; then mv "$dst" "$dst.prev"; fi
    mv "$dst.staging-$STAMP" "$dst"
    if [ "$PRUNE" = 1 ]; then rm -rf "$dst.prev"; fi
    return
  fi
  remote_run "mkdir -p '$PUB'"
  if [ "$TRANSPORT" = "rsync over ssh" ]; then
    RSYNC_DEL=""
    if [ "$PRUNE" = 1 ]; then RSYNC_DEL="--delete"; fi
    rsync -rlpt $RSYNC_DEL -e "ssh ${SSH_OPTS[*]}" "$src/" "$HOST:$dst/"
  else
    remote_run "rm -rf '$dst.staging-$STAMP'"
    scp "${SCP_OPTS[@]}" -r "$src" "$HOST:$dst.staging-$STAMP"
    # Atomic swap: the live tree is replaced in one rename; the superseded
    # generation is kept as <tree>.prev (rollback: rm -rf <tree> && mv <tree>.prev <tree>)
    # unless --prune drops it. <tree>.prev from an earlier sync is our own
    # artifact and is rotated out here.
    remote_run "cd '$PUB' && rm -rf '$tree.prev' && { [ ! -e '$tree' ] || mv '$tree' '$tree.prev'; } && mv '$tree.staging-$STAMP' '$tree'"
    if [ "$PRUNE" = 1 ]; then remote_run "rm -rf '$dst.prev'"; fi
  fi
}

echo "[sync] syncing trees…"
sync_tree v1
sync_tree content
echo "[sync] trees copied."

# --- post-sync reload on the host --------------------------------------------
if [ "$DO_RELOAD" = 1 ] && [ -n "$RELOAD_CMD" ] && [ -z "$LOCAL_DIR" ]; then
  echo "[sync] reload: $RELOAD_CMD"
  remote_run "$RELOAD_CMD"
fi

# --- verify via the public URL (or the local target) --------------------------
# The check carries a cache-buster because Cloudflare caches snapshot JSON at
# the edge (RUNBOOK §4) — without it a sync can look stale when only the edge
# is. A stale fetchedAt that survives this check means a CF purge is needed.
FAIL=0
check_json() {
  rel="$1" label="$2"
  if [ -n "$LOCAL_DIR" ]; then
    file="$PUB/$rel"
    if [ ! -s "$file" ]; then
      echo "[sync] FAIL — $label: $file missing/empty after sync"; FAIL=1; return
    fi
    echo "[sync] ok — $label: local file present ($(wc -c <"$file") bytes)"
  else
    busted="$PUBLIC_URL/$rel?synccheck=$STAMP"
    code="$(curl -s -o /tmp/trout-sync-check.$$ -w '%{http_code}' --max-time 20 "$busted" || true)"
    body="$(cat /tmp/trout-sync-check.$$ 2>/dev/null || true)"
    rm -f /tmp/trout-sync-check.$$
    if [ "$code" != "200" ]; then
      echo "[sync] FAIL — $label: HTTP $code (expected 200) from $busted"; FAIL=1; return
    fi
    fetched="$(printf '%s' "$body" | grep -o '"fetchedAt":"[^"]*"' | head -1 | cut -d'"' -f4 || true)"
    if [ -n "$fetched" ]; then
      age_min=""
      if epoch_src="$(date -u -d "$fetched" +%s 2>/dev/null)"; then
        age_min=$(( ($(date -u +%s) - epoch_src) / 60 ))
      fi
      echo "[sync] ok — $label: HTTP 200, fetchedAt=$fetched (age ${age_min:-?} min)"
      if [ -n "$age_min" ] && [ "$age_min" -gt 180 ]; then
        echo "[sync] WARN — $label is ${age_min} min old; if the laptop tree is fresher, purge the CF cache for this URL (RUNBOOK §4/§8)"
      fi
    elif [ "$label" = "content/taxa.json" ]; then
      echo "[sync] ok — $label: HTTP 200 ($(printf '%s' "$body" | wc -c) bytes)"
    else
      echo "[sync] FAIL — $label: HTTP 200 but no fetchedAt found (body: $(printf '%s' "$body" | head -c 120))"; FAIL=1
    fi
  fi
}
check_json "v1/conditions/latest.json" "v1/conditions/latest.json"
check_json "content/taxa.json" "content/taxa.json"

# --- summary ------------------------------------------------------------------
echo "[sync] ----------------------------------------------------------"
echo "[sync] summary"
echo "[sync]   transport : $TRANSPORT"
echo "[sync]   target    : $PUB (v1 + content)"
if [ "$PRUNE" = 1 ]; then
  echo "[sync]   prune     : remote extras removed"
else
  echo "[sync]   prune     : off — remote extras untouched (rsync) / kept as <tree>.prev (scp)"
fi
echo "[sync]   reload    : $RELOAD_LABEL"
if [ "$FAIL" = 0 ]; then echo "[sync]   verify    : PASS"; else echo "[sync]   verify    : FAIL"; fi
echo "[sync]   rollback  : on the host — rm -rf <tree> && mv <tree>.prev <tree> (scp path)"
echo "[sync]   NOTE      : sync is a FALLBACK (RUNBOOK §8). The real fix is the"
echo "[sync]               host's trout-cron + bash infra/deploy.sh (RUNBOOK §3);"
echo "[sync]               the next healthy host cron overwrites this data."
if [ "$FAIL" = 1 ]; then
  echo "[sync] VERIFICATION FAILED — the host may still be serving the broken state."
  exit 1
fi
echo "[sync] done."
