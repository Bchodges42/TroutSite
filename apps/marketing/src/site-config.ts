/**
 * Single source of truth for the canonical site origin (SEO non-negotiable #4).
 * astro.config.mjs reads the same env var; keep them in sync if it changes.
 */
export const SITE_URL = process.env.SITE_URL ?? 'https://trout.example';
