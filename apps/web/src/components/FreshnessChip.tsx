import { Chip } from '@trout/ui';
import { useOnline } from '../hooks/useOnline';
import { ageMinutes, clockTime } from '../lib/time';
import { READING_STALE_MINUTES } from '@trout/contracts';

export interface FreshnessChipProps {
  /** When the payload was fetched from the network (epoch ms), if ever. */
  fetchedAt: number | undefined | null;
  /** True when this render came from a successful network fetch. */
  live: boolean;
  /**
   * Epoch ms of the newest gauge reading in the payload (newestReadingAt).
   * When present, the "Live" path reports the age of the DATA, not the fetch:
   * a just-fetched six-hour-old reading is stale, and the chip says so.
   */
  observedAt?: number | undefined | null;
  className?: string;
}

/**
 * Data-freshness chip per non-negotiable #3: online it reports how old the
 * readings are ("Live · observed 12 min ago", "Stale · observed 4 hr ago");
 * offline it reports the last stored snapshot ("Offline · last known 6:40 AM").
 * While the device is offline the chip always reads "Offline · last known" —
 * even for a payload that arrived live moments before the signal dropped,
 * because the device cannot currently confirm it is still current.
 */
export function FreshnessChip({ fetchedAt, live, observedAt, className }: FreshnessChipProps) {
  const online = useOnline();
  if (fetchedAt === undefined || fetchedAt === null) {
    return (
      <Chip tone="neutral" className={className}>
        Never updated
      </Chip>
    );
  }
  if (live && online) {
    if (observedAt == null) {
      return (
        <Chip tone="good" className={className} title="Fetched live just now — this feed carries no reading timestamps.">
          Checked · {ageMinutes(fetchedAt)}
        </Chip>
      );
    }
    const dataAgeMs = Math.max(0, Date.now() - observedAt);
    const stale = dataAgeMs > READING_STALE_MINUTES * 60_000;
    return stale ? (
      <Chip tone="fair" className={className} title="Fetched just now, but the newest gauge reading is this old — conditions may have changed.">
        Stale · observed {ageMinutes(observedAt)}
      </Chip>
    ) : (
      <Chip tone="good" className={className} title="Reading age from the gauge — fetched live just now and cached on this device.">
        Live · observed {ageMinutes(observedAt)}
      </Chip>
    );
  }
  return (
    <Chip tone="fair" className={className} title="You are seeing the last snapshot stored on this device.">
      Offline · last known {clockTime(fetchedAt)}
    </Chip>
  );
}
