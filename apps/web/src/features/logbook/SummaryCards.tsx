import { Card } from '@trout/ui';
import { summarizeEntries, type LogbookEntry } from '../../lib/logbook';

/**
 * Local summaries over the visitor's own entries. Honest wording matters:
 * blank trips and untimed effort are included, and "no catch recorded" is
 * never presented as "caught nothing" — absence of a recorded catch is not
 * zero catch.
 */
export function SummaryCards({ entries }: { entries: LogbookEntry[] }) {
  const summary = summarizeEntries(entries);
  const topSpecies = summary.speciesTally.slice(0, 3).map((t) => `${t.species} (${t.count})`).join(', ');

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="eyebrow">Trips</p>
          <p className="text-xl font-extrabold">{summary.totalTrips}</p>
          <p className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
            {summary.blankTrips > 0 ? `${summary.blankTrips} recorded as blank` : 'blank trips included when logged'}
          </p>
        </Card>
        <Card>
          <p className="eyebrow">On the water</p>
          <p className="text-xl font-extrabold">
            {summary.effortEntries > 0 ? `${summary.effortHours} h` : '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
            {summary.effortEntries > 0
              ? `${summary.effortEntries} ${summary.effortEntries === 1 ? 'entry' : 'entries'} with a duration`
              : 'no timed entries yet'}
          </p>
        </Card>
        <Card>
          <p className="eyebrow">Species</p>
          <p className="truncate text-xl font-extrabold" title={topSpecies}>
            {topSpecies || '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
            {summary.speciesTally.length > 0
              ? `${summary.speciesTally.length} ${summary.speciesTally.length === 1 ? 'species' : 'species'} tallied`
              : 'no species recorded yet'}
          </p>
        </Card>
      </div>
      {summary.totalTrips > 0 && (
        <p className="text-xs" style={{ color: 'var(--trout-color-text-muted)' }}>
          {summary.entriesWithoutCatchRecorded > 0
            ? `${summary.entriesWithoutCatchRecorded} ${summary.entriesWithoutCatchRecorded === 1 ? 'entry has' : 'entries have'} no catch recorded — that is not the same as catching nothing.`
            : `All entries record a catch or a blank.`}
        </p>
      )}
    </div>
  );
}
