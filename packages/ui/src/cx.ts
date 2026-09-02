/** Join truthy class names — tiny local alternative to classnames. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
