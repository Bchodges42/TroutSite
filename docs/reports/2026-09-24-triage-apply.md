# Triage apply — owner-approved corrections applied (2026-09-24)

**Branch:** `fix/apply-owner-triage-20260924` (off `research/owner-triage-20260924` @ `4aab84a`, which carries the repair `3c773d6`). **Not merged; merge = deploy is the owner's call.**
**Approvals this lane acted on (owner, 2026-09-24):** the 17 research-resolved triage items + Trail Fork owner-fact line; **adopt `wild+stocked`** for reach-split fisheries (contracts 2.4.0, ADR 0011); **keep `display: featured`** on parksville-tailwater (identity clarified: it is the Ocoee No. 1 reach below Parksville Dam — a stocked TWRA tailwater program adjacent to the Ocoee recreation corridor; the limited-evidence card keeps the honesty). **Deferred by the owner:** the 9 legacy-tag strips, pending the digest at the end of this report.

## Catalog changes applied (29, all with dated `Triage apply (2026-09-24):` note lines; script: `packages/content/scripts/opportunity/apply-triage.mjs`, idempotent)

| Class | Waters | Change |
|---|---|---|
| Repair-gap window removals | north-prong-barren-fork, tellico-lake, watauga-river-wilbur-reach (+ fishery mirroring nulled on the latter) | stale programmatic `seasonMonths`/`seasonKind` blocks removed |
| Regulatory window authored | doe-river | `[10,11,12,1,2]` + `seasonKind: regulatory` (DH C&R Oct 1–Feb 28, live-verified) |
| Calendar-side alignment | watauga-river | `[3..12]` → `[3..9]` (schedule+forecast side; static Mar–Dec conflict preserved in ledger) |
| yearRound / stockingProgram | dale-hollow-lake, south-holston-lake (→ true), parksville-lake (→ true/true) | per the TWRA year-round reservoir list + captured pages |
| Region fixes | mill-creek-overton → tn-upper-cumberland; standing-rock-creek → tn-west | each water's own HUC contradicted its old tag |
| Identity | puncheon-camp-creek counties Campbell → Grainger | schedule COUNTY + all 7 GIS points agree |
| False-claim note fixes | elk-river AND elk-river-lower ("winter stocking in Lincoln County reaches" → the Stone Bridge Park pond fact), clinch-river (reach trimmed to Hwy 61), melton-hill-lake ("year-round cold-water" removed), nolichucky-river (wild-fish phrase relabeled unverified), johnson-park-lake (Memphis → Collierville) | verbatim-sentence replacements |
| Citations | lake-graham speciesEvidence ×4 re-pointed to TWRA's Lake Graham page | species line quoted live 2026-09-24 |
| Field population | edmund-orgill-lake species=trout / fishery=stocked | schedule + GIS rows |
| Owner fact | trail-fork-big-creek monitoring line | survey occurred (owner-reported; result not located); 2024-05-20 row = stocking only |
| ADR 0011 wild+stocked | little-river, tellico-river, middle-prong-little-pigeon, cosby-creek, leconte-creek, roaring-fork | fishery value + reach notes; GSMNP notes re-worded (park reach wild; program below the park) |

**Corrected against schema (triage finding):** caney-fork-upper's suggested `fishery: 'warmwater'` was NOT applied — the field is trout-identity-typed; warmwater waters correctly leave it null. Recorded here so the triage sheet's recommendation is not silently dropped.

## Contracts / code

- contracts **2.3.0 → 2.4.0**: `fishery` enum + `wild+stocked` (ADR 0011). Tests 197 → **198** (new acceptance case).
- `apps/web/src/features/map/fisheryType.ts`: type widened; `wild+stocked` buckets as `stocked` (legend unchanged; the reach note carries the wild half). Web suite **376 passed** (new mapping test), typecheck clean.

## Integrity fix that surfaced during apply

`verify-captures` failed on `twra-trout-page.html` + `twra-stock-locations-meta.json`: the evidence lane committed them without EOL protection, the blobs were CRLF-normalized, and this machine's `core.autocrlf=true` round-tripped the working tree back to the **exact original response bytes** (sha == the log's `responseSha256`). Fixed by committing those original bytes raw under `-text -whitespace` protection and updating the log (`bytes`/`sha256` now describe the original-response bytes; the normalized-blob stats preserved in `priorCommitted*`). This also explains the repair report's "unexplained" HTML mismatch — machine-dependent EOL behavior, now pinned. Live pages have since changed (new editions 2026-09-24) — normal drift; the captures are dated snapshots.

## Gates

