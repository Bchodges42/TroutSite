import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from '../src/db.js';
import { seedContent } from '../src/lib/seed.js';
import type { Db } from '../src/db.js';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

/** apps/api/fixtures — recorded scraper payloads + bootstrap content YAML. */
export function fixturesDir(): string {
  return resolve(THIS_DIR, '../fixtures');
}

export function readFixture(rel: string): string {
  return readFileSync(join(fixturesDir(), rel), 'utf8');
}

/** Fresh temp directory for test fixtures/databases. Caller cleans up. */
export function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'trout-test-'));
}

export interface TestEnv {
  db: Db;
  dir: string;
  snapshotsDir: string;
  rawDir: string;
}

/**
 * Standard test environment: temp DB (migrated), temp snapshot/raw dirs, and the
 * bootstrap content pack (2 TN streams + 1 shop from fixtures/content) seeded.
 */
export function makeEnv(): TestEnv {
  const dir = makeTempDir();
  const db = openDb(join(dir, 'test.db'));
  seedContent(db, join(fixturesDir(), 'content'));
  return { db, dir, snapshotsDir: join(dir, 'public', 'data'), rawDir: join(dir, 'raw') };
}

/** Mock fetch returning a canned Response; records requested URLs. */
export function mockFetch(
  status: number,
  body: string | ((url: string) => string),
): { fetchImpl: typeof fetch; urls: string[] } {
  const urls: string[] = [];
  const fetchImpl = (async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    urls.push(url);
    const content = typeof body === 'function' ? body(url) : body;
    return new Response(content, { status, headers: { 'content-type': 'text/plain' } });
  }) as typeof fetch;
  return { fetchImpl, urls };
}
