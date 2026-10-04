# Trout UI design audit, 2026-10-04

**Auditor:** Claude Code (design-audit session) · **Branch:** `claude/design-audit-20261004` · **Audited:** `origin/main` @ `14a92bc`
**Method:** local stack (seed, live `ingest --job=all`, snapshots; dev server on :5191). Playwright Chromium (ANGLE/SwiftShader) captured every route in `App.tsx` and the key states at 390×844 @3x, 768×1024 @2x and 1440×900 @1x, in Daybreak (light) and Nightfall (dark). I also read the code behind each screen: `index.css`, `packages/ui`, `theme/themes.ts`, `AppShell.tsx` and `features/map/*`. The scope was design only and the app is unchanged.

**Screenshots** follow the pattern `<width>-<theme>-<nn>-<state>.png` (for example `m390-light-05-map-river-watauga.png`). Per the brief they stay in the audit session's scratchpad and are not committed. On the audit machine they are at `%LOCALAPPDATA%\Temp\claude\C--Users-Benjamin-Projects-trout-waterway-research-20261003f555c1-560e-487c-855f-c68d89a377a1\scratchpad\shots\` (266 captures), with crops in `…\crops\`. The two mockups in §6 are there too (`mockups/map-home.html`, `mockups/river-sheet.html`). If you want them in the repo, ask and they can go under `docs/reports/assets/`.

---

## 1. Summary

Trout has strong raw material: a credible cartographic base, a disciplined data model, and a dark theme that already feels premium. But the map does not answer "where should I fish today?" at a glance. Today's condition is hidden under a blue fishery-class halo, phones have no search or list on the map, and a selected river opens with a page of evidence prose before any number. The chrome is also crowded and inconsistent: on a phone, 18 elements compete with a Tennessee that fills 10% of the map's height, and the Trout/All fish choice appears up to four times in three styles.

**The three changes with the biggest payoff:**

1. **Make the river line carry today's condition.** The stroke color becomes Good/Fair/Poor/No data, and the class becomes line style. Labels carry the score ("Caney Fork · 80").
2. **Replace the phone map chrome with one floating search bar plus a persistent "Fishing today" peek sheet.** The sheet is the ranked list of waters, the legend and the filter in one.
3. **Rebuild the river sheet and panel around three stat tiles (Score · Flow · Temp).** They sit directly under the water name and are visible at the half snap point. Evidence prose moves below or to the detail page.

---

## 2. Design direction

**North star: a field instrument, not a field guide.** Trout should feel like a well-made gauge you glance at on a phone at a trailhead. The map is calm and legible in sun, one number answers each question, and the depth (evidence, regulations, sources) is one deliberate tap away and never in the way. Borrow the restraint of Apple Maps (one search bar, one sheet), the glanceable color-as-data of Windy and onX, and the ranked "best near you" list of AllTrails. Keep Trout's own identity: Fraunces for names, the river palette, and the Nightfall theme.

| # | Principle | What it rules out |
|---|-----------|-------------------|
| **P1** | **Answer first.** Status, flow, temp and freshness come before any prose, on every surface that shows a water. | Evidence cards, "Fishery opportunity" blocks or disclaimers above the numbers. |
| **P2** | **One control, one place.** Each setting has exactly one control on a screen, in one component style. | Duplicate species toggles, layer radios that repeat the mode buttons, two searches on one screen. |
| **P3** | **The map carries the signal.** If an angler has to open the legend or read a label dot to learn which rivers are good, the map has failed. | Status encoded only in 6px dots. A class halo drawn over status color. |
| **P4** | **Trust lives in one place.** Provenance is a quiet, consistent footer line plus a sources sheet. It is not a sentence repeated on every card. | "Verify" ×10 on a detail page, "never authoritative" banners, internal editorial notes. |
| **P5** | **Thumb-first, sun-proof.** The primary actions sit in the bottom 40% of a phone screen. No text under 12px, and contrast ≥4.5:1 for text and ≥3:1 for map strokes. | Top-left tool rows on phones, 11px help paragraphs, hard-coded light-on-light colors. |
| **P6** | **Quiet chrome, loud data.** Neutral surfaces, one accent used only for the primary action and the current selection, and a single elevation per layer. | Rust links, rust chips, rust focus outlines and rust tabs all at once. Off-palette amber segmented controls. |

---

## 3. Findings

Effort: **S** ≤1 day · **M** 2–5 days · **L** >1 week. Screenshot filenames refer to the capture set described above. "m390" means phone, "t768" tablet and "d1440" desktop.

All P0 structural findings reproduce in Nightfall too (`m390-dark-01-map-default.png`, `m390-dark-05-map-river-watauga.png`, `d1440-dark-01-map-default.png`). They are layout problems, not theme problems. Nightfall is visually the stronger theme and is the right reference for the "expensive" feel.

### P0: hurts the core "where do I fish" task

#### P0-1 · The map does not show today's condition
- **Where:** map home, all widths. `d1440-light-01-map-default.png` (zoomed crop `crops/d-map-zoom.png`), `m390-light-01-map-default.png`, `d1440-dark-01-map-default.png`.
- **What's wrong:** every trout water draws as the same teal/blue line (the trout-class outline, `troutOutline #1b7fa8`). Condition shows only as a 6px dot inside the label pill. Caney Fork (80, Good), Elk (80) and Hiwassee (80) look the same as Duck River (no data). Only the Clinch (10, Poor) reads differently, and only because its line goes red-brown. Statewide, about 10 waters are labeled; the other 120+ visible waters are short unlabeled strokes. In today's snapshot 23 waters are Good, 25 Fair, 6 Poor and 136 have no data, and none of that distribution is visible.
- **Why it matters:** the map is the product's promise, and right now it answers "where are trout waters" rather than "where is fishing good today". Anglers have to tap rivers one by one.
- **Change:**
  - Paint the **river stroke** with the status color (§5 status tokens). Daybreak: Good `#1f8a5b`, Fair `#a87508`, Poor `#c8423b`, No data `#728179` dashed `4 4`. All are ≥3.3:1 against land `#edf0e8`.
  - Width 3px at z≤7, 4px at z8–10, 5px at z≥11. Add a 1.5px casing in `--map-paper` (Daybreak) or `#0d181c` (Nightfall) so strokes clear the hillshade.
  - Move the trout/warmwater class out of color. In trout mode, warmwater waters are already filtered. In All fish mode, draw warmwater at 70% stroke width with no casing. Drop the blue/amber halo entirely.
  - Labels change from "● Caney Fork River" pills to halo text, `Caney Fork · 80`. Use Plex 600 12px, text `--ui-text`, and a 2px `--map-placeText` halo (no pill, no shadow). The score number is the redundant non-color channel for color-blind users, since good and poor are only 1.13:1 apart in luminance.
  - Label priority: assessed waters first, ranked by score. Statewide, label the top 8 by score instead of a fixed headline list.
- **Effort:** M (map style plus label policy in `TennesseeMap.tsx` / `labelPolicy.ts`; tokens in `themes.ts`).

