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

### 3. Code-path traces

#### 3.1 Map admission, visibility, labels
- `toWaterDecisionView` (`apps/web/src/features/map/waterDecision.ts:65-130`) is the
  single classification authority: `visibility` = Trout-mode ∧ warmwater →
  `deemphasize` if `stockingProgram` else `exclude`; everything else `include`
  (`:103-108`). `troutApplicability` ∈ confirmed-current / seasonal-uncertain /
  seasonal-likely-absent (trout ∧ `yearRound:false`; winter window = Nov–Mar,
  hardcoded `:79-85`) / not-trout / unknown (`:86-92`). `displayMetric` = fishability
  (all-fish mode ∧ focus-species comfort assessed) else trout-condition (only
  confirmed-current ∧ assessed) else `unassessed` (`:114-118`).
- Label gating is pure (`apps/web/src/features/map/labelPolicy.ts:60-68`): selected
  always; Trout mode denies non-trout waters any title (`:65`); otherwise
  extent ≥ 0.3° statewide, ≥ 0.05° at zoom ≥ 8.5, else zoom ≥ 9.5, or assessed-anytime.
  Species notes "Warmwater"/"Unverified" ride labels (`:78-86`).
- Map sources: `apps/web/src/features/map/mapStyle.ts:96` still mounts
  `/atlas/lakes.geojson` — that file is an **empty FeatureCollection** in-tree;
  lake/pond polygons actually live inside `rivers.geojson` (43 features there:
  38 lakes + 5 ponds; 1 spring is line geometry; `geometrySource` set: nhd 99 ·
  tiger-fallback 6 · null 43 = exactly the stillwater polygons).

#### 3.2 Legacy trout scoring (`scoreConditions`)
- `packages/contracts/src/scoreConditions.ts:53-164`: flow base 80 inside
  `idealFlow`, −(deficit|surplus × 70) floor 10 outside, 50 height-only; temp
  +10 (6–20 °C) / −15 (<2 °C) / −30 (>24 °C) with the explicit trout wording
  "dangerously warm — avoid stressing trout" (`:151`). **No clock** — "staleness/TTL
  is a UI concern" (`:8`). Clamped-0 with `assessed:true` is a real Poor.
- Invoked **server-side for all 148** in the snapshot build
  (`apps/api/src/snapshots/build.ts:197-208`), but only the 48 gauge-configured
  waters can ever be `assessed:true`: waters with empty `gaugeIds` get an empty
  readings slice (`build.ts:198`). The web app never re-scores; it renders snapshots.

#### 3.3 Fishability v2 (per-species comfort + activity)
- Contracts: `FishabilityScoreSchema` / `ActivityOutlookSchema` /
  `ActivityComponentSchema` (`packages/contracts/src/schemas/fishability.ts:92-165`);
  species enum = **7 warmwater keys, no trout key** (`:11-18`).
- `scoreFishability` (`packages/contracts/src/scoreFishability.ts:23-116`) is
  **thermal-only** (reads only `tempC`; "Comfort is thermal" `:19-21`): lethal → 0
  assessed; outside optimal → 40; inside → 90. Has a real **absolute-age gate**:
  temp observation older than `READING_STALE_MINUTES` (180 min) → `assessed:false`
  (`:53-64`).
- `scoreActivity` (`packages/contracts/src/scoreActivity.ts:13-24`): total =
  clamp(50 + Σ contributions), components ordered by |contribution|.
