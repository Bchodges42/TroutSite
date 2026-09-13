import index from '../features/map/riverIndex.json';
import { solarWindows } from '../lib/solar';

interface IndexEntry {
  id: string;
  anchor?: readonly number[];
}

/** The water's bundled anchor coordinates, if the index carries them. */
function anchorFor(streamId: string): [number, number] | null {
  const entry = (index as IndexEntry[]).find((r) => r.id === streamId);
  const anchor = entry?.anchor;
  if (!anchor || anchor.length < 2) return null;
  return [anchor[0]!, anchor[1]!];
}

function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * F11 — "today's windows": dawn/dusk feeding windows computed from the
 * water's coordinates and today's date (deterministic client-side solar
 * math — no API, no location permission). Labeled heuristic: solar position
 * is a proxy for feeding behavior, not a measurement. Renders nothing when
 * the water has no bundled coordinates.
 */
export function SolarWindowsCard({ streamId }: { streamId: string }) {
  const anchor = anchorFor(streamId);
  if (!anchor) return null;
  const windows = solarWindows(Date.now(), anchor[1], anchor[0]);
  if (!windows.dawnWindow || !windows.duskWindow) return null;
  return (
    <div className="detail-section solar-windows">
      <span className="eyebrow">Today&apos;s windows</span>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <p>
          <strong>
            Dawn {clockTime(windows.dawnWindow[0])} – {clockTime(windows.dawnWindow[1])}
          </strong>
        </p>
        <p>
          <strong>
            Dusk {clockTime(windows.duskWindow[0])} – {clockTime(windows.duskWindow[1])}
          </strong>
        </p>
      </div>
      <p className="muted mt-1 text-xs">
        Heuristic: roughly an hour either side of sunrise and sunset, computed
        from the water&apos;s location and today&apos;s date — not a measurement.
      </p>
    </div>
  );
}
