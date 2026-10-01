// OWNER: DASHBOARD lane (ADR 0017). Owner-area tests against MSW: deep-link
// gate, wrong-token state, dashboard render, and the credential boundary
// (owner token in memory only — never localStorage, never the shop token).
// Shop login flow stays covered by portal.test.tsx untouched.
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { App } from '../src/App.js';
import {
  OWNER_MODE_HASH,
  clearOwnerToken,
} from '../src/features/owner/ownerClient.js';
import { saveToken } from '../src/api/client.js';
import { mintToken } from '../src/lib/tokenNode.js';
import { server } from './mswNode.js';
import { FIXTURE_SHOP } from '../src/msw/fixtures.js';

const OWNER_TOKEN = 'owner-test-token-0123456789abcdef';
const SHOP_TOKEN = mintToken(FIXTURE_SHOP.id, 'test-secret', 30);

const DASHBOARD_PAYLOAD = {
  generatedAt: '2026-09-30T12:00:00.000Z',
  jobs: [
    {
      name: 'gauges',
      expected: true,
      lastAttemptAt: '2026-09-30T11:05:00.000Z',
      lastSuccessAt: '2026-09-30T11:06:00.000Z',
      lastOutcome: 'ok',
      runsLast24h: 24,
      nextExpectedRun: '2026-09-30T12:05:00.000Z',
      neverRun: false,
    },
    {
      name: 'evidence',
      expected: true,
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastOutcome: 'unknown',
      runsLast24h: 0,
      nextExpectedRun: null,
      neverRun: true,
    },
  ],
  omittedJobNames: 0,
  feeds: [
    {
      area: 'conditions',
      present: true,
      healthy: true,
      reason: null,
      fileMtime: '2026-09-30T11:50:00.000Z',
      ageMinutes: 10,
      extra: { records: 146, assessed: 146 },
    },
    {
      area: 'fishability',
      present: false,
      healthy: true,
      reason: 'fishability feed has not been generated',
      fileMtime: null,
      ageMinutes: null,
      extra: {},
    },
  ],
  snapshotFreshness: { latestFileTimes: { conditions: '2026-09-30T11:50:00.000Z' } },
  counts: {
    correctionsByStatus: { received: 3, accepted: 1 },
    correctionsOpen: 3,
    watchRules: 2,
    pushSubscriptions: 5,
  },
  unresolvedEvidence: {
    byState: { documented: 10, conflicting: 1, unresolved: 2, historical: 1 },
    researchCount: 4,
    waters: [
      {
        id: 'watauga-river',
        name: 'Watauga River',
        regionId: 'tn-northeast-watauga',
        evidenceState: 'conflicting',
        headline: 'unresolved',
        asOf: '2025',
      },
    ],
  },
};

const CORRECTIONS_PAYLOAD = {
  corrections: [
    {
      id: 7,
      status: 'received',
      category: 'regulations',
      waterId: 'watauga-river',
      waterName: 'Watauga River',
      proposedCorrection: 'The creel limit shown is the old two-fish rule.',
      riskFlags: ['regulations'],
      receivedAt: '2026-09-30T09:00:00.000Z',
      updatedAt: '2026-09-30T09:00:00.000Z',
    },
  ],
};

const RESEARCH_PAYLOAD = {
  total: 1,
  truncated: false,
  queue: [
    {
      id: 'watauga-river',
      name: 'Watauga River',
      regionId: 'tn-northeast-watauga',
      evidenceState: 'conflicting',
      headline: 'unresolved',
      asOf: '2025',
      unresolvedQuestion: 'Does the year-round tailwater claim still hold?',
      claimsNeedingEvidence: ['species', 'season', 'access', 'regulations'],
    },
  ],
};

