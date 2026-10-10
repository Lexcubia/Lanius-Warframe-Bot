import { serve } from '@hono/node-server';
import pino from 'pino';

import { loadBotConfig, resolveRepoRoot } from './config.js';
import { createBotApp } from './create-app.js';

/**
 * 启动官方 QQ Bot HTTP 进程。
 *
 * @returns 无返回值；进程持续监听直至退出
 */
function main(): void {
  const repoRoot = resolveRepoRoot();
  const config = loadBotConfig(repoRoot);
  const logger = pino({ name: 'lanius-bot', level: 'info' });
  const app = createBotApp(config, logger);

  const host = process.env.HOST ?? config.bot.host;
  const port = Number(process.env.PORT ?? config.bot.port);

  logger.info(
    { host, port, apiBaseUrl: config.bot.apiBaseUrl, dryRun: config.bot.dryRun },
    'starting lanius-bot',
  );

  serve({ fetch: app.fetch, hostname: host, port });
}

main();