#### P0-2 · Phones have no search and no way into the water list from the map
- **Where:** `m390-light-01-map-default.png`. The capture script logged "no visible search input on map" at 390px. `index.css:2056` sets `.header-search {display:none}` at ≤640px and nothing replaces it. Desktop: `d1440-light-01-map-default.png` has no list panel either. The list (`?atlas=1`) is reachable only from a selected river's "← All Tennessee waters" link or by typing in the header search, whose results are a dropdown, not the list.
- **What's wrong:** the 190-water catalog, the fastest path to "which waters are good", has no visible entry point on the home screen at any width. The code comment at `RiverMapPage.tsx:126` promises "the always-visible field's list on mobile", but that field no longer renders.
- **Why it matters:** an angler who already knows the river name, which is the most common case, cannot type it on a phone. One who doesn't know it cannot browse a ranked list.
- **Change:**
  - **Phone:** a floating search bar at top 8px below the safe area (`top: max(env(safe-area-inset-top), 12px) + 44px`), left/right 16px, height 48px, radius 24px, `--ui-surface`, elevation e2. Inside it: the fish mark as the menu button (36px circle, accent fill), placeholder "Search 190 waters" (16px, muted), and a filter icon button (36px) that opens the Trout/All fish/Assessed sheet.
  - Add a persistent **"Fishing today" bottom sheet** with three snap points: peek 136px (title, counts key, top water), half 50%, full 92%. It holds the ranked list (§6.1).
  - **Desktop:** the 400px left panel is always present and shows the list when nothing is selected and the inspector when something is.
- **Effort:** M.

#### P0-3 · The river drawer and sheet lead with evidence prose, and the numbers are below the fold
- **Where:** `m390-light-05-map-river-watauga.png` (half state), `m390-light-06-map-river-watauga-expanded.png`, `d1440-light-05-map-river-watauga.png`, `t768-light-05-map-river-watauga.png`.
- **What's wrong:**
  - At the 49% snap point the sheet shows a grabber, an "Expand details" text button, an eyebrow, the name, a subtitle, five tabs and the top of the "Fishery opportunity" card. Nothing on screen shows a score, a flow or a temperature.
  - Even at 82%, the opportunity card (509 CSS px of TWRA-sourced prose and caveats) fills the view.
  - On desktop the score disc starts 925px down the panel (measured), below the 900px viewport.
  - The Watauga's opportunity card alone is ~150 words before the first number.
- **Why it matters:** the drawer is the answer surface. The first glance should be "80 · Good · 349 cfs · temp n/a · 54 min ago", and today it is a paragraph about sampling years.
- **Change:** the layout in §6.2. Name, then three stat tiles (Score · Flow · Temp), then the freshness line, then two actions, then tabs, all inside the 422px half state on a 390×844 phone. The opportunity card collapses to one row in the Today tab: "Year-round trout · documented 2026 ›", which expands in place. The full text stays on `/conditions/:id`.
- **Effort:** M (`RiverDrawer.tsx` restructure; reuse existing data).

#### P0-4 · The Trout / All fish toggle appears up to four times, in three styles, and the copies can disagree
- **Where:**
  - Phone: `m390-light-01-map-default.png` has the header pill segmented plus map-tool chips (2×). `m390-light-09-map-atlas-list.png` adds the list's filter chips (3×).
  - Desktop: `d1440-light-01-map-default.png` has the header pill, the map-tool chips, and the top-right `Segmented` with an amber `#E8B04B` thumb (3×). `d1440-light-09-map-atlas-list.png` adds the sidebar filter chips (4×).
  - Disagreement: in `m390-light-11-map-allfish.png` (`?species=all`) the header shows **Trout** selected while the map tool shows **All fish** selected.
- **What's wrong:** the confirmed prior finding is worse than reported, with four copies on desktop. The four implementations are `SpeciesModeToggle` (persisted setting), the `map-tool` buttons (URL), `Segmented` (URL, hard-coded amber) and `.filter-chip` (URL). The URL override and the setting diverge.
- **Why it matters:** the duplicates violate P2 and add four to six tap targets per screen. Worse, they show contradictory state, so the angler can't tell which mode the map is in.
- **Change:**
  - One control only: a segmented control in the filter row of the list panel (desktop) or the filter sheet (phone), using the §5 Segmented spec.
  - Delete the header `SpeciesModeToggle` from the shell (keep it on Settings), the two map-tool species buttons, and the topbar `Segmented`.
  - Make the URL param and the setting one source: writing either updates both.
- **Effort:** S.

#### P0-5 · On phones Tennessee is a thin strip; the map wastes about 90% of its height
- **Where:** `m390-light-01-map-default.png`, `m390-light-02-map-hatches.png`, `m390-light-50-offline-map.png`, `t768-light-01-map-default.png`.
- **What's wrong:** the statewide fit (`statewideCamera`, `mapTokens.ts`) frames the whole TN border at ~z4.8. The state is ~80 CSS px tall inside a ~780px map area. The rest is out-of-state paper, and the waters are 3–10px squiggles under oversized label pills.
- **Why it matters:** the first action on every phone visit is a pinch-zoom. The map-first promise becomes "zoom first".
- **Change:**
  - On phones (<720px), fit the **bounds of the currently visible waters** (trout mode ≈ lon −87.8…−81.6, lat 34.98…36.68), not the TN border. Padding is top 72px (search bar), bottom 152px (peek sheet), left/right 16px. That raises the zoom by about 0.6 and makes East TN, where most trout water is, read about 1.5× larger.
  - Remember the last camera per device (localStorage `trout:camera`) and restore it on return visits.
  - Keep "All Tennessee" in the layers sheet.
  - Desktop framing is fine and should stay.
- **Effort:** S–M.

### P1: hurts polish or readability

#### P1-1 · The map legend is unreadable in the light theme and its swatches don't match the map
- **Where:** `m390-light-03-map-legend-open.png`, `d1440-light-03-map-legend-open.png`. Compare `d1440-dark-03-map-legend-open.png` and `m390-dark-03-map-legend-open.png`, where it is fine.
- **What's wrong:**
  - `MapLegend.tsx` hard-codes text colors tuned for a dark glass panel: title `#EAF2ED`, body `#9FB5AA`. The panel background is `--ui-surface` (white in Daybreak). Measured contrast is **1.14:1** for the title and **2.17:1** for the body.
  - The swatches use `atlas = themes.nightfall.map` (`mapTokens.ts:3`), so in Daybreak the legend shows pastel Nightfall greens (`#71cda8`) while the map draws `#21846b`.
  - In hatch mode the closed legend chip still shows Good/Fair/Poor dots (`m390-light-02-map-hatches.png`).
- **Why it matters:** the legend is the only key to the map colors, and in the default theme its heading is invisible.
- **Change:**
  - Replace every hex in `MapLegend.tsx` with `var(--ui-text)` and `var(--ui-muted)`. Read swatch colors from `useTheme().theme.map`.
  - In the redesign the legend becomes the counts key in the "Fishing today" sheet, plus a one-line legend bar on desktop (§6). In hatch mode the chip shows a single sulphur halo swatch.