- Emitter `apps/api/src/snapshots/fishability.ts` (`activityFor`, `:192-268`): emits
  `water-temperature` (weight 1.0 / 0.8 / 0.7 / 0.6), `spawn-state` (0.3 / 0.25; only
  when the species has **both** onset+end cited — excludes bluegill [onset-only] and
  striped-bass [none]; `spawnStateFor` is temp-triggered, ±4 °C window,
  `packages/contracts/src/spawnState.ts`), and `pressure-trend` (0.2 / 0.15; region
  station trend, value = 50 − 10·ΔhPa, dropped past `PRESSURE_STALE_MINUTES` = 180,
  labeled "area pressure … not this water"). **`flow-trend` exists only as an enum
  member (`fishability.ts:77`) — no implementation ships it.** The header comments
  (`fishability.ts:27-31`, `build.ts:213-218`) still say "exactly one factor" — stale.
  The generic `50 − 10·ΔhPa` transform is used because every species'
  `pressureTrend` sensitivity is `needs-source` (species-reference.yaml); likewise
  `flowTrend` is `needs-source` ×7. **No rain factor ships** (F12 exclusion honored;
  grep of `packages/contracts/src` + `apps/api/src` = 0 hits).
- Species reference completeness (`packages/content/species/species-reference.yaml`,
  recomputed): largemouth 26.7–30.0/32/34 · smallmouth 20.0–26.7/29/31 · striped
  14.6–22.0/30/32 fully cited warm-side; spotted (optimal+lethal), crappie (optimal),
  bluegill (optimal), channel-catfish (optimal) are `needs-source`; `lowerActiveC`
  `needs-source` ×7; spawn onset+end for largemouth/smallmouth/spotted/crappie/
  channel-catfish, onset-only bluegill, none striped.

#### 3.4 Ingestion, freshness, retention, snapshots
- Cron: `gauges` hourly :05, `stocking` 06:00, `evidence` 06:20, `snapshots` 04:30
  (`apps/api/src/cron.ts:34-37`). **The `gauges` job itself runs the full lane**:
  USGS IV → conditions bridge (TVA/USACE/NWS) → `buildSnapshots`
  (`apps/api/src/pipeline.ts:203-208`), so the read path refreshes hourly; the 04:30
  job is a second, nightly rebuild.
- USGS: params 00060 (cfs) / 00065 (height) / 00010 (temp °C), ≤50 sites/request
  (`apps/api/src/ingest/usgs.ts:7-11`). Per-metric observation times preserved; pass 2
  drops a metric only if it is > 180 min older than **the same site's newest
  observation in the same payload** (`usgs.ts:106-125`) — the T1-6 fix. Retention:
  `RAW_RETENTION_DAYS = 90`, pruned by `observed_at` each run (`usgs.ts:13,210-211`).
- `latestReadings` (`usgs.ts:231-251`): newest stored row per gauge, **no
  absolute-age gate**. `build.ts` re-scores whatever `latestReadings` returns.
- TVA/USACE/NWS bridge: per-source soft-fail; TVA timestamps parsed with explicit
  offsets; USACE 48 h lookback; NWS region→station map (12 regions) for pressure
  (`apps/api/src/evidence/conditionsBridge.ts`, `tva-provider.ts`, `usace-provider.ts`,
  `nws-provider.ts`).
- Snapshot emission (`build.ts`): `v1/streams.json`; `v1/conditions/latest.json`
  (all 148); `v1/fishability/{id}.json` (39 waters); `v1/stocking/{state}.json` +
  `-recent.json` (90-day rolling); shops; recent reports; `v1/evidence/waters.json`
  (re-emitted from the last evidence run); hatch + content packs. Writes are atomic
  and schema-validated pre-write.
- Health: `conditionsFeedHealth` (schema-validates every row; stale when
  `nextExpectedUpdate ≤ fetchedAt`; catalog-wide 0-assessed; age > 360 min) and
  `fishabilityFeedHealth` (any file failing the schema) wired into `/healthz`
  (`apps/api/src/snapshots/health.ts:33-171`, `apps/api/src/app.ts:126-130`).
  Note: `gaugesOk` keys only on the `gauges` job (`build.ts:196`) — but since the
  bridge runs *inside* that job (§3.4), a dead TVA/USACE lane still leaves `gauges`
  marked OK while its waters silently go unassessed (soft-fail design,
  `conditionsBridge.ts:226-237`).

