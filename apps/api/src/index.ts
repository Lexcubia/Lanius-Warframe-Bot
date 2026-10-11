import { serve } from '@hono/node-server';
import {
  assembleApiConfig,
  getConfigDriver,
  type AssembledApiConfig,
} from '@lanius/config';
import { isAbsolute, resolve } from 'node:path';

import { setLabelOverrides } from './adapters/worldstate/label-overrides.js';
import { WarframeMarketClient } from './adapters/warframe-market/client.js';
import { createCacheStore } from './cache/redis-cache-store.js';
import { createApp } from './create-app.js';
import { openLaniusDb } from './db/client.js';
import { seedDatabaseIfEmpty } from './db/seed.js';
import { createLogger } from './lib/logger.js';
import { ItemIconService } from './services/item-icon-service.js';
import { MarketService } from './services/market-service.js';
import { PushService } from './services/push-service.js';
import { RivenService } from './services/riven-service.js';
import { RotationService } from './services/rotation-service.js';
import { TraderService } from './services/trader-service.js';
import { WorldstateService } from './services/worldstate-service.js';

/**
 * 解析 monorepo 根。
 *
 * @param cwd - 工作目录
 * @returns 仓库根
 */
function resolveRepoRoot(cwd: string = process.cwd()): string {
  if (cwd.replace(/\\/g, '/').endsWith('/apps/api')) {
    return resolve(cwd, '../..');
  }
  return cwd;
}

/**
 * 启动 API。
 *
 * @returns 无返回值
 */
async function main(): Promise<void> {
  const repoRoot = resolveRepoRoot();
  const configDriver = getConfigDriver({ repoRoot });
  let config: AssembledApiConfig = assembleApiConfig(configDriver);

  const logger = createLogger();
  logger.info(
    { configRoot: configDriver.configRoot },
    'config driver ready',
  );

  setLabelOverrides(configDriver.get('labels'));
  let site = configDriver.get('site');

  configDriver.subscribe('labels', (labels) => {
    setLabelOverrides(labels);
    logger.info('labels config reloaded');
  });
  configDriver.subscribe('site', (next) => {
    site = next;
    logger.info('site config reloaded');
  });
  configDriver.subscribe('api', () => {
    config = assembleApiConfig(configDriver);
    logger.info('api config reloaded (upstream/token); bind address needs restart');
  });
  configDriver.subscribe('admin', () => {
    config = assembleApiConfig(configDriver);
    logger.info('admin config reloaded');
  });
  configDriver.subscribe('defaults', () => {
    config = assembleApiConfig(configDriver);
  });
  configDriver.subscribe('redis', () => {
    config = assembleApiConfig(configDriver);
    logger.warn('redis.url changed — process restart required to reconnect');
  });
  configDriver.subscribe('database', () => {
    config = assembleApiConfig(configDriver);
    logger.warn('database.sqlitePath changed — process restart required');
  });

  const sqlitePath = isAbsolute(config.database.sqlitePath)
    ? config.database.sqlitePath
    : resolve(repoRoot, config.database.sqlitePath);
  const db = openLaniusDb(sqlitePath);
  seedDatabaseIfEmpty(db);
  logger.info({ sqlitePath }, 'sqlite ready');

  const cache = await createCacheStore(config.redis.url);
  logger.info({ cache: await cache.ping() }, 'cache store ready');

  const wfm = new WarframeMarketClient({
    baseUrl: config.api.upstream.warframeMarketUrl,
    timeoutMs: config.api.upstream.timeoutMs,
  });

  const itemIconService = new ItemIconService({ cache, logger });
  // 后台预热图标目录，避免首个商人/入侵请求阻塞拉取 Export 分册。
  void itemIconService.getCatalog().catch((error: unknown) => {
    logger.warn(
      {
        err:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { name: 'UnknownError', message: String(error) },
      },
      'item icon catalog warm-up failed',
    );
  });
  const worldstateService = new WorldstateService({
    cache,
    worldstateUrl: config.api.upstream.worldstateUrl,
    timeoutMs: config.api.upstream.timeoutMs,
    logger,
    itemIconService,
  });
  const marketService = new MarketService({ cache, client: wfm });
  const rivenService = new RivenService({ cache, client: wfm });
  const traderService = new TraderService({
    worldstateService,
    itemIconService,
  });
  const rotationService = new RotationService({ db, itemIconService });
  const pushService = new PushService({
    db,
    worldstateService,
    traderService,
    rotationService,
    realm: config.defaults.realm,
    locale: config.defaults.locale,
  });

  // 可变上下文：路由经 getter 读最新 config/site
  const appContext = {
    get config() {
      return config;
    },
    configDriver,
    logger,
    startedAtMs: Date.now(),
    cache,
    db,
    worldstateService,
    marketService,
    rivenService,
    traderService,
    rotationService,
    pushService,
    get site() {
      return site;
    },
    version: '0.0.0',
  };

  const app = createApp(appContext);

  const host = process.env.HOST ?? config.api.host;
  const port = Number(process.env.PORT ?? config.api.port);

  logger.info({ host, port, configRoot: configDriver.configRoot }, 'starting lanius-api');

  serve({
    fetch: app.fetch,
    hostname: host,
    port,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
