/**
 * Shop-authored report content is the only user input this server persists.
 * It is displayed as plain text on public pages, so everything arrives at the
 * sanitizer before it reaches SQLite: no HTML, no control characters, bounded size.
 */

export const REPORT_BODY_MAX = 4000;

/** Collapse whitespace, strip tags/control chars, hard-cap length. */
export function sanitizePlainText(input: string, max = REPORT_BODY_MAX): string {
  const noTags = input.replace(/<[^>]*>/g, ' ');
  // \p{Cc} = Unicode "control" category (includes \x00–\x08, \x0B, \x0C, \x0E–\x1F, \x7F).
  const noControl = noTags.replace(/\p{Cc}/gu, '');
  const collapsed = noControl.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return collapsed.slice(0, max);
}

/** Strict slug for pattern/stream/shop references: lowercase, digits, hyphens. */
export function sanitizeSlug(input: string): string | null {
  const slug = input.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.length > 0 && slug.length <= 80 ? slug : null;
}
