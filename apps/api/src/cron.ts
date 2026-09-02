// ROLE 1 skeleton cron worker. ROLE 3 replaces the tick body with the real pipeline:
// USGS + state-page ingestion → SQLite → snapshot regeneration into apps/web/public/data/.
import cron from 'node-cron';
import { loadEnv } from './env.js';
import { openDb } from './db.js';

const env = loadEnv();
const db = openDb(env.TROUT_DB_PATH);

cron.schedule('5 * * * *', () => {
  const started = new Date().toISOString();
  db.prepare(
    'INSERT INTO jobs_log (job, status, started_at, finished_at, detail) VALUES (?, ?, ?, ?, ?)',
  ).run('cron-tick', 'ok', started, started, 'ingest/snapshot pipeline pending (ROLE 3)');
  console.log(`[${started}] trout cron tick — ingest pipeline not implemented yet (ROLE 3)`);
});

console.log('trout cron scheduled: hourly at :05 (Ctrl+C to stop)');
