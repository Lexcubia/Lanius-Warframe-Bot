import type { Logger } from 'pino';

import type { AppConfig } from './config/schema.js';
import type { TtlCache } from './lib/ttl-cache.js';
import type { WorldstateService } from './services/worldstate-service.js';
import type { WorldstateDto } from '@lanius/core';

/**
 * Shared runtime dependencies attached to the Hono app.
 */
export type AppContext = {
  config: AppConfig;
  logger: Logger;
  startedAtMs: number;
  worldstateCache: TtlCache<WorldstateDto>;
  worldstateService: WorldstateService;
  version: string;
};

/**
 * Hono variable map for typed middleware/route access.
 */
export type AppVariables = {
  requestId: string;
  app: AppContext;
};
