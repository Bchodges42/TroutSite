import { db, type SavedWaterRecord, type WaterGroupRecord } from './db';

/**
 * My Waters store (ADR 0012): explicitly saved favorites keyed by stable
 * catalog water id, with optional private groups. Deliberately separate from
 * the `seen` table — saving is an act, viewing is not. Everything here is
 * on-device only; UI-independent helpers so Vitest exercises the same code
 * path the page uses.
 */

export async function isSaved(waterId: string): Promise<boolean> {
  return (await db.savedWaters.get(waterId)) !== undefined;
}

export async function saveWater(input: {
  waterId: string;
  name: string;
  regionId?: string;
  groupIds?: string[];
}): Promise<void> {
  const existing = await db.savedWaters.get(input.waterId);
  const record: SavedWaterRecord = {
    waterId: input.waterId,
    nameSnapshot: input.name,
    regionIdSnapshot: input.regionId ?? existing?.regionIdSnapshot,
    savedAt: existing?.savedAt ?? Date.now(),
    groupIds: input.groupIds ?? existing?.groupIds ?? [],
  };
  await db.savedWaters.put(record);
}

export async function unsaveWater(waterId: string): Promise<void> {
  await db.savedWaters.delete(waterId);
}

/** Returns the water's saved state after the toggle. */
export async function toggleSaved(input: {
  waterId: string;
  name: string;
  regionId?: string;
}): Promise<boolean> {
  if (await isSaved(input.waterId)) {
    await unsaveWater(input.waterId);
    return false;
  }
  await saveWater(input);
  return true;
}

/** Saved waters, newest save first. Retired catalog ids stay in the list. */
export async function listSaved(): Promise<SavedWaterRecord[]> {
  const all = await db.savedWaters.toArray();
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function setWaterGroups(waterId: string, groupIds: string[]): Promise<void> {
  const record = await db.savedWaters.get(waterId);
  if (!record) return;
  await db.savedWaters.put({ ...record, groupIds });
}

/** Toggle one membership against the stored row, preserving simultaneous changes. */
export async function setWaterGroupMembership(waterId: string, groupId: string, member: boolean): Promise<void> {
  return db.transaction('rw', db.savedWaters, async () => {
    const record = await db.savedWaters.get(waterId);
    if (!record) return;
    const ids = new Set(record.groupIds);
    if (member) ids.add(groupId); else ids.delete(groupId);
    await db.savedWaters.put({ ...record, groupIds: [...ids] });
  });
}

export async function createGroup(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Group name is required');
  const count = await db.waterGroups.count();
  const group: WaterGroupRecord = {
    id: newGroupId(),
    name: trimmed,
    createdAt: Date.now(),
    sortOrder: count,
  };
  await db.waterGroups.put(group);
  return group.id;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  const group = await db.waterGroups.get(id);
  if (!group || !name.trim()) return;
  await db.waterGroups.put({ ...group, name: name.trim() });
}

/** Deleting a group never deletes the waters — membership is pulled, saves remain. */
export async function deleteGroup(id: string): Promise<void> {
  return db.transaction('rw', db.waterGroups, db.savedWaters, async () => {
  await db.waterGroups.delete(id);
  const members = await db.savedWaters.where('groupIds').equals(id).toArray();
  await Promise.all(
    members.map((m) => db.savedWaters.put({ ...m, groupIds: m.groupIds.filter((g) => g !== id) })),
  );
  });
}

export async function listGroups(): Promise<WaterGroupRecord[]> {
  const all = await db.waterGroups.toArray();
  return all.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);
}

/** Test seam kept private; crypto.randomUUID is unavailable in some jsdom runs. */
function newGroupId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
