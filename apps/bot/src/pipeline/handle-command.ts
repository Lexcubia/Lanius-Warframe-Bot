import { createLaniusApiClient } from '@lanius/api';
import {
  renderFissuresCard,
  renderHelpCard,
  renderInvasionsCard,
  renderMarketCard,
  renderNightwaveCard,
  renderRivenCard,
  renderWorldstateCard,
} from '@lanius/render';
import {
  applyFissureQueryFilter,
  buildHelpDto,
  isFissureQueryActive,
  pickLocalized,
  type FissureQueryFilter,
  type Locale,
  type WorldstateDto,
} from '@lanius/core';
import type { QqOfficialClient, QqSendTarget } from '@lanius/qq-official';

import type { BotConfig } from '../config.js';
import type { BotIntent } from '../commands/parse-command.js';
import { formatHelpText } from '../formatters/help-text.js';
import {
  formatMarketText,
  formatRivenText,
} from '../formatters/market-text.js';
import {
  formatRotationText,
  formatVarziaText,
  formatVoidTraderText,
} from '../formatters/traders-text.js';
import {
  formatFissuresText,
  formatInvasionsText,
  formatNightwaveText,
  formatWorldstateText,
} from '../formatters/worldstate-text.js';
import {
  buildFissureShortcutKeyboard,
  fissureShortcutMarkdownHint,
} from '../qq/build-fissure-keyboard.js';

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
  scene?: 'group' | 'c2c';
  userId?: string;
};

/**
 * 处理已解析的 Bot 意图。
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
    createLaniusApiClient({
      baseUrl: deps.config.bot.apiBaseUrl,
      adminToken: deps.config.api?.adminToken,
    });
  const gateCtx = {
    scene:
      deps.scene ??
      (target.scene === 'group' || target.scene === 'c2c' ? target.scene : 'c2c'),
    targetId: target.targetId,
    userId: deps.userId ?? '',
  };
  const publicQuery = {
    realm: deps.config.defaults.realm,
    locale,
  };

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
    const envelope = await api
      .getHelp(intent.type === 'help' ? intent.module : undefined)
      .catch(() => null);
    const help =
      envelope && envelope.ok
        ? envelope.data
        : buildHelpDto({
            moduleId: undefined,
          });
    const text = formatHelpText(help, locale, {
      unknownRaw: intent.type === 'unknown' ? intent.raw : undefined,
    });
    return replyTextOrImage({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderHelpCard({ help, locale }),
      label: 'help',
    });
  }

  if (intent.type === 'market') {
    const envelope = await api.getMarketItems(intent.query, gateCtx);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const text = formatMarketText(envelope.data, locale);
    return replyTextOrImage({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderMarketCard({ market: envelope.data, locale }),
      label: 'market',
    });
  }

  if (intent.type === 'riven') {
    const envelope = await api.getRiven(intent.query, gateCtx);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const text = formatRivenText(envelope.data, locale);
    return replyTextOrImage({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderRivenCard({ riven: envelope.data, locale }),
      label: 'riven',
    });
  }

  if (intent.type === 'subscribe') {
    return handleSubscribe(intent, target, deps, api, gateCtx, locale);
  }

  if (intent.type === 'voidTrader') {
    const envelope = await api.getVoidTrader(publicQuery, gateCtx);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const text = formatVoidTraderText(envelope.data, locale, {
      stale: envelope.meta.stale,
    });
    const sent = await deps.qq.sendText(target, text);
    return sent.ok ? 'text' : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  if (intent.type === 'varzia') {
    const envelope = await api.getVarzia(publicQuery, gateCtx);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const text = formatVarziaText(envelope.data, locale, {
      stale: envelope.meta.stale,
    });
    const sent = await deps.qq.sendText(target, text);
    return sent.ok ? 'text' : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  if (intent.type === 'tenetRotation' || intent.type === 'codaRotation') {
    const kind = intent.type === 'tenetRotation' ? 'tenet' : 'coda';
    const envelope = await api.getWeaponRotation(kind, publicQuery, gateCtx);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const text = formatRotationText(envelope.data, locale);
    const sent = await deps.qq.sendText(target, text);
    return sent.ok ? 'text' : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  const envelope = await api.getWorldstate(publicQuery);

  if (!envelope.ok) {
    return sendFail(deps, target, locale, envelope.error.message);
  }

  const moduleKind =
    intent.type === 'fissures'
      ? 'fissures'
      : intent.type === 'invasions'
        ? 'invasions'
        : intent.type === 'nightwave'
          ? 'nightwave'
          : 'worldstate';

  let worldstate: WorldstateDto = envelope.data;
  let filterSummary: string | undefined;
  if (intent.type === 'fissures' && intent.filter && isFissureQueryActive(intent.filter)) {
    const applied = applyFissureQueryFilter(envelope.data.fissures, intent.filter);
    worldstate = { ...envelope.data, fissures: applied.items };
    filterSummary = summarizeFissureFilter(intent.filter, locale);
  }

  const text =
    moduleKind === 'fissures'
      ? formatFissuresText(worldstate, locale, {
          stale: envelope.meta.stale,
          filterSummary,
        })
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

  const renderInput = {
    worldstate,
    locale,
    stale: envelope.meta.stale,
  };

  // 裂隙：Markdown + 底部指令按钮，便于 QQ 内一键筛选
  if (moduleKind === 'fissures') {
    return replyFissuresWithShortcuts({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderFissuresCard(renderInput),
    });
  }

  return replyTextOrImage({
    deps,
    target,
    text,
    preferImage: deps.prefs.replyMode === 'image',
    render: () =>
      moduleKind === 'invasions'
        ? renderInvasionsCard(renderInput)
        : moduleKind === 'nightwave'
          ? renderNightwaveCard(renderInput)
          : renderWorldstateCard(renderInput),
    label: moduleKind,
  });
}

/**
 * 将裂隙筛选查询格式化为短摘要（QQ 文案用）。
 *
 * @param filter - 命令行查询
 * @param locale - 语言
 * @returns 摘要串；无条件时为空串
 */
