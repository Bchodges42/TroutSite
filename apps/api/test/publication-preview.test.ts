import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Fastify from 'fastify';
import { afterEach, expect, it } from 'vitest';
import { makeEnv, type TestEnv } from './helpers.js';
import { buildSnapshots } from '../src/snapshots/build.js';
import { generationHash, preparePublication, publishPreparedPublication, readPublicationPreview } from '../src/owner/publication.js';
import { readOperationStatuses } from '../src/owner/operations.js';
import { registerOwnerRoutes } from '../src/owner/routes.js';

let env: TestEnv | undefined;
afterEach(() => { if (env) { env.db.close(); rmSync(env.dir, { recursive: true, force: true, maxRetries: 3 }); env = undefined; } });
const now = new Date('2026-10-01T15:00:00Z');
function prepared() {
  env = makeEnv(); const dir = join(env.dir, 'private-publication');
  const opts = { db: env.db, snapshotsDir: env.snapshotsDir, now };
  buildSnapshots(opts); const before = generationHash(env.snapshotsDir);
  const water = (env.db.prepare('SELECT id FROM streams LIMIT 1').get() as { id: string }).id;
  env.db.prepare('UPDATE streams SET notes = ?, opportunity = ? WHERE id = ?').run('New source-reviewed wording',
    JSON.stringify({ trout: 'unresolved', evidenceState: 'unresolved', asOf: '2026', unresolvedQuestion: 'Retrieve a current assessment', caveats: [] }), water);
  const publication = preparePublication(opts, dir);
  return { dir, opts, before, water, publication };
}
it('previews actual public claims without publishing and promotes precisely the reviewed bytes', () => {
  const { dir, opts, before, publication, water } = prepared();
  expect(generationHash(opts.snapshotsDir)).toBe(before);
  expect(readPublicationPreview(dir, opts.snapshotsDir).state).toBe('ready');
  expect(publication.waters.find((w) => w.id === water)?.afterWording).toContain('Trout status unresolved');
  expect(publication.waters.find((w) => w.id === water)?.changes).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'notes', after: 'New source-reviewed wording' })]));
  publishPreparedPublication(dir, opts.snapshotsDir, publication.id, now);
  expect(generationHash(opts.snapshotsDir)).toBe(publication.candidateHash);
  expect(readPublicationPreview(dir, opts.snapshotsDir).state).toBe('published');
  expect(() => publishPreparedPublication(dir, opts.snapshotsDir, publication.id, now)).toThrow();
});
it('refuses baseline drift, wrong candidate IDs, tampering and public candidate placement', () => {
  const { dir, opts, publication } = prepared();
  expect(() => publishPreparedPublication(dir, opts.snapshotsDir, 'bad-id', now)).toThrow();
  expect(readPublicationPreview(dir, opts.snapshotsDir, now.getTime() + 3_600_001).state).toBe('expired');
  expect(() => publishPreparedPublication(dir, opts.snapshotsDir, publication.id, new Date(now.getTime() + 3_600_001))).toThrow();
  mkdirSync(join(opts.snapshotsDir, 'content'), { recursive: true });
  writeFileSync(join(opts.snapshotsDir, 'content/new.json'), '{}');
  expect(readPublicationPreview(dir, opts.snapshotsDir).state).toBe('base-changed');
  expect(() => publishPreparedPublication(dir, opts.snapshotsDir, publication.id, now)).toThrow();
  rmSync(join(opts.snapshotsDir, 'content/new.json'));
  writeFileSync(join(dir, publication.id, 'v1/streams.json'), '[]');
  expect(readPublicationPreview(dir, opts.snapshotsDir)).toEqual({ state: 'invalid', publication: null });
  expect(() => preparePublication(opts, join(opts.snapshotsDir, 'candidates'))).toThrow(/outside/);
});
it('includes the validated access pack in both the semantic preview and the exact published generation', () => {
  const { dir, opts, water } = prepared();
  const packDir = join(env!.dir, 'candidate-pack'); mkdirSync(packDir);
  const access = { records: [{ waterId: water, access: [{ id: 'official-parking', waterId: water, kind: 'parking',
    verificationMethod: 'official-source', officialSource: { url: 'https://www.nps.gov/grsm/', publisher: 'NPS', retrievedAt: '2026-10-01' },
    reviewDate: '2026-10-01', uncertainty: 'Coordinates unverified', notes: 'Source-reviewed parking' }] }] };
  writeFileSync(join(packDir, 'access.json'), JSON.stringify(access));
  const next = preparePublication({ ...opts, contentPackDir: packDir }, dir);
  expect(next.waters.find((row) => row.id === water)?.changes).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'access', after: expect.stringContaining('official-parking') })]));
  publishPreparedPublication(dir, opts.snapshotsDir, next.id, now);
  expect(JSON.parse(readFileSync(join(opts.snapshotsDir, 'content/access.json'), 'utf8'))).toEqual(access);
});
it('keeps candidate and operations endpoints read-only, authenticated, no-store and separate from public assets', async () => {
  const { dir, opts } = prepared(); const app = Fastify();
  registerOwnerRoutes(app, { db: opts.db, snapshotsDir: opts.snapshotsDir, publicationDir: dir, ownerToken: 'owner-fixture' });
  try {
    const url = '/v1/owner/publication-preview';
    expect((await app.inject({ url })).statusCode).toBe(401);
    expect((await app.inject({ url, headers: { authorization: 'Bearer shop-fixture' } })).statusCode).toBe(401);
    const res = await app.inject({ url, headers: { authorization: 'Bearer owner-fixture' } });
    expect(res.statusCode).toBe(200); expect(res.headers['cache-control']).toBe('no-store');
    expect(res.json().state).toBe('ready'); expect(res.body).not.toContain(dir);
    expect((await app.inject({ url, method: 'POST', headers: { authorization: 'Bearer owner-fixture' } })).statusCode).toBe(404);
  } finally { await app.close(); }
});
it('reports uncollected/invalid statuses and never echoes arbitrary status text or credentials', () => {
  env = makeEnv(); const dir = join(env.dir, 'ops'); mkdirSync(dir);
  writeFileSync(join(dir, 'backup.status'), `OK ${now.toISOString()}\n`);
  writeFileSync(join(dir, 'last-good-rev'), `${'a'.repeat(40)} ${now.toISOString()}\n`);
  writeFileSync(join(dir, 'autoupdate.status'), `secret-token ${now.toISOString()}\n`);
  writeFileSync(join(dir, 'watchdog.status'), 'BROKEN invalid-clock');
  writeFileSync(join(dir, 'push-url.txt'), 'never-read-this-secret');
  const result = readOperationStatuses(dir);
  expect(result.find((op) => op.area === 'backup')).toMatchObject({ state: 'OK', recordedAt: now.toISOString() });
  expect(result.find((op) => op.area === 'deploy')).toMatchObject({ state: 'verified', revision: 'a'.repeat(40) });
  expect(result.find((op) => op.area === 'refresh')?.state).toBe('not-collected');
  expect(JSON.stringify(result)).not.toMatch(/secret-token|never-read/);
  expect(readPublicationPreview()).toEqual({ state: 'not-prepared', publication: null });
  const dir2 = join(env.dir, 'bad'); mkdirSync(dir2); writeFileSync(join(dir2, 'latest.json'), '{');
  expect(readPublicationPreview(dir2, env.snapshotsDir).state).toBe('invalid');
  expect(readFileSync(join(dir, 'push-url.txt'), 'utf8')).toBe('never-read-this-secret');
});
