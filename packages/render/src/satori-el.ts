/**
 * Satori 元素节点（兼容 React element 的普通对象）。
 */
export type SatoriNode = {
  type: string;
  props: Record<string, unknown>;
};

/**
 * 创建 Satori 元素节点。
 *
 * @param type - HTML/SVG 标签名
 * @param props - style / children 等属性
 * @returns Satori 可接受的普通元素对象
 */
export function el(type: string, props: Record<string, unknown>): SatoriNode {
  return { type, props };
}

/**
 * 按码位截断文案。
 *
 * @param value - 原始文案
 * @param maxChars - 最大码位数
 * @returns 截断后文案
 */
export function clipText(value: string, maxChars: number): string {
  const chars = Array.from(value);
  if (chars.length <= maxChars) {
    return value;
  }
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join('')}…`;
}

/**
 * 将剩余毫秒格式化为「X时 Y分」或「Y分 Z秒」。
 *
 * @param remainingMs - 剩余毫秒
 * @param zh - 是否中文
 * @returns 短时文案
 */
export function formatRemaining(remainingMs: number, zh: boolean): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return zh ? `${hours}时 ${minutes}分` : `${hours}h ${minutes}m`;
  }
  return zh ? `${minutes}分 ${seconds}秒` : `${minutes}m ${seconds}s`;
}
