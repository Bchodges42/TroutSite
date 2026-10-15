import { readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { ConditionSnapshotSchema, StreamSchema } from '@trout/contracts';
import { seedContent } from '../src/lib/seed.js';
import { buildSnapshots } from '../src/snapshots/build.js';
import { latestReadings } from '../src/ingest/usgs.js';
import { makeEnv } from './helpers.js';

it('round-trips catalog policies and pond counties, separating downstream reference readings', () => {
  const env = makeEnv();
  try {
    seedContent(env.db, resolve(import.meta.dirname, '../../../packages/content'));
    const now = new Date('2026-10-15T00:30:00Z');
    const insert = env.db.prepare('INSERT INTO gauge_readings_raw(gauge_id,fetched_at,payload,cfs,temp_c,observed_at) VALUES(?,?,?,?,?,?)');
    insert.run('usace:CETT1', now.toISOString(), '{}', 250, 14, '2026-10-15T00:00:00Z');
    insert.run('03424860', now.toISOString(), '{}', 900, 18, '2026-10-15T00:15:00Z');
    buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now });
    const streams = (JSON.parse(readFileSync(join(env.snapshotsDir, 'v1/streams.json'), 'utf8')) as unknown[]).map((s) => StreamSchema.parse(s));
    expect(streams.find((s) => s.id === 'acorn-lake')?.counties).toEqual(['Dickson']);
    const caney = streams.find((s) => s.id === 'caney-fork-river')!;
    expect(caney.gaugePolicy?.primary.cfs).toBe('usace:CETT1');
    const snapshots = (JSON.parse(readFileSync(join(env.snapshotsDir, 'v1/conditions/latest.json'), 'utf8')) as unknown[]).map((s) => ConditionSnapshotSchema.parse(s));
    const snapshot = snapshots.find((s) => s.streamId === caney.id)!;
    expect(snapshot.readings.map((r) => r.gaugeId)).toEqual(['usace:CETT1']);
    expect(snapshot.referenceReadings?.map((r) => r.gaugeId)).toEqual(['03424860']);
  } finally { env.db.close(); rmSync(env.dir, { recursive: true, force: true }); }
});

it('preserves true zero flow, removes stale individual sensors, and ignores future rows before ranking', () => {
  const env = makeEnv();
  try {
    const now = new Date('2026-10-15T00:30:00Z');
    const insert = env.db.prepare('INSERT INTO gauge_readings_raw(gauge_id,fetched_at,payload,cfs,temp_c,observed_at) VALUES(?,?,?,?,?,?)');
    const metricTimes = { cfs: '2026-10-15T00:00:00Z', tempC: '2026-10-14T20:00:00Z' };
    insert.run('usace:CETT1', now.toISOString(), JSON.stringify({ metricTimes }), 0, 30, '2026-10-15T00:00:00Z');
    insert.run('usace:CETT1', now.toISOString(), '{}', 999, 99, '2026-10-16T00:00:00Z');
    expect(latestReadings(env.db, now.getTime())).toEqual([{
      gaugeId: 'usace:CETT1', cfs: 0, timestamp: '2026-10-15T00:00:00Z', metricTimes: { cfs: metricTimes.cfs },
    }]);
  } finally { env.db.close(); rmSync(env.dir, { recursive: true, force: true }); }
});
