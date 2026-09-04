import { useRef, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { Button, Card, Chip, EmptyState } from '@trout/ui';
import { StreamSchema } from '@trout/contracts';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import { shortDate } from '../lib/time';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { SPRING } from '../components/motion/atlas-motion';
import { RiverContextBar, useRiverContext } from '../lib/riverContext';
import {
  addEntry,
  buildExport,
  deleteEntry,
  downloadExport,
  importFromExport,
  listEntries,
  LOGBOOK_NOTE,
} from '../lib/logbook';

/**
 * Logbook (scope 7): entries live ONLY in this browser's IndexedDB (Dexie).
 * JSON export/import for backup — no accounts, no sync, no server. Ever.
 */

export function LogbookPage() {
  const context = useRiverContext();
  const entries = useLiveQuery(() => listEntries(), [], undefined);

  const [adding, setAdding] = useState(Boolean(context.riverId));
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = async () => {
    downloadExport(await buildExport());
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    const imported = await importFromExport(JSON.parse(text));
    if (imported === 0) throw new Error('No valid entries found in that file');
  };

  return (
    <main className="page">
      <RiverContextBar />
      <p className="eyebrow mb-3">Kept on this device</p>
      <h1 className="page-title">Logbook</h1>
      <p className="page-subtitle mt-1">
        <AnimatedNumber
          value={entries?.length ?? 0}
          format={(v) => `${Math.round(v)} ${Math.round(v) === 1 ? 'entry' : 'entries'} · `}
          className="font-bold"
        />
        {LOGBOOK_NOTE}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => setAdding((v) => !v)} className="focus-ring">
          {adding ? 'Close form' : '+ Add entry'}
        </Button>
        <Button variant="secondary" onClick={() => void exportJson()} className="focus-ring">
          Export JSON
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()} className="focus-ring">
          Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setImportError(null);
            if (file)
              void importJson(file).catch((err) =>
                setImportError(err instanceof Error ? err.message : 'Import failed'),
              );
            e.target.value = '';
          }}
        />
      </div>
      {importError && (
        <p
          className="mt-2 text-sm font-bold"
          style={{ color: 'var(--trout-color-danger)' }}
          role="alert"
        >
          Import failed: {importError}
        </p>
      )}

      {adding && (
        <Card className="mt-4">
          <NewEntryForm
            initialStreamId={context.riverId ?? ''}
            onDone={() => {
              setAdding(false);
              setSaved(true);
            }}
          />
        </Card>
      )}

      {saved && (
        <p role="status" className="mt-4 text-sm" style={{ color: 'var(--ui-good)' }}>
          Entry saved privately on this device.
        </p>
      )}
      <h2 className="section-title">Entries</h2>
      {entries === undefined || entries.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No entries yet"
          description="Record stream, date, flies, and notes. Everything stays on this device."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              Add your first entry
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry, i) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.soft, delay: Math.min(i, 8) * 0.035 }}
            >
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold">{entry.streamName}</h3>
                  <Chip tone="accent">{shortDate(entry.date)}</Chip>
                  <button
                    type="button"
                    className="focus-ring ml-auto text-sm font-bold underline"
                    style={{ color: 'var(--trout-color-danger)' }}
                    onClick={() => {
                      if (
                        entry.id !== undefined &&
                        window.confirm(
                          'Delete this private logbook entry? Export a backup first if you want to keep it.',
                        )
                      )
                        void deleteEntry(entry.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
                {entry.flies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.flies.map((f) => (
                      <Chip key={f}>{f}</Chip>
                    ))}
                  </div>
                )}
                {entry.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{entry.notes}</p>}
              </Card>
            </motion.li>
          ))}
        </ul>
      )}
    </main>
  );
}

function NewEntryForm({
  onDone,
  initialStreamId = '',
}: {
  onDone: () => void;
  initialStreamId?: string;
}) {
  const streamsQuery = useSnapshotQuery(snapshotUrls.streams, StreamSchema.array(), 60 * 24, true);
  const streams = streamsQuery.data?.data ?? [];

  const [streamId, setStreamId] = useState(initialStreamId);
  const [saveError, setSaveError] = useState('');
  const [customName, setCustomName] = useState('');
  const [date, setDate] = useState(() => {
    // Local calendar day — toISOString() is UTC and can shift the day near midnight.
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [flies, setFlies] = useState('');
  const [notes, setNotes] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = streamId
      ? (streams.find((s) => s.id === streamId)?.name ?? customName.trim()) || 'Unknown water'
      : customName.trim() || 'Unknown water';
    await addEntry({
      streamId: streamId || undefined,
      streamName: name,
      date,
      notes: notes.trim(),
      flies: flies
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
    });
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
      <div className="flex items-center gap-2">
        <Button type="submit" size="lg" className="focus-ring">
          Save entry
        </Button>
        <span className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
          {LOGBOOK_NOTE}
        </span>
      </div>
    </form>
  );
}
