import { z } from 'zod';
import { StateIdSchema } from './shared.js';

export const ShopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stateId: StateIdSchema,
  town: z.string().min(1),
  websiteUrl: z.string().url(),
  reportsEnabled: z.boolean(),
});
export type Shop = z.infer<typeof ShopSchema>;
