#!/usr/bin/env bash
# Produce a small, redacted diagnostic excerpt suitable for an ntfy/mobile body.
# See alert-context.mjs for the supported environment overrides.
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="${TROUT_ROOT:-$(pwd)}"
LOG="${1:-$ROOT/backups/autoupdate.log}"
exec node "$ROOT/infra/alert-context.mjs" "$ROOT" "$LOG"
