# LOGIC-AUDIT — product-logic coherence review (2026-09-12)

> **Worklist note:** the actionable, deduplicated, prioritized version of everything
> below now lives in [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) (item IDs `LOGIC-n` /
> `T*-*`). This file is the evidence appendix — per-item file:line, reasoning, and
> verified-coherent lists. Work from the worklist; consult here for the why.

Question: does every feature react correctly to water type, species, season, conditions
state, and settings? The answer today is "the map mostly does; everything else leaks."
The map's decision model (`features/map/waterDecision.ts`) is principled — but it is the
ONLY consumer of species context on most surfaces, and several data fields that exist
precisely to drive context-aware behavior are read by nothing. Each item lists evidence,
impact, and the decision or fix required.

## Class 1 — The trout model leaks onto non-trout waters

The scorer (`packages/contracts/src/scoreConditions.ts`) is a TROUT model by design
(6–20°C band, >24°C "dangerously warm — avoid stressing trout"). The map hides it
correctly; other surfaces don't.

1. **Detail page renders trout-score reasons on warmwater/unverified waters.**
   `StreamDetailPage.tsx:149-171` gates the ScorePill on `species === 'trout'` and the
   headline says "Warmwater — trout model does not apply" — but then renders
   `snapshot.score.reasons` unconditionally, so a bass pond with a gauge shows
   "Water temperature 26°C is dangerously warm — avoid stressing trout." The trend
   label (`TREND_LABEL`, line 163) has the same leak: it trends the hidden trout score.
   Fix: gate reasons + trend on the decision model, and for non-trout waters show raw
   readings with neutral framing.

2. **The scorer scores warmwater waters at all.** Every catalog water with a monitor
   gets a trout ConditionSnapshot (build path scores all monitored streams). Every
   consumer must therefore remember to suppress it. Decide the product question:
   (a) keep trout-score-only and guarantee suppression at the source (drop scoring for
   `species: warmwater` in the snapshot build), or (b) add a generic fishability metric
   to the pipeline (contract change). `waterDecision.ts` already reserves
   `displayMetric: 'fishability'` and `fishability: undefined` for this — the field
   exists, no data feeds it.

3. **Trout physiology baked into shared status functions.**
   `StreamDetailPage.tsx:408-412` — `statusForTemp`: 6–20°C good, <2 or >24 poor. This
   colors the temp badge on every water regardless of species; 26°C on a summer pond
   reads "poor" (red) when for warmwater fish it's excellent. Same for
   `statusForFlow`/`idealFlow` coloring. Fix: color only when a species model applies;
   neutral otherwise.

4. **Ideal-flow badge renders a nonsense empty value on ponds.**
   `StreamDetailPage.tsx:193-199` renders `idealFlow.map(...).join(', ') + ' cfs'`;
   winter ponds carry `idealFlow: []` (verified in `beech-lake.yaml`), producing a
   badge whose value is literally " cfs". Guard the empty array.

5. **Legend title says "Fishability" — breaking a settled rule.**
   `MapLegend.tsx:87`: `panelTitle = grouping ? 'Water guide' : 'Fishability'`. The
   design canon (`docs/DESIGN.md`) says: trout mode → "Trout conditions", all-fish →
   "Water guide", and "no generic fishability claim is made anywhere." The `species`
   prop is received but used only for extra rows (line 136, 153), never the title.
   Fix: title from species mode; retire the "Fishability" word until a real metric
   exists.

6. **Hatch guidance has no species/season frame on non-trout waters.**
   `RiverDrawer.tsx:398-457` — HatchTab shows "{{month}} hatch outlook" with expected
   activity and a "Match this water" hatch-key CTA for ANY water with a chart, including
   warmwater ponds and unverified waters. For a West TN pond in July the regional chart
   yields "Expected activity: trace (1/5)" midge entries with zero context that the
   stocked trout are gone. Decide: suppress hatch tab for `not-trout` waters; for
   seasonal waters tie it to `yearRound`/season (Class 2).

