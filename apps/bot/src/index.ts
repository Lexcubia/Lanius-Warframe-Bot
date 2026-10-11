import { serve } from '@hono/node-server';
import {
  syncQqCommandPanels,
  syncQqCustomMenu,
  type AccessTokenCache,
} from '@lanius/qq-official';
import pino from 'pino';

import { loadBotConfig, resolveRepoRoot, type BotConfig } from './config.js';
import { createBotApp } from './create-app.js';
import { buildQqMenuItems } from './qq/build-panel-items.js';
import { buildQqPanelSyncOptions } from './qq/panel-sync-options.js';

/**
 * 启动官方 QQ Bot HTTP 进程。
 *
 * @returns 无返回值；进程持续监听直至退出
 */
function main(): void {
  const repoRoot = resolveRepoRoot();
  const config = loadBotConfig(repoRoot);
  const logger = pino({ name: 'lanius-bot', level: 'info' });
  const { app, qq } = createBotApp(config, logger);

  const host = process.env.HOST ?? config.bot.host;
  const port = Number(process.env.PORT ?? config.bot.port);

  logger.info(
    { host, port, apiBaseUrl: config.bot.apiBaseUrl, dryRun: config.bot.dryRun },
    'starting lanius-bot',
  );

  serve({ fetch: app.fetch, hostname: host, port });

  // 启动后同步自定义菜单 + 指令面板；失败只打日志，不阻断回调服务。
  if (!config.bot.dryRun) {
    void syncQqUi(config, qq.getAccessTokenCache(), logger);
  }
}

/**
 * 向开放平台同步单聊菜单与各场景指令面板。
 *
 * @param config - Bot 配置（含 AppID/Secret 与可选官网）
 * @param cache - 与发信共用的 access_token 缓存槽
 * @param logger - 结构化日志
 * @returns 无返回值
 */
async function syncQqUi(
  config: BotConfig,
  cache: { current?: AccessTokenCache },
  logger: pino.Logger,
): Promise<void> {
  const creds = {
    appId: config.qq.appId,
    appSecret: config.qq.appSecret,
    cache,
  };

  const menu = await syncQqCustomMenu({
    ...creds,
    items: buildQqMenuItems(),
    siteUrl: config.bot.publicSiteBaseUrl?.startsWith('https://')
      ? config.bot.publicSiteBaseUrl
      : undefined,
  });
  if (menu.action === 'failed') {
    logger.warn({ err: menu.detail }, 'qq custom menu sync failed');
  } else {
    logger.info({ version: menu.version }, 'qq custom menu synced');
  }

  // c2c 可尝试 all；群面板在收到 GROUP_AT / GROUP_ADD 时按 specific 绑定。
  const panels = await syncQqCommandPanels(buildQqPanelSyncOptions(config, cache));
  const failed = panels.filter((row) => row.action === 'failed');
  if (failed.length > 0) {
    logger.warn({ results: panels }, 'qq command panels sync partial failure');
  } else {
    logger.info({ results: panels }, 'qq command panels synced');
  }
}

main();
