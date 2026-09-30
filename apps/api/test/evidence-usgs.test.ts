import { describe, expect, it } from 'vitest';
import { parseUsgsObservations, parseMetricValue } from '../src/evidence/usgs-provider.js';
import { readFixture } from './helpers.js';

/** Recorded USGS IV response (fixtures/USGS/iv-2026-09-02.json). */
const realFixture = JSON.parse(readFixture('USGS/iv-2026-09-02.json'));

function series(site: string, code: string, points: { value: string; dateTime: string; qualifiers?: string[] }[]): unknown {
  return {
    sourceInfo: { siteCode: [{ value: site, agencyCode: 'USGS' }] },
    variable: { variableCode: [{ value: code, vocabulary: 'uv Parameter Code' }], unit: { unitCode: code === '00010' ? 'degC' : code === '00060' ? 'ft3/s' : 'ft' } },
    values: [{ value: points }],
  };
}

describe('evidence: USGS provider parsing', () => {
  it('parses the recorded fixture into per-metric observations', () => {
    const obs = parseUsgsObservations(realFixture);
    expect(obs.length).toBeGreaterThan(0);
    for (const o of obs) {
      expect(['temperature-c', 'discharge-cfs', 'stage-ft']).toContain(o.metric);
      expect(o.sourceId).toBe('usgs-nwis-iv');
      expect(o.sourceUrl).toMatch(/^https:\/\/waterdata\.usgs\.gov\/monitoring-location\/\d+\//);
    }
  });

  it('preserves zero as a real value (never substitutes or drops it)', () => {
    const payload = {
      value: {
        timeSeries: [
          series('03432350', '00060', [{ value: '0', dateTime: '2026-09-04T10:00:00.000-05:00', qualifiers: ['P'] }]),
        ],
      },
    };
    const obs = parseUsgsObservations(payload);
    expect(obs).toHaveLength(1);
    expect(obs[0]?.value).toBe(0);
    expect(obs[0]?.metric).toBe('discharge-cfs');
    expect(obs[0]?.qualifier).toBe('P');
  });

  it('drops missing-data sentinels instead of treating them as readings', () => {
    expect(parseMetricValue('-999999')).toBeUndefined();
    expect(parseMetricValue('-999000')).toBeUndefined();
    expect(parseMetricValue('Ice')).toBeUndefined();
    expect(parseMetricValue(undefined)).toBeUndefined();
    expect(parseMetricValue('31.1')).toBe(31.1);
  });

  it('keeps the newest point per (site, metric) by the series own timestamps', () => {
    const payload = {
      value: {
        timeSeries: [
          series('03432350', '00060', [
            { value: '40', dateTime: '2026-09-04T11:00:00.000-05:00', qualifiers: ['P'] },
            { value: '31.1', dateTime: '2026-09-04T12:15:00.000-05:00', qualifiers: ['P'] },
            { value: '35', dateTime: '2026-09-04T09:30:00.000-05:00', qualifiers: ['P'] },
          ]),
        ],
      },
    };
    const obs = parseUsgsObservations(payload);
    expect(obs).toHaveLength(1);
    expect(obs[0]?.value).toBe(31.1);
    // The source dateTime passes through verbatim (offset preserved, not re-based).
    expect(obs[0]?.observedAt).toBe('2026-09-04T12:15:00.000-05:00');
  });

  it('keeps one observation per metric for the same gauge with correct per-metric observedAt', () => {
    const payload = {
      value: {
        timeSeries: [
          series('03433500', '00060', [{ value: '41', dateTime: '2026-09-04T12:00:00.000-05:00' }]),
          series('03433500', '00010', [{ value: '27.8', dateTime: '2026-09-04T12:15:00.000-05:00' }]),
        ],
      },
    };
    const obs = parseUsgsObservations(payload);
    expect(obs).toHaveLength(2);
    const flow = obs.find((o) => o.metric === 'discharge-cfs');
    const temp = obs.find((o) => o.metric === 'temperature-c');
    expect(flow?.observedAt).not.toBe(temp?.observedAt);
    expect(flow?.sourceUrl).toBe(temp?.sourceUrl);
  });

  it('leaves missing metrics missing (no zeros, no fabrication)', () => {
    const payload = {
      value: {
        timeSeries: [
          // Temperature series only; the site has no cfs/stage series at all.
          series('03556590', '00010', [{ value: '18.2', dateTime: '2026-09-04T11:00:00.000-05:00' }]),
        ],
      },
    };
    const obs = parseUsgsObservations(payload);
    expect(obs).toHaveLength(1);
    expect(obs[0]?.metric).toBe('temperature-c');
  });

  it('tolerates partial responses: unparseable timestamps, empty series, junk rows', () => {
    const payload = {
      value: {
        timeSeries: [
          series('03421000', '00060', [{ value: '100', dateTime: 'not-a-date' }]),
          { sourceInfo: { siteCode: [{ value: '03421000' }] }, variable: {}, values: [{ value: [] }] },
          { sourceInfo: {}, variable: { variableCode: [{ value: '00060' }] } },
          series('03419530', '00060', [{ value: '', dateTime: '2026-09-04T11:00:00.000-05:00' }]),
        ],
      },
    };
    expect(parseUsgsObservations(payload)).toEqual([]);
  });

  it('passes the source qualifier through verbatim', () => {
    const payload = {
      value: {
        timeSeries: [
          series('03430200', '00065', [{ value: '8.44', dateTime: '2026-09-04T12:00:00.000-05:00', qualifiers: ['P'] }]),
          series('03430200', '00065', [{ value: '8.5', dateTime: '2026-09-04T11:00:00.000-05:00', qualifiers: ['A'] }]),
        ],
      },
    };
    const obs = parseUsgsObservations(payload);
    expect(obs).toHaveLength(1);
    expect(obs[0]?.qualifier).toBe('P');
  });

  it('F34: picks the newest INSTANT across mixed DST offsets, not the text-greatest dateTime', () => {
    // The repeated daylight-saving hour: 01:45-05:00 = 06:45Z vs 01:15-06:00 = 07:15Z.
    // Text ordering calls 01:45 newer; the instant truth is 01:15-06:00.
    const payload = {
      value: {
        timeSeries: [
          series('03432350', '00060', [
            { value: '100', dateTime: '2026-11-01T01:45:00.000-05:00', qualifiers: ['P'] },
            { value: '200', dateTime: '2026-11-01T01:15:00.000-06:00', qualifiers: ['P'] },
          ]),
        ],
      },
    };
    const obs = parseUsgsObservations(payload);
    expect(obs).toHaveLength(1);
    expect(obs[0]?.value).toBe(200);
    expect(obs[0]?.observedAt).toBe('2026-11-01T01:15:00.000-06:00');
  });
});
