import { Button } from '@trout/ui';
import type { EntryFilter } from '../../lib/logbook';

/** Water text search, species pick, and a date range — all local, all instant. */
export function LogbookFilters({
  filter,
  onChange,
  speciesOptions,
}: {
  filter: EntryFilter;
  onChange: (filter: EntryFilter) => void;
  speciesOptions: string[];
}) {
  const active = Boolean(filter.query || filter.species || filter.from || filter.to);
  const border = { borderColor: 'var(--trout-color-border)' };

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2" role="search" aria-label="Filter logbook entries">
      <label className="text-sm">
        <span className="mb-1 block font-bold">Search</span>
        <input
          className="focus-ring min-h-[48px] w-56 rounded-lg border px-3"
          style={border}
          value={filter.query ?? ''}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          placeholder="Water, species, fly, notes…"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Species</span>
        <select
          className="focus-ring min-h-[48px] rounded-lg border px-3"
          style={border}
          value={filter.species ?? ''}
          onChange={(e) => onChange({ ...filter, species: e.target.value || undefined })}
        >
          <option value="">All</option>
          {speciesOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">From</span>
        <input
          type="date"
          className="focus-ring min-h-[48px] rounded-lg border px-3"
          style={border}
          value={filter.from ?? ''}
          onChange={(e) => onChange({ ...filter, from: e.target.value || undefined })}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-bold">To</span>
        <input
          type="date"
          className="focus-ring min-h-[48px] rounded-lg border px-3"
          style={border}
          value={filter.to ?? ''}
          onChange={(e) => onChange({ ...filter, to: e.target.value || undefined })}
        />
      </label>
      {active && (
        <Button variant="ghost" className="focus-ring" onClick={() => onChange({})}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
