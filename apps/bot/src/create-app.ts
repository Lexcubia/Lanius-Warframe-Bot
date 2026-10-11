import {
  createQqOfficialClient,
  ensureQqGroupCommandPanel,
  signQqWebhookValidation,
  verifyQqCallback,
  type QqOfficialClient,
} from '@lanius/qq-official';
import { Hono } from 'hono';
import type { Logger } from 'pino';

import type { BotConfig } from './config.js';
import { parseCommand } from './commands/parse-command.js';
import { handleCommand, type SessionPrefs } from './pipeline/handle-command.js';
import {
  extractGroupOpenid,
  parseInboundQqMessage,
  type QqInboundPayload,
} from './qq/parse-inbound-event.js';
import { buildQqPanelSyncOptions } from './qq/panel-sync-options.js';

/**
 * 构建 Bot HTTP 应用的结果。
 */
export type BotAppBundle = {
  app: Hono;
  qq: QqOfficialClient;
};

/**
 * 构建 Bot HTTP 应用（健康检查 + 官方 QQ 回调）。
 *
 * @param config - 已加载的 Bot 配置
 * @param logger - 结构化日志实例
 * @returns 可对外服务的 Hono 应用与 QQ 客户端（供启动时同步面板）
 */
export function createBotApp(config: BotConfig, logger: Logger): BotAppBundle {
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
  /** 短时去重：官方可能对同一 msg_id 重推。 */
  const seenMsgIds = new Map<string, number>();

  app.get('/health', (c) =>
    c.json({ ok: true, service: 'lanius-bot', dryRun: config.bot.dryRun }),
  );

  app.post(config.qq.callbackPath, async (c) => {
    const rawBody = await c.req.text();
    const headers: Record<string, string | undefined> = {};
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Webhook URL 校验（op:13）：按文档用 BotSecret 对 event_ts+plain_token 做 Ed25519 签名并原样回传 plain_token。
    try {
      const payload = JSON.parse(rawBody) as QqInboundPayload & {
        d?: { plain_token?: string; event_ts?: string | number };
      };
      if (payload.op === 13) {
        const plainToken = payload.d?.plain_token;
        const eventTs = payload.d?.event_ts;
        if (plainToken == null || eventTs == null || plainToken === '') {
          logger.warn('qq webhook validation missing plain_token or event_ts');
          return c.json({ ok: false, error: 'invalid_validation_payload' }, 400);
        }
        const signature = signQqWebhookValidation({
          appSecret: config.qq.appSecret,
          plainToken,
          eventTs: String(eventTs),
        });
        return c.json({ plain_token: plainToken, signature });
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

    let payload: QqInboundPayload;
    try {
      payload = JSON.parse(rawBody) as QqInboundPayload;
    } catch {
      return c.json({ ok: false, error: 'invalid_json' }, 400);
    }

    // Webhook 群指令面板需 API 按群 specific 绑定；在入群/@ 时异步 ensure，不阻断回包。
    const groupOpenid = extractGroupOpenid(payload);
    if (groupOpenid && !config.bot.dryRun) {
      void ensureQqGroupCommandPanel({
        ...buildQqPanelSyncOptions(config, qq.getAccessTokenCache()),
        groupOpenid,
      })
        .then((result) => {
          if (result.action === 'failed') {
            logger.warn({ result, groupOpenid }, 'qq group panel ensure failed');
          } else if (result.action !== 'skipped') {
            logger.info({ result, groupOpenid }, 'qq group panel ensured');
          }
        })
        .catch((error: unknown) => {
          logger.warn(
            {
              err: error instanceof Error ? error.message : String(error),
              groupOpenid,
            },
            'qq group panel ensure error',
          );
        });
    }

    const inbound = parseInboundQqMessage(payload);
    if (!inbound) {
      return c.json({ ok: true, ignored: true, reason: 'non_message_event' });
    }

    const dedupeKey = inbound.target.msgId;
    if (dedupeKey) {
      const now = Date.now();
      pruneSeenMsgIds(seenMsgIds, now);
      if (seenMsgIds.has(dedupeKey)) {
        return c.json({ ok: true, ignored: true, reason: 'duplicate_msg' });
      }
      seenMsgIds.set(dedupeKey, now);
    }

    const parsed = parseCommand(inbound.content, {
      prefix: config.bot.commandPrefix,
      prefixPolicy: config.bot.commandPrefixPolicy,
    });
    if (!parsed.matched || !parsed.intent) {
      // prefix_required / no_root：后续可在此接入 Agent（自然语言 → 模块查询）
      return c.json({
        ok: true,
        ignored: true,
        reason: parsed.reason ?? 'no_command',
      });
    }

    const outcome = await handleCommand(parsed.intent, inbound.target, {
      config,
      qq,
      prefs,
      scene:
        inbound.target.scene === 'group' || inbound.target.scene === 'c2c'
          ? inbound.target.scene
          : 'c2c',
    });
    logger.info(
      {
        scene: inbound.target.scene,
        targetId: inbound.target.targetId,
        eventType: inbound.eventType,
        outcome,
        intent: parsed.intent.type,
      },
      'command handled',
    );
    return c.json({ ok: true, outcome });
  });

  return { app, qq };
}

/**
 * 清理超过 10 分钟的去重键，避免 Map 无限增长。
 *
 * @param seen - msg_id → 首次见到的时间戳
 * @param nowMs - 当前时间
 * @returns 无返回值
 */
function pruneSeenMsgIds(seen: Map<string, number>, nowMs: number): void {
  const ttlMs = 10 * 60 * 1000;
  for (const [key, at] of seen) {
    if (nowMs - at > ttlMs) {
      seen.delete(key);
    }
  }
}
