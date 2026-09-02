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
 * Data-freshness chip per non-negotiable #3: "Live · 12 min ago" online,
 * "Offline · last known 6:40 AM" when serving the Dexie-stored snapshot.
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
    <Chip tone="good" className={className} title="Fetched live just now — cached on this device.">
      Live · {ageMinutes(fetchedAt)}
    </Chip>
  ) : (
    <Chip tone="fair" className={className} title="You are seeing the last snapshot stored on this device.">
      Offline · last known {clockTime(fetchedAt)}
    </Chip>
  );
}
