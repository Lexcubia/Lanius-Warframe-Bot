import { createQqOfficialClient, verifyQqCallback } from '@lanius/qq-official';
import { Hono } from 'hono';
import type { Logger } from 'pino';

import type { BotConfig } from './config.js';
import { parseCommand } from './commands/parse-command.js';
import { handleCommand, type SessionPrefs } from './pipeline/handle-command.js';

/**
 * 构建 Bot HTTP 应用（健康检查 + 官方 QQ 回调）。
 *
 * @param config - 已加载的 Bot 配置
 * @param logger - 结构化日志实例
 * @returns 可对外服务的 Hono 应用
 */
export function createBotApp(config: BotConfig, logger: Logger) {
  const app = new Hono();
  const qq = createQqOfficialClient({
    appId: config.qq.appId,
    appSecret: config.qq.appSecret,
    dryRun: config.bot.dryRun,
  });
  const prefs: SessionPrefs = {
    replyMode: config.bot.defaultReplyMode,
    locale: config.defaults.locale,
  };

  app.get('/health', (c) =>
    c.json({ ok: true, service: 'lanius-bot', dryRun: config.bot.dryRun }),
  );

  app.post(config.qq.callbackPath, async (c) => {
    const rawBody = await c.req.text();
    const headers: Record<string, string | undefined> = {};
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 平台 URL 校验 / challenge 可能不带签名。
    try {
      const payload = JSON.parse(rawBody) as {
        d?: { content?: string; channel_id?: string };
        op?: number;
        type?: string;
      };
      if (payload.op === 13 || payload.type === 'url_verification') {
        return c.json(payload);
      }
    } catch {
      // 普通事件继续走签名校验
    }

    const verified = verifyQqCallback(
      { rawBody, headers },
      { appSecret: config.qq.appSecret },
    );
    if (!verified && !config.bot.dryRun) {
      logger.warn('qq callback signature rejected');
      return c.json({ ok: false }, 401);
    }

    let content = '';
    let channelId = 'unknown';
    try {
      const payload = JSON.parse(rawBody) as {
        d?: { content?: string; channel_id?: string; group_openid?: string };
      };
      content = payload.d?.content ?? '';
      channelId = payload.d?.channel_id ?? payload.d?.group_openid ?? 'unknown';
    } catch {
      return c.json({ ok: false, error: 'invalid_json' }, 400);
    }

    const parsed = parseCommand(content);
    if (!parsed.matched || !parsed.intent) {
      return c.json({ ok: true, ignored: true });
    }

    const outcome = await handleCommand(parsed.intent, { channelId }, {
      config,
      qq,
      prefs,
    });
    logger.info({ channelId, outcome, intent: parsed.intent.type }, 'command handled');
    return c.json({ ok: true, outcome });
  });

  return app;
}
