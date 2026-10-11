import { laniusTokens } from '@lanius/ui/tokens';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { loadCardFonts } from './fonts.js';

/**
 * 探测用画布高度：只为量出内容占位，不作为最终出图。
 */
const PROBE_CANVAS_HEIGHT = 4096;

/**
 * 最终画布相对内容底边的额外像素（壳层 padding 已含在内容里时仍留一点呼吸）。
 */
const FINAL_BOTTOM_PAD = 4;

/**
 * 最终画布最小高度，避免空数据时退化成 0。
 */
const MIN_FINAL_HEIGHT = 64;

/**
 * 将 Satori 元素树栅格化为 PNG（一次成型，无裁切）。
 *
 * Satori API 必须传入固定 `height`，且会把根节点撑满该高度，因此：
 * 1. 先用超高画布做**探测渲染**，扫描像素得到内容底边；
 * 2. 再用精确高度做**最终渲染**，该次 PNG 即为产物（不再 crop）。
 *
 * @param tree - Satori 元素树（根节点建议 `height: '100%'` 以铺满最终画布背景）
 * @returns PNG 字节
 */
export async function rasterizeCard(tree: unknown): Promise<Buffer> {
  const fonts = loadCardFonts();
  const width = laniusTokens.card.width;
  const fontFaces = [
    { name: 'Rajdhani', data: fonts.display, weight: 600 as const, style: 'normal' as const },
    { name: 'IBM Plex Sans', data: fonts.body, weight: 400 as const, style: 'normal' as const },
    { name: 'Noto Sans SC', data: fonts.cjk, weight: 400 as const, style: 'normal' as const },
  ];

  // —— 探测：只为测量，结果丢弃 ——
  const probeSvg = await satori(tree as never, {
    width,
    height: PROBE_CANVAS_HEIGHT,
    fonts: fontFaces,
  });
  const probeImage = new Resvg(probeSvg, {
    fitTo: { mode: 'width', value: width },
  }).render();
  const contentBottom = findContentBottom(
    probeImage.pixels,
    probeImage.width,
    probeImage.height,
  );
  const finalHeight = Math.max(
    MIN_FINAL_HEIGHT,
    Math.min(PROBE_CANVAS_HEIGHT, contentBottom + FINAL_BOTTOM_PAD),
  );

  // —— 最终：按测得高度直接出图，无 crop ——
  const finalSvg = await satori(tree as never, {
    width,
    height: finalHeight,
    fonts: fontFaces,
  });
  const finalPng = new Resvg(finalSvg, {
    fitTo: { mode: 'width', value: width },
  })
    .render()
    .asPng();

  return Buffer.from(finalPng);
}

/**
 * 自底向上扫描 RGBA 像素，找到最后一行仍含「非空白」内容的下一行索引。
 *
 * @param pixels - RGBA 紧凑缓冲
 * @param width - 图像宽
 * @param height - 图像高
 * @returns 内容底边下一行（作为测得高度）；全空时返回 1
 */
export function findContentBottom(
  pixels: Buffer,
  width: number,
  height: number,
): number {
  const rowBytes = width * 4;
  for (let y = height - 1; y >= 0; y -= 1) {
    if (rowHasContent(pixels, y * rowBytes, rowBytes)) {
      return y + 1;
    }
  }
  return 1;
}

/**
 * 判断一行是否存在非透明且非近背景色的像素。
 *
 * @param pixels - RGBA 缓冲
 * @param rowStart - 行起始字节偏移
 * @param rowBytes - 行字节数
 * @returns 是否含内容
 */
function rowHasContent(
  pixels: Buffer,
  rowStart: number,
  rowBytes: number,
): boolean {
  for (let i = 0; i < rowBytes; i += 4) {
    const o = rowStart + i;
    const a = pixels[o + 3] ?? 0;
    if (a < 8) {
      continue;
    }
    const r = pixels[o] ?? 0;
    const g = pixels[o + 1] ?? 0;
    const b = pixels[o + 2] ?? 0;
    if (isNearVoidBackground(r, g, b)) {
      continue;
    }
    return true;
  }
  return false;
}

/**
 * 是否接近画布外底（void / panelRaised），不含白色内卡。
 *
 * @param r - 红
 * @param g - 绿
 * @param b - 蓝
 * @returns 是否视为空白底
 */
function isNearVoidBackground(r: number, g: number, b: number): boolean {
  if (r >= 250 && g >= 250 && b >= 250) {
    return false;
  }
  return r >= 228 && r <= 248 && g >= 242 && g <= 252 && b >= 246 && b <= 254;
}
