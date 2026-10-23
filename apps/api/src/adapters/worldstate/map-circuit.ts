import type { CircuitChoiceDto, CircuitDto, LocalizedName } from '@lanius/core';

import { lookupCircuitChoiceUniqueName } from './circuit-unique-names.js';
import { applyLabelOverride, lookupLabelOverride } from './label-overrides.js';
import { resolvePathLabel, resolveWeaponLabel } from './resolve-labels.js';
import type { UpstreamEndlessXpScheduleEntry, UpstreamWorldstate } from './types.js';

/**
 * 将官方 `EndlessXpSchedule` 映射为回廊 / Circuit DTO。
 * `EXC_NORMAL` → 本周可选战甲；`EXC_HARD` → 钢路 Incarnon 武器适配器。
 *
 * @param raw - 上游 worldState 根对象
 * @param nowMs - 用于挑选当前有效档的「现在」毫秒（缺省 `Date.now()`）
 * @returns 规范化 `CircuitDto`；无档时 `null`
 */
export function mapCircuit(raw: UpstreamWorldstate, nowMs?: number): CircuitDto | null {
  const schedule = raw.EndlessXpSchedule;
  if (!schedule?.length) {
    return null;
  }

  const now = Number.isFinite(nowMs) ? (nowMs as number) : Date.now();
  const entry = pickActiveScheduleEntry(schedule, now) ?? schedule[0];
  if (!entry) {
    return null;
  }

  const normalChoices: CircuitChoiceDto[] = [];
  const hardChoices: CircuitChoiceDto[] = [];

  for (const group of entry.CategoryChoices ?? []) {
    const category = group.Category?.trim();
    const choices = (group.Choices ?? [])
      .map((key) => key?.trim())
      .filter((key): key is string => Boolean(key && key.length > 0))
      .map(mapCircuitChoice);

    if (category === 'EXC_NORMAL') {
      normalChoices.push(...choices);
    } else if (category === 'EXC_HARD') {
      hardChoices.push(...choices);
    }
  }

  // 两侧皆空视为无有效回廊数据（避免空壳 DTO 误导客户端）
  if (normalChoices.length === 0 && hardChoices.length === 0) {
    return null;
  }

  const activationMs = parseEpochMs(entry.Activation);
  const expiryMs = parseEpochMs(entry.Expiry);

  return {
    ...(activationMs !== undefined ? { activation: new Date(activationMs).toISOString() } : {}),
    ...(expiryMs !== undefined ? { expiry: new Date(expiryMs).toISOString() } : {}),
    normalChoices,
    hardChoices,
  };
}

/**
 * 映射单个 Choices 短名为 DTO（含解析后的双语名）。
 *
 * @param key - 上游短名，如 `Hydroid` / `DualToxocyst`
 * @returns `CircuitChoiceDto`
 */
function mapCircuitChoice(key: string): CircuitChoiceDto {
  return {
    key,
    name: resolveCircuitChoiceLabel(key),
  };
}

/**
 * 解析回廊可选项显示名：优先 uniqueName → languageString；再套 labels.weapons。
 *
 * @param choiceKey - 上游 `Choices` 短名
 * @returns 双语显示名
 */
export function resolveCircuitChoiceLabel(choiceKey: string): LocalizedName {
  const trimmed = choiceKey.trim();
  const uniqueName = lookupCircuitChoiceUniqueName(trimmed);
  if (uniqueName) {
    const fromPath = resolvePathLabel(uniqueName);
    // 路径解析成功后仍允许用短名 / 可读英文名做 weapons 覆盖（灰机译名）
    const byKey = lookupLabelOverride('weapons', trimmed);
    const byEn = lookupLabelOverride('weapons', fromPath.en);
    return applyLabelOverride(applyLabelOverride(fromPath, byEn), byKey);
  }

  const readable = humanizeCircuitChoiceKey(trimmed);
  return resolveWeaponLabel(readable);
}

/**
 * 将 CamelCase / PascalCase 短名拆成可读英文（`DualToxocyst` → `Dual Toxocyst`）。
 *
 * @param key - 上游短名
 * @returns 带空格的英文展示名
 */
export function humanizeCircuitChoiceKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) {
    return key;
  }
  // 在小写→大写、字母→数字边界插入空格
  return trimmed
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .trim();
}

/**
 * 挑选当前时刻仍有效的档；无命中时返回 `undefined`（调用方回退首条）。
 *
 * @param schedule - `EndlessXpSchedule` 数组
 * @param nowMs - 当前毫秒
 * @returns 活跃档，或 `undefined`
 */
function pickActiveScheduleEntry(
  schedule: UpstreamEndlessXpScheduleEntry[],
  nowMs: number,
): UpstreamEndlessXpScheduleEntry | undefined {
  for (const entry of schedule) {
    const activationMs = parseEpochMs(entry.Activation);
    const expiryMs = parseEpochMs(entry.Expiry);
    if (
      activationMs !== undefined &&
      expiryMs !== undefined &&
      nowMs >= activationMs &&
      nowMs < expiryMs
    ) {
      return entry;
    }
  }
  return undefined;
}

/**
 * 解析上游 `$date.$numberLong` 毫秒时间戳。
 *
 * @param stamp - 上游 Activation / Expiry
 * @returns 毫秒；无效时 `undefined`
 */
function parseEpochMs(stamp?: { $date?: { $numberLong?: string } }): number | undefined {
  const raw = stamp?.$date?.$numberLong;
  if (raw === undefined || raw === '') {
    return undefined;
  }
  const ms = Number(raw);
  return Number.isFinite(ms) ? ms : undefined;
}
