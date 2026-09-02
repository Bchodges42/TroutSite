import { buildApp } from './app.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const app = buildApp({ logger: true });

app
  .listen({ port: env.PORT, host: env.HOST })
  .then((address) => {
    app.log.info(`trout api listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.close().finally(() => process.exit(0));
  });
}
