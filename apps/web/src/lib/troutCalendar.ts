/** Format an authored month list without inferring fish presence or stocking events. */
const MONTH_ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthWindowLabel(months: number[]): string {
  const sorted = [...new Set(months.filter((m) => Number.isInteger(m) && m >= 1 && m <= 12))].sort((a, b) => a - b);
  if (sorted.length === 0) return 'no documented months';
  const runs: Array<[number, number]> = [];
  let start = sorted[0]!;
  let end = start;
  for (const month of sorted.slice(1)) {
    if (month === end + 1) {
      end = month;
    } else {
      runs.push([start, end]);
      start = end = month;
    }
  }
  runs.push([start, end]);
  // A year-end wrap is one interval: Nov, Dec, Jan becomes Nov–Jan.
  if (runs.length > 1 && runs[0]![0] === 1 && runs[runs.length - 1]![1] === 12) {
    const last = runs.pop()!;
    runs[0] = [last[0], runs[0]![1]];
  }
  return runs
    .map(([first, last]) => first === last ? MONTH_ABBRS[first - 1]! : `${MONTH_ABBRS[first - 1]}–${MONTH_ABBRS[last - 1]}`)
    .join(', ');
}
