import { useEffect, useRef, type ReactNode } from 'react';
import { CompassIcon, LayersIcon, LocationIcon, SearchIcon } from '../../components/icons';

/**
 * MapControlGroup — ONE restrained floating cluster, top-right, replacing the
 * old same-sized pill row. Four 44×44 controls:
 *   Tennessee · Layers · Near me · Search.
 *
 * Tooltips are fluid (spring ease, soft rise) but pure CSS via `data-tip`:
 * they appear on hover AND keyboard focus, are never required for
 * comprehension (every control carries an accessible name), never trap focus,
 * and are suppressed for coarse pointers where the tap target speaks for
 * itself. No tooltip dependency is added.
 *
 * The Layers control opens the layer popover passed as `layersPanel`; the
 * group owns the dismissal behavior (Escape, outside press, focus return) so
 * the page keeps a single Escape hierarchy: app menu → layers → inspector.
 */
export function MapControlGroup({
  onRecenter,
  layersOpen,
  onLayersToggle,
  onLocate,
  locating,
  onOpenSearch,
  layersPanel,
}: {
  onRecenter: () => void;
  layersOpen: boolean;
  onLayersToggle: () => void;
  onLocate: () => void;
  locating: boolean;
  onOpenSearch: () => void;
  layersPanel?: ReactNode;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLButtonElement>(null);
  const layersWasOpen = useRef(false);

  useEffect(() => {
    if (!layersOpen) return;
    const onDocPress = (e: MouseEvent) => {
      if (!groupRef.current?.contains(e.target as Node)) onLayersToggle();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // The app menu sits above this group in the Escape hierarchy.
      if (document.getElementById('app-menu')) return;
      e.stopPropagation();
      onLayersToggle();
    };
    document.addEventListener('mousedown', onDocPress);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocPress);
      window.removeEventListener('keydown', onKey);
    };
  }, [layersOpen, onLayersToggle]);

  // Focus returns to the Layers control when the panel CLOSES — never on
  // mount, or the group would steal focus from the page on first load.
  useEffect(() => {
    if (layersOpen) {
      layersWasOpen.current = true;
      return;
    }
    if (layersWasOpen.current) {
      layersWasOpen.current = false;
      layersRef.current?.focus();
    }
  }, [layersOpen]);

  return (
    <div className="map-fab-wrap">
      <div ref={groupRef} className="map-fab-group" role="toolbar" aria-label="Map controls">
        <button
          type="button"
          className="map-fab"
          data-tip="Show all Tennessee"
          aria-label="Center map on Tennessee"
          onClick={onRecenter}
        >
          <CompassIcon size={20} />
        </button>
        <button
          type="button"
          ref={layersRef}
          className="map-fab"
          data-tip="Map layers"
          aria-label="Map layers"
          aria-expanded={layersOpen}
          aria-haspopup="true"
          onClick={onLayersToggle}
        >
          <LayersIcon size={20} />
        </button>
        <button
          type="button"
          className="map-fab"
          data-tip={locating ? 'Finding you…' : 'Near me · stays on device'}
          aria-label="Use my location"
          disabled={locating}
          onClick={onLocate}
        >
          <LocationIcon size={20} />
        </button>
        <button
          type="button"
          className="map-fab map-fab-search"
          data-tip="Search waters"
          aria-label="Search waters"
          onClick={onOpenSearch}
        >
          <SearchIcon size={20} />
        </button>
      </div>
      {layersOpen && layersPanel && (
        <div className="layer-picker" role="group" aria-label="Map layers">
          {layersPanel}
        </div>
      )}
    </div>
  );
}
