/**
 * "Near me" — 100% on-device (privacy non-negotiable #2).
 * Coordinates come from the browser Geolocation API, feed a haversine against
 * the bundled stream coordinates, and are never stored, sent, or logged.
 * There is no geo column in any contract type by design; the coordinates here
 * are approximate USGS gauge locations, public data, bundled with the app.
 */

export interface StreamGeo {
  streamId: string;
  lat: number;
  lon: number;
}

const EARTH_RADIUS_MI = 3958.8;

export function haversineMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h));
}

export interface NearestStream<S> {
  stream: S;
  miles: number;
}

/** Sort streams by distance to `coords`; pure, no side effects. */
export function nearestStreams<S extends { id: string }>(
  streams: S[],
  geoByStreamId: Record<string, { lat: number; lon: number }>,
  coords: { lat: number; lon: number },
): NearestStream<S>[] {
  return streams
    .map((stream) => {
      const geo = geoByStreamId[stream.id];
      return geo ? { stream, miles: haversineMiles(coords, geo) } : null;
    })
    .filter((v): v is NearestStream<S> => v !== null)
    .sort((a, b) => a.miles - b.miles);
}

export function formatMiles(miles: number): string {
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Thin promise wrapper; the coordinates live only in the returned value. */
export function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser does not expose the Geolocation API.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message)),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  });
}
