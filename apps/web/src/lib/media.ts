/**
 * Return a report photo only when it is hosted by this app's origin. External
 * photo URLs remain useful as explicit source links, but an <img> would make
 * the PWA contact a third party without the user's action.
 */
export function firstPartyPhotoUrl(photoUrl: string, origin = window.location.origin): string | null {
  try {
    const parsed = new URL(photoUrl, origin);
    return parsed.origin === origin ? parsed.href : null;
  } catch {
    return null;
  }
}
