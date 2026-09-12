# RUNBOOK — trout on the home laptop (Windows)

Owner: ROLE 1 (infra/*). This runbook is the operational twin of 00-SHARED-CONTEXT **§9** (deployment)
and **§12** (integration checklist). Everything assumes **Git Bash** on Windows 10/11, Node 20 LTS,
pnpm 9, repo at `C:\Users\Benjamin\Projects\trout`. **No Docker. No systemd.**

## §12 coverage map

| §12 item | Where in this runbook |
|---|---|
| 1. Clean clone green | §2.1 (install/build) — verified in CI + `docs/` handoff |
| 2. `ingest --dry-run` parses fixtures | ROLE 3 (pipeline), invoked via deploy §3 step 4 once present |
| 3. Cron → snapshots → PWA live data | §3 (deploy) + `trout-cron` process in §2.4 |
| 4. Airplane-mode cold start | ROLE 2 (PWA); deploy §3 rebuilds the offline precache |
| 5. Shop portal round-trip | ROLE 3/4; portal origin noted in `infra/cloudflared/config.yml` |
| 6. Playwright e2e green | ROLE 5 (`e2e/`), CI gate once added |
| 7. Lighthouse PWA/offline/a11y | ROLE 2 verification on the deployed origin (§4) |
| 8. Privacy audit | ROLE 2/6; nothing in infra sends location anywhere |
| 9. Content validation gate | §3 step 3 (`pnpm validate:content`) + CI |
| 10. Clean reboot → recovery | **§4 — the core of this runbook** |

## 1. Prerequisites (one-time)

- **Node 20 LTS** (`node -v`; matches `engines` in the root `package.json`).
- **pnpm 9** — `npm install -g pnpm@^9` (or `corepack enable`). `pnpm -v` must print 9.x.
- **Git Bash** — all scripts are bash (`infra/deploy.sh`, `infra/backup.sh`).
- **cloudflared** — install the Windows binary and put it on PATH (`cloudflared --version`).
- **pm2** — `npm install -g pm2`.
- Optional but recommended: **sqlite3 CLI** on PATH so `infra/backup.sh` takes consistent
  online backups; otherwise it falls back to a plain file copy.

## 2. First-time setup

### 2.1 Get the app running

```bash
cd /c/Users/Benjamin/Projects/trout
pnpm install
cp .env.example .env            # then fill in real values (never commit .env)
pnpm -r build
pnpm --filter api seed          # creates apps/api/data/trout.db (gitignored)
pnpm --filter api start         # api on http://127.0.0.1:8787 → /healthz
```

### 2.2 Create the Cloudflare tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create trout        # prints the tunnel ID; writes the credentials JSON
cloudflared tunnel route dns trout APP.YOUR-DOMAIN.com
```

Copy the printed tunnel ID + credentials path into `infra/cloudflared/config.yml`
(template in that file; keep real values only on the laptop — do not commit them).

### 2.3 Cron (ingest + snapshots)

The hourly cron worker runs as the `trout-cron` pm2 process (`apps/api/dist/cron.js`):
USGS gauges (hourly) + TWRA stocking (daily 06:00) → SQLite → snapshot JSON regenerated
AT the served URLs in `apps/web/public` (`/v1/**`, `/content/**` — ADR 0005). The API
serves those files directly, so fresh data reaches visitors without a web rebuild.
Deploy (`§3`) also regenerates snapshots on every release.

### 2.4 Start everything under pm2

```bash
pm2 start infra/pm2/ecosystem.config.cjs
#   trout-api            :8787  portal write routes + health + GET /v1/streams
#                               + static serving of apps/web/public (/v1, /content) and web/dist (PWA)
#   trout-cron                  hourly gauges + daily stocking + snapshot regeneration
#   trout-portal-static  :8788  shop portal (apps/admin/dist); proxies /v1/portal/* → :8787
#   trout-marketing-static :8789 marketing site (apps/marketing/dist)
#   trout-cloudflared           the tunnel
pm2 save                                   # persist the process list for resurrect (§4)
```

`trout-cloudflared` runs the native binary via `interpreter: 'none'`; if cloudflared is not on
PATH, fix PATH rather than hardcoding a path in the ecosystem file.

## 3. Deploy (routine release)

```bash
bash infra/deploy.sh
```

Steps: `git pull --ff-only` → `pnpm install --frozen-lockfile` → `pnpm -r build` (content
pack included) → `pnpm validate:content` → regenerate snapshots into `apps/web/public`
(the live `/v1/*` tree) → `pm2 reload` api, cron, and the two static processes → `pm2 save`.
Cloudflared keeps running; it needs no reload for app changes.

Verify: `curl -fsS http://127.0.0.1:8787/healthz` → `{"ok":true}`, then check the public URL,
the portal origin (:8788), and marketing (:8789).

## 4. Clean reboot recovery (§12 #10)

Windows update or a power cycle should recover with:

1. Log in (laptop must be on, awake-on-AC per §6).
2. If pm2 doesn't come back automatically: `pm2 resurrect` (reads the saved dump).
   `pm2 save` alone does NOT survive a reboot on Windows — bootstrap persistence once:
   `npm install -g pm2-windows-startup && pm2-startup install` (registers a Task
   Scheduler job that runs `pm2 resurrect` at log on; verify with
   `schtasks /Query /TN "pm2-resurrect"`). Fallback: create the job manually —
   `schtasks /Create /SC ONLOGON /TN "trout-pm2-resurrect" /TR "cmd /c pm2 resurrect"`
3. Check processes: `pm2 ls` — `trout-api`, `trout-cron`, `trout-portal-static`,
   `trout-marketing-static`, `trout-cloudflared` all `online`.
4. Check health: `curl -fsS http://127.0.0.1:8787/healthz`.
5. Check tunnel: `cloudflared tunnel info trout` (or hit the public URL).
6. If the DB is missing/corrupt: restore the newest `backups/trout-*.db` over
   `apps/api/data/trout.db`, then `pm2 reload trout-api`.

Cloudflare caches static snapshot JSON at the edge, so visitors keep getting served during
the outage window (§11: laptop downtime → static + CF cache).

## 5. Backups

- Manual/nightly: `bash infra/backup.sh` → `backups/trout-YYYYmmdd-HHMMSS.db`, keeps 14.
- Schedule nightly (Task Scheduler, run whether user is logged on or not):
  `schtasks /Create /SC DAILY /ST 03:30 /TN "trout-db-backup" /TR "C:\Program Files\Git\bin\bash.exe -lc 'cd /c/Users/Benjamin/Projects/trout && bash infra/backup.sh'"`
- Also `git push` the repo nightly (§9 hygiene). The DB itself is **not** in git (gitignored).

## 6. Laptop hygiene

- **Sleep off on AC:** `powercfg /change standby-timeout-ac 0` and
  `powercfg /change hibernate-timeout-ac 0`. Monitor sleep is fine.
- **BitLocker on:** verify with `manage-bde -status C:` — "Protection Status: Protection On".
- Keep Windows Update set to active-hours reboots only; after any reboot, §4 must bring the
  stack back (test it once after first setup).
- Nightly: `infra/backup.sh` (§5) + `git push`.

## 7. Troubleshooting

| Symptom | Check / fix |
|---|---|
| `/healthz` unreachable | `pm2 logs trout-api --lines 50`; port 8787 already bound? `netstat -ano | findstr 8787` |
| Public URL 530/timeout | `pm2 logs trout-cloudflared`; tunnel ID/credentials in `infra/cloudflared/config.yml` |
| Cron not writing | `pm2 logs trout-cron`; check `jobs_log` table for `cron-tick` rows |
| Snapshot JSON stale | Until ROLE 3's builder lands, snapshots are static skeleton files; after that, re-run `bash infra/deploy.sh` — or let the watchdog heal it (§9); `cat backups/watchdog.status` |
| DB locked errors | Ensure only one writer (api/cron) uses WAL; never edit the DB while pm2 runs it |
| Seed says "empty" | Content pack intentionally empty in Phase 0; `pnpm --filter api seed` is a no-op success |

## 8. Snapshot-sync fallback (2026-09-08 incident)

**When to use:** the host's `trout-cron` is untrusted (produced nothing since
2026-09-06T02:23Z) and the host's snapshot trees are missing/empty
(`/v1/conditions/latest.json` → `{"error":"not found"}`, `/v1/streams` → 503,
`/content/*.json` + `/v1/hatch/*` → 404, `/healthz` → `ok:false`) while the
laptop's own pipeline is healthy and hourly-fresh. Host recovery comes first — the
heal path is §9 below; sync is the bridge until it lands.

Laptop-side (requires an SSH path to the host, which the owner must provide —
there is none today; Git Bash ships `ssh`/`scp`):

```bash
bash infra/sync-snapshots.sh --dry-run                        # fails today with the unset-host error
TROUT_SYNC_HOST=user@host bash infra/sync-snapshots.sh --dry-run
TROUT_SYNC_HOST=user@host bash infra/sync-snapshots.sh        # real sync + verify
# optional: TROUT_SYNC_PATH=/opt/trout TROUT_SYNC_PORT=22 TROUT_SYNC_IDENTITY=~/.ssh/id_ed25519
#           TROUT_SYNC_PUBLIC_URL=... TROUT_SYNC_RELOAD_CMD='pm2 reload trout-api --update-env'
#           --prune (drop remote extras)  --no-reload  --local <dir> (test seam)
```

What it does: pushes `apps/web/public/{v1,content}` to
`$TROUT_SYNC_PATH/apps/web/public` (default `/opt/trout/...`); rsync in place if
available, else `scp -r` into `<tree>.staging-<stamp>` + atomic rename so a
half-copy never serves (superseded tree kept as `<tree>.prev` — rollback:
`rm -rf v1 && mv v1.prev v1` on the host). Remote extras are untouched unless
`--prune`. Then verifies by curling the public URL for
`/v1/conditions/latest.json` (HTTP 200 + `fetchedAt`) and `/content/taxa.json`
(HTTP 200) with a cache-buster, and exits non-zero on any failed check.

Safety notes:

- **Cloudflare edge cache** caches snapshot JSON (§4): after a sync, visitors may
  still get stale `/v1/*` + `/content/*` until the edge TTL lapses. If the
  script's verification shows a stale `fetchedAt` while the host files are fresh,
  purge the CF cache for `/v1/*` and `/content/*` from the Cloudflare dashboard.
- **Sync is a FALLBACK, not a fix.** The real fix is the host's cron + deploy
  (§3): `bash infra/deploy.sh` on the host, `trout-cron` healthy again. The next
  healthy host cron overwrites synced data. Syncing also bypasses the host DB —
  the host's gauge observations stay missing until its own pipeline recovers.
- Sync never touches `apps/api/data/trout.db` or portal writes; it only replaces
  the two generated trees the API serves statically (ADR 0005).

## 9. Self-healing read path (2026-09-09 — recurring-outage fix)

> **HOST REALITY (2026-09-09, confirmed by on-server inspection):** the production
> server is a headless WINDOWS laptop running the app as a WinSW service named
> `TroutSite` (override with `TROUT_WINDOWS_SERVICE`) — **not pm2, no crontab**.
> The pm2/§2.4 setup describes the dev laptop. Everything in this section is
> host-agnostic: `deploy.sh` restarts via `infra/restart-app.sh` (pm2 if present,
> otherwise the Windows service), scheduling is installed by
> `infra/install-schedules.sh` (schtasks as SYSTEM here, crontab on Linux), and
> `infra/refresh-data.sh` hourly replaces the data heartbeat the dead `trout-cron`
> used to provide. If the API is not on :8787, export `TROUT_API_URL` in the tasks.

**Portable-shell constraint (learned 2026-09-09 on the server):** the server's Git
environment is a minimal portable Bash — `sleep`, `tar`, `find`, `tee`, `curl` could not
be relied on (the first bootstrap healed the site but died at `sleep 2`). Every entry
script now uses ONLY bash builtins + git + pnpm + node: verification is a single node
process (`verify-site.sh --wait 30` retries internally, replacing sleep+curl), the
archive is a node-copied directory via `infra/snapshot-io.mjs` (no tar), and log helpers
append instead of tee-ing.

**Why this exists:** the same outage has recurred — cron goes quiet, the generated
gitignored trees vanish or go stale, and the site serves "Catalog unavailable" until
someone notices days later. The read path is files-on-disk: `GET /v1/streams` does
`existsSync(apps/web/public/v1/streams.json)` per request (`apps/api/src/app.ts`), so
**whoever controls those files controls the site** — no DB surgery, no rebuild. Four
scripts now own that control loop:

| Script | Job |
|---|---|
| `infra/verify-site.sh` | The gate. healthz `ok:true` + 200/non-empty on `/v1/streams`, `/v1/streams.json`, `/v1/conditions/latest.json`, `/content/taxa.json`. `--url <origin>` for any origin; `SITE_PUBLIC_URL=… --public` also probes the edge. |
| `infra/archive-snapshots.sh` | Snapshot the currently-served trees → `backups/snapshots-last-good.tar.gz` (refuses to archive an empty/broken state). |
| `infra/restore-snapshots.sh` | Swap the archived trees back in (staging + atomic swap). This alone heals the read path. |
| `infra/watchdog.sh` | Hourly loop: verify → heal 1: `pnpm --filter api snapshots` (fresh data) → heal 2: restore last-good (stale-but-honest) → write `backups/watchdog.status` (`OK` / `HEALED-REGEN` / `HEALED-RESTORE` / `BROKEN`) + `backups/watchdog.log`. `--dry-run` checks and reports without acting. |

`deploy.sh` is wired into the same loop: it **archives the currently-served trees
before** seed/ingest/snapshots run, and if the final verification fails it
**automatically rolls back** to the archive, so a failed deploy leaves the previous
good site serving instead of a broken one. (The DB is not reverted — seed/ingest are
idempotent upserts.)

### Deploy (what "ship it" means on this stack)

```bash
bash infra/deploy.sh          # archive → pull → build → seed → ingest → snapshots → reload → verify → (auto-rollback on fail)
bash infra/verify-site.sh --public   # optional: confirm what visitors see through the edge
```

There is exactly one updater for **data** (trout-cron, hourly) and one for **code**
(`deploy.sh`, run on releases). The gitignored trees never need to come from git —
they are *generated on the host*, and the archive is their disaster-recovery copy.

### Mobile push notifications (ntfy.sh — free, no account)

The watchdog and auto-updater page the owner's phone on STATUS TRANSITIONS: entering
BROKEN, healing (with a note if serving last-good data), recovering to OK, and
auto-deploy failures/refusals. A stalled outage stays silent — no 15-minute buzzing.

One-time setup (5 minutes):
1. Phone: install the **ntfy** app (Play Store / App Store).
2. Subscribe to an UNGUESSABLE topic (the topic name is the only credential):
   e.g. `trout-site-alert-4kq7z2m9` — anyone who knows it can send to you.
3. On the server, tell the stack where to post:
     echo "https://ntfy.sh/trout-site-alert-4kq7z2m9" > backups/push-url.txt
4. Test from the server: bash infra/push-notify.sh "Test" "If this pops up, push works." "high"

Config resolves TROUT_PUSH_URL first, then backups/push-url.txt. Same transition-dedup
rules as the status files: one push per state change, never repeated.

### Zero-touch updates (`infra/autoupdate.sh`)

The server can ship its own releases: `autoupdate.sh` fetches origin, and when
`main` moved it runs `deploy.sh` (which verifies and rolls back on failure). It
refuses to run over locally-modified tracked files, and it is a no-op fetch when
nothing changed, so any cadence is safe. On the headless server (cron, not Task
Scheduler):

```cron
# data self-heal every 15 min + code updates hourly (server crontab -e)
*/15 * * * * cd /opt/trout && bash infra/watchdog.sh   >> backups/cron.log 2>&1
0 * * * *   cd /opt/trout && bash infra/autoupdate.sh  >> backups/cron.log 2>&1
```

(Adjust the path; `TROUT_DEPLOY_BRANCH` and `TROUT_DEPLOY_CMD` are overridable.
Windows-laptop equivalent: the schtasks pattern in §5.) With both schedules
installed plus a healthy deploy, routine operation is fully hands-off: cron
refreshes data hourly, the watchdog heals data outages, autoupdate ships code
releases, and the read-path archive + auto-rollback are the safety net under all
of it. `backups/autoupdate.status` / `backups/watchdog.status` are the two files
to glance at — anything other than `OK` / `UP-TO-DATE` / `DEPLOYED` / `HEALED-*`
needs a human.
