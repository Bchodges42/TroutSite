import { describe, expect, it } from 'vitest';
import { StreamSchema, scoreConditions, selectGaugeReadings, HistoricalFlowSchema, metricObservedAt } from '../src/index.js';
import { makeReading, makeStream } from './helpers.js';

const stream = () => makeStream({ gaugeIds: ['primary', 'downstream'], gaugePolicy: {
  primary: { cfs: 'primary', tempC: 'primary' },
  references: [{ gaugeId: 'downstream', note: 'Different downstream reach' }], note: 'Use the local primary',
} });

describe('primary/reference gauges', () => {
  it('preserves sensor-specific timestamps and supports legacy readings without them', () => {
    const reading = makeReading();
    expect(metricObservedAt(reading, 'cfs')).toBe(reading.timestamp);
    reading.metricTimes = { cfs: '2026-04-01T13:30Z' };
    expect(metricObservedAt(reading, 'cfs')).toBe('2026-04-01T13:30Z');
    const s = makeStream({ gaugePolicy: { primary: {}, references: [], note: 'one local gauge' } });
    const selected = selectGaugeReadings(s, [reading]).readings[0]!;
    expect(selected.metricTimes?.cfs).toBe('2026-04-01T13:30Z');
    expect(selected.timestamp).toBe(reading.timestamp); // Stage and temperature share the original later time.
  });
  it('keeps a newer downstream station out of local conditions and the score', () => {
    const local = makeReading({ gaugeId: 'primary', cfs: 25 });
    const downstream = makeReading({ gaugeId: 'downstream', cfs: 250, timestamp: '2026-04-01T15:00Z' });
    const selected = selectGaugeReadings(stream(), [local, downstream]);
    expect(selected.readings).toEqual([local]);
    expect(selected.referenceReadings).toEqual([downstream]);
    expect(scoreConditions(stream(), [local, downstream]).value).toBe(scoreConditions(stream(), [local]).value);
  });
  it('does not substitute the downstream gauge when the primary is missing', () => {
    expect(scoreConditions(stream(), [makeReading({ gaugeId: 'downstream' })]).assessed).toBe(false);
  });
  it('selects distinct primary sensors per metric without newest-wins substitution', () => {
    const s = makeStream({ gaugeIds: ['flow', 'temp'], gaugePolicy: {
      primary: { cfs: 'flow', tempC: 'temp' }, references: [], note: 'Two in-reach instruments' } });
    const result = selectGaugeReadings(s, [makeReading({ gaugeId: 'flow' }), makeReading({ gaugeId: 'temp' })]);
    expect(result.readings[0]?.tempC).toBeUndefined();
    expect(result.readings[1]?.cfs).toBeUndefined();
    expect(result.readings[1]?.tempC).toBe(15);
    expect(result.referenceReadings).toHaveLength(2);
  });
  it('retains legacy single-gauge readings and rejects foreign or contradictory policies', () => {
    expect(selectGaugeReadings(makeStream(), [makeReading(), makeReading({ gaugeId: 'foreign' })]).readings).toHaveLength(1);
    expect(StreamSchema.safeParse(stream()).success).toBe(true);
    expect(StreamSchema.safeParse({ ...stream(), gaugePolicy: { ...stream().gaugePolicy, primary: { cfs: 'downstream' } } }).success).toBe(false);
    expect(StreamSchema.safeParse({ ...stream(), gaugePolicy: { ...stream().gaugePolicy, primary: { cfs: 'foreign' }, references: [{ gaugeId: 'foreign', note: 'unconfigured' }] } }).success).toBe(false);
  });
  it('does not claim a flow assessment without an authored range and caps out-of-band values', () => {
    expect(scoreConditions(makeStream({ idealFlow: [] }), [makeReading()]).assessed).toBe(false);
    const score = scoreConditions(makeStream({ idealFlowSource: 'editorial' }), [makeReading({ cfs: 99 })]);
    expect(score.value).toBeLessThan(70);
    expect(score.reasons.join(' ')).toContain('editorial guidance band');
  });
  it('rejects unordered historical percentiles', () => {
    expect(HistoricalFlowSchema.safeParse({ gaugeId: '03538830', month: 10, p25: 30, median: 20, p75: 40,
      sampleCount: 15, unit: 'cfs', basis: 'USGS approved month-of-year discharge normals',
      sourceUrl: 'https://api.waterdata.usgs.gov/', retrievedAt: '2026-10-15T00:00:00Z',
      parentTimeSeriesId: 'id', computationId: 'id' }).success).toBe(false);
  });
});
