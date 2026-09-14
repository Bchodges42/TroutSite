# 2026-09-13 audit — Session C: species / season / science evidence report

**Base revision:** `origin/main` = `b44b4fe09af3b47a35f63afdb547475e1ccf0fe7`
(proven equal to `git ls-remote origin main` at **2026-09-13T23:43:01Z** — identical to the
campaign baseline hash; `main` had not moved when this session cloned). Branch: `campaign-c`.
**Research window (UTC):** 2026-09-13T23:43Z → 2026-09-14T01:05Z. All "retrieved" dates below
fall inside this window; pages fetched by the parent session were fetched by this session
directly (curl with a browser User-Agent; several tn.gov pages render fine to curl but stalled
WebFetch). Subagent-lead-only items are labeled **[LEAD — not parent-verified]** with what to
re-pin at implementation time.

Lane: external species/season/science evidence only. No code, catalog YAML, or product
behavior was changed by this session (working tree contains only this report). Water-data
sensor facts are Session B's lane; temperature crosses only as "B finds the sensor, C
supplies the thresholds." Current in-repo presentation/tier code is Session A's lane.

---

## 1. Status

Done within scope and guardrails:

- Setup discipline followed: fresh clone, `fetch --prune`, base proven against `ls-remote`,
  branch `campaign-c` off `origin/main`, push target established (first push attempt used the
  AGENTS.md sed recipe against an already-SSH remote and failed harmlessly — remote was
  `git@github.com:…`, so `git push origin campaign-c` was used; nothing else deviated).
- Catalog state at base re-counted from `packages/content/streams/tn/*.yaml` (self-recount):
  **148 waters**; broad `species`: **103 `trout` / 8 `warmwater` / 37 absent**;
  **39 waters carry `targetSpecies` (196 typed tags)**; **91 carry `yearRound`** (19 true /
  72 false / **57 absent**); **101 carry `fishery`**; 94 `stockingProgram: true`. All match
  the orchestrator's stated known state.
- Three read-only subagents ran (species/stocking, science, seasons/access). **Model note:**
  the harness exposes no model-selection parameter on Agent spawns; agents therefore ran on
  the session model (GLM-5.3-Flash) — the "run each on glm-5.3-flash" condition is satisfied
  by default, not by explicit selection.
- Parent re-verified the load-bearing claims live: TWRA stockings page, TWRA trout
  regulations page, TWRA regulations hub ("What's New"), five TWRA reservoir pages
  (Cherokee, Dale Hollow, Norris, Old Hickory, Tims Ford) + Watts Bar, the South Holston
  Tailwater Plan 2022-2027 PDF, the Statewide Trout Management Plan 2017-2027 PDF, all seven
  NDEP species TTA PDFs + the NDEP 2018 master guidance PDF, NPS GSMNP fishing page, TDEC
  Scenic Rivers list, Bill Dance Signature Lakes list, VT F&W trout pages ×3, TAMU
  largemouth page, MDC smallmouth + channel catfish pages, VanderWeyst 2014 pressure-study
  PDF, and EPA Gold Book 1986 (presence/structure). Direct quotes below carry what each
  source does **not** prove.
- Report delivered with typed ledger (Section 3), season/access/significance evidence
  (Section 4), science review with transfer verdicts (Section 5), a do-not-implement
  register (Section 6), strict totals (Section 7), and planner inputs (Section 8).

Headline findings (details in Sections 3–7):

