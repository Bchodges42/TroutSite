import { Chip, EmptyState, cx } from '@trout/ui';
import type { ReleaseBlock, ReleaseSchedule } from '@trout/contracts';
import { useReleaseSchedule } from './useReleaseSchedule';
import { formatFlow } from '../../lib/units';

/**
 * Tailwater release-schedule panel (TVA/USACE context, never a score factor).
 *
 * Honesty rules baked in (owner plan):
 * - Official scheduled blocks render IN THE DAM'S NAMED TIME ZONE (the block's
 *   own EST/EDT/CST/CDT abbreviation fixes the offset; display goes through
 *   Intl.DateTimeFormat with the mapped IANA zone, so DST boundaries follow
 *   exactly what the operator published).
 * - Observed discharge is a clearly separate series — never merged into the
 *   scheduled blocks.
 * - No downstream-arrival claims and no wading/safety inference anywhere.
 * - A cached schedule whose every block has passed never reads as the current
 *   plan: it says so explicitly, next to the retrieved time.
 * - An absent/unavailable schedule is an explicit empty state with the
 *   official source, never silence.
 */

/** Caller-supplied observed discharge (from the conditions snapshot) so the
 *  panel shows it without a second fetch. Kept separate from schedule data. */
export interface LatestFlow {
  valueCfs: number;
  observedAt: string | number;
}

export interface ReleasesPanelProps {
  streamId: string;
  latestFlow?: LatestFlow | null;
  className?: string;
}

/** TVA/USACE timestamps carry their own DST abbreviation (fixed offsets). */
const TZ_OFFSET: Record<ReleaseBlock['timeZone'], string> = {
  EST: '-05:00',
  EDT: '-04:00',
  CST: '-06:00',
  CDT: '-05:00',
};

/** IANA zone matching each abbreviation's region — display-only; the instant
 *  itself is computed from the published offset above, never guessed. */
const TZ_ZONE: Record<ReleaseBlock['timeZone'], string> = {
  EST: 'America/New_York',
  EDT: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
};

const TZ_LABEL: Record<string, string> = {
  'America/New_York': 'Eastern Time',
  'America/Chicago': 'Central Time',
};

/** Generic official source when no schedule row exists to carry a sourceUrl. */
const OFFICIAL_SOURCE_URL = 'https://www.tva.com/environment/lake-levels';

/** TVA publishes "1 AM" / "12 PM" style labels (hour precision); accept the
 *  24-hour and half-hour forms defensively without inventing precision. */
function parseBlockTime(time: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec(time.trim());
  if (!m?.[1]) return null;
  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const ampm = m[3]?.toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function blockInstant(date: string, time: string, timeZone: ReleaseBlock['timeZone']): number {
  const t = parseBlockTime(time);
  if (!t) return Number.NaN;
  return Date.parse(
    `${date}T${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}:00${TZ_OFFSET[timeZone]}`,
  );
}

interface BlockView {
  block: ReleaseBlock;
  startMs: number;
  endMs: number;
}

function blockViews(releases: ReleaseBlock[]): BlockView[] {
  return releases
    .map((block) => {
      const startMs = blockInstant(block.date, block.startTime, block.timeZone);
      let endMs = blockInstant(block.date, block.endTime, block.timeZone);
      // Overnight labels ("11 PM – 1 AM") roll into the next day, not the past.
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs < startMs) {
        endMs += 24 * 60 * 60_000;
      }
      return { block, startMs, endMs };
    })
    .filter((v) => !Number.isNaN(v.startMs) && !Number.isNaN(v.endMs))
    .sort((a, b) => a.startMs - b.startMs);
}

type BlockStatus = 'past' | 'in-progress' | 'next' | 'upcoming';

interface DayGroup {
  dateKey: string;
  label: string;
  items: Array<{ view: BlockView; status: BlockStatus }>;
}

/** Formatters use the visitor's locale but ALWAYS the dam's zone for the
 *  schedule itself (user-local stamps only for retrieved/observed provenance).
 *  Cached per zone; Intl.DateTimeFormat construction is not cheap. */
