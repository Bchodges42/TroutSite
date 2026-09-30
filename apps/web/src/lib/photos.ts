import { db, type PhotoRecord } from './db';

/**
 * Local photo attachments (ADR 0012): blobs live in IndexedDB only, are
 * re-encoded at capture (which strips EXIF/GPS by construction), and are
 * included only in an explicitly chosen full backup. The compressor is an
 * injectable seam so tests can run the record bookkeeping without a canvas.
 */

export const PHOTO_MAX_DIM = 1600;
export const PHOTO_JPEG_QUALITY = 0.85;

export interface CompressedImage {
  blob: Blob;
  mime: string;
  width: number;
  height: number;
}

async function defaultCompress(input: Blob): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(input);
  const scale = Math.min(1, PHOTO_MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable for photo compression');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_JPEG_QUALITY));
  if (!blob) throw new Error('Photo encoding failed');
  return { blob, mime: 'image/jpeg', width, height };
  // Re-encoding through canvas carries no EXIF/GPS over: geotags are dropped
  // here, before the blob ever reaches storage.
}

export async function addPhoto(
  input: Blob,
  options?: { logEntryId?: number; compress?: (blob: Blob) => Promise<CompressedImage> },
): Promise<string> {
  const compress = options?.compress ?? defaultCompress;
  const image = await compress(input);
  const id = newPhotoId();
  const record: PhotoRecord = {
    id,
    logEntryId: options?.logEntryId,
    blob: image.blob,
    mime: image.mime,
    bytes: image.blob.size,
    width: image.width,
    height: image.height,
    createdAt: Date.now(),
  };
  await db.photos.put(record);
  return id;
}

export async function attachPhotoToEntry(photoId: string, logEntryId: number): Promise<void> {
  const photo = await db.photos.get(photoId);
  if (!photo) return;
  await db.photos.put({ ...photo, logEntryId });
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  return db.photos.get(id);
}

export async function listPhotosForEntry(logEntryId: number): Promise<PhotoRecord[]> {
  const all = await db.photos.where('logEntryId').equals(logEntryId).toArray();
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id);
}

/** Entry rows keep their text when a photo is gone; list ids are pruned lazily. */
export async function deletePhotosForEntry(logEntryId: number): Promise<void> {
  const photos = await db.photos.where('logEntryId').equals(logEntryId).toArray();
  await Promise.all(photos.map((p) => db.photos.delete(p.id)));
}

export async function estimatePhotosBytes(): Promise<number> {
  const all = await db.photos.toArray();
  return all.reduce((sum, p) => sum + p.bytes, 0);
}

function newPhotoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
