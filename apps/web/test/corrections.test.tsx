import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  CATEGORY_LABELS,
  CORRECTION_CATEGORIES,
  composeCorrectionText,
  validateCorrectionSubmission,
} from '../src/features/corrections/correctionSchema';
import type { CorrectionSubmission } from '../src/features/corrections/correctionSchema';
import {
  CorrectionTransportUnavailable,
  defaultPostCorrection,
} from '../src/features/corrections/CorrectionForm';
import {
  RECEIPT_CODE_RE,
  defaultFetchCorrectionStatus,
  normalizeReceiptCode,
} from '../src/features/corrections/CorrectionStatus';
import { CorrectionsPage } from '../src/pages/CorrectionsPage';
import { StreamDetailPage } from '../src/pages/StreamDetailPage';
import { SettingsProvider } from '../src/lib/settings';
import type { Stream } from '@trout/contracts';

/**
 * CORRECTIONS lane — the user-suggested water-correction workflow (ADR 0015).
 * Two layers: the pure schema (the client-side mirror of the future server-side
 * zod checks) and the honest surfaces (form + receipt lookup + page). The
 * transport does not exist yet, so every test enforces the honesty rules:
 * nothing may claim a submission was sent when it was not.
 */

const NOW = Date.parse('2026-09-30T12:00:00Z');

function minimal(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    waterId: 'harpeth-river',
    category: 'regulations',
    proposedCorrection: 'The special-regulation limit is one fish over 18 inches now.',
    honeypot: '',
    submittedAt: NOW,
    ...overrides,
  };
}

