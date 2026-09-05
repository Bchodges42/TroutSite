// Per-stream reach gates shared by match-rivers-tiger.mjs (TIGER segments) and
// merge-rivers.mjs (NHD flowline parts + TIGER AREAWATER polygons).
//
// WHY (B13): TIGER/Line names large rivers only sparsely — the catalog's
// tailwater streams matched single stray fragments (e.g. one "South Fork
// Holston Riv" segment shared by three ids, one Hancock-County "Clinch Riv"
// segment standing in for the whole Norris tailwater). Where a catalog entry
// denotes a specific managed reach below a named dam, or a gauge-bracketed
// reach, the reach is bounded here and EVERY source part (line or polygon)
// must lie entirely inside the window — whole-part discipline, never clipped
// mid-segment (no interior coordinate deletion).
//
// Provenance of each bound (public domain):
// - USGS monitoring-location coordinates, waterservices.usgs.gov site service
//   (NAD83), retrieved 2026-09-04: Norris Dam 03533000 (36.21563,-84.08214),
//   South Holston Dam 03476500 (36.52356,-82.09726), Boone Dam 03486810
//   (36.44066,-82.43792), Fort Patrick Henry Dam 03487010 (36.49816,-82.50904),
//   Wilbur Dam 03484000 (36.34411,-82.12956), Tims Ford Dam 03580750
//   (35.19231,-86.28110), Prospect 03584600 (35.01424,-86.99466), Shelbyville
//   03597860/03598000 (-86.46258/-86.49916), Columbia 03599500 (-87.03234),
//   Dale Hollow Dam 03417000 (36.53728,-85.45525), Parksville 03564500
//   (35.09689,-84.65437).
// - Census TIGER/Line 2024 AREAWATER reservoir footprints (same retrieval):
//   Normandy Lk west edge lon -86.2482 (= Normandy Dam), Tims Ford Lk west
//   edge lon -86.2865, Parksville Lk west edge lon -84.6748.
export const REACH_GATE = {
  'clinch-river': {
    why: 'Norris tailwater: downstream (west) of Norris Dam; dam from USGS 03533000 lon -84.0821',
    minLon: -90, maxLon: -84.06, minLat: 34.9, maxLat: 36.75,
  },
  'south-holston-river': {
    why: 'South Holston tailwater: between South Holston Dam (USGS 03476500 lon -82.0973) and Boone Lake (TIGER AREAWATER east arm)',
    minLon: -82.32, maxLon: -82.09, minLat: 34.9, maxLat: 36.75,
  },
  'boone-tailwater': {
    why: 'Boone tailwater: between Boone Dam (USGS 03486810 lon -82.4379) and Fort Patrick Henry Lake (USGS 03487010 lon -82.5090)',
    minLon: -82.515, maxLon: -82.43, minLat: 34.9, maxLat: 36.75,
  },
  'ft-patrick-henry-tailwater': {
    why: 'Fort Patrick Henry tailwater: below Fort Patrick Henry Dam (USGS 03487010 lon -82.5090) to the Kingsport confluence',
    minLon: -82.62, maxLon: -82.5, minLat: 34.9, maxLat: 36.75,
  },
  'watauga-river': {
    why: 'Wilbur tailwater: below Wilbur Dam (USGS 03484000 lon -82.1296); excludes the Watauga Lake arm (the stray Johnson Co TIGER segment at lon -81.93). CONTINUITY lane 2026-09-04: maxLon widened -82.125 -> -82.11 — the old edge rejected the two NHDPlus HR 55800 dam-pool connectors (bboxes -82.1268..-82.1168 and -82.1264..-82.1198 at lat ~36.33-36.34) that carry the flowline across the dam pool, which split the tailwater into 2 chunks. The excluded far lake arm (lon < -82.10) stays out.',
    minLon: -90, maxLon: -82.11, minLat: 34.9, maxLat: 36.75,
  },
  'duck-river-tailwater': {
    why: 'Normandy tailwater: between Normandy Dam (TIGER AREAWATER Normandy Lk west edge lon -86.2482) and the Shelbyville gauges (USGS 03597860/03598000 lon -86.4626/-86.4992)',
    minLon: -86.50, maxLon: -86.24, minLat: 34.9, maxLat: 36.75,
  },
  'duck-river-lower': {
    // GEOMETRY lane 2026-09-04: maxLon tightened -86.42 -> -86.47. The old edge
    // overlapped the tailwater window on [-86.50,-86.42], matching the SAME 14
    // TIGER parts under both reach ids (exact-shared parts, double-drawn).
    // -86.47 keeps every genuine lower-reach part (largest remaining east edge
    // -86.49538) and excludes the shared Shelbyville web (east edges
    // >= -86.4482); the tailwater keeps the web down to its gauge-bounded
    // end. After the tighten the lower's upstream end sits at the 03598000
    // Shelbyville gauge (-86.4992), per the catalog reach bracket.
    why: 'Catalog reach "Shelbyville to Columbia": USGS 03597860/03598000 (lon -86.4626/-86.4992) to 03599500 (lon -87.0323); maxLon tightened to remove exact-shared parts with the tailwater',
    minLon: -87.06, maxLon: -86.47, minLat: 34.9, maxLat: 36.75,
  },
  'elk-river': {
    why: 'Tims Ford tailwater: below Tims Ford Dam (USGS 03580750 lon -86.2811; TIGER AREAWATER Tims Ford Lk west edge lon -86.2865) to Prospect (USGS 03584600 lon -86.9947)',
    minLon: -87.0, maxLon: -86.28, minLat: 34.9, maxLat: 36.75,
  },
  'elk-river-lower': {
    // GEOMETRY lane 2026-09-04: maxLon tightened -86.99 -> -86.9968. The old
    // edge overlapped elk-river on [-87.00,-86.99], matching the same two
    // 2-vertex TIGER parts under both ids. -86.9968 keeps every genuine
    // lower-reach part (largest remaining east edge -86.9977) and excludes the
    // shared pair (east edges -86.9959/-86.9934); the handoff sits at the
    // Prospect gauge USGS 03584600 (-86.99466), per the catalog reach bracket.
    why: 'Catalog reach "Prospect to state line": from USGS 03584600 (lon -86.9947) to the AL line; maxLon tightened to remove exact-shared parts with elk-river',
    minLon: -87.02, maxLon: -86.9968, minLat: 34.9, maxLat: 36.75,
  },
  'obey-river': {
    why: 'Dale Hollow tailwater: below Dale Hollow Dam (USGS 03417000 lat 36.5373)',
    minLon: -90, maxLon: -81.45, minLat: 36.52, maxLat: 36.75,
  },
  'stones-river': {
    // GEOMETRY lane 2026-09-04: minLat widened 36.153 -> 35.985. The old edge
    // stopped the reach at J. Percy Priest Dam, leaving the reservoir corridor
    // without a centerline: no feature continued from the dam through the pool
    // to the East/West Fork meeting point. NHDPlus HR carries the main stem
    // through the corridor as fcode-55800 artificial-path reaches named
    // "Stones River" from the forks' confluence (-86.4587,35.9859) to the dam;
    // 20 corridor nhdplusids re-verified live against
    // hydro.nationalmap.gov NHDPlus_HR MapServer/3 on 2026-09-04. The widened
    // gate admits exactly those corridor reaches (no "Stones River" water
    // exists south of the confluence inside the fetch envelope).
    why: 'Catalog "Stones River (Davidson County)" reach continued through the J. Percy Priest reservoir corridor to the East/West Fork confluence (NHD 55800 corridor reaches, dam at lat ~36.155, confluence at 35.9859)',
    minLon: -90, maxLon: -81.45, minLat: 35.985, maxLat: 36.75,
  },
  'ocoee-river': {
    why: 'Catalog "upper, Copperhill reach": upstream (east) of Parksville Lake (TIGER AREAWATER Parksville Lk west edge lon -84.6748, lake head lon -84.6248; USGS 03564500 lon -84.6544)',
    minLon: -84.62, maxLon: -84.3, minLat: 34.9, maxLat: 36.75,
  },
  'parksville-tailwater': {
    why: 'Ocoee No. 1 tailwater: below Parksville Dam (TIGER AREAWATER Parksville Lk west edge lon -84.6748) toward the Hiwassee confluence',
    minLon: -84.78, maxLon: -84.67, minLat: 34.9, maxLat: 36.75,
  },
};

// Keep a source part only when its bounding box lies entirely inside the gate
// window. minLat/maxLat null = unbounded on that side.
export function gateKeeps(gate, bbox) {
  if (!gate) return true;
  if (gate.minLon != null && bbox[0] < gate.minLon) return false;
  if (gate.maxLon != null && bbox[2] > gate.maxLon) return false;
  if (gate.minLat != null && bbox[1] < gate.minLat) return false;
  if (gate.maxLat != null && bbox[3] > gate.maxLat) return false;
  return true;
}
