import { describe, expect, it } from 'vitest';
import { parseCsvRows, parseTemperatureHistory, fetchTemperatureHistory } from '../src/evidence/wqp-temperature-history.js';

const header = 'MonitoringLocationIdentifier,ActivityStartDate,CharacteristicName,ResultMeasureValue,ResultMeasure/MeasureUnitCode,MeasureQualifierCode,ActivityCommentText';
const opts = { siteIds: ['TDEC-site'], sourceUrl: 'https://www.waterqualitydata.us/', retrievedAt: '2026-10-15T00:00:00Z' };
describe('historical temperature evidence', () => {
  it('keeps original units, sample date and qualifier without inventing observation time', () => {
    const { samples } = parseTemperatureHistory(header + '\nTDEC-site,2024-06-01,"Temperature, water",68,deg F,estimated,"two lines\nwith a comma, and ""quotes"""\n', opts);
    expect(samples[0]).toMatchObject({ sampleDate: '2024-06-01', temperatureC: 20, originalUnit: 'deg F', qualifier: 'estimated' });
    expect(samples[0]?.sampleTime).toBeUndefined();
  });
  it('withholds foreign sites, missing values and unknown units; rejects partial CSV', () => {
    const result = parseTemperatureHistory(header + '\nwrong,2024-06-01,"Temperature, water",20,deg C,,\nTDEC-site,2024-06-01,"Temperature, water",,deg C,,\nTDEC-site,2024-06-01,"Temperature, water",20,unknown,,\n', opts);
    expect(result.samples).toEqual([]); expect(result.skipped).toBe(3);
    expect(() => parseCsvRows('a,"unfinished')).toThrow(/Truncated/);
    expect(() => parseTemperatureHistory('wrong header', opts)).toThrow(/columns/);
  });
  it('returns an honest empty result for a header-only source response', async () => {
    const result = await fetchTemperatureHistory({ siteIds: ['TDEC-site'], startDate: '01-01-2024', endDate: '12-31-2024', userAgent: 'test',
      fetchImpl: (async () => new Response(header + '\n')) as typeof fetch });
    expect(result.samples).toEqual([]);
    expect(result.sourceUrl).toContain('siteid=TDEC-site');
  });
});
