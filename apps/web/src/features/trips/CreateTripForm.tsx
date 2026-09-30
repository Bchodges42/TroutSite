import { useState, type FormEvent } from 'react';
import type { Stream } from '@trout/contracts';
import { Button } from '@trout/ui';
import type { TripRecord } from '../../lib/db';
import { createTrip } from '../../lib/trips';
import { parseList } from './tripPlan';

/** Values handed over from another surface via /trips?waters=&title=&date=. */
export interface TripPrefill {
  title: string;
  /** YYYY-MM-DD or ''. */
  date: string;
  waterIds: string[];
}

export const EMPTY_TRIP_PREFILL: TripPrefill = { title: '', date: '', waterIds: [] };

export function prefillFromParams(params: URLSearchParams): TripPrefill {
  return {
    title: params.get('title') ?? '',
    date: params.get('date') ?? '',
    waterIds: parseList(params.get('waters') ?? ''),
  };
}

/**
 * Create-trip form. Prefill comes from the URL handoff (compare page, water
 * cards) — read once on mount by the page and passed in as initial values.
 * Everything created here is private: it lands in this browser's Dexie only.
 */
export function CreateTripForm({
  prefill,
  streams,
  onCreated,
}: {
  prefill: TripPrefill;
  streams: Stream[];
  onCreated: (trip: TripRecord) => void;
}) {
  const [title, setTitle] = useState(prefill.title);
  const [date, setDate] = useState(prefill.date);
  const [waters, setWaters] = useState(prefill.waterIds.join(', '));
  const [species, setSpecies] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const waterIds = parseList(waters);
    const speciesList = parseList(species);
    void createTrip({
      title,
      date: date || undefined,
      waterIds,
      species: speciesList.length > 0 ? speciesList : undefined,
    })
      .then((trip) => {
        setTitle('');
        setDate('');
        setWaters('');
        setSpecies('');
        setError(null);
        onCreated(trip);
      })
      .catch(() => setError('Could not create the trip — try again.'));
  };

  const fieldClasses = 'focus-ring min-h-[40px] rounded-lg border px-3';
  const fieldStyle = { borderColor: 'var(--trout-color-border)' };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3" aria-label="Plan a new trip">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-bold">Trip name</span>
          <input
            className={fieldClasses}
            style={fieldStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Clinch weekend"
            aria-label="Trip name"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-bold">Date</span>
          <input
            type="date"
            className={fieldClasses}
            style={fieldStyle}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Trip date"
          />
        </label>
      </div>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Waters</span>
        <input
          className={fieldClasses}
          style={fieldStyle}
          value={waters}
          onChange={(e) => setWaters(e.target.value)}
          placeholder="clinch-river, holston-river"
          aria-label="Waters (comma-separated catalog ids)"
          list="trip-water-catalog"
        />
        <datalist id="trip-water-catalog">
          {streams.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </datalist>
        <span className="muted mt-1 block">
          Catalog ids, comma separated — a compare shortlist or water card fills this in for you.
        </span>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Species (optional)</span>
        <input
          className={fieldClasses}
          style={fieldStyle}
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="Rainbow trout, brown trout"
          aria-label="Species (comma separated, optional)"
        />
      </label>
      <div>
        <Button type="submit" className="focus-ring">
          Create trip
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-sm" style={{ color: 'var(--trout-color-danger)' }}>
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