## Class 2 — Seasonal applicability: the data exists, no UI reads it

7. **`yearRound` is dead data.** It's in the contract
   (`packages/contracts/src/schemas/stream.ts:33`) and authored honestly
   (`beech-lake.yaml`: `yearRound: false` + notes "stocked in the cold months only —
   the fish do not hold over summer") — and consumed by ZERO UI code. This is the
   biggest coherence hole in the product: a user opening Beech Lake in July gets a
   hatch outlook, a hatch-key CTA, last winter's stocking history, and no structured
   signal that the fishery is seasonal.

8. **The decision model has seasonal states it never produces.**
   `waterDecision.ts:14-20` defines `seasonal-uncertain` and `seasonal-likely-absent`
   applicability — but `toWaterDecisionView` (lines 66-72) can only return
   `not-trout | unknown | confirmed-current`. The type anticipated month-aware
   applicability; the adapter never implemented it. Fix: combine `species`, `yearRound`,
   and the selected month to produce `seasonal-likely-absent` (e.g. a `yearRound:false`
   trout water outside its stocking window) and surface it as a first-class chip
   ("Winter program — out of season") on map, drawer, detail, and lists.

9. **Stocking presentation ignores season.** The 90-day recency window naturally ages
   out winter rows, but full-history view and the drawer's matched event show winter
   rows on a July visit with no "this is the winter program" frame. Tie to `yearRound`.

## Class 3 — Species mode is half a concept

10. **Species mode exists only on the map.** It's a URL param (`?species=`,
    `RiverMapPage.tsx:36`), not a setting (`SettingsPage` has theme, temp unit, default
    state — no species preference). ConditionsPage, BrowsePage, StockingPage,
    HatchChartsPage, HatchKey, Logbook, and Shops never hear about it. So "all-fish
    mode" silently reverts to trout-everywhere the moment the user leaves the map.
    Decide: either a real site-wide setting every surface honors (conditions list
    filters/labels, browse defaults, stocking default filter) or demote the map toggle
    to what it literally is — a map filter.

11. **The "Trout waters" chip conflates two filters.** `RiverMapPage.tsx:356` —
    `aria-pressed={species === 'trout' && !assessedOnly}` and clicking it resets BOTH
    `species` and `assessed`. A user who wants assessed-only trout waters, or warmwater
    assessed-only, can't express it. Rework the filter row as independent dimensions.

12. **Conditions list orders by a hidden score.** `ConditionsPage.tsx:130` sorts rows
    by `snapshot.score.value` even for rows where the score is never displayed
    (non-trout species show status text instead — line 376). Rows reorder by a number
    the user can't see. Sort by displayed state, or exclude non-trout from
    score-ordered sections.

## Class 4 — Features that should react to state/context but don't

13. **Freshness implies fishability.** The FreshnessChip on detail/drawer reads
    "Live · observed" for any monitored water — including warmwater waters where no
    conditions metric is shown. What's live is the gauge, not a fishability assessment.
    Reword for non-trout waters ("Gauge live · observed").

14. **Near-me and search mix everything with no species awareness.**
    `ConditionsPage.tsx:153-157` nearest-first list and `matchRows` search results are
    species-blind; in a trout-first product the nearest water being a warmwater pond
    with no trout metric is a confusing top result. At minimum badge them; better, let
    the site-wide species mode (item 10) filter them.

15. **The "Default state" setting is vestigial.** `SettingsPage` still offers a default
    state selector from the pre-pivot TX/OK/AR era; the catalog is Tennessee-only.
    Remove or hide it. *(Corrected in pass 2 — item 27: it is worse than vestigial;
    the setting actively filters live pages and can silently empty them.)*

