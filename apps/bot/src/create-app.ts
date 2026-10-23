import {
  buildQqWebhookAck,
  createQqOfficialClient,
  ensureQqGroupCommandPanel,
  forgetQqGroupPanelBinding,
  parseQqSendFailure,
  signQqWebhookValidation,
  verifyQqCallback,
  type QqOfficialClient,
  type QqSendTarget,
} from '@lanius/qq-official';
import { hashLogId, type Logger } from '@lanius/logger';
import { Hono } from 'hono';

import type { BotConfig } from './config.js';
import { parseCommand } from './commands/parse-command.js';
import { handleCommand, type SessionPrefs } from './pipeline/handle-command.js';
import {
  extractGroupOpenid,
  isQqGroupLifecycleEvent,
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
  /**
   * 排空后台命令处理（测试用）。
   * 生产路径在 ACK 后异步跑管线，单测需 await 本方法再断言发信。
   */
  drainBackgroundWork: () => Promise<void>;
};

/**
 * 构建 Bot HTTP 应用（健康检查 + 官方 QQ 回调）。
 *
 * 回调路径：验签 → 立即回 OpCode 12 ACK → 后台解析命令并 OpenAPI 发信。
 * 避免「先跑完整管线再回包」触发平台重推，叠加 msg_id 去重后群内完全无回复。
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
  // 回复模式与卡片皮肤仅来自后台配置，无 QQ 用户指令切换。
  const prefs: SessionPrefs = {
    replyMode: config.bot.defaultReplyMode,
    cardSkin: config.bot.defaultCardSkin,
    locale: config.defaults.locale,
  };
  /** 短时去重：官方可能对同一 msg_id 重推。 */
  const seenMsgIds = new Map<string, number>();
  /** 后台管线 Promise，供 drainBackgroundWork 排空。 */
  const backgroundWork = new Set<Promise<void>>();

  app.get('/health', (c) => c.json({ ok: true, service: 'lanius-bot', dryRun: config.bot.dryRun }));

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

    const verified = verifyQqCallback({ rawBody, headers }, { appSecret: config.qq.appSecret });
    if (!verified && !config.bot.dryRun) {
      logger.warn('qq callback signature rejected');
      return c.json({ ok: false }, 401);
    }

    let payload: QqInboundPayload;
    try {
      payload = JSON.parse(rawBody) as QqInboundPayload;
    } catch {
      logger.warn('qq callback invalid json');
      return c.json({ ok: false, error: 'invalid_json' }, 400);
    }

    // 群生命周期：踢群清缓存、重新拉入强制面板 rebind、主动通知开关单独打日志。
    // 注意：面板绑定不阻断命令回复；踢出再加能恢复更吻合平台侧群关系/权限刷新。
    const eventType = payload.t ?? '';
    const groupOpenid = extractGroupOpenid(payload);
    if (groupOpenid && isQqGroupLifecycleEvent(eventType)) {
      handleGroupLifecycleEvent({
        eventType,
        groupOpenid,
        config,
        qq,
        logger,
        backgroundWork,
      });
      return c.json(buildQqWebhookAck());
    }

    // Webhook 群指令面板需 API 按群 specific 绑定；在 @ 消息时异步 ensure，不阻断 ACK。
    if (groupOpenid && !config.bot.dryRun) {
      trackBackground(
        backgroundWork,
        ensureQqGroupCommandPanel({
          ...buildQqPanelSyncOptions(config, qq.getAccessTokenCache()),
          groupOpenid,
        })
          .then((result) => {
            if (result.action === 'failed') {
              logger.warn(
                { result, groupIdHash: hashLogId(groupOpenid) },
                'qq group panel ensure failed',
              );
            } else if (result.action !== 'skipped') {
              logger.info(
                { result, groupIdHash: hashLogId(groupOpenid) },
                'qq group panel ensured',
              );
            }
          })
          .catch((error: unknown) => {
            logger.warn(
              {
                err: error instanceof Error ? error.message : String(error),
                groupIdHash: hashLogId(groupOpenid),
              },
              'qq group panel ensure error',
            );
          }),
      );
    }

    const inbound = parseInboundQqMessage(payload);
    if (!inbound) {
      logger.info({ eventType, op: payload.op }, 'qq event ignored (non_message)');
      return c.json(buildQqWebhookAck());
    }

    const targetLog = {
      scene: inbound.target.scene,
      targetIdHash: hashLogId(inbound.target.targetId),
      msgIdHash: inbound.target.msgId ? hashLogId(inbound.target.msgId) : undefined,
      eventType: inbound.eventType,
      hasMsgId: Boolean(inbound.target.msgId),
    };

    const dedupeKey = inbound.target.msgId;
    if (dedupeKey) {
      const now = Date.now();
      pruneSeenMsgIds(seenMsgIds, now);
      if (seenMsgIds.has(dedupeKey)) {
        logger.info({ ...targetLog, reason: 'duplicate_msg' }, 'qq event ignored');
        return c.json(buildQqWebhookAck());
      }
      // 先占坑再 ACK：避免平台重推导致双回复；失败路径会尝试主动错误回执。
      seenMsgIds.set(dedupeKey, now);
    }

    const parsed = parseCommand(inbound.content, {
      prefix: config.bot.commandPrefix,
      prefixPolicy: config.bot.commandPrefixPolicy,
    });
    if (!parsed.matched || !parsed.intent) {
      logger.info(
        {
          ...targetLog,
          reason: parsed.reason ?? 'no_command',
          contentLen: inbound.content.length,
        },
        'qq event ignored (no_command)',
      );
      return c.json(buildQqWebhookAck());
    }

    logger.info(
      {
        ...targetLog,
        intent: parsed.intent.type,
        dryRun: config.bot.dryRun,
      },
      'qq command accepted',
    );

    // 关键 ACK 再跑业务：平台回调窗口短；拖到管线结束再回包会重推，叠加去重 → 群内静默。
    trackBackground(
      backgroundWork,
      runCommandPipeline({
        config,
        qq,
        prefs,
        logger,
        seenMsgIds,
        intent: parsed.intent,
        target: inbound.target,
        eventType: inbound.eventType,
        dedupeKey,
      }),
    );

    return c.json(buildQqWebhookAck());
  });

  return {
    app,
    qq,
    drainBackgroundWork: async () => {
      while (backgroundWork.size > 0) {
        await Promise.all([...backgroundWork]);
      }
    },
  };
}