function summarizeFissureFilter(
  filter: FissureQueryFilter,
  locale: Locale,
): string {
  const zh = locale !== 'en';
  const eraLabel: Record<string, { zh: string; en: string }> = {
    lith: { zh: '古纪', en: 'Lith' },
    meso: { zh: '前纪', en: 'Meso' },
    neo: { zh: '中纪', en: 'Neo' },
    axi: { zh: '后纪', en: 'Axi' },
    requiem: { zh: '安魂', en: 'Requiem' },
    omnia: { zh: '全能', en: 'Omnia' },
  };
  const pathLabel: Record<string, { zh: string; en: string }> = {
    normal: { zh: '普通', en: 'Normal' },
    steelPath: { zh: '钢铁之路', en: 'Steel Path' },
    empyrean: { zh: '九重天', en: 'Empyrean' },
  };
  const parts: string[] = [];
  for (const era of filter.eras) {
    parts.push(pickLocalized(eraLabel[era] ?? { zh: era, en: era }, locale));
  }
  for (const path of filter.paths) {
    parts.push(pickLocalized(pathLabel[path] ?? { zh: path, en: path }, locale));
  }
  for (const hint of filter.missionHints) {
    parts.push(hint);
  }
  return parts.join(zh ? ' · ' : ' · ');
}

/**
 * 处理订阅列表 / 订阅 / 退订。
 *
 * @param intent - subscribe 意图
 * @param target - QQ 目标
 * @param deps - 依赖
 * @param api - API 客户端
 * @param gateCtx - 场景上下文
 * @param locale - 语言
 * @returns 结果摘要
 */