#### 3.5 Species mode propagation (site-wide setting)
- Source of truth: Dexie-persisted settings, default `speciesMode: 'trout'`,
  `speciesFocus: ''` (`apps/web/src/lib/settings.tsx:6-11`). The old map-only
  `?species=` URL param is gone from `useMapState.ts` (T2-34's `?all=1` removal is
  also visible there, `:16-19`); RiverMapPage still honors URL overrides
  (`RiverMapPage.tsx:47,51`).
- Real consumers: map (RiverMapPage, TennesseeMap, MapLegend — legend title
  "Trout conditions legend" / "Water guide legend" by mode, `MapLegend.tsx:85-98`),
  Browse (`BrowsePage.tsx:14-16`), Conditions (`ConditionsPage.tsx:116-117`),
  detail-page focus card (`StreamDetailPage.tsx:203` → `FishabilityCard`, which reads
  the setting), SpeciesModeToggle + AppShell header affordance, SettingsPage.
- **Not propagated (facts):**
  - `StreamDetailPage.tsx:226-237` builds its decision with hardcoded `'trout'`
    mode — the page re-words by *catalog* species (warmwater/unverified/seasonal) but
    never by the user's mode.
  - `RiverDrawer.tsx:194,450` — same hardcoded `'trout'`.
  - `StockingPage.tsx:131` binds settings to an **unused** `_settings` variable; its
    species filter is a local URL param over TWRA event species (`:138,181`), so the
    site-wide mode has zero effect on stocking presentation (related open item T2-20).
  - Marketing site: no species-mode concept at all (§6).

#### 3.6 Offline, evidence, marketing generation
- Snapshots are fetched through the shared Dexie cache (`apps/web/src/lib/fishability.ts:16-29`,
  `gcTime: Infinity`, offlineFirst); absent fishability file = water not scored —
  rendered unassessed, never guessed.
- `/v1/evidence/waters.json` has **zero consumers** in `apps/web/src`, `apps/admin`,
  `apps/marketing` render paths (grep) — matching DECIDED policy #3;
  `apps/marketing/src/pages/data-sources.astro` is the owner-approved methodology
  page and accurately describes comfort bands, area pressure, spawn-state derivation,
  evidence-strength labels, and the rain/solunar exclusions (`:79-96`).
- Marketing data: bundled fixtures by default; `MARKETING_DATA_DIR` switches to the
  real snapshot tree (`apps/marketing/src/data/load.ts:52-103`) — wiring, not a live
  claim. Web prerender refuses fixture data on factual pages without
  `--allow-fixtures` (T1-8 verified: `apps/web/scripts/prerender.mjs:22-24,66,157`).

### 4. Assessed / unassessed / wrongly-assessed — exact causes

**Assessed (`assessed:true`, value > 0)** — requires ALL of: water has ≥ 1 configured
gauge (`build.ts:198`); a stored reading survives for that gauge id
(`scoreConditions.ts:63-75`); the newest reading carries cfs (or heightFt → base 50)
(`:85-138`). Only the 48 gauge waters qualify; today's *values* depend on live data
(external).

**Unassessed (`assessed:false` / `no-data`)** — any of: no configured gauges (100
waters); readings not matching configured gauge ids (`:67-75`); no usable flow/stage
metric in the newest reading (`:120-137`); v2 fishability: no tempC (`scoreFishability.ts:49-51`),
unreadable timestamp (`:56-59`), **absolute age > 180 min** (`:60-64`), species bands
`needs-source` (emitter emits honest `assessed:false` rows), spawn/pressure
components dropped for missing citations or stale region pressure.

