import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { Button, Card, Chip, ConfirmButton, toast } from '@trout/ui';
import type { TripRecord } from '../../lib/db';
import {
  addChecklistItem,
  completeTrip,
  deleteTrip,
  removeChecklistItem,
  toggleChecklistItem,
  updateTrip,
} from '../../lib/trips';
import { shortDate } from '../../lib/time';
import { tripManifestId } from '../../lib/downloadManifests';
import type { MyWatersSharedData } from '../myWaters/useMyWatersData';
import { TripWaterLine } from './TripWaterLine';
import { DownloadButton } from '../downloads/DownloadButton';
import { PackStatus } from '../downloads/PackStatus';
import { usePackManager } from '../downloads/usePackManager';
import {
  buildTripCopyText,
  packChip,
  packSectionText,
  tripTiming,
  type TripPackSummary,
} from './tripPlan';

export interface TripCardProps {
  trip: TripRecord;
  pack: TripPackSummary;
  streamsById: Map<string, Stream>;
  snapshotById: Map<string, ConditionSnapshot>;
  catalogState: MyWatersSharedData['catalogState'];
  conditionsLoading: boolean;
}

const fieldClasses = 'focus-ring min-h-[40px] rounded-lg border px-3 text-sm';
const fieldStyle = { borderColor: 'var(--trout-color-border)' };
const sectionTitle = 'text-xs font-bold uppercase tracking-wide muted';

/**
 * One trip in the list. The row stays compact (title, date, counts, pack
 * chip); "Trip details" expands in place — the app's inline-expand pattern —
 * to the waters, checklist, editable plan, and the record/share/delete
 * actions. Recording saves the chosen context into the private logbook.
 */
export function TripCard({
  trip,
  pack,
  streamsById,
  snapshotById,
  catalogState,
  conditionsLoading,
}: TripCardProps) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const manager = usePackManager();
  const timing = tripTiming(trip.date);
  const done = trip.checklist.filter((i) => i.done).length;
  const chip = packChip(pack);
  const logbookHref = trip.waterIds[0] ? `/logbook?stream=${trip.waterIds[0]}` : '/logbook';
  const manifest = manager.manifests?.find((m) => m.id === tripManifestId(trip.id));
  const busy = manager.busyId === tripManifestId(trip.id);
  const tripStreams = trip.waterIds
    .map((id) => streamsById.get(id))
    .filter((s): s is Stream => s !== undefined);

  const copyPlan = () => {
    if (!navigator.clipboard) {
      toast.error('Copy failed — this browser blocks clipboard access.');
      return;
    }
    const text = buildTripCopyText({
      date: trip.date,
      waters: trip.waterIds.map((id) => ({ id, name: streamsById.get(id)?.name ?? id })),
    });
    void navigator.clipboard.writeText(text).then(
      () => toast.success('Plan copied — notes and the checklist stayed on this device.'),
      () => toast.error('Copy failed — this browser blocks clipboard access.'),
    );
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-extrabold">{trip.title}</h3>
        {trip.date && <Chip>{shortDate(trip.date)}</Chip>}
        {timing === 'future' && <Chip tone="accent">Upcoming</Chip>}
        {trip.completedAt && <Chip tone="good">Recorded</Chip>}
        <Chip>{trip.waterIds.length === 1 ? '1 water' : `${trip.waterIds.length} waters`}</Chip>
        {trip.checklist.length > 0 && (
          <span className="muted text-sm">
            checklist {done}/{trip.checklist.length}
          </span>
        )}
        <Chip tone={chip.tone} className="ml-auto">
          {chip.label}
        </Chip>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="text-action focus-ring"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close details' : 'Trip details'}
        </button>
        <ConfirmButton
          label={`Delete ${trip.title}`}
          confirmLabel={`Really delete ${trip.title}`}
          cancelLabel="Keep"
          className="focus-ring ml-auto"
          onConfirm={() => {
            void deleteTrip(trip.id).then(() => toast.success('Trip deleted.'));
          }}
        />
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-4 border-t pt-3" style={{ borderColor: 'var(--trout-color-border)' }}>
          <section>
            <h4 className={sectionTitle}>Waters</h4>
            {trip.waterIds.length === 0 ? (
              <p className="muted mt-1 text-sm">
                No waters yet — add catalog ids when planning, or hand a shortlist over from
                compare.
              </p>
            ) : (
              <ul className="mt-1 flex flex-col gap-2" aria-label={`Waters for ${trip.title}`}>
                {trip.waterIds.map((id) => (
                  <TripWaterLine
                    key={id}
                    waterId={id}
                    stream={streamsById.get(id)}
                    catalogState={catalogState(id)}
                    snapshot={snapshotById.get(id)}
                    conditionsLoading={conditionsLoading}
                    timing={timing}
                  />
                ))}
              </ul>
            )}
            {timing === 'future' && (
              <p className="muted mt-2 text-sm">
                Upcoming trip — seasonal outlook only. Today&apos;s gauge readings say nothing
                about this date; the “Verify latest conditions before leaving” checklist item is
                the pre-departure check.
              </p>
            )}
          </section>

          <section>
            <h4 className={sectionTitle}>Offline packs</h4>
            <div className="mt-1">
              <DownloadButton
                manifest={manifest}
                busy={busy}
                progress={manager.progress}
                offline={typeof navigator !== 'undefined' && navigator.onLine === false}
                onDownload={(terrain) => void manager.downloadTrip(trip, tripStreams, terrain)}
                onEstimate={(terrain, signal) => manager.estimateTrip(trip, tripStreams, terrain, signal)}
                onRedownload={manifest ? (terrain) => void manager.downloadTrip(trip, tripStreams, terrain) : undefined}
                onCancel={manager.cancelDownload}
                onVerify={manifest ? () => void manager.verifyPack(manifest) : undefined}
                onRemove={manifest ? () => void manager.removePack(manifest) : undefined}
              />
            </div>
            <ul className="mt-1 flex flex-col gap-1" aria-label={`Offline packs for ${trip.title}`}>
              {pack.manifests.map((m) => (
                <li key={m.id} className="text-sm">
                  <strong>{m.label}</strong> — {packSectionText(m.readiness)}
                </li>
              ))}
            </ul>
            {manifest && (
              <div className="mt-2">
                <PackStatus manifest={manifest} />
              </div>
            )}
            <p className="muted mt-1 text-sm">
              A pack pins the waters&apos; guides, conditions, hatch charts, and map tiles in this
              browser. Your notes and checklist stay private, and removing a pack never touches
              them.
            </p>
          </section>

          <ChecklistSection trip={trip} />
          <PlanEditor trip={trip} />

          <section>
            <h4 className={sectionTitle}>After the trip</h4>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {trip.completedAt ? (
                <Link className="secondary-action focus-ring" to={logbookHref}>
                  Log it
                </Link>
              ) : (
                <Button
                  size="sm"
                  className="focus-ring"
                  disabled={recording || timing === 'future' || trip.waterIds.length === 0}
                  onClick={() => {
                    setRecording(true);
                    void completeTrip(trip.id, new Map([...streamsById].map(([id, stream]) => [id, stream.name])))
                      .then(() => toast.success('Trip saved in the logbook — add catches and photos there.'))
                      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not record the trip.'))
                      .finally(() => setRecording(false));
                  }}
                >
                  {recording ? 'Recording…' : 'Record trip'}
                </Button>
              )}
              <Button variant="secondary" size="sm" className="focus-ring" onClick={copyPlan}>
                Copy plan
              </Button>
              <span className="muted text-sm">Notes and the checklist stay on this device.</span>
            </div>
            {!trip.completedAt && timing === 'future' && <p className="muted mt-2 text-sm">Record after the trip, with its actual date.</p>}
          </section>
        </div>
      )}
    </Card>
  );
}

