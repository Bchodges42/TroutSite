#!/usr/bin/env bash
# ROLE 1 — register (or remove) the self-heal schedules. Idempotent; safe to re-run.
#
#   bash infra/install-schedules.sh            # install for this host
#   bash infra/install-schedules.sh --dry-run  # print what would be registered
#   bash infra/install-schedules.sh --remove   # unregister all three
#
#   trout-watchdog      every 15 min  verify + heal the read path
#   trout-refresh-data  hourly        gauges + NWS pressure ingest + snapshot
#                                     regeneration (replaces the dead trout-cron
#                                     heartbeat)
#   trout-refresh-feeds daily 06:00   stocking + evidence ingestion (F05) —
#                                     re-enters refresh-data.sh with
#                                     TROUT_REFRESH_FEEDS=1 under the same
#                                     deploy-stamp guard (dev pm2 cron parity)
#   trout-autoupdate    hourly        deploy when the tracked branch moves on origin
#   trout-db-backup     daily 03:30   consistent online SQLite backup (T1-12)
#
# Windows: schtasks (runs as SYSTEM so it survives logoff; if pnpm/node are not on
# the SYSTEM PATH the scripts still work — verification is a single node process and
# the scripts add common node locations themselves; nothing needs curl).
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
source "$POSIX_PATH/infra/runtime-env.sh"
trout_runtime_env "$POSIX_PATH"
SCHEDULE_ENV="TROUT_API_URL=\"$API_URL\" TROUT_DB_PATH=\"$TROUT_DB_PATH\" TROUT_SNAPSHOTS_DIR=\"$TROUT_SNAPSHOTS_DIR\" TROUT_CONTENT_DIR=\"$TROUT_CONTENT_DIR\" TROUT_RAW_DIR=\"$TROUT_RAW_DIR\""
WINDOWS_POWERSHELL="${TROUT_WINDOWS_POWERSHELL:-C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe}"
# F1 (2026-09-16 infra audit): the autoupdate task must run the VERSIONED
# in-repo wrapper (infra/update-trout.ps1), not an out-of-repo Tools script no
# guard or alert can reach — the unversioned copy went silently dead for ten
# days. Override only if a host genuinely needs a different entrypoint.
WINDOWS_UPDATE_SCRIPT="${TROUT_WINDOWS_UPDATE_SCRIPT:-$(cygpath -w "$POSIX_PATH/infra/update-trout.ps1")}"

jobs=(
  "trout-watchdog|*/15 or MINUTE/MO 15|bash infra/watchdog.sh"
  "trout-refresh-data|hourly|bash infra/refresh-data.sh"
  "trout-refresh-feeds|daily 06:00|TROUT_REFRESH_FEEDS=1 bash infra/refresh-data.sh"
  "trout-evaluate-watches|every 15 min|bash infra/evaluate-watches.sh"
  "trout-autoupdate|hourly|bash infra/autoupdate.sh"
  "trout-db-backup|daily 03:30|bash infra/backup.sh"
)

if [ "$IS_WIN" = "1" ]; then
  if [ -n "${TROUT_BASH_EXE:-}" ]; then
    bash_exe="$TROUT_BASH_EXE"
  elif command -v cygpath >/dev/null 2>&1; then
    bash_exe="$(cygpath -w "$(command -v bash)")"
  elif [ -f /c/ProgramData/TroutSite/Tools/bash.exe ]; then
    bash_exe='C:\ProgramData\TroutSite\Tools\bash.exe'
  else
    bash_exe="$(command -v bash)"
  fi
  # MSYS otherwise rewrites schtasks switches such as /Create as POSIX paths.
  export MSYS_NO_PATHCONV=1
fi

run_job() { # name command
  local name="$1" cmd="$2"
  if [ "$IS_WIN" = "1" ]; then
    case "$name" in
      trout-watchdog)      schtasks /Create /F /SC MINUTE /MO 15 /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && $SCHEDULE_ENV $cmd >> \"$LOGREL\" 2>&1'" ;;
      trout-evaluate-watches) schtasks /Create /F /SC MINUTE /MO 15 /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && $SCHEDULE_ENV $cmd >> \"$LOGREL\" 2>&1'" ;;
      trout-refresh-data)  schtasks /Create /F /SC HOURLY /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && $SCHEDULE_ENV $cmd >> \"$LOGREL\" 2>&1'" ;;
      trout-refresh-feeds) schtasks /Create /F /SC DAILY /ST 06:00 /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && $SCHEDULE_ENV $cmd >> \"$LOGREL\" 2>&1'" ;;
      trout-autoupdate)    schtasks /Create /F /SC HOURLY /RU SYSTEM /TN "$name" /TR "\"$WINDOWS_POWERSHELL\" -NoProfile -ExecutionPolicy Bypass -File \"$WINDOWS_UPDATE_SCRIPT\"" ;;
      trout-db-backup)     schtasks /Create /F /SC DAILY /ST 03:30 /RU SYSTEM /TN "$name" /TR "\"$bash_exe\" -lc 'cd \"$POSIX_PATH\" && $SCHEDULE_ENV $cmd >> \"$LOGREL\" 2>&1'" ;;
    esac
  else
    local spec="0 * * * *"
    [ "$name" = "trout-watchdog" ] && spec="*/15 * * * *"
    [ "$name" = "trout-evaluate-watches" ] && spec="*/15 * * * *"
    [ "$name" = "trout-refresh-feeds" ] && spec="0 6 * * *"
    [ "$name" = "trout-db-backup" ] && spec="30 3 * * *"
    (crontab -l 2>/dev/null | grep -v "$name"; echo "$spec cd $POSIX_PATH && $SCHEDULE_ENV $cmd >> $LOGREL 2>&1") | crontab -
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
  name="${j%%|*}"; cmd="${j##*|}"
  if run_job "$name" "$cmd"; then
    echo "[schedules] installed: $name"
  else
    echo "[schedules] FAILED to install: $name (see above)"
  fi
done
echo "[schedules] note — tasks run as SYSTEM on Windows; the scripts self-provide common node"
echo "[schedules] PATHs, but if pnpm is user-scoped, verify once: schtasks /Run /TN trout-watchdog"
echo "[schedules] and check $LOGREL. If the API is not on :8787, set TROUT_API_URL."
