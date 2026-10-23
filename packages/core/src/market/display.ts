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
 * 组装可在游戏内粘贴的 WFM 风格私聊文案。
 *
 * @param input - 卖家、物品、价格与语言
 * @returns 如 `/w Name Hi! I want to buy: Item for 69 platinum. (warframe.market)`
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
  if (input.locale === 'en') {
    return `/w ${seller} Hi! I want to buy: ${item} for ${plat} platinum. (warframe.market)`;
  }
  return `/w ${seller} 你好！我想购买：${item}，价格 ${plat} 白金。(warframe.market)`;
}
