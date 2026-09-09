# Session 1 — host recovery checklist (2026-09-08 incident)

Everything in sections 1–7 is run **ON the production host** (the box behind
`https://trout.tntechclimb.com`). The dev laptop cannot reach it — host access is
the owner's. Section 8 runs on the laptop; section 9 is the post-incident write-up.

Incident signature (seen from outside since 2026-09-06T02:23Z): the API process is
alive but `trout-cron` has produced nothing and the host's snapshot trees
(`apps/web/public/v1`, `apps/web/public/content`) are gone/empty.

Assumes the host repo root is `/opt/trout` — adjust `$REPO` below if different.

```bash
REPO=/opt/trout
cd "$REPO"
```

## 1. Confirm the broken state

```bash
BASE=https://trout.tntechclimb.com
# cache-buster so Cloudflare's edge can't mask what the origin serves
CB="?cb=$(date +%s)"

curl -sS "$BASE/healthz$CB"
#   BROKEN: {"ok":false,"conditions":{"present":false,"healthy":false,
#             "reason":"conditions feed has not been generated",
#             "records":0,"assessed":0,"buildStale":false,"fetchedAt":null,
#             "ageMinutes":null},"jobs":{...}}
#   HEALTHY: {"ok":true,"conditions":{"present":true,"healthy":true,"reason":null,
#             "records":N,"assessed":>0,"buildStale":false,
#             "fetchedAt":"<within the last hour>","ageMinutes":0..60},"jobs":{...}}

curl -sS "$BASE/v1/conditions/latest.json$CB"
#   BROKEN:  {"error":"not found"}
#   HEALTHY: [{"streamId":"…","readings":[…],"score":{…,"assessed":true},
#             "fetchedAt":"…","nextExpectedUpdate":"…"}, …]

curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/v1/streams$CB"; curl -sS "$BASE/v1/streams$CB" | head -c 120; echo
#   BROKEN:  503  {"error":"streams snapshot not generated yet"}
#   HEALTHY: 200  [{ …streams array… }]

curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/content/taxa.json$CB"
#   BROKEN:  404   HEALTHY: 200

curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/v1/hatch/tn-east-clinch/9.json$CB"
#   BROKEN:  404   HEALTHY: 200  (any /v1/hatch/<water>/<month 1-12>.json)

ls -la apps/web/public/v1 apps/web/public/content 2>&1 | head -20
#   BROKEN: "No such file or directory" or empty trees
#   HEALTHY: v1/{conditions,hatch,reports,shops,stocking,streams.json}, content/{taxa.json,patterns.json}
```

Also confirm the local read path bypassing the tunnel:

```bash
curl -sS http://127.0.0.1:8787/healthz; echo
pm2 ls   # trout-api, trout-cron, trout-portal-static, trout-marketing-static, trout-cloudflared
```

## 2. Verify USGS_USER_AGENT is set

The deploy's gauge-ingestion step fails without it (USGS rejects/blocks the
request), which cascades into the C1 unhealthy-feed gate — see RUNBOOK §2/§3.

```bash
grep USGS_USER_AGENT apps/api/.env || echo "MISSING from apps/api/.env"
pm2 env trout-api | grep USGS_USER_AGENT || echo "MISSING from pm2 env"
# Expected: USGS_USER_AGENT=trout/… (contact: …)  — a real contact, not the example value
```

If missing: add a real value to `apps/api/.env` (never commit it), then
`pm2 restart trout-api --update-env` before deploying.

## 3. Where is the host clone?

```bash
git -C "$REPO" fetch origin
git -C "$REPO" status -sb
git -C "$REPO" rev-parse HEAD origin/main
```

Expected: `origin/main` = `6d0befe` (current tip). HEAD should be `6d0befe` or a
direct ancestor (behind is fine — the next deploy fast-forwards). Investigate
detached HEAD / dirty tree / divergence before deploying: `git -C "$REPO" status`
and stash or commit local edits (none should exist on the host).

## 4. Deploy (this is the primary fix attempt)

```bash
bash infra/deploy.sh
```

The current deploy (git pull → install → build → validate → seed → gauge ingest →
snapshots → pm2 reload) **fails loudly** at the end if the published conditions
feed is unhealthy (C1 gate): it prints
`[deploy] FAIL — /healthz reports the conditions feed as unhealthy: …` and exits
non-zero instead of shipping a misleading feed. Save the full output either way —

- green: `… all endpoints green.` → skip to §6 (verify), then make sure §5 holds.
- failed at ingest/healthz → fix per the printed cause (usually USGS_USER_AGENT §2
  or network egress), re-run. Failed **before** snapshots ran? Then §1 state is
  unchanged; diagnose from the output before proceeding.


### Hatch-pack note (S1, 2026-09-08)

The hourly cron also regenerates `/v1/hatch/*` + `/content/*.json` from the built content
pack (`packages/content/dist/pack`, produced by deploy’s `pnpm -r build`). If deploy is green
but the next cron run still logs `content pack not found`, the process is still running the
OLD code or env: `pipelineConfig` now resolves repo paths cwd-independently and the ecosystem
config now sets `TROUT_CONTENT_DIR`, but **`pm2 reload <name>` does not re-read the ecosystem
env**. After pulling this commit, force a full restart of the two API processes:

```bash
pm2 delete trout-api trout-cron && pm2 start infra/pm2/ecosystem.config.cjs && pm2 save
```

