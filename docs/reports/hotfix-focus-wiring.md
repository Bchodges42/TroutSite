# Hotfix — focus wiring (FishabilityCard unreachable)

Base SHA: e582abb84c9c603dff6489286ebbdc1227faa01f (origin/main)
Branch: session-c-focusfix · head 1ff7e8e (+ focus-wiring commits) · pushed.

## Status

**Code complete and verified; final merge to main BLOCKED by host load** (see
Verification). The FishabilityCard is now reachable without URL params, with a
species picker, settings persistence, and a shareable URL override — exactly
as specified. Unit suite green (36 files / 315 tests, +5 for this hotfix);
fishability e2e extended 4→7 specs, all green. Full-suite e2e: 99–101 of 101
pass, but a rotating set of load-induced timing failures (see below) prevents
an honest all-green declaration while the host sits at load 9–12.

## Fix (per the brief, in priority order)

1. **Persisted species focus, real this time.** `settings.speciesFocus`
   (typed `string`; `''` = auto) is wired end-to-end. In all-fish mode the
   FishabilityCard renders a species picker in its header (options = the
   water's `snap.bySpecies` keys); choosing persists to
   `settings.speciesFocus` via the settings context, and replaces any
   `?focus=` override so the URL stays shareable.
2. **Focus resolution order: URL → setting → first carried species.**
   `?focus=` wins (shareable links), then the persisted setting, then the
   first species the snapshot actually carries — the card shows something
   useful immediately, never nothing. A preferred species this water doesn't
   carry falls back to a carried one (per-water honesty; the setting stays
   until changed). The compact card in the drawer is the same component, so
   the fix covers RiverDrawer too.
3. **Settings page:** a "Fishability species" select next to the fish-mode
   control, visible only in all-fish mode (auto/'' plus all seven species
   keys).

## Tests

- `fishability-focus-wiring.test.tsx` (5 cases): renders with NO URL param
  defaulting to the first carried species; trout-mode renders nothing; picker
  swap updates the card AND persists to Dexie; `?focus=` override wins; a
  persisted species the water lacks falls back to a carried species.
- `e2e/web/fishability.spec.ts` extended 4→7 specs: card renders on a
  targetSpecies water with settings-only (no URL param); picker swap changes
  the displayed species and survives reload; Settings select appears only in
  all-fish mode. All 7 green.

## Verification

- typecheck **PASS** · web unit **315/315 (36 files)** · `pnpm -r build`
  **PASS** · `e2e/web/fishability.spec.ts` **7/7**.
- Full `pnpm e2e`: **99–101 of 101 pass**, but NOT stable green right now —
  see the blocker.

## Blocker — full e2e nondeterministic under host load (merge deferred)

The host has run at load average 8–13 for hours (vs ~4 when suites complete
in ~4 min; recent full runs took 10–13.5 min). Evidence that the residue is
environmental, not code:

- The failing SET rotates randomly run-to-run: run 1 → 6 failures (incl.
  offline-cold-start, privacy /shops); run 2 → different 5; run 3 → different
  7; run 4 → different 5. No test fails twice in the same way.
- ALL failing tests pass in isolation immediately after (verified for every
  run, most recently all 7 of the last run's failures in one isolated batch,
  7/7 green).
- Failure durations cluster at 7–14s — timing/timeout deaths, not assertion
  failures; unit + fishability + all other projects stay green throughout.

Per the blocked-protocol the merge is DEFERRED, not abandoned: when host load
returns to ~4, rerun `pnpm e2e` on this branch (head 1ff7e8e + focus commits,
all pushed) and ff-merge to main on green. No code changes should be needed.

Cherry-pick note: commit 7c7db99 (the T2-26/27 hotfix: same-origin report
photo + TN-recent fixture + privacy wording) was cherry-picked onto this
branch because the full-suite gate ran into the T2-26/27 regressions that the
session-c-hotfix branch fixes; integrating that branch later will be a no-op
for those paths (identical changes).
