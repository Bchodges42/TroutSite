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
  {
    id: 'tn-east-tailwaters',
    stateId: 'TN',
    name: 'East Tennessee Tailwaters',
    slug: 'east-tailwaters',
    blurb:
      'The South Holston and Watauga tailwaters in the northeast corner of the state — cold, fertile dam-release rivers with year-round insect activity.',
  },
  {
    id: 'tn-hiwassee',
    stateId: 'TN',
    name: 'Hiwassee River',
    slug: 'hiwassee',
    blurb:
      'The Hiwassee below Appalachia Dam in southeast Tennessee, designated a State Scenic River — a big-volume tailwater famous for its late-winter caddis hatch.',
  },
  {
    id: 'tn-middle',
    stateId: 'TN',
    name: 'Middle Tennessee',
    slug: 'middle-tennessee',
    blurb:
      'The Caney Fork and Elk River tailwaters plus TWRA winter urban stockings around Nashville — the closest reliable trout to Middle Tennessee population centers.',
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
