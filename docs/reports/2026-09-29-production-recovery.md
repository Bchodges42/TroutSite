# Production Recovery Report — 2026-09-29 (bejjiserver incident)

**Read this if:** the site is degraded, a deploy keeps rolling back, gauges/stocking data goes empty, or you need to reach the production host from the dev machine. Written for any agent (ZCode session, Codex agent, or human) that inherits this system. Canonical copy lives here; the owner's ZCode memory carries a pointer.

## 1. Host topology (verified facts, 2026-09-29)

| Thing | Dev machine (bejjipc) | Production (bejjiserver) |
|---|---|---|
| Role | ZCode/dev sessions, QA | Serves trout.tntechclimb.com |
| Tailscale | 100.120.134.31 | **100.88.209.92** |
| Tree | `C:\Users\Benjamin\Projects\trout` (pm2 stack, local-only) | **`C:\ProgramData\TroutSite\Current`** (WinSW service `TroutSite`) |
| Real DB | `apps\api\data\trout.db` (tree-relative) | **`C:\ProgramData\TroutSite\Data\trout.db`** — NOT the tree-relative path! |
| Process manager | pm2 (`trout-api` :8787 etc.) | WinSW service; **pm2 is empty there — never pm2-target it** |
| Scheduler | pm2 trout-cron | schtasks: `trout-refresh-data` (hourly), `trout-watchdog` (15 min), `trout-autoupdate` (hourly, runs `Tools\update-trout.ps1`) |
| Public ingress | none (loopback only) | cloudflared tunnel (runs ON this box) |
| Bash | Git-for-Windows on PATH | `C:\ProgramData\TroutSite\Tools\bash.exe` — needs MinGit PATH FIRST (see §5) |
| Node/pnpm | nodejs on PATH; pnpm direct | nodejs on PATH; **pnpm = corepack shim** (`corepack.cmd pnpm`) |

## 2. SSH access to production (the recipe that works)

1. From the dev machine: `ssh -i ~/.ssh/id_ed25519_troutsite_b42 hodge@100.88.209.92` (key authorized 2026-09-29 in `C:\ProgramData\ssh\administrators_authorized_keys` per owner instruction). BatchMode works; no password.
2. **The SSH shell is cmd.exe with a minimal PATH** — `git` is NOT on it. `Tools\bash.exe` **dies silently** if invoked without MinGit's DLLs on PATH first (no msys-2.0.dll in Tools\). The working invocation is the exact recipe from the schtask XML:
   ```powershell
   $env:Path = 'C:\Users\hodge\AppData\Local\Programs\MinGit\usr\bin;C:\Users\hodge\AppData\Local\Programs\MinGit\mingw64\bin;C:\ProgramData\TroutSite\Tools;C:\Program Files\nodejs;' + $env:Path
   & 'C:\ProgramData\TroutSite\Tools\bash.exe' -lc 'cd /c/ProgramData/TroutSite/Current && <command>'
   ```
3. **Quoting across SSH→cmd→powershell→bash is a minefield.** The reliable pattern: write a bash script locally, base64 it, deliver via **encoded PowerShell** (`powershell -NoProfile -EncodedCommand <b64>`, UTF-16LE) that (a) sets the PATH above, (b) uses node to decode the script to `C:/Users/hodge/<name>.sh`, (c) runs it with Tools bash, redirecting output to a log file you then read back with a separate `Get-Content` call. Never trust a complex command that went through cmd quoting — **verify every remote action through an independent channel** (log file, public healthz, stamp file).
4. Useful reads once on: `backups\cron.log` (watchdog+refresh history), `backups\watchdog.status`, `backups\last-good-rev` (deploy stamp — missing = no verified deploy ever), `schtasks /query /tn trout-refresh-data /xml` (the canonical env recipe).

## 3. What went wrong (2026-09-17 → 2026-09-29)

**Timeline:** Sep 17 the server autoupdated to `d1e48d1`; the internal hourly pipeline (seed/gauges/snapshots) began failing silently; conditions/stocking froze while the site kept serving stale-but-verified files. Watchdog WARNED (`stamped=none`) but could not heal (its heal regenerates from on-disk code — same failing pipeline). Sep 28 the evidence merge (`53e7820`) landed via autoupdate; conditions resumed but `assessed:0` (gauges still dying). Sep 29: five deploy attempts, three traps, final green stamped deploy `905bec3` at 03:32Z.

**Root cause 1 — TVA negative-inflow crash (fixed in `a387d0c`).** TVA's predicted-data feed legitimately publishes negative `AverageInflow` (reservoir drawdown). `ReleaseScheduleSchema` requires nonnegative, and `ReleaseScheduleSchema.parse()` sat **outside try/catch** in `conditionsBridge` — one bad row aborted the ENTIRE gauges ingest, every hour, for 12 days. Fix: provider omits negative/non-finite forecast values (missing ≠ fabricated 0); per-monitor validation isolation (degrade to `unavailable` row + warning, keep ingesting); regression test with the exact drawdown payload.

