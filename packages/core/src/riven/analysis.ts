import {
  RIVEN_BASE_STATS,
  RIVEN_CLASS_KEYS,
  RIVEN_FACTOR,
  RIVEN_INVERTED_STATS,
  RIVEN_NEGATIVE_ONLY,
  RIVEN_SPLICE_RECIPES,
  RIVEN_STAT_LOOKUP,
  RIVEN_STAT_ZH,
  UNIFIED_DISPOSITION,
} from './tables.js';

/** 紫卡基值表列名。 */
export type RivenWeaponClass = 'rifle' | 'shotgun' | 'pistol' | 'archgun' | 'melee';

/** 单条词条输入（负词条 value 存幅度正数）。 */
export type RivenStatInput = {
  /** 标准词条 id */
  id: string;
  /** 卡面数值（幅度；负词条为正） */
  value: number;
  /** 是否正向 */
  positive: boolean;
};

/** 单条词条分析结果。 */
export type RivenStatAnalysis = {
  id: string;
  nameZh: string;
  value: number;
  positive: boolean;
  /** 合法区间下限 */
  lo: number;
  /** 合法区间上限 */
  hi: number;
  /** 相对中值偏差百分比（高卷为正） */
  deviationPct: number;
  /** 区间位 0–100 */
  positionPct: number;
};

const CLASS_IDX: Readonly<Record<RivenWeaponClass, number>> = {
  rifle: 0,
  shotgun: 1,
  pistol: 2,
  archgun: 3,
  melee: 4,
};

/**
 * 将 WM `rivenType` / `group` 归一为基值表列名。
 *
 * @param rivenType - WM rivenType（可空）
 * @param group - WM group（可空；优先于 rivenType）
 * @returns 列名；无法识别时回落 `rifle`
 */
export function resolveRivenWeaponClass(rivenType = '', group = ''): RivenWeaponClass {
  const g = group.trim().toLowerCase();
  const t = rivenType.trim().toLowerCase();
  const fromGroup = g ? RIVEN_CLASS_KEYS[g] : undefined;
  const fromType = t ? RIVEN_CLASS_KEYS[t] : undefined;
  const hit = (fromGroup || fromType || 'rifle') as RivenWeaponClass;
  if (hit === 'rifle' || hit === 'shotgun' || hit === 'pistol' || hit === 'archgun' || hit === 'melee') {
    return hit;
  }
  return 'rifle';
}

/**
 * 解析用户输入的词条别名为标准 id。
 *
 * @param token - 中文短名 / 英文 / slug
 * @returns 标准 id；未命中返回 null
 */
export function resolveRivenStatId(token: string): string | null {
  const raw = token.trim();
  if (!raw) {
    return null;
  }
  return RIVEN_STAT_LOOKUP[raw] ?? RIVEN_STAT_LOOKUP[raw.toLowerCase()] ?? null;
}

/**
 * 取词条数系数。
 *
 * @param nPos - 正词条数
 * @param nNeg - 负词条数
 * @returns `[正系数, 负幅度系数]`；未知组合默认 3+1
 */
export function factorFor(nPos: number, nNeg: number): readonly [number, number | null] {
  const key = `${nPos},${nNeg}`;
  return RIVEN_FACTOR[key] ?? RIVEN_FACTOR['3,1'] ?? [0.9375, 0.75];
}

/**
 * 计算某词条在给定档位下的合法数值区间（幅度）。
 *
 * @param statId - 标准词条 id
 * @param cls - 武器类列
 * @param disposition - 倾向 D（现期默认 1.2）
 * @param nPos - 正词条数
 * @param nNeg - 负词条数
 * @param negative - 是否按负词条系数算
 * @returns `[lo, hi]`；该类无此词条时返回 null
 */
export function statRange(
  statId: string,
  cls: RivenWeaponClass,
  disposition: number,
  nPos: number,
  nNeg: number,
  negative = false,
): [number, number] | null {
  const row = RIVEN_BASE_STATS[statId];
  if (!row) {
    return null;
  }
  const base = row[CLASS_IDX[cls]];
  if (base == null || !Number.isFinite(base)) {
    return null;
  }
  const [posF, negF] = factorFor(nPos, nNeg);
  const factor = negative ? (negF ?? 0.75) : posF;
  const mid = base * disposition * factor;
  return [mid * 0.9, mid * 1.1];
}

/**
 * 相对中值偏差百分比（高卷为正）。
 *
 * @param value - 卡面幅度
 * @param lo - 区间下限
 * @param hi - 区间上限
 * @returns 百分比
 */
export function deviationPct(value: number, lo: number, hi: number): number {
  const mid = (lo + hi) / 2;
  if (!Number.isFinite(mid) || mid === 0) {
    return 0;
  }
  return ((value - mid) / mid) * 100;
}

/**
 * 区间位置 0–100（贴下限=0，贴上限=100）。
 *
 * @param value - 卡面幅度
 * @param lo - 区间下限
 * @param hi - 区间上限
 * @returns 0–100
 */
export function rangePosition(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) {
    return 50;
  }
  const p = ((value - lo) / (hi - lo)) * 100;
  return Math.max(0, Math.min(100, p));
}

/**
 * 分析一整张紫卡的各词条卷度。
 *
 * @param input - 武器类、词条与可选倾向
 * @returns 词条分析结果列表
 */
