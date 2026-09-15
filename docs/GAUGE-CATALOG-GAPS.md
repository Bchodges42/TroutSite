# Gauged rivers missing from (or under-wired in) the catalog (2026-09-15)

Cross-reference of `atlas/gauges-tn.geojson` (137 active USGS stream gauges) against the
148-water catalog (`riverIndex.json` + stream YAML `gaugeIds`). Class per river:

- **no catalog water** — the river is not in the catalog at all: on the enhanced-zoom map its
  geometry renders as unselectable network clusters even though it carries agency-grade live
  data. These are catalog-add candidates.
- **wiring gap** — a catalog water exists for this river but its YAML `gaugeIds` don't
  include these active gauges. Cheap win: add the id(s) to the YAML.

Size verdict = USGS drainage area at the gauge: **MAJOR** ≥400 sq mi · **solid** 100–400 ·
**small** 20–100 · **tiny** <20 (excluded by the small-rivers rule — people fish small
rivers, but sub-20-sq-mi creeks are the tiny/seasonal class).

## True catalog gaps (no catalog water) — MAJOR, fishable-now rivers
| river | verdict | max drain (sq mi) | active gauges | class |
|---|---|---|---|---|
| SOUTH FORK FORKED DEER RIVER | MAJOR | 718 | 07027720 | **no catalog water** |
| SOUTH CHICKAMAUGA CREEK | MAJOR | 428 | 03567500 | **no catalog water** |

## True catalog gaps — solid-size
| river | verdict | max drain (sq mi) | active gauges | class |
|---|---|---|---|---|
| SOUTH FORK OBION RIVER | solid | 383 | 07024500 | **no catalog water** |
| RICHLAND CREEK | solid | 375 | 03431655, 03431700, 03544600, 03584045 | **no catalog water** |
| NORTH FORK OBION RIVER | solid | 372 | 07025400 | **no catalog water** |
| LOOSAHATCHIE RIVER | solid | 262 | 07030240 | **no catalog water** |
| SMITH FORK | solid | 214 | 03424730 | **no catalog water** |
| MIDDLE FORK FORKED DEER RIVER | solid | 211 | 07028960 | **no catalog water** |
| BIG SANDY RIVER | solid | 205 | 03606500 | **no catalog water** |
| SEWEE CREEK | solid | 117 | 03543500 | **no catalog water** |
| WEST FORK OBEY RIVER | solid | 115 | 03415000 | **no catalog water** |
| REELFOOT CREEK | solid | 110 | 07026500 | **no catalog water** |
| YELLOW CREEK | solid | 103 | 03436690 | **no catalog water** |

## True catalog gaps — small rivers (only with a fishery reason)
| river | verdict | max drain (sq mi) | active gauges | class |
|---|---|---|---|---|
| SYCAMORE CREEK | small | 97.2 | 03431800 | **no catalog water** |
| BEAVER CREEK | small | 86.8 | 03535200, 03535400 | **no catalog water** |
| BIG LIMESTONE CREEK | small | 79 | 03466208 | **no catalog water** |
| ROARING RIVER | small | 78.7 | 03418000 | **no catalog water** |
| BULLRUN CREEK | small | 68.5 | 03535000 | **no catalog water** |
| NONCONNAH CREEK | small | 68.2 | 07032200 | **no catalog water** |
| JENNINGS CREEK | small | 67.4 | 03418224 | **no catalog water** |
| FLAT CREEK | small | 67.2 | 03495005 | **no catalog water** |
| FALLING WATER RIVER | small | 67 | 03423000 | **no catalog water** |
| GOOSE CREEK | small | 64 | 03425290 | **no catalog water** |
| OOSTANAULA CREEK | small | 57 | 03565500 | **no catalog water** |
| BLEDSOE CREEK | small | 55.8 | 03425622 | **no catalog water** |
| WHITES CREEK | small | 51.3 | 03431530, 03431599 | **no catalog water** |
| BIG CREEK | small | 47.3 | 03491000 | **no catalog water** |
| WARTRACE CREEK | small | 35.7 | 03597590 | **no catalog water** |
| FLETCHER CREEK | small | 30.5 | 07031692 | **no catalog water** |
| CYPRESS CREEK | small | 27.3 | 03605078 | **no catalog water** |

