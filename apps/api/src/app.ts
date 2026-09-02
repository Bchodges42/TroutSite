import Fastify, { type FastifyInstance } from 'fastify';

export interface BuildAppOptions {
  logger?: boolean;
}

/** Fastify app factory. ROLE 1 skeleton: only /healthz. ROLE 3 adds the portal write route. */
export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  app.get('/healthz', async () => ({ ok: true }));

  return app;
}
