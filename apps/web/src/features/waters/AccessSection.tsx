import { useState } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { AccessPackSchema, type AccessRecord } from '@trout/contracts';
import { EmptyState, cx } from '@trout/ui';
import { fetchSnapshot } from '../../lib/snapshots';

/**
 * Source-reviewed access records for one water (ADR 0019).
 *
 * Honesty rules baked in:
 * - Official-source review is labelled separately from an on-site visit.
 *   "No records" is a real, stated answer — the
 *   empty state names it and reminds the visitor that stocking markers are
 *   NOT verified public access points.
 * - Every record cites its official source ("Verify with <publisher>"),
 *   carries its review date, and shows `uncertainty` prominently when present.
 * - External actions are the VISITOR's choice: "Open directions" is a plain
 *   link to a maps URL built client-side — clicked, never auto-opened. The
 *   copy button writes to the clipboard only on click.
 * - Works offline: /content/access.json rides the precached content pack and
 *   is read through the same fetchSnapshot recovery tiers as taxa/patterns.
 * - A failed load is never rendered as "no access" — it gets its own state.
 */

export const ACCESS_PACK_URL = '/content/access.json';
const ACCESS_TTL_MIN = 7 * 24 * 60; // content is static between content-pack builds

export type { AccessRecord } from '@trout/contracts';

const KIND_LABEL: Record<AccessRecord['kind'], string> = {
  parking: 'Parking',
  'boat-ramp': 'Boat ramp',
  'public-entry': 'Public entry',
  'accessible-facility': 'Accessible facility',
  'walk-in': 'Walk-in',
};

/** Directions are a link the visitor clicks — never an auto-opened window. */
export function directionsUrl(coordinates: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
}

/** Offline-first read of the precached access pack, narrowed to one water. */
export function useAllAccessRecords(): UseQueryResult<AccessRecord[]> {
  return useQuery({
    queryKey: ['content-access'],
    queryFn: async (): Promise<AccessRecord[]> => {
      const snap = await fetchSnapshot(ACCESS_PACK_URL, AccessPackSchema, ACCESS_TTL_MIN);
      return snap.data.records.flatMap((group) => group.access);
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: 'offlineFirst',
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useAccessRecords(waterId: string): UseQueryResult<AccessRecord[]> {
  const query = useAllAccessRecords();
  return { ...query, data: query.data?.filter((record) => record.waterId === waterId) } as UseQueryResult<AccessRecord[]>;
}

export interface AccessSectionProps {
  waterId: string;
  className?: string;
}

export function AccessSection({ waterId, className }: AccessSectionProps) {
  const query = useAccessRecords(waterId);
  const records = query.data;

  return (
    <section
      className={cx('detail-section', 'access-section', className)}
      aria-label="Sourced access"
      data-testid="access-section"
    >
      <p className="eyebrow">Sourced access</p>
      <h3>Parking, ramps, and public entries</h3>

      {query.isPending && <p className="muted">Loading access information…</p>}

      {!query.isPending && query.isError && (
        <EmptyState
          title="Access information could not be loaded"
          description="This device has no saved copy of the access pack yet. Reopen once while connected to save it for offline use."
        />
      )}

      {!query.isPending && !query.isError && records && records.length === 0 && (
        <EmptyState
          title="No sourced access records for this water yet"
          description="Stocking markers are not verified public access points."
        />
      )}

      {!query.isPending && !query.isError && records && records.length > 0 && (
        <ul className="access-records mt-2">
          {records.map((record) => (
            <li key={record.id}>
              <AccessCard record={record} />
            </li>
          ))}
        </ul>
      )}

      {records && records.length > 0 && (
        <p className="muted text-xs mt-3">
          Each record states its review method. Official-source review does not confirm current
          on-site conditions. Absence here is not information about whether access exists.
        </p>
      )}
    </section>
  );
}

export function AccessCard({ record }: { record: AccessRecord }) {
  const [copied, setCopied] = useState(false);
  const coords = record.coordinates
    ? `${record.coordinates.lat}, ${record.coordinates.lng}`
    : null;

  const copyCoordinates = async () => {
    if (!coords || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(coords);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="access-record mt-2" data-testid="access-record" data-kind={record.kind}>
      <header className="flex items-baseline justify-between gap-2">
        <strong>{record.name ?? KIND_LABEL[record.kind]}</strong>
        {record.reach && <span className="muted text-xs">{record.reach}</span>}
      </header>

      {record.notes && <p className="text-sm mt-1">{record.notes}</p>}

      {coords && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="text-xs">{coords}</code>
          <button type="button" className="text-action" onClick={() => void copyCoordinates()}>
            {copied ? 'Copied' : 'Copy coordinates'}
          </button>
          <a
            className="text-action"
            href={directionsUrl(record.coordinates!)}
            target="_blank"
            rel="noreferrer"
          >
            Open directions ↗
          </a>
        </div>
      )}

      {(record.fee || record.hours || record.closure) && (
        <ul className="muted text-xs mt-2">
          {record.fee && (
            <li>
              Fee: {record.fee.amount}
              {record.fee.notes ? ` — ${record.fee.notes}` : ''}
            </li>
          )}
          {record.hours && <li>Hours: {record.hours}</li>}
          {record.closure && (
            <li>
              Closure: {record.closure.window}
              {record.closure.notes ? ` — ${record.closure.notes}` : ''}
            </li>
          )}
        </ul>
      )}

      {record.uncertainty && (
        <div className="empty-note mt-2" role="note" aria-label="Uncertainty" data-testid="access-uncertainty">
          <strong>Uncertainty</strong>
          <p>{record.uncertainty}</p>
        </div>
      )}

      <footer className="mt-2">
        <span className="muted text-xs">{record.verificationMethod === 'field-visit' ? 'Field visit reviewed' : 'Official source reviewed'} {record.reviewDate} · </span>
        <a
          className="text-action"
          href={record.officialSource.url}
          target="_blank"
          rel="noreferrer"
        >
          Verify with {record.officialSource.publisher} ↗
        </a>
      </footer>
    </article>
  );
}
