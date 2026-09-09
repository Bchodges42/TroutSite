#!/usr/bin/env python3
"""Generate SPECIES-CLASSIFICATION.md + proposed-waters-2026-09.yaml from one row set.

Row fields: id, classification, species (display), yearRound (True/False/None),
confidence (high/medium/low), citation (1-line w/ URL), flags (list of short strings).

Run from repo root:  python docs/research/build-classification.py
Validates coverage against apps/web/public/atlas/rivers.geojson (148) + the 17 pending-add ids.
"""
import json, sys, io
from datetime import date

ACCESS = "2026-09-09"

# ---------------------------------------------------------------- row data --
# classification enum: trout-wild | trout-stocked | tailwater-trout | warmwater | unknown-need-evidence
# yearRound None = evidence does not reach -> leave ABSENT (never guessed).
R = []
def r(id, cls, sp, yr, conf, cite, flags=()):
    R.append(dict(id=id, cls=cls, sp=sp, yr=yr, conf=conf, cite=cite, flags=list(flags)))

TWRA_ST = "TWRA 2026 stocking schedule (tn.gov/twra/fishing/trout-information-stockings.html)"
TWRA_TW = "TWRA tailwater stocking table (tn.gov/twra/fishing/trout-information-stockings.html)"
TWRA_RG = "TWRA trout regs (tn.gov/twra/fishing-regs/trout-regulations.html)"
PLAN = "TWRA Trout Mgmt Plan 2017-2027 (tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf)"

# --- WEST TN (tn-west, 21) --------------------------------------------------
r("beech-lake","trout-stocked","rainbow (winter put-and-take); bass/crappie/bluegill/catfish rest of year",False,"high",
  f"{TWRA_ST}, Region-1 Winter row stocked 1/14/2026 + TBD 12/2026; Henderson Co (Lexington)",["identity: Henderson Co per TWRA"])
r("cameron-brown-lake","trout-stocked","rainbow (winter; 5/day Community Lakes site)",False,"high",
  "TWRA news 11/26/2025 'Cameron Brown Lake in Germantown' + "+TWRA_ST)
r("covington-fbc-pond","trout-stocked","rainbow (winter; NEW site 2025-26)",False,"high",
  "TWRA news 11/26/2025 'New locations this year include... Covington First Baptist Church pond' + "+TWRA_ST)
r("edmund-orgill-lake","trout-stocked","rainbow (winter); bass/bream/catfish rest of year",False,"high",
  f"{TWRA_ST} (Shelby/Edmund-Orgill Park, stocked 1/13/2026)")
r("hatchie-river","warmwater","bass/panfish; unchannelized river + NWR oxbows (14-in bass min, electric only)",True,"medium",
  "USFWS Hatchie NWR fishing page (fws.gov/refuge/hatchie) + absence from "+TWRA_ST)
r("johnson-park-lake","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Shelby/Johnson Park Lake); Collierville per Music City TU + Commercial Appeal",["identity: Collierville, not Memphis"])
r("kentucky-lake","warmwater","crappie (20/day, 10-in), sauger Dec-Mar, blue catfish, LMB/smallmouth",True,"high",
  "TWRA Kentucky Reservoir where-to-fish (tn.gov/twra/fishing/where-to-fish/west-tennessee-r1/kentucky-reservoir.html) + absence from trout programs")
r("lake-graham","trout-stocked","rainbow (winter); TWRA Family Fishing Lake (bass/crappie/bluegill/cats) rest of year",False,"high",
  f"{TWRA_ST} (Madison/Lake Graham, stocked 1/8/2026) + TWRA family-fishing page")
r("martin-city-pond","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Weakley/Martin City Pond; Martin Recreational Complex)")
r("milan-city-pond","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Gibson/Milan City Pond, stocked 1/14/2026)")
r("mississippi-river","warmwater","blue/flathead/channel catfish-led trophy fishery; bass",True,"medium",
  "Lower Mississippi River Conservation Committee angler guide (lmrcc.org) + absence from "+TWRA_ST)
r("obion-river","warmwater","flathead/channel catfish, white bass",True,"medium",
  "TWRA reg-exceptions list membership + absence from "+TWRA_ST)
r("paris-city-park-lake","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Henry/Paris City Park, stocked 1/14/2026)")
r("pickwick-lake","warmwater","trophy smallmouth ('rivals Dale Hollow'), LMB/spotted, blue-cat-led catfishery",True,"high",
  "TWRA Pickwick Reservoir where-to-fish (fetched) + absence from trout programs")
r("reelfoot-lake","warmwater","bluegill + white crappie ('best in state'); catfish dense",True,"high",
  "TWRA Reelfoot Lake where-to-fish (fetched) + absence from "+TWRA_ST)
r("shelby-farms-lake","trout-stocked","rainbow in JONES POND (Dec+Jan); park lakes bass/crappie/bream/catfish",False,"high",
  "shelbyfarmspark.org/fishing 'Trout are stocked in Jones Pond every December and January' (fetched) + "+TWRA_ST,["identity: trout go in Jones Pond only"])
r("tennessee-river","warmwater","main-stem reservoir chain; sauger run below dams Dec-Mar; no trout program",True,"high",
  "TWRA Kentucky Reservoir page + absence from all TWRA trout program lists")
r("union-city-reelfoot-pond","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Obion/Union City Reelfoot Packing Site, stocked 1/14/2026)")
r("valentine-park-pond","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Tipton/Valentine Park; Valentine Regional Park, Munford)",["identity: Munford"])
r("wolf-river-west-tennessee","warmwater","bream/crappie/catfish/largemouth; Lucius Burch SNA bottomlands",True,"medium",
  "Absence from "+TWRA_ST+"; TN SNA page (search-only); upstream-smallmouth claim UNVERIFIED")
r("yale-road-park-lake","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Shelby/Yale Road Park, Bartlett, stocked 1/15/2026)")

# --- MIDDLE / NASHVILLE (tn-middle-nashville, 13) -----------------------------
r("cumberland-river","warmwater","main-stem bass/crappie/stripes; TN trout fishing lives in tributary tailwaters",True,"high",
  "Absence from all TWRA trout program lists; trout rivers named in "+PLAN)
r("east-fork-stones-river","unknown-need-evidence","none documented (catalog 'wild rainbow upper fork' claim NOT corroborated; 1 angler report only)",None,"low",
  "Absence from "+TWRA_ST+" and TWRA wild-trout list; catalog note contradicted this pass",["CONFLICT: catalog wild claim uncorroborated","re-review fishery:wild"])
r("fletchers-fork","trout-stocked","rainbow + brown (Fort Campbell; post permit + TN license + trout stamp)",False,"high",
  f"{TWRA_RG} verbatim 'Fletcher's Fork... stocked with rainbow and brown trout' + {TWRA_ST} Seasonal row")
r("harpeth-river","warmwater","none claimed (VERIFIED winter rainbow program Dec-Mar at Franklin/Eastern Flank + L.L. Burns Park)",False,"high",
  f"{TWRA_ST} (Williamson/Harpeth River at Eastern Flank Battle Park) + Williamson Source/Scene coverage",["owner-ruled warmwater 2026-09-04","tension: real Dec-Mar program verified"])
r("j-percy-priest-lake","warmwater","bass/crappie; the winter trout site is the TW / Stones River tailwater below the dam",True,"high",
  f"{TWRA_ST} row 'J. Percy Priest TW / Stones River' = tailwater reach, not the lake; no lake trout row")
r("lake-barkley","warmwater","crappie/bass/catfish",True,"medium",
  "TWRA Region-1 where-to-fish locations list (fetched) + absence from trout programs")
r("little-west-fork-creek","trout-stocked","rainbow + brown (Fort Campbell; post permit)",False,"high",
  f"{TWRA_RG} verbatim 'Little West Fork... stocked with rainbow and brown trout' + {TWRA_ST}")
r("old-hickory-lake","warmwater","bass/crappie/striped bass",True,"high",
  "Absence from all TWRA trout program lists")
r("red-river-clarksville","trout-stocked","rainbow (winter; Billy Dunlop Park)",False,"high",
  f"{TWRA_ST} (Montgomery/Billy Dunlop Park) + Clarksville Now stocking coverage")
r("sinking-creek-wilson","trout-stocked","rainbow (winter; Don Fox Park, Lebanon)",False,"high",
  f"{TWRA_ST} (Wilson/Don Fox Park Community Park)")
