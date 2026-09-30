import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SettingsProvider, useSettingsContext } from '../src/lib/settings';
import { db } from '../src/lib/db';

/**
 * F13 (2026-09-29 audit) — rapid independent preference patches must not
 * overwrite each other. The old update() merged each patch against the
 * render-captured settings and put unconditionally, so two calls issued
 * before Dexie re-rendered left only the second patch's values.
 */

let capturedUpdate: ((patch: Parameters<ReturnType<typeof useSettingsContext>['update']>[0]) => void) | null = null;

function Capture() {
  const { update } = useSettingsContext();
  capturedUpdate = update;
  return null;
}

function renderSettings() {
  render(
    <SettingsProvider>
      <Capture />
    </SettingsProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe('settings update — serialized read-merge-put (F13)', () => {
  it('two patches issued from the same stale render both survive in the stored record', async () => {
    await db.settings.clear();
    renderSettings();
    const update = capturedUpdate!;
    // Two rapid calls from the same render state (no re-render between them):
    update({ speciesMode: 'all', speciesFocus: '' });
    update({ speciesMode: 'trout', speciesFocus: 'smallmouth' });
    // Flush the queued Dexie transactions.
    await new Promise((r) => setTimeout(r, 25));
    const row = await db.settings.get('app');
    expect(row?.value).toMatchObject({ speciesMode: 'trout', speciesFocus: 'smallmouth' });
  });

  it('a patch issued before the store loads still merges over the stored record, not defaults', async () => {
    await db.settings.put({ key: 'app', value: { tempUnit: 'C', showGauges: true } });
    renderSettings();
    capturedUpdate!({ speciesMode: 'all' });
    await new Promise((r) => setTimeout(r, 25));
    const row = await db.settings.get('app');
    // The previously stored tempUnit/showGauges are preserved — the merge
    // reads the stored record, not the render-time defaults.
    expect(row?.value).toMatchObject({ tempUnit: 'C', showGauges: true, speciesMode: 'all' });
    await db.settings.clear();
  });
});
