#!/usr/bin/env bash
# ROLE 1 — one-shot deploy (00-SHARED-CONTEXT §9):
# git pull → pnpm install → build all → (re)generate snapshots → pm2 reload.
# See infra/RUNBOOK.md §3 for usage and first-run notes.
set -euo pipefail
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
source "$ROOT/infra/runtime-env.sh"
trout_runtime_env "$ROOT"

# Load ignored deploy-time configuration before any build runs (e.g.
# VITE_CF_ANALYTICS_TOKEN). Secrets stay in the host's .env, never in Git.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# T0-2: nothing below may mutate the checkout or the served trees until the
# rollback point exists. The FIRST mutation is the git pull; from there on,
# ANY uncaught failure (set -e) runs rollback() via the EXIT trap: restore the
# archived snapshot trees, reset the checkout to where this deploy started,
# rebuild + restart so the service isn't running half-new artifacts, verify.
START_REV="$(git rev-parse HEAD)"
MUTATED=0
HAD_ROLLBACK=0
BACKUPS="$ROOT/backups"
LASTGOOD_REV_FILE="$BACKUPS/last-good-rev"
VERIFY_URL="${TROUT_VERIFY_URL:-http://127.0.0.1:8787}"
mkdir -p "$BACKUPS"

rollback() {
  # Called from the EXIT trap (MUTATED=1) or the failed final verification —
  # both mean: new state was staged but never proven. Best-effort by design:
  # every step is guarded so the trap itself can never fail its way out.
  echo "[deploy] ROLLBACK — returning the served state to the pre-deploy point ($START_REV)"
  if [ "$HAD_ROLLBACK" = "1" ]; then
    bash infra/restore-snapshots.sh || echo "[deploy] WARN — snapshot restore failed; generated trees left as-is"
  else
    echo "[deploy] no pre-deploy rollback point existed; generated trees left as-is"
  fi
  if git reset --hard "$START_REV" >/dev/null 2>&1; then
    echo "[deploy] checkout back at $START_REV"
  else
    echo "[deploy] WARN — git reset to $START_REV failed; inspect the checkout manually"
  fi
  pnpm -r build >/dev/null 2>&1 || echo "[deploy] WARN — rebuild of $START_REV failed; dist may not match the checkout"
  bash infra/restart-app.sh || true
  if bash infra/verify-site.sh --url "$VERIFY_URL" --wait 30 --deep >/dev/null 2>&1; then
    echo "[deploy] ROLLED BACK — last-good state is serving again (checkout at $START_REV)."
    echo "[deploy] Fix the failing step above, then re-run this deploy."
  else
    echo "[deploy] rollback did not fully heal the read path — run:"
    echo "[deploy]   bash infra/verify-site.sh   (details) and see RUNBOOK §4/§9."
  fi
}

trap 'rc=$?; if [ "$rc" != "0" ] && [ "$MUTATED" = "1" ]; then rollback; fi' EXIT

echo "[deploy] archive the currently-served snapshots BEFORE any mutation (rollback point, RUNBOOK §9)"
# Everything after this line can rewrite the checkout and the generated trees;
# the archive is what a failed deploy rolls back to. Cheap, and the only copy
# of the gitignored data this machine is currently serving.
if bash infra/archive-snapshots.sh; then
  HAD_ROLLBACK=1
else
  echo "[deploy] WARN — no rollback point could be created; continuing WITHOUT a safety net"
fi

echo "[deploy] git pull (first mutation — the EXIT trap owns everything from here)"
MUTATED=1
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

echo "[deploy] ingest live gauge observations"
# C1 (2026-09-06 incident): deploy used to go straight seed → snapshots, so a
# fresh DB published a feed with zero observations and the builder's stale
# stamp (fetchedAt == nextExpectedUpdate) — every water read Unassessed. The
# gauges job runs here so the published feed carries real readings. A failure
# is not fatal by itself (last-known readings are preserved), but a deploy
# that would publish catalog-wide zero coverage is rejected below.
if grep -q '"ingest"' apps/api/package.json; then
  if ! pnpm --filter api ingest --job=gauges; then
    echo "[deploy] WARN — gauge ingestion failed; publishing last-known data (stale flag will be set)"
  fi
else
  echo "[deploy] ingest script not present in apps/api yet — skipping"
fi

echo "[deploy] regenerate snapshots"
# ROLE 3 owns the real snapshot builder: v1/** (from the DB) + content/**
# (from the built content pack). If this is skipped or fails, /v1/streams
# answers 503 and the app shows 'Catalog unavailable'.
if grep -q '"snapshots"' apps/api/package.json; then
  pnpm --filter api snapshots
else
  echo "[deploy] snapshot script not present in apps/api yet (ROLE 3) — skipping"
fi

echo "[deploy] prerender per-route SEO pages + sitemap.xml (reads the snapshots above)"
if [ -f apps/web/public/v1/streams.json ] || [ -f apps/web/public/v1/streams ]; then
  pnpm --filter @trout/web prerender
else
  echo "[deploy] WARN — no /v1 snapshots yet; skipping prerender (deep links serve the SPA shell)"
fi

echo "[deploy] rebuild marketing from real snapshot JSON (§12 #3)"
if [ -f apps/web/public/v1/streams.json ]; then
  MARKETING_DATA_DIR="$(pwd)/apps/web/public" pnpm --filter @trout/marketing build
else
  echo "[deploy] no /v1 snapshots yet — marketing stays on bundled fixtures"
fi

echo "[deploy] restart serving processes (host-specific: pm2 or Windows service)"
# Host-agnostic: pm2 reload on the runbook setup, WinSW service restart on the
# Windows server (restart-app.sh). Data-only changes need no restart at all —
# the API reads the snapshot files per request.
restart_rc=0
bash infra/restart-app.sh || restart_rc=$?
if [ "$restart_rc" = "3" ]; then
  echo "[deploy] WARN — no process manager detected; serving processes NOT restarted."
  echo "[deploy] Snapshot data is picked up per-request, but a CODE change needs a"
  echo "[deploy] manual service restart (or set TROUT_WINDOWS_SERVICE)."
elif [ "$restart_rc" != "0" ]; then
  echo "[deploy] WARN — restart reported failure (rc=$restart_rc); verification below decides."
fi

echo "[deploy] verify the live read path (retries up to 30 s; node-only, no sleep/tar needed)"
FAIL=0
bash infra/verify-site.sh --url "$VERIFY_URL" --wait 30 --deep || FAIL=1

if [ "$FAIL" = "1" ]; then
  echo "[deploy] DEPLOY CHECK FAILED — the live site would mislead anglers."
  echo "[deploy] usual cause: seed/snapshots did not run (see steps above)."
  # The DB is NOT reverted (seed/ingest are idempotent upserts); the served
  # trees AND the checkout go back, so visitors keep the previous good catalog
  # and code while the failure is fixed. rollback() is the same routine the
  # EXIT trap uses; MUTATED=0 keeps the trap from running it a second time.
  MUTATED=0
  rollback
  exit 1
fi

echo "[deploy] refresh the rollback archive from the now-verified state"
# The pre-deploy archive step is a no-op on a host whose trees were already
# missing (the 2026-09-09 first bootstrap had nothing to archive); this is what
# actually creates the rollback point for the NEXT deploy.
bash infra/archive-snapshots.sh || echo "[deploy] WARN — could not refresh the archive"

# T0-2: autoupdate.sh compares HEAD against this file to tell "deployed and
# verified" from "pull happened but the deploy failed" — the retry signal.
git rev-parse HEAD > "$LASTGOOD_REV_FILE"

MUTATED=0
echo "[deploy] done — all endpoints green."