r("stones-river","trout-stocked","rainbow (winter; J. Percy Priest TW - the original Dec 1999 pilot site)",False,"high",
  f"{TWRA_ST} (Davidson/J. Percy Priest TW, 1/9 + 2/13/2026) + {PLAN} 'began in December 1999 at J. Percy Priest tailwater'")
r("sulfur-fork-creek","trout-stocked","rainbow (winter)",False,"high",
  f"{TWRA_ST} (Robertson/Sulphur Fork Creek, 2/4 + 2/26/2026)")
r("west-fork-stones-river","trout-stocked","rainbow (winter; Manson Pike Trailhead + Nice Mill)",False,"high",
  f"{TWRA_ST} (Rutherford rows)")

# --- MIDDLE / CANEY BASIN (tn-middle-caney-fork, 14) --------------------------
r("barren-fork-river","trout-stocked","rainbow (spring)",False,"high",
  f"{TWRA_ST} (Warren/Barren Fork River, weeks 3/15-5/10/2026)")
r("calfkiller-river","trout-stocked","rainbow (spring; Putnam Co row)",False,"high",
  f"{TWRA_ST} (Putnam/Calfkiller River, 3/22 + 3/29/2026); wild-headwater claims UNVERIFIED",["wild claims low confidence"])
r("cane-creek","trout-stocked","rainbow (spring; Fall Creek Falls SP + lower reaches; one late-Oct fall row)",False,"high",
  f"{TWRA_ST} (Van Buren rows); THREE other stocked Cane Creeks exist (Perry/Hickman/Cane Creek Park lake) - cite county",["disambiguation: county"])
r("caney-fork-river","tailwater-trout","rainbow + brown + brook + cutthroat (stocked Mar-Dec; winter brood browns 16-21 in)",True,"high",
  f"{TWRA_TW} verbatim 'Center Hill Dam, Caney Fork River - Rainbow, Brook, Brown, Cutthroat - March through December' + regs 5/day, 14-20in PLR, brown 24in")
r("caney-fork-upper","unknown-need-evidence","none documented above Center Hill pool",None,"low",
  "No stocking row, no wild-list entry, no where-to-fish trout text found")
r("center-hill-lake","warmwater","bass/walleye reservoir; trout fishery is the Caney Fork tailwater only",True,"high",
  "Absent from TWRA trout-reservoir list ("+PLAN+") and schedule (only the TW row exists)")
r("charles-creek","trout-stocked","rainbow (spring)",False,"high",
  f"{TWRA_ST} (Warren/Charles Creek, 3/15 + 3/22 + 5/10/2026)")
r("collins-river","trout-stocked","rainbow (spring; Grundy Co headwater row)",False,"high",
  f"{TWRA_ST} (Grundy/Collins River) + recent-stocking report 4/2/2026",["stocked reach = Grundy Co headwaters"])
r("great-falls-lake","warmwater","bass/crappie impoundment; the trout water is the Caney Fork below Great Falls Dam",True,"high",
  "TWRA Great Falls Reservoir page (bass/crappie) + absence from "+TWRA_ST)
r("mill-creek-overton","trout-stocked","rainbow (spring; Standing Stone SP)",False,"high",
  f"{TWRA_ST} (Overton/Mill Creek, 3/22 + 4/26/2026); a different Hickman Co Mill Creek also stocked",["disambiguation: Standing Stone SP"])
r("north-prong-barren-fork","trout-stocked","rainbow (spring)",False,"high",
  f"{TWRA_ST} (Warren/N Barren Fork Creek, 3/22 + 4/26/2026)")
r("pine-creek-dekalb","trout-stocked","rainbow (spring)",False,"high",
  f"{TWRA_ST} (DeKalb/Pine Creek, 2/22-3/29/2026)")
r("rocky-river","trout-stocked","rainbow (spring; Van Buren Co)",False,"high",
  f"{TWRA_ST} (Van Buren/Rocky River, 3/8-5/17/2026)",["county: Van Buren, not Cumberland"])
r("upper-hills-creek","trout-stocked","rainbow (spring)",False,"high",
  f"{TWRA_ST} (Warren/Upper Hills Creek, 3/22/2026)")

# --- MIDDLE / DUCK-ELK (tn-middle-duck-elk, 15) -------------------------------
r("big-rock-creek","trout-stocked","rainbow (winter; Big Rock Greenway, Lewisburg)",False,"high",
  f"{TWRA_ST} (Marshall/Big Rock Greenway, 1/15 + 2/27/2026)")
r("boiling-fork-creek","trout-stocked","rainbow (winter via Cowan City Park)",False,"high",
  f"{TWRA_ST} (Franklin/Cowan City Park)",["reach identity: creek runs through Cowan City Park (medium)"])
r("bradley-creek","warmwater","Woods Reservoir upper-reach tributary (Franklin Co); not stocked",True,"high",
  "TWRA Woods Reservoir page ('Bradley Creek in the very upper section of Woods Reservoir') + absence from "+TWRA_ST,["CORRECTION: not a trout water"])
r("buffalo-river","warmwater","smallmouth signature (1-4 lb), rock bass, bream, catfish",True,"high",
  "Absence from "+TWRA_ST+"; State Scenic River smallmouth identity")
r("duck-river-lower","warmwater","smallmouth/spotted/rock bass/catfish; the stocked trout reach ends at Three Forks Bridge",True,"high",
  "TWRA Duck River where-to-fish (fetched): tailwater dam-to-Three-Forks-Bridge is the trout water; below is warmwater")
r("duck-river-tailwater","tailwater-trout","rainbow",False,"high",
  f"TWRA Duck River page verbatim: 'stocked annually with Rainbow Trout from November through June. Water temperatures usually warm above the 70 F mark...' (dam to Three Forks Bridge)",["CONFLICT: owner note says stocked year-round (2026-09-04) - TWRA page says Nov-Jun; re-review recommended"])
r("east-fork-shoal-creek","trout-stocked","rainbow (spring; longest spring window in group)",False,"high",
  f"{TWRA_ST} (Lawrence/East Fork Shoal Creek, 2/15-5/31/2026)")
r("elk-river","tailwater-trout","brook + brown + cutthroat + rainbow (stocked Mar-Dec)",True,"high",
  f"{TWRA_TW} verbatim 'Tims Ford Dam, Elk River - Brook, Brown, Cutthroat, Rainbow - March through December' + brown 20in/1-day reg dam to I-65")
r("elk-river-lower","trout-stocked","rainbow (winter; Stone Bridge Park, Fayetteville) over warmwater base",False,"high",
  f"{TWRA_ST} (Lincoln/Stone Bridge Park, 1/15 + 2/27/2026)")
r("little-buffalo-river","trout-stocked","rainbow (spring; Lawrence Co) over smallmouth water",False,"high",
  f"{TWRA_ST} (Lawrence/Little Buffalo River, 3/8-5/31/2026)",["CORRECTION: not warmwater-only - spring-stocked"])
r("mccutcheon-creek","trout-stocked","rainbow (winter; greenway, Columbia)",False,"high",
  f"{TWRA_ST} (Maury/McCutcheon Creek, 1/23 + 2/20/2026)",["CORRECTION: Columbia/Maury Co, NOT Manchester/Coffee Co"])
r("normandy-lake","warmwater","bass ('renowned for huge but hard-to-fool bass'); trout in tailwater only",True,"high",
  "TWRA Duck River page (fetched) + absence from trout-reservoir list")
r("shoal-creek","unknown-need-evidence","no separate TWRA row - the TWRA water is 'East Fork Shoal Creek' (Lawrence Co)",None,"high",
  "Schedule absence verified; confirm whether this atlas id IS East Fork Shoal Creek or a different reach",["identity check needed"])
r("tims-ford-lake","warmwater","bass fishery; trout fishery is the Elk River tailwater only",True,"high",
  "Absent from TWRA trout-reservoir list + schedule")
r("woods-reservoir","warmwater","largemouth, crappie, white/yellow bass, channel catfish, smallmouth (18-in)",True,"high",
  "TWRA Woods Reservoir where-to-fish (fetched verbatim species list) + absence from trout programs")

# --- UPPER CUMBERLAND (tn-upper-cumberland, 6) --------------------------------
r("dale-hollow-lake","trout-stocked","rainbow (winter reservoir program, 7/day); ONE April brown schedule row = footnote, not a fishery",False,"high",
  f"TWRA Dale Hollow page (fetched): 'Rainbow trout are typically stocked annually... during the wintertime'; reservoir list 'Dale Hollow - Rainbow'",["CORRECTION: 'famous put-grow-take brown fishery' claim REJECTED - fame is world-record smallmouth"])
