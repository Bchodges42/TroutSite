import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SettingsProvider, useSettingsContext } from '../src/lib/settings';
import { db } from '../src/lib/db';

/**
 * Settings render defaults until IndexedDB loads. A write fired in that window
 * (the map syncs a shared ?species= link on mount) must merge into the STORED
 * preferences, never overwrite them with defaults.
 */
function WriteOnMount() {
  const { update } = useSettingsContext();
  useEffect(() => {
    update({ speciesMode: 'all' });
  }, []);
  return null;
}

beforeEach(async () => {
  await db.settings.clear();
  await db.settings.put({ key: 'app', value: { tempUnit: 'C', showGauges: true } });
});
afterEach(cleanup);

describe('settings update', () => {
  it('keeps saved preferences when a write lands before settings load', async () => {
    render(
      <SettingsProvider>
        <WriteOnMount />
      </SettingsProvider>,
    );
    await vi.waitFor(async () => {
      const row = await db.settings.get('app');
      expect(row?.value).toMatchObject({ speciesMode: 'all', tempUnit: 'C', showGauges: true });
    });
  });
});
