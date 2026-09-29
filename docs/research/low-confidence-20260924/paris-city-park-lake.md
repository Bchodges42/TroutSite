# Research log: "Paris City Park" (TWRA winter trout pond, Paris, Henry County, TN)

Water: **"Paris City Park"** — TWRA Region 1 winter put-and-take rainbow-trout pond, Paris, Henry County.
2026 schedule rows: 1/14/2026 and TBD 12/2026 (rainbow).
Alias question: does TWRA's site = the Eiffel Tower Park boardwalk trout pond (owner's 2026-09-24 identification) or the catalog's "Green Acres Lake (aka Williams Lake)"?
All retrievals: **2026-09-24** unless noted. Research only; no external contacts made.

---

## A. Identity evidence (coordinates first)

### A1. TWRA Trout Stocking Locations GIS (FeatureServer)
- Title: TWRA_Trout_Stocking_Locations / layer "Trout_MASTER_Project" (FeatureServer/0)
- Org: Tennessee Wildlife Resources Agency (hosted ArcGIS Online; org id PWXNAH2YKmZY7lBq)
- Query: `UPPER(Site_Name) LIKE '%PARIS%' OR UPPER(StreamName) LIKE '%PARIS%'`, outSR 4326, returnGeometry=true
- Retrieval: 2026-09-24 (raw JSON pulled via curl)
- URL: https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/TWRA_Trout_Stocking_Locations/FeatureServer/0/query?where=UPPER(Site_Name)+LIKE+'%25PARIS%25'+OR+UPPER(StreamName)+LIKE+'%25PARIS%25'&outFields=*&outSR=4326&f=pjson&returnGeometry=true
- Fields of the single matching feature (OBJECTID 678):
  - Site_Name: **"Paris City Park"**; StreamName: "Paris City Park Lake"
  - Region 1; County HENRY; City Paris
  - StockingProgram **Winter**; WaterClass **pond**; Species **rainbow**
  - HoursOpen: "Contact Region 1"
  - LATITUDE **36.286560093** / LONGITUDE **-88.305123769**; geometry point x=-88.305129245111289, y=36.286566885674624
  - GlobalID c68b2e95-21f3-407f-b748-9226ec5e3b74
  - Service metadata `lastEditDate` epoch 1790270245235 ms ≈ 2026-09-04 (data current within weeks of retrieval)
- Establishes: TWRA's own authoritative point for the site, named exactly as the schedule rows.
- Does not establish: what the "Paris City Park" label refers to on the ground.

### A2. Eiffel Tower Park location (OpenStreetMap via Nominatim)
- Source: OpenStreetMap (ODbL) through nominatim.openstreetmap.org
- Retrieval: 2026-09-24
- URLs:
  - https://nominatim.openstreetmap.org/reverse?lat=36.286566885674624&lon=-88.305129245111289&format=jsonv2&zoom=16
  - https://nominatim.openstreetmap.org/search?q=Eiffel+Tower+Park+Paris+Tennessee&format=jsonv2
- Fields:
  - Reverse geocode of TWRA point → "Volunteer Drive, Hancock, Paris, Henry County, Tennessee 38242" (OSM way 6799696)
  - **Eiffel Tower Park** (OSM way 1051308117, leisure=park): centroid **36.2870171, -88.3055950**; bbox lat 36.2855243–36.2885190, lon -88.3079641–-88.3033215 (entrance block on Volunteer Drive)
  - Second OSM node "Eiffel Tower Park" 4976188377 at 36.2867825, -88.3001074
  - Geocode of park address "1020 Maurice Fields Drive" → **36.2868043, -88.3027806** (parcel at NE edge of the park block)
- Comparison: TWRA point (36.286567, -88.305129) falls **inside** the OSM Eiffel Tower Park polygon bbox, ~0.04–0.14 km from the polygon centroid; ~0.2 km from the 1020 Maurice Fields Dr geocode.
- Establishes: TWRA's "Paris City Park" coordinate is on the Eiffel Tower Park block, not at any other city pond.
- Note: an attempt to list the unnamed pond polygon inside the park bbox via Overpass failed (HTTP 406/504/timeout on 2026-09-24, endpoints overloaded); the pond polygon itself was not obtained. Non-load-bearing.

