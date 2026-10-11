import type { ConfigDriver } from '@lanius/config';
import type { SiteDto } from '@lanius/core';
import type { Logger } from 'pino';

import type { CacheStore } from './cache/types.js';
import type { AppConfig } from './config/schema.js';
import type { LaniusDb } from './db/client.js';
import type { MarketService } from './services/market-service.js';
import type { PushService } from './services/push-service.js';
import type { RivenService } from './services/riven-service.js';
import type { RotationService } from './services/rotation-service.js';
import type { TraderService } from './services/trader-service.js';
import type { WorldstateService } from './services/worldstate-service.js';

/**
 * Shared runtime dependencies attached to the Hono app.
 */
export type AppContext = {
  config: AppConfig;
  /** 配置驱动（Admin 读写 / 热加载） */
  configDriver: ConfigDriver;
  logger: Logger;
  startedAtMs: number;
  cache: CacheStore;
  db: LaniusDb;
  worldstateService: WorldstateService;
  marketService: MarketService;
  rivenService: RivenService;
  traderService: TraderService;
  rotationService: RotationService;
  pushService: PushService;
  /** 运行时站点配置（页脚等） */
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
