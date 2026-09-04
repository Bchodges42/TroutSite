# Parallel session briefs — trout rebuild

Each brief is self-contained: paste the whole brief into a FRESH ZCode session. Every session works in **its own clone** (no shared node_modules/dist/git), records its base commit, and touches only its listed scope. Merge order is handled by Benjamin/ZCode in the integration lane — never merge into another session's checkout.

**Rules for every session (include verbatim):**

```
Never modify C:\Users\Benjamin\Projects\trout (frozen reference) or
C:\Users\Benjamin\Projects\trout-fieldwork-20260904 (Codex UI branch, under review).
Record your base commit as the first line of a PROGRESS.md at your repo root and
keep PROGRESS.md current (done / in-progress / blocked + evidence).
Commit small with messages tagged for your lane (e.g. "geo(audit): ...").
Verify with pnpm --filter @trout/web typecheck && test && build before finishing.
Read C:\Users\Benjamin\Projects\trout-backend\COORDINATION.md first for lane context.
```

---

## Session GEO — B13 river-geometry audit (P1)

```
Clone C:\Users\Benjamin\Projects\trout-backend to C:\Users\Benjamin\Projects\trout-geo (git clone --no-hardlinks; robocopy apps/web/public/v1 and apps/web/public/content from trout-backend afterward — they are gitignored but required). Work ONLY there.

Task: BACKEND-ISSUES.md B13 (read it first: C:\Users\Benjamin\Projects\trout-fieldwork-20260904\BACKEND-ISSUES.md). Audit every stream in apps/web/public/v1/streams.json against apps/web/public/atlas/rivers.geojson reaches and apps/web/src/data/streams-geo.json gauge anchors. Known bad: clinch-river mapped to a fragment while it is the Norris tailwater; boone-tailwater and south-holston-river share identical tiny bounds; cane-creek spans disconnected longitudes.

Produce: (1) docs/GEO-AUDIT.md — per-stream verdict table (ok / fragment / duplicate / misjoined / missing) with bbox evidence and the official reach you matched, each with provenance; (2) corrected geometry for clear defects using USGS NHDPlus HR / TIGER (public domain) via the existing pipeline scripts in apps/web/scripts (fetch-nhd-targets.mjs, match-rivers-tiger.mjs, merge-rivers.mjs, then merge-west-tn-points.mjs); (3) corrected streams-geo.json anchors where gauges prove them. Scope: apps/web/public/atlas/rivers.geojson, apps/web/src/data/streams-geo.json, docs/, pipeline scripts — nothing else. Do NOT edit apps/web/src/features or pages.

Done when: audit table covers all 105 waters, every defect either fixed with provenance or explicitly listed as unresolved-with-reason, validate-atlas.mjs passes, build + tests green. NOTE: zoom-to-water metadata in Codex's UI (riverIndex.json) is regenerated AFTER integration — leave it alone.
```

---

## Session SPECIES — B08 species applicability (P2)

```
Clone C:\Users\Benjamin\Projects\trout-backend to C:\Users\Benjamin\Projects\trout-species (same snapshot copies as in the GEO brief). Work ONLY there.

Task: BACKEND-ISSUES.md B08. All 92 real catalog streams (now 105 with the West TN winter ponds) omit optional `species`, and the UI cannot honestly offer trout/all-fish filtering or warmwater treatment. Author the data: for every stream in packages/content/streams/tn/*.yaml, set `species` (trout | warmwater) from the existing notes/EXTRA_NOTES evidence in apps/web/scripts/generate-fixtures.mjs (the WARMWATER_IDS list there is the working hypothesis — promote it into the YAML as reviewed fact, entry by entry), and add a one-line seasonal applicability note where the TWRA catalog notes support it (e.g. West TN ponds are winter-put-and-take only). Keep TWRA source URLs on every entry.

Produce: updated YAMLs + docs/SPECIES-REVIEW.md listing every judgment call and the evidence used, flagging any stream where evidence is thin (leave those unset rather than guessing). Scope: packages/content/**, docs/. Do NOT touch apps/web/src — the fixture generator already prefers YAML/geometry properties.

Done when: every stream has an explicit species or a documented thin-evidence flag; fixtures:generate runs clean; build + tests green.
```

---

## Session TOPO — B14 relief/contour assets (P2)

```
Clone C:\Users\Benjamin\Projects\trout-backend to C:\Users\Benjamin\Projects\trout-topo (same snapshot copies). Work ONLY there.

Task: BACKEND-ISSUES.md B14. Current topo assets: public/atlas/topo/hillshade/*.webp are opaque RGB (no alpha) so they cannot sit on a dark ground, and contour bands carry acquisition-extent edges outside Tennessee that read as a rectangular border at zoom 8-9 in East TN.

Fix at the asset layer: regenerate hillshade as transparent shadow-only WebP (alpha where slope illumination is neutral; keep USGS 3DEP provenance — see docs/topo-sources.md and scripts/build-topo.mjs / fetch-tn-dem.mjs), and clip contour bands to the real Tennessee boundary polygon (+ a small buffer) using the existing tn-boundary.geojson, so no acquisition edges exist to mask. Preserve tile schema, bounds, naming, and cache budgets documented in docs/topo-sources.md; run validate-topo.mjs.

Scope: apps/web/public/atlas/topo/**, apps/web/scripts/build-topo.mjs / fetch-tn-dem.mjs / validate-topo.mjs, docs/topo-sources.md. Do NOT touch mapStyle.ts or any UI file — Codex's masking layers stay until your assets land, then the integration session removes the masks.

Done when: hillshade tiles have alpha, contour bands contain no vertices outside TN-boundary+buffer, validate passes, file-size delta documented in PROGRESS.md.
```

---

## Merge order (handled by Benjamin/ZCode integration lane — not the sessions)

1. **INTEGRATION** (single-threaded, first): commit Codex's UI branch as-is → merge trout-backend `main` into it → take Codex's UI in conflicts, re-attach the data hooks (assessed flag, newestReadingAt freshness, stockingMatch, feeds status, point layers) in Codex's rebuilt files → regenerate v1 snapshots → full suites + e2e.
2. Session TOPO, Session GEO, Session SPECIES merge after integration in that order (TOPO is fully disjoint; GEO owns river geometry; SPECIES is content-only).
3. B12 (roads) stays deferred until Benjamin makes a licensing/source decision.
