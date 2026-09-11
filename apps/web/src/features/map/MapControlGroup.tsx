import { useEffect, useRef, type ReactNode } from 'react';
import { CompassIcon, LayersIcon, LocationIcon } from '../../components/icons';

/**
 * MapControlGroup — ONE restrained floating cluster, top-right, replacing the
 * old same-sized pill row. Three 44×44 controls:
 *   Tennessee · Layers · Near me.
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
  layersPanel,
}: {
  onRecenter: () => void;
  layersOpen: boolean;
  onLayersToggle: () => void;
  onLocate: () => void;
  locating: boolean;
  layersPanel?: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLButtonElement>(null);
  const layersWasOpen = useRef(false);

  useEffect(() => {
    if (!layersOpen) return;
    // Outside-press containment is checked against the WRAPPER, which contains
    // both the control group and the layer picker it opens. The picker renders
    // as a sibling of the toolbar, so testing containment against the toolbar
    // alone treated every press INSIDE the picker as an outside press: mousedown
    // unmounted the panel before the click could reach its inputs, so Terrain
    // and Roads appeared to close the menu without activating.
    const isOutsidePress = (target: EventTarget | null) =>
      !wrapRef.current || !wrapRef.current.contains(target as Node);
    // pointerdown covers mouse, touch, and pen uniformly; the mousedown
    // fallback keeps dismissal working where PointerEvent is unavailable.
    // Listening at pointerdown (not click) matches native popover semantics:
    // a press that starts elsewhere dismisses before it can click through.
    const onDocPress = (e: Event) => {
      if (isOutsidePress(e.target)) onLayersToggle();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // The app menu sits above this group in the Escape hierarchy.
      if (document.getElementById('app-menu')) return;
      e.stopPropagation();
      onLayersToggle();
    };
    document.addEventListener('pointerdown', onDocPress);
    document.addEventListener('mousedown', onDocPress);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPress);
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
    <div ref={wrapRef} className="map-fab-wrap">
      <div className="map-fab-group" role="toolbar" aria-label="Map controls">
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
      </div>
      {layersOpen && layersPanel && (
        <div className="layer-picker" role="group" aria-label="Map layers">
          {layersPanel}
        </div>
      )}
    </div>
  );
}
