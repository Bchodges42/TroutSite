/**
 * Launch-region metadata (§7). Region *ids* flow through contracts (regionId
 * strings); display names are a UI concern, so this table is app-local — no
 * contract change needed when more regions ship.
 */
export interface RegionInfo {
  id: string;
  name: string;
  stateId: string;
  blurb: string;
}

export const REGIONS: RegionInfo[] = [
  {
    id: 'tn-east-tailwaters',
    name: 'East TN Tailwaters',
    stateId: 'TN',
    blurb: 'South Holston & Watauga — famous year-round sulphur and midge water.',
  },
  {
    id: 'tn-hiwassee',
    name: 'Hiwassee River',
    stateId: 'TN',
    blurb: 'Southeast Tennessee tailrace with a long spring caddis season.',
  },
  {
    id: 'tn-middle',
    name: 'Middle Tennessee',
    stateId: 'TN',
    blurb: 'Caney Fork & Elk River tailwaters plus winter urban stockings.',
  },
];

const byId = new Map(REGIONS.map((r) => [r.id, r]));

export function regionName(regionId: string): string {
  return byId.get(regionId)?.name ?? regionId;
}

export function regionBlurb(regionId: string): string {
  return byId.get(regionId)?.blurb ?? '';
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

export function monthShort(month: number): string {
  return MONTH_SHORT[month - 1] ?? String(month);
}
