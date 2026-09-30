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
# Skew guard (RUNBOOK §9): heal 1 runs whatever code is on disk, and its
# success path ARCHIVES the result into the rollback point — a checkout that
# is ahead of the last verified deploy would both rebuild the served trees
# from undeployed code (the 2026-09-06..16 skew) and poison the last-good
# archive with that output. Under skew only heal 2 (restore the archived,
# verified trees) is allowed.
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
source "$ROOT/infra/alert.sh"
trout_alert_init "$ROOT" "$STATUS" "$LOG"

log() { # tee is not guaranteed in portable shells — echo + append instead
  local line
  line="[watchdog $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"
  echo "$line"
  echo "$line" >> "$LOG"
}

if bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
  # F47 (2026-09-29 audit): the old order pushed "recovered" BEFORE looking at
  # healthz, so a green read path over a failing pipeline announced recovery on
  # entry, and every later degraded check re-announced recovery (the status
  # file flipped to OK only in the dispatch's eyes) while the real DEGRADED
  # page was deduplicated away. Read health once, decide the final state, then
  # dispatch exactly one transition: recovery is announced only when the state
  # actually becomes OK.
  #
  # Truthful healthz (2026-09-16 skew retro): `ok` gates the read path;
  # `degraded` means a pipeline job is erroring or the hourly build went quiet
  # while visitors still see the last-good data. That is exactly the ten-day
  # blind spot this script exists to close — record DEGRADED and page once
  # (transition-deduped) instead of reporting OK while jobs rot.
  degraded="$(node -e '
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(new Error("timeout")), 15000);
    if (id && typeof id.unref === "function") id.unref();
    fetch(process.argv[1] + "/healthz", {
      signal: ctrl.signal,
      headers: process.env.WATCHDOG_TOKEN ? { "x-watchdog-token": process.env.WATCHDOG_TOKEN } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => console.log(j && j.degraded === true ? (j.degradedReasons || []).join("; ") : ""))
      .catch(() => console.log(""));
  ' "$URL" 2>/dev/null || true)"
  if [ -n "$degraded" ]; then
    log "DEGRADED — pipeline unhealthy behind a green read path: $degraded"
    trout_maybe_push "DEGRADED" "Trout pipeline degraded (read path still green)" \
      "$(trout_alert_context "Jobs are failing or stale while the site keeps serving last-good data: $degraded — inspect backups/refresh-data.log; a skew REFUSED line there means deploy.sh must run.")" "high"
    trout_set_status "DEGRADED"
  else
    log "OK — read path green on $URL"
    trout_maybe_push "OK" "Trout server recovered" "The read path is green again (watchdog verify passed)." "default"
    trout_set_status "OK"
  fi
  # Skew context (no push — refresh-data's guard pages about skew hourly): if
  # the checkout is ahead of the verified deploy, the read path is green only
  # because the SERVED trees are the deployed ones; say so for the next look.
  if ! bash infra/deploy-stamp.sh check; then
    log "WARN — $(bash infra/deploy-stamp.sh show || true): serving verified data but the checkout is undeployed code; deploys needed before hourly refresh resumes"
  fi
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
  trout_set_status "BROKEN-DRYRUN"
  exit 2
fi

# Skew guard: regenerating from the DB means running the on-disk code. Only
# trust it when that code IS the last verified deploy (deploy-stamp.sh check:
# 0 match, 24 skew, 1 no stamp — treat both non-zero as skew).
SKEW=0
if ! bash infra/deploy-stamp.sh check; then
  SKEW=1
  log "skew guard — $(bash infra/deploy-stamp.sh show || true): heal 1 (regen from on-disk code) DISABLED; trying the last-good archive only"
fi

# Heal 1 — regenerate from the DB (fresh data; needs the DB + gauge egress).
if [ "$SKEW" = "0" ] \
  && [ -f "$ROOT/apps/api/package.json" ] && grep -q '"snapshots"' "$ROOT/apps/api/package.json"; then
  log "heal 1/2: regenerating snapshots from the DB"
  if (cd "$ROOT" && pnpm --filter api snapshots >> "$LOG" 2>&1); then
    if bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
      log "HEALED — snapshot regeneration restored the read path"
      trout_maybe_push "HEALED-REGEN" "Trout server healed" "The read path is back after regenerating snapshots (fresh data)." "default"
      trout_set_status "HEALED-REGEN"
      bash infra/archive-snapshots.sh >> "$LOG" 2>&1 || true
      exit 0
    fi
  else
    log "snapshot regeneration failed (details above) — trying the archive"
  fi
else
  [ "$SKEW" = "1" ] || log "no snapshots script in apps/api — skipping regen, trying the archive"
fi

# Heal 2 — roll back to the last-known-good trees (stale but honest data).
log "heal 2/2: restoring last-good snapshots"
if bash infra/restore-snapshots.sh >> "$LOG" 2>&1 \
  && bash infra/verify-site.sh --url "$URL" >> "$LOG" 2>&1; then
  log "HEALED — last-good archive restored the read path (data may be stale; that is reported honestly by the app)"
  trout_maybe_push "HEALED-RESTORE" "Trout server healed (last-good data)" "The read path is back on the last-good archive. Data may be stale until refresh succeeds." "default"
  trout_set_status "HEALED-RESTORE"
  exit 0
fi

log "STILL BROKEN — both heals failed. Manual recovery: RUNBOOK §4 (reboot recovery) + §9; "
log "if trees AND archive are gone, re-run 'bash infra/deploy.sh' on the host."
trout_maybe_push "BROKEN" "Trout server DOWN (read path)" \
  "$(trout_alert_context "The watchdog could not heal the read path; visitors may be affected. Manual recovery is needed.")" "high"
trout_set_status "BROKEN"
exit 1