/**
 * 处理群生命周期事件：日志 + 踢群清面板缓存 + 入群强制 rebind。
 *
 * @param ctx - 事件与依赖
 * @returns 无返回值
 */
function handleGroupLifecycleEvent(ctx: {
  eventType: string;
  groupOpenid: string;
  config: BotConfig;
  qq: QqOfficialClient;
  logger: Logger;
  backgroundWork: Set<Promise<void>>;
}): void {
  const groupIdHash = hashLogId(ctx.groupOpenid);
  const fields = { eventType: ctx.eventType, groupIdHash };

  if (ctx.eventType === 'GROUP_DEL_ROBOT') {
    const cleared = forgetQqGroupPanelBinding(ctx.groupOpenid);
    ctx.logger.info({ ...fields, panelCacheCleared: cleared }, 'qq group membership removed');
    return;
  }

  if (ctx.eventType === 'GROUP_MSG_REJECT') {
    // 官方语义为关闭「主动消息/通知」；被动 @ 回复一般仍可用，但需可观测。
    ctx.logger.warn(fields, 'qq group proactive notify rejected by admin');
    return;
  }

  if (ctx.eventType === 'GROUP_MSG_RECEIVE') {
    ctx.logger.info(fields, 'qq group proactive notify enabled by admin');
    if (ctx.config.bot.dryRun) {
      return;
    }
    trackBackground(
      ctx.backgroundWork,
      ensurePanelForGroup({
        config: ctx.config,
        qq: ctx.qq,
        logger: ctx.logger,
        groupOpenid: ctx.groupOpenid,
        force: false,
      }),
    );
    return;
  }

  // GROUP_ADD_ROBOT：重新拉入时强制面板关联（进程内可能仍标为已绑定）。
  ctx.logger.info(fields, 'qq group membership added');
  if (ctx.config.bot.dryRun) {
    forgetQqGroupPanelBinding(ctx.groupOpenid);
    return;
  }
  trackBackground(
    ctx.backgroundWork,
    ensurePanelForGroup({
      config: ctx.config,
      qq: ctx.qq,
      logger: ctx.logger,
      groupOpenid: ctx.groupOpenid,
      force: true,
    }),
  );
}

/**
 * 异步 ensure 群指令面板并打成功/失败日志。
 *
 * @param ctx - 配置与群 openid
 * @returns 无返回值
 */
