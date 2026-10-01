import { useState } from 'react';
import { Link } from 'react-router-dom';
import { newestReadingAt } from '@trout/contracts';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { Card, Chip, ConfirmButton } from '@trout/ui';
import { ScorePill } from '../../components/ScorePill';
import { FreshnessChip } from '../../components/FreshnessChip';
import { statusForScore } from '../map/riverMapSelectors';
import { toWaterDecisionView } from '../map/waterDecision';
import type { FishabilityFocus, SpeciesMode } from '../map/waterDecision';
import { overviewConditionStatus } from '../waters/overviewStatus';
import type { SavedWaterRecord, WaterGroupRecord } from '../../lib/db';
import { ageMinutes } from '../../lib/time';
import { useOnline } from '../../hooks/useOnline';
import { formatFlow, formatHeight, formatTemp } from '../../lib/units';
import { buildWaterOverview } from '../../lib/waterOverview';
import { setWaterGroupMembership, unsaveWater } from '../../lib/savedWaters';
import { waterManifestId } from '../../lib/downloadManifests';
import { DownloadButton } from '../downloads/DownloadButton';
import { usePackManager } from '../downloads/usePackManager';
import type { MyWatersSharedData } from './useMyWatersData';

export interface SavedWaterCardProps {
  fishability?: FishabilityFocus;
  saved: SavedWaterRecord;
  stream: Stream | undefined;
  snapshot: ConditionSnapshot | undefined;
  catalogState: ReturnType<MyWatersSharedData['catalogState']>;
  conditionsLoading: boolean;
  conditionsLive: boolean;
  groups: WaterGroupRecord[];
  tempUnit: 'C' | 'F';
  speciesMode: SpeciesMode;
}

function metricValue(
  key: 'flow' | 'temperature' | 'stage' | 'reservoir',
  value: number,
  tempUnit: 'C' | 'F',
): string {
  if (key === 'flow') return formatFlow(value);
  if (key === 'temperature') return formatTemp(value, tempUnit);
  return formatHeight(value);
}

/**
 * One saved water, compact. Catalog-backed cards compose the shared
 * WaterOverview model (identity/opportunity/assessment + per-metric ages);
 * a retired catalog id renders from its save-time nameSnapshot with an
 * explicit "no longer in the catalog" treatment — visible history, never a
 * silent drop, and never a data claim the catalog can no longer back.
 */
