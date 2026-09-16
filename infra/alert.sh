#!/usr/bin/env bash
# ROLE 1 — shared alerting for the scheduled scripts (autoupdate, watchdog,
# refresh-data, backup). Every script keeps a "<STATUS> <utc-iso>" status file;
# pushes go to the owner's phone on STATUS TRANSITIONS only, so a stalled
# outage stays silent instead of buzzing every 15 minutes, while a first-ever
# high-priority failure still pages. Consolidated here so the dedup rule and
# the context-collection shape cannot drift between scripts. Portable bash
# only: no tar/find/sleep/tee (server's portable Bash lacks them).
#
#   source "$ROOT/infra/alert.sh"
#   trout_alert_init "$ROOT" "backups/foo.status" "backups/foo.log"
#   trout_set_status "OK"
#   trout_maybe_push "BROKEN" "title" "$(trout_alert_context "summary")" "high"
#
# Callers must cd to the repo root first (the helpers invoke infra/ scripts
# relative to it).

TROUT_ALERT_STATUS=""
TROUT_ALERT_LOG=""

trout_alert_init() { # repo_root status_file log_file
  TROUT_ALERT_STATUS="$2"
  TROUT_ALERT_LOG="$3"
}

trout_set_status() {
  printf '%s %s\n' "$1" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$TROUT_ALERT_STATUS"
}

trout_maybe_push() { # new_status title message [priority]
  local new="$1" title="$2" msg="$3" prio="${4:-default}" old=""
  if [ -f "$TROUT_ALERT_STATUS" ]; then
    IFS= read -r old _ < "$TROUT_ALERT_STATUS" || true
    old="${old%% *}"
  fi
  if { [ -n "$old" ] && [ "$old" != "$new" ]; } \
    || { [ -z "$old" ] && [ "$prio" = "high" ]; }; then
    if bash infra/push-notify.sh "$title" "$msg" "$prio" >> "$TROUT_ALERT_LOG" 2>&1; then
      echo "[alert] push sent: $title" >> "$TROUT_ALERT_LOG"
    else
      echo "[alert] WARN — push notification failed (unconfigured or undeliverable)" >> "$TROUT_ALERT_LOG"
    fi
  fi
}

trout_alert_context() { # one-line human summary → summary + redacted log tail
  local summary="$1" context=""
  context="$(bash infra/alert-context.sh "$TROUT_ALERT_LOG" 2>/dev/null || true)"
  [ -n "$context" ] || context="Failure context could not be collected; inspect $TROUT_ALERT_LOG on the host."
  printf '%s\n\n%s' "$summary" "$context"
}
