import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button, Card } from '@trout/ui';
import { CorrectionTransportError, CorrectionTransportUnavailable } from './CorrectionForm';

/**
 * Receipt-code status lookup (ADR 0015). Same transport-seam discipline as the
 * form: the component takes a `fetchCorrectionStatus` prop, the default GETs
 * /v1/corrections/status/:code, and "route not shipped" renders the honest
 * unavailable state instead of pretending to look anything up.
 */

/** The complete public status vocabulary (ADR 0015 §Decision). */
export const CORRECTION_PUBLIC_STATUSES = [
  'received',
  'needs-more-evidence',
  'accepted',
  'rejected',
  'resolved',
] as const;

export type CorrectionPublicStatus = (typeof CORRECTION_PUBLIC_STATUSES)[number];

/** One plain-language line per status — rendered verbatim as the explainer. */
export const STATUS_EXPLANATIONS: Record<CorrectionPublicStatus, string> = {
  received:
    'Received — the suggestion is in the moderation queue and has not been reviewed yet.',
  'needs-more-evidence':
    'Needs more evidence — a reviewer saw it but needs a source or a specific detail; resubmit with the addition.',
  accepted:
    'Accepted — the correction was approved and is becoming a cited change to the content.',
  rejected:
    'Rejected — a reviewer checked it against sources and the current content stands (any reason is shown with the status).',
  resolved:
    'Resolved — this receipt was closed without its own content change, for example as a duplicate of another correction.',
};

/** What GET /v1/corrections/status/:code answers with (ADR 0015). */
export interface CorrectionStatusReport {
  code: string;
  status: CorrectionPublicStatus;
  waterId?: string;
  category?: string;
  updatedAt?: string;
  /** Moderator note, required with `rejected`, optional elsewhere. */
  note?: string;
}

export type FetchCorrectionStatus = (code: string) => Promise<CorrectionStatusReport>;

/** GET /v1/corrections/status/:code — additive route the API lane implements (ADR 0015). */
export function correctionStatusEndpoint(code: string): string {
  return `/v1/corrections/status/${encodeURIComponent(code)}`;
}

export const defaultFetchCorrectionStatus: FetchCorrectionStatus = async (code) => {
  let res: Response;
  try {
    res = await fetch(correctionStatusEndpoint(code), {
      headers: { accept: 'application/json' },
    });
  } catch {
    throw new CorrectionTransportUnavailable();
  }
  if (res.status === 405 || res.status === 501 || res.status === 503) {
    throw new CorrectionTransportUnavailable(`status endpoint unavailable (HTTP ${res.status})`);
  }
  if (!res.ok) {
    throw new CorrectionTransportError(res.status, `status endpoint returned HTTP ${res.status}`);
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new CorrectionTransportError(res.status, 'status endpoint returned invalid JSON');
  }
  const b = (body ?? {}) as Record<string, unknown>;
  if (
    typeof b.code !== 'string' ||
    typeof b.status !== 'string' ||
    !CORRECTION_PUBLIC_STATUSES.includes(b.status as CorrectionPublicStatus)
  ) {
    throw new CorrectionTransportError(res.status, 'status endpoint returned an unknown shape');
  }
  return {
    code: b.code,
    status: b.status as CorrectionPublicStatus,
    waterId: typeof b.waterId === 'string' ? b.waterId : undefined,
    category: typeof b.category === 'string' ? b.category : undefined,
    updatedAt: typeof b.updatedAt === 'string' ? b.updatedAt : undefined,
    note: typeof b.note === 'string' ? b.note : undefined,
  };
};

/**
 * Receipt format (ADR 0015): XXXXX-XXXXX-XXXXX, Crockford base32 — no I, L, O,
 * or U, so a code read aloud over the phone cannot be misheard into a lookalike.
 * The client checks the shape only; the server owns existence.
 */
export const RECEIPT_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/;

/** Normalize typed input: trim, uppercase, accept spaces for dashes. */
export function normalizeReceiptCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '-');
}

export interface CorrectionStatusProps {
  /** Transport seam; tests inject stubs, production uses the default. */
  fetchCorrectionStatus?: FetchCorrectionStatus;
}

type LookupState = 'idle' | 'checking' | 'found' | 'not-found' | 'unavailable' | 'transport-error';

/**
 * "Check a receipt": the reporter enters the code they saved and sees the
 * review state. Nothing about this flow identifies the reporter — the code is
 * the only credential (ADR 0015).
 */
