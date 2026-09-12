#!/usr/bin/env bash
# ROLE 1 - the deploy/site read-path gate, reusable outside deploy.sh.
#
#   bash infra/verify-site.sh                                    # local API
#   bash infra/verify-site.sh --url http://127.0.0.1:8787       # explicit origin
#   SITE_PUBLIC_URL=https://trout.tntechclimb.com bash infra/verify-site.sh --public
#   bash infra/verify-site.sh --deep                            # include hatch slices
#   bash infra/verify-site.sh --wait 30                         # retry up to 30 s
#
# Env: WATCHDOG_TOKEN — when set (the same value the API's /healthz requires),
# every probe sends `x-watchdog-token`, so the verifier works against a
# hardened instance. Unset = unauthenticated local development.
#
# Implementation is bash + node only. Checks status, JSON content, and shape for
# every required read surface. --deep additionally audits every TN hatch region
# and month from the committed content inventory.
set -uo pipefail
cd "$(dirname "$0")/.."

URL="http://127.0.0.1:8787"
PUBLIC_URL="${SITE_PUBLIC_URL:-}"
WAIT=0
DEEP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="${2:?--url needs a value}"; shift 2 ;;
    --public) shift ;;
    --public-url) PUBLIC_URL="${2:?--public-url needs a value}"; shift 2 ;;
    --wait) WAIT="${2:?--wait needs seconds}"; shift 2 ;;
    --deep) DEEP=1; shift ;;
    *) echo "unknown arg: $1"; exit 2 ;;
  esac
done

# Everything (checks, retries, and the wait) happens inside one node process.
exec node -e '
const fs = require("node:fs");
const path = require("node:path");
const [base, waitArg, pub, deepArg] = process.argv.slice(1);
const deep = deepArg === "1";
const deadline = Date.now() + (parseInt(waitArg, 10) || 0) * 1000;
// T0-3: the hardened origin answers /healthz 401 without the watchdog token.
// WATCHDOG_TOKEN comes from the task/service environment (same variable the
// API reads); without it the probe relies on the origin being unauthenticated
// (local development).
const watchdogToken = process.env.WATCHDOG_TOKEN || "";
const signalFor = (ms) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new Error("timeout")), ms);
  if (id && typeof id.unref === "function") id.unref();
  return controller.signal;
};
let attempt = 0;

function join(origin, p) {
  return origin.replace(/\/+$/, "") + p;
}

function expectedPaths() {
  const paths = [
    ["/healthz", "object", 0],
    // /v1/streams.json is the deliberately-blocked implementation file behind
    // the frozen /v1/streams contract route (T0-3): probing it fails a healthy
    // hardened instance. The public contract endpoint is the one to check.
    ["/v1/streams", "array", 1],
    ["/v1/conditions/latest.json", "array", 1],
    ["/v1/stocking/TN.json", "array", 1],
    ["/v1/stocking/TN-recent.json", "array", 1],
    ["/v1/shops/TN.json", "array", 1],
    ["/v1/reports/recent.json", "array", 0],
    ["/content/taxa.json", "array", 1],
    ["/content/patterns.json", "array", 1],
    ["/content/fishing.json", "object", 0],
  ];
  if (!deep) return paths;

  const hatchDir = path.join(process.cwd(), "packages", "content", "hatch", "tn");
  const regions = fs.readdirSync(hatchDir)
    .filter((name) => name.endsWith(".yaml"))
    .map((name) => name.slice(0, -5))
    .sort();
  if (!regions.length) throw new Error("no Tennessee hatch source files found");
  for (const region of regions) {
    for (let month = 1; month <= 12; month += 1) {
      paths.push([`/v1/hatch/${region}/${month}.json`, "hatch", 0]);
    }
  }
  return paths;
}

async function checkOrigin(origin, label) {
  const lines = [];
  let fail = 0;
  let checks;
  try {
    checks = expectedPaths();
  } catch (e) {
    return { lines: [`[verify] FAIL - ${label} hatch inventory: ${e.message}`], fail: 1 };
  }

  for (const [p, shape, minimum] of checks) {
    try {
      const response = await fetch(join(origin, p), {
        signal: signalFor(label === "public" ? 20000 : 15000),
        headers: {
          accept: "application/json",
          ...(watchdogToken ? { "x-watchdog-token": watchdogToken } : {}),
        },
      });
      const contentType = response.headers.get("content-type") || "";
      let value;
      let detail = "";
      if (response.status === 200 && !/json/i.test(contentType)) {
        detail = ` (content-type ${contentType || "missing"})`;
      } else if (response.status === 200) {
        try {
          value = JSON.parse(await response.text());
          if (shape === "array" && (!Array.isArray(value) || value.length < minimum)) {
            detail = ` (expected array with at least ${minimum} item${minimum === 1 ? "" : "s"})`;
          } else if (shape === "object" && (value === null || Array.isArray(value) || typeof value !== "object")) {
            detail = " (expected JSON object)";
          } else if (shape === "hatch" && (value === null || Array.isArray(value) || typeof value !== "object" || !Array.isArray(value.entries))) {
            detail = " (expected hatch chart object with entries)";
          }
        } catch {
          detail = " (invalid JSON)";
        }
      }
      const ok = response.status === 200 && !detail;
      lines.push(`[verify] ${ok ? "ok" : "FAIL"} - ${label} GET ${p} ${response.status}${detail}`);
      if (!ok) fail = 1;
      if (p === "/healthz" && ok && value.ok !== true) {
        lines.push(`[verify] FAIL - ${label} /healthz reports ok:false`);
        fail = 1;
      }
    } catch (e) {
      lines.push(`[verify] FAIL - ${label} GET ${p} (${e.cause && e.cause.name || e.name || e})`);
      fail = 1;
    }
  }
  return { lines, fail };
}

async function check() {
  const local = await checkOrigin(base, "local");
  const lines = local.lines;
  let fail = local.fail;
  if (pub) {
    const publicCheck = await checkOrigin(pub, "public");
    lines.push(...publicCheck.lines);
    fail ||= publicCheck.fail;
  }
  return { lines, fail };
}

(async () => {
  for (;;) {
    attempt += 1;
    const { lines, fail } = await check();
    if (!fail) {
      for (const line of lines) console.log(line);
      console.log("[verify] all surfaces green on " + base + (pub ? " and " + pub : "") + " (attempt " + attempt + ")");
      process.exitCode = 0;
      return;
    }
    if (Date.now() >= deadline) {
      for (const line of lines) console.log(line);
      console.log("[verify] READ PATH BROKEN on " + base + " - see RUNBOOK section 9 (restore-snapshots / watchdog)");
      process.exitCode = 1;
      return;
    }
    console.log("[verify] attempt " + attempt + " not green yet - retrying until " + new Date(deadline).toISOString());
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
})();
' "$URL" "$WAIT" "$PUBLIC_URL" "$DEEP"
