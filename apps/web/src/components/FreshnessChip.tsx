import { Chip } from '@trout/ui';
import { useOnline } from '../hooks/useOnline';
import { ageMinutes, lastKnownTime } from '../lib/time';
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
  /**
   * Epoch ms the feed itself promised its next update (snapshot's
   * nextExpectedUpdate). When that time has passed, the chip says the update
   * is overdue — an unhealthy or stalled feed is visible without expanding
   * the source disclosure (H4/C1).
   */
  nextExpectedAt?: number | undefined | null;
  /**
   * Upstream-source age for feeds without reading timestamps (e.g. TWRA
   * stocking): `at` is when the SOURCE was last read successfully (epoch ms).
   * When given, the live chip reports that age — a failed ingest must never
   * read "just now" because the browser downloaded an old snapshot.
   */
  source?: { label: string; at: number | null; staleAfterMs: number };
  className?: string;
}

/**
 * Data-freshness chip per non-negotiable #3. Online it reports the age of the
 * newest gauge READING — "Live · observed 12 min ago", or "Stale · observed
 * 4 hr ago" when a successful fetch delivered old data (a successful fetch is
 * not evidence of a live observation). Without reading timestamps it stays
 * conservative ("Snapshot · …"). Offline it reports the last stored snapshot:
 * "Offline · last known 6:40 AM" while offline, "Cached · last known" when
 * merely serving the stored snapshot while online.
 */
export function FreshnessChip({
  fetchedAt,
  live,
  observedAt,
  nextExpectedAt,
  source,
  className,
}: FreshnessChipProps) {
  const online = useOnline();
  if (fetchedAt === undefined || fetchedAt === null) {
    // Offline with nothing stored for this surface: the old markup called
    // this "Saved offline", which overclaimed. Say exactly what is true.
    if (!online) {
      return (
        <Chip tone="neutral" className={className}>
          Offline · nothing saved yet
        </Chip>
      );
    }
    return (
      <Chip tone="neutral" className={className}>
        Never updated
      </Chip>
    );
  }
  if (live && online) {
    if (source) {
      if (source.at == null) {
        return (
          <Chip tone="fair" className={className} title={`This snapshot does not say when ${source.label} was last read.`}>
            {source.label} · fetch time unknown
          </Chip>
        );
      }
      const stale = Date.now() - source.at > source.staleAfterMs;
      return (
        <Chip
          tone={stale ? 'fair' : 'neutral'}
          className={className}
          title={
            stale
              ? `${source.label} has not been read successfully recently — this data may be out of date.`
              : `When ${source.label} was last read by the ingest, not when this page downloaded it.`
          }
        >
          {stale ? `${source.label} stale · fetched ` : `${source.label} · fetched `}
          {ageMinutes(source.at)}
        </Chip>
      );
    }
    if (observedAt == null) {
      // The feed promised an update that never came: immediately overdue
      // (nextExpectedUpdate <= fetchedAt) is how the builder signals an
      // unhealthy gauges pipeline. Surface it right here, not in a <details>.
      const overdue = nextExpectedAt != null && nextExpectedAt <= Date.now();
      return (
        <Chip
          tone={overdue ? 'fair' : 'neutral'}
          className={className}
          title={
            overdue
              ? 'This snapshot is past its expected update time. The conditions feed may be unavailable — coverage information is not current.'
              : 'Snapshot timestamp. A successful fetch is not a live observation — this feed carries no reading timestamps.'
          }
        >
          Snapshot · {ageMinutes(fetchedAt)}
          {overdue ? ' · update overdue' : ''}
        </Chip>
      );
    }
    const dataAgeMs = Math.max(0, Date.now() - observedAt);
    const stale = dataAgeMs > READING_STALE_MINUTES * 60_000;
    // T2-30: "Gauge live", not "Live" — the live thing is the gauge feed, and
    // on a warmwater water a bare "Live" reads as live fishability.
    return stale ? (
      <Chip tone="fair" className={className} title="Fetched just now, but the newest gauge reading is this old — conditions may have changed.">
        Gauge stale · observed {ageMinutes(observedAt)}
      </Chip>
    ) : (
      <Chip tone="good" className={className} title="Reading age from the gauge — fetched live just now and cached on this device.">
        Gauge live · observed {ageMinutes(observedAt)}
      </Chip>
    );
  }
  return (
    <Chip tone="fair" className={className} title="You are seeing the last snapshot stored on this device.">
      {online ? 'Cached' : 'Offline'} · last known {lastKnownTime(fetchedAt)}
    </Chip>
  );
}
