/**
 * QQ 出图皮肤注册表（仅截图宿主；不驱动公开站主题）。
 */

/**
 * 已注册的 QQ 卡片皮肤 id。
 */
export type CardSkinId = 'light' | 'dark';

/**
 * 皮肤元数据（扩展色板时只增注册项）。
 */
export type CardSkinDef = {
  /** 稳定 id */
  id: CardSkinId;
  /** 中文展示名 */
  labelZh: string;
  /** 英文展示名 */
  labelEn: string;
};

/**
 * light / dark 两套皮肤（默认 light）。
 */
export const CARD_SKINS: readonly CardSkinDef[] = [
  { id: 'light', labelZh: '亮色', labelEn: 'Light' },
  { id: 'dark', labelZh: '暗色', labelEn: 'Dark' },
] as const;

/**
 * 默认皮肤（配置与非法 id 回落目标）。
 */
export const DEFAULT_CARD_SKIN: CardSkinId = 'light';

/**
 * 将任意输入解析为合法皮肤 id；非法或空值回落 light。
 *
 * @param raw - 用户输入、配置或会话偏好（大小写不敏感）
 * @returns 合法 `CardSkinId`
 */
export function resolveCardSkin(raw: string | null | undefined): CardSkinId {
  if (raw == null) {
    return DEFAULT_CARD_SKIN;
  }
  const key = String(raw).trim().toLowerCase();
  if (key === 'dark' || key === '暗色' || key === '夜间') {
    return 'dark';
  }
  if (key === 'light' || key === '亮色' || key === '日间') {
    return 'light';
  }
  return DEFAULT_CARD_SKIN;
}

/**
 * 列出皮肤 id（供 `/皮肤` 帮助与校验）。
 *
 * @returns 已注册皮肤 id 数组
 */
export function listCardSkinIds(): CardSkinId[] {
  return CARD_SKINS.map((skin) => skin.id);
}
