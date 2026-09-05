# Backend / data handoff to Benjamin & ZCode

UI owner: Codex, isolated branch `codex/trout-fieldwork-20260904`.

Process change received September 4, 2026: this branch owns UI/UX only. Do not read visual verification as validation of unresolved upstream data. Backend, data semantics, serving, offline caching, and infrastructure belong to Benjamin/ZCode. The original checkout remains untouched.

## Non-UI edits made earlier, now reverted

All below have been restored to baseline commit `51f88033677365ecb354624f942338f5beea18c6` using targeted patches, not a reset/stash/checkout:

| File                                             | Earlier edit                                                                                                                                                                               | Current disposition                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/conditions.ts`                 | Required same-gauge distinct timestamps for flow trend; guarded cross-gauge what-changed flow comparison; allowed zero flow                                                                | Reverted. Backend should implement and test flow and temperature continuity.                                          |
| `apps/web/src/lib/snapshots.ts`                  | Read saved data first while offline; added an 8-second network timeout                                                                                                                     | Reverted. No offline caching changes retained.                                                                        |
| `apps/web/vite.shared.ts`                        | Served `/v1/streams` from the copied `public/v1/streams.json` in dev/preview                                                                                                               | Reverted. Catalog serving needs an upstream fix.                                                                      |
| `apps/web/src/features/map/useRiverMapData.ts`   | Enabled report/stocking requests; typed snapshots; parallel/month-keyed hatch requests; populated counts; changed stocking matching; used source timestamp; assessment-availability checks | Reverted in full. Original data hook retained.                                                                        |
| `apps/web/src/features/map/riverMapSelectors.ts` | Allowed a genuine zero score to remain Poor when data exists                                                                                                                               | Reverted. Backend must supply explicit assessment availability.                                                       |
| `apps/web/src/lib/presentation.ts` (new)         | Added `hasAssessment`, `conditionFreshness`, `stockingMatches` helpers                                                                                                                     | Those semantic helpers removed. Only display sorting, temperature-prose formatting, and name/reach typography remain. |

No fixture values, contracts, schemas, API, database, infra, geographic geometry, content pipeline, or source snapshots were edited. Copied baseline `public/v1` and `public/content` are unchanged. `riverIndex.json` is strictly UI label/viewport metadata derived from existing geometry, not substitute river geometry. Map worker configuration is the original same-origin Vite worker binding, preserved unchanged in function.

## Open dependencies

### B01 · P1 · Frozen catalog endpoint does not resolve in isolated Vite preview

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ 7363324 — static-server + vite dev/preview now resolve extensionless /v1|data|content routes to .json, non-HTML misses are real 404s, no-store enforced. Verified by curl on all three serving layers. The UI test-only seam can stay.

- **Evidence:** `packages/contracts/src/endpoints.ts`, `ENDPOINTS.streams` is `/v1/streams`; copied snapshot is `apps/web/public/v1/streams.json`. `apps/web/vite.config.ts` only adds special handling for `/fixtures/data/`; `vite.shared.ts` has no catalog alias. Fresh browser receives SPA HTML, not the catalog. Already-populated Dexie can hide this.
- **UI needs:** `/v1/streams` returns validated JSON on the production/preview origin; missing API/assets return a real error, not HTML with status 200.
- **Suggested fix:** implement the frozen route in the owned local/API/static serving layer. Do not change the contract URL. Verify clean-profile startup, full list, and offline install.

### B02 · P1 · Assessment availability cannot be inferred from score zero

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ 866a7a8 — ConditionScore.assessed flag from scoreConditions (real clamped-0 = Poor; cannot-assess = no-data); statusForScore honors it; fixtures regenerated. Regression-tested incl. lethal-temp clamp.

- **Evidence:** `riverMapSelectors.ts:7–14` treats `score === 0` as no data. Actual copied `public/v1/conditions/latest.json` has four legitimate zero assessments (Clear Creek/Obed, Clear Fork, Daddy’s Creek, Stones River) with flow/stage plus harmful heat. Hiwassee has only a temperature observation but a score of 10. `packages/contracts/src/scoreConditions.ts` permits temperature penalties to reach zero.
- **UI needs:** explicit available/unavailable assessment status, applicability, and supplied score/reasons. Zero Poor and unavailable must be distinct without UI recomputation.
- **Suggested fix:** resolve relevant gauges and usable flow/stage upstream, provide stable availability/applicability fields or a shared contract selector, add actual-snapshot regression tests. Preserve score formula and existing score values unless intentionally versioned.

### B03 · P1 · Fetch time masquerades as observation freshness

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ 866a7a8 — freshness now keyed to newest reading timestamp (newestReadingAt/readingAgeMinutes/readingsAreStale in contracts; READING_STALE_MINUTES=180). Chip/drawer/pages label Live·observed / Stale·observed / Offline. SW-preserved original fetch age still open (recommendation).

- **Evidence:** `apps/web/src/lib/snapshots.ts:45` assigns `Date.now()` after HTTP success; `useRiverMapData.ts` forwards browser fetch time and `live`. Condition payloads have `fetchedAt`, `nextExpectedUpdate`, and reading timestamps. Obed has a July observation inside a September-generated snapshot.
- **UI needs:** separate transport state (network/cached/offline), snapshot generation time, observation time, and stale/expired state, including simultaneous cached+stale and offline+stale. UI now labels timestamps conservatively and does not invent live observations.
- **Suggested fix:** define/test freshness semantics upstream; keep stale cached data available but explicitly tagged. Preserve original fetch age when service workers return saved responses.

### B04 · P1 · Flow/temperature trends can compare different gauges

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ ba28b05 — flowTrend/whatChanged pair readings within ONE gauge with distinct timestamps; zero cfs is a value; newest gauge pair wins. Tests added.

- **Evidence:** `apps/web/src/lib/conditions.ts:10` sorts all gauges then compares the first two. `whatChanged` has the same cross-site risk, including temperature. `apps/api/src/ingest/usgs.ts` emits one latest observation per gauge. Actual Harpeth has 31.1 cfs/15.4°C at 03432350 and newer 41 cfs/27.8°C at 03433500.
- **UI needs:** an actual same-gauge time-series trend or explicit unavailable state, not a cross-site delta. New visual metric ordering shows newest timestamps, but does not repair the model.
- **Suggested fix:** compare distinct timestamps from the same configured gauge; support zero flow; return unknown without a valid pair. Test changes in participating gauges.

### B05 · P1 · Stocking association is ambiguous

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ 75c5d18 — lib/stockingMatch.ts: exact normalized name -> curated TWRA alias table (real schedule names) -> unambiguous word-boundary containment; ties stay unmatched. Real-feed smoke test included.

- **Evidence:** `useRiverMapData.ts:95` matches only the first word. Even a full substring creates collisions: East Fork Shoal vs Shoal; Little Sequatchie vs Sequatchie; Normandy TW/Duck matches both Duck reaches; Tims Ford TW/Elk matches both Elk reaches.
- **UI needs:** exact river IDs for schedule rows or a verified unambiguous association. Unknown/ambiguous rows must not appear as that water’s stocking.
- **Suggested fix:** resolve globally against canonical IDs/aliases, prefer the most-specific name, use explicit tailwater aliases, leave unresolved ties unmatched. Do not import fixture species assignments as truth.

### B06 · P2 · Reports/stocking queries are permanently disabled

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ 75c5d18 — reports/stocking queries enabled; hook exposes per-feed {isLoading,isError,empty}; counts derived from matched data.

- **Evidence:** `useRiverMapData.ts:50–51` passes `false` for both queries; counts are hardcoded to zero. Actual copied data has 623 stocking rows and zero reports. Disabled queries may appear populated only after visiting another page in the same session.
- **UI needs:** reliable per-feed loading/error/empty/cached states and counts, query activation on relevant tab, correct attribution URLs.
- **Suggested fix:** wire feed requests in the owned adapter; expose explicit status for each feed. No-report is valid for this snapshot but cannot be inferred from a never-run request.

### B07 · P2 · Month-dependent hatch data can be stale or slow

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ d0997a7 — useQueries over ["snapshot",url] keys: concurrent, month-keyed, progressive, offlineFirst cache shared with useSnapshotQuery; no prior-month substitution.

- **Evidence:** `useRiverMapData.ts:115–129` fetches 11 regions sequentially and keeps prior month results until all finish. Existing root callers historically load current month in conditions mode while linking to another month.
- **UI needs:** charts keyed to the selected month/region with loading/empty/error state. Abundance is 1–5 and guidance is seasonal, not observed activity.
- **Suggested fix:** use month-keyed concurrent/cache-aware queries; clear/label previous-month values while loading. UI labels now use real taxa/pattern names and actual entry timing.

### B08 · P2 · Species applicability is absent in real catalog

- **Backend status (ZCode, 2026-09-04):** OPEN — needs authoritative species/applicability data decision (TWRA seasonal classifications). Content-lane task, not started.

- **Evidence:** all 92 copied real streams omit optional `species`. Fixture classifications conflict with catalog seasonal-stocked notes (e.g. Harpeth, West Fork Stones). `useRiverMapData.ts` defaults unspecified species to trout.
- **UI needs:** authoritative species/model applicability and seasonal context. “All fish”/“Trout” cannot be accurately filtered from missing metadata.
- **Suggested fix:** populate vetted catalog classifications, including seasonal applicability, and define unknown state. Do not infer from names or fixture IDs.

### B09 · P2 · Stocking dates lose publication precision

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ 419baed — StockingEvent.datePrecision (day|week|month) set by the ingest tier; optional field, backward compatible. UI should phrase week/month rows as published schedule.

- **Evidence:** `apps/api/src/ingest/stocking/tn.ts` normalizes month/week dates to a first-day ISO value; contract exposes only `date`. Actual future entries include March 1, 2027 for schedules rather than a verified stocking day.
- **UI needs:** month/week/day precision, schedule-vs-completed status, fetched timestamp, and source URL.
- **Suggested fix:** retain original precision upstream. UI says “Published schedule” and asks anglers to verify timing at TWRA; it does not say stocked today.

### B10 · P2 · Offline cache route and typography coverage need review

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ fd23f57 — unanchored snapshot runtimeCaching regex (the ^/ pattern could never match a full href), .woff2 precached, offline short-circuit + 8s fetch timeout. Full clean-profile offline install verification still to run (integration session).

- **Evidence:** `vite.shared.ts` Workbox snapshot URL regex is anchored at `^/` although RegExpRoute tests full URLs (the topo rule already documents this); precache globs omit `.woff2`. `snapshots.ts` retries network before reading saved records.
- **UI needs:** clean install and return visits offline with working catalog, hatch references, map, and typography; accurate stale labels.
- **Suggested fix:** review owned Workbox routes/cache headers, precache intended fonts, keep runtime snapshots current, test production build offline with a clean profile. No fixes retained in this UI branch.

### B11 · P2 · Demonstration build provenance flag

- **Backend status (ZCode, 2026-09-04):** FIXED in trout-backend @ 419baed — vite.fixtures.config stamps import.meta.env.FIXTURE_BUILD unconditionally; lib/provenance.ts exposes isDemoData/provenanceLabel for the banner.

- **Evidence:** `vite.fixtures.config.ts` copies synthetic fixtures after build but `fixtureDefine` only checks `DEV_FIXTURES=1`. A fixture build can therefore present synthetic data without an explicit demo flag. Fixture reports link to example.com.
- **UI needs:** a stable build/data provenance flag. The UI has a demonstration banner when the flag is supplied.
- **Suggested fix:** define demo provenance for fixture builds without incorrectly rewriting production URLs; prefer an explicit contract/build field over guessing from URL.

### B12 · P3 · Roads / complete contextual cartography not supplied

- **Backend status (ZCode, 2026-09-04):** UNBLOCKED — Benjamin approved road data on 2026-09-04 conditional on a free license (public domain / CC0; OSM/ODbL explicitly rejected). Session C (trout-roads) delivers the TIGER 2024 road assets + manifest; Session A already wired the graceful map layers (roads render only when /atlas/roads/manifest.json lists files, always beneath water, themed via --map-road).

- **Evidence:** `apps/web/public/atlas` contains boundary, counties, water geometry, place centroids, and local relief; no road geometry/source exists.
- **UI needs:** optional first-party licensed road/context data with provenance, zoom bounds, and offline budget if roads are expected. Theme exposes a road token; no fictitious road lines are added.
- **Suggested fix:** provide through the geographic-data owner, separately from UI work. Preserve current same-origin/privacy constraints.

### B13 · P1 · River geometry/reach associations need upstream verification

- **Backend status (ZCode, 2026-09-04):** FIXED — GEO lane (trout-geo, 8 commits, merged @ a629850): 19 streams corrected from NHDPlus HR/TIGER with gauge-gated provenance (Clinch/Watauga fragments, three SF Holston duplicates, Duck+Elk reach splits, Obey/Hiwassee/French Broad missing lines, Ocoee split, four creek stubs); streams-geo.json rebuilt with 41 gauge-proven anchors; docs/GEO-AUDIT.md has the 105-row verdict table. Catalog gauge 03596000 (duck-river-tailwater) flagged: it sits above Normandy Dam — content follow-up.

- **Evidence:** `apps/web/public/atlas/rivers.geojson:1` (minified) assigns `clinch-river` to a small reach bounded by −83.349059/36.447078 and −83.256344/36.499205. The catalog names it “Norris tailwater”, while the existing gauge-location file `apps/web/src/data/streams-geo.json:9` places that water at −83.948/36.222. The same geometry file gives `boone-tailwater` and `south-holston-river` identical tiny bounds (−81.999167/36.593764 to −81.998676/36.594457). `cane-creek` spans disconnected longitudes −87.788792 to −85.303799. Browser selection faithfully reveals these discrepancies; the new UI index copies the existing geometry's bounds.
- **UI needs:** verified canonical geometry for each named reach, with distinct tailwaters and complete/selectable extents. Zoom-to-water should frame the actual named fishery.
- **Suggested fix:** geographic-data owner should audit name/ID joins, aliases, clipped fragments, and duplicate geometries against official reaches; supply corrected first-party assets with provenance. Regenerate the UI-only label/viewport index from the approved geometry afterward. No geometry was changed here.

### B14 · P2 · Opaque hillshade tiles cannot blend cleanly onto a dark ground

- **Backend status (ZCode, 2026-09-04):** FIXED — TOPO lane (trout-topo, 2 commits, merged @ 27eafeb): hillshade rebuilt as transparent shadow-only lossless WebP (531 tiles, hasAlpha verified per-tile), contours clipped to the TN boundary + 3 km buffer (1,015,240 edge vertices removed, 810 boundary-tracing rings dropped, zero new deps). validate-topo PASS. The UI masking layers can now be simplified (optional cleanup, kept for now — they are visually inert).

- **Evidence:** `apps/web/public/atlas/topo/hillshade/9/139/201.webp` is 256×256 RGB WebP with `hasAlpha: false` (verified via image metadata). The existing raster source in `apps/web/src/features/map/mapStyle.ts` covers a rectangular TN bounding box, not the state polygon. Its light pixels created the white/gray rectangle Benjamin reported in Nightfall.
- **UI needs:** terrain that preserves the dark cartographic ground, without displaying the rectangular image footprint.
- **Suggested fix:** if shaded relief is desired in Nightfall, the asset owner should provide a transparent shadow-only relief layer or a suitable DEM/hillshade source, with bounds/provenance/cache budgets. Do not alter existing geographic geometry.
- **UI disposition:** fixed visually: Nightfall uses the existing contour layers and hides the light raster layer; Daybreak retains softly shaded relief. No tile generation, image bytes, serving, or caching changed.
- **Follow-up from Benjamin:** zooming into East Tennessee also reveals a rectangular border in the contour assets, even with the raster hidden. `apps/web/public/atlas/topo/contours-band0.geojson:1` and related bands have acquisition-extent edges outside the actual state. UI now draws the existing neighboring-state fills above relief to mask those extents and renders Tennessee's genuine outline above that mask. Upstream can additionally clip/remove acquisition-boundary contour edges; no geometry bytes were changed here.

## Exact source anchors / verification notes

The terrain UI also includes `apps/web/src/features/map/terrainClip.json`, an inverse visual fill using the exact unchanged Tennessee boundary ring as a hole. This covers relief in non-neighbor states absent from the baseline context file (e.g. the South Carolina corner). It is UI-only display masking, not a corrected/replaced state or river dataset. All `public/atlas` source assets remain untouched.

Final boundary audit: all five reverted files and all 777 `public/atlas` files are byte-identical to the isolated baseline, with no added/missing atlas files. The inverse mask's 1,689-point closed hole exactly matches the original Tennessee boundary ring. East Tennessee rendering is covered by browser pixel checks at zoom levels 8 and 9 in both themes.

- B01: frozen endpoint at `packages/contracts/src/endpoints.ts:26`; fixture-only dev middleware at `apps/web/vite.config.ts:10`.
- B02: existing UI selector at `apps/web/src/features/map/riverMapSelectors.ts:7`; unchanged snapshots at `apps/web/public/v1/conditions/latest.json:1`.
- B03: transport timestamp assigned at `apps/web/src/lib/snapshots.ts:35`, forwarded at `apps/web/src/features/map/useRiverMapData.ts:108`.
- B06–B08: disabled requests at `useRiverMapData.ts:50`; feature construction at `:74`; sequential monthly loop at `:121`.
- B09: schedule precision collapses at `apps/api/src/ingest/stocking/tn.ts:142` and `:149`.
- B10: precache configuration at `apps/web/vite.shared.ts:106`, snapshot route regex at `:112`.
- B11: fixture copy at `apps/web/vite.fixtures.config.ts:17`, provenance define at `apps/web/vite.shared.ts:144`.

The focused Playwright suite contains a clearly labeled **test-only** `/v1/streams` response seam using the unchanged copied catalog. It allows UI interaction verification while B01 is unresolved; it is not a production adapter or serving fix. A separate test exercises a failing catalog. Real production offline/cold-start guarantees remain the backend owner's responsibility.

### B15 · P1 · Reference waterbodies lack canonical interactive catalog geometry

- **Backend/data status (ZCode, 2026-09-04):** FIXED — all three crews landed and merged: LINES (8 missing main-stems from NHDPlus HR, incl. the Mississippi boundary corridor), STILLWATER (28 polygons: 13 West TN ponds upgraded point->polygon — 6 NHD, 7 imagery-traced and flagged approximate — Pickwick, and the 14 passive Census lakes promoted), CATALOG (23 YAML stubs, honest-unset species/gauges). Contract properties (waterbodyType/approximate) stamped on all 128 atlas features; riverIndex regenerated. Gates: validate-atlas PASS, continuity audit PASS (0 unexpected), 89 web + 11 content tests, browser suite 21/21, build + budget OK. Open follow-ups: paris-city-park-lake alias confirmation (Green Acres vs Eiffel Tower pond); duck-river-tailwater above-dam gauge 03596000.
- **What's wrong:** the supplied Tennessee reference contains 29 distinct named waters. Fourteen lake polygons exist only in the passive basemap; eight named main-stem rivers and Pickwick Lake have no matching geometry; six catalog river geometries cover shorter managed reaches than the reference; and all 13 requested West Tennessee winter waters remain Point placeholders. Existing interactive features also omit the required `waterbodyType` and `approximate` geometry properties.
- **Evidence:** `apps/web/public/v1/streams.json:1` has 105 catalog rows but no rows for the 14 reference lake polygons or eight missing main-stem rivers; `apps/web/public/atlas/rivers.geojson:1` contains 92 MultiLineStrings and 13 Points, with zero Polygon/MultiPolygon features; `apps/web/public/atlas/lakes.geojson:1` contains 23 passive MultiPolygons, including 14 reference lakes but not Pickwick Lake. The exact cross-check and alias decisions are in `docs/REFERENCE-WATERBODY-INVENTORY.md`.
- **UI needs:** one canonical catalog ID and one approved interactive geometry per inventory row, required geometry metadata (`id`, `name`, `waterbodyType`, `source`, `approximate`, `labelAnchor`, `bounds`), no passive/interactive duplicates, and a regenerated river index. This lets the shipped polygon layers, shared fiche, species filtering, labels, camera fitting, and pointer/touch selection operate on the same stable ID.
- **Suggested fix:** source/trace geometry from authoritative hydrography or approved imagery, never from the reference artwork; promote verified lake polygons into the interactive source alongside matching catalog/YAML records; replace all 13 Points in place under their current IDs; complete fragmented main stems only where the inventory calls for them; run the per-row checklist before merge.
- **Severity:** P1 — without these data contracts, the UI can render and select polygons correctly but cannot honestly make every reference waterbody a real interactive feature.
- **UI boundary:** no geometry, generated snapshot, catalog, pipeline, schema, API, or asset-serving edit was made for B15. The only polygon fixture is test-only and is never written to production assets.
