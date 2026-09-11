# Session Brief 5 — E2E Hardening (deterministic suite)

_Role: QA engineer. **Wave 2 — runs after Waves 1 AND Session 4** (Session 4
is complete and merged: basemap switcher + 19 MB runtime-cached Topo data are
in the tree; see the state note below). Details live in
`docs/remaining-changes-implementation-guide.md` (the "master guide"); read
§0 (Ground rules) first._

> **State note (updated after Session 4 landed):** the tree now includes the
> basemap feature. Consequences for this session: your globalSetup fixture
> build compiles the topo-inclusive tree (fine — `size-budget.mjs` prints a
> separate `topo (runtime-cached, not precached)` line and the precache gate
> is unchanged); all Playwright contexts are fresh, so localStorage is empty
> and every capture renders the **Paper** default — basemap never interferes
> with assertions; and Session 3's `data-map-ready`/`data-map-failed` flags
> are in `TennesseeMap.tsx`, which is what Task 7 waits on.

## Mission

Make the web e2e suite deterministic and honest: a failing map must never pass
a test, the suite runs serialized (parallel MapLibre WebGL + service-worker
installs starve budgets on this class of machine), and the canonical web-only
command exists so nobody re-discovers the `--`-mangling foot-gun.

## Wave-2 protocol

- You own the first full build of the merged Wave-1 tree. Your Playwright run
  (globalSetup → `build:fixtures`) is that build — expect a few minutes.
- Session 4 is already merged (see state note above); your suite assertions
  are unaffected — it added no specs (still 28 tests in 7 files). Do sanity-
  check in the gate that the four atlas captures render the **Paper** default
  variant, not Ink/Topo (they must: fresh contexts have empty localStorage).
- Browser use: Playwright manages its own browser inside the suite. For the
  screenshot review you may drive Browser Use yourself (main agent only —
  your subagents cannot; have them paste files, you look at them).

## Critical rules

- Never reset/checkout/stash/discard the working tree — it contains Wave-1
  work (and possibly Session 4's). Touch only your ownership list.
- `rivers.geojson` byte-identical; EFS values intact.
- Do not commit (gated in Session 6).
- If a test fails because of *app* behavior (not the suite), report it back —
  do not edit app code; the fix belongs to the owning session.

## Scope — master guide tasks, in order

| # | Task | One-liner | Files |
|---|---|---|---|
| 1 | **7** | Rewrite `waitForMap` to wait on `data-map-ready`/`data-map-failed` (Session 3's flags are in the tree); add 1440×900 viewport to the desktop test | `e2e/web/atlas-verify.spec.ts` |
| 2 | **8** | `workers: 1` + rationale comment in the config; `e2e:web` alias in root package.json (`pnpm --filter @trout/e2e exec playwright test --project=web`) | `e2e/playwright.config.ts`, root `package.json` |

## File ownership (hard boundary)

**May touch:** `e2e/web/atlas-verify.spec.ts`, `e2e/playwright.config.ts`,
root `package.json` (the one `e2e:web` script line).

**Must NOT touch:** any other spec (`shell.spec.ts` and
`offline-cold-start.spec.ts` are Session 2's), any `apps/web/src/**` or
`apps/web/scripts/**` or `public/**` (owning sessions), `apps/web/package.json`.

## Working style — subagents (glm-5.3-flash)

This session's edits are small — do them all yourself: Task 8 is a config
block plus one script line, and Task 7's `waitForMap` rewrite is the judgment
core of the session; neither is subagent work. Use an agent only for the
long-running legwork:

- **You (main chat):** Task 7, Task 8, every green/red decision, the
  screenshot review, the handoff numbers.
- **Subagent (optional but useful) — suite runner:** invoke `pnpm e2e:web`,
  let the globalSetup fixture build run, paste the full output (and trace
  paths on failure). Long wall-clock, zero judgment — exactly what an agent
  is for.

## Session gate

```bash
cd /c/Users/Benjamin/Projects/trout
pnpm e2e:web --list 2>&1 | tail -2   # Total: 28 tests in 7 files (25 + 3 shell)
pnpm e2e:web                          # 28 passed at workers=1
```

Then inspect the four fresh `e2e/test-results/atlas-*.png` screenshots
YOURSELF: none may show the map-failure banner at any viewport (that was the
original blind spot — the rewritten `waitForMap` is what proves the fix);
desktop capture is now 1440×900; tablet 1024×768 and mobile 390×844 show
correct selection; `PANEL {"found":true…}` and `TABLET overflowX=0` in output.
(If Session 4 already ran, also sanity-check Paper is the default variant in
the captures.)

## Handoff to Session 6

Report: verified totals (28/7) for Appendix A; the four screenshot filenames
+ timestamps; any flake observed even once at workers=1 (with trace path).
If Session 4 has NOT run yet, say so explicitly — Session 6's final pass must
re-run the suite after Session 4 lands.

## Stop conditions

- Any test fails twice at `--workers=1` → capture the trace
  (`npx playwright show-trace …`), report; never widen timeouts to force green.
- Screenshots still show the failure banner after Task 7 → Session 3's flags
  are missing/broken → report back to that session; do not re-add fixed sleeps.
- `--list` total ≠ 28 → a spec was added/removed somewhere; reconcile with the
  session briefs before running.
