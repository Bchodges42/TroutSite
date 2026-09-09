import type * as maplibregl from 'maplibre-gl';

/**
 * TWRA waterways reference overlay — the `?qa=1` comparison layer that draws
 * the actual Tennessee waterways (TWRA RiversReservoirs FeatureServer, the
 * same service the atlas builders cross-check against) UNDER the atlas
 * geometry so shape/position drift is eyeballable.
 *
 * Fetched once per session, server-simplified at the atlas's own tolerance
 * (maxAllowableOffset: rivers ~22 m, reservoirs ~50 m ≈ the 50 m weld eps)
 * — raw reservoirs are ~26 MB, simplified ~1.2 MB. Public data (TWRA).
 */

const RIVERS_URL =
  'https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/RiversReservoirs/FeatureServer/0/query?f=geojson&where=1=1&outFields=*&outSR=4326&maxAllowableOffset=0.0002';
const RESERVOIRS_URL =
  'https://services3.arcgis.com/PWXNAH2YKmZY7lBq/arcgis/rest/services/RiversReservoirs/FeatureServer/1/query?f=geojson&where=1=1&outFields=*&outSR=4326&maxAllowableOffset=0.0005';

let cachedFetch: Promise<[unknown, unknown]> | null = null;

function fetchReference(): Promise<[unknown, unknown]> {
  if (!cachedFetch) {
    cachedFetch = Promise.all([
      fetch(RIVERS_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error('rivers ' + r.status)))),
      fetch(RESERVOIRS_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error('reservoirs ' + r.status)))),
    ]);
    cachedFetch.catch(() => {
      cachedFetch = null; // allow a retry on next toggle
    });
  }
  return cachedFetch;
}

const SOURCE_RIVERS = 'twra-ref-rivers';
const SOURCE_RESERVOIRS = 'twra-ref-reservoirs';
const LAYERS = [
  'twra-ref-reservoirs-fill',
  'twra-ref-reservoirs-line',
  'twra-ref-rivers-line',
];

/** True once the reference sources/layers are on the map. */
export function referenceActive(map: maplibregl.Map): boolean {
  return map.getSource(SOURCE_RIVERS) != null;
}

export function setTwraReference(
  map: maplibregl.Map,
  on: boolean,
  color: string,
): Promise<void> {
  if (!on) {
    removeReference(map);
    return Promise.resolve();
  }
  if (referenceActive(map)) return Promise.resolve();
  return fetchReference().then(([rivers, reservoirs]) => {
    // The panel may have toggled off while the fetch was in flight.
    if (!referenceActive(map)) {
      map.addSource(SOURCE_RIVERS, { type: 'geojson', data: rivers as never });
      map.addSource(SOURCE_RESERVOIRS, { type: 'geojson', data: reservoirs as never });
      map.addLayer({
        id: 'twra-ref-reservoirs-fill',
        type: 'fill',
        source: SOURCE_RESERVOIRS,
        paint: { 'fill-color': color, 'fill-opacity': 0.1 },
      });
      map.addLayer({
        id: 'twra-ref-reservoirs-line',
        type: 'line',
        source: SOURCE_RESERVOIRS,
        paint: { 'line-color': color, 'line-width': 1.2, 'line-opacity': 0.75 },
      });
      map.addLayer({
        id: 'twra-ref-rivers-line',
        type: 'line',
        source: SOURCE_RIVERS,
        paint: {
          'line-color': color,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.4, 11, 2.2],
          'line-opacity': 0.8,
          'line-dasharray': [2.4, 1.6],
        },
      });
    }
  });
}

export function removeReference(map: maplibregl.Map): void {
  for (const id of LAYERS) {
    if (map.getLayer(id)) {
      try {
        map.removeLayer(id);
      } catch {
        /* style torn down concurrently — nothing to clean */
      }
    }
  }
  for (const id of [SOURCE_RIVERS, SOURCE_RESERVOIRS]) {
    if (map.getSource(id)) {
      try {
        map.removeSource(id);
      } catch {
        /* same */
      }
    }
  }
}
