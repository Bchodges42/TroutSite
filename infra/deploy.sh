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

echo "[deploy] regenerate snapshots"
# ROLE 3 owns the real snapshot builder. Guarded until its script exists in apps/api.
if grep -q '"snapshots"' apps/api/package.json; then
  pnpm --filter api snapshots
else
  echo "[deploy] snapshot script not present in apps/api yet (ROLE 3) — skipping"
fi

echo "[deploy] pm2 reload"
if pm2 reload trout-api trout-cron >/dev/null 2>&1; then
  pm2 reload trout-api trout-cron
else
  echo "[deploy] processes not registered yet — starting from ecosystem config"
  pm2 start infra/pm2/ecosystem.config.cjs
fi
pm2 save

echo "[deploy] done — verify with: curl -fsS http://127.0.0.1:8787/healthz"
