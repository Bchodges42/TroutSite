import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Chip, ConfirmButton, EmptyState, toast } from '@trout/ui';
import type { SavedWaterRecord, WaterGroupRecord } from '../lib/db';
import { createGroup, deleteGroup, renameGroup } from '../lib/savedWaters';
import { useSettingsContext } from '../lib/settings';
import { SavedWaterCard } from '../features/myWaters/SavedWaterCard';
import { SPECIES_LABELS, useFishabilityIndex } from '../lib/fishability';
import type { SpeciesKey } from '@trout/contracts';
import {
  useMyWatersSharedData,
  useSavedWaters,
  useWaterGroups,
} from '../features/myWaters/useMyWatersData';

/**
 * My Waters (ADR 0012) — the destination page for saved waters, route
 * /my-waters. Everything is on-device (Dexie): saves, groups, and the cached
 * snapshots the cards read. The catalog + the ONE shared statewide conditions
 * fetch come from useMyWatersSharedData; the page never fetches per card.
 */
export function MyWatersPage() {
  const { settings } = useSettingsContext();
  const saved = useSavedWaters();
  const groups = useWaterGroups() ?? [];
  const shared = useMyWatersSharedData();
  const focus = settings.speciesFocus in SPECIES_LABELS ? settings.speciesFocus as SpeciesKey : null;
  const savedStreams = (saved ?? []).flatMap((water) => {
    const stream = shared.streamsById.get(water.waterId); return stream ? [stream] : [];
  });
  const fishabilityQ = useFishabilityIndex(savedStreams, focus, settings.speciesMode === 'all');

  const [filter, setFilter] = useState<'all' | string>('all');
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    document.title = 'My Waters — Trout field atlas';
    return () => {
      document.title = 'Trout — The Field Atlas';
    };
  }, []);

  const visible = useMemo(
    () => (saved ?? []).filter((w) => filter === 'all' || w.groupIds.includes(filter)),
    [saved, filter],
  );

  return (
    <main className="page">
      <p className="eyebrow mb-3">Kept on this device</p>
      <h1 className="page-title">My Waters</h1>
      <p className="page-subtitle mt-1">
        Your saved waters, newest first. Saving is private — the list lives only in this browser,
        with no account, and it works offline. Groups keep a trip&apos;s waters together.
      </p>

      {saved === undefined ? (
        <p className="page-subtitle mt-6" role="status">
          Loading saved waters…
        </p>
      ) : saved.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🔖"
            title="No saved waters yet"
            description="Save a water from the map or a conditions page and it will wait here — on this device only, no account. Private groups keep a trip's waters together."
            action={
              <Link className="secondary-action focus-ring" to="/browse">
                Browse waters
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div
            className="mt-4 flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter saved waters by group"
          >
            <button
              type="button"
              className={'filter-chip' + (filter === 'all' ? ' is-active' : '')}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                className={'filter-chip' + (filter === g.id ? ' is-active' : '')}
                aria-pressed={filter === g.id}
                onClick={() => setFilter(g.id)}
              >
                {g.name}
              </button>
            ))}
            <button
              type="button"
              className="text-action focus-ring ml-auto"
              aria-expanded={manageOpen}
              onClick={() => setManageOpen((v) => !v)}
            >
              {manageOpen ? 'Close group manager' : 'Manage groups'}
            </button>
          </div>

          {manageOpen && (
            <GroupManager
              groups={groups}
              saved={saved}
              onGroupDeleted={(id) => setFilter((f) => (f === id ? 'all' : f))}
            />
          )}

          <p className="muted text-sm mt-3" role="status">
            {visible.length === saved.length
              ? `${saved.length} saved water${saved.length === 1 ? '' : 's'}`
              : `${visible.length} of ${saved.length} saved waters`}
          </p>

          {visible.length === 0 ? (
            <p className="muted mt-4">
              No saved waters in this group yet — use “Edit groups” on a card to add one.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3" aria-label="Saved waters">
              {visible.map((w) => (
                <li key={w.waterId}>
                  <SavedWaterCard
                    saved={w}
                    stream={shared.streamsById.get(w.waterId)}
                    snapshot={shared.snapshotById.get(w.waterId)}
                    catalogState={shared.catalogState(w.waterId)}
                    conditionsLoading={shared.conditionsLoading}
                    conditionsLive={shared.conditionsLive}
                    groups={groups}
                    tempUnit={settings.tempUnit}
                    speciesMode={settings.speciesMode}
                    fishability={focus && fishabilityQ.data?.[w.waterId]?.bySpecies[focus]?.comfort
                      ? { species: focus, comfort: fishabilityQ.data[w.waterId]!.bySpecies[focus]!.comfort } : null}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

/** Create / rename / delete groups. Deleting never touches the saves themselves. */
function GroupManager({
  groups,
  saved,
  onGroupDeleted,
}: {
  groups: WaterGroupRecord[];
  saved: SavedWaterRecord[];
  onGroupDeleted: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = (e: FormEvent) => {
    e.preventDefault();
    void createGroup(name)
      .then(() => {
        setName('');
        setError(null);
        toast.success('Group created — private to this device.');
      })
      .catch(() => setError('A group needs a name.'));
  };

  return (
    <Card className="mt-3">
      <h2 className="section-title !mt-0">Groups</h2>
      <p className="muted text-sm">
        Groups are private buckets for organizing saves. Deleting a group keeps its waters.
      </p>
      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={create}>
        <label className="text-sm">
          <span className="mb-1 block font-bold">New group</span>
          <input
            className="focus-ring min-h-[48px] rounded-lg border px-3"
            style={{ borderColor: 'var(--trout-color-border)' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend trip"
            aria-label="New group name"
          />
        </label>
        <Button type="submit" className="focus-ring">
          Create group
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm" style={{ color: 'var(--trout-color-danger)' }}>
          {error}
        </p>
      )}
      {groups.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2" aria-label="Your groups">
          {groups.map((g) => (
            <GroupManagerRow
              key={g.id}
              group={g}
              count={saved.filter((w) => w.groupIds.includes(g.id)).length}
              onDeleted={() => onGroupDeleted(g.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function GroupManagerRow({
  group,
  count,
  onDeleted,
}: {
  group: WaterGroupRecord;
  count: number;
  onDeleted: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);

  const saveRename = () => {
    void renameGroup(group.id, name);
    setRenaming(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-2">
      {renaming ? (
        <>
          <input
            className="focus-ring min-h-[40px] rounded-lg border px-3 text-sm"
            style={{ borderColor: 'var(--trout-color-border)' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={`Rename ${group.name}`}
          />
          <Button size="sm" className="focus-ring" onClick={saveRename}>
            Save name
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="focus-ring"
            onClick={() => {
              setRenaming(false);
              setName(group.name);
            }}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <strong>{group.name}</strong>
          <Chip>
            {count === 1 ? '1 saved water' : `${count} saved waters`}
          </Chip>
          <button
            type="button"
            className="text-action focus-ring"
            onClick={() => setRenaming(true)}
          >
            Rename
          </button>
          <ConfirmButton
            label={`Delete ${group.name}`}
            confirmLabel={`Really delete ${group.name}`}
            cancelLabel="Keep"
            className="focus-ring"
            onConfirm={() => {
              void deleteGroup(group.id).then(() => {
                onDeleted();
                toast.success('Group deleted — its waters stay saved.');
              });
            }}
          />
        </>
      )}
    </li>
  );
}