describe('correctionSchema — pure validation (server-contract mirror, ADR 0015 §1)', () => {
  it('accepts the valid minimal submission and drops empty optionals', () => {
    const result = validateCorrectionSubmission(minimal(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.waterId).toBe('harpeth-river');
    expect(result.value.category).toBe('regulations');
    expect(result.value.proposedCorrection).toContain('18 inches');
    expect(result.value.waterName).toBeUndefined();
    expect(result.value.sourceUrl).toBeUndefined();
    expect(result.value.reporterEmail).toBeUndefined();
    expect(result.value.honeypot).toBeUndefined();
  });

  it('accepts every category in the enum and nothing outside it', () => {
    for (const category of CORRECTION_CATEGORIES) {
      const result = validateCorrectionSubmission(minimal({ category }), NOW);
      expect(result.ok).toBe(true);
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
    const bad = validateCorrectionSubmission(minimal({ category: 'colors' }), NOW);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.category).toMatch(/choose/i);
  });

  it('requires a stable catalog waterId and rejects display-name-ish values', () => {
    const missing = validateCorrectionSubmission(minimal({ waterId: '   ' }), NOW);
    expect(missing.ok).toBe(false);
    const spaced = validateCorrectionSubmission(minimal({ waterId: 'Harpeth River' }), NOW);
    expect(spaced.ok).toBe(false);
  });

  it('accepts https source URLs only — http, javascript, ftp, credentials, and oversized all fail', () => {
    const ok = validateCorrectionSubmission(
      minimal({ sourceUrl: 'https://www.tn.gov/twra/guide.html' }),
      NOW,
    );
    expect(ok.ok).toBe(true);
    for (const bad of [
      'http://www.tn.gov/twra/guide.html',
      'javascript:alert(1)',
      'ftp://example.com/guide.pdf',
      'https://user:pass@example.com/guide.html',
      `https://example.com/${'a'.repeat(2100)}`,
      'not a url at all',
    ]) {
      const result = validateCorrectionSubmission(minimal({ sourceUrl: bad }), NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.sourceUrl).toMatch(/https/i);
    }
  });

  it('enforces the length bounds: proposedCorrection 10–2000, context fields capped', () => {
    const tooShort = validateCorrectionSubmission(minimal({ proposedCorrection: 'too short' }), NOW);
    expect(tooShort.ok).toBe(false);

    const empty = validateCorrectionSubmission(minimal({ proposedCorrection: '' }), NOW);
    expect(empty.ok).toBe(false);

    const tooLong = validateCorrectionSubmission(
      minimal({ proposedCorrection: 'x'.repeat(2001) }),
      NOW,
    );
    expect(tooLong.ok).toBe(false);

    const boundary = validateCorrectionSubmission(minimal({ proposedCorrection: 'x'.repeat(2000) }), NOW);
    expect(boundary.ok).toBe(true);

    const whatWrong = validateCorrectionSubmission(
      minimal({ whatAppearsWrong: 'y'.repeat(2001) }),
      NOW,
    );
    expect(whatWrong.ok).toBe(false);

    const fieldTooLong = validateCorrectionSubmission(minimal({ field: 'z'.repeat(201) }), NOW);
    expect(fieldTooLong.ok).toBe(false);
  });

  it('rejects a filled honeypot — humans never fill it', () => {
    const result = validateCorrectionSubmission(minimal({ honeypot: 'http://spam.example' }), NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.honeypot).toMatch(/empty/i);
  });

  it('validates sourcePubDate: strict YYYY-MM-DD, real calendar dates, never future', () => {
    expect(validateCorrectionSubmission(minimal({ sourcePubDate: '2026-03-01' }), NOW).ok).toBe(true);
    for (const bad of ['03/01/2026', '2026-13-01', '2026-02-30', '2026-3-1', '2026-10-01']) {
      const result = validateCorrectionSubmission(minimal({ sourcePubDate: bad }), NOW);
      expect(result.ok, `${bad} must fail`).toBe(false);
      if (!result.ok) expect(result.errors.sourcePubDate).toBeTruthy();
    }
  });

  it('requires a sane submittedAt: number, not more than a minute in the future', () => {
    const future = validateCorrectionSubmission(minimal({ submittedAt: NOW + 120_000 }), NOW);
    expect(future.ok).toBe(false);
    const stringed = validateCorrectionSubmission(minimal({ submittedAt: String(NOW) }), NOW);
    expect(stringed.ok).toBe(false);
    const skew = validateCorrectionSubmission(minimal({ submittedAt: NOW + 30_000 }), NOW);
    expect(skew.ok).toBe(true);
  });

  it('reports every offending field at once, not just the first', () => {
    const result = validateCorrectionSubmission({}, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.waterId).toBeTruthy();
    expect(result.errors.category).toBeTruthy();
    expect(result.errors.proposedCorrection).toBeTruthy();
    expect(result.errors.submittedAt).toBeTruthy();
  });

  it('composes a complete copyable text block for the unavailable state', () => {
    const submission = {
      waterId: 'harpeth-river',
      waterName: 'Harpeth River',
      category: 'regulations' as const,
      field: 'The listed creel limit',
      proposedCorrection: 'One trout over 18 inches per day under the special regulation.',
      sourceUrl: 'https://www.tn.gov/twra/guide.html',
      sourcePubDate: '2026-03-01',
      submittedAt: NOW,
    } satisfies CorrectionSubmission;
    const text = composeCorrectionText(submission);
    expect(text).toContain('Harpeth River (harpeth-river)');
    expect(text).toContain('One trout over 18 inches');
    expect(text).toContain('https://www.tn.gov/twra/guide.html');
    expect(text).toContain('2026-03-01');
  });
});

describe('correctionSchema — receipt-code format (ADR 0015 §2)', () => {
  it('accepts the documented Crockford-base32 shape and rejects lookalikes', () => {
    expect(RECEIPT_CODE_RE.test('ABCDE-FGHJK-MNPQR')).toBe(true);
    expect(RECEIPT_CODE_RE.test('AB123-CD234-EF345')).toBe(true);
    // I, L, O, U never appear; lowercase, short, and malformed codes fail.
    for (const bad of ['ABCDE-FGHIK-MNPQR', 'ABCDE-FGHIK-MNPOQ', 'abcde-fghjk-mnpqr', 'ABCDE-FGHJK', '']) {
      expect(RECEIPT_CODE_RE.test(bad), bad).toBe(false);
    }
  });

  it('normalizes typed codes: trim, uppercase, spaces to dashes', () => {
    expect(normalizeReceiptCode('  abcde fghjk mnpqr ')).toBe('ABCDE-FGHJK-MNPQR');
  });
});

// ---------------------------------------------------------------------------
// Render layer
// ---------------------------------------------------------------------------

function makeStream(): Stream {
  return {
    id: 'harpeth-river',
    name: 'Harpeth River',
    stateId: 'TN',
    waterbodyType: 'river',
    regionId: 'r0',
    hydroIdentity: { gnisIds: ['00000003'], huc8s: ['00000003'] },
    gaugeIds: ['g0'],
    stockingProgram: true,
    idealFlow: [{ min: 100, max: 400, unit: 'cfs' }],
    species: 'trout',
    officialSources: [],
  } as unknown as Stream;
}

function stubCatalogFetch(streams: Stream[] = [makeStream()]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const body = url.includes('/v1/streams') ? streams : [];
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch,
  );
}

