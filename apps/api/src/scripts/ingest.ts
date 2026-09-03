// ingest CLI (Role 3):
//   pnpm --filter api ingest --job=gauges|stocking|snapshots|all [--states=TN,OK] [--dry-run]
// --dry-run parses every recorded fixture, validates against the frozen contracts, and
// performs NO writes and NO network. Live runs are soft-fail: adapter failures land in
// jobs_log and the process exits 0; only crashes/fixture failures exit non-zero.
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { openDb } from '../db.js';
import { loadEnv } from '../env.js';
import { dryRun, pipelineConfig, runJob, type JobName } from '../pipeline.js';

// pnpm forwards the literal `--` separator on Windows/Git Bash; strict parseArgs
// would reject it as a positional, so strip it before parsing.
const argv = process.argv.slice(2).filter((a) => a !== '--');
const { values } = parseArgs({
  args: argv,
  options: {
    job: { type: 'string', default: 'all' },
    states: { type: 'string', default: '' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: true,
});

const jobRaw = values.job;
if (!['gauges', 'stocking', 'snapshots', 'all'].includes(jobRaw)) {
  console.error(`[ingest] unknown --job=${jobRaw} (use gauges|stocking|snapshots|all)`);
  process.exit(2);
}
const states = values.states ? values.states.split(',').map((s) => s.trim().toUpperCase()) : [];
const env = loadEnv();
const cfg = pipelineConfig(env);

if (values['dry-run']) {
  const result = dryRun(cfg);
  console.log(
    `[ingest] dry-run: ${result.fixtureSets} fixture set(s), ${result.readings} reading(s), ${result.events} stocking event(s)`,
  );
  for (const w of result.warnings) console.log(`[ingest]   warn: ${w}`);
  for (const e of result.errors) console.error(`[ingest]   ERROR: ${e}`);
  if (!result.ok) {
    console.error('[ingest] dry-run FAILED');
    process.exit(1);
  }
  console.log('[ingest] dry-run OK (no writes performed)');
  process.exit(0);
}

const db = openDb(resolve(env.TROUT_DB_PATH));
const jobs: JobName[] = jobRaw === 'all' ? ['gauges', 'stocking'] : [jobRaw as JobName];

let failed = 0;
for (const j of jobs) {
  try {
    const outcome = await runJob(db, cfg, j, states.length > 0 ? { states } : {});
    if (!outcome.ok) failed += 1;
    console.log(`[ingest] ${j}: ${outcome.ok ? 'ok' : 'soft-failed'} ${JSON.stringify(outcome.detail)}`);
  } catch (err) {
    failed += 1;
    console.error(`[ingest] ${j} crashed: ${(err as Error).message}`);
  }
}

db.close();
process.exit(failed > 0 ? 1 : 0);
