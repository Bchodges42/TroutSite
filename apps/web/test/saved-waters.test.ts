import { beforeEach, describe, expect, it } from 'vitest';
import {
  createGroup,
  deleteGroup,
  isSaved,
  listGroups,
  listSaved,
  renameGroup,
  saveWater,
  setWaterGroups,
  toggleSaved,
  unsaveWater,
} from '../src/lib/savedWaters';
import { db } from '../src/lib/db';

beforeEach(async () => {
  await Promise.all([db.savedWaters.clear(), db.waterGroups.clear()]);
});

describe('saved waters store (My Waters, ADR 0012)', () => {
  it('saves, detects, and unsaves a water', async () => {
    expect(await isSaved('harpeth-river')).toBe(false);
    await saveWater({ waterId: 'harpeth-river', name: 'Harpeth River' });
    expect(await isSaved('harpeth-river')).toBe(true);
    await unsaveWater('harpeth-river');
    expect(await isSaved('harpeth-river')).toBe(false);
  });

  it('toggle returns the new state each way', async () => {
    expect(await toggleSaved({ waterId: 'caney-fork', name: 'Caney Fork River' })).toBe(true);
    expect(await toggleSaved({ waterId: 'caney-fork', name: 'Caney Fork River' })).toBe(false);
    expect(await listSaved()).toHaveLength(0);
  });

  it('re-saving is idempotent and keeps the original savedAt (stable ordering)', async () => {
    await saveWater({ waterId: 'a', name: 'Water A' });
    const first = (await listSaved())[0];
    await saveWater({ waterId: 'a', name: 'Water A (renamed)' });
    const again = (await listSaved())[0];
    expect(again.savedAt).toBe(first.savedAt);
    expect(again.nameSnapshot).toBe('Water A (renamed)');
  });

  it('lists newest saves first and keeps retired catalog ids visible as saved history', async () => {
    await saveWater({ waterId: 'old-water', name: 'Old Water', regionId: 'west' });
    await saveWater({ waterId: 'new-water', name: 'New Water' });
    const all = await listSaved();
    expect(all.map((s) => s.waterId)).toEqual(['new-water', 'old-water']);
    expect(all[1].nameSnapshot).toBe('Old Water');
  });

  it('groups are private buckets; deleting one pulls membership but never deletes saves', async () => {
    const weekend = await createGroup('Weekend');
    const local = await createGroup('Local');
    await saveWater({ waterId: 'harpeth-river', name: 'Harpeth River', groupIds: [weekend, local] });
    await setWaterGroups('harpeth-river', [weekend, local]);

    expect((await listGroups()).map((g) => g.name)).toEqual(['Weekend', 'Local']);
    await deleteGroup(weekend);
    expect((await listGroups()).map((g) => g.id)).toEqual([local]);
    const still = await listSaved();
    expect(still).toHaveLength(1);
    expect(still[0].groupIds).toEqual([local]);
  });

  it('renames a group; empty group names are rejected', async () => {
    const id = await createGroup('  Weekend ');
    expect((await listGroups())[0].name).toBe('Weekend');
    await renameGroup(id, '  Day trips ');
    expect((await listGroups())[0].name).toBe('Day trips');
    await expect(createGroup('   ')).rejects.toThrow();
  });
});
