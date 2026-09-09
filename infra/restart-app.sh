#!/usr/bin/env bash
# ROLE 1 — restart the serving processes in whatever way THIS host runs them.
# Order: pm2 (runbook setup) → Windows service via WinSW/sc (the actual server:
# headless Windows laptop, service name from TROUT_WINDOWS_SERVICE, default
# "TroutSite") → warn + skip (exit 3).
#
# Data-only changes never need a restart (the API reads snapshot files per
# request); this matters for code deploys that replace dist/server.js.
set -uo pipefail

# pm2 first (RUNBOOK §2.4 setup)
if command -v pm2 >/dev/null 2>&1 && pm2 ls 2>/dev/null | grep -qi "trout"; then
  echo "[restart] pm2 detected — reloading api/cron/static processes"
  pm2 reload trout-api trout-cron trout-portal-static trout-marketing-static || pm2 reload trout-api || true
  pm2 save >/dev/null 2>&1 || true
  exit 0
fi

# Windows service (WinSW-wrapped host). sc.exe/net.exe exist only on Windows.
svc="${TROUT_WINDOWS_SERVICE:-TroutSite}"
if command -v sc.exe >/dev/null 2>&1 && sc.exe query "$svc" >/dev/null 2>&1; then
  echo "[restart] Windows service '$svc' detected — restarting"
  net.exe stop "$svc" >/dev/null 2>&1
  if net.exe start "$svc" >/dev/null 2>&1; then
    echo "[restart] service '$svc' restarted"
    exit 0
  fi
  echo "[restart] FAILED to restart service '$svc'"
  exit 1
fi

echo "[restart] no pm2 trout processes and no Windows service '$svc' found — nothing restarted (exit 3)."
echo "[restart] data-only changes do not need one; restart the app manually for code changes."
exit 3
