/**
 * Launch-region metadata. Region ids/names are the registry of record from
 * packages/content (Role 4, scripts/regions.ts) — the hatch charts, streams, and
 * the /v1/hatch/* snapshots all key off these ids, so this table must match.
 * Blurbs are app-local UI copy.
 */
export interface RegionInfo {
  id: string;
  name: string;
  stateId: string;
  blurb: string;
}

export const REGIONS: RegionInfo[] = [
  {
    id: 'tn-east-holston',
    name: 'East TN — Holston Tailwaters',
    stateId: 'TN',
    blurb: 'South Holston, Boone & Fort Patrick Henry — year-round sulphur and midge water.',
  },
  {
    id: 'tn-northeast-watauga',
    name: 'Northeast TN — Watauga',
    stateId: 'TN',
    blurb: 'Watauga tailwater, Doe River & Johnson County headwaters.',
  },
  {
    id: 'tn-east-clinch',
    name: 'East TN — Clinch & Powell',
    stateId: 'TN',
    blurb: 'Clinch (Norris tailwater) & Powell River country.',
  },
  {
    id: 'tn-east-smokies',
    name: 'Great Smoky Mountains NP',
    stateId: 'TN',
    blurb: 'Park streams — wild brook, rainbow and brown trout on freestone water.',
  },
  {
    id: 'tn-east-pigeon-frenchbroad',
    name: 'East TN — Pigeon & French Broad',
    stateId: 'TN',
    blurb: 'Pigeon, French Broad & Nolichucky drainages.',
  },
  {
    id: 'tn-se-hiwassee',
    name: 'Southeast TN — Hiwassee',
    stateId: 'TN',
    blurb: 'Hiwassee, Tellico, Citico & Ocoee — a long spring caddis season.',
  },
  {
    id: 'tn-cumberland-plateau',
    name: 'Cumberland Plateau',
    stateId: 'TN',
    blurb: 'Obed, Emory & wild brown rivers.',
  },
  {
    id: 'tn-upper-cumberland',
    name: 'Upper Cumberland',
    stateId: 'TN',
    blurb: 'Dale Hollow tailwater (Obey) & Highland Rim.',
  },
  {
    id: 'tn-middle-caney-fork',
    name: 'Middle TN — Caney Fork',
    stateId: 'TN',
    blurb: 'Caney Fork & Collins/Calfkiller country.',
  },
  {
    id: 'tn-middle-duck-elk',
    name: 'Middle TN — Duck & Elk',
    stateId: 'TN',
    blurb: 'Duck & Elk River tailwaters and southern freestones.',
  },
  {
    id: 'tn-middle-nashville',
    name: 'Middle TN — Nashville',
    stateId: 'TN',
    blurb: 'Nashville-area & Highland Rim winter-trout waters.',
  },
  {
    id: 'tn-west',
    name: 'West TN — Winter Trout',
    stateId: 'TN',
    blurb: 'TWRA winter put-and-take lakes & park ponds around Memphis, Jackson and Paris.',
  },
];

const byId = new Map(REGIONS.map((r) => [r.id, r]));

export function regionName(regionId: string): string {
  return byId.get(regionId)?.name ?? regionId;
}

export function regionBlurb(regionId: string): string {
  return byId.get(regionId)?.blurb ?? '';
}

const longMonthFmt = new Intl.DateTimeFormat([], { month: 'long' });
const shortMonthFmt = new Intl.DateTimeFormat([], { month: 'short' });
const monthDate = (month: number) => new Date(2000, month - 1, 1);

export const MONTH_NAMES: readonly string[] = Array.from({ length: 12 }, (_, i) =>
  longMonthFmt.format(new Date(2000, i, 1)),
);

export const MONTH_SHORT: readonly string[] = Array.from({ length: 12 }, (_, i) =>
  shortMonthFmt.format(new Date(2000, i, 1)),
);

export function monthName(month: number): string {
  return month >= 1 && month <= 12 ? longMonthFmt.format(monthDate(month)) : String(month);
}

export function monthShort(month: number): string {
  return month >= 1 && month <= 12 ? shortMonthFmt.format(monthDate(month)) : String(month);
}
