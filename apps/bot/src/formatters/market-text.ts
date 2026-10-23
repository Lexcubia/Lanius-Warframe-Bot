import {
  formatMarketPriceQuantity,
  formatMarketWhisper,
  formatSellerStatusLabel,
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
    const status = formatSellerStatusLabel(order.status, locale);
    const n = (data.page - 1) * data.pageSize + index + 1;
    const price = formatMarketPriceQuantity(order.platinum, order.quantity, locale);
    return locale === 'en'
      ? `${n}. ${price}${rank} · ${order.seller} (${status})`
      : `${n}. ${price}${rank} · ${order.seller}（${status}）`;
  });

  const tip =
    locale === 'en'
      ? 'Tip: tap Whisper N to get an in-game /w paste line.'
      : '提示：点「私聊N」可获取游戏内可粘贴的 /w 文案。';

  return [title, header, ...lines, tip].join('\n');
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
    const status = formatSellerStatusLabel(order.status, locale);
    return locale === 'en'
      ? `${n}. ${order.platinum}p · ${order.seller} (${status})\n   ${meta}${attrs ? `\n   ${attrs}` : ''}`
      : `${n}. ${order.platinum} 白金 · ${order.seller}（${status}）\n   ${meta}${attrs ? `\n   ${attrs}` : ''}`;
  });

  const tip =
    locale === 'en'
      ? 'Tip: tap Whisper N to get an in-game /w paste line.'
      : '提示：点「私聊N」可获取游戏内可粘贴的 /w 文案。';

  return [title, header, ...lines, tip].join('\n');
}

/**
 * 将指定卖单格式化为可复制私聊正文（供按钮触发后回复）。
 *
 * @param data - 市场页
 * @param indexOnPage - 本页 0-based 下标
 * @param locale - 语言
 * @returns 私聊文案；越界时返回错误提示
 */
export function formatMarketWhisperReply(
  data: MarketOrdersDto,
  indexOnPage: number,
  locale: Locale,
): string {
  const order = data.orders[indexOnPage];
  if (!order) {
    return locale === 'en'
      ? 'That order index is out of range on this page.'
      : '本页没有该序号的卖单。';
  }
  const itemName = pickLocalized(data.resolved.name, locale);
  const line = formatMarketWhisper({
    seller: order.seller,
    itemName,
    platinum: order.platinum,
    locale,
  });
  const guide = locale === 'en' ? 'Copy into Warframe chat:' : '请复制到游戏内聊天：';
  return `${guide}\n${line}`;
}

/**
 * 将指定紫卡拍卖格式化为可复制私聊正文。
 *
 * @param data - 紫卡页
 * @param indexOnPage - 本页 0-based 下标
 * @param locale - 语言
 * @returns 私聊文案；越界时返回错误提示
 */
export function formatRivenWhisperReply(
  data: RivenOrdersDto,
  indexOnPage: number,
  locale: Locale,
): string {
  const order = data.orders[indexOnPage];
  if (!order) {
    return locale === 'en'
      ? 'That auction index is out of range on this page.'
      : '本页没有该序号的拍卖。';
  }
  const weapon = pickLocalized(data.resolved.name, locale);
  const itemName = locale === 'en' ? `${weapon} Riven` : `${weapon} 紫卡`;
  const line = formatMarketWhisper({
    seller: order.seller,
    itemName,
    platinum: order.platinum,
    locale,
  });
  const guide = locale === 'en' ? 'Copy into Warframe chat:' : '请复制到游戏内聊天：';
  return `${guide}\n${line}`;
}