r("hurricane-creek","trout-stocked","rainbow (seasonal)",False,"medium",
  f"{TWRA_ST} rows are Houston + Humphreys Co (TWRA Region 1, Tennessee River-bend)",["IDENTITY CHECK: atlas places this in upper Cumberland; if a different same-named stream, class = unknown"])
r("obey-river","tailwater-trout","rainbow primary (stocked EVERY month); 2nd species conflicted: brook (TWRA tailwater page+Plan) vs brown (schedule JSON)",True,"high",
  f"{TWRA_TW} verbatim 'Dale Hollow Dam, Obey River - Brook, Rainbow - January through December'",["2nd-species conflict: do not assert brook or brown without resolution"])
r("salt-lick-creek","trout-stocked","rainbow (spring; Macon Co row)",False,"high",
  f"{TWRA_ST} (Macon/Salt Lick Creek, 3/1 + 3/22/2026)")
r("standing-rock-creek","trout-stocked","rainbow (seasonal)",False,"medium",
  f"{TWRA_ST} row is Stewart Co (TWRA Region 1, LBL area)",["IDENTITY CHECK: atlas places this in upper Cumberland"])
r("white-oak-creek","trout-stocked","rainbow (seasonal)",False,"medium",
  f"{TWRA_ST} row is 'Whiteoak Creek', Houston Co (TWRA Region 1, Kentucky Lake embayment)",["IDENTITY CHECK + spelling: 'Whiteoak Creek' Houston Co, not a Plateau stream"])

# --- CUMBERLAND PLATEAU (tn-cumberland-plateau, 10) ---------------------------
r("clear-creek-obed","unknown-need-evidence","none documented (Obed-system reach; TWRA's 'Clear Creek' Nov 1-Mar 31 closure is the ANDERSON Co Clinch tributary, not this one)",None,"low",
  f"{TWRA_RG} verbatim (Anderson Co Clear Creek) + NPS Obed fishing page lists no trout",["reg disambiguation verified"])
r("clear-fork","unknown-need-evidence","probable wild brown (NPS Big South Fork brochure: 'brown trout are limited to tributary streams within the park')",None,"low",
  "npshistory.com BSF game-fish brochure (medium) + no TWRA wild-list entry/stocking row")
r("daddys-creek","unknown-need-evidence","none documented (catalog wild-trout claim NOT corroborated)",None,"low",
  "No stocking row (absence verified), no wild-list entry, no NPS species statement",["CONFLICT: catalog wild claim uncorroborated","re-review fishery:wild"])
r("emory-river","warmwater","smallmouth (signature), muskellunge, longnose gar, catfish, bluegill",True,"high",
  "NPS Obed Wild & Scenic River fishing page (fetched) - target species list has NO trout",["CONFLICT: catalog 'wild trout upper reaches' insufficient - needs TWRA wild-list entry"])
r("new-river","unknown-need-evidence","probable wild brown/rainbow (aggregator + NPS BSF tributary context only)",None,"low",
  "onWater species list (aggregator, low) + NPS BSF brochure (medium) + absence from TWRA programs")
r("obed-river","unknown-need-evidence","none primary-documented (catalog note claims self-sustaining RB/BN/BK - NOT corroborated)",None,"low",
  "NPS Obed fishing page (fetched) lists smallmouth/gar/catfish/muskie, no trout; not on TWRA wild list; no stocking rows",["CONFLICT: catalog wild claim uncorroborated","re-review fishery:wild","TWRA Plan itself conflates Obed/Obey spelling"])
r("piney-river-rhea","trout-stocked","rainbow (spring seasonal)",False,"high",
  f"{TWRA_ST} seasonal weeks 2/22-4/19/2026; DH REMOVED eff 2026-08-01 (TWRA news 12/16/2025 + 2026-27 proclamation)",["REG CHANGE: yearRound true (set via DH gate) now invalid"])
r("sequatchie-river","trout-stocked","rainbow (spring; Cumberland Co headwaters)",False,"high",
  f"{TWRA_ST} (Cumberland/Sequatchie River, 3/22 + 3/29 + 5/17/2026)")
r("south-fork-cumberland","unknown-need-evidence","none documented (catalog fishery:wild uncorroborated)",None,"low",
  "No stocking rows, no wild-list entry, no species source found",["CONFLICT: catalog wild claim uncorroborated","re-review fishery:wild"])
r("wolf-river-fentress","trout-stocked","rainbow (spring; Fentress Co row)",False,"high",
  f"{TWRA_ST} (Fentress/Wolf River, 3/8 + 4/12 + 5/10/2026)",["CORRECTION: schedule-stocked, not wild-only; wild-brook-headwaters unverified","disambiguate from Obey-system Wolf River (Dale Hollow SMB reach)"])

# --- EAST / CLINCH (tn-east-clinch, 13) ---------------------------------------
r("buffalo-creek-grainger","trout-stocked","rainbow (DH Oct 1-Jan 31 mill dam to Buffalo Springs WMA; above mill dam closed all year)",True,"high",
  f"{TWRA_RG} DH entry + reach rules")
r("clinch-river","tailwater-trout","rainbow (80-90% of catch) + brown + brook (stocked Mar-Aug; wild reproduction documented)",True,"high",
  f"{TWRA_TW} 'Norris Dam, Clinch River - Brook, Brown, Rainbow - March through August' + Clinch River TU (crctu.org/fishing.html) + 14-20in PLR")
r("fort-loudoun-lake","warmwater","largemouth/smallmouth, white bass, crappie/bluegill/catfish, sauger run at 'forks of the river'",True,"high",
  "TWRA Fort Loudoun where-to-fish + absence from trout programs")
r("gap-creek-claiborne","trout-stocked","rainbow (spring)",False,"medium",
  "Catalog note authored from TWRA 2026-09-08 stocking snapshot (single source this pass; schedule row not re-verified)",["VERIFY: re-check current schedule row"])
r("indian-creek-claiborne","trout-stocked","rainbow (spring)",False,"medium",
  "Catalog note authored from TWRA 2026-09-08 stocking snapshot (single source this pass)",["VERIFY: re-check current schedule row"])
r("melton-hill-lake","warmwater","largemouth/smallmouth/spotted bass, record-class striped bass, musky (stocked), crappie; cold Norris releases",True,"high",
  "TWRA Melton Hill where-to-fish + NOT on TWRA reservoir trout-stocking list (absence verified)")
r("norris-lake","warmwater","premier smallmouth lake + largemouth/spotted, striped bass, crappie, walleye; no lake trout program",True,"high",
  "TWRA Norris where-to-fish + absence from trout-reservoir list")
r("powell-river","unknown-need-evidence","smallmouth (documented identity; 20-in SMB special reg); catalog wild RB/BN claim NOT corroborated",None,"medium",
  "TWRA special-reg list (Powell R SMB 20-in, Gap Cr confluence to VA line, search-verbatim) + absence of any trout source",["CONFLICT: catalog fishery:wild uncorroborated","re-review recommended"])
r("puncheon-camp-creek","trout-stocked","rainbow (spring)",False,"medium",
  "Catalog note authored from TWRA 2026-09-08 stocking snapshot (single source this pass)",["VERIFY: re-check current schedule row"])
r("richardson-byrd-creek","trout-stocked","rainbow (spring)",False,"medium",
  "Catalog note authored from TWRA 2026-09-08 stocking snapshot (single source this pass)",["VERIFY: re-check current schedule row"])
r("station-creek","trout-stocked","rainbow (spring)",False,"medium",
  "Catalog note authored from TWRA 2026-09-08 stocking snapshot (single source this pass)",["VERIFY: re-check current schedule row"])
r("tellico-lake","trout-stocked","rainbow - upper Little Tennessee arm below Chilhowee Dam ONLY (~4,500 catchable RB/yr); main body warmwater",True,"medium",
  "TWRA reservoir list 'Tellico (Upper) - Rainbow' + Tellico Reservoir where-to-fish verbatim (Chilhowee-release fringe)",["reach-limited: upper arm only"])
r("watts-bar-lake","warmwater","largemouth/smallmouth/crappie + stocked stripers, walleye, FLMB; no trout",True,"high",
  "TWRA Watts Bar where-to-fish + absence from trout-reservoir list")

# --- EAST / HOLSTON (tn-east-holston, 9) --------------------------------------
r("boone-lake","warmwater","largemouth/smallmouth/spotted, striped bass + hybrids, blue catfish; trout regs apply only on cold Watauga arm to Hwy 11E (drift-in fish)",True,"high",
  "TWRA Boone Lake where-to-fish + absence from trout-reservoir list")
