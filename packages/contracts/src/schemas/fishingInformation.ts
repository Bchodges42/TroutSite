import { z } from 'zod';
import { IsoDateSchema } from './shared.js';

/**
 * Structured fishing-information content (data-sources lane, additive).
 *
 * Statewide information and water-specific rules are deliberately separate
 * levels: a section item WITHOUT `appliesTo` is STATEWIDE; one WITH `appliesTo`
 * lists the exact catalog waterIds it covers. Every item cites its authority
 * and the official URL it was verified against. This content is informational,
 * never a legal guarantee — the disclaimer field travels with the document.
 */

export const FishingInfoItemSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  /** Authority that publishes the rule (e.g. 'TWRA', 'NPS', 'TVA', 'USACE'). */
  authority: z.string().min(1),
  /** Official page the statement was verified against (not an aggregator). */
  sourceUrl: z.string().url(),
  /** Stable source id from the data-sources registry where one exists. */
  sourceId: z.string().min(1).optional(),
  effectiveFrom: IsoDateSchema.optional(),
  effectiveThrough: IsoDateSchema.optional(),
  /** Absent = statewide. Present = exactly these catalog waterIds. */
  appliesTo: z.array(z.string().min(1)).optional(),
});
export type FishingInfoItem = z.infer<typeof FishingInfoItemSchema>;

export const FishingInfoSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1).optional(),
  items: z.array(FishingInfoItemSchema).min(1),
});
export type FishingInfoSection = z.infer<typeof FishingInfoSectionSchema>;

export const FishingInformationSchema = z.object({
  /** Informational scope, e.g. 'statewide-tn'. Water-specific rules ride inside
   *  sections via appliesTo — never as a separate 'the rules for water X' doc. */
  scope: z.string().min(1),
  /** Rendered/verified date of the content (NOT a regulation effective date). */
  verifiedAt: IsoDateSchema,
  disclaimer: z.string().min(1),
  sections: z.array(FishingInfoSectionSchema).min(1),
});
export type FishingInformation = z.infer<typeof FishingInformationSchema>;
