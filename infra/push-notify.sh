#!/usr/bin/env bash
# ROLE 1 — send a push notification to the owner's phone. Silent no-op when not
# configured, so every script can call it unconditionally.
#
# Config (first match wins):
#   1. TROUT_PUSH_URL environment variable
#   2. first line of backups/push-url.txt   (recommended: an ntfy.sh topic URL)
#
# The URL receives an HTTP POST whose body is the message; ntfy.sh reads the
# Title/Priority headers. Any service accepting that shape works (ntfy, self-hosted
# ntfy, Pushover-style endpoints with minor header changes, ...).
#
# Usage:  bash infra/push-notify.sh "Title" "Message body" [high|default]
# Env:    TROUT_PUSH_URL overrides backups/push-url.txt
#         TROUT_ROOT overrides the repo root (tests)
set -uo pipefail
cd "$(dirname "$0")/.."

ROOT="${TROUT_ROOT:-$(pwd)}"
BACKUPS="$ROOT/backups"

url="${TROUT_PUSH_URL:-}"
if [ -z "$url" ] && [ -f "$BACKUPS/push-url.txt" ]; then
  IFS= read -r url < "$BACKUPS/push-url.txt"
  url="${url//[[:space:]]/}"
fi
if [ -z "$url" ]; then
  exit 0   # push not configured — intentional silent no-op
fi

title="${1:-Trout server}"
message="${2:-}"
priority="${3:-default}"

# node is the proven HTTP client on every host that runs this stack (portable
# shells may lack curl); the exit code reflects delivery success.
node -e '
const [url, title, message, priority] = process.argv.slice(1);
fetch(url, {
  method: "POST",
  headers: { Title: title, Priority: priority, Tags: "fish" },
  body: message,
}).then((r) => {
  if (!r.ok) { console.error("[push] HTTP " + r.status); process.exit(1); }
}).catch((e) => { console.error("[push] " + (e.cause && e.cause.code || e.message || e)); process.exit(1); });
' "$url" "$title" "$message" "$priority"
