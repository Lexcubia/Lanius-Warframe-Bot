/**
 * `/wm` 解析后的筛选与分页字段。
 */
export type ParsedMarketArgs = {
  /** 物品名（剩余非键值 token 拼接） */
  query: string;
  /** 模组等级过滤 */
  modRank?: number;
  /** 页码（从 1） */
  page?: number;
};

/**
 * `/zk` 解析后的筛选与分页字段。
 */
export type ParsedRivenArgs = {
  /** 武器名 */
  query: string;
  /** 紫卡等级 */
  rank?: number;
  /** 段位 */
  mastery?: number;
  /** 最小循环；单值「循环=N」时与 max 同为 N */
  minRerolls?: number;
  maxRerolls?: number;
  page?: number;
};

/**
 * 键值 token 形态：`等级=3` / `rank:3` / `p=2`。
 */
const KV_TOKEN = /^([^\s=:]+)[=:](.+)$/u;

/**
 * 解析非负整数；非法则 undefined。
 *
 * @param raw - 原始值串
 * @returns 整数或 undefined
 */
function parseNonNegInt(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  return Number(trimmed);
}

/**
 * 将 `/wm` 根命令后的词元解析为查询名 + 可选等级/页码。
 * 未知键忽略（由调用方打 debug 日志）。
 *
 * @param tokens - 根命令后的空格分词
 * @returns 解析结果；无名称时 query 为空串
 */
export function parseMarketArgs(tokens: string[]): ParsedMarketArgs {
  const nameParts: string[] = [];
  const unknownKeys: string[] = [];
  let modRank: number | undefined;
  let page: number | undefined;

  for (const token of tokens) {
    const match = KV_TOKEN.exec(token);
    if (!match) {
      nameParts.push(token);
      continue;
    }
    const key = match[1]!.trim().toLowerCase();
    const value = match[2]!.trim();
    const num = parseNonNegInt(value);

    if (
      (key === '等级' || key === 'rank' || key === 'modrank' || key === 'mod_rank') &&
      num !== undefined
    ) {
      modRank = num;
      continue;
    }
    if ((key === 'p' || key === 'page' || key === '页') && num !== undefined && num >= 1) {
      page = num;
      continue;
    }
    unknownKeys.push(key);
  }

  if (unknownKeys.length > 0 && typeof console !== 'undefined') {
    // 未知筛选键不阻断；便于排查用户笔误。
    console.debug('[lanius-bot] market ignore unknown keys', unknownKeys);
  }

  return {
    query: nameParts.join(' ').trim(),
    ...(modRank !== undefined ? { modRank } : {}),
    ...(page !== undefined ? { page } : {}),
  };
}

/**
 * 将 `/zk` 根命令后的词元解析为武器名 + 可选等级/段位/循环/页码。
 * 未知键忽略并打 debug。
 *
 * @param tokens - 根命令后的空格分词
 * @returns 解析结果；无名称时 query 为空串
 */
export function parseRivenArgs(tokens: string[]): ParsedRivenArgs {
  const nameParts: string[] = [];
  const unknownKeys: string[] = [];
  let rank: number | undefined;
  let mastery: number | undefined;
  let minRerolls: number | undefined;
  let maxRerolls: number | undefined;
  let page: number | undefined;

  for (const token of tokens) {
    const match = KV_TOKEN.exec(token);
    if (!match) {
      nameParts.push(token);
      continue;
    }
    const key = match[1]!.trim().toLowerCase();
    const value = match[2]!.trim();
    const num = parseNonNegInt(value);

    if ((key === '等级' || key === 'rank' || key === 'modrank') && num !== undefined) {
      rank = num;
      continue;
    }
    if (
      (key === '段位' || key === 'mastery' || key === 'mr' || key === 'mastery_rank') &&
      num !== undefined
    ) {
      mastery = num;
      continue;
    }
    if ((key === '循环' || key === 'rerolls' || key === 'reroll') && num !== undefined) {
      minRerolls = num;
      maxRerolls = num;
      continue;
    }
    if ((key === 'minrerolls' || key === '循环min') && num !== undefined) {
      minRerolls = num;
      continue;
    }
    if ((key === 'maxrerolls' || key === '循环max') && num !== undefined) {
      maxRerolls = num;
      continue;
    }
    if ((key === 'p' || key === 'page' || key === '页') && num !== undefined && num >= 1) {
      page = num;
      continue;
    }
    unknownKeys.push(key);
  }

  if (unknownKeys.length > 0 && typeof console !== 'undefined') {
    console.debug('[lanius-bot] riven ignore unknown keys', unknownKeys);
  }

  return {
    query: nameParts.join(' ').trim(),
    ...(rank !== undefined ? { rank } : {}),
    ...(mastery !== undefined ? { mastery } : {}),
    ...(minRerolls !== undefined ? { minRerolls } : {}),
    ...(maxRerolls !== undefined ? { maxRerolls } : {}),
    ...(page !== undefined ? { page } : {}),
  };
}

/**
 * 将市场筛选重放为指令后缀（不含根命令），供翻页键盘使用。
 *
 * @param args - 已解析的市场参数
 * @param locale - 决定键名用中/英
 * @returns 如 `红晶 等级=5 p=2`
 */
export function formatMarketCommandSuffix(args: ParsedMarketArgs, locale: 'zh' | 'en'): string {
  const parts: string[] = [];
  if (args.query) {
    parts.push(args.query);
  }
  if (args.modRank !== undefined) {
    parts.push(locale === 'en' ? `rank=${args.modRank}` : `等级=${args.modRank}`);
  }
  if (args.page !== undefined && args.page > 1) {
    parts.push(`p=${args.page}`);
  }
  return parts.join(' ');
}

/**
 * 将紫卡筛选重放为指令后缀（不含根命令）。
 *
 * @param args - 已解析的紫卡参数
 * @param locale - 键名语言
 * @returns 如 `拉特龙 等级=0 段位=8 p=2`
 */
export function formatRivenCommandSuffix(args: ParsedRivenArgs, locale: 'zh' | 'en'): string {
  const parts: string[] = [];
  if (args.query) {
    parts.push(args.query);
  }
  if (args.rank !== undefined) {
    parts.push(locale === 'en' ? `rank=${args.rank}` : `等级=${args.rank}`);
  }
  if (args.mastery !== undefined) {
    parts.push(locale === 'en' ? `mastery=${args.mastery}` : `段位=${args.mastery}`);
  }
  if (
    args.minRerolls !== undefined &&
    args.maxRerolls !== undefined &&
    args.minRerolls === args.maxRerolls
  ) {
    parts.push(locale === 'en' ? `rerolls=${args.minRerolls}` : `循环=${args.minRerolls}`);
  } else {
    if (args.minRerolls !== undefined) {
      parts.push(`minRerolls=${args.minRerolls}`);
    }
    if (args.maxRerolls !== undefined) {
      parts.push(`maxRerolls=${args.maxRerolls}`);
    }
  }
  if (args.page !== undefined && args.page > 1) {
    parts.push(`p=${args.page}`);
  }
  return parts.join(' ');
}
