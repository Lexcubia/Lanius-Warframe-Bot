import type { Locale, TranslateDto, ValenceFusionDto, WikiDto } from '@lanius/core';

/**
 * 将 Wiki DTO 格式化为 QQ 文本（链接须可点，故始终落在纯文本里）。
 *
 * @param data - WikiDto
 * @param locale - 展示语言
 * @param options - 可选 stale 标记
 * @returns 多行文本
 */
export function formatWikiText(
  data: WikiDto,
  locale: Locale,
  options: { stale?: boolean } = {},
): string {
  const lines: string[] = [];
  if (options.stale) {
    lines.push(locale === 'en' ? '[stale cache]' : '【缓存可能过期】');
  }
  lines.push(locale === 'en' ? `Wiki · ${data.pageName}` : `wiki · ${data.pageName}`);
  for (const line of data.lines) {
    lines.push(line);
  }
  if (data.alts.length > 0) {
    lines.push(
      locale === 'en'
        ? `Other candidates: ${data.alts.join(', ')}`
        : `同类候选：${data.alts.join('、')}`,
    );
  }
  if (data.note) {
    lines.push(`⚠️ ${data.note}`);
  }
  lines.push(locale === 'en' ? `Link: ${data.pageUrl}` : `🔗 wiki 链接：${data.pageUrl}`);
  return lines.join('\n');
}

/**
 * 将翻译 DTO 格式化为纯文本（对齐 SDJK：默认不渲图）。
 *
 * @param data - TranslateDto
 * @param locale - 展示语言（仅影响提示行）
 * @returns 多行文本
 */
export function formatTranslateText(data: TranslateDto, locale: Locale): string {
  const fmt = (pairs: TranslateDto['hits']) => {
    if (data.direction === 'zh_to_en') {
      return pairs.map((p) => `[${p.zh}] => ${p.en}`);
    }
    return pairs.map((p) => `[${p.en}] => ${p.zh}`);
  };

  if (data.hits.length > 0) {
    return fmt(data.hits).join('\n');
  }
  if (data.candidates.length > 0) {
    const head =
      locale === 'en'
        ? `No exact match for “${data.query}”; nearby:`
        : `未找到精确匹配「${data.query}」，相近候选：`;
    return [head, ...fmt(data.candidates)].join('\n');
  }
  return locale === 'en'
    ? `No entry for “${data.query}”. Try the official EN/ZH full name.`
    : `未找到「${data.query}」（未收录该名称）。改用官方中文或英文全名再试。`;
}

/**
 * 将效价融合 DTO 格式化为 QQ 文本。
 *
 * @param data - ValenceFusionDto
 * @param locale - 展示语言
 * @returns 多行文本
 */
export function formatValenceText(data: ValenceFusionDto, locale: Locale): string {
  const title =
    data.mode === 'plan'
      ? locale === 'en'
        ? 'Valence plan'
        : '效价融合规划'
      : data.mode === 'usage'
        ? locale === 'en'
          ? 'Valence fusion'
          : '效价融合'
        : locale === 'en'
          ? 'Valence fusion'
          : '效价融合';
  return [title, ...data.lines].join('\n');
}
