import type { Locale } from '@lanius/core';

import { captureVueCard } from './chromium/capture-vue-card.js';
import type { CardSkinId } from './vue-cards/skins.js';

/**
 * Wave 2 行卡渲染入参。
 */
export type RenderWave2LinesInput = {
  title: string;
  kicker: string;
  subtitle?: string;
  lines: string[];
  locale: Locale;
  skin?: CardSkinId | string;
};

/**
 * 渲染 Wave 2 通用 Orokin 行卡 PNG。
 *
 * @param input - 标题与行
 * @returns PNG 字节
 */
export async function renderWave2LinesCard(input: RenderWave2LinesInput): Promise<Buffer> {
  return captureVueCard({
    kind: 'wave2Lines',
    locale: input.locale,
    skin: input.skin,
    wave2: {
      title: input.title,
      kicker: input.kicker,
      subtitle: input.subtitle,
      lines: input.lines,
    },
  });
}
