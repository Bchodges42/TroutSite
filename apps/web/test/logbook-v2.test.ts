import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addEntry,
  buildExport,
  buildFullBackup,
  conditionsCaptureFrom,
  deleteEntryAndPhotos,
  filterEntries,
  importFromExport,
  listEntries,
  removePhotoFromEntry,
  summarizeEntries,
  sweepUnattachedPhotos,
  updateEntry,
} from '../src/lib/logbook';
import { addPhoto, getPhoto, listPhotosForEntry } from '../src/lib/photos';
import { db } from '../src/lib/db';
import type { ConditionSnapshot } from '@trout/contracts';

// fake-indexeddb clones values with Node's structuredClone, which cannot carry
// a jsdom Blob across realms (it comes back an empty husk — Blobs live nested
// inside photo records). Photo records are immutable here, so a shallow
// data-clone that preserves Blob identity keeps the full-backup round-trip
// exercisable. Production realms structured-clone Blobs natively.
beforeEach(() => {
  const clone = (value: unknown): unknown => {
    if (value instanceof Blob) return value;
    if (Array.isArray(value)) return value.map(clone);
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) out[key] = clone(val);
      return out;
    }
    return value;
  };
  vi.stubGlobal('structuredClone', clone);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(async () => {
  await db.logbook.clear();
  await db.photos.clear();
});

const fakeCompress = (blob: Blob) => Promise.resolve({ blob, mime: 'image/jpeg', width: 1600, height: 900 });

function snapshot(overrides: Partial<ConditionSnapshot> = {}): ConditionSnapshot {
  return {
    streamId: 'south-holston',
    readings: [{ gaugeId: '03451500', timestamp: '2026-09-30T10:00:00Z', cfs: 120, tempC: 17 }],
    score: { value: 72, assessed: true, reasons: ['Temperatures sit in the ideal range.'] },
    fetchedAt: '2026-09-30T10:05:00Z',
    nextExpectedUpdate: '2026-09-30T11:05:00Z',
    ...overrides,
  } as ConditionSnapshot;
}

