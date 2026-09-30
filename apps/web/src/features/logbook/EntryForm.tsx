import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@trout/ui';
import { useStreamsCatalog } from '../../lib/useStreamsCatalog';
import { addEntry, updateEntry, type ConditionsCapture, type EntryDraft } from '../../lib/logbook';
import { deletePhoto, getPhoto } from '../../lib/photos';
import type { LogbookEntry } from '../../lib/db';
import { PhotoPicker } from './PhotoPicker';

/**
 * One form for create and edit (full editing, ADR 0012). Quick fields stay
 * short — time, duration, species, technique, counts, blank-trip and photos
 * live behind the details expansion. The conditions snapshot travels with the
 * save; capture-once is enforced by the store, so re-saving never rewrites it.
 */
export function EntryForm({
  initial,
  initialStreamId = '',
  captureFor,
  onDone,
  onCancel,
}: {
  initial?: LogbookEntry;
  initialStreamId?: string;
  captureFor?: (streamId?: string) => ConditionsCapture | undefined;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const streamsQuery = useStreamsCatalog(60 * 24, true);
  const streams = streamsQuery.data?.data ?? [];

  const entryId = initial?.id; // defined ⇒ editing a saved entry
  const [streamId, setStreamId] = useState(initial?.streamId ?? initialStreamId);
  const [saveError, setSaveError] = useState('');
  const [customName, setCustomName] = useState(initial && !initial.streamId ? initial.streamName : '');
  const [date, setDate] = useState(initial?.date ?? localToday());
  const [flies, setFlies] = useState((initial?.flies ?? []).join(', '));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [detailsOpen, setDetailsOpen] = useState(() => Boolean(initial && hasV2Details(initial)));
  const [time, setTime] = useState(initial?.time ?? '');
  const [duration, setDuration] = useState(intToText(initial?.durationMinutes));
  const [species, setSpecies] = useState((initial?.species ?? []).join(', '));
  const [technique, setTechnique] = useState(initial?.technique ?? '');
  const [caught, setCaught] = useState(intToText(initial?.caughtCount));
  const [released, setReleased] = useState(intToText(initial?.releasedCount));
  const [blank, setBlank] = useState(initial?.blankTrip ?? false);
  const [kind, setKind] = useState(initial?.entryKind === 'personal-observation' ? 'personal-observation' : 'trip-log');
  const [photoIds, setPhotoIds] = useState<string[]>(initial?.photoIds ?? []);

  // Photos staged before the first save carry no logEntryId; sweep them if
  // this form never commits (saved photos are attached and survive).
  const knownPhotoIds = useRef(new Set(initial?.photoIds ?? []));
  const stagedPhotoIds = useRef<string[]>([]);
  const handlePhotosChange = (ids: string[]) => {
    for (const id of ids) {
      if (!knownPhotoIds.current.has(id)) {
        stagedPhotoIds.current.push(id);
        knownPhotoIds.current.add(id);
      }
    }
    setPhotoIds(ids);
    // Editing a saved entry attaches photos immediately, so cancel keeps them.
    if (entryId !== undefined) {
      void updateEntry(entryId, currentDraft()).catch(() => setSaveError('Could not save the photo list.'));
    }
  };
  useEffect(
    () => () => {
      for (const id of stagedPhotoIds.current) {
        void getPhoto(id).then((p) => {
          if (p && p.logEntryId === undefined) return deletePhoto(id);
          return undefined;
        });
      }
    },
    [],
  );

  function currentDraft(): EntryDraft {
    const name = streamId
      ? (streams.find((s) => s.id === streamId)?.name ?? customName.trim()) || 'Unknown water'
      : customName.trim() || 'Unknown water';
    return {
      streamId: streamId || undefined,
      streamName: name,
      date,
      notes: notes.trim(),
      flies: splitList(flies),
      time: time || undefined,
      durationMinutes: optIntText(duration, 1),
      species: splitList(species),
      technique: technique.trim() || undefined,
      caughtCount: optIntText(caught, 0),
      releasedCount: optIntText(released, 0),
      blankTrip: blank || undefined,
      photoIds,
      entryKind: kind === 'personal-observation' ? 'personal-observation' : undefined,
    };
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const draft = currentDraft();
    const capture = captureFor?.(draft.streamId);
    if (entryId !== undefined) await updateEntry(entryId, draft, capture);
    else await addEntry({ ...draft, conditions: capture });
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) =>
        void submit(e).catch(() =>
          setSaveError('Could not save this entry. Check available browser storage and try again.'),
        )
      }
    >
      {saveError && <p role="alert">{saveError}</p>}
      {kind === 'personal-observation' && (
        <p className="text-sm" style={{ color: 'var(--trout-color-text-muted)' }}>
          Personal observation — your own thermometer or flow reading. It is always labeled as yours
          and is never mixed into provider data.
        </p>
      )}
      <label className="text-sm">
        <span className="mb-1 block font-bold">Stream (from the catalog)</span>
        <select
          className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
          style={{ borderColor: 'var(--trout-color-border)' }}
          value={streamId}
          onChange={(e) => setStreamId(e.target.value)}
        >
          <option value="">— Other / not listed —</option>
          {streams.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {!streamId && (
        <label className="text-sm">
          <span className="mb-1 block font-bold">Water name</span>
          <input
            className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
            style={{ borderColor: 'var(--trout-color-border)' }}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Little River, GSMNP"
          />
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-bold">Date</span>
          <input
            type="date"
            className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
            style={{ borderColor: 'var(--trout-color-border)' }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold">Entry kind</span>
          <select
            className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
            style={{ borderColor: 'var(--trout-color-border)' }}
            value={kind}
            onChange={(e) => setKind(e.target.value as 'trip-log' | 'personal-observation')}
          >
            <option value="trip-log">Trip log</option>
            <option value="personal-observation">Personal observation</option>
          </select>
        </label>
      </div>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Flies used (comma-separated)</span>
        <input
          className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
          style={{ borderColor: 'var(--trout-color-border)' }}
          value={flies}
          onChange={(e) => setFlies(e.target.value)}
          placeholder="Sulphur Parachute #16, Pheasant Tail #18"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Notes</span>
        <textarea
          className="focus-ring w-full rounded-lg border px-3 py-2"
          style={{ borderColor: 'var(--trout-color-border)' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Flow, weather, what worked…"
        />
      </label>

      <div>
        <Button type="button" variant="secondary" className="focus-ring" onClick={() => setDetailsOpen((v) => !v)}>
          {detailsOpen ? 'Hide details' : 'Add details'}
        </Button>
        <span className="ml-2 text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
          time, duration, species, counts, photos
        </span>
      </div>

      {detailsOpen && (
        <div className="flex flex-col gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--trout-color-border)' }}>
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-bold">Start time</span>
              <input
                type="time"
                className="focus-ring min-h-[48px] rounded-lg border px-3"
                style={{ borderColor: 'var(--trout-color-border)' }}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-bold">Duration (minutes)</span>
              <input
                type="number"
                min={1}
                step={1}
                className="focus-ring min-h-[48px] w-32 rounded-lg border px-3"
                style={{ borderColor: 'var(--trout-color-border)' }}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="180"
              />
            </label>
          </div>
          <label className="text-sm">
            <span className="mb-1 block font-bold">Species (comma-separated)</span>
            <input
              className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
              style={{ borderColor: 'var(--trout-color-border)' }}
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Rainbow trout, Brown trout"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-bold">Technique</span>
            <input
              className="focus-ring min-h-[48px] w-full rounded-lg border px-3"
              style={{ borderColor: 'var(--trout-color-border)' }}
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
              placeholder="Nymphing, dry fly…"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-bold">Caught</span>
              <input
                type="number"
                min={0}
                step={1}
                className="focus-ring min-h-[48px] w-28 rounded-lg border px-3"
                style={{ borderColor: 'var(--trout-color-border)' }}
                value={caught}
                onChange={(e) => setCaught(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-bold">Released</span>
              <input
                type="number"
                min={0}
                step={1}
                className="focus-ring min-h-[48px] w-28 rounded-lg border px-3"
                style={{ borderColor: 'var(--trout-color-border)' }}
                value={released}
                onChange={(e) => setReleased(e.target.value)}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} />
            <span className="font-bold">Blank — effort, no catch</span>
            <span style={{ color: 'var(--trout-color-text-muted)' }}>a blank trip is an observation, not an omission</span>
          </label>
          <div className="text-sm">
            <span className="mb-1 block font-bold">Photos</span>
            <PhotoPicker photoIds={photoIds} onChange={handlePhotosChange} entryId={entryId} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="lg" className="focus-ring">
          {entryId !== undefined ? 'Save changes' : 'Save entry'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" className="focus-ring" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function hasV2Details(entry: LogbookEntry): boolean {
  return (
    entry.time !== undefined ||
    entry.durationMinutes !== undefined ||
    (entry.species?.length ?? 0) > 0 ||
    entry.technique !== undefined ||
    entry.caughtCount !== undefined ||
    entry.releasedCount !== undefined ||
    entry.blankTrip === true ||
    (entry.photoIds?.length ?? 0) > 0
  );
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function intToText(value: number | undefined): string {
  return typeof value === 'number' ? String(value) : '';
}

function optIntText(value: string, min: number): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= min ? Math.round(n) : undefined;
}

function localToday(): string {
  // Local calendar day — toISOString() is UTC and can shift the day near midnight.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