async function handleSubscribe(
  intent: Extract<BotIntent, { type: 'subscribe' }>,
  target: QqSendTarget,
  deps: HandleCommandDeps,
  api: ReturnType<typeof createLaniusApiClient>,
  gateCtx: { scene: 'group' | 'c2c'; targetId: string; userId: string },
  locale: Locale,
): Promise<string> {
  const zh = locale === 'zh';
  const scene = gateCtx.scene;

  if (intent.action === 'list') {
    const envelope = await api.listSubscriptions(scene, gateCtx.targetId);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const rows = envelope.data.subscriptions.filter((row) => row.enabled);
    const lines =
      rows.length === 0
        ? [zh ? '当前无启用中的订阅。' : 'No active subscriptions.']
        : [
            zh ? '当前订阅：' : 'Subscriptions:',
            ...rows.map(
              (row) =>
                `· ${row.moduleId} (${row.frequency})`,
            ),
            zh
              ? '示例：/订阅 裂隙 变更时 · /订阅 信条 每周 · /订阅 退订 裂隙'
              : 'e.g. /subscribe fissures on_change · /subscribe tenet weekly',
          ];
    const sent = await deps.qq.sendText(target, lines.join('\n'));
    return sent.ok ? 'subscribe-list' : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  if (intent.action === 'off') {
    if (!intent.moduleId) {
      return sendFail(
        deps,
        target,
        locale,
        zh ? '请指定要退订的模块' : 'module required',
      );
    }
    const envelope = await api.disableSubscription({
      scene,
      targetId: gateCtx.targetId,
      moduleId: intent.moduleId,
    });
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const msg = zh
      ? `已退订：${intent.moduleId}`
      : `Unsubscribed: ${intent.moduleId}`;
    const sent = await deps.qq.sendText(target, msg);
    return sent.ok ? 'subscribe-off' : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  if (!intent.moduleId) {
    return sendFail(
      deps,
      target,
      locale,
      zh ? '请指定要订阅的模块' : 'module required',
    );
  }
  const frequency = intent.frequency ?? 'on_change';
  const envelope = await api.upsertSubscription({
    scene,
    targetId: gateCtx.targetId,
    moduleId: intent.moduleId,
    frequency,
    userId: gateCtx.userId,
  });
  if (!envelope.ok) {
    return sendFail(deps, target, locale, envelope.error.message);
  }
  const msg = zh
    ? `已订阅 ${intent.moduleId}（频率：${frequency}）`
    : `Subscribed ${intent.moduleId} (${frequency})`;
  const sent = await deps.qq.sendText(target, msg);
  return sent.ok ? 'subscribe-on' : `send-failed:${sent.detail ?? 'unknown'}`;
}

/**
 * 裂隙回复：优先 Markdown + 快捷指令按钮；图片模式先出图再附带按钮条。
 *
 * @param options - 发送选项
 * @returns 结果摘要
 */
async function replyFissuresWithShortcuts(options: {
  deps: HandleCommandDeps;
  target: QqSendTarget;
  text: string;
  preferImage: boolean;
  render: () => Promise<Buffer>;
}): Promise<string> {
  const { deps, target, text, preferImage, render } = options;
  const locale = deps.prefs.locale;
  const keyboard = buildFissureShortcutKeyboard({
    locale,
    enter: target.scene === 'c2c',
    botAppId: deps.config.qq.appId,
  });
  const mdBody = toFissureMarkdown(text);

  if (!preferImage) {
    const sent = await deps.qq.sendMarkdown(target, mdBody, keyboard);
    if (sent.ok) {
      return 'markdown-fissures';
    }
    const fallback = await deps.qq.sendText(target, text);
    if (!fallback.ok) {
      return `send-failed:${fallback.detail ?? sent.detail ?? 'unknown'}`;
    }
    return 'markdown-fallback-text';
  }

  try {
    const png = await withTimeout(render(), deps.config.bot.image.renderTimeoutMs);
    const img = await deps.qq.sendImage(target, png);
    if (img.ok) {
      // 图片消息无法挂按钮：再发一条短 Markdown 承载 keyboard
      const tip = await deps.qq.sendMarkdown(
        target,
        fissureShortcutMarkdownHint(locale),
        keyboard,
      );
      return tip.ok ? 'image+markdown-fissures' : 'image';
    }
    const fallback = await deps.qq.sendMarkdown(
      target,
      `${mdBody}\n\n${locale === 'en' ? '_(image send failed; text fallback)_' : '_（图片发送失败，已降级文本）_'}`,
      keyboard,
    );
    if (fallback.ok) {
      return 'image-fallback-markdown';
    }
    const plain = await deps.qq.sendText(target, text);
    return plain.ok
      ? 'image-fallback-text'
      : `send-failed:${plain.detail ?? img.detail ?? 'unknown'}`;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[lanius-bot] image render failed (fissures): ${detail}`);
    const fallback = await deps.qq.sendMarkdown(
      target,
      `${mdBody}\n\n${locale === 'en' ? '_(image render failed; text fallback)_' : '_（图片渲染失败，已降级文本）_'}`,
      keyboard,
    );
    if (fallback.ok) {
      return `image-fallback-render:${detail.slice(0, 160)}`;
    }
    const plain = await deps.qq.sendText(target, text);
    return plain.ok
      ? `image-fallback-text:${detail.slice(0, 80)}`
      : `send-failed:${plain.detail ?? detail}`;
  }
}

/**
 * 将裂隙纯文本转为简 Markdown（保留换行，标题行加粗）。
 *
 * @param text - formatFissuresText 产出
 * @returns Markdown content
 */
function toFissureMarkdown(text: string): string {
  const lines = text.split('\n');
  const head = lines[0];
  if (!head) {
    return text;
  }
  const rest = lines.slice(1);
  return [`**${head.replace(/^\*+|\*+$/g, '').trim()}**`, ...rest].join('\n');
}

/**
 * 按偏好发送文本或图片（失败降级文本）。
 *
 * @param options - 发送选项
 * @returns 结果摘要
 */
async function replyTextOrImage(options: {
  deps: HandleCommandDeps;
  target: QqSendTarget;
  text: string;
  preferImage: boolean;
  render: () => Promise<Buffer>;
  label: string;
}): Promise<string> {
  const { deps, target, text, preferImage, render, label } = options;
  const locale = deps.prefs.locale;

  if (!preferImage) {
    const sent = await deps.qq.sendText(target, text);
    if (!sent.ok) {
      return `send-failed:${sent.detail ?? 'unknown'}`;
    }
    return 'text';
  }

  try {
    const png = await withTimeout(render(), deps.config.bot.image.renderTimeoutMs);
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
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[lanius-bot] image render failed (${label}): ${detail}`);
    const fallback = await deps.qq.sendText(
      target,
      `${text}\n${locale === 'en' ? '(image render failed; text fallback)' : '（图片渲染失败，已降级文本）'}`,
    );
    if (!fallback.ok) {
      return `send-failed:${fallback.detail ?? 'unknown'}`;
    }
    return `image-fallback-render:${detail.slice(0, 160)}`;
  }
}

/**
 * 发送查询失败文本。
 *
 * @param deps - 依赖
 * @param target - 目标
 * @param locale - 语言
 * @param message - 错误信息
 * @returns 摘要
 */
async function sendFail(
  deps: HandleCommandDeps,
  target: QqSendTarget,
  locale: Locale,
  message: string,
): Promise<string> {
  const fail =
    locale === 'en' ? `Query failed: ${message}` : `查询失败：${message}`;
  const sent = await deps.qq.sendText(target, fail);
  if (!sent.ok) {
    return `send-failed:${sent.detail ?? 'unknown'}`;
  }
  return fail;
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