- **Effort:** S.

#### P1-2 · Internal editorial text is shown to anglers
- **Where:** `m390-light-20-detail-tailwater.png` (Notes: "Triage apply (2026-09-24): seasonMonths [3..12]→[3..9] … conflict preserved in the ledger"), `m390-light-20-detail-lake.png` (opportunity caveat "REACH DISCIPLINE (audit hard case)…"), and `m390-light-20-detail-lake-editorial.png` (`/conditions/calderwood-lake`, notes: "Correction (2026-09-22, evidence ledger): yearRound false → true … (ADR 0010 consistency)").
- **What's wrong:**
  - 45 of 190 catalog `notes` and 5 `opportunity` blocks contain ledger, triage, ADR, correction or field-name text.
  - Notes also leak field names ("see officialSources") and contradict themselves: Calderwood is "458 ac" and then "541 ac" in the same note.
  - Raw gauge IDs (`tva:WL`) appear in the desktop gauge table (`d1440-light-20-detail-tailwater.png`).
  - The ideal-flow badge reads "150–1,500 cfs (typical range — editorial)".
  - 82 notes end with "(retrieved 2026-09-14; verify current rules with TWRA before you go)".
- **Why it matters:** it reads as a draft, which is the opposite of "expensive". It also buries the useful note, for example "wade windows open when TVA drops releases".
- **Change:**
  - Content: split `notes` into `notes` (angler-facing, ≤60 words) and `editorNotes` (never rendered). Strip "Correction (…)" and "Triage apply (…)" paragraphs in the content build, and add a content lint that fails on `/ADR \d|ledger|Triage|seasonMonths|audit/`.
  - Map gauge IDs to display names, for example "TVA · Wilbur Dam release".
  - Ideal-flow badge: "Ideal 150–1,500 cfs".
  - The "retrieved/verify" suffix moves to the single sources line (P1-3).
- **Effort:** M (content pass plus build lint).

#### P1-3 · Disclaimer copy is everywhere
- **Where:** counted in rendered text at 1440 across 15 routes. "verify/verified", "authoritative", "honest(ly)", "not a guarantee", "not a measurement", "not confirmed" and "check before" appear **84 times on 11 of 15 routes**: Regulations 42, Stocking 11 (first viewport batch), the Watauga detail page 10, its map drawer 6, About 6. Examples: `m390-light-20-detail-tailwater.png` ("Verify officially · This app is never authoritative…", five "verify" in one card); `m390-light-30-stocking.png` ("Verify at TWRA ↗" on every card); `m390-light-30-conditions.png` ("honest status"); `m390-light-01-map-default.png` (help paragraph: "…not confirmed fish presence today…").
- **What's wrong:** the prior finding is confirmed with nuance. It is "most screens", not "nearly every": Shops, Logbook, Hatch key, Pattern and Settings are clean.
- **Why it matters:** repetition makes the copy invisible when it matters, such as the TVA release warning, and makes the product sound defensive instead of confident.
- **Change:**
  - Keep exactly one provenance line per surface, the §5 "Source line" component: `USGS 03486000 · 54 min ago · Sources & limits ›` (12/16, muted). It opens one shared "Sources & limits" sheet that holds the full caveats.
  - Keep **one** safety-critical callout, the TVA release/wading warning, on tailwaters only, styled as a fair-soft notice.
  - Delete: "Check before you cast", "Verify officially" (its links move into the sources sheet), the per-card "Verify at TWRA ↗" (one "Official schedule ↗" link in the Stocking page header), "honest" everywhere, and the map help paragraph (P1-6).
- **Effort:** S–M.

#### P1-4 · The phone map is crowded: 18 elements on top of the map
- **Where:** `m390-light-01-map-default.png`.
- **What's wrong:**
  - Header (64px): mark, wordmark, Trout, All fish, theme, menu.
  - Tool row: Conditions, Hatches, Trout, All fish.
  - A 156×56px three-icon pill (compass, layers, locate).
  - Legend chip, attribution "i" button, zoom +/− (88px tall).
  - A four-line, 11px help paragraph.
  - That is 15 tap targets and 18 visual elements, and every control has its own size and shape: 40px tool chips, a 56px pill, 44×44 zoom buttons and a 44px header segmented.
- **Why it matters:** this fails "sleek without crowding" (owner goal 3), and the bottom-right cluster blocks the selected river label (P1-11).
- **Change:** five map elements total on phones.
  1. The search bar (P0-2), with the mark as the menu.
  2. A vertical control stack at right 16px, top 120px, 44×44 each, radius 12, e2: Layers and Near me. Remove the compass ("All Tennessee" moves to the layers sheet).
  3. The peek sheet.
  4. The attribution "i" placed inside the sheet header's top-right edge, not floating.
  5. The bottom tab bar (§4).
  - Remove: the app header on the map route, the tool row (mode moves to the layers sheet and the sheet header), zoom buttons on `(pointer: coarse)` (pinch is native), and the help paragraph.
- **Effort:** M.

#### P1-5 · The desktop header is crowded and truncates its own search
- **Where:** `d1440-light-01-map-default.png`, `d1440-light-10-map-search-results.png`.
- **What's wrong:**
  - 12 items in a 76px header: mark, wordmark, a 3-line 9px "THE FIELD ATLAS" caption, 3 nav links, search, privacy tagline ("On your device. Out in the wild."), Trout/All fish, theme ("Daybreak"), menu.
  - The search is squeezed to 165px, so its placeholder truncates to "Search any" and its results dropdown is 110px wide with names wrapping onto three lines.
  - With a river selected there is a second search in the panel (`d1440-light-05-map-river-watauga.png`).
  - "Explore waters" is not marked as current on `/conditions/:id`.
- **Change:**
  - Header (56px tall, down from 76px; 24px side padding): mark plus wordmark (Fraunces 600 22px), nav `Map · Match the hatch · Hatch calendar · Logbook` (Plex 500 14px, 8×12px padding, current page on a `--ui-subtle` fill), spacer, theme icon button (36px), menu (36px).
  - Remove the caption, the privacy tagline (it moves to About), the header species toggle (P0-4), and the header search on the map route, since the panel owns search there. On non-map routes keep a 320px search that navigates to the map with the water selected, with its dropdown matching the input width.
- **Effort:** S.

#### P1-6 · The map help paragraph sits on the map, small, and overlaps controls
- **Where:** `m390-light-01-map-default.png` (11px, four lines, 270px max width), `d1440-light-05-map-river-watauga.png` (one 1,000px line running across the river lines, the attribution and the zoom buttons).
- **Why it matters:** it is unreadable over line work, competes with rivers for attention, and repeats legend content.
- **Change:** delete `.map-help`. Its useful content ("Dimmed dashed = closed season") becomes one row of the legend sheet, and "How scores work" becomes a link in the desktop legend bar and the sources sheet.
- **Effort:** S.

