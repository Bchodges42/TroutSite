import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Fresh temp directory for test fixtures/databases. Caller cleans up. */
export function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'trout-test-'));
}
