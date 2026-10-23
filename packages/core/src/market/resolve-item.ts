/**
 * 物品索引行（WFM `/items` 精简字段，供模糊锁定）。
 */
export type ItemIndexRow = {
  /** WFM url_name / slug */
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
 * 社区常用别名 → 规范名/英文 slug（双向扩展查询候选）。
 * 例：玩家常写「拉特龙」，WFM zh-hans 实为「拉特昂」。
 */
const NAME_ALIASES: Readonly<Record<string, readonly string[]>> = {
  拉特龙: ['拉特昂', 'latron'],
  拉特昂: ['拉特龙', 'latron'],
  latron: ['拉特昂', '拉特龙'],
};

/**
 * 去掉空白并小写，便于包含匹配。
 *
 * @param value - 原始字符串
 * @returns 规范化串
 */
function compactLower(value: string): string {
  return foldCompare(value).replace(/\s+/g, '');
}

/**
 * 比较用折叠：小写、间隔号→空格、压缩空白（「拉特昂·亡魂」≈「拉特昂 亡魂」）。
 *
 * @param value - 原始串
 * @returns 折叠串
 */
function foldCompare(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[·・．.]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * 将 url_name 转为可读比较串（下划线→空格）。
 *
 * @param urlName - WFM slug
 * @returns 小写可读串
 */
function urlNameAsPhrase(urlName: string): string {
  return foldCompare(urlName.replace(/_/g, ' '));
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
 * 查询是否点名了变体（亡魂 / Prime 等）；未点名时压低变体套装分。
 *
 * @param query - 用户查询
 * @returns 是否含变体关键词
 */
function queryMentionsVariant(query: string): boolean {
  const q = query.toLowerCase();
  return /亡魂|wraith|vandal|prisma|prime|一套|set|枪管|枪机|枪托|蓝图|barrel|receiver|stock|blueprint/.test(
    q,
  );
}

/**
 * 展开别名后的查询候选（含原串，去重）。
 *
 * @param query - 用户输入
 * @returns 用于打分的候选列表
 */
export function expandQueryCandidates(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const key = trimmed.toLowerCase();
  const aliasKey = NAME_ALIASES[trimmed] ? trimmed : NAME_ALIASES[key] ? key : trimmed;
  const extras = NAME_ALIASES[aliasKey] ?? NAME_ALIASES[trimmed] ?? NAME_ALIASES[key] ?? [];
  const out = [trimmed, ...extras];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of out) {
    const token = item.trim();
    if (!token) continue;
    const fold = token.toLowerCase();
    if (seen.has(fold)) continue;
    seen.add(fold);
    unique.push(token);
  }
  return unique;
}

/**
 * 计算「单候选查询」相对单条索引的得分；0 表示不命中。
 *
 * @param query - 单个候选查询（已 trim）
 * @param row - 索引行
 * @returns 得分
 */
export function scoreItemMatch(query: string, row: ItemIndexRow): number {
  const q = foldCompare(query);
  if (!q) {
    return 0;
  }
  const name = foldCompare(row.itemName);
  const urlPhrase = urlNameAsPhrase(row.urlName);
  const urlRaw = row.urlName.trim().toLowerCase();
  const qCompact = compactLower(query);
  const nameCompact = compactLower(row.itemName);
  const urlCompact = compactLower(urlPhrase);

  let base = 0;
  // 精确命中名称 / slug / 可读 slug
  if (name === q || urlPhrase === q || urlRaw === q) {
    base = 1000;
  } else if (
    // 词首匹配：拉特昂 / 拉特昂 Prime / 拉特昂·亡魂
    name.startsWith(q) ||
    urlPhrase.startsWith(q) ||
    urlRaw.startsWith(q)
  ) {
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

  const url = urlRaw;
  const mentionsVariant = queryMentionsVariant(query);

  // 套装优先于零件；未点名变体时 Prime 套 > 普通套 > 亡魂/其它变体套。
  if (looksLikeSet(row)) {
    if (url.endsWith('_prime_set')) {
      base += mentionsVariant && /prime/i.test(query) ? 80 : 70;
    } else if (url.endsWith('_set') && !/_wraith_set$|_vandal_set$|_prisma_set$/.test(url)) {
      base += 55;
    } else if (url.endsWith('_set')) {
      // 变体套：仅当用户点名变体时抬高，否则略低于 Prime 套。
      base += mentionsVariant ? 65 : 40;
    } else {
      base += 50;
    }
  } else if (/_(barrel|receiver|stock|blueprint)$/.test(url)) {
    // 零件低于整套，避免「拉特昂」锁到枪管。
    base -= 30;
  }

  // 裸武器 slug（紫卡索引常见）在精确/前缀档额外加分。
  if (urlRaw === q || urlPhrase === q) {
    base += 40;
  }

  // 名称越短越贴查询，轻微扣长名噪声。
  const lengthPenalty = Math.min(name.length, 80);
  return base * 100 - lengthPenalty;
}

/**
 * 对别名展开后的全部候选取最高分。
 *
 * @param query - 用户原始查询
 * @param row - 索引行
 * @returns 最高分；均未命中为 0
 */
export function scoreItemMatchWithAliases(query: string, row: ItemIndexRow): number {
  let best = 0;
  for (const candidate of expandQueryCandidates(query)) {
    const score = scoreItemMatch(candidate, row);
    if (score > best) {
      best = score;
    }
  }
  return best;
}

/**
 * 在索引中模糊锁定**唯一**最佳物品；同分时取字典序更前的 url_name 以稳定结果。
 *
 * @param query - 用户查询串
 * @param items - WFM 物品/武器索引
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
    const score = scoreItemMatchWithAliases(q, row);
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
