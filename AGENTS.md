# AGENTS.md — binding rules for every AI session working on Trout

Auto-loaded by agent CLIs (Codex, ZCode, Cursor, ...). If you touch this repository,
**everything below is mandatory** — each rule was earned by a real incident (Sept 2026).

Orientation: [`README.md`](README.md) (what the product is) · [`docs/INDEX.md`](docs/INDEX.md)
(map of all docs) · [`infra/RUNBOOK.md`](infra/RUNBOOK.md) §9 (production self-healing
stack) · [`docs/KNOWN-ISSUES.md`](docs/KNOWN-ISSUES.md) (**the worklist** — every known
issue consolidated and prioritized; check before "discovering" one, update after fixing).

## Session & branch discipline

1. **One session = one clone = one branch = one push target.** Create your OWN clone
   directory (never work inside a clone another session has claimed).

2. **Branch off `origin/main` before changing anything.**
   ```bash
   git fetch origin && git switch -c <session>/<topic> origin/main
   ```
   Never commit to another session's branch, never commit straight to `main`.

3. **Push to the real GitHub remote early and after every meaningful commit.** The
   production server self-deploys from GitHub; work that exists only on a laptop disk is
   invisible to every other session AND to the owner. Derive the push URL from the
   remote instead of hand-typing it:
   ```bash
   url="$(git remote get-url origin)" && git push "git@github.com:$(echo "$url" | sed 's#https://github.com/##')" <branch>
   ```

4. **`main` moves only by the owner** (GitHub web merge or explicit delegation to a
   named session). Code changes ride branches. Docs/coordination edits may go to `main`.

5. **Commit identity:** `git config --global user.name "Bhodges42"` before committing.
   (A stale `Bchodges4242` config once caused days of ownership confusion.)

6. **Foreign changes: STOP and report.** Before editing, check `git log` / `git status`
   for commits or files you did not create — concurrent sessions move fast. Re-read
   files immediately before every edit. If you find work you cannot attribute, do not
   build on it and do not revert it: announce it and wait for a claim.

7. **One CLI agent per host at a time.** If an agent CLI on the production server hits a
   conflict, it must STOP and report; the owner or the originating dev session resolves
   upstream.

## Production host (do not improvise)

- trout.tntechclimb.com is a **separate headless Windows laptop**: app runs as the WinSW
  service `TroutSite` — **no pm2, no crontab**. Scheduling is schtasks
  (`trout-watchdog` 15 min, `trout-refresh-data` hourly, `trout-autoupdate` hourly);
  deploy/restart/heal via `infra/restart-app.sh`, `infra/deploy.sh`,
  `infra/bootstrap-server.sh`. See RUNBOOK §9 for the full self-healing loop.
- The server **self-deploys `main` hourly** and self-heals; never hand-run deploys on it
  unless the owner asks. Alerts reach the owner's phone via ntfy (`backups/push-url.txt`,
  gitignored — the topic is a credential, never commit or quote it).
- Dev machines run the pm2 stack in `infra/pm2/` — **not the same host** as production.

## Reviewing (not building)

For a full-spectrum review (security, privacy, data integrity, accessibility, design,
performance, SEO, cartography, ops), use [`docs/REVIEW-PROMPT.md`](docs/REVIEW-PROMPT.md)
— a paste-ready single-session prompt (no subagents needed). Review sessions
modify nothing except their report under `docs/reports/`.

## Where the incidents came from (one line each)

- **2026-09-08/09 — host data outage** ("Catalog unavailable" on phones): no data
  heartbeat, no persistence/alerting → fixed by RUNBOOK §9 self-heal stack + bundled
  client catalog fallback.
- **2026-09-09 — concurrent-session collision:** an unannounced actor committed four
  commits into a live-fix clone mid-task → rule 6.
- **2026-09-09 — unpushed-branch stall:** server bootstrap waited hours on branches that
  existed only on a local disk → rule 3.
