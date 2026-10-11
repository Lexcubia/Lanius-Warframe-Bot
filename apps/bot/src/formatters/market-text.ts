import { pickLocalized, type Locale, type MarketSearchDto } from '@lanius/core';

/**
 * 将市场搜索 DTO 格式化为 QQ 文本。
 *
 * @param data - 市场搜索结果
 * @param locale - 语言
 * @returns 文本
 */
export function formatMarketText(data: MarketSearchDto, locale: Locale): string {
  const title = locale === 'en' ? '【Lanius · Market】' : '【Lanius · 市场】';
  if (!data.items.length) {
    return `${title}\n${locale === 'en' ? 'No match for' : '未匹配'}：${data.query}`;
  }
  const lines = data.items.map((item) => {
    const name = pickLocalized(item.name, locale);
    const sell = item.lowestSell ?? '—';
    const buy = item.highestBuy ?? '—';
    return locale === 'en'
      ? `· ${name}  sell ${sell} / buy ${buy}`
      : `· ${name}  在售 ${sell} / 求购 ${buy}`;
  });
  return [title, ...lines].join('\n');
}

/**
 * 将紫卡搜索 DTO 格式化为 QQ 文本。
 *
 * @param data - 紫卡结果
 * @param locale - 语言
 * @returns 文本
 */
export function formatRivenText(
  data: import('@lanius/core').RivenSearchDto,
  locale: Locale,
): string {
  const title = locale === 'en' ? '【Lanius · Riven】' : '【Lanius · 紫卡】';
  if (!data.results.length) {
    return `${title}\n${locale === 'en' ? 'No samples for' : '暂无样本'}：${data.query}`;
  }
  const lines = data.results.map((row) => {
    const name = pickLocalized(row.weaponName, locale);
    return locale === 'en'
      ? `· ${name}  min ${row.minPlatinum ?? '—'} / med ${row.medianPlatinum ?? '—'} / max ${row.maxPlatinum ?? '—'} (n=${row.sampleCount})`
      : `· ${name}  低 ${row.minPlatinum ?? '—'} / 中 ${row.medianPlatinum ?? '—'} / 高 ${row.maxPlatinum ?? '—'}（n=${row.sampleCount}）`;
  });
  return [title, ...lines].join('\n');
}