r("boone-tailwater","tailwater-trout","brook + brown + cutthroat + rainbow (stocked Mar/Apr/Dec); 16-22in PLR, 1>22; spawning closures Nov 1-Jan 31 x2 reaches",True,"high",
  f"{TWRA_TW} 'Boone Dam, South Fork Holston River - Brook, Brown, Cutthroat, Rainbow - March, April, December' + {TWRA_RG}")
r("cherokee-lake","warmwater","largemouth/smallmouth (18-in SMB reg), Cherokee-bass hybrids, crappie, saugeye/walleye/sauger, paddlefish; no trout",True,"high",
  "TWRA Cherokee Reservoir where-to-fish + absence from trout-reservoir list")
r("fort-patrick-henry-lake","trout-stocked","brown + rainbow (reservoir program) + bass/crappie/sunfish",True,"high",
  f"TWRA reservoir list 'Fort Patrick Henry - Brown and Rainbow' + TWRA FPH where-to-fish",["NEW: catalog species unset - FLIP to trout-stocked"])
r("ft-patrick-henry-tailwater","tailwater-trout","brown + rainbow (stocked Mar-Apr only; STATEWIDE regs)",None,"high",
  f"{TWRA_TW} 'Fort Patrick Henry Dam, South Fork Holston River - Brown, Rainbow - March and April - Statewide Regulations'",["reg nuance: the 16-22in PLR block spans Boone Dam to Louis Milhorn Br (boone-tailwater + FPH pool), NOT this reach"])
r("north-fork-holston-river","warmwater","trophy smallmouth (20-in VA reg upstream); no trout program on TN reach",True,"medium",
  "VA DWR river page (search-only) + absence from TWRA trout programs")
r("reedy-creek","trout-stocked","rainbow (spring)",False,"medium",
  "Catalog note authored from TWRA 2026-09-08 stocking snapshot (single source this pass; snapshot-verification gap flagged)",["VERIFY: re-check current schedule row"])
r("south-holston-lake","trout-stocked","rainbow + LAKE TROUT (deep cold reservoir; summer laker troll fishery) + bass/walleye/crappie",True,"high",
  f"TWRA reservoir list 'South Holston - Lake and Rainbow' + SH where-to-fish 'Smallmouth Bass... trout... are popular game fish'",["FLIP-BACK: contradicts 2026-09-08 warmwater ruling - TWRA stocks the lake itself"])
r("south-holston-river","tailwater-trout","rainbow (stocked Mar-Sep) + wild-reproducing brown (NOT stocked; ~82% of electrofishing) + wild rainbow; 16-22in PLR; Nov 1-Jan 31 spawning closures",True,"high",
  f"{TWRA_TW} 'South Holston Dam, South Fork Holston River - Rainbow - March through September' + {PLAN} 'significant natural brown reproduction... managed as wild brown fisheries'")

# --- EAST / SMOKIES (tn-east-smokies, 10) -------------------------------------
r("calderwood-lake","trout-stocked","brook + brown + rainbow (stocked annually; cold Fontana-fed chain)",True,"high",
  f"TWRA reservoir list 'Calderwood - Brook, Brown and Rainbow' + Calderwood where-to-fish; 7,015 TN + 7,000 NC rainbow (lrctu.org)")
r("chilhowee-lake","trout-stocked","rainbow (annual; 'trout are stocked on an annual basis and thrive in the cool clear water')",True,"high",
  "TWRA reservoir list 'Chilhowee - Rainbow' + Chilhowee where-to-fish (lake trout stocked in past, not recently)")
r("cosby-creek","trout-wild","rainbow lower + NATIVE brook trout upper reaches (GSMNP; only native trout)",True,"medium",
  "NPS GSMNP fishing page (fetched): park-wide year-round, 5/day, 7-in min, single-hook artificials + brook-restoration docs",["GSMNP regs (no TWRA stocking since 1975)"])
r("leconte-creek","trout-wild","rainbow + native brook trout upper reaches; Gatlinburg city-permit reach (C&R Dec 1-Mar 31, city program)",True,"high",
  "NPS GSMNP fishing page (fetched) + Gatlinburg city waters block in "+TWRA_RG)
r("little-pigeon-river","trout-stocked","rainbow (Sevierville/Pigeon Forge reaches; TWRA resumed 2023 after ~2 decades; Gatlinburg city reach stocked biweekly)",False,"medium",
  f"TWRA recent-stocking report 'West Prong Little Pigeon River (Gatlinburg)' 7/16 + 7/23/2026 (verbatim) + WBIR resumption coverage",["owner-confirmed 2026-09-04","'750/2wks' figure unverified"])
r("little-river","trout-wild","rainbow dominant + brown lower pools + native brook headwater forks; smallmouth below park",True,"high",
  "NPS GSMNP fishing page (fetched): year-round park regs; species split medium")
r("little-tennessee-river","warmwater","smallmouth-led warmwater in TN reach; stocked cold fringe ONLY below Chilhowee Dam (see tellico-lake)",True,"medium",
  "TWRA Tellico Reservoir page (Chilhowee-release fringe verbatim) + 'warm river, trout are limited' (Hookers Fly Shop)")
r("middle-prong-little-pigeon","trout-wild","rainbow + brown lower; NATIVE BROOK RESTORED in Lynn Camp Prong (8+ mi; largest restoration in SE US)",True,"high",
  "NPS Lynn Camp Prong page (fetched): 11 populations restored park-wide, 27.6 mi + NPS GSMNP fishing page")
r("roaring-fork","trout-wild","rainbow + native brook upper reach; Gatlinburg city-permit reach (C&R Dec 1-Mar 31)",True,"high",
  "NPS GSMNP fishing page (fetched) + Gatlinburg city waters block in "+TWRA_RG)
r("west-prong-little-pigeon","trout-wild","rainbow + native brook headwaters; brown toward park boundary; Gatlinburg city-permit reach stocked biweekly (C&R Dec 1-Mar 31)",True,"high",
  "NPS GSMNP fishing page (fetched) + TWRA recent-stocking report 7/16 + 7/23/2026 (verbatim) + Gatlinburg regs")

# --- EAST / PIGEON-FRENCH BROAD (tn-east-pigeon-frenchbroad, 9) ---------------
r("brush-creek-cocke","trout-stocked","rainbow (spring; Big Creek corridor)",False,"medium",
  "Catalog note (TWRA spring program) + 2026-09-08 snapshot; current schedule row not re-verified",["VERIFY: re-check current schedule row"])
r("douglas-lake","warmwater","crappie ('best in East TN'), largemouth, bluegill, catfish; sauger/walleye runs up tributaries; NO trout",True,"high",
  "TWRA Douglas Reservoir where-to-fish (zero trout content) + absence from trout-reservoir list")
r("french-broad-river","warmwater","white bass/sauger/walleye spawn runs + bass/catfish; NO TWRA trout program (fringe-trout claim DOWNGRADED)",True,"high",
  "TWRA Douglas page (no trout text) + eregulations TN (no FB trout reg) - the Oct-Feb C&R line belongs to tributary Paint Creek",["CORRECTION: Session-1 fringe-trout ruling downgraded"])
r("gulf-fork-big-creek","trout-wild","NATIVE brook trout (unique French Broad watershed strain)",True,"high",
  "EBTJV project page (fetched) + TU Trail Fork coverage",["COUNTY FLAG: EBTJV places Big Creek tribs in Cocke Co, atlas metadata says Greene - geometry/label check (not this lane)"])
r("holston-river","warmwater","sauger/saugeye/walleye winter run at 'forks of the river'; main stem below the forks; no trout program",True,"high",
  "TWRA Fort Loudoun + Cherokee pages + absence from trout programs",["reach note: below Cherokee Dam = cherokee-tailwater (trout Nov-Apr)"])
r("mossy-creek-jefferson","trout-stocked","rainbow (winter program; NEW site 2025-26)",False,"high",
  "TWRA news 11/26/2025 'New locations this year include... Mossy Creek in Jefferson County' (fetched) + "+TWRA_ST)
r("nolichucky-river","trout-stocked","rainbow + brook (EPISODIC Erwin NFH retired-brood fish, 2.5-3.5 lb) over warmwater smallmouth mainstem",False,"medium",
  "USFWS (fws.gov/story/2025-12/catching-big-one, fetched): Erwin NFH stocks 'Watauga and Nolichucky river systems'; no TWRA schedule row",["episodic: no put-and-take schedule"])
