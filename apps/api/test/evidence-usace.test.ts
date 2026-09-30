import { describe, expect, it } from 'vitest';
import {
  USACE_TAILWATER_SERIES,
  fahrenheitToCelsius,
  fetchUsaceObservations,
  parseUsaceSeries,
} from '../src/evidence/usace-provider.js';
import { USACE_MONITORS } from '../src/evidence/monitors.js';
import { readFixture } from './helpers.js';

/** Captured live A2W responses (Center Hill Dam tailwater, 2026-09-08). */
const cett1Flow = JSON.parse(readFixture('USACE/CETT1-flow.json'));
const cett1Stage = JSON.parse(readFixture('USACE/CETT1-stage.json'));
const cett1Temp = JSON.parse(readFixture('USACE/CETT1-temp.json'));
/** Cordell Hull outflow — the captured window ends on a real 0.0 (turbines off). */
const cort1Flow = JSON.parse(readFixture('USACE/CORT1-flow.json'));

describe('evidence: USACE provider parsing', () => {
  it('parses the recorded Center Hill fixtures: newest flow point in cfs', () => {
    const { observation, point, seriesKey } = parseUsaceSeries(cett1Flow, {
      tsid: 'CETT1-CENTER_HILL.Flow.Ave.1Hour.1Hour.man-rev',
      metric: 'discharge-cfs',
    });
    expect(observation).toMatchObject({
      sourceId: 'usace-a2w',
      metric: 'discharge-cfs',
      value: 250, // newest point of the capture (2026-09-08T06:00:00Z)
      observedAt: '2026-09-08T06:00:00Z',
    });
    expect(point).toEqual(['2026-09-08T06:00:00Z', 250]);
    expect(seriesKey).toBe('CETT1-CENTER_HILL.Flow.Ave.1Hour.1Hour.man-rev');
    expect(observation?.qualifier).toBeUndefined(); // never invented
  });

  it('parses tailwater elevation as stage-ft (values pass through verbatim)', () => {
    const { observation } = parseUsaceSeries(cett1Stage, {
      tsid: 'CETT1-CENTER_HILL.Elev-Tail.Inst.30Minutes.0.dcp-rev',
      metric: 'stage-ft',
    });
    expect(observation?.metric).toBe('stage-ft');
    expect(observation?.value).toBe(476.31);
    expect(observation?.observedAt).toBe('2026-09-08T06:00:00Z');
  });

  it('converts °F to °C rounded to 0.1 for Temp-Water-Tail', () => {
    expect(fahrenheitToCelsius(51.91)).toBeCloseTo(11.1, 5);
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(212)).toBe(100);
    const { observation } = parseUsaceSeries(cett1Temp, {
      tsid: 'CETT1-CENTER_HILL.Temp-Water-Tail.Inst.30Minutes.0.dcp-rev',
      metric: 'temperature-c',
    });
    expect(observation?.metric).toBe('temperature-c');
    expect(observation?.value).toBeCloseTo(11.1, 5);
  });

  it('keeps a real 0.0 discharge (Cordell Hull, turbines off) from the captured fixture', () => {
    const { observation, warning } = parseUsaceSeries(cort1Flow, {
      tsid: 'CORT1-CORDELL_HULL.Flow.Ave.1Hour.1Hour.man-rev',
      metric: 'discharge-cfs',
    });
    expect(warning).toBeUndefined();
    expect(observation?.value).toBe(0);
    expect(observation?.observedAt).toBe('2026-09-08T06:00:00Z');
  });

  it('warns (never throws) on an empty body — the A2W answer for an unknown TSID', () => {
    const { observation, warning } = parseUsaceSeries(null, {
      tsid: 'NOPE-NOPE.Flow.Ave.1Hour.1Hour.man-rev',
      metric: 'discharge-cfs',
    });
    expect(observation).toBeNull();
    expect(warning).toMatch(/empty/i);
  });

  it('warns on values:[] (empty/future window) and skips null points', () => {
    const empty = parseUsaceSeries({ key: 'X', unit: 'cfs', values: [] }, {
      tsid: 'X',
      metric: 'discharge-cfs',
    });
    expect(empty.observation).toBeNull();
    expect(empty.warning).toMatch(/no usable values/i);

    const nulls = parseUsaceSeries(
      { key: 'X', unit: 'cfs', values: [['2026-09-08T06:00:00Z', null], ['2026-09-07T00:00:00Z', 42]] },
      { tsid: 'X', metric: 'discharge-cfs' },
    );
    expect(nulls.observation?.value).toBe(42); // newest NON-null point wins
    expect(nulls.observation?.observedAt).toBe('2026-09-07T00:00:00Z');
  });

  it('keeps the newest point when the capture arrives unsorted', () => {
    const { observation } = parseUsaceSeries(
      { key: 'X', unit: 'cfs', values: [['2026-09-07T00:00:00Z', 10], ['2026-09-08T06:00:00Z', 20], ['2026-09-06T00:00:00Z', 5]] },
      { tsid: 'X', metric: 'discharge-cfs' },
    );
    expect(observation?.value).toBe(20);
  });

  it('F34: newest INSTANT wins when points carry different UTC offsets', () => {
    // Defensive ordering: A2W publishes Z-normalized stamps, but the selector
    // must not regress to text order if an offset ever appears.
    const { observation, point } = parseUsaceSeries(
      {
        key: 'X',
        unit: 'cfs',
        values: [
          ['2026-11-01T01:45:00-05:00', 100], // 06:45Z
          ['2026-11-01T01:15:00-06:00', 200], // 07:15Z — newer instant
        ],
      },
      { tsid: 'X', metric: 'discharge-cfs' },
    );
    expect(observation?.value).toBe(200);
    expect(observation?.observedAt).toBe('2026-11-01T01:15:00-06:00');
    expect(point).toEqual(['2026-11-01T01:15:00-06:00', 200]);
  });

  it('registry integrity: stations ↔ TSIDs ↔ monitor map stay consistent', () => {
    for (const [station, series] of Object.entries(USACE_TAILWATER_SERIES)) {
      expect(series.flow).toContain(`${station}-`);
      for (const tsid of [series.stage, series.temp]) {
        if (tsid) expect(tsid).toContain(`${station}-`);
      }
      expect(USACE_MONITORS[series.waterId]?.station).toBe(station);
    }
    // CORT1 is registered for coverage but deliberately NOT wired into any catalog gaugeIds.
    expect(USACE_MONITORS['cumberland-river']?.station).toBe('CORT1');
  });
});

