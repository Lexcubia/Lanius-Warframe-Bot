import type { QqKeyboardContent } from '@lanius/qq-official';
import { commandKeyboardButton } from '@lanius/qq-official';

import { formatMarketCommandSuffix, type ParsedMarketArgs } from '../commands/parse-market-args.js';

/**
 * 市场翻页键盘构建选项。
 */
export type BuildMarketKeyboardOptions = {
  locale: 'zh' | 'en';
  enter: boolean;
  botAppId: string;
  /** 当前查询筛选（page 字段会被翻页逻辑覆盖） */
  args: ParsedMarketArgs;
  /** 当前页 */
  page: number;
  /** 总页数 */
  totalPages: number;
};

/**
 * 组装带目标页码的 `/wm` 指令正文。
 *
 * @param args - 名称与筛选
 * @param page - 目标页；1 时省略 `p=`
 * @param locale - 键名语言
 * @returns 完整指令（无前导 `/`，与裂隙键盘一致）
 */
function marketCommandForPage(args: ParsedMarketArgs, page: number, locale: 'zh' | 'en'): string {
  const suffix = formatMarketCommandSuffix({ ...args, page: page <= 1 ? undefined : page }, locale);
  return `wm ${suffix}`.trim();
}

/**
 * 构造 `/wm` 上一页 / 下一页指令键盘（重放名称与筛选 + `p=`）。
 *
 * @param options - 语言、enter、当前页与筛选
 * @returns QQ keyboard；仅一页时返回 null
 */
export function buildMarketPageKeyboard(
  options: BuildMarketKeyboardOptions,
): QqKeyboardContent | null {
  if (options.totalPages <= 1) {
    return null;
  }

  const zh = options.locale !== 'en';
  const buttons = [];

  if (options.page > 1) {
    buttons.push(
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
    buttons.push(
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

  if (buttons.length === 0) {
    return null;
  }

  return {
    botAppId: options.botAppId,
    rows: [{ buttons }],
  };
}

/**
 * 市场翻页 Markdown 短提示。
 *
 * @param locale - 语言
 * @param page - 当前页
 * @param totalPages - 总页数
 * @returns 提示文案
 */
export function marketPageMarkdownHint(
  locale: 'zh' | 'en',
  page: number,
  totalPages: number,
): string {
  return locale === 'en'
    ? `**Market** — page ${page}/${totalPages}`
    : `**市场** — 第 ${page}/${totalPages} 页`;
}