### A3. Green Acres Lake — GNIS (USGS The National Map geonames service)
- Source: USGS Geographic Names Information System, hosted MapServer "geonames" layer 7 "Other Hydrographic Features"
- Retrieval: 2026-09-24
- URLs:
  - https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/7/query?where=gaz_id%3D1286062&outFields=gaz_id,gaz_name,gaz_featureclass,county_name&returnGeometry=true&outSR=4326&f=pjson
  - Query `UPPER(gaz_name) LIKE '%GREEN ACRES%' ... state TN` → single hit
  - Query `UPPER(gaz_name)='WILLIAMS LAKE' AND state_alpha='TN'` → hits only in **Shelby** (Lake) and **McMinn** (Reservoir) counties — **none in Henry County**
  - No GNIS feature named "Paris City Park …" in TN (query returned none)
- Fields: **"Green Acres Lake"**, gaz_id 1286062, feature class **Reservoir**, county **Henry**, TN; GNIS geometry point **-88.30902062, 36.30949932** (36.30950, -88.30902)
- Comparison: Green Acres Lake → TWRA "Paris City Park" point: Δlat 0.02293° ≈ 2.55 km; Δlon 0.00389° ≈ 0.35 km; **separation ≈ 2.57 km** (Green Acres Lake is ~0.8 km NNE of the Paris courthouse square; the TWRA point is ~1.7 km S of the square). Two different ponds; not the same water under two names on any map evidence found.
- Establishes: "Green Acres Lake" is a real, separately named Henry County reservoir north of downtown; it is NOT where TWRA's trout point sits.

### A4. Williams Lake — location evidence
- Sources (search-result snippets; underlying pages not fetchable 2026-09-24, see caveats):
  - World's Biggest Fish Fry "Jr. Fishing Rodeo" Facebook event: "Fishing Rodeo Location: **Williams Lake, Greenacres Drive** – Paris, TN … Age Limit: 1–12" (observed in search results 2026-09-24)
  - TWRA license site (license.gooutdoorstennessee.com) event listing "World's Biggest Fish Fry Jr. Fishing Rodeo" (Apr 30, 2022): "This free fishing event is part of the WORLD's Biggest Fish Fry in Paris, TN. This event is held at **Williams Lake** not far from the H[enry County Fairgrounds]" (search snippet)
  - Zillow snippet: wooded lot at 120 **Greenacres Dr** "sits just across the road from Williams Lake"
  - Search-summary claims (unverified): "Green Acres Dam (NID ID: TN07917), owned by the City of Paris"; Fishbrain/fishangler list a "Green Acres Lake" in Henry County with catfish/bullhead fishery
- Establishes: "Williams Lake" is the locally named pond on **Greenacres Drive** (the Green Acres neighborhood, adjacent to the fairgrounds/Fish Fry grounds) — i.e., the same pond as GNIS "Green Acres Lake" or its immediate neighbor. The rodeo is a free kids' event (ages 1–12); no trout mentioned in any listing seen.
- Not established: no source found that literally equates the names "Green Acres Lake" and "Williams Lake" (GNIS has no "Williams Lake" in Henry County, so the "aka" is local usage only). No public source ties Williams Lake to TWRA **trout** stocking; the only TWRA-adjacent tie found is the license-site listing of the kids' rodeo event (a TWRA events calendar, not a trout stocking schedule entry).

### A5. TWRA 2026 Trout Stocking Schedule (official data table)
- Title: "2026 Trout Stocking Schedule" on TWRA page "Trout Information & Stockings"
- Retrieval: 2026-09-24 (page HTML + backing JSON)
- URLs:
  - Page: https://www.tn.gov/twra/fishing/trout-information-stockings.html
  - Data (Ajax source of the sortable table): https://www.tn.gov/twra/fishing/trout-information-stockings/_jcr_content/contentFullWidth/tn_complex_datatable_1990410459.exceldriven.json
- Fields: 616 rows statewide. **Henry County rows (complete list):**
  - `{"REGION":"1","COUNTY":"Henry","LOCATION":"Paris City Park","TYPE":"Winter","STOCKING DAY":"1/14/2026","SPECIES":"Rainbow Trout"}`
  - `{"REGION":"1","COUNTY":"Henry","LOCATION":"Paris City Park","TYPE":"Winter","STOCKING DAY":"TBD 12/2026","SPECIES":"Rainbow Trout"}`
  - No site named Green Acres / Williams / Eiffel anywhere in the 616-row schedule (only substring false positives on "Williamson" county).
