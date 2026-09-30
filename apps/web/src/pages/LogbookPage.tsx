import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button, Card, Dialog, EmptyState, toast } from '@trout/ui';
import { ConditionSnapshotSchema } from '@trout/contracts';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { SPRING } from '../components/motion/atlas-motion';
import { RiverContextBar, useRiverContext } from '../lib/riverContext';
import { snapshotUrls } from '../lib/endpoints';
import { useSnapshotQuery } from '../lib/useSnapshotQuery';
import {
  buildExport,
  buildFullBackup,
  conditionsCaptureFrom,
  deleteEntryAndPhotos,
  downloadExport,
  downloadFullBackup,
  filterEntries,
  importFromExport,
  listEntries,
  LOGBOOK_NOTE,
  sweepUnattachedPhotos,
  summarizeEntries,
  type EntryFilter,
} from '../lib/logbook';
import { EntryCard } from '../features/logbook/EntryCard';
import { EntryForm } from '../features/logbook/EntryForm';
import { LogbookFilters } from '../features/logbook/LogbookFilters';
import { SummaryCards } from '../features/logbook/SummaryCards';

/**
 * Logbook (scope 7): entries live ONLY in this browser's IndexedDB (Dexie).
 * JSON export/import for backup — no accounts, no sync, no server. Ever.
 * Photo blobs travel only in the explicitly labeled full backup.
 */

const CONDITIONS_TTL_MIN = 60;

export function LogbookPage() {
  const context = useRiverContext();
  const [params] = useSearchParams();
  // Drawer/other-surface prefill: /logbook?stream=<catalogId> (falls back to the ?river= context param).
  const prefillStreamId = params.get('stream') ?? context.riverId ?? '';
  const entries = useLiveQuery(() => listEntries(), [], undefined);

  const [adding, setAdding] = useState(Boolean(prefillStreamId));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<EntryFilter>({});
  const [importError, setImportError] = useState<{ message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Same per-water conditions the rest of the site reads (offline-first): the
  // snapshot is frozen at SAVE time and a later refresh never rewrites it.
  const conditionsQuery = useSnapshotQuery(
    snapshotUrls.conditionsLatest,
    ConditionSnapshotSchema.array(),
    CONDITIONS_TTL_MIN,
    true,
  );
  const captureFor = (streamId?: string) => {
    if (!streamId) return undefined;
    const snapshot = conditionsQuery.data?.data.find((s) => s.streamId === streamId);
    return snapshot ? conditionsCaptureFrom(snapshot) : undefined;
  };

  // Staged-but-never-saved photos would otherwise pile up in the photos store.
  useEffect(() => {
    void sweepUnattachedPhotos();
  }, []);

  const exportJson = async () => {
    downloadExport(await buildExport());
    toast.success('Backup exported. Keep the file somewhere safe.');
  };

  const exportFullBackup = async () => {
    downloadFullBackup(await buildFullBackup());
    toast.success('Full backup exported — entries and photos, still private to this device.');
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    const imported = await importFromExport(JSON.parse(text));
    if (imported === 0) throw new Error('No valid entries found in that file');
    return imported;
  };

  const visible = useMemo(() => filterEntries(entries ?? [], filter), [entries, filter]);
  const speciesOptions = useMemo(() => summarizeEntries(entries ?? []).speciesTally.map((t) => t.species), [entries]);

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

      {entries !== undefined && entries.length > 0 && <SummaryCards entries={entries} />}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => setAdding((v) => !v)} className="focus-ring">
          {adding ? 'Close form' : '+ Add entry'}
        </Button>
        <Button variant="secondary" onClick={() => void exportJson()} className="focus-ring">
          Export JSON
        </Button>
        <Button variant="secondary" onClick={() => void exportFullBackup()} className="focus-ring">
          Full backup (with photos)
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
              void importJson(file)
                .then((imported) =>
                  toast.success(
                    `Imported ${imported} ${imported === 1 ? 'entry' : 'entries'} — still private to this device.`,
                  ),
                )
                .catch((err) =>
                  setImportError({
                    message: err instanceof Error ? err.message : 'Import failed',
                  }),
                );
            e.target.value = '';
          }}
        />
      </div>
      <Dialog
        open={importError !== null}
        onOpenChange={(open) => {
          if (!open) setImportError(null);
        }}
        title="Import failed"
        description={importError?.message ?? ''}
        footer={
          <Button onClick={() => setImportError(null)}>Back to the logbook</Button>
        }
      />

      {adding && (
        <Card className="mt-4">
          <EntryForm
            initialStreamId={prefillStreamId}
            captureFor={captureFor}
            onDone={() => {
              setAdding(false);
              toast.success('Entry saved privately on this device.');
            }}
            onCancel={() => setAdding(false)}
          />
        </Card>
      )}

      {entries !== undefined && entries.length > 0 && (
        <LogbookFilters filter={filter} onChange={setFilter} speciesOptions={speciesOptions} />
      )}

      <h2 className="section-title">
        Entries
        {visible.length !== (entries?.length ?? 0) && entries !== undefined && entries.length > 0
          ? ` (${visible.length} of ${entries.length})`
          : ''}
      </h2>
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
      ) : visible.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No entries match those filters"
          description="Every entry is still here — clear the filters to see the whole book."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((entry, i) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.soft, delay: Math.min(i, 8) * 0.035 }}
            >
              {editingId !== null && editingId === entry.id ? (
                <Card>
                  <EntryForm
                    initial={entry}
                    captureFor={captureFor}
                    onDone={() => {
                      setEditingId(null);
                      toast.success('Entry updated — still private to this device.');
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </Card>
              ) : (
                <EntryCard
                  entry={entry}
                  onEdit={() => {
                    setAdding(false);
                    setEditingId(entry.id ?? null);
                  }}
                  onDelete={() => {
                    if (entry.id === undefined) return;
                    void deleteEntryAndPhotos(entry.id).then(() =>
                      toast.success('Entry deleted', {
                        description: 'Export a backup anytime from this page.',
                      }),
                    );
                  }}
                />
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </main>
  );
}
