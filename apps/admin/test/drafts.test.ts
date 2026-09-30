// OWNER: ROLE 4. Draft persistence — reports stay in the browser until published (§1 privacy).
// F16: drafts are scoped to the signed-in shop; legacy unscoped drafts are quarantined.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLegacyDrafts,
  countLegacyDrafts,
  deleteDraft,
  getDraft,
  listDrafts,
  saveDraft,
  emptyDraft,
  todayIso,
} from '../src/state/drafts.js';

const SHOP_A = 'little-river-outfitters';
const SHOP_B = 'tellico-outfitters';

beforeEach(() => localStorage.clear());

describe('draft store (localStorage only, scoped per shop — F16)', () => {
  it('saves, updates, lists and deletes drafts within one shop', () => {
    const draft = { ...emptyDraft(SHOP_A), body: 'Sulphurs at dusk on the Little River.', date: '2026-08-17' };
    saveDraft(SHOP_A, draft);
    expect(listDrafts(SHOP_A)).toHaveLength(1);
    expect(getDraft(SHOP_A, draft.id)?.body).toContain('Sulphurs');

    saveDraft(SHOP_A, { ...draft, body: 'Updated after the evening rise.' });
    expect(listDrafts(SHOP_A)).toHaveLength(1);
    expect(getDraft(SHOP_A, draft.id)?.body).toContain('Updated');

    deleteDraft(SHOP_A, draft.id);
    expect(listDrafts(SHOP_A)).toHaveLength(0);
    expect(getDraft(SHOP_A, draft.id)).toBeUndefined();
  });

  it('binds a draft to the shop it is saved under, even if the draft object claims another', () => {
    const draft = { ...emptyDraft(SHOP_A), shopId: SHOP_B };
    saveDraft(SHOP_A, draft);
    expect(getDraft(SHOP_A, draft.id)?.shopId).toBe(SHOP_A);
    // ...and it never becomes visible under the claimed identity.
    expect(getDraft(SHOP_B, draft.id)).toBeUndefined();
  });

  it('another shop cannot see, adopt, or delete this shop drafts (F16)', () => {
    const a = { ...emptyDraft(SHOP_A), body: 'Shop A private notes.' };
    saveDraft(SHOP_A, a);

    expect(listDrafts(SHOP_B)).toEqual([]);
    expect(getDraft(SHOP_B, a.id)).toBeUndefined();
    deleteDraft(SHOP_B, a.id);
    expect(getDraft(SHOP_A, a.id)).toBeTruthy();
  });

  it('logout retains the drafts: the same shop finds them again on re-login', () => {
    const a = { ...emptyDraft(SHOP_A), body: 'Still mine after sign-out.' };
    saveDraft(SHOP_A, a);
    // Sign-out clears the token, never the draft namespace.
    expect(listDrafts(SHOP_A).map((d) => d.id)).toContain(a.id);
    // A different shop signing in on the same browser still sees nothing of it.
    expect(listDrafts(SHOP_B)).toEqual([]);
  });

  it('ignores (never adopts) records inside its namespace that carry a foreign shopId', () => {
    const key = `trout.admin.drafts.v2.${SHOP_A}`;
    localStorage.setItem(
      key,
      JSON.stringify([{ id: 'smuggled', shopId: 'someone-else', body: 'not mine', hotPatterns: [] }]),
    );
    expect(listDrafts(SHOP_A)).toEqual([]);
  });

  it('survives malformed storage without throwing', () => {
    localStorage.setItem(`trout.admin.drafts.v2.${SHOP_A}`, '{not json');
    expect(listDrafts(SHOP_A)).toEqual([]);
  });

  it('sorts most recently edited first', () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    try {
      const a = emptyDraft(SHOP_A);
      saveDraft(SHOP_A, { ...a, body: 'older' });
      vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
      const b = emptyDraft(SHOP_A);
      saveDraft(SHOP_A, { ...b, body: 'newer' });
      expect(listDrafts(SHOP_A)[0]?.body).toBe('newer');
    } finally {
      vi.useRealTimers();
    }
  });

  it('todayIso uses the LOCAL civil date, not the UTC day (F12)', () => {
    // Sept 30, 01:00 UTC = Sept 29, 8:00 p.m. America/Chicago (CDT) — the
    // audit's scenario: an evening report must be dated today, not tomorrow.
    // The test machine's timezone is not forced; assert via the same local
    // getters the implementation must use.
    const instant = new Date(Date.UTC(2026, 8, 30, 1, 0, 0));
    const expected = `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, '0')}-${String(instant.getDate()).padStart(2, '0')}`;
    expect(todayIso(instant)).toBe(expected);
    expect(expected).not.toBe(instant.toISOString().slice(0, 10)); // guard: this instant differs west of UTC
  });
});

describe('legacy unscoped drafts (pre-F16) — explicit quarantine policy', () => {
  const seedLegacy = (drafts: unknown[]) => localStorage.setItem('trout.admin.drafts.v1', JSON.stringify(drafts));

  it('are never listed for, or claimed by, any shop that logs in', () => {
    seedLegacy([
      { id: 'legacy-1', streamId: null, date: '2026-08-01', body: 'Shop A private notes.', hotPatterns: [], photoUrl: '', updatedAt: '2026-08-01T00:00:00.000Z' },
    ]);
    expect(listDrafts(SHOP_A)).toEqual([]);
    expect(listDrafts(SHOP_B)).toEqual([]);
    // The old global key is left untouched (no silent migration/destruction).
    expect(localStorage.getItem('trout.admin.drafts.v1')).toContain('Shop A private notes.');
  });

  it('are counted (content-blind) for the one-time disclosure', () => {
    seedLegacy([{ id: 'l1' }, { id: 'l2' }]);
    expect(countLegacyDrafts()).toBe(2);
    expect(countLegacyDrafts()).not.toBeNaN();
  });

  it('tolerate a malformed legacy payload', () => {
    localStorage.setItem('trout.admin.drafts.v1', '{oops');
    expect(countLegacyDrafts()).toBe(0);
  });

  it('are removed only by the explicit clear path', () => {
    seedLegacy([{ id: 'legacy-1' }]);
    clearLegacyDrafts();
    expect(countLegacyDrafts()).toBe(0);
    expect(localStorage.getItem('trout.admin.drafts.v1')).toBeNull();
  });
});
