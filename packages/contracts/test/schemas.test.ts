import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  BugObservationSchema,
  BugTaxonSchema,
  ConditionSnapshotSchema,
  FlyPatternSchema,
  GaugeReadingSchema,
  HatchChartSchema,
  ShopReportSchema,
  ShopSchema,
  StockingEventSchema,
  StreamSchema,
} from '../src/index.js';
import {
  makeChart,
  makeObservation,
  makePattern,
  makeReading,
  makeReport,
  makeShop,
  makeStocking,
  makeStream,
  makeSnapshot,
  makeTaxon,
} from './helpers.js';

describe('StreamSchema', () => {
  it('accepts a valid stream', () => {
    const stream = makeStream();
    expect(StreamSchema.parse(stream)).toEqual(stream);
  });

  it('allows notes to be omitted', () => {
    const { notes: _notes, ...rest } = makeStream();
    expect(StreamSchema.parse(rest)).toBeDefined();
  });

  it('allows the still-water waterbodyTypes (lake, pond) the catalog ships', () => {
    // West TN put-and-take ponds and the reference waterbodies made these
    // first-class contract types.
    expect(StreamSchema.parse(makeStream({ waterbodyType: 'lake' as never })).waterbodyType).toBe('lake');
    expect(StreamSchema.parse(makeStream({ waterbodyType: 'pond' as never })).waterbodyType).toBe('pond');
  });

  it('rejects an unknown waterbodyType', () => {
    // 'reservoir'/'swamp' were never valid; 'lake'/'pond' joined the enum with
    // the TWRA winter put-and-take waters (da80558) and parse above.
    expect(() => StreamSchema.parse(makeStream({ waterbodyType: 'reservoir' as never }))).toThrow(ZodError);
    expect(() => StreamSchema.parse(makeStream({ waterbodyType: 'swamp' as never }))).toThrow(ZodError);
  });

  it('rejects an idealFlow range with min > max', () => {
    expect(() =>
      StreamSchema.parse(makeStream({ idealFlow: [{ min: 400, max: 100, unit: 'cfs' }] })),
    ).toThrow(ZodError);
  });

  it('rejects a lowercase stateId', () => {
    expect(() => StreamSchema.parse(makeStream({ stateId: 'tx' }))).toThrow(ZodError);
  });

  it('rejects an official source with a non-URL', () => {
    expect(() =>
      StreamSchema.parse(makeStream({ officialSources: [{ label: 'x', url: 'not-a-url' }] })),
    ).toThrow(ZodError);
  });

  it('requires hydrography identity for line waters', () => {
    const { hydroIdentity: _identity, ...withoutIdentity } = makeStream();
    expect(() => StreamSchema.parse(withoutIdentity)).toThrow(/hydroIdentity/);
  });

  it('preserves leading-zero ids and rejects duplicate identity values', () => {
    const stream = makeStream({ hydroIdentity: { gnisIds: ['01279516'], huc8s: ['05130108'], counties: ['Van Buren'] } });
    expect(StreamSchema.parse(stream).hydroIdentity).toEqual(stream.hydroIdentity);
    expect(() => StreamSchema.parse({ ...stream, hydroIdentity: { ...stream.hydroIdentity!, gnisIds: ['01279516', '01279516'] } })).toThrow(/duplicates/);
    expect(() => StreamSchema.parse({ ...stream, hydroIdentity: { ...stream.hydroIdentity!, huc8s: ['05130108', '05130108'] } })).toThrow(/duplicates/);
  });

  it('does not require hydrography identity for still water', () => {
    const { hydroIdentity: _identity, ...stillWater } = makeStream({ waterbodyType: 'pond' as never });
    expect(StreamSchema.parse(stillWater).waterbodyType).toBe('pond');
  });
});

describe('GaugeReadingSchema', () => {
  it('accepts a full reading', () => {
    expect(GaugeReadingSchema.parse(makeReading())).toBeDefined();
  });

  it('accepts a reading with all measured params missing', () => {
    expect(() =>
      GaugeReadingSchema.parse({ gaugeId: '08155500', timestamp: '2026-04-01T14:00Z' }),
    ).not.toThrow();
  });

  it('rejects a malformed timestamp', () => {
    expect(() => GaugeReadingSchema.parse(makeReading({ timestamp: 'yesterday' }))).toThrow(ZodError);
  });

  it('rejects a non-numeric cfs', () => {
    expect(() => GaugeReadingSchema.parse(makeReading({ cfs: '250' as never }))).toThrow(ZodError);
  });
});

