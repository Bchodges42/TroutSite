import { describe, expect, it } from 'vitest';
import { buildCorrectionHandoff, type ModeratorReviewItem } from '../src/features/corrections/review';

const item: ModeratorReviewItem = {
  id: 42, status: 'accepted', waterId: 'caney-fork-river', waterName: 'Caney Fork River',
  category: 'regulations', field: 'creelLimit', currentValue: 'Old limit',
  proposedCorrection: 'Check the current regulation before changing the limit.',
  sourceUrl: 'https://www.tn.gov/twra/fishing.html', sourcePubDate: '2026-01-01',
  riskFlags: ['regulations'], reviewerNote: 'Primary source reviewed; publication still pending.',
  receiptLast4: 'QWER', receivedAt: '2026-09-30T12:00:00Z', updatedAt: '2026-09-30T12:30:00Z', clusterSize: 1,
};

describe('correction publication handoff', () => {
  it('exports the proposal and cited source with review/publication steps, excluding receipt data', () => {
    const text = buildCorrectionHandoff(item);
    const handoff = JSON.parse(text);
    expect(handoff.correction.waterId).toBe(item.waterId);
    expect(handoff.correction.currentValue).toBe(item.currentValue);
    expect(handoff.correction.sourceUrl).toBe(item.sourceUrl);
    expect(handoff.correction.riskFlags).toEqual(['regulations']);
    expect(handoff.steps.join(' ')).toMatch(/reviewed content PR/);
    expect(handoff.steps.join(' ')).toMatch(/publication is verified/);
    expect(text).not.toContain('receiptLast4');
    expect(text).not.toContain('QWER');
  });

  it('refuses to export an unreviewed submission as an approved handoff', () => {
    expect(() => buildCorrectionHandoff({ ...item, status: 'received' })).toThrow(/Accept/);
    expect(() => buildCorrectionHandoff({ ...item, status: 'needs-more-evidence' })).toThrow(/Accept/);
  });
});
