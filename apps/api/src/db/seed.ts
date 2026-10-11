import { LANIUS_COMMAND_CATALOG, buildHelpDto } from '@lanius/core';

import type { LaniusDb } from './client.js';

/**
 * 轮换表条目形态。
 */
type RotationSeedItem =
  | string
  | { name: string; element?: string; bonusPct?: number };

/**
 * Ergo Glast 信条货架（5 把平级；Valence 为 wiki 玩家上报示例，需随商店刷新人工更新）。
 */
const DEFAULT_TENET: RotationSeedItem[] = [
  { name: 'Tenet Ferrox', element: 'electricity', bonusPct: 27.7 },
  { name: 'Tenet Grigori', element: 'toxin', bonusPct: 46.8 },
  { name: 'Tenet Livia', element: 'electricity', bonusPct: 50.9 },
  { name: 'Tenet Exec', element: 'toxin', bonusPct: 25.1 },
  { name: 'Tenet Agendus', element: 'impact', bonusPct: 40.7 },
];

/**
 * Eleanor 终幕 Batch A 货架（7 把平级；百分比对齐 wiki 当期示例）。
 */
const DEFAULT_CODA: RotationSeedItem[] = [
  { name: 'Coda Catabolyst', element: 'radiation', bonusPct: 30.5 },
  { name: 'Coda Hema', element: 'magnetic', bonusPct: 28.9 },
  { name: 'Coda Mire', element: 'cold', bonusPct: 25.2 },
  { name: 'Coda Motovore', element: 'impact', bonusPct: 34.9 },
  { name: 'Coda Pox', element: 'magnetic', bonusPct: 29.6 },
  { name: 'Coda Sporothrix', element: 'electricity', bonusPct: 29.7 },
  { name: 'Dual Coda Torxica', element: 'magnetic', bonusPct: 25.3 },
];

/**
 * 需被商店货架模型替换的旧「单武器轮换」名单（Sisters / 假 Valence）。
 */
const LEGACY_TENET_NAME_SETS: string[][] = [
  [
    'Tenet Arca Plasmor',
    'Tenet Envoy',
    'Tenet Tetra',
    'Tenet Cycron',
    'Tenet Detron',
    'Tenet Diplos',
    'Tenet Flux Rifle',
    'Tenet Spirex',
  ],
];

/**
 * 旧终幕短名单（缺 Batch A 全套）。
 */
const LEGACY_CODA_NAME_SETS: string[][] = [
  [
    'Coda Hema',
    'Coda Sporothrix',
    'Coda Synapse',
    'Coda Catabolyst',
    'Coda Dual Torxica',
    'Coda Pox',
  ],
  [
    'Coda Hema',
    'Coda Sporothrix',
    'Coda Synapse',
    'Coda Catabolyst',
    'Dual Coda Torxica',
    'Coda Pox',
  ],
];

/** 商店 Valence 刷新周期（天；与官方 96h 对齐）。 */
const SHOP_PERIOD_DAYS = 4;

/** 周期 epoch（UTC 日界，可被 admin 覆盖）。 */
const SHOP_EPOCH_ISO = '2025-03-18T00:00:00.000Z';

/**
 * 播种模块开关、帮助菜单与轮换表；已有库则补齐缺失模块行。
 *
 * @param db - SQLite 句柄
 * @returns 无返回值
 */
export function seedDatabaseIfEmpty(db: LaniusDb): void {
  const count = db.get<{ c: number }>('SELECT COUNT(*) AS c FROM module_settings');
  if ((count?.c ?? 0) === 0) {
    let order = 0;
    for (const entry of LANIUS_COMMAND_CATALOG) {
      db.run(
        `INSERT INTO module_settings (module_id, enabled, sort_order, help_override_json)
         VALUES (?, 1, ?, NULL)`,
        [entry.id, order++],
      );
    }
    const help = buildHelpDto();
    db.run(
      `INSERT INTO help_menu (id, title_zh, title_en, intro_zh, intro_en, visible_module_ids_json)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [
        help.title.zh,
        help.title.en,
        help.intro.zh,
        help.intro.en,
        JSON.stringify(LANIUS_COMMAND_CATALOG.map((entry) => entry.id)),
      ],
    );
  } else {
    const existing = new Set(
      db
        .all<{ module_id: string }>('SELECT module_id FROM module_settings')
        .map((row) => row.module_id),
    );
    let order =
      db.get<{ m: number }>('SELECT COALESCE(MAX(sort_order), 0) AS m FROM module_settings')
        ?.m ?? 0;
    for (const entry of LANIUS_COMMAND_CATALOG) {
      if (existing.has(entry.id)) {
        continue;
      }
      order += 1;
      db.run(
        `INSERT INTO module_settings (module_id, enabled, sort_order, help_override_json)
         VALUES (?, 1, ?, NULL)`,
        [entry.id, order],
      );
    }
  }

  seedRotationIfMissing(db, 'tenetRotation', DEFAULT_TENET);
  seedRotationIfMissing(db, 'codaRotation', DEFAULT_CODA);
  upgradeLegacyShopRotation(db, 'tenetRotation', DEFAULT_TENET, LEGACY_TENET_NAME_SETS);
  upgradeLegacyShopRotation(db, 'codaRotation', DEFAULT_CODA, LEGACY_CODA_NAME_SETS);
}

/**
 * 写入默认轮换表（仅当行不存在）。
 *
 * @param db - 数据库
 * @param moduleId - tenetRotation | codaRotation
 * @param items - 货架条目
 * @returns 无返回值
 */
function seedRotationIfMissing(
  db: LaniusDb,
  moduleId: string,
  items: RotationSeedItem[],
): void {
  const row = db.get<{ module_id: string }>(
    'SELECT module_id FROM rotation_schedules WHERE module_id = ?',
    [moduleId],
  );
  if (row) {
    return;
  }
  db.run(
    `INSERT INTO rotation_schedules (module_id, epoch_iso, period_days, items_json)
     VALUES (?, ?, ?, ?)`,
    [moduleId, SHOP_EPOCH_ISO, SHOP_PERIOD_DAYS, JSON.stringify(items)],
  );
}

/**
 * 将旧「单把轮换 / 错误名单」升级为商店货架默认表。
 *
 * @param db - 数据库
 * @param moduleId - tenetRotation | codaRotation
 * @param defaults - 新默认货架
 * @param legacyNameSets - 可识别的旧名单集合
 * @returns 无返回值
 */
function upgradeLegacyShopRotation(
  db: LaniusDb,
  moduleId: string,
  defaults: RotationSeedItem[],
  legacyNameSets: string[][],
): void {
  const row = db.get<{ items_json: string }>(
    'SELECT items_json FROM rotation_schedules WHERE module_id = ?',
    [moduleId],
  );
  if (!row) {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.items_json) as unknown;
  } catch {
    return;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return;
  }
  const currentNames = parsed
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }
      if (entry && typeof entry === 'object') {
        return String((entry as { name?: unknown }).name ?? '').trim();
      }
      return '';
    })
    .filter(Boolean);
  const isLegacy = legacyNameSets.some(
    (legacy) =>
      legacy.length === currentNames.length &&
      legacy.every((name, i) => name === currentNames[i]),
  );
  if (!isLegacy) {
    return;
  }
  db.run(
    `UPDATE rotation_schedules
     SET items_json = ?, period_days = ?, epoch_iso = ?
     WHERE module_id = ?`,
    [JSON.stringify(defaults), SHOP_PERIOD_DAYS, SHOP_EPOCH_ISO, moduleId],
  );
}
