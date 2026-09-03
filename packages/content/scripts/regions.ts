// OWNER: ROLE 4. Launch-region registry (00-SHARED-CONTEXT §7: Tennessee launch regions).
// The hatch charts, streams, and the built content pack all key off these ids.
export interface RegionMeta {
  id: string;
  name: string;
  stateId: 'TN';
}

export const REGIONS: RegionMeta[] = [
  { id: 'tn-east-holston', name: 'East TN — Holston tailwaters (South Holston, Boone, Ft. Patrick Henry)', stateId: 'TN' },
  { id: 'tn-northeast-watauga', name: 'Northeast TN — Watauga tailwater, Doe River & Johnson County headwaters', stateId: 'TN' },
  { id: 'tn-east-clinch', name: 'East TN — Clinch (Norris tailwater) & Powell River country', stateId: 'TN' },
  { id: 'tn-east-smokies', name: 'Great Smoky Mountains National Park streams', stateId: 'TN' },
  { id: 'tn-east-pigeon-frenchbroad', name: 'East TN — Pigeon, French Broad & Nolichucky drainages', stateId: 'TN' },
  { id: 'tn-se-hiwassee', name: 'Southeast TN — Hiwassee, Tellico, Citico & Ocoee', stateId: 'TN' },
  { id: 'tn-cumberland-plateau', name: 'Cumberland Plateau — Obed, Emory & wild brown rivers', stateId: 'TN' },
  { id: 'tn-upper-cumberland', name: 'Upper Cumberland — Dale Hollow tailwater (Obey) & Highland Rim', stateId: 'TN' },
  { id: 'tn-middle-caney-fork', name: 'Middle TN — Caney Fork & Collins/Calfkiller country', stateId: 'TN' },
  { id: 'tn-middle-duck-elk', name: 'Middle TN — Duck & Elk River tailwaters and southern freestones', stateId: 'TN' },
  { id: 'tn-middle-nashville', name: 'Middle TN — Nashville-area & Highland Rim winter-trout waters', stateId: 'TN' },
];

export const REGION_IDS = new Set(REGIONS.map((r) => r.id));
