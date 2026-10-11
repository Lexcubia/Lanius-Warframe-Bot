/**
 * 将剩余毫秒格式化为短时文案。
 *
 * @param remainingMs - 剩余毫秒
 * @param locale - `zh` | `en`
 * @returns 短时字符串
 */
export function formatRemain(remainingMs: number, locale: 'zh' | 'en'): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return locale === 'en' ? `${hours}h ${minutes}m` : `${hours}时 ${minutes}分`;
  }
  return locale === 'en'
    ? `${minutes}m ${seconds}s`
    : `${minutes}分 ${seconds}秒`;
}
