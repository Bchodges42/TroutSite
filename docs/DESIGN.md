# DESIGN — the Fieldwork design system (canon)

Consolidated from the original Fieldwork redesign doc, the theme system doc, and the
UI-discovery rationale (2026-09). This is the single reference for how the product is
supposed to look and behave; past point-in-time session logs live in git history.

## Identity & interaction model

**Fieldwork makes the map a working instrument.** The state map is full-bleed on first
load; a searchable water atlas opens on demand; a contextual inspector (desktop panel /
expandable mobile sheet) sits in the same space. Identity: Fraunces headings, IBM Plex
Sans UI, restrained panels, mineral cartography, warm amber/burnt-orange actions.

Principles that survived review and must survive future changes:

- **Map first, disclose progressively.** Conditions, Hatches, Stocking, Reports, and Log
  are progressively disclosed in the inspector. Empty sections never imply that a
  disabled feed has been checked.
- **One water system.** Lines, point fallbacks, and catalog polygons share selection,
  hover, assessed/unassessed treatment, and generous pointer/touch hit surfaces.
- **Contextual, continuous journeys.** River → region → month → hatch matching → taxon →
  chart → logbook; returning to exploration preserves selection and camera. The mobile
  fit keeps the chosen river above the sheet.
- **Honesty in presentation.** Seasonal hatch guidance is "expected" guidance, never
  claimed observed activity. Unassessed is a distinct state (dashed lines, the word
  "Unassessed"). Fetch time is never labeled as observation time. Warmwater waters get
  no trout score presented as generic "fishability".
- **Species modes.** Trout mode titles the legend "Trout conditions"; all-fish mode
  titles it "Water guide" with scoped bands ("Good/Fair/Poor · trout waters",
  "Warmwater · no trout score", "Unassessed"). The UI consumes the
  `WaterDecisionView` model (`features/map/waterDecision.ts`) — a clearly-labeled
  compatibility adapter fills it until richer data lands; it implements no species
  logic itself.
- **Search-first discovery pages.** Search opens on typing or ArrowDown (not empty
  focus). Keyboard: `/` and Ctrl/Cmd+K focus search; arrows/Enter/Escape drive it.

## Theme system

`apps/web/src/theme/themes.ts` is the typed source of truth. `ThemeDefinition` carries
UI colors, `MapPalette`, color scheme, and identity. `applyTheme` writes `--ui-*`,
`--map-*`, and `--trout-*` custom properties before first paint and updates the browser
theme color.

- **Daybreak:** white instrument panels, mineral-green geography, pine text,
  burnt-orange actions.
- **Nightfall:** deep blue-green ground/panels, cream text, warm amber actions; USGS
  contours provide relief without the opaque pale raster's rectangular footprint.

Rules:

- Change palettes only via `themes.daybreak.colors` / `.map` values — never per-component
  colors. `applyTheme`/`atlasStyle` stay the single palette truth for chrome AND map.
- Semantic usage: text = `text`/`muted`/`faint`; surfaces = `bg`/`surface`/`subtle`/
  `raised`; buttons = `accent` + `onAccent` (never a hardcoded label color);
  `borderStrong` for visible input boundaries; `shadow` is a complete CSS elevation value.
- Good/Fair/Poor meanings stay stable across themes. Unknown waters stay dashed +
  "Unassessed". Hover has its own map token. Literal insect-ID swatches stay factual
  colors, not theme colors.
- To add a preset: extend `ThemeDefinition.id` + `isThemeId`, add a complete entry,
  extend the header selector, then re-verify contrast (≥4.5:1 text, ≥3:1 graphical),
  both condition meanings, keyboard/mobile/layer checks.
- Persistence: `trout:theme` (default Daybreak); invalid storage falls back safely.
  Legacy `trout:basemap=ink` and `?basemap=paper|ink` links still resolve; a theme
  toggle removes a flat-basemap URL override. Initialization happens before React paint.

## Map adapter

`apps/web/src/features/map/mapStyle.ts` exports `atlasStyle(variant, palette)` → typed
MapLibre `StyleSpecification`. `TennesseeMap` colors waters from the active palette,
preserves camera across style swaps, and reapplies feature state after a swap — it never
recreates the map for theme changes.

- Palette covers land, water, labels/halos, outlines, condition lines and polygon washes,
  hover, selection, lake shores, terrain. Catalog polygons: quiet base fill +
  feature-state condition wash + selected/hover shoreline + transparent hit surfaces.
  `reliefOpacity`/`reliefBrightness` are numeric appearance tokens.
- **Layer-order invariant:** in terrain mode, neighboring-state fills draw ABOVE relief
  and BELOW the true Tennessee outline — this masks out-of-state acquisition extents.
  `terrainClip.json` is the UI-only inverse fill (rectangle with the exact TN boundary
  as hole) achieving the same for corners absent from the neighbor file. Keep both
  orderings when adding layers.
- `riverIndex.json` holds UI label anchors + selection bounds derived from the shipped
  river geometry. If geometry assets are corrected upstream, regenerate this metadata
  from the approved geometry — never hand-edit it.

## Motion & accessibility

- `--trout-motion-fast/normal/ease` govern brief transitions. OS + in-app reduced motion
  disable CSS transitions and zero out map camera durations.
- Search: `/`, Ctrl/Cmd+K, arrows, Enter, Escape. Inspector tabs use roving focus; the
  menu traps focus; Escape closes only the topmost surface; closing the inspector
  restores the visible search field. Map labels covered by the mobile sheet are removed
  from keyboard navigation.

## Settled judgment calls (do not relitigate without cause)

1. The bottom-left index toggle is gone — search is the atlas' single path; the anchored
   legend and the accessible `/browse` fallback remain.
2. The menu carries real destinations only (duplicated atlas/browse entries removed).
3. On selection the corridor hides so the amber casing + condition color read as before.
4. Discriminator art in the hatch key is `aria-hidden` — accessible button names stay
   textual.
5. Regulations live at `/regulations` (alias `/fishing-info`), organized as common
   questions with official-source links, explicit effective-date language, and no
   legal-completeness promise; crawlable marketing mirrors at `/fishing/tennessee/` and
   `/regulations/tennessee/`.

## Scope boundary

Themes map categories to appearance — they never calculate conditions, determine
species, assign freshness, or join stocking events. Data/asset/serving limitations are
tracked in `docs/KNOWN-ISSUES.md`, not patched in UI code.