1. **The typed `targetSpecies` layer is stronger than feared for the 28 reservoir/lake
   waters** — nearly every authored key traces to a verbatim species sentence on a TWRA
   where-to-fish page fetched 2026-09-13. But **seven typed striped-bass tags rest only on
   generic creel-regulation lines** ("Striped Bass or Hybrid: 2/day"), which prove take is
   legal, not that a fishery exists (Douglas is the weakest: a merged "White Bass/Striped
   Bass or Hybrid" line).
2. **Material conflict found at Dale Hollow:** the repo's dale-hollow-lake stocking evidence
   (2026-09-08 snapshot: "Brown trout, Apr") is contradicted by the live TWRA reservoir
   stocking list ("Region II, Dale Hollow, - Rainbow" — rainbow only). Same class of
   conflict at Chilhowee (2017 plan text suggests a lake-trout fishery; the live list says
   Chilhowee = Rainbow only).
3. **Schema-driven mislabel:** five GSMNP trout creeks carry
   `targetSpecies: [smallmouth-bass]` while their own notes say "wild rainbows and brook
   trout" — the seven-key enum has no trout keys, so authoring pushed smallmouth onto trout
   water. `OWNER DECISION REQUIRED`.
4. **Trout comfort bands can now be authored from agency sources** (VT F&W species pages
   verified verbatim; NDEP trout chronic/acute values present but need a digit re-pin), and
   the warmwater seven already have verified high-side ceilings (NDEP) — the real gaps are
   *optimal-band centers* for spotted/crappie/bluegill/catfish, the striped-bass spawn
   window, and **all** flow-trend and pressure-trend factors (flow has only stage-specific
   nesting evidence for smallmouth; pressure has a controlled null result).
5. **Season honesty rule confirmed:** no TWRA regulation text opens or closes any winter
   put-and-take trout water; those windows are **programmatic (stocking-schedule-derived)
   only**, except Montgomery Bell SP Acorn Lake (regulatory DH Dec 1–Mar 31). Piney River's
   DH removal (2026-27) is on the regs hub but the static trout page still lists the DH —
   a live TWRA-internal inconsistency the app must handle as dated-conflict, not fact.

---

## 2. Methods, limitations, and evidence-quality rubric

**Methods.** (1) Self-recount of catalog fields via a YAML walk (no inherited numbers).
(2) Three bounded read-only subagents produced leads with mandated per-claim citation
format. (3) Parent re-fetched every load-bearing primary source live inside the research
window and extracted verbatim sentences with a HTML-to-text/PDF-to-text pass before admitting
them to this report; quotes below were read from this session's own fetches unless marked
[LEAD]. (4) Conflicts were kept as conflicts — nothing was averaged or "resolved" by
preference.

**Evidence-kind taxonomy used in the ledger:**

| Kind | Meaning | Can support |
|---|---|---|
| `REG` | Regulation text naming species + water + rule | typed species assertion (management evidence) |
| `MGMT-PAGE` | TWRA where-to-fish reservoir/river page species sentence, stocking statement, or creel-survey text | typed species assertion for that water |
| `PLAN` | Agency management plan (TWRA trout plan, SH tailwater plan) | species composition + program facts, dated to the plan |
| `STOCK-SCHED` | TWRA stocking schedule/report row (species column; rolling report updated 2026-09-07) | presence of stocked fish at a time/place; **never** a resident fishery |
| `PROG-DESC` | Agency program description (winter trout program, DH program) | program-level facts, not per-reach composition |
| `LAND-MGR` | NPS/USFS/TVA page for managed lands | species + rules for managed reaches |
| `NONE` | No defensible official per-water evidence found this window | nothing; water stays unknown |

**Confidence:** high = verbatim sentence on an official page naming water + species; medium =
official page naming species via regulation category or garbled table layout; low =
inference from program membership or regional rules. `No defensible evidence found as of
2026-09-14T01:05Z` is recorded as a result, not a failure.

**Limitations.**
- tn.gov pages display **no effective-date/version metadata** — every TWRA citation is dated
  only by retrieval; the regulation year model (eff. Aug 1) must come from TWRA news
  releases (repo already documents the 2025-08-01 and 2026-07-15 releases).
- The 2026 stocking schedule is an interactive grid; machine extraction interleaves columns.
  Species per row is verifiable for the page's **static prose lists** (verified) but
  row-level mapping of the schedule grid needs the page's Export button — schedule-month
  claims below are therefore prose-list or program-description grade unless quoted.
- eRegulations mirror lags tn.gov (last updated 2026-07-21 at the repo's 2026-09-08 check);
  tn.gov is treated as authoritative throughout.
- TVA pages (tva.com) returned 403 to all fetchers this window — TVA access/rescue-schedule
  facts remain **[LEAD]**.
- NDEP combined-guidance tables are columnar PDFs; per-species chronic/acute digits were
  confirmed in the individual species TTA PDFs where quoted below, and are marked
  [LEAD — re-pin digit] where only the subagent read the combined table.
- One subagent hit a rate limit and was relaunched; all three lanes completed.

---

## 3. Species evidence ledger (typed, all 148 catalog waters)

Legend: `species` = the broad trout/warmwater field; `tgt` = typed `targetSpecies` keys
(abbreviated: LMB largemouth-bass, SMB smallmouth-bass, SPB spotted-bass, CRP crappie,
BLG bluegill, CCF channel-catfish, STB striped-bass). "Class" = evidence-kind from Section 2.
Every row's "does NOT prove" is the standing caveat for its class.

### 3.1 Class `MGMT-PAGE` — TWRA where-to-fish reservoir/lake pages (typed keys verified)

All: publisher TWRA, `https://www.tn.gov/twra/fishing/where-to-fish/<region>/<slug>.html`,
retrieved 2026-09-13/14 UTC, no page date shown. The where-to-fish hub links only four region
pages; individual water pages live one level deeper.

| water | tgt authored | strongest verified/quoted evidence (parenthesis = who verified) | does NOT prove |
|---|---|---|---|
| cherokee-lake | LMB SMB SPB STB CRP BLG CCF | "…Largemouth Bass, Smallmouth Bass, Striped Bass, Cherokee bass, Crappie, Walleye, and Saugeye as the primary gamefish species. People also target Paddlefish, White Bass, Bluegill, and Catfish." (parent) | "Cherokee bass" = hybrid striper local name (Percy Priest page: "Hybrid Striped Bass (Cherokee Bass)") — must never parse as spotted-bass; "Catfish" generic |
| watts-bar-lake | LMB SMB SPB STB CRP BLG CCF | "TWRA also stocks several gamefish in Watts Bar on an annual basis, including striped bass, black crappie, walleye, and Florida largemouth bass." (parent) | stocking statement covers STB/black-CRP only; SMB/SPB/BLG/CCF rest on page's other fishery text + regs |
| chickamauga-lake | LMB SMB SPB STB CRP BLG CCF | "…great opportunities for … largemouth bass, smallmouth bass, striped bass, bluegill, redear sunfish, walleye, sauger, and catfish. The TWRA annually stocks … including striped bass, walleye, and Florida largemouth bass." (subagent, quote) | crappie appears in regs only, not the headline fishery sentence |
| norris-lake | LMB SMB SPB STB CRP BLG CCF | "Norris receives about 103,000 Striped Bass fingerlings every year." + "Spotted (Kentucky) Bass historically comprised a good percentage… Recently, the number of Spotted Bass has declined." (parent) | STB fishery is stocking-maintained; SPB declining — a "declining species" still a typed target is a call for the planner |
| kentucky-lake | LMB SMB SPB STB CRP BLG CCF | "Major sport species harvested… include largemouth bass, smallmouth bass, bluegill, redear sunfish, catfish (three species), white crappie, black crappie, sauger, and white bass." (subagent, quote) | STB appears only in a reg line — **weakest STB of the big lakes**; "three species" of catfish unnamed |
| pickwick-lake | LMB SMB SPB STB CRP BLG CCF | "Major sport species… include largemouth bass, smallmouth bass, spotted bass, bluegill, redear sunfish, and catfish (three species)." (subagent, quote) | STB reg-line-only; crappie not in the harvested-species sentence |
| lake-barkley | LMB SMB SPB STB CRP BLG CCF | "…an abundance of major sport species including largemouth bass, white crappie, black crappie, bluegill, redear sunfish, white bass, and several species of catfish and sauger." (subagent, quote) | STB and SMB reg-line-only |
| old-hickory-lake | LMB SMB SPB STB CRP BLG CCF | "Old Hickory Reservoir provides a world class trophy striped bass fishery with regular catches exceeding 50 pounds." + "Largemouth Bass are the predominant black bass species." + "White crappies are the most abundant of the two species." (parent) | SMB/SPB rest on regs + bass-family text; catfish generic |
| j-percy-priest-lake | LMB SMB SPB STB CRP BLG CCF | "The best fishing opportunities are for Largemouth Bass, Crappie, Hybrid Striped Bass (Cherokee Bass), White Bass, Yellow Bass, and Channel Catfish." (subagent, quote) | page's headline striper is the **hybrid**; pure STB rests on a reg line |
| douglas-lake | LMB SMB SPB STB CRP BLG CCF | "Largemouth bass, crappie, bluegill, and catfish are the most popular game fish for Douglas anglers." (subagent, quote) | **STB weakest in catalog: only a merged "White Bass/Striped Bass or Hybrid: 15/day" reg line; SMB likewise reg-line-only.** Recommend downgrade or re-source |
| fort-loudoun-lake | LMB SMB SPB STB CRP BLG CCF | "The most commonly harvested fish are largemouth, smallmouth, and white bass. Bluegill, crappie, and catfish are also present in good numbers." (subagent, quote) | STB reg-line-only |
| melton-hill-lake | LMB SMB SPB STB CRP BLG CCF | "The cool flowing water … guarantees that dissolved oxygen levels remain good throughout the summer for Smallmouth Bass, Striped Bass, and Musky." (subagent, quote) | same page documents **constraints** on LMB/BLG ("slow growth and limited reproduction") — keys imply suitability the page contradicts |
| tellico-lake | LMB SMB SPB STB CRP BLG CCF | "Some of the most common game fish include Largemouth Bass, White Crappie, Bluegill, Smallmouth Bass, Rainbow Trout, and Walleye." (subagent, quote) | STB reg-line-only; rainbow trout named (stocking-derived) but trout is not an enum key |
| boone-lake | LMB SMB SPB STB CRP BLG CCF | "Largemouth and Smallmouth Bass, Striped Bass, Hybrid Striped Bass, and catfish are the predominant game fish… TWRA has stocked Blue Catfish, Striped Bass, Hybrid Striped Bass, and Black Crappie…" (subagent, quote) | blue catfish presence is stocking-derived; BLG via regs |
| fort-patrick-henry-lake | LMB SMB SPB STB CRP BLG CCF | fishery-narrative thin; reg lines "Spotted Bass: 15 per day…", "Striped Bass or Hybrid Striped Bass: Two (2) per day" (subagent) | **lowest-quality MGMT-PAGE evidence in the set** — STB/SPB effectively reg-line-only |
| south-holston-lake | LMB SMB SPB CRP BLG CCF | "Smallmouth Bass, Largemouth Bass, Walleye, trout, crappie, and catfish are popular game fish." (subagent, quote) | STB correctly NOT authored (page names none) — this restraint is the model to copy |
| watauga-lake | LMB SMB SPB CRP BLG CCF | "Smallmouth Bass, Walleye, and trout are the most popular game fish for Watauga anglers." (subagent, quote) | STB correctly NOT authored; crappie via habitat sentence only |
| chilhowee-lake | LMB SMB SPB CRP BLG CCF | "The primary game fish are Largemouth and Smallmouth Bass, trout, Yellow Perch, Walleye, crappie, and Rock Bass. Trout are stocked on an annual basis…" (subagent, quote) | BLG/CCF via regs only |
| calderwood-lake | LMB CRP BLG CCF | "The primary game fish are trout, Largemouth and Smallmouth Bass, Black Crappie, and Rock Bass." (subagent, quote) | page supports SMB too but catalog authors dropped it (spotted/striped absent) — conservative, acceptable |
| center-hill-lake | LMB SMB SPB CRP BLG CCF | "…gamefish such as black bass, crappie, walleye, bluegill, and catfish… black bass (largemouth, smallmouth, and spotted bass)…" (subagent, quote) | STB correctly NOT authored; CCF generic |
| dale-hollow-lake | LMB SMB SPB CRP BLG CCF | "Dale Hollow Reservoir provides a great habitat for spotted bass…" + "Rainbow trout are typically stocked annually into Dale Hollow Reservoir during the wintertime." + world-record smallmouth lineage (parent) | **no striped bass anywhere on the page** (correctly not authored); white crappie "not as prevalent" — black-crp dominated |
| nickajack-lake | LMB SMB SPB STB CRP BLG CCF | "The lower end … more conducive to black bass and crappie fishing." + reg lines (subagent) | STB/SMB reg-line-only; "black bass" headline is generic |
| parksville-lake | LMB SPB CRP BLG | "Parksville has been stocked by TWRA with bluegill, redear sunfish, black crappie, muskie, walleye, and trout." (subagent, quote) | LMB narrative thin; see also the Alabama-bass warning (§3.4) |
| great-falls-lake | LMB SMB SPB CRP BLG CCF | "…many local anglers seeking black bass and crappie fishing… White crappie are the dominant species of crappie…" + "Fishing for spotted bass … probably not an intended species due to small population numbers." (subagent, quote) | page actively downgrades SPB — typed SPB tag here contradicts the page's own text |
| normandy-lake | LMB SMB SPB CRP BLG CCF | bass-centric narrative ("black bass fishery … 60 percent of the annual targeted angler effort") (subagent) | crappie/catfish via regs; blacknose-stocking sentence lives on the Tims Ford page |
| woods-reservoir | LMB SMB SPB CRP BLG CCF | "The best fishing opportunities are for Largemouth Bass, Crappie, White Bass, Yellow Bass, and Channel Catfish." (subagent, quote) | **CCF is channel-specific here (good)**; SMB via 18" reg line only |
| duck-river-lower | LMB SMB SPB CCF | "…excellent fishing for Smallmouth Bass, Spotted Bass, Rock Bass, Channel Catfish, Rainbow Trout… Spotted Bass are abundant…" + "biologists observed about 29 channel catfish/hour…" (subagent, quote) | LMB/BLG not in page text — catalog's BLG omission is correct; rainbow trout = stocked program |
| lake-graham | LMB CRP BLG CCF | "Fish Species Found: Largemouth bass - crappie - bluegill - redear sunfish - blue & channel catfish." (subagent, quote) | **catfish species-specific (blue+channel)**; no SMB/SPB/STB — correctly not authored |

**Cross-cutting verification (parent):** "Striped Bass and Cherokee Bass are numerous but
must be maintained by stocking" (Cherokee) and "Striped bass are concentrated from Cordell
Hull Dam downstream to the mouth of the Caney Fork River" (Old Hickory) are verbatim on the
pages — STB evidence is **stocking-dependent** lake by lake, never ambient.

### 3.2 Class `REG` — typed keys from TWRA statewide regulation exceptions

Source (parent-verified live):
`https://www.tn.gov/twra/fishing-regs/fishing-regulation-exceptions.html`, retrieved
2026-09-14 UTC, no date shown. A species-specific rule on a named reach is management
evidence for that species **on that reach** — not the whole catalog polygon.

| water | tgt | rule evidence (quoted essence) | does NOT prove |
|---|---|---|---|
| north-fork-holston-river | SMB | smallmouth 13–17″ PLR, one over 17″/day (S. Fork Holston confluence → state line) | fishery quality; presence upstream of the reach |
| holston-river | SMB | smallmouth 13–17″ PLR (I-40 → Cherokee Dam; John Sevier Dam → NF confluence) | same |
| nolichucky-river | SMB | smallmouth 13–17″ PLR incl. Davy Crockett Lake arm (ENKA Dam upstream) | same |
| french-broad-river | SMB | 18″ min (Hwy 168/321 → Douglas Dam) + 13–17″ PLR upstream | same |
| powell-river | SMB | smallmouth 13–17″ PLR (Gap Creek confluence → state line) | same |
| wolf-river-fentress | SMB | "Two (2) per day, 16–21 inch PLR" smallmouth, "South Ford Road Bridge downstream into Dale Hollow Reservoir" (page does not say "Fentress arm") | that the rule reach equals the catalog polygon |
| pigeon-river | SMB | black/smallmouth bass exception on the Pigeon | exact reach text was summarized — re-quote at implementation |
| little-pigeon-river | SMB | black/smallmouth exception on the Little Pigeon | same |
| little-river | SMB | "Little River (Rockford Dam upstream)" smallmouth 13–17″ PLR | the catalog water spans park headwaters the rule does NOT cover |
| tellico-river (river reach) | — | deliberately NOT authored: the smallmouth water is the impounded/lake reach; tellico-lake carries SMB from its own page | — (correct restraint) |
| wolf-river-west-tennessee / obion-river / hatchie-river | CRP | shared West TN crappie rule 30/day, no length limit — "Forked Deer, Hatchie, Loosahatchie, Obion, and Wolf Rivers (includes tributaries)" | statewide crappie is 15/day 10″ — the 30/day rule is the Region-1 exception only; it proves crappie management, weakly presence |

### 3.3 Class `STOCK-SCHED` / `PLAN` — trout species composition per trout water

**Verified verbatim from the live TWRA stockings page**
(`https://www.tn.gov/twra/fishing/trout-information-stockings.html`, parent, retrieved
2026-09-14 UTC; page carries "Report updated as of 9/7/2026" for the rolling report):

Reservoir list — "TWRA stocks the following reservoirs with trout to provide year-round
trout fishing opportunities": **Dale Hollow – Rainbow; Parksville – Rainbow; Calderwood –
Brook, Brown and Rainbow; Chilhowee – Rainbow; Fort Patrick Henry – Brown and Rainbow;
South Holston – Lake and Rainbow; Tellico (Upper) – Rainbow; Watauga – Lake and Rainbow.**

Tailwater list (species + months + reg overlay, verbatim): Normandy/Duck **Rainbow Nov–Jun**
(statewide regs); Tims Ford/Elk **Brook, Brown, Cutthroat, Rainbow Mar–Dec** (special);
J. Percy Priest/Stones **Rainbow Dec–Mar** (statewide); Center Hill/Caney **Rainbow, Brook,
Brown, Cutthroat Mar–Dec** (special); Appalachia/Hiwassee **Brook, Brown, Cutthroat, Rainbow
Oct–Jul** (special); Dale Hollow/Obey **Brook, Rainbow Jan–Dec** (statewide); Ocoee
#1/Parksville **Rainbow Mar–May** (statewide); Norris/Clinch **Brook, Brown, Rainbow
Mar–Aug** (special); Cherokee Dam/Holston **Brown, Rainbow Nov–Apr** (statewide); Boone/SFH
**Brook, Brown, Cutthroat, Rainbow Mar, Apr, Dec** (special); Fort Patrick Henry/SFH
**Brown, Rainbow Mar–Apr** (statewide); South Holston Dam/SFH **Rainbow Mar–Sep** (special);
Wilbur/Watauga **Rainbow Mar–Dec** (special); Watauga Dam/Wilbur Reservoir **Rainbow
Mar–Jul** (statewide). Prose on the same page: "In many tailwaters, trout fishing can be
good year-round." — program-level support for tailwater `yearRound`, not per-water proof.

What stocking rows do NOT prove (page's own words): a stocking event may be "postponed or
cancelled due to unforeseen problems such as adverse weather or warm water temperatures";
the rolling report documents "where adult Brook, Brown, or Rainbow trout were recently
stocked" — one row = one event, never a resident or reproducing fishery.

| water | trout composition assertion | class / source | does NOT prove |
|---|---|---|---|
| south-holston-river | **Wild brown trout fishery (no browns stocked since 2003) + rainbow put-and-take/put-and-grow (47,000 adults + 50,000 fingerlings/yr)** | PLAN: South Holston Tailwater Trout Fishery Mgmt Plan 2022-2027 (PDF, parent-verified): "No Brown Trout have been stocked in the South Holston tailwater since 2003 because of the excellent wild Brown Trout fishery that has developed." | rainbow natural reproduction extent; brook presence |
| clinch-river | stocked Brook/Brown/Rainbow (Mar–Aug) under PLR regs | STOCK-SCHED (verified) + REG | **the catalog note's "self-sustaining rainbow, brown, and brook" claim has NO official sentence found** — TWRA reserves wild-fishery language for SH/Wilbur. Register item |
| caney-fork-river | Rainbow/Brook/Brown/Cutthroat stocked Mar–Dec; special regs name rainbow/brook/cutthroat PLR + brown 24″ | STOCK-SCHED + REG (both verified) | which species reproduce (Tailwater Improvements improved habitat; plan says further improvement would help) |
| elk-river | Brook/Brown/Cutthroat/Rainbow Mar–Dec; brown 20″/1-day reach reg | STOCK-SCHED + REG (verified) | resident vs stocked share |
| hiwassee-river | Brook/Brown/Cutthroat/Rainbow Oct–Jul; Mar 1–Sep 30 harvest / Oct 1–Feb 28 C&R | STOCK-SCHED + REG (verified) | wild component |
| obey-river | Brook/Rainbow Jan–Dec (only catalog tailwater stocked all 12 months) | STOCK-SCHED (verified) | brown presence (none stocked) |
| boone-tailwater | Brook/Brown/Cutthroat/Rainbow (Mar, Apr, Dec) | STOCK-SCHED (verified) | year-round fishery beyond stocking months + dam-release logic |
| ft-patrick-henry-tailwater | Brown/Rainbow Mar–Apr | STOCK-SCHED (verified) | summer fishery ( stocking gap May–Oct) — `yearRound: true` there rides on dam releases, not stocking |
| watauga-river (QTA) | Rainbow Mar–Dec below Wilbur Dam; QTA "Quality Trout: Fishing Area" regs | STOCK-SCHED + REG (verified) | browns in QTA (reg names rainbow stocking only; browns present per SH-plan movement study) |
| watauga-river-wilbur-reach | Rainbow Mar–Jul (Watauga Dam → Wilbur Reservoir); "Natural reproduction occurs in the South Holston and Wilbur tailwaters" (trout regs) | STOCK-SCHED + REG (verified) | species beyond rainbow |
| duck-river-tailwater | Rainbow Nov–Jun | STOCK-SCHED (verified) | fishery outside Nov–Jun window |
| stones-river | Rainbow Dec–Mar (winter put-and-take on a warmwater base) | STOCK-SCHED (verified) | any trout presence May–Nov; the water's warmwater assemblage has no typed keys yet |
| parksville-tailwater | Rainbow Mar–May | STOCK-SCHED (verified) | fishery outside window; `yearRound: false` correct |
| dale-hollow-lake | **CONFLICT — live list: Rainbow only (winter); repo snapshot evidence: Brown, Apr** | STOCK-SCHED (parent) vs 2026-09-08 snapshot (in-repo) | OWNER DECISION REQUIRED — see §6 |
| calderwood-lake | Brook/Brown/Rainbow | STOCK-SCHED (verified) | which fishery is resident |
| chilhowee-lake | live list Rainbow; 2017 plan text suggests a lake-trout fishery exists | STOCK-SCHED vs PLAN — **conflict**, see §6 | lake-trout presence today |
| tellico-river (upper) + tellico-lake | Tellico (Upper) reservoir Rainbow; DH Oct 1–Feb 28 (North River mouth → state line) + Tellico-Citico permit Mar 1–Aug 15 | STOCK-SCHED + REG (verified) | river-reach fishery outside DH/permit windows |
| 13 West TN winter ponds (beech-lake, cameron-brown-lake, covington-fbc-pond, edmund-orgill-lake, johnson-park-lake, lake-graham, martin-city-pond, milan-city-pond, paris-city-park-lake, shelby-farms-lake, union-city-reelfoot-pond, valentine-park-pond, yale-road-park-lake) | Rainbow (winter program); PROG-DESC: 2017 plan "program now includes 40 locations from Memphis to Chattanooga… Over 93,000 trout were stocked during the 2015-16 season"; "Trout are stocked during the winter to assure that surface water temperatures are cold enough for their survival" | STOCK-SCHED + PROG-DESC (verified) | **no regulatory season text exists** — windows are programmatic-only (§4.1); species beyond rainbow not documented |
| GSMNP waters (little-river, leconte-creek, middle-prong-little-pigeon, west-prong-little-pigeon, cosby-creek) | wild Brook/Rainbow/Brown parkwide: NPS — "roughly 800,000 visitors fish for brook, brown or rainbow trout… approximately 2,900 miles of streams"; "The brook trout is the only native species of trout in the Smokies." | LAND-MGR (parent-verified nps.gov/grsm/planyourvisit/fishing.htm) | per-reach species split (brook share rises upstream) — park-level evidence only |
| 5 wild-stream waters (obed-river, daddys-creek, clear-creek-obed, new-river, powell-river) + clear-fork, emory-river, nolichucky upper | catalog notes assert wild rainbow/brown(/brook); TWRA's Wild Trout Streams list (verified: North River, Bald River, Sycamore Cr, Rough Ridge Cr, Laurel Fork, Beaverdam Cr, Paint Cr, Rocky Fork, Left Prong Hampton, Little Stony) does **not** name them; NPS Obed fish page names smallmouth/muskie/catfish/panfish — **no trout documented** | NONE found this window | **catalog trout claims for the Obed system/Powell stand unverified by any official source found** — register items; "No defensible per-water species evidence found as of 2026-09-14T01:05Z" for their typed composition |

### 3.4 Alabama-bass hazard for the `spotted-bass` key (all SPB tags)

Parent-verified: TWRA's Alabama bass page
(`https://www.tn.gov/twra/wildlife/fish/alabama_bass.html`): "Alabama Bass have negatively
impacted Parksville Reservoir… hybridization with Smallmouth Bass has been documented in
Watts Bar, Ft. Loudoun, and Tellico reservoirs… It might be a Spotted Bass, but it could be
an Alabama Bass… TWRA typically relies on genetic analysis to differentiate." Watts Bar page
(confirmed): "Alabama bass presence in Watts Bar has been confirmed by genetic testing…"
**Consequence:** every `spotted-bass` tag is really "black bass spotted/Alabama complex" —
TWRA itself cannot always tell without genetics. The typed key remains defensible as
management evidence, but the UI must never present SPB as a verified pure-species fishery on
waters where only the complex is documented.

### 3.5 Waters with NO typed keys and NO defensible per-water species evidence

As of 2026-09-14T01:05Z, for these waters no official per-water species assertion was found
beyond what Sections 3.1–3.3 already carry (their broad `species` field is also absent —
they are honestly unknown today): bradley-creek, buffalo-river, caney-fork-upper,
cumberland-river, emory-river (split fishery, reach undefined), clear-fork,
mississippi-river, ocoee-river (Copperhill reach), reelfoot-lake, tennessee-river,
tennessee-river warmwater assemblage generally, wilbur-lake, ocoee-number-three-lake.
Plus the 11 rivers listed in the repo's own F3 pass-2 NEEDS-SOURCE note
(little-tennessee-river, north-fork… no — NF Holston was resolved by pass 3; remaining:
little-tennessee-river, french-broad tailwater keys, watauga-river-wilbur-reach enum keys,
holston-river* — *resolved by REG, §3.2). Reservoirs whose broad `species` is unset but
which DO carry typed keys (boone-lake, chickamauga-lake, douglas-lake, fort-loudoun-lake,
j-percy-priest-lake, kentucky-lake, lake-barkley, melton-hill-lake, nickajack-lake,
old-hickory-lake, pickwick-lake, tellico-lake, watts-bar-lake, fort-patrick-henry-lake,
great-falls-lake, normandy-lake, parksville-lake, woods-reservoir, watauga-lake,
south-holston-lake, center-hill-lake, dale-hollow-lake, norris-lake, cherokee-lake,
chilhowee-lake, calderwood-lake): their **typed** layer is evidenced (§3.1) — setting the
broad `warmwater` field for them is a Session-A semantics decision this session supplies
evidence for but does not make.

Waters whose species state **cannot honestly be set at all** yet (typed keys absent AND no
evidence found): bradley-creek, clear-fork, cumberland-river, emory-river,
mississippi-river, ocoee-river, reelfoot-lake (crappie/BLG reputation but no official
per-water page fetched this window — [LEAD: TWRA Reelfoot page exists, not fetched]),
tennessee-river, wilbur-lake, ocoee-number-three-lake, little-tennessee-river,
caney-fork-upper, buffalo-river, duck-river-lower BLG/LMB keys (page names neither),
fort-patrick-henry-lake (thin page), and every high-elevation trout creek's *beyond-trout*
assemblage.

---

## 4. Season windows, `yearRound` evidence, access, and significance

### 4.1 The season-evidence standard: REGULATORY vs PROGRAMMATIC

Every season claim in the app must carry one of two labels. This distinction is the single
most important deliverable of this section — the repo's `yearRound` flag currently blurs it.

- **REGULATORY** — a season/closure/creel window appears in TWRA/NPS/city regulation text.
  Durable, citable to the reg year (Aug 1–Jul 31).
- **PROGRAMMATIC** — the window exists only in stocking schedules/program descriptions.
  It changes with TWRA's schedule and has no legal force; a water can be legally fished
  year-round yet hold no trout in July.

**Statewide trout baseline (REGULATORY, parent-verified live):** the trout regs page's
"Statewide Trout Regulations" block reads in full: "Any combination of trout species: Daily
Limit: seven (7)… Minimum Length Limit: None. Exceptions: Only two (2) trout in a creel may
be Lake Trout" — **no closed-season sentence exists**, confirming the repo's reading. What
it does NOT prove: that any particular stocked water holds fish year-round, or anything
about park/city/USFS overlays.

### 4.2 Verified regulatory windows (all parent-verified live 2026-09-14 UTC unless noted)

| water / family | window (verbatim essence) | effect on `yearRound` |
|---|---|---|
| Hiwassee (Appalachian Powerhouse → L&N RR bridge) | "March 1 through Sept. 30: Seven (7) trout creel limit, only two (2) may be brown trout. Catch and Release Season is Oct. 1 through Feb. 28." | Open 12 months/yr (harvest + C&R bridge) — supports `yearRound: true` |
| SF Holston (SH Dam → Boone, incl. Boone arm to Hwy 11E) | 16–22″ PLR; "Closed to all fishing Nov. 1 – Jan. 31" at two named spawning areas (Hickory Tree Br→Bottom Cr; Boy's Island→island above Webb Rd Br) | Water open year-round except two closures — `yearRound: true` defensible WITH the closure note |
| Watauga QTA ("Quality Trout: Fishing Area", Smallings bridge → CSX) | 14″ min, 2/day, no bait, undersized may not be possessed | No season closure; `yearRound: true` rides on stocking Mar–Dec + releases |
| Tellico + Citico | "Tellico-Citico Permit required from March 1 through Aug. 15. Closed on Thursday and Friday during the period… From Aug. 16 through the last day of February, fishing is allowed every day, and Tellico-Citico Permit is not required." | Open all year; permit/closure season Mar 1–Aug 15 — the *seasonal* fact is permit+closure, not fish presence |
| Delayed harvest (C&R, artificials-only during window) — live page list | Big Soddy Nov 1–Feb 28 (upstream of Back Valley Rd); Buffalo Cr Oct 1–Jan 31 (mill dam → Buffalo Springs WMA); Doe River Oct 1–Feb 28 (Roan Mountain SP); Hiwassee Oct 1–Feb 28; **Piney River Nov 1–Feb 28 (STALE — see below)**; Paint Creek Oct 1–Feb 28 (campground → French Broad mouth); Tellico Oct 1–Feb 28 (North River mouth → state line); Montgomery Bell SP Acorn Lake Dec 1–Mar 31 | DH waters are open year-round; the window is a harvest rule. `yearRound` should reflect fishery viability, not the DH window |
| **Piney River (Rhea) DH conflict** | Static trout page still lists "Catch-and-release season is Nov. 1 - Feb. 28"; regs-hub "What's New for 2026-27": "**Piney River • Removed delayed harvest regulations**" | **TWRA-internal inconsistency, live this window.** The repo's fishing.json already flags it; keep C&R as safe default only until TWRA's static page corrects. No printed effective date anywhere — the Aug 1 date is the reg-year model, not sourced text |
| **Big Soddy Creek** | What's New: "Moved the start of delayed harvest season from October 1 to November 1" — static page already shows Nov 1 – Feb 28 | Not a catalog water (T3-52 candidate); when added, enter with Nov 1 start |
| Buffalo Creek (Grainger) | "From the mill dam upstream — closed year-round to all fishing"; "From the mill dam downstream—open to fishing year-round by rod and reel method only." | Above mill dam: CLOSED year-round (fishing, not just trout) — a hard `yearRound: false` zone inside the catalog water |
| Clear Creek (Anderson, Clinch trib) | "From Hwy. 441 upstream to the second dam… closed from Nov. 1–Mar. 31 to all fishing" | Not the Obed-system clear-creek-obed (repo already resolved the name collision) |
| Clinch (Norris Dam → Hwy 61) | 14–20″ PLR, 7/day, one over 20″ | No season closure |
| Caney Fork (Center Hill Dam → Cumberland R) | 5-trout PLR rules + brown 24″/1-day | No season closure |
| Elk (Tims Ford Dam → I-65) | Brown 20″ min, 1/day | No season closure |
| Fort Patrick Henry (Boone Dam → Louis Milhorn Br) | 16–22″ PLR rainbow/brown, 7/day one over 22″ | No season closure |
| Gatlinburg city waters (TWRA section, verified verbatim) | "All streams are closed on Thursday each week and a Gatlinburg permit is required." … "From December 1 through March 31 (all streams): Possession of any trout shall be prohibited. All trout caught must be immediately returned… bait prohibited… single-hook artificial flies, spinners, and spoons only." Children's streams: WPLP (Herbert Holt Park→Bypass Br), Dudley Creek (Hwy 441→WPLP), Leconte Cr (Painter Br→park boundary) | Year-round open except Thursdays; Dec 1–Mar 31 is C&R. [LEAD: the 5/day / 2/day children creel split sat beyond the captured text — re-pin before displaying creel] |
| GSMNP (parent-verified nps.gov/grsm) | "Fishing is permitted year-round in open waters from 30 minutes before official sunrise to 30 minutes after official sunset." TN or NC license, 16+, no trout stamp; one hand-held rod, single-hook artificials, bait banned; 7″ min brook/rainbow/brown/smallmouth; "Five (5) brook, rainbow or brown trout, smallmouth bass, or a combination" + twenty rock bass | True year-round fishery — supports `yearRound: true` on park waters (subject to park closure powers) |
| Statewide warmwater (parent-verified live statewide creel page) | Black bass 5/day any combination, no statewide minimum; crappie 15/day 10″ statewide with the Region-1 exception 30/day no length (Forked Deer, Hatchie, Loosahatchie, Obion, Wolf + named lakes); striped/hybrid 2/day 15″; catfish "No harvest limit on catfish less than 34 inches… only one (1) catfish over 34 inches per day"; sauger 5→10/day 15″; walleye 5/day 16″; **no statewide closed seasons found for any warmwater species**; walleye-run gear rules only (Caney Fork Jan 1–Apr 30 single-barb hooks Rock Island→Great Falls; E. Fork Obey Jan 1–Apr 15) | Warmwater fisheries are open 12 months/yr by regulation — `yearRound` for warmwater is about *water data availability*, not season |
| TWRA-owned lakes | "The lakes managed by the Tennessee Wildlife Resources Agency are open year-round for fishing" (where-to-fish hub) + family-fishing page "Open year-round" | REGULATORY support for year-round ACCESS; note the catalog's winter ponds are mostly city/park waters, not TWRA lakes — check each |

### 4.3 Programmatic windows (stocking-derived; label accordingly)

- **Winter put-and-take trout on warmwater rivers** (stones-river Dec–Mar verified from the
  tailwater list; west-fork-stones, harpeth, red-river-clarksville, sulfur-fork-creek,
  mossy-creek-jefferson, big-rock-creek, boiling-fork-creek, mccutcheon-creek,
  sinking-creek-wilson, elk-river-lower): windows are **PROGRAMMATIC-only** — no regulation
  text creates or closes a season. Verified counter-example: **red-river-clarksville was
  NOT found on the live stocking page this window** — its winter-trout note currently has
  no dated stocking evidence; do not assert the fishery without a schedule row.
- **West TN winter ponds**: same class (rainbow, winter months, schedule-grid derived);
  TWRA family-lakes "open year-round" is about lake access, not trout presence.
- **Stocking-month windows per tailwater**: the verified tailwater list in §3.3 IS the
  programmatic window per water (e.g., Cherokee TW Nov–Apr; ft-patrick-henry Mar–Apr;
  parksville Mar–May; duck-river-tailwater Nov–Jun). These directly explain the existing
  `yearRound: false` flags and should be surfaced as "stocked <months>" facts with
  retrieval dating, because the schedule grid is living data ("Report updated as of
  9/7/2026").

### 4.4 Access evidence (what exists, per authority)

| authority | verified access offer | does NOT provide |
|---|---|---|
| TWRA where-to-fish (parent: hub page) | Four region pages + interactive "Boating and Fishing Site Access" map; "download all location data as .csv or .kml" — a machine-readable access-point dataset | conditions, per-reach wade access, ADA detail |
| TWRA River Access Program | **[LEAD — not located this window; verify existence/URL]** | — |
| TVA | [LEAD — tva.com 403 all window; boat-ramp/facilities pages exist] | — |
| NPS GSMNP (parent) | Parkwide rule/access text, permit notes for Gatlinburg/Cherokee | ramp/parking inventory |
| USFS Cherokee NF (subagent + repo) | Fishing activity page; live alerts (Citico flood closure seen); "defers seasons/limits to TWRA; rainbow stocking ~Mar–Sep; top streams Tellico/Citico/Paint/Beaverdam" | per-stream access points |
| TN State Parks (repo 2026-09-08 + subagent) | Fishing activity page; licenses sold at parks | per-pond access detail |
| TDEC Scenic Rivers (parent) | "Scenic Rivers… available as a viewable and downloadable data layer" | paddle-access specifics |

Planner takeaway: TWRA's access CSV/KML is the one bulk, official, machine-readable access
source; it should anchor any access field the catalog adds. Everything else is per-page
curation.

### 4.5 Significance signals for display tiers (verified)

| signal | waters it marks (verified) | source / retrieval | honest tier meaning |
|---|---|---|---|
| TWRA "Quality Trout: Fishing Area" | watauga-river QTA reach only | trout regs page (parent) | the state's own quality label — destination tier for that reach |
| South Holston Tailwater Plan (destination fishery language, "excellent wild Brown Trout fishery", 20–25k trips/yr for heavily-fished tailwaters incl. SH, Norris, Wilbur, Apalachia, Center Hill) | south-holston-river, clinch-river, watauga-river, hiwassee-river, caney-fork-river | TWRA plans (parent) | destination tier, plan-cited |
| World-record / trophy documentation | dale-hollow-lake (1955 world-record smallmouth), old-hickory-lake ("world class trophy striped bass fishery"), tims-ford-lake ("best reservoir Smallmouth fishery in middle Tennessee"), pickwick-lake ("trophy smallies… rivals Dale Hollow"), norris-lake (49.5 lb state-record striper 1978) | TWRA where-to-fish pages (parent/subagent) | destination tier for the named fishery — species-specific, not generic |
| Tennessee Scenic Rivers (TDEC) | Harpeth, Hiwassee, Obed (state), Ocoee, Buffalo, Collins, Clinch, Duck, French Broad, Hatchie, North Chickamauga Cr, Piney (Watts Bar Watershed = the Rhea Co. Piney), Soak Cr, others; **Tellico not in captured list** | tn.gov/environment/natural-areas/tn-scenic-rivers.html (parent) | protection-status tier, NOT fishing quality |
| Federal Wild & Scenic | obed-river (+ daddys-creek, clear-creek-obed in the Obed system) | nps.gov/obed (parent) | protection status |
| GSMNP World Heritage Site + International Biosphere Reserve | all five park waters | nps.gov/grsm/learn/nature (parent) | premier wild-trout-habitat tier |
| Bill Dance Signature Lakes (TDTD) | Pickwick, Reelfoot, Dale Hollow, Kentucky, Old Hickory, Tims Ford, Chickamauga, Douglas, Norris, Watauga (+ Browns Cr, Herb Parsons, Lake Halford, Fall Creek Falls); **Watts Bar and J. Percy Priest NOT on list** | billdancelakes.tnvacation.com/lakes (parent) | tourism/promotional bass tier — mark as promotional, never regulatory |
| Statewide DH list, wild-trout list, Tellico-Citico permit | as in §4.2/§3.3 | trout regs page (parent) | special-regulation tier |
