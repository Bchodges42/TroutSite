import { Chip } from '@trout/ui';
import { useOnline } from '../hooks/useOnline';
import { ageMinutes, clockTime } from '../lib/time';

export interface FreshnessChipProps {
  /** When the payload was fetched from the network (epoch ms), if ever. */
  fetchedAt: number | undefined | null;
  /** True when this render came from a successful network fetch. */
  live: boolean;
  className?: string;
}

/**
 * Conservative presentation of the supplied transport flag and timestamp.
 * A successful fetch is not evidence of a live gauge observation.
 * While the device is offline the chip always reads "Offline · last known" —
 * even for a payload that arrived live moments before the signal dropped,
 * because the device cannot currently confirm it is still current.
 */
export function FreshnessChip({ fetchedAt, live, className }: FreshnessChipProps) {
  const online = useOnline();
  if (fetchedAt === undefined || fetchedAt === null) {
    return (
      <Chip tone="neutral" className={className}>
        Never updated
      </Chip>
    );
  }
  return live && online ? (
    <Chip
      tone="neutral"
      className={className}
      title="Snapshot timestamp. A successful fetch is not a live observation."
    >
      Snapshot · {ageMinutes(fetchedAt)}
    </Chip>
  ) : (
    <Chip
      tone="fair"
      className={className}
      title="You are seeing the last snapshot stored on this device."
    >
      {online ? 'Cached' : 'Offline'} · last known {clockTime(fetchedAt)}
    </Chip>
  );
}