describe('evidence: USACE provider fetching', () => {
  it('fetches flow + stage + temp serially and maps each series to its metric', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      calls.push(url);
      const body = url.includes('Flow.Ave') ? readFixture('USACE/CETT1-flow.json')
        : url.includes('Elev-Tail') ? readFixture('USACE/CETT1-stage.json')
          : readFixture('USACE/CETT1-temp.json');
      return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    const result = await fetchUsaceObservations('CETT1', { userAgent: 'test-agent/1.0', fetchImpl, spacingMs: 0 });
    expect(calls).toHaveLength(3);
    expect(calls[0]).toContain('https://water.usace.army.mil/cda/reporting/providers/lrn/timeseries?name=');
    expect(calls[0]).toContain('begin=');
    expect(calls[0]).toContain('end=');
    expect(result.observations.map((o) => o.metric).sort()).toEqual(['discharge-cfs', 'stage-ft', 'temperature-c']);
    expect(result.warnings).toEqual([]);
    // Raw source rows preserved for the audit payload column.
    expect(result.rawByMetric['discharge-cfs']).toMatchObject({ value: ['2026-09-08T06:00:00Z', 250] });
  });

  it('treats an unknown series (HTTP 200, empty body) as a warning, not an error', async () => {
    const fetchImpl = (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const body = url.includes('Flow.Ave') ? readFixture('USACE/CETT1-flow.json') : '';
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    const result = await fetchUsaceObservations('CETT1', {
      userAgent: 'test-agent/1.0',
      fetchImpl,
      spacingMs: 0,
      // Only the flow series is registered for this synthetic call path.
    });
    expect(result.observations).toHaveLength(1);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toMatch(/empty/i);
  });

  it('throws on HTTP failure so the caller records an upstream error', async () => {
    const fetchImpl = (async (): Promise<Response> => new Response('nope', { status: 500 })) as typeof fetch;
    await expect(
      fetchUsaceObservations('CETT1', { userAgent: 'test-agent/1.0', fetchImpl, spacingMs: 0 }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it('refuses stations outside the hardcoded registry', async () => {
    await expect(
      fetchUsaceObservations('XXXX2', { userAgent: 'test-agent/1.0', spacingMs: 0 }),
    ).rejects.toThrow(/hardcoded registry/);
  });
});
