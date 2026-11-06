import { hasCjk, normalizeName } from './normalize-name.js';

/**
 * 双语名称对（en, zh）；来源须为文档化的 DE PublicExport / 官方 language 同键对。
 */
export type BilingualNamePair = {
  /** 英文官方名 */
  en: string;
  /** 简体中文官方名 */
  zh: string;
};

/**
 * 翻译查表方向。
 */
export type TranslateDirection = 'zh_to_en' | 'en_to_zh';

/**
 * 双语查表结果。
 */
export type BilingualLookupResult = {
  /** 推断方向 */
  direction: TranslateDirection;
  /** 归一化后精确命中 */
  hits: BilingualNamePair[];
  /** 无精确命中时的子串候选 */
  candidates: BilingualNamePair[];
};

/**
 * 内存双语索引（由 API 适配层从 JSON 构建）。
 */
export type BilingualNameIndex = {
  /** 归一化英文 → 对列表 */
  byEn: Map<string, BilingualNamePair[]>;
  /** 归一化中文 → 对列表 */
  byZh: Map<string, BilingualNamePair[]>;
};

/**
 * 由 (en, zh) 对列表构建双向索引。
 *
 * @param pairs - 官方双语对
 * @returns 可查表索引
 */
export function buildBilingualIndex(
  pairs: ReadonlyArray<readonly [string, string] | BilingualNamePair>,
): BilingualNameIndex {
  const byEn = new Map<string, BilingualNamePair[]>();
  const byZh = new Map<string, BilingualNamePair[]>();
  for (const row of pairs) {
    const en = 'en' in row ? row.en : row[0];
    const zh = 'zh' in row ? row.zh : row[1];
    if (!en || !zh) {
      continue;
    }
    const pair: BilingualNamePair = { en, zh };
    const enKey = normalizeName(en);
    const zhKey = normalizeName(zh);
    if (enKey) {
      const list = byEn.get(enKey) ?? [];
      list.push(pair);
      byEn.set(enKey, list);
    }
    if (zhKey) {
      const list = byZh.get(zhKey) ?? [];
      list.push(pair);
      byZh.set(zhKey, list);
    }
  }
  return { byEn, byZh };
}

/**
 * 去重并截断双语对列表。
 *
 * @param pairs - 原始列表
 * @param limit - 最多保留条数
 * @returns 去重后的列表
 */
function dedupePairs(pairs: BilingualNamePair[], limit: number): BilingualNamePair[] {
  const out: BilingualNamePair[] = [];
  const seen = new Set<string>();
  for (const pair of pairs) {
    const key = `${pair.en}\0${pair.zh}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(pair);
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}

/**
 * 中英名称双向查表（精确优先，否则子串候选；不猜社区外号）。
 *
 * @param index - 预构建索引
 * @param query - 用户查询
 * @param limit - 命中 / 候选上限（默认 5）
 * @returns 查表结果
 */
export function bilingualLookup(
  index: BilingualNameIndex,
  query: string,
  limit = 5,
): BilingualLookupResult {
  const q = query.trim();
  const direction: TranslateDirection = hasCjk(q) ? 'zh_to_en' : 'en_to_zh';
  const nq = normalizeName(q);
  if (!nq) {
    return { direction, hits: [], candidates: [] };
  }
  const table = direction === 'zh_to_en' ? index.byZh : index.byEn;
  const exact = table.get(nq) ?? [];
  if (exact.length > 0) {
    return { direction, hits: dedupePairs(exact, limit), candidates: [] };
  }
  const cands: BilingualNamePair[] = [];
  for (const [key, rows] of table) {
    if (key.includes(nq)) {
      cands.push(...rows);
      if (cands.length >= limit * 4) {
        break;
      }
    }
  }
  return { direction, hits: [], candidates: dedupePairs(cands, limit) };
}
