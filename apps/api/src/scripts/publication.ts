import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import { loadEnv } from '../env.js';
import { pipelineConfig } from '../pipeline.js';
import { ownerPaths } from '../owner/operations.js';
import { preparePublication, publishPreparedPublication } from '../owner/publication.js';

const { values } = parseArgs({ args: process.argv.slice(2).filter((arg) => arg !== '--'), strict: true,
  options: { action: { type: 'string', default: 'prepare' }, id: { type: 'string' } } });
const env = loadEnv(); const cfg = pipelineConfig(env); const paths = ownerPaths(env);
if (values.action === 'prepare') {
  const db = new Database(resolve(env.TROUT_DB_PATH), { readonly: true, fileMustExist: true });
  try {
    const candidate = preparePublication({ db, snapshotsDir: cfg.snapshotsDir, contentPackDir: cfg.contentPackDir,
      siteUrl: env.SITE_URL, now: new Date() }, paths.publicationDir);
    console.log(`[publication] prepared ${candidate.id}: ${candidate.affectedWaters} affected waters, ${candidate.fileChanges} changed files`);
    console.log('[publication] Review /v1/owner/publication-preview in the owner dashboard. Live files were not changed.');
  } finally { db.close(); }
} else if (values.action === 'publish' && values.id) {
  publishPreparedPublication(paths.publicationDir, cfg.snapshotsDir, values.id, new Date());
  console.log(`[publication] published reviewed candidate ${values.id}`);
} else { console.error('Use --action=prepare, or owner-authorized --action=publish --id=<reviewed-id>'); process.exitCode = 2; }
