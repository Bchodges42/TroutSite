# Fieldwork theme system

## One palette, two coordinated surfaces

`apps/web/src/theme/themes.ts` is the typed source of truth. `ThemeDefinition` contains UI colors, `MapPalette`, color scheme, and identity. Shared foundations cover display/body/mono typography, spacing, radii, elevation via semantic shadow, and motion. `applyTheme` writes `--ui-*`, `--map-*`, and `--trout-*` custom properties before the first React render and updates the browser theme color.

- **Daybreak:** white instrument panels, mineral-green geography, pine text, burnt-orange actions.
- **Nightfall:** deep blue-green ground and panels, cream text, warm amber actions. Existing USGS contours provide relief without the opaque pale raster's rectangular footprint.

`apps/web/src/index.css` contains layout rules and a compatibility bridge for the retained `@trout/ui` components and supporting pages. Their existing `--trout-*` references resolve to the semantic theme. Literal insect-identification swatches intentionally remain factual colors, not theme colors.

## Change a palette

Edit the corresponding `themes.daybreak.colors` / `themes.nightfall.colors` and `.map` values. Do not change individual component colors. The app and MapLibre update through the same ThemeProvider action. Keep Good/Fair/Poor meanings stable. Unknown rivers use dashed lines and the word “Unassessed”; selected labels/lines use the accent with a distinct outline. Hover consumes its own map token.

UI text uses `text`, `muted`, and `faint`; surfaces use `bg`, `surface`, `subtle`, and `raised`. Buttons use `accent` + `onAccent`, never a hardcoded white label. `borderStrong` supports visible input boundaries. `shadow` is a complete CSS elevation value. Dimensions belonging to a specific layout remain in CSS rather than being mistaken for interchangeable palette choices.

## Map adapter

`apps/web/src/features/map/mapStyle.ts` exports `atlasStyle(variant, palette)` → typed MapLibre `StyleSpecification`. `TennesseeMap` applies per-water colors from the active palette, preserves camera state, and reapplies feature state once after a style swap. It does not recreate the map for theme changes.

The palette covers land, water, labels/halos, county/state outlines, condition lines, hover, selection, lake shores, and terrain rendering. `reliefOpacity` and `reliefBrightness` are numeric cartographic appearance tokens. A zero opacity hides the raster layer but retains contours. The `road` token is reserved: no first-party road data exists in this baseline, and no fabricated road layer was added.

In terrain mode, neighboring-state fills are drawn **above** relief and below the genuine Tennessee outline. This masks rectangular acquisition/contour extents outside Tennessee at higher zooms. It is a rendering-order change using the existing boundaries, not a geographic-data rewrite. Keep this ordering when adding layers.

`terrainClip.json` is a UI-only inverse fill: a broad surrounding rectangle with the exact unchanged Tennessee boundary as a hole. It covers all out-of-state relief, including corners such as South Carolina that are absent from the immediate-neighbor context file. No river/state source asset is replaced or modified. Its fill matches the map background so its own outer edge is invisible. Keep it between relief and state outlines.

`riverIndex.json` holds UI label anchors and selection bounds copied from the unchanged first-party river geometry. It does not replace geometry. If the geographic-data owner corrects assets, regenerate this metadata from the approved geometry (see B13).

## Persistence and old links

Preference key: `trout:theme`. Default: Daybreak. Invalid/inaccessible storage falls back safely. Legacy `trout:basemap=ink` and explicit `?basemap=paper|ink` links still work; a user theme toggle removes an explicit flat-basemap URL override so the new preference survives reload. Terrain remains a separate URL layer preference. Initialization occurs before React paint, not in a post-render effect.

## Add another preset

1. Extend `ThemeDefinition.id` and `isThemeId` with the new stable identifier.
2. Add a complete entry to `themes`, including every semantic and map token.
3. Extend the compact header selector (currently intentionally two-way). Settings cards already enumerate `themes`.
4. Verify small text at 4.5:1 or higher, graphical interaction cues at 3:1 where applicable, and both bright/dark condition meanings. Repeat keyboard, mobile, and map-layer checks.

## Motion / accessibility

`--trout-motion-fast`, `--trout-motion-normal`, and `--trout-motion-ease` govern brief UI transitions. OS and in-app reduced motion disable CSS transitions and set map selection, location, and zoom duration to zero. Search supports `/`, Ctrl/Cmd+K, arrows, Enter, and Escape. Inspector tabs use roving keyboard focus; the menu traps focus and Escape dismisses only the topmost surface. Closing the inspector restores the visible search field on desktop and mobile.

## Scope boundary

Themes map existing categories to appearance; they do not calculate conditions, determine species, assign freshness, or join stocking events. Known data/asset/serving limitations and the complete reverted-change inventory live in `BACKEND-ISSUES.md`.

## Backend lane note (2026-09-04)

The backend lane (`C:\Users\Benjamin\Projects\trout-backend`) touches none of the theme token files; `applyTheme`/`atlasStyle` remain the single source of palette truth. Backend additions that render into the map (West TN point anchors) consume the same condition feature-state colors as river lines, so themes recolor them for free — restyling the point markers is UI-lane work. The B14 relief/contour asset fix upstream will replace this doc's masking notes with genuinely clipped assets; keep the layer-ordering rule until then.
