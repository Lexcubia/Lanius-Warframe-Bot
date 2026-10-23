/**
 * 物品索引行（WFM `/items` 精简字段，供模糊锁定）。
 */
export type ItemIndexRow = {
  /** WFM url_name */
  urlName: string;
  /** 展示名（通常为 zh-hans 或 en） */
  itemName: string;
};

/**
 * 模糊锁定结果（单一最佳命中）。
 */
export type ResolvedItemHit = {
  urlName: string;
  itemName: string;
  /** 内部评分（越大越好；调用方一般不展示） */
  score: number;
};

/**
 * 去掉空白并小写，便于包含匹配。
 *
 * @param value - 原始字符串
 * @returns 规范化串
 */
function compactLower(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * 将 url_name 转为可读比较串（下划线→空格）。
 *
 * @param urlName - WFM slug
 * @returns 小写可读串
 */
function urlNameAsPhrase(urlName: string): string {
  return urlName.trim().toLowerCase().replace(/_/g, ' ');
}

/**
 * 判断条目是否像套装（url 以 `_set` 结尾或名含「一套/Set」）。
 *
 * @param row - 索引行
 * @returns 是否套装语义
 */
function looksLikeSet(row: ItemIndexRow): boolean {
  const url = row.urlName.toLowerCase();
  if (url.endsWith('_set')) {
    return true;
  }
  return /一套|\bset\b/i.test(row.itemName);
}

/**
 * 计算查询相对单条索引的得分；0 表示不命中。
 * 精确 > 前缀 > 包含 > 去空格包含；套装额外加分；名称越短略优。
 *
 * @param query - 用户查询（已 trim）
 * @param row - 索引行
 * @returns 得分，未命中为 0
 */
export function scoreItemMatch(query: string, row: ItemIndexRow): number {
  const q = query.trim().toLowerCase();
  if (!q) {
    return 0;
  }
  const name = row.itemName.trim().toLowerCase();
  const urlPhrase = urlNameAsPhrase(row.urlName);
  const urlRaw = row.urlName.trim().toLowerCase();
  const qCompact = compactLower(query);
  const nameCompact = compactLower(row.itemName);
  const urlCompact = compactLower(urlPhrase);

  let base = 0;
  if (name === q || urlPhrase === q || urlRaw === q) {
    base = 1000;
  } else if (name.startsWith(q) || urlPhrase.startsWith(q) || urlRaw.startsWith(q)) {
    base = 800;
  } else if (name.includes(q) || urlPhrase.includes(q) || urlRaw.includes(q)) {
    base = 600;
  } else if (
    qCompact.length > 0 &&
    (nameCompact.includes(qCompact) || urlCompact.includes(qCompact))
  ) {
    base = 400;
  } else {
    return 0;
  }

  // 套装优先：同档命中时 `_set` / 「一套」抬高分，避免零件抢过整套。
  if (looksLikeSet(row)) {
    base += 50;
  }

  // 名称越短越贴查询，轻微扣长名噪声。
  const lengthPenalty = Math.min(name.length, 80);
  return base * 100 - lengthPenalty;
}

/**
 * 在索引中模糊锁定**唯一**最佳物品；同分时取字典序更前的 url_name 以稳定结果。
 *
 * @param query - 用户查询串
 * @param items - WFM 物品索引
 * @returns 最佳命中；无命中时 `null`
 */
export function resolveBestItem(
  query: string,
  items: readonly ItemIndexRow[],
): ResolvedItemHit | null {
  const q = query.trim();
  if (!q || items.length === 0) {
    return null;
  }

  let best: ResolvedItemHit | null = null;
  for (const row of items) {
    const score = scoreItemMatch(q, row);
    if (score <= 0) {
      continue;
    }
    if (!best || score > best.score || (score === best.score && row.urlName < best.urlName)) {
      best = {
        urlName: row.urlName,
        itemName: row.itemName,
        score,
      };
    }
  }
  return best;
}
