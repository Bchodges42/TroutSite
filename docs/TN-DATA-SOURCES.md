# TN data sources — compiling the missing categories

OWNER: shared. Compiled 2026-09-11 from a public-surface comparison against the
CA/OR competitor plus verification of every primary source listed. Companion to
BACKLOG; ingestion follows the standard pipeline: research → YAML with `sources:`
→ contract validation → snapshot build → static `/v1/*`.

## 0. Provenance finding — how the competitor ships "every stream"

Their shipped assets settle it (inspected 2026-09-11):

- `streams-all.<hash>.geojson` — **11,907 named waters** (CA + OR), each feature
  stripped to `{ name, class }` (river|stream), simplified MultiLineString.
- `stream-index.<hash>.json` — `{ generated, count, waters: [{ n, r, t, b }] }`
  = name, region (CDFW area / ODFW zone), type, bbox. Search + label index.
- `rivers.<hash>.geojson` — major rivers only, same minimal schema.
- `cdfw-reaches.<hash>.geojson` — regulation reach segments for special regs.

That schema (names dissolved into MultiLineStrings, all other attributes
removed, vertex spacing simplified, bbox index) is the fingerprint of
**USGS NHD flowlines filtered to GNIS-named features**, grouped by name, joined
spatially to agency zones, simplified, and baked to static files. Public-domain
data + a one-off ETL — replicable for TN with the TIGER/NHD pipeline we already
run (see GEO session scripts).

**Design decision (agreed):** keep "all named streams" as an *overlay + search
index*, toggleable in Map layers, default OFF — default view stays the curated
trout catalog. The competitor's own legend layers it the same way (rivers &
streams faint, FEATURED highlighted); their landing just hides the complexity
better. Search should cover the full index either way.

## 1. Every named stream (long tail) — USGS NHD

| Source | URL | Status | Method |
|---|---|---|---|
| NHD (The National Map) staged GDB downloads | `https://prd-tnm.s3.amazonaws.com/index.html?prefix=StagedProducts/Hydrography/NHD/HU8/GDB/` | ✅ verified 2026-09-11 (S3 open) | Download HU8 GDBs covering TN (HU2 06 Tennessee basin + 05 Cumberland + 08 Mississippi-border HU8s) |
| NHDPlus HR value-added attributes | https://nhdplus.com/ | to verify | Flowline VAA (stream calc, slope) if needed |
| GNIS names | embedded in NHD as `gnis_name` | n/a | Filter `FType=StreamRiver AND gnis_name IS NOT NULL` |

ETL: dissolve by `gnis_name` (+county to disambiguate duplicates), simplify
(~1:100k equivalent), emit per-name features + bbox index mirroring their
`stream-index` shape. License: public domain (USGS). Cadence: yearly refresh.

## 2. Access points — biggest parity gap

Target model (mirror competitor + our `sources:` culture):
`{ id, streamId, name, type: parking|boat-ramp|walk-in|put-in, lat, lng,
notes, sources: [] }` → `/v1/access/TN.json`.

| Source | URL | Status | Notes |
|---|---|---|---|
| TWRA public fishing areas / ramps | https://www.tn.gov/twra/fishing.html (hub; access pages under it) | ✅ hub verified | TWRA lists agency access areas + WMA waters; scrape politely, verify points by hand |
| TVA tailwater access areas | https://www.tva.com/environment/lake-levels (per-dam rec pages) | ⚠️ 403 to bots (Akamai) | Human-curated, not scraped: per-dam put-in/wade lots for 6 tailwaters is a bounded job |
| Cherokee NF (USFS) recreation sites | https://www.fs.usda.gov/detail/cherokee/home | ✅ verified | Fishing access along Hiwassee, Conasauga, Tellico headwaters |
| GSMNP | https://www.nps.gov/grsm/planyourvisit/fishing.htm | ✅ verified | Park stream access; road pullouts via NPS places data |
| NPS API (structured places) | https://developer.nps.gov/api/v1/ | ⚠️ needs free API key | `parks?parkCode=grsm` + places/visitorcenters endpoints |
| OSM parking/amenities along corridors | Overpass (already allowlisted in our CSP: overpass-api.de, overpass.private.coffee) | n/a | `highway=trailhead`, `amenity=parking` + `canoe=yes` within river corridor buffers; ODbL attribution — fits our attribution rules |
| Bridge-access inference | internal: TIGER roads ∩ our river geometry (reuse `match-rivers-tiger.mjs` pattern) | n/a | Generate candidates → human review → YAML. This is how we scale past ~50 curated points |

