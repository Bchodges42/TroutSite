/* global console */
/**
 * ROLE 2 fixture generator — writes apps/web/fixtures/data mirroring the frozen
 * ENDPOINTS surface (§ scope 9) plus the /content content-pack convention.
 *
 * Scores are computed with the REAL scoreConditions() from @trout/contracts so
 * fixtures stay contract-accurate. Every generated file is re-validated against
 * the frozen Zod schemas before it is written. Deterministic except for
 * timestamps/stocking dates, which are relative to "now" so the demo shows
 * realistic freshness ("Live · 32 min ago").
 *
 * Run: node scripts/generate-fixtures.mjs   (from apps/web)
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreConditions } from '@trout/contracts';
import {
  StreamSchema,
  ConditionSnapshotSchema,
  StockingEventSchema,
  HatchChartSchema,
  ShopSchema,
  ShopReportSchema,
  BugTaxonSchema,
  FlyPatternSchema,
} from '@trout/contracts';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (rel) => join(appRoot, 'fixtures', 'data', rel);

const NOW = Date.now();
const minutesAgo = (m) => new Date(NOW - m * 60_000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const daysAgoIso = (d) => new Date(NOW - d * 24 * 3600_000).toISOString().slice(0, 10);

// ---------------------------------------------------------------- streams ---

const usgs = (id) => ({ label: `USGS gauge ${id} — verify officially`, url: `https://waterdata.usgs.gov/monitoring-location/${id}` });
const twraLink = { label: 'TWRA trout stocking — verify officially', url: 'https://www.tn.gov/twra/fishing/stocking.html' };

const streams = [
  {
    id: 'south-holston-river',
    name: 'South Holston River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-east-holston',
    gaugeIds: ['03481500'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 350, unit: 'cfs' }],
    notes: 'World-famous sulphur fishery below South Holston Dam. Check TVA generation before wading; weirs create safe wading windows.',
    officialSources: [usgs('03481500'), { label: 'TVA dam release schedule — verify officially', url: 'https://www.tva.com/environment/lake-levels' }, twraLink],
  },
  {
    id: 'watauga-river',
    name: 'Watauga River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-northeast-watauga',
    gaugeIds: ['03466000'],
    stockingProgram: true,
    idealFlow: [{ min: 150, max: 600, unit: 'cfs' }],
    notes: 'Cold, fertile water below Watauga Dam; long drift boats can run the Wilbur put-in stretch when generation is off.',
    officialSources: [usgs('03466000'), { label: 'TVA dam release schedule — verify officially', url: 'https://www.tva.com/environment/lake-levels' }, twraLink],
  },
  {
    id: 'hiwassee-river',
    name: 'Hiwassee River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-se-hiwassee',
    gaugeIds: ['03566000'],
    stockingProgram: true,
    idealFlow: [{ min: 250, max: 1200, unit: 'cfs' }],
    notes: 'State-designated trophy trout section at Reliance. Two-generator days push the river up fast — watch the gauge.',
    officialSources: [usgs('03566000'), twraLink],
  },
  {
    id: 'caney-fork-river',
    name: 'Caney Fork River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-middle-caney-fork',
    gaugeIds: ['03430497'],
    stockingProgram: true,
    idealFlow: [{ min: 200, max: 800, unit: 'cfs' }],
    notes: 'Below Center Hill Dam. Generation can raise flows hundreds of cfs within minutes — know the retreat routes.',
    officialSources: [usgs('03430497'), { label: 'USACE Center Hill release schedule — verify officially', url: 'https://www.lrn.usace.army.mil' }, twraLink],
  },
  {
    id: 'elk-river',
    name: 'Elk River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-middle-duck-elk',
    gaugeIds: ['03599000'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 500, unit: 'cfs' }],
    notes: 'Tims Ford tailwater with a strong summer dry-fly game; water can run warm in late August — check temperature.',
    officialSources: [usgs('03599000'), twraLink],
  },
  {
    id: 'holston-river',
    name: 'Holston River (Cherokee Tailwater)',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-east-holston',
    gaugeIds: ['03587500'],
    stockingProgram: true,
    idealFlow: [{ min: 300, max: 1500, unit: 'cfs' }],
    notes: 'Under-fished Cherokee Dam tailwater with big brown trout; access is limited to a few ramps.',
    officialSources: [usgs('03587500'), twraLink],
  },
  {
    id: 'clinch-river',
    name: 'Clinch River',
    stateId: 'TN',
    waterbodyType: 'tailrace',
    regionId: 'tn-east-clinch',
    gaugeIds: ['03452000'],
    stockingProgram: true,
    idealFlow: [{ min: 200, max: 1000, unit: 'cfs' }],
    notes: 'Norris Dam tailwater with deep slow pools; waxworm-quality midge water in winter, caddis in spring.',
    officialSources: [usgs('03452000'), twraLink],
  },
  {
    id: 'duck-river',
    name: 'Duck River',
    stateId: 'TN',
    waterbodyType: 'river',
    regionId: 'tn-middle-nashville',
    gaugeIds: ['03537000'],
    stockingProgram: true,
    idealFlow: [{ min: 60, max: 400, unit: 'cfs' }],
    notes: 'Winter trout stocking reaches around Manchester and Norman Creek; smallmouth take over downstream in summer.',
    officialSources: [usgs('03537000'), twraLink],
  },
];

// ------------------------------------------------------------------ taxa ----

// Real launch-region registry ids (packages/content/scripts/regions.ts) — the app's
// region table and the /v1/hatch/* URLs must agree with these (ADR 0005).
const REGION_EAST_IDS = ['tn-east-holston', 'tn-northeast-watauga', 'tn-east-clinch', 'tn-east-smokies', 'tn-east-pigeon-frenchbroad'];
const REGION_HIWASSEE_ID = 'tn-se-hiwassee';
const REGION_MIDDLE_IDS = ['tn-cumberland-plateau', 'tn-upper-cumberland', 'tn-middle-caney-fork', 'tn-middle-duck-elk', 'tn-middle-nashville'];

function regionMonths(east, hiwassee, middle) {
  const out = {};
  for (const r of REGION_EAST_IDS) out[r] = east;
  out[REGION_HIWASSEE_ID] = hiwassee;
  for (const r of REGION_MIDDLE_IDS) out[r] = middle;
  return out;
}

const taxon = (t) => t;
const taxa = [
  taxon({
    id: 'baetis-bwo', commonName: 'Blue-Winged Olive', sciName: 'Baetis tricaudatus',
    order: 'Ephemeroptera', family: 'Baetidae', sizeRange: [16, 22],
    keyAttributes: { tails: 2, gills: 'lamellae', bodyShape: 'slender', bodyColor: ['olive', 'olive-brown', 'gray'], mouthparts: 'herbivorous scraper' },
    habitat: ['riffles', 'moderate currents', 'weedy margins'],
    monthsActiveByRegion: regionMonths([3, 4, 5, 6, 9, 10, 11], [2, 3, 4, 5, 9, 10, 11], [3, 4, 5, 10, 11]),
    notes: 'The dependable overcast-day mayfly in every Tennessee tailwater. Nymphs dart in short bursts when disturbed.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America', 'Troutnut.com hatch reference (verify officially)', 'BugGuide.net family Baetidae (verify officially)'],
  }),
  taxon({
    id: 'ephemerella-sulphur', commonName: 'Sulphur Mayfly', sciName: 'Ephemerella dorothea',
    order: 'Ephemeroptera', family: 'Ephemerellidae', sizeRange: [14, 18],
    keyAttributes: { tails: 3, gills: 'lamellae', bodyShape: 'slender', bodyColor: ['cream', 'pale-yellow', 'sulphur-orange'], mouthparts: 'shredder / grazer' },
    habitat: ['moderate riffles', 'pool tails', 'undercut seams'],
    monthsActiveByRegion: regionMonths([4, 5, 6], [4, 5, 6], [5, 6]),
    notes: 'The South Holston signature hatch. Duns ride high on sunny afternoons; spinners fall at dusk.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America', 'Troutnut.com Ephemerella dorothea (verify officially)'],
  }),
  taxon({
    id: 'isonychia-slate', commonName: 'Slate Drake', sciName: 'Isonychia bicolor',
    order: 'Ephemeroptera', family: 'Isonychiidae', sizeRange: [10, 14],
    keyAttributes: { tails: 3, gills: 'lamellae', bodyShape: 'robust', bodyColor: ['dark-brown', 'mahogany', 'black'], mouthparts: 'active filter-feeder' },
    habitat: ['fast riffles', 'rocky runs', 'seams below rapids'],
    monthsActiveByRegion: regionMonths([5, 6, 7, 8, 9], [5, 6, 7, 8, 9], [6, 7, 8]),
    notes: 'Strong summer hatch on the Hiwassee. Fast-swimming nymph — fish them with motion, not dead drift.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America', 'BugGuide.net Isonychiidae (verify officially)'],
  }),
  taxon({
    id: 'heptagenia-march-brown', commonName: 'March Brown', sciName: 'Stenonema vicarium',
    order: 'Ephemeroptera', family: 'Heptageniidae', sizeRange: [10, 14],
    keyAttributes: { tails: 3, gills: 'lamellae', bodyShape: 'robust', bodyColor: ['brown', 'tan', 'mottled'], mouthparts: 'grazer / scraper' },
    habitat: ['fast riffles', 'boulder gardens', 'cobble bars'],
    monthsActiveByRegion: regionMonths([4, 5, 6], [4, 5, 6], [4, 5]),
    notes: 'Flat-headed clinger mayfly; the mottled legs and broad head separate it from the Isonychia.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America'],
  }),
  taxon({
    id: 'hydropsyche-caddis', commonName: 'Net-Spinning Caddis', sciName: 'Hydropsyche spp.',
    order: 'Trichoptera', family: 'Hydropsychidae', sizeRange: [12, 18],
    keyAttributes: { tails: 2, gills: 'filaments', bodyShape: 'robust', bodyColor: ['tan', 'olive', 'cream'], mouthparts: 'net-spinning filter-feeder' },
    habitat: ['riffles', 'current seams', 'below dams'],
    monthsActiveByRegion: regionMonths([4, 5, 6, 7, 8, 9], [4, 5, 6, 7, 8, 9], [4, 5, 6, 7, 8, 9]),
    notes: 'The long spring–summer caddis season on the Hiwassee. Look for tethered cases under cobbles.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America', 'BugGuide.net Hydropsychidae (verify officially)'],
  }),
  taxon({
    id: 'rhyacophila-green-sedge', commonName: 'Green Sedge Caddis', sciName: 'Rhyacophila fuscula',
    order: 'Trichoptera', family: 'Rhyacophilidae', sizeRange: [10, 16],
    keyAttributes: { tails: 2, gills: 'filaments', bodyShape: 'robust', bodyColor: ['green', 'bright-green'], mouthparts: 'free-living predator' },
    habitat: ['fast oxygenated riffles', 'steep runs'],
    monthsActiveByRegion: regionMonths([4, 5, 6], [3, 4, 5, 6], [4, 5]),
    notes: 'Bright-green free-living larva with no case — a dead giveaway when you flip cobble in spring.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America'],
  }),
  taxon({
    id: 'chironomid-midge', commonName: 'Midge Larva', sciName: 'Chironomidae spp.',
    order: 'Diptera', family: 'Chironomidae', sizeRange: [18, 26],
    keyAttributes: { tails: 2, gills: 'none', bodyShape: 'slender', bodyColor: ['red', 'cream', 'black', 'olive'], mouthparts: 'collector-gatherer' },
    habitat: ['slow pools', 'weedy backwaters', 'tailout silt'],
    monthsActiveByRegion: regionMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    notes: 'Year-round trout food in every tailwater. Blood-red "bloodworms" live in the silt of slow pools.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America', 'BugGuide.net Chironomidae (verify officially)'],
  }),
  taxon({
    id: 'gammarus-scud', commonName: 'Scud', sciName: 'Gammarus fasciatus',
    order: 'Amphipoda', family: 'Gammaridae', sizeRange: [12, 20],
    keyAttributes: { tails: 3, gills: 'lamellae', bodyShape: 'robust', bodyColor: ['olive', 'gray', 'translucent', 'pink'], mouthparts: 'scavenger' },
    habitat: ['weedy runs', 'spring-fed margins', 'slow pools'],
    monthsActiveByRegion: regionMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 10, 11, 12]),
    notes: 'Freshwater shrimp that scull sideways. Orange or pink tint often means the scud is dead — trout still eat them.',
    sources: ['Pennak — Freshwater Invertebrates of the United States', 'Troutnut.com Amphipoda (verify officially)'],
  }),
  taxon({
    id: 'caecidotea-sowbug', commonName: 'Sowbug', sciName: 'Caecidotea spp.',
    order: 'Isopoda', family: 'Asellidae', sizeRange: [12, 20],
    keyAttributes: { tails: 2, gills: 'lamellae', bodyShape: 'robust', bodyColor: ['tan', 'gray', 'cream'], mouthparts: 'scavenger' },
    habitat: ['weedy pools', 'slow margins', 'detritus banks'],
    monthsActiveByRegion: regionMonths([1, 2, 3, 4, 10, 11, 12], [4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 10, 11, 12]),
    notes: 'Flat, hump-backed crustacean common in fertile tailwaters; fish them deep and slow.',
    sources: ['Pennak — Freshwater Invertebrates of the United States'],
  }),
  taxon({
    id: 'pteronarcys-giant-stone', commonName: 'Giant Black Stonefly', sciName: 'Pteronarcys proteus',
    order: 'Plecoptera', family: 'Pteronarcyidae', sizeRange: [4, 10],
    keyAttributes: { tails: 2, gills: 'filaments', bodyShape: 'robust', bodyColor: ['black', 'dark-brown'], mouthparts: 'shredder' },
    habitat: ['clean riffles', 'under cobble', 'woody debris'],
    monthsActiveByRegion: regionMonths([4, 5, 6], [3, 4, 5], [4, 5]),
    notes: 'Salmonfly-sized rubber-legs bait. Nymphs wander toward the banks before the spring hatch.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America', 'BugGuide.net Pteronarcyidae (verify officially)'],
  }),
  taxon({
    id: 'acroneuria-golden-stone', commonName: 'Golden Stone', sciName: 'Acroneuria abnormis',
    order: 'Plecoptera', family: 'Perlidae', sizeRange: [8, 14],
    keyAttributes: { tails: 2, gills: 'filaments', bodyShape: 'robust', bodyColor: ['golden-brown', 'tan', 'yellow'], mouthparts: 'ambush predator' },
    habitat: ['boulder runs', 'fast riffles', 'deep seams'],
    monthsActiveByRegion: regionMonths([5, 6, 7, 8, 9], [5, 6, 7, 8], [5, 6, 7, 8]),
    notes: 'Summer staple on the Hiwassee. Big nymphs fish well dead-drifted through boulder seams.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America'],
  }),
  taxon({
    id: 'tipula-cranefly', commonName: 'Crane Fly Larva', sciName: 'Tipula spp.',
    order: 'Diptera', family: 'Tipulidae', sizeRange: [8, 16],
    keyAttributes: { tails: 2, gills: 'none', bodyShape: 'robust', bodyColor: ['tan', 'brown', 'gray'], mouthparts: 'shredder' },
    habitat: ['soft banks', 'silted pool tails', 'detritus beds'],
    monthsActiveByRegion: regionMonths([1, 2, 3, 4, 5, 9, 10, 11, 12], [2, 3, 4, 5, 9, 10, 11], [1, 2, 3, 4, 5, 10, 11, 12]),
    notes: 'Fat, leggy larvae in the silt. A olive woolly bugger stripped slowly is the honest stand-in.',
    sources: ['Merritt, Cummins & Berg — An Introduction to the Aquatic Insects of North America'],
  }),
];

// --------------------------------------------------------------- patterns ---

const pd = (p) => ({ ...p, license: 'public-domain' });
const patterns = [
  pd({ id: 'pheasant-tail-nymph', name: 'Pheasant Tail Nymph', type: 'nymph', imitates: ['baetis-bwo', 'ephemerella-sulphur', 'heptagenia-march-brown'], hookSizes: [12, 14, 16, 18, 20, 22], difficulty: 2, materials: ['pheasant tail fibres', 'copper wire', 'peacock herl', 'flex cement'], notes: 'The default mayfly nymph in Tennessee tailwaters. Fish it deep under a strike indicator or as the dropper off a dry.' }),
  pd({ id: 'rs2', name: 'RS2', type: 'emerger', imitates: ['baetis-bwo', 'chironomid-midge'], hookSizes: [16, 18, 20, 22, 24], difficulty: 2, materials: ['grey microfibetts', 'olive dubbing', 'white antron'], notes: 'Trailing-shuck emerger that excels during BWO and midge emergences; fish it in the film behind a dry.', license: 'attributed', attribution: 'Designed by Rim Chung; tie to the original recipe and credit the designer.' }),
  pd({ id: 'sulphur-parachute', name: 'Sulphur Parachute Dun', type: 'dry', imitates: ['ephemerella-sulphur'], hookSizes: [14, 16, 18], difficulty: 3, materials: ['sulphur super fine dubbing', 'white poly yarn post', 'grizzly hackle'], notes: 'Rides low and visible; the go-to dun pattern on South Holston afternoon hatches.' }),
  pd({ id: 'spent-sulphur-spinner', name: 'Spent Sulphur Spinner', type: 'spinner', imitates: ['ephemerella-sulphur'], hookSizes: [14, 16, 18], difficulty: 3, materials: ['cream spinner poly', 'grizzly hackle', 'sulphur rust antron'], notes: 'Dusk spinner fall on pool tails; look for the mating flight over the riffle.' }),
  pd({ id: 'blue-winged-olive-dun', name: 'Blue-Winged Olive Parachute', type: 'dry', imitates: ['baetis-bwo'], hookSizes: [16, 18, 20, 22], difficulty: 2, materials: ['olive dubbing', 'white poly post', 'blue dun hackle'], notes: 'Overcast-day bread and butter; keep two sizes on you — the hatch often runs small.' }),
  pd({ id: 'slate-drake-dun', name: 'Slate Drake Parachute', type: 'dry', imitates: ['isonychia-slate'], hookSizes: [10, 12, 14], difficulty: 3, materials: ['slate poly', 'brown biot body', 'grizzly hackle'], notes: 'Big summer mayfly on the Hiwassee; skitter it slightly at the end of the drift.' }),
  pd({ id: 'march-brown-soft-hackle', name: 'March Brown Soft Hackle', type: 'wet', imitates: ['heptagenia-march-brown', 'ephemerella-sulphur'], hookSizes: [10, 12, 14], difficulty: 2, materials: ['speckled hen hackle', 'mottled turkey tail', 'hare ear dubbing'], notes: 'Swing it through riffle tails during the March Brown hatch; take is often a swirl.' }),
  pd({ id: 'elk-hair-caddis', name: 'Elk Hair Caddis', type: 'dry', imitates: ['hydropsyche-caddis', 'rhyacophila-green-sedge'], hookSizes: [10, 12, 14, 16, 18], difficulty: 2, materials: ['elk hair', 'brown rooster hackle', 'olive or tan dubbing'], notes: 'The classic caddis adult — skittering it at dusk triggers violent takes on the Hiwassee.' }),
  pd({ id: 'green-rock-worm', name: 'Green Rock Worm', type: 'nymph', imitates: ['rhyacophila-green-sedge', 'hydropsyche-caddis'], hookSizes: [10, 12, 14, 16], difficulty: 2, materials: ['bright green dubbing loop', 'partridge hackle', 'lead-free wire'], notes: 'Free-living caddis larva imitation for spring riffles; dead-drift then let it rise.' }),
  pd({ id: 'zebra-midge', name: 'Zebra Midge', type: 'nymph', imitates: ['chironomid-midge'], hookSizes: [16, 18, 20, 22, 24], difficulty: 1, materials: ['black thread', 'silver wire', 'bead head optional'], notes: 'Two materials, one deadly pattern. Fish it under an indicator on slow winter pools.' }),
  pd({ id: 'griffiths-gnat', name: "Griffith's Gnat", type: 'dry', imitates: ['chironomid-midge'], hookSizes: [18, 20, 22, 24], difficulty: 1, materials: ['grizzly hackle', 'peacock herl'], notes: 'Cluster-of-midges imitation; perfect when trout are sipping in flat glides.' }),
  pd({ id: 'olive-scud', name: 'Olive Scud', type: 'nymph', imitates: ['gammarus-scud'], hookSizes: [12, 14, 16, 18], difficulty: 1, materials: ['olive sow-scud dubbing', 'clear shellback', 'grizzly hackle tip'], notes: 'Dead-drift through weed seams; add a slight twitch every few seconds.' }),
  pd({ id: 'gray-sowbug', name: 'Gray Sowbug', type: 'nymph', imitates: ['caecidotea-sowbug'], hookSizes: [14, 16, 18], difficulty: 1, materials: ['gray sowbug dubbing', 'scud shellback', 'midge flash rib'], notes: 'A Middle-Tennessee winter staple in the silt-weed pools of the Caney Fork.' }),
  pd({ id: 'pats-rubber-legs', name: "Pat's Rubber Legs", type: 'nymph', imitates: ['pteronarcys-giant-stone', 'acroneuria-golden-stone', 'tipula-cranefly'], hookSizes: [4, 6, 8, 10], difficulty: 1, materials: ['variegated chenille', 'brown or black rubber legs', 'lead-free wire'], notes: 'Big stonefly bait for spring; heavy body gets it down fast in boulder runs.' }),
  pd({ id: 'golden-stone-nymph', name: 'Golden Stone Nymph', type: 'nymph', imitates: ['acroneuria-golden-stone'], hookSizes: [8, 10, 12, 14], difficulty: 3, materials: ['golden-yellow dubbing', 'goose biots', 'mottled center tail', 'black bead'], notes: 'Boulder-seam searcher for summer golden stones; fish it as your lead fly.' }),
  pd({ id: 'stimulator', name: 'Stimulator', type: 'dry', imitates: ['acroneuria-golden-stone', 'pteronarcys-giant-stone'], hookSizes: [6, 8, 10, 12], difficulty: 3, materials: ['orange or yellow elk', 'brown hackle', 'elk wing'], notes: 'High-floating adult stonefly/attractor; also works as a big dry-dropper indicator.' }),
  pd({ id: 'woolly-bugger', name: 'Woolly Bugger', type: 'streamer', imitates: ['tipula-cranefly'], hookSizes: [6, 8, 10, 12], difficulty: 1, materials: ['olive or black marabou', 'grizzly hackle', 'chenille body'], notes: 'Stripped slowly along soft banks it reads as a crane fly larva, leech, or sculpin.' }),
];

// --------------------------------------------------------------- streams/conditions ---

function readingsFor(streamId, gaugeId, plan) {
  return plan.map(([cfs, heightFt, tempC, mins]) => {
    const reading = { gaugeId, timestamp: minutesAgo(mins) };
    if (cfs !== null) reading.cfs = cfs;
    if (heightFt !== null) reading.heightFt = heightFt;
    if (tempC !== null) reading.tempC = tempC;
    return reading;
  });
}

const conditionsPlans = {
  'south-holston-river': [[245, 2.9, 9.4, 32], [268, 3.0, 9.6, 92], [250, 3.1, 9.7, 152]],
  'watauga-river': [[1520, 6.8, 8.2, 28], [1490, 6.7, 8.3, 88]],
  'hiwassee-river': [[480, 3.4, 11.8, 41], [520, 3.6, 12.0, 101], [560, 3.7, 12.1, 161]],
  'caney-fork-river': [[360, 4.1, 10.5, 22], [340, 4.0, 10.6, 82]],
  'elk-river': [[145, 2.2, 25.4, 36], [150, 2.2, 25.2, 96]],
  'holston-river': [[null, 6.9, 12.4, 47], [null, 7.0, 12.5, 107]],
  'clinch-river': [[85, 1.9, 13.6, 55], [90, 2.0, 13.5, 115], [95, 2.0, 13.4, 175]],
  'duck-river': [[130, 2.8, 14.2, 63], [125, 2.8, 14.3, 123]],
};

const conditions = streams.map((stream) => {
  const readings = readingsFor(stream.id, stream.gaugeIds[0], conditionsPlans[stream.id]);
  const score = scoreConditions(stream, readings);
  return {
    streamId: stream.id,
    readings,
    score,
    fetchedAt: minutesAgo(32),
    nextExpectedUpdate: minutesAgo(-28),
  };
});

// ----------------------------------------------------------------- stocking -

const stockingEvents = [
  ['twra-sullivan-1', 'South Holston River', 'Sullivan', 'rainbow', 3500, 6],
  ['twra-sullivan-2', 'South Holston River', 'Sullivan', 'brown', 900, 20],
  ['twra-carter-1', 'Watauga River', 'Carter', 'rainbow', 2800, 7],
  ['twra-carter-2', 'Watauga River', 'Carter', 'brook', 500, 21],
  ['twra-polk-1', 'Hiwassee River', 'Polk', 'rainbow', 4000, 5],
  ['twra-polk-2', 'Hiwassee River', 'Polk', 'brown', 1200, 19],
  ['twra-putnam-1', 'Caney Fork River', 'Putnam', 'rainbow', 5200, 4],
  ['twra-putnam-2', 'Caney Fork River', 'Putnam', 'brown', 1500, 18],
  ['twra-franklin-1', 'Elk River', 'Franklin', 'rainbow', 2100, 8],
  ['twra-franklin-2', 'Elk River', 'Franklin', 'cutbow', 600, 22],
  ['twra-grainger-1', 'Clinch River', 'Grainger', 'rainbow', 3000, 9],
  ['twra-grainger-2', 'Clinch River', 'Grainger', 'brown', 800, 23],
  ['twra-hamilton-1', 'Holston River', 'Hawkins', 'rainbow', 2600, 10],
  ['twra-coffee-1', 'Duck River', 'Coffee', 'rainbow', 1800, 12],
  ['twra-coffee-2', 'Duck River', 'Coffee', 'brook', 400, 26],
];

const stocking = stockingEvents.map(([id, streamName, county, species, count, days]) => ({
  id,
  stateId: 'TN',
  streamName,
  county,
  species,
  count,
  date: daysAgoIso(days),
  sourceUrl: 'https://www.tn.gov/twra/fishing/stocking.html',
  fetchedAt: minutesAgo(120),
}));

// ------------------------------------------------------------------- shops --

const shop = (id, name, town, slug) => ({
  id, name, stateId: 'TN', town,
  websiteUrl: `https://example.com/${slug}`,
  reportsEnabled: true,
});

const shops = [
  shop('high-country-fly', 'High Country Fly Shop', 'Johnson City', 'high-country-fly-shop'),
  shop('tailwater-outfitters', 'Tailwater Outfitters', 'Knoxville', 'tailwater-outfitters'),
  shop('hiwassee-trading', 'Hiwassee Trading Company', 'Reliance', 'hiwassee-trading-company'),
  shop('caney-fork-fly', 'Caney Fork Fly Shop', 'Smithville', 'caney-fork-fly-shop'),
  shop('elk-river-anglers', 'Elk River Anglers', 'Lynchburg', 'elk-river-anglers'),
  shop('chattanooga-fly-goods', 'Chattanooga Fly Goods', 'Chattanooga', 'chattanooga-fly-goods'),
];

const reports = [
  {
    id: 'report-south-holston-week32',
    shopId: 'high-country-fly',
    shopName: 'High Country Fly Shop',
    streamId: 'south-holston-river',
    date: daysAgoIso(3),
    body: 'Sulphurs came off strong from 2 to 5 pm between the Weir and Rock Creek. Size 16 parachute duns and pheasant tails in 18 fished well; generation has been light in the afternoons.',
    hotPatterns: [{ patternId: 'sulphur-parachute', hookSize: 16 }, { patternId: 'pheasant-tail-nymph', hookSize: 18 }],
    attributionUrl: 'https://example.com/high-country-fly-shop',
    publishedAt: minutesAgo(3 * 24 * 60 + 40),
  },
  {
    id: 'report-hiwassee-week32',
    shopId: 'hiwassee-trading',
    shopName: 'Hiwassee Trading Company',
    streamId: 'hiwassee-river',
    date: daysAgoIso(5),
    body: 'Golden stone nymphs in the boulder field above Reliance are producing before noon. Afternoon caddis swings with an elk hair are still taking fish when one generator runs.',
    hotPatterns: [{ patternId: 'golden-stone-nymph', hookSize: 10 }, { patternId: 'elk-hair-caddis', hookSize: 14 }],
    attributionUrl: 'https://example.com/hiwassee-trading-company',
    publishedAt: minutesAgo(5 * 24 * 60 + 120),
  },
  {
    id: 'report-caney-week33',
    shopId: 'caney-fork-fly',
    shopName: 'Caney Fork Fly Shop',
    streamId: 'caney-fork-river',
    date: daysAgoIso(2),
    body: 'Gray sowbugs around the silt weeds below the dam are the most consistent bite. Zebra midges are the follow-up when the surface is quiet.',
    hotPatterns: [{ patternId: 'gray-sowbug', hookSize: 16 }, { patternId: 'zebra-midge', hookSize: 20 }],
    attributionUrl: 'https://example.com/caney-fork-fly-shop',
    publishedAt: minutesAgo(2 * 24 * 60 + 60),
  },
  {
    id: 'report-watauga-week33',
    shopId: 'tailwater-outfitters',
    shopName: 'Tailwater Outfitters',
    streamId: 'watauga-river',
    date: daysAgoIso(6),
    body: 'High generation all week — drift boats only. Blue-winged olives in the rain on Saturday; size 20 RS2 behind a stonefly got the eat of the day.',
    hotPatterns: [{ patternId: 'rs2', hookSize: 20 }, { patternId: 'blue-winged-olive-dun', hookSize: 20 }],
    attributionUrl: 'https://example.com/tailwater-outfitters',
    publishedAt: minutesAgo(6 * 24 * 60 + 200),
  },
];

// ------------------------------------------------------------- hatch charts -

// stage/time-of-day/abundance templates per taxon, with the patterns to suggest.
const hatchTemplates = {
  'baetis-bwo': [
    { stage: 'nymph', timeOfDay: 'am', patterns: ['pheasant-tail-nymph', 'rs2'] },
    { stage: 'dun', timeOfDay: 'midday', patterns: ['blue-winged-olive-dun'] },
    { stage: 'spinner', timeOfDay: 'evening', patterns: ['blue-winged-olive-dun'] },
  ],
  'ephemerella-sulphur': [
    { stage: 'nymph', timeOfDay: 'am', patterns: ['pheasant-tail-nymph'] },
    { stage: 'dun', timeOfDay: 'midday', patterns: ['sulphur-parachute'] },
    { stage: 'spinner', timeOfDay: 'evening', patterns: ['spent-sulphur-spinner'] },
  ],
  'isonychia-slate': [
    { stage: 'nymph', timeOfDay: 'am', patterns: ['golden-stone-nymph'] },
    { stage: 'dun', timeOfDay: 'evening', patterns: ['slate-drake-dun'] },
  ],
  'heptagenia-march-brown': [
    { stage: 'nymph', timeOfDay: 'am', patterns: ['pheasant-tail-nymph'] },
    { stage: 'dun', timeOfDay: 'midday', patterns: ['march-brown-soft-hackle'] },
  ],
  'hydropsyche-caddis': [
    { stage: 'larva', timeOfDay: 'am', patterns: ['green-rock-worm'] },
    { stage: 'adult', timeOfDay: 'evening', patterns: ['elk-hair-caddis'] },
  ],
  'rhyacophila-green-sedge': [
    { stage: 'larva', timeOfDay: 'am', patterns: ['green-rock-worm'] },
    { stage: 'adult', timeOfDay: 'midday', patterns: ['elk-hair-caddis'] },
  ],
  'chironomid-midge': [
    { stage: 'larva', timeOfDay: 'am', patterns: ['zebra-midge'] },
    { stage: 'adult', timeOfDay: 'midday', patterns: ['griffiths-gnat'] },
  ],
  'gammarus-scud': [{ stage: 'adult', timeOfDay: 'am', patterns: ['olive-scud'] }],
  'caecidotea-sowbug': [{ stage: 'adult', timeOfDay: 'am', patterns: ['gray-sowbug'] }],
  'pteronarcys-giant-stone': [
    { stage: 'nymph', timeOfDay: 'am', patterns: ['pats-rubber-legs'] },
    { stage: 'adult', timeOfDay: 'evening', patterns: ['stimulator'] },
  ],
  'acroneuria-golden-stone': [
    { stage: 'nymph', timeOfDay: 'am', patterns: ['golden-stone-nymph', 'pats-rubber-legs'] },
    { stage: 'adult', timeOfDay: 'evening', patterns: ['stimulator'] },
  ],
  'tipula-cranefly': [
    { stage: 'larva', timeOfDay: 'am', patterns: ['woolly-bugger'] },
    { stage: 'adult', timeOfDay: 'midday', patterns: ['stimulator'] },
  ],
};

// core months get abundance 4–5; the shoulders of each taxon's season get 2–3.
const coreMonths = {
  'baetis-bwo': [4, 5, 10],
  'ephemerella-sulphur': [5],
  'isonychia-slate': [6, 7],
  'heptagenia-march-brown': [5],
  'hydropsyche-caddis': [5, 6, 7],
  'rhyacophila-green-sedge': [4, 5],
  'chironomid-midge': [1, 2, 3, 11, 12],
  'gammarus-scud': [3, 4, 11],
  'caecidotea-sowbug': [2, 3, 11],
  'pteronarcys-giant-stone': [4, 5],
  'acroneuria-golden-stone': [6, 7],
  'tipula-cranefly': [3, 4, 10],
};

const hatchCharts = [];
for (const taxonEntry of taxa) {
  for (const [regionId, months] of Object.entries(taxonEntry.monthsActiveByRegion)) {
    for (const month of months) {
      const abundance = coreMonths[taxonEntry.id]?.includes(month) ? 4 : 2;
      for (const tpl of hatchTemplates[taxonEntry.id]) {
        hatchCharts.push({
          regionId,
          month,
          entries: [{
            taxonId: taxonEntry.id,
            stage: tpl.stage,
            timeOfDay: tpl.timeOfDay,
            abundance: tpl.stage === 'adult' || tpl.stage === 'dun' ? abundance : Math.max(1, abundance - 1),
            patterns: tpl.patterns,
          }],
        });
      }
    }
  }
}

// merge per (region, month) into single HatchChart files
const chartsByRegionMonth = new Map();
for (const chunk of hatchCharts) {
  const key = `${chunk.regionId}/${chunk.month}`;
  if (!chartsByRegionMonth.has(key)) {
    chartsByRegionMonth.set(key, { regionId: chunk.regionId, month: chunk.month, entries: [] });
  }
  chartsByRegionMonth.get(key).entries.push(...chunk.entries);
}

// -------------------------------------------------------------- write + gate -

function writeJson(relPath, value) {
  const path = out(relPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

let written = 0;

function validate(label, schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Fixture ${label} violates the frozen contracts: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
}

validate('streams', StreamSchema.array(), streams);
streams.forEach((s, i) => validate(`streams[${i}]`, StreamSchema, s));
validate('conditions', ConditionSnapshotSchema.array(), conditions);
validate('stocking', StockingEventSchema.array(), stocking);
validate('shops', ShopSchema.array(), shops);
validate('reports', ShopReportSchema.array(), reports);
validate('taxa', BugTaxonSchema.array(), taxa);
validate('patterns', FlyPatternSchema.array(), patterns);
for (const chart of chartsByRegionMonth.values()) {
  validate(`hatch/${chart.regionId}/${chart.month}`, HatchChartSchema, chart);
}

if (existsSync(out('.'))) {
  rmSync(out('.'), { recursive: true, force: true });
}

writeJson('v1/streams', streams);
writeJson('v1/conditions/latest.json', conditions);
writeJson('v1/stocking/TN.json', stocking);
writeJson('v1/shops/TN.json', shops);
writeJson('v1/reports/recent.json', reports);
writeJson('content/taxa.json', taxa);
writeJson('content/patterns.json', patterns);
for (const chart of chartsByRegionMonth.values()) {
  writeJson(`v1/hatch/${chart.regionId}/${chart.month}.json`, chart);
}
written = chartsByRegionMonth.size + 7;

console.log(`fixtures: wrote ${written} files → apps/web/fixtures/data`);
console.log(`fixtures: ${streams.length} streams · ${taxa.length} taxa · ${patterns.length} patterns · ${chartsByRegionMonth.size} hatch charts · ${stocking.length} stocking events · ${conditions.length} condition snapshots`);
console.log('fixtures: all files validated against @trout/contracts schemas ✓');
