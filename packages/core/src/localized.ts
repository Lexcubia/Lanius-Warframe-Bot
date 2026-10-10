import type { Locale } from './locale.js';
import type { LocalizedName } from './dto/worldstate.js';

/**
 * 按请求 locale 从双语显示名中选取单语文案。
 *
 * @param name - 含 `zh` / `en` 的显示名对象
 * @param locale - 界面或回复 locale
 * @returns 与 locale 对应的字符串（`en` 取英文，其余取中文）
 */
export function pickLocalized(name: LocalizedName, locale: Locale): string {
  return locale === 'en' ? name.en : name.zh;
}
