#!/usr/bin/env bash
# ROLE 1 — the deploy/site read-path gate, reusable outside deploy.sh.
#
# Same checks as deploy.sh's verification step (plus the static /v1/streams.json
# surface), against any origin:
#
#   bash infra/verify-site.sh                                   # local API (127.0.0.1:8787)
#   bash infra/verify-site.sh --url http://127.0.0.1:8787      # explicit origin
#   SITE_PUBLIC_URL=https://trout.tntechclimb.com bash infra/verify-site.sh --public
#
# Exit 0 = every surface serves real data; exit 1 = at least one check failed
# (details on stdout — the watchdog and deploy rollback both parse nothing,
# they just branch on the exit code).
set -uo pipefail
cd "$(dirname "$0")/.."

URL="http://127.0.0.1:8787"
PUBLIC_CHECK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="${2:?--url needs a value}"; shift 2 ;;
    --public) PUBLIC_CHECK=1; shift ;;
    --public-url) SITE_PUBLIC_URL="${2:?--public-url needs a value}"; PUBLIC_CHECK=1; shift 2 ;;
    *) echo "unknown arg: $1"; exit 2 ;;
  esac
done

fail=0
check() {
  local label="$1" path="$2" want="$3"
  local got
  got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$URL$path" || echo 000)"
  if [ "$got" != "$want" ]; then
    echo "[verify] FAIL — $label answered $got (expected $want)"
    fail=1
  else
    echo "[verify] ok — $label $got"
  fi
}

check "GET /healthz"          "/healthz"                     200
check "GET /v1/streams"       "/v1/streams"                  200
check "GET /v1/streams.json"  "/v1/streams.json"             200
check "GET /v1/conditions/latest.json" "/v1/conditions/latest.json" 200
check "GET /content/taxa.json" "/content/taxa.json"          200

# 200 is not enough: an SPA fallback or an error envelope also answers 200.
# The catalog must parse as a non-empty JSON array of streams.
rows="$(curl -s --max-time 15 "$URL/v1/streams.json" | node -e "
let raw='';process.stdin.on('data',(c)=>{raw+=c}).on('end',()=>{
  try { const d=JSON.parse(raw); console.log(Array.isArray(d)?d.length:-1); }
  catch { console.log(-1); }
})" 2>/dev/null || echo -1)"
if [ "${rows:- -1}" -gt 0 ] 2>/dev/null; then
  echo "[verify] ok — catalog has $rows streams"
else
  echo "[verify] FAIL — /v1/streams.json did not parse as a non-empty array (got: ${rows:-unreadable})"
  fail=1
fi

# /healthz must report feed health, not merely "process up" (C1).
health_ok="$(curl -s --max-time 15 "$URL/healthz" | node -e "
let raw='';process.stdin.on('data',(c)=>{raw+=c}).on('end',()=>{
  try { console.log(String(JSON.parse(raw).ok === true)); }
  catch { console.log('false'); }
})" 2>/dev/null || echo false)"
if [ "$health_ok" = "true" ]; then
  echo "[verify] ok — conditions feed healthy"
else
  echo "[verify] FAIL — /healthz reports the conditions feed unhealthy (ok:false)"
  fail=1
fi

if [ "$PUBLIC_CHECK" = "1" ]; then
  pub="${SITE_PUBLIC_URL:-}"
  if [ -z "$pub" ]; then
    echo "[verify] SKIP — public check requested but SITE_PUBLIC_URL/--public-url not set"
  else
    for path in /v1/streams.json /content/taxa.json; do
      got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$pub$path" || echo 000)"
      if [ "$got" = "200" ]; then
        echo "[verify] ok — public $path 200"
      else
        echo "[verify] FAIL — public $path answered $got (edge cache may need a purge, RUNBOOK §8)"
        fail=1
      fi
    done
  fi
fi

if [ "$fail" = "1" ]; then
  echo "[verify] READ PATH BROKEN on $URL — see RUNBOOK §9 (restore-snapshots / watchdog)"
  exit 1
fi
echo "[verify] all surfaces green on $URL"
