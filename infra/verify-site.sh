#!/usr/bin/env bash
# ROLE 1 — the deploy/site read-path gate, reusable outside deploy.sh.
#
#   bash infra/verify-site.sh                                    # local API (127.0.0.1:8787)
#   bash infra/verify-site.sh --url http://127.0.0.1:8787       # explicit origin
#   SITE_PUBLIC_URL=https://trout.tntechclimb.com bash infra/verify-site.sh --public
#   bash infra/verify-site.sh --wait 30                         # retry up to 30 s until green
#
# Implementation is bash + node only — portable server shells lack coreutils
# (sleep/curl were the 2026-09-09 deployment failure), while node is proven present.
# Checks: healthz ok:true, 200 + non-empty catalog on /v1/streams(.json),
# /v1/conditions/latest.json, /content/taxa.json, optional public edge probe.
set -uo pipefail
cd "$(dirname "$0")/.."

URL="http://127.0.0.1:8787"
PUBLIC_URL="${SITE_PUBLIC_URL:-}"
WAIT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="${2:?--url needs a value}"; shift 2 ;;
    --public) shift ;;
    --public-url) PUBLIC_URL="${2:?--public-url needs a value}"; shift 2 ;;
    --wait) WAIT="${2:?--wait needs seconds}"; shift 2 ;;
    *) echo "unknown arg: $1"; exit 2 ;;
  esac
done

# Everything (checks, retries, the wait) happens inside one node process: node is
# present on every host that runs this stack, and its fetch+setTimeout replace the
# curl/sleep pair portable shells cannot be relied on to provide. Per-check timeouts
# use a manually-unref'd AbortController — AbortSignal.timeout() leaves live handles
# that make node abort with a libuv assertion on Windows when exiting via process.exit.
exec node -e '
const [base, waitArg, pub] = process.argv.slice(1);
const deadline = Date.now() + (parseInt(waitArg, 10) || 0) * 1000;
const t = (ms) => {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(new Error("timeout")), ms);
  if (id && typeof id.unref === "function") id.unref();
  return c.signal;
};
let attempt = 0;

async function get(p) {
  const r = await fetch(base + p, { signal: t(15000), headers: { accept: "application/json" } });
  return { s: r.status, b: await r.text() };
}

async function check() {
  const lines = [];
  let fail = 0;
  const paths = ["/healthz", "/v1/streams", "/v1/streams.json", "/v1/conditions/latest.json", "/content/taxa.json"];
  for (const p of paths) {
    try {
      const { s } = await get(p);
      lines.push((s === 200 ? "[verify] ok — GET " : "[verify] FAIL — GET ") + p + " " + s);
      if (s !== 200) fail = 1;
    } catch (e) {
      lines.push("[verify] FAIL — GET " + p + " (" + (e.cause && e.cause.name || e.name || e) + ")");
      fail = 1;
    }
  }
  try {
    const n = JSON.parse((await get("/v1/streams.json")).b).length;
    if (n > 0) lines.push("[verify] ok — catalog has " + n + " streams");
    else { lines.push("[verify] FAIL — catalog is empty"); fail = 1; }
  } catch {
    lines.push("[verify] FAIL — /v1/streams.json did not parse as an array");
    fail = 1;
  }
  try {
    const ok = JSON.parse((await get("/healthz")).b).ok === true;
    lines.push(ok ? "[verify] ok — conditions feed healthy" : "[verify] FAIL — /healthz reports the conditions feed unhealthy (ok:false)");
    if (!ok) fail = 1;
  } catch {
    lines.push("[verify] FAIL — /healthz unreadable");
    fail = 1;
  }
  if (pub) {
    for (const p of ["/v1/streams.json", "/content/taxa.json"]) {
      try {
        const r = await fetch(pub + p, { signal: t(20000) });
        lines.push((r.status === 200 ? "[verify] ok — public " : "[verify] FAIL — public ") + p + " " + r.status);
        if (r.status !== 200) fail = 1;
      } catch (e) {
        lines.push("[verify] FAIL — public " + p + " (" + (e.cause && e.cause.name || e.name || e) + ")");
        fail = 1;
      }
    }
  }
  return { lines, fail };
}

(async () => {
  for (;;) {
    attempt += 1;
    const { lines, fail } = await check();
    if (!fail) {
      for (const l of lines) console.log(l);
      console.log("[verify] all surfaces green on " + base + " (attempt " + attempt + ")");
      process.exitCode = 0;
      return;
    }
    if (Date.now() >= deadline) {
      for (const l of lines) console.log(l);
      console.log("[verify] READ PATH BROKEN on " + base + " — see RUNBOOK §9 (restore-snapshots / watchdog)");
      process.exitCode = 1;
      return;
    }
    console.log("[verify] attempt " + attempt + " not green yet — retrying until " + new Date(deadline).toISOString());
    await new Promise((r) => setTimeout(r, 2000));
  }
})();
' "$URL" "$WAIT" "$PUBLIC_URL"
