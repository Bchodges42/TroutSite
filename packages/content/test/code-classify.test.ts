import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LABELS,
  LABEL_TEXT,
  classify,
  composeJevState,
  resolveEscalation,
} from '../scripts/classification/code-classify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const research = join(here, '..', 'research', 'habitat-survival');

/** Label must always be one of the three owner-locked keys, with byte-identical text. */
const CANONICAL = [
  'trout-stream-year-round',
  'warmwater-yearly-stocked-winter-trout',
  'warmwater-no-trout',
];

function stock(months: number[], extra: Record<string, unknown> = {}) {
  return { months, ...extra };
}

describe('code-classify invariants', () => {
  it('label is always one of the three canonical keys with matching text', () => {
    const cases = [
      classify({ evidenceRecord: null, catalogRow: {}, stockingRow: stock([3]) }),
      classify({ evidenceRecord: null, catalogRow: { species: 'warmwater' }, stockingRow: null }),
      classify({ evidenceRecord: { wildPopulation: { documented: true } }, catalogRow: {}, stockingRow: null }),
    ];
    for (const v of cases) {
      expect(CANONICAL).toContain(v.label);
      expect(v.labelText).toBe(LABEL_TEXT[v.label]);
    }
  });

  it('wild population documented → year-round at high gate', () => {
    const v = classify({
      evidenceRecord: { wildPopulation: { documented: true, evidenceUrl: 'x' } },
      catalogRow: {},
      stockingRow: stock([3, 4, 5]),
    });
    expect(v.label).toBe(LABELS.YEAR_ROUND);
    expect(v.confidenceGate).toBe('high');
    expect(v.escalate).toBe(false);
  });

  it('holdover documented → year-round at high gate', () => {
    const v = classify({
      evidenceRecord: { holdover: { documented: true, evidenceUrl: 'x' } },
      catalogRow: {},
      stockingRow: stock([3, 4]),
    });
    expect(v.label).toBe(LABELS.YEAR_ROUND);
    expect(v.confidenceGate).toBe('high');
  });

  it('continuous 12-month stocking qualifies on its own even with holdover null (stocking facet)', () => {
    const v = classify({ evidenceRecord: null, catalogRow: {}, stockingRow: stock([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) });
    expect(v.label).toBe(LABELS.YEAR_ROUND);
    expect(v.confidenceGate).toBe('high');
    expect(v.facets.continuousStocking).toBe(true);
  });

  it('POLICY: holdover documented=false plus continuous stocking STILL reads year-round — absence never downgrades', () => {
    const v = classify({
      evidenceRecord: { holdover: { documented: false, evidenceUrl: 'x' } },
      catalogRow: {},
      stockingRow: stock([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    });
    expect(v.label).toBe(LABELS.YEAR_ROUND);
    expect(v.confidenceGate).toBe('high');
  });

  it('cold-release + seasonal program → year-round (documented bottom-draw facet)', () => {
    const v = classify({
      evidenceRecord: { coldSource: { damTailwater: { releaseType: 'bottom-draw', evidenceUrl: 'x' } } },
      catalogRow: {},
      stockingRow: stock([3, 4, 5, 6, 7, 8]),
    });
    expect(v.label).toBe(LABELS.YEAR_ROUND);
    expect(v.confidenceGate).toBe('high');
  });

  it('seasonal stocking without survival facet → seasonal label', () => {
    const v = classify({ evidenceRecord: null, catalogRow: {}, stockingRow: stock([3, 4, 5]) });
    expect(v.label).toBe(LABELS.SEASONAL);
  });

  it('no program, warmwater catalog → no-trout at high gate only when catalog-documented', () => {
    const v = classify({ evidenceRecord: null, catalogRow: { species: 'warmwater', stockingProgram: false }, stockingRow: null });
    expect(v.label).toBe(LABELS.NO_TROUT);
    expect(v.confidenceGate).toBe('high');
  });

  it('thin no-trout (no catalog species signal) defaults low and escalates', () => {
    const v = classify({ evidenceRecord: null, catalogRow: {}, stockingRow: null });
    expect(v.label).toBe(LABELS.NO_TROUT);
    expect(v.confidenceGate).toBe('low');
    expect(v.escalate).toBe(true);
  });

  it('CONFLICT (Duck pattern): catalog year-round + cold-season-only stocking + no survival facet → escalate regardless of label', () => {
    const v = classify({
      evidenceRecord: { holdover: { documented: false, evidenceUrl: 'x' } },
      catalogRow: { yearRound: true, stockingProgram: true },
      stockingRow: stock([1, 2, 3, 11, 12]),
    });
    expect(v.conflicts.length).toBeGreaterThan(0);
    expect(v.confidenceGate).toBe('low');
    expect(v.escalate).toBe(true);
  });

  it('CONFLICT (Boone pattern): catalog year-round + short mixed-season program → escalate', () => {
    const v = classify({
      evidenceRecord: null,
      catalogRow: { yearRound: true, stockingProgram: true },
      stockingRow: stock([3, 4, 11, 12]),
    });
    expect(v.conflicts.length).toBeGreaterThan(0);
    expect(v.confidenceGate).toBe('low');
  });

  it('CONFLICT: catalog stockingProgram=false but a program row exists → escalate', () => {
    const v = classify({ evidenceRecord: null, catalogRow: { stockingProgram: false }, stockingRow: stock([3]) });
    expect(v.conflicts.some((c: string) => c.includes('no stocking program'))).toBe(true);
    expect(v.confidenceGate).toBe('low');
  });

  it('CONFLICT (owner-box pattern): catalog claims program but no row resolved and no survival facet → escalate', () => {
    const v = classify({
      evidenceRecord: { segment: { description: 'x', boundaries: 'y' } },
      catalogRow: { stockingProgram: true },
      stockingRow: null,
    });
    expect(v.conflicts.length).toBeGreaterThan(0);
    expect(v.confidenceGate).toBe('low');
  });
});

describe('leakage guard', () => {
  it('composed Jev state never contains the code verdict or prior Jev answer fields', () => {
    const poisoned = {
      evidenceRecord: {
        label: 'trout-stream-year-round',
        recommendedClass: 'Spring',
        confidence: 0.9,
        flags: ['x'],
        jev: { category: 'warmwater-no-trout' },
        wildPopulation: { documented: true, evidenceUrl: 'x' },
      },
      catalogRow: { stockingProgram: true, yearRound: true },
      stockingRow: stock([3, 4, 5]),
    };
    const state = composeJevState(poisoned).join('\n');
    for (const forbidden of ['trout-stream-year-round', 'recommendedClass', '"confidence": 0.9', 'warmwater-no-trout']) {
      expect(state).not.toContain(forbidden);
    }
  });
});

describe('resolveEscalation', () => {
  it('no Jev answer → escalate-pending (never fabricated)', () => {
    expect(resolveEscalation(null, LABELS.SEASONAL).resolution).toBe('escalate-pending');
    expect(resolveEscalation({ decision: 'escalate-pending' }, LABELS.SEASONAL).resolution).toBe('escalate-pending');
  });
  it('agreement → accept', () => {
    expect(resolveEscalation({ decision: 'jev-rated', choice: LABELS.SEASONAL }, LABELS.SEASONAL).resolution).toBe('accept');
  });
  it('disagreement → owner box', () => {
    const r = resolveEscalation({ decision: 'jev-rated', choice: LABELS.YEAR_ROUND }, LABELS.SEASONAL);
    expect(r.resolution).toBe('owner-box');
  });
  it('Jev abstaining → owner box', () => {
    expect(resolveEscalation({ decision: 'jev-rated', choice: 'none' }, LABELS.SEASONAL).resolution).toBe('owner-box');
  });
});

/** REAL EVIDENCE RECORDS as regression fixtures (batches 1-2, research-authored). */
function loadBatch(name: string): Array<Record<string, unknown>> {
  return JSON.parse(readFileSync(join(research, name), 'utf8'));
}
function toInput(rec: Record<string, unknown>, catalogRow: Record<string, unknown>, stockingRow: Record<string, unknown> | null) {
  return { evidenceRecord: rec, catalogRow, stockingRow: stockingRow ?? (rec as { stockingRow?: unknown }).stockingRow ?? null };
}

describe('regression over real evidence records (batches 1-2) — regression only, NOT owner-approved truth', () => {
  const batch1 = loadBatch('batch1.json');
  const batch2 = loadBatch('batch2.json');
  const all = [...batch1, ...batch2];

  it('every real record classifies into the three-label space with a gate decision', () => {
    for (const rec of all) {
      const v = classify(toInput(rec, {}, null));
      expect(CANONICAL).toContain(v.label);
      expect(['high', 'low']).toContain(v.confidenceGate);
    }
  });

  it('records with documented wild/holdover facets read year-round', () => {
    for (const rec of all) {
      const wild = (rec as { wildPopulation?: { documented?: boolean } }).wildPopulation?.documented === true;
      const holdover = (rec as { holdover?: { documented?: boolean } }).holdover?.documented === true;
      if (!wild && !holdover) continue;
      const v = classify(toInput(rec, {}, null));
      expect(v.label).toBe(LABELS.YEAR_ROUND);
    }
  });

  it('records whose structural conflict fired in research (duck-tailwater) escalate', () => {
    const duck = batch1.find((r) => r.slug === 'duck-river-tailwater');
    // Duck: catalog yearRound=true, workbook winter-only stocking (J,F,M,N,D → 1,2,3,11,12), holdover documented=false.
    const v = classify(toInput(duck, { yearRound: true, stockingProgram: true }, stock([1, 2, 3, 11, 12])));
    expect(v.confidenceGate).toBe('low');
    expect(v.escalate).toBe(true);
  });

  it('obey-river qualifies year-round on the continuous-stocking facet alone (12-month workbook row)', () => {
    const obey = batch1.find((r) => r.slug === 'obey-river');
    const v = classify(toInput(obey, {}, stock([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], { type: 'Tailwater' })));
    expect(v.label).toBe(LABELS.YEAR_ROUND);
    expect(v.confidenceGate).toBe('high');
    expect(v.facets.continuousStocking).toBe(true);
  });
});

/**
 * COMPOSITE REGRESSION (pending-owner-approval — regression ONLY, never
 * treated as approved truth): the four owner-box waters from the 2026-09-17
 * composite run must ESCALATE (gate low), never auto-accept, when fed their
 * composite catalog/stocking structure without any habitat evidence record.
 */
describe('composite owner-box regression (pending owner approval)', () => {
  const composite = JSON.parse(
    readFileSync(join(here, '..', 'research', 'CLASSIFICATION-COMPOSITE-2026-09-17.json'), 'utf8'),
  );
  const waters = composite.waters as Record<string, Record<string, unknown>>;
  const ownerBoxes = Object.entries(waters)
    .filter(([, r]) => ((r.flags as string[]) ?? []).some((f) => f.includes('owner box')))
    .map(([slug]) => slug);

  it('found the four owner-box waters', () => {
    expect(ownerBoxes.sort()).toEqual(
      ['east-fork-stones-river', 'holston-river', 'little-tennessee-river', 'wolf-river-west-tennessee'].sort(),
    );
  });

  it.each(ownerBoxes)('%s escalates instead of auto-accepting', (slug) => {
    const row = waters[slug];
    const v = classify({
      evidenceRecord: null,
      catalogRow: (row.catalog as Record<string, unknown>) ?? {},
      stockingRow: stock((row.seasonMonths as number[]) ?? []),
    });
    expect(v.confidenceGate).toBe('low');
    expect(v.escalate).toBe(true);
  });
});
