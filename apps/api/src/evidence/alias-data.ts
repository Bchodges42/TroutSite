/**
 * Explicit TWRA-name → catalog-waterId alias table (data-sources lane, hand-audited
 * against the 2026-09-04 schedule grid (616 rows / 132 distinct locations) and the
 * recent-report destinations).
 *
 * Rules encoded here (brief: "explicit aliases and ambiguity rejection; never
 * first-word or loose substring matching"):
 *   - Keys are the NORMALIZED full TWRA location string (see aliases.ts normalizeName).
 *   - An entry here always wins over automatic matching and is the ONLY way a TWRA
 *     name that differs from the catalog name ("Sulphur" vs "Sulfur", "Whiteoak" vs
 *     "White Oak", site suffixes like "- Manson Pike Trailhead") resolves.
 *   - Bare base names that collide across catalog waters (Duck River, Elk River,
 *     Wolf River) are ambiguous BY DEFAULT; county-qualified entries in
 *     TWRA_COUNTY_ALIASES are the only automatic disambiguation.
 */

export interface AliasEntry {
  waterId: string;
  /** Why this override exists (audit provenance). */
  note?: string;
}

/** Normalized full TWRA name → catalog waterId. */
export const TWRA_ALIAS_OVERRIDES: Record<string, AliasEntry> = {
  // Tailwaters: TWRA names the dam, the catalog names the river.
  'apalachia tw hiwassee river': { waterId: 'hiwassee-river', note: 'TWRA dam-form name; catalog names the tailwater river' },
  'boone tw s fork holston river': { waterId: 'boone-tailwater' },
  'center hill tw caney fork river': { waterId: 'caney-fork-river' },
  'dale hollow tw obey river': { waterId: 'obey-river' },
  'ft patrick henry tw s fork holston river': { waterId: 'ft-patrick-henry-tailwater' },
  'norris tailwater clinch river': { waterId: 'clinch-river' },
  'normandy tw duck river': { waterId: 'duck-river-tailwater', note: 'disambiguates bare Duck River (tailwater vs lower)' },
  'parksville ocoee 1 tw ocoee river': { waterId: 'parksville-tailwater' },
  's holston tw s fork holston river': { waterId: 'south-holston-river' },
  'tims ford tw elk river': { waterId: 'elk-river', note: 'disambiguates bare Elk River (tailwater vs lower)' },
  'wilbur tailwater watauga river': { waterId: 'watauga-river' },
  'j percy priest tw stones river': { waterId: 'stones-river', note: 'catalog stones-river IS the Percy Priest dam-to-mouth tailwater (GEO audit)' },
  // Recent-report short forms (same waters, grid uses terse names).
  'center hill tw': { waterId: 'caney-fork-river' },
  'dale hollow tw': { waterId: 'obey-river' },
  'hiwassee river tw': { waterId: 'hiwassee-river' },
  'norris tw': { waterId: 'clinch-river' },
  // Reservoir ↔ lake naming.
  'dale hollow reservoir': { waterId: 'dale-hollow-lake' },
  // Spelling variants between TWRA and the catalog.
  'sulphur fork creek': { waterId: 'sulfur-fork-creek', note: 'TWRA spells Sulphur; catalog Sulfur' },
  'whiteoak creek': { waterId: 'white-oak-creek', note: 'compound/open variant' },
  'stony creek': { waterId: 'stoney-creek-carter', note: 'TWRA Stony vs catalog Stoney' },
  // Site suffixes and parentheticals.
  'harpeth river at eastern flank battle park': { waterId: 'harpeth-river', note: 'put-and-take reach of the catalog Harpeth' },
  'cane creek fall creek falls state park': { waterId: 'cane-creek' },
  'cane creek lower': { waterId: 'cane-creek' },
  'mill creek standing stone state park': { waterId: 'mill-creek-overton', note: 'Standing Stone SP is in Overton County' },
  'mossy creek new': { waterId: 'mossy-creek-jefferson' },
  'covington first baptist church pond new': { waterId: 'covington-fbc-pond' },
  'richardson byrd creek': { waterId: 'richardson-byrd-creek', note: "TWRA quotes 'Byrd'" },
  'w fork stones river manson pike trailhead': { waterId: 'west-fork-stones-river', note: 'NEVER first-word match: W. is West, not East' },
  'w prong little pigeon r pigeon forge': { waterId: 'west-prong-little-pigeon' },
  'mid prong little pigeon river': { waterId: 'middle-prong-little-pigeon' },
  'n chickamauga creek': { waterId: 'north-chickamauga-creek' },
  'n barren fork creek': { waterId: 'north-prong-barren-fork' },
  'big rock greenway': { waterId: 'big-rock-creek', note: 'TWRA names the greenway reach' },
  // Parks/ponds where the TWRA name is the park, the catalog names the water.
  'edmund orgill park': { waterId: 'edmund-orgill-lake' },
  'paris city park': { waterId: 'paris-city-park-lake' },
  'shelby farms': { waterId: 'shelby-farms-lake' },
  'union city reelfoot packing site': { waterId: 'union-city-reelfoot-pond' },
  'valentine park': { waterId: 'valentine-park-pond' },
  'yale road park': { waterId: 'yale-road-park-lake' },
  // Recent-report destinations (county-less grid, unique catalog match verified).
  'buffalo creek': { waterId: 'buffalo-creek-grainger', note: 'unique catalog match; the recent-report grid carries no county' },
  'west prong little pigeon river gatlinburg': { waterId: 'west-prong-little-pigeon' },
};

