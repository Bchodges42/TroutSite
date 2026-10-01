import { expect, it } from 'vitest';
import { AccessDateSchema, AccessPackSchema, AccessRecordSchema, opportunityHeadlineLabel, opportunityEvidenceLabel } from '../src/index.js';
const record = { id: 'reviewed-parking', waterId: 'little-river', kind: 'parking', verificationMethod: 'official-source',
  officialSource: { url: 'https://www.nps.gov/places/metcalf-bottoms-picnic-area.htm', publisher: 'NPS', retrievedAt: '2026-10-01' },
  reviewDate: '2026-10-01', notes: 'Official parking', uncertainty: 'No field visit or coordinates' };
it('keeps source review distinct from field review and validates real calendar dates', () => {
  expect(AccessRecordSchema.parse(record).verificationMethod).toBe('official-source');
  expect(AccessRecordSchema.parse({ ...record, verificationMethod: 'field-visit' }).verificationMethod).toBe('field-visit');
  expect(AccessDateSchema.safeParse('2026-02-30').success).toBe(false);
  expect(AccessDateSchema.safeParse('2024-02-29').success).toBe(true);
  expect(AccessRecordSchema.safeParse({ ...record, verificationMethod: 'verified' }).success).toBe(false);
});
it('uses opportunity language for positive claims, preserves unresolved status and keeps evidence age distinct', () => {
  expect(opportunityHeadlineLabel('year-round-trout')).toBe('Year-round trout opportunity');
  expect(opportunityHeadlineLabel('seasonal-stocked-trout')).toBe('Seasonal stocked trout opportunity');
  expect(opportunityHeadlineLabel('warmwater-focus')).toBe('Warmwater fishing focus');
  expect(opportunityHeadlineLabel('mixed')).toBe('Mixed fishery (warmwater + stocked trout)');
  expect(opportunityHeadlineLabel('unresolved')).toBe('Trout status unresolved');
  expect(opportunityEvidenceLabel('documented', '2024')).toBe('Documented · 2024');
  expect(opportunityEvidenceLabel('historical', '2020-04')).toBe('Historical · 2020-04');
  expect(opportunityEvidenceLabel('limited')).toBe('Limited');
  expect(opportunityEvidenceLabel('conflicting')).toBe('Conflicting');
  expect(opportunityEvidenceLabel('unresolved')).toBe('Unresolved');
});
it('rejects cross-water, duplicate and example records in a shipped pack', () => {
  const pack = (access: unknown[], waterId = 'little-river') => ({ records: [{ waterId, access }] });
  expect(AccessPackSchema.safeParse(pack([record])).success).toBe(true);
  expect(AccessPackSchema.safeParse(pack([record], 'other-water')).success).toBe(false);
  expect(AccessPackSchema.safeParse(pack([record, record])).success).toBe(false);
  expect(AccessPackSchema.safeParse(pack([{ ...record, id: 'example-parking' }])).success).toBe(false);
});
