/** Pure time formatting — deterministic given `now` so tests stay stable. */

const relativeFmt = new Intl.RelativeTimeFormat([], { numeric: 'auto' });

/** "now", "12 minutes ago", "3 hours ago", "2 days ago". */
export function ageMinutes(fetchedAt: number, now: number = Date.now()): string {
  const minutes = Math.max(0, (now - fetchedAt) / 60_000);
  if (minutes < 1) return relativeFmt.format(0, 'second');
  if (minutes < 90) return relativeFmt.format(-Math.round(minutes), 'minute');
  if (minutes < 60 * 36) return relativeFmt.format(-Math.round(minutes / 60), 'hour');
  return relativeFmt.format(-Math.round(minutes / (60 * 24)), 'day');
}

/** "6:40 AM" style local clock time for "Offline · last known 6:40 AM". */
export function clockTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** "Apr 12" style short date. */
export function shortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`); // midday avoids TZ day-shift
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Current calendar month 1–12 (the wizard's default context). */
export function currentMonth(now: Date = new Date()): number {
  return now.getMonth() + 1;
}