function ownerHandlers() {
  return [
    http.get('*/v1/owner/publication-preview', ({ request }) => {
      if (request.headers.get('Authorization') !== `Bearer ${OWNER_TOKEN}`) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
      return HttpResponse.json({ state: 'not-prepared', publication: null });
    }),
    http.get('*/v1/owner/dashboard', ({ request }) => {
      const auth = request.headers.get('Authorization') ?? '';
      if (auth !== `Bearer ${OWNER_TOKEN}`) {
        return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      return HttpResponse.json(DASHBOARD_PAYLOAD);
    }),
    http.get('*/v1/owner/corrections', ({ request }) => {
      const auth = request.headers.get('Authorization') ?? '';
      if (auth !== `Bearer ${OWNER_TOKEN}`) {
        return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      return HttpResponse.json(CORRECTIONS_PAYLOAD);
    }),
    http.get('*/v1/owner/research-queue', ({ request }) => {
      const auth = request.headers.get('Authorization') ?? '';
      if (auth !== `Bearer ${OWNER_TOKEN}`) {
        return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      return HttpResponse.json(RESEARCH_PAYLOAD);
    }),
  ];
}

beforeEach(() => {
  localStorage.clear();
  clearOwnerToken();
  window.location.hash = '';
});

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('owner gate (deep link)', () => {
  it('opens the owner gate — not the shop login — even with a stored shop token', async () => {
    saveToken(SHOP_TOKEN); // the shop portal would boot straight in without the hash
    window.location.hash = OWNER_MODE_HASH;
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Owner Dashboard' })).toBeTruthy();
    expect(screen.getByLabelText('Owner token')).toBeTruthy();
    // The shop portal must NOT have rendered.
    expect(screen.queryByText(FIXTURE_SHOP.name)).toBeNull();
  });

  it('rejects a wrong token, stays on the gate, and stores nothing anywhere', async () => {
    window.location.hash = OWNER_MODE_HASH;
    server.use(...ownerHandlers()); // the mock 401s anything but OWNER_TOKEN
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Owner token'), 'totally-wrong-token');
    await user.click(screen.getByRole('button', { name: 'Unlock dashboard' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/not valid/i);
    // Still gated.
    expect(screen.getByLabelText('Owner token')).toBeTruthy();
    // Credential floor: no owner key in localStorage, no cookie, nothing persisted.
    expect(localStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });

  it('unlocks with the right token and renders the read-only dashboard', async () => {
    window.location.hash = OWNER_MODE_HASH;
    server.use(...ownerHandlers());
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Owner token'), OWNER_TOKEN);
    await user.click(screen.getByRole('button', { name: 'Unlock dashboard' }));

    // Feed health cards.
    expect(await screen.findByText('healthy')).toBeTruthy();
    expect(screen.getByText('not generated')).toBeTruthy();
    // Jobs table: the never-run expected job is flagged.
    const jobsTable = screen.getByLabelText('Pipeline jobs');
    expect(within(jobsTable).getByText('evidence')).toBeTruthy();
    expect(within(jobsTable).getByText('never ran')).toBeTruthy();
    expect(within(jobsTable).getByText('ok')).toBeTruthy();
    // Counts + queues.
    expect(screen.getByText('Corrections queue (summary)')).toBeTruthy();
    expect(screen.getByText(/The creel limit shown is the old two-fish rule/)).toBeTruthy();
    expect(screen.getByText('Research queue (editorial)')).toBeTruthy();
    expect(screen.getByText(/year-round tailwater claim/)).toBeTruthy();
    expect(screen.getByText('species, season, access, regulations')).toBeTruthy();
    // Explicit read-only note, and no action buttons anywhere.
    expect(screen.getAllByText(/read-only/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /publish|approve|reject|trigger|run/i })).toBeNull();
  });

  it('keeps the owner token in memory only after a successful unlock', async () => {
    window.location.hash = OWNER_MODE_HASH;
    server.use(...ownerHandlers());
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Owner token'), OWNER_TOKEN);
    await user.click(screen.getByRole('button', { name: 'Unlock dashboard' }));
    await screen.findByText('Pipeline jobs');
    expect(localStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });

  it('sends the owner token — never the stored shop token — to owner endpoints', async () => {
    window.location.hash = OWNER_MODE_HASH;
    const seenAuth: string[] = [];
    server.use(
      http.get('*/v1/owner/dashboard', ({ request }) => {
        seenAuth.push(request.headers.get('Authorization') ?? '');
        return HttpResponse.json(DASHBOARD_PAYLOAD);
      }),
      http.get('*/v1/owner/corrections', () => HttpResponse.json(CORRECTIONS_PAYLOAD)),
      http.get('*/v1/owner/research-queue', () => HttpResponse.json(RESEARCH_PAYLOAD)),
      http.get('*/v1/owner/publication-preview', ({ request }) => {
        seenAuth.push(request.headers.get('Authorization') ?? '');
        return HttpResponse.json({ state: 'not-prepared', publication: null });
      }),
    );
    saveToken(SHOP_TOKEN); // a shop token IS present in localStorage
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Owner token'), OWNER_TOKEN);
    await user.click(screen.getByRole('button', { name: 'Unlock dashboard' }));
    await screen.findByText('Pipeline jobs');
    await waitFor(() => expect(seenAuth.length).toBeGreaterThanOrEqual(1));
    for (const auth of seenAuth) {
      expect(auth).toBe(`Bearer ${OWNER_TOKEN}`);
      expect(auth).not.toContain(SHOP_TOKEN);
    }
  });
});

describe('shop login flow coexistence', () => {
  it('shows the plain shop login (plus the owner deep link) when no hash is set', async () => {
    render(<App />);
    expect(await screen.findByLabelText('Shop token')).toBeTruthy();
    const link = screen.getByRole('link', { name: /owner dashboard/i });
    expect(link.getAttribute('href')).toBe(OWNER_MODE_HASH);
    // No owner calls went out.
    expect(screen.queryByLabelText('Owner token')).toBeNull();
  });
});
