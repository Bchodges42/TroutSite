import { beforeEach, describe, expect, it } from 'vitest';
import {
  addChecklistItem,
  completeTrip,
  createTrip,
  listTrips,
  removeChecklistItem,
  toggleChecklistItem,
  tripPackStatus,
  updateTrip,
} from '../src/lib/trips';
import {
  assetsStillPinnedElsewhere,
  computePackReadiness,
  deleteManifest,
  getManifest,
  listManifests,
  markSectionReady,
  putManifest,
  tripManifestId,
  waterManifestId,
} from '../src/lib/downloadManifests';
import { addPhoto, attachPhotoToEntry, deletePhotosForEntry, estimatePhotosBytes, listPhotosForEntry } from '../src/lib/photos';
import { db } from '../src/lib/db';

beforeEach(async () => {
  await Promise.all([db.trips.clear(), db.downloadManifests.clear(), db.photos.clear()]);
});

describe('trip store (ADR 0012)', () => {
  it('creates a trip with the starter checklist and lists planned-before-completed', async () => {
    const a = await createTrip({ title: 'Duck River weekend', date: '2026-10-10', waterIds: ['duck-river'] });
    const b = await createTrip({ title: 'Clinch float', date: '2026-10-04' });
    expect(a.checklist.map((c) => c.label)).toEqual(['Check regulations for each water', 'Verify latest conditions before leaving', 'Pack tackle and flies']);

    await completeTrip(b.id);
    const trips = await listTrips();
    expect(trips.map((t) => t.title)).toEqual(['Duck River weekend', 'Clinch float']);
    expect(trips[1].completedAt).toBeGreaterThan(0);
  });

  it('updates, toggles, adds, and removes checklist items', async () => {
    const trip = await createTrip({ title: 'Trip' });
    const itemId = trip.checklist[0].id;
    await addChecklistItem(trip.id, 'Buy license');
    await toggleChecklistItem(trip.id, itemId);
    let updated = await db.trips.get(trip.id);
    expect(updated!.checklist.find((c) => c.id === itemId)!.done).toBe(true);
    expect(updated!.checklist.some((c) => c.label === 'Buy license')).toBe(true);
    const buyId = updated!.checklist.find((c) => c.label === 'Buy license')!.id;
    await removeChecklistItem(trip.id, buyId);
    updated = await db.trips.get(trip.id);
    expect(updated!.checklist.some((c) => c.label === 'Buy license')).toBe(false);
    await updateTrip(trip.id, { notes: 'Medio beat below the bridge.' });
    expect((await db.trips.get(trip.id))!.notes).toContain('Medio beat');
  });
});

describe('download manifests (ADR 0012)', () => {
  it('upserts manifests with stable createdAt and lists newest-first', async () => {
    await putManifest({ id: waterManifestId('harpeth-river'), kind: 'water', label: 'Harpeth', sections: [], assetUrls: [], manifestVersion: 1 });
    const first = (await getManifest(waterManifestId('harpeth-river')))!;
    await putManifest({ id: tripManifestId('t1'), kind: 'trip', label: 'Trip pack', sections: [], assetUrls: [], manifestVersion: 1 });
    await putManifest({ id: waterManifestId('harpeth-river'), kind: 'water', label: 'Harpeth River', sections: [], assetUrls: [], manifestVersion: 1 });
    const again = (await getManifest(waterManifestId('harpeth-river')))!;
    expect(again.createdAt).toBe(first.createdAt);
    expect(again.label).toBe('Harpeth River');
    const all = await listManifests();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe(waterManifestId('harpeth-river'));
  });

  it('readiness is per-section: required gates ready, optional partials stay visible', async () => {
    const id = waterManifestId('caney-fork');
    await putManifest({
      id,
      kind: 'water',
      label: 'Caney Fork',
      manifestVersion: 1,
      sections: [
        { key: 'catalog', label: 'Water + regs', required: true, ready: false },
        { key: 'terrain', label: 'Terrain pack', required: false, ready: false },
      ],
      assetUrls: [],
    });
    await markSectionReady(id, 'catalog', true, 2048);
    const manifest = (await getManifest(id))!;
    const readiness = computePackReadiness(manifest.sections);
    expect(readiness.requiredReady).toBe(true);
    expect(readiness.partialOptional).toBe(true);
    expect(readiness.missingOptional).toEqual(['terrain']);
    expect(computePackReadiness([{ key: 'x', label: 'x', required: true, ready: false }]).missingRequired).toEqual(['x']);
  });

  it('shared assets pinned elsewhere survive a pack removal', async () => {
    const removing = {
      id: 'water:a', kind: 'water' as const, label: 'A', manifestVersion: 1,
      sections: [], assetUrls: ['/content/taxa.json', '/data/reach-a.geojson'],
    };
    const other = { id: 'water:b', kind: 'water' as const, label: 'B', manifestVersion: 1, sections: [], assetUrls: ['/content/taxa.json'] };
    expect(assetsStillPinnedElsewhere(removing, [other])).toEqual(['/data/reach-a.geojson']);
    await deleteManifest('missing');
    expect(await listManifests()).toEqual([]);
  });
});

describe('photo attachments (ADR 0012)', () => {
  const fakeCompress = (blob: Blob) =>
    Promise.resolve({ blob, mime: 'image/jpeg', width: 1600, height: 900 });

  it('stores compressed blobs, attaches to entries, and cleans up per entry', async () => {
    const blob = new Blob([new Uint8Array(512)], { type: 'image/jpeg' });
    const photoId = await addPhoto(blob, { compress: fakeCompress });
    const photo = (await db.photos.get(photoId))!;
    expect(photo.bytes).toBe(512);
    expect(photo.width).toBe(1600);

    const id = await db.logbook.add({ streamName: 'Duck', date: '2026-09-30', notes: '', flies: [], createdAt: 1, updatedAt: 1 });
    await attachPhotoToEntry(photoId, id);
    expect(await listPhotosForEntry(id)).toHaveLength(1);
    expect(await estimatePhotosBytes()).toBe(512);
    await deletePhotosForEntry(id);
    expect(await estimatePhotosBytes()).toBe(0);
  });

  it('tripPackStatus reads readiness honestly across packs', () => {
    expect(tripPackStatus([])).toBe('none');
    expect(tripPackStatus([{ requiredReady: false, anyReady: false }])).toBe('none');
    expect(tripPackStatus([{ requiredReady: false, anyReady: true }])).toBe('partial');
    expect(tripPackStatus([{ requiredReady: true, anyReady: true }, { requiredReady: true, anyReady: true }])).toBe('ready');
  });
});
