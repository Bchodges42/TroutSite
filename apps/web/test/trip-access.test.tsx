import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { db } from '../src/lib/db';
import { createTrip, getTrip, setTripAccessPoint } from '../src/lib/trips';
import { TripAccessPicker } from '../src/features/trips/TripAccessPicker';
const record = { id: 'little-river-metcalf-bottoms-parking', waterId: 'little-river', name: 'Metcalf Bottoms', kind: 'parking',
  verificationMethod: 'official-source', officialSource: { url: 'https://www.nps.gov/places/metcalf-bottoms-picnic-area.htm', publisher: 'NPS', retrievedAt: '2026-10-01' },
  reviewDate: '2026-10-01', uncertainty: 'No field visit or coordinates verified', notes: 'Officially listed parking by Little River' };
let client: QueryClient;
beforeEach(async () => { await db.trips.clear(); await db.snapshots.clear(); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); vi.unstubAllGlobals(); });
function LivePicker({ id }: { id: string }) {
  const trip = useLiveQuery(() => getTrip(id), [id]);
  return trip ? <TripAccessPicker trip={trip} /> : null;
}
it('persists concurrent choices, rejects foreign waters and removes retired choices without losing the plan', async () => {
  const trip = await createTrip({ title: 'Smokies', waterIds: ['little-river'], notes: 'Private note' });
  await Promise.all([setTripAccessPoint(trip.id, record, true), setTripAccessPoint(trip.id, { id: 'second-parking', waterId: 'little-river' }, true)]);
  expect((await getTrip(trip.id))?.accessPointIds).toEqual(expect.arrayContaining([record.id, 'second-parking']));
  await expect(setTripAccessPoint(trip.id, { id: 'foreign-parking', waterId: 'another-water' }, true)).rejects.toThrow(/water in this trip/);
  await setTripAccessPoint(trip.id, { id: 'second-parking', waterId: '' }, false);
  expect((await getTrip(trip.id))?.notes).toBe('Private note');
  expect((await getTrip(trip.id))?.accessPointIds).toEqual([record.id]);
});
it('shows scoped source review, saves a choice and recalls it offline from the real snapshot cache', async () => {
  const trip = await createTrip({ title: 'Smokies', waterIds: ['little-river'] });
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ records: [{ waterId: 'little-river', access: [record] },
    { waterId: 'another-water', access: [{ ...record, id: 'foreign-parking', waterId: 'another-water', name: 'Other parking' }] }] }), { headers: { 'content-type': 'application/json' } })));
  render(<QueryClientProvider client={client}><LivePicker id={trip.id} /></QueryClientProvider>);
  const choice = await screen.findByRole('checkbox', { name: 'Use Metcalf Bottoms' });
  expect(screen.queryByRole('checkbox', { name: 'Use Other parking' })).not.toBeInTheDocument();
  await userEvent.click(choice);
  await waitFor(() => expect(choice).toBeChecked());
  await userEvent.click(screen.getByText('Source and access details for Metcalf Bottoms'));
  expect(screen.getByText(/Official source reviewed/)).toBeInTheDocument();
  cleanup(); client.clear(); vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  render(<QueryClientProvider client={client}><LivePicker id={trip.id} /></QueryClientProvider>);
  expect(await screen.findByRole('checkbox', { name: 'Use Metcalf Bottoms' })).toBeChecked();
});
it('retains missing published IDs explicitly and lets the visitor remove them', async () => {
  const trip = await createTrip({ title: 'Smokies', waterIds: ['little-river'] });
  await setTripAccessPoint(trip.id, record, true);
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"records":[]}', { headers: { 'content-type': 'application/json' } })));
  render(<QueryClientProvider client={client}><LivePicker id={trip.id} /></QueryClientProvider>);
  const remove = await screen.findByRole('button', { name: `Remove saved access ${record.id}` });
  expect(screen.getByText(/This does not confirm a closure/)).toBeInTheDocument();
  await userEvent.click(remove);
  await waitFor(async () => expect((await getTrip(trip.id))?.accessPointIds).toEqual([]));
});
