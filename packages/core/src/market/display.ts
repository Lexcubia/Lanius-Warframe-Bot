import type { Locale } from '../locale.js';
import type { MarketSellerStatus } from '../dto/market.js';

/**
 * WFM 静态资源根（物品 thumb / icon 相对路径前缀）。
 */
export const WFM_STATIC_ASSET_BASE = 'https://warframe.market/static/assets/';

/**
 * 将 WFM 返回的相对 thumb/icon 路径转为可访问的绝对 URL。
 *
 * @param relativePath - 如 `items/images/en/thumbs/….png`；已是 http(s) 则原样返回
 * @returns 绝对 URL；空输入返回 `undefined`
 */
export function resolveWfmAssetUrl(relativePath: string | undefined | null): string | undefined {
  const raw = relativePath?.trim();
  if (!raw) {
    return undefined;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const path = raw.replace(/^\/+/, '');
  return `${WFM_STATIC_ASSET_BASE}${path}`;
}

/**
 * 卖家状态展示文案（zh 中文化；en 保持上游英文）。
 *
 * @param status - online / ingame
 * @param locale - 界面语言
 * @returns 展示串
 */
export function formatSellerStatusLabel(status: MarketSellerStatus, locale: Locale): string {
  if (locale === 'en') {
    return status === 'ingame' ? 'ingame' : 'online';
  }
  return status === 'ingame' ? '游戏中' : '在线';
}

/**
 * 市场卖单价与数量分开展示（避免「n白金 X n」含糊粘连）。
 *
 * @param platinum - 白金单价
 * @param quantity - 可售数量
 * @param locale - 语言
 * @returns 如 `69 白金 · ×20` / `69p · ×20`
 */
export function formatMarketPriceQuantity(
  platinum: number,
  quantity: number,
  locale: Locale,
): string {
  if (locale === 'en') {
    return `${platinum}p · ×${quantity}`;
  }
  return `${platinum} 白金 · ×${quantity}`;
}

/**
 * QQ `<qqbot-cmd-input>` 插入正文上限（与官方文档一致）。
 */
const QQ_WHISPER_MAX_CHARS = 100;

/**
 * 按 Unicode 码点截断。
 *
 * @param value - 原文
 * @param max - 最大码点数
 * @returns 截断串
 */
function clampCodePoints(value: string, max: number): string {
  const chars = Array.from(value);
  return chars.length <= max ? value : chars.slice(0, max).join('');
}

/**
 * 组装可在游戏内粘贴的 WFM 风格私聊文案（控制在 QQ cmd-input 100 字内）。
 *
 * @param input - 卖家、物品、价格与语言
 * @returns 如 `/w Name Hi! I want to buy: Item for 69p (WFM)`
 */
export function formatMarketWhisper(input: {
  seller: string;
  itemName: string;
  platinum: number;
  locale: Locale;
}): string {
  const seller = input.seller.trim() || 'unknown';
  const item = input.itemName.trim() || 'item';
  const plat = input.platinum;
  // 短后缀：完整 warframe.market 易超 QQ 100 字上限。
  const candidates =
    input.locale === 'en'
      ? [
          `/w ${seller} Hi! I want to buy: ${item} for ${plat}p (WFM)`,
          `/w ${seller} WTB ${item} ${plat}p`,
          `/w ${seller} WTB ${plat}p`,
        ]
      : [
          `/w ${seller} 你好！我想购买：${item}，${plat}白金 (WFM)`,
          `/w ${seller} 我想买 ${item} ${plat}白金`,
          `/w ${seller} 买 ${plat}白金`,
        ];
  for (const line of candidates) {
    if (Array.from(line).length <= QQ_WHISPER_MAX_CHARS) {
      return line;
    }
  }
  return clampCodePoints(candidates[candidates.length - 1]!, QQ_WHISPER_MAX_CHARS);
}
