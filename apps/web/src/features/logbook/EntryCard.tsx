import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Chip, ConfirmButton } from '@trout/ui';
import { ConditionSnapshotSchema } from '@trout/contracts';
import { getPhoto } from '../../lib/photos';
import type { LogbookEntry, PhotoRecord } from '../../lib/db';
import { useSettingsContext } from '../../lib/settings';
import { formatFlow, formatTemp } from '../../lib/units';
import { scoreLabel } from '../../lib/conditions';
import { shortDate } from '../../lib/time';

/**
 * One saved entry. Personal observations are always labeled as the visitor's
 * own reading and styled apart from trip logs — they never present as
 * provider data. The conditions line is the snapshot frozen at save time,
 * never a live refetch.
 */
export function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: LogbookEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const observation = entry.entryKind === 'personal-observation';
  const meta = [
    entry.time ? `Started ${entry.time}` : '',
    entry.durationMinutes !== undefined ? formatDuration(entry.durationMinutes) : '',
    entry.caughtCount !== undefined || entry.releasedCount !== undefined
      ? `Caught ${entry.caughtCount ?? 0} · Released ${entry.releasedCount ?? 0}`
      : '',
  ].filter(Boolean);

  return (
    <Card className={observation ? 'border-dashed' : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-extrabold">{entry.streamName}</h3>
        <Chip tone="accent">{shortDate(entry.date)}</Chip>
        {observation && (
          <Chip tone="fair" className="border-dashed" title="The visitor's own reading — not provider data.">
            Personal observation
          </Chip>
        )}
        {entry.blankTrip && <Chip tone="poor">Blank — effort, no catch</Chip>}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" className="focus-ring" onClick={onEdit}>
            Edit
          </Button>
          <ConfirmButton
            label="Delete"
            confirmLabel="Delete entry"
            cancelLabel="Keep"
            className="focus-ring"
            title="Export a backup first if you want to keep this entry."
            onConfirm={onDelete}
          />
        </div>
      </div>
      {meta.length > 0 && (
        <p className="mt-1 text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          {meta.join(' · ')}
        </p>
      )}
      {entry.technique && <p className="mt-1 text-sm">Technique: {entry.technique}</p>}
      {(entry.species?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(entry.species ?? []).map((s) => (
            <Chip key={s} tone="good">
              {s}
            </Chip>
          ))}
        </div>
      )}
      {entry.flies.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entry.flies.map((f) => (
            <Chip key={f}>{f}</Chip>
          ))}
        </div>
      )}
      {entry.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{entry.notes}</p>}
      <ConditionsAtLogTime snapshot={entry.conditionsSnapshot} observedAt={entry.conditionsObservedAt} />
      {(entry.photoIds?.length ?? 0) > 0 && <EntryPhotos photoIds={entry.photoIds ?? []} />}
    </Card>
  );
}

/** The frozen site snapshot — rendered only if it still validates against the contract. */
function ConditionsAtLogTime({ snapshot, observedAt }: { snapshot: unknown; observedAt?: number }) {
  const { settings } = useSettingsContext();
  const parsed = ConditionSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const snap = parsed.data;
  const cfs = newestNumber(snap.readings, 'cfs');
  const tempC = newestNumber(snap.readings, 'tempC');
  const bits = [
    snap.score.assessed ? scoreLabel(snap.score.value) : '',
    cfs !== undefined ? formatFlow(cfs) : '',
    tempC !== undefined ? formatTemp(tempC, settings.tempUnit) : '',
  ].filter(Boolean);
  if (bits.length === 0) return null;
  return (
    <p className="mt-2 text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
      Site conditions at log time{observedAt ? ` (${shortDate(toLocalDate(observedAt))})` : ''}: {bits.join(' · ')}
    </p>
  );
}

function newestNumber(
  readings: { cfs?: number; tempC?: number; timestamp: string }[],
  key: 'cfs' | 'tempC',
): number | undefined {
  let best: { value: number; ts: number } | null = null;
  for (const r of readings) {
    const v = r[key];
    if (typeof v !== 'number') continue;
    const ts = Date.parse(r.timestamp);
    if (!Number.isFinite(ts)) continue;
    if (!best || ts > best.ts) best = { value: v, ts };
  }
  return best?.value;
}

function toLocalDate(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function EntryPhotos({ photoIds }: { photoIds: string[] }) {
  const records = useLiveQuery(async () => {
    const found = await Promise.all(photoIds.map((id) => getPhoto(id)));
    return found.filter((p): p is PhotoRecord => p !== undefined);
  }, [photoIds.join('|')], undefined);
  if (!records || records.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {records.map((record) => (
        <PhotoThumb key={record.id} record={record} />
      ))}
    </div>
  );
}

function PhotoThumb({ record }: { record: PhotoRecord }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') return undefined;
    const objectUrl = URL.createObjectURL(record.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [record.blob]);
  if (!url) return null;
  return <img src={url} alt="Log photo" className="h-16 w-16 rounded-lg border object-cover" style={{ borderColor: 'var(--trout-color-border)' }} />;
}