describe('logbook v2 — full editing', () => {
  it('keeps personal observations out of trip and effort totals', () => {
    const entry = { streamName: 'A', date: '2026-09-29', notes: '', flies: [], createdAt: 1, updatedAt: 1 };
    expect(summarizeEntries([{ ...entry, entryKind: 'personal-observation', caughtCount: 4, durationMinutes: 60 }, entry]))
      .toMatchObject({ totalTrips: 1, caughtTotal: 0, effortHours: 0 });
  });
  it('round-trips an edit: fields change, createdAt survives, updatedAt moves', async () => {
    const id = await addEntry({ streamName: 'South Holston River', date: '2026-09-01', notes: 'First pass.' });
    const [before] = await listEntries();

    await updateEntry(id, {
      streamName: 'South Holston River',
      date: '2026-09-02',
      notes: 'Edited after the fact.',
      time: '07:15',
      durationMinutes: 210,
    });
    const [after] = await listEntries();
    expect(after.id).toBe(id);
    expect(after.date).toBe('2026-09-02');
    expect(after.notes).toBe('Edited after the fact.');
    expect(after.time).toBe('07:15');
    expect(after.durationMinutes).toBe(210);
    expect(after.createdAt).toBe(before.createdAt);
    expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
  });

  it('clears optional fields the edit leaves empty (draft = whole new state)', async () => {
    const id = await addEntry({
      streamName: 'Watauga',
      date: '2026-09-01',
      time: '06:30',
      durationMinutes: 90,
      caughtCount: 3,
      blankTrip: false,
    });
    await updateEntry(id, { streamName: 'Watauga', date: '2026-09-01', notes: '' });
    const [entry] = await listEntries();
    expect(entry.time).toBeUndefined();
    expect(entry.durationMinutes).toBeUndefined();
    expect(entry.caughtCount).toBeUndefined();
    expect(entry.blankTrip).toBeUndefined();
    expect(entry.notes).toBe('');
  });

  it('persists every v2 field on create', async () => {
    const photoId = await addPhoto(new Blob([new Uint8Array(16)], { type: 'image/jpeg' }), { compress: fakeCompress });
    const id = await addEntry({
      streamId: 'south-holston',
      streamName: 'South Holston River',
      date: '2026-09-30',
      time: '06:45',
      durationMinutes: 240,
      species: ['Rainbow trout', 'Brown trout'],
      technique: 'Nymphing',
      caughtCount: 5,
      releasedCount: 5,
      blankTrip: false,
      photoIds: [photoId],
      entryKind: 'trip-log',
    });
    await getPhoto(photoId); // attachPhotos should have linked it
    const [entry] = await listEntries();
    expect(entry.id).toBe(id);
    expect(entry.species).toEqual(['Rainbow trout', 'Brown trout']);
    expect(entry.technique).toBe('Nymphing');
    expect(entry.caughtCount).toBe(5);
    expect(entry.releasedCount).toBe(5);
    expect(entry.photoIds).toEqual([photoId]);
    expect(entry.entryKind).toBe('trip-log');
    // The staged photo is now attached to the entry.
    const [photo] = await listPhotosForEntry(id);
    expect(photo.id).toBe(photoId);
  });

  it('never lets a later save rewrite the conditions snapshot (capture-once)', async () => {
    const first = conditionsCaptureFrom(snapshot({ fetchedAt: '2026-09-30T08:00:00Z' }));
    const second = conditionsCaptureFrom(
      snapshot({
        fetchedAt: '2026-09-30T12:00:00Z',
        readings: [{ gaugeId: '03451500', timestamp: '2026-09-30T12:00:00Z', cfs: 400, tempC: 21 }],
      }),
    );
    expect(second.observedAt).not.toBe(first.observedAt);

    const id = await addEntry({ streamName: 'South Holston', date: '2026-09-30', conditions: first });
    await updateEntry(id, { streamName: 'South Holston', date: '2026-09-30', notes: 'edited' }, second);
    // And a plain edit (no capture) must keep it too.
    await updateEntry(id, { streamName: 'South Holston', date: '2026-09-30', notes: 'edited again' });

    const [entry] = await listEntries();
    expect(entry.conditionsSnapshot).toEqual(first.snapshot);
    expect(entry.conditionsObservedAt).toBe(first.observedAt);
  });

  it('derives the observation time from the newest reading, not the wall clock', () => {
    const capture = conditionsCaptureFrom(snapshot());
    expect(capture.observedAt).toBe(Date.parse('2026-09-30T10:00:00Z'));
  });
});

