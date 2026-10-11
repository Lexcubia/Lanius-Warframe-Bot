import type { LocalizedName, ValenceElement } from '@lanius/core';

/**
 * Valence 元素双语标签（对齐灰机 / 官方常见译名）。
 */
const ELEMENT_LABELS: Record<ValenceElement, LocalizedName> = {
  impact: { zh: '冲击', en: 'Impact' },
  heat: { zh: '火焰', en: 'Heat' },
  cold: { zh: '冰冻', en: 'Cold' },
  electricity: { zh: '电击', en: 'Electricity' },
  toxin: { zh: '毒素', en: 'Toxin' },
  magnetic: { zh: '磁力', en: 'Magnetic' },
  radiation: { zh: '辐射', en: 'Radiation' },
};

/**
 * 配置侧常见别名 → 规范元素键。
 */
const ELEMENT_ALIASES: Record<string, ValenceElement> = {
  impact: 'impact',
  冲击: 'impact',
  heat: 'heat',
  fire: 'heat',
  火焰: 'heat',
  火: 'heat',
  cold: 'cold',
  freeze: 'cold',
  ice: 'cold',
  冰冻: 'cold',
  冰: 'cold',
  electricity: 'electricity',
  electric: 'electricity',
  电击: 'electricity',
  电: 'electricity',
  toxin: 'toxin',
  poison: 'toxin',
  毒素: 'toxin',
  毒: 'toxin',
  magnetic: 'magnetic',
  磁力: 'magnetic',
  radiation: 'radiation',
  辐射: 'radiation',
};

/**
 * 解析配置中的元素字符串为规范键。
 *
 * @param raw - 英文键、别名或中文简称
 * @returns ValenceElement，无法识别时 `undefined`
 */
export function parseValenceElement(raw: string): ValenceElement | undefined {
  const key = raw.trim().toLowerCase();
  if (!key) {
    return undefined;
  }
  return ELEMENT_ALIASES[key] ?? ELEMENT_ALIASES[raw.trim()];
}

/**
 * 取得元素双语显示名。
 *
 * @param element - 规范元素键
 * @returns LocalizedName
 */
export function resolveElementLabel(element: ValenceElement): LocalizedName {
  return ELEMENT_LABELS[element];
}