#### P1-7 · Hatches mode is hard to use: no month control on the map and little visible change
- **Where:** `m390-light-02-map-hatches.png`, `d1440-light-02-map-hatches.png`.
- **What's wrong:** switching to Hatches keeps the same lines, and the "amber halos" are hard to see statewide. The month picker exists only inside the Layers popover (`RiverMapPage.tsx:520`). The legend chip still shows condition dots.
- **Change:**
  - The mode control becomes one segmented control, `Conditions | Hatches`. On desktop it sits at the map's top-left, 24px from the panel edge. On phones it is the first row of the layers sheet.
  - When Hatches is on, show an inline month stepper next to it (`‹ Oct ›`, 36px tall).
  - Draw hatch-active waters in `--map-sulphur` at full width and dim the rest to 35% opacity (not a halo).
  - The peek sheet header becomes "October hatches · 38 charted" with the top three hatches as chips.
- **Effort:** M.

#### P1-8 · The Layers panel repeats the mode control and over-explains
- **Where:** `m390-light-04-map-layers-open.png`, `d1440-light-04-map-layers-open.png`.
- **What's wrong:** the panel opens with the Conditions/Hatches radios, which duplicate the tool row. There are five 12–13px captions, and "off by default" appears four times. On phones it is a 280×630px popover covering half the map, and a "Map layers" tooltip overlaps it on desktop.
- **Change:**
  - Phone: a bottom sheet at 60%. Desktop: a 280px popover.
  - Sections: **Show** (Conditions/Hatches segmented plus the month stepper), **Overlays** (switch rows, 48px tall, 20px icon, label 15px, a one-line 13px caption only where it adds information: "Gauges: tap a dot for the live reading"), **Base** (Terrain, Roads).
  - Use switches, not checkboxes, and drop "off by default" everywhere.
  - Suppress the tooltip while the popover is open.
- **Effort:** S.

#### P1-9 · The water detail page has no map, buries its numbers, and repeats them
- **Where:** `m390-light-20-detail-tailwater.png` (crops `detail-tw-0…3`), `d1440-light-20-detail-tailwater.png`, `m390-light-20-detail-lake.png`.
- **What's wrong:**
  - On phones the opportunity card (509 CSS px at 390, starting at y=280) comes before the stat strip, which starts about 800px down the page.
  - Flow appears three times: the "NOW/OBSERVED/FLOW/TEMP" strip, the assessment bullets and the FLOW badge. Status appears twice ("Good" plus the "80 GOOD" box).
  - "50 minutes ago" wraps to three lines in a four-column strip.
  - A "Match this water ↗" primary button sits inside the data card, with an external-link arrow on an internal link.
  - Section heads ("Gauge readings", "Stocking history", "Notes") use Fraunces at 32px, larger than the data.
  - On desktop the content is an 856px column centered in 1440px, with no map of the reach.
  - The lake page says "Now: Unverified" and "Species unverified — the catalog does not document trout…" directly below a card titled "Warmwater fishing focus".
  - The subtitle uses Title Case ("Stocking Program Listed") while the drawer uses sentence case.
- **Change:**
  - **Hero:** name (Fraunces 600 32/38 desktop, 28/34 phone), subtitle (15px muted, sentence case).
  - **Stat row:** four tiles (Score, Flow with its range bar, Temp, Updated) at 32/38 tabular. They are 4-up on desktop and 2×2 on phones, each tile 12px radius with 16px padding.
  - **Desktop layout:** two columns (content 640px plus a sticky 400px mini-map with the reach highlighted and an "Open on map" button).
  - **Order:** Today (hatch chips plus one TVA notice) → Regulations → Stocking → Gauges table → About this water (angler notes) → Fishery evidence (collapsed) → Sources line.
  - Section heads in Plex 600 20/28. Remove the FLOW/STAGE badges, which the tiles replace.
  - Lakes: show "Warmwater" as the status tile instead of "Unverified".
- **Effort:** M.

#### P1-10 · Flow-direction arrows read as warning markers
- **Where:** `m390-light-05-map-river-watauga.png`, `d1440-light-05-map-river-watauga.png`, `d1440-dark-05-map-river-watauga.png`.
- **What's wrong:** the arrows are 18–24px solid black (light) or white (dark) triangles with a red tip, five on one 16-mile reach. They are the heaviest marks on the map, heavier than the selected river.
- **Change:** 8×6px open chevrons in the stroke's own status color, darkened 20%, at 70% opacity. Space them every 140px of line length, show them only at z≥10 and only on the selected water, and drop the red tip.
- **Effort:** S.

#### P1-11 · The selected river's label collides with the zoom controls on phones
- **Where:** `m390-light-05-map-river-watauga.png` and `m390-light-08-map-river-tab-hatch.png`, where the rust "● Watauga River" label is clipped under the zoom stack.
- **Change:** remove the touch zoom buttons (P1-4). Set label `padding` / `text-padding` and fitBounds padding so labels avoid the right 76px control column. Give the selected label a `symbol-sort-key` so it wins collisions.
- **Effort:** S.

#### P1-12 · Two design-token systems, and drift in the CSS
- **Where:** `packages/ui/tokens.css` vs `apps/web/src/theme/themes.ts` / `index.css`. Visible symptoms: `m390-light-03-map-legend-open.png` (theme-blind legend) and `d1440-light-01-map-default.png` (amber `#E8B04B` segmented thumb in the rust Daybreak theme).
- **What's wrong:**
  - `tokens.css` defines a green primary (`--trout-green-700`), radii 4/8/12, a `system-ui` body font and an amber accent. `themes.ts` defines a rust accent, radii 6/10/16 and Plex/Fraunces. `index.css:51` re-points `--trout-color-primary` to `--ui-accent`, so which value wins depends on load order.
  - `index.css` (2,789 lines) uses **19 distinct border-radius values** (3, 4, 6, 7, 8, 9, 10, 12, 14, 16, 18, 50%, 99px, 999px, …), **25 distinct font sizes** (including 10, 11, 11.5, 12.5, 13.5px and three rem values), **10 eyebrow letter-spacing values** (0.01–0.18em), **28 `!important`** and **five separate `@media (max-width: 900px)` blocks** (lines 1846, 2128, 2613, 2662, 2785). It also has dead rules, such as `.header-search` styled at ≤360px although it is `display:none` at ≤640px.
  - TSX hard-codes theme-blind colors: `MapLegend.tsx` (10 hex values), `Segmented.tsx` (`#0A100E`, `#9FB5AA`, `#EAF2ED`, `#E8B04B`), `HatchMonthControl.tsx` (13).
- **Why it matters:** this is the root cause of the light-theme legend failure, the amber segmented control in a rust theme, and the general "almost consistent" feel.
- **Change:** the system in §5. One token source (`themes.ts` emits CSS variables, and `tokens.css` keeps only component classes that read `--ui-*`). Add a lint rule that rejects hex values in TSX outside `themes.ts` and insect swatch data, and collapse the breakpoints into one partial per breakpoint.
- **Effort:** L (but can ship incrementally).

