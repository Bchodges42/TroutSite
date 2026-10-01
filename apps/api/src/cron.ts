// Trout cron worker (Role 3): schedules per non-negotiable #5 —
//   gauges     hourly at :05
//   pressure   hourly at :35 (F05: NWS area pressure/rain — same job the
//              production refresh-data.sh runs; parity between stacks)
//   stocking   daily 06:00
//   evidence   daily 06:20 (data-sources lane: USGS + TVA + TWRA evidence assembly)
//   snapshots  nightly 04:30 safety net (also regenerated after each ingestion)
//   watchlists every 15 min (ADR 0016: evaluate watch rules against the
//              SNAPSHOT FILES — never upstream providers — and push notices;
//              off-peak friendly cadence, its own single-flight flag)
// Every run lands in jobs_log; a failing job never kills the worker (soft-fail).
import cron from 'node-cron';
import { resolve } from 'node:path';
import { openDb } from './db.js';
import { loadEnv } from './env.js';
import { pipelineConfig, runJob, type JobName } from './pipeline.js';

const env = loadEnv();
const db = openDb(resolve(env.TROUT_DB_PATH));
const cfg = pipelineConfig(env);

let running = false;
async function guarded(job: JobName): Promise<void> {
  if (running) {
    console.log(`[${new Date().toISOString()}] ${job} skipped — previous run still in flight`);
    return;
  }
  running = true;
  try {
    const outcome = await runJob(db, cfg, job);
    console.log(`[${new Date().toISOString()}] ${job} finished: ok=${outcome.ok} ${JSON.stringify(outcome.detail)}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${job} crashed: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

cron.schedule('5 * * * *', () => void guarded('gauges'));
cron.schedule('35 * * * *', () => void guarded('pressure'));
cron.schedule('0 6 * * *', () => void guarded('stocking'));
cron.schedule('20 6 * * *', () => void guarded('evidence'));
cron.schedule('30 4 * * *', () => void guarded('snapshots'));
cron.schedule('*/15 * * * *', () => void guarded('watchlists'));

console.log('trout cron scheduled: gauges hourly :05, pressure hourly :35, stocking daily 06:00, evidence daily 06:20, snapshots nightly 04:30, watchlists every 15 min (Ctrl+C to stop)');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    db.close();
    process.exit(0);
  });
}