`validate:content` (incl. `verify-captures` 21 captures + `verify-ledger --final` **0 errors / 0 warnings**, headline counts unchanged 29/61/55/10/35) · contracts 198 ✓ · web 376 ✓ + tsc ✓ · workspace build ✓ (size budget OK). Headline counts are unchanged by design — these were metadata/wording corrections; no adjudicated verdict moved.

---

# The 9 legacy-tag waters — digest for your strip-vs-hold decision

You asked to SEE these before deciding. The Middle Tennessee Fly Fishers Elk page you found covers only the **Tims Ford tailwater** (upper ~15 mi) — it corroborates `elk-river` (year-round reach) and says nothing about these nine; it's an unsourced club narrative (a good lead source, not agency evidence). theocoeeeriver.com is currently DNS-dead (recorded). Per water: current tag, what evidence exists, what would settle it.

| Water | Tag now | Evidence reality | Would settle it |
|---|---|---|---|
| **elk-river-lower** | trout / stocked / stockingProgram | Zero reach rows anywhere; the only Lincoln Co trout events are the Fayetteville pond stockings; club page doesn't cover the lower Elk | TWRA: any stocking/survey below Fayetteville |
| **east-fork-stones-river** | trout / wild + winter window | One NRSA site visit (2023, lower reach, zero salmonids — one sample, not absence); no survey found | TWRA Region 2 survey or historical record |
| **little-pigeon-river** | trout / stockingProgram | Zero schedule rows name the main stem; only prong GIS points (one mislabeled Sevierville) | TWRA: does any program stock the main stem? |
| **pigeon-river** | trout | Zero agency trout support on the TN reach (3 surfaces checked live); warmwater documented | TWRA statement, or drop the tag |
| **powell-river** | trout / wild | Exactly ONE NRSA site in TN (2024, 14 taxa, zero salmonids); wild claim unverified | TWRA survey; NRSA is one site |
| **south-fork-cumberland** | trout / wild | 2024 TDEC WQS: NO trout designation on the main stem (TS only on Laurel Fork Creek, upper 4.9 mi); NPS page names no species | The watershed trout facts are real but tributary-level |
| **new-river** | warmwater | Warmwater plausible, no positive source (NRSA: none; WQS: no designation) — non-positives, not absence | Any dated survey/assemblage |
| **reedy-creek** | warmwater | WQP station holds chemistry only (1999–2009), zero fish data | Any dated survey |
| **harpeth-river** | trout + smallmouth tag | Winter stocking at Eastern Flank is real (documented); the *smallmouth* tag has no source (page 404s; Region 2 index has no entry) | A TWRA species page/statement |

**My recommendation stands:** strip to neutral (the display already runs on adjudicated verdicts, so visitors see no change) except keep harpeth's `species: trout` (its winter program is documented) and only drop its smallmouth tag. But this is exactly the judgment you wanted eyes on — say the word per water or as a batch, and it's a five-minute apply.


## Addendum — owner rulings applied same day (2026-09-24)

Four further rulings (recorded verbatim-intent in
`docs/research/2026-09-22-fishery-opportunities/OWNER-RULINGS-2026-09-24.md`,
applied by `apply-owner-rulings.mjs`, ledger headlines updated in the same
pass so every gate stays consistent):

1. **Harpeth River** → `mixed`/documented: species `warmwater` + the documented Dec–Feb winter trout program side by side; smallmouth tag retained.
2. **East Fork Stones River** → `mixed`/limited: species `warmwater`, stockingProgram `true`, winter window per the ruling — with the TENSION preserved (zero published rows name this fork; TWRA question recorded).
3. **Little Pigeon River** → `year-round-trout`/limited, fishery `wild+stocked`: weekly Gatlinburg-program stocking + wild trout per the ruling; the documented weekly program is the West Prong (which also gains `wild+stocked`); main-stem extent rests on the ruling.
4. **Smallmouth policy** → ambient-presence listing (smallmouth + common TN warmwater suite) no longer requires per-water citation hunts. Implemented as a narrow, documented validator exemption (`AMBIENT_TN_SPECIES` in `lib.ts`, ruling reference in-code); presence-listing only — never abundance/quality claims, never trout.

Reviewed counts after rulings: **30 year-round / 60 seasonal / 54 warmwater-focus / 12 mixed / 34 unresolved** (190). Remaining legacy-tag waters awaiting the owner's strip/hold call: elk-river-lower, pigeon-river, powell-river, south-fork-cumberland, new-river, reedy-creek (harpeth, east-fork-stones, and little-pigeon resolved by these rulings).
