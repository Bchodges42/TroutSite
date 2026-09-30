import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../src/db.js';
import { seedContent } from '../src/lib/seed.js';
import type { Db } from '../src/db.js';

const VALID_STREAM_YAML = `\
id: guadalupe-river-tailrace
name: Guadalupe River (Tailrace)
aliases: [Guadalupe tailwater]
stateId: TX
waterbodyType: tailrace
regionId: tx-hill-country
gaugeIds: ["08155500"]
stockingProgram: true
idealFlow:
  - min: 100
    max: 400
    unit: cfs
notes: Tailrace below Canyon Dam.
species: trout
officialSources:
  - label: TPWD stocking schedule
    url: https://tpwd.texas.gov/fishing/stocking
hydroIdentity:
  gnisIds: ["08155500"]
  huc8s: ["12090202"]
`;

const VALID_SHOP_YAML = `\
id: guadalupe-trout
name: Guadalupe Trout Fly Shop
stateId: TX
town: New Braunfels
websiteUrl: https://example.com
reportsEnabled: true
`;

function write(dir: string, rel: string, content: string): void {
  const p = join(dir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

describe('seedContent', () => {
  let db: Db;
  let dbDir: string;
  let contentDir: string;

  beforeEach(() => {
    dbDir = mkdtempSync(join(tmpdir(), 'trout-seed-'));
    contentDir = mkdtempSync(join(tmpdir(), 'trout-content-'));
    db = openDb(join(dbDir, 'seed.db'));
  });

  afterEach(() => {
    db.close();
    rmSync(dbDir, { recursive: true, force: true });
    rmSync(contentDir, { recursive: true, force: true });
  });

  it('succeeds with zero content files (empty content pack)', () => {
    const result = seedContent(db, contentDir);
    expect(result).toEqual({ streams: 0, shops: 0, streamsArchived: 0, shopsArchived: 0 });
    const jobs = db.prepare("SELECT COUNT(*) AS n FROM jobs_log WHERE job = 'seed'").get() as {
      n: number;
    };
    expect(jobs.n).toBe(1);
  });

  it('seeds valid streams and shops into the tables', () => {
    write(contentDir, 'streams/TX/guadalupe-river-tailrace.yaml', VALID_STREAM_YAML);
    write(contentDir, 'shops/TX/guadalupe-trout.yaml', VALID_SHOP_YAML);

    const result = seedContent(db, contentDir);
    expect(result.streams).toBe(1);
    expect(result.shops).toBe(1);

    const stream = db
      .prepare("SELECT * FROM streams WHERE id = 'guadalupe-river-tailrace'")
      .get() as {
      state_id: string;
      gauge_ids: string;
      stocking_program: number;
      ideal_flow: string;
      species: string | null;
      aliases: string;
      fishery: string | null;
      year_round: number | null;
      hydro_identity: string | null;
    };
    expect(stream.state_id).toBe('TX');
    expect(JSON.parse(stream.gauge_ids)).toEqual(['08155500']);
    expect(stream.stocking_program).toBe(1);
    expect(JSON.parse(stream.ideal_flow)).toEqual([{ min: 100, max: 400, unit: 'cfs' }]);
    // B08: species applicability must survive the seed round trip (NULL when unset).
    expect(stream.species).toBe('trout');
    expect(JSON.parse(stream.aliases)).toEqual(['Guadalupe tailwater']);
    expect(JSON.parse(stream.hydro_identity!)).toEqual({ gnisIds: ['08155500'], huc8s: ['12090202'] });

    const shop = db.prepare("SELECT * FROM shops WHERE id = 'guadalupe-trout'").get() as {
      reports_enabled: number;
    };
    expect(shop.reports_enabled).toBe(1);
  });

  it('upserts on re-seed instead of failing on duplicate ids', () => {
    write(contentDir, 'streams/TX/guadalupe-river-tailrace.yaml', VALID_STREAM_YAML);
    seedContent(db, contentDir);
    expect(() => seedContent(db, contentDir)).not.toThrow();
    const row = db.prepare('SELECT COUNT(*) AS n FROM streams').get() as { n: number };
    expect(row.n).toBe(1);
  });

  it('throws on malformed YAML with the file path in the error', () => {
    write(contentDir, 'streams/TX/broken.yaml', 'id: [unclosed');
    expect(() => seedContent(db, contentDir)).toThrow(/broken\.yaml/);
  });

  it('throws on YAML that violates the contract schemas', () => {
    write(
      contentDir,
      'streams/TX/bad-stream.yaml',
      VALID_STREAM_YAML.replace('stateId: TX', 'stateId: tx'),
    );
    expect(() => seedContent(db, contentDir)).toThrow(/Invalid stream content/);
  });

  it('ignores non-stream/shop content directories entirely', () => {
    write(contentDir, 'bugs/baetis.yaml', VALID_SHOP_YAML); // wrong dir, never read
    const result = seedContent(db, contentDir);
    expect(result).toEqual({ streams: 0, shops: 0, streamsArchived: 0, shopsArchived: 0 });
  });

  /** A second valid authored water (the audit's two-waters repro). */
  const SECOND_STREAM_YAML = VALID_STREAM_YAML.replaceAll(
    'guadalupe-river-tailrace',
    'llano-river',
  ).replaceAll('Guadalupe River (Tailrace)', 'Llano River');

  /** F22 audit repro: seed two waters, remove one YAML, reseed. The removal
   *  must propagate — the published catalog membership syncs (one ACTIVE
   *  stream) while the removed row is soft-archived (kept, archived_at
   *  stamped) so historical shop_reports keep a real referenced row. */
  it('removing a YAML reseed archives the water instead of keeping it active (and keeps history referencable)', () => {
    write(contentDir, 'streams/TX/guadalupe-river-tailrace.yaml', VALID_STREAM_YAML);
    write(contentDir, 'streams/TX/llano-river.yaml', SECOND_STREAM_YAML);
    write(contentDir, 'shops/TX/guadalupe-trout.yaml', VALID_SHOP_YAML);
    expect(seedContent(db, contentDir)).toMatchObject({ streams: 2, shops: 1 });

    rmSync(join(contentDir, 'streams/TX/llano-river.yaml'));
    rmSync(join(contentDir, 'shops/TX/guadalupe-trout.yaml'));
    const result = seedContent(db, contentDir);

    // The result reports authored INPUT (one stream), not stale persistence.
    expect(result.streams).toBe(1);
    expect(result.shops).toBe(0);
    expect(result.streamsArchived).toBe(1);
    expect(result.shopsArchived).toBe(1);

    // Catalog membership synced: exactly one ACTIVE stream/shop...
    expect(
      (db.prepare('SELECT COUNT(*) AS n FROM streams WHERE archived_at IS NULL').get() as { n: number }).n,
    ).toBe(1);
    expect(
      (db.prepare('SELECT COUNT(*) AS n FROM shops WHERE archived_at IS NULL').get() as { n: number }).n,
    ).toBe(0);
    expect(
      db.prepare("SELECT COUNT(*) AS n FROM streams WHERE id = 'guadalupe-river-tailrace' AND archived_at IS NULL").get(),
    ).toMatchObject({ n: 1 });

    // ...and the removed rows survive as ARCHIVED history (report/token rows
    // keep a real referenced row — never left dangling).
    const archived = db.prepare("SELECT archived_at FROM streams WHERE id = 'llano-river'").get() as {
      archived_at: string | null;
    };
    expect(archived.archived_at).toBeTruthy();
    expect(
      (db.prepare("SELECT archived_at FROM shops WHERE id = 'guadalupe-trout'").get() as { archived_at: string | null })
        .archived_at,
    ).toBeTruthy();
  });

  it('restores an archived water when its YAML returns', () => {
    write(contentDir, 'streams/TX/llano-river.yaml', SECOND_STREAM_YAML);
    seedContent(db, contentDir);
    rmSync(join(contentDir, 'streams/TX/llano-river.yaml'));
    seedContent(db, contentDir);
    expect(
      (db.prepare("SELECT archived_at FROM streams WHERE id = 'llano-river'").get() as { archived_at: string | null })
        .archived_at,
    ).toBeTruthy();

    write(contentDir, 'streams/TX/llano-river.yaml', SECOND_STREAM_YAML);
    const result = seedContent(db, contentDir);
    expect(result).toMatchObject({ streams: 1, streamsArchived: 0 });
    expect(
      db.prepare("SELECT archived_at FROM streams WHERE id = 'llano-river'").get() as { archived_at: string | null },
    ).toMatchObject({ archived_at: null });
  });

  /** F22 audit repro: a valid change followed by an invalid row. The seed
   *  throws AND applies nothing — no partly updated catalog behind a failed
   *  job result, no 'ok' job log row. */
  it('a failed seed applies NOTHING (valid row before an invalid row stays unchanged)', () => {
    write(contentDir, 'streams/TX/guadalupe-river-tailrace.yaml', VALID_STREAM_YAML);
    seedContent(db, contentDir);

    // Valid rename of the existing water + a contract-violating second water:
    // the old code applied the rename before throwing on the bad row.
    write(
      contentDir,
      'streams/TX/guadalupe-river-tailrace.yaml',
      VALID_STREAM_YAML.replace('name: Guadalupe River (Tailrace)', 'name: Renamed Before Failure'),
    );
    write(contentDir, 'streams/TX/bad-later.yaml', VALID_STREAM_YAML.replace('stateId: TX', 'stateId: tx'));

    expect(() => seedContent(db, contentDir)).toThrow(/Invalid stream content/);

    const row = db.prepare("SELECT name FROM streams WHERE id = 'guadalupe-river-tailrace'").get() as {
      name: string;
    };
    expect(row.name).toBe('Guadalupe River (Tailrace)');
    expect(db.prepare("SELECT COUNT(*) AS n FROM streams WHERE id = 'bad-later'").get()).toMatchObject({ n: 0 });
    expect(
      db.prepare("SELECT COUNT(*) AS n FROM jobs_log WHERE job = 'seed' AND status = 'ok'").get(),
    ).toMatchObject({ n: 1 }); // only the first, successful seed

    // The failed run left the content dir valid again? No — prove recovery:
    // fixing the bad row publishes the rename on the next seed.
    rmSync(join(contentDir, 'streams/TX/bad-later.yaml'));
    expect(seedContent(db, contentDir)).toMatchObject({ streams: 1, streamsArchived: 0 });
    expect(
      (db.prepare("SELECT name FROM streams WHERE id = 'guadalupe-river-tailrace'").get() as { name: string }).name,
    ).toBe('Renamed Before Failure');
  });
});