#### P1-13 · The accent color is overloaded
- **Where:** `m390-light-09-map-atlas-list.png` (3px rust focus outline around the search on load), `m390-light-30-chart-month.png` (rust pattern chips, month ring), `m390-light-20-detail-tailwater.png` (rust source links, rust CTA), `m390-light-05-map-river-watauga.png` (rust tab underline, rust selected label).
- **What's wrong:** on one detail screen rust marks a primary CTA, links, the selection and citation text, so nothing stands out.
- **Change:** limit the accent to (a) one primary button per view, (b) the current selection on the map and in lists, and (c) the 2px focus ring (`outline: 2px solid var(--ui-accent); outline-offset: 2px`, keyboard only via `:focus-visible`). Links use `--ui-text` with a 1px underline at `text-underline-offset: 3px`. Pattern chips are neutral (`--ui-subtle` fill). The active tab is `--ui-text` with a 2px underline.
- **Effort:** S.

#### P1-14 · Duplicate components for the same job
- **Where:** visible as three score treatments in `t768-light-06-map-river-watauga-expanded.png` ("80 OUT OF 100" disc), `m390-light-30-conditions.png` ("80 GOOD" pill) and `m390-light-20-detail-tailwater.png` ("80 / GOOD" box). Two button styles also appear side by side in `m390-light-20-detail-tailwater.png` ("View on map" / "Match this water" vs "All Tennessee fishing regulations →").
- **What's wrong:**
  - **Segmented:** `SpeciesModeToggle`, `Segmented`, `.map-tool[aria-pressed]` and `.filter-chip[aria-pressed]`.
  - **Buttons:** `@trout/ui` `Button` (15 uses) vs `.primary-action` / `.secondary-action` / `.text-action` (39 uses).
  - **Empty states:** `EmptyState` (29) vs `.empty-note` (13).
  - **Score:** `.score-disc` (drawer, "80 OUT OF 100"), `ScorePill` (Conditions list, "80 GOOD") and the detail box ("80 / GOOD").
  - **Freshness:** `FreshnessChip` vs the unused `LastUpdatedChip`.
  - **Data readouts:** `DataBadge` badges vs `.metric` tiles.
- **Change:** consolidate to the §5 inventory and delete the losers.
- **Effort:** M.

#### P1-15 · Loading is silent on phones
- **Where:** `m390-light-60-loading-map.png` (streams and conditions delayed 20s). The map shows a bare state outline with no rivers, no message and no spinner. The "Loading the water catalog…" note lives in the sidebar, which is hidden on phones.
- **Change:** the peek sheet shows a skeleton (three 52px rows in `--ui-raised`, 1.2s shimmer, disabled under reduce-motion) and the title "Loading 190 waters…". After 8s, add "Still loading. Saved waters are available offline."
- **Effort:** S.

#### P1-16 · The offline banner is heavy and wordy
- **Where:** `m390-light-50-offline-map.png`, `m390-light-51-offline-river.png`.
- **What's wrong:** a full-width two-line peach band (~56px) pushes the map down: "Offline · saved maps and information only. Readings may be out of date."
- **Change:** a 28px chip inside the search bar's right side (phone) or under the header (desktop): `● Offline · data from 2:49 PM`, Plex 500 13px on `--ui-fair-soft`. Stat tiles show their own age, which already covers staleness.
- **Effort:** S.

#### P1-17 · Five themes and 15 custom color pickers undercut a curated look
- **Where:** `m390-light-30-settings.png`.
- **What's wrong:** Daybreak, Nightfall, Riverstone, High contrast and Campfire, plus user overrides for accent, status colors, map water and more. A user can make "Good" red. Each theme multiplies the QA surface (P1-1 broke in exactly this way).
- **Change:** ship three themes, Day (Daybreak), Night (Nightfall) and High contrast, with an "Auto" option that follows `prefers-color-scheme`. Remove custom colors, or move them behind an "Accessibility" disclosure limited to text-size and contrast boosts. Status colors are never user-editable.
- **Effort:** S.

#### P1-18 · The water list mixes two vocabularies in one column
- **Where:** `m390-light-09-map-atlas-list.png`, `d1440-light-09-map-atlas-list.png`.
- **What's wrong:** the right column shows condition words (Good/Poor) and evidence states (Unresolved, Seasonal stocked) in the same position and similar colors. Bradley Creek has a score of 50 in the snapshot but shows "Unresolved · No score" directly under an "Assessed first" heading. The rows are 104px tall (two-line names plus a region line plus a 40px decorative wave icon that is identical on every row).
- **Change:** list row spec in §5. A 4px status bar, the name (16/22 600), a meta line ("Center Hill tailwater · Middle TN", 13px muted), and on the right the flow (16px tabular) over a status chip ("80 Good"). Fishery type ("Seasonal stocked") moves into the meta line. Drop the wave icon. Row height is 64px. Sort by score descending, then no-data alphabetically.
- **Effort:** S.

#### P1-19 · The Reports tab is a dead end
- **Where:** `m390-light-08-map-river-tab-reports.png`, `m390-light-30-shops.png` ("No reports yet"). The ingest shows `reports: 0`.
- **Change:** hide the tab and the "Recent reports" section until at least one report exists for that water or the state. The drawer tabs become Today · Hatches · Stocking · Regs (Log becomes an action).
- **Effort:** S.

#### P1-20 · Tablet (768px) gets the phone layout stretched
- **Where:** `t768-light-01-map-default.png`, `t768-light-05-map-river-watauga.png`, `t768-light-09-map-atlas-list.png`.
- **What's wrong:** everything ≤900px uses the phone model, so a 768px-wide bottom sheet appears with prose lines about 110 characters long, the tool row floats top-left, and the state is still small.
- **Change:** at ≥720px use the desktop model with a 360px floating panel (16px inset, radius 16, e2) over a full-bleed map, like Apple Maps on iPad. Change the breakpoint from 901px to 720px in `RiverMapPage.tsx:82` and the CSS.
- **Effort:** M.

### P2: refinement