export function analyzeRivenStats(input: {
  cls: RivenWeaponClass;
  stats: readonly RivenStatInput[];
  disposition?: number;
}): RivenStatAnalysis[] {
  const disposition = input.disposition ?? UNIFIED_DISPOSITION;
  const nPos = input.stats.filter((s) => s.positive).length;
  const nNeg = input.stats.filter((s) => !s.positive).length;
  const out: RivenStatAnalysis[] = [];
  for (const stat of input.stats) {
    const inverted = RIVEN_INVERTED_STATS.has(stat.id);
    const treatNegative = !stat.positive || inverted;
    const range = statRange(stat.id, input.cls, disposition, nPos, nNeg, treatNegative);
    if (!range) {
      out.push({
        id: stat.id,
        nameZh: RIVEN_STAT_ZH[stat.id] ?? stat.id,
        value: stat.value,
        positive: stat.positive,
        lo: 0,
        hi: 0,
        deviationPct: 0,
        positionPct: 50,
      });
      continue;
    }
    const [lo, hi] = range;
    out.push({
      id: stat.id,
      nameZh: RIVEN_STAT_ZH[stat.id] ?? stat.id,
      value: stat.value,
      positive: stat.positive,
      lo: round1(lo),
      hi: round1(hi),
      deviationPct: round1(deviationPct(stat.value, lo, hi)),
      positionPct: round1(rangePosition(stat.value, lo, hi)),
    });
  }
  return out;
}

/**
 * 按武器类与词条过滤融合配方。
 *
 * @param cls - 可选武器类
 * @param stat - 可选词条 id（匹配原料或产物）
 * @returns 配方列表
 */
export function listSpliceRecipes(
  cls?: string,
  stat?: string,
): readonly { a: string; b: string; result: string; classes: readonly string[] }[] {
  return RIVEN_SPLICE_RECIPES.filter(
    (r) =>
      (cls == null || r.classes.includes(cls)) &&
      (stat == null || stat === r.a || stat === r.b || stat === r.result),
  );
}

/**
 * 列出某武器类可 roll 的词条范围摘要（正/负各取基值×D×默认 3+1 系数×[0.9,1.1]）。
 *
 * @param cls - 武器类
 * @param disposition - 倾向
 * @returns 正/负区间行
 */
export function listStatRangesForClass(
  cls: RivenWeaponClass,
  disposition = UNIFIED_DISPOSITION,
): {
  positives: RivenStatAnalysis[];
  negatives: RivenStatAnalysis[];
} {
  const positives: RivenStatAnalysis[] = [];
  const negatives: RivenStatAnalysis[] = [];
  for (const id of Object.keys(RIVEN_BASE_STATS)) {
    if (RIVEN_NEGATIVE_ONLY.has(id)) {
      const neg = statRange(id, cls, disposition, 3, 1, true);
      if (neg) {
        negatives.push(rangeRow(id, neg, false));
      }
      continue;
    }
    const pos = statRange(id, cls, disposition, 3, 1, false);
    if (pos) {
      positives.push(rangeRow(id, pos, true));
    }
    if (!RIVEN_INVERTED_STATS.has(id)) {
      const neg = statRange(id, cls, disposition, 3, 1, true);
      if (neg) {
        negatives.push(rangeRow(id, neg, false));
      }
    }
  }
  return { positives, negatives };
}

/**
 * 从自由文本解析「武器 + 词条数值」输入。
 *
 * 支持形如：`绝路 暴击几率 180 暴击伤害 100 -射速 40` 或 `+暴击 180 -装填 30`。
 *
 * @param text - 用户原文
 * @returns 武器名残串与词条；解析失败时 stats 为空
 */
export function parseRivenAnalysisText(text: string): {
  weaponQuery: string;
  stats: RivenStatInput[];
  notes: string[];
} {
  const notes: string[] = [];
  const tokens = text
    .replace(/[，,]/g, ' ')
    .replace(/[＋]/g, '+')
    .replace(/[－—]/g, '-')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return { weaponQuery: '', stats: [], notes: ['空输入'] };
  }

  const stats: RivenStatInput[] = [];
  const weaponParts: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i] ?? '';
    let positive = true;
    let nameTok = tok;
    if (tok.startsWith('+') || tok.startsWith('-')) {
      positive = !tok.startsWith('-');
      nameTok = tok.slice(1);
    }
    const id = resolveRivenStatId(nameTok);
    if (id) {
      const next = tokens[i + 1];
      const value = next != null ? Number.parseFloat(next) : Number.NaN;
      if (Number.isFinite(value)) {
        stats.push({ id, value: Math.abs(value), positive });
        i += 2;
        continue;
      }
      notes.push(`词条 ${nameTok} 缺少数值`);
      i += 1;
      continue;
    }
    // 未识别为词条时，靠前段落视为武器名
    if (stats.length === 0) {
      weaponParts.push(tok);
    } else {
      notes.push(`无法识别：${tok}`);
    }
    i += 1;
  }
  return { weaponQuery: weaponParts.join(' ').trim(), stats, notes };
}

/**
 * 构造词条范围展示行。
 *
 * @param id - 词条 id
 * @param range - 区间
 * @param positive - 是否正向
 * @returns 分析结果形
 */
function rangeRow(id: string, range: [number, number], positive: boolean): RivenStatAnalysis {
  const [lo, hi] = range;
  return {
    id,
    nameZh: RIVEN_STAT_ZH[id] ?? id,
    value: round1((lo + hi) / 2),
    positive,
    lo: round1(lo),
    hi: round1(hi),
    deviationPct: 0,
    positionPct: 50,
  };
}

/**
 * 保留一位小数。
 *
 * @param n - 数值
 * @returns 一位小数
 */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export { UNIFIED_DISPOSITION, RIVEN_STAT_ZH };
