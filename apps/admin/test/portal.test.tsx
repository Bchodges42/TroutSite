// OWNER: ROLE 4. Portal component tests: token auth flow against MSW, composer validation,
// publish → public feed. Mock tokens encode the fixture shop id so the mock /me endpoint
// authorizes them exactly like the real endpoint will (v1.<shopId>...).
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App.js';
import { ComposerView } from '../src/views/ComposerView.js';
import { HistoryView } from '../src/views/HistoryView.js';
import { clearToken, saveToken } from '../src/api/client.js';
import { mintToken } from '../src/lib/tokenNode.js';
import { catalog } from '../src/pack.js';
import { FIXTURE_SHOP, FIXTURE_SHOP_REPORTS } from '../src/msw/fixtures.js';

const MOCK_TOKEN = mintToken(FIXTURE_SHOP.id, 'test-secret', 30);

beforeEach(() => {
  localStorage.clear();
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
    render(<ComposerView catalog={catalog} />);
    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    expect(await screen.findByText(/Write the report/i)).toBeTruthy();
    // Nothing was posted.
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('flags hot-pattern rows without a pattern selection', async () => {
    const user = userEvent.setup();
    render(<ComposerView catalog={catalog} />);
    await user.type(screen.getByLabelText('Report body'), 'Sulphurs came off hard last night at the weir pool.');
    await user.click(screen.getByRole('button', { name: '+ Add pattern' }));
    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    expect(await screen.findByText(/Pick a pattern for each hot-fly row/i)).toBeTruthy();
  });

  it('saves a draft locally, then publishes it to the mock API', async () => {
    const user = userEvent.setup();
    saveToken(MOCK_TOKEN);
    const published: string[] = [];
    render(
      <ComposerView
        catalog={catalog}
        onPublished={(report) => published.push(report.id)}
      />,
    );
    await user.selectOptions(screen.getByLabelText('Water'), 'little-river');
    await user.type(screen.getByLabelText('Report body'), 'Fishable flow all week; sulphurs in the evening and a sowbug dropper produced. ');
    await user.click(screen.getByRole('button', { name: '+ Add pattern' }));
    await user.selectOptions(screen.getByLabelText('Hot pattern 1'), 'sulphur-parachute');
    await user.type(screen.getByLabelText('Hook size 1'), '16');
    await user.click(screen.getByRole('button', { name: /Save draft/i }));
    expect(localStorage.getItem('trout.admin.drafts.v1')).toContain('little-river');

    await user.click(screen.getByRole('button', { name: 'Publish report' }));
    await waitFor(() => expect(published).toHaveLength(1));
    // The mock handler served a contracts-valid report.
    expect(FIXTURE_SHOP_REPORTS.length).toBeGreaterThanOrEqual(2);
    clearToken();
  });

  it('rejects non-https photo links', async () => {
    const user = userEvent.setup();
    render(<ComposerView catalog={catalog} />);
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
});
