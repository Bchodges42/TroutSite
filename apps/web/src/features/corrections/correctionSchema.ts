/**
 * Pure validation for user-suggested water corrections (ADR 0015).
 *
 * This module is deliberately dependency-free: no React, no fetch, no lib/*.
 * The client duplicates the future server-side zod checks (ADR 0015 §Decision)
 * so a visitor sees every error instantly, before any network round-trip — and
 * so the API lane can port these exact rules 1:1 into `apps/api`.
 *
 * The form collects NOTHING beyond the fields below: no location, no device
 * data, no logbook data. `reporterEmail` is accepted by the schema for a later
 * UI, but the v1 form deliberately never offers it.
 */

/** The moderation categories (ADR 0015). Plain-language labels live in the form. */
export const CORRECTION_CATEGORIES = [
  'water-identity',
  'species-or-season',
  'stocking-association',
  'gauge-or-source',
  'access',
  'regulations',
  'other',
] as const;

export type CorrectionCategory = (typeof CORRECTION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CorrectionCategory, string> = {
  'water-identity': 'Water identity — wrong name, type, or reach',
  'species-or-season': 'Species or season — what swims here and when',
  'stocking-association': 'Stocking association — schedule or program link',
  'gauge-or-source': 'Gauge or source — gauge link or official source',
  access: 'Access — ramps, access points, fees, closures',
  regulations: 'Regulations — special rules or limits',
  other: 'Something else',
};

/** Bounds mirrored by the server (ADR 0015). */
export const CORRECTION_LIMITS = {
  waterIdMax: 128,
  waterNameMax: 200,
  fieldMax: 200,
  currentValueMax: 2000,
  proposedMin: 10,
  proposedMax: 2000,
  whatAppearsWrongMax: 2000,
  sourceUrlMax: 2048,
  reporterEmailMax: 320,
} as const;

/** What a visitor submits. `submittedAt` is epoch millis (client clock). */
export interface CorrectionSubmission {
  /** Stable catalog id (e.g. from /v1/streams), never a display name. */
  waterId: string;
  /** Catalog display name (prefilled from the catalog); informational only. */
  waterName?: string;
  category: CorrectionCategory;
  /** Which displayed claim is wrong, in the reporter's words. */
  field?: string;
  /** What the page currently shows, if the reporter pasted it. */
  currentValue?: string;
  proposedCorrection: string;
  /** Free-text "why it looks wrong" context. */
  whatAppearsWrong?: string;
  /** Optional https-only evidence link; never fetched by the server. */
  sourceUrl?: string;
  /** Optional publication date of the cited source, YYYY-MM-DD. */
  sourcePubDate?: string;
  /**
   * Optional contact — the v1 UI never offers this field; the schema accepts
   * it so a later UI does not need a contract change.
   */
  reporterEmail?: string;
  /** Bot trap: must arrive empty or the submission is silently flagged (ADR 0015). */
  honeypot?: string;
  submittedAt: number;
}

/** Per-field error copy, keyed by the field that failed. */
export type CorrectionFieldErrors = Partial<Record<keyof CorrectionSubmission, string>>;

export type CorrectionValidationResult =
  | { ok: true; value: CorrectionSubmission }
  | { ok: false; errors: CorrectionFieldErrors };

const PUB_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Trim-or-drop a string field, enforcing an inclusive max length. */
function bounded(v: unknown, max: number): string | undefined {
  const s = str(v);
  return s ? (s.length <= max ? s : undefined) : undefined;
}

/** Days in month, leap years included — calendar-real dates only. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Valid YYYY-MM-DD, and never in the future relative to `nowMs`. */
function isValidPubDate(s: string, nowMs: number): boolean {
  if (!PUB_DATE_RE.test(s)) return false;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  const day = Number(s.slice(8, 10));
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  // Publication dates are past-or-present claims; a future date is a typo.
  return Date.parse(`${s}T00:00:00Z`) <= nowMs + 60_000;
}

/**
 * https-only URL check. Opaque on purpose: the server must never fetch these
 * (SSRF, ADR 0015), so the client only proves it is a well-formed https link a
 * human could open — no host allowlist, no resolution.
 */
export function isValidSourceUrl(v: string): boolean {
  if (v.length > CORRECTION_LIMITS.sourceUrlMax) return false;
  let parsed: URL;
  try {
    parsed = new URL(v);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (!parsed.hostname) return false;
  // Embedded credentials are never legitimate in a public citation.
  if (parsed.username || parsed.password) return false;
  return true;
}

/**
 * Validate and normalize a raw form payload. Pure: same input + same `nowMs`
 * always yields the same result. On failure, `errors` holds one message per
 * offending field; every fixable field is reported, not just the first.
 */
export function validateCorrectionSubmission(
  input: unknown,
  nowMs: number,
): CorrectionValidationResult {
  const raw = (input ?? {}) as Record<string, unknown>;
  const errors: CorrectionFieldErrors = {};

  // waterId — required, the stable catalog id (never a display name).
  const waterId = str(raw.waterId);
  if (!waterId) errors.waterId = 'Choose the water this correction is about.';
  else if (waterId.length > CORRECTION_LIMITS.waterIdMax)
    errors.waterId = `Water id is too long (max ${CORRECTION_LIMITS.waterIdMax} characters).`;
  else if (/\s/.test(waterId))
    errors.waterId = 'Water ids never contain spaces — use the catalog id from the water page.';

  // waterName — optional, informational (the id is authoritative).
  const waterName = str(raw.waterName);
  if (waterName.length > CORRECTION_LIMITS.waterNameMax)
    errors.waterName = `Water name is too long (max ${CORRECTION_LIMITS.waterNameMax} characters).`;

  // category — required, one of the fixed moderation categories.
  const category = str(raw.category) as CorrectionCategory;
  if (!CORRECTION_CATEGORIES.includes(category))
    errors.category = 'Choose what kind of correction this is.';

  // field / currentValue / whatAppearsWrong — optional context, bounded.
  const field = str(raw.field);
  if (field.length > CORRECTION_LIMITS.fieldMax)
    errors.field = `Keep this under ${CORRECTION_LIMITS.fieldMax} characters.`;
  const currentValue = str(raw.currentValue);
  if (currentValue.length > CORRECTION_LIMITS.currentValueMax)
    errors.currentValue = `Keep this under ${CORRECTION_LIMITS.currentValueMax} characters.`;
  const whatAppearsWrong = str(raw.whatAppearsWrong);
  if (whatAppearsWrong.length > CORRECTION_LIMITS.whatAppearsWrongMax)
    errors.whatAppearsWrong = `Keep this under ${CORRECTION_LIMITS.whatAppearsWrongMax} characters.`;

  // proposedCorrection — the one required essay: 10–2000 chars.
  const proposedCorrection = str(raw.proposedCorrection);
  if (!proposedCorrection)
    errors.proposedCorrection = 'Describe the correction — what should this say instead?';
  else if (proposedCorrection.length < CORRECTION_LIMITS.proposedMin)
    errors.proposedCorrection = `Add a little more detail (at least ${CORRECTION_LIMITS.proposedMin} characters).`;
  else if (proposedCorrection.length > CORRECTION_LIMITS.proposedMax)
    errors.proposedCorrection = `Keep it under ${CORRECTION_LIMITS.proposedMax} characters.`;

  // sourceUrl — optional, but when present it must be a sane https link.
  const sourceUrl = str(raw.sourceUrl);
  if (sourceUrl && !isValidSourceUrl(sourceUrl))
    errors.sourceUrl = 'Enter a full https:// link (that protocol is required) or leave this empty.';

  // sourcePubDate — optional YYYY-MM-DD, real calendar date, not in the future.
  const sourcePubDate = str(raw.sourcePubDate);
  if (sourcePubDate && !isValidPubDate(sourcePubDate, nowMs))
    errors.sourcePubDate = 'Use a real calendar date in YYYY-MM-DD form, not in the future.';

  // reporterEmail — optional (v1 UI never offers it); validated when present.
  const reporterEmail = str(raw.reporterEmail);
  if (reporterEmail) {
    if (reporterEmail.length > CORRECTION_LIMITS.reporterEmailMax)
      errors.reporterEmail = 'That email address is too long.';
    else if (!EMAIL_RE.test(reporterEmail)) errors.reporterEmail = 'Enter a valid email address.';
  }

  // Honeypot — humans never fill this. Any content flags the submission.
  if (isNonEmptyString(raw.honeypot)) errors.honeypot = 'This field must stay empty.';

  // submittedAt — client clock, epoch millis, at most a minute in the future.
  const submittedAt = raw.submittedAt;
  if (typeof submittedAt !== 'number' || !Number.isFinite(submittedAt))
    errors.submittedAt = 'Submission time missing.';
  else if (submittedAt > nowMs + 60_000) errors.submittedAt = 'Submission time is in the future.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  // Normalized value: trimmed, empty optional strings dropped entirely so the
  // wire payload only ever carries fields the reporter actually filled.
  const value: CorrectionSubmission = {
    waterId,
    category,
    proposedCorrection,
    submittedAt: submittedAt as number,
  };
  const patch: Record<string, unknown> = {};
  const optional: [keyof CorrectionSubmission, string | undefined][] = [
    ['waterName', bounded(raw.waterName, CORRECTION_LIMITS.waterNameMax)],
    ['field', bounded(raw.field, CORRECTION_LIMITS.fieldMax)],
    ['currentValue', bounded(raw.currentValue, CORRECTION_LIMITS.currentValueMax)],
    ['whatAppearsWrong', bounded(raw.whatAppearsWrong, CORRECTION_LIMITS.whatAppearsWrongMax)],
    ['sourceUrl', bounded(raw.sourceUrl, CORRECTION_LIMITS.sourceUrlMax)],
    ['sourcePubDate', sourcePubDate || undefined],
    ['reporterEmail', bounded(raw.reporterEmail, CORRECTION_LIMITS.reporterEmailMax)],
    // honeypot never re-emitted; emptiness is a precondition
  ];
  for (const [key, val] of optional) {
    if (val !== undefined) patch[key] = val;
  }
  return { ok: true, value: Object.assign(value, patch) };
}

/**
 * The composed text a visitor can keep when the review service is not
 * shipped yet (honest unavailable state). Deterministic, copyable, and
 * complete: every field needed to resend the correction by hand.
 */
export function composeCorrectionText(submission: CorrectionSubmission): string {
  const lines: string[] = [
    `Water: ${submission.waterName ?? submission.waterId} (${submission.waterId})`,
    `Category: ${CATEGORY_LABELS[submission.category]}`,
  ];
  if (submission.field) lines.push(`Claim in question: ${submission.field}`);
  if (submission.currentValue) lines.push('Currently shown: ' + submission.currentValue);
  lines.push(`Proposed correction: ${submission.proposedCorrection}`);
  if (submission.whatAppearsWrong) lines.push('What appears wrong: ' + submission.whatAppearsWrong);
  if (submission.sourceUrl) lines.push(`Source: ${submission.sourceUrl}`);
  if (submission.sourcePubDate) lines.push(`Source published: ${submission.sourcePubDate}`);
  if (submission.reporterEmail) lines.push(`Reply contact: ${submission.reporterEmail}`);
  lines.push(`Composed: ${new Date(submission.submittedAt).toISOString()}`);
  return lines.join('\n');
}
