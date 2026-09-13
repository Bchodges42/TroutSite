# ACCURACY AUDIT — paste-ready prompt for an audit/planning session

**How to use:** paste everything below the cut line into a strong fresh session. It
audits the site for accuracy, relentlessly researches data sources, designs the
sitewide logic, and writes three paste-ready session briefs. It changes no product
code. Its outputs land in the repo docs.

---

You are the ACCURACY AUDIT & PLANNING session for the Trout project — an
offline-first Tennessee fishing atlas (map, per-species fishability, stocking,
hatch key, regulations). Your job is NOT to change product code. It is to:

1. Audit the live site and its data for every accuracy gap.
2. Relentlessly research data sources so every displayed water can be scored.
3. Design the sitewide logic that makes the site truthful.
4. Produce three paste-ready session briefs that execute all of it.

## 0. Setup and required reading

Clone fresh (never reuse another session's working tree):
`git clone git@github.com:Bchodges42/TroutSite.git && cd TroutSite`
Commit identity: `git config user.name "Bhodges42"`. Work on branch
`accuracy-audit`; push it when done. A local build may be running at
http://127.0.0.1:8787 (passive GETs only); production trout.tntechclimb.com is
passive-GETs-only. Read, in order:

- `README.md` — what the product is; `AGENTS.md` — binding rules
- `docs/INDEX.md` — the doc map; `docs/KNOWN-ISSUES.md` — the worklist (much is
  already done; read the checkboxes)
- `docs/LOGIC-AUDIT.md` — the product-logic findings that drove recent stages
- `docs/EXECUTION-PLAN.md` + `docs/SESSION-BRIEFS-STAGE-1.md` — the house format
  your three briefs must follow
- `docs/adr/0007-fishability-contract.md` — the fishability contract
- `docs/reports/` — stage reports of what was actually built

Current state to verify yourself (don't trust this list): 148 catalog waters; 39
waters with authored targetSpecies; ~57 waters with UNVERIFIED species tags still
displaying; ~57 missing `yearRound`; 38/148 with assessed conditions; 623-row TWRA
stocking feed with ~264 unmatched alias rows; per-species fishability (comfort +
activity, NWS area pressure, spawn states, solar windows) shipped; trout/all-fish
site mode shipped; the raw-NHD network overlay shows water the selectable catalog
geometry does not cover.

## 1. Audit dimensions (use subagents; evidence per finding)

A. **Water selection & display clutter.** The owner wants FEWER selectable waters
   and fewer map titles: rivers always; major creeks yes; tiny/seasonal/intermittent
   streams no; warmwater-only streams don't belong in trout mode's labeled set.
   Enumerate the catalog by class (size, permanence, fishery significance,
   reservoir connection). Propose explicit citable criteria (NHD perennial codes,
   Strahler order, TWRA listing, reservoir connection) and APPLY them: which
   current waters drop out or become background-only; which uncataloged candidates
   (the network overlay + the 264 unmatched TWRA rows are the candidate pool) earn
   selectable status.
B. **Species truth.** Every water showing "unverified species" must be resolved
   with TWRA/authoritative evidence or redesigned so unverified never displays as a
   dead-end tag. Research the 57.
C. **Seasonal truth.** Winter put-and-take fisheries must present honestly by
   season (ACCEPTANCE CASE: Stones River in September shows out-of-season, not a
   live trout water — stocked trout are gone by summer heat/predation/harvest).
   Design states: active / winter-program / out-of-season / thermal-stress /
   unknown, driven by stocking history + schedule window + live water temperature.
D. **Gauge & temperature coverage.** Every major river — especially every
   reservoir-connected one — should have flow and temperature from somewhere, and
   every significant lake a temperature. Gap-list every displayed water lacking
   data. This feeds Part 2.
E. **Score coverage.** Minimize "unassessed": every displayed water either gets a
   real score (some source, some fallback) or an honest seasonal/absent
   explanation. "No data" must be rare and explained.
F. **Freshwater-wide.** Not trout-only: warmwater gamefish (basses, crappie,
   bluegill, catfish, stripers) are first-class users. Verify their presentation
   parity.

## 2. Data-source research (relentless — this is the core deliverable)

Already integrated: USGS NWIS, TVA, USACE CDA timeseries, TWRA stocking, NWS
observations. Research and VERIFY by actually fetching 1–3 polite sample URLs per
source (curl, UA `trout-audit/1.0 (contact: hodgeben4@gmail.com)`; single-digit
requests per host):

- USACE reservoir pages/APIs per TN dam (elev, tailwater temp, releases)
- TVA reservoir & tailwater data (temp, elevation, generation)
- USGS stations beyond current monitors (lake stations, temp-only)
- EPA Water Quality Portal / WQX and TDEC water-quality data (periodic temp)
- NDBC / large-lake buoys where applicable; satellite lake-surface-temperature
  (Landsat/Sentinel) as documented fallback — feasibility, no implementation
- Anything else that yields flow/temp/level for TN waters

For EACH source record: endpoint URLs, one real sample response for a TN water,
format, cadence, license/etiquette, which of our waters it covers, ingest
complexity, and whether it can feed comfort/activity scoring. Sources found but
not implementable still get full "how to use this" documentation — the owner will
scrape them. Write `docs/reports/accuracy-audit-data-sources.md` with the
per-source matrix mapped to the waters needing it.

## 3. Sitewide logic design (design, don't implement)

- **Display tiers:** SELECTABLE (full fiche, title, interaction) vs BACKGROUND
  (network linework only, no label, no selection). Rules + how search/filters
  treat each tier. Title-density policy per zoom and mode.
- **Decision-model state table:** species × season × data-availability →
  presentation, extending `waterDecision.ts` and ADR 0007 with the trout-season
  states from 1C and warmwater equivalents.
- **Scoring fallbacks:** what renders when a water has (a) a full gauge, (b) a
  nearby reservoir temp, (c) area-pressure only, (d) nothing but season knowledge.
- Known bugs to fold into the plan: the FishabilityCard requires a `?focus=`
  URL param nothing sets (unreachable feature — wiring fix pending); a hotfix
  branch `session-c-hotfix` exists unmerged (check `git log origin/session-c-hotfix`).

## 4. Deliverable: three session briefs

Write `docs/SESSION-BRIEFS-STAGE6.md` replacing any earlier drafts, following the
house format exactly (see STAGE-1 briefs): three sessions with disjoint file
ownership — A: apps/api + packages/contracts + infra; B/R: packages/content +
apps/web/scripts + atlas assets + geo tooling; C: apps/web/src + e2e/web +
e2e/fieldwork — each brief self-contained (the sessions have NOT seen this
conversation: include starting context and pointers to the md files), subagent
use encouraged, push-per-task-group, reports in docs/reports/, gates per push,
acceptance tests. BALANCE the three workloads (even-split rule, EXECUTION-PLAN
§2). The briefs together must cover: water curation (criteria + the actual
add/remove lists), the audited data sources wired or documented per water,
species truth for the unverified set, the trout-season engine, display-tier UI,
score-coverage fallbacks, and the focus-picker wiring bug. Print all three briefs
IN FULL in your final message for copy-paste.

## 5. Ground rules

- You change NO product code. You create only: the data-sources report, the
  session-briefs doc, an `accuracy-audit` report at
  `docs/reports/accuracy-audit.md`, and an INDEX.md row for them.
- Cite every data claim (URL + retrieval date). Never guess a value.
- Upstream APIs are treated politely (declared UA, minimal requests).
- Never touch secret values (.env); reference names only.
- Push the `accuracy-audit` branch; do not merge to main; report the branch name.
