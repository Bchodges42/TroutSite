import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default('127.0.0.1'),
  /** SQLite file location, relative to apps/api unless absolute. */
  TROUT_DB_PATH: z.string().default('data/trout.db'),
  /** packages/content checkout; defaults to ../../packages/content relative to apps/api. */
  TROUT_CONTENT_DIR: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return EnvSchema.parse(source);
}
