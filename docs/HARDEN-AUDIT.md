# Origin-host hardening audit

Audit date: 2026-09-11 (America/Chicago). Target: `https://trout.tntechclimb.com`.
The public probes below are the before-fix baseline. The hardened branch is not
deployed: after-fix evidence is from `http://127.0.0.1:8787` and an isolated
static-server fixture. The owner must merge the branch and let the WinSW host's
self-deploy run before any public after-fix claim is made.

The workspace arrived as a source snapshot with no `.git` directory, commit
history, or remote. The audit therefore scanned the supplied files and the local
snapshot-import commit only; it cannot certify what may have existed in an
upstream history that was not supplied.

## H1–H4 findings

| ID | Severity | Before-fix evidence | Disposition |
|---|---|---|---|
| H1 | High | `GET /healthz` was HTTP 200, body length 993, with `conditions`, job names/statuses, timestamps, counts, and `buildStale`; no `cache-control` header. | Fixed in `apps/api/src/app.ts`: optional constant-time `x-watchdog-token`, generic 401, unconditional `Cache-Control: no-store`. Owner must wire the token into WinSW and the watchdog/verifier tasks. |
| H2 | Medium | Public `/`, `/healthz`, `/v1/streams`, and `/content/taxa.json` responses lacked all five requested headers. | Fixed with a Fastify `onSend` hook. CSP remains intentionally deferred because neither supplied web template contains a CSP meta tag to copy safely. |
| H3 | High (latent) | Base static server served an outside file for encoded traversal. | Fixed with final resolved-path containment, malformed-escape handling, and GET/HEAD-only static serving; regression test added. The server still binds loopback as an additional defense. |
| H4 | Low | No repository change can verify or configure the Cloudflare dashboard rule. | Owner action written in `infra/RUNBOOK.md`: `/v1/portal/*`, 10 requests/minute/IP, Block. |

### H1 exact probes

Before:

```text
$ curl -ksS -D - https://trout.tntechclimb.com/healthz
HTTP/2 200
content-type: application/json; charset=utf-8
content-length: 993
server: cloudflare

{"ok":true,"conditions":{"present":true,"healthy":true,"reason":null,"records":148,"assessed":38,"buildStale":false,"fetchedAt":"2026-09-11T07:46:58.584Z","ageMinutes":27},"jobs":{"stocking":{"job":"stocking","status":"ok",...}}}
```

There was no `cache-control` header. The `...` above only abbreviates the
captured job object so this report does not republish all operational telemetry;
the response length and exposed field names are exact.

After, local server started with `WATCHDOG_TOKEN=harden-local-token`:

```text
$ curl -sS -D - http://127.0.0.1:8787/healthz
HTTP/1.1 401 Unauthorized
cache-control: no-store
strict-transport-security: max-age=63072000
...
{"error":"unauthorized"}

$ curl -sS -H 'x-watchdog-token: harden-local-token' -D - http://127.0.0.1:8787/healthz
HTTP/1.1 200 OK
cache-control: no-store
strict-transport-security: max-age=63072000
...
{"ok":false,"conditions":{"present":false,"healthy":false,"reason":"conditions feed has not been generated","records":0,"assessed":0,"buildStale":false,"fetchedAt":null,"ageMinutes":null},"jobs":{}}
```

The local `ok:false` is expected: the isolated dev server had no generated
snapshot feed. It is not a production-health claim.

### H2 exact probes

