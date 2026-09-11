import { z } from 'zod';

/** 2-letter US state code, e.g. TX / OK / AR. Kept open (not an enum) so adding states is additive. */
export const StateIdSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, 'stateId must be a 2-letter US state code (e.g. TX)');

/** Calendar date, YYYY-MM-DD. */
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected date as YYYY-MM-DD');

/** ISO-8601 timestamp; seconds and timezone offset are optional, e.g. 2026-04-01T14:30Z. */
export const IsoDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/,
    'expected an ISO-8601 date-time string',
  );

/**
 * 'lake'/'pond' cover the TWRA winter put-and-take program waters (small
 * impoundments and park ponds, mostly West TN) — additive to the launch set,
 * which was rivers/creeks/tailraces only.
 */
export const WaterbodyTypeSchema = z.enum(['river', 'creek', 'tailrace', 'spring', 'lake', 'pond']);
export type WaterbodyType = z.infer<typeof WaterbodyTypeSchema>;

export const RegionIdSchema = z.string().min(1);

export const OfficialSourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});
export type OfficialSource = z.infer<typeof OfficialSourceSchema>;
