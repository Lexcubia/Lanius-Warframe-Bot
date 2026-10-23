import type { QqKeyboardContent } from '@lanius/qq-official';
import { commandKeyboardButton } from '@lanius/qq-official';

import { formatRivenCommandSuffix, type ParsedRivenArgs } from '../commands/parse-market-args.js';

/**
 * 紫卡翻页键盘构建选项。
 */
export type BuildRivenKeyboardOptions = {
  locale: 'zh' | 'en';
  enter: boolean;
  botAppId: string;
  args: ParsedRivenArgs;
  page: number;
  totalPages: number;
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
  const suffix = formatRivenCommandSuffix({ ...args, page: page <= 1 ? undefined : page }, locale);
  return `zk ${suffix}`.trim();
}

/**
 * 构造 `/zk` 上一页 / 下一页指令键盘。
 *
 * @param options - 语言、enter、当前页与筛选
 * @returns QQ keyboard；仅一页时 null
 */
export function buildRivenPageKeyboard(
  options: BuildRivenKeyboardOptions,
): QqKeyboardContent | null {
  if (options.totalPages <= 1) {
    return null;
  }

  const zh = options.locale !== 'en';
  const buttons = [];

  if (options.page > 1) {
    buttons.push(
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
    buttons.push(
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

  if (buttons.length === 0) {
    return null;
  }

  return {
    botAppId: options.botAppId,
    rows: [{ buttons }],
  };
}

/**
 * 紫卡翻页 Markdown 短提示。
 *
 * @param locale - 语言
 * @param page - 当前页
 * @param totalPages - 总页数
 * @returns 提示文案
 */
export function rivenPageMarkdownHint(
  locale: 'zh' | 'en',
  page: number,
  totalPages: number,
): string {
  return locale === 'en'
    ? `**Riven** — page ${page}/${totalPages}`
    : `**紫卡** — 第 ${page}/${totalPages} 页`;
}