describe('ConditionSnapshotSchema', () => {
  it('accepts a valid snapshot', () => {
    expect(ConditionSnapshotSchema.parse(makeSnapshot())).toBeDefined();
  });

  it('accepts a score at the 0 and 100 boundaries', () => {
    expect(() => ConditionSnapshotSchema.parse(makeSnapshot({ score: { value: 0, reasons: [] } }))).not.toThrow();
    expect(() =>
      ConditionSnapshotSchema.parse(makeSnapshot({ score: { value: 100, reasons: ['perfect'] } })),
    ).not.toThrow();
  });

  it('rejects a score above 100', () => {
    expect(() => ConditionSnapshotSchema.parse(makeSnapshot({ score: { value: 101, reasons: [] } }))).toThrow(
      ZodError,
    );
  });

  it('rejects a non-integer score', () => {
    expect(() => ConditionSnapshotSchema.parse(makeSnapshot({ score: { value: 50.5, reasons: [] } }))).toThrow(
      ZodError,
    );
  });
});

describe('StockingEventSchema', () => {
  it('accepts a valid event', () => {
    expect(StockingEventSchema.parse(makeStocking())).toBeDefined();
  });

  it('allows county and count to be omitted', () => {
    const { county: _c, count: _n, ...rest } = makeStocking();
    expect(StockingEventSchema.parse(rest)).toBeDefined();
  });

  it('rejects an unknown species', () => {
    expect(() => StockingEventSchema.parse(makeStocking({ species: 'steelhead' as never }))).toThrow(ZodError);
  });

  it('rejects a non-ISO date', () => {
    expect(() => StockingEventSchema.parse(makeStocking({ date: '04/01/2026' }))).toThrow(ZodError);
  });

  it('rejects a non-URL sourceUrl', () => {
    expect(() => StockingEventSchema.parse(makeStocking({ sourceUrl: 'tpwd page' }))).toThrow(ZodError);
  });

  it('rejects a negative count', () => {
    expect(() => StockingEventSchema.parse(makeStocking({ count: -5 }))).toThrow(ZodError);
  });
});

describe('BugTaxonSchema', () => {
  it('accepts a valid taxon', () => {
    expect(BugTaxonSchema.parse(makeTaxon())).toBeDefined();
  });

  it('rejects tails other than 2 or 3', () => {
    const t = makeTaxon();
    expect(() =>
      BugTaxonSchema.parse({ ...t, keyAttributes: { ...t.keyAttributes, tails: 4 } }),
    ).toThrow(ZodError);
  });

  it('rejects an unknown gills value', () => {
    const t = makeTaxon();
    expect(() =>
      BugTaxonSchema.parse({ ...t, keyAttributes: { ...t.keyAttributes, gills: 'scales' as never } }),
    ).toThrow(ZodError);
  });

  it('rejects an inverted sizeRange', () => {
    expect(() => BugTaxonSchema.parse(makeTaxon({ sizeRange: [22, 16] }))).toThrow(ZodError);
  });

  it('rejects a month outside 1-12', () => {
    expect(() => BugTaxonSchema.parse(makeTaxon({ monthsActiveByRegion: { 'tx-hill-country': [13] } }))).toThrow(
      ZodError,
    );
  });

  it('rejects an empty bodyColor list', () => {
    const t = makeTaxon();
    expect(() =>
      BugTaxonSchema.parse({ ...t, keyAttributes: { ...t.keyAttributes, bodyColor: [] } }),
    ).toThrow(ZodError);
  });

  it('requires at least one source (attribution culture)', () => {
    expect(() => BugTaxonSchema.parse(makeTaxon({ sources: [] }))).toThrow(ZodError);
  });
});

describe('FlyPatternSchema', () => {
  it('accepts a valid pattern', () => {
    expect(FlyPatternSchema.parse(makePattern())).toBeDefined();
  });

  it('rejects an unknown pattern type', () => {
    expect(() => FlyPatternSchema.parse(makePattern({ type: 'midge' as never }))).toThrow(ZodError);
  });

  it('rejects difficulty outside 1-5', () => {
    expect(() => FlyPatternSchema.parse(makePattern({ difficulty: 0 }))).toThrow(ZodError);
    expect(() => FlyPatternSchema.parse(makePattern({ difficulty: 6 }))).toThrow(ZodError);
  });

  it('rejects an unknown license', () => {
    expect(() => FlyPatternSchema.parse(makePattern({ license: 'cc-by' as never }))).toThrow(ZodError);
  });

  it('allows attribution to be omitted for attributed patterns', () => {
    expect(() => FlyPatternSchema.parse(makePattern({ license: 'attributed' }))).not.toThrow();
  });
});

