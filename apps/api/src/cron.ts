// Trout cron worker (Role 3): schedules per non-negotiable #5 —
//   gauges    hourly at :05
//   stocking  daily 06:00
//   snapshots nightly 04:30 safety net (also regenerated after each ingestion)
// Every run lands in jobs_log; a failing job never kills the worker (soft-fail).
import cron from 'node-cron';
import { resolve } from 'node:path';
import { openDb } from './db.js';
import { loadEnv } from './env.js';
import { pipelineConfig, runJob } from './pipeline.js';

const env = loadEnv();
const db = openDb(resolve(env.TROUT_DB_PATH));
const cfg = pipelineConfig(env);

let running = false;
async function guarded(job: 'gauges' | 'stocking' | 'snapshots'): Promise<void> {
  if (running) {
    console.log(`[${new Date().toISOString()}] ${job} skipped — previous run still in flight`);
    return;
  }
  running = true;
  try {
    const outcome = await runJob(db, cfg, job);
    console.log(`[${new Date().toISOString()}] ${job} finished: ${JSON.stringify(outcome.detail)}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${job} crashed: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

cron.schedule('5 * * * *', () => void guarded('gauges'));
cron.schedule('0 6 * * *', () => void guarded('stocking'));
cron.schedule('30 4 * * *', () => void guarded('snapshots'));

console.log('trout cron scheduled: gauges hourly :05, stocking daily 06:00, snapshots nightly 04:30 (Ctrl+C to stop)');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    db.close();
    process.exit(0);
  });
}
