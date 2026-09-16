#!/usr/bin/env bash
# ROLE 1 — hourly self-heal for the live read path (RUNBOOK §9).
#
# Why this exists: the 2026-09-08 incident (and its recurrence) was cron going
# quiet and the generated /v1 + /content trees disappearing, with nobody
# noticing for days. healthz KNEW (ok:false) — nothing read it. This script is
# the reader: verify → heal → report, so a dead pipeline degrades to
# "last-good data" instead of an empty catalog.
#
#   bash infra/watchdog.sh             # verify + heal (intended for Task Scheduler, hourly)
#   bash infra/watchdog.sh --dry-run   # verify + report only, take no action
#
# Heal order (data freshness first):
#   1. regenerate snapshots from the DB   (pnpm --filter api snapshots)
#   2. restore the last-good archive      (infra/restore-snapshots.sh)
# Never touches trout.db, never deploys code, never touches git.
#
# State is written where the owner already looks: backups/watchdog.log and
# backups/watchdog.status (OK | HEALED-REGEN | HEALED-RESTORE | BROKEN + UTC
# time). Exit 0 healthy/healed, 1 still broken, 2 dry-run found breakage.
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="${TROUT_ROOT:-$(pwd)}"
BACKUPS="$ROOT/backups"
URL="${TROUT_API_URL:-http://127.0.0.1:8787}"
DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

mkdir -p "$BACKUPS"
LOG="$BACKUPS/watchdog.log"
STATUS="$BACKUPS/watchdog.status"

# Best-effort PATH for scheduled contexts (SYSTEM account lacks the user PATH)
export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files (x86)/nodejs:$HOME/AppData/Roaming/npm"
source "$ROOT/infra/runtime-env.sh"
trout_runtime_env "$ROOT"

log() { # tee is not guaranteed in portable shells — echo + append instead
  local line
  line="[watchdog $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
  echo "$line"
  echo "$line" >> "$LOG"
}
set_status() { printf '%s %s\n' "$1" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$STATUS"; }

# Push the owner's phone on STATUS TRANSITIONS only (entering BROKEN, entering a
# HEALED state, recovering to OK) — a stalled outage stays silent instead of
# buzzing every 15 minutes. A first-ever high-priority BROKEN state still pages.
maybe_push() { # new_status title message priority
  local new="$1" title="$2" msg="$3" prio="${4:-default}" old=""
  [ -f "$STATUS" ] && IFS= read -r old _ < "$STATUS"
  old="${old%% *}"
  if { [ -n "$old" ] && [ "$old" != "$new" ]; } \
    || { [ -z "$old" ] && [ "$prio" = "high" ]; }; then
    if bash infra/push-notify.sh "$title" "$msg" "$prio" >> "$LOG" 2>&1; then
      log "push sent: $title"
    else
      log "WARN — push notification failed (unconfigured or undeliverable)"
    fi
  fi
}

failure_message() { # one-line human summary
  local summary="$1" context=""
  context="$(bash infra/alert-context.sh "$LOG" 2>/dev/null || true)"
  [ -n "$context" ] || context="Failure context could not be collected; inspect $LOG on the host."
  printf '%s\n\n%s' "$summary" "$context"
}

if bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
  log "OK — read path green on $URL"
  maybe_push "OK" "Trout server recovered" "The read path is green again (watchdog verify passed)." "default"
  set_status "OK"
  # Refresh the rollback point while everything is healthy (cheap; keeps
  # last-good within an hour of the freshest trees even between deploys).
  if [ "$DRY_RUN" = "0" ]; then
    bash infra/archive-snapshots.sh >> "$LOG" 2>&1 || log "WARN — could not refresh last-good archive"
  fi
  exit 0
fi

log "BROKEN — read path failed on $URL. Details: $LOG (tail follows)"
# no tail/sed in portable shells — read the last lines with bash only
if [ -f "$LOG" ]; then
  lines=()
  while IFS= read -r l; do lines+=("$l"); done < "$LOG"
  n=${#lines[@]}
  start=$((n > 6 ? n - 6 : 0))
  for ((i = start; i < n; i++)); do echo "    ${lines[$i]}" >> "$LOG"; done
fi
if [ "$DRY_RUN" = "1" ]; then
  log "DRY-RUN — no heal attempted (would: regen snapshots → restore last-good)"
  set_status "BROKEN-DRYRUN"
  exit 2
fi

# Heal 1 — regenerate from the DB (fresh data; needs the DB + gauge egress).
if [ -f "$ROOT/apps/api/package.json" ] && grep -q '"snapshots"' "$ROOT/apps/api/package.json"; then
  log "heal 1/2: regenerating snapshots from the DB"
  if (cd "$ROOT" && pnpm --filter api snapshots >> "$LOG" 2>&1); then
    if bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
      log "HEALED — snapshot regeneration restored the read path"
      maybe_push "HEALED-REGEN" "Trout server healed" "The read path is back after regenerating snapshots (fresh data)." "default"
      set_status "HEALED-REGEN"
      bash infra/archive-snapshots.sh >> "$LOG" 2>&1 || true
      exit 0
    fi
  else
    log "snapshot regeneration failed (details above) — trying the archive"
  fi
else
  log "no snapshots script in apps/api — skipping regen, trying the archive"
fi

# Heal 2 — roll back to the last-known-good trees (stale but honest data).
log "heal 2/2: restoring last-good snapshots"
if bash infra/restore-snapshots.sh >> "$LOG" 2>&1 \
  && bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
  log "HEALED — last-good archive restored the read path (data may be stale; that is reported honestly by the app)"
  maybe_push "HEALED-RESTORE" "Trout server healed (last-good data)" "The read path is back on the last-good archive. Data may be stale until refresh succeeds." "default"
  set_status "HEALED-RESTORE"
  exit 0
fi

log "STILL BROKEN — both heals failed. Manual recovery: RUNBOOK §4 (reboot recovery) + §9; "
log "if trees AND archive are gone, re-run 'bash infra/deploy.sh' on the host."
maybe_push "BROKEN" "Trout server DOWN (read path)" \
  "$(failure_message "The watchdog could not heal the read path; visitors may be affected. Manual recovery is needed.")" "high"
set_status "BROKEN"
exit 1
