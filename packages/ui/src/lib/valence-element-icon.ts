import type { ValenceElement } from '@lanius/core';

import cold from '../../assets/elements/cold.png';
import electricity from '../../assets/elements/electricity.png';
import heat from '../../assets/elements/heat.png';
import impact from '../../assets/elements/impact.png';
import magnetic from '../../assets/elements/magnetic.png';
import radiation from '../../assets/elements/radiation.png';
import toxin from '../../assets/elements/toxin.png';

/**
 * 信条 / 终幕 Valence 元素 → 本地打包图标（非官方 CDN）。
 * 武器图标仍走 `content.warframe.com/PublicExport`。
 */
const VALENCE_ELEMENT_ICONS: Record<ValenceElement, string> = {
  impact,
  heat,
  cold,
  electricity,
  toxin,
  magnetic,
  radiation,
};

/**
 * 解析 Valence 元素本地图标 URL（Vite/Nuxt 打包后的资源地址）。
 *
 * @param element - 规范元素键
 * @returns 可用于 `<img src>` 的资源 URL
 */
export function resolveValenceElementIconSrc(element: ValenceElement): string {
  return VALENCE_ELEMENT_ICONS[element];
}