**Wrongly-assessed vectors (repo-provable):**
1. **Stopped-sensor scoring window (NEW).** The USGS pass-2 gate is *relative to the
   same payload's newest observation* (`usgs.ts:106-125`). A sensor whose every metric
   froze at time T passes the gate forever (newest − metric.ts = 0); the reading is
   re-inserted each run stamped T (`stale-metrics.test.ts:104-117` documents this as
   intended "honest old stamp"), `latestReadings` has no age floor, and
   `scoreConditions` has no clock — so the conditions feed keeps emitting a full
   score (up to 90+) from a dead sensor for up to **90 days** (until retention prunes
   it), wearing a fresh `fetchedAt`. Mitigations that exist: per-metric timestamps are
   preserved (a *partially* dead gauge loses its stale metrics); the UI freshness chip
   flips to "Gauge stale · observed N hr ago" past 3 h
   (`riverMapSelectors.ts:86-91`); fishability path has the absolute gate. The
   conditions *score* itself is never age-gated.
2. **Trout model scope.** `scoreConditions` is trout-shaped but is computed for all
   148; the decision model stops unknown/warmwater waters from *wearing* it
   (`waterDecision.ts:114-118`), so this is presentation-contained, not eliminated.
   The 37 unknown-species waters (incl. gauge-fed ones) render "Unverified" + raw
   readings only.
3. **Seasonal window is authored nowhere.** The Nov–Mar winter window is hardcoded in
   the adapter (`waterDecision.ts:78-79`); the catalog carries only
   `yearRound: false`. A water whose real program runs Dec–Feb still shows
   "seasonal fishery" in Nov.
4. **Pressure/spawn components are generic, not species-tuned** — species sensitivity
   data is `needs-source` ×7, so a fixed `50 − 10·ΔhPa` and fixed ±4 °C spawn window
   apply to all seven species (`fishability.ts:250-256`, `spawnState.ts:15`).
5. **Unattributed activity gap:** `flow-trend` is contract-ready but unimplemented —
   tailwaters with ramping releases get no activity signal from the one factor the
   domain says matters most.


### 5. Repository wiring vs generated artifacts (drift) — *wiring facts, not live reality*

| Artifact | State in tree | Drift / note |
|---|---|---|
| `packages/content/streams/tn/*.yaml` | 148 waters | source of truth |
| `apps/web/public/atlas/rivers.geojson` | 148 features | ID set identical; prov `generated 2026-09-06/07` (`provenance.json`) |
| `apps/web/public/atlas/lakes.geojson` | **empty `features: []`** | still mounted as a map source (`mapStyle.ts:96`) — dead layer |
| `apps/web/src/features/map/riverIndex.json` | 148 | IDs/names/types identical to YAML |
| `docs/data-source-coverage.json` | **147 rows** | missing exactly `bradley-creek` (in catalog since 2026-09-05, `6a44063`/`30b2c83`); artifact generated 2026-09-08 from base `5648ccc` — OA-07 confirmed and pinned to one water |
| `packages/content/data/verified-gauges.json` | 90 USGS sites, `realTimeIV: true` | static registry verified **2026-09-02**, never refreshed — capability assertion, not current health |
| fishability emitter comments | `fishability.ts:27-31`, `build.ts:213-218` | say "exactly one factor" while three ship — stale doc |
| README architecture line | `README.md:63-64` "regenerated hourly" | consistent with cron (gauges job rebuilds hourly, `pipeline.ts:203-208`); `cron.ts:37`'s nightly `snapshots` job is a redundant second rebuild |

### 6. UI / content / SEO mismatches (every item: file → surface → divergence)

1. **Per-water marketing titles say "fly fishing" for all 148 waters** — including the
   8 warmwater and 37 unknown-species waters ("Norris Lake fly fishing — …").
   `apps/marketing/src/pages/streams/[state]/[slug]/index.astro:50`. The description
   (`:51`) additionally promises "fishability score, ideal flow ranges" on pages for
   waters that have neither (56 empty `idealFlow`; 109 waters with no fishability
   file).
2. **Site-wide species mode does not re-word or filter Stocking** — settings bound to
   unused `_settings` (`StockingPage.tsx:131`); stocking stays all-species with a
   local `?species=` filter (`:138,181`). Diverges from DECIDED policy #2
   ("re-filters/re-words every surface").