r("pigeon-river","unknown-need-evidence","opportunistic trout (cool months, below Waterville Dam) + smallmouth; NO TN stocking row; NC Hatchery-Supported stocking ends at Canton (~15-20 river mi upstream)",None,"medium",
  "NC regs via eregulations (HS section Stamey Cove Br to US 19-23 bridge, Canton) + absence from "+TWRA_ST,["re-review of 2026-09-04 seasonal-trout ruling"])
r("trail-fork-big-creek","trout-wild","NATIVE brook trout REINTRODUCED 2021 (translocation above natural falls; culvert-to-bridge project)",True,"high",
  "TU Magazine conservation story (fetched) + EBTJV 2021 project page",["COUNTY FLAG: Cocke Co per EBTJV, atlas metadata says Greene"])

# --- NORTHEAST / WATAUGA (tn-northeast-watauga, 13) ---------------------------
r("beaverdam-creek","trout-wild","wild rainbow + wild brown AND TWRA-stocked rainbow (seasonal); NO brook evidence",True,"high",
  f"{TWRA_RG} designated wild reach (Birch Branch confluence to Tank Hollow Rd) + USFS stocked-streams list + schedule row 3/22/2026")
r("doe-creek-johnson","trout-stocked","rainbow (seasonal; Johnson Co)",False,"medium",
  f"{TWRA_ST} (schedule row; species field scrambled this pass - rainbow presumed)",["disambiguate from Doe River (Carter Co DH)"])
r("doe-river","trout-stocked","rainbow (DH Oct 1-Feb 28 within Roan Mountain SP; artificials-only C&R)",True,"high",
  f"{TWRA_RG} DH entry (Doe River, Carter Co, Roan Mountain SP boundaries)")
r("forge-creek-johnson","trout-stocked","rainbow (seasonal)",False,"medium",
  f"{TWRA_ST} (schedule row; species presumed rainbow)")
r("horse-creek-greene","trout-stocked","stocked rainbow + wild fish from Cherokee NF headwaters; special reg 7/day, reduced to 2/day May 1-Sep 30",False,"high",
  f"{TWRA_RG} Horse Creek entry + {TWRA_ST}")
r("laurel-creek-johnson","trout-stocked","rainbow (seasonal; Mountain City area)",False,"medium",
  f"{TWRA_ST} (schedule row; species presumed rainbow)")
r("laurel-fork-carter","trout-wild","native brook trout headwaters + wild brown + wild rainbow gorge; designated wild reach (cable crossing above Dennis Cove to USFS boundary)",True,"high",
  f"{TWRA_RG} wild-trout list + USFS/TU brook restoration context")
r("stoney-creek-carter","trout-stocked","rainbow (seasonal; Elizabethton community fishery)",False,"medium",
  f"{TWRA_ST} ('Stony Creek' row; species presumed rainbow)")
r("upper-roan-creek","trout-stocked","rainbow (seasonal; 'Roan Creek (Upper)' row)",False,"medium",
  f"{TWRA_ST} (schedule row; species presumed rainbow)")
r("watauga-lake","trout-stocked","rainbow + LAKE TROUT (+ brown per TWRA page text) in the reservoir; smallmouth/walleye/crappie too",True,"high",
  f"TWRA reservoir list 'Watauga - Lake and Rainbow' + Watauga where-to-fish 'TWRA has stocked rainbow, brown, and lake trout'",["FLIP: catalog species unset - deep cold reservoir with real trout fishery"])
r("watauga-river","tailwater-trout","rainbow (stocked Mar-Dec, Wilbur Dam row) + wild-reproducing brown (NOT stocked); QTA 14-in/2-day/no-bait below Wilbur",True,"high",
  f"{TWRA_TW} 'Wilbur Dam, Watauga River - Rainbow - March through December' + {PLAN} wild-brown management + {TWRA_RG} QTA")
r("watauga-river-wilbur-reach","tailwater-trout","rainbow (stocked Mar-Jul; Watauga Dam row); statewide regs, no special reg",True,"high",
  f"{TWRA_TW} 'Watauga Dam, Wilbur Reservoir - Rainbow - March through July - Statewide Regulations'")
r("wilbur-lake","trout-stocked","rainbow (put-grow-take, stocked Mar-Jul; small TVA/TWRA impoundment between Watauga dams)",True,"high",
  f"{TWRA_TW} 'Watauga Dam, Wilbur Reservoir' row + USFWS image caption (fetched): 'Trout are stocked in Wilbur Lake'")

# --- SOUTHEAST / HIWASSEE (tn-se-hiwassee, 15) --------------------------------
r("chickamauga-lake","warmwater","elite largemouth (FLMB program), smallmouth/spotted, nationally ranked crappie, stripers, walleye, blue catfish",True,"high",
  "TWRA Chickamauga where-to-fish + absence from trout-reservoir list")
r("citico-creek","trout-stocked","rainbow (stocked Mar 15-Sep 15 above Little Citico) + wild rainbow/brown + scarce native brook in North Fork headwaters; Tellico-Citico permit Mar 1-Aug 15, closed Thu/Fri",False,"high",
  f"USFS Citico page + {TWRA_RG} Tellico-Citico permit + appalachiantu.org N Fork notes",["yearRound false per Session-1 seasonal-circuit rule; wild N Fork component noted"])
r("goforth-creek","trout-stocked","rainbow + brown + brook (local guide; Ocoee gorge, FS Rd 45); NOT on current DH list",False,"medium",
  "Local guide sources (search-only) + DH-list absence verified in "+TWRA_RG,["species mix medium; former DH status unverified"])
r("greasy-creek-polk","trout-stocked","rainbow (fall + seasonal)",False,"medium",
  "TWRA fall stocking program (search-only) + absence from DH/wild lists")
r("hiwassee-river","tailwater-trout","brook + brown + cutthroat + rainbow (stocked Oct-Jul) + C&R DH Oct 1-Feb 28 (Appalachia powerhouse to L&N bridge); 7/day max 2 browns Mar 1-Sep 30",True,"high",
  f"{TWRA_TW} 'Appalachia Dam, Hiwassee River - Brook, Brown, Cutthroat, Rainbow - October through July' + {TWRA_RG} DH/creel")
r("little-sequatchie-river","trout-stocked","rainbow (spring; Marion Co)",False,"high",
  f"{TWRA_ST} (Little Sequatchie rows 3/15 + 3/22 + 5/10/2026)")
r("nickajack-lake","warmwater","largemouth (FLMB since 2015; state-record LMB Feb 2026), trophy smallmouth below Chickamauga Dam, catfish, crappie; no trout",True,"high",
  "TWRA Nickajack where-to-fish + absence from trout-reservoir list")
r("north-chickamauga-creek","trout-stocked","rainbow (seasonal: winter-program + Region-3 fall stockings with Conservancy/state park partners); NO special trout regulation",False,"high",
  "northchick.org trout-stocking project + winter-stocking news + '+ TWRA video' ; no special reg confirmed 2026-09-08",["CORRECTION: no special reg does NOT mean unstocked - it IS stocked seasonally"])
r("ocoee-number-three-lake","unknown-need-evidence","none documented (small Ocoee No. 3 impoundment; not on any TWRA trout list; warmwater-leaning)",None,"low",
  "Absence from "+TWRA_ST+" and trout-reservoir list; catalog note: TWRA historical label 'Hiwasee Lake (443 ac)'",["historical-name confusion risk"])
r("ocoee-river","trout-stocked","rainbow + brown (outfitter + city claims; GA Toccoa stockings drift in) - NO TWRA line-item captured",False,"medium",
  "questexpeditions.com + copperhill.gov (search-only, 2 independent non-official sources)",["VERIFY: TWRA stocking line-item missing"])
r("parksville-lake","trout-stocked","rainbow (TWRA reservoir program; 'Parksville - Rainbow')",True,"high",
  f"TWRA reservoir list 'Parksville - Rainbow' + {PLAN} nine-trout-reservoir list")
r("parksville-tailwater","tailwater-trout","rainbow (Mar-May only)",False,"high",
  f"{TWRA_TW} 'Ocoee Dam #1 - Parksville, Ocoee River - Rainbow - March through May - Statewide Regulations'")
r("spring-creek-polk","trout-stocked","rainbow (fall + seasonal)",False,"medium",
  "TWRA fall stocking program (search-only) + absence from DH/wild lists")
r("tellico-river","trout-stocked","rainbow + brown dominate stocked reach (12+ mi) + wild brook far upstream; DH Oct 1-Feb 28 (N River mouth to state line); Tellico-Citico permit Mar 1-Aug 15 (Turkey Cr confluence up), closed Thu/Fri",True,"high",
  f"{TWRA_RG} (DH + permit) + USFS Tellico page (fetched)")
