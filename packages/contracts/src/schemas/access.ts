// OWNER: ACCESS lane (feat/site-improvement-20260930). Zod schema + types for
// VERIFIED ACCESS RECORDS (ADR 0019, docs/access-AUTHORING.md).
//
// Honesty rules baked into the schema itself:
//  - every record cites one OFFICIAL source (https-only URL + publisher +
//    retrieved date) — a source-less record cannot parse;
//  - every record carries a review date — the day a human last confirmed the
//    claim, distinct from when the source was retrieved;
//  - coordinates use a Tennessee plausibility box (lat 33–37, lng −91 to −81)
//    so a fat-fingered lat/lng can never ship as a "verified" location;
//  - `uncertainty` is REQUIRED when coordinates are absent (the record must
//    say how the entry is found without pretending to precision) and when
//    kind is `walk-in` (unmarked entries are exactly where assumptions hurt);
//  - fees / hours / closures are FIELDS on a record, not separate records —
//    one access point, one citation, one review date.
//
// A stocking marker is NEVER a verified access point (ADR 0019 §3): stocking
// coordinates describe where fish were put in the water, not where the public
// may lawfully stand. The schema cannot detect intent — the loader/docs gate
// that rule; this file keeps the shape honest.
import { z } from 'zod';

/** The plan's kind list. Fees/hours/closures are fields, not kinds. */
export const AccessKindSchema = z.enum([
  'parking',
  'boat-ramp',
  'public-entry',
  'accessible-facility',
  'walk-in',
]);
export type AccessKind = z.infer<typeof AccessKindSchema>;

/** Authoring dates (retrievedAt / reviewDate) are calendar dates, never datetimes. */
export const AccessDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine((value) => { const instant = Date.parse(`${value}T00:00:00Z`); return Number.isFinite(instant) && new Date(instant).toISOString().slice(0, 10) === value; }, 'must be a real calendar date');
export type AccessDate = z.infer<typeof AccessDateSchema>;

/**
 * Tennessee plausibility box (plan-binding): lat 33–37, lng −91 to −81.
 * Deliberately coarse — it catches swapped/degenerate/other-state coordinates,
 * not survey-grade error. Precision claims belong in `uncertainty`.
 */
export const AccessCoordinatesSchema = z.object({
  lat: z.number().min(33, 'lat below the TN plausibility box (33)').max(37, 'lat above the TN plausibility box (37)'),
  lng: z.number().min(-91, 'lng west of the TN plausibility box (−91)').max(-81, 'lng east of the TN plausibility box (−81)'),
});
export type AccessCoordinates = z.infer<typeof AccessCoordinatesSchema>;

/** The one official citation every record must carry (ADR 0019 §2). */
export const AccessOfficialSourceSchema = z.object({
  url: z
    .string()
    .url('must be a full URL')
    .startsWith('https://', 'official source URL must use https://'),
  publisher: z.string().min(1, 'publisher is required — "verify with …" needs a name'),
  retrievedAt: AccessDateSchema,
});
export type AccessOfficialSource = z.infer<typeof AccessOfficialSourceSchema>;

/** Fees/hours/closures are fields on the record (plan model), each optional. */
export const AccessFeeSchema = z.object({
  amount: z.string().min(1),
  notes: z.string().min(1).optional(),
});
export type AccessFee = z.infer<typeof AccessFeeSchema>;

export const AccessClosureSchema = z.object({
  /** Human-readable window as the managing agency states it ("Dec 1 – Mar 15"). */
  window: z.string().min(1),
  notes: z.string().min(1).optional(),
});
export type AccessClosure = z.infer<typeof AccessClosureSchema>;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const AccessRecordBase = z.object({
  /** Stable slug. Ids prefixed `example-` are test fixtures (see load.ts) and
   *  never ship in dist/pack/access.json. */
  id: z
    .string()
    .regex(SLUG_RE, 'id must be a lowercase slug (a-z, 0-9, single dashes)'),
  /** Must match a real catalog water id in streams/ — the loader cross-checks
   *  existence; the reserved fixture id is `example-water-id`. */
  waterId: z.string().regex(SLUG_RE, 'waterId must be a lowercase slug'),
  name: z.string().min(1).max(200).optional(),
  /** Source review never implies an on-site visit. Legacy rows are presented conservatively. */
  verificationMethod: z.enum(['official-source', 'field-visit']).optional(),
  /** Optional named reach so big waters can carry several distinct entries. */
  reach: z.string().min(1).optional(),
  kind: AccessKindSchema,
  coordinates: AccessCoordinatesSchema.optional(),
  fee: AccessFeeSchema.optional(),
  hours: z.string().min(1).optional(),
  closure: AccessClosureSchema.optional(),
  officialSource: AccessOfficialSourceSchema,
  /** YYYY-MM-DD a human last confirmed this record against reality. */
  reviewDate: AccessDateSchema,
  /** Free text. REQUIRED when coordinates are absent or kind is walk-in. */
  uncertainty: z.string().min(1).optional(),
  notes: z.string().min(1, 'notes are required — say what a visitor needs to know'),
});

export const AccessRecordSchema = AccessRecordBase.superRefine((rec, ctx) => {
  if (rec.coordinates === undefined && !rec.uncertainty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['uncertainty'],
      message:
        'uncertainty is REQUIRED when coordinates are absent — describe how the entry is found without pretending to precision',
    });
  }
  if (rec.kind === 'walk-in' && !rec.uncertainty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['uncertainty'],
      message: 'uncertainty is REQUIRED for kind "walk-in" — unmarked entries are where assumptions hurt most',
    });
  }
});
export type AccessRecord = z.infer<typeof AccessRecordSchema>;

// ---------------------------------------------------------------------------
// Pack shape (dist/pack/access.json). Records travel grouped by waterId so a
// water page reads one group; the shape is STABLE at zero records — an empty
// corpus still emits `{ records: [] }` (honest empty, never a missing file).
// ---------------------------------------------------------------------------
const AccessPackRecordSchema = z.object({ waterId: z.string().regex(SLUG_RE), access: z.array(AccessRecordSchema) });
export const AccessPackSchema = z.object({ records: z.array(AccessPackRecordSchema) }).superRefine((pack, ctx) => {
  const seen = new Set<string>(); const waters = new Set<string>();
  for (const [index, group] of pack.records.entries()) {
    if (waters.has(group.waterId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['records', index], message: 'duplicate water group' });
    waters.add(group.waterId);
    for (const [recordIndex, record] of group.access.entries()) {
      if (record.waterId !== group.waterId || seen.has(record.id) || record.id.startsWith('example-')) ctx.addIssue({
        code: z.ZodIssueCode.custom, path: ['records', index, 'access', recordIndex], message: 'record must match its water, have a unique ID and not be an example' });
      seen.add(record.id);
    }
  }
});
export type AccessPackRecord = z.infer<typeof AccessPackRecordSchema>;
export type AccessPack = z.infer<typeof AccessPackSchema>;
