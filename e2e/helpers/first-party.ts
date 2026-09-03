/**
 * Shared e2e helpers — ROLE 5.
 */
import type { Request } from '@playwright/test';

/** Origins that are always first-party/scheme-internal and never a leak. */
export function isThirdParty(requestUrl: string, baseURL: string): boolean {
  const url = new URL(requestUrl);
  if (!['http:', 'https:'].includes(url.protocol)) return false; // data:, blob:, about:
  const base = new URL(baseURL);
  return url.origin !== base.origin;
}

/** Collect every request a page makes; classify third-party vs first-party. */
export class RequestRecorder {
  readonly all: Request[] = [];

  constructor(
    private readonly page: import('@playwright/test').Page,
    private readonly baseURL: string,
  ) {
    page.on('request', (req) => this.all.push(req));
  }

  thirdParty(): Request[] {
    return this.all.filter((r) => isThirdParty(r.url(), this.baseURL));
  }

  /** Cross-origin or POST requests whose payload might carry location data. */
  sentBodies(): { url: string; postData: string | null }[] {
    return this.all
      .filter((r) => r.method() !== 'GET')
      .map((r) => ({ url: r.url(), postData: r.postData() }));
  }
}

/** Init script that flags any use of geolocation APIs (privacy audit). */
export const GEOLOCATION_SPY = `
  window.__geoCalls = { getCurrentPosition: 0, watchPosition: 0 };
  try {
    if (navigator.geolocation) {
      const orig = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (...a) => { window.__geoCalls.getCurrentPosition++; return orig.getCurrentPosition(...a); },
          watchPosition: (...a) => { window.__geoCalls.watchPosition++; return orig.watchPosition(...a); },
          clearWatch: (...a) => orig.clearWatch(...a),
        },
      });
    }
  } catch {}
`;

/** The PWA routes the finished v1 app must expose (sweep target for privacy audit). */
export const WEB_ROUTES = ['/', '/hatch', '/conditions', '/stocking', '/id'];