r("tumbling-creek","trout-stocked","rainbow (fall listing)",False,"low",
  "Aggregator fall-stocking mention only",["name-confusion risk: tiny stream, verify identity"])

# --- PENDING-ADD (17; not yet on origin/main) ---------------------------------
r("forked-deer-river","warmwater","lowland catfish/bass/panfish river; NO trout evidence (absent from 2026 schedule)",True,"high",
  "Absence from fetched 2026 "+TWRA_ST,["PENDING-ADD"])
r("big-sandy-river","warmwater","Kentucky Lake tributary; warmwater; NO trout evidence; Big Sandy Unit TN NWR adjacent",True,"high",
  "Absence from fetched 2026 "+TWRA_ST+"; USFWS TN NWR fishing page (fetched)",["PENDING-ADD"])
r("loosahatchie-river","warmwater","channel catfish/largemouth; NO trout evidence (absent from 2026 schedule)",True,"high",
  "Absence from fetched 2026 "+TWRA_ST+"; TWRA reg-exceptions list membership",["PENDING-ADD"])
r("beech-river","warmwater","warmwater stream; 7 watershed flood-control lakes (bass/bream); NO trout evidence",True,"high",
  "Absence from fetched 2026 "+TWRA_ST+"; watershed-lake coverage (search-only)",["PENDING-ADD","distinct from beech-lake (Henderson Co)"])
r("south-chickamauga-creek","warmwater","bass-led warmwater in TN reach; winter trout only at adjacent Camp Jordan pond; GA reach is GADNR trout water",True,"medium",
  "Winter-stocking news (Camp Jordan + Lake Junior) + absence of a creek line-item",["PENDING-ADD","VERIFY: creek vs Camp Jordan pond"])
r("conasauga-river","warmwater","TN reach = biodiversity hotspot (60+ species); trout-wild ONLY in GA Cohutta headwaters",True,"medium",
  "USFS Conasauga Blue Hole page + GA wild-trout program context",["PENDING-ADD","no TN trout claim"])
r("cherokee-tailwater","tailwater-trout","brown + rainbow (stocked Nov-Apr, continuous window; summer thermal bottleneck)",False,"high",
  f"{TWRA_TW} verbatim 'Cherokee Dam, Holston River - Brown, Rainbow - November through April - Statewide Regulations'",["PENDING-ADD","earlier Jan-Apr+Nov-Dec framing understated - it is continuous Nov-Apr"])
r("paint-creek","trout-stocked","rainbow (DH Oct 1-Feb 28 campground to French Broad mouth; artificials-only) + wild rainbow/brown + designated wild reach above campground + USFS summer stocking",True,"high",
  f"{TWRA_RG} DH + wild-list entries + USFS Cherokee fishing page",["PENDING-ADD"])
r("bald-river","trout-wild","wild rainbow + brown + native brook (designated wild trout stream, Monroe Co; Bald River Falls corridor)",True,"high",
  f"{TWRA_RG} wild list + USFS 'Bald River, North River... wild trout streams holding brown, rainbow, and brook trout'",["PENDING-ADD"])
r("north-river","trout-wild","wild rainbow + brown + native brook (designated wild trout stream, Monroe Co)",True,"high",
  f"{TWRA_RG} wild list + USFS Tellico page",["PENDING-ADD"])
r("rocky-fork","trout-wild","native brook headwaters + wild rainbow + stocked rainbow below park gate; designated wild above Rocky Fork Rd/State Park Entrance Rd junction",True,"high",
  f"{TWRA_RG} wild list + tnstateparks Rocky Fork ('native brook and wild rainbow trout', search-only)",["PENDING-ADD"])
r("big-soddy-creek","trout-stocked","rainbow (DH C&R Nov 1-Feb 28 upstream of Back Valley Rd; artificials-only; harvest opens Mar 1)",True,"high",
  f"{TWRA_RG} DH entry (2026-27 start moved to Nov 1)",["PENDING-ADD"])
r("cordell-hull-lake","warmwater","bass/crappie/catfish + stocked striped bass; NO trout program",True,"high",
  "Absence from trout programs + TWRA warmwater-stocking listings",["PENDING-ADD"])
r("cheatham-lake","warmwater","Cumberland main-stem run-of-river bass/catfish/sauger; NO trout program",True,"high",
  "Absence from fetched 2026 schedule + trout-reservoir list + tailwater table",["PENDING-ADD","note: Cheatham Co winter site L.L. Burns Park is on the HARPETH, not the lake"])
r("green-cove-pond","trout-stocked","rainbow (TWRA pond, Cherokee NF; 7/day, one rod, no Tellico-Citico permit; reopened Mar 1 2026 after renovation)",True,"medium",
  f"{TWRA_ST} (Green Cove Pond rows e.g. week of 7/22/2026) + USFS Green Cove Pond rules page (fetched)",["PENDING-ADD"])
r("herb-parsons-lake","warmwater","TWRA Family Fishing Lake / Bill Dance lake, 177 ac, Fayette Co: bass/bluegill/crappie/redear/catfish/yellow bass; NO winter trout, none ever per schedule absence",True,"high",
  "TWRA family-fishing page (fetched) + absence from fetched 2026 "+TWRA_ST,["PENDING-ADD","do NOT class as trout-stocked"])
r("garrett-lake","warmwater","TWRA Family Fishing Lake, 183 ac, Weakley Co: bass/crappie/bluegill/cats/redear; NO winter trout",True,"high",
  "TWRA family-fishing page + Region-1 where-to-fish (both fetched) + absence from "+TWRA_ST,["PENDING-ADD","one of 2 TWRA lakes with no lake permit"])

# ------------------------------------------------------------------ render --
CLS_DOC = {
 "trout-wild": "self-sustaining (wild) trout population is the water's identity",
 "trout-stocked": "TWRA/partner stocking program is the trout fishery's basis",
 "tailwater-trout": "cold-release tailwater below a dam with a managed trout fishery",
 "warmwater": "no trout fishery documented; warmwater/coolwater identity",
 "unknown-need-evidence": "evidence insufficient - trout status must not be guessed",
}
YR_DOC = {True: "true - fishery/open-water supported year-round by program evidence",
          False: "false - seasonal; named window in notes",
          None: "ABSENT - evidence does not reach; never guessed"}

def yr(v): return {True:"true",False:"false",None:"—"}[v]

