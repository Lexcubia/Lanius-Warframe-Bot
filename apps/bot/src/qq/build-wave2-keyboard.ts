import type { QqKeyboardButton, QqKeyboardContent } from '@lanius/qq-official';
import { commandKeyboardButton } from '@lanius/qq-official';

/**
 * Wave2 列表翻页键盘选项。
 */
export type BuildWave2PageKeyboardOptions = {
  locale: 'zh' | 'en';
  enter: boolean;
  /** 不含页码的指令前缀，如 `金垃圾` / `排行 部件` / `玄骸 赤毒怒雷` */
  commandBase: string;
  page: number;
  totalPages: number;
  /** 按钮 id 前缀 */
  idPrefix: string;
};

/**
 * 构造 Wave2 列表翻页键盘（仅多页时返回）。
 *
 * @param options - 页码与指令基串
 * @returns QQ keyboard 或 null
 */
export function buildWave2PageKeyboard(
  options: BuildWave2PageKeyboardOptions,
): QqKeyboardContent | null {
  if (options.totalPages <= 1) {
    return null;
  }
  const zh = options.locale !== 'en';
  const pageButtons: QqKeyboardButton[] = [];
  if (options.page > 1) {
    pageButtons.push(
      commandKeyboardButton({
        id: `${options.idPrefix}-prev`,
        label: zh ? '上一页' : 'Prev',
        command: `${options.commandBase} p=${options.page - 1}`.trim(),
        enter: options.enter,
        reply: false,
        style: 1,
      }),
    );
  }
  if (options.page < options.totalPages) {
    pageButtons.push(
      commandKeyboardButton({
        id: `${options.idPrefix}-next`,
        label: zh ? '下一页' : 'Next',
        command: `${options.commandBase} p=${options.page + 1}`.trim(),
        enter: options.enter,
        reply: false,
        style: 1,
      }),
    );
  }
  if (pageButtons.length === 0) {
    return null;
  }
  return {
    rows: [{ buttons: pageButtons }],
  };
}
