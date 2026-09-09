import { describe, expect, it } from 'vitest';
import {
  FISHERY_TYPE_LABELS,
  fisheryType,
  fisheryTypeCounts,
} from '../src/features/map/fisheryType';

describe('fisheryType (catalog-truth water classes)', () => {
  it('reads tailrace as Tailwater regardless of program or species', () => {
    expect(fisheryType({ waterbodyType: 'tailrace', species: 'trout', stockingProgram: true })).toBe(
      'tailwater',
    );
  });

  it('names Wild trout only when species AND stocking program are both explicit', () => {
    expect(fisheryType({ waterbodyType: 'creek', species: 'trout', stockingProgram: false })).toBe(
      'wild',
    );
    // A trout water with NO stockingProgram field is never read as wild —
    // the catalog must say both parts.
    expect(fisheryType({ waterbodyType: 'creek', species: 'trout' })).not.toBe('wild');
  });

  it('reads an explicit stocking program as Stocked — including warmwater waters', () => {
    expect(fisheryType({ waterbodyType: 'river', species: 'trout', stockingProgram: true })).toBe(
      'stocked',
    );
    // The Harpeth case: warmwater catalog entry with a winter trout program.
    expect(
      fisheryType({ waterbodyType: 'river', species: 'warmwater', stockingProgram: true }),
    ).toBe('stocked');
  });

  it('reserves Other for fully-described waters outside the named classes', () => {
    expect(
      fisheryType({ waterbodyType: 'river', species: 'warmwater', stockingProgram: false }),
    ).toBe('other');
    expect(fisheryType({ waterbodyType: 'lake', stockingProgram: false })).toBe('other');
  });

  it('keeps unknown unknown — no fields, no claim', () => {
    expect(fisheryType({})).toBe('unknown');
    expect(fisheryType({ waterbodyType: null, species: null, stockingProgram: null })).toBe(
      'unknown',
    );
  });

  it('counts every water into exactly one class', () => {
    const counts = fisheryTypeCounts([
      { waterbodyType: 'tailrace', species: 'trout', stockingProgram: true },
      { waterbodyType: 'creek', species: 'trout', stockingProgram: false },
      { waterbodyType: 'creek', species: 'trout', stockingProgram: false },
      { waterbodyType: 'lake', species: 'warmwater', stockingProgram: true },
      { waterbodyType: 'river', stockingProgram: false },
      {},
    ]);
    expect(counts).toEqual({ tailwater: 1, wild: 2, stocked: 1, other: 1, unknown: 1 });
  });

  it('labels rows in product language', () => {
    expect(FISHERY_TYPE_LABELS.wild).toBe('Wild trout');
    expect(FISHERY_TYPE_LABELS.other).toBe('Other fish waters');
    expect(FISHERY_TYPE_LABELS.unknown).toBe('Unclassified');
  });
});