SECTIONS = [
 ("West Tennessee (atlas region tn-west — 21 waters)", [
   "beech-lake","cameron-brown-lake","covington-fbc-pond","edmund-orgill-lake","hatchie-river",
   "johnson-park-lake","kentucky-lake","lake-graham","martin-city-pond","milan-city-pond",
   "mississippi-river","obion-river","paris-city-park-lake","pickwick-lake","reelfoot-lake",
   "shelby-farms-lake","tennessee-river","union-city-reelfoot-pond","valentine-park-pond",
   "wolf-river-west-tennessee","yale-road-park-lake"]),
 ("Middle Tennessee — Nashville (tn-middle-nashville — 13)", [
   "cumberland-river","east-fork-stones-river","fletchers-fork","harpeth-river","j-percy-priest-lake",
   "lake-barkley","little-west-fork-creek","old-hickory-lake","red-river-clarksville",
   "sinking-creek-wilson","stones-river","sulfur-fork-creek","west-fork-stones-river"]),
 ("Middle Tennessee — Caney Fork basin (tn-middle-caney-fork — 14)", [
   "barren-fork-river","calfkiller-river","cane-creek","caney-fork-river","caney-fork-upper",
   "center-hill-lake","charles-creek","collins-river","great-falls-lake","mill-creek-overton",
   "north-prong-barren-fork","pine-creek-dekalb","rocky-river","upper-hills-creek"]),
 ("Middle Tennessee — Duck & Elk (tn-middle-duck-elk — 15)", [
   "big-rock-creek","boiling-fork-creek","bradley-creek","buffalo-river","duck-river-lower",
   "duck-river-tailwater","east-fork-shoal-creek","elk-river","elk-river-lower","little-buffalo-river",
   "mccutcheon-creek","normandy-lake","shoal-creek","tims-ford-lake","woods-reservoir"]),
 ("Upper Cumberland (tn-upper-cumberland — 6)", [
   "dale-hollow-lake","hurricane-creek","obey-river","salt-lick-creek","standing-rock-creek","white-oak-creek"]),
 ("Cumberland Plateau (tn-cumberland-plateau — 10)", [
   "clear-creek-obed","clear-fork","daddys-creek","emory-river","new-river","obed-river",
   "piney-river-rhea","sequatchie-river","south-fork-cumberland","wolf-river-fentress"]),
 ("East Tennessee — Clinch & Norris (tn-east-clinch — 13)", [
   "buffalo-creek-grainger","clinch-river","fort-loudoun-lake","gap-creek-claiborne",
   "indian-creek-claiborne","melton-hill-lake","norris-lake","powell-river","puncheon-camp-creek",
   "richardson-byrd-creek","station-creek","tellico-lake","watts-bar-lake"]),
 ("East Tennessee — Holston (tn-east-holston — 9)", [
   "boone-lake","boone-tailwater","cherokee-lake","fort-patrick-henry-lake","ft-patrick-henry-tailwater",
   "north-fork-holston-river","reedy-creek","south-holston-lake","south-holston-river"]),
 ("East Tennessee — Smokies (tn-east-smokies — 10)", [
   "calderwood-lake","chilhowee-lake","cosby-creek","leconte-creek","little-pigeon-river",
   "little-river","little-tennessee-river","middle-prong-little-pigeon","roaring-fork",
   "west-prong-little-pigeon"]),
 ("East Tennessee — Pigeon & French Broad (tn-east-pigeon-frenchbroad — 9)", [
   "brush-creek-cocke","douglas-lake","french-broad-river","gulf-fork-big-creek","holston-river",
   "mossy-creek-jefferson","nolichucky-river","pigeon-river","trail-fork-big-creek"]),
 ("Northeast Tennessee — Watauga (tn-northeast-watauga — 13)", [
   "beaverdam-creek","doe-creek-johnson","doe-river","forge-creek-johnson","horse-creek-greene",
   "laurel-creek-johnson","laurel-fork-carter","stoney-creek-carter","upper-roan-creek",
   "watauga-lake","watauga-river","watauga-river-wilbur-reach","wilbur-lake"]),
 ("Southeast Tennessee — Hiwassee & Ocoee (tn-se-hiwassee — 15)", [
   "chickamauga-lake","citico-creek","goforth-creek","greasy-creek-polk","hiwassee-river",
   "little-sequatchie-river","nickajack-lake","north-chickamauga-creek","ocoee-number-three-lake",
   "ocoee-river","parksville-lake","parksville-tailwater","spring-creek-polk","tellico-river",
   "tumbling-creek"]),
]

PENDING = [x["id"] for x in R if "PENDING-ADD" in x["flags"]]

def get(id): return next(x for x in R if x["id"] == id)

def md_table(ids):
    out = ["| id | classification | species | yearRound | conf | evidence (1-line, access %s) |" % ACCESS,
           "|---|---|---|---|---|---|"]
    for i in ids:
        x = get(i)
        fl = (" <br>**FLAGS:** " + "; ".join(x["flags"])) if x["flags"] else ""
        out.append("| `%s` | %s | %s | %s | %s | %s%s |" % (x["id"], x["cls"], x["sp"], yr(x["yr"]), x["conf"], x["cite"], fl))
    return "\n".join(out)

def counts():
    from collections import Counter
    c = Counter(x["cls"] for x in R)
    y = Counter(str(x["yr"]) for x in R)
    k = Counter(x["conf"] for x in R)
    return c, y, k, len(R)

def write_md(path):
    c, y, k, n = counts()
    L = []
    A = L.append
    A("# SPECIES-CLASSIFICATION.md — every atlas water, classified")
    A("")
    A("Lane: trout-research · Date: %s · Branch: `research/trout-waterways`" % ACCESS)
    A("")
    A("**Scope: all 148 atlas waters** (`apps/web/public/atlas/rivers.geojson` @ `9ae3caa`) "
      "**+ 17 pending-add waters** announced by the waters-add session (not yet on `origin/main` "
      "at classification time; re-verify ids when they land). **165 rows, no gaps.**")
    A("")
    A("This file is the human-readable twin of `docs/research/proposed-waters-2026-09.yaml` "
      "(machine-readable, generated by `docs/research/build-classification.py` from the same rows). "
      "Nothing here edits catalog YAMLs — every row is a PROPOSAL for owner approval.")
    A("")
    A("## Rules applied")
    A("")
    A("- Classification enum: " + " | ".join("`%s`" % k2 for k2 in CLS_DOC) + ".")
    for k2, v in CLS_DOC.items(): A("  - `%s` — %s." % (k2, v))
    A("- `yearRound`: true = program evidence supports a 12-month fishery; false = seasonal "
      "(window named in the row); **— = ABSENT** (%s)." % YR_DOC[None])
    A("- Evidence rules per `docs/SPECIES-REVIEW.md`: species absent = unknown = never guessed; "
      "an affirmative citation is required for any trout claim; **high** = 2+ independent sources "
      "or one explicit official statement (fetched); **medium** = single source; **low** = inference.")
    A("- Source priority: tn.gov/twra (regs, stockings JSON, tailwater/reservoir tables, Trout Mgmt "
      "Plan 2017-2027, news) > NPS / USFS / TVA / USFWS / TWRA where-to-fish > TU chapters / city "
      "pages. Aggregators (norrik, onWater, Fishbrain) = corroboration only. Full per-claim citations "
      "live in `docs/research/_notes/*.md` (6 research scopes).")
    A("")
    A("## Outcome")
    A("")
    A("| classification | count |")
    A("|---|---|")
    for k2 in ["trout-wild","trout-stocked","tailwater-trout","warmwater","unknown-need-evidence"]:
        A("| `%s` | %d |" % (k2, c.get(k2, 0)))
    A("| **total** | **%d** |" % n)
    A("")
    A("yearRound: true %d · false %d · ABSENT %d · confidence: high %d / medium %d / low %d."
      % (y.get("True",0), y.get("False",0), y.get("None",0), k.get("high",0), k.get("medium",0), k.get("low",0)))
    A("")
    A("## Corrections & conflicts with current catalog data (owner decisions needed)")
    A("")
    CORR = [
      "**dale-hollow-lake** — the 2026-09-08 'famous put-grow-take brown fishery' reading is REJECTED: TWRA's reservoir page + reservoir stocking list = rainbow-only winter program; the single April brown schedule row is real but a footnote. (Species `trout`/stocked stands.)",
      "**south-holston-lake** — FLIP-BACK: ruled `warmwater` on 2026-09-08 ('lake absent from schedule') but TWRA's reservoir stocking list reads 'Region IV, South Holston — Lake and Rainbow' and the where-to-fish page lists trout among popular game fish. Recommend `trout-stocked` (rainbow + lake trout).",
      "**watauga-lake** — same evidence ('Watauga — Lake and Rainbow'; page: 'stocked rainbow, brown, and lake trout') → recommend `trout-stocked`.",
      "**fort-patrick-henry-lake** — on the reservoir stocking list ('Brown and Rainbow') → recommend `trout-stocked`.",
      "**wilbur-lake** — stocked put-grow-take rainbow (TWRA row + USFWS caption) → recommend `trout-stocked`.",
      "**tellico-lake** — 'Tellico (Upper) — Rainbow': ~4,500 rainbows/yr in the upper Little Tennessee arm below Chilhowee Dam only; main body warmwater → propose `trout-stocked` (reach-limited, medium).",
      "**duck-river-tailwater** — owner note (2026-09-04) says 'stocked year-round'; TWRA's fetched page says November–June with >70°F summer mortality → recommend `yearRound: false` (re-review of owner ruling).",
      "**piney-river-rhea** — DH removed effective 2026-08-01 (TWRA news 2025-12-16 + 2026-27 proclamation); the `yearRound: true` call that rode the DH C&R gate is now invalid → recommend `false` (spring stocking continues).",
      "**powell-river** — catalog `fishery: wild` ('naturally reproducing rainbow and brown') found NO corroboration in any TWRA source; documented identity is smallmouth (20-in special reg). Recommend `unknown-need-evidence` + re-review.",
      "**obed-river / daddys-creek / clear-creek-obed / new-river / clear-fork / south-fork-cumberland / east-fork-stones-river** — catalog wild-trout notes could not be corroborated from primary sources (NPS Obed fishing page lists no trout; none are on TWRA's 10-stream wild list; none are stocked). All → `unknown-need-evidence` with re-review flags. NOTE: TWRA's own Trout Plan conflates 'Obed'/'Obey' — check that the catalog notes never sourced the Obey line.",
      "**french-broad-river** — Session-1 'fringe trout fishery' NOT corroborated: Douglas tailwater is absent from TWRA's tailwater table and has no trout regulation → `warmwater`.",
      "**emory-river** — NPS species list has no trout → `warmwater` (catalog wild-upper claim insufficient).",
      "**little-buffalo-river** — NOT warmwater-only: on the schedule (Lawrence Co spring rainbows) → `trout-stocked` over smallmouth water.",
      "**mccutcheon-creek** — stocked reach is Columbia/Maury Co (not Manchester/Coffee Co as catalog geography implied) — note correction.",
      "**bradley-creek** — resolves to the Woods Reservoir tributary (Franklin Co), not stocked → `warmwater`.",
      "**white-oak-creek / hurricane-creek / standing-rock-creek** — the stocked schedule rows are Houston/Humphreys/Stewart Co (TWRA Region 1, Tennessee River-bend), NOT upper-Cumberland streams. If the atlas geometry is the same-named Plateau waters, class flips to `unknown-need-evidence`. IDENTITY CHECK + geometry review (not this lane).",
      "**wolf-river-fentress** — on the spring stocking schedule (rainbow) → `trout-stocked`, not wild-only; disambiguate from the Obey-system Wolf River (Dale Hollow smallmouth reach).",
      "**beaverdam-creek** — NO brook-trout evidence; species = rainbow + brown (wild) + stocked rainbow.",
      "**gulf-fork-big-creek / trail-fork-big-creek** — EBTJV/TU place the Big Creek brook projects in COCKE Co (atlas metadata says Greene) — geometry/label flag only (not this lane).",
      "**north-chickamauga-creek** — 'no special regulation' (2026-09-08 check) does NOT mean unstocked: TWRA + Conservancy run winter + fall rainbow stockings → `trout-stocked` (seasonal).",
      "**obey-river** — secondary species genuinely conflicted (brook per TWRA tailwater page + Plan; brown per schedule JSON + eRegulations): assert rainbow only, flag for resolution.",
      "**boone-tailwater** — receives brook + cutthroat too (state cutthroat record 6-9, 2024, from this water/FPH pool); the 16–22-in PLR block spans Boone Dam→Louis Milhorn Br (covers boone-tailwater + FPH pool; FPH *dam* tailwater is statewide regs).",
      "**cherokee-tailwater** (pending-add) — stocking window is continuous Nov 1–Apr 30 (not Jan–Apr + Nov–Dec); summer thermal bottleneck per Plan → `yearRound: false`.",
      "**caney-fork-river / elk-river** — 4 stocked species each (schedule JSON species field lists only RB+BN; the tailwater page is authoritative): cutthroat confirmed on both (introduced 2021).",
      "**shoal-creek** — no separate TWRA row (the scheduled water is 'East Fork Shoal Creek', Lawrence Co) → identity check.",
      "**ocoee-river** (upper) — stocked per two independent non-official sources but NO TWRA line-item → medium; keep the Parksville/Ocoee-No.1 tailwater separation.",
      "**Atlas gap** — McKenzie City Park (Carroll Co) is the only Region-1 winter water not in the atlas; candidate add.",
      "**Winter program facts** — all 13 West TN ponds are on the 2026 Region-1 list (14 waters); window Dec–Feb (announced late Nov; spring starts Mar 1); rainbow only (~10 in); 7/day (5/day Community Lakes); trout license required.",
    ]
    for i, t in enumerate(CORR, 1): A("%d. %s" % (i, t))
    A("")
    for title, ids in SECTIONS:
        A("## " + title)
        A("")
        A(md_table(ids))
        A("")
    A("## Pending-add waters (17) — announced by waters-add, not yet on `origin/main`")
    A("")
    A(md_table(PENDING))
    A("")
    A("## Covering the 'unknown-need-evidence' rows — exactly what is missing")
    A("")
    for x in R:
        if x["cls"] == "unknown-need-evidence":
            A("- **%s**: %s" % (x["id"], x["cite"] + ("; flags: " + "; ".join(x["flags"]) if x["flags"] else "")))
    A("")
    A("## Machine-readable proposal")
    A("")
    A("`docs/research/proposed-waters-2026-09.yaml` mirrors every row above "
      "(classification / species / yearRound / confidence / citation / flags) plus "
      "proposed `fishery` and `stockingProgram` mappings. Owner approval flow: approve rows → "
      "apply in `packages/content/streams/tn/*.yaml` in a dedicated catalog lane (NOT this lane).")
    open(path, "w", encoding="utf-8").write("\n".join(L) + "\n")

