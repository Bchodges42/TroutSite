import type {
  BugObservation,
  BugTaxon,
  ConditionSnapshot,
  FlyPattern,
  GaugeReading,
  HatchChart,
  Shop,
  ShopReport,
  StockingEvent,
  Stream,
} from '../src/index.js';

export function makeStream(overrides: Partial<Stream> = {}): Stream {
  return {
    id: 'guadalupe-river-tailrace',
    name: 'Guadalupe River (Tailrace)',
    stateId: 'TX',
    waterbodyType: 'tailrace',
    regionId: 'tx-hill-country',
    gaugeIds: ['08155500'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
    notes: 'Tailrace below Canyon Dam.',
    officialSources: [{ label: 'TPWD stocking schedule', url: 'https://tpwd.texas.gov' }],
    ...overrides,
  };
}

export function makeReading(overrides: Partial<GaugeReading> = {}): GaugeReading {
  return {
    gaugeId: '08155500',
    cfs: 250,
    heightFt: 2.5,
    tempC: 15,
    timestamp: '2026-04-01T14:00Z',
    ...overrides,
  };
}

export function makeTaxon(overrides: Partial<BugTaxon> = {}): BugTaxon {
  return {
    id: 'baetis-tricaudatus',
    commonName: 'Blue-Winged Olive',
    sciName: 'Baetis tricaudatus',
    order: 'Ephemeroptera',
    family: 'Baetidae',
    sizeRange: [16, 22],
    keyAttributes: {
      tails: 3,
      gills: 'lamellae',
      bodyShape: 'slender',
      bodyColor: ['olive', 'gray'],
      mouthparts: 'chewing',
    },
    habitat: ['riffles', 'runs'],
    monthsActiveByRegion: { 'tx-hill-country': [1, 2, 3, 4, 10, 11, 12] },
    notes: 'Hatches on cloudy, cool days.',
    sources: ['https://www.troutnut.com/hatch/47'],
    ...overrides,
  };
}

export function makePattern(overrides: Partial<FlyPattern> = {}): FlyPattern {
  return {
    id: 'pheasant-tail-nymph',
    name: 'Pheasant Tail Nymph',
    type: 'nymph',
    imitates: ['baetis-tricaudatus'],
    hookSizes: [16, 18, 20],
    difficulty: 2,
    materials: ['pheasant tail fibers', 'copper wire'],
    notes: '',
    license: 'public-domain',
    ...overrides,
  };
}

export function makeChart(overrides: Partial<HatchChart> = {}): HatchChart {
  return {
    regionId: 'tx-hill-country',
    month: 4,
    entries: [
      {
        taxonId: 'baetis-tricaudatus',
        stage: 'dun',
        timeOfDay: 'midday',
        abundance: 3,
        patterns: ['blue-winged-olive-dun'],
      },
    ],
    ...overrides,
  };
}

export function makeObservation(overrides: Partial<BugObservation> = {}): BugObservation {
  return {
    sizeHook: 18,
    bodyColor: 'olive',
    tails: 3,
    gills: 'lamellae',
    bodyShape: 'slender',
    month: 4,
    regionId: 'tx-hill-country',
    ...overrides,
  };
}

export function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 'guadalupe-trout',
    name: 'Guadalupe Trout Fly Shop',
    stateId: 'TX',
    town: 'New Braunfels',
    websiteUrl: 'https://example.com',
    reportsEnabled: true,
    ...overrides,
  };
}

export function makeReport(overrides: Partial<ShopReport> = {}): ShopReport {
  return {
    id: 'report-1',
    shopId: 'guadalupe-trout',
    shopName: 'Guadalupe Trout Fly Shop',
    streamId: 'guadalupe-river-tailrace',
    date: '2026-04-01',
    body: 'BWOs came off at noon below the dam.',
    hotPatterns: [{ patternId: 'pheasant-tail-nymph', hookSize: 18 }],
    attributionUrl: 'https://example.com/reports',
    publishedAt: '2026-04-01T18:00Z',
    ...overrides,
  };
}

export function makeStocking(overrides: Partial<StockingEvent> = {}): StockingEvent {
  return {
    id: 'tx-2026-04-01-guadalupe',
    stateId: 'TX',
    streamName: 'Guadalupe River',
    county: 'Comal',
    species: 'rainbow',
    count: 1000,
    date: '2026-04-01',
    sourceUrl: 'https://tpwd.texas.gov/stocking',
    fetchedAt: '2026-04-01T06:00Z',
    ...overrides,
  };
}

export function makeSnapshot(overrides: Partial<ConditionSnapshot> = {}): ConditionSnapshot {
  return {
    streamId: 'guadalupe-river-tailrace',
    readings: [makeReading()],
    score: { value: 82, reasons: ['Flow within ideal range.'] },
    fetchedAt: '2026-04-01T14:05Z',
    nextExpectedUpdate: '2026-04-01T15:05Z',
    ...overrides,
  };
}
