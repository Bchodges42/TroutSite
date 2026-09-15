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
    expect(result).toEqual({ streams: 0, shops: 0 });
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
    };
    expect(stream.state_id).toBe('TX');
    expect(JSON.parse(stream.gauge_ids)).toEqual(['08155500']);
    expect(stream.stocking_program).toBe(1);
    expect(JSON.parse(stream.ideal_flow)).toEqual([{ min: 100, max: 400, unit: 'cfs' }]);
    // B08: species applicability must survive the seed round trip (NULL when unset).
    expect(stream.species).toBe('trout');
    expect(JSON.parse(stream.aliases)).toEqual(['Guadalupe tailwater']);

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
    expect(result).toEqual({ streams: 0, shops: 0 });
  });
});
