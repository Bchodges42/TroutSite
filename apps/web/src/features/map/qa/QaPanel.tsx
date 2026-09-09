import { useEffect, useMemo, useRef, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';
import { auditRivers, type QaDefect, type QaDefectKind, type QaReport } from './audit';
import { getRiversData } from '../TennesseeMap';
import { useTheme } from '../../../theme/ThemeProvider';
import { regionName } from '../../../data/regions';
import { referenceActive, removeReference, setTwraReference } from './reference';

/**
 * QaPanel — INTERNAL verification tooling for `?qa=1` (never advertised in
 * the normal UI; the QA chip in the map topbar is only rendered while the
 * URL param is present). Computes the connectivity/geometry audit over the
 * already-loaded rivers source ONCE per session (cached module-level), lists
 * defects grouped by hydrologic region → water, and overlays them on a TOP
 * map layer (red = hard defects, amber = duplicate corridors). Clicking a
 * row flies to the defect's first occurrence and selects that water.
 *
 * Reduced motion: camera moves run at duration 0 under prefers-reduced-motion
 * or the app's `.reduce-motion` class (same convention as the rest of the
 * map page). Layout: docked panel on desktop, bottom sheet on mobile (CSS).
 */

let cachedReport: QaReport | null = null;
let cachedPromise: Promise<QaReport> | null = null;

function computeReport(map: maplibregl.Map): Promise<QaReport> {
  if (cachedPromise) return cachedPromise;
  const attempt = getRiversData(map).then(
    (data) =>
      new Promise<QaReport>((resolve) => {
        // Defer one frame so the "computing" state paints before the sync audit.
        requestAnimationFrame(() => {
          cachedReport = auditRivers(data as { features?: Array<Record<string, unknown>> });
          resolve(cachedReport);
        });
      }),
  );
  cachedPromise = attempt;
  attempt.catch(() => {
    if (cachedPromise === attempt) cachedPromise = null; // allow a retry
  });
  return attempt;
}

const KIND_LABEL: Record<QaDefectKind, string> = {
  'dangling-end': 'Dangling end',
  'isolated-fragment': 'Isolated fragment',
  'self-crossing': 'Self-crossing',
  'duplicate-corridor': 'Duplicate corridor',
};

interface Props {
  map: maplibregl.Map | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function QaPanel({ map, onSelect, onClose }: Props) {
  const { theme } = useTheme();
  const [report, setReport] = useState<QaReport | null>(cachedReport);
  const [error, setError] = useState(false);
  const layersAdded = useRef(false);
  const [refOn, setRefOn] = useState(false);
  const [refError, setRefError] = useState(false);

  // TWRA waterways reference overlay (the compare-against-reality layer).
  useEffect(() => {
    if (!map || !refOn) return;
    let cancelled = false;
    setTwraReference(map, true, theme.map.fair).then(
      () => !cancelled && setRefError(false),
      () => {
        if (cancelled) return;
        setRefOn(false);
        setRefError(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [map, refOn, theme.id]);

  // Panel unmount removes the overlay (it lives only inside QA).
  useEffect(() => () => {
    if (map && referenceActive(map)) removeReference(map);
  }, [map]);

  // Lazily compute (once per session), then overlay on the map's TOP layer.
  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    const show = (r: QaReport) => {
      if (cancelled) return;
      setReport(r);
      const fc = defectCollection(r, theme.map.poor, theme.map.selection);
      if (map.getSource('qa-defects')) {
        (map.getSource('qa-defects') as maplibregl.GeoJSONSource).setData(fc as never);
        layersAdded.current = true;
        return;
      }
      map.addSource('qa-defects', { type: 'geojson', data: fc as never });
      // Lines first (below their markers), then points — TOP of everything.
      map.addLayer({
        id: 'qa-defect-lines',
        type: 'line',
        source: 'qa-defects',
        filter: ['==', ['get', 'isLine'], true],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['case', ['==', ['get', 'kind'], 'duplicate-corridor'], theme.map.selection, theme.map.poor],
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2.5, 11, 4],
          'line-opacity': 0.85,
          'line-dasharray': [2, 1.6],
        },
      });
      map.addLayer({
        id: 'qa-defect-halo',
        type: 'circle',
        source: 'qa-defects',
        filter: ['!=', ['get', 'isLine'], true],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 7, 10, 10],
          'circle-color': theme.map.paper,
          'circle-opacity': 0.9,
        },
      });
      map.addLayer({
        id: 'qa-defect-points',
        type: 'circle',
        source: 'qa-defects',
        filter: ['!=', ['get', 'isLine'], true],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 4.5, 10, 6.5],
          'circle-color': ['case', ['==', ['get', 'kind'], 'duplicate-corridor'], theme.map.selection, theme.map.poor],
          'circle-stroke-width': 2,
          'circle-stroke-color': theme.map.paper,
        },
      });
      layersAdded.current = true;
    };
    if (cachedReport) show(cachedReport);
    else
      computeReport(map).then(
        (r) => show(r),
        () => !cancelled && setError(true),
      );
    return () => {
      cancelled = true;
      if (layersAdded.current && map.getSource('qa-defects')) {
        try {
          map.removeLayer('qa-defect-points');
          map.removeLayer('qa-defect-halo');
          map.removeLayer('qa-defect-lines');
          map.removeSource('qa-defects');
        } catch {
          /* style torn down concurrently — nothing to clean */
        }
        layersAdded.current = false;
      }
    };
    // theme re-colors the overlay; map identity changes with remount
  }, [map, theme.id]);

  const grouped = useMemo(() => {
    if (!report) return [];
    const byRegion = new Map<string, QaDefect[]>();
    for (const d of report.defects) {
      const key = d.regionId ?? '';
      if (!byRegion.has(key)) byRegion.set(key, []);
      byRegion.get(key)!.push(d);
    }
    return [...byRegion.entries()]
      .sort((a, b) => regionLabel(a[0]).localeCompare(regionLabel(b[0])))
      .map(([regionId, defects]) => ({
        regionId,
        label: regionLabel(regionId),
        byWater: (() => {
          const m = new Map<string, { name: string; defects: QaDefect[] }>();
          for (const d of defects) {
            if (!m.has(d.featureId)) m.set(d.featureId, { name: d.featureName, defects: [] });
            m.get(d.featureId)!.defects.push(d);
          }
          return [...m.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
        })(),
      }));
  }, [report]);

  const flyTo = (defect: QaDefect, featureId: string) => {
    onSelect(featureId);
    if (!map) return;
    const reduced =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 0 : 400;
    if (defect.second) {
      map.fitBounds(
        [
          [Math.min(defect.point[0], defect.second[0]), Math.min(defect.point[1], defect.second[1])],
          [Math.max(defect.point[0], defect.second[0]), Math.max(defect.point[1], defect.second[1])],
        ],
        { padding: 120, duration, maxZoom: 11 },
      );
    } else {
      map.easeTo({ center: defect.point, zoom: Math.max(map.getZoom(), 10.5), duration });
    }
  };

  return (
    <section className="qa-panel" aria-label="Geometry QA report">
      <header className="qa-panel-head">
        <strong>Geometry QA</strong>
        {report ? (
          <span className="qa-summary">
            {report.defects.length}
            {report.stats.truncated ? '+' : ''} defects · {report.stats.lineFeatureCount} waters ·{' '}
            {report.stats.parts} parts · {report.stats.vertices} vertices
          </span>
        ) : (
          <span className="qa-summary">Computing…</span>
        )}
        <button type="button" className="qa-close" aria-label="Close QA panel" onClick={onClose}>
          ×
        </button>
      </header>
      <label className="qa-ref-toggle">
        <input
          type="checkbox"
          checked={refOn}
          onChange={(e) => {
            setRefError(false);
            const next = e.target.checked;
            setRefOn(next);
            if (!next && map) removeReference(map);
          }}
        />
        TWRA waterways reference (actual TN rivers + reservoirs, dashed amber)
      </label>
      {refError && (
        <p className="qa-note" role="alert">
          Reference service unreachable — the TWRA overlay needs network access.
        </p>
      )}
      {error && (
        <p className="qa-note" role="alert">
          Rivers geometry unavailable — the audit needs the loaded atlas source.
        </p>
      )}
      {report && report.defects.length === 0 && (
        <p className="qa-note">No defects found. The atlas passes the connectivity audit.</p>
      )}
      <div className="qa-list">
        {grouped.map((region) => (
          <div key={region.regionId || 'unassigned'} className="qa-region">
            <h3>{region.label}</h3>
            {region.byWater.map(([featureId, entry]) => (
              <div key={featureId} className="qa-water">
                <div className="qa-water-name">{entry.name}</div>
                <ul>
                  {entry.defects.slice(0, 8).map((d, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="qa-defect"
                        data-kind={d.kind}
                        aria-label={
                          KIND_LABEL[d.kind] + ' — ' + entry.name + '. Fly to and select this water.'
                        }
                        onClick={() => flyTo(d, featureId)}
                      >
                        <span className="qa-kind">{KIND_LABEL[d.kind]}</span>
                        <span className="qa-detail">{d.detail}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {entry.defects.length > 8 && (
                  <p className="qa-note">…and {entry.defects.length - 8} more on this water</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function regionLabel(regionId: string): string {
  if (!regionId) return 'Unassigned region';
  const name = regionName(regionId);
  return name ? name.split(' — ')[0]! : regionId;
}

function defectCollection(report: QaReport, poor: string, amber: string) {
  return {
    type: 'FeatureCollection' as const,
    features: report.defects.map((d, i) => ({
      type: 'Feature' as const,
      geometry:
        d.line && d.kind !== 'dangling-end' && d.kind !== 'self-crossing'
          ? ({ type: 'LineString', coordinates: d.line } as const)
          : ({ type: 'Point', coordinates: d.point } as const),
      properties: {
        kind: d.kind,
        color: d.kind === 'duplicate-corridor' ? amber : poor,
        isLine: Boolean(d.line) && d.kind !== 'dangling-end' && d.kind !== 'self-crossing',
        index: i,
      },
    })),
  };
}
