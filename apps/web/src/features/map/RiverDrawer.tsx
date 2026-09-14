import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { regionName, monthName } from '../../data/regions';
import { formatFlow, formatTemp, formatHeight } from '../../lib/units';
import { flowTrend, TREND_LABEL } from '../../lib/conditions';
import { orderedReadings, conditionReason, waterIdentity, waterTypeLabel } from '../../lib/presentation';
import { useSettingsContext } from '../../lib/settings';
import { useContentPack } from '../../lib/content';
import { riverWorkflowUrl } from '../../lib/riverContext';
import { activityLabel } from '../../lib/hatchActivity';
import { itemsForWater, useFishingInfo } from '../../lib/fishingInfo';
import { toWaterDecisionView, seasonalChipText } from './waterDecision';
import { FishabilityCard } from '../../components/FishabilityCard';
import type { RiverMapFeature } from './riverMapSelectors';
import { FreshnessChip } from '../../components/FreshnessChip';
import { db } from '../../lib/db';
import { firstPartyPhotoUrl } from '../../lib/media';
import { BookIcon, BugIcon, CloseIcon, WavesIcon } from '../../components/icons';
const TABS = ['Water', 'Hatch', 'Stocking', 'Reports', 'Your Log'] as const;
type Tab = (typeof TABS)[number];
const TIMES = { am: 'Morning', midday: 'Midday', pm: 'Afternoon', evening: 'Evening' };
interface Props {
  feature: RiverMapFeature | null;
  tab: Tab;
  onTab: (t: Tab) => void;
  onClose: () => void;
  onBack?: () => void;
  modeMonth: number;
  live: boolean;
  fetchedAt: number | null;
  /** 'panel' = standalone side panel (owns the dialog role); 'sheet' =
   *  nested inside the vaul bottom sheet, whose Drawer.Content already IS
   *  the role="dialog" — a second dialog here made assistive tech and
   *  Playwright see two visible dialogs for one surface (stage-2 fix). */
  layout?: 'sheet' | 'panel';
  loading?: boolean;
  feedErrors?: { reports: boolean; stocking: boolean };
}
export function RiverDrawer({
  feature,
  tab,
  onTab,
  onClose,
  onBack,
  modeMonth,
  live,
  loading,
  feedErrors,
  layout = 'panel',
}: Props) {
  const body = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsContext();
  const dialogAttrs = layout === 'sheet' ? {} : { role: 'dialog' as const, 'aria-modal': false };
  if (!feature)
    return (
      <section
        className="inspector p-6"
        id="river-inspector"
        tabIndex={-1}
        {...dialogAttrs}
        aria-label="River details"
      >
        <button className="icon-button self-end" aria-label="Close river details" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="empty-note mt-6" role="status">
          <strong>{loading ? 'Loading this water…' : 'Water not available'}</strong>
          <p>
            {loading
              ? 'The catalog is loading. You can continue exploring the map.'
              : 'This river is not in the available catalog. Search for a water, or use the full list.'}
          </p>
          <Link className="text-action" to="/browse">
            Browse all waters →
          </Link>
        </div>
      </section>
    );
  const choose = (next: Tab) => {
    onTab(next);
    body.current?.scrollTo({ top: 0 });
  };
  const identity = waterIdentity(feature.stream.name);
  return (
    <section
      className="inspector"
      id="river-inspector"
      tabIndex={-1}
      {...dialogAttrs}
      aria-label={feature.stream.name + ' details'}
    >
      <div className="inspector-header">
        <button type="button" className="inspector-back" onClick={onBack ?? onClose}>
          ← All Tennessee waters
        </button>
        <div className="inspector-title-row">
          <div>
            <p className="eyebrow">{regionName(feature.stream.regionId)}</p>
            <h2>{identity.name}</h2>
            <SeasonChip month={modeMonth} feature={feature} mode={settings.speciesMode} />
            <p className="inspector-subtitle">
              {identity.reach ?? waterTypeLabel(feature.stream.waterbodyType)}{' '}
              ·{' '}
              {feature.stream.stockingProgram
                ? 'Stocking program listed'
                : 'No stocking program listed'}
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close river details"
            onClick={onClose}
          >
            <CloseIcon size={19} />
          </button>
        </div>
        <div className="inspector-tabs" role="tablist" aria-label="River details">
          {TABS.map((t, i) => (
            <button
              key={t}
              id={'river-tab-' + i}
              role="tab"
              tabIndex={tab === t ? 0 : -1}
              aria-selected={tab === t}
              aria-controls="river-tabpanel"
              onClick={() => choose(t)}
              onKeyDown={(e) => {
                let n = i;
                if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
                else if (e.key === 'ArrowLeft') n = (i + TABS.length - 1) % TABS.length;
                else if (e.key === 'Home') n = 0;
                else if (e.key === 'End') n = TABS.length - 1;
                else return;
                e.preventDefault();
                choose(TABS[n]!);
                document.getElementById('river-tab-' + n)?.focus();
              }}
            >
              {t === 'Water'
                ? 'Conditions'
                : t === 'Hatch'
                  ? 'Hatches'
                  : t === 'Your Log'
                    ? 'Log'
                    : t}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={body}
        className="inspector-body"
        id="river-tabpanel"
        role="tabpanel"
        aria-labelledby={'river-tab-' + TABS.indexOf(tab)}
      >
        {tab === 'Water' && <WaterTab feature={feature} month={modeMonth} live={live} />}
        {tab === 'Hatch' && <HatchTab feature={feature} month={modeMonth} />}
        {tab === 'Stocking' && (
          <StockingTab feature={feature} month={modeMonth} error={feedErrors?.stocking} />
 )}
        {tab === 'Reports' && <ReportsTab feature={feature} error={feedErrors?.reports} />}
        {tab === 'Your Log' && <LogTab feature={feature} month={modeMonth} />}
      </div>
    </section>
  );
}
function WaterTab({
  feature,
  month,
  live,
}: {
  feature: RiverMapFeature;
  month: number;
  live: boolean;
}) {
  const { settings } = useSettingsContext();
  const pack = useContentPack();
  const fishingInfo = useFishingInfo();
  const waterRegs = itemsForWater(fishingInfo.data?.data, 'special-regulations', feature.stream.id);
  const snap = feature.snapshot;
  const readings = orderedReadings(snap);
  const flow = readings.find((r) => r.cfs != null),
    temp = readings.find((r) => r.tempC != null),
    stage = readings.find((r) => r.heightFt != null),
    reservoirLevel = readings.find((r) => r.reservoirLevelFt != null);
  const observed = readings[0]?.timestamp;
  const warm = feature.species === 'warmwater';
  // No catalog species: say so explicitly (H3). The water keeps its gauge
  // readings below, but never trout-assessment language or a score disc.
  const unverified = feature.species == null;
  // T1-18/19: the decision model owns seasonal applicability — a
  // yearRound:false trout water out of its winter window never wears trout
  // language, and the seasonal state shows as a first-class chip.
  const decision = toWaterDecisionView(feature, settings.speciesMode, month, feature.fishability);
  const seasonal = seasonalChipText(decision);
  const outOfSeason = decision.troutApplicability === 'seasonal-likely-absent';
  const title = warm
    ? 'Warmwater fishery'
    : unverified
      ? 'Species unverified'
      : outOfSeason
        ? 'PROGRAMMATIC — out of season'
        : decision.troutApplicability === 'seasonal-uncertain'
          ? 'PROGRAMMATIC — seasonal fishery'
          : feature.status === 'no-data'
            ? 'Not assessed'
            : feature.status === 'good'
              ? 'Good conditions'
              : feature.status === 'fair'
                ? 'Fair conditions'
                : 'Poor conditions';
  const reason = warm
    ? 'Trout scores do not apply to this fishery. Check the readings and local guidance.'
    : unverified
      ? 'The catalog does not document trout as a target species for this water. The gauge readings below still describe flow and temperature — check the fishery notes before fishing.'
      : seasonal
        ? 'The catalog documents this fishery as a winter program: stocked in the cold months, not holding through summer. The gauge readings below still describe flow and temperature — verify the season with the official source.'
        : feature.status === 'no-data'
          ? 'An assessment is not available in this snapshot. This does not mean fishing is poor.'
          : (snap?.score.reasons.find((r) => /dangerously|avoid stressing/i.test(r)) ??
            snap?.score.reasons[0] ??
            'Assessment based on the available gauge readings.');
  const dominant = feature.hatchDominant;
  const taxon = pack.data?.taxa.find((t) => t.id === dominant?.taxonId);
  return (
    <>
      <div
        className="assessment"
        data-status={warm ? 'warmwater' : unverified || seasonal || feature.status === 'no-data' ? 'no-data' : feature.status}
      >
        <div className="assessment-top">
          <div>
            <span className="assessment-label">
              {warm || unverified ? 'Species guidance' : 'Trout condition assessment'}
            </span>
            <h3 className="assessment-name">{title}</h3>
          </div>
          {decision.displayMetric === 'trout-condition' && feature.score !== null && (
            <span
              className="score-disc"
              aria-label={'Condition score ' + feature.score + ' out of 100'}
            >
              <strong>{feature.score}</strong>
              <small>OUT OF 100</small>
            </span>
          )}
        </div>
        <p className="assessment-reason">{conditionReason(reason, settings.tempUnit)}</p>
        <div className="freshness">
          <FreshnessChip
            fetchedAt={snap ? Date.parse(snap.fetchedAt) : null}
            live={live}
            observedAt={observed ? Date.parse(observed) : null}
            nextExpectedAt={snap ? Date.parse(snap.nextExpectedUpdate) : null}
          />
        </div>
      </div>
      <FishabilityCard streamId={feature.stream.id} compact />
      <div className="metrics">
        <div className="metric">
          <span className="metric-label">
            <WavesIcon size={15} />
            Streamflow
          </span>
          <strong className={'metric-value' + (!flow ? ' is-empty' : '')}>
            {flow?.cfs != null ? formatFlow(flow.cfs) : 'Not reported'}
          </strong>
          <small>
            {flow
              ? 'USGS ' + flow.gaugeId
              : stage?.heightFt != null
                ? 'Stage ' + formatHeight(stage.heightFt)
                : 'No flow observation'}
          </small>
        </div>
        <div className="metric">
          <span className="metric-label">
            {['lake', 'pond'].includes(feature.stream.waterbodyType) ? 'Reservoir level' : 'Water temperature'}
          </span>
          <strong className={'metric-value' + (!temp ? ' is-empty' : '')}>
            {['lake', 'pond'].includes(feature.stream.waterbodyType)
              ? reservoirLevel?.reservoirLevelFt != null ? formatHeight(reservoirLevel.reservoirLevelFt) : 'Not reported'
              : temp?.tempC != null ? formatTemp(temp.tempC, settings.tempUnit) : 'Not reported'}
          </strong>
          <small>
            {['lake', 'pond'].includes(feature.stream.waterbodyType)
              ? reservoirLevel ? 'Measured reservoir level context' : 'Check current reservoir level'
              : temp ? 'USGS ' + temp.gaugeId : 'Check water before fishing'}
          </small>
        </div>
      </div>
      {!warm && !seasonal && (
        <div className="hatch-preview">
          <span className="eyebrow">
            <BugIcon size={16} />
            {monthName(month)} hatch outlook
          </span>
          <strong>{taxon?.commonName ?? 'What is on the water?'}</strong>
          <p>
            {dominant
              ? TIMES[dominant.timeOfDay] +
                ' · ' +
                dominant.stage +
                ' · expected ' +
                activityLabel(dominant.abundance) +
                ' (regional guidance)'
              : 'Identify the insect you find and explore matching fly patterns.'}
          </p>
          <Link
            className="primary-action"
            to={riverWorkflowUrl('/hatch-key', feature.stream, month)}
          >
            <BugIcon size={17} />
            Match the hatch <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
      {seasonal && (
        <div className="detail-section seasonal-note">
          <h3>{seasonal}</h3>
          <p>
            {outOfSeason
              ? 'This water’s trout program runs in the cold months. The regional hatch calendar below the surface still describes insect activity, but the stocked fishery is likely absent until next winter.'
              : 'This water’s trout program runs in the cold months; presence depends on where you are in the season. Verify stocking timing with the official source.'}
          </p>
          <Link
            className="text-action"
            to={riverWorkflowUrl('/charts/' + feature.stream.regionId + '/' + month, feature.stream, month)}
          >
            Open regional hatch calendar →
          </Link>
        </div>
      )}
      {waterRegs.length > 0 && (
        <div className="detail-section water-regs">
          <h3>Special regulations on this water</h3>
          {waterRegs.map((item, i) => (
            <div key={i} className="water-regs-item">
              <p>{item.text}</p>
              <p className="muted text-xs">
                {item.authority}
                {item.effectiveFrom ? ` · effective ${item.effectiveFrom}` : ''} · verified against{' '}
                {(() => {
                  try {
                    return new URL(item.sourceUrl).hostname.replace(/^www\./, '');
                  } catch {
                    return 'official source';
                  }
                })()}
              </p>
            </div>
          ))}
          <Link
            className="text-action"
            to={riverWorkflowUrl('/regulations', feature.stream, month)}
          >
            All fishing regulations →
          </Link>
        </div>
      )}
      <details className="reading-details">
        <summary>Why this assessment?</summary>
        <div className="detail-section mt-2">
          <p>
            Scores are the supplied trout model, not a catch forecast or a wading-safety rating.
            Good: 70–100. Fair: 40–69. Poor: 0–39.
          </p>
          <ul className="mt-2">
            {snap?.score.reasons.map((r) => (
              <li key={r}>{conditionReason(r, settings.tempUnit)}</li>
            ))}
          </ul>
          <p className="mt-2">
            {feature.stream.species
              ? 'Species applicability is supplied by the catalog.'
              : 'Species metadata is not supplied for this water. Read the fishery notes and check seasonal restrictions.'}
          </p>
        </div>
      </details>
      <details className="reading-details">
        <summary>Gauge readings & sources</summary>
        {readings.length === 0 ? (
          <p className="muted">No gauge observations are available.</p>
        ) : (
          readings.map((r, i) => (
            <div className="reading-row" key={r.gaugeId + r.timestamp + i}>
              <strong>USGS {r.gaugeId}</strong>
              <span>
                {[
                  r.cfs != null ? formatFlow(r.cfs) : null,
                  r.heightFt != null ? formatHeight(r.heightFt) + ' stage' : null,
                  r.tempC != null ? formatTemp(r.tempC, settings.tempUnit) : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'No measurements reported'}
              </span>
              <span>Observed {new Date(r.timestamp).toLocaleString()}</span>
            </div>
          ))
        )}
        <p className="muted text-xs">
          Trend:{' '}
          {TREND_LABEL[flowTrend(readings)] ||
            'unavailable — two readings from the same gauge are needed.'}
        </p>
        {snap && (
          <p className="muted text-xs mt-2">
            Snapshot generated {new Date(snap.fetchedAt).toLocaleString()}. Expected update{' '}
            {new Date(snap.nextExpectedUpdate).toLocaleString()}.
          </p>
        )}
      </details>
      {feature.stream.notes && (
        <div className="detail-section">
          <h3>Know this water</h3>
          <p>{feature.stream.notes}</p>
        </div>
      )}
      <div className="detail-section">
        <h3>Check before you cast</h3>
        <p>
          Conditions can change quickly. Confirm releases, access, and regulations with the official
          source.
        </p>
        {feature.stream.officialSources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-action mr-3">
            {s.label} ↗
          </a>
        ))}
      </div>
      <Link className="secondary-action" to={riverWorkflowUrl('/logbook', feature.stream, month)}>
        <BookIcon size={17} />
        Log a day on this water
      </Link>
      <Link
        className="text-action"
        to={riverWorkflowUrl('/conditions/' + feature.stream.id, feature.stream, month)}
      >
        Full water details →
      </Link>
    </>
  );
}
/** T1-18/19/T2-21 — the catalog's seasonal fact as a first-class chip;
 *  renders nothing for waters the decision model keeps in-season. */
function SeasonChip({ month, feature, mode }: { month: number; feature: RiverMapFeature; mode: 'trout' | 'all' }) {
  const text = seasonalChipText(toWaterDecisionView(feature, mode, month, feature.fishability));
  if (!text) return null;
  return <p className="seasonal-chip">{text}</p>;
}

function HatchTab({ feature, month }: { feature: RiverMapFeature; month: number }) {
  const pack = useContentPack();
  const chart = feature.hatchChart;
  const { settings } = useSettingsContext();
  // T1-17/T1-19: the trout hatch outlook and its "Match this water" CTA only
  // make sense where the trout metric applies. Warmwater and seasonal waters
  // get the honest seasonal state instead; the regional calendar stays.
  const decision = toWaterDecisionView(feature, settings.speciesMode, month, feature.fishability);
  const seasonal = seasonalChipText(decision);
  const applies = decision.displayMetric === 'trout-condition';
  return (
    <>
      <div className="detail-section">
        <h3>{monthName(month)} on this water</h3>
        {applies ? (
          <p>
            Regional seasonal guidance, not live sightings. Match the insects you actually
            observe.
          </p>
        ) : (
          <p>
            {seasonal ??
              'The trout hatch model does not apply to this fishery — the regional calendar below still describes insect activity for the area.'}
          </p>
        )}
      </div>
      {!applies ? null : !chart?.entries.length && (
        <div className="empty-note">
          <strong>No seasonal chart available</strong>
          <p>
            The insect key still works from your observations. Try a different month in map layers.
          </p>
        </div>
      )}
      {chart?.entries.map((entry, i) => {
        const taxon = pack.data?.taxa.find((t) => t.id === entry.taxonId);
        return (
          <div className="hatch-card" key={entry.taxonId + entry.stage + entry.timeOfDay + i}>
            <h3>{taxon?.commonName ?? 'Insect reference unavailable'}</h3>
            <p>
              {TIMES[entry.timeOfDay]} · <span className="capitalize">{entry.stage}</span>
              {taxon ? ' · Hook #' + taxon.sizeRange.join('–#') : ''}
            </p>
            <div className="hatch-abundance">
              Expected activity: {activityLabel(entry.abundance)} ({entry.abundance}/5)
            </div>
            <div className="hatch-patterns">
              {entry.patterns.map((id) => {
                const pattern = pack.data?.patterns.find((p) => p.id === id);
                return pattern ? (
                  <Link key={id} to={riverWorkflowUrl('/patterns/' + id, feature.stream, month)}>
                    {pattern.name} ↗
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        );
      })}
      {applies && (
        <Link className="primary-action" to={riverWorkflowUrl('/hatch-key', feature.stream, month)}>
          <BugIcon size={17} />
          Match this water
        </Link>
      )}
      <Link
        className="text-action"
        to={riverWorkflowUrl(
          '/charts/' + feature.stream.regionId + '/' + month,
          feature.stream,
          month,
        )}
      >
        Open regional hatch calendar →
      </Link>
    </>
  );
}
function StockingTab({ feature, error, month }: { feature: RiverMapFeature; error?: boolean; month: number }) {
  const { settings } = useSettingsContext();
  const event = feature.stocking;
  // T2-20/21: matched entries carry the water's seasonal state, so a winter
  // program's rows never read as current stock on a July visit.
  const seasonal = seasonalChipText(toWaterDecisionView(feature, settings.speciesMode, month, feature.fishability));
  if (!event)
    return (
      <div className="empty-note">
        <strong>{error ? 'Schedule unavailable' : 'No matched stocking schedule'}</strong>
        <p>
          {error
            ? 'Could not retrieve a schedule or find a saved copy. Try again when connected.'
            : 'No published entry matches this water in the available TWRA schedule. This is not confirmation that it is unstocked.'}
        </p>
        <Link className="text-action" to="/stocking">
          Browse published schedules →
        </Link>
      </div>
    );
  return (
    <>
      <div className="detail-section">
        <p className="eyebrow">Published schedule</p>
        {seasonal && <p className="seasonal-chip">{seasonal}</p>}
        <h3 className="capitalize mt-2">{event.species} trout</h3>
        <p>{event.streamName}</p>
        <p className="mt-2">
          {new Date(event.date + 'T12:00:00').toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
          {event.count != null
            ? // T2-32: a coarse date is a schedule, not an observed stocking.
              event.datePrecision && event.datePrecision !== 'day'
              ? ' · ' + event.count.toLocaleString() + ' fish scheduled'
              : ' · ' + event.count.toLocaleString() + ' fish'
            : ''}
        </p>
      </div>
      <div className="empty-note">
        <strong>Verify the timing at TWRA</strong>
        <p>
          Published schedules can describe a month or week. The stored date may not be an exact
          stocking day, and plans can change.
        </p>
        <a className="text-action" href={event.sourceUrl} target="_blank" rel="noreferrer">
          Official schedule ↗
        </a>
      </div>
      <p className="muted text-xs">
        {feature.stockingCount} matching schedule entries. Source fetched{' '}
        {new Date(event.fetchedAt).toLocaleDateString()}.
      </p>
      <Link className="text-action" to="/stocking">
        All stocking schedules →
      </Link>
    </>
  );
}
function ReportsTab({ feature }: { feature: RiverMapFeature; error?: boolean }) {
  const report = feature.report;
  const photoUrl = report?.photoUrl ? firstPartyPhotoUrl(report.photoUrl) : null;
  if (!report)
    return (
      <div className="empty-note">
        <strong>Reports unavailable here</strong>
        <p>
          A river-specific report is not available in this view. Browse the shop directory for
          attributed reports and local knowledge.
        </p>
        <Link className="text-action" to="/shops">
          Explore shops & reports →
        </Link>
      </div>
    );
  return (
    <div className="detail-section">
      <p className="eyebrow">{report.date}</p>
      <h3>{report.shopName}</h3>
      <p>{report.body}</p>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`Photo from ${report.shopName}'s report`}
          loading="lazy"
          className="report-photo mt-2 w-full rounded-lg"
          style={{ border: '1px solid var(--ui-border)' }}
        />
      ) : report.photoUrl ? (
        <p className="muted text-sm">
          Photo hosted by the shop —{' '}
          <a className="text-action" href={report.photoUrl} target="_blank" rel="noreferrer">
            view at source ↗
          </a>
        </p>
      ) : null}
      <a className="text-action" href={report.attributionUrl} target="_blank" rel="noreferrer">
        Read the attributed report ↗
      </a>
    </div>
  );
}
function LogTab({ feature, month }: { feature: RiverMapFeature; month: number }) {
  const entries =
    useLiveQuery(
      () =>
        db.logbook
          .where('streamId')
          .equals(feature.stream.id)
          .toArray()
          .then((rows) => rows.sort((a, b) => b.date.localeCompare(a.date))),
      [feature.stream.id],
    ) ?? [];
  return (
    <>
      <div className="detail-section">
        <h3>Your days on this water</h3>
        <p>Private, on-device notes. No account and no upload.</p>
      </div>
      <Link className="primary-action" to={riverWorkflowUrl('/logbook', feature.stream, month)}>
        <BookIcon size={17} />
        Add an entry for this water
      </Link>
      {entries.length === 0 ? (
        <div className="empty-note">
          <strong>A new page in your logbook.</strong>
          <p>Record the flies, conditions, and little things worth remembering.</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div className="hatch-card" key={entry.id}>
            <h3>{entry.date}</h3>
            <p>{entry.notes || 'No notes added.'}</p>
            <p>{entry.flies.join(' · ')}</p>
          </div>
        ))
      )}
    </>
  );
}
