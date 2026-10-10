import { serve } from '@hono/node-server';
import { resolve } from 'node:path';

import { createApp } from './create-app.js';
import { loadAppConfig } from './config/load-config.js';
import { createLogger } from './lib/logger.js';
import { TtlCache } from './lib/ttl-cache.js';
import { WorldstateService } from './services/worldstate-service.js';
import type { WorldstateDto } from '@lanius/core';

/**
 * Resolves the monorepo root for config loading.
 * When started via `pnpm --filter @lanius/api`, cwd is often `apps/api`.
 *
 * @param cwd - Process working directory.
 * @returns Absolute path to the repository root (parent of `apps/` when applicable).
 */
function resolveRepoRoot(cwd: string = process.cwd()): string {
  if (cwd.replace(/\\/g, '/').endsWith('/apps/api')) {
    return resolve(cwd, '../..');
  }
  return cwd;
}

/**
 * Bootstraps config, services, and the HTTP server.
 *
 * @returns No return value; process stays alive while listening.
 */
function main(): void {
  const repoRoot = resolveRepoRoot();
  const config = loadAppConfig(repoRoot);
  const logger = createLogger();
  const worldstateCache = new TtlCache<WorldstateDto>();
  const worldstateService = new WorldstateService({
    cache: worldstateCache,
    worldstateUrl: config.api.upstream.worldstateUrl,
    timeoutMs: config.api.upstream.timeoutMs,
    logger,
  });

  const app = createApp({
    config,
    logger,
    startedAtMs: Date.now(),
    worldstateCache,
    worldstateService,
    version: '0.0.0',
  });

  const host = process.env.HOST ?? config.api.host;
  const port = Number(process.env.PORT ?? config.api.port);

  logger.info({ host, port, configRoot: repoRoot }, 'starting lanius-api');

  serve({
    fetch: app.fetch,
    hostname: host,
    port,
  });
}

main();
