import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, toast } from '@trout/ui';
import { useMyWatersSharedData } from '../features/myWaters/useMyWatersData';
import { CreateTripForm, prefillFromParams, type TripPrefill } from '../features/trips/CreateTripForm';
import { TripCard } from '../features/trips/TripCard';
import { useTripPacks, useTrips } from '../features/trips/useTripsData';
import type { TripPackSummary } from '../features/trips/tripPlan';

const NO_PACK: TripPackSummary = { status: 'none', hasManifest: false, manifests: [] };

/**
 * Trips (ADR 0012) — the private trip planner at /trips. A trip ties waters,
 * a checklist, and (via its manifests, once the pack builder lands) offline
 * readiness together on this device. The catalog + the ONE shared statewide
 * conditions fetch come from useMyWatersSharedData; shortlists arrive through
 * /trips?waters=<id,id>&title=&date= and are read into the create form once
 * on mount.
 */
export function TripsPage() {
  const [params] = useSearchParams();
  const trips = useTrips();
  const packs = useTripPacks();
  const shared = useMyWatersSharedData();

  // The compare page / water cards hand off a shortlist through the URL.
  // Read it once on mount; it is initial form state, not live state.
  const [prefill] = useState<TripPrefill>(() => prefillFromParams(params));
  const [formOpen, setFormOpen] = useState(
    prefill.title !== '' || prefill.date !== '' || prefill.waterIds.length > 0,
  );

  useEffect(() => {
    document.title = 'Trips — Trout field atlas';
    return () => {
      document.title = 'Trout — The Field Atlas';
    };
  }, []);

  const counts = useMemo(() => {
    const all = trips ?? [];
    const planned = all.filter((t) => !t.completedAt).length;
    return { planned, recorded: all.length - planned };
  }, [trips]);

  return (
    <main className="page">
      <p className="eyebrow mb-3">Kept on this device</p>
      <h1 className="page-title">Trips</h1>
      <p className="page-subtitle mt-1">
        Plan a day on the water: the waters you want to fish, a packing checklist, and honest
        offline-pack readiness. Trips are private — they live only in this browser, with no
        account, and they work offline. Sharing a plan copies waters and date only.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => setFormOpen((v) => !v)} className="focus-ring">
          {formOpen ? 'Close form' : 'Plan a trip'}
        </Button>
      </div>
      {formOpen && (
        <Card className="mt-3">
          <h2 className="section-title !mt-0">New trip</h2>
          <p className="muted text-sm">
            Everything stays on this device. Water ids come from the catalog — browse or compare
            can hand them over.
          </p>
          <CreateTripForm
            prefill={prefill}
            streams={shared.streamsById.size > 0 ? [...shared.streamsById.values()] : []}
            onCreated={() => toast.success('Trip created — it stays on this device.')}
          />
        </Card>
      )}

      {trips === undefined ? (
        <p className="page-subtitle mt-6" role="status">
          Loading trips…
        </p>
      ) : trips.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🧭"
            title="No trips planned yet"
            description="A trip keeps a fishing day together: the waters you mean to visit, a packing checklist, and — once pack downloads arrive — offline readiness. Everything is local-only, no account, and notes never leave this device."
            action={
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link className="secondary-action focus-ring" to="/browse">
                  Browse waters
                </Link>
                <Link className="secondary-action focus-ring" to="/compare">
                  Compare waters
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <p className="muted text-sm mt-3" role="status">
            {counts.planned} planned · {counts.recorded} recorded
          </p>
          <ul className="mt-3 flex flex-col gap-3" aria-label="Trips">
            {trips.map((trip) => (
              <li key={trip.id}>
                <TripCard
                  trip={trip}
                  pack={packs.get(trip.id) ?? NO_PACK}
                  streamsById={shared.streamsById}
                  snapshotById={shared.snapshotById}
                  catalogState={shared.catalogState}
                  conditionsLoading={shared.conditionsLoading}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
