# Review of `feat/evidence-backed-fisheries-20260922` at `6f8c42a`

Review date: 2026-09-22. Base: `origin/main` at `d1e48d1`. This is a read-only review of the pushed implementation branch; no implementation files were changed. The branch's 190-row ledger and headline counts were reproduced from the committed JSON. This review does not independently certify every water's ecological conclusion or repeat the reported visual/test suites.

## Decision

The evidence model is a major improvement, particularly the explicit 35 unresolved waters, reach scopes, and separation of schedule from completed releases. **Do not merge this exact commit yet.** The new evidence cards coexist with known incorrect legacy season fields that still drive user-facing status and absence language. There are also reproducibility and publication-claim problems that should be corrected before the branch is treated as an audited source of truth.

## Findings

### P1 — Known wrong season fields still publish contradictory guidance

The committed `owner-corrections-report.json` calls `seasonMonths` wrong for **22 waters** (identified by the report's own wording). At least one is directly reproducible from the committed TWRA 2026 schedule capture: `brush-creek-cocke` has five `Seasonal` stocking weeks on March 8, March 22, April 5, April 19, and May 3. Its new `opportunity.statement` accurately says March–May, but the committed catalog still has `seasonMonths: [12, 1, 2]` and `seasonKind: programmatic` (`packages/content/streams/tn/brush-creek-cocke.yaml`, lines 29–46). `waterDecision.ts` lines 142–150 computes `inSeason` from those old months, and lines 285–317 emits “out of season,” “stocked trout are unlikely to be present,” or “in season” from them. Thus the same water can say March–May stocked opportunity and “out of season” in May, or “in season” in January. This is not just an owner-side catalog TODO; it is live product behavior. The visual gate sampled other states, not this conflict.

Repair criterion: reconcile or suppress every known-wrong `seasonMonths` field before it drives status. Stocking *event months* must not silently become a fishing season or an absence inference. Add a regression covering a spring-stocked water in May and January and make the card/chip/condition copy consistent.

### P1 — The ledger's strongest absence-sounding claims exceed its evidence rule

The model says it has zero `no-trout` verdicts, which is true of its enum values, but the committed headline prose has many absolute absence statements. Examples: `big-sandy-river` says “no trout program or trout record exists anywhere on the river”; `east-fork-obey-river` says “no trout program or trout record exists on the fork”; `mississippi-river` says “no trout program exists anywhere on the reach” despite preserving an uncorroborated community trout lead. These are stronger than “none found in the cited current schedule/regulation/survey.” The 190-water ledger contains 75 headline statements matching a broad “no trout” phrase search (many are properly qualified, so 75 is **not** a count of errors). The verifier's purported prose guard at `packages/content/scripts/opportunity/verify-ledger.mjs:101` is a ternary expression that returns `true` on both branches; line 102 only catches the literal `"no-trout"` label. Accordingly, its `0 errors / 0 warnings` result does not validate prose against the no-absence rule.

Repair criterion: audit the published absolute claims, scope negative results to a named dataset/date/reach, and use “not documented” or unresolved where coverage is incomplete. Replace the always-passing check with a meaningful targeted assertion or reviewed exception list.

### P2 — The committed source log does not reproduce every declared capture

`docs/research/2026-09-22-fishery-opportunities/captures/source-log.json` records six TWRA captures. The logged 513,600-byte `twra-stock-locations.json` (the 730-point GIS result) is **absent** from the branch, although the report says raw captures were committed alongside the log. The log's `file` values all point to `evidence-work/captures/...`, while the committed files are in `docs/research/2026-09-22-fishery-opportunities/captures/...`. Comparing `git show` bytes to the log's size and SHA-256: schedule, recent releases, and forecast match; trout-page HTML and stock-locations metadata do not. The metadata mismatch is precisely explained by LF-to-CRLF conversion (the logged hash matches when every committed LF is expanded to CRLF); the trout-page mismatch was not resolved in this review. This makes the source log unreliable for verifying the committed snapshot, especially the missing GIS join input.

Repair criterion: commit the exact GIS response (or provide a deterministic acquisition script plus an immutable, independently verifiable archival copy), correct file paths, and log hashes for **committed bytes** or explicitly define line-ending normalization. Re-run the source-log verifier against the checked-in artifacts.

### P2 — Trail Fork carries a stale present-tense wild-rainbow claim

`packages/content/streams/tn/trail-fork-big-creek.yaml:38-43` says the upper reaches have “a documented wild rainbow population” and repeats that rainbows are “documented upstream.” Its cited pinpoint is a **2017** trout-management-plan statement (lines 59–62). The same branch's caveat calls the wild-rainbow material historical, while the [2021 Trout Unlimited account](https://www.tu.org/magazine/conservation/from-the-field/brookies-in-tennessee-get-a-new-improved-home/) describes rainbow removal above the waterfall before brook-trout transfer. The documented **lower-reach 2026 stocking program** is sound; the upper-reach wild-rainbow wording should be explicitly historical and should not suggest verified 2026 occupancy.

Repair criterion: date the wild-rainbow observation in both statement and reach scope, preserve the reach split, and leave brook persistence unresolved pending post-transfer monitoring.

### P2 — Old species citations can still look authoritative in the product

For example, `packages/content/streams/tn/boone-lake.yaml:19-47` retains seven `speciesEvidence` entries whose agency URL is a USGS **water-monitoring-location** page (`03486810`), not a fish assemblage or species source. I reopened that USGS page on 2026-09-22: its title is “South Fork Holston River at Boone Dam(tw), TN,” so it describes the **tailwater, not Boone Lake**, and its returned HTML contains none of the cited species names. The branch's correction report says the species list is consistent with the TWRA live page, but it does not replace these seven claim-specific citations. Its own Harpeth correction identifies the same error pattern for a smallmouth claim. The new opportunity sources do not cure unrelated species citations that are still exposed through existing surfaces.

Repair criterion: replace each species evidence URL with a primary fishery/species source that actually names the water and species, or remove the unsupported citation. Audit the remaining agency-kind `speciesEvidence` links for monitoring-station-only URLs.

### P3 — Completion report overstates some deliverables

The implementation report says “draft PR opened” (`docs/reports/2026-09-22-evidence-backed-fisheries.md:5`), while the owner says no PR exists. It also lists `apps/web/scripts/prerender.mjs` as changed (line 147), but that file is absent from `git diff --name-only origin/main...6f8c42a`; the claimed prerender behavior may arise through shared UI, but the file-change statement is false. The report says the 730-point GIS raw capture was committed (lines 177–180), contradicted by the Git tree. Correct the report so review history does not imply verification artifacts that are not in the branch.

## What I verified, and what remains open

- Reproduced the ledger counts: 29 year-round trout, 58 seasonal stocked, 55 warmwater focus, 13 mixed, 35 unresolved, for 190 total.
- Read the committed TWRA schedule JSON and verified Brush Creek's five March–May rows directly. This is schedule evidence, not proof that each stocking occurred.
- Checked all six source-log IDs against the Git tree and hashes. Three match exactly; one is missing; one is a line-ending mismatch; the HTML mismatch remains unexplained.
- Read the opportunity schema, decision logic, catalog application and verifier scripts. I did not run the branch's full test/build/visual suite from this review clone, and the asserted 10/10 visual pass is not independently reproduced here.
- Fishbrain reuse rights, precise reach identity for unresolved waters, and the TWRA calendar/composition questions remain owner/source follow-ups, as the implementation report notes.

The first repair pass should address the season/status contradiction and absence wording, then make the capture log reproducible and correct the stale claim/citation examples. After that, rerun the ledger validator and target visual checks on the previously missed spring-stocked states.
