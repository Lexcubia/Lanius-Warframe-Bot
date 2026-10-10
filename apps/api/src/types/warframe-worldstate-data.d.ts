/**
 * 为 `warframe-worldstate-data` 提供最小类型声明（包本身无完整 d.ts）。
 */
declare module 'warframe-worldstate-data/utilities' {
  /**
   * 将节点内部键解析为显示名。
   *
   * @param nodeKey - 如 `SolNode189`
   * @param locale - 字典 locale（如 `en` / `zh`）
   * @returns 可读节点名
   */
  export function node(nodeKey: string, locale?: string): string;

  /**
   * 将阵营代码解析为显示名。
   *
   * @param factionKey - 如 `FC_GRINEER`
   * @param locale - 字典 locale
   * @returns 可读阵营名
   */
  export function faction(factionKey: string, locale?: string): string;

  /**
   * 将 Lotus uniqueName 解析为短标题。
   *
   * @param uniqueName - 挑战或物品路径
   * @param locale - 字典 locale
   * @returns 标题文案
   */
  export function languageString(uniqueName: string, locale?: string): string;

  /**
   * 将 Lotus uniqueName 解析为描述文案。
   *
   * @param uniqueName - 挑战路径等
   * @param locale - 字典 locale
   * @returns 描述文案
   */
  export function languageDesc(uniqueName: string, locale?: string): string;
}
