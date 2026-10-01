import { useId, useState, type FormEvent } from 'react';
import { Button } from '@trout/ui';
import { createServerRule, rememberSubscriptionId, storedSubscriptionId, subscribeToPush,
  type WatchKind, type WatchMetric, type WatchRuleDraft } from './useWatches';

/** Explicit enrollment: no permission prompt or server write until Submit. */
export function WatchRuleForm({ waterId, publicKey, onSaved }: {
  waterId: string; publicKey: string; onSaved(): void;
}) {
  const id = useId();
  const [kind, setKind] = useState<WatchKind>('condition');
  const [metric, setMetric] = useState<WatchMetric>('tempC');
  const [op, setOp] = useState<'above' | 'below'>('below');
  const [threshold, setThreshold] = useState('21');
  const [margin, setMargin] = useState('1');
  const [cooldown, setCooldown] = useState('240');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [zone, setZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (Boolean(start) !== Boolean(end)) { setMessage('Set both quiet-hour times, or leave both empty.'); return; }
    try { new Intl.DateTimeFormat('en-US', { timeZone: zone }); }
    catch { setMessage('Enter a valid time zone, such as America/Chicago or America/New_York.'); return; }
    setBusy(true); setMessage('');
    try {
      let subscription = storedSubscriptionId();
      if (!subscription) { subscription = await subscribeToPush(publicKey); rememberSubscriptionId(subscription); }
      const rule: WatchRuleDraft = { kind, cooldownMinutes: Number(cooldown), hysteresis: kind === 'condition' ? Number(margin) : 0,
        ...(kind === 'condition' ? { metric, thresholdOp: op, threshold: Number(threshold) } : {}),
        ...(kind === 'source-outage' ? { metric } : {}),
        ...(start && end ? { quietHoursStart: start, quietHoursEnd: end, quietHoursTimeZone: zone } : {}) };
      await createServerRule(subscription, waterId, rule);
      setMessage('Watch saved. You can remove individual rules in Settings.'); onSaved();
    } catch { setMessage('This rule could not be saved. Check your connection, notification permission, and values.'); }
    finally { setBusy(false); }
  }
  const label = 'flex flex-col gap-1 text-sm';
  return <details className="mt-2">
    <summary className="focus-ring text-sm">Add a custom watch</summary>
    <form onSubmit={(event) => void submit(event)} className="mt-2 flex flex-col gap-3 max-w-lg">
      <label className={label}>Notify me about
        <select value={kind} onChange={(event) => setKind(event.target.value as WatchKind)}>
          <option value="condition">Measured conditions crossing a threshold</option>
          <option value="stocking">New published stocking information</option>
          <option value="report">New attributed shop reports</option>
          <option value="source-outage">Measurement source unavailable or restored</option>
        </select>
      </label>
      {(kind === 'condition' || kind === 'source-outage') && <>
        <label className={label}>Measurement
          <select value={metric} onChange={(event) => { setMetric(event.target.value as WatchMetric); setThreshold(event.target.value === 'cfs' ? '300' : '21'); setMargin(event.target.value === 'cfs' ? '20' : '1'); }}>
            <option value="tempC">Water temperature (°C)</option><option value="cfs">Flow (cfs)</option>
          </select>
        </label>
      </>}
      {kind === 'source-outage' && <p className="muted text-xs">Separate from condition alerts. The first known state sets a quiet baseline; later loss or return of fresh readings can notify. Unsupported measurements stay unknown. An unavailable source says nothing about whether fishing is good or safe.</p>}
      {kind === 'condition' && <>
        <label className={label}>Direction<select value={op} onChange={(event) => setOp(event.target.value as 'above' | 'below')}>
          <option value="below">Drops below</option><option value="above">Rises above</option>
        </select></label>
        <label className={label}>Threshold ({metric === 'cfs' ? 'cfs' : '°C'})
          <input type="number" step="any" required min={metric === 'cfs' ? 0 : -100} max="100000" value={threshold} onChange={(event) => setThreshold(event.target.value)} />
        </label>
        <label className={label}>Buffer ({metric === 'cfs' ? 'cfs' : '°C'})
          <input type="number" step="any" required min="0" max="1000" value={margin} onChange={(event) => setMargin(event.target.value)} />
        </label>
        <p className="muted text-xs">A notice requires crossing past the threshold by this buffer. Crossing back by the same buffer rearms it. Only fresh measurements qualify.</p>
      </>}
      <label className={label}>Minimum minutes between notices<input type="number" required min="15" max="10080" value={cooldown} onChange={(event) => setCooldown(event.target.value)} /></label>
      <fieldset className="flex flex-wrap gap-3"><legend className="text-sm">Optional quiet hours</legend>
        <label className={label} htmlFor={`${id}-start`}>Start<input id={`${id}-start`} type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label>
        <label className={label} htmlFor={`${id}-end`}>End<input id={`${id}-end`} type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      </fieldset>
      <label className={label}>Quiet-hours time zone<input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="America/Chicago" /></label>
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save custom watch'}</Button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  </details>;
}
