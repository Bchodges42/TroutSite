import { describe, expect, it } from 'vitest';
import {
  isStaleObservation,
  isStaleScheduledEvent,
  staleScheduledEvents,
} from '../src/evidence/stale.js';
import type { EvidenceStockingEvent, WaterObservation } from '@trout/contracts';

const NOW = Date.parse('2026-09-04T12:00:00Z');

function obs(metric: WaterObservation['metric'], observedAt: string, value = 10): WaterObservation {
  return { sourceId: 'usgs-nwis-iv', sourceUrl: 'https://example.test/', observedAt, metric, value };
}

function sched(date: string, datePrecision: EvidenceStockingEvent['datePrecision'] = 'day', status: EvidenceStockingEvent['status'] = 'scheduled'): EvidenceStockingEvent {
  return { sourceId: 'twra-stockings', sourceUrl: 'https://example.test/', date, datePrecision, status };
}

describe('evidence: stale-observation detection', () => {
  it('fresh river observations are not stale; 24h+ old ones are', () => {
    expect(isStaleObservation(obs('discharge-cfs', '2026-09-04T11:00:00Z'), NOW)).toBe(false);
    expect(isStaleObservation(obs('temperature-c', '2026-09-03T10:00:00Z'), NOW)).toBe(true);
  });

  it('reservoir levels tolerate a longer age than river gauges', () => {
    const twoDaysOld = '2026-09-02T12:00:00Z';
    expect(isStaleObservation(obs('discharge-cfs', twoDaysOld), NOW)).toBe(true);
    expect(isStaleObservation(obs('reservoir-level-ft', twoDaysOld), NOW)).toBe(false);
    const fourDaysOld = '2026-08-31T12:00:00Z';
    expect(isStaleObservation(obs('reservoir-level-ft', fourDaysOld), NOW)).toBe(true);
  });

  it('unparseable observedAt counts as maximally stale, never fresh', () => {
    expect(isStaleObservation(obs('stage-ft', 'not-a-date'), NOW)).toBe(true);
  });
});

describe('evidence: stale stocking schedule detection', () => {
  it('flags scheduled day rows older than the slack window', () => {
    expect(isStaleScheduledEvent(sched('2026-08-01'), new Date('2026-09-04T12:00:00Z'))).toBe(true);
    expect(isStaleScheduledEvent(sched('2026-09-01'), new Date('2026-09-04T12:00:00Z'))).toBe(false);
  });

  it('precision widens the window (month rows live longer than day rows)', () => {
    const now = new Date('2026-09-04T12:00:00Z');
    // Same date: past the day slack, inside the month slack.
    const d = '2026-08-05';
    expect(isStaleScheduledEvent(sched(d, 'day'), now)).toBe(true);
    expect(isStaleScheduledEvent(sched(d, 'week'), now)).toBe(true);
    expect(isStaleScheduledEvent(sched(d, 'month'), now)).toBe(false);
  });

  it('never flags completed rows — completion is a fact, not a schedule', () => {
    expect(isStaleScheduledEvent(sched('2026-01-14', 'day', 'reported-complete'), new Date('2026-09-04T12:00:00Z'))).toBe(false);
  });

  it('filters lists', () => {
    const events = [sched('2026-01-01'), sched('2026-08-20', 'month'), sched('2026-08-20', 'day')];
    const stale = staleScheduledEvents(events, new Date('2026-09-04T12:00:00Z'));
    expect(stale).toHaveLength(2);
    expect(stale.every((e) => e.datePrecision !== 'month')).toBe(true);
  });
});
