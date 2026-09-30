import { z } from 'zod';

/**
 * Server-side validation for POST /v1/corrections — a 1:1 port of the client
 * checks in apps/web/src/features/corrections/correctionSchema.ts (ADR 0015 §1:
 * the client duplicates these so errors show instantly; the server re-validates
 * everything).
 *
 * Two deliberate divergences from the client schema, both privacy floors:
 * - `reporterEmail` is NEVER validated or persisted here. zod strips unknown
 *   keys, so even if a future client sends it, v1 drops it on the floor.
 * - `honeypot` is inspected on the RAW body before this schema runs (any
 *   content ⇒ 202 + silent discard), so it is not part of the parsed value.
 */

/** The moderation categories (ADR 0015) — identical to the client enum. */
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

/** Bounds mirrored from the client's CORRECTION_LIMITS. */
export const CORRECTION_LIMITS = {
  waterIdMax: 128,
  waterNameMax: 200,
  fieldMax: 200,
  currentValueMax: 2000,
  proposedMin: 10,
  proposedMax: 2000,
  whatAppearsWrongMax: 2000,
  sourceUrlMax: 2048,
  /** Client-side only; the server never accepts the field. */
  reporterEmailMax: 320,
} as const;

/** How long a submitted correction may claim to be from the client clock. */
export const SUBMITTED_AT_FUTURE_SKEW_MS = 60_000;

const PUB_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Valid YYYY-MM-DD, real calendar date, never in the future (+60s skew). */
export function isValidPubDate(s: string, nowMs: number): boolean {
  if (!PUB_DATE_RE.test(s)) return false;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  const day = Number(s.slice(8, 10));
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return Date.parse(`${s}T00:00:00Z`) <= nowMs + SUBMITTED_AT_FUTURE_SKEW_MS;
}

/**
 * https-only URL check — identical to the client's isValidSourceUrl. Opaque on
 * purpose: the server must never fetch these (SSRF, ADR 0015 §6), so this only
 * proves it is a well-formed https link with no embedded credentials.
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
  if (parsed.username || parsed.password) return false;
  return true;
}

/**
 * The wire schema. Field-by-field mirrors of the client messages, so a 422 can
 * carry the same copy the form would have shown. Unknown keys (including
 * reporterEmail and honeypot) are silently stripped.
 */
export const CorrectionSubmissionSchema = z.object({
  waterId: z
    .string({ required_error: 'Choose the water this correction is about.' })
    .trim()
    .min(1, 'Choose the water this correction is about.')
    .max(CORRECTION_LIMITS.waterIdMax, `Water id is too long (max ${CORRECTION_LIMITS.waterIdMax} characters).`)
    .refine((v) => !/\s/.test(v), {
      message: 'Water ids never contain spaces — use the catalog id from the water page.',
    }),
  waterName: z
    .string()
    .trim()
    .max(CORRECTION_LIMITS.waterNameMax, `Water name is too long (max ${CORRECTION_LIMITS.waterNameMax} characters).`)
    .optional(),
  category: z.enum(CORRECTION_CATEGORIES, {
    errorMap: () => ({ message: 'Choose what kind of correction this is.' }),
  }),
  field: z
    .string()
    .trim()
    .max(CORRECTION_LIMITS.fieldMax, `Keep this under ${CORRECTION_LIMITS.fieldMax} characters.`)
    .optional(),
  currentValue: z
    .string()
    .trim()
    .max(CORRECTION_LIMITS.currentValueMax, `Keep this under ${CORRECTION_LIMITS.currentValueMax} characters.`)
    .optional(),
  proposedCorrection: z
    .string({ required_error: 'Describe the correction — what should this say instead?' })
    .trim()
    .min(
      CORRECTION_LIMITS.proposedMin,
      `Add a little more detail (at least ${CORRECTION_LIMITS.proposedMin} characters).`,
    )
    .max(CORRECTION_LIMITS.proposedMax, `Keep it under ${CORRECTION_LIMITS.proposedMax} characters.`),
  whatAppearsWrong: z
    .string()
    .trim()
    .max(
      CORRECTION_LIMITS.whatAppearsWrongMax,
      `Keep this under ${CORRECTION_LIMITS.whatAppearsWrongMax} characters.`,
    )
    .optional(),
  sourceUrl: z
    .string()
    .trim()
    .max(CORRECTION_LIMITS.sourceUrlMax, 'Source link is too long.')
    .refine((v) => isValidSourceUrl(v), {
      message: 'Enter a full https:// link (that protocol is required) or leave this empty.',
    })
    .optional(),
  sourcePubDate: z
    .string()
    .trim()
    .refine((v) => isValidPubDate(v, Date.now()), {
      message: 'Use a real calendar date in YYYY-MM-DD form, not in the future.',
    })
    .optional(),
  submittedAt: z
    .number({ required_error: 'Submission time missing.', invalid_type_error: 'Submission time missing.' })
    .finite('Submission time missing.')
    .refine((v) => v <= Date.now() + SUBMITTED_AT_FUTURE_SKEW_MS, {
      message: 'Submission time is in the future.',
    }),
});

export type CorrectionSubmission = z.infer<typeof CorrectionSubmissionSchema>;

/** Per-field error map for the 422 body: { errors: { field: message } }. */
export type CorrectionFieldErrors = Partial<Record<keyof CorrectionSubmission, string>>;

export function fieldErrorsFromZod(error: z.ZodError): CorrectionFieldErrors {
  const errors: CorrectionFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in errors)) {
      errors[key as keyof CorrectionSubmission] = issue.message;
    }
  }
  return errors;
}

/**
 * High-impact category markers (CORR spec): which risk flags a category earns.
 * High-impact = a category whose approval changes safety-relevant or
 * identity-relevant public content. `stocking-association` and `other` carry
 * none. Stored comma-joined in corrections.risk_flags; no flag name is a
 * substring of another, so LIKE filtering is exact.
 */
export const CATEGORY_RISK_FLAGS: Partial<Record<CorrectionCategory, string>> = {
  'water-identity': 'identity',
  'species-or-season': 'species',
  'gauge-or-source': 'gauge',
  access: 'access',
  regulations: 'regulations',
};

export function riskFlagsFor(category: CorrectionCategory): string {
  return CATEGORY_RISK_FLAGS[category] ?? '';
}

/**
 * Duplicate-cluster fingerprint: waterId + category + lowercased,
 * alphanumeric-collapsed proposedCorrection. Advisory metadata for moderators
 * (ADR 0015 §7) — clustering never auto-closes anything.
 */
export function dedupKeyOf(waterId: string, category: string, proposedCorrection: string): string {
  const collapsed = proposedCorrection.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${waterId}|${category}|${collapsed}`;
}
