# Validation — what ran and what passed

Everything below ran on this branch in `trout-project-plan/trout-evidence-impl`
at the final commit. Nothing was weakened to pass.

## Ledger checks

```
node packages/content/scripts/opportunity/verify-ledger.mjs --final
→ 0 errors, 0 warnings
headlines: 58 seasonal / 29 year-round / 55 warmwater / 13 mixed / 35 unresolved
evidence:  138 documented / 18 limited / 3 conflicting / 31 unresolved
```

What it checks: exactly one ledger entry per catalog ID (and no orphans);
catalog↔geometry↔ledger ID agreement; every positive headline carries claims
with source URL + retrieval date; unresolved entries state their missing
proposition; no absolute "no-trout" verdict anywhere in the ledger;
scheduled-vs-completed stocking claim kinds distinct (a `stocking-event`
claim may not cite the schedule); catalog↔ledger headline/state agreement;
no contradictory year-round/season representation; sibling lake/tailwater
pairs must not share one decisive source+pinpoint.

## Package gates

| Gate | Result |
|---|---|
| `pnpm --filter @trout/content validate` | OK — 190 streams, 103 taxa, 155 patterns, warnings are the pre-existing documented-ungauged notices (135, unchanged from main) |
| contracts `vitest run` | **197 passed** (incl. 7 new Opportunity-schema tests) |
| web `vitest run` | **371 passed** (incl. rewritten fallback specs + 7 new ADR-0010 decision tests) |
| api `vitest run` | **237 passed** (incl. migration-count update for 017) |
| `pnpm -r build` | all packages build; **size-budget OK** (install-time set within the 25 MB budget) |
| `pnpm --filter api seed` + `ingest` + `snapshots` | 190 streams, TN stocking 623 events + 151 recent, evidenceWaters 190 |
| `pnpm --filter @trout/web prerender` | **598 route pages** written on real (non-fixture) data |
| typecheck (contracts + web) | clean on this branch |

Known flake: one web timing test (T2-36 search-shortcut) timed out once under
full-fleet CPU load and passes in isolation (13/13) — it passed in the final
full run too.

Pre-existing failures on `main`, verified identical on a clean tree and NOT
introduced here: contracts `tsc` reports 3 strict-null lines in
`scoreFishability.test.ts`; content lint 8 problems; e2e lint 4 problems.

## Visual acceptance gate — 10/10 PASS

Captured with Playwright (Chromium) against the running dev stack at desktop
1280×900 and phone 390×844, then judged page-by-page by the visual-judge
agent. It took five passes — every intermediate failure was a real defect
that got fixed:

| Pass | Verdict | What it caught → what was fixed |
|---|---|---|
| 1 | 0/10 | Opportunity card absent on every surface → root cause: the snapshot pipeline dropped the `opportunity` field (migration 017 + seed/build plumbing). Also caught the **Boone drawer self-contradiction** (year-round tailwater reading "out of season / trout unlikely to be present" in September) → the yearRound:true window is now the stocking calendar, never a presence window. |
| 2 | 0/10 (polish) | Card now renders everywhere with correct content; chip collided with the eyebrow ("FISHERY OPPORTUNITYDOCUMENTED · 2026"); drawer card below the fold on phone → scoped flex CSS + card moved above the assessment in the drawer. |
| 3 | 0/10 (header) | Fish-mode toggle clipped ("Trout"→`t` at 390, "All fish"→`Al` on desktop); search placeholder cut mid-word → header flex fixes. |
| 4 | 0/10 (header) | Toggle fixed on desktop but the privacy tagline left-clipped and the search pill overlapped the toggle on phone → tagline hidden <1440px; header search hidden ≤640px. |
| 5 | **10/10 PASS** | All four required water states clean at both sizes; no regressions. |

The judged pages (all in `evidence-work/shots/`):

| State required by the work order | Water judged | What the card shows |
|---|---|---|
| limited/year-round tailwater | `boone-tailwater` | "Year-round trout opportunity" · DOCUMENTED · 2026 · reach scope · conflicting-calendar caveat · TWRA forecast source link |
| unresolved water | `beech-river` | "Trout status unresolved" · UNRESOLVED · 2026 · what is missing ("no trout fishery is documented… either way") — no presence or absence claim |
| mixed seasonal water | `lake-graham` | "Mixed fishery (warmwater + stocked trout)" · DOCUMENTED · 2026 |
| reservoir | `watauga-lake` | "Year-round trout opportunity" · DOCUMENTED · 2026 |
| (bonus) map drawer | `boone-tailwater` | card first in the drawer, above the conditions assessment |

Also verified in the captures: no fish-absence wording anywhere, drawer and
season box no longer contradict each other, phone layout stacks cleanly with
the full "Trout"/"All fish" labels visible, map canvas renders, no React
error states.

## E2E / offline

The Playwright behavioral suite boots its own servers from built dists; the
offline/privacy contract is untouched by this lane (no new fetches, no bundle
growth beyond authored content — the pack stays at 1.52 MB of the 20 MB
budget). The branch's changes are additive content + presentation, exercised
by the unit/visual layers above. Full `pnpm e2e` was not run to completion in
this session (pre-existing e2e lint failures on main gate the harness); flag
raised here rather than papering over it.
