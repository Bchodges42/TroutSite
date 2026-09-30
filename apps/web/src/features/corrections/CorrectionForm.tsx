import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button, Card } from '@trout/ui';
import {
  CATEGORY_LABELS,
  CORRECTION_CATEGORIES,
  CORRECTION_LIMITS,
  composeCorrectionText,
  validateCorrectionSubmission,
} from './correctionSchema';
import type {
  CorrectionCategory,
  CorrectionFieldErrors,
  CorrectionSubmission,
} from './correctionSchema';

/**
 * Transport seam (ADR 0015): the form only knows this function type, never the
 * wire. Tests and a later reviewer UI can inject their own; the default POSTs
 * the validated submission to /v1/corrections and expects { receiptCode }.
 * Until the API lane ships that route it fails as CorrectionTransportUnavailable,
 * and the form tells the visitor the truth instead of claiming a send.
 */
export interface CorrectionReceipt {
  receiptCode: string;
}

export type PostCorrection = (submission: CorrectionSubmission) => Promise<CorrectionReceipt>;

/** POST /v1/corrections — additive route the API lane implements (ADR 0015). */
export const CORRECTIONS_ENDPOINT = '/v1/corrections';

/** Typed marker: the review service route does not exist (or cannot be reached). */
export class CorrectionTransportUnavailable extends Error {
  constructor(message = 'The corrections review service is not available yet.') {
    super(message);
    this.name = 'CorrectionTransportUnavailable';
  }
}

/** The route answered, but not with success (validation, rate limit, outage). */
export class CorrectionTransportError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'CorrectionTransportError';
    this.status = status;
  }
}

/** Statuses that mean "this build has no working corrections route yet". */
function isUnavailableStatus(status: number): boolean {
  return status === 404 || status === 405 || status === 501 || status === 503;
}