Cadence: curated set quarterly; OSM/bridge candidates regenerated with geometry
builds.

## 3. TVA release schedules — TN-specific moat (wadeable windows)

No official public API exists (researched 2026-09-11). Options in order:

1. **Parse the official published schedule** — [TVA Recreation Release Schedules](https://tva.com/environment/recreation/recreation-release-schedules)
   (daily, typically posted late afternoon for next day). tva.com 403s default
   bots; use identified UA + contact, cache hourly via `trout-refresh-data`,
   honor robots. Precedent: watts.bar parses it hourly; Deep Dive app
   resells it. ⚠️ verify ToS allows schedule reuse (facts/schedules likely
   fine; attribute TVA).
2. **TVA Lake Info app backend** (unofficial endpoints powering the official
   app) — same data, more structured; fragile, monitor for breakage.
3. **Historical backfill/validation** — UCAR/DASH dataset: hourly turbine +
   total discharge, 45 TVA sites (public). Use to calibrate "wadeable window"
   thresholds per dam against our `idealFlow` bands.
4. If scraping proves hostile: email TVA public information / rec office for
   the schedule feed — agencies generally cooperate with safety-oriented uses.

Product: per-tailwater "release schedule today" + computed wadeable-window
banner; feeds `scoreConditions` as a TVA reading class (additive ADR).

## 4. Structured regulations (fill our existing `fishingInformation` schema)

Our contracts already define `authority / sections / appliesTo /
effectiveFrom-Through / sourceUrl / verifiedAt`. Populate:

| Source | URL | Status | What to capture |
|---|---|---|---|
| TWRA annual proclamation (trut rules + special-regulation waters) | https://www.tn.gov/twra/fishing.html | ✅ hub verified | Statewide creel/size; per-water exceptions (e.g. SoHo/Holston special regs) with section boundaries; effective dates |
| GSMNP superintendent's compendium (fishing) | https://www.nps.gov/grsm/planyourvisit/fishing.htm | ✅ verified | Park rules differ from TWRA (limits, gear, boundaries) — applies to Little River etc. |
| TWRA trout stocking info (we have the feed) | https://www.tn.gov/twra/fishing/trout-information-stockings.html | ✅ verified, already ingested | Cross-check our 623-row stocking dataset |

Emit `/v1/regs/TN.json`; UI gets a Regulations tab + computed OPEN chip
(season dates → open/closed now) mirroring the competitor's per-section card.

## 5. Advisories & closures (their "low-flow restrictions" analog)

| Source | URL | Status | Notes |
|---|---|---|---|
| TDEC bacteriological + fishing advisories | https://www.tn.gov/environment/program-areas/wr-water-resources/watershed-stewardship/bacteriological-and-fishing-advisories.html | ✅ found via search 2026-09-11 | "Do not eat" (species-specific) + precautionary advisories per water; model as advisory items on the water page |
| TDEC precautionary advisory news releases | e.g. May 2025, Aug 2026 East TN advisories | n/a | Watch page updates; annual review cadence |

## 6. Conditions coverage (38/146 assessed today)

- Every featured/tailwater water must be live: add USGS temp-capable gauges,
  TVA forebay/tailwater temps (from TVA data above).
- Unassessed named streams: show clearly-labeled seasonal climatology
  ("typical September") built from regional normals — honest, non-live.

## 7. Fly-shop reports cold start

23 shops listed, reports mostly disabled, 0 rows. Before any feature push:
personal ask to 2–3 shops (Knoxville/Bristol/Chattanooga) to post weekly via
the portal. Attribution layer only has value when alive.

## Next actions

1. ADR: additive contracts — `AccessPoint`, `RegulationInfo` emission,
   `tvaRelease` reading class (contracts are frozen; additive + tag bump).
2. ETL ticket: NHD TN named-flowline dissolve + index (Section 1 + 0 design).
3. Curation sprint: 6 tailwaters × (TVA access lots + release-schedule feed).
4. TWRA proclamation → `fishingInformation` YAML for the ~20 featured waters.
