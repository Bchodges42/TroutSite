import { describe, expect, it } from 'vitest';
import { jobDegradation, type JobRunSummary } from '../src/jobs/run.js';

/**
 * Pipeline audit 2026-10-14: /healthz aged only seed + snapshots, and a job
 * that finished "ok" with failed sources looked healthy — stale or partial
 * DATA never surfaced as degraded.
 */
const NOW = new Date('2026-10-14T18:00:00Z');
const run = (job: string, over: Partial<JobRunSummary> = {}): JobRunSummary => ({
  job,
  status: 'ok',
  startedAt: '2026-10-14T17:00:00Z',
  finishedAt: '2026-10-14T17:01:00Z',
  detail: { items: 10 },
  ...over,
});

describe('jobDegradation — data freshness and partial runs', () => {
  it('stays quiet for fresh, clean data jobs', () => {
    expect(
      jobDegradation({ gauges: run('gauges'), 'stocking:TN': run('stocking:TN'), 'gauges-conditions': run('gauges-conditions') }, NOW),
    ).toEqual([]);
  });

  it('flags an ok run whose sources partly failed', () => {
    const reasons = jobDegradation({ 'gauges-conditions': run('gauges-conditions', { detail: { items: 12, errors: 2 } }) }, NOW);
    expect(reasons).toEqual(['gauges-conditions: last run ok but 2 source(s) failed — data is partial']);
  });

  it('flags gauges older than 6 h and stocking older than 48 h', () => {
    const reasons = jobDegradation(
      {
        gauges: run('gauges', { finishedAt: '2026-10-14T10:00:00Z' }),
        'stocking:TN': run('stocking:TN', { finishedAt: '2026-10-11T12:00:00Z' }),
      },
      NOW,
    );
    expect(reasons).toEqual([
      'gauges: last successful run 8h ago (data stale past 6h)',
      'stocking:TN: last successful run 78h ago (data stale past 48h)',
    ]);
  });
});