3. **Detail page + drawer ignore the user's mode** for their own decision framing —
   hardcoded `'trout'` (`StreamDetailPage.tsx:226-237`, `RiverDrawer.tsx:194,450`).
   They are honestly species-worded per the catalog, but All-fish mode changes
   nothing there.
4. **Stopped-sensor freshness gap** (§4.1): score number and fresh `fetchedAt` ship
   together while data may be months old; only the chip text carries the truth
   (`riverMapSelectors.ts:86-91`, `FreshnessChip`).
5. **Empty lakes layer mounted** (`mapStyle.ts:96` + `lakes.geojson` empty) — dead
   source; harmless at runtime, misleading to cartography readers and QA
   (`qa/audit.ts:169-271` reads lake polygons from the rivers file).
6. **Stale "one factor" comments** at `fishability.ts:27-31`, `build.ts:213-218`
   contradict the shipped three-factor activity rows.
7. **USACE orphan fetch**: `usace-provider.ts:64-68` fetches CORT1 for
   `waterId: 'cumberland-river'` every run, but `cumberland-river.yaml:6` has
   `gaugeIds: []` — the reading is stored and never consumed (dead data + wasted
   fetch; also masks a likely missing-gauge authoring gap).
8. **`latestValue` orders by raw ISO string compare** (`usgs.ts:60-65`) — correct for
   USGS's uniform per-site offsets, but silently misorders if offsets ever mix
   (latent, not a live defect).
9. **Marketing state pages are trout-total** (`fishing/[state]/index.astro`,
   `when-does-[state]-stock-trout/`) — accurate for the trout program, silent about
   the warmwater waters the app now scores; a positioning gap, not a false claim.
10. **Hatch content on per-water marketing pages is regional** (`[slug]/index.astro:37-48`,
    `getYearlyHatch(region.id)`) — defensible if labeled, but sits under a per-water
    "hatch chart highlights" heading.

### 7. Tests: present, missing, exact commands

**Commands** (root `package.json:12-21`): `pnpm -r test` · `pnpm -r lint` ·
`pnpm validate:content` (= `pnpm --filter @trout/content validate`) · `pnpm e2e` ·
`pnpm e2e:web`. Per-package: `pnpm --filter @trout/contracts test` (vitest **with a
90% coverage gate**, `packages/contracts/vitest.config.ts`); `pnpm --filter api test`;
content + web vitest without coverage gates. **Not executed in this audit** (see §1
limitations). File counts: contracts 9 · content 1 · api 28 · web 35 test files; e2e
14 Playwright specs (`e2e/{web,api,admin,marketing,fieldwork}`).

**Relevant suites seen in-tree:** contracts — `scoreConditions.test.ts`,
`scoreFishability.test.ts`, `fishability.test.ts`, `spawnState.test.ts`,
`readingFreshness.test.ts`, `schemas.test.ts`, `matchHatch.test.ts`,
`waterEvidence.test.ts`. api — `stale-metrics.test.ts` (incl. the kept-old-stamp
behavior, `:104-117`), `conditions-bridge.test.ts`, `fishability-emission.test.ts`,
`health.test.ts`, `snapshots.test.ts`, `usgs.test.ts`, `nws-provider.test.ts`,
evidence-*. web/atlas — `atlas-verify.spec.ts`, `fishability.spec.ts`,
`conditions-fixtures.spec.ts`.

**Missing regressions (repo-provable gaps):**
- No test pins an **absolute-age** rejection in the conditions path (the only age
  behavior pinned is the relative pass-2 + old-stamp retention).
- No test covers **title-tier promotion** (extent thresholds) against the real
  `riverIndex.json` (9 extent-promoted creeks are invisible to suites).
- No test detects **orphaned provider fetches** (CORT1-class) or **empty committed
  artifacts** (lakes.geojson).
- No test asserts **species-mode propagation into Stocking/detail/drawer wording**
  (F7 e2e is the open worklist item).
- No marketing test pins per-water page wording to waterbody species (F7 marketing
  suite).
- `latestValue` has no mixed-offset ordering test.

