/**
 * Launch-state registry — ROLE 5.
 *
 * v1 ships exactly ONE launch state: Tennessee (00-SHARED-CONTEXT §1.6 / §2).
 * The programmatic-page templates in src/pages are fully data-driven off this
 * registry: adding a second state later (v2 per §13) is data entry here, not code.
 *
 * NOTE: the canonical plan (CHAT-* files, §2, §7) is Tennessee-only. Phase-0
 * Phase-0 shell text elsewhere in the repo referencing TX/OK/AR predates that
 * decision; see docs/ASSUMPTIONS.md (ROLE 5 entry) — contracts are state-agnostic
 * so nothing frozen needs to change.
 */

export interface AgencyInfo {
  /** Full agency name, e.g. "Tennessee Wildlife Resources Agency". */
  name: string;
  /** Short acronym, e.g. "TWRA". */
  short: string;
  /** Agency home page — always linked as the authoritative source. */
  url: string;
  /** The agency page that publishes stocking schedules. */
  stockingUrl: string;
}

export interface LaunchState {
  /** 2-letter code (StateIdSchema in @trout/contracts). */
  id: string;
  /** Display name, e.g. "Tennessee". */
  name: string;
  /** URL slug for programmatic pages, e.g. /when-does-{slug}-stock-trout/. */
  slug: string;
  agency: AgencyInfo;
  /** One-line plain-English stocking season summary (drives FAQ + keyword pages). */
  stockingSummary: string;
}

export const LAUNCH_STATES: LaunchState[] = [
  {
    id: 'TN',
    name: 'Tennessee',
    slug: 'tennessee',
    agency: {
      name: 'Tennessee Wildlife Resources Agency',
      short: 'TWRA',
      url: 'https://www.tn.gov/twra',
      stockingUrl: 'https://www.tn.gov/twra/fishing.html',
    },
    stockingSummary:
      'TWRA runs a winter put-and-take trout program (roughly December–early March) on tailwaters and selected urban streams, plus year-round supplemental stockings on the major tailwaters. Schedules change weekly — always verify with the agency.',
  },
];

export interface RegionInfo {
  /** Matches regionId on streams + hatch charts. */
  id: string;
  stateId: string;
  name: string;
  /** URL slug under /hatch/{state}/{slug}/. */
  slug: string;
  blurb: string;
}

export const REGIONS: RegionInfo[] = [
  // Registry of record: packages/content/scripts/regions.ts (Role 4). Ids must
  // match the content corpus + /v1/hatch/* snapshots exactly (ADR 0005).
  {
    id: 'tn-east-holston', stateId: 'TN', name: 'East Tennessee — Holston Tailwaters', slug: 'east-holston-tailwaters',
    blurb: 'The South Holston, Boone and Fort Patrick Henry tailwaters — cold, fertile dam-release rivers with year-round insect activity and a famous sulphur hatch.',
  },
  {
    id: 'tn-northeast-watauga', stateId: 'TN', name: 'Northeast Tennessee — Watauga', slug: 'northeast-watauga',
    blurb: 'The Watauga tailwater, Doe River and Johnson County headwaters — cold tailrace water with blue-winged olives and caddis most of the year.',
  },
  {
    id: 'tn-east-clinch', stateId: 'TN', name: 'East Tennessee — Clinch & Powell', slug: 'east-clinch-powell',
    blurb: 'The Clinch below Norris Dam and the Powell River country — deep, slow tailwater pools with reliable midge and caddis fishing.',
  },
  {
    id: 'tn-east-smokies', stateId: 'TN', name: 'Great Smoky Mountains National Park', slug: 'smoky-mountains',
    blurb: 'Park streams — wild brook, rainbow and brown trout on small freestone water inside the most-visited national park in the country.',
  },
  {
    id: 'tn-east-pigeon-frenchbroad', stateId: 'TN', name: 'East Tennessee — Pigeon & French Broad', slug: 'pigeon-french-broad',
    blurb: 'The Pigeon, French Broad and Nolichucky drainages — big freestone rivers and warm-water transitions in the eastern part of the state.',
  },
  {
    id: 'tn-se-hiwassee', stateId: 'TN', name: 'Southeast Tennessee — Hiwassee', slug: 'southeast-hiwassee',
    blurb: 'The Hiwassee below Appalachia Dam — a State Scenic River and big-volume tailwater famous for its late-winter caddis hatch, plus the Tellico and Citico.',
  },
  {
    id: 'tn-cumberland-plateau', stateId: 'TN', name: 'Cumberland Plateau', slug: 'cumberland-plateau',
    blurb: 'The Obed, Emory and wild brown trout rivers atop the plateau — freestone water, gorges, and TWRA put-and-take stockings.',
  },
  {
    id: 'tn-upper-cumberland', stateId: 'TN', name: 'Upper Cumberland', slug: 'upper-cumberland',
    blurb: 'The Dale Hollow tailwater (Obey River) and Highland Rim streams — cold winter tailrace water plus spring-fed creeks.',
  },
  {
    id: 'tn-middle-caney-fork', stateId: 'TN', name: 'Middle Tennessee — Caney Fork', slug: 'caney-fork',
    blurb: 'The Caney Fork below Center Hill Dam plus the Collins and Calfkiller — the closest reliable tailwater trout to Middle Tennessee.',
  },
  {
    id: 'tn-middle-duck-elk', stateId: 'TN', name: 'Middle Tennessee — Duck & Elk', slug: 'duck-elk',
    blurb: 'The Duck and Elk River tailwaters and southern freestones — winter put-and-take trout with a strong summer smallmouth transition.',
  },
  {
    id: 'tn-middle-nashville', stateId: 'TN', name: 'Middle Tennessee — Nashville', slug: 'nashville-area',
    blurb: 'Nashville-area and Highland Rim winter-trout waters — TWRA urban stockings put catchable trout within reach of the city.',
  },
  {
    id: 'tn-west', stateId: 'TN', name: 'West Tennessee', slug: 'west-tennessee',
    blurb: 'West Tennessee winter put-and-take lakes and park ponds — accessible cold-season trout waters across the western basin.',
  },
];

export function stateBySlug(slug: string): LaunchState | undefined {
  return LAUNCH_STATES.find((s) => s.slug === slug);
}

export function stateById(id: string): LaunchState | undefined {
  return LAUNCH_STATES.find((s) => s.id === id);
}

export function regionBySlug(stateId: string, slug: string): RegionInfo | undefined {
  return REGIONS.find((r) => r.stateId === stateId && r.slug === slug);
}

export function regionById(id: string): RegionInfo | undefined {
  return REGIONS.find((r) => r.id === id);
}

export function regionsForState(stateId: string): RegionInfo[] {
  return REGIONS.filter((r) => r.stateId === stateId);
}
