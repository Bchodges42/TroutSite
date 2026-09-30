import { Link } from 'react-router-dom';
import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { Chip } from '@trout/ui';
import type { MyWatersSharedData } from '../myWaters/useMyWatersData';
import { buildWaterOverview } from '../../lib/waterOverview';
import { availabilityText, type TripTiming } from './tripPlan';

export interface TripWaterLineProps {
  waterId: string;
  stream: Stream | undefined;
  catalogState: ReturnType<MyWatersSharedData['catalogState']>;
  snapshot: ConditionSnapshot | undefined;
  conditionsLoading: boolean;
  timing: TripTiming;
}

/**
 * One compact water line inside a trip (ADR 0012 + future-date honesty):
 * identity always; seasonal flags (stocking program / year-round) from the
 * catalog for future or unscheduled trips; a clearly labeled "current
 * conditions" line ONLY on today/past trips — gauge readings are never
 * presented as predictions for a day that has not happened. Availability
 * only, no metrics — the conditions page owns depth.
 */
export function TripWaterLine({
  waterId,
  stream,
  catalogState,
  snapshot,
  conditionsLoading,
  timing,
}: TripWaterLineProps) {
  const found = catalogState === 'found' && stream !== undefined;
  // Conditions may only be spoken about for trips anchored to today or the past.
  const mayShowConditions = timing === 'today' || timing === 'past';

  // The shared WaterOverview model, kept light: identity + availability only.
  const overview =
    found && stream && mayShowConditions
      ? buildWaterOverview({
          stream,
          conditions: snapshot ?? null,
          nowMs: Date.now(),
          sourcesCount: stream.officialSources?.length ?? 0,
        })
      : null;
  const name = overview?.identity.name ?? stream?.name ?? waterId;
  const checkingConditions = mayShowConditions && conditionsLoading && !snapshot;

  return (
    <li>
      <div className="flex flex-wrap items-center gap-2">
        {found ? (
          <Link to={`/conditions/${waterId}`} className="focus-ring text-sm font-bold">
            {name}
          </Link>
        ) : (
          <span className="text-sm font-bold">{name}</span>
        )}
        {catalogState === 'missing' && <Chip tone="fair">No longer in the catalog</Chip>}
        {timing === 'future' && stream?.stockingProgram && <Chip tone="accent">Stocking program</Chip>}
        {timing === 'future' && stream?.yearRound && <Chip>Year-round fishery</Chip>}
      </div>
      {overview && (
        <p className="muted mt-0.5 text-sm">
          Current conditions: {availabilityText(overview.availability.conditions)}
        </p>
      )}
      {checkingConditions && (
        <p className="muted mt-0.5 text-sm" role="status">
          Checking for gauge readings…
        </p>
      )}
    </li>
  );
}
