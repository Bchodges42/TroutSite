import { mkdirSync, renameSync, writeFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Atomic file write: write to <path>.tmp-<pid> then rename over the target.
 * Consumers (PWA fetch, Cloudflare cache) never see a partially written snapshot.
 */
export function writeFileAtomic(path: string, contents: string): void {
  const tmp = `${path}.tmp-${process.pid}`;
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(tmp, contents, 'utf8');
    renameSync(tmp, path);
  } catch (err) {
    try {
      rmSync(tmp, { force: true });
    } catch {
      // best effort — the original error matters more
    }
    throw err;
  }
}

/** Serialize + atomic write with a trailing newline for friendlier diffs. */
export function writeJsonAtomic(path: string, value: unknown): void {
  writeFileAtomic(path, `${JSON.stringify(value)}\n`);
}
