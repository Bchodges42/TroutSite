import { useEffect, useState } from 'react';
import type { AccessRecord } from '@trout/contracts';
import type { TripRecord } from '../../lib/db';
import { setTripAccessPoint } from '../../lib/trips';
import { AccessCard, useAllAccessRecords } from '../waters/AccessSection';

export function TripAccessPicker({ trip }: { trip: TripRecord }) {
  const query = useAllAccessRecords(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [pending, setPending] = useState<{ id: string; checked: boolean } | null>(null);
  useEffect(() => {
    if (pending && (trip.accessPointIds ?? []).includes(pending.id) === pending.checked) setPending(null);
  }, [trip.accessPointIds, pending]);
  const selected = new Set(trip.accessPointIds ?? []);
  if (pending) { if (pending.checked) selected.add(pending.id); else selected.delete(pending.id); }
  const available = query.data?.filter((record) => trip.waterIds.includes(record.waterId)) ?? [];
  const unavailable = query.data ? [...selected].filter((id) => !available.some((record) => record.id === id)) : [];
  async function choose(record: Pick<AccessRecord, 'id' | 'waterId'>, checked: boolean) {
    setBusy(true); setMessage(''); setPending({ id: record.id, checked });
    try { await setTripAccessPoint(trip.id, record, checked); setMessage(checked ? 'Access choice saved on this device.' : 'Access choice removed.'); }
    catch (error) { setPending(null); setMessage(error instanceof Error ? error.message : 'Access choice could not be saved.'); }
    finally { setBusy(false); }
  }
  return <section aria-label={`Access choices for ${trip.title}`}>
    <h4 className="text-xs font-bold uppercase tracking-wide muted">Access choices</h4>
    <p className="muted text-sm mt-1">Choose specific published records for this plan. Choices stay on this device. Review the source and current closures before leaving; source review does not confirm conditions on the ground.</p>
    {query.isPending ? <p className="muted text-sm">Loading access records…</p>
      : query.isError ? <p role="status">Access records could not be loaded. Your {selected.size} saved choices are retained. Connect once to save the access guide for offline use.</p>
        : <>
          {available.length === 0 && <p className="muted text-sm">No sourced access records for these waters yet. A stocking location does not establish public access.</p>}
          {available.map((record) => <div key={record.id} className="mt-3">
            <label className="flex items-center gap-2 min-h-[44px] text-sm">
              <input type="checkbox" disabled={busy} checked={selected.has(record.id)} onChange={(event) => void choose(record, event.target.checked)} />
              {`Use ${record.name ?? record.reach ?? record.id}`}
            </label>
            <details><summary className="focus-ring min-h-[44px] text-sm">Source and access details for {record.name ?? record.id}</summary><AccessCard record={record} /></details>
          </div>)}
          {unavailable.map((id) => <div key={id} className="mt-2 text-sm">
            <p>Saved access {id} is no longer available for these waters. This does not confirm a closure.</p>
            <button type="button" disabled={busy} className="focus-ring text-action min-h-[44px]" onClick={() => void choose({ id, waterId: '' }, false)}>Remove saved access {id}</button>
          </div>)}
        </>}
    {message && <p role="status" className="text-sm mt-2">{message}</p>}
  </section>;
}
