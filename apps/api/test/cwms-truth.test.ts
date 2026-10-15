import { describe, expect, it } from 'vitest';
import { compareCwmsReadings } from '../src/truth/truthCheck.js';
import { buildConditionsReading } from '../src/evidence/conditionsBridge.js';
import type { ConditionSnapshot } from '@trout/contracts';

describe('CWMS published-versus-source guardrail', () => {
  const snapshot = (): ConditionSnapshot => ({ streamId: 'caney-fork-river',
    readings: [{ gaugeId: 'usace:CETT1', cfs: 250, tempC: 12, timestamp: '2026-10-15T01:30:00Z',
      metricTimes: { cfs: '2026-10-15T01:00:00Z', tempC: '2026-10-15T01:30:00Z' } }],
    score: { value: 0, reasons: [] }, fetchedAt: '2026-10-15T02:00:00Z', nextExpectedUpdate: '2026-10-15T03:00:00Z' });
  it('uses the actual flow observation time even when temperature was measured later', () => {
    const result = compareCwmsReadings([snapshot()], [{ gaugeId: 'usace:CETT1', cfs: 200, timestamp: '2026-10-15T01:00:00Z' }]);
    expect(result.findings[0]).toMatchObject({ source: 'cwms', kind: 'mismatch' });
  });
  it('detects missing and stale metrics without treating legitimately newer values as mismatches', () => {
    expect(compareCwmsReadings([], [{ gaugeId: 'usace:CETT1', cfs: 200, timestamp: '2026-10-15T01:00:00Z' }]).findings[0]?.kind).toBe('unparsed');
    expect(compareCwmsReadings([snapshot()], [{ gaugeId: 'usace:CETT1', cfs: 200, timestamp: '2026-10-15T05:00:00Z' }]).findings[0]?.kind).toBe('stale');
    expect(compareCwmsReadings([snapshot()], [{ gaugeId: 'usace:CETT1', cfs: 200, timestamp: '2026-10-15T02:00:00Z' }]).findings).toEqual([]);
  });
  it('preserves both sensor times when the bridge merges a gauge', () => {
    const built = buildConditionsReading('usace:CETT1', 'usace-cwms', [
      { metric: 'discharge-cfs', value: 250, observedAt: '2026-10-15T01:00:00Z', sourceId: 'usace-cwms', sourceUrl: 'https://cwms-data.usace.army.mil/' },
      { metric: 'temperature-c', value: 12, observedAt: '2026-10-15T01:30:00Z', sourceId: 'usace-cwms', sourceUrl: 'https://cwms-data.usace.army.mil/' },
    ]);
    expect(built?.reading.metricTimes).toEqual(snapshot().readings[0]!.metricTimes);
    expect(JSON.parse(built!.payload).metricTimes).toEqual(snapshot().readings[0]!.metricTimes);
  });
});
