import type { BugTaxon } from '@trout/contracts';

/**
 * Field-photo registry for taxon detail pages, keyed by the taxon's order
 * (Diptera keys by family). Every entry is a visually approved, ad-safe
 * licensed photo — CC0 / Public Domain / CC BY / CC BY-SA only, never NC/ND
 * (BugGuide is out). Provenance for every row lives in
 * docs/imagery-provenance.csv; the intake script refuses to ship a photo
 * without a provenance row. Photos are an enhancement to the offline line
 * art: they are NOT service-worker precached, so an offline device shows the
 * drawing and the key keeps working.
 */
export interface TaxonPhoto {
  src: string;
  /** One-line credit rendered under the photo — attribution is not optional. */
  credit: string;
  license: string;
  sourceUrl: string;
}

const PHOTOS: Record<string, TaxonPhoto> = {
  ephemeroptera: {
    src: '/img/taxa/ephemeroptera.jpg',
    credit: 'Hexagenia limbata nymph — Fredlyfish4, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hexagenia_limbata_nymph.jpg',
  },
  trichoptera: {
    src: '/img/taxa/trichoptera.jpg',
    credit: 'Pycnopsyche case-maker larva — Bob Henricks, Wikimedia Commons',
    license: 'CC BY-SA 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Northern_case-maker_caddisfly_larva,_genus_Pycnopsyche_(7004501660).jpg',
  },
  plecoptera: {
    src: '/img/taxa/plecoptera.jpg',
    credit: 'Golden stonefly nymph — Mike Cline, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Golden_Stonefly_Nymph.jpg',
  },
  'diptera:chironomidae': {
    src: '/img/taxa/chironomidae.jpg',
    credit: 'Chironomid bloodworm larva — Jasper Nance / lamiot, Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bloodworm.jpg',
  },
  'diptera:simuliidae': {
    src: '/img/taxa/simuliidae.jpg',
    credit: 'Black fly larva — NorbertNagel, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Blackfly_larva_-_Simuliidae_-_Kriebelm%C3%BCckenlarve_01.jpg',
  },
  'diptera:tipulidae': {
    src: '/img/taxa/tipulidae.jpg',
    credit: 'Crane fly larva — Donald Hobern, Wikimedia Commons',
    license: 'CC BY 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tipulidae_sp._(26445342650).jpg',
  },
  amphipoda: {
    src: '/img/taxa/amphipoda.jpg',
    credit: 'Gammarus pulex (scud) — Nicola Simoncini, Wikimedia Commons',
    license: 'CC BY 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gammarus_pulex_14875940_(cropped).jpg',
  },
  isopoda: {
    src: '/img/taxa/isopoda.jpg',
    credit: 'Asellus aquaticus (sowbug) — Peter Pfeiffer, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Asellus_aquaticus_Wasserassel.jpg',
  },
  odonata: {
    src: '/img/taxa/odonata.jpg',
    credit: 'Damselfly nymph — Ryan Hodnett, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Broad-winged_Damselfly_(Calopterygidae)_Nymph_-_Mississauga,_Ontario.jpg',
  },
  coleoptera: {
    src: '/img/taxa/coleoptera.jpg',
    credit: 'Dytiscus diving beetle — Ceeec, Wikimedia Commons',
    license: 'CC0 1.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dytiscus_fasciventris.jpg',
  },
  annelida: {
    src: '/img/taxa/annelida.jpg',
    credit: 'Erpobdella octoculata (leech) — Ulrich Kutschera, Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Acht%C3%A4ugiger_Roll_Egel.jpg',
  },
  hymenoptera: {
    src: '/img/taxa/hymenoptera.jpg',
    credit: 'Formica ant — Pawel Bieniewski, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Formica_pratensis.jpg',
  },
  orthoptera: {
    src: '/img/taxa/orthoptera.jpg',
    credit: 'Red-legged grasshopper, Walland TN — Rhododendrites, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Red-legged_grasshopper_(72625).jpg',
  },
  megaloptera: {
    src: '/img/taxa/megaloptera.jpg',
    credit: 'Hellgrammite (Corydalus larva) in a Tennessee stream — DellaRay923, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hellgrammite_in_TN_stream.JPG',
  },
};

/** The photo for a taxon, or null when no approved image covers its group. */
export function taxonPhoto(taxon: Pick<BugTaxon, 'order' | 'family'>): TaxonPhoto | null {
  const order = taxon.order.toLowerCase();
  const key = order === 'diptera' ? `diptera:${taxon.family.toLowerCase()}` : order;
  // Diptera families beyond the three we cover fall back to nothing —
  // the line art is the honest default.
  return PHOTOS[key] ?? null;
}
