// OWNER: ROLE 4. Portal component tests: token auth flow against MSW, composer validation,
// publish → public feed. Mock tokens encode the fixture shop id so the mock /me endpoint
// authorizes them exactly like the real endpoint will (v1.<shopId>...).
// F15: server acceptance is final (draft removed, local failures surfaced separately,
// Idempotency-Key replay). F16: drafts are scoped to the signed-in shop.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { App } from '../src/App.js';
import { ComposerView } from '../src/views/ComposerView.js';
import { HistoryView } from '../src/views/HistoryView.js';
import { clearToken, saveToken } from '../src/api/client.js';
import { mintToken } from '../src/lib/tokenNode.js';
import { catalog } from '../src/pack.js';
import { recordedIdempotencyKeys } from '../src/msw/handlers.js';
import { server } from './mswNode.js';
import { countLegacyDrafts, emptyDraft, saveDraft } from '../src/state/drafts.js';
import { FIXTURE_SHOP, FIXTURE_SHOP_REPORTS } from '../src/msw/fixtures.js';
import type { Shop } from '@trout/contracts';

const MOCK_TOKEN = mintToken(FIXTURE_SHOP.id, 'test-secret', 30);
const draftsKey = `trout.admin.drafts.v2.${FIXTURE_SHOP.id}`;

beforeEach(() => {
  localStorage.clear();
  recordedIdempotencyKeys.length = 0;
});
afterEach(() => {
  cleanup();
});

describe('auth flow (token login → /v1/portal/me)', () => {
  it('signs in with a valid shop token and shows the shop portal', async () => {
    const user = userEvent.setup();
    render(<App />);
    const tokenBox = await screen.findByLabelText('Shop token');
    await user.type(tokenBox, MOCK_TOKEN);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: FIXTURE_SHOP.name })).toBeTruthy();
    // No account, no cookie — the token lives in localStorage only.
    expect(document.cookie).toBe('');
    expect(localStorage.getItem('trout.admin.token')).toBe(MOCK_TOKEN);
  });

  it('rejects an invalid token without storing it', async () => {
    const user = userEvent.setup();
    render(<App />);
    const tokenBox = await screen.findByLabelText('Shop token');
    await user.type(tokenBox, 'v1.some-other-shop.1.2.sig');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(localStorage.getItem('trout.admin.token')).toBeNull();
  });

  it('boots into the portal when a valid token is already stored', async () => {
    saveToken(MOCK_TOKEN);
    render(<App />);
    expect(await screen.findByRole('heading', { name: FIXTURE_SHOP.name })).toBeTruthy();
    clearToken();
  });
});