16. **`?all=1` show-all-waterways (REMOVED per owner decision).** A full-state
    every-feature view (`useMapState.ts:16`, `RiverMapPage.tsx:39`,664,
    `TennesseeMap.tsx:64-66,159,351`) that bypasses the decision model's visibility
    logic entirely. The catalog now covers the state; the toggle exists to debug the
    era when whole regions were blank. Remove the param, the prop, and the map QA
    shortcut; keep `?qa=1` (it's the geometry audit, a different thing) but consider
    moving it under an explicit dev flag.

17. **Offline fallback copy promises unstructured rescue.** Drawer copy for
    unverified-species waters says "check the fishery notes" — the notes do render
    (drawer `:367`, detail `:351`) but as a bottom-of-page blob, after hatch/stocking
    sections. When `yearRound:false` matters (Class 2), the season fact should be a
    structured chip near the title, not prose the user must find.

## Class 5 — Things verified coherent (no action)

- Map line/polygon colors, visibility, and label policy all flow through
  `toWaterDecisionView` — the single-classification-authority pattern is right; extend
  it, don't bypass it.
- Stocking event species are fish species (rainbow/brown/...), all trout — drawer's
  "{species} trout" is correct.
- StockingPage has its own explicit species filter chips (trout/warmwater events).
- Drawer WaterTab and BrowsePage correctly suppress the score pill and use honest
  "Warmwater"/"Unverified" status text.
- Hatch halos exclude warmwater waters (`RiverMapPage.tsx:335`); note they still
  include unverified-species waters — acceptable (charts imply management intent) but
  revisit when seasonal logic lands.

## Suggested order

1. Item 1 + 3 + 4 (detail-page leak, badge physiology, empty ideal-flow) — small,
   user-facing lies.
2. Items 7 + 8 (surface `yearRound` via the decision model's seasonal states) — the
   highest-value feature work; everything else can consume it.
3. Item 5 + 10 + 11 (legend title, site-wide species mode, filter row) — make "mode" a
   real concept or stop pretending it is.
4. Item 16 + 15 (remove `?all=1`, default-state setting).
5. Item 2 (the fishability-or-not product decision) — gates 5, 12, 14's ideal end
   state; can be deferred behind honest suppression.

---

# Pass 2 — second sweep (2026-09-12): dead data + silent degradations

Second audit pass over the surfaces pass 1 didn't cover (hatch key, taxa, patterns,
shops/reports, stocking, fishing info, settings plumbing), hunting contract/served data
that no UI consumes and honesty regressions. Continues pass-1 numbering.

## Class 6 — Dead data: authored/served, never consumed

18. **The entire evidence layer is invisible.** `/v1/evidence/waters.json`
    (`ENDPOINTS.evidenceWaters`, contracts-v1.1.0) + the `WaterEvidence` contract —
    observedAt-vs-retrievedAt discipline, source qualifiers, stocking status — have
    ZERO consumers in web, admin, or marketing. The data lane built a provenance-first
    evidence pipeline; no surface shows a byte of it. This is the attribution
    culture's crown jewel rendering as nothing. Decide: surface it (per-water
    "evidence & sources" view) or stop serving it.
19. **`stockingRecent` is dead on arrival.** Built specifically for the recency-first
    redesign (contracts-v1.1.1), mapped in `apps/web/src/lib/endpoints.ts:18`, and
    never fetched. `StockingPage.tsx:150` downloads the FULL history file (623+ rows,
    grows forever) and re-filters to a 90-day window client-side (`:165-171`). The
    recency logic now exists twice (server + client) and can drift; offline phones
    cache the big file when a small rolling file exists. Either consume the endpoint
    (fetch recent for the default view, full file only on "show all history") or
    delete it.
20. **Shop report photos: upload-only feature.** `photoUrl` (ADR 0002) renders in the
    admin ComposerView — and nowhere else. ShopsPage and the drawer's ReportsTab show
    text + hot patterns only. Shops can attach photos no visitor will ever see.
    Render them (alongside the attribution block, per the ADR) or remove the composer
    field.
