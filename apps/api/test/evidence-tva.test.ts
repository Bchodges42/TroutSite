import { describe, expect, it } from 'vitest';
import { parseTvaNumber, parseTvaObservations, parseTvaTimestamp } from '../src/evidence/tva-provider.js';
import { readFixture } from './helpers.js';

/** Recorded TVA observed-data rows (Norris Dam, fixtures/TVA). */
const norrisFixture = JSON.parse(readFixture('TVA/observed-data-NRST1-2026-09-04.json'));
const wataugaFixture = JSON.parse(readFixture('TVA/observed-data-WTGT1-2026-09-04.json'));

describe('evidence: TVA provider parsing', () => {
  it('parses the recorded Norris fixture into reservoir level + tailwater stage + discharge', () => {
    const obs = parseTvaObservations(norrisFixture, { locationId: 'NRST1' });
    // Newest row in the fixture wins per metric — assert against the LAST fixture row.
    const last = norrisFixture[norrisFixture.length - 1];
    const lastHour = parseTvaTimestamp(last.Day, last.Time);
    const level = obs.find((o) => o.metric === 'reservoir-level-ft');
    const stage = obs.find((o) => o.metric === 'stage-ft');
    const flow = obs.find((o) => o.metric === 'discharge-cfs');
    expect(level?.value).toBeCloseTo(parseTvaNumber(last.ReservoirElevation) ?? 0, 2);
    expect(stage?.value).toBeCloseTo(parseTvaNumber(last.TailwaterElevation) ?? 0, 2);
    expect(flow?.value).toBe(parseTvaNumber(last.AverageHourlyDischarge));
    expect(level?.observedAt).toBe(lastHour);
    for (const o of obs) expect(o.sourceId).toBe('tva-restapi');
  });

  it('uses the newest row per metric from the Watauga fixture (tailwater)', () => {
    const obs = parseTvaObservations(wataugaFixture, { locationId: 'WTGT1' });
    expect(obs.length).toBeGreaterThanOrEqual(3);
    const level = obs.find((o) => o.metric === 'reservoir-level-ft');
    expect(level?.value).toBeGreaterThan(1900); // Watauga pool ~1950 ft
  });

  it('parses TVA published numbers: thousands separators, blank, dashes', () => {
    expect(parseTvaNumber('1,012.93')).toBe(1012.93);
    expect(parseTvaNumber('8,400')).toBe(8400);
    expect(parseTvaNumber('0')).toBe(0);
    expect(parseTvaNumber('')).toBeUndefined();
    expect(parseTvaNumber('-')).toBeUndefined();
    expect(parseTvaNumber('--')).toBeUndefined();
    expect(parseTvaNumber(undefined)).toBeUndefined();
    expect(parseTvaNumber('N/A')).toBeUndefined();
  });

  it('parses "2 PM EDT"-style timestamps into ISO with the published offset', () => {
    expect(parseTvaTimestamp('09/04/2026', '2 PM EDT')).toBe('2026-09-04T14:00:00-04:00');
    expect(parseTvaTimestamp('12/22/2026', '11 AM EST')).toBe('2026-12-22T11:00:00-05:00');
    expect(parseTvaTimestamp('09/04/2026', '12 AM EDT')).toBe('2026-09-04T00:00:00-04:00');
    expect(parseTvaTimestamp('09/04/2026', '12 PM EDT')).toBe('2026-09-04T12:00:00-04:00');
    // Garbage → null → the row is skipped, never zeroed.
    expect(parseTvaTimestamp('09/04/2026', '13 PM EDT')).toBeNull();
    expect(parseTvaTimestamp('tomorrow', '2 PM EDT')).toBeNull();
    expect(parseTvaTimestamp('09/04/2026', '2 PM UTC')).toBeNull();
  });

  it('preserves a real zero discharge (no generation) but drops impossible zero elevations', () => {
    const rows = [
      { Day: '09/04/2026', Time: '2 PM EDT', ReservoirElevation: '1,012.93', TailwaterElevation: '827.69', AverageHourlyDischarge: '0' },
      { Day: '09/04/2026', Time: '3 PM EDT', ReservoirElevation: '0', TailwaterElevation: '0', AverageHourlyDischarge: '0' },
    ];
    const obs = parseTvaObservations(rows, { locationId: 'TEST1' });
    const flow = obs.find((o) => o.metric === 'discharge-cfs');
    expect(flow?.value).toBe(0); // newest row keeps 0 cfs — a meaningful reading
    const level = obs.find((o) => o.metric === 'reservoir-level-ft');
    expect(level?.value).toBeCloseTo(1012.93, 2); // the zero-elevation row was skipped
  });

  it('skips rows with unusable timestamps entirely (missing stays missing)', () => {
    const rows = [
      { Day: 'bad', Time: '2 PM EDT', ReservoirElevation: '1,000' },
      { Day: '09/04/2026', Time: 'teatime', ReservoirElevation: '1,001' },
    ];
    expect(parseTvaObservations(rows, { locationId: 'TEST1' })).toEqual([]);
  });

  it('does not invent qualifiers TVA does not publish', () => {
    const obs = parseTvaObservations(norrisFixture, { locationId: 'NRST1' });
    expect(obs.every((o) => o.qualifier === undefined)).toBe(true);
  });
});