- Establishes: the catalog's two 2026 rows are verbatim from TWRA's current schedule; the only Henry County trout site is "Paris City Park"; TWRA never publishes a Green Acres/Williams/Eiffel label.
- Note: page also links a GIS map ("Find Trout Stocking for Locations Near You") and a Trout Fishing Forecast StoryMap (https://storymaps.arcgis.com/stories/dbb92bdf718f4fd7839bf4b08fb82747 — JS-rendered; body text not readable via fetch, no Paris quote obtained).

---

## B. Public corroboration of the pond's local identity

### B1. Henry County Now — "200 Rainbow Trout Stocked In Eiffel Tower Trout Pond"
- Author/org: Henry County Now (local news); publication 2025-12-10 (6:13 pm)
- Retrieval: 2026-09-24 (WebFetch, full article)
- URL: https://www.henrycountynow.com/200-rainbow-trout-stocked-in-eiffel-tower-trout-pond/
- Fields: "Wednesday afternoon, **TWRA** delivered 200 fresh rainbow trout, and they've now been stocked in the **trout pond at Eiffel Tower Park Extended**"; "**Eiffel Tower Park Extended is across the street from Eiffel Tower Park**"; "Another 200 trout will arrive later this month"; "TWRA stocks the pond with trout each year"; license + trout stamp required; photos credited to TWRA and Paris Parks and Recreation personnel.
- Establishes (dated 2025-12-10): TWRA's Paris trout deliveries go to the Eiffel Tower Park "Extended" pond. No mention of "Paris City Park," "Green Acres," or "Williams Lake."

### B2. RadioNWTN — "Man dies at Eiffel Tower trout pond area"
- Author/org: RadioNWTN (radionwtn.com); publication 2025-08-14 (6:31 pm); read via Wayback snapshot 2025-08-15T23:10:25
- Retrieval: 2026-09-24
- URL: https://web.archive.org/web/20250815231025/https://www.radionwtn.com/2025/08/14/man-dies-at-eiffel-tower-trout-pond-area/
- Fields: "The trout pond area is located **across the street from the main Eiffel Tower Park**."
- Establishes: local outlet's standing name for the TWRA pond area is "Eiffel Tower trout pond."
- Related but snippet-only: radionwtn.com "TWRA Stocks Eiffel Tower Park Pond With Trout" (search-result summary dated Jan 17, 2025, mentioning "Eiffel Tower Park II"); live site blocks fetching (HTTP 202/empty) and that URL is not in Wayback — treat as **unverified snippet**.

### B3. Paris Post-Intelligencer (parispi.net) — snippet-level only
- Observed via search results 2026-09-24; attempts to fetch parispi.net search/live pages failed (JS-driven homepage returned for `?s=trout`); Wayback CDX (checked 2026-09-24) holds no archived parispi trout URLs (one CDX query interrupted by Internet Archive downtime).
  - "Trout stocking next week at pond near **Eiffel Tower Park**" — Paris PI, Dec 6, 2019 (snippet)
  - "Winter trout stocking returns to **Eiffel Tower Park II on Volunteer Drive** in Paris on Jan. 15" — Paris PI stories list (year not pinned; Volunteer Drive matches the OSM park-block location)
  - "SHORTSHOTS … Paris will have a trout stocking Wednesday" — Paris PI, Dec 6, 2012 (snippet; pond not named)
- Establishes (with caveat): local paper consistently names the Eiffel Tower Park pond for the winter stockings; snippets only, no full URLs captured.

### B4. City of Paris (paristn.gov)
- Parks & Recreation department page (https://www.paristn.gov/departments/parks-and-recreation/), retrieved 2026-09-24: lists Eiffel Tower Park, Eiffel Tower Splash Park, Civic Center, McNeill Park, Ogburn Park, Atkins Porter Rec Center. **No "Williams Lake" or "Green Acres" park/lake listed.**
- Eiffel Tower Trout Pond Boardwalk project page: probed 2026-09-24, live at https://paristn.gov/eiffel-tower-park-trout-pond-boardwalk/ (200 after redirect; already known — the page confirms the pond exists but does not name the TWRA label; not presented as new evidence).

### B5. Second-source address confirmation for Eiffel Tower Park
- Yelp listing (search snippet, 2026-09-24): "Eiffel Tower Park … 1020 Maurice Fields Dr, Paris, TN 38242, (731) 644-2517"
- Cumberland Electric Membership Corp page (snippet): Eiffel Tower Park, 1020 Maurice Fields Drive, Paris (paristn.gov)
- Establishes: the OSM park polygon and the street address agree; the address geocode (36.28680, -88.30278) is ~0.2 km from TWRA's point.

---

## C. Program history (how far back the "Paris City Park" schedule rows go)

### C1. Chattanoogan.com — "Winter Trout Stocking Dates Announced" (2010–11 season)
- Org: Chattanoogan.com; publication 2010-11-29
- Retrieval: 2026-09-24 (WebFetch, full article)
- URL: https://www.chattanoogan.com/2010/11/29/189485/Winter-Trout-Stocking-Dates-Announced.aspx
- Fields: TWRA "plans to release more than 88,000 rainbow trout into Tennessee waters from December through March"; location list includes "**15 - Paris City Park (Paris)**" (December 2010) and "**19 - Paris City Park (Paris)**" (January 2011).
- Establishes (dated statement): "Paris City Park" was the published site label in winter **2010–11**.

### C2. TWRA archived winter schedule PDF (2013–14 season)
- Title: "Winter Trout Stocking — Tentative Winter Trout Stocking Dates 2013/2014 (UPDATED 12/04/13)"
- Source: http://www.tn.gov/twra/fish/StreamRiver/stockedtrout/wintertrout.pdf via Wayback capture 2014-01-12T20:17:49
- Retrieval: 2026-09-24 (PDF downloaded, text extracted)
- URL: https://web.archive.org/web/20140112201749/http://www.tn.gov/twra/fish/StreamRiver/stockedtrout/wintertrout.pdf
- Fields: row "**11 Wednesday Paris City Park Paris**" (Dec 11, 2013) alongside McKenzie City Park, Cane Creek Park (Cookeville), Stone Bridge Park (Fayetteville), etc.
- Establishes: "Paris City Park" label in the **2013–14** official schedule (planned program evidence).

### C3. Negative evidence — Paris is winter-only
- Archived TWRA "2011 TWRA TENTATIVE TROUT STOCKING SCHEDULE" (sched11.pdf, capture 2011-04-11) and "2013 … SCHEDULE" (sched13.pdf, capture 2013-01-10), both retrieved 2026-09-24 from web.archive.org, list Feb–Oct stream/reservoir stockings by county and contain **no Paris row** (checked by text extraction).
- Establishes: no warm-season TWRA trout stocking of Paris in those years — consistent with a winter put-and-take pond only.

### C4. Intermediate mentions (snippets, not fetched in full)
- The Tennessean (2017-01-04): winter releases through March 17, "Paris City Park stocked on Jan. 11" (search snippet).
- TNDeer forum post (2017-12-21): TWRA winter schedule listing "Paris City Park, Paris – 6 stockings on Wednesdays" (forum repost of schedule; snippet).
- Smith County Insider (c. Dec 2025/Jan 2026): TWRA 2025-26 winter rainbow program continuing (snippet; full location list not fetched).
- Chattanoogan.com "TWRA 2025-26 Winter Trout Stocking Program Continues" (2025-12-31, fetched 2026-09-24): program >40 locations; refers readers to tnwildlife.org for the location list; no Paris rows in article body.
- Earliest naming found: **winter 2010–11**. Nothing earlier located (2008–2009 searches returned nothing; no archived winter schedules pre-2013 found on Wayback).

---

## D. Contradictions and uncertainty

1. **Label vs. local name.** TWRA's own materials (schedule 2010–2026, GIS point, stocking photos) say "Paris City Park"; Henry County media (2019–2025) consistently say "Eiffel Tower Park (Extended/II) trout pond." These are the same deliveries (Dec 2025 Henry County Now photo shows TWRA + Paris Parks & Rec stocking "the trout pond"), so this is a label divergence, not two sites.
2. **The catalog's Green Acres/Williams mapping is contradicted, not just unproven:** TWRA's GIS point (36.28657, -88.30513) is 2.57 km from GNIS Green Acres Lake (36.30950, -88.30902); Green Acres Lake/Williams Lake sits on Greenacres Drive and hosts the kids' Fish Fry rodeo; no TWRA trout schedule 2010–2026 lists it; no source found tying it to trout.
3. **Residual uncertainties:** (a) "Green Acres Lake = Williams Lake" equation is inferred from co-location on Greenacres Dr (Zillow snippet, rodeo address) — no source states it outright; (b) Paris PI items are snippets without stable URLs; (c) radionwtn Jan 17, 2025 "Eiffel Tower Park II" article unverified beyond a search summary; (d) history before winter 2010–11 unexplored successfully (no archived schedules found); (e) NID dam record (TN07917, "owned by City of Paris") not independently confirmed — NID API endpoints returned 404 on 2026-09-24.

## E. Searches run (2026-09-24)

Productive:
1. WebSearch: Paris TN trout stocking Eiffel Tower Park pond TWRA (partially rate-limited)
2. WebSearch: paristn.gov "Eiffel Tower" trout pond boardwalk Paris Tennessee → found boardwalk page, henrycountynow, radionwtn, geotourism, parispi leads
3. WebSearch: "Paris City Park" trout stocking TWRA Tennessee → TNDeer 2017, Tennessean 2017, parispi 2012 snippets
4. WebSearch: "Eiffel Tower Park" trout stocking Paris Tennessee rainbow → henrycountynow 2025-12-10, parispi 2019-12-06, radionwtn 2025-01-17 leads
5. WebSearch: "Green Acres" OR "Williams Lake" lake Paris Henry County Tennessee → Williams Lake rodeo, Green Acres Dam NID, Zillow Greenacres Dr
6. WebSearch: "Williams Lake" Paris Tennessee fishing rodeo fish fry fairgrounds (partial)
7. WebSearch: tn.gov TWRA winter trout stocking schedule 2026 "Paris City Park" → parispi "Eiffel Tower Park II on Volunteer Drive" snippet
8. WebSearch: TWRA winter trout stocking schedule 2025-2026 Paris City Park January 14 2026 → smithcountyinsider, chattanoogan 512916
9. WebSearch: chattanoogan.com TWRA winter trout stocking dates December 2010 Paris City Park → 189485 article (fetched, verified)
10. WebSearch: "Jr. Fishing Rodeo" "World's Biggest Fish Fry" Williams Lake … → Facebook event "Williams Lake, Greenacres Drive"
11. Database/API: ArcGIS FeatureServer query (Paris rows + coordinates); GNIS MapServer (Green Acres Lake; Williams Lake statewide; Paris City check); Overpass (Henry named waters; park polygon); Nominatim (reverse + forward geocodes); TWRA schedule JSON; Wayback CDX (tn.gov/twra stockedtrout, radionwtn, chattanoogan)

Unproductive / blocked (documented attempts):
12. WebSearch: radionwtn.com TWRA stocks Eiffel Tower Park pond trout January 2025 (429 + irrelevant)
13. WebSearch: "gooutdoorstennessee" "Fishing Rodeo" Williams Lake Paris 2022 (429)
14. WebSearch: Paris PI "Eiffel Tower Park II" … "Volunteer Drive" January (partial only)
15. WebSearch: "Winter trout stocking returns to Eiffel Tower Park II" Paris (no hits)
16. WebSearch: TWRA winter trout stocking 2008/2009 "Paris City Park" (429s; nothing found — pre-2010 history unresolved)
17. WebSearch: WJP radio Paris Tennessee trout stocking (429; no WJP item found)
18. Fetch attempts: radionwtn.com live (bot-block, HTTP 202/empty), parispi.net search (JS shell), DDG/Bing HTML search (CAPTCHA/generic results), NID API (404), Overpass pond-polygon retry (406/504), StoryMap body text (JS-rendered, unreadable), tennesseerivervalleygeotourism.org entries URL (404).

---

## F. Recommendation

**Which pond is TWRA's "Paris City Park" site?** The **Eiffel Tower Park trout pond (the city "Extended"/boardwalk pond, Eiffel Tower Park block, Volunteer Drive / 1020 Maurice Fields Dr, Paris)** — confidence **HIGH**. Basis: (1) TWRA's own GIS places the site at 36.286567, -88.305129, inside the mapped Eiffel Tower Park block (~0.2 km from the park's street address); (2) dated local reports of the TWRA deliveries (2025-12-10 Henry County Now; 2025-08-14 RadioNWTN) all describe the Eiffel Tower Park "Extended" pond, across the street from the main park; (3) the owner's identification is consistent with all of it. The brief's guess that Eiffel Tower Park sits at ~36.377, -88.29 is wrong — it is at ~36.287, -88.306.

**Is the catalog's "Green Acres Lake (aka Williams Lake)" mapping right?** **Wrong** (not merely unprovable). Green Acres Lake is a separate, GNIS-named city reservoir at 36.30950, -88.30902 on Greenacres Drive — 2.57 km from TWRA's trout point — used for the World's Biggest Fish Fry Jr. Fishing Rodeo (kids 1–12), with no appearance in any TWRA trout schedule or report found (2010–2026) and no source tying it to trout stocking. The correct catalog alias for TWRA's site is the local name "Eiffel Tower Park (Extended) trout pond"; "Green Acres Lake (aka Williams Lake)" should be treated as a different water entirely (local usage likely equates Green Acres Lake and Williams Lake, but no source states it outright).

**Classification bucket:** **seasonal-stocked** — a winter put-and-take seasonal-stocked pond (rainbow trout, December–February/March only; no warm-season stocking found in archived schedules; pond too warm for summer holdover is the program's design premise). Not a year-round trout water, not a warmwater-focus TWRA trout site.