describe('logbook v2 — export/import (ADR 0012 decision 6)', () => {
  it('exports version 2 with v2 fields and no photos payload', async () => {
    await addEntry({ streamName: 'Clinch', date: '2026-09-01', species: ['Rainbow trout'], blankTrip: true });
    const exported = await buildExport();
    expect(exported.version).toBe(2);
    expect(exported.entries[0].species).toEqual(['Rainbow trout']);
    expect(exported).not.toHaveProperty('photos');
  });

  it('imports a v1 file into v2 (v2 fields stay undefined)', async () => {
    const imported = await importFromExport({
      format: 'trout-logbook',
      version: 1,
      entries: [
        { streamName: 'Old App Backup', date: '2025-04-12', notes: 'v1 era', flies: ['Adam'], createdAt: 1_700_000_000_000 },
      ],
    });
    expect(imported).toBe(1);
    const [entry] = await listEntries();
    expect(entry.notes).toBe('v1 era');
    expect(entry.species).toBeUndefined();
    expect(entry.durationMinutes).toBeUndefined();
    expect(entry.entryKind).toBeUndefined();
    expect(entry.conditionsSnapshot).toBeUndefined();
  });

  it.each(['entries', 'full'] as const)('preserves captured conditions with unknown observation age in a %s backup', async (format) => {
    const capture = conditionsCaptureFrom(snapshot({ readings: [] }));
    await addEntry({ streamName: 'Unknown observation', date: '2026-09-30', conditions: capture });
    const backup = format === 'entries' ? await buildExport() : await buildFullBackup();
    await db.logbook.clear();
    expect(await importFromExport(JSON.parse(JSON.stringify(backup)))).toBe(1);
    const [entry] = await listEntries();
    expect(entry.conditionsSnapshot).toEqual(capture.snapshot);
    expect(entry.conditionsObservedAt).toBeUndefined();
  });

  it.each([
    [{ tripId: 'plan-a' }, { tripId: 'plan-b' }],
    [{ flies: ['Adams'] }, { flies: ['Midge'] }],
  ])('keeps distinct visits with the same water/date/notes and creation clock', async (first, second) => {
    const shared = { streamName: 'Caney Fork River', date: '2026-09-30', notes: '', createdAt: 1234 };
    const backup = { format: 'trout-logbook', version: 2, entries: [{ ...shared, ...first }, { ...shared, ...second }] };
    expect(await importFromExport(backup)).toBe(2);
    expect(await db.logbook.count()).toBe(2);
    expect(await importFromExport(backup)).toBe(0);
  });

  it('imports a v2 export and re-imports without duplicating trips', async () => {
    await addEntry({ streamName: 'Duck River', date: '2026-09-20', durationMinutes: 120, caughtCount: 2 });
    const exported = await buildExport();
    const payload = JSON.parse(JSON.stringify(exported));

    await db.logbook.clear();
    expect(await importFromExport(payload)).toBe(1);
    expect(await importFromExport(payload)).toBe(0); // same water/date/notes/createdAt ⇒ same trip
    expect(await listEntries()).toHaveLength(1);
    const [entry] = await listEntries();
    expect(entry.durationMinutes).toBe(120);
  });

  it('rejects unsupported future versions', async () => {
    await expect(
      importFromExport({ format: 'trout-logbook', version: 3, entries: [{ streamName: 'X', date: '2026-01-01' }] }),
    ).rejects.toThrow('Unsupported logbook export version');
  });

  it('sanitizes v2 fields instead of trusting the file', async () => {
    const imported = await importFromExport({
      format: 'trout-logbook',
      version: 2,
      entries: [
        {
          streamName: 'Shady',
          date: '2026-08-01',
          time: '25:99',
          durationMinutes: -5,
          caughtCount: 'lots',
          releasedCount: 2.7,
          blankTrip: 'yes',
          species: 'Rainbow',
          entryKind: 'provider-data',
          photoIds: 'p1',
        },
        {
          streamName: 'Clean',
          date: '2026-08-02',
          time: '7:05',
          durationMinutes: 90.4,
          caughtCount: 3,
          blankTrip: true,
          species: ['Rainbow trout', 42],
          entryKind: 'personal-observation',
          photoIds: ['p1', 7],
          conditionsSnapshot: { whatever: 'the site showed' },
          conditionsObservedAt: 1_700_000_000,
        },
      ],
    });
    expect(imported).toBe(2); // 'Shady' survives with its junk fields stripped; 'Clean' keeps sane v2 values
    const [entry, shady] = await listEntries();
    expect(entry.streamName).toBe('Clean');
    expect(entry.time).toBe('7:05');
    expect(entry.durationMinutes).toBe(90);
    expect(entry.caughtCount).toBe(3);
    expect(entry.blankTrip).toBe(true);
    expect(entry.species).toEqual(['Rainbow trout']);
    expect(entry.entryKind).toBe('personal-observation');
    expect(entry.photoIds).toBeUndefined(); // entries-only import carries no photo blobs
    expect(entry.conditionsSnapshot).toEqual({ whatever: 'the site showed' });
    expect(entry.conditionsObservedAt).toBe(1_700_000_000);
    // 'Shady' kept its identity but every malformed v2 field was dropped.
    expect(shady.time).toBeUndefined(); // 25:99 is not a time of day
    expect(shady.durationMinutes).toBeUndefined();
    expect(shady.caughtCount).toBeUndefined();
    expect(shady.releasedCount).toBe(3); // fractional counts round, they don't vanish
    expect(shady.blankTrip).toBeUndefined();
    expect(shady.species).toBeUndefined();
    expect(shady.entryKind).toBeUndefined();
    expect(shady.photoIds).toBeUndefined();
  });

  it('carries photo blobs only in a full backup and restores them', async () => {
    const photoId = await addPhoto(new Blob([new Uint8Array(512)], { type: 'image/jpeg' }), { compress: fakeCompress });
    const originalId = await addEntry({ streamName: 'Elk River', date: '2026-09-15', photoIds: [photoId] });

    const entriesExport = await buildExport();
    expect(entriesExport).not.toHaveProperty('photos');

    const backup = await buildFullBackup();
    expect(backup.format).toBe('trout-logbook-full-backup');
    expect(backup.includesPhotos).toBe(true);
    expect(backup.photos).toHaveLength(1);

    await db.logbook.clear();
    await db.photos.clear();
    const restored = await importFromExport(JSON.parse(JSON.stringify(backup)));
    expect(restored).toBe(1);
    const [entry] = await listEntries();
    expect(entry.photoIds).toEqual([photoId]);
    const photo = await getPhoto(photoId);
    expect(photo?.bytes).toBe(512);
    expect(entry.id).not.toBe(originalId);
    expect(await listPhotosForEntry(entry.id!)).toHaveLength(1);
    expect(await listPhotosForEntry(originalId)).toHaveLength(0);
    expect(await importFromExport(backup)).toBe(0);
    expect(await db.photos.count()).toBe(1);
  });

  it('preserves an existing photo when a backup has the same photo ID', async () => {
    const id = await addPhoto(new Blob(['original'], { type: 'image/jpeg' }), { compress: fakeCompress });
    const original = await addEntry({ streamName: 'Original', date: '2026-09-01', photoIds: [id] });
    const backup = { format: 'trout-logbook-full-backup', version: 2,
      entries: [{ id: 999, streamName: 'Restored', date: '2026-09-02', createdAt: 123, photoIds: [id] }],
      photos: [{ id, logEntryId: 999, mime: 'image/jpeg', data: btoa('restored'), createdAt: 123 }] };
    expect(await importFromExport(backup)).toBe(1);
    const restored = (await listEntries()).find((entry) => entry.streamName === 'Restored')!;
    expect(restored.photoIds).not.toContain(id);
    expect((await getPhoto(id))?.logEntryId).toBe(original);
    expect((await getPhoto(id))?.bytes).toBe(8);
    expect(await listPhotosForEntry(restored.id!)).toHaveLength(1);
    expect(await importFromExport(backup)).toBe(0);
    expect(await db.photos.count()).toBe(2);
  });

  it('rejects future full-backup versions and invalid calendar dates', async () => {
    await expect(importFromExport({ format: 'trout-logbook-full-backup', version: 99, entries: [] })).rejects.toThrow('Unsupported');
    expect(await importFromExport({ format: 'trout-logbook', version: 2, entries: [null, { streamName: 'Invalid', date: '2026-02-30' }] })).toBe(0);
  });

  it('rolls back entries and photos together on a storage failure', async () => {
    const backup = { format: 'trout-logbook-full-backup', version: 2,
      entries: [{ id: 1, streamName: 'Restored', date: '2026-09-02', photoIds: ['p'] }],
      photos: [{ id: 'p', logEntryId: 1, mime: 'image/jpeg', data: btoa('restored') }] };
    const failure = vi.spyOn(db.photos, 'add').mockRejectedValueOnce(new Error('QuotaExceededError'));
    await expect(importFromExport(backup)).rejects.toThrow('Quota');
    failure.mockRestore();
    expect(await db.logbook.count()).toBe(0);
    expect(await db.photos.count()).toBe(0);
  });
});

