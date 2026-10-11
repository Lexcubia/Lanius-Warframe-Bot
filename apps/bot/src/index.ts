import { serve } from '@hono/node-server';
import { syncQqCommandPanels } from '@lanius/qq-official';
import pino from 'pino';

import { loadBotConfig, resolveRepoRoot } from './config.js';
import { createBotApp } from './create-app.js';
import { buildQqPanelItems } from './qq/build-panel-items.js';

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

  // 启动后异步同步指令面板；失败不阻断 HTTP 服务（发信仍可用手动输入）。
  if (!config.bot.dryRun) {
    void syncQqCommandPanels({
      appId: config.qq.appId,
      appSecret: config.qq.appSecret,
      cache: qq.getAccessTokenCache(),
      items: buildQqPanelItems(),
    })
      .then((results) => {
        logger.info({ results }, 'qq command panels synced');
      })
      .catch((error: unknown) => {
        logger.warn(
          { err: error instanceof Error ? error.message : String(error) },
          'qq command panels sync failed',
        );
      });
  }
}

main();
