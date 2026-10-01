import { createHash, randomBytes } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { StreamSchema, StockingEventSchema, FishingInformationSchema, matchStocking,
  opportunityHeadlineLabel, opportunityEvidenceLabel, AccessPackSchema, type Stream } from '@trout/contracts';
import { buildSnapshotCandidate, publishSnapshotCandidate, type BuildOptions } from '../snapshots/build.js';
import { writeJsonAtomic } from '../lib/jsonFile.js';

const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Id = z.string().regex(/^[a-f0-9]{24}$/);
const Change = z.object({ field: z.string().max(80), before: z.string().max(4001).nullable(),
  after: z.string().max(4001).nullable(), truncated: z.boolean() });
export const PublicationSchema = z.object({
  id: Id, preparedAt: z.string().datetime(), publishedAt: z.string().datetime().nullable(),
  baseHash: Hash, candidateHash: Hash, fileChanges: z.number().int().nonnegative(),
  affectedWaters: z.number().int().nonnegative(), omittedWaters: z.number().int().nonnegative(),
  waters: z.array(z.object({ id: z.string().max(128), name: z.string().max(200),
    beforeWording: z.array(z.string().max(4001)), afterWording: z.array(z.string().max(4001)),
    changes: z.array(Change).max(20) })).max(200),
});
export type Publication = z.infer<typeof PublicationSchema>;
export interface PublicationPreview {
  state: 'not-prepared' | 'invalid' | 'ready' | 'base-changed' | 'expired' | 'published';
  publication: Publication | null;
}

/** Hash filenames AND bytes of the exact managed generation, rejecting links. */
export function generationFiles(root: string): Map<string, string> {
  const files = new Map<string, string>();
  function walk(path: string, prefix: string): void {
    if (!existsSync(path)) return;
    for (const name of readdirSync(path).sort()) {
      const file = join(path, name); const rel = `${prefix}/${name}`;
      const stat = lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error('Generation links are not supported');
      if (stat.isDirectory()) walk(file, rel);
      else if (stat.isFile()) {
        if (files.size >= 20_000) throw new Error('Generation exceeds file limit');
        files.set(rel, createHash('sha256').update(readFileSync(file)).digest('hex'));
      }
    }
  }
  for (const tree of ['v1', 'content']) walk(join(root, tree), tree);
  return files;
}
export function generationHash(root: string): string {
  return createHash('sha256').update(JSON.stringify([...generationFiles(root)])).digest('hex');
}
function readJson(root: string, rel: string): unknown {
  const file = join(root, rel);
  if (!existsSync(file)) return null;
  if (lstatSync(file).size > 16 * 1024 * 1024) throw new Error('Preview input exceeds limit');
  return JSON.parse(readFileSync(file, 'utf8')) as unknown;
}
function textValue(value: unknown): { text: string | null; truncated: boolean } {
  if (value === undefined || value === null) return { text: null, truncated: false };
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return { text: text.length > 4000 ? `${text.slice(0, 4000)}…` : text, truncated: text.length > 4000 };
}
function wording(stream: Stream | undefined): string[] {
  if (!stream) return ['Water absent from this generation'];
  const o = stream.opportunity;
  return [stream.name, ...(o ? [opportunityHeadlineLabel(o.trout), opportunityEvidenceLabel(o.evidenceState, o.asOf),
    ...(o.reachScope ? [`Documented for: ${o.reachScope}`] : []), o.statement,
    ...(o.trout === 'unresolved' ? [o.unresolvedQuestion] : []), ...(o.caveats ?? [])] : []), stream.notes]
    .filter((v): v is string => Boolean(v)).map((v) => textValue(v).text!);
}
function claims(root: string): { streams: Stream[]; values: Map<string, Record<string, unknown>> } {
  const streams = z.array(StreamSchema).parse(readJson(root, 'v1/streams.json') ?? []);
  const access = AccessPackSchema.nullable().parse(readJson(root, 'content/access.json'));
  const evidence = readJson(root, 'v1/evidence/waters.json');
  const fishing = FishingInformationSchema.nullable().parse(readJson(root, 'content/fishing.json'));
  const stocks = [];
  const stockDir = join(root, 'v1/stocking');
  if (existsSync(stockDir)) for (const name of readdirSync(stockDir).filter((n) => /^[A-Z]{2}-recent\.json$/.test(n))) {
    stocks.push(...z.array(StockingEventSchema).parse(readJson(root, `v1/stocking/${name}`)));
  }
  const byStream = matchStocking(streams, stocks).byStream;
  const values = new Map<string, Record<string, unknown>>();
  for (const s of streams) values.set(s.id, {
    name: s.name, sources: s.officialSources, species: s.targetSpecies ?? s.species,
    speciesEvidence: s.speciesEvidence, opportunity: s.opportunity,
    season: { months: s.seasonMonths, kind: s.seasonKind, yearRound: s.yearRound },
    notes: s.notes, access: access?.records?.find((r) => r.waterId === s.id)?.access ?? [],
    regulations: fishing?.sections.flatMap((section) => section.items.filter((item) => !item.appliesTo || item.appliesTo.includes(s.id))) ?? [],
    evidence: Array.isArray(evidence) ? evidence.find((row: { waterId?: string; streamId?: string }) => (row.waterId ?? row.streamId) === s.id) : null,
    stocking: (byStream.get(s.id) ?? []).map(({ fetchedAt: _fetched, ...event }) => event),
  });
  return { streams, values };
}

