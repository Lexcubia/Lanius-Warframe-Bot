import type { QqKeyboardButton, QqKeyboardContent } from '@lanius/qq-official';
import { commandKeyboardButton } from '@lanius/qq-official';

import { formatRivenCommandSuffix, type ParsedRivenArgs } from '../commands/parse-market-args.js';

/**
 * 紫卡键盘构建选项。
 */
export type BuildRivenKeyboardOptions = {
  locale: 'zh' | 'en';
  enter: boolean;
  botAppId: string;
  args: ParsedRivenArgs;
  page: number;
  totalPages: number;
  /** 本页拍卖条数 */
  orderCount: number;
};

/**
 * 组装带目标页码的 `/zk` 指令正文。
 *
 * @param args - 武器与筛选
 * @param page - 目标页；1 时省略 `p=`
 * @param locale - 键名语言
 * @returns 完整指令（无前导 `/`）
 */
function rivenCommandForPage(args: ParsedRivenArgs, page: number, locale: 'zh' | 'en'): string {
  const suffix = formatRivenCommandSuffix(
    { ...args, page: page <= 1 ? undefined : page, whisperIndex: undefined },
    locale,
  );
  return `zk ${suffix}`.trim();
}

/**
 * 组装本页第 n 条拍卖的私聊指令。
 *
 * @param args - 武器与筛选
 * @param page - 当前页
 * @param whisperIndex - 本页序号（1-based）
 * @param locale - 键名语言
 * @returns 指令正文
 */
function rivenWhisperCommand(
  args: ParsedRivenArgs,
  page: number,
  whisperIndex: number,
  locale: 'zh' | 'en',
): string {
  const suffix = formatRivenCommandSuffix(
    {
      ...args,
      page: page <= 1 ? undefined : page,
      whisperIndex,
    },
    locale,
  );
  return `zk ${suffix}`.trim();
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
 * 构造 `/zk` 私聊 + 翻页指令键盘。
 *
 * @param options - 语言、enter、当前页与筛选、本页条数
 * @returns QQ keyboard；无可点按钮时 null
 */
export function buildRivenPageKeyboard(
  options: BuildRivenKeyboardOptions,
): QqKeyboardContent | null {
  const zh = options.locale !== 'en';
  const rows: Array<{ buttons: QqKeyboardButton[] }> = [];

  if (options.orderCount > 0) {
    const whisperButtons: QqKeyboardButton[] = [];
    for (let i = 1; i <= options.orderCount; i += 1) {
      whisperButtons.push(
        commandKeyboardButton({
          id: `zk-w${i}`,
          label: zh ? `私聊${i}` : `W${i}`,
          command: rivenWhisperCommand(options.args, options.page, i, options.locale),
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
        id: 'zk-prev',
        label: zh ? '上一页' : 'Prev',
        command: rivenCommandForPage(options.args, options.page - 1, options.locale),
        enter: options.enter,
        reply: false,
        style: 1,
      }),
    );
  }
  if (options.page < options.totalPages) {
    pageButtons.push(
      commandKeyboardButton({
        id: 'zk-next',
        label: zh ? '下一页' : 'Next',
        command: rivenCommandForPage(options.args, options.page + 1, options.locale),
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
 * 紫卡翻页 / 私聊 Markdown 短提示。
 *
 * @param locale - 语言
 * @param page - 当前页
 * @param totalPages - 总页数
 * @param hasWhisper - 是否含私聊按钮
 * @returns 提示文案
 */
export function rivenPageMarkdownHint(
  locale: 'zh' | 'en',
  page: number,
  totalPages: number,
  hasWhisper = false,
): string {
  if (locale === 'en') {
    return hasWhisper
      ? `**Riven** — page ${page}/${totalPages} · Whisper N → /w paste`
      : `**Riven** — page ${page}/${totalPages}`;
  }
  return hasWhisper
    ? `**紫卡** — 第 ${page}/${totalPages} 页 · 私聊N → 游戏内 /w 文案`
    : `**紫卡** — 第 ${page}/${totalPages} 页`;
}
