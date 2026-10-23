import { createLaniusApiClient } from '@lanius/api';
import {
  renderAlertsCard,
  renderArbitrationCard,
  renderArchimedeaCard,
  renderCircuitCard,
  renderFissuresCard,
  renderHelpCard,
  renderInvasionsCard,
  renderMarketCard,
  renderNightwaveCard,
  renderRivenCard,
  renderVarziaCard,
  renderVoidTraderCard,
  renderWeaponRotationCard,
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
import type { Logger } from '@lanius/logger';
import type { QqKeyboardContent, QqOfficialClient, QqSendTarget } from '@lanius/qq-official';
import { parseQqSendFailure, uploadCardPng } from '@lanius/qq-official';

import type { BotConfig } from '../config.js';
import type { BotIntent } from '../commands/parse-command.js';
import { formatHelpText } from '../formatters/help-text.js';
import {
  formatMarketText,
  formatMarketWhisperReply,
  formatRivenText,
  formatRivenWhisperReply,
  formatWhisperCmdInputLine,
  marketWhisperLines,
  rivenWhisperLines,
} from '../formatters/market-text.js';
import {
  formatRotationText,
  formatVarziaText,
  formatVoidTraderText,
} from '../formatters/traders-text.js';
import { formatArchimedeaText } from '../formatters/archimedea-text.js';
import {
  formatAlertsText,
  formatArbitrationText,
  formatCircuitText,
  formatFissuresText,
  formatInvasionsText,
  formatNightwaveText,
  formatWorldstateText,
} from '../formatters/worldstate-text.js';
import { buildFissureShortcutKeyboard } from '../qq/build-fissure-keyboard.js';
import { buildHelpShortcutKeyboard } from '../qq/build-help-keyboard.js';
import { buildMarketPageKeyboard, marketPageMarkdownHint } from '../qq/build-market-keyboard.js';
import { buildRivenPageKeyboard, rivenPageMarkdownHint } from '../qq/build-riven-keyboard.js';

/**
 * QQ 图片模式卡片皮肤（与 render capture 约定一致）。
 */
export type CardSkin = 'light' | 'dark';

/**
 * 进程级回复偏好（由 `bot.defaultReplyMode` / `bot.defaultCardSkin` 初始化；无 QQ 指令切换）。
 */
export type SessionPrefs = {
  replyMode: 'text' | 'image';
  /** 图片模式卡片亮/暗色皮肤（后台配置） */
  cardSkin: CardSkin;
  locale: Locale;
};

/**
 * 为 render*Card 入参附加 `skin`（与 `@lanius/render` 的 `skin?` / `resolveCardSkin` 对齐）。
 *
 * @param input - 原卡片渲染入参
 * @param skin - 会话当前卡片皮肤（`light` | `dark`）
 * @returns 带 `skin` 字段的入参，供图片模式截图使用
 */
function withCardSkin<T extends object>(input: T, skin: CardSkin): T & { skin: CardSkin } {
  return { ...input, skin };
}

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
  /** 可选结构化日志；缺省时降级路径不打业务日志。 */
  logger?: Logger;
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
      deps.scene ?? (target.scene === 'group' || target.scene === 'c2c' ? target.scene : 'c2c'),
    targetId: target.targetId,
    userId: deps.userId ?? '',
  };
  const publicQuery = {
    realm: deps.config.defaults.realm,
    locale,
  };

  // Wave 1：alerts / arbitration / archimedea / circuit 已接通；其余仍 stub。
  if (
    intent.type === 'sortie' ||
    intent.type === 'archon' ||
    intent.type === 'bounties'
  ) {
    const stub =
      locale === 'en'
        ? 'Data ingest in progress — check back after the next update.'
        : '数据接入中，请稍后再试。';
    const sent = await deps.qq.sendMarkdown(target, stub);
    return sent.ok ? `${intent.type}-stub` : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  if (intent.type === 'archimedea') {
    const envelope = await api.getWorldstate(publicQuery);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const kind = intent.kind;
    const text = formatArchimedeaText(envelope.data, locale, {
      stale: envelope.meta.stale,
      ...(kind ? { kind } : {}),
    });
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () =>
        renderArchimedeaCard(
          withCardSkin(
            {
              worldstate: envelope.data,
              locale,
              stale: envelope.meta.stale,
              ...(kind ? { kind } : {}),
            },
            deps.prefs.cardSkin,
          ),
        ),
      label: 'archimedea',
    });
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
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderHelpCard(withCardSkin({ help, locale }, deps.prefs.cardSkin)),
      label: 'help',
      keyboard: buildHelpShortcutKeyboard({
        locale,
        enter: target.scene === 'c2c',
        botAppId: deps.config.qq.appId,
      }),
      hint: locale === 'en' ? 'Tap a button below to run a query.' : '点击下方按钮快速查询。',
    });
  }

  if (intent.type === 'market') {
    const envelope = await api.getMarketItems(
      {
        q: intent.query,
        page: intent.page,
        modRank: intent.modRank,
      },
      gateCtx,
    );
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const data = envelope.data;

    // 私聊按钮：只回可粘贴 /w 文案，避免重绘整页卡片。
    if (intent.whisperIndex !== undefined) {
      const whisper = formatMarketWhisperReply(data, intent.whisperIndex - 1, locale);
      const sent = await deps.qq.sendMarkdown(target, whisper);
      return sent.ok ? 'market-whisper' : `send-failed:${sent.detail ?? 'unknown'}`;
    }

    const text = formatMarketText(data, locale);
    const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize) || 1);
    const keyboard = buildMarketPageKeyboard({
      locale,
      enter: target.scene === 'c2c',
      botAppId: deps.config.qq.appId,
      args: {
        query: intent.query,
        modRank: intent.modRank,
        page: data.page,
      },
      page: data.page,
      totalPages,
    });
    const hasWhisper = data.orders.length > 0;
    // 图片模式：正文在 PNG 里，私聊标签用 Markdown footer（qqbot-cmd-input，不带 @）。
    const whisperFooter = hasWhisper
      ? formatWhisperCmdInputLine(marketWhisperLines(data, locale), locale)
      : undefined;
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderMarketCard(withCardSkin({ market: data, locale }, deps.prefs.cardSkin)),
      label: 'market',
      keyboard: keyboard ?? undefined,
      hint:
        hasWhisper || keyboard != null
          ? marketPageMarkdownHint(locale, data.page, totalPages, hasWhisper)
          : undefined,
      footerMarkdown: whisperFooter,
    });
  }

  if (intent.type === 'riven') {
    const envelope = await api.getRiven(
      {
        q: intent.query,
        page: intent.page,
        rank: intent.rank,
        mastery: intent.mastery,
        minRerolls: intent.minRerolls,
        maxRerolls: intent.maxRerolls,
      },
      gateCtx,
    );
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const data = envelope.data;

    if (intent.whisperIndex !== undefined) {
      const whisper = formatRivenWhisperReply(data, intent.whisperIndex - 1, locale);
      const sent = await deps.qq.sendMarkdown(target, whisper);
      return sent.ok ? 'riven-whisper' : `send-failed:${sent.detail ?? 'unknown'}`;
    }

    const text = formatRivenText(data, locale);
    const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize) || 1);
    const keyboard = buildRivenPageKeyboard({
      locale,
      enter: target.scene === 'c2c',
      botAppId: deps.config.qq.appId,
      args: {
        query: intent.query,
        rank: intent.rank,
        mastery: intent.mastery,
        minRerolls: intent.minRerolls,
        maxRerolls: intent.maxRerolls,
        page: data.page,
      },
      page: data.page,
      totalPages,
    });
    const hasWhisper = data.orders.length > 0;
    const whisperFooter = hasWhisper
      ? formatWhisperCmdInputLine(rivenWhisperLines(data, locale), locale)
      : undefined;
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderRivenCard(withCardSkin({ riven: data, locale }, deps.prefs.cardSkin)),
      label: 'riven',
      keyboard: keyboard ?? undefined,
      hint:
        hasWhisper || keyboard != null
          ? rivenPageMarkdownHint(locale, data.page, totalPages, hasWhisper)
          : undefined,
      footerMarkdown: whisperFooter,
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
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () =>
        renderVoidTraderCard(
          withCardSkin(
            {
              voidTrader: envelope.data,
              locale,
              stale: envelope.meta.stale,
            },
            deps.prefs.cardSkin,
          ),
        ),
      label: 'voidTrader',
    });
  }

  if (intent.type === 'varzia') {
    const envelope = await api.getVarzia(publicQuery, gateCtx);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const text = formatVarziaText(envelope.data, locale, {
      stale: envelope.meta.stale,
    });
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () =>
        renderVarziaCard(
          withCardSkin(
            {
              varzia: envelope.data,
              locale,
              stale: envelope.meta.stale,
            },
            deps.prefs.cardSkin,
          ),
        ),
      label: 'varzia',
    });
  }

  if (intent.type === 'tenetRotation' || intent.type === 'codaRotation') {
    const kind = intent.type === 'tenetRotation' ? 'tenet' : 'coda';
    const envelope = await api.getWeaponRotation(kind, publicQuery, gateCtx);
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const text = formatRotationText(envelope.data, locale);
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () =>
        renderWeaponRotationCard(
          withCardSkin(
            {
              rotation: envelope.data,
              locale,
            },
            deps.prefs.cardSkin,
          ),
        ),
      label: kind === 'tenet' ? 'tenetRotation' : 'codaRotation',
    });
  }

  const envelope = await api.getWorldstate(publicQuery);

  if (!envelope.ok) {
    return sendFail(deps, target, locale, envelope.error.message);
  }

  if (intent.type === 'circuit') {
    const text = formatCircuitText(envelope.data, locale, {
      stale: envelope.meta.stale,
    });
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () =>
        renderCircuitCard(
          withCardSkin(
            {
              worldstate: envelope.data,
              locale,
              stale: envelope.meta.stale,
            },
            deps.prefs.cardSkin,
          ),
        ),
      label: 'circuit',
    });
  }

  const moduleKind =
    intent.type === 'fissures'
      ? 'fissures'
      : intent.type === 'invasions'
        ? 'invasions'
        : intent.type === 'nightwave'
          ? 'nightwave'
          : intent.type === 'alerts'
            ? 'alerts'
            : intent.type === 'arbitration'
              ? 'arbitration'
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
          : moduleKind === 'alerts'
            ? formatAlertsText(envelope.data, locale, {
                stale: envelope.meta.stale,
              })
            : moduleKind === 'arbitration'
              ? formatArbitrationText(envelope.data, locale, {
                  stale: envelope.meta.stale,
                })
              : formatWorldstateText(envelope.data, locale, {
                  stale: envelope.meta.stale,
                });

  const renderInput = withCardSkin(
    {
      worldstate,
      locale,
      stale: envelope.meta.stale,
    },
    deps.prefs.cardSkin,
  );

  // 裂隙：Markdown 嵌图 + 底部快捷筛选按钮，单条发送，便于 QQ 内一键筛选
  if (moduleKind === 'fissures') {
    return replyCard({
      deps,
      target,
      text,
      preferImage: deps.prefs.replyMode === 'image',
      render: () => renderFissuresCard(renderInput),
      label: 'fissures',
      keyboard: buildFissureShortcutKeyboard({
        locale,
        enter: target.scene === 'c2c',
        botAppId: deps.config.qq.appId,
      }),
      hint: locale === 'en' ? 'Tap a button below to filter.' : '点击下方按钮快速筛选。',
    });
  }

  return replyCard({
    deps,
    target,
    text,
    preferImage: deps.prefs.replyMode === 'image',
    render: () =>
      moduleKind === 'invasions'
        ? renderInvasionsCard(renderInput)
        : moduleKind === 'nightwave'
          ? renderNightwaveCard(renderInput)
          : moduleKind === 'alerts'
            ? renderAlertsCard(renderInput)
            : moduleKind === 'arbitration'
              ? renderArbitrationCard(renderInput)
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
function summarizeFissureFilter(filter: FissureQueryFilter, locale: Locale): string {
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
            ...rows.map((row) => `· ${row.moduleId} (${row.frequency})`),
            zh
              ? '示例：/订阅 裂隙 变更时 · /订阅 信条 每周 · /订阅 退订 裂隙'
              : 'e.g. /subscribe fissures on_change · /subscribe tenet weekly',
          ];
    const sent = await deps.qq.sendText(target, lines.join('\n'));
    return sent.ok ? 'subscribe-list' : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  if (intent.action === 'off') {
    if (!intent.moduleId) {
      return sendFail(deps, target, locale, zh ? '请指定要退订的模块' : 'module required');
    }
    const envelope = await api.disableSubscription({
      scene,
      targetId: gateCtx.targetId,
      moduleId: intent.moduleId,
    });
    if (!envelope.ok) {
      return sendFail(deps, target, locale, envelope.error.message);
    }
    const msg = zh ? `已退订：${intent.moduleId}` : `Unsubscribed: ${intent.moduleId}`;
    const sent = await deps.qq.sendText(target, msg);
    return sent.ok ? 'subscribe-off' : `send-failed:${sent.detail ?? 'unknown'}`;
  }

  if (!intent.moduleId) {
    return sendFail(deps, target, locale, zh ? '请指定要订阅的模块' : 'module required');
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
 * 统一的卡片回复入口：所有模块单条发送，不再分条。
 *
 * 发送策略（按优先级）：
 * 1. `markdownImage` 开 + 已配 COS + 图片模式 → 渲染 PNG 上传 COS，发**单条 Markdown 嵌图**（图 + 可选块引用提示 + 可选键盘）。
 * 2. 文本模式 → **单条 Markdown 文本**（标题加粗，可挂键盘）。
 * 3. `markdownImage` 关 + 图片模式 → **单条纯图**（`msg_type=7`，不发第二条）。
 * 4. 失败按链降级：嵌图 → Markdown 文本 → 纯文本。
 *
 * @param options - 发送选项（`keyboard`/`hint` 仅裂隙等需要快捷按钮的模块传入）
 * @returns 结果摘要
 */
async function replyCard(options: {
  deps: HandleCommandDeps;
  target: QqSendTarget;
  text: string;
  preferImage: boolean;
  render: () => Promise<Buffer>;
  label: string;
  keyboard?: QqKeyboardContent;
  hint?: string;
  /**
   * 追加在 Markdown 末尾的原始片段（如 `<qqbot-cmd-input>`）；文本模式已含于 `text` 时可省略。
   */
  footerMarkdown?: string;
}): Promise<string> {
  const { deps, target, text, preferImage, render, label, keyboard, hint, footerMarkdown } =
    options;
  const mdBody = toCardMarkdown(text);

  // 文本模式：单条 Markdown 文本（可挂键盘；私聊标签已写在 text 内）。
  if (!preferImage) {
    const sent = await deps.qq.sendMarkdown(target, mdBody, keyboard);
    if (sent.ok) {
      return 'markdown-text';
    }
    logSendFailure(deps.logger, `${label}_markdown`, sent.detail);
    const fallback = await deps.qq.sendText(target, text);
    if (!fallback.ok) {
      logSendFailure(deps.logger, `${label}_text_fallback`, fallback.detail);
      return `send-failed:${fallback.detail ?? sent.detail ?? 'unknown'}`;
    }
    logDegrade(deps.logger, 'info', {
      path: label,
      step: 'markdown_to_text',
      detail: sent.detail ?? 'markdown send failed',
    });
    return 'markdown-fallback-text';
  }

  try {
    const png = await withTimeout(render(), deps.config.bot.image.renderTimeoutMs);
    // 单条 Markdown 嵌图（需开关开启 + 已配 COS）。COS 提供公网 URL，QQ 转存为 ugcimg，尺寸标注由 stripHttpUrls 保留。
    const cos = deps.config.bot.cos;
    if (deps.config.bot.markdownImage !== false && cos) {
      const uploaded = await uploadCardPng(cos, png);
      if (uploaded.ok && uploaded.url) {
        const size = pngImageSize(png) ?? { width: 640, height: 534 };
        const md = cardImageMarkdown(uploaded.url, size, hint, footerMarkdown);
        console.log(`[lanius-bot] ${label} markdown payload >>> ${md} <<<`);
        const sent = await deps.qq.sendMarkdown(target, md, keyboard);
        if (sent.ok) {
          return keyboard ? 'markdown-image+keyboard' : 'markdown-image';
        }
        // 嵌图 markdown 失败则降级到纯图。
      } else {
        logDegrade(deps.logger, 'warn', {
          path: label,
          step: 'cos_upload',
          detail: uploaded.detail ?? 'unknown',
        });
      }
    }
    // 纯图单条（msg_type=7，不发第二条）。
    const img = await deps.qq.sendImage(target, png);
    if (img.ok) {
      return 'image';
    }
    logSendFailure(deps.logger, `${label}_image`, img.detail);
    const fallback = await deps.qq.sendMarkdown(target, mdBody, keyboard);
    if (fallback.ok) {
      logDegrade(deps.logger, 'info', {
        path: label,
        step: 'image_to_markdown',
        detail: img.detail ?? 'image send failed',
      });
      return 'image-fallback-markdown';
    }
    const plain = await deps.qq.sendText(target, text);
    return plain.ok
      ? 'image-fallback-text'
      : `send-failed:${plain.detail ?? img.detail ?? 'unknown'}`;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logDegrade(deps.logger, 'error', {
      path: label,
      step: 'render',
      detail,
    });
    const fallback = await deps.qq.sendMarkdown(target, mdBody, keyboard);
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
 * 将卡片纯文本转为简 Markdown（保留换行，标题行加粗）。
 *
 * @param text - 各 format*Text 产出
 * @returns Markdown content
 */
function toCardMarkdown(text: string): string {
  const lines = text.split('\n');
  const head = lines[0];
  if (!head) {
    return text;
  }
  const rest = lines.slice(1);
  return [`**${head.replace(/^\*+|\*+$/g, '').trim()}**`, ...rest].join('\n');
}

/**
 * 卡片 Markdown 嵌图消息体（图片 + 可选块引用提示的单条消息）。
 *
 * 语法：QQ 自定义 Markdown 支持 `![img #Wpx #Hpx](url)` 内嵌公网图片。
 *
 * @param imageUrl - 卡片图公网 URL（COS）
 * @param size - PNG 宽高（`#Wpx #Hpx`）
 * @param hint - 可选块引用提示文案（如裂隙的筛选引导）；省略则不追加
 * @returns Markdown content
 */
function cardImageMarkdown(
  imageUrl: string,
  size: { width: number; height: number },
  hint?: string,
  footerMarkdown?: string,
): string {
  // 官方嵌图语法 `![img #Wpx #Hpx](url)`，尺寸为图片原始像素。
  // 开头 `[](%7B%22version%22%3A2%7D)` 是 markdown v2 声明头（URL 编码的 {"version":2}），缺了它 QQ 会丢弃尺寸标注。
  const dim = ` #${size.width}px #${size.height}px`;
  const parts = [`[](%7B%22version%22%3A2%7D)![img${dim}](${imageUrl})`];
  if (hint) {
    parts.push(`> ${hint}`);
  }
  // footer 放在引用块外，保证 <qqbot-cmd-input> 可点击插入。
  if (footerMarkdown?.trim()) {
    parts.push(footerMarkdown.trim());
  }
  return parts.join('\n');
}

/**
 * 读取 PNG 头部 IHDR 的宽高（不依赖完整解码）。
 *
 * @param png - PNG 字节
 * @returns 宽高；非法或读取失败返回 `null`
 */
function pngImageSize(png: Buffer): { width: number; height: number } | null {
  // PNG: 8 字节签名 + IHDR(长度4+类型4+宽4+高4)。宽高于偏移 16/20。
  if (png.length < 24 || png.readUInt32BE(12) !== 0x49484452) {
    return null;
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
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
  const fail = locale === 'en' ? `Query failed: ${message}` : `查询失败：${message}`;
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

/**
 * 记录发信失败（含 QQ 错误码分类字段）。
 *
 * @param logger - 可选日志器
 * @param path - 业务路径标签（如 `help` / `fissures_image`）
 * @param detail - 客户端失败详情
 * @returns 无返回值
 */
function logSendFailure(
  logger: Logger | undefined,
  path: string,
  detail: string | undefined,
): void {
  if (!logger) {
    return;
  }
  const failure = parseQqSendFailure(detail);
  logger.warn(
    {
      path,
      qqCode: failure.code,
      passiveWindowExceeded: failure.passiveWindowExceeded,
      rateLimited: failure.rateLimited,
      detail: failure.summary,
    },
    'qq send failed',
  );
}

/**
 * 记录降级路径（渲染失败、COS 失败、图→文等）。
 *
 * @param logger - 可选日志器
 * @param level - 日志级别
 * @param fields - 路径与详情
 * @returns 无返回值
 */
function logDegrade(
  logger: Logger | undefined,
  level: 'info' | 'warn' | 'error',
  fields: { path: string; step: string; detail: string },
): void {
  if (!logger) {
    return;
  }
  logger[level](fields, 'qq reply degraded');
}