/** Prepare once; the CLI can later promote THESE bytes after owner review. */
export function preparePublication(opts: BuildOptions, publicationDir: string): Publication {
  mkdirSync(publicationDir, { recursive: true });
  const id = randomBytes(12).toString('hex'); const dir = join(publicationDir, id);
  const base = generationFiles(opts.snapshotsDir); const baseHash = generationHash(opts.snapshotsDir);
  try {
    opts.db.transaction(() => buildSnapshotCandidate(opts, dir))();
    // A refresh during preparation invalidates the candidate instead of mixing baselines.
    if (generationHash(opts.snapshotsDir) !== baseHash) throw new Error('Live generation changed during preparation');
    const next = generationFiles(dir); const oldClaims = claims(opts.snapshotsDir); const newClaims = claims(dir);
    const waters: Publication['waters'] = []; let affectedWaters = 0; let previewBytes = 0;
    for (const waterId of [...new Set([...oldClaims.values.keys(), ...newClaims.values.keys()])].sort()) {
      const before = oldClaims.values.get(waterId) ?? {}; const after = newClaims.values.get(waterId) ?? {};
      const changes: z.infer<typeof Change>[] = [];
      for (const field of [...new Set([...Object.keys(before), ...Object.keys(after)])]) {
        if (JSON.stringify(before[field]) === JSON.stringify(after[field])) continue;
        const a = textValue(before[field]); const b = textValue(after[field]);
        changes.push({ field, before: a.text, after: b.text, truncated: a.truncated || b.truncated });
      }
      if (!changes.length) continue;
      affectedWaters += 1;
      const row = { id: waterId, name: String(after.name ?? before.name ?? waterId).slice(0, 200), changes,
        beforeWording: wording(oldClaims.streams.find((s) => s.id === waterId)),
        afterWording: wording(newClaims.streams.find((s) => s.id === waterId)) };
      const bytes = Buffer.byteLength(JSON.stringify(row));
      if (waters.length < 200 && previewBytes + bytes <= 1_000_000) { waters.push(row); previewBytes += bytes; }
    }
    const publication = PublicationSchema.parse({ id, preparedAt: opts.now.toISOString(), publishedAt: null, baseHash,
      candidateHash: generationHash(dir), fileChanges: [...new Set([...base.keys(), ...next.keys()])].filter((p) => base.get(p) !== next.get(p)).length,
      affectedWaters, omittedWaters: affectedWaters - waters.length, waters });
    writeJsonAtomic(join(publicationDir, 'latest.json'), publication);
    // Keep the two most recent candidates. Never remove the just-prepared candidate.
    const older = readdirSync(publicationDir).filter((name) => Id.safeParse(name).success && name !== id
      && lstatSync(join(publicationDir, name)).isDirectory() && !lstatSync(join(publicationDir, name)).isSymbolicLink())
      .sort((a, b) => lstatSync(join(publicationDir, b)).mtimeMs - lstatSync(join(publicationDir, a)).mtimeMs);
    for (const name of older.slice(1)) { try { rmSync(join(publicationDir, name), { recursive: true, force: true }); } catch { /* Keep prior candidates if cleanup is obstructed. */ } }
    return publication;
  } catch (error) { rmSync(dir, { recursive: true, force: true }); throw error; }
}
export function readPublicationPreview(publicationDir?: string, snapshotsDir?: string, now = Date.now()): PublicationPreview {
  if (!publicationDir || !existsSync(join(publicationDir, 'latest.json'))) return { state: 'not-prepared', publication: null };
  try {
    const publication = PublicationSchema.parse(readJson(publicationDir, 'latest.json'));
    if (!snapshotsDir) return { state: 'invalid', publication: null };
    const live = generationHash(snapshotsDir);
    if (publication.publishedAt) return { state: live === publication.candidateHash ? 'published' : 'base-changed', publication };
    if (now > Date.parse(publication.preparedAt) + 3_600_000) return { state: 'expired', publication };
    if (generationHash(join(publicationDir, publication.id)) !== publication.candidateHash) return { state: 'invalid', publication: null };
    return { state: live === publication.baseHash ? 'ready' : 'base-changed', publication };
  } catch { return { state: 'invalid', publication: null }; }
}
export function publishPreparedPublication(publicationDir: string, snapshotsDir: string, expectedId: string, now: Date): void {
  const preview = readPublicationPreview(publicationDir, snapshotsDir, now.getTime());
  if (preview.state !== 'ready' || preview.publication?.id !== expectedId) throw new Error('Candidate changed, expired or no longer matches the live baseline; prepare and review again');
  publishSnapshotCandidate(snapshotsDir, join(publicationDir, preview.publication.id));
  if (generationHash(snapshotsDir) !== preview.publication.candidateHash) throw new Error('Published generation did not match the reviewed candidate');
  writeJsonAtomic(join(publicationDir, 'latest.json'), { ...preview.publication, publishedAt: now.toISOString() });
}