function renderPage(
  search = '',
  seams: {
    postCorrection?: (s: CorrectionSubmission) => Promise<{ receiptCode: string }>;
    fetchCorrectionStatus?: (code: string) => Promise<unknown>;
  } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[`/corrections${search}`]}>
          <Routes>
            <Route
              path="corrections"
              element={
                <CorrectionsPage
                  postCorrection={seams.postCorrection as never}
                  fetchCorrectionStatus={seams.fetchCorrectionStatus as never}
                />
              }
            />
            <Route path="conditions/:streamId" element={<StreamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}

const FIND = { timeout: 2000 };

/** Fill only the fields validation requires; category defaults are not set. */
async function fillRequired(category = 'regulations') {
  const user = userEvent.setup();
  await user.selectOptions(
    await screen.findByLabelText('What kind of correction is this?', {}, FIND),
    category,
  );
  await user.type(screen.getByLabelText('What should it say instead?'), 'The creel limit shown is the old two-fish rule; the current guide says one fish over 18 inches.');
  return user;
}

beforeEach(() => stubCatalogFetch());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CorrectionsPage — composition and honesty', () => {
  it('prefills water and claim from the URL and resolves the water name from the catalog', async () => {
    renderPage('?water=harpeth-river&field=The%20listed%20creel%20limit');
    expect(
      await screen.findByLabelText('Which claim on the page is wrong? (optional)', {}, { timeout: 5000 }),
    ).toHaveValue('The listed creel limit');
    expect(await screen.findByText(/Harpeth River/)).toBeInTheDocument();
    expect(screen.getByText(/\(harpeth-river\)/)).toBeInTheDocument();
  });

  it('without ?water= explains finding the water first and links to /browse', async () => {
    renderPage();
    expect(await screen.findByText('Find the water first', {}, { timeout: 5000 })).toBeInTheDocument();
    const browse = screen.getByRole('link', { name: 'Browse waters' });
    expect(browse).toHaveAttribute('href', '/browse');
    // The form itself must not be offered without a water.
    expect(screen.queryByLabelText('What should it say instead?')).not.toBeInTheDocument();
  });

  it('shows an honest not-in-catalog state for an unknown water id', async () => {
    renderPage('?water=not-a-real-water');
    expect(
      await screen.findByText('That water is not in the cached catalog', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('carries the honesty copy and the optional-encouraged source field', async () => {
    renderPage('?water=harpeth-river');
    expect(
      await screen.findByText(/does not change the site immediately/, {}, FIND),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Source link (optional, https)')).toBeInTheDocument();
    // Stated on both the form and the page footer; at least one must always show.
    expect(screen.getAllByText(/no location, no device data/i).length).toBeGreaterThan(0);
  });

  it('renders length counters that track typed input', async () => {
    renderPage('?water=harpeth-river');
    const user = userEvent.setup();
    const proposed = await screen.findByLabelText('What should it say instead?', {}, FIND);
    await user.type(proposed, 'Hello');
    expect(screen.getByText(/5\/2000/)).toBeInTheDocument();
    await user.type(proposed, ', world');
    expect(screen.getByText(/12\/2000/)).toBeInTheDocument();
  });

  it('renders the honeypot field, hidden but present', async () => {
    renderPage('?water=harpeth-river');
    expect(
      await screen.findByLabelText('Leave this field empty', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('shows instant client-side validation errors and never calls the transport', async () => {
    const postCorrection = vi.fn();
    renderPage('?water=harpeth-river', { postCorrection });
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('correction-submit', {}, FIND));
    expect(await screen.findByText(/Describe the correction/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose what kind of correction/i)).toBeInTheDocument();
    expect(postCorrection).not.toHaveBeenCalled();
  });

  it('on transport-unavailable renders the honest state with copyable text — no sent-claim', async () => {
    const postCorrection = vi.fn().mockRejectedValue(new CorrectionTransportUnavailable());
    renderPage('?water=harpeth-river', { postCorrection });
    const user = await fillRequired();
    await user.click(screen.getByTestId('correction-submit'));
    expect(await screen.findByText(/validated locally and is ready to resend/, {}, FIND)).toBeInTheDocument();
    // Exactly the ADR sentence, no timeline promises.
    expect(
      screen.getByText(
        'Corrections submission opens when the review service ships — your correction was validated locally and is ready to resend.',
      ),
    ).toBeInTheDocument();
    // The composed text stays copyable.
    const composed = screen.getByLabelText(/ready to copy/i) as HTMLTextAreaElement;
    expect(composed).toHaveAttribute('readonly');
    expect(composed.value).toContain('harpeth-river');
    expect(composed.value).toContain('one fish over 18 inches');
    expect(screen.getByRole('button', { name: 'Copy correction text' })).toBeInTheDocument();
    // Nothing may claim a send.
    expect(screen.queryByTestId('correction-receipt')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/in the review queue/i);
    expect(postCorrection).toHaveBeenCalledTimes(1);
  }, 20000);

  it('on success shows the receipt code and the still-honest framing', async () => {
    const postCorrection = vi.fn().mockResolvedValue({ receiptCode: 'ABCDE-FGHJK-MNPQR' });
    renderPage('?water=harpeth-river', { postCorrection });
    const user = await fillRequired();
    await user.click(screen.getByTestId('correction-submit'));
    expect(await screen.findByTestId('receipt-code', {}, FIND)).toHaveTextContent(
      'ABCDE-FGHJK-MNPQR',
    );
    expect(screen.getByText(/in the review queue/i)).toBeInTheDocument();
    expect(screen.getByText(/has not changed the site/i)).toBeInTheDocument();
    expect(screen.queryByTestId('correction-unavailable')).not.toBeInTheDocument();
  }, 20000);

  it('default transport treats a missing endpoint as CorrectionTransportUnavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: 'not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
      ) as unknown as typeof fetch,
    );
    const submission = {
      waterId: 'harpeth-river',
      category: 'other' as const,
      proposedCorrection: 'Something is off here and needs a reviewer.',
      submittedAt: NOW,
    } satisfies CorrectionSubmission;
    await expect(defaultPostCorrection(submission)).rejects.toBeInstanceOf(
      CorrectionTransportUnavailable,
    );
  });

  it('default transport returns the receipt code on 202', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ receiptCode: 'ABCDE-FGHJK-MNPQR' }), {
          status: 202,
          headers: { 'content-type': 'application/json' },
        }),
      ) as unknown as typeof fetch,
    );
    const submission = {
      waterId: 'harpeth-river',
      category: 'other' as const,
      proposedCorrection: 'Something is off here and needs a reviewer.',
      submittedAt: NOW,
    } satisfies CorrectionSubmission;
    await expect(defaultPostCorrection(submission)).resolves.toEqual({
      receiptCode: 'ABCDE-FGHJK-MNPQR',
    });
  });
});

