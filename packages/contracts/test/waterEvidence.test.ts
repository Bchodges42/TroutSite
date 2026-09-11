import { describe, expect, it } from 'vitest';
import {
  EvidenceStockingEventSchema,
  FishingInformationSchema,
  WaterEvidenceSchema,
  WaterMetricSchema,
  WaterObservationSchema,
} from '../src/index.js';

const URL = 'https://example.test/source';

describe('WaterObservationSchema', () => {
  it('accepts a minimal observation with zero value preserved', () => {
    const parsed = WaterObservationSchema.parse({
      sourceId: 'usgs-nwis-iv',
      sourceUrl: URL,
      observedAt: '2026-09-04T14:00:00Z',
      metric: 'discharge-cfs',
      value: 0,
    });
    expect(parsed.value).toBe(0);
    expect(parsed.qualifier).toBeUndefined();
  });

  it('keeps a verbatim qualifier', () => {
    const parsed = WaterObservationSchema.parse({
      sourceId: 'usgs-nwis-iv',
      sourceUrl: URL,
      observedAt: '2026-09-04T14:00:00Z',
      metric: 'temperature-c',
      value: 21.5,
      qualifier: 'P',
    });
    expect(parsed.qualifier).toBe('P');
  });

  it('rejects unknown metrics and non-finite values', () => {
    expect(
      WaterObservationSchema.safeParse({
        sourceId: 'x', sourceUrl: URL, observedAt: '2026-09-04T14:00:00Z',
        metric: 'ph', value: 7,
      }).success,
    ).toBe(false);
    expect(WaterMetricSchema.safeParse('reservoir-level-ft').success).toBe(true);
    expect(
      WaterObservationSchema.safeParse({
        sourceId: 'x', sourceUrl: URL, observedAt: '2026-09-04T14:00:00Z',
        metric: 'discharge-cfs', value: Number.NaN,
      }).success,
    ).toBe(false);
    expect(
      WaterObservationSchema.safeParse({
        sourceId: 'x', sourceUrl: URL, observedAt: '2026-09-04T14:00:00Z',
        metric: 'discharge-cfs', value: Number.POSITIVE_INFINITY,
      }).success,
    ).toBe(false);
  });

  it('rejects a non-ISO observedAt', () => {
    expect(
      WaterObservationSchema.safeParse({
        sourceId: 'x', sourceUrl: URL, observedAt: '09/04/2026 2 PM',
        metric: 'stage-ft', value: 1,
      }).success,
    ).toBe(false);
  });
});

describe('EvidenceStockingEventSchema', () => {
  it('accepts all three statuses and requires datePrecision', () => {
    for (const status of ['scheduled', 'reported-complete', 'unknown'] as const) {
      expect(
        EvidenceStockingEventSchema.safeParse({
          sourceId: 'twra-stockings', sourceUrl: URL,
          date: '2026-03-01', datePrecision: 'month', status,
        }).success,
      ).toBe(true);
    }
    expect(
      EvidenceStockingEventSchema.safeParse({
        sourceId: 'twra-stockings', sourceUrl: URL, date: '2026-03-01', status: 'scheduled',
      }).success,
    ).toBe(false);
  });

  it('accepts species as free-text list', () => {
    const parsed = EvidenceStockingEventSchema.parse({
      sourceId: 'twra-stockings', sourceUrl: URL,
      date: '2026-01-14', datePrecision: 'day', status: 'reported-complete',
      species: ['rainbow trout', 'brown trout'],
    });
    expect(parsed.species).toEqual(['rainbow trout', 'brown trout']);
  });
});

describe('WaterEvidenceSchema', () => {
  const base = { waterId: 'clinch-river', retrievedAt: '2026-09-04T20:00:00Z' };

  it('accepts an empty-but-well-formed record (missing stays missing)', () => {
    const parsed = WaterEvidenceSchema.parse({ ...base, observations: [], stockingEvents: [], regulations: [], errors: [] });
    expect(parsed.observations).toEqual([]);
  });

  it('keeps retrievedAt distinct from observedAt', () => {
    const parsed = WaterEvidenceSchema.parse({
      ...base,
      observations: [{
        sourceId: 'usgs-nwis-iv', sourceUrl: URL,
        observedAt: '2026-09-04T14:00:00Z', metric: 'discharge-cfs', value: 31.1, qualifier: 'P',
      }],
      stockingEvents: [],
      regulations: [],
      errors: [{ sourceId: 'tva-restapi', code: 'upstream-http-403', message: 'Cloudflare block' }],
    });
    expect(parsed.retrievedAt).not.toBe(parsed.observations[0]?.observedAt);
    expect(parsed.errors[0]?.code).toBe('upstream-http-403');
  });
});

describe('FishingInformationSchema', () => {
  it('accepts statewide items without appliesTo and water-specific ones with it', () => {
    const doc = {
      scope: 'statewide-tn',
      verifiedAt: '2026-09-04',
      disclaimer: 'Informational only.',
      sections: [
        {
          id: 'statewide-rules',
          title: 'Statewide rules',
          items: [
            {
              title: 'Statewide trout limits',
              text: 'Seven trout per day, any combination.',
              authority: 'TWRA',
              sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
              effectiveFrom: '2026-08-01',
            },
            {
              title: 'Clinch River special regulation',
              text: '14-20 inch protected length range.',
              authority: 'TWRA',
              sourceUrl: 'https://www.tn.gov/twra/fishing-regs/trout-regulations.html',
              appliesTo: ['clinch-river'],
            },
          ],
        },
      ],
    };
    const parsed = FishingInformationSchema.parse(doc);
    expect(parsed.sections[0]?.items[0]?.appliesTo).toBeUndefined();
    expect(parsed.sections[0]?.items[1]?.appliesTo).toEqual(['clinch-river']);
  });
});
