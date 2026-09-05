// Deterministic time helpers for the fishability model.
//
// The model must produce identical output regardless of the machine's
// local timezone. JavaScript's Date.parse is only deterministic for
// zone-explicit ISO strings and date-only strings (which are spec-defined
// UTC); a date-time WITHOUT a zone designator parses as *local* time and
// would make results machine-dependent. normalizeIso removes that
// hazard: bare date-times are interpreted as UTC by explicit model rule.

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_NO_ZONE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;

const MS_PER_DAY = 86_400_000;

/** Parse an ISO date/time to a UTC epoch-ms value; throws on garbage. */
export function toUtcMs(iso: string, label: string): number {
  const raw = iso.trim();
  let normalized = raw;
  if (DATE_ONLY.test(raw)) {
    normalized = `${raw}T00:00:00Z`;
  } else if (DATE_TIME_NO_ZONE.test(raw)) {
    normalized = `${raw.replace(' ', 'T')}Z`;
  }
  const ms = Date.parse(normalized);
  if (Number.isNaN(ms)) {
    throw new Error(
      `fishability model: unparsable ${label} ${JSON.stringify(iso)} (expected ISO-8601)`,
    );
  }
  return ms;
}

/** UTC month of an instant (1–12, January = 1). */
export function utcMonth(iso: string): number {
  return new Date(toUtcMs(iso, 'timestamp')).getUTCMonth() + 1;
}

/** Whole days elapsed from `fromIso` to `toIso` (positive when toIso is later). */
export function elapsedDays(fromIso: string, toIso: string): number {
  return (toUtcMs(toIso, 'timestamp') - toUtcMs(fromIso, 'timestamp')) / MS_PER_DAY;
}

export { MS_PER_DAY };