| # | Screen · file | What | Change | Effort |
|---|---|---|---|---|
| P2-1 | Header · `d1440-light-01-map-default.png` | 3-line 9px "THE FIELD ATLAS" caption beside the wordmark. | Delete it. The wordmark is enough. | S |
| P2-2 | Map/list/drawer · `m390-light-09-map-atlas-list.png`, `d1440-light-05-map-river-watauga.png` | Letter-spaced eyebrows everywhere ("TENNESSEE / FIELD ATLAS", "TENNESSEE WATERS / CONDITIONS ATLAS", "NORTHEAST TN — WATAUGA", "FISHERY OPPORTUNITY"). | One eyebrow style (12/16, 600, 0.08em), at most one per view. Delete the map-view label entirely. Region moves into the subtitle in sentence case. | S |
| P2-3 | Detail · `detail-tw-1/2` crops | Fraunces on collapsible section heads ("Gauge readings" 32px). | Fraunces only for page H1 and water names; section heads in Plex 600 20/28. | S |
| P2-4 | Browse · `m390-light-30-browse.png` | Three columns at 390px wrap the name, region and status into 3–4 lines each. | Reuse the P1-18 list row. Merge `/browse` into the list sheet and redirect `/browse` to `/?list=all`. | S |
| P2-5 | Taxon · `m390-light-30-taxon.png` | "Little Sulphur (Ephemerella invaria)" shows a photo captioned "Hexagenia limbata nymph" (an order-level stock image, `taxonImages.ts:22`). | Caption it "Representative mayfly nymph (order Ephemeroptera)" and show a 12px "Representative photo" chip on the image. | S |
| P2-6 | Stocking · `m390-light-30-stocking.png` | Every card has "Verify at TWRA ↗", a species chip, a "Month window · scheduled" chip and a two-line caveat. | Cards: water name (16/22 600), "Rainbow · Apr 2027 · Clay Co." (14px). One "Official schedule ↗" link in the page header. Explain "month window" once in a header info row. | S |
| P2-7 | Logbook · `m390-light-30-logbook-empty.png` | Export JSON and Import JSON have the same weight as "+ Add entry". The empty state has a second CTA. | One primary "New entry" button. Export/Import go in a "⋯" menu. The empty state keeps only its illustration and line. | S |
| P2-8 | Conditions · `m390-light-30-conditions.png` | "Recently observed" lists waters reading "flow unknown · temp unknown". | Show only waters with an observation in the last 24h, and put the rest under "No gauge" in the full list. | S |
| P2-9 | Search · `m390-light-09-map-atlas-list.png` | A "/" keyboard hint on a touch device, plus a double focus treatment (3px rust outline and an inner border). | Hide the shortcut hint on `(pointer: coarse)`. Single 2px `:focus-visible` ring. | S |
| P2-10 | Map labels · `d1440-light-01-map-default.png` | Label pills (white, 1px border, shadow) look like tappable buttons and hide river lines. | Halo text labels (see P0-1). Selected water: accent text plus a 2px halo, no pill. | S |
| P2-11 | Hatch month · `m390-light-30-chart-month.png` | Each entry stacks stage chip, abundance chip, time, 2–3 rust pattern chips and a 12-segment bar: about 8 elements per card. | Name plus "Larva · midday" (14px), a single abundance meter, and patterns as plain text links ("Zebra Midge · Brassie"). | S |
| P2-12 | Hatch key · `m390-light-40-hatchkey-step1.png` … `step6.png` | The step title is repeated ("Step 1 of 6 — How big was it?" above a card whose H2 says the same). Size hints are 11px. | Keep the progress bar plus "1 of 6" (12px) and one H2. Size hints at 13px. | S |
| P2-13 | Copy · detail and drawer | Title Case vs sentence case ("Stocking Program Listed" / "Stocking program listed"); "Not reported" vs "—" vs "No flow observation" for missing values. | Sentence case everywhere. Missing value = "—" with a 12px reason underneath ("No sensor"). | S |
| P2-14 | Toast · `m390-light-32-logbook-with-entry.png` | The success toast covers the header at top-center. | Phone: bottom-center, 16px above the tab bar. Desktop: top-right. | S |

---

## 4. Mobile

**Navigation model.** Replace the hamburger-only model with a **bottom tab bar**: `Map · Hatches · Logbook · More`.
- 83px tall including the home-indicator inset, 24px icons, 11px labels (500), `--ui-text` active and `--ui-muted` inactive, no accent.
- **Hatches** opens the hatch hub: Match the hatch (key) and Hatch calendar as two big entries.
- **More** holds Conditions table, Stocking, Shops, Regulations, Settings and About.
- On the map tab the app header disappears. On other tabs a 52px header shows the page title (Plex 600 17px), with a back chevron when deep-linked.
- AllTrails and Strava use this model, and it puts navigation in the thumb zone instead of a top-right hamburger 60px from the top edge.

**Thumb reach (390×844, right-handed).**
- The top 25% (y<210) is reach-hard. Today it holds the header toggle, the four tool chips and the control pill, which is 9 tap targets.
- Proposed: only the search bar sits there, since it is tapped once per session and the keyboard then brings input down. The two map controls sit at y≈120–208 on the right edge, the most reachable part of the top zone. Every repeated action (pick a water, change snap, switch tab, open filters from the sheet header) lives in the bottom 45%.

**Sheet behavior.** One sheet component (vaul, already in use) for both "Fishing today" and a selected river.
- Snap points: **peek 136px** (no selection only), **half 50%**, **full 92%**. Today's 49%/82% leave a strip of map above the full state that can't be used.
- Selecting a water morphs the same sheet to half and shows the river. Close (32px ✕, or swipe down) returns to the list at its previous scroll position.
- Remove the "Expand details / Show map" text button. Use the 36×5px grabber, a tap on the sheet header, and drag.
- The map stays interactive at every snap point (non-modal, as today). The camera pads its bottom by the sheet height so the selected reach is never under the sheet.

**Header.** On the map there is no header. The search bar is the header (P0-2): the fish mark doubles as the menu and brand, and the filter icon opens filters. Theme moves to More → Settings, plus an automatic follow of the system scheme. This saves 64px of vertical space and five targets.

**One-handed use outdoors.**
- Minimum text 12px. Body text in sheets 15–16px.
- Stat values 24px/600 so they read at arm's length in sun.
- Status always pairs color with a word and a number. Fair-on-soft is 4.54:1, and every status text/soft pair is ≥4.2:1.
- Tap targets ≥44×44 with ≥8px spacing.
- Respect `prefers-reduced-motion` for sheet springs (already wired via `.reduce-motion`).
- Offer Nightfall as "Auto at dusk" (switch at local sunset, using the solar times already computed in `lib/solar.ts`) so a dawn or dusk session doesn't blind the angler.

---

## 5. Design system proposal

**Single source of truth:** `apps/web/src/theme/themes.ts` emits every color, type, space, radius and elevation variable. `packages/ui/tokens.css` drops its own palette and radii and keeps only component classes that read `--ui-*` / `--trout-*`.

### Type scale (IBM Plex Sans unless noted; px / line-height / weight)

| Token | Spec | Used for |
|---|---|---|
| `display` | Fraunces 32/38 600 (28/34 on phones), tracking −0.01em | Page H1, water name on the detail page |
| `title-lg` | Fraunces 24/30 600 | Water name in sheet/panel |
| `title` | 20/28 600 | Section heads (replaces Fraunces section heads) |
| `headline` | 17/24 600 | Card titles, sheet titles ("Fishing today") |
| `body` | 16/24 400 (15/22 in dense panels) | Prose |
| `label` | 14/20 500 | Buttons, tabs, chips, segmented |
| `caption` | 13/18 400 | Meta lines, source lines |
| `micro` | 12/16 600 | Status chips, stat labels, eyebrow (uppercase, 0.08em). **Floor: nothing smaller.** |
| `stat` | 24/30 600 tabular-nums (sheet) · 32/38 (detail) | Score, flow, temp values |

Delete the 10, 10.5, 11, 11.5, 12.5, 13.5, 23, 25, 27 and 29px sizes and the `clamp()` title.

### Color roles

