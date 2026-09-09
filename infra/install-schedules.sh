#!/usr/bin/env bash
# ROLE 1 — register (or remove) the self-heal schedules. Idempotent; safe to re-run.
#
#   bash infra/install-schedules.sh            # install for this host
#   bash infra/install-schedules.sh --dry-run  # print what would be registered
#   bash infra/install-schedules.sh --remove   # unregister all three
#
#   trout-watchdog      every 15 min  verify + heal the read path
#   trout-refresh-data  hourly        gauges ingest + snapshot regeneration
#                                     (replaces the dead trout-cron heartbeat)
#   trout-autoupdate    hourly        deploy when the tracked branch moves on origin
#
# Windows: schtasks (runs as SYSTEM so it survives logoff; if pnpm/node are not on
# the SYSTEM PATH the heal scripts still work — verify/restore need only bash+curl,
# and the scripts add common node locations themselves).
# Linux: crontab lines.
set -uo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-install}"
POSIX_PATH="$(pwd)"
LOGREL="backups/cron.log"
IS_WIN=0
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) IS_WIN=1 ;; esac

# TROUT_API_URL can be injected per-task if the API does not listen on :8787.
API_URL="${TROUT_API_URL:-http://127.0.0.1:8787}"

jobs=(
  "trout-watchdog|*/15 or MINUTE/MO 15|bash infra/watchdog.sh"
  "trout-refresh-data|hourly|bash infra/refresh-data.sh"
  "trout-autoupdate|hourly|bash infra/autoupdate.sh"
)

if [ "$IS_WIN" = "1" ]; then
  bash_exe="$(cygpath -w "$(command -v bash)" 2>/dev/null || echo bash)"
fi

run_job() { # name command
  local name="$1" cmd="$2"
  if [ "$IS_WIN" = "1" ]; then
    case "$name" in
      trout-watchdog)     schtasks /Create /F /SC MINUTE /MO 15 /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && TROUT_API_URL=$API_URL $cmd >> $LOGREL 2>&1'" ;;
      trout-refresh-data) schtasks /Create /F /SC HOURLY /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && TROUT_API_URL=$API_URL $cmd >> $LOGREL 2>&1'" ;;
      trout-autoupdate)   schtasks /Create /F /SC HOURLY /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && TROUT_API_URL=$API_URL $cmd >> $LOGREL 2>&1'" ;;
    esac
  else
    local spec="0 * * * *"
    [ "$name" = "trout-watchdog" ] && spec="*/15 * * * *"
    (crontab -l 2>/dev/null | grep -v "$name"; echo "$spec cd $POSIX_PATH && TROUT_API_URL=$API_URL $cmd >> $LOGREL 2>&1") | crontab -
  fi
}

case "$MODE" in
  --dry-run)
    echo "[schedules] DRY RUN on path: $POSIX_PATH"
    for j in "${jobs[@]}"; do
      name="${j%%|*}"; echo "  would register: $name ($(echo "$j" | cut -d'|' -f2)) — ${j#*|}"
    done
    [ "$IS_WIN" = "1" ] && echo "  mechanism: schtasks (SYSTEM)" || echo "  mechanism: crontab"
    exit 0 ;;
  --remove)
    for j in "${jobs[@]}"; do
      name="${j%%|*}"
      if [ "$IS_WIN" = "1" ]; then schtasks /Delete /F /TN "$name" >/dev/null 2>&1 && echo "removed $name" || echo "$name not present"
      else (crontab -l 2>/dev/null | grep -v "$name") | crontab - && echo "removed $name"; fi
    done
    exit 0 ;;
  install) ;;
  *) echo "usage: install-schedules.sh [--dry-run|--remove]"; exit 2 ;;
esac

for j in "${jobs[@]}"; do
  name="${j%%|*}"; cmd="${j#*|}"
  if run_job "$name" "$cmd"; then
    echo "[schedules] installed: $name"
  else
    echo "[schedules] FAILED to install: $name (see above)"
  fi
done
echo "[schedules] note — tasks run as SYSTEM on Windows; the scripts self-provide common node"
echo "[schedules] PATHs, but if pnpm is user-scoped, verify once: schtasks /Run /TN trout-watchdog"
echo "[schedules] and check $LOGREL. If the API is not on :8787, set TROUT_API_URL."
