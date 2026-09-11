/** Small display-formatting helpers shared by the Astro templates. */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function monthName(month: number): string {
  return MONTHS[Math.min(12, Math.max(1, month)) - 1];
}

export function monthShort(month: number): string {
  return monthName(month).slice(0, 3);
}

/** "Feb 10, 2026" — data fixture dates are YYYY-MM-DD. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${monthShort(m)} ${d}, ${y}`;
}

/** "Aug 28, 2026 · 21:15 UTC" from an ISO datetime string. */
export function formatDateTime(iso: string): string {
  const [datePart, timePart = ''] = iso.split('T');
  const date = formatDate(datePart);
  const hhmm = timePart.slice(0, 5);
  return hhmm ? `${date} · ${hhmm} UTC` : date;
}

export function formatCfs(cfs: number): string {
  return `${Math.round(cfs).toLocaleString('en-US')} cfs`;
}

/** Plain-English fishability label (mirrors the contracts score bands). */
export function scoreLabel(value: number): string {
  if (value >= 75) return 'Good';
  if (value >= 50) return 'Fair';
  if (value > 0) return 'Poor';
  return 'No data';
}