21. Cross-refs to pass 1: `yearRound` (item 7), the `fishability` metric slot
    (item 2), the seasonal decision states (item 8) — same disease, different fields.

## Class 7 — Honesty regressions and silent degradations

22. **Detail page regresses the B02 assessed-flag fix.**
    `StreamDetailPage.tsx:149` calls `statusForScore(value, readings.length > 0)` —
    two args, dropping `assessed` — while ConditionsPage (`:343`) passes all three.
    A REAL clamped-0 assessment (lethal temp) renders as "Assessment unavailable in
    this snapshot" on the detail page while the map and conditions list correctly show
    Poor. Pass `snapshot.score.assessed` like everywhere else, and add a test that
    pins the three surfaces to identical status logic.
23. **matchHatch silently loses its strongest signal offline.** When the region-month
    chart isn't cached, `HatchKeyPage.tsx:133-135` ranks against `charts = []` — the
    +2 "hatching now" component vanishes and results silently re-rank by key features
    + season alone. The confidence chip renders per-taxon confidence but never says
    the chart layer was missing. Show an explicit "hatch chart not cached — matching
    by key features and season only" notice when `chartQuery.data` is absent.
24. **Three stories about what a hatch halo means.** `MapLegend.tsx:116`: "Halo shows
    dominant hatch for selected month" (implies per-taxon coloring). Implementation
    (`RiverMapPage.tsx:337-341`): a single amber halo for ANY charted guidance ≥1.
    Map help text (`:789`): "Amber halos mark waters with regional hatch guidance."
    The legend copy is stale — rewrite it to match the implementation (or implement
    dominance coloring, which would consume the abundance data meaningfully).
25. **Conditions page subtitle overclaims.** "Gauge-fed trout assessments for TN
    waters" — the same page's rows include warmwater and unverified-species waters
    (with honest per-row status text). Copy should say "waters" and let rows speak,
    or the strips should filter by the site-wide species mode (item 10).
26. **Stocking count phrasing.** Drawer StockingTab renders "· 1,500 fish" beside a
    month-precision window; scheduled ≠ released. The caveat block below mitigates —
    tighten the phrase to "1,500 fish scheduled" for `datePrecision != 'day'` rows.

## Class 8 — Settings that bite (corrections to pass 1)

27. **CORRECTION to item 15: "Default state" is not vestigial — it's a live trap.**
    `settings.defaultState` actively filters ConditionsPage (`:75`, `:111`),
    StockingPage (`:150`), and the rest of the state-scoped surfaces. The catalog is
    Tennessee-only; set the control to anything else and pages silently go empty with
    no explanation. Remove the control and pin `defaultState: 'TN'` until multi-state
    ships — it's a remnant of the pre-pivot TX/OK/AR scope that still fires.
28. **Per-water fishing info is only ever 'special-regulations'.** The fishing pack's
    `appliesTo` mechanism supports any section; all three call sites
    (`RiverDrawer.tsx:171`, `StreamDetailPage.tsx:418`, FishingInfoPage) query only
    special regs. Fine today — but future per-water access/safety notes will be
    stranded unless a surface learns to ask for them.

## Pass 2 — verified coherent (no action)

- Taxon detail renders every field (key attributes, mouthparts, habitat, season
  tables by region, notes, sources). Pattern detail renders type/hook sizes/
  difficulty/materials/license/attribution.
- `hotPatterns` rendered on ShopsPage; `reportsEnabled` surfaced; `count` shown;
  `monthsActiveByRegion` consumed by taxon season tables and the chart-page fallback.
- Logbook prefills the water from river context; matchHatch correctly scopes chart
  credit to region+month; confidence chips rendered; `officialSources` rendered in
  drawer + detail; `datePrecision` handled honestly on the stocking page (month/year
  display, never a fake day).
- FishingInfoPage renders all sections generically with statewide-first ordering.
