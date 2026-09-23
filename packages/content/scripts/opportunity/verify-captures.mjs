/* eslint-disable no-undef -- Node script run directly */
/** Verify the exact evidence bytes distributed in Git against the source log. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { ARTIFACT_DIR, REPO_ROOT } from './lib.mjs';

const log = JSON.parse(readFileSync(resolve(ARTIFACT_DIR, 'captures', 'source-log.json'), 'utf8'));
const errors = [];
const root = resolve(REPO_ROOT) + sep;
for (const capture of log.captures) {
  if (!capture.id || !capture.url || capture.status !== 200 || !capture.retrievedAt) {
    errors.push(`${capture.id ?? 'unknown'}: incomplete source metadata`);
    continue;
  }
  const path = resolve(REPO_ROOT, capture.file ?? '');
  if (!path.startsWith(root)) {
    errors.push(`${capture.id}: capture file is outside the repository`);
    continue;
  }
  try {
    const bytes = readFileSync(path);
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== capture.bytes || hash !== capture.sha256) {
      errors.push(`${capture.id}: committed bytes/hash differ from source log`);
    }
  } catch {
    errors.push(`${capture.id}: capture file is missing (${capture.file})`);
  }
}
console.log(`verify-captures: ${log.captures.length} captures, ${errors.length} errors`);
for (const error of errors) console.error('ERROR:', error);
process.exit(errors.length ? 1 : 0);
