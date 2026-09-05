# UI discovery & interaction redesign — design rationale

**Lane:** UI/UX redesign (`codex/trout-fieldwork-20260904`)
**Base:** `5648ccc` · **Date:** 2026-09-04

This document is the design rationale for the UI lane: what changed, why, and
which judgment calls were made. The lane report with verification results
lives in [`lane-results/ui.md`](./lane-results/ui.md).

## 1. The interaction model

The map remains the product and the first screen. Everything else on it is a
quiet overlay that appears only when asked for:

```
┌──────────────────────────────────────────────────────────────┐
│ Tennessee waters / Conditions atlas            [≡ controls]  │
│                                                [ TN layers ⌖ ⌕ ] │
│                                                              │
│                    the map — full bleed                       │
│                                                              │
│ [legend · bottom-left, always anchored]            [+/−]     │
└──────────────────────────────────────────────────────────────┘
```

- **One control cluster, top-right** (`MapControlGroup`): Tennessee recenter,
  Layers, Near me, Search. Four 44×44 controls in a single floating group;
  every control has an accessible name, a visible focus state, and a fluid
  CSS tooltip that appears on hover **and** keyboard focus, is never required
  for comprehension, never traps focus, and is suppressed for coarse
  pointers. No tooltip dependency was added — the fluidity (spring-eased
  rise, `cubic-bezier(0.34,1.56,0.64,1)`) is pure CSS on `data-tip`.
- **Near me** requests geolocation only after activation, uses coordinates
  in memory only, and says so in its own status note.
