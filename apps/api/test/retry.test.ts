import { describe, expect, it } from 'vitest';
import { fetchWithRetry } from '../src/lib/retry.js';

describe('fetchWithRetry', () => {
  it('retries transient 5xx/429 and network errors, then succeeds', async () => {
    let calls = 0;
    const res = await fetchWithRetry(async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('fetch failed');
      if (calls === 2) return new Response(null, { status: 503 });
      return new Response('ok', { status: 200 });
    }, { baseDelayMs: 1 });
    expect(res.status).toBe(200);
    expect(calls).toBe(3);
  });

  it('does not retry non-transient 4xx errors', async () => {
    let calls = 0;
    const res = await fetchWithRetry(async () => {
      calls += 1;
      return new Response('not found', { status: 404 });
    }, { baseDelayMs: 1 });
    expect(calls).toBe(1);
    expect(res.status).toBe(404);
  });

  it('exhausts attempts and throws the last error', async () => {
    let calls = 0;
    await expect(
      fetchWithRetry(async () => {
        calls += 1;
        throw new TypeError('fetch failed');
      }, { attempts: 2, baseDelayMs: 1 }),
    ).rejects.toThrow('fetch failed');
    expect(calls).toBe(2);
  });
});