export function SavedWaterCard({
  saved,
  stream,
  snapshot,
  catalogState,
  conditionsLoading,
  conditionsLive,
  groups,
  tempUnit,
  speciesMode,
  fishability,
}: SavedWaterCardProps) {
  const [editingGroups, setEditingGroups] = useState(false);
  const manager = usePackManager();
  const online = useOnline();
  const found = catalogState === 'found' && stream !== undefined;
  const retired = catalogState === 'missing';

  // The overview model is catalog-first by design, so it only exists while the
  // catalog row does. Everything it shows composes the existing authorities
  // (catalog opportunity block, waterDecision, contracts freshness).
  const overview = found && stream
    ? buildWaterOverview((() => {
        const hasData = (snapshot?.readings.length ?? 0) > 0;
        const status = statusForScore(
          snapshot?.score.value ?? null,
          hasData,
          snapshot?.score?.assessed,
        );
        return {
          stream,
          decision: toWaterDecisionView(
            {
              stream,
              status,
              score: snapshot?.score?.value ?? null,
              snapshot,
              species: stream.species,
            },
            speciesMode,
            new Date().getMonth() + 1,
            fishability,
          ),
          conditions: snapshot ?? null,
          offlineSaved: snapshot != null && !conditionsLive,
          nowMs: Date.now(),
          sourcesCount: stream.officialSources?.length ?? 0,
        };
      })())
    : null;

  // A shared fetch still in flight with no cached entry proves nothing yet —
  // "no data" may only be said once the shared snapshot has had its chance.
  const checkingConditions = conditionsLoading && !snapshot;

  const memberOf = groups.filter((g) => saved.groupIds.includes(g.id));
  const displayName = overview?.identity.name ?? saved.nameSnapshot;
  const waterPack = found
    ? manager.manifests?.find((m) => m.id === waterManifestId(saved.waterId))
    : undefined;

  const toggleGroup = (groupId: string, member: boolean) => {
    void setWaterGroupMembership(saved.waterId, groupId, member);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        {found ? (
          <Link
            to={`/conditions/${saved.waterId}`}
            className="focus-ring text-base font-extrabold"
          >
            {displayName}
          </Link>
        ) : (
          <h3 className="text-base font-extrabold">{displayName}</h3>
        )}
        {overview && <Chip>{overview.identity.typeLabel}</Chip>}
        {overview?.identity.reach && (
          <span className="muted text-sm">{overview.identity.reach}</span>
        )}
        {retired && <Chip tone="fair">No longer in the catalog</Chip>}
        {overview?.opportunity.headline && (
          <Chip tone="accent">{overview.opportunity.headline}</Chip>
        )}
        {overview?.assessment &&
          overview.assessment.displayMetric === 'trout-condition' &&
          snapshot && <ScorePill score={snapshot.score.value} className="ml-auto" />}
      </div>

      {overview?.assessment && overview.assessment.displayMetric !== 'trout-condition' && <p className="mt-2 text-sm">{overviewConditionStatus(overview.assessment, { species: stream?.species, status: 'no-data', fishability })}</p>}

      {retired && (
        <p className="muted mt-2 text-sm">
          The current catalog no longer lists this id. Showing the name saved on this device —
          your save stays until you remove it, but no live data can be checked for it.
        </p>
      )}
      {catalogState === 'unavailable' && (
        <p className="muted mt-2 text-sm">
          The catalog could not be loaded right now — showing the name saved on this device.
          Availability stays unknown until it loads.
        </p>
      )}

      {memberOf.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="muted text-xs font-bold uppercase tracking-wide">Groups</span>
          {memberOf.map((g) => (
            <Chip key={g.id}>{g.name}</Chip>
          ))}
        </div>
      )}

      {/* Reserve: while the catalog row resolves (or before the snapshot
          lands) this holds the metric row's slot so the Remove control
          beneath never shifts under a tapping finger. */}
      {found && !overview && <div className="reserve-metrics" aria-hidden="true" />}
      {overview && (
        <div className="reserve-metrics mt-3 flex flex-wrap items-center gap-2">
          <FreshnessChip
            fetchedAt={snapshot ? Date.parse(snapshot.fetchedAt) : null}
            live={conditionsLive}
            observedAt={newestReadingAt(snapshot?.readings ?? [])}
          />
          {overview.metrics.map((m) => (
            <span key={m.key} className="text-sm">
              {/* Label + value stay one contiguous readout (tabular-nums via
                  .data-value); the observation age reads as secondary. */}
              <span className="data-value">{m.label} {metricValue(m.key, m.value, tempUnit)}</span>
              {m.observedAt !== null && (
                <span className="data-unit"> · observed {ageMinutes(m.observedAt)}</span>
              )}
            </span>
          ))}
        </div>
      )}
      {overview &&
        overview.notices.map((n, i) => (
          <p
            key={i}
            role={n.severity === 'warning' ? 'status' : undefined}
            className="muted mt-2 text-sm"
            style={
              n.severity === 'warning'
                ? // Status semantics: a warning is "usable with caveats" —
                  // amber, not red. Red is for unsafe/failed states only.
                  { color: 'var(--trout-status-fair)' }
                : undefined
            }
          >
            {n.text}
          </p>
        ))}
      {checkingConditions && (
        <p className="muted mt-2 text-sm" role="status">
          Checking for gauge readings…
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="text-action focus-ring"
          aria-expanded={editingGroups}
          onClick={() => setEditingGroups((v) => !v)}
        >
          {editingGroups ? 'Close groups' : 'Edit groups'}
        </button>
        {found && stream && (
          <DownloadButton
            manifest={waterPack}
            busy={manager.busyId === waterManifestId(saved.waterId)}
            progress={manager.progress}
            offline={!online}
            onDownload={(terrain) => void manager.downloadWater(stream, terrain)}
            onEstimate={(terrain, signal) => manager.estimateWater(stream, terrain, signal)}
            onRedownload={waterPack ? (terrain) => void manager.downloadWater(stream, terrain) : undefined}
            onCancel={manager.cancelDownload}
            onVerify={waterPack ? () => void manager.verifyPack(waterPack) : undefined}
            onRemove={waterPack ? () => void manager.removePack(waterPack) : undefined}
          />
        )}
        <ConfirmButton
          label="Remove"
          confirmLabel="Remove from My Waters"
          cancelLabel="Keep"
          className="focus-ring ml-auto"
          onConfirm={() => void unsaveWater(saved.waterId)}
        />
      </div>
      {editingGroups && (
        <div
          className="mt-2 flex flex-wrap gap-3"
          role="group"
          aria-label={`Groups for ${displayName}`}
        >
          {groups.length === 0 ? (
            <p className="muted text-sm">No groups yet — create one from “Manage groups” above.</p>
          ) : (
            groups.map((g) => (
              <label key={g.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  className="focus-ring"
                  checked={saved.groupIds.includes(g.id)}
                  onChange={(e) => toggleGroup(g.id, e.target.checked)}
                />
                {g.name}
              </label>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
