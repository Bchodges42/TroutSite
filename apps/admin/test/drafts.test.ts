// OWNER: ROLE 4. Draft persistence — reports stay in the browser until published (§1 privacy).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDraft, getDraft, listDrafts, saveDraft, emptyDraft } from '../src/state/drafts.js';

beforeEach(() => localStorage.clear());

describe('draft store (localStorage only)', () => {
  it('saves, updates, lists and deletes drafts', () => {
    const draft = { ...emptyDraft(), body: 'Sulphurs at dusk on the Little River.', date: '2026-08-17' };
    saveDraft(draft);
    expect(listDrafts()).toHaveLength(1);
    expect(getDraft(draft.id)?.body).toContain('Sulphurs');

    saveDraft({ ...draft, body: 'Updated after the evening rise.' });
    expect(listDrafts()).toHaveLength(1);
    expect(getDraft(draft.id)?.body).toContain('Updated');

    deleteDraft(draft.id);
    expect(listDrafts()).toHaveLength(0);
    expect(getDraft(draft.id)).toBeUndefined();
  });

  it('survives malformed storage without throwing', () => {
    localStorage.setItem('trout.admin.drafts.v1', '{not json');
    expect(listDrafts()).toEqual([]);
  });

  it('sorts most recently edited first', () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    try {
      const a = emptyDraft();
      saveDraft({ ...a, body: 'older' });
      vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
      const b = emptyDraft();
      saveDraft({ ...b, body: 'newer' });
      expect(listDrafts()[0]?.body).toBe('newer');
    } finally {
      vi.useRealTimers();
    }
  });
});
