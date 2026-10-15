import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ConditionSnapshot, ReleaseSchedule, StockingEvent } from '@trout/contracts';
import { parseWaterDataResponse } from '../src/ingest/usgs-waterdata.js';
import { parseTvaGenerationReleases } from '../src/evidence/tva-provider.js';
import { normalizeTwra, TWRA_PAGE_URL } from '../src/ingest/stocking/tn.js';
import { compareTvaSchedule, compareTwraStocking, compareUsgsReadings } from '../src/truth/truthCheck.js';
import { readFixture } from './helpers.js';

/**
 * The truth check must catch, from real 2026-10-14 captures, each class of
 * error the data-integrity audit found — and stay quiet on correct data.
 */
const NOW = new Date('2026-10-14T16:00:00Z');

describe('truth check — USGS', () => {
  const live = JSON.parse(readFileSync(join(process.cwd(), 'fixtures/USGS-WATERDATA/latest-continuous-tn-2026-10-14.json'), 'utf8'));
  const upstream = parseWaterDataResponse(live);
  const snapshot = (readings: ConditionSnapshot['readings']): ConditionSnapshot => ({
    streamId: 'duck-river-tailwater',
    readings,
    score: { value: 80, reasons: [] },
    fetchedAt: NOW.toISOString(),
    nextExpectedUpdate: NOW.toISOString(),
  });

  it('agrees with correctly published readings', () => {
    const result = compareUsgsReadings([snapshot(upstream)], upstream);
    expect(result.checked).toBe(upstream.length);
    expect(result.findings).toEqual([]);
  });

  it('flags the pre-fix bug: a 2012 temperature published under the current stamp', () => {
    const buggy = { gaugeId: '03597860', cfs: 186, heightFt: 10.19, tempC: 21.4, timestamp: '2026-10-14T23:30:00.000Z' };
    const { findings } = compareUsgsReadings([snapshot([buggy])], upstream);
    expect(findings).toEqual([
      expect.objectContaining({ kind: 'mismatch', subject: '03597860', detail: expect.stringMatching(/tempC published 21.4/) }),
    ]);
  });

  it('flags a published reading more than 3 h behind the source', () => {
    const old = { gaugeId: '03597860', cfs: 150, timestamp: '2026-10-14T18:00:00.000Z' };
    const { findings } = compareUsgsReadings([snapshot([old])], upstream);
    expect(findings[0]).toMatchObject({ kind: 'stale', subject: '03597860' });
  });
});

describe('truth check — TVA', () => {
  const payload = JSON.parse(readFixture('TVA/generation-releases-NRST1-2026-10-14.json'));
  const schedule = (over: Partial<ReleaseSchedule>): ReleaseSchedule => ({
    waterId: 'clinch-river',
    locationId: 'NRST1',
    retrievedAt: '2026-10-14T15:30:00Z',
    sourceUrl: 'https://www.tva.com/environment/lake-levels',
    status: 'available',
    releases: parseTvaGenerationReleases(payload),
    forecasts: [],
    ...over,
  });

  it('agrees with a correctly published schedule', () => {
    expect(compareTvaSchedule(schedule({}), payload, NOW)).toEqual([]);
  });

  it('flags the pre-fix bug: "no published schedule" while TVA lists generation', () => {
    const findings = compareTvaSchedule(schedule({ status: 'empty', releases: [] }), payload, NOW);
    expect(findings).toEqual([expect.objectContaining({ kind: 'mismatch', detail: expect.stringMatching(/TVA publishes 3 block/) })]);
  });

  it('flags wrong generator counts, stale schedules and rows our parser cannot read', () => {
    const wrong = schedule({});
    wrong.releases = wrong.releases.map((b) => ({ ...b, generators: '0' }));
    expect(compareTvaSchedule(wrong, payload, NOW).filter((f) => f.kind === 'mismatch')).toHaveLength(3);
    expect(compareTvaSchedule(schedule({ retrievedAt: '2026-10-14T09:00:00Z' }), payload, NOW)[0]).toMatchObject({ kind: 'stale' });
    const unreadable = [...payload, { Day: '10/16/2026', Time: 'Sunup - Sundown EDT', Generators: '1' }];
    expect(compareTvaSchedule(schedule({}), unreadable, NOW)[0]).toMatchObject({ kind: 'unparsed' });
  });
});

describe('truth check — TWRA', () => {
  const fresh = normalizeTwra(
    {
      artifacts: [
        { suffix: 'html', content: readFixture('TN/2026-10-14-stockings-page.html'), url: TWRA_PAGE_URL },
        { suffix: 'exceldriven.json', content: readFixture('TN/2026-10-14-schedule.exceldriven.json'), url: TWRA_PAGE_URL },
        { suffix: 'report.exceldriven.json', content: readFixture('TN/2026-10-14-recent.exceldriven.json'), url: TWRA_PAGE_URL },
      ],
      fetchedAt: '2026-10-14T15:00:00.000Z',
    },
    { now: NOW },
  ).events;

  it('agrees with a correctly published feed', () => {
    expect(compareTwraStocking(fresh, fresh, NOW, 2026)).toEqual([]);
  });

  it('flags invented next-year windows, a stale feed, and a count drift', () => {
    const invented: StockingEvent = { ...fresh[0]!, id: 'x', date: '2027-03-01', datePrecision: 'month', status: 'scheduled' };
    expect(compareTwraStocking([...fresh, invented], fresh, NOW, 2026)).toEqual([
      expect.objectContaining({ kind: 'mismatch', detail: expect.stringMatching(/dated past the 2026 schedule/) }),
    ]);
    const old = fresh.map((e) => ({ ...e, fetchedAt: '2026-10-10T00:00:00.000Z' }));
    expect(compareTwraStocking(old, fresh, NOW, 2026)).toEqual([expect.objectContaining({ kind: 'stale' })]);
    expect(compareTwraStocking(fresh.slice(0, 300), fresh, NOW, 2026)).toEqual([
      expect.objectContaining({ kind: 'mismatch', detail: expect.stringMatching(/site publishes \d+ scheduled events/) }),
    ]);
  });
});
