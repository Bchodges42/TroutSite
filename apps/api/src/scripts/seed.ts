import { resolve } from 'node:path';
import { loadEnv } from '../env.js';
import { openDb } from '../db.js';
import { seedContent } from '../lib/seed.js';

const env = loadEnv();
const dbPath = resolve(process.cwd(), env.TROUT_DB_PATH);
const contentDir = resolve(
  process.cwd(),
  env.TROUT_CONTENT_DIR ?? '../../packages/content',
);

try {
  const db = openDb(dbPath);
  const result = seedContent(db, contentDir);
  console.log(
    `[seed] db=${dbPath}\n[seed] content=${contentDir}\n[seed] seeded ${result.streams} stream(s), ${result.shops} shop(s)` +
      (result.streams + result.shops === 0 ? ' — content pack is empty, nothing to seed (OK)' : ''),
  );
  db.close();
} catch (err) {
  console.error(`[seed] FAILED: ${(err as Error).message}`);
  process.exit(1);
}
