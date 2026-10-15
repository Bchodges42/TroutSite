import { describe, expect, it } from 'vitest';
import { loadContent } from '../scripts/lib.js';

describe('content source-evidence gates', () => {
  const content = loadContent();
  it('does not encode fish, caddis, ants or midges as two-tailed insects', () => {
    for (const [id, tails] of [['ant', 0], ['little-black-midge', 0], ['spotted-sedge', 0], ['sculpin', 'not-applicable'], ['alderfly-larva', 1]] as const) {
      expect(content.bugs.get(id)!.keyAttributes.tails).toBe(tails);
    }
  });
  it('preserves explicit uncertainty and precisely scoped citations across built chart months', () => {
    let cited = 0;
    for (const [region, months] of content.hatch) for (const month of months) {
      expect(month.evidenceBasis).toBe('editorial');
      expect(month.evidenceNote).toMatch(/editorial/);
      for (const entry of month.entries) for (const record of entry.regionalRecords ?? []) {
        cited++;
        expect(region).toBe('tn-east-smokies');
        expect(entry.stage).toBe('adult');
        expect(record.supportedClaim).toBe('regional-presence');
        expect(record.pinpoint).toMatch(/Table 2/);
        expect(record.observationPeriod).toContain('2001');
      }
    }
    expect(cited).toBe(6);
  });
  it('does not promote missing opportunity sources into a documented fishery', () => {
    for (const stream of content.streams.values()) {
      if (stream.opportunity?.trout !== 'unresolved') expect(stream.opportunity?.sources?.length).toBeGreaterThan(0);
    }
  });
});
