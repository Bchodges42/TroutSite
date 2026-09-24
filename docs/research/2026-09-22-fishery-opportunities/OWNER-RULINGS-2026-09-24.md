# Owner rulings — 2026-09-24 (interview, recorded verbatim-intent with dates)

These are product/owner decisions recorded per the target architecture:
owner rulings are preserved with their reason and date, distinguishable from
measured biological evidence. Where a ruling exceeds published data, the
tension is stated, not hidden. Applied by `apply-owner-rulings.mjs` on branch
`fix/apply-owner-triage-20260924`.

1. **Harpeth River** — "100% a warm water river that is stocked with trout
   seasonally." → species `warmwater`; the December–February trout program
   (documented, TWRA schedule rows at Eastern Flank Battle Park) stands
   alongside it: headline `mixed`. The 2026-09-04 visibility decision still
   governs presentation (stocked warmwater = visible, de-emphasized, in
   trout mode).

2. **East Fork Stones River** — "warmwater, but stocked winter/seasonally."
   → species `warmwater`, stockingProgram `true`, winter programmatic window.
   TENSION (preserved): the committed TWRA schedule/GIS holds no rows naming
   the East Fork under the names searched; the winter claim rests on the
   owner ruling + the area's winter-program pattern. Data question for TWRA:
   which published rows/locations constitute the East Fork stocking?

3. **Little Pigeon River** — "stocked every week in Gatlinburg and has wild
   trout in it as well." → fishery `wild+stocked`, headline `year-round-trout`
   (evidenceState limited), reach-scoped to the Gatlinburg/Pigeon Forge
   corridor. IDENTITY NOTE: the documented weekly program (forecast node
   n-4U71UT + Gatlinburg Streams rows) is the WEST PRONG through Gatlinburg —
   the separate west-prong-little-pigeon feature, which also gains
   `wild+stocked` for consistency. Main-stem-specific published rows were not
   found; the main-stem call rests on the owner ruling.

4. **Smallmouth bass policy** — "I don't know why we would need to look for
   claims of smallmouth bass… it's Tennessee, they are genuinely in probably
   every river and waterway in the state." → POLICY: smallmouth bass (and the
   common TN warmwater suite) are AMBIENT statewide; per-water citation
   hunts for their presence are retired. Listing them on TN warmwater waters
   needs no per-water source (a blanket range/provenance note suffices);
   waters may keep their smallmouth tags. Applied now: harpeth-river keeps
   its smallmouth tag (the 'unsupported' concern is withdrawn by this
   ruling). This policy does NOT extend to trout claims of any kind.

Smallmouth caveat kept honest: "probably every" is ambient presence, not a
survey — the policy covers PRESENCE LISTING, never abundance or fishery
quality claims.
