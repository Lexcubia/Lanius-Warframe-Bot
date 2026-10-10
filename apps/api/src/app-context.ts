import type { SiteDto, WorldstateDto } from '@lanius/core';
import type { Logger } from 'pino';

import type { AppConfig } from './config/schema.js';
import type { TtlCache } from './lib/ttl-cache.js';
import type { WorldstateService } from './services/worldstate-service.js';

/**
 * Shared runtime dependencies attached to the Hono app.
 */
export type AppContext = {
  config: AppConfig;
  logger: Logger;
  startedAtMs: number;
  worldstateCache: TtlCache<WorldstateDto>;
  worldstateService: WorldstateService;
  /** 运行时站点配置（页脚等，来自 config/default+local） */
  site: SiteDto;
  version: string;
};

/**
 * Hono variable map for typed middleware/route access.
 */
export type AppVariables = {
  requestId: string;
  app: AppContext;
};
