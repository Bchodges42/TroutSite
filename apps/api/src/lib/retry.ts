export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

/**
 * Retry transient fetch failures (network resets, 5xx, 429) with exponential backoff.
 * Non-transient HTTP errors (other 4xx) surface immediately. Keeps state scrapers
 * resilient against the intermittent connection resets real government sites emit,
 * without hammering them (politeness gap doubles each attempt).
 */
export async function fetchWithRetry(
  doFetch: (attempt: number) => Promise<Response>,
  opts: RetryOptions = {},
): Promise<Response> {
  const attempts = opts.attempts ?? 3;
  const baseDelay = opts.baseDelayMs ?? 1500;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await doFetch(attempt);
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (err) {
      // Network-level failures (DNS, reset, timeout) are transient by nature.
      lastError = err;
    }
    if (attempt < attempts) {
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** (attempt - 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
