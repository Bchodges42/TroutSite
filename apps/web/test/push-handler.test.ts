import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(join(process.cwd(), 'public', 'push-handler.js'), 'utf8');

interface WorkerEvent {
  data?: { json(): unknown };
  notification?: { close(): void; data?: { url: string } };
  waitUntil(promise: Promise<unknown>): void;
}

function worker() {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const self = { location: { origin: 'https://trout.test' }, registration: { showNotification },
    clients: { matchAll: vi.fn().mockResolvedValue([]), openWindow },
    addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler) };
  runInNewContext(source, { self, URL });
  return { handlers, self, showNotification, openWindow };
}

async function dispatch(handler: (event: WorkerEvent) => void, event: Omit<WorkerEvent, 'waitUntil'>) {
  let work: Promise<unknown> | undefined;
  handler({ ...event, waitUntil: (promise: Promise<unknown>) => { work = promise; } });
  await work;
}

describe('notification delivery in the closed-app worker', () => {
  it('displays the real payload and keeps the water deep link', async () => {
    const w = worker();
    await dispatch(w.handlers.get('push')!, { data: { json: () => ({ title: 'River cooled', body: 'Measured water temperature', url: '/conditions/watauga-river' }) } });
    expect(w.showNotification).toHaveBeenCalledWith('River cooled', expect.objectContaining({ body: 'Measured water temperature', data: { url: 'https://trout.test/conditions/watauga-river' } }));
  });
  it('shows a generic notification for a malformed payload', async () => {
    const w = worker();
    await dispatch(w.handlers.get('push')!, { data: { json: () => { throw new Error('bad JSON'); } } });
    expect(w.showNotification).toHaveBeenCalledWith('Trout watch update', expect.any(Object));
  });
  it.each(['https://attacker.test/conditions', '//attacker.test/conditions', 'javascript:alert(1)', '/corrections/review'])('never opens an unsafe notification target: %s', async (url) => {
    const w = worker();
    await dispatch(w.handlers.get('notificationclick')!, { notification: { close: vi.fn(), data: { url } } });
    expect(w.openWindow).toHaveBeenCalledWith('https://trout.test/conditions');
  });
});
