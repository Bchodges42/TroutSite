import type { ConditionSnapshot, Stream } from '@trout/contracts';
import { formatFlow } from '../lib/units';
import { gaugeSourceLabel } from '../lib/presentation';

/** Reference measurements and historical normals never wear a local/live score. */
export function WaterSourceContext({ stream, snapshot }: { stream: Stream; snapshot?: ConditionSnapshot }) {
  const history = snapshot?.historicalFlow;
  return (
    <div className="mt-3 space-y-2 text-sm" aria-label="Measurement sources and flow context">
      {stream.idealFlowSource === 'editorial' && stream.idealFlow.length > 0 && (
        <p>Flow bands and the flow-based score are editorial guidance. They have not been validated as ideal fishing or safe-wading limits.</p>
      )}
      {stream.gaugePolicy && <p>{stream.gaugePolicy.note}</p>}
      {history && (
        <p>
          Historical {new Date(Date.UTC(2000, history.month - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} flow:
          {' '}{formatFlow(history.p25)}–{formatFlow(history.p75)} (25th–75th percentiles);
          {' '}median {formatFlow(history.median)}. USGS reports {history.sampleCount} approved samples.
          {' '}<a className="text-action" href={history.sourceUrl} target="_blank" rel="noopener noreferrer">USGS historical source</a>
          {' '}Retrieved {history.retrievedAt.slice(0, 10)}. Historical context does not establish fishing or wading limits.
        </p>
      )}
      {Boolean(stream.gaugePolicy?.references.length) && (
        <details>
          <summary>Reference gauges (excluded from the local assessment)</summary>
          <ul className="mt-2 space-y-2">
            {stream.gaugePolicy!.references.map(({ gaugeId, note }) => {
              const reading = snapshot?.referenceReadings?.find((r) => r.gaugeId === gaugeId);
              return <li key={gaugeId}>
                <strong>{gaugeSourceLabel(gaugeId)}</strong>: {note}
                {reading?.cfs !== undefined ? ` Reference flow ${formatFlow(reading.cfs)}, observed ${reading.timestamp}.` : ' No current reference flow available.'}
              </li>;
            })}
          </ul>
        </details>
      )}
    </div>
  );
}
