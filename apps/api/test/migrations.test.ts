import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDb, migrationsDir } from '../src/db.js';
import { makeTempDir } from './helpers.js';
import type { Db } from '../src/db.js';

const EXPECTED_TABLES = [
  'streams',
  'shops',
  'shop_reports',
  'gauge_readings_raw',
  'stocking_events',
  'jobs_log',
  'schema_migrations',
];

describe('migrations', () => {
  let db: Db;
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
    db = openDb(`${dir}/test.db`);
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates every table required by §5 of the plan', () => {
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
    ).map((r) => r.name);
    for (const t of EXPECTED_TABLES) {
      expect(tables).toContain(t);
    }
  });

  it('is idempotent (re-opening does not duplicate or fail)', () => {
    let reopened: Db | undefined;
    expect(() => {
      reopened = openDb(`${dir}/test.db`);
    }).not.toThrow();
    const applied = reopened!.prepare('SELECT name FROM schema_migrations').all() as {
      name: string;
    }[];
    reopened!.close();
    // 001_init (Role 1) + 002_gauge_readings_normalized (Role 3)
    // + 003_report_photo_url (Role 6 integration, ADR 0002)
    // + 004_stream_species (B08 follow-up: species on catalog streams)
    // + 005_stocking_date_precision (legacy production compatibility)
    // + 006_streams_waterbody_types (legacy DB CHECK rebuild for lake/pond)
    // + 007_evidence_runs (data-sources lane: water-evidence run log).
    // + 008_streams_target_species (F5 fishability, contract v2 / ADR 0007).
    // + 009_region_pressure (F8 NWS area-level barometric pressure).
    expect(applied).toHaveLength(9);
    expect(applied[0]!.name).toMatch(/^001_/);
    expect(applied[1]!.name).toMatch(/^002_/);
    expect(applied[2]!.name).toMatch(/^003_/);
    expect(applied[7]!.name).toMatch(/^008_/);
    expect(applied[8]!.name).toMatch(/^009_/);
  });

  it('reads migrations from the apps/api/migrations directory', () => {
    expect(migrationsDir()).toMatch(/apps[\\/]api[\\/]migrations$/);
  });
});