describe('logbook v2 — search, filters, summaries', () => {
  it('filters by water text, species, and date range', async () => {
    await addEntry({ streamId: 'south-holston', streamName: 'South Holston River', date: '2026-08-21', species: ['Rainbow trout'] });
    await addEntry({ streamName: 'Watauga River', date: '2026-08-28', species: ['Brown trout'], notes: 'sulphur hatch' });
    await addEntry({ streamName: 'Elk River', date: '2026-09-05' });
    const entries = await listEntries();

    expect(filterEntries(entries, { query: 'holston' }).map((e) => e.streamName)).toEqual(['South Holston River']);
    expect(filterEntries(entries, { query: 'south-holston' }).map((e) => e.streamName)).toEqual(['South Holston River']);
    expect(filterEntries(entries, { query: 'sulphur' }).map((e) => e.streamName)).toEqual(['Watauga River']);
    expect(filterEntries(entries, { species: 'brown TROUT' }).map((e) => e.streamName)).toEqual(['Watauga River']);
    expect(filterEntries(entries, { from: '2026-08-25', to: '2026-09-01' }).map((e) => e.streamName)).toEqual(['Watauga River']);
    // Multi-token: every token must hit somewhere (name, species, notes…).
    expect(filterEntries(entries, { query: 'river trout' }).map((e) => e.streamName)).toEqual(['Watauga River', 'South Holston River']);
  });

  it('summarizes effort and species with blank trips and no-catch entries kept honest', () => {
    const base = { notes: '', flies: [], createdAt: 1, updatedAt: 1 };
    const summary = summarizeEntries([
      { ...base, streamName: 'A', date: '2026-09-01', durationMinutes: 90, caughtCount: 2, releasedCount: 2, species: ['Rainbow trout'] },
      { ...base, streamName: 'B', date: '2026-09-02', blankTrip: true, durationMinutes: 60 },
      { ...base, streamName: 'C', date: '2026-09-03' }, // effort logged later, but no counts at all
      { ...base, streamName: 'D', date: '2026-09-04', species: ['rainbow trout'] },
    ]);
    expect(summary.totalTrips).toBe(4); // blank trips are trips
    expect(summary.blankTrips).toBe(1);
    expect(summary.effortEntries).toBe(2);
    expect(summary.effortHours).toBe(2.5);
    expect(summary.entriesWithRecordedCatch).toBe(1);
    expect(summary.entriesWithoutCatchRecorded).toBe(2); // C and D — not zero catch, just not recorded
    expect(summary.caughtTotal).toBe(2);
    expect(summary.speciesTally).toEqual([{ species: 'Rainbow trout', count: 2 }]); // case-insensitive merge
  });
});