/** Checklist with add / toggle / remove. Toggles persist straight to the store. */
function ChecklistSection({ trip }: { trip: TripRecord }) {
  const [label, setLabel] = useState('');
  const done = trip.checklist.filter((i) => i.done).length;

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    void addChecklistItem(trip.id, trimmed);
    setLabel('');
  };

  return (
    <section>
      <h4 className={sectionTitle}>
        Checklist · {done}/{trip.checklist.length} done
      </h4>
      <ul className="mt-1 flex flex-col gap-1" aria-label={`Checklist for ${trip.title}`}>
        {trip.checklist.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="focus-ring"
                checked={item.done}
                onChange={() => void toggleChecklistItem(trip.id, item.id)}
              />
              {item.label}
            </label>
            <ConfirmButton
              label="Remove"
              confirmLabel={`Really remove ${item.label}`}
              cancelLabel="Keep"
              className="focus-ring"
              onConfirm={() => void removeChecklistItem(trip.id, item.id)}
            />
          </li>
        ))}
      </ul>
      <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={addItem}>
        <label className="text-sm">
          <span className="mb-1 block font-bold">Add item</span>
          <input
            className={fieldClasses}
            style={fieldStyle}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Buy license"
            aria-label="New checklist item"
          />
        </label>
        <Button type="submit" size="sm" className="focus-ring" disabled={!label.trim()}>
          Add item
        </Button>
      </form>
    </section>
  );
}

/** Editable date / species / notes. Notes are private and stay on the device. */
function PlanEditor({ trip }: { trip: TripRecord }) {
  const [date, setDate] = useState(trip.date ?? '');
  const [species, setSpecies] = useState((trip.species ?? []).join(', '));
  const [notes, setNotes] = useState(trip.notes ?? '');

  const save = () => {
    void updateTrip(trip.id, {
      date: date.trim() || undefined,
      species: species.trim() ? species.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      notes: notes.trim() || undefined,
    }).then(() => toast.success('Trip updated — still on this device only.'));
  };

  return (
    <section>
      <h4 className={sectionTitle}>Plan</h4>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-bold">Date</span>
          <input
            type="date"
            className={fieldClasses}
            style={fieldStyle}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Trip date"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold">Species</span>
          <input
            className={fieldClasses}
            style={fieldStyle}
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="Rainbow, brown"
            aria-label="Species (comma separated)"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold">Notes (private)</span>
          <textarea
            className={fieldClasses}
            style={fieldStyle}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Access points, flows to watch — stays on this device"
            aria-label="Trip notes (private)"
          />
        </label>
        <Button size="sm" className="focus-ring" onClick={save}>
          Save changes
        </Button>
      </div>
    </section>
  );
}