/** County-keyed disambiguation for names that collide across catalog waters. */
export interface CountyAlias {
  /** Normalized TWRA location name (bare, e.g. "wolf river"). */
  nameKey: string;
  /** Normalized TWRA county (lowercase, " county" stripped). */
  county: string;
  waterId: string;
  note?: string;
}

export const TWRA_COUNTY_ALIASES: CountyAlias[] = [
  { nameKey: 'wolf river', county: 'fentress', waterId: 'wolf-river-fentress', note: 'winter put-and-take upper Wolf' },
  { nameKey: 'wolf river', county: 'pickett', waterId: 'wolf-river-fentress' },
  { nameKey: 'wolf river', county: 'shelby', waterId: 'wolf-river-west-tennessee' },
  { nameKey: 'wolf river', county: 'fayette', waterId: 'wolf-river-west-tennessee' },
  { nameKey: 'wolf river', county: 'franklin', waterId: 'wolf-river-west-tennessee', note: 'TN Wolf River (W TN) drains Fayette/Shelby; TWRA uses Franklin for the W TN program rows' },
  { nameKey: 'cane creek', county: 'hickman', waterId: 'cane-creek', note: 'catalog cane-creek covers the Hickman/Perry band (GEO audit)' },
  { nameKey: 'cane creek', county: 'perry', waterId: 'cane-creek' },
];

/**
 * Names that are EXPECTED to stay unresolved with the current catalog, recorded so
 * coverage reports them as known gaps rather than surprises. Add to this list when a
 * TWRA water has no catalog equivalent (do not force a mapping).
 */
export const KNOWN_UNRESOLVED_NOTES: Record<string, string> = {
  'cherokee tw holston river':
    'TWRA stocks the Cherokee Dam tailwater (Holston River); the catalog has cherokee-lake only — no tailwater water exists to map to',
  'fort campbell streams': 'plural streams on the Fort Campbell reservation; no single catalog water',
  'gatlinburg streams': 'multiple Gatlinburg city streams; no single catalog water',
};

/** Normalized catalog base names that collide across multiple catalog waters. */
export const KNOWN_AMBIGUOUS_BASE_NAMES: Record<string, string[]> = {
  'duck river': ['duck-river-tailwater', 'duck-river-lower'],
  'elk river': ['elk-river', 'elk-river-lower'],
  'wolf river': ['wolf-river-fentress', 'wolf-river-west-tennessee'],
};
