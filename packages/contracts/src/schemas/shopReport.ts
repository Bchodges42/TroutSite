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
  publishedAt: IsoDateTimeSchema,
});
export type ShopReport = z.infer<typeof ShopReportSchema>;
