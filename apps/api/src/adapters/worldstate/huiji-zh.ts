/**
 * 将 WFCD `zh` 等来源中的常见繁体/旧译，对齐灰机 wiki（warframe.huijiwiki.com）简体习惯。
 * 仅做高频替换，避免引入完整 OpenCC 依赖。
 */
const HUIJI_PHRASE_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['穀神星', '谷神星'],
  ['歐羅巴', '欧罗巴'],
  ['賽德娜', '赛德娜'],
  ['鬩神星', '阋神星'],
  ['Kuva 要塞', '赤毒要塞'],
  ['Kuva要塞', '赤毒要塞'],
];

/**
 * 对齐灰机 wiki 的简体显示名。
 *
 * @param text - 原始中文（可能含繁体星图名）
 * @returns 替换后的字符串；空输入原样返回
 */
export function toHuijiZh(text: string): string {
  if (!text) {
    return text;
  }
  let next = text;
  for (const [from, to] of HUIJI_PHRASE_REPLACEMENTS) {
    if (next.includes(from)) {
      next = next.split(from).join(to);
    }
  }
  return next;
}
