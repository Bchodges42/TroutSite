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
| Snapshot JSON stale | Until ROLE 3's builder lands, snapshots are static skeleton files; after that, re-run `bash infra/deploy.sh` |
| DB locked errors | Ensure only one writer (api/cron) uses WAL; never edit the DB while pm2 runs it |
| Seed says "empty" | Content pack intentionally empty in Phase 0; `pnpm --filter api seed` is a no-op success |
