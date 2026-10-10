import type { Locale, WorldstateDto } from '@lanius/core';
import { laniusTokens } from '@lanius/ui/tokens';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { loadCardFonts } from './fonts.js';
import { buildWorldstateCardTree } from './worldstate-card.js';

/**
 * 渲染世界状态 PNG 卡片的入参。
 */
export type RenderWorldstateCardInput = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/**
 * 使用共享 Lanius 视觉 token，将 worldstate DTO 渲染为 PNG。
 *
 * @param input - 世界状态载荷、locale，以及可选的 stale 提示。
 * @returns 可供 QQ 媒体上传的 PNG 字节。
 * @throws Error 当 Satori 或 Resvg 失败时抛出。
 */
export async function renderWorldstateCard(
  input: RenderWorldstateCardInput,
): Promise<Buffer> {
  const fonts = loadCardFonts();
  const tree = buildWorldstateCardTree(input);
  const svg = await satori(tree as never, {
    width: laniusTokens.card.width,
    height: 420,
    fonts: [
      { name: 'Rajdhani', data: fonts.display, weight: 600, style: 'normal' },
      { name: 'IBM Plex Sans', data: fonts.body, weight: 400, style: 'normal' },
      { name: 'Noto Sans SC', data: fonts.cjk, weight: 400, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: laniusTokens.card.width },
  });
  return Buffer.from(resvg.render().asPng());
}
