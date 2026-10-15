import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ReleaseScheduleSchema } from '@trout/contracts';
import { buildSnapshots } from '../src/snapshots/build.js';
import { makeEnv, type TestEnv } from './helpers.js';

describe('release schedule snapshot emission', () => {
  let env: TestEnv;

  beforeEach(() => {
    env = makeEnv();
  });

  afterEach(() => {
    env.db.close();
    rmSync(env.dir, { recursive: true, force: true });
  });

  it('writes the validated TVA schedule and forecast context at its frozen URL', () => {
    const payload = {
      waterId: 'watauga-river',
      locationId: 'WL',
      retrievedAt: '2026-09-13T12:00:00Z',
      sourceUrl: 'https://www.tva.com/environment/lake-levels',
      status: 'available',
      releases: [{ date: '2026-09-13', startTime: '1 AM', endTime: '5 AM', timeZone: 'EDT', generators: '1' }],
      forecasts: [{ date: '2026-09-13', averageOutflowCfs: 1500 }],
    };
    env.db
      .prepare('INSERT INTO release_schedules (water_id, location_id, retrieved_at, payload) VALUES (?, ?, ?, ?)')
      .run('watauga-river', 'WL', payload.retrievedAt, JSON.stringify(payload));

    const result = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: new Date('2026-09-13T12:30:00Z') });
    expect(result.releaseSchedules).toBe(1);
    const path = join(env.snapshotsDir, 'v1', 'release-schedule', 'watauga-river.json');
    expect(existsSync(path)).toBe(true);
    expect(ReleaseScheduleSchema.parse(JSON.parse(readFileSync(path, 'utf8')))).toMatchObject({
      status: 'available',
      releases: [{ generators: '1' }],
      forecasts: [{ averageOutflowCfs: 1500 }],
    });
  });

  it('withholds a schedule older than 3 h instead of serving stale Now/Next blocks', () => {
    const payload = {
      waterId: 'clinch-river',
      locationId: 'NRST1',
      retrievedAt: '2026-10-14T08:00:00Z',
      sourceUrl: 'https://www.tva.com/environment/lake-levels',
      status: 'available',
      releases: [{ date: '2026-10-14', startTime: '1 AM', endTime: 'Midnight', timeZone: 'EDT', generators: '2 or more' }],
      forecasts: [{ date: '2026-10-14', averageOutflowCfs: 8048 }],
    };
    env.db
      .prepare('INSERT INTO release_schedules (water_id, location_id, retrieved_at, payload) VALUES (?, ?, ?, ?)')
      .run('clinch-river', 'NRST1', payload.retrievedAt, JSON.stringify(payload));

    const fresh = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: new Date('2026-10-14T10:59:00Z') });
    const path = join(env.snapshotsDir, 'v1', 'release-schedule', 'clinch-river.json');
    expect(JSON.parse(readFileSync(path, 'utf8'))).toMatchObject({ status: 'available', releases: [{ endTime: 'Midnight' }] });
    expect(fresh.warnings.join(' ')).not.toMatch(/clinch-river stale/);

    const stale = buildSnapshots({ db: env.db, snapshotsDir: env.snapshotsDir, now: new Date('2026-10-14T11:01:00Z') });
    const published = ReleaseScheduleSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
    expect(published).toMatchObject({ status: 'unavailable', releases: [], forecasts: [], retrievedAt: '2026-10-14T08:00:00Z' });
    expect(published.error).toMatch(/last retrieved 2026-10-14T08:00:00Z/);
    expect(stale.warnings.join(' ')).toMatch(/release schedule clinch-river stale/);
  });
});