- **The water atlas opens from one path per surface**: the Search control on
  desktop, the always-visible search field on mobile. The old duplicates
  (bottom-left "Browse N waters" toggle, layers-panel browse action, and the
  menu's "Open water atlas" / "Explore waters" / "Browse all waters" entries)
  are gone. `/browse` remains as the accessible no-map fallback page.
- **Escape hierarchy**: app menu → layers panel → inspector → atlas. The
  layers panel defers Escape to the app menu when it is open; focus returns
  to the Layers control when the panel closes — and only then (the group
  never steals focus on first load).
- **Legend stays anchored bottom-left**, never occupying layout space. Its
  title names the metric honestly per mode (see §4).

## 2. Map presentation — one water system

`mapStyle.ts` now renders every river line in three registers:

1. **Casing** (paper-tone halo) — unchanged semantics: bends read against the
   ground; selection turns it amber, hover inks it.
2. **Water corridor** (`rivers-base`, new) — a solid, muted water-colored
   line under EVERY river, derived at style-build time as a 50/50 mix of the
   theme's `lakeFill` and `water` tokens, so lines and still-water polygons
   read as one hydrography system in both themes. It is visible whether or
   not a water is assessed; selection, hover, dimmed, hidden, and hatch
   states all carry through it.
3. **Condition centerline** (`rivers-interior`) — narrower (1.9 vs 3.2) and
   drawn only for assessed waters. Unavailable data never renders as a
   condition.

Unassessed lines keep dashed semantics via two layers that crossfade with
zoom (zoom expressions stay top-level per MapLibre's validator):

- `rivers-unassessed-quiet` — tight, quiet dash at state zoom so forks and
  multipart segments read as one cohesive river;
- `rivers-unassessed` — a clearer dash that fades in at regional/local zoom
  where the honest "no condition here" signal matters.

Because dashes sit on the solid corridor, dash gaps can never align with
segment boundaries into apparent breaks — the water is continuous even where
the assessment is not.

Polygon hierarchy is unchanged and re-verified: still-water polygons keep
their base water below the condition wash; rivers crossing reservoirs remain
directly selectable; no water layer sits above boundaries or labels.

## 3. Discovery pages — search first, disclose progressively

`/conditions` and `/stocking` no longer open the entire catalog:

- **Conditions** opens with a search field, a Near-me activation, and two
  small strips — "Tailwaters now" (major gauged tailwaters, best score
  first) and "Recently observed" (freshest gauge observations). Searching
  shows capped matches; the full catalog never appears unprompted. `?q=`
  is a shareable deep link; `/conditions/:streamId` deep links and history
  are untouched.
- **Stocking** opens with a search field and the six newest published
  entries; "Browse the full schedule" is the single explicit control before
  the complete list appears. Search matches water names, species keywords,
  and counties; the county/species/window filters keep their URL params.
- Every stocking entry carries a **data state**: `Reported completed`
  (past-dated published entry — not field-verified), `Scheduled` (a plan),
  and precision labels (`week of …`, `Month window`) so a week never
  masquerades as a day. Conditions rows separate observed (`Observed 12
  min ago`) from cached (`No cached readings yet`) data, with the existing
  FreshnessChip carrying live/stale/offline semantics on detail pages.
- The water detail page gained a **Stocking history** section fed by the
  same canonical matcher the map uses, with the same data-state labels and
  a "never cached indefinitely" provenance note.

## 4. Species modes and the metric label

The filter/metric UI consumes a `WaterDecisionView` view model
(`features/map/waterDecision.ts`). The type is the exact shape Session 3
will supply; the function that fills it today is a **clearly-labeled
compatibility adapter** over current catalog data. It implements no seasonal
or species logic: warmwater waters are `not-trout` and render `unassessed`
(never the trout score as generic fishability), assessed trout waters are
`trout-condition`, everything else is honestly unknown.

- Trout mode: the legend is titled **"Trout conditions"**.
- All-fish mode: the legend is titled **"Water guide"** and scopes its bands
  — "Good/Fair/Poor · trout waters", "Warmwater · no trout score",
  "Unassessed" — with matching help copy. No generic "fishability" claim is
  made anywhere.

## 5. Fishing information & regulations

- In-app route **`/fishing-info`** (alias **`/regulations`**), organized as
  eight common questions: license, seasons, trout rules, special-regulation
  waters, stocking terminology, access, safety, official links. Every
  regulatory claim links an official source (`tn.gov/twra`,
  `license.gooutdoorstennessee.com`, USGS, TVA) with explicit effective-date
  language and a reviewed date. The page promises no legal completeness and
  caches nothing.
- **Routing note:** the route table (`App.tsx`) is outside this lane's
  ownership, so the two paths register as shell aliases in `AppShell.tsx`
  (the shell renders the page in place of the outlet). Integration can move
  them into `App.tsx` as normal routes without any other change.
- Crawlable marketing mirrors live at `/fishing/tennessee/` and
  `/regulations/tennessee/` with canonical titles/descriptions, FAQ JSON-LD,
  links back to the app (`/install/`) and to each other.

## 6. Judgment calls

1. **Bottom-left index toggle removed.** The search control is the atlas'
   single path; the anchored legend stays. `/browse` and the accessible
   fallback remain.
2. **Menu slimmed to real destinations.** "Open water atlas" and "Explore
   waters" duplicated the atlas; "Browse all waters" duplicated `/browse`.
   The primary "Explore waters" nav link is preserved.
3. **Selection pop preserved.** On selection the corridor hides so the amber
   casing + condition color read exactly as before the corridor existed.
4. **Stale e2e expectations updated with the data.** The catalog grew from
   105 to 128 waters and 13 to 28 labeled still waters in merged backend
   work; the fieldwork spec now asserts the current reality. The West TN
   tap test selects via the still-water label — with real polygon geometry
   a neighboring line river can legitimately win a raw coordinate tap at
   state zoom (nearest-centerline selection is the designed behavior).
5. **Search dropdown no longer opens on empty focus.** The auto-focused
   atlas search used to drop a 30-row result sheet over the filter chips;
   it now opens on typing or ArrowDown only.
6. **Sitemap follow-up.** `apps/marketing/src/pages/sitemap.xml.ts` is not
   in this lane's ownership; the two new marketing routes need one-line
   entries there at integration.