| Role | Daybreak | Nightfall | Rule |
|---|---|---|---|
| `bg` / `surface` / `subtle` / `raised` | `#f3f4f0` / `#ffffff` / `#f1f3ef` / `#e7ece7` | as today | Surfaces only |
| `text` / `muted` | `#192e2b` / `#526760` (5.5:1) | `#ecf3ed` / `#b2c7c3` | `faint` is retired (collapse into muted) |
| `border` | `#dbe2dc` | `#33494a` | 1px hairlines only |
| **`accent`** | `#b34824` | `#f0b478` | **Is for:** one primary button per view, the current selection (map stroke casing, list row, label), the focus ring. **Is not for:** links, chips, tabs, eyebrows, citations, filter pressed states or icons. |
| `accent-soft` | `#faeee6` | `#3b332b` | Selected list row background only |

### Status tokens (Good / Fair / Poor / No data)

| Token | text (on surface) | soft (chip/tile bg) | map stroke (Daybreak) | Nightfall text / soft / stroke |
|---|---|---|---|---|
| `good` | `#237155` | `#e3f1ea` | `#1f8a5b` (3.8:1 on land) | `#7cd0a7` / `#1f3a30` / `#71cda8` |
| `fair` | `#8e630b` | `#f6ecd4` | `#a87508` (3.5:1) | `#e8c17c` / `#3b3222` / `#e0b86d` |
| `poor` | `#b13b38` | `#f8e3e1` | `#c8423b` (4.2:1) | `#f28d83` / `#3f2524` / `#ed887c` |
| `none` | `#64746e` | `#eceeec` | `#728179`, dashed 4 4 (3.6:1) | `#9aafaa` / `#26353a` / `#7ca394` dashed |

Status chip text on its soft background is ≥4.2:1 in Daybreak and ≥5.5:1 in Nightfall. **Redundancy rule:** status is never color alone. Chips always say the word ("80 Good"), map labels carry the number, and No data is dashed.

### Spacing (8pt grid, 4 for hairline adjustments)
`4 · 8 · 12 · 16 · 24 · 32 · 48`.
- Phone gutters 16. Desktop panel padding 24 (header) / 16 (rows).
- Card padding 16. Stat tile padding 12.
- Section gap 24 (phone) / 32 (desktop). List row vertical padding 10. Gap between stacked controls 8.

### Radii (four values)
- `8`: buttons, inputs, segmented, small chips.
- `12`: cards, stat tiles, popovers, map control groups.
- `16`: sheets and panels (top corners on phone).
- `999`: status chips and the phone search bar only.

Retire 3, 4, 6, 7, 9, 10, 14 and 18px.

### Elevation (three levels; borders do the rest)
- `e1` (cards on bg): `0 1px 2px rgb(25 46 43 / .08)` plus a 1px `border`.
- `e2` (floating map controls, search bar, popovers): `0 4px 16px rgb(25 46 43 / .12)`, no border.
- `e3` (sheets, panels over the map): `0 -8px 32px rgb(25 46 43 / .16)`.
- Nightfall: `rgb(0 0 0 / .28/.36/.44)`.

### Components to consolidate (keep → delete)

| Keep (one implementation) | Spec | Delete |
|---|---|---|
| `Segmented` (in `@trout/ui`, token-driven) | 36px tall, 2px inset track `--ui-subtle`, thumb `--ui-surface` + e1, label 14/20 500, radius 8 | `SpeciesModeToggle` UI, `.map-tool[aria-pressed]` for species, `.filter-chip`, hard-coded colors in `Segmented.tsx` |
| `Button` (`primary` / `secondary` / `ghost` / `link`) | 44px (md) / 36px (sm), radius 8, label 15/20 600 | `.primary-action`, `.secondary-action`, `.text-action` |
| `StatusChip` | 22px, radius 999, micro 12/16 600, status text on status soft, content "80 Good" | `.score-disc`, `ScorePill`, detail score box, `.status-text` colors |
| `StatTile` | see §6.2 | `.metric`, `DataBadge` row, the NOW/OBSERVED/FLOW/TEMP strip |
| `SourceLine` | caption 13/18 muted, `● USGS 03486000 · 54 min ago · Sources & limits ›` | `FreshnessChip` variants, "Check before you cast", "Verify officially", per-card verify links |
| `EmptyState` | 24px icon, headline, one body line, optional one button | `.empty-note` |
| `Sheet` (vaul) | snap points per §4, grabber 36×5 `#c5cec8` | `.sheet-toggle` text button, CSS-only panel remnants |
| `ListRow` (water) | see P1-18 | `.water-row` variants, Browse page rows |

---

## 6. Redesigned key screens

Static mockups: `mockups/map-home.html` (phone and desktop) and `mockups/river-sheet.html` (half and full sheet), rendered as `mockups/*.png`. Scores and counts in them are from the 2026-10-04 local snapshot (23 Good, 25 Fair, 6 Poor, 136 No data).

### 6.1 Map home

**Phone (390×844):**

```
┌──────────────────────────────────────┐ safe-area top
│ (T) Search 190 waters          [≡⇅] │ 48px pill, top=safe+12, x=16…374, e2
│                                ┌──┐ │
│                                │◇ │ │ control stack 44×44, right 16, top 120
│                                │◎ │ │ (Layers · Near me), radius 12, e2
│      map — fit to visible      └──┘ │
│      waters, status strokes,         │
│      halo labels "Caney Fork · 80"   │
├──────────────────────────────────────┤ sheet top = 844−83−136 (peek)
│               ▬▬▬                    │ grabber 36×5, 8px from top
│ Fishing today          Updated 12m  │ headline 17/24 · caption 13 muted
│ (● 23 Good)(● 25 Fair)(● 6 Poor)(● 136 No data) │ 32px chips, tap = filter
│ ▌Caney Fork River        334 cfs    │ top-ranked row (64px)
│ ▌Center Hill tw · Mid TN  [80 Good] │
├──────────────────────────────────────┤
│  Map    Hatches   Logbook   More    │ tab bar 83px incl. inset
└──────────────────────────────────────┘
```

- **Sheet half (50%):** the full ranked list, scrolling inside the sheet. Filter chips (Trout/All fish segmented, "Assessed only" switch) are pinned under the header when the filter icon is tapped.
- **Chips double as legend and filter:** tapping "23 Good" filters the list and dims non-Good strokes to 30%.
- **Hatches mode:** the header becomes "October hatches ‹ ›", the chips become the top three hatches, and rows show the leading hatch per water.
- **Camera:** fit the visible-water bounds (P0-5), with padding top 72, bottom = sheet height + 16, sides 16. Restore the last camera on return.

**Desktop (1440×900):**
- **Header (56px, down from 76px):** mark plus "Trout" · Map · Match the hatch · Hatch calendar · Logbook · ◐ · ≡.
- **Left panel:** 400px wide, full height below the header, `--ui-surface`, 1px right border, no shadow. Inside it:
  - Search: 44px, radius 8, `--ui-subtle` fill.
  - Filter row: Segmented `Trout | All fish` and Segmented `All | Assessed`; the focus-species select appears only in All fish.
  - "Fishing today" header plus four status chips (wrapping).
  - The ranked list (P1-18 rows).
  - Selecting a row swaps the panel to the inspector (§6.2) with a "‹ All waters" back row (44px).
