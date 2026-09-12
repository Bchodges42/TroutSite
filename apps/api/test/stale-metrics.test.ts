import { describe, expect, it } from 'vitest';
import { parseInstantValues } from '../src/ingest/usgs.js';
import { buildConditionsReading } from '../src/evidence/conditionsBridge.js';
import { scoreConditions } from '@trout/contracts';
import type { GaugeReading, Stream, WaterObservation } from '@trout/contracts';

const NOW = new Date('2026-09-12T12:00:00Z');
const MONTH_AGO = new Date(NOW.getTime() - 30 * 86_400_000).toISOString();
const NOW_ISO = NOW.toISOString();

function usgsSeries(site: string, code: string, value: string, dateTime: string) {
  return {
    sourceInfo: { siteCode: [{ value: site, agencyCode: 'USGS' }] },
    variable: { variableCode: [{ value: code, vocabulary: 'NWIS:UnitValues' }] },
    values: [{ value: [{ value, dateTime, qualifiers: ['P'] }] }],
  };
}

/** A stream whose ideal flow band would score the month-old discharge at 80+. */
const stream = {
  id: 'test-creek',
  name: 'Test Creek',
  stateId: 'TN',
  county: 'Test',
  gaugeIds: ['01234500'],
  idealFlow: [{ min: 100, max: 200 }],
} as unknown as Stream;

describe('T1-6: stale gauge metrics must not wear a fresh timestamp', () => {
  it('drops month-old discharge+temp and keeps only current stage (USGS parser)', () => {
    const payload = {
      value: {
        timeSeries: [
          usgsSeries('01234500', '00060', '150', MONTH_AGO), // discharge, 30 days old
          usgsSeries('01234500', '00010', '12', MONTH_AGO), // temperature, 30 days old
          usgsSeries('01234500', '00065', '2', NOW_ISO), // gage height, current
        ],
      },
    };
    const readings = parseInstantValues(payload);
    expect(readings).toHaveLength(1);
    const r = readings[0]!;
    expect(r.timestamp).toBe(NOW_ISO);
    expect(r.heightFt).toBe(2);
    // The month-old metrics must not ride along under the fresh stamp.
    expect(r.cfs).toBeUndefined();
    expect(r.tempC).toBeUndefined();
  });

  it('keeps all parameters when every series is fresh', () => {
    const recent = new Date(NOW.getTime() - 10 * 60_000).toISOString();
    const payload = {
      value: {
        timeSeries: [
          usgsSeries('01234500', '00060', '150', recent),
          usgsSeries('01234500', '00010', '12', NOW_ISO),
        ],
      },
    };
    const r = parseInstantValues(payload)[0]!;
    expect(r.cfs).toBe(150);
    expect(r.tempC).toBe(12);
    expect(r.timestamp).toBe(NOW_ISO);
  });

  it('does the same for the evidence bridge (TVA/USACE observations)', () => {
    const obs: WaterObservation[] = [
      { metric: 'discharge-cfs', value: 150, observedAt: MONTH_AGO },
      { metric: 'temperature-c', value: 12, observedAt: MONTH_AGO },
      { metric: 'stage-ft', value: 2, observedAt: NOW_ISO },
    ];
    const built = buildConditionsReading('tva:NRST1', 'tva-restapi', obs);
    expect(built).not.toBeNull();
    expect(built!.reading.timestamp).toBe(NOW_ISO);
    expect(built!.reading.cfs).toBeUndefined();
    expect(built!.reading.tempC).toBeUndefined();
    expect(built!.reading.heightFt).toBe(2);
  });

  it('the brief scenario: month-old discharge+temp + current stage does NOT produce a fresh-stamped high score', () => {
    // Repro of review PASS2-1: this exact input used to score 90 with
    // readingsAreStale=false — month-old flow published as current.
    const payload = {
      value: {
        timeSeries: [
          usgsSeries('01234500', '00060', '150', MONTH_AGO),
          usgsSeries('01234500', '00010', '12', MONTH_AGO),
          usgsSeries('01234500', '00065', '2', NOW_ISO),
        ],
      },
    };
    const readings = parseInstantValues(payload) as GaugeReading[];
    const score = scoreConditions(stream, readings);

    // Stage-height-only scoring: honest, limited-confidence, NOT the 80-90
    // band the stale flow produced.
    expect(score.value).toBeLessThan(80);
    expect(score.reasons.join(' ')).toContain('No flow (cfs) reading');
    // And nothing in the reasons claims the month-old 150 cfs / 12°C.
    expect(score.reasons.join(' ')).not.toContain('150');
    expect(score.reasons.join(' ')).not.toContain('12°C');
  });

  it('keeps an honest old stamp when EVERY metric is stale (no fresh-stamped rows at all)', () => {
    const payload = {
      value: {
        timeSeries: [
          usgsSeries('01234500', '00060', '150', MONTH_AGO),
          usgsSeries('01234500', '00010', '12', MONTH_AGO),
        ],
      },
    };
    const readings = parseInstantValues(payload);
    expect(readings).toHaveLength(1);
    // The reading survives but carries its own month-old timestamp — the
    // freshness contract (readingsAreStale keys off the reading's own time)
    // then flags it stale downstream. Nothing wears a fresh stamp.
    expect(readings[0]!.timestamp).toBe(MONTH_AGO);
    expect(readings[0]!.cfs).toBe(150);
  });
});
