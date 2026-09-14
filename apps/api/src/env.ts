import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default('127.0.0.1'),
  /** SQLite file location, relative to apps/api unless absolute. */
  TROUT_DB_PATH: z.string().default('data/trout.db'),
  /** packages/content checkout; defaults to ../../packages/content relative to apps/api. */
  TROUT_CONTENT_DIR: z.string().optional(),
  /**
   * Web public root; defaults to ../web/public relative to apps/api. Snapshots are
   * written AT their served URLs (v1/**, content/**) per the frozen ENDPOINTS map.
   */
  TROUT_SNAPSHOTS_DIR: z.string().optional(),
  /** Built PWA (apps/web/dist) served by this process; default ../web/dist. */
  TROUT_WEB_DIST_DIR: z.string().optional(),
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
  /** USGS Water Data migration switch; production defaults to the modern API. */
  USGS_PROVIDER: z.enum(['legacy', 'waterdata']).default('waterdata'),
  /** Optional server-only key for the modern USGS Water Data API. */
  USGS_WATERDATA_API_KEY: z.string().min(1).optional(),
  /** HMAC secret for shop portal tokens. Portal routes fail closed (503) without it. */
  PORTAL_SECRET: z.string().min(1).optional(),
  /** Shared secret required by /healthz when set; never expose the value in git. */
  WATCHDOG_TOKEN: z.string().min(1).optional(),
  /**
   * Comma-separated list of portal (apps/admin) origins allowed to call the live
   * portal routes cross-origin, e.g. "https://portal.example.com". Unset = no CORS
   * headers at all (portal must then be served same-origin with the API).
   */
  PORTAL_ORIGINS: z.string().optional(),
  /** Public base URL used when generating absolute links. */
  SITE_URL: z.string().default('http://localhost:8787'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Minimal .env loader (no dependency): KEY=VALUE lines from apps/api/.env fill in
 * variables the process environment does not already set. Real environment wins.
 */
function loadDotEnvInto(source: NodeJS.ProcessEnv): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(source)) {
    if (v !== undefined) merged[k] = v;
  }
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const key = m[1];
      const value = m[2] ?? '';
      if (key && merged[key] === undefined) {
        merged[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // no .env file — fine, everything can come from the real environment
  }
  return merged;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return EnvSchema.parse(loadDotEnvInto(source));
}

/** Parse PORTAL_ORIGINS into an allow-list for @fastify/cors. */
export function portalOrigins(env: Env): string[] {
  return (env.PORTAL_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