Before, public `GET /healthz` returned only the normal application/Cloudflare
headers, including `content-type`, `vary`, and `server: cloudflare`; it had no
`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, or `Permissions-Policy`.

After, local `GET /healthz` includes:

```text
strict-transport-security: max-age=63072000
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(self), camera=(), microphone=()
```

The hook is response-wide, so local 401, 404, 405, 503, JSON, static, and SPA
responses receive the same headers. No CSP response header was added.

### H3 exact probes

The base commit was run against a temporary `dist` directory containing
`index.html` and a sibling `secret.txt` outside that directory:

```text
GET /%2e%2e%2fsecret.txt  → HTTP 200, body "should never be served"
GET /..%2fsecret.txt      → HTTP 200, body "should never be served"
GET /..%2f..%2f... (120 encoded segments) → HTTP 404
```

The hardened server returns:

```text
GET /%2e%2e%2fsecret.txt  → HTTP 404, {"error":"not found: /%2e%2e%2fsecret.txt"}
GET /..%2fsecret.txt      → HTTP 404, {"error":"not found: /..%2fsecret.txt"}
GET /..%2f..%2f... (120 encoded segments) → HTTP 404
GET /%E0%A4%A (malformed escape) → HTTP 404
```

The regression is covered by `apps/api/test/static-server.test.ts` and runs in
the API Vitest suite.

### H4 owner action

Create the Cloudflare Rate Limiting Rule described in `infra/RUNBOOK.md` §9.
This branch does not call or mutate Cloudflare settings.

## New-issue hunt

| Finding | Severity | Evidence (exact request → response) | Fix / disposition |
|---|---|---|---|
| Portal auth error oracle | Low | `GET /v1/portal/me` → `401 {"error":"missing portal token"}`; `Authorization: Bearer garbage` → `401 {"error":"invalid portal token"}`. | Fixed: missing, malformed, expired, and bad-signature auth now all return `401 {"error":"unauthorized"}`; unknown/disabled shops return generic `403 {"error":"forbidden"}`; missing server secret returns generic 503. Precise reasons remain server logs only. |
| Non-GET SPA fallback | Medium | `POST /healthz` with `Accept: text/html` → `200 text/html` containing the SPA shell. | Fixed: Fastify not-found fallback now returns `405 {"error":"method not allowed"}` with `Allow: GET, HEAD`; static-server has the same method allowlist. |
| Direct snapshot artifact | Low | `GET /v1/streams.json` → `200` JSON catalog, while the frozen contract route is `GET /v1/streams`. | Fixed: `@fastify/static` denies `/streams.json`; `/v1/streams` continues to read the file internally. Owner must remove the legacy `/v1/streams.json` probe from `infra/verify-site.sh` before deploy. |
| CSP template mismatch | Medium / deferred | Public `GET /` response had no CSP header. `apps/web/index.html` and the supplied `apps/web/dist/index.html` contain no CSP meta tag; the only meaningful template difference is dev vs hashed production asset wiring. | No safe code fix without inventing a policy. Owner/product action: add one shared, tested CSP meta policy to the web build, then promote it to a response header in a separate change. |
| Third-party credentials in captured fixtures | Medium / owner action | `apps/api/fixtures/TN/2026-09-02.html:224` and `apps/api/fixtures/TN/2026-09-04-stockings-page.html:229` contain COVEO-style JWT `accessToken` literals with expiry claims in early September 2026. | They are expired at this audit date and are not in the web build or runtime public tree. Because fixture files are outside this lane's stated edit scope, they were not rewritten here. Owner should redact/replace them, check the upstream provider's status, and rotate/revoke if still valid; purge from any real upstream history. The supplied snapshot has no prior history to inspect. |
| Snapshot allowlist | Informational | Public probes: `/v1/streams` 200, `/v1/streams.json` 200 before fix, `/v1/conditions/latest.json` 200, `/v1/hatch/tn-east-holston/1.json` 200, `/v1/shops/TN.json` 200, `/v1/reports/recent.json` 200, unknown `/v1/not-an-endpoint` 404, `/v1/portal/me` 401. `/v1/stocking/TN*.json` and `/v1/evidence/waters.json` were 404 because those snapshots were absent on the live host, not because an extra route existed. | Extra direct stream artifact fixed. `GET /v1/portal/me` is a required dynamic admin route but is absent from the frozen `ENDPOINTS` interface; packages/contracts are frozen per task scope, so contract reconciliation is a follow-up rather than an unreviewed edit. |
| Built dist / precache | Verified | The available `apps/web/dist/sw.js` precache contains the app shell, hashed assets, fonts, icons, content-pack, and atlas files; no `.env`, SQLite DB, backups, portal secret, tunnel credential, or source fixture path is present. Dynamic `/v1` snapshots are runtime-cached, not precached. | No finding. Re-run this check against the host-generated build after deployment. |
| Body limit / methods | Verified after fix | `Fastify({ bodyLimit: 128 * 1024 })`; authenticated report schema caps `body` at 4000 chars and arrays at 25 items. API tests cover 4001-char rejection; static-server regression covers POST → `405` and HEAD. | No finding after the method-fallback fix. Keep the 128 KiB limit and Cloudflare portal rate limit. |

## Secret-scan result

The current tracked tree contains only placeholders for `PORTAL_SECRET`, tunnel
IDs, credential paths, and ntfy configuration. `backups/push-url.txt` is absent
from the supplied tree. The scan did find the two expired third-party fixture
JWTs listed above. Because the snapshot had no original Git history, `git log -p`
could only inspect the locally-created snapshot commit; historical exposure before
that import remains an owner follow-up.

## Local verification

```text
pnpm --filter api lint  # pass
pnpm --filter api test  # 21 files, 146 tests pass
pnpm --filter api build # pass
pnpm -r test             # pass: contracts 97, content 11, API 146, admin 19,
                         #       web 239 passed / 1 skipped
```

`pnpm -r lint` is not fully green in the supplied baseline: package lint is
green through marketing/API, but the e2e package reports 48 pre-existing
findings in `e2e/**` (browser globals, explicit `any`, and unused variables).
The hardening lane did not change those files. The unrelated baseline
`packages/ui` unused import was removed so its package lint is clean. The
remaining owner merge gate is to resolve or explicitly accept those existing
e2e findings, then rerun the full sequence from the merged branch.
