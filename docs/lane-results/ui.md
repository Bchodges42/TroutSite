# UI lane report — discovery & interaction redesign

**Lane:** UI/UX redesign · **Branch:** `codex/trout-fieldwork-20260904`
**BASE_SHA:** `5648ccc` · **Commit:** see git log (single commit on top of base)
**Design rationale:** [`../UI-DISCOVERY-REDESIGN.md`](../UI-DISCOVERY-REDESIGN.md)

## Scope delivered

| Area | Change |
|---|---|
| Map presentation | Continuous water corridor under every line (`rivers-base`), narrower assessed-only condition centerline, zoom-crossfading unassessed dashes (quiet at state zoom, clear at local zoom); selected/hover/dimmed/hidden/hatch states preserved; polygon hierarchy unchanged. |
| Controls | One top-right `MapControlGroup` (Tennessee / Layers / Near me / Search), 44×44 targets, accessible names, CSS fluid tooltips on hover+focus (coarse pointers excluded, reduced-motion safe). |
| Legend | Anchored bottom-left; "Trout conditions" in trout mode; "Water guide" with scoped bands + "Warmwater · no trout score" in all-fish mode. |
| Navigation | Menu deduplicated (no "Open water atlas" / "Explore waters" / "Browse all waters" entries); single atlas path per surface; primary "Explore waters" nav preserved; Escape hierarchy menu → layers → inspector → atlas; focus returned on close (and only then). |
| Conditions | Search-first: search field, Near me, "Tailwaters now" + "Recently observed" strips, capped search results, `?q=` deep link; full catalog never auto-opens. |
| Stocking | Search-first: search (water/species/county keywords), six newest entries preview, explicit "Browse the full schedule", data states (`Reported completed` / `Scheduled` / `Week of` / `Month window`), URL filters preserved. |
| Water detail | New Stocking history section (canonical matcher, data states, precision labels, provenance note). |
| Metric model | `WaterDecisionView` type + clearly-labeled compatibility adapter (`features/map/waterDecision.ts`); no seasonal/species logic implemented. |
| Fishing info | `/fishing-info` (+ `/regulations` alias) with eight question sections, official sources + effective dates for every claim, no-completeness disclaimer. Registered as shell aliases (route table `App.tsx` is outside lane ownership). |
| Marketing | `/fishing/tennessee/` + `/regulations/tennessee/` crawlable mirrors (canonical meta, FAQ JSON-LD, links back to the app). |
| Search fix | Auto-focused atlas search no longer drops an empty-query result sheet over the filter chips. |

## Files changed (all within lane ownership)

Modified: `apps/web/src/components/icons.tsx`, `components/layout/AppShell.tsx`,
`features/map/{RiverMapPage,RiverSearch,mapStyle}.ts(x)`, `index.css`,
`pages/{Conditions,Stocking,StreamDetail}Page.tsx`, `test/fieldwork.test.tsx`,
`e2e/fieldwork/ui.spec.ts`.
Note: `TennesseeMap.tsx` was NOT modified — its feature-state contract already
covered the corridor model; it stayed in the lane-lead-only set untouched.

## Verification results

| Check | Result |
|---|---|
| `pnpm --filter @trout/web typecheck` | PASS |
| Unit tests (`pnpm --filter @trout/web test`) | PASS — 122/122 (89 baseline + 33 new) |
| Production build + size budget | PASS — dist 5.21 MB / 25 MB limit |
| Marketing build | PASS — 29 pages incl. 2 new |
| Fieldwork e2e (`playwright --config fieldwork.config.ts`) | PASS — 28/28 |
| Viewports | 320 / 390 / 768 / 1440 exercised via e2e responsive tests + screenshots (`artifacts/ui-redesign/{before,after}-shots/`) |
| Keyboard/tooltips | e2e: tooltip opacity on hover & focus, no trap, focus restoration; Escape hierarchy covered |
| Touch geometry | e2e 44×44 fab assertions + touch polygon selection tests |
| Tennessee recenter | e2e zoom-reset test |
| Trout/all-fish terminology | e2e legend test + adapter unit tests |
| Low-zoom dash cohesion (Daybreak + Nightfall) | unit style assertions + `map-{daybreak,nightfall}-1440.png` |
| Nightfall East TN rectangle regression | e2e pixel test PASS |
| Deep-linked water camera | e2e history/camera tests PASS |

### Pre-existing (not this lane)

- Canonical `e2e/web` suite: **9 failures at BASE_SHA** (before any lane change) —
  `shell.spec.ts`, `atlas-verify.spec.ts`, `conditions-fixtures.spec.ts` (×2),
  `offline-cold-start.spec.ts`, `privacy.spec.ts` (×1 of 3) encode the pre-fieldwork app
  (old menu labels, old 105-water catalog, pre-B05 stocking names). Not editable in this lane;
  they need a refresh pass at integration.

## Judgment calls & follow-ups

1. Bottom-left index toggle removed (Search is the atlas path); `/browse` kept as fallback.
2. Fishing-info route registered as a shell alias in `AppShell.tsx` — move to `App.tsx` at integration if desired.
3. `sitemap.xml.ts` (not owned) needs one-line entries for `/fishing/tennessee/` and `/regulations/tennessee/`.
4. Session 3 replaces the adapter in `waterDecision.ts` with the real decision model.
5. e2e/web spec refresh recommended at integration (stale labels/counts listed above).

## Session A follow-up (2026-09-04, post-lane integration pass)

- Removed the obsolete topo masking layers (`terrain-outside-mask`, states-context
  reordering) — the merged TOPO assets are TN-clipped; unit test replaced with an
  assertion that the masking machinery is gone, the East-TN pixel e2e stays as the
  runtime regression.
- Wired optional road layers (B12) behind `/atlas/roads/manifest.json`: no files →
  no layers, no attribution claim; files → one quiet zoom-gated line layer per
  entry beneath all water, themed via `--map-road`, attribution control added only
  when roads exist. A stub manifest ships so pre-delivery builds never 404.
- Registered `/fishing-info` + `/regulations` as real routes in `App.tsx` (shell
  alias removed); fishing-info sets `document.title`.
- Marketing: the two guide routes joined `sitemap.xml.ts` and the site nav/footer.
- Owner decisions applied to the adapter: a warmwater water WITH a stocking
  program (harpeth-river, December trout stocking) stays visible but de-emphasized
  in trout mode; warmwater never wears a trout assessment on the map (no
  condition centerline, no hatch halo, bronze corridor).
- Refreshed the 9 stale canonical `e2e/web` specs (pre-existing failures at base)
  to the current app + integrated data; 28/28 green. Spec changes were data-driven:
  real catalog names, search-first conditions/stocking flows, current menu labels,
  tab display names, `summary` role semantics, and the corrected BWO score (6/8,
  tails 2 → 3 in the real pack).
- Product fix found by the refreshed offline spec: the online warm-up never cached
  the content pack, so the offline hatch key could not rank on a brand-new install
  (TanStack pauses retries while offline). ConditionsPage now warms the pack —
  the app's own "open once while online" promise holds. Follow-up for the backend
  lane: `fetchSnapshot`'s offline path could try the service-worker cache before
  failing (B03-adjacent recommendation).
- Results: unit 124/124, fieldwork e2e 28/28, canonical web e2e 28/28,
  marketing e2e 14/14, build + size budget green (5.17 MB / 25 MB).