## Wiring gaps (catalog water exists; active gauges not in its YAML)
| river | verdict | max drain (sq mi) | unwired active gauges | catalog water(s) |
|---|---|---|---|---|
| MISSISSIPPI RIVER | MAJOR | 932800 | 07032000 | wiring gap — catalog has `mississippi-river` |
| CUMBERLAND RIVER | MAJOR | 14163 | 03417500, 03418420, 03426310, 03426490, 03430250, 03431091, 03431500, 03431514, 03431712, 03431790, 03435000 | wiring gap — catalog has `cumberland-river` |
| DUCK RIVER | MAJOR | 2557 | 03596000, 03598185, 03599240, 03599419, 03601600, 03601990, 03603000 | wiring gap — catalog has `duck-river-lower`, `duck-river-tailwater` |
| HATCHIE RIVER | MAJOR | 2308 | 07029500, 07030050 | wiring gap — catalog has `hatchie-river` |
| OBION RIVER | MAJOR | 1875 | 07026040 | wiring gap — catalog has `obion-river` |
| FRENCH BROAD RIVER | MAJOR | 1858 | 03455000 | wiring gap — catalog has `french-broad-river` |
| ELK RIVER | MAJOR | 1805 | 03584600 | wiring gap — catalog has `elk-river`, `elk-river-lower` |
| NOLICHUCKY RIVER | MAJOR | 1688.4 | 03466500, 03467609 | wiring gap — catalog has `nolichucky-river` |
| CLINCH RIVER | MAJOR | 1474 | 03527620, 03528000 | wiring gap — catalog has `clinch-river` |
| WOLF RIVER | MAJOR | 788 | 03416000, 07030392, 07030500, 07030600, 07031740 | wiring gap — catalog has `wolf-river-fentress`, `wolf-river-west-tennessee` |
| BUFFALO RIVER | MAJOR | 702 | 03604400 | wiring gap — catalog has `buffalo-river` |
| HARPETH RIVER | MAJOR | 683 | 03432100, 03432400, 03434500 | wiring gap — catalog has `harpeth-river` |
| OBED RIVER | MAJOR | 518 | 03539800 | wiring gap — catalog has `obed-river` |
| LITTLE RIVER | solid | 300 | 03498850 | wiring gap — catalog has `little-river` |
| PINEY RIVER | solid | 193 | 03602500 | wiring gap — catalog has `piney-river-rhea` |
| WEST FORK STONES RIVER | solid | 170 | 03428180 | wiring gap — catalog has `west-fork-stones-river` |
| MILL CREEK | solid | 107 | 03430550, 03431060, 03431083 | wiring gap — catalog has `mill-creek-overton` |
| HORSE CREEK | solid | 104 | 03593800 | wiring gap — catalog has `horse-creek-greene` |
| SPRING CREEK | small | 49.7 | 03425520 | wiring gap — catalog has `spring-creek-polk` |
| BRADLEY CREEK | small | 41.3 | 03578500 | wiring gap — catalog has `bradley-creek` |

## Same-name cautions (read before wiring any row above)
- **WOLF RIVER** — TWO different rivers share this name: HUC 05130105 gauges (Byrdstown/Pickett) are the Fentress Co Wolf (Dale Hollow arm); HUC 08010210 gauges (Fayette/Shelby) are wolf-river-west-tennessee. Extra west-TN gauges are wiring candidates for the existing water; the Fentress Wolf has no catalog water.
- **DUCK RIVER** — Catalog covers Normandy tailwater + Shelbyville–Columbia only. These unwired gauges span the WHOLE basin incl. the missing Columbia→mouth reaches — the user-reported unselectable-middle gap.
- **CUMBERLAND RIVER** — cumberland-river exists but is DELIBERATELY gauge-unwired (owner decision). Extra main-stem gauges are recorded, not proposed for wiring.
- **OBED RIVER** — obed-river is wired to 03538830 (Adams Bridge, upper main stem). 03539800 (Morgan Co, 518 sq mi, LOWER Obed) shows ACTIVE in the site file — the wave-2 ledger called it dead; correct the ledger and consider it for lower-Obed coverage.

## Tiny/unknown (16 groups) — excluded per the small-rivers rule
- WOLFTEVER CREEK (18.8 sq mi, 1 gauge(s))
- SEVENMILE CREEK (12.2 sq mi, 1 gauge(s))
- BROWNS CREEK (11.8 sq mi, 1 gauge(s))
- BASSES CREEK (8.07 sq mi, 1 gauge(s))
- DRY CREEK (7.64 sq mi, 1 gauge(s))
- MOUNTAIN CREEK (5.07 sq mi, 1 gauge(s))
- MANSKER CREEK (4.97 sq mi, 1 gauge(s))
- CROCKETT CREEK (4.67 sq mi, 1 gauge(s))
- W F BROWNS CREEK (1.51 sq mi, 1 gauge(s))
- STEWARTS CREEK (? sq mi, 1 gauge(s))
- CONNER CK (? sq mi, 1 gauge(s))
- LITTLE RICHLAND CREEK (? sq mi, 1 gauge(s))
- FRIAR BRANCH (? sq mi, 1 gauge(s))
- LOOKOUT CREEK (? sq mi, 1 gauge(s))
- SINKING POND (? sq mi, 1 gauge(s))
- LOOSAHATCHIE RV (? sq mi, 1 gauge(s))

## Catalog waters with gauge wiring anomalies (known)
- **barren-fork-river** — wired 03421500 is Collins River near Rowland (wrong stream, discontinued 1924). No active USGS gauge exists on the Barren Fork itself.
- **little-tennessee-river** — no main-stem gauge exists; nearby ids are Tellico tributary/lake stubs.
- **holston-river** — no active main-stem gauge (03495500 ended 1993); live data is TVA-side.
- **watauga-river-wilbur-reach** — no station between the dams (03484000 below Wilbur ended 1982).
- **obed-river** — 03539800 (LOWER Obed, Morgan Co) is ACTIVE per the current site file, contrary to the wave-2 "dead gauge" note; 03538830 remains the upper-main-stem gauge.

## The Duck River display problem (user-reported)
The catalog carries `duck-river-tailwater` (Normandy→Shelbyville) and `duck-river-lower`
(Shelbyville→Columbia). The remaining ~100 river miles (Columbia → the Tennessee River
confluence, Humphreys/Hickman Cos) have NO catalog water — so the enhanced-zoom network
renders a MAJOR river as unselectable cluster geometry. The gauge table shows 7 active
Duck River main-stem gauges across the basin, several on exactly the missing reaches.
Recommended fix: add catalog water(s) for the Columbia→mouth Duck (one water or a small
reach set), then wire its gauges.

> Merge with the pre-existing 17-water add worklist (atlas coverage gaps) before authoring;
> source any addition with the wave-ledger block format so every new water ships with live
> agency URLs.