**Root cause 2 — deploy never ingested stocking (fixed in `905bec3`).** The prerender gate refuses to publish when the stocking snapshot is absent ("feeds that would fall back to fixtures: stocking"), but `deploy.sh` only ingested gauges. The production DB's stocking table was empty (nothing schedules the stocking job — its API-internal registry last ran Sep 5), so **every deploy rolled back at the prerender gate no matter how many times it was re-run**. Fix: `deploy.sh` now runs `ingest --job=stocking` between gauges and snapshots (non-fatal on failure).

**Context — the same night's DEV-replica outage (different machine, different causes).** The dev box's pm2 API was crash-looping on `SqliteError: duplicate column name: aliases`: a migration was renamed `008→015` during a merge, but the migration runner tracks applied state **by filename** — the renamed file looked never-applied and re-ran against a DB that already had the columns. Fixed by inserting the `015` ledger row after verifying the columns exist (PRAGMA), then deploying. Same night: the dev `.env` had `USGS_USER_AGENT=… (contact: …)` with unquoted parens, which made `deploy.sh` abort at the source line — **keep .env values shell-quoted; deploys die at line 1 otherwise.**

## 4. The three operational traps (cost: 5 deploy attempts)

1. **Two databases.** `infra/runtime-env.sh`'s `trout_runtime_env <root>` exports `TROUT_DB_PATH=C:\ProgramData\TroutSite\Data\trout.db` — but ONLY when invoked with the installed-checkout root. Any job run via bare `pnpm --filter api …` on the server without sourcing runtime-env **silently creates/writes a decoy DB at `Current\apps\api\data\trout.db`** and production sees nothing. ALWAYS: `source infra/runtime-env.sh && trout_runtime_env /c/ProgramData/TroutSite/Current` before any data job on the server. (The decoy was deleted 2026-09-29; if you ever find it again, something ran env-less.)
2. **deploy.sh self-modification.** Running `bash infra/deploy.sh` from an old checkout means its own `git pull` rewrites the script **under the running bash** — steps added in the pulled version never execute. Worse, a failed deploy's rollback (`git reset --hard START_REV`) puts the OLD script back on disk, so every retry re-enters the trap. **The pattern that works: `git pull --ff-only` FIRST as a separate invocation, confirm the new step is present (`grep -c '<step>' infra/deploy.sh`), THEN run `bash infra/deploy.sh`.**
3. **Bash-under-SSH needs its PATH first** (§2.2) — plus: pnpm is a corepack shim (export the `pnpm(){ corepack.cmd pnpm "$@"; }; export -f pnpm` function in scripts), the first `pnpm install` after a pull shows an interactive "reinstall modules?" prompt that self-answers true non-interactively, and **watchdog log entries timestamped DURING a deploy legitimately show STILL BROKEN** (it heals into the deploy's half-built trees) — judge health only by the first watchdog cycle AFTER a deploy completes (~15 min).

## 5. How to verify a deploy actually happened (checklist)

In order; every item is independently observable:
1. `backups\last-good-rev` exists and equals the deployed SHA (missing = no verified deploy ever ran).
2. `git -C C:\ProgramData\TroutSite\Current rev-parse HEAD` matches (rollback resets this — if it's old, the deploy failed and rolled back).
3. Public `GET /healthz` → `ok:true, degraded:false`, `conditions.ageMinutes` small, `assessed` > 0 (gauges flowing), `records` = 190.
4. `GET /v1/stocking/TN.json` → non-empty array (623 rows at recovery).
5. Next `backups\cron.log` entries: `[watchdog …] OK` and `[refresh …] seed ok` (the hourly task runs only when the stamp guard passes — `stamped=none` there means the stamp is missing again).
6. `watchdog.status` = `OK <timestamp>`.

## 6. Standing rules distilled

- One deploy mechanism: `bash infra/deploy.sh` (rollback-armed, stamps on success). Pull-first (§4.2). Never hand-run its internal steps ad hoc on the server.
- Never rename an applied migration — add a new one, or reconcile `schema_migrations` in the same change (filename-keyed ledger).
- Ship `.env` values shell-quoted; `deploy.sh` sources it with `set -a`.
- The autoupdate task pulls+deploys main hourly on the server; a docs-only commit to main is a safe, normal way to deliver notes to the server itself.
- Any agent operating this host: verify through independent channels before declaring success; the SSH quoting layers mangle complex commands more often than they pass them.