def yr_yaml(v): return {True: "true", False: "false", None: "absent"}[v]

FISHERY_MAP = {"trout-wild":"wild","trout-stocked":"stocked","tailwater-trout":"tailwater"}

def write_yaml(path):
    c, y, k, n = counts()
    L = []
    A = L.append
    A("# PROPOSED species/classification for every TroutSite TN water — OWNER DECISION MENU.")
    A("# Generated %s by docs/research/build-classification.py (branch research/trout-waterways)." % ACCESS)
    A("# NOTHING HERE IS APPLIED. Existing YAMLs in packages/content/streams/tn/ are untouched.")
    A("# Evidence rules follow docs/SPECIES-REVIEW.md: species absent = unknown = never guessed;")
    A("# affirmative citation required for any trout claim. confidence: high = 2+ independent sources")
    A("# or one explicit fetched official statement; medium = single source; low = inference.")
    A("# yearRound: absent = evidence does not reach (field should stay ABSENT in the catalog).")
    A("meta:")
    A("  generatedAt: \"%s\"" % ACCESS)
    A("  atlasBase: 9ae3caa")
    A("  atlasCount: 148")
    A("  pendingAddCount: %d" % len(PENDING))
    A("  totalRows: %d" % n)
    A("  sources:")
    A("    - https://www.tn.gov/twra/fishing-regs/trout-regulations.html")
    A("    - https://www.tn.gov/twra/fishing/trout-information-stockings.html")
    A("    - https://www.tn.gov/content/dam/tn/twra/documents/fishing/Tennessee-Trout-Management-Plan-2017-2027.pdf")
    A("    - https://storymaps.arcgis.com/stories/4c150fb3e0444ed6b55adede0c1b23e2 (unofficial; corroboration only)")
    A("    - NPS/USFS/TVA/USFWS where-to-fish + research notes in docs/research/_notes/")
    A("  classificationEnum: [trout-wild, trout-stocked, tailwater-trout, warmwater, unknown-need-evidence]")
    A("waters:")
    for x in R:
        A("  - id: %s" % x["id"])
        A("    classification: %s" % x["cls"])
        if x["cls"] in FISHERY_MAP:
            A("    fishery: %s" % FISHERY_MAP[x["cls"]])
            A("    species: trout")
        elif x["cls"] == "warmwater":
            A("    fishery: absent")
            A("    species: warmwater")
        else:
            A("    fishery: absent")
            A("    species: absent")
        A("    yearRound: %s" % yr_yaml(x["yr"]))
        A("    stockingProgram: %s" % ("true" if x["cls"] in ("trout-stocked","tailwater-trout") else "false"))
        A("    confidence: %s" % x["conf"])
        cite = x["cite"].replace('"', "'")
        A('    citation: "%s (access %s)"' % (cite, ACCESS))
        A('    speciesDetail: "%s"' % x["sp"].replace('"', "'"))
        if x["flags"]:
            A("    flags:")
            for f in x["flags"]:
                A('      - "%s"' % f.replace('"', "'"))
    open(path, "w", encoding="utf-8").write("\n".join(L) + "\n")

def validate():
    gj = json.load(open("apps/web/public/atlas/rivers.geojson", encoding="utf-8"))
    atlas = sorted(f["properties"]["id"] for f in gj["features"])
    ours = sorted(x["id"] for x in R)
    missing = [i for i in atlas if i not in set(ours)]
    extra = [i for i in ours if i not in set(atlas) and i not in set(PENDING)]
    dupes = [i for i in set(ours) if ours.count(i) > 1]
    if missing or extra or dupes:
        print("VALIDATION FAILED", file=sys.stderr)
        print("missing:", missing, file=sys.stderr)
        print("extra:", extra, file=sys.stderr)
        print("dupes:", dupes, file=sys.stderr)
        sys.exit(1)
    print("coverage OK: %d atlas + %d pending-add = %d rows" % (len(atlas), len(PENDING), len(R)))

if __name__ == "__main__":
    validate()
    write_md("docs/research/SPECIES-CLASSIFICATION.md")
    write_yaml("docs/research/proposed-waters-2026-09.yaml")
    c, y, k, n = counts()
    print("counts:", dict(c))
    print("yearRound:", dict(y), "conf:", dict(k))
