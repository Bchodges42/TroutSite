# SETUP — one-time steps to get the three sessions running

Do these once, in order, before pasting any session brief from
[`SESSION-BRIEFS-STAGE-1.md`](SESSION-BRIEFS-STAGE-1.md). Every command is safe to
re-run; skip what's already true. Owner-executable, ~30–45 minutes.

## 1. SSH for GitHub pushes

```bash
# Key exists?
ls ~/.ssh/id_ed25519.pub 2>/dev/null && echo HAVE_KEY || ssh-keygen -t ed25519 -C "bhodges"
# Print it, then add it at github.com → Settings → SSH keys (or: gh ssh-key add)
cat ~/.ssh/id_ed25519.pub
# Prove it works:
ssh -T git@github.com        # expect: "Hi <you>!"
```

If `gh` is installed, `gh auth status` should also be green — it makes remote URLs
and merges frictionless.

## 2. Get this folder's doc changes into the real repo

**FIRST: make sure GitHub has your newest code.** The session clones baseline off
`origin/main` — a stale `main` means three stale sessions. On every machine or clone
where Trout work lives (dev laptop, the branch the review targeted, etc.):

```bash
git status                      # anything uncommitted? commit it:
git add -A && git commit -m "sync: pre-stage-1 push"
git push origin main            # and push any working branches:
git push origin <branch-name>   # e.g. the geoqa/statewide-verify line of work
```

Then check github.com: `main`'s latest commit is your newest work, and no working
branch sits unpushed. **If `main` is BEHIND a working branch, merge that branch into
`main` first** (GitHub web, or `git merge` + push locally) — the Stage 1 sessions
start from `origin/main`, so `main` must be the tip of everything.

**Next: bring this folder's doc changes in.** This Downloads folder is NOT a git
repo — the doc set (worklist, execution plan, briefs, review report, rewrites)
exists only here. Move it into git:

```bash
git clone git@github.com:<you>/TroutSite.git ~/Projects/trout-setup
cd ~/Projects/trout-setup
git switch main && git pull origin main
git log --oneline -3            # must match github.com's newest main commits
```

Copy the changed/new files from this folder over the clone, then replicate the
deletions:

```bash
# Changed or new (copy from this folder, same relative paths):
AGENTS.md README.md \
infra/RUNBOOK.md \
docs/INDEX.md docs/KNOWN-ISSUES.md docs/DESIGN.md docs/REVIEW-PROMPT.md \
docs/LOGIC-AUDIT.md docs/EXECUTION-PLAN.md docs/SESSION-BRIEFS-STAGE-1.md docs/SETUP.md \
docs/reports/review-2026-09-11.md \
docs/roads-sources.md docs/lane-results/ui.md \
e2e/lighthouserc.web.cjs apps/marketing/astro.config.mjs

# Deleted — remove in the clone too:
git rm COORDINATION.md PROGRESS.md SESSIONS.md BACKEND-ISSUES.md \
  docs/session-brief-1-atlas-pipeline.md docs/session-brief-2-map-shell-chrome.md \
  docs/session-brief-3-map-rendering-core.md docs/session-brief-4-basemap-complete.md \
  docs/session-brief-5-e2e-hardening.md docs/session-brief-6-final-verification-ship.md \
  docs/SESSION1-HOST-RECOVERY.md docs/integration-report.md docs/integration-checklist.md \
  docs/map-page-remediation-brief-current.md docs/remaining-changes-implementation-guide.md \
  docs/FIELDWORK.md docs/THEMES.md docs/UI-DISCOVERY-REDESIGN.md
```

Commit and push (docs-only changes are allowed on `main` per AGENTS.md rule 4):

```bash
git config user.name "Bhodges42"
git add -A
git commit -m "docs: consolidate docs, worklist (review + logic audits), execution plan, stage-1 briefs"
git push origin main
```

Confirm Actions goes green on `main` (github.com → Actions). If red, STOP — sessions
branch off a green main.

## 3. Cut the three session clones

```bash
cd ~/Projects
for s in a b c; do
  git clone --no-hardlinks ~/Projects/trout-setup trout-session-$s
  cd trout-session-$s
  git config user.name "Bhodges42"
  git switch -c session-$s origin/main
  cd ..
done
```

(If you keep the clones elsewhere, adjust paths — one session = one directory,
never shared.)

## 4. Baseline each session (in each of the three clones)

```bash
cp .env.example .env            # then fill: PORTAL_SECRET, USGS_USER_AGENT (real contact email), SITE_URL
pnpm install
pnpm -r build
pnpm --filter api seed
pnpm --filter api snapshots     # generates gitignored apps/web/public/{v1,content}
pnpm -r test                    # expect: green (524+ tests, 1 artifact-dependent skip is OK)
git push origin session-$s      # establishes the branch + push target on GitHub
```

If the seed/snapshots steps fail on a provider call, retry once later — they need
network; everything else is offline. The session briefs assume this baseline is
green.

## 5. Start the sessions

Open three fresh agent sessions (one per clone — never two in one clone), paste the
matching brief from [`SESSION-BRIEFS-STAGE-1.md`](SESSION-BRIEFS-STAGE-1.md), and
let them run. Track progress by reading each session's report
(`docs/reports/stage1-session-{a,b,c}.md` on their branches) and CI on the branch —
no code reading required. When a session finishes its Stage 1 assignment early, it
keeps going on its overflow items automatically — you never need to nudge it.