describe('report composer', () => {
  it('blocks publishing an empty report and shows the validation message', async () => {
    const user = userEvent.setup();
    render(<ComposerView catalog={catalog} shopId={FIXTURE_SHOP.id} />);
    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    expect(await screen.findByText(/Write the report/i)).toBeTruthy();
    // Nothing was posted.
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('flags hot-pattern rows without a pattern selection', async () => {
    const user = userEvent.setup();
    render(<ComposerView catalog={catalog} shopId={FIXTURE_SHOP.id} />);
    await user.type(screen.getByLabelText('Report body'), 'Sulphurs came off hard last night at the weir pool.');
    await user.click(screen.getByRole('button', { name: '+ Add pattern' }));
    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    expect(await screen.findByText(/Pick a pattern for each hot-fly row/i)).toBeTruthy();
  });

  it('saves a draft locally (shop-scoped), then removes it on server acceptance (F15/F16)', async () => {
    const user = userEvent.setup();
    saveToken(MOCK_TOKEN);
    const published: string[] = [];
    render(
      <ComposerView
        catalog={catalog}
        shopId={FIXTURE_SHOP.id}
        onPublished={(report) => published.push(report.id)}
      />,
    );
    await user.selectOptions(screen.getByLabelText('Water'), 'little-river');
    await user.type(screen.getByLabelText('Report body'), 'Fishable flow all week; sulphurs in the evening and a sowbug dropper produced. ');
    await user.click(screen.getByRole('button', { name: '+ Add pattern' }));
    await user.selectOptions(screen.getByLabelText('Hot pattern 1'), 'sulphur-parachute');
    await user.type(screen.getByLabelText('Hook size 1'), '16');
    await user.click(screen.getByRole('button', { name: /Save draft/i }));
    // The draft lives in THIS SHOP's namespace (F16), not a browser-global key.
    expect(localStorage.getItem(draftsKey)).toContain('little-river');

    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    await waitFor(() => expect(published).toHaveLength(1));
    // Server acceptance is final: the published body must not stay editable as a
    // reusable draft (F15).
    await screen.findByText(/Published — thank you/i);
    expect(JSON.parse(localStorage.getItem(draftsKey) ?? '[]')).toHaveLength(0);
    // The mock handler served a contracts-valid report.
    expect(FIXTURE_SHOP_REPORTS.length).toBeGreaterThanOrEqual(2);
    clearToken();
  });

  it('keeps a server-accepted publish final even when the local cleanup throws (F15)', async () => {
    const user = userEvent.setup();
    saveToken(MOCK_TOKEN);
    const published: string[] = [];
    render(
      <ComposerView
        catalog={catalog}
        shopId={FIXTURE_SHOP.id}
        onPublished={(report) => published.push(report.id)}
      />,
    );
    await user.type(screen.getByLabelText('Report body'), 'Accepted regardless of storage health.');
    await user.click(screen.getByRole('button', { name: /Save draft/i }));
    expect(localStorage.getItem(draftsKey)).toContain('Accepted regardless');

    // The exact scenario from the audit: QuotaExceededError during the post-acceptance
    // local write. It must never turn the accepted 201 into "Publishing failed".
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    };
    try {
      await user.click(screen.getByRole('button', { name: 'Publish report' }));
      expect(await screen.findByText(/Published — thank you/i)).toBeTruthy();
    } finally {
      Storage.prototype.setItem = setItem;
    }
    expect(published).toHaveLength(1);
    expect(screen.queryByText(/Publishing failed/i)).toBeNull();
    // The local problem IS surfaced — separately, without claiming server rejection.
    expect(screen.getByText(/could not be removed/)).toBeTruthy();
    // The un-removable copy is honestly still there (the user is told to delete it).
    expect(localStorage.getItem(draftsKey)).toContain('Accepted regardless');
  });

  it('retries reuse the SAME Idempotency-Key and the accepted report is not duplicated (F15/F02)', async () => {
    const user = userEvent.setup();
    saveToken(MOCK_TOKEN);
    const published: string[] = [];
    render(
      <ComposerView
        catalog={catalog}
        shopId={FIXTURE_SHOP.id}
        onPublished={(report) => published.push(report.id)}
      />,
    );
    await user.type(screen.getByLabelText('Report body'), 'One acceptance only, even across retries.');

    // First attempt dies at the network layer (the override must record the key
    // itself — it replaces the default handler for this request).
    server.use(
      http.post('*/v1/portal/reports', ({ request }) => {
        recordedIdempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        return HttpResponse.error();
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    expect(await screen.findByText(/Publishing failed — check your connection/i)).toBeTruthy();
    // An unaccepted attempt leaves the draft editable with its body intact.
    expect((screen.getByLabelText('Report body') as HTMLTextAreaElement).value).toBe(
      'One acceptance only, even across retries.',
    );

    // Retry with unchanged content: same draft id + same content → SAME key, so the
    // server replays instead of double-inserting.
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    await waitFor(() => expect(published).toHaveLength(1));
    expect(recordedIdempotencyKeys).toHaveLength(2);
    expect(recordedIdempotencyKeys[0]).toBe(recordedIdempotencyKeys[1]);
    // The mock API's replay semantics: exactly ONE report exists for this body.
    const created = FIXTURE_SHOP_REPORTS.filter((r) => r.body === 'One acceptance only, even across retries.');
    expect(created).toHaveLength(1);
    clearToken();
  });

  it('rejects non-https photo links', async () => {
    const user = userEvent.setup();
    render(<ComposerView catalog={catalog} shopId={FIXTURE_SHOP.id} />);
    await user.type(screen.getByLabelText('Report body'), 'Steady flows, fish on caddis pupa in the morning seams.');
    await user.type(screen.getByLabelText('Photo link'), 'http://insecure.example/pic.jpg');
    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    expect(await screen.findByText(/Photo link must be a https/i)).toBeTruthy();
  });
});

describe('history view', () => {
  it('shows published reports for this shop only, with attribution', async () => {
    render(<HistoryView shop={FIXTURE_SHOP} refreshKey={0} onEditDraft={() => {}} />);
    expect(await screen.findByText(/Sulphurs showed up around 8pm/i)).toBeTruthy();
    expect(screen.queryByText(/Delayed harvest season ahead/i)).toBeNull();
    // Every published report for this shop carries an attribution link (one per report).
    expect(
      screen.getAllByRole('link', { name: 'https://littleriveroutfitters.com' }),
    ).toHaveLength(FIXTURE_SHOP_REPORTS.length);
  });

  it('shows an honest empty state for drafts', async () => {
    render(<HistoryView shop={FIXTURE_SHOP} refreshKey={0} onEditDraft={() => {}} />);
    expect(await screen.findByText('No drafts yet')).toBeTruthy();
  });

  it('never shows another shop drafts; legacy drafts are disclosed by count only (F16)', async () => {
    // Shop A (the fixture shop) saved a private draft before signing out.
    saveDraft(FIXTURE_SHOP.id, { ...emptyDraft(FIXTURE_SHOP.id), body: 'Shop A private plan for the weekend.' });
    localStorage.setItem(
      'trout.admin.drafts.v1',
      JSON.stringify([{ id: 'legacy-1', body: 'ancient unscoped notes' }]),
    );
    const shopB: Shop = { ...FIXTURE_SHOP, id: 'tellico-outfitters', name: 'Tellico Outfitters' };
    render(<HistoryView shop={shopB} refreshKey={0} onEditDraft={() => {}} />);

    // Shop B sees none of Shop A's drafts…
    expect(await screen.findByText('No drafts yet')).toBeTruthy();
    expect(screen.queryByText(/Shop A private plan/)).toBeNull();
    // …but the browser's quarantined legacy drafts are disclosed by count, and their
    // content is never rendered or adopted.
    expect(screen.getByText(/older version of the portal/)).toBeTruthy();
    expect(screen.queryByText(/ancient unscoped notes/)).toBeNull();
  });

  it('removes legacy drafts only through the explicit confirmed clear path (F16)', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'trout.admin.drafts.v1',
      JSON.stringify([{ id: 'legacy-1', body: 'secret notes' }]),
    );
    render(<HistoryView shop={FIXTURE_SHOP} refreshKey={0} onEditDraft={() => {}} />);
    expect(await screen.findByText(/older version of the portal/)).toBeTruthy();
    expect(screen.queryByText(/secret notes/)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Clear old unattributed drafts' }));
    await user.click(await screen.findByRole('button', { name: 'Permanently clear' }));
    expect(await screen.findByText('No drafts yet')).toBeTruthy();
    expect(countLegacyDrafts()).toBe(0);
  });

  it('lists the signed-in shop own drafts with edit access (F16 happy path)', async () => {
    const user = userEvent.setup();
    const edited: string[] = [];
    saveDraft(FIXTURE_SHOP.id, { ...emptyDraft(FIXTURE_SHOP.id), body: 'Mine: caddis at dusk.' });
    render(<HistoryView shop={FIXTURE_SHOP} refreshKey={0} onEditDraft={(d) => edited.push(d.id)} />);
    expect(await screen.findByText(/Mine: caddis at dusk\./)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(edited).toHaveLength(1);
  });
});
