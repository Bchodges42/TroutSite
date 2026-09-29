# Adjudication brief — 190-water evidence ledger (2026-09-22 lane)

You are one adjudication lane in a fleet verifying the fishery-opportunity
evidence ledger for TroutSite's 190 Tennessee catalog waters. Work order:
produce a documented-opportunity verdict per water with claim-specific
provenance, or an honest unresolved state. You verify sources yourself; you do
NOT trust prior research files, catalog fields, model outputs, or this brief as
proof. Public read-only research only — no emails, no contact forms, no
posting, no outreach to anyone.

## The question the ledger answers

Angling opportunity at a stated water/reach — NOT a biological census, NOT a
survival guarantee, NOT "is it good today". The five allowed headline outcomes
for a water's trout opportunity:

- `year-round-trout` — a documented year-round trout angling opportunity at the
  supported reach (e.g. an explicit current reach-specific agency assessment).
- `seasonal-stocked-trout` — a seasonally maintained stocked trout fishery,
  with the documented window stated separately from stocking months.
- `warmwater-focus` — positively documented warmwater fishery. NEVER implies
  trout are biologically absent. May coexist with a seasonal trout claim.
- `mixed` — e.g. warmwater focus + documented seasonal trout program.
- `unresolved` — evidence is missing, contradictory, stale, or geographically
  ambiguous. FIRST-CLASS RESULT. A smaller traceable set beats invented labels.

