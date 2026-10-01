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
    // + 010_stream_authored_metadata (campaign display/source/season fields).
    // + 011_release_schedules (TVA release/forecast context).
    // + 012_precipitation_context (USGS 00045 rain context).
    // + 013_region_precipitation (NWS rolling rain fallback).
    // + 014_dissolved_oxygen_reservoir_level (DO/reservoir columns for DBs that
    //   predate the campaign; 002 no longer creates them in place).
    // + 015_stream_catalog_metadata (aliases/fishery/year-round round trip,
    //   selectable-river expansion; renumbered from the expansion's 008 —
    //   main already used 008 for target species).
    // + 016_stream_hydro_identity (GNIS/HUC identity for selectable lines).
    // + 017_stream_opportunity (ADR 0010 authored fishery-opportunity block).
    // + 018_report_idempotency_key (F02: partial UNIQUE (shop_id, idempotency_key)
    //   so retries of an accepted portal report replay instead of double-inserting).
    // + 019_stream_shop_archival (F22: archived_at removal policy — seeded rows
    //   whose YAML disappears are archived, never left active or hard-deleted).
    // + 020_corrections (ADR 0015: user-suggested corrections moderation queue
    //   + corrections_audit trail; receipts stored only as keyed HMACs).
    // + 021_watchlists (ADR 0016: pseudonymous push subscriptions + watch
    //   rules — the one deliberate server-side exception to local-first).
    //   NOTE: two-digit zero-padding is load-bearing — the runner sorts
    //   filenames lexicographically, so '0020_…' would sort before '002_…'.
    expect(applied).toHaveLength(23);
    expect(applied[0]!.name).toMatch(/^001_/);
    expect(applied[1]!.name).toMatch(/^002_/);
    expect(applied[2]!.name).toMatch(/^003_/);
    expect(applied[7]!.name).toMatch(/^008_/);
    expect(applied[8]!.name).toMatch(/^009_/);
    expect(applied[9]!.name).toMatch(/^010_/);
    expect(applied[10]!.name).toMatch(/^011_/);
    expect(applied[11]!.name).toMatch(/^012_/);
    expect(applied[12]!.name).toMatch(/^013_/);
    expect(applied[13]!.name).toMatch(/^014_/);
    expect(applied[14]!.name).toMatch(/^015_/);
    expect(applied[15]!.name).toMatch(/^016_/);
    expect(applied[16]!.name).toMatch(/^017_/);
    expect(applied[17]!.name).toMatch(/^018_/);
    expect(applied[18]!.name).toMatch(/^019_/);
    expect(applied[19]!.name).toMatch(/^020_/);
    expect(applied[20]!.name).toMatch(/^021_/);
    expect(applied[21]!.name).toMatch(/^022_/);
    expect(applied[22]!.name).toMatch(/^023_/);
  });

  it('adds archived_at to streams and shops (F22 removal policy: NULL = active)', () => {
    const columns = (t: string) =>
      (
        db.prepare(`SELECT name FROM pragma_table_info('${t}')`).all() as { name: string }[]
      ).map((c) => c.name);
    expect(columns('streams')).toContain('archived_at');
    expect(columns('shops')).toContain('archived_at');
    // Existing rows are active after the additive migration.
    db.prepare(
      "INSERT INTO streams (id, name, state_id, waterbody_type, region_id) VALUES ('legacy-water', 'Legacy', 'TN', 'river', 'r')",
    ).run();
    expect(
      db.prepare("SELECT archived_at FROM streams WHERE id = 'legacy-water'").get(),
    ).toMatchObject({ archived_at: null });
  });

  it('enforces one row per (shop, idempotency key) so report retries cannot double-insert', () => {
    // openDb alone has no shops rows (seedContent is a test/seed step), so create
    // two shops here for the per-shop scoping assertions.
    db.prepare(
      "INSERT INTO shops (id, name, state_id, town, website_url, reports_enabled) VALUES ('test-fly-shop', 'A', 'TN', 'X', 'https://example.com', 1)",
    ).run();
    db.prepare(
      "INSERT INTO shops (id, name, state_id, town, website_url, reports_enabled) VALUES ('other-shop', 'B', 'TN', 'X', 'https://example.com', 1)",
    ).run();
    const insert = db.prepare(
      `INSERT INTO shop_reports (id, shop_id, stream_id, date, body, hot_patterns, attribution_url, published_at, idempotency_key)
       VALUES (?, 'test-fly-shop', null, '2026-09-29', 'body', '[]', 'https://example.com', '2026-09-29T00:00:00Z', ?)`,
    );
    insert.run('rep-a', 'key-1');
    insert.run('rep-b', null); // keyless rows never collide
    insert.run('rep-c', null);
    expect(() => insert.run('rep-d', 'key-1')).toThrow(/UNIQUE/);
    // Different shop, same key: independent.
    expect(() =>
      db.prepare(
        `INSERT INTO shop_reports (id, shop_id, stream_id, date, body, hot_patterns, attribution_url, published_at, idempotency_key)
         VALUES ('rep-e', 'other-shop', null, '2026-09-29', 'body', '[]', 'https://example.com', '2026-09-29T00:00:00Z', 'key-1')`,
      ).run(),
    ).not.toThrow();
  });

  it('reads migrations from the apps/api/migrations directory', () => {
    expect(migrationsDir()).toMatch(/apps[\\/]api[\\/]migrations$/);
  });
});
