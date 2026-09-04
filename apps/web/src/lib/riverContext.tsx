import { Link, useSearchParams } from 'react-router-dom';
import { StreamSchema } from '@trout/contracts';
import { useSnapshotQuery } from './useSnapshotQuery';
import { snapshotUrls } from './endpoints';
import { currentMonth } from './time';
let lastMapUrl = '/';
export function rememberMapUrl(url: string) {
  lastMapUrl = url;
}
export function rememberedMapUrl() {
  return lastMapUrl;
}
export function validMonth(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : currentMonth();
}
export function riverWorkflowUrl(
  path: string,
  river: { id: string; regionId: string },
  month: number,
) {
  return `${path}?${new URLSearchParams({ river: river.id, region: river.regionId, month: String(month) })}`;
}
/** Carry navigation context without changing any domain data. */
export function contextUrl(
  path: string,
  source: URLSearchParams,
  overrides: Record<string, string | null> = {},
) {
  const next = new URLSearchParams();
  for (const key of ['river', 'region', 'month']) {
    const value = Object.hasOwn(overrides, key) ? overrides[key] : source.get(key);
    if (value) next.set(key, value);
  }
  return path + (next.size ? '?' + next.toString() : '');
}
export function useRiverContext() {
  const [params] = useSearchParams();
  const riverId = params.get('river');
  const catalog = useSnapshotQuery(
    snapshotUrls.streams,
    StreamSchema.array(),
    1440,
    Boolean(riverId),
  );
  const stream = catalog.data?.data.find((s) => s.id === riverId);
  return {
    riverId,
    stream,
    month: validMonth(params.get('month')),
    region: stream?.regionId ?? params.get('region'),
  };
}
export function RiverContextBar() {
  const [params] = useSearchParams();
  const { stream, riverId } = useRiverContext();
  if (!riverId) return null;
  const remembered = rememberedMapUrl();
  const to =
    new URLSearchParams(remembered.split('?')[1]).get('river') === riverId
      ? remembered
      : contextUrl('/', params);
  return (
    <div className="river-context">
      <span>
        <span className="eyebrow">On this water</span>
        <strong>{stream?.name ?? 'Selected river'}</strong>
      </span>
      <Link to={to}>← Back to map</Link>
    </div>
  );
}
