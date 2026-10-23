import {
  pickLocalized,
  type Locale,
  type MarketOrdersDto,
  type RivenOrdersDto,
} from '@lanius/core';

/**
 * 将市场卖单分页 DTO 格式化为 QQ 文本。
 *
 * @param data - 单目标卖单页
 * @param locale - 语言
 * @returns 文本
 */
export function formatMarketText(data: MarketOrdersDto, locale: Locale): string {
  const title = locale === 'en' ? '【Lanius · Market】' : '【Lanius · 市场】';
  const name = pickLocalized(data.resolved.name, locale);
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize) || 1);
  const header =
    locale === 'en'
      ? `Locked: ${name} · page ${data.page}/${totalPages} · sell online/ingame · price↑`
      : `已锁定：${name} · 第 ${data.page}/${totalPages} 页 · 在线/游戏中卖单 · 价↑`;

  if (data.total === 0) {
    const empty =
      locale === 'en'
        ? `No online/ingame sell orders for ${name}.`
        : `已锁定 ${name}，暂无在线/游戏中卖单`;
    return [title, header, empty].join('\n');
  }

  const lines = data.orders.map((order, index) => {
    const rank =
      order.modRank === null
        ? ''
        : locale === 'en'
          ? ` r${order.modRank}`
          : ` 等级${order.modRank}`;
    const status = order.status === 'ingame' ? 'ingame' : 'online';
    const n = (data.page - 1) * data.pageSize + index + 1;
    return locale === 'en'
      ? `${n}. ${order.platinum}p ×${order.quantity}${rank} · ${order.seller} (${status})`
      : `${n}. ${order.platinum}白金 ×${order.quantity}${rank} · ${order.seller}（${status}）`;
  });

  return [title, header, ...lines].join('\n');
}

/**
 * 将紫卡拍卖分页 DTO 格式化为 QQ 文本。
 *
 * @param data - 单武器拍卖页
 * @param locale - 语言
 * @returns 文本
 */
export function formatRivenText(data: RivenOrdersDto, locale: Locale): string {
  const title = locale === 'en' ? '【Lanius · Riven】' : '【Lanius · 紫卡】';
  const name = pickLocalized(data.resolved.name, locale);
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize) || 1);
  const header =
    locale === 'en'
      ? `Locked: ${name} · page ${data.page}/${totalPages} · auctions online/ingame · price↑`
      : `已锁定：${name} · 第 ${data.page}/${totalPages} 页 · 在线/游戏中拍卖 · 价↑`;

  if (data.total === 0) {
    const empty =
      locale === 'en'
        ? `No online/ingame riven auctions for ${name}.`
        : `已锁定 ${name}，暂无在线/游戏中紫卡拍卖`;
    return [title, header, empty].join('\n');
  }

  const lines = data.orders.map((order, index) => {
    const n = (data.page - 1) * data.pageSize + index + 1;
    const attrs = order.attributes
      .map((attr) => {
        const label = pickLocalized(attr.name, locale);
        const sign = attr.positive ? '+' : '';
        return `${label} ${sign}${attr.value}`;
      })
      .join(', ');
    const meta =
      locale === 'en'
        ? `MR${order.mastery} · rank ${order.rank} · rerolls ${order.rerolls}`
        : `段位${order.mastery} · 等级${order.rank} · 循环${order.rerolls}`;
    return locale === 'en'
      ? `${n}. ${order.platinum}p · ${order.seller} (${order.status})\n   ${meta}${attrs ? `\n   ${attrs}` : ''}`
      : `${n}. ${order.platinum}白金 · ${order.seller}（${order.status}）\n   ${meta}${attrs ? `\n   ${attrs}` : ''}`;
  });

  return [title, header, ...lines].join('\n');
}
