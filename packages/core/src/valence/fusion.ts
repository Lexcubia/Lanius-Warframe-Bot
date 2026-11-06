import { ValenceElementSchema, type ValenceElement } from '../dto/traders.js';

/**
 * 效价融合加成上限（游戏内 60%）。
 */
export const VALENCE_CAP_PCT = 60;

/**
 * 元素别名 → 规范键（对齐 SDJK `VALENCE_ELEMENTS`；含中英短名）。
 */
const VALENCE_ELEMENT_ALIASES: Readonly<Record<string, ValenceElement>> = {
  电: 'electricity',
  电击: 'electricity',
  electricity: 'electricity',
  elec: 'electricity',
  火: 'heat',
  火焰: 'heat',
  heat: 'heat',
  fire: 'heat',
  冰: 'cold',
  冰冻: 'cold',
  cold: 'cold',
  frost: 'cold',
  ice: 'cold',
  毒: 'toxin',
  毒素: 'toxin',
  toxin: 'toxin',
  冲击: 'impact',
  impact: 'impact',
  磁力: 'magnetic',
  magnetic: 'magnetic',
  mag: 'magnetic',
  辐射: 'radiation',
  radiation: 'radiation',
  rad: 'radiation',
};

/**
 * 规范元素 → 中文展示短名（卡面 / 文本）。
 */
export const VALENCE_ELEMENT_LABEL_ZH: Readonly<Record<ValenceElement, string>> = {
  impact: '冲击',
  heat: '火焰',
  cold: '冰冻',
  electricity: '电击',
  toxin: '毒素',
  magnetic: '磁力',
  radiation: '辐射',
};

/**
 * 规范元素 → 英文展示名。
 */
export const VALENCE_ELEMENT_LABEL_EN: Readonly<Record<ValenceElement, string>> = {
  impact: 'Impact',
  heat: 'Heat',
  cold: 'Cold',
  electricity: 'Electricity',
  toxin: 'Toxin',
  magnetic: 'Magnetic',
  radiation: 'Radiation',
};

/**
 * 将用户输入的元素别名解析为规范键。
 *
 * @param raw - 原始别名（可含空白；大小写不敏感）
 * @returns 规范元素键；无法识别时为 `undefined`
 */
export function parseValenceElement(raw: string): ValenceElement | undefined {
  const key = raw.trim().toLowerCase();
  if (!key) {
    return undefined;
  }
  const mapped = VALENCE_ELEMENT_ALIASES[key] ?? VALENCE_ELEMENT_ALIASES[raw.trim()];
  if (!mapped) {
    return undefined;
  }
  return ValenceElementSchema.parse(mapped);
}

/**
 * 效价融合后的加成百分比（对齐 SDJK / 官方 wiki Valence Fusion）。
 *
 * 公式：`min(floor(1.1 × max(A,B) × 10) / 10, 60)`；结果 ≥58 时直接进位到 60。
 *
 * @param aPct - 受体（保留武器）加成百分比
 * @param bPct - 材料武器加成百分比
 * @returns 融合后加成（最多一位小数，上限 60）
 */
export function valenceBonusPct(aPct: number, bPct: number): number {
  const top = Math.max(Number(aPct), Number(bPct));
  const val = Math.floor(top * 1.1 * 10) / 10;
  if (val >= 58) {
    return VALENCE_CAP_PCT;
  }
  return Math.min(val, VALENCE_CAP_PCT);
}

/**
 * 两把同种 Kuva / Tenet / Coda 武器的效价融合结果。
 */
export type ValenceFusionResult = {
  /** 融合后加成百分比 */
  percent: number;
  /** 可选元素（同元素则仅一项；不会合成复合元素） */
  options: ValenceElement[];
  /** 说明文案键语义：同元素 / 二选一 */
  noteKind: 'same' | 'choose';
};

/**
 * 计算效价融合结果。
 *
 * @param aElement - A 武器元素
 * @param aPct - A 加成
 * @param bElement - B 武器元素
 * @param bPct - B 加成
 * @returns 融合结果
 */
export function valenceFusion(
  aElement: ValenceElement,
  aPct: number,
  bElement: ValenceElement,
  bPct: number,
): ValenceFusionResult {
  const percent = valenceBonusPct(aPct, bPct);
  if (aElement === bElement) {
    return { percent, options: [aElement], noteKind: 'same' };
  }
  return { percent, options: [aElement, bElement], noteKind: 'choose' };
}

/**
 * 从起始加成出发，用**同数值**材料反复融合到满值的轨迹。
 *
 * @param startPct - 起始加成百分比
 * @returns 每步融合后的百分比列表（末项为 60；已满则空数组）
 */
export function fusionStepsToCap(startPct: number): number[] {
  const trace: number[] = [];
  let cur = Number(startPct);
  while (cur < VALENCE_CAP_PCT && trace.length < 12) {
    cur = valenceBonusPct(cur, cur);
    trace.push(cur);
  }
  return trace;
}

/**
 * 单侧效价材料解析结果（元素可选 + 百分比）。
 */
export type ValenceMaterialToken = {
  /** 可选元素；未写元素时为空 */
  element?: ValenceElement;
  /** 加成百分比 */
  percent: number;
  /** 原始 token 文本 */
  raw: string;
};

/**
 * 从指令词元解析效价材料（如 `电60`、`火58%`、`44`）。
 *
 * @param tokens - 根命令后的词元
 * @returns 解析出的材料列表（非法百分比跳过）
 */
export function parseValenceMaterialTokens(tokens: readonly string[]): ValenceMaterialToken[] {
  const out: ValenceMaterialToken[] = [];
  for (const raw of tokens) {
    const m = raw.trim().match(/^([^\d]*?)(\d+(?:\.\d+)?)%?$/u);
    if (!m?.[2]) {
      continue;
    }
    const percent = Number(m[2]);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      continue;
    }
    const elemRaw = (m[1] ?? '').trim();
    const element = elemRaw ? parseValenceElement(elemRaw) : undefined;
    // 写了元素别名但无法识别 → 整 token 丢弃，避免静默当无元素
    if (elemRaw && !element) {
      continue;
    }
    out.push({
      ...(element ? { element } : {}),
      percent,
      raw: raw.trim(),
    });
  }
  return out;
}