Evidence states (independent axis): `documented` (current, reach-fitting,
method transparent), `limited` (real but thin/marginal — say what's missing),
`historical` (dated observation, currency not established — say the year),
`conflicting` (sources disagree — preserve BOTH sides), `unresolved`.

## Hard rules

1. **"No trout" / warmwater-focus-without-trout is almost never provable.**
   Missing TWRA row, absent Fishbrain page, one survey without trout, a remote
   warm gauge, or model confidence can NEVER establish absence.
2. **Reach discipline.** A tailwater assessment does NOT transfer to the
   reservoir above the dam (Center Hill Lake vs Caney Fork). Lake arms/depth
   zones are separate questions. Upper/lower river splits, same-name creeks in
   different counties, and dam-side differences all matter. If the catalog
   feature spans several fishery reaches and your evidence covers only one,
   set `reachScope` to the supported reach.
3. **Stocking ≠ presence ≠ year-round.** A schedule row is a PLAN. The
   recent-release report is a rolling window (10 rows, Aug–Sep 2026 at
   capture). A GIS point is neither an event nor a stocked reach. Stocking
   months are not the fishing window and not the survival window.
4. **Five distinct dates.** observation date, report period, publication date,
   effective date, retrieval date. Never let a retrieval date freshen an old
   observation. "2026 forecast reporting 2025 sampling" → asOf 2025 for the
   sampling-based part.
5. **Source lineage.** A gauge quoted by a shop is one observation. GBIF
   re-indexing iNaturalist is one observation. Five sites repeating one TWRA
   sentence are one source.
6. **Reservoir wording.** A reservoir with trout is a trout FISHERY, never a
   "trout stream". Year-round reservoir stocking does not promise summer bank
   fishing — deep-water summer guidance qualifies it.
7. **No manufactured certainty.** Do not downgrade conflicting evidence to a
   convenient label; mark `conflicting`. Do not require impossible evidence
   for established fisheries either: an explicit current reach-specific TWRA
   assessment IS sufficient for a year-round opportunity claim.
8. **Fishbrain aggregates (in the seed) are research leads only** — no reuse
   rights; no catch dates. Use them to spot species leads/contradictions, cite
   nothing to them in published claims. Taxonomy watch: "Sea trout"/"Spotted
   seatrout" rows are suspect mappings, not trout evidence.
9. **Legal designations (TDEC TS/NRTS)** are legal boundaries with specific
   river miles — never a fish census; record the boundary precisely.
10. A planned survey or restoration proposal is NOT a result ("will conduct
    2025 monitoring" ≠ monitoring happened).

## Sufficiency ladder by claim kind

- **Year-round opportunity**: current reach-specific agency assessment (TWRA
  forecast/plan/reservoir list/region page) is sufficient on its own. Add
  qualifications for known summer limits (Cherokee/Hiwassee "limited
  year-round" → still year-round-trout, evidenceState documented, BUT the
  summer limitation MUST be in `qualifications`).
- **Seasonal stocked opportunity**: correctly joined program (schedule row or
  program description) + its stated window; attribute the join (county/reach
  check). If only the program type is known without a stated fishing window,
  evidenceState is `limited`, not documented.
- **Warmwater focus**: positive dated warmwater assemblage/survey/management
  or credible firsthand fishing record for the reach (ORNL/NRSA/TVA-type
  survey, TWRA region page description, dated guide report).
- **Trout observation**: survey/specimen/reviewed firsthand catch with
  defensible identity+date+locality (EPA NRSA 2023-24, USGS brook-trout CC0
  release, NPS IBI/workbooks, iNat research-grade).
- **Habitat context**: USGS/NWIS/WQP temperature with station+time+depth+flags;
  summer DO matters; temperature alone is never occupancy.

## Verified source entry points (all checked 2026-09-21/22 by the audit)

- TWRA trout page + reservoir year-round list + schedule: captures in
  `docs/research/2026-09-22-fishery-opportunities/captures/`
  (twra-trout-page.txt, twra-schedule.json, twra-recent-releases.json,
  twra-forecast-text.md). Live URLs are in captures/source-log.json.
- TWRA forecast StoryMap text: `captures/twra-forecast-text.md` (verbatim node
  text; node IDs quoted like `n-Q2FuhI`). Fetch the live item if you need
  tables: https://www.arcgis.com/sharing/rest/content/items/dbb92bdf718f4fd7839bf4b08fb82747/data?f=json
- TWRA stocking GIS (730 points, no dates): services3.arcgis.com
  PWXNAH2YKmZY7lBq / TWRA_Trout_Stocking_Locations/FeatureServer/0
- TWRA region "where to fish" pages (e.g. Watauga Reservoir page) — fetch per
  water as needed (tn.gov/twra/fishing/where-to-fish/...).
- TDEC 2024 use classifications (EPA-hosted copy):
  https://www.epa.gov/system/files/documents/2024-07/tn_wqs_0012_062024.pdf
- EPA NRSA 2023-24 fish counts (463 TN rows / 29 sites):
  https://www.epa.gov/system/files/other-files/2026-06/nrsa2324_fishcount.csv (+ siteinfo csv)
- USGS brook-trout abundance 1958–2021 (CC0): doi 10.5066/P9DQID6G
- USGS multi-agency temperature 1894–2022 (TN: 20 continuous 2018+ site IDs):
  doi 10.5066/P9EMWZ35
- WQP: https://www.waterqualitydata.us/data/Result/search?siteid=...
- iNaturalist: https://api.inaturalist.org/v1/observations?place_id=45&...
  (dedupe vs GBIF — count once). Check geoprivacy independently.
- NPS GSMNP fisheries + IBI workbooks via IRMA links in
  docs/research/2026-09-22-unconventional-source-discovery.md (research branch
  codex/evidence-methods-audit-20260921) — summaries in the reports.
- TWRA Coldwater Summit 2025 slides (planned-not-completed 2025 monitoring
  list; Left Prong Hampton barrier): tctu.org twra_-_2025_coldwater_summit_jwh2.pdf
- Shop/guide dated reports verified by the audit: Little River Outfitters
  (littleriveroutfitters.com/pages/fishing/report.htm), Tellico Outfitters
  fishing-reports, The Fly Box (theflyboxtn.com), South Holston River Fly Shop,
  Orvis fishingreports.orvis.com/southeast/tennessee (field-level template
  contradictions known — accept dated firsthand parts only).

You may also search the open web for water-specific sources (TWRA region
pages, county pages, dated shop reports, surveys). A search snippet is a LEAD —
open and read the source before citing it. If a fetch fails, record the
failure; never infer absence from it.

## Audit case table (starting hypotheses — REOPEN each against sources, don't copy)

| Water | Audit-supported conclusion | Still unknown / must stay in copy |
|---|---|---|
| Boone Tailwater | year-round + holdover, TWRA forecast 2026 sampling (n-Q2FuhI) | conflicting stocking calendars (Mar/Apr/Nov+Dec vs Mar/Apr/Jun+Dec vs Mar/Apr/Dec) — preserve |
| Boone Lake | separate from tailwater; trout rule on Watauga arm | lake-wide persistence/opportunity unresolved |
| Watauga Reservoir | year-round reservoir list + lake page (summer 90–120 ft deep-water) | no shore-wide summer promise |
| Watauga River/Wilbur reach | forecast covers tailwater; SH/Wilbur 2025-only sampling noted | data year discipline |
| Parksville Lake | year-round reservoir list | extent/abundance; never borrow tailwater class |
| Center Hill Lake | bottom release explains Caney Fork below dam, NOT lake | lake trout occurrence unresolved |
| Caney Fork (tailwater) | year-round fishery; 2025 water-quality problems in forecast | current state caveat |
| Normandy/Duck tailwater | ~8 suitable months, first ~9 mi named | window vs stocking months distinct |
| Cherokee + Hiwassee tailwaters | "limited year-round" | summer limitation prominent |
| Tims Ford / Elk | year-round first ~11 mi only; brown vs rainbow persistence differ | not whole Elk; Fayetteville gauge is upstream |
| Little River (Blount) | NRTS mile 33.0 → origin (upper); lower row NOT marked | designation ≠ abundance |
| Buffalo Creek (Grainger) | stocked + cool discrete obs + TS below Buffalo Springs | continuous envelope/reproduction not established |
| Trail Fork Big Creek | 2021 rainbow removal above falls + brook transfer; 2025 monitoring PLANNED | no 2026 persistence claim |
| Obed-area waters | positive warmwater evidence may support warmwater-focus | absence of trout records ≠ no trout |
| Winter ponds / mixed stocked rivers | winter program coexists with bass/panfish | July view must not say all trout certainly gone |
| Whiteoak/White Oak, Wolf River, other repeats | check county/drainage/dam side | Fishbrain shared pages need segment review |

## Output contract (write ONE file per water)

`evidence-work/adj/<lane>/<waterId>.json`:

```json
{
  "id": "<catalog id>",
  "headline": {
    "troutOpportunity": "year-round-trout|seasonal-stocked-trout|warmwater-focus|mixed|unresolved",
    "warmwaterFocus": true,
    "evidenceState": "documented|limited|historical|conflicting|unresolved",
    "reachScope": null,
    "statement": "One visitor-facing sentence, hedged correctly.",
    "asOf": "2026"
  },
  "claims": [{
    "kind": "year-round-opportunity|seasonal-stocked-opportunity|stocking-program|warmwater-fishery|trout-observation|wild-reproduction|legal-designation|habitat-context|stocking-calendar-conflict|harvest-regulation",
    "state": "documented|limited|historical|conflicting|unresolved",
    "species": null,
    "appliesToReach": "whole feature | specific reach text",
    "source": {
      "url": "https://...", "publisher": "TWRA", "title": "...",
      "method": "agency assessment|schedule table|completed-release report|electrofishing survey|creel|temperature series|legal designation|firsthand report|community observation",
      "observationPeriod": "e.g. March 2026 sampling | 2010-2025 | null",
      "publicationDate": "YYYY-MM-DD or YYYY-MM or null",
      "retrieved": "YYYY-MM-DD",
      "pinpoint": "quote, table name, node id, or page/row reference"
    },
    "statement": "what the source supports",
    "qualification": "why it does/does not apply to THIS reach",
    "nextQuestion": null
  }],
  "unresolvedQuestion": "the precise missing proposition or null",
  "qualifications": ["user-facing caveat lines"],
  "scheduleJoinVerdict": "correct|wrong-water|uncertain|no-join",
  "scheduleJoinNote": "why, esp. if wrong/uncertain",
  "flags": ["geometry-issue|identity-issue|same-name-risk|shared-fishbrain-page|..."],
  "catalogFieldCorrections": "any species/fishery/yearRound/seasonMonths field the catalog gets wrong vs evidence, with reason, or null",
  "webChecks": [{"url": "...", "result": "verified|failed|not-needed", "note": "...", "retrieved": "YYYY-MM-DD"}]
}
```

Rules for the file: 1–8 claims; the DECISIVE claim(s) for your headline must
have complete `source` blocks with retrieval dates; a claim you carried from
the seed's prior leads WITHOUT re-verifying must be state `historical` or
`unresolved` with `qualification` saying "prior research lead, not
re-verified". If you did no web check for a water, headline must be
`unresolved` (unless the seed's own backbone — schedule join, reservoir list,
forecast node — is decisive; cite it as the source with the capture path as
url prefix `captures/...`).

Also write `evidence-work/adj/<lane>/SUMMARY.md`: counts per headline ×
evidenceState, list of waters where you changed the schedule join verdict,
flags, and anything the reviewer must look at.