export function CorrectionStatus({ fetchCorrectionStatus }: CorrectionStatusProps) {
  const idBase = useId();
  const [codeInput, setCodeInput] = useState('');
  const [state, setState] = useState<LookupState>('idle');
  const [detail, setDetail] = useState('');
  const [report, setReport] = useState<CorrectionStatusReport | null>(null);

  const onCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCodeInput(e.target.value);
    if (state !== 'idle') {
      setState('idle');
      setDetail('');
      setReport(null);
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setDetail('');
    const code = normalizeReceiptCode(codeInput);
    if (!RECEIPT_CODE_RE.test(code)) {
      setState('not-found');
      setDetail('Receipt codes look like XXXXX-XXXXX-XXXXX — five groups of letters and numbers.');
      return;
    }
    setState('checking');
    try {
      const result = await (fetchCorrectionStatus ?? defaultFetchCorrectionStatus)(code);
      setReport(result);
      setState('found');
    } catch (err) {
      setReport(null);
      if (err instanceof CorrectionTransportUnavailable) {
        setDetail(err.message);
        setState('unavailable');
      } else if (err instanceof CorrectionTransportError && err.status === 404) {
        // A 404 is "no such code" once the route exists — and indistinguishable
        // from "route not shipped yet" before that, so the copy is honest in
        // both worlds instead of claiming a lookup happened.
        setDetail(
          'No correction is registered under that code — check it for typos. If the review service has not launched in this build yet, codes cannot resolve at all.',
        );
        setState('not-found');
      } else {
        setDetail(
          err instanceof CorrectionTransportError
            ? `The status service answered HTTP ${err.status}.`
            : 'The status service could not be reached.',
        );
        setState('transport-error');
      }
    }
  }

  return (
    <section aria-label="Check correction status" data-testid="correction-status">
      <Card className="p-4">
        <form onSubmit={handleSubmit} noValidate>
          <label className="text-sm font-bold" htmlFor={`${idBase}-code`}>
            Receipt code
          </label>
          <p className="muted mb-1 mt-1 text-xs">
            The code you saved when you sent the suggestion — the only way to look it up, and the
            only thing that links you to it.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={`${idBase}-code`}
              value={codeInput}
              onChange={onCodeChange}
              placeholder="ABCDE-FGHJK-MNPQR"
              maxLength={24}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
            <Button type="submit" disabled={state === 'checking'} data-testid="status-check">
              {state === 'checking' ? 'Checking…' : 'Check status'}
            </Button>
          </div>
        </form>

        {/* The full vocabulary, always visible: what a code can ever say, and
        that none of it is a promise of a timeline. */}
        <div className="mt-3" data-testid="status-vocabulary">
          <p className="text-sm font-bold">What a status can say</p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {CORRECTION_PUBLIC_STATUSES.map((s) => (
              <li key={s}>{STATUS_EXPLANATIONS[s]}</li>
            ))}
          </ul>
          <p className="muted mt-1 text-xs">
            There are no promised dates in this list on purpose — review happens when a reviewer
            picks the suggestion up.
          </p>
        </div>

        {state === 'found' && report && (
          <div className="mt-3" role="status" data-testid="status-result">
            <p className="text-sm font-bold">
              Status for{' '}
              <span className="font-mono">{report.code}</span>:{' '}
              {STATUS_EXPLANATIONS[report.status]}
            </p>
            {report.waterId && (
              <p className="muted mt-1 text-xs">
                Water: <span className="font-mono">{report.waterId}</span>
                {report.category ? ` · category: ${report.category}` : ''}
              </p>
            )}
            {report.note && (
              <p className="mt-1 text-sm">
                Reviewer note: <span data-testid="status-note">{report.note}</span>
              </p>
            )}
          </div>
        )}

        {state === 'unavailable' && (
          <p className="mt-3 text-sm font-bold" role="status" data-testid="status-unavailable">
            Status lookup opens when the review service ships — codes issued now cannot be checked
            until then.
          </p>
        )}

        {state === 'not-found' && (
          <p className="mt-3 text-sm" role="status" data-testid="status-not-found">
            {detail}
          </p>
        )}

        {state === 'transport-error' && (
          <p className="mt-3 text-sm font-bold" role="alert" data-testid="status-error">
            The status service did not answer. {detail} Try again later.
          </p>
        )}
      </Card>
    </section>
  );
}
