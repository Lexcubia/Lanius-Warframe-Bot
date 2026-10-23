import type { QqKeyboardContent, QqKeyboardButton } from '@lanius/qq-official';
import { commandKeyboardButton } from '@lanius/qq-official';

import { formatMarketCommandSuffix, type ParsedMarketArgs } from '../commands/parse-market-args.js';

/**
 * 市场键盘构建选项。
 */
export type BuildMarketKeyboardOptions = {
  locale: 'zh' | 'en';
  enter: boolean;
  botAppId: string;
  /** 当前查询筛选（page / whisper 会被覆盖） */
  args: ParsedMarketArgs;
  /** 当前页 */
  page: number;
  /** 总页数 */
  totalPages: number;
  /** 本页卖单条数（用于私聊按钮；0 则不生成私聊行） */
  orderCount: number;
};

/**
 * 组装带目标页码的 `/wm` 指令正文（不含私聊序号）。
 *
 * @param args - 名称与筛选
 * @param page - 目标页；1 时省略 `p=`
 * @param locale - 键名语言
 * @returns 完整指令（无前导 `/`，与裂隙键盘一致）
 */
function marketCommandForPage(args: ParsedMarketArgs, page: number, locale: 'zh' | 'en'): string {
  const suffix = formatMarketCommandSuffix(
    { ...args, page: page <= 1 ? undefined : page, whisperIndex: undefined },
    locale,
  );
  return `wm ${suffix}`.trim();
}

/**
 * 组装本页第 n 条卖单的私聊指令（n 从 1）。
 *
 * @param args - 名称与筛选
 * @param page - 当前页
 * @param whisperIndex - 本页序号（1-based）
 * @param locale - 键名语言
 * @returns 指令正文
 */
function marketWhisperCommand(
  args: ParsedMarketArgs,
  page: number,
  whisperIndex: number,
  locale: 'zh' | 'en',
): string {
  const suffix = formatMarketCommandSuffix(
    {
      ...args,
      page: page <= 1 ? undefined : page,
      whisperIndex,
    },
    locale,
  );
  return `wm ${suffix}`.trim();
}

/**
 * 将按钮按每行最多 5 个切分。
 *
 * @param buttons - 按钮列表
 * @returns 行数组
 */
function chunkButtons(buttons: QqKeyboardButton[]): Array<{ buttons: QqKeyboardButton[] }> {
  const rows: Array<{ buttons: QqKeyboardButton[] }> = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push({ buttons: buttons.slice(i, i + 5) });
  }
  return rows;
}

/**
 * 构造 `/wm` 私聊 + 翻页指令键盘。
 * 有卖单时始终返回（私聊按钮）；仅一页且无卖单时返回 null。
 *
 * @param options - 语言、enter、当前页与筛选、本页条数
 * @returns QQ keyboard；无可点按钮时 null
 */
export function buildMarketPageKeyboard(
  options: BuildMarketKeyboardOptions,
): QqKeyboardContent | null {
  const zh = options.locale !== 'en';
  const rows: Array<{ buttons: QqKeyboardButton[] }> = [];

  if (options.orderCount > 0) {
    const whisperButtons: QqKeyboardButton[] = [];
    for (let i = 1; i <= options.orderCount; i += 1) {
      whisperButtons.push(
        commandKeyboardButton({
          id: `wm-w${i}`,
          label: zh ? `私聊${i}` : `W${i}`,
          command: marketWhisperCommand(options.args, options.page, i, options.locale),
          enter: options.enter,
          reply: false,
          style: 0,
        }),
      );
    }
    rows.push(...chunkButtons(whisperButtons));
  }

  const pageButtons: QqKeyboardButton[] = [];
  if (options.page > 1) {
    pageButtons.push(
      commandKeyboardButton({
        id: 'wm-prev',
        label: zh ? '上一页' : 'Prev',
        command: marketCommandForPage(options.args, options.page - 1, options.locale),
        enter: options.enter,
        reply: false,
        style: 1,
      }),
    );
  }
  if (options.page < options.totalPages) {
    pageButtons.push(
      commandKeyboardButton({
        id: 'wm-next',
        label: zh ? '下一页' : 'Next',
        command: marketCommandForPage(options.args, options.page + 1, options.locale),
        enter: options.enter,
        reply: false,
        style: 1,
      }),
    );
  }
  if (pageButtons.length > 0) {
    rows.push({ buttons: pageButtons });
  }

  if (rows.length === 0) {
    return null;
  }

  return {
    botAppId: options.botAppId,
    rows,
  };
}

/**
 * 市场翻页 / 私聊 Markdown 短提示。
 *
 * @param locale - 语言
 * @param page - 当前页
 * @param totalPages - 总页数
 * @param hasWhisper - 是否含私聊按钮
 * @returns 提示文案
 */
export function marketPageMarkdownHint(
  locale: 'zh' | 'en',
  page: number,
  totalPages: number,
  hasWhisper = false,
): string {
  if (locale === 'en') {
    return hasWhisper
      ? `**Market** — page ${page}/${totalPages} · Whisper N → /w paste`
      : `**Market** — page ${page}/${totalPages}`;
  }
  return hasWhisper
    ? `**市场** — 第 ${page}/${totalPages} 页 · 私聊N → 游戏内 /w 文案`
    : `**市场** — 第 ${page}/${totalPages} 页`;
}
