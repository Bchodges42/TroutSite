# Session A — Ground-Truth Audit · 2026-09-13

Base `b44b4fe09af3b47a35f63afdb547475e1ccf0fe7` · UTC audit window 2026-09-13T23:44Z → 2026-09-14T01:10Z · branch `campaign-a` · clone `/Users/ben/Downloads/TroutSite-a`

---

## Status

Audit complete. Every count below was recomputed from the audited tree with reproducible
commands; every code claim carries a `path:line`. The orchestrator brief's leads
(2026-09-13 @ `b44b4fe`) were re-verified against the tree itself; two were found
**stale or not reproducible** (species-mode propagation is much wider than claimed;
no `realTimeIV` flag exists in content YAML — it lives in a static verification
artifact), the rest reproduced exactly. Nothing was modified except this report.
Three findings are NEW (stopped-sensor scoring window, orphaned USACE fetch, empty
lakes layer still mounted); the full reconciliation against `docs/KNOWN-ISSUES.md`
IDs and OA-01…OA-10 is in §8.

---

## Findings

### 1. Audited revision, method, commands, limitations

**Remote-main proof** (run 2026-09-13T23:43Z):

```
$ git ls-remote origin main
b44b4fe09af3b47a35f63afdb547475e1ccf0fe7	refs/heads/main
$ git rev-parse HEAD            # fresh clone, branch campaign-a off origin/main
b44b4fe09af3b47a35f63afdb547475e1ccf0fe7
```

Audited HEAD = current `origin/main` = campaign baseline. Last commit on main:
`docs: accuracy-audit orchestrator prompt — data-source research, water curation,
three session briefs` (2026-09-13T17:28:57-05:00). No unattributed changes were
encountered anywhere in the tree (AGENTS.md rule 6 check: `git status` clean after
clone; all files attributable to the branch history).

**Repo shape**: pnpm monorepo — `packages/contracts` (Zod schemas + scorers),
`packages/content` (YAML pack), `apps/web` (React PWA), `apps/api` (Fastify ingest +
snapshots), `apps/marketing` (Astro), `e2e` (Playwright). Product data lives in
committed YAML + committed generated artifacts (`apps/web/public/atlas/*`,
`apps/web/src/features/map/riverIndex.json`); the `/v1` + `/content` runtime
snapshots are **gitignored** (generated on the server) and could NOT be inspected.

**Commands run** (all read-only; no dependency install, per audit guardrails):

| Purpose | Command |
|---|---|
| Key census / counts | `ruby -ryaml -e '…'` walks of `packages/content/streams/tn/*.yaml` (148 files) |
| ID-set identity | ruby joins of `streams/tn/*.yaml` ↔ `apps/web/public/atlas/rivers.geojson` ↔ `apps/web/src/features/map/riverIndex.json` ↔ `docs/data-source-coverage.json` |
| Title tiers | ruby extent computation from `riverIndex.json` `bounds` (max of width/height, degrees) |
| Species bands | ruby walk of `packages/content/species/species-reference.yaml` |
| Code reading | Read of every file cited below; `git log --follow` for `bradley-creek.yaml` |

**Tests were inventoried but NOT executed.** Running the vitest/e2e suites requires
`pnpm install`, which writes `node_modules` trees — outside this audit's read-only
guardrail (only this report may be created/modified). Exact commands are listed in §7.

**Limitations:**
1. No live data: scores, gauge health, and feed contents are wiring-level facts, not
   today's reality (§5 states this explicitly). Which sensors report *right now*, and
   which species a water actually holds, are external questions — see
   "Open questions for the planner".
2. Runtime snapshots (`apps/web/public/v1`, `/content`) are gitignored; marketing
   fixture-vs-real behavior was verified in code (`apps/marketing/src/data/load.ts`),
   not by building the site.
3. Subagent note: of the three mandated read-only subagents (catalog / scoring /
   surfaces), only the scoring/pipeline one completed; the other two were killed by
   upstream API rate limits mid-task. Their scopes were covered by direct parent
   investigation; the completed subagent's leads were independently re-verified before
   inclusion (two were corrected: see §3.5, §8 OA-05/OA-08). Model selection was not an
   available parameter on this harness; subagents ran on the session default model.