- **Map overlays:**
  - Top-left, 24px from the panel: Segmented `Conditions | Hatches · Oct`.
  - Top-right, 24px: zoom group (40×40 ×2) above a tools group (Layers, Near me, All Tennessee), both e2, radius 8, gap 8.
  - Bottom-left: a single-line legend bar ("— Good ≥70 — Fair 40–69 — Poor <40 - - No data · How scores work"), 13px, radius 12, e2.
  - Bottom-right: attribution text (11px is acceptable for attribution only), no "i" button.

### 6.2 River drawer / sheet

**Phone, half state (422px of an 844px screen):** every number visible with no scroll.

| Block | Spec |
|---|---|
| Grabber | 36×5, centered, 8px top / 8px bottom |
| Header row | Name `title-lg` (Fraunces 24/30). Subtitle `caption` 14px muted: "Wilbur tailwater · NE Tennessee". Close 32×32 circle `--ui-subtle`, right 16 |
| Stat tiles | 3-up grid at 16px gutters, 8px gap, tile radius 12, padding 10×12, min-height 76. **Today:** label "Today", value "80", qualifier "Good"; tile bg = status soft, value color = status text. **Flow:** "349", "cfs · in range" plus a 4px range bar (ideal band `good-soft`, 2px ink tick at the current value; red tick if outside). **Temp:** "—", "No sensor" (or "52°F", "in range"). Values `stat` 24/30 tabular |
| Source line | `SourceLine`: "● USGS gauge · 54 min ago · next update 4:45 PM" (dot = freshness: good <90m, fair <6h, none older) |
| Actions | Primary `Match the hatch` (flex 1, 44px), secondary `Log a day`, icon `Share` (44×44). Gap 8 |
| Tabs | `Today · Hatches · Stocking · Regs`, label 14/20 500, active = text color plus 2px underline, 44px tall |

**Full state (92%):** the header and stat tiles stay pinned (they compress to a 56px row: name 17px plus inline "80 Good · 349 cfs · —"). The Today tab content scrolls:
1. "On the water in October": hatch chips, neutral fill, 24px.
2. One safety notice for tailwaters: fair-soft, 12px radius, "Flows follow TVA releases. Check the Wilbur schedule before wading ›".
3. Special regulation card.
4. Gauges list (display names, value right-aligned tabular).
5. About this water (angler notes ≤60 words).
6. Fishery evidence (collapsed row, "Year-round trout · documented 2026 ›").
7. Sources line.

**Desktop panel:** the same content in the 400px left panel. The stat tiles are 3-up at 112px each, and the name is Fraunces 28/34. Nothing above the tiles except the back row and the name. With a 900px viewport the tiles end at y≈260.

---

## 7. Bugs noticed in passing

1. **The hatch key ranks fish as insect matches.** Steps: `/hatch-key` → #8 → olive → 2 tails → first gills option → slender → East TN Holston, October → See matches. The top results are "Central Stoneroller (Campostoma anomalum · Cypriniformes) · high confidence · hatching now 7/8" and "Bluntnose Minnow" (`m390-light-41-hatchkey-results.png`). Fish taxa in `content/taxa.json` (`order: Cypriniformes`) aren't excluded from the key. The results list is also unbounded (62,712px at @3x ≈ 20,900 CSS px).
2. **The map legend is invisible in Daybreak** (P1-1). `/` → Legend → title at 1.14:1 (`m390-light-03-map-legend-open.png`).
3. **The species controls disagree.** Open `/?species=all`: the header toggle shows Trout, the map toolbar shows All fish (`m390-light-11-map-allfish.png`).
4. **"Stocking history" shows a future month.** `/conditions/watauga-river` → Stocking history: "March 2027 · Month window · scheduled", followed by "Reported entries are past-dated published schedules…" (`detail-tw-2` crop). The label and copy contradict the data. Either filter to past dates or rename the section "Stocking schedule".
5. **Lake status contradicts its own card.** `/conditions/boone-lake` shows "Now: Unverified" and "Species unverified — the catalog does not document trout" beneath an opportunity card titled "Warmwater fishing focus" (`m390-light-20-detail-lake.png`). It also shows Stage 1,264.8 ft next to Reservoir level 1,377.6 ft with no explanation.
6. **The selected label is clipped by the zoom controls** on phones. Open `/?river=watauga-river` at 390px (`m390-light-05-map-river-watauga.png`).
7. **Wrong taxon photo caption.** `/taxa/little-sulphur` shows an image captioned "Hexagenia limbata nymph" (`m390-light-30-taxon.png`).
8. **Dead CSS.** `@media (max-width:360px) .header-search …` (`index.css:2063`) styles an element hidden at ≤640px. `LastUpdatedChip` is exported but unused.
9. **I could not trigger the catalog-error state locally.** Aborting `/v1/streams*` and `/v1/conditions*` still rendered rivers (`m390-light-62-error-map.png`), likely from the bundled `streams-geo.json` plus the Dexie cache. Worth a dedicated fixture so the error UI can be design-reviewed.

---

## 8. Roadmap

**Batch 1: "Readable today" (quick wins, about 1 week).** P0-4 (one species control) · P1-1 (legend tokens) · P1-3 (disclaimer purge, SourceLine) · P1-5 (desktop header) · P1-6 (delete map help) · P1-10 (arrows) · P1-11 · P1-13 (accent discipline) · P1-17 (three themes) · P1-19 (hide Reports) · P2-1, P2-2, P2-9, P2-13 · bugs 1–3, 7.
*Ships visible polish with almost no layout risk.*

**Batch 2: "The map answers the question" (about 1–2 weeks).** P0-1 (status strokes plus halo labels) · P0-5 (phone camera) · P1-7 (hatches mode) · P1-8 (layers sheet) · P2-10 · status tokens from §5.
*After this the map alone answers "where is it good today".*

**Batch 3: "Sheet-first mobile" (about 2 weeks).** P0-2 (search bar plus "Fishing today" sheet, desktop panel) · P0-3 (river sheet with stat tiles) · P1-4 (phone chrome down to five elements) · P1-15 (loading) · P1-16 (offline chip) · P1-18 (list rows) · P1-20 (tablet ≥720 panel) · §4 bottom tab bar · P2-4 (fold Browse into the list).
*The structural redesign, built on Batch 2's tokens.*

**Batch 4: "One system" (ongoing, 2–3 weeks, can run in parallel with Batch 3).** P1-12 (single token source, CSS breakpoint consolidation, no-hex lint) · P1-14 (component consolidation) · P1-2 (content split `notes`/`editorNotes` plus content lint) · P1-9 (detail page with mini-map) · P2-3, P2-5–P2-8, P2-11, P2-12, P2-14 · bugs 4–6, 8–9.
*Stops the drift from coming back.*
