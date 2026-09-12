# EXECUTION-PLAN — running the full worklist with three agent sessions

This document tells the owner and each working session exactly what to do, in what
order, who touches which files, and when to push. All verification is agent-run and
reported; the owner's UI spot-checks are optional, self-scheduled, and never part of
any completion criteria (Appendix). It executes
[`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) (the worklist — item IDs T*/F* live there and
are NOT restated here).

**Plain-English terms used everywhere below:**

- **Session A / B / C** — the three simultaneous agent sessions. Each has its own
  clone, its own branch, and its own slice of files. That slice is the ONLY thing it
  may edit.
- **Stage** — a block of work with a defined finish line. Stages are sized by their
  content, NOT by days or hours. When one stage's checkpoint passes, the next starts
  immediately — even if the last one took three hours. There are five stages.
- **Checkpoint** — the end of a stage: all sessions pushed, an integration branch
  proves the branches fit together, and (at release stages) `main` is merged and
  deployed.
- **Task group** — the unit of pushing. A session finishes a task group, runs its
  checks, pushes. Not per item, not per stage.

**Operating assumptions (owner-confirmed 2026-09-12):** sessions push to GitHub
themselves (no human code review) and are never blocked waiting on owner review;
agent verification is the only gate; conflicts are prevented structurally (file
ownership), not merged away afterwards.

**First run?** Do [`SETUP.md`](SETUP.md) once (SSH, get the doc changes into git,
cut the three session clones, baselines green), then paste the
[`SESSION-BRIEFS-STAGE-1.md`](SESSION-BRIEFS-STAGE-1.md) briefs into three fresh
sessions. Every later stage reuses the same three clones.

## 1. The three sessions and their file ownership

File ownership is ABSOLUTE within a stage. A session that needs a file outside its
slice waits for the stage boundary (or the item is reassigned here). This is what
eliminates "check that all the commits work together" work.

| Session | OWNS (may edit nothing else) |
|---|---|
| **A — server & operations** | `apps/api/**` · `packages/contracts/**` · `infra/**` · `.github/**` · `e2e/api/**`, `e2e/admin/**` |
| **B — build & content** | `packages/content/**` · `apps/web/scripts/**` · `apps/web/public/atlas/**` (regenerated artifacts) · `apps/marketing/**` · `e2e/marketing/**` |
| **C — the web app** | `apps/web/src/**` · `apps/web/vite*.ts` (incl. `vite.shared.ts` SW config) · `e2e/web/**` |

Boundary notes that will otherwise cause fights:

- `apps/web/scripts/` (build/prerender/validators/size-budget) = **Session B**.
  `apps/web/src/` (application code) = **Session C**. The split is `scripts` vs
  `src` — non-negotiable, and it covers every worklist item.
- `packages/contracts` belongs to **Session A**. When contracts change (Stage 2),
  Sessions B and C rebase at the stage boundary — never mid-stage.
- `e2e` splits by suite directory exactly as the sessions do (`web` → C,
  `marketing` → B, `api`/`admin` → A). A fix needing a test in another session's
  suite gets noted in the report; that session adds it next stage.
- Root git hygiene (e.g. untracking the dependency symlinks, T2-46) is Session A's.

## 2. How the sessions run

**The three-session rule:** before each stage starts, its work is split into three
assignments — one per session, from the stage table below. **All three sessions start
together and none ever idles.** Two rules make that work:

1. **No waiting inside a stage.** Sessions never depend on each other's output
   mid-stage — cross-session dependencies exist only at checkpoints. The assignments
   below are already partitioned so this holds.
2. **Finished early? Pull your own next stage.** A session that completes its
   assignment takes its next-stage items (listed as "overflow" per stage) — but ONLY
   items inside its own file slice that don't depend on another session's unsettled
   work. The one hard dependency in the program: Session A's contract design (F1)
   gates the scorer (F4), pipeline (F5), and UI wiring (F6) — those wait for the
   schema to be settled and reported, nothing else does.

**The even-split rule (owner directive, 2026-09-12 — learned in Stage 2, where
Session C carried the e2e debt plus the largest feature while A and B idled):**
stage handouts must be BALANCED. Before pasting any stage brief: estimate each
assignment's weight; if one session holds more than roughly 1.5× another, move
items, split items into smaller task groups, or attach overflow tasks to the
lighter sessions AT HANDOUT TIME — not after they finish. An unbalanced handout is
a coordinator error, not a session problem.

**Protocol (same every stage):**

1. Each session pushes its branch after every task group, once its own checks are
   green (`pnpm -r test` + `pnpm -r build` at minimum; branch CI green before the
   next task group starts).
2. **Integration happens on a scratch branch, never `main`.** At a checkpoint, one
   session merges the three branches into `integration/stage-<n>`, runs the full
   gates (`pnpm -r lint && pnpm validate:content && pnpm -r test && pnpm -r build`
   + the e2e suite), and reports. Conflicts surface here, cheaply.
3. **`main` only moves at release checkpoints** (Stages 1, 3, 4). Agent verification
   green is the standing delegation to merge and deploy — sessions never wait on the
   owner for this. After the merge, every session rebases onto the new `main`, and
   the release session runs `bash infra/verify-site.sh --public` and reports.
4. If a merge to `main` produces a broken deploy, the pipeline's own rollback
   contains it (that is T0-2's whole point); the release session reverts `main`,
   the offending session fixes forward.
5. Every worklist item ships with its regression test (list at the bottom of
   KNOWN-ISSUES.md). A fix without its test isn't done.
6. Blocked >30 minutes → write the blocker in your report, take your next item.
   Do not improvise around another session's file.

## 3. The five stages

Work-defined, not time-defined. Stage 1 may take three hours; Stage 3 may take
three sittings — the content decides, and the three-session rule keeps all sessions
busy throughout.

### Stage 1 — Make it releasable · ends in RELEASE 1

- **Session A:** T0-1 (crash + regression tests), T0-2 (deploy rollback/retry),
  T0-3 (verifier), T1-6 (stale timestamps), T1-10 (health detector), T1-12 (backup
  WAL), T2-45 (proxy limits).
- **Session B:** T0-4 (size-budget redesign + slim), T1-5 (POSIX hatch build),
  T1-8 (prerender fixture fallback), T1-11 (regenerate atlas/topo manifests),
  T1-7 content half (wolf-river-fentress.yaml correction).
- **Session C:** T1-9 (assessed flag on detail page), T1-13..15 (reasons/trend
  leak, badge physiology, ideal-flow empty badge), T1-7 matcher half (county
  disambiguation + captured-row regression fixtures).
- **Overflow:** A → draft the F1 contract ADR (your own file, no dependency);
  B → start F2 species-data research (read-only + draft YAML in your slice);
  C → T2-36/37 (search shortcut, mobile hierarchy — independent UX fixes).
- **AGENT VERIFICATION (reported, pass/fail per line):** crash probe — conditional
  `HEAD` with `If-None-Match` fired twice at every static mount, site alive after
  each; `verify-site.sh --public` green + `backups/watchdog.status` = `OK` after
  deploy; CI `main` shows `size-budget: OK`; every chart region/month fixture
  readable; stocking served from real snapshot data (no fixture rows); detail-page
  status parity test green; the two T1-7 bad cases resolve correctly and the
  controls still do.

### Stage 2 — Coherence + contract + data

- **Session C (owns the visible work):** T1-16 (legend title), T1-17 (hatch tab
  species gate), T1-18+19 (seasonal decision states — the yearRound chip),
  T2-23/24 (filter row, hidden-score sort), T2-29..34 (copy honesty, halo copy,
  remove `?all=1` + default-state setting).
- **Session A:** F1 — contract v2: ADR, `FishabilityScore` + `ActivityOutlook`
  schemas, scorer skeleton (F4) with property tests. **Settles the shape everything
  else consumes; the schema + a plain-language explainer go in the report.**
- **Session B:** F2 — per-species reference data (comfort bands, activity profile,
  spawn thresholds, every value cited) into the content pack + validator
  extensions; begin F3 catalog authoring from the 2026-09-08 TWRA capture.
- **Overflow:** C → T2-38..41; B → continue F3; A → F4 scorer build-out.
- **No release** — branches sit green; the checkpoint is integration + report.

### Stage 3 — Fishability spine · ends in RELEASE 2

- **Session A:** F4 finalize scorer → F5 pipeline emission + health coverage → F8
  (NWS pressure provider, area-level).
- **Session B:** F3 finish catalog species authoring + `validate:content` green for
  the new fields; fixtures regenerated.
- **Session C:** F6 — site-wide Trout/All-fish setting (default Trout), species
  focus picker, map/legend/badges/detail/drawer consuming the new snapshot fields;
  converts the interim neutral presentations.
- **Overflow:** A → F9 spawn model; C → F10 breakdown UI skeleton; B → T2-54
  marketing evidence page.
- **AGENT VERIFICATION:** privacy e2e green (NWS appears only server-side, never in
  browser calls); fishability snapshot fixtures contract-valid; mode setting
  covered by persistence tests.
- **RELEASE:** merge, deploy, verify through the public edge.

### Stage 4 — Activity layer · ends in RELEASE 3

- **Session A:** F9 spawn-state scoring wired into snapshots; pressure trend.
- **Session C:** F10 activity breakdown UI (per-factor rows, sources, confidence
  labels), F11 time-of-day windows, F12's rain context note.
- **Session B:** e2e for the marketing evidence page + content validation for any
  new authored fields.
- **Overflow:** whoever finishes first starts Stage 5 items in their own slice.
- **AGENT VERIFICATION:** spawn-state threshold tests green; pressure trend
  deterministic across identical inputs; grep confirms the main app renders no
  raw-evidence link; marketing suite covers the evidence page.
- **RELEASE:** merge, deploy, verify.

### Stage 5 — Hardening sweep + closeout

- **Session C:** T2-36..41 (remaining UX), T2-20/21 (seasonal stocking frame),
  T2-26 (stockingRecent consumption), T2-27 (report photos), T2-42/43 (offline
  content recovery + chartless notice), T2-44 if present.
- **Session A:** T2-47 (dependency triage), T2-46 (untrack symlinks), restore drill
  (backup → scratch restore → verify recent rows).
- **Session B:** validator gating handoff (A applies the workflow change), remaining
  docs updates.
- **Closeout:** re-run the single-session review prompt
  ([`REVIEW-PROMPT.md`](REVIEW-PROMPT.md)) against the final state — the worklist
  items from the 2026-09-11 review should come back clean; the review session
  updates [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) checkboxes and its report goes to
  the owner.

## Appendix — owner UI look-sees (OPTIONAL, never blocking)

Sessions never wait on these. They exist so the owner can see what changed, on their
own schedule; anything that looks wrong becomes direction to a session.

- **After Stage 1 (Release 1):** site up on the phone; a chart page shows real
  month entries; stocking rows match the TWRA site (spot-check one); no
  "Catalog unavailable."
- **After Stage 2:** a warmwater water shows no trout score or trout language
  anywhere; legend says "Water guide"; no all-waterways toggle; no Default-state
  setting; a winter-only pond in July shows an out-of-season chip.
- **After Stage 3 (Release 2):** Settings has Trout/All-fish (default Trout,
  survives reload); All-fish + species picker recolors the map and reorders lists;
  trout mode still hides trout scores on warmwater water; airplane-mode still
  renders last-known data.
- **After Stage 4 (Release 3):** water detail shows the activity breakdown
  (per-factor rows, source links that open real sources); pressure labeled
  "area pressure"; spawn note on an in-season warmwater water; dawn/dusk windows
  shown; marketing site has the data & sources page.
- **Standing:** Session A's Stage 2 schema explainer — if it doesn't read plainly,
  send it back with "explain simpler."

## Rules every session repeats back before starting

1. File ownership is absolute (Section 1). "It's just one line in their file" is how
   conflicts happen — wait for the stage boundary.
2. Push after every task group, once your own checks are green. Branch CI green
   before the next task group.
3. Never merge to `main` except a release checkpoint under the standing delegation;
   never deploy by hand; production updates only through that pipeline.
4. Every item ships with its regression test. A fix without its test isn't done.
5. Blocked >30 minutes → report it, take your next item (overflow list), keep going.
   Do not improvise around another session's file.
6. Data authored without a citation doesn't ship (F2/F3 especially — write the
   source first; the validators will catch it).
