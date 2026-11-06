import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Wave 2 静态数据包根目录（`apps/api/data/wave2`）。
 */
const WAVE2_DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../data/wave2');

/**
 * 玄骸武器行（自 SDJK `lich_weapons.json`）。
 */
export type LichWeaponRow = {
  type: 'lich' | 'sister' | 'coda';
  en: string;
  zh: string;
  zh_nodot?: string;
  alias?: string[];
  wm?: boolean;
};

/**
 * 倾向表条目。
 */
export type DispositionEntry = {
  disposition: number;
  group?: string;
  riven_type?: string;
  url_name?: string;
  zh?: string;
};

/**
 * 遗物奖励表。
 */
export type RelicIndex = Record<
  string,
  { 常见?: string[]; 罕见?: string[]; 稀有?: string[] }
>;

/**
 * 部件反查表。
 */
export type RelicInverse = Record<string, Array<{ relic: string; rarity: string }>>;

let lichWeaponsCache: Record<string, LichWeaponRow> | undefined;
let dispositionCache: Record<string, DispositionEntry> | undefined;
let relicIndexCache: RelicIndex | undefined;
let relicInverseCache: RelicInverse | undefined;

/**
 * 读取并解析 Wave2 JSON。
 *
 * @param name - 文件名
 * @returns 解析对象
 */
function readJson<T>(name: string): T {
  const raw = readFileSync(join(WAVE2_DATA_DIR, name), 'utf8');
  return JSON.parse(raw) as T;
}

/**
 * 加载玄骸武器表。
 *
 * @returns slug → 行
 */
export function loadLichWeapons(): Record<string, LichWeaponRow> {
  if (!lichWeaponsCache) {
    lichWeaponsCache = readJson('lich_weapons.json');
  }
  return lichWeaponsCache;
}

/**
 * 加载旧倾向表（wiki 镜像 entries）。
 *
 * @returns 英文武器名 → 条目
 */
export function loadDispositionEntries(): Record<string, DispositionEntry> {
  if (!dispositionCache) {
    const raw = readJson<{ entries?: Record<string, DispositionEntry> }>(
      'dispositions_rivenmirror.json',
    );
    dispositionCache = raw.entries ?? {};
  }
  return dispositionCache;
}

/**
 * 加载遗物奖励索引。
 *
 * @returns 遗物键 → 奖励
 */
export function loadRelicIndex(): RelicIndex {
  if (!relicIndexCache) {
    relicIndexCache = readJson('relic_index.json');
  }
  return relicIndexCache;
}

/**
 * 加载部件反查表。
 *
 * @returns 部件名 → 来源
 */
export function loadRelicInverse(): RelicInverse {
  if (!relicInverseCache) {
    relicInverseCache = readJson('relic_inverse.json');
  }
  return relicInverseCache;
}