describe('CorrectionStatus — receipt lookup and the status vocabulary', () => {
  async function openStatusTab() {
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Check a receipt' }, FIND));
    return user;
  }

  it('explains the full status vocabulary with no promised timelines', async () => {
    renderPage('?water=harpeth-river');
    await openStatusTab();
    for (const phrase of [
      /Received — the suggestion is in the moderation queue/,
      /Needs more evidence —/,
      /Accepted —/,
      /Rejected —/,
      /Resolved —/,
    ]) {
      expect(screen.getByText(phrase)).toBeInTheDocument();
    }
    expect(screen.getByText(/no promised dates/i)).toBeInTheDocument();
  });

  it('looks a code up through the injected transport and renders the status', async () => {
    const fetchCorrectionStatus = vi.fn().mockResolvedValue({
      code: 'ABCDE-FGHJK-MNPQR',
      status: 'rejected',
      waterId: 'harpeth-river',
      note: 'Checked against the 2026 Tennessee guide; the posted limit is current.',
    });
    renderPage('?water=harpeth-river', { fetchCorrectionStatus });
    const user = await openStatusTab();
    await user.type(await screen.findByLabelText('Receipt code', {}, FIND), 'abcde fghjk mnpqr');
    await user.click(screen.getByTestId('status-check'));
    await waitFor(() => expect(fetchCorrectionStatus).toHaveBeenCalledWith('ABCDE-FGHJK-MNPQR'));
    expect(await screen.findByTestId('status-result', {}, FIND)).toHaveTextContent(/Rejected —/);
    expect(screen.getByTestId('status-note')).toHaveTextContent(/2026 Tennessee guide/);
  }, 20000);

  it('renders the honest unavailable state when the status transport is missing', async () => {
    const fetchCorrectionStatus = vi.fn().mockRejectedValue(new CorrectionTransportUnavailable());
    renderPage('?water=harpeth-river', { fetchCorrectionStatus });
    const user = await openStatusTab();
    await user.type(await screen.findByLabelText('Receipt code', {}, FIND), 'ABCDE-FGHJK-MNPQR');
    await user.click(screen.getByTestId('status-check'));
    expect(await screen.findByTestId('status-unavailable', {}, FIND)).toHaveTextContent(
      /Status lookup is unavailable right now/,
    );
    expect(fetchCorrectionStatus).toHaveBeenCalledTimes(1);
  }, 20000);

  it('refuses malformed codes without touching the transport', async () => {
    const fetchCorrectionStatus = vi.fn();
    renderPage('?water=harpeth-river', { fetchCorrectionStatus });
    const user = await openStatusTab();
    await user.type(await screen.findByLabelText('Receipt code', {}, FIND), 'not a code');
    await user.click(screen.getByTestId('status-check'));
    expect(await screen.findByTestId('status-not-found', {}, FIND)).toHaveTextContent(
      /XXXXX-XXXXX-XXXXX/,
    );
    expect(fetchCorrectionStatus).not.toHaveBeenCalled();
  }, 20000);

  it('default status transport reads the contract shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toBe('/v1/corrections/status/ABCDE-FGHJK-MNPQR');
        return new Response(
          JSON.stringify({ code: 'ABCDE-FGHJK-MNPQR', status: 'received', waterId: 'harpeth-river' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as unknown as typeof fetch,
    );
    await expect(defaultFetchCorrectionStatus('ABCDE-FGHJK-MNPQR')).resolves.toMatchObject({
      status: 'received',
      waterId: 'harpeth-river',
    });
  });
});

describe('StreamDetailPage — the one wiring edit', () => {
  it('links subtly to the corrections page carrying the water id', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { networkMode: 'offlineFirst', retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <SettingsProvider>
          <MemoryRouter initialEntries={['/conditions/harpeth-river']}>
            <Routes>
              <Route path="conditions/:streamId" element={<StreamDetailPage />} />
            </Routes>
          </MemoryRouter>
        </SettingsProvider>
      </QueryClientProvider>,
    );
    const link = await screen.findByRole('link', { name: /suggest a correction/i }, { timeout: 5000 });
    expect(link).toHaveAttribute('href', '/corrections?water=harpeth-river');
  });
});
