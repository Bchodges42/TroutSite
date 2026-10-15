import type { TailFilamentCount } from '@trout/contracts';

export function tailFilamentLabel(tails: TailFilamentCount): string {
  if (tails === 'unknown') return 'Not sure';
  if (tails === 'not-applicable') return 'Not applicable (fish or other non-insect)';
  if (tails === 0) return 'No tail filaments';
  return `${tails} tail filament${tails === 1 ? '' : 's'}`;
}
