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
 * 卖家状态展示文案（zh 中文化；en 保持上游英文；含 offline 以便着色扩展）。
 *
 * @param status - online / ingame / offline
 * @param locale - 界面语言
 * @returns 展示串
 */
export function formatSellerStatusLabel(
  status: MarketSellerStatus | 'offline',
  locale: Locale,
): string {
  if (locale === 'en') {
    if (status === 'ingame') {
      return 'ingame';
    }
    if (status === 'offline') {
      return 'offline';
    }
    return 'online';
  }
  if (status === 'ingame') {
    return '游戏中';
  }
  if (status === 'offline') {
    return '离线';
  }
  return '在线';
}

/**
 * 卖家状态对应的视觉色调（卡片/Web 着色用）。
 *
 * @param status - online / ingame / offline
 * @returns `online` | `ingame` | `offline`（与 CSS 修饰符一致）
 */
export function sellerStatusTone(
  status: MarketSellerStatus | 'offline',
): 'online' | 'ingame' | 'offline' {
  if (status === 'ingame' || status === 'offline') {
    return status;
  }
  return 'online';
}

/**
 * 白金单价展示（不含数量，避免与「×」混淆）。
 *
 * @param platinum - 白金单价
 * @param locale - 语言
 * @returns 如 `69 白金` / `69p`
 */
export function formatMarketPlatinumLabel(platinum: number, locale: Locale): string {
  return locale === 'en' ? `${platinum}p` : `${platinum} 白金`;
}

/**
 * 可售数量展示（单独字段，不带 ×）。
 *
 * @param quantity - 可售数量
 * @param locale - 语言
 * @returns 如 `数量 20` / `qty 20`
 */
export function formatMarketQuantityLabel(quantity: number, locale: Locale): string {
  return locale === 'en' ? `qty ${quantity}` : `数量 ${quantity}`;
}

/**
 * 市场卖单价与数量分开展示（无 ×，避免「n白金 X n」歧义）。
 *
 * @param platinum - 白金单价
 * @param quantity - 可售数量
 * @param locale - 语言
 * @returns 如 `69 白金 · 数量 20` / `69p · qty 20`
 */
export function formatMarketPriceQuantity(
  platinum: number,
  quantity: number,
  locale: Locale,
): string {
  return `${formatMarketPlatinumLabel(platinum, locale)} · ${formatMarketQuantityLabel(quantity, locale)}`;
}

/**
 * WFM 卖家声誉展示。
 *
 * @param reputation - 非负整数声誉
 * @param locale - 语言
 * @returns 如 `声誉 42` / `rep 42`
 */
export function formatSellerReputationLabel(reputation: number, locale: Locale): string {
  const value = Number.isFinite(reputation) && reputation >= 0 ? Math.trunc(reputation) : 0;
  return locale === 'en' ? `rep ${value}` : `声誉 ${value}`;
}

/**
 * 杜卡德（Ducats）展示。
 *
 * @param ducats - 杜卡德数量
 * @param locale - 语言
 * @returns 如 `杜卡德 15` / `15 ducats`
 */
export function formatDucatsLabel(ducats: number, locale: Locale): string {
  const value = Number.isFinite(ducats) && ducats >= 0 ? Math.trunc(ducats) : 0;
  return locale === 'en' ? `${value} ducats` : `杜卡德 ${value}`;
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