async function ensurePanelForGroup(ctx: {
  config: BotConfig;
  qq: QqOfficialClient;
  logger: Logger;
  groupOpenid: string;
  force: boolean;
}): Promise<void> {
  try {
    const result = await ensureQqGroupCommandPanel({
      ...buildQqPanelSyncOptions(ctx.config, ctx.qq.getAccessTokenCache()),
      groupOpenid: ctx.groupOpenid,
      force: ctx.force,
    });
    if (result.action === 'failed') {
      ctx.logger.warn(
        { result, groupIdHash: hashLogId(ctx.groupOpenid), force: ctx.force },
        'qq group panel ensure failed',
      );
      return;
    }
    if (result.action !== 'skipped') {
      ctx.logger.info(
        { result, groupIdHash: hashLogId(ctx.groupOpenid), force: ctx.force },
        'qq group panel ensured',
      );
    }
  } catch (error: unknown) {
    ctx.logger.warn(
      {
        err: error instanceof Error ? error.message : String(error),
        groupIdHash: hashLogId(ctx.groupOpenid),
        force: ctx.force,
      },
      'qq group panel ensure error',
    );
  }
}

/**
 * 在后台执行命令管线：成功/失败/异常均打结构化日志；异常时尽量被动回错文案。
 *
 * @param ctx - 管线上下文
 * @returns 无返回值
 */
async function runCommandPipeline(ctx: {
  config: BotConfig;
  qq: QqOfficialClient;
  prefs: SessionPrefs;
  logger: Logger;
  seenMsgIds: Map<string, number>;
  intent: NonNullable<ReturnType<typeof parseCommand>['intent']>;
  target: QqSendTarget;
  eventType: string;
  dedupeKey: string | undefined;
}): Promise<void> {
  const startedAt = Date.now();
  const baseFields = {
    scene: ctx.target.scene,
    targetIdHash: hashLogId(ctx.target.targetId),
    msgIdHash: ctx.target.msgId ? hashLogId(ctx.target.msgId) : undefined,
    eventType: ctx.eventType,
    intent: ctx.intent.type,
    hasMsgId: Boolean(ctx.target.msgId),
  };

  try {
    const outcome = await handleCommand(ctx.intent, ctx.target, {
      config: ctx.config,
      qq: ctx.qq,
      prefs: ctx.prefs,
      logger: ctx.logger,
      scene: ctx.target.scene === 'group' || ctx.target.scene === 'c2c' ? ctx.target.scene : 'c2c',
    });
    const durationMs = Date.now() - startedAt;
    if (outcome.startsWith('send-failed:')) {
      const detail = outcome.slice('send-failed:'.length);
      const failure = parseQqSendFailure(detail);
      ctx.logger.warn(
        {
          ...baseFields,
          outcome,
          durationMs,
          qqCode: failure.code,
          passiveWindowExceeded: failure.passiveWindowExceeded,
          rateLimited: failure.rateLimited,
          detail: failure.summary,
        },
        'command send failed (user sees silence unless fallback worked)',
      );
      return;
    }
    ctx.logger.info({ ...baseFields, outcome, durationMs }, 'command handled');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    ctx.logger.error(
      { ...baseFields, err: detail, durationMs: Date.now() - startedAt },
      'command handler threw',
    );
    // 释放去重键，便于平台重推时再试（仅在尚未成功发信时有意义）。
    if (ctx.dedupeKey) {
      ctx.seenMsgIds.delete(ctx.dedupeKey);
    }
    const failText =
      ctx.prefs.locale === 'en' ? 'Bot error; please try again.' : '机器人处理出错，请稍后重试。';
    try {
      const sent = await ctx.qq.sendText(ctx.target, failText);
      if (!sent.ok) {
        const failure = parseQqSendFailure(sent.detail);
        ctx.logger.warn(
          {
            ...baseFields,
            qqCode: failure.code,
            detail: failure.summary,
          },
          'error notice send failed',
        );
      } else {
        ctx.logger.info(baseFields, 'error notice sent after handler throw');
        if (ctx.dedupeKey) {
          ctx.seenMsgIds.set(ctx.dedupeKey, Date.now());
        }
      }
    } catch (sendError) {
      ctx.logger.warn(
        {
          ...baseFields,
          err: sendError instanceof Error ? sendError.message : String(sendError),
        },
        'error notice send threw',
      );
    }
  }
}

/**
 * 将 Promise 登记到后台集合，便于测试排空与避免未处理 rejection。
 *
 * @param work - 后台 Promise 集合
 * @param promise - 要跟踪的异步任务（允许非 void 返回，统一忽略结果）
 * @returns 无返回值
 */
function trackBackground(work: Set<Promise<void>>, promise: Promise<unknown>): void {
  const tracked: Promise<void> = Promise.resolve(promise).then(
    () => undefined,
    () => undefined,
  );
  work.add(tracked);
  void tracked.finally(() => {
    work.delete(tracked);
  });
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