Then confirm the next hourly run’s jobs_log `snapshots`/`gauges-conditions` detail shows
`contentPack:true` and `hatchCharts > 0` (via /healthz jobs, or `pm2 logs trout-cron`).

## 5. Restart / verify trout-cron

```bash
pm2 describe trout-cron        # status online? restart count sane? uptime?
pm2 logs trout-cron --lines 100 --nostream
# Snapshot freshness: the cron rewrites v1/conditions/latest.json hourly (there
# are no per-hour files). Its mtime must be younger than ~65 min:
ls -l --time-style=full-iso apps/web/public/v1/conditions/latest.json
find apps/web/public/v1 apps/web/public/content -type f | wc -l   # should be ~150
```

Optional (sqlite3 CLI present): confirm the cron heartbeat in the DB —

```bash
sqlite3 apps/api/data/trout.db "SELECT * FROM jobs_log ORDER BY id DESC LIMIT 5;"
# expect recent rows (gauges hourly / cron-tick) with ok status
```

## 6. Verify recovery

```bash
curl -sS http://127.0.0.1:8787/healthz | head -c 400; echo
# must be ok:true with conditions.assessed > 0 and fetchedAt < 1 h old
curl -sS "https://trout.tntechclimb.com/healthz?cb=$(date +%s)" | head -c 400; echo
```

Then re-run every check in §1 and confirm the HEALTHY outputs. If the origin is
green but the public URL still serves the old broken bodies, purge the Cloudflare
cache for `/v1/*` and `/content/*` (edge cache, RUNBOOK §4/§8).

## 7. If cron is still dead

```bash
pm2 resurrect                                  # restore the saved process list
pm2 start infra/pm2/ecosystem.config.cjs       # or start fresh from the ecosystem
pm2 save
pm2 restart trout-cron && sleep 90 && pm2 logs trout-cron --lines 50 --nostream
# manual regeneration without waiting for the next tick:
pnpm --filter api ingest --job=gauges && pnpm --filter api snapshots
```

Check the **host OS's** pm2 persistence (the laptop uses pm2-windows-startup,
RUNBOOK §4 — the host needs whatever its OS equivalent is):

- Windows host: `pm2-windows-startup` installed + `schtasks /Query /TN "pm2-resurrect"`
- Linux host: `pm2 startup systemd` done + `systemctl status pm2-<user>`, and `pm2 save` current

If trout-cron flips to `errored`/`stopped`: `pm2 describe trout-cron` → read
`pm2 logs trout-cron --err --lines 200 --nostream` (usual suspects: missing env
from §2, DB locked, ENOSPC — see §9).

## 8. Fallback while the host is untrusted (runs on the LAPTOP)

Once the owner provides any SSH transport, publish the laptop's healthy snapshot
trees to the host:

```bash
cd <laptop repo root>
TROUT_SYNC_HOST=user@host bash infra/sync-snapshots.sh --dry-run   # plan first
TROUT_SYNC_HOST=user@host bash infra/sync-snapshots.sh             # sync + verify (exits non-zero on failure)
```

Details, flags, rollback (`v1.prev`), and Cloudflare-cache caveats: RUNBOOK §8.
This restores the read path only — it does NOT fix the host's DB or cron (§5 is
still required); the next healthy host cron overwrites synced data.

**Host-side self-healing (2026-09-09, `infra/host-selfheal`):** the read path is
files-on-disk (`GET /v1/streams` = `existsSync(v1/streams.json)` per request), so
`infra/` now ships an archive → verify → restore → watchdog loop (RUNBOOK §9):
`deploy.sh` archives the served trees before regenerating and auto-rolls back when
verification fails, and an hourly `infra/watchdog.sh` heals a dead feed by
regenerating snapshots or restoring the last-good archive — writing
`backups/watchdog.status` instead of waiting for an angler to report the outage.
Once this branch lands on the host, an API restart or a dead cron degrades to
"last-good data" instead of an empty catalog.

**Client-side safety net (2026-09-09, `fix/live-catalog`):** the PWA now bundles
the reviewed content-pack catalog (`apps/web/public/content-pack/streams.json`,
copied at web build time and SW-precached). When `/v1/streams` 503s, visitors —
including fresh phones with an empty Dexie cache — get the static catalog
(unassessed waters, offline chip) instead of the "Catalog unavailable" hard
error. This is a READ-PATH bandage only: live conditions, hatch charts, and
stocking still require §4/§8 to restore the host's snapshot trees.

## 9. Post-incident: document what killed cron + the trees

`trout-cron` going quiet AND both generated trees disappearing at once is not a
code bug — find the environmental cause and write it up (RUNBOOK §7/§8, incident
notes):

```bash
df -h                      # disk full is the prime suspect for "trees gone + writes stopped"
df -i                     # inode exhaustion looks identical
pm2 logs trout-cron --err --lines 500 --nostream | tail -100
pm2 describe trout-cron   # restart count, created/uptime around 2026-09-06T02:23Z?
git -C "$REPO" status      # did a failed/partial deploy or clean wipe the untracked trees?
ls -la apps/web/public     # what else is missing besides v1/ and content/?
history | tail -100        # manual rm? (last resort evidence)
```

Record: first-failure timestamp, cause (disk full / failed deploy / manual delete /
OS reboot without pm2 startup), what restored service (deploy / cron fix / laptop
sync), and what prevents recurrence (e.g. disk alert, `pm2 save` + OS startup,
deploy-runbook update).