4. `docs/reports/2026-09-13-orchestrator-audit.md` does **not exist** in the audited
   tree — the orchestrator leads exist only in the session brief.

---

### 2. Verified counts and the 148-water technical inventory

**Catalog identity (fact).** `packages/content/streams/tn/*.yaml` = **148** files.
Type mix: river 35 · creek 57 · lake 38 · tailrace 12 · pond 5 · spring 1.
`apps/web/public/atlas/rivers.geojson` (despite the name, holds ALL 148 incl. lakes as
polygon features): 148 features, ID set **identical** to YAML, waterbodyType mix
identical. `apps/web/src/features/map/riverIndex.json`: 148 entries, ID set identical,
0 name/type mismatches vs YAML.

**Species (fact).** Broad `species` field: trout 103 · warmwater 8 · absent 37.
`targetSpecies` (v2 warmwater program): **39** waters; 196 species-water pairs —
smallmouth-bass 36 · bluegill 30 · crappie 29 · largemouth-bass 29 · channel-catfish 28 ·
spotted-bass 27 · striped-bass 17.

**Fishery/season/stocking (fact).** `fishery`: stocked 81 · tailwater 13 · wild 7 ·
absent 47. `yearRound`: true 19 · false 72 · absent 57 (trout + `yearRound:false` = 71
→ drive the seasonal decision states). `stockingProgram: true` = 94.

**Gauges (fact).** 48 waters carry `gaugeIds` (72 entries): 50 unique USGS numeric ids
(59 refs) + 10 `tva:` (BOOT1 NRST1 NRMT1 TMFT1 FPHT1 HADT1 OCBT1 OCAT1 SHDT1 WL) +
3 `usace:` (CETT1 DHTT1 JPPT1). No capability flags exist in the YAML; capability lives
in `packages/content/data/verified-gauges.json` — a **static one-time registry**
(90 USGS sites, every entry `realTimeIV: true` "verified … on 2026-09-02"), never
refreshed (see §8 OA-08).

**Ideal flow (fact).** 92 waters carry exactly one `idealFlow` range each; 56 are empty.
`IdealFlowSchema` (`packages/contracts/src/schemas/stream.ts:5-12`) has **no source
field**; the only citation slot is the per-water generic `officialSources` array
(TWRA stock/reg pages) — no flow-range-specific provenance exists anywhere, so **all 92
ranges lack field-level provenance** (OA-09 confirmed).

**Title tiers (fact, recomputed).** From `riverIndex.json` bounds with the shipped
thresholds (`apps/web/src/features/map/labelPolicy.ts:19-25`: MAJOR_EXTENT 0.3°,
MINOR_EXTENT 0.05°): **statewide 54 · approach 72 · local 22** — reproduces the
orchestrator lead exactly. Nine creeks sit in the statewide tier purely by extent
(little-river, daddys-creek, clear-creek-obed, clear-fork, sulfur-fork-creek,
little-west-fork-creek, white-oak-creek, reedy-creek, wolf-river-fentress); no authored
display-tier/prominence field exists in the catalog (OA-04 confirmed).

**Map admission (fact, from `apps/web/src/features/map/waterDecision.ts:65-130`).**
Default Trout mode: 141 include · 1 deemphasize (`harpeth-river`, warmwater + stocked)
· 7 exclude (plain warmwater). All-fish mode: 148 include. Excluded/deemphasized waters
still render corridor geometry; trout mode additionally denies them labels
(`labelPolicy.ts:65`) and the trout metric (`waterDecision.ts:114-118`).

**Fishability eligibility (fact).** Snapshot build emits `/v1/fishability/{id}.json`
only for the 39 `targetSpecies` waters (`apps/api/src/snapshots/build.ts:210-218`);
none of the 103 trout waters get a v2 score (trout is served by legacy
`scoreConditions`; see §3.2). Species with complete cited warm-side comfort bands:
largemouth-bass, smallmouth-bass, striped-bass only; spotted-bass/crappie/bluegill/
channel-catfish carry `needs-source` optimal values and emit honest `assessed:false`
rows for those species.

