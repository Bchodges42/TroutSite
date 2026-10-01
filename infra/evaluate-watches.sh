#!/usr/bin/env bash
# Visitor watch job for the canonical WinSW/schtasks host. Does not ingest data
# or rebuild snapshots. Disabled VAPID is a no-op; corrections retention still runs.
set -euo pipefail
cd "$(dirname "$0")/.."
WATCH_ROOT="$(pwd)"
export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files (x86)/nodejs:$HOME/AppData/Roaming/npm"
source "$WATCH_ROOT/infra/runtime-env.sh"
trout_runtime_env "$WATCH_ROOT"
# Never evaluate undeployed code against the production DB.
bash infra/deploy-stamp.sh check
pnpm --filter api ingest --job=watchlists
