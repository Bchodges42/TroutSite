#!/usr/bin/env node
/* eslint-disable no-undef */
const TWRA_STOCK = 'https://www.tn.gov/twra/fishing/trout-information-stockings.html';

/**
 * Owner-confirmed species verdicts (cross-check 2026-09-15, owner-ordered),
 * extracted verbatim from apply-ledgers.mjs so validators can import them
 * without executing the applier. STRIP = catalog trout → warmwater;
 * CLAIM = catalog → trout/stocked.
 */

const STRIP = [
  { slug: 'obed-river', src: 'https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm', why: 'NPS Obed WSR documents a warmwater fishery (smallmouth/rock bass); no trout program or record; agency temps reached 29.7 °C in Jul 2026.' },
  { slug: 'new-river', src: 'https://www.tn.gov/twra/fishing.html', why: 'Agency sources document a warmwater smallmouth fishery (Jul 2026 max 27.4 °C at 03408500); no TWRA trout program.' },
  { slug: 'french-broad-river', src: 'https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/douglas-reservoir.html', why: 'The Tennessee reach below Douglas Dam is a warmwater smallmouth/crappie fishery; TWRA stocks no trout row; trout mentions belong to the NC headwaters.' },
  { slug: 'red-river-clarksville', src: 'https://www.tn.gov/twra/fishing.html', why: 'Warmwater river (smallmouth/largemouth/spotted bass, white bass, catfish); no TWRA trout stocking row or trout record.' },
  { slug: 'clear-creek-obed', src: 'https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm', why: 'Obed-system creek; warmwater fish community, zero salmonids in NPS records, summer temps ~30 °C.' },
  { slug: 'daddys-creek', src: 'https://www.nps.gov/obed/planyourvisit/fishing-at-the-obed.htm', why: 'Obed-system creek; warmwater (TWRA stocks musky here; smallmouth mercury advisory); zero salmonids in NPS records.' },
  { slug: 'reedy-creek', src: 'https://www.tn.gov/twra/fishing.html', why: 'Urban Kingsport creek; warmwater (303(d) listed); zero trout rows in the TWRA 2026 schedule.' },
];

const CLAIM = [
  { slug: 'south-holston-lake', fields: { species: 'trout', stockingProgram: true, fishery: 'stocked' }, src: 'https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/south-holston-reservoir.html', why: 'TWRA annually stocks trout in the reservoir (lake + lake trout named); stocking months unpinned — left unset.' },
  { slug: 'harpeth-river', fields: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [12, 1, 2], seasonKind: 'programmatic' }, src: TWRA_STOCK, why: 'TWRA winter program stocks the Harpeth at Eastern Flank Battle Park (Franklin) — December runs per the official schedule.' },
  { slug: 'little-tennessee-river', fields: { species: 'trout', stockingProgram: true, fishery: 'stocked', yearRound: false, seasonMonths: [2, 3, 4], seasonKind: 'programmatic' }, src: 'https://www.tn.gov/twra/fishing/where-to-fish/east-tennessee-r4/tellico-reservoir.html', why: 'Trout water is the Chilhowee-tailwater reach (upper Little Tennessee arm); late-winter/early-spring rainbow plants per TWRA.' },
];

export { STRIP, CLAIM };