const damFormatters = new Map<string, { clock: Intl.DateTimeFormat; day: Intl.DateTimeFormat }>();

function formattersFor(zone: string): { clock: Intl.DateTimeFormat; day: Intl.DateTimeFormat } {
  let f = damFormatters.get(zone);
  if (!f) {
    f = {
      clock: new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', timeZone: zone }),
      day: new Intl.DateTimeFormat([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: zone,
      }),
    };
    damFormatters.set(zone, f);
  }
  return f;
}

function formatClock(ms: number, zone: string): string {
  return formattersFor(zone).clock.format(ms);
}

const localStamp = new Intl.DateTimeFormat([], {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function ReleasesPanel({ streamId, latestFlow, className }: ReleasesPanelProps) {
  const query = useReleaseSchedule(streamId);
  const schedule = query.data?.data;

  const observedAtMs =
    latestFlow && typeof latestFlow.observedAt === 'number'
      ? latestFlow.observedAt
      : latestFlow
        ? Date.parse(String(latestFlow.observedAt))
        : Number.NaN;

  const observed = latestFlow ? (
    <aside
      className="releases-observed mt-4 pt-3"
      role="note"
      aria-label="Observed discharge"
      data-series="observed"
      style={{ borderTop: '1px solid var(--ui-border)' }}
    >
      <p className="eyebrow">Observed discharge · gauge</p>
      <p>
        <strong>{formatFlow(latestFlow.valueCfs)}</strong>
        {Number.isFinite(observedAtMs) && (
          <span className="muted text-xs"> · observed {localStamp.format(observedAtMs)} (your time zone)</span>
        )}
      </p>
      <p className="muted text-xs mt-1">
        A gauge measurement — a separate series from the dam's published release plan above.
      </p>
    </aside>
  ) : null;

  return (
    <section
      className={cx('detail-section', 'releases-panel', className)}
      aria-label="Tailwater release schedule"
    >
      <p className="eyebrow">Tailwater release schedule</p>
      <h3>Generator releases at the dam</h3>

      {query.isPending && <p className="muted">Loading the release schedule…</p>}

      {!query.isPending && (query.isError || !schedule) && (
        <EmptyState
          title="No published release schedule for this water"
          description="A dam release schedule could not be retrieved for this water right now. Absence of a schedule here is not information about current flows."
          action={
            <a className="text-action" href={OFFICIAL_SOURCE_URL} target="_blank" rel="noreferrer">
              Verify with TVA/USACE ↗
            </a>
          }
        />
      )}

      {!query.isPending && schedule && schedule.status === 'unavailable' && (
        <EmptyState
          title="No published release schedule for this water"
          description={
            schedule.error
              ? `The upstream source reported: ${schedule.error}`
              : 'The official source could not provide a schedule at last retrieval.'
          }
          action={
            <a className="text-action" href={schedule.sourceUrl} target="_blank" rel="noreferrer">
              Verify with TVA/USACE ↗
            </a>
          }
        />
      )}

      {!query.isPending &&
        schedule &&
        (schedule.status === 'empty' ||
          (schedule.status === 'available' && schedule.releases.length === 0)) && (
          <EmptyState
            title="No published release schedule for this water"
            description="The dam operator has not published release blocks for this water in the available schedule."
            action={
              <a className="text-action" href={schedule.sourceUrl} target="_blank" rel="noreferrer">
                Verify with TVA/USACE ↗
              </a>
            }
          />
        )}

      {!query.isPending && schedule && schedule.status === 'available' && schedule.releases.length > 0 && (
        <Timeline schedule={schedule} live={query.data?.live ?? false} />
      )}

      {observed}

      <p className="muted text-xs mt-3">
        The published dam operations plan only. It does not say when (or whether) released water
        reaches a given access point — confirm timing with the official source.
      </p>
    </section>
  );
}

function Timeline({ schedule, live }: { schedule: ReleaseSchedule; live: boolean }) {
  const views = blockViews(schedule.releases);
  if (views.length === 0) {
    return (
      <EmptyState
        title="No published release schedule for this water"
        description="Schedule rows were retrieved but no release blocks could be read from them."
        action={
          <a className="text-action" href={schedule.sourceUrl} target="_blank" rel="noreferrer">
            Verify with TVA/USACE ↗
          </a>
        }
      />
    );
  }

  const now = Date.now();
  const currentIdx = views.findIndex((v) => v.startMs <= now && now <= v.endMs);
  const nextIdx = views.findIndex((v) => v.startMs > now);
  const allPast = currentIdx === -1 && nextIdx === -1;

  const statusAt = (i: number): BlockStatus => {
    if (i === currentIdx) return 'in-progress';
    if (i === nextIdx) return 'next';
    return views[i]!.endMs < now ? 'past' : 'upcoming';
  };

  const zone = TZ_ZONE[views[0]!.block.timeZone];
  const zoneLabel = TZ_LABEL[zone] ?? zone;

  // Group by the dam-local calendar date so day boundaries (including a DST
  // fall-back weekend) follow the dam, not the visitor's device.
  const groups: DayGroup[] = [];
  views.forEach((view, i) => {
    const status = statusAt(i);
    const dateKey = view.block.date;
    let group = groups.find((g) => g.dateKey === dateKey);
    if (!group) {
      group = {
        dateKey,
        label: formattersFor(zone).day.format(
          new Date(blockInstant(view.block.date, '12 PM', view.block.timeZone)),
        ),
        items: [],
      };
      groups.push(group);
    }
    group.items.push({ view, status });
  });

  return (
    <div className="releases-body">
      {allPast && (
        <div className="empty-note mb-3" role="note" data-testid="releases-all-past">
          <strong>Every block in this published schedule has already passed</strong>
          <p>
            This schedule was retrieved {localStamp.format(Date.parse(schedule.retrievedAt))} (your
            time zone) and its last release block has ended. It is a past record, not the current
            plan — check the official source for the schedule now in effect.
          </p>
        </div>
      )}
      {!allPast && (
        <p className="muted text-xs">
          Official published blocks · times shown in {zoneLabel} (the dam's time zone)
        </p>
      )}
      <ol className="releases-groups mt-2">
        {groups.map((group) => (
          <li className="releases-day" key={group.dateKey}>
            <h4 className="eyebrow">{group.label}</h4>
            <ul className="releases-blocks">
              {group.items.map(({ view, status }) => (
                <li
                  key={`${view.block.date}T${view.block.startTime}`}
                  className="releases-block mt-1 flex items-baseline justify-between gap-3"
                  data-next={status === 'next' || status === 'in-progress' ? 'true' : undefined}
                  style={
                    status === 'next' || status === 'in-progress'
                      ? {
                          borderLeft: '3px solid var(--ui-accent, var(--ui-borderStrong))',
                          paddingLeft: 8,
                        }
                      : status === 'past'
                        ? { opacity: 0.6 }
                        : undefined
                  }
                >
                  <span className="releases-time">
                    <strong>
                      {formatClock(view.startMs, zone)} – {formatClock(view.endMs, zone)}
                    </strong>{' '}
                    <span className="muted text-xs">{view.block.timeZone}</span>
                  </span>
                  <span className="releases-meta flex items-center gap-2">
                    <span className="muted text-xs">Generators: {view.block.generators}</span>
                    {status === 'in-progress' && <Chip tone="good">In progress</Chip>}
                    {status === 'next' && <Chip tone="accent">Next</Chip>}
                    {status === 'past' && <Chip tone="neutral">Past</Chip>}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="muted text-xs mt-3">
        Schedule retrieved {localStamp.format(Date.parse(schedule.retrievedAt))} (your time zone)
        {live ? '' : ' · showing the last copy saved on this device'}.
      </p>
      <a className="text-action" href={schedule.sourceUrl} target="_blank" rel="noreferrer">
        Verify with TVA/USACE ↗
      </a>
    </div>
  );
}
