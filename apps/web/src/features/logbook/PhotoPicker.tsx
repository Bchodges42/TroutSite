import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@trout/ui';
import { getPhoto, addPhoto, deletePhoto } from '../../lib/photos';
import type { PhotoRecord } from '../../lib/db';

/**
 * Photo attachments (ADR 0012): files enter storage only through photos.ts's
 * addPhoto — compression + EXIF/GPS stripping happen at that seam. Blobs live
 * in IndexedDB only and never leave the device except via an explicit full
 * backup. With no `entryId` (new-entry form) photos are staged unattached and
 * linked to the entry at save; the form sweeps abandoned stagings.
 */
export function PhotoPicker({
  photoIds,
  onChange,
  entryId,
}: {
  photoIds: string[];
  onChange: (ids: string[]) => void;
  entryId?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const records = useLiveQuery(
    async () => {
      const found = await Promise.all(photoIds.map((id) => getPhoto(id)));
      return found.filter((p): p is PhotoRecord => p !== undefined);
    },
    [photoIds.join('|')],
    undefined,
  );

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const ids: string[] = [];
      for (const file of Array.from(files)) {
        ids.push(await addPhoto(file, { logEntryId: entryId }));
      }
      onChange([...photoIds, ...ids]);
    } catch {
      setError('Could not add that photo. Try a smaller image.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (photoId: string) => {
    await deletePhoto(photoId);
    onChange(photoIds.filter((p) => p !== photoId));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="focus-ring"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? 'Adding…' : 'Add photo'}
        </Button>
        <span className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
          Photos stay on this device. Location data is stripped at capture.
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {error && (
        <p role="alert" className="mt-1 text-sm">
          {error}
        </p>
      )}
      {records && records.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {records.map((record) => (
            <PhotoThumb key={record.id} record={record} onRemove={() => void remove(record.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoThumb({ record, onRemove }: { record: PhotoRecord; onRemove: () => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    // jsdom/older engines may lack createObjectURL — thumbnails are then skipped,
    // while the record bookkeeping stays fully exercisable.
    if (typeof URL.createObjectURL !== 'function') return undefined;
    const objectUrl = URL.createObjectURL(record.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [record.blob]);

  return (
    <span className="relative inline-block">
      {url ? (
        <img
          src={url}
          alt="Log photo"
          className="h-16 w-16 rounded-lg border object-cover"
          style={{ borderColor: 'var(--trout-color-border)' }}
        />
      ) : (
        <span
          className="block h-16 w-16 rounded-lg border"
          style={{ borderColor: 'var(--trout-color-border)' }}
          aria-label="Log photo"
        />
      )}
      <button
        type="button"
        className="focus-ring absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full border text-xs font-bold leading-none"
        style={{ borderColor: 'var(--trout-color-border)', background: 'var(--trout-color-surface, white)' }}
        title="Remove photo"
        aria-label="Remove photo"
        onClick={onRemove}
      >
        ×
      </button>
    </span>
  );
}
