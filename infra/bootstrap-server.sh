#!/usr/bin/env bash
# ROLE 1 — one-time server bootstrap (RUNBOOK §9): verifies the integration
# (self-heal branch + client fallback), ships one verified deploy that creates
# the first rollback archive, and installs the data watchdog cron.
#
# The zero-touch autoupdate is intentionally NOT installed here — it activates
# after the owner merges this branch into main on GitHub (final step, printed
# at the end).
#
# Prereq (from the checkout root):
#   git fetch origin && git checkout infra/host-selfheal && git merge --ff-only origin/infra/host-selfheal
# Then:
#   bash infra/bootstrap-server.sh
# Env: BOOTSTRAP_SKIP_DEPLOY=1 skips the deploy step (testing).
set -uo pipefail
cd "$(dirname "$0")/.."

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "infra/host-selfheal" ]; then
  echo "[bootstrap] run this on the infra/host-selfheal branch (you are on: $BRANCH)"
  echo "[bootstrap]   git fetch origin && git checkout infra/host-selfheal && git merge --ff-only origin/infra/host-selfheal"
  exit 1
fi

if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  echo "[bootstrap] REFUSED — tracked files are modified locally. Inspect before bootstrapping."
  exit 1
fi

echo "[bootstrap] 1/4 client fallback (fix/live-catalog) present in this branch?"
if git merge-base --is-ancestor origin/fix/live-catalog HEAD 2>/dev/null; then
  echo "[bootstrap]   yes — integration already merged"
else
  echo "[bootstrap]   fetching + merging origin/fix/live-catalog"
  git fetch origin --quiet || { echo "[bootstrap] fetch failed (network/credentials)"; exit 1; }
  git merge --no-ff origin/fix/live-catalog -m "integration: selfheal + client fallback" || {
    echo "[bootstrap] merge conflict — keep BOTH docs/SESSION1-HOST-RECOVERY.md notes, resolve, re-run"; exit 1; }
fi

echo "[bootstrap] 2/4 verified deploy (creates the first rollback archive)"
if [ "${BOOTSTRAP_SKIP_DEPLOY:-0}" = "1" ]; then
  echo "[bootstrap]   SKIP (BOOTSTRAP_SKIP_DEPLOY=1)"
else
  # deploy.sh needs a tracking ref for its opening 'git pull --ff-only'
  git fetch origin --quiet
  git branch --set-upstream-to=origin/infra/host-selfheal 2>/dev/null || true
  bash infra/deploy.sh || {
    echo "[bootstrap] deploy FAILED — deploy.sh already rolled the read path back to last-good."
    echo "[bootstrap] Fix the reported step, then re-run this script."
    exit 1
  }
fi

echo "[bootstrap] 3/4 rollback archive"
if [ -f backups/snapshots-last-good.tar.gz ]; then
  ls -la backups/snapshots-last-good.tar.gz
else
  echo "[bootstrap] WARN — no archive yet (the deploy step creates it; check its output)"
fi

echo "[bootstrap] 4/4 data watchdog cron (every 15 min, self-heals the read path)"
if command -v crontab >/dev/null 2>&1; then
  if crontab -l 2>/dev/null | grep -q "infra/watchdog.sh"; then
    echo "[bootstrap]   already installed"
  else
    (crontab -l 2>/dev/null; echo "*/15 * * * * cd $(pwd) && bash infra/watchdog.sh >> backups/cron.log 2>&1") | crontab -
    echo "[bootstrap]   installed"
  fi
else
  echo "[bootstrap]   no crontab here — install the line from RUNBOOK §9 manually"
fi

echo
echo "[bootstrap] DONE. Site is on the self-healing read path with the client fallback."
echo "[bootstrap] Remaining owner step (GitHub web, from anywhere):"
echo "[bootstrap]   merge infra/host-selfheal into main (it contains fix/live-catalog —"
echo "[bootstrap]   one PR ships both). After main is updated, on the server:"
echo "[bootstrap]     git checkout main && git pull && bash infra/deploy.sh"
echo "[bootstrap]     # then add the hourly autoupdate cron line from RUNBOOK §9"
echo "[bootstrap]   → from then on the site updates itself from main every hour."