describe('logbook v2 — photo lifecycle', () => {
  it('prunes photoIds and deletes the record when a photo is removed', async () => {
    const a = await addPhoto(new Blob([new Uint8Array(8)], { type: 'image/jpeg' }), { compress: fakeCompress });
    const b = await addPhoto(new Blob([new Uint8Array(9)], { type: 'image/jpeg' }), { compress: fakeCompress });
    const id = await addEntry({ streamName: 'Caney Fork', date: '2026-09-10', photoIds: [a, b] });

    await removePhotoFromEntry(id, a);
    const [entry] = await listEntries();
    expect(entry.photoIds).toEqual([b]);
    expect(await getPhoto(a)).toBeUndefined();
    expect(await listPhotosForEntry(id)).toHaveLength(1);
  });

  it('deleting an entry removes its photos', async () => {
    const photoId = await addPhoto(new Blob([new Uint8Array(8)], { type: 'image/jpeg' }), { compress: fakeCompress });
    const id = await addEntry({ streamName: 'Holston', date: '2026-09-10', photoIds: [photoId] });
    await deleteEntryAndPhotos(id);
    expect(await listEntries()).toHaveLength(0);
    expect(await getPhoto(photoId)).toBeUndefined();
  });

  it('sweeps staged-but-never-saved photos, never attached ones', async () => {
    const attached = await addPhoto(new Blob([new Uint8Array(8)], { type: 'image/jpeg' }), { compress: fakeCompress });
    const id = await addEntry({ streamName: 'Clinch', date: '2026-09-10', photoIds: [attached] });
    // An abandoned staging: unattached and older than the sweep window.
    const abandoned = await addPhoto(new Blob([new Uint8Array(9)], { type: 'image/jpeg' }), { compress: fakeCompress });
    await db.photos.put({ ...(await getPhoto(abandoned))!, logEntryId: undefined, createdAt: Date.now() - 48 * 60 * 60 * 1000 });

    const swept = await sweepUnattachedPhotos(24 * 60 * 60 * 1000);
    expect(swept).toBe(1);
    expect(await getPhoto(abandoned)).toBeUndefined();
    expect(await getPhoto(attached)).toBeDefined();
    expect((await listEntries())[0].id).toBe(id);
  });
});