### 8. Worklist reconciliation (KNOWN-ISSUES IDs + OA-01…OA-10)

**Already tracked — verified done in code, no re-report:** T1-6 (relative staleness
gate, per-metric timestamps), T1-8 (prerender fixture refusal), T1-9 (assessed flag
passed on detail, `StreamDetailPage.tsx:220-224`), T1-10 (schema-validating feed
health), T1-15 (empty idealFlow badge path exists in decision model), T1-16 (legend
title by mode), T1-17 (hatch tab gated for warm/unverified, `RiverDrawer.tsx:187-229`),
T1-18/19 (seasonal states ship), T2-23/24 (filter row / sort by displayed state),
T2-26 (stockingRecent consumed, `StockingPage.tsx:150-167`), T2-27 (report photos
public: `RiverDrawer.tsx:600`, `ShopsPage.tsx:96`), T2-29..34 (copy/removals verified),
T2-54 (marketing data-sources page accurate).

**Still open and confirmed still open:** F7 (e2e for fishability/marketing/species
mode), T1-22 (site-wide species mode completion — partially shipped: map/browse/
conditions/settings done; stocking/detail/drawer gaps listed in §6.2-6.3), T2-20
(seasonal stocking frame), T2-21 (seasonal facts in prose), T2-28 (transition rule —
superseded by F6 shipping), T3-48..53 (owner/data backlog unchanged).

**OA-01…OA-10 (orchestrator provisional labels) — verdicts:**

| OA | Verdict vs tree |
|---|---|
| OA-01 absolute freshness | **CONFIRMED** — conditions path has no whole-reading age gate (`usgs.ts:231-251`, `scoreConditions.ts:8`); fishability path does. Untracked → new worklist item. |
| OA-02 score validity | **PARTLY STALE** — trout-shaped scoring still runs for all 148 server-side, but the decision model prevents unknown/warmwater waters wearing it (`waterDecision.ts:114-118`). Residual: feed content + "Unverified" presentation. Revise, don't re-file. |
| OA-03 trout omission in v2 | **CONFIRMED as designed** (ADR 0007 scope; trout = legacy path). Gap question for planner, not a defect. |
| OA-04 map tiers | **CONFIRMED** — 54/72/22 by extent; 9 creeks statewide-tier; no authored tier field. Untracked → new item. |
| OA-05 F6 parity | **REVISE** — propagation is far wider than briefed (settings + map + browse + conditions + detail focus card). Remaining gaps are specific: stocking, detail/drawer decision framing, marketing (§3.5, §6.2-6.3). |
| OA-06 marketing overclaims | **CONFIRMED** — "fly fishing" titles + feature promises on all 148 pages (§6.1). |
| OA-07 coverage drift | **CONFIRMED & PINNED** — 147 vs 148; exactly `bradley-creek` missing. |
| OA-08 USGS migration / realTimeIV | **REVISE** — no `realTimeIV` in content YAML; it's a static 2026-09-02 verification registry (`verified-gauges.json`) whose assertions are 11 days stale by audit time. The gauge-count facts (48 waters / 50 unique USGS ids) hold. |
| OA-09 field provenance | **CONFIRMED** — all 92 idealFlow ranges lack field-level provenance; schema cannot express it (`stream.ts:5-12`). |
| OA-10 snapshot fan-out | **CONFIRMED** — 39 fishability files; other 109 waters intentionally absent → rendered unassessed. |

**NEW findings (untracked):** NEW-1 stopped-sensor 90-day scoring window (§4.1) ·
NEW-2 CORT1 orphaned fetch (§6.7) · NEW-3 empty lakes.geojson still mounted (§6.5) ·
NEW-4 stale "one factor" comments (§6.6) · NEW-5 `latestValue` string ordering
latency (§6.8) · NEW-6 hardcoded `'trout'` decisions in detail/drawer (§6.3).


---

## Verification summary

