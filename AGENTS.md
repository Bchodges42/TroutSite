# AGENTS.md — binding rules for every AI session working on Trout

This file is auto-loaded by agent CLIs (Codex, ZCode, Cursor, ...). If you are an
agent about to touch this repository, **everything below is mandatory**, not advice.
It exists because every rule here was learned from a real incident in September 2026.

Living coordination state: [`COORDINATION.md`](COORDINATION.md) · status history:
[`PROGRESS.md`](PROGRESS.md) · ops bible: [`infra/RUNBOOK.md`](infra/RUNBOOK.md)
(§9 = self-healing production stack).

## Session & branch discipline (mandatory)

1. **One lane = one clone = one branch = one push target.** Create your OWN clone
   directory (never work inside a clone another session has claimed) and announce
   its path on the session bridge before your first edit.

2. **Branch off `origin/main` before changing anything.**
   ```bash
   git fetch origin && git switch -c <lane>/<topic> origin/main
   ```
   Examples: `fix/live-catalog`, `infra/host-selfheal`. Never commit to another
   lane's branch, never commit straight to `main`.

3. **Push to the real GitHub remote early and after every meaningful commit.**
   The production server self-deploys from GitHub; work that exists only on some
   laptop's disk is invisible to every other session AND to the owner — a server
   bootstrap once stalled for hours because fix branches were never pushed.
   Derive the push URL from the remote instead of hand-typing it (a typo'd
   owner name caused a long "Repository not found" detour):
   ```bash
   url="$(git remote get-url origin)" && git push "git@github.com:$(echo "$url" | sed 's#https://github.com/##')" <branch>
   ```

4. **`main` moves only by the owner** (GitHub web merge or explicit delegation to a
   named session). Code changes ride branches. Docs/coordination edits may go to
   `main` directly.

5. **Commit identity:** run `git config --global user.name "Bhodges42"` before
   committing. Commits authored as `Bchodges4242` caused days of ownership confusion
   (that was a stale local config, not a second person).

6. **Foreign changes: STOP and report.** Before editing, check `git log` / `git
   status` for commits or uncommitted files you did not create — concurrent sessions
   move fast. Re-read files immediately before every edit. If you find work you
   cannot attribute, do not build on it, do not revert it: announce it on the bridge
   and wait for a claim.

7. **One CLI agent per host at a time.** If an agent CLI on the production server
   hits a conflict, it must STOP and report (that gate has already saved the site
   once); the owner or the originating dev session resolves upstream.

## Production host (do not improvise here)

- trout.tntechclimb.com is a **separate headless Windows laptop**: app runs as the
  WinSW service `TroutSite` — **no pm2, no crontab**. Scheduling is schtasks
  (`trout-watchdog` 15 min, `trout-refresh-data` hourly, `trout-autoupdate` hourly);
  deploy/restart/heal via `infra/restart-app.sh`, `infra/deploy.sh`,
  `infra/bootstrap-server.sh`. See RUNBOOK §9 for the full self-healing loop.
- The server **self-deploys `main` hourly** and self-heals; never hand-run deploys
  on it unless the owner asks. Alerts go to the owner's phone via ntfy
  (`backups/push-url.txt`).
- The dev machine (where sessions like you were spawned) has its own pm2 stack —
  **do not confuse the two hosts**, they serve different purposes.

## Incidents these rules come from

- **2026-09-08/09 — host data outage → "Catalog unavailable" on phones.** Root
  cause: no data heartbeat on the server + no persistence/alerting. Fixed by the
  RUNBOOK §9 self-heal stack + the bundled client catalog (`useStreamsCatalog`).
- **2026-09-09 — concurrent-session collision.** An unannounced actor committed
  four commits into the live-fix clone mid-task (one broken). Rule 6 exists because
  of this; unification and repair landed as `fix/live-catalog` + `infra/host-selfheal`.
- **2026-09-09 — unpushed-branch stall.** The server bootstrap waited on branches
  that existed only on a local disk. Rule 3 exists because of this.
