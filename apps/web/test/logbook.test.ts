import { beforeEach, describe, expect, it } from 'vitest';
import { addEntry, buildExport, importFromExport, listEntries } from '../src/lib/logbook';
import { db } from '../src/lib/db';

beforeEach(async () => {
  await db.logbook.clear();
});

describe('logbook store (local-only)', () => {
  it('adds and lists entries newest-date-first', async () => {
    await addEntry({ streamName: 'South Holston River', date: '2026-08-21', flies: ['Sulphur Parachute #16'], notes: 'Good afternoon rise.' });
    await addEntry({ streamName: 'Watauga River', date: '2026-08-28' });

    const entries = await listEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].streamName).toBe('Watauga River');
    expect(entries[0].flies).toEqual([]);
    expect(entries[1].notes).toBe('Good afternoon rise.');
  });

  it('export round-trips through import', async () => {
    await addEntry({ streamName: 'Clinch River', date: '2026-07-02', flies: ['Zebra Midge #20'], notes: 'Winter midge fest.' });
    const exported = await buildExport();
    expect(exported.format).toBe('trout-logbook');
    expect(exported.entries).toHaveLength(1);

    await db.logbook.clear();
    const imported = await importFromExport(JSON.parse(JSON.stringify(exported)));
    expect(imported).toBe(1);
    const entries = await listEntries();
    expect(entries[0].streamName).toBe('Clinch River');
    expect(entries[0].notes).toBe('Winter midge fest.');
  });

  it('refuses foreign payloads', async () => {
    await expect(importFromExport({ format: 'other-app' })).rejects.toThrow('Not a trout logbook export');
    await expect(importFromExport({ format: 'trout-logbook', entries: 'nope' })).rejects.toThrow();
  });

  it('sanitizes rows instead of trusting the file', async () => {
    const imported = await importFromExport({
      format: 'trout-logbook',
      version: 1,
      entries: [
        { streamName: 'Valid', date: '2026-05-01', notes: 42, flies: ['ok', 7, null] },
        { streamName: '', date: '2026-05-01' },
        { streamName: 'BadDate', date: 'not-a-date' },
        { nope: true },
      ],
    });
    expect(imported).toBe(1);
    const [entry] = await listEntries();
    expect(entry.streamName).toBe('Valid');
    expect(entry.notes).toBe('');
    expect(entry.flies).toEqual(['ok']);
  });
});