**Static pages (fact).** Marketing builds one `/streams/tn/{slug}/` page per water
(all 148; `apps/marketing/src/pages/streams/[state]/[slug]/index.astro:22-33`), plus
regional hatch pages, stocking/regulations/fishing state pages, and
`/when-does-tennessee-stock-trout/`. The web app prerenders stream detail routes for
all waters via `apps/web/scripts/prerender.mjs`.

**Legend:** tier = title tier (extent-derived) · mode = visibility in default Trout
mode (incl/deemp/excl) · gauges = provider×count · iFlow = authored ideal-flow range ·
fish = has `/v1/fishability/{id}.json` emitted (targetSpecies present).

| # | id | type | region | species | target (n) | fishery | yR | stk | tier | mode | gauges | iFlow | fish |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | barren-fork-river | river | middle-caney-fork | trout | — | stocked | false | Y | STATE | incl | — | 40–300cfs | — |
| 2 | beaverdam-creek | creek | northeast-watauga | trout | — | stocked | true | Y | APPR | incl | — | 5–60cfs | — |
| 3 | beech-lake | lake | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 4 | big-rock-creek | creek | middle-duck-elk | trout | — | stocked | false | Y | APPR | incl | — | 5–40cfs | — |
| 5 | boiling-fork-creek | creek | middle-duck-elk | trout | — | stocked | false | Y | APPR | incl | — | 5–40cfs | — |
| 6 | boone-lake | lake | east-holston | — | 7 | — | — | — | APPR | incl | USGS×1 | — | Y |
| 7 | boone-tailwater | tailrace | east-holston | trout | — | tailwater | true | Y | APPR | incl | USGS×1+tva×1 | 150–1200cfs | — |
| 8 | bradley-creek | creek | middle-duck-elk | — | — | — | — | — | APPR | incl | — | — | — |
| 9 | brush-creek-cocke | creek | east-pigeon-frenchbroad | trout | — | stocked | false | Y | LOCAL | incl | — | 5–60cfs | — |
| 10 | buffalo-creek-grainger | creek | east-clinch | trout | — | stocked | true | Y | LOCAL | incl | — | 5–50cfs | — |
| 11 | buffalo-river | river | middle-duck-elk | — | — | — | — | — | STATE | incl | — | — | — |
| 12 | calderwood-lake | lake | east-smokies | trout | 5 | stocked | false | Y | APPR | incl | — | — | Y |
| 13 | calfkiller-river | river | middle-caney-fork | trout | — | stocked | false | Y | STATE | incl | USGS×1 | 30–200cfs | — |
| 14 | cameron-brown-lake | lake | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 15 | cane-creek | creek | middle-caney-fork | trout | — | stocked | false | Y | APPR | incl | — | 30–250cfs | — |
| 16 | caney-fork-river | tailrace | middle-caney-fork | trout | — | tailwater | true | Y | APPR | incl | USGS×2+usace×1 | 200–2000cfs | — |
| 17 | caney-fork-upper | river | middle-caney-fork | — | 2 | — | — | — | STATE | incl | — | — | Y |
| 18 | center-hill-lake | lake | middle-caney-fork | warmwater | 6 | — | — | — | APPR | excl | — | — | Y |
| 19 | charles-creek | creek | middle-caney-fork | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 20 | cherokee-lake | lake | east-holston | warmwater | 7 | — | — | — | STATE | excl | — | — | Y |
| 21 | chickamauga-lake | lake | se-hiwassee | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 22 | chilhowee-lake | lake | east-smokies | trout | 6 | stocked | false | Y | APPR | incl | — | — | Y |
| 23 | citico-creek | creek | se-hiwassee | trout | — | stocked | false | Y | APPR | incl | — | 20–150cfs | — |
| 24 | clear-creek-obed | creek | cumberland-plateau | trout | — | wild | — | — | STATE | incl | USGS×1 | 20–150cfs | — |
| 25 | clear-fork | creek | cumberland-plateau | — | — | — | — | — | STATE | incl | USGS×1 | 30–250cfs | — |
| 26 | clinch-river | tailrace | east-clinch | trout | — | tailwater | true | Y | STATE | incl | USGS×1+tva×1 | 200–1500cfs | — |
| 27 | collins-river | river | middle-caney-fork | trout | — | stocked | false | Y | STATE | incl | USGS×1 | 80–500cfs | — |
| 28 | cosby-creek | creek | east-smokies | trout | 1 | stocked | false | Y | APPR | incl | — | 10–80cfs | Y |
| 29 | covington-fbc-pond | pond | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 30 | cumberland-river | river | middle-nashville | — | — | — | — | — | STATE | incl | — | — | — |
| 31 | daddys-creek | creek | cumberland-plateau | trout | — | wild | — | — | STATE | incl | USGS×1 | 30–250cfs | — |
| 32 | dale-hollow-lake | lake | upper-cumberland | trout | 6 | stocked | — | Y | STATE | incl | — | — | Y |
| 33 | doe-creek-johnson | creek | northeast-watauga | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 34 | doe-river | creek | northeast-watauga | trout | — | stocked | true | Y | APPR | incl | USGS×1 | 50–250cfs | — |
| 35 | douglas-lake | lake | east-pigeon-frenchbroad | — | 7 | — | — | — | STATE | incl | USGS×1 | — | Y |
| 36 | duck-river-lower | river | middle-duck-elk | — | 4 | — | — | — | STATE | incl | USGS×3 | 200–1200cfs | Y |
| 37 | duck-river-tailwater | tailrace | middle-duck-elk | trout | — | tailwater | true | Y | APPR | incl | USGS×1+tva×1 | 100–800cfs | — |
| 38 | east-fork-shoal-creek | creek | middle-duck-elk | trout | — | stocked | false | Y | APPR | incl | — | 10–80cfs | — |
| 39 | east-fork-stones-river | river | middle-nashville | trout | — | wild | — | — | STATE | incl | USGS×1 | 50–400cfs | — |
| 40 | edmund-orgill-lake | lake | west | trout | — | — | — | Y | LOCAL | incl | — | — | — |
| 41 | elk-river-lower | river | middle-duck-elk | trout | — | stocked | false | Y | APPR | incl | USGS×1 | 150–1000cfs | — |
| 42 | elk-river | tailrace | middle-duck-elk | trout | — | tailwater | true | Y | STATE | incl | USGS×2+tva×1 | 100–700cfs | — |
| 43 | emory-river | river | cumberland-plateau | — | 1 | — | — | — | APPR | incl | USGS×1 | 100–600cfs | Y |
| 44 | fletchers-fork | creek | middle-nashville | trout | — | stocked | false | Y | APPR | incl | — | 3–30cfs | — |
| 45 | forge-creek-johnson | creek | northeast-watauga | trout | — | stocked | false | Y | LOCAL | incl | — | 5–50cfs | — |
| 46 | fort-loudoun-lake | lake | east-clinch | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 47 | fort-patrick-henry-lake | lake | east-holston | — | 7 | — | — | — | APPR | incl | USGS×1 | — | Y |
| 48 | french-broad-river | tailrace | east-pigeon-frenchbroad | trout | — | tailwater | — | — | STATE | incl | USGS×2 | 300–2000cfs | — |
| 49 | ft-patrick-henry-tailwater | tailrace | east-holston | trout | — | tailwater | true | Y | APPR | incl | USGS×1+tva×1 | 100–800cfs | — |
| 50 | gap-creek-claiborne | creek | east-clinch | trout | — | stocked | false | Y | APPR | incl | — | 5–40cfs | — |
| 51 | goforth-creek | creek | se-hiwassee | trout | — | stocked | false | Y | LOCAL | incl | — | 5–50cfs | — |
| 52 | greasy-creek-polk | creek | se-hiwassee | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 53 | great-falls-lake | lake | middle-caney-fork | — | 6 | — | — | — | STATE | incl | — | — | Y |
| 54 | gulf-fork-big-creek | creek | east-pigeon-frenchbroad | trout | — | stocked | false | Y | APPR | incl | — | 3–30cfs | — |
| 55 | harpeth-river | river | middle-nashville | warmwater | 1 | stocked | false | Y | STATE | deemp | USGS×2 | 50–400cfs | Y |
| 56 | hatchie-river | river | west | — | — | — | — | — | STATE | incl | — | — | — |
| 57 | hiwassee-river | tailrace | se-hiwassee | trout | — | tailwater | true | Y | STATE | incl | USGS×2+tva×1 | 500–3500cfs | — |
| 58 | holston-river | river | east-pigeon-frenchbroad | — | — | — | — | — | STATE | incl | — | — | — |
| 59 | horse-creek-greene | creek | northeast-watauga | trout | — | stocked | false | Y | APPR | incl | — | 5–60cfs | — |
| 60 | hurricane-creek | creek | upper-cumberland | trout | — | stocked | false | Y | APPR | incl | — | 5–60cfs | — |
| 61 | indian-creek-claiborne | creek | east-clinch | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 62 | j-percy-priest-lake | lake | middle-nashville | — | 7 | — | — | — | APPR | incl | — | — | Y |
| 63 | johnson-park-lake | lake | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 64 | kentucky-lake | lake | west | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 65 | lake-barkley | lake | middle-nashville | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 66 | lake-graham | lake | west | trout | 4 | stocked | false | Y | LOCAL | incl | — | — | Y |
| 67 | laurel-creek-johnson | creek | northeast-watauga | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 68 | laurel-fork-carter | creek | northeast-watauga | trout | — | stocked | true | Y | APPR | incl | — | 5–50cfs | — |
| 69 | leconte-creek | creek | east-smokies | trout | 1 | stocked | true | Y | APPR | incl | — | 10–80cfs | Y |
| 70 | little-buffalo-river | creek | middle-duck-elk | trout | — | stocked | false | Y | APPR | incl | — | 20–120cfs | — |
| 71 | little-pigeon-river | river | east-smokies | trout | — | — | — | Y | APPR | incl | USGS×1 | 100–500cfs | — |
| 72 | little-river | creek | east-smokies | trout | 1 | stocked | false | Y | STATE | incl | USGS×2 | 50–350cfs | Y |
| 73 | little-sequatchie-river | creek | se-hiwassee | trout | — | stocked | false | Y | APPR | incl | — | 30–200cfs | — |
| 74 | little-tennessee-river | river | east-smokies | warmwater | — | — | — | — | APPR | excl | — | — | — |
| 75 | little-west-fork-creek | creek | middle-nashville | trout | — | stocked | false | Y | STATE | incl | — | 3–30cfs | — |
| 76 | martin-city-pond | pond | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 77 | mccutcheon-creek | creek | middle-duck-elk | trout | — | stocked | false | Y | APPR | incl | — | 5–40cfs | — |
| 78 | melton-hill-lake | lake | east-clinch | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 79 | middle-prong-little-pigeon | creek | east-smokies | trout | 1 | stocked | false | Y | APPR | incl | — | 15–120cfs | Y |
| 80 | milan-city-pond | pond | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 81 | mill-creek-overton | creek | middle-caney-fork | trout | — | stocked | false | Y | APPR | incl | — | 10–80cfs | — |
| 82 | mississippi-river | river | west | — | — | — | — | — | STATE | incl | — | — | — |
| 83 | mossy-creek-jefferson | creek | east-pigeon-frenchbroad | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 84 | new-river | river | cumberland-plateau | trout | — | wild | — | — | STATE | incl | USGS×1 | 50–400cfs | — |
| 85 | nickajack-lake | lake | se-hiwassee | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 86 | nolichucky-river | river | east-pigeon-frenchbroad | — | — | — | — | — | STATE | incl | USGS×1 | 300–1500cfs | — |
| 87 | normandy-lake | lake | middle-duck-elk | — | 6 | — | — | — | APPR | incl | — | — | Y |
| 88 | norris-lake | lake | east-clinch | warmwater | 7 | — | — | — | STATE | excl | USGS×1 | — | Y |
| 89 | north-chickamauga-creek | creek | se-hiwassee | trout | — | stocked | false | Y | APPR | incl | USGS×1 | 40–250cfs | — |
| 90 | north-fork-holston-river | river | east-holston | warmwater | — | — | — | — | STATE | excl | — | — | — |
| 91 | north-prong-barren-fork | creek | middle-caney-fork | trout | — | stocked | false | Y | APPR | incl | — | 10–70cfs | — |
| 92 | obed-river | river | cumberland-plateau | trout | — | wild | — | — | STATE | incl | USGS×1 | 100–800cfs | — |
| 93 | obey-river | tailrace | upper-cumberland | trout | — | tailwater | true | Y | APPR | incl | USGS×1+usace×1 | 150–1000cfs | — |
| 94 | obion-river | river | west | — | — | — | — | — | STATE | incl | — | — | — |
| 95 | ocoee-number-three-lake | lake | se-hiwassee | — | — | — | — | — | APPR | incl | — | — | — |
| 96 | ocoee-river | river | se-hiwassee | — | — | — | — | — | APPR | incl | USGS×1+tva×1 | 800–3000cfs | — |
| 97 | old-hickory-lake | lake | middle-nashville | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 98 | paris-city-park-lake | lake | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 99 | parksville-lake | lake | se-hiwassee | — | 4 | — | — | — | APPR | incl | USGS×1 | — | Y |
| 100 | parksville-tailwater | tailrace | se-hiwassee | trout | — | tailwater | false | Y | APPR | incl | USGS×1+tva×1 | 100–800cfs | — |
| 101 | pickwick-lake | lake | west | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 102 | pigeon-river | river | east-pigeon-frenchbroad | trout | — | — | — | — | STATE | incl | USGS×1 | 300–1500cfs | — |
| 103 | pine-creek-dekalb | creek | middle-caney-fork | trout | — | stocked | false | Y | APPR | incl | — | 10–80cfs | — |
| 104 | piney-river-rhea | river | cumberland-plateau | trout | — | stocked | true | Y | APPR | incl | — | 30–200cfs | — |
| 105 | powell-river | river | east-clinch | trout | — | wild | — | — | STATE | incl | USGS×1 | 50–400cfs | — |
| 106 | puncheon-camp-creek | creek | east-clinch | trout | — | stocked | false | Y | APPR | incl | — | 3–30cfs | — |
| 107 | red-river-clarksville | river | middle-nashville | trout | — | stocked | false | Y | STATE | incl | USGS×1 | 60–500cfs | — |
| 108 | reedy-creek | creek | east-holston | trout | — | stocked | false | Y | STATE | incl | USGS×1 | 5–60cfs | — |
| 109 | reelfoot-lake | lake | west | — | 2 | — | — | — | APPR | incl | — | — | Y |
| 110 | richardson-byrd-creek | creek | east-clinch | trout | — | stocked | false | Y | APPR | incl | — | 3–30cfs | — |
| 111 | roaring-fork | creek | east-smokies | trout | — | stocked | true | Y | APPR | incl | — | 10–80cfs | — |
| 112 | rocky-river | creek | middle-caney-fork | trout | — | stocked | false | Y | APPR | incl | — | 15–120cfs | — |
| 113 | salt-lick-creek | creek | upper-cumberland | trout | — | stocked | false | Y | APPR | incl | — | 10–80cfs | — |
| 114 | sequatchie-river | river | cumberland-plateau | trout | — | stocked | false | Y | STATE | incl | USGS×1 | 100–600cfs | — |
| 115 | shelby-farms-lake | lake | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 116 | shoal-creek | river | middle-duck-elk | trout | — | stocked | false | Y | STATE | incl | USGS×1 | 60–400cfs | — |
| 117 | sinking-creek-wilson | spring | middle-nashville | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 118 | south-fork-cumberland | river | cumberland-plateau | trout | — | wild | — | — | APPR | incl | USGS×1 | 80–500cfs | — |
| 119 | south-holston-lake | lake | east-holston | warmwater | 6 | — | — | — | APPR | excl | USGS×1 | — | Y |
| 120 | south-holston-river | tailrace | east-holston | trout | — | tailwater | true | Y | APPR | incl | USGS×1+tva×1 | 250–2500cfs | — |
| 121 | spring-creek-polk | creek | se-hiwassee | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 122 | standing-rock-creek | creek | upper-cumberland | trout | — | stocked | false | Y | APPR | incl | — | 3–40cfs | — |
| 123 | station-creek | creek | east-clinch | trout | — | stocked | false | Y | LOCAL | incl | — | 5–40cfs | — |
| 124 | stones-river | river | middle-nashville | trout | — | stocked | false | Y | LOCAL | incl | USGS×1+usace×1 | 40–400cfs | — |
| 125 | stoney-creek-carter | creek | northeast-watauga | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 126 | sulfur-fork-creek | creek | middle-nashville | trout | — | stocked | false | Y | STATE | incl | — | 10–80cfs | — |
| 127 | tellico-lake | lake | east-clinch | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 128 | tellico-river | river | se-hiwassee | trout | — | stocked | true | Y | STATE | incl | USGS×1 | 100–400cfs | — |
| 129 | tennessee-river | river | west | — | 1 | — | — | — | STATE | incl | — | — | Y |
| 130 | tims-ford-lake | lake | middle-duck-elk | warmwater | 7 | — | — | — | APPR | excl | — | — | Y |
| 131 | trail-fork-big-creek | creek | east-pigeon-frenchbroad | trout | — | stocked | false | Y | LOCAL | incl | — | 3–25cfs | — |
| 132 | tumbling-creek | creek | se-hiwassee | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 133 | union-city-reelfoot-pond | pond | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 134 | upper-hills-creek | creek | middle-caney-fork | trout | — | stocked | false | Y | APPR | incl | — | 5–50cfs | — |
| 135 | upper-roan-creek | creek | northeast-watauga | trout | — | stocked | false | Y | APPR | incl | — | 5–60cfs | — |
| 136 | valentine-park-pond | pond | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
| 137 | watauga-lake | lake | northeast-watauga | — | 6 | — | — | — | APPR | incl | — | — | Y |
| 138 | watauga-river-wilbur-reach | river | northeast-watauga | trout | — | tailwater | — | — | LOCAL | incl | — | — | — |
| 139 | watauga-river | tailrace | northeast-watauga | trout | — | tailwater | true | Y | APPR | incl | USGS×3+tva×1 | 150–1500cfs | — |
| 140 | watts-bar-lake | lake | east-clinch | — | 7 | — | — | — | STATE | incl | — | — | Y |
| 141 | west-fork-stones-river | river | middle-nashville | trout | — | stocked | false | Y | STATE | incl | USGS×1 | 30–250cfs | — |
| 142 | west-prong-little-pigeon | creek | east-smokies | trout | 1 | stocked | true | Y | APPR | incl | USGS×1 | 15–150cfs | Y |
| 143 | white-oak-creek | creek | upper-cumberland | trout | — | stocked | false | Y | STATE | incl | — | 5–60cfs | — |
| 144 | wilbur-lake | lake | northeast-watauga | — | — | — | — | — | LOCAL | incl | USGS×2 | — | — |
| 145 | wolf-river-fentress | creek | cumberland-plateau | trout | — | stocked | false | Y | STATE | incl | — | 10–100cfs | — |
| 146 | wolf-river-west-tennessee | river | west | — | — | — | — | — | STATE | incl | — | — | — |
| 147 | woods-reservoir | lake | middle-duck-elk | — | 6 | — | — | — | APPR | incl | — | — | Y |
| 148 | yale-road-park-lake | lake | west | trout | — | stocked | false | Y | LOCAL | incl | — | — | — |