describe('HatchChartSchema', () => {
  it('accepts a valid chart', () => {
    expect(HatchChartSchema.parse(makeChart())).toBeDefined();
  });

  it('rejects months outside 1-12', () => {
    expect(() => HatchChartSchema.parse(makeChart({ month: 0 }))).toThrow(ZodError);
    expect(() => HatchChartSchema.parse(makeChart({ month: 13 }))).toThrow(ZodError);
  });

  it('rejects abundance outside 1-5', () => {
    const chart = makeChart();
    expect(() =>
      HatchChartSchema.parse({ ...chart, entries: [{ ...chart.entries[0]!, abundance: 6 }] }),
    ).toThrow(ZodError);
  });

  it('rejects an unknown stage and timeOfDay', () => {
    const chart = makeChart();
    expect(() =>
      HatchChartSchema.parse({ ...chart, entries: [{ ...chart.entries[0]!, stage: 'pupa' as never }] }),
    ).toThrow(ZodError);
    expect(() =>
      HatchChartSchema.parse({ ...chart, entries: [{ ...chart.entries[0]!, timeOfDay: 'dawn' as never }] }),
    ).toThrow(ZodError);
  });
});

describe('ShopSchema', () => {
  it('accepts a valid shop', () => {
    expect(ShopSchema.parse(makeShop())).toBeDefined();
  });

  it('rejects a non-URL website', () => {
    expect(() => ShopSchema.parse(makeShop({ websiteUrl: 'example dot com' }))).toThrow(ZodError);
  });
});

describe('ShopReportSchema', () => {
  it('accepts a valid report', () => {
    expect(ShopReportSchema.parse(makeReport())).toBeDefined();
  });

  it('allows streamId to be omitted', () => {
    const { streamId: _s, ...rest } = makeReport();
    expect(ShopReportSchema.parse(rest)).toBeDefined();
  });

  it('rejects an empty body', () => {
    expect(() => ShopReportSchema.parse(makeReport({ body: '' }))).toThrow(ZodError);
  });

  it('rejects a non-URL attributionUrl', () => {
    expect(() => ShopReportSchema.parse(makeReport({ attributionUrl: 'not-a-url' }))).toThrow(ZodError);
  });

  it('accepts an optional https photoUrl and rejects http/invalid (contracts-v1.0.1)', () => {
    expect(ShopReportSchema.parse(makeReport({ photoUrl: 'https://example.com/photo.jpg' }))).
      toHaveProperty('photoUrl', 'https://example.com/photo.jpg');
    const { photoUrl: _p, ...withoutPhoto } = makeReport({ photoUrl: 'https://example.com/photo.jpg' });
    expect(ShopReportSchema.parse(withoutPhoto)).toBeDefined();
    expect(() => ShopReportSchema.parse(makeReport({ photoUrl: 'http://example.com/photo.jpg' }))).toThrow(ZodError);
    expect(() => ShopReportSchema.parse(makeReport({ photoUrl: 'not-a-url' }))).toThrow(ZodError);
  });

  it('rejects a non-positive hotPattern hookSize', () => {
    expect(() =>
      ShopReportSchema.parse(makeReport({ hotPatterns: [{ patternId: 'x', hookSize: 0 }] })),
    ).toThrow(ZodError);
  });
});

describe('BugObservationSchema', () => {
  it('accepts a valid observation', () => {
    expect(BugObservationSchema.parse(makeObservation())).toBeDefined();
  });

  it('rejects months outside 1-12', () => {
    expect(() => BugObservationSchema.parse(makeObservation({ month: 0 }))).toThrow(ZodError);
    expect(() => BugObservationSchema.parse(makeObservation({ month: 13 }))).toThrow(ZodError);
  });

  it('rejects tails other than 2 or 3', () => {
    expect(() => BugObservationSchema.parse(makeObservation({ tails: 4 as never }))).toThrow(ZodError);
  });

  it('rejects a non-positive hook size', () => {
    expect(() => BugObservationSchema.parse(makeObservation({ sizeHook: 0 }))).toThrow(ZodError);
  });
});
