import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default('127.0.0.1'),
  /** SQLite file location, relative to apps/api unless absolute. */
  TROUT_DB_PATH: z.string().default('data/trout.db'),
  /** packages/content checkout; defaults to ../../packages/content relative to apps/api. */
  TROUT_CONTENT_DIR: z.string().optional(),
  /**
   * Snapshot output directory; defaults to <repo>/apps/web/public/data (the sanctioned
   * write target from 00-SHARED-CONTEXT §3). Tests override this.
   */
  TROUT_SNAPSHOTS_DIR: z.string().optional(),
  /** Raw fetch snapshots (scraper audit trail); default data/raw under apps/api. */
  TROUT_RAW_DIR: z.string().optional(),
  /**
   * User-Agent for USGS Waterservices requests. USGS etiquette requires a contact
   * email (§8); the placeholder default is fine for dev, real deploys must set it.
   */
  USGS_USER_AGENT: z
    .string()
    .min(1)
    .default('trout-local/0.1.0 (contact: set USGS_USER_AGENT in env)'),
  /** HMAC secret for shop portal tokens. Portal routes fail closed (503) without it. */
  PORTAL_SECRET: z.string().min(1).optional(),
  /** Public base URL used when generating absolute links. */
  SITE_URL: z.string().default('http://localhost:8787'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return EnvSchema.parse(source);
}
