import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
export function ownerPaths(env: { TROUT_OPS_STATUS_DIR?: string; TROUT_PUBLICATION_DIR?: string }) {
  return { opsStatusDir: resolve(ROOT, env.TROUT_OPS_STATUS_DIR ?? 'backups'),
    publicationDir: resolve(ROOT, env.TROUT_PUBLICATION_DIR ?? 'backups/publication') };
}
const STATES = new Set(['OK', 'UP-TO-DATE', 'DEPLOYED', 'HEALED-REGEN', 'HEALED-RESTORE', 'BROKEN',
  'FAIL', 'FAIL-FETCH', 'FAIL-DEPLOY', 'FAIL-NODB', 'FAIL-BACKUP', 'REFUSED-DIRTY', 'REFUSED-SKEW',
  'REFUSED', 'FAIL-SEED', 'FAIL-SNAPSHOTS', 'FAIL-VERIFY', 'DEGRADED', 'DRY-RUN']);
export interface OperationStatus { area: 'auto-update' | 'backup' | 'watchdog' | 'refresh' | 'deploy';
  state: string; recordedAt: string | null; revision: string | null }
/** Read only fixed status files. Never open logs, env, push-url.txt or database backups. */
export function readOperationStatuses(dir?: string): OperationStatus[] {
  const specs = [['auto-update', 'autoupdate.status'], ['backup', 'backup.status'],
    ['watchdog', 'watchdog.status'], ['refresh', 'refresh-data.status'], ['deploy', 'last-good-rev']] as const;
  return specs.map(([area, file]) => {
    const unknown: OperationStatus = { area, state: 'not-collected', recordedAt: null, revision: null };
    if (!dir || !existsSync(join(dir, file))) return unknown;
    try {
      const stat = lstatSync(join(dir, file));
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 512) return { ...unknown, state: 'invalid' };
      const [state, timestamp, ...extra] = readFileSync(join(dir, file), 'utf8').trim().split(/\s+/);
      if (!state || !timestamp || extra.length || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(timestamp) || !Number.isFinite(Date.parse(timestamp))) return { ...unknown, state: 'invalid' };
      if (area === 'deploy') return /^[a-f0-9]{40}$/.test(state)
        ? { area, state: 'verified', recordedAt: timestamp, revision: state } : { ...unknown, state: 'invalid' };
      return STATES.has(state) ? { area, state, recordedAt: timestamp, revision: null } : { ...unknown, state: 'unknown' };
    } catch { return { ...unknown, state: 'invalid' }; }
  });
}
