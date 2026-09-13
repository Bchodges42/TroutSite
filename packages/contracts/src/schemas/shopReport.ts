import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema } from './shared.js';

export const HotPatternSchema = z.object({
  patternId: z.string().min(1),
  hookSize: z.number().int().positive().optional(),
});
export type HotPattern = z.infer<typeof HotPatternSchema>;

export const ShopReportSchema = z.object({
  id: z.string().min(1),
  shopId: z.string().min(1),
  shopName: z.string().min(1),
  streamId: z.string().min(1).optional(),
  date: IsoDateSchema,
  body: z.string().min(1),
  hotPatterns: z.array(HotPatternSchema),
  attributionUrl: z.string().url(),
  /**
   * Additive in contracts-v1.0.1 (ADR 0002): optional https photo URL supplied by the
   * shop through the portal composer. Absent = no photo; the public feed renders it
   * only alongside the attribution block.
   */
  photoUrl: z
    .string()
    .refine(
      (v) => v.startsWith('https://') || v.startsWith('/'),
      { message: 'photoUrl must be an https URL (shop-hosted) or a same-origin path (fixtures/tests)' },
    )
    .optional(),
  publishedAt: IsoDateTimeSchema,
});
export type ShopReport = z.infer<typeof ShopReportSchema>;
