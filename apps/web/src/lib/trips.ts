import { db, type TripChecklistItem, type TripRecord } from './db';
import type { AccessRecord } from '@trout/contracts';

/**
 * Trip planner store (ADR 0012): private, on-device trips that tie together
 * saved waters, a checklist, offline packs and chosen access
 * points. A completed trip is one that was recorded into the logbook — the
 * plan itself is never rewritten by that act beyond the completedAt stamp.
 */

export const TRIP_STARTER_CHECKLIST: Array<Omit<TripChecklistItem, 'id'>> = [
  { label: 'Check regulations for each water', done: false },
  { label: 'Verify latest conditions before leaving', done: false },
  { label: 'Pack tackle and flies', done: false },
];

export async function createTrip(input: {
  title: string;
  date?: string;
  waterIds?: string[];
  species?: string[];
  notes?: string;
}): Promise<TripRecord> {
  const now = Date.now();
  const trip: TripRecord = {
    id: newTripId(),
    title: input.title.trim() || 'Fishing trip',
    date: input.date,
    waterIds: input.waterIds ?? [],
    species: input.species,
    checklist: TRIP_STARTER_CHECKLIST.map((item, i) => ({ ...item, id: `c${i}` })),
    notes: input.notes,
    packStatus: 'none',
    createdAt: now,
    updatedAt: now,
  };
  await db.trips.put(trip);
  return trip;
}

export async function getTrip(id: string): Promise<TripRecord | undefined> {
  return db.trips.get(id);
}

/** Planned trips first (soonest date), completed trips last, then newest-created. */
export async function listTrips(): Promise<TripRecord[]> {
  const all = await db.trips.toArray();
  return all.sort((a, b) => {
    if (!!a.completedAt !== !!b.completedAt) return a.completedAt ? 1 : -1;
    if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
    if (!!a.date !== !!b.date) return a.date ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}

export async function updateTrip(id: string, patch: Partial<Omit<TripRecord, 'id' | 'createdAt'>>): Promise<void> {
  return db.transaction('rw', db.trips, async () => {
  const trip = await db.trips.get(id);
  if (!trip) return;
  await db.trips.put({ ...trip, ...patch, id, createdAt: trip.createdAt, updatedAt: Date.now() });
  });
}

/** Save each visited water to the logbook and mark completion in one transaction. */
export async function completeTrip(id: string, waterNames: ReadonlyMap<string, string> = new Map()): Promise<void> {
  await db.transaction('rw', db.trips, db.logbook, async () => {
    const trip = await db.trips.get(id);
    if (!trip) throw new Error('This trip no longer exists.');
    if (!trip.waterIds.length) throw new Error('Add a water before recording this trip.');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const date = trip.date || today;
    if (date > today) throw new Error('Set the actual trip date before recording a future plan.');
    const recorded = (await db.logbook.toArray()).some((entry) => entry.tripId === id);
    if (!recorded) {
      for (const waterId of new Set(trip.waterIds)) {
        await db.logbook.add({
          tripId: id, streamId: waterId, streamName: waterNames.get(waterId) ?? waterId,
          date, notes: trip.notes ?? '', species: trip.species, flies: [], entryKind: 'trip-log',
          createdAt: now.getTime(), updatedAt: now.getTime(),
        });
      }
    }
    await db.trips.put({ ...trip, completedAt: trip.completedAt ?? now.getTime(), updatedAt: now.getTime() });
  });
}

export async function deleteTrip(id: string): Promise<void> {
  await db.trips.delete(id);
}

/** Merge against the latest plan so simultaneous access choices do not overwrite each other. */
export async function setTripAccessPoint(id: string, record: Pick<AccessRecord, 'id' | 'waterId'>, selected: boolean): Promise<void> {
  await db.transaction('rw', db.trips, async () => {
    const trip = await db.trips.get(id);
    if (!trip) throw new Error('This trip no longer exists.');
    if (selected && (!trip.waterIds.includes(record.waterId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id) || record.id.startsWith('example-'))) {
      throw new Error('Choose an access record for a water in this trip.');
    }
    const points = new Set(trip.accessPointIds ?? []);
    if (selected) points.add(record.id); else points.delete(record.id);
    if (points.size > 100) throw new Error('This trip has reached its access-selection limit.');
    await db.trips.put({ ...trip, accessPointIds: [...points], updatedAt: Date.now() });
  });
}

export async function addChecklistItem(id: string, label: string): Promise<void> {
  return db.transaction('rw', db.trips, async () => {
  const trip = await db.trips.get(id);
  if (!trip || !label.trim()) return;
  const item: TripChecklistItem = { id: `c${Date.now()}-${trip.checklist.length}`, label: label.trim(), done: false };
  await updateTrip(id, { checklist: [...trip.checklist, item] });
  });
}

export async function toggleChecklistItem(id: string, itemId: string): Promise<void> {
  return db.transaction('rw', db.trips, async () => {
  const trip = await db.trips.get(id);
  if (!trip) return;
  await updateTrip(id, {
    checklist: trip.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
  });
  });
}

export async function removeChecklistItem(id: string, itemId: string): Promise<void> {
  return db.transaction('rw', db.trips, async () => {
  const trip = await db.trips.get(id);
  if (!trip) return;
  await updateTrip(id, { checklist: trip.checklist.filter((item) => item.id !== itemId) });
  });
}

/** A trip is ready offline when every required pack section is verified present. */
export function tripPackStatus(manifests: { requiredReady: boolean; anyReady: boolean }[]): 'none' | 'partial' | 'ready' {
  if (manifests.length === 0) return 'none';
  if (manifests.every((m) => m.requiredReady)) return 'ready';
  return manifests.some((m) => m.anyReady) ? 'partial' : 'none';
}

function newTripId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