export const defaultPostCorrection: PostCorrection = async (submission) => {
  let res: Response;
  try {
    res = await fetch(CORRECTIONS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch {
    throw new CorrectionTransportUnavailable();
  }
  if (isUnavailableStatus(res.status)) {
    throw new CorrectionTransportUnavailable(`corrections endpoint unavailable (HTTP ${res.status})`);
  }
  if (!res.ok) {
    throw new CorrectionTransportError(res.status, `corrections endpoint returned HTTP ${res.status}`);
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new CorrectionTransportError(res.status, 'corrections endpoint returned invalid JSON');
  }
  const receiptCode =
    typeof body === 'object' && body !== null && 'receiptCode' in body
      ? (body as { receiptCode?: unknown }).receiptCode
      : undefined;
  if (typeof receiptCode !== 'string' || receiptCode.length === 0) {
    throw new CorrectionTransportError(res.status, 'corrections endpoint returned no receipt code');
  }
  return { receiptCode };
};

/** The one honest sentence every surface of this feature carries. */
export const CORRECTION_HONESTY_COPY =
  'This is a suggestion for review — it does not change the site immediately.';
/** Shown only when the transport is unavailable (route not shipped yet). */
export const CORRECTION_UNAVAILABLE_COPY =
  'Corrections submission opens when the review service ships — your correction was validated locally and is ready to resend.';

export interface CorrectionFormProps {
  /** Stable catalog id — prefilled from ?water= on the corrections page. */
  waterId: string;
  /** Catalog display name, resolved by the page from the same catalog. */
  waterName?: string;
  /** Which displayed claim is wrong — prefilled from ?field=. */
  initialField?: string;
  /** Transport seam; tests inject stubs, production uses the default. */
  postCorrection?: PostCorrection;
  onSubmitted?: (receipt: CorrectionReceipt, submission: CorrectionSubmission) => void;
}

type SubmitState = 'idle' | 'submitting' | 'receipt' | 'unavailable' | 'transport-error';

/**
 * The correction composer. Client-side validation mirrors the server contract
 * (correctionSchema.ts / ADR 0015) so errors show instantly; nothing is
 * persisted locally (privacy-simpler, ADR 0015) — closing the tab loses the
 * draft, on purpose.
 */
export function CorrectionForm({
  waterId,
  waterName,
  initialField = '',
  postCorrection,
  onSubmitted,
}: CorrectionFormProps) {
  const idBase = useId();
  const [category, setCategory] = useState<CorrectionCategory | ''>('');
  const [field, setField] = useState(initialField);
  const [currentValue, setCurrentValue] = useState('');
  const [proposedCorrection, setProposedCorrection] = useState('');
  const [whatAppearsWrong, setWhatAppearsWrong] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourcePubDate, setSourcePubDate] = useState('');
  // Bot trap — invisible to humans and never announced; content here fails
  // validation and the API flags the submission (ADR 0015).
  const [honeypot, setHoneypot] = useState('');

  const [errors, setErrors] = useState<CorrectionFieldErrors | null>(null);
  const [state, setState] = useState<SubmitState>('idle');
  const [transportDetail, setTransportDetail] = useState('');
  const [receipt, setReceipt] = useState('');
  const [composedText, setComposedText] = useState('');
  const [copied, setCopied] = useState(false);

  const bind =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setter(e.target.value);

  async function copyComposed() {
    try {
      await navigator.clipboard?.writeText(composedText);
      setCopied(true);
    } catch {
      // Clipboard blocked (or absent): the textarea stays selectable by hand.
      setCopied(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCopied(false);
    const result = validateCorrectionSubmission(
      {
        waterId,
        waterName,
        category,
        field,
        currentValue,
        proposedCorrection,
        whatAppearsWrong,
        sourceUrl,
        sourcePubDate,
        reporterEmail: '', // the v1 UI never offers a contact field
        honeypot,
        submittedAt: Date.now(),
      },
      Date.now(),
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors(null);
    setTransportDetail('');
    setState('submitting');
    try {
      const sent = await (postCorrection ?? defaultPostCorrection)(result.value);
      setReceipt(sent.receiptCode);
      setComposedText(composeCorrectionText(result.value));
      setState('receipt');
      onSubmitted?.(sent, result.value);
    } catch (err) {
      setComposedText(composeCorrectionText(result.value));
      if (err instanceof CorrectionTransportUnavailable) {
        setTransportDetail(err.message);
        setState('unavailable');
      } else {
        setTransportDetail(
          err instanceof CorrectionTransportError
            ? `The review service answered HTTP ${err.status}.`
            : 'The review service could not be reached.',
        );
        setState('transport-error');
      }
    }
  }

  const err = (key: keyof CorrectionSubmission) => errors?.[key];
  const describedBy = (key: keyof CorrectionSubmission, extra?: string) =>
    [err(key) ? `${idBase}-${key}-error` : null, extra].filter(Boolean).join(' ') || undefined;

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="correction-form">
      <Card className="p-4">
        <p className="text-sm font-bold" role="note">
          {CORRECTION_HONESTY_COPY}
        </p>
        <p className="muted mt-1 text-xs">
          This form collects only what you type here — no location, no device data, nothing stored
          on this device. A source link is optional but encouraged: corrections backed by an
          official source are the easiest to approve.
        </p>

        <p className="mt-3 text-sm">
          <span className="font-bold">Water: </span>
          {waterName ? `${waterName} ` : ''}
          <span className="muted font-mono text-xs">({waterId})</span>
        </p>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm font-bold" htmlFor={`${idBase}-category`}>
            What kind of correction is this?
          </label>
          <select
            id={`${idBase}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value as CorrectionCategory | '')}
            aria-invalid={err('category') ? true : undefined}
            aria-describedby={describedBy('category')}
          >
            <option value="">Choose one…</option>
            {CORRECTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          {err('category') && (
            <p className="text-sm" id={`${idBase}-category-error`} role="alert">
              {err('category')}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm font-bold" htmlFor={`${idBase}-field`}>
            Which claim on the page is wrong? (optional)
          </label>
          <input
            id={`${idBase}-field`}
            type="text"
            value={field}
            onChange={bind(setField)}
            maxLength={CORRECTION_LIMITS.fieldMax}
            placeholder="e.g. the listed season dates, the stocking count for March"
            aria-describedby={describedBy('field', `${idBase}-field-count`)}
          />
          <span className="muted text-xs" id={`${idBase}-field-count`}>
            {field.length}/{CORRECTION_LIMITS.fieldMax}
          </span>
          {err('field') && (
            <p className="text-sm" id={`${idBase}-field-error`} role="alert">
              {err('field')}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm font-bold" htmlFor={`${idBase}-current`}>
            What does the page currently show? (optional)
          </label>
          <textarea
            id={`${idBase}-current`}
            value={currentValue}
            onChange={bind(setCurrentValue)}
            maxLength={CORRECTION_LIMITS.currentValueMax}
            rows={2}
            aria-describedby={describedBy('currentValue', `${idBase}-current-count`)}
          />
          <span className="muted text-xs" id={`${idBase}-current-count`}>
            {currentValue.length}/{CORRECTION_LIMITS.currentValueMax}
          </span>
          {err('currentValue') && (
            <p className="text-sm" id={`${idBase}-currentValue-error`} role="alert">
              {err('currentValue')}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm font-bold" htmlFor={`${idBase}-proposed`}>
            What should it say instead?
          </label>
          <textarea
            id={`${idBase}-proposed`}
            value={proposedCorrection}
            onChange={bind(setProposedCorrection)}
            maxLength={CORRECTION_LIMITS.proposedMax}
            rows={4}
            required
            aria-required="true"
            aria-invalid={err('proposedCorrection') ? true : undefined}
            aria-describedby={describedBy('proposedCorrection', `${idBase}-proposed-count`)}
          />
          <span className="muted text-xs" id={`${idBase}-proposed-count`}>
            {proposedCorrection.length}/{CORRECTION_LIMITS.proposedMax} (at least{' '}
            {CORRECTION_LIMITS.proposedMin})
          </span>
          {err('proposedCorrection') && (
            <p className="text-sm" id={`${idBase}-proposedCorrection-error`} role="alert">
              {err('proposedCorrection')}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm font-bold" htmlFor={`${idBase}-wrong`}>
            Why does it look wrong? (optional)
          </label>
          <textarea
            id={`${idBase}-wrong`}
            value={whatAppearsWrong}
            onChange={bind(setWhatAppearsWrong)}
            maxLength={CORRECTION_LIMITS.whatAppearsWrongMax}
            rows={3}
            aria-describedby={describedBy('whatAppearsWrong', `${idBase}-wrong-count`)}
          />
          <span className="muted text-xs" id={`${idBase}-wrong-count`}>
            {whatAppearsWrong.length}/{CORRECTION_LIMITS.whatAppearsWrongMax}
          </span>
          {err('whatAppearsWrong') && (
            <p className="text-sm" id={`${idBase}-whatAppearsWrong-error`} role="alert">
              {err('whatAppearsWrong')}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm font-bold" htmlFor={`${idBase}-source-url`}>
            Source link (optional, https)
          </label>
          <input
            id={`${idBase}-source-url`}
            type="url"
            inputMode="url"
            value={sourceUrl}
            onChange={bind(setSourceUrl)}
            maxLength={CORRECTION_LIMITS.sourceUrlMax}
            placeholder="https://www.tn.gov/…"
            aria-invalid={err('sourceUrl') ? true : undefined}
            aria-describedby={describedBy('sourceUrl')}
          />
          {err('sourceUrl') && (
            <p className="text-sm" id={`${idBase}-sourceUrl-error`} role="alert">
              {err('sourceUrl')}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm font-bold" htmlFor={`${idBase}-source-date`}>
            When was that source published? (optional, YYYY-MM-DD)
          </label>
          <input
            id={`${idBase}-source-date`}
            type="text"
            inputMode="numeric"
            value={sourcePubDate}
            onChange={bind(setSourcePubDate)}
            maxLength={10}
            placeholder="2026-03-01"
            aria-invalid={err('sourcePubDate') ? true : undefined}
            aria-describedby={describedBy('sourcePubDate')}
          />
          {err('sourcePubDate') && (
            <p className="text-sm" id={`${idBase}-sourcePubDate-error`} role="alert">
              {err('sourcePubDate')}
            </p>
          )}
        </div>

        {/* Honeypot: hidden from people, irresistible to form-spam scripts.
        Filling it fails local validation and is flagged server-side. */}
        <div hidden aria-hidden="true">
          <label htmlFor={`${idBase}-honeypot`}>Leave this field empty</label>
          <input
            id={`${idBase}-honeypot`}
            name="leave_empty"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={bind(setHoneypot)}
          />
        </div>
        {err('honeypot') && (
          <p className="text-sm" role="alert">
            {err('honeypot')}
          </p>
        )}

        <div className="mt-4">
          <Button
            type="submit"
            disabled={state === 'submitting'}
            data-testid="correction-submit"
          >
            {state === 'submitting' ? 'Sending…' : 'Send for review'}
          </Button>
        </div>
      </Card>

      {state === 'receipt' && (
        <Card className="mt-3 p-4" data-testid="correction-receipt">
          <p className="text-sm font-bold" role="status">
            Thank you — your suggestion is in the review queue. It has not changed the site; a
            reviewer will check it against sources.
          </p>
          <p className="mt-2 text-sm">
            Your receipt code:{' '}
            <span className="font-mono font-extrabold" data-testid="receipt-code">
              {receipt}
            </span>
          </p>
          <p className="muted mt-1 text-xs">
            Save this code — it is the only way to check this suggestion's status. It is not shown
            again and no account or email links it to you.
          </p>
        </Card>
      )}

      {state === 'unavailable' && (
        <Card className="mt-3 p-4" data-testid="correction-unavailable">
          <p className="text-sm font-bold" role="status">
            {CORRECTION_UNAVAILABLE_COPY}
          </p>
          {transportDetail && <p className="muted mt-1 text-xs">{transportDetail}</p>}
          <p className="mt-2 text-sm font-bold">Your correction, ready to copy or resend:</p>
          <textarea
            id={`${idBase}-composed`}
            data-testid="composed-correction"
            readOnly
            value={composedText}
            rows={8}
            aria-label="Your validated correction text, ready to copy"
          />
          <p className="muted mt-1 text-xs">
            The fields above still hold your text too. Nothing was saved on this device and nothing
            was sent — copy this now if you want to keep it.
          </p>
          <div className="mt-2">
            <Button variant="secondary" onClick={() => void copyComposed()}>
              {copied ? 'Copied.' : 'Copy correction text'}
            </Button>
          </div>
        </Card>
      )}

      {state === 'transport-error' && (
        <Card className="mt-3 p-4" data-testid="correction-transport-error">
          <p className="text-sm font-bold" role="alert">
            The review service did not accept this submission. {transportDetail} Your text is still
            in the fields — nothing was lost, but nothing was sent either. Try again later.
          </p>
        </Card>
      )}
    </form>
  );
}
