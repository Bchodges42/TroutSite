// OWNER: ACCESS lane (feat/site-improvement-20260930). The verified-access gate
// as a Vitest suite (ADR 0019) — the same loader scripts/validate.ts and
// scripts/build.ts run. Covers: happy path, source-less rejection, bad/reserved
// waterId rejection, out-of-bounds coordinates, duplicate ids, the
// uncertainty requirement, and the example-fixture exclusion from the pack.
import { describe, expect, it } from 'vitest';
import { loadContent } from '../scripts/lib.js';
import {
  validateAccessDocs,
  loadAccess,
  toAccessPack,
  isExampleRecord,
  EXAMPLE_WATER_ID,
  type AccessDoc,
} from '../scripts/access/load.js';

const { streams } = loadContent();

/** A fully valid record — tests mutate one field at a time. Real water id from
 *  the live catalog so the cross-check passes. */
function goodRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'test-landing-parking',
    waterId: 'barren-fork-river',
    kind: 'parking',
    coordinates: { lat: 35.68, lng: -85.77 },
    officialSource: {
      url: 'https://www.tn.gov/twra/fishing.html',
      publisher: 'Tennessee Wildlife Resources Agency',
      retrievedAt: '2026-09-30',
    },
    reviewDate: '2026-09-30',
    notes: 'Gravel lot on the west bank; space for a dozen trucks with trailers.',
    ...overrides,
  };
}

function run(...records: Record<string, unknown>[]) {
  const docs: AccessDoc[] = records.map((data, i) => ({ file: `fixture-${i}.yaml`, data }));
  return validateAccessDocs(docs, new Set(streams.keys()));
}

function issuesOf(...records: Record<string, unknown>[]): string[] {
  return run(...records).issues.map((i) => i.message);
}

describe('verified access records (ADR 0019 gate)', () => {
  it('accepts a fully-cited record and ships it in the pack grouped by waterId', () => {
    const other = goodRecord({
      id: 'test-landing-ramp',
      kind: 'boat-ramp',
      waterId: 'barren-fork-river',
    });
    const { records, examples, issues } = run(goodRecord(), other);
    expect(issues, issues.join('\n')).toEqual([]);
    expect(records).toHaveLength(2);
    expect(examples).toHaveLength(0);
    const pack = toAccessPack(records);
    expect(pack.records).toEqual([
      {
        waterId: 'barren-fork-river',
        access: [records[0], records[1]], // same waterId → one group, id order
      },
    ]);
  });

  it('REJECTS a source-less record (every record cites one official source)', () => {
    const messages = issuesOf(goodRecord({ officialSource: undefined }));
    expect(messages.some((m) => m.includes('officialSource'))).toBe(true);
  });

  it('REJECTS a non-https official source URL', () => {
    const messages = issuesOf(
      goodRecord({
        officialSource: {
          url: 'http://www.tn.gov/twra/fishing.html',
          publisher: 'Tennessee Wildlife Resources Agency',
          retrievedAt: '2026-09-30',
        },
      }),
    );
    expect(messages.some((m) => m.includes('https://'))).toBe(true);
  });

  it('REJECTS a waterId that is not a real catalog water', () => {
    const messages = issuesOf(goodRecord({ waterId: 'not-in-the-catalog-creek' }));
    expect(messages.some((m) => m.includes('does not exist in the streams/ catalog'))).toBe(true);
  });

  it('REJECTS out-of-bounds coordinates (TN plausibility box: lat 33–37, lng −91 to −81)', () => {
    const north = issuesOf(goodRecord({ coordinates: { lat: 45.0, lng: -86.0 } }));
    expect(north.some((m) => m.includes('plausibility box'))).toBe(true);
    const east = issuesOf(goodRecord({ coordinates: { lat: 36.0, lng: -70.0 } }));
    expect(east.some((m) => m.includes('plausibility box'))).toBe(true);
  });

  it('REJECTS duplicate ids across the corpus', () => {
    const dup = goodRecord({ notes: 'A second file claiming the same id.' });
    const messages = issuesOf(goodRecord(), dup);
    expect(messages.some((m) => m.includes('duplicate access record id'))).toBe(true);
  });

  it('REQUIRES uncertainty when coordinates are absent', () => {
    const without = issuesOf(goodRecord({ coordinates: undefined }));
    expect(without.some((m) => m.includes('uncertainty is REQUIRED when coordinates are absent'))).toBe(true);
    const withIt = run(goodRecord({ coordinates: undefined, uncertainty: 'Unmarked pull-off 0.4 mi past the bridge, east side.' }));
    expect(withIt.issues).toEqual([]);
  });

  it('REQUIRES uncertainty for walk-in records even with coordinates', () => {
    const messages = issuesOf(goodRecord({ kind: 'walk-in' }));
    expect(messages.some((m) => m.includes('walk-in'))).toBe(true);
  });

  it('keeps fees/hours/closures as record FIELDS, not separate records', () => {
    const { records, issues } = run(
      goodRecord({
        fee: { amount: '$5 per vehicle', notes: 'Honor box.' },
        hours: 'Daylight hours only',
        closure: { window: 'Dec 1 – last day of Feb', notes: 'Gate closed.' },
      }),
    );
    expect(issues).toEqual([]);
    expect(records[0]?.fee?.amount).toBe('$5 per vehicle');
    expect(records[0]?.hours).toBe('Daylight hours only');
    expect(records[0]?.closure?.window).toBe('Dec 1 – last day of Feb');
  });

  // ── example-fixture isolation (ADR 0019 §6) ──────────────────────────────

  it('routes example- prefixed records to the fixture lane, never the pack', () => {
    const example = goodRecord({
      id: 'example-boat-ramp-parking',
      waterId: EXAMPLE_WATER_ID,
      notes: 'Fixture record exercising every field of the schema.',
    });
    const { records, examples, issues } = run(example, goodRecord());
    expect(issues, issues.join('\n')).toEqual([]);
    expect(examples).toHaveLength(1);
    expect(records.map((r) => r.id)).toEqual(['test-landing-parking']);
    // The pack shape stays honest at zero shippable records: `{ records: [] }`.
    expect(toAccessPack([])).toEqual({ records: [] });
    expect(toAccessPack(examples)).toEqual({ records: [] });
  });

  it('REJECTS a real record using the reserved example waterId', () => {
    const messages = issuesOf(goodRecord({ waterId: EXAMPLE_WATER_ID }));
    expect(messages.some((m) => m.includes('reserved for example- fixtures'))).toBe(true);
  });

  it('REJECTS an example record pointing at a real water', () => {
    const messages = issuesOf(goodRecord({ id: 'example-misdirected' }));
    expect(messages.some((m) => m.includes('reserved fixture waterId'))).toBe(true);
  });

  // ── the real corpus ──────────────────────────────────────────────────────

  it('ships ZERO verified access records today, with the example fixture valid and excluded', () => {
    const { records, examples, issues } = loadAccess(new Set(streams.keys()));
    expect(issues, issues.map((i) => `${i.file}: ${i.message}`).join('\n')).toEqual([]);
    // HONESTY CONSTRAINT: the pipeline ships with zero records. Access content
    // only grows through field-reviewed authoring (docs/access-AUTHORING.md) —
    // never invented.
    expect(records).toHaveLength(0);
    expect(toAccessPack(records)).toEqual({ records: [] });
    expect(examples).toHaveLength(1);
    expect(isExampleRecord(examples[0]!.id)).toBe(true);
    expect(examples[0]!.waterId).toBe(EXAMPLE_WATER_ID);
  });
});
