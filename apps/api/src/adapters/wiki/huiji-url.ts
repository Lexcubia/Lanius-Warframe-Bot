/**
 * 灰机 Warframe 维基根（中文社区镜像；仅用于深链，不做全文抓取）。
 */
export const HUIJI_WIKI_ORIGIN = 'https://warframe.huijiwiki.com';

/**
 * 灰机 wiki 页面标题归一（对齐 SDJK `wiki_title`：含中文时去空格与中点）。
 *
 * @param name - 展示名 / 页面名
 * @returns 可用于 path 段的标题
 */
export function normalizeHuijiWikiTitle(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return trimmed;
  }
  const hasCjk = /[\u4e00-\u9fff]/u.test(trimmed);
  if (!hasCjk) {
    return trimmed.replace(/ /g, '_');
  }
  return trimmed.replace(/[\s·・．.]/gu, '').replace(/ /g, '_');
}

/**
 * 构造灰机维基条目深链。
 *
 * @param pageName - 页面标题（国际服口径官方名）
 * @returns 绝对 URL
 */
export function buildHuijiWikiPageUrl(pageName: string): string {
  const title = normalizeHuijiWikiTitle(pageName);
  return `${HUIJI_WIKI_ORIGIN}/wiki/${encodeURIComponent(title)}`;
}

/**
 * 构造灰机维基搜索页（未命中本地词库时的可点兜底）。
 *
 * @param query - 用户关键词
 * @returns 搜索 URL
 */
export function buildHuijiWikiSearchUrl(query: string): string {
  const q = query.trim();
  return `${HUIJI_WIKI_ORIGIN}/index.php?search=${encodeURIComponent(q)}&title=特殊:搜索&fulltext=1`;
}
