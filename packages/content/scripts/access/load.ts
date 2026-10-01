// OWNER: ACCESS lane (feat/site-improvement-20260930). Loader + cross-checks for
// verified access records (ADR 0019). Same contract as lib.ts loadContent():
// never throws on bad content — reports Issue[] and lets validate.ts/build.ts
// fail the gate.
//
// Example-record isolation (ADR 0019 §6, the documented choice): the ID PREFIX
// is the mechanism, not a manifest. A record whose id starts with `example-`
// is a test fixture — schema-validated like any record, exempt from the
// catalog cross-check (its waterId is the reserved `example-water-id`), and
// EXCLUDED from dist/pack/access.json. Chosen over a manifest because the
// convention survives file moves/renames with nothing to keep in sync, and
// the failure mode is safe in both directions: a real record prefixed
// `example-` silently stops shipping (reviewer notices a missing record), and
// an example can never ship (enforced in toAccessPack + tested).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  AccessRecordSchema,
  type AccessPack,
  type AccessPackRecord,
  type AccessRecord,
} from './schema.js';
import type { Issue } from '../lib.js';

export { AccessRecordSchema } from './schema.js';
export type { AccessRecord, AccessKind, AccessCoordinates, AccessOfficialSource, AccessPack } from './schema.js';

/** Id prefix that marks a record as a test fixture (never ships). */
export const EXAMPLE_ID_PREFIX = 'example-';
/** Reserved fixture waterId — NOT a real catalog water; examples must use it. */
export const EXAMPLE_WATER_ID = 'example-water-id';

export function isExampleRecord(id: string): boolean {
  return id.startsWith(EXAMPLE_ID_PREFIX);
}

const ACCESS_DIR = resolve(import.meta.dirname, '..', '..', 'access', 'tn');

export interface LoadedAccess {
  /** Reviewable records that ship in dist/pack/access.json (never examples). */
  records: AccessRecord[];
  /** Test fixtures — validated, reported, excluded from the pack. */
  examples: AccessRecord[];
  issues: Issue[];
}

function collectYamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (p.endsWith('.yaml') || p.endsWith('.yml')) out.push(p);
  }
  return out.sort();
}

/** One document as read from disk (or assembled by tests). */
export interface AccessDoc {
  file: string;
  data: unknown;
}

/**
 * Core gate: schema-validate every doc, then cross-check. Pure over its input
 * (no filesystem) so test/access.test.ts drives the exact production rules:
 *  - duplicate ids across the whole corpus (examples included);
 *  - non-example records: waterId must exist in the streams catalog and must
 *    not be the reserved fixture id;
 *  - example records: must use the reserved `example-water-id` (an example
 *    pointing at a real water is a packaging mistake).
 */
export function validateAccessDocs(
  docs: AccessDoc[],
  catalogWaterIds: ReadonlySet<string>,
): LoadedAccess {
  const issues: Issue[] = [];
  const records: AccessRecord[] = [];
  const examples: AccessRecord[] = [];
  const seen = new Set<string>();

  for (const doc of docs) {
    const parsed = AccessRecordSchema.safeParse(doc.data);
    if (!parsed.success) {
      issues.push({
        file: doc.file,
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      continue;
    }
    const rec = parsed.data;
    if (seen.has(rec.id)) {
      issues.push({ file: doc.file, message: `duplicate access record id ${rec.id}` });
      continue;
    }
    seen.add(rec.id);

    if (isExampleRecord(rec.id)) {
      if (rec.waterId !== EXAMPLE_WATER_ID) {
        issues.push({
          file: doc.file,
          message: `example record ${rec.id} must use the reserved fixture waterId "${EXAMPLE_WATER_ID}", not "${rec.waterId}"`,
        });
        continue;
      }
      examples.push(rec);
      continue;
    }

    if (rec.waterId === EXAMPLE_WATER_ID) {
      issues.push({
        file: doc.file,
        message: `${rec.id}: waterId "${EXAMPLE_WATER_ID}" is reserved for example- fixtures — real records must cite a catalog water`,
      });
      continue;
    }
    if (!catalogWaterIds.has(rec.waterId)) {
      issues.push({
        file: doc.file,
        message: `${rec.id}: waterId "${rec.waterId}" does not exist in the streams/ catalog`,
      });
      continue;
    }
    records.push(rec);
  }

  // Deterministic order so pack diffs stay reviewable.
  records.sort((a, b) => (a.waterId === b.waterId ? a.id.localeCompare(b.id) : a.waterId.localeCompare(b.waterId)));
  return { records, examples, issues };
}

/** Read + validate access/tn/*.yaml against the given catalog water ids. */
export function loadAccess(catalogWaterIds: ReadonlySet<string>, dir: string = ACCESS_DIR): LoadedAccess {
  const docs: AccessDoc[] = [];
  const issues: Issue[] = [];
  for (const file of collectYamlFiles(dir)) {
    const rel = `access/tn/${file.slice(dir.length + 1).replaceAll('\\', '/')}`;
    let data: unknown;
    try {
      data = parse(readFileSync(file, 'utf8'));
    } catch (err) {
      issues.push({ file: rel, message: `invalid YAML: ${(err as Error).message}` });
      continue;
    }
    docs.push({ file: rel, data });
  }
  const loaded = validateAccessDocs(docs, catalogWaterIds);
  return { records: loaded.records, examples: loaded.examples, issues: [...issues, ...loaded.issues] };
}

/** Group records by waterId into the stable pack shape (schema.ts AccessPack).
 *  Examples are excluded here too — the loader never puts them in `records`,
 *  and this is the last line of defense before the pack file. */
export function toAccessPack(records: readonly AccessRecord[]): AccessPack {
  const byWater = new Map<string, AccessPackRecord>();
  for (const rec of records) {
    if (isExampleRecord(rec.id)) continue;
    let group = byWater.get(rec.waterId);
    if (!group) {
      group = { waterId: rec.waterId, access: [] };
      byWater.set(rec.waterId, group);
    }
    group.access.push(rec);
  }
  return {
    records: [...byWater.values()].sort((a, b) => a.waterId.localeCompare(b.waterId)),
  };
}
