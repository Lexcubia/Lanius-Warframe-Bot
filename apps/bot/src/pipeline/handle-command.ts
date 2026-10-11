import { createLaniusApiClient } from '@lanius/api';
import {
  renderFissuresCard,
  renderInvasionsCard,
  renderNightwaveCard,
  renderWorldstateCard,
} from '@lanius/render';
import { buildHelpDto, type Locale } from '@lanius/core';
import type { QqOfficialClient, QqSendTarget } from '@lanius/qq-official';

import type { BotConfig } from '../config.js';
import type { BotIntent } from '../commands/parse-command.js';
import { formatHelpText } from '../formatters/help-text.js';
import {
  formatFissuresText,
  formatInvasionsText,
  formatNightwaveText,
  formatWorldstateText,
} from '../formatters/worldstate-text.js';

/**
 * 会话级可变偏好（MVP 进程内内存）。
 */
export type SessionPrefs = {
  replyMode: 'text' | 'image';
  locale: Locale;
};

/**
 * 命令处理管道的依赖。
 */
export type HandleCommandDeps = {
  config: BotConfig;
  qq: QqOfficialClient;
  prefs: SessionPrefs;
  apiClient?: ReturnType<typeof createLaniusApiClient>;
};

/**
 * 处理已解析的 Bot 意图：调用 Lanius API，格式化文本/图片，经 QQ 下行。
 *
 * @param intent - 已解析的命令意图
 * @param target - 官方 QQ 发送目标
 * @param deps - 配置、QQ 客户端、会话偏好、可选 API 客户端
 * @returns 供日志/测试使用的结果摘要字符串
 */
export async function handleCommand(
  intent: BotIntent,
  target: QqSendTarget,
  deps: HandleCommandDeps,
): Promise<string> {
  const locale = deps.prefs.locale;
  const api =
    deps.apiClient ??
    createLaniusApiClient({ baseUrl: deps.config.bot.apiBaseUrl });

  if (intent.type === 'mode') {
    deps.prefs.replyMode = intent.mode;
    const msg =
      locale === 'en'
        ? `Reply mode set to ${intent.mode}.`
        : `已切换为${intent.mode === 'image' ? '图片' : '文本'}模式。`;
    const sent = await deps.qq.sendText(target, msg);
    if (!sent.ok) {
      return `send-failed:${sent.detail ?? 'unknown'}`;
    }
    return msg;
  }

  if (intent.type === 'help' || intent.type === 'unknown') {
    const envelope = await api.getHelp().catch(() => null);
    const help = envelope && envelope.ok ? envelope.data : buildHelpDto();
    const text = formatHelpText(help, locale, {
      unknownRaw: intent.type === 'unknown' ? intent.raw : undefined,
    });
    const sent = await deps.qq.sendText(target, text);
    if (!sent.ok) {
      return `send-failed:${sent.detail ?? 'unknown'}`;
    }
    return text;
  }

  const envelope = await api.getWorldstate({
    realm: deps.config.defaults.realm,
    locale,
  });

  if (!envelope.ok) {
    const fail =
      locale === 'en'
        ? `Query failed: ${envelope.error.message}`
        : `查询失败：${envelope.error.message}`;
    const sent = await deps.qq.sendText(target, fail);
    if (!sent.ok) {
      return `send-failed:${sent.detail ?? 'unknown'}`;
    }
    return fail;
  }

  // QQ 群聊禁止消息内带 URL；公开站导流留给 Web，不拼进下行文本。
  // 世界状态 / 裂隙 / 入侵 / 午夜电波为独立模块，按意图分别格式化与出图。
  const moduleKind =
    intent.type === 'fissures'
      ? 'fissures'
      : intent.type === 'invasions'
        ? 'invasions'
        : intent.type === 'nightwave'
          ? 'nightwave'
          : 'worldstate';
  const text =
    moduleKind === 'fissures'
      ? formatFissuresText(envelope.data, locale, { stale: envelope.meta.stale })
      : moduleKind === 'invasions'
        ? formatInvasionsText(envelope.data, locale, {
            stale: envelope.meta.stale,
          })
        : moduleKind === 'nightwave'
          ? formatNightwaveText(envelope.data, locale, {
              stale: envelope.meta.stale,
            })
          : formatWorldstateText(envelope.data, locale, {
              stale: envelope.meta.stale,
            });

  if (deps.prefs.replyMode === 'image') {
    try {
      const renderInput = {
        worldstate: envelope.data,
        locale,
        stale: envelope.meta.stale,
      };
      const renderPromise =
        moduleKind === 'fissures'
          ? renderFissuresCard(renderInput)
          : moduleKind === 'invasions'
            ? renderInvasionsCard(renderInput)
            : moduleKind === 'nightwave'
              ? renderNightwaveCard(renderInput)
              : renderWorldstateCard(renderInput);
      const png = await withTimeout(
        renderPromise,
        deps.config.bot.image.renderTimeoutMs,
      );
      const sent = await deps.qq.sendImage(target, png);
      if (sent.ok) {
        return 'image';
      }
      const fallback = await deps.qq.sendText(
        target,
        `${text}\n${locale === 'en' ? '(image send failed; text fallback)' : '（图片发送失败，已降级文本）'}`,
      );
      if (!fallback.ok) {
        return `send-failed:${fallback.detail ?? 'unknown'}`;
      }
      return 'image-fallback-send';
    } catch {
      const fallback = await deps.qq.sendText(
        target,
        `${text}\n${locale === 'en' ? '(image render failed; text fallback)' : '（图片渲染失败，已降级文本）'}`,
      );
      if (!fallback.ok) {
        return `send-failed:${fallback.detail ?? 'unknown'}`;
      }
      return 'image-fallback-render';
    }
  }

  const sent = await deps.qq.sendText(target, text);
  if (!sent.ok) {
    return `send-failed:${sent.detail ?? 'unknown'}`;
  }
  return 'text';
}

/**
 * 为 Promise 增加超时竞态。
 *
 * @param promise - 需要限时的异步工作
 * @param timeoutMs - 超时毫秒数
 * @returns 在超时前完成时返回 promise 结果
 * @throws Error 超时先到达时抛出
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('render timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