- **Reproduced exactly:** 148 waters (35/57/38/12/5/1) · 103/8/37 broad species · 39
  `targetSpecies` · 48 gauge waters / 50 unique USGS ids · 92 unprovenanced ideal-flow
  ranges · 54/72/22 title tiers · Trout-mode 141/1/7 admission · all-fish 148 ·
  coverage artifact 147 (missing `bradley-creek`) · identical ID sets across YAML /
  rivers.geojson / riverIndex.json.
- **Corrected from the brief:** species-mode propagation (wider than claimed);
  `realTimeIV` (static registry, not YAML flags); "scoreConditions invoked for all
  148" is true server-side but presentation-gated client-side; snapshots rebuild
  hourly via the `gauges` job (README is accurate; a second nightly rebuild also
  exists).
- **Verified in code, marked done elsewhere:** the eleven worklist items in §8.
- **New:** six findings (§8 NEW-1…6), led by the 90-day stopped-sensor scoring window.
- All claims are one of: **fact** (path:line or command output above), **inference**
  (labeled — e.g. stopped-sensor behavior follows from the relative gate + no age
  floor + retention, with the old-stamp behavior pinned by `stale-metrics.test.ts`),
  or **external unknown** (routed below). No display tiers or score coefficients were
  chosen or endorsed — that is the planner's call with Session B/C evidence.

## Open questions for the planner

*Facts only external evidence can settle. Routed to Session B (water data) / Session C
(species/season science); not answerable from this repository.*

**Sensor reality (→ B):**
1. Which of the 50 unique USGS gauge ids report right now, and which are stopped?
   (The tree proves a stopped sensor scores for up to 90 days — but not which, if any,
   are stopped.) TVA/USACE endpoints are undocumented; are the 13 prefixed ids still
   valid? Is USACE CORT1 (Cordell Hull) meant to back `cumberland-river` (gaugeIds
   empty)?
2. Which gauge is the *right* gauge per water — e.g. `mill-creek-overton`'s
   03539778 is already known-wrong (T3-50); are any of the other 47 waters mis-anchored
   the same way?
3. What absolute staleness floor should the conditions path adopt (fishability uses
   180 min; the UI calls 3 h "stale"; retention is 90 days)? A science/ops judgment,
   not a code one.

**Species & seasons (→ C):**
4. Which species does each of the 37 unknown-species waters actually hold, and which
   of the 39 `targetSpecies` waters rest on inference (the draft F3 mapping counted
   11 "inferred" waters) vs typed TWRA evidence? The shipped catalog carries no
   per-water species citations.
5. Cited values for the seven `needs-source` comfort optimals (spotted-bass, crappie,
   bluegill, channel-catfish), all `lowerActiveC` values, all `flowTrend`/
   `pressureTrend` sensitivities, and striped-bass spawn window — without them, 4 of
   7 species emit `assessed:false` comfort and the pressure transform stays generic.
6. Do the authored 92 ideal-flow ranges have real hydrologic or agency provenance,
   and what window is seasonally correct (the catalog can't express either)?
7. Is the hardcoded Nov–Mar winter window (`waterDecision.ts:79`) right per water, or
   should `yearRound` grow an authored month window?

**Presentation tiers (planner decision, no intuition used here):**
8. What display tier should each of the 148 waters wear (9 extent-promoted creeks,
   5 unseen ponds, 1 spring are the edge cases)? What replaces extent for
   "fishery importance"?
9. Should the trout path eventually migrate into the per-species v2 model (OA-03
   gap), or is the two-model split (legacy trout + v2 warmwater) the intended
   steady state?

## Blockers

None. The audit completed read-only on the mandated branch. Two of three mandated
subagents were lost to upstream API rate limits (§1.3) — their scopes were covered by
direct investigation; noted as an execution deviation, not a blocker. Tests were
inventoried but not run (guardrail-compatible choice, §1).

---

*Audited tree: `campaign-a` @ `b44b4fe09af3b47a35f63afdb547475e1ccf0fe7`. Report
committed and pushed per section; final hash stated in the session's closing message.*
