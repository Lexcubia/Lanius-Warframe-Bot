/**
 * 名称归一化（对齐 SDJK `matching.normalize_name`，供翻译 / wiki 查表）。
 *
 * 规则：NFKC → 小写 → **去除全部空白与中点变体**（· ・ •）。
 * 例：「阿索代prime」≡「阿索代 Prime」≡「阿索代·Prime」。
 *
 * @param value - 原始名称
 * @returns 归一化串；空输入返回空串
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[·・•\s]+/gu, '');
}

/**
 * 判断字符串是否含 CJK 统一汉字（用于翻译方向：含汉字 → zh→en）。
 *
 * @param value - 待测串
 * @returns 是否含至少一个汉字
 */
export function hasCjk(value: string): boolean {
  return /[\u4e00-\u9fff]/u.test(value);
}
