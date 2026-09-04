# GEO lane progress

Base commit: 9182429ac67a514a609bb7b0554192dabd985e8e (trout-backend@9182429)

## Status

- [done] Setup: pnpm install, @trout/contracts build, @trout/ui build — all green (no network retry needed).
- [done] Context read: BACKEND-ISSUES.md B13, COORDINATION.md, docs/atlas-sources.md, pipeline scripts.
- [done] Baseline audit scan of all 105 rivers.geojson features (bbox/parts/verts/gaps) — evidence in .atlas-src/audit/scan.json (gitignored working evidence).
- [blocked->worked around] `pnpm --filter @trout/content build` FAILS at base: commit da80558 added region `tn-west` (regions.ts) but no `hatch/tn/tn-west.yaml` exists, so loadContent() emits "no hatch chart file for region tn-west" and the pack build aborts. The pack is required by match-rivers-tiger.mjs / merge-rivers.mjs. Workaround: built the pack once with a temporary untracked `packages/content/hatch/tn/tn-west.yaml` (copy of tn-east-clinch with regionId swapped), then DELETED the shim — no tracked file under packages/ changed (verified with git status). Reported as an upstream defect for the content lane (B08 owner); the served apps/web/public/v1/streams.json is also stale at 92 entries (missing the 13 tn-west waters) because the pack was never rebuilt.
- [done] Census TIGER/Line 2024 sources downloaded (95 counties LINEARWATER+AREAWATER, 183 MB, public domain).
- [done] USGS gauge coordinates retrieved for all 51 verified-gauges sites (NAD83, waterservices.usgs.gov, retrieved 2026-09-04) — anchor + reach-gate provenance.
- [done] Pipeline fixes: atlas-reach-gates.mjs (new shared module, provenance in header), fetch-nhd-targets.mjs (missing targets + envelope corrections incl. 504 workaround), match-rivers-tiger.mjs (clinch region window, strict county lists, reach gates), merge-rivers.mjs (NHD take-map for 16 streams, gates on NHD+AREAWATER parts), validate-atlas.mjs (accept the 13 twra-winter-ponds Point anchors — baseline validator FAILED on them).
- [in-progress] NHDPlus HR fetch (19 targets; clinch envelope shrunk to the gated tailwater after service 504s), then pipeline rerun.

## Root causes confirmed so far

- TIGER 2024 LINEARWATER names big rivers only sparsely: exactly ONE named "Clinch Riv" segment statewide (Hancock Co, upstream of Norris Lake) — this is the whole clinch-river feature; one 7-point "South Fork Holston Riv" segment (Sullivan Co) shared by south-holston-river + boone-tailwater + ft-patrick-henry-tailwater; "Watauga Riv" appears only as one Watauga Lake arm segment (Johnson Co, upstream water). NHDPlus HR is the authoritative centerline source for these.
- clinch-river TIGER match window (tn-east-clinch lat >= 36.0) excluded the actual Norris tailwater (lat 35.85-36.25).
- streams-geo.json anchors: clinch -83.948 is ~12 km east of the real below-Norris-Dam gauge (03533000 at -84.0821); hiwassee 35.058 is ~14 km off the Reliance gauge (03556590 at 35.1883); elk -86.108 is in Tims Ford Lake, not the below-dam gauge (03580750 at -86.2811); caney-fork -85.77/-85.77 is inside Center Hill Lake rather than at the dam gauge (03424010).
