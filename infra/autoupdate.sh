#!/usr/bin/env bash
# ROLE 1 — zero-touch update poller: when origin/<branch> moves, run deploy.sh.
# Intended for a cron/systemd schedule on the server (RUNBOOK §9). Safe at any
# cadence: when nothing changed this is one fetch + two rev-parses.
#
#   bash infra/autoupdate.sh                 # check + deploy on change
#   bash infra/autoupdate.sh --dry-run       # report what would happen, no deploy
#
# Env: TROUT_ROOT (repo root, tests), TROUT_DEPLOY_BRANCH (default main),
#      TROUT_DEPLOY_CMD (default 'bash infra/deploy.sh'; override for tests).
# Refuses to auto-deploy over a dirty working tree — the server's checkout must
# stay pristine; local edits are an owner problem, not a cron decision.
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="${TROUT_ROOT:-$(pwd)}"
# Track whatever branch the checkout is on (upstream = origin/<branch>): this
# makes the poller correct both before the owner merges to main (deploys the
# integration branch) and after finalize switches the server to main.
BRANCH="${TROUT_DEPLOY_BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
DEPLOY_CMD="${TROUT_DEPLOY_CMD:-bash infra/deploy.sh}"
DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

BACKUPS="$ROOT/backups"
mkdir -p "$BACKUPS"
LOG="$BACKUPS/autoupdate.log"
STATUS="$BACKUPS/autoupdate.status"

# Best-effort PATH for scheduled contexts (SYSTEM account lacks the user PATH)
export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files (x86)/nodejs:$HOME/AppData/Roaming/npm"

log() { # tee is not guaranteed in portable shells — echo + append instead
  local line
  line="[autoupdate $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
  echo "$line"
  echo "$line" >> "$LOG"
}
set_status() { printf '%s %s\n' "$1" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$STATUS"; }

cd "$ROOT" || { log "FAIL — repo root $ROOT missing"; set_status "FAIL"; exit 1; }

# Push the owner's phone on transitions into states that need a human (deploy
# failed, checkout dirty). The FIRST high-priority failure also pages: otherwise
# a host with no prior status can fail its first automatic update silently.
# Success/up-to-date never buzzes; repeated failures in the same state don't
# repeat the push (status-transition dedup).
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

# A phone alert has to be useful without exposing secrets or asking the owner
# to remote into a headless machine. The collector bounds and redacts the
# current updater tail plus the WinSW service state/log tail when available.
failure_message() { # one-line human summary
  local summary="$1" context=""
  context="$(bash infra/alert-context.sh "$LOG" 2>/dev/null || true)"
  [ -n "$context" ] || context="Failure context could not be collected; inspect $LOG on the host."
  printf '%s\n\n%s' "$summary" "$context"
}

# Fetch ALL refs: 'fetch origin <branch>' updates only FETCH_HEAD, not the
# origin/<branch> tracking ref this script compares against.
if ! git fetch origin --quiet; then
  log "FAIL — could not fetch origin/$BRANCH (network/credentials); leaving site as-is"
  maybe_push "FAIL-FETCH" "Trout auto-update cannot fetch" \
    "$(failure_message "Automatic updates cannot fetch origin/$BRANCH; the served revision was left unchanged.")" "high"
  set_status "FAIL-FETCH"
  exit 1
fi

local_rev="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
remote_rev="$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo unknown)"

# T0-2: HEAD == origin only means "up to date" if the deploy of that revision
# also PASSED verification (deploy.sh writes backups/last-good-rev on its
# green exit). A failed deploy leaves HEAD at the new revision with no
# last-good entry — treating that as UP-TO-DATE suppressed every retry, so
# the server sat on a broken/rolled-back state until origin moved again.
last_good_rev=""
if [ -f "$BACKUPS/last-good-rev" ]; then
  IFS= read -r last_good_rev _ < "$BACKUPS/last-good-rev" || true
  last_good_rev="${last_good_rev%% *}"
fi

if [ "$local_rev" = "$remote_rev" ] && [ "$last_good_rev" = "$local_rev" ]; then
  set_status "UP-TO-DATE"
  exit 0
fi

if [ "$local_rev" = "$remote_rev" ]; then
  log "HEAD == origin/$BRANCH but last verified-good rev is '${last_good_rev:-none}' — a previous deploy failed; retrying"
fi

# Only local modifications to TRACKED files can break 'git pull' — untracked
# files (logs, notes, local data) must not block a deploy.
if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  log "REFUSED — tracked files modified locally; auto-deploy only runs on a clean checkout. Owner must inspect $ROOT."
  maybe_push "REFUSED-DIRTY" "Trout auto-update refused" \
    "$(failure_message "The checkout has locally modified tracked files — auto-deploy is blocked until they are inspected.")" "high"
  set_status "REFUSED-DIRTY"
  exit 1
fi

log "origin/$BRANCH moved ${local_rev:0:9}..${remote_rev:0:9} — deploying$([ "$DRY_RUN" = "1" ] && echo ' (dry-run: no action)') [cmd: $DEPLOY_CMD]"
if [ "$DRY_RUN" = "1" ]; then
  set_status "PENDING-DRYRUN"
  exit 2
fi

if $DEPLOY_CMD >> "$LOG" 2>&1; then
  log "DEPLOYED — now at $(git rev-parse --short=9 HEAD)"
  set_status "DEPLOYED"
  exit 0
fi

log "DEPLOY FAILED — deploy.sh already attempted its own rollback; site is on the last-good read path. Inspect $LOG."
maybe_push "FAIL-DEPLOY" "Trout auto-deploy failed" \
  "$(failure_message "Automatic deploy to ${remote_rev:0:9} failed; rollback to the last-good read path was attempted.")" "high"
set_status "FAIL-DEPLOY"
exit 1
