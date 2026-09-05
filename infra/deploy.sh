#!/usr/bin/env bash
# ROLE 1 — one-shot deploy (00-SHARED-CONTEXT §9):
# git pull → pnpm install → build all → (re)generate snapshots → pm2 reload.
# See infra/RUNBOOK.md §3 for usage and first-run notes.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[deploy] git pull"
git pull --ff-only

echo "[deploy] pnpm install"
pnpm install --frozen-lockfile

echo "[deploy] build all packages"
pnpm -r build

echo "[deploy] validate content pack"
pnpm validate:content

echo "[deploy] seed catalog into the API database (idempotent upsert)"
# The streams/shops tables must match the shipped content pack before
# snapshots are built — a stale DB regenerates stale snapshots (the live
# 'Catalog unavailable' incident of 2026-09-05). Seeding is an upsert:
# portal data is never touched.
pnpm --filter api seed

echo "[deploy] regenerate snapshots"
# ROLE 3 owns the real snapshot builder: v1/** (from the DB) + content/**
# (from the built content pack). If this is skipped or fails, /v1/streams
# answers 503 and the app shows 'Catalog unavailable'.
if grep -q '"snapshots"' apps/api/package.json; then
  pnpm --filter api snapshots
else
  echo "[deploy] snapshot script not present in apps/api yet (ROLE 3) — skipping"
fi

echo "[deploy] rebuild marketing from real snapshot JSON (§12 #3)"
if [ -f apps/web/public/v1/streams.json ]; then
  MARKETING_DATA_DIR="$(pwd)/apps/web/public" pnpm --filter @trout/marketing build
else
  echo "[deploy] no /v1 snapshots yet — marketing stays on bundled fixtures"
fi

echo "[deploy] pm2 reload (api + cron + portal/marketing static servers)"
if pm2 reload trout-api trout-cron trout-portal-static trout-marketing-static >/dev/null 2>&1; then
  pm2 reload trout-api trout-cron trout-portal-static trout-marketing-static
else
  echo "[deploy] processes not registered yet — starting from ecosystem config"
  pm2 start infra/pm2/ecosystem.config.cjs
fi
pm2 save

echo "[deploy] verify the live read path"
sleep 2
FAIL=0
for check in "healthz|200" "v1/streams|200" "v1/conditions/latest.json|200" "content/taxa.json|200"; do
  path="${check%%|*}"; want="${check##*|}"
  got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "http://127.0.0.1:8787/$path" || echo 000)"
  if [ "$got" != "$want" ]; then
    echo "[deploy] FAIL — /$path answered $got (expected $want)"
    FAIL=1
  else
    echo "[deploy] ok — /$path $got"
  fi
done
if [ "$FAIL" = "1" ]; then
  echo "[deploy] ENDPOINT CHECK FAILED — the site would show 'Catalog unavailable'."
  echo "[deploy] usual cause: seed/snapshots did not run (see steps above)."
  exit 1
fi

echo "[deploy] done — all endpoints green."
