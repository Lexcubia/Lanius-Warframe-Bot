/**
 * 官方物品图标目录适配。
 *
 * 目录索引取自 [warframe-public-export-plus](https://browse.wf/warframe-public-export-plus/)
 *（PublicExport 的结构化镜像）；图标 URL 指向官方 CDN
 * `https://content.warframe.com/PublicExport/...`。
 */

import { canonicalizeItemPath } from './canonicalize-item-path.js';

/** 官方 PublicExport CDN 根。 */
export const OFFICIAL_PUBLIC_EXPORT_CDN =
  'https://content.warframe.com/PublicExport';

/** 目录镜像根（仅用于 uniqueName → icon 索引，不替代官方图床）。 */
export const PUBLIC_EXPORT_PLUS_BASE =
  'https://browse.wf/warframe-public-export-plus';

/**
 * 需拉取的 Export 分册（含 `icon` 字段的物品表）。
 */
export const ITEM_ICON_EXPORT_FILES = [
  'ExportWeapons.json',
  'ExportWarframes.json',
  'ExportResources.json',
  'ExportGear.json',
  'ExportUpgrades.json',
  'ExportCustoms.json',
  'ExportSentinels.json',
  'ExportDrones.json',
  'ExportKeys.json',
  'ExportFlavour.json',
  'ExportFusionBundles.json',
  'ExportRecipes.json',
] as const;

/**
 * 单条图标解析结果。
 */
export type ItemIconRef = {
  iconPath: string;
  iconUrl: string;
};

/**
 * uniqueName → 官方图标。
 */
export type ItemIconCatalog = Map<string, ItemIconRef>;

/**
 * ExportImages 条目（contentHash 用于官方 CDN）。
 */
type ExportImageEntry = {
  contentHash?: string;
};

/**
 * Export* 分册中带 icon 的条目。
 */
type ExportIconEntry = {
  icon?: string;
};

/**
 * 拉取并合并物品图标目录。
 *
 * @param options - 可选 fetch / 镜像根
 * @returns uniqueName → 官方图标映射
 * @throws 网络或 JSON 解析失败时抛出 Error
 */
export async function fetchItemIconCatalog(options?: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<ItemIconCatalog> {
  const base = options?.baseUrl ?? PUBLIC_EXPORT_PLUS_BASE;
  const fetchImpl = options?.fetchImpl ?? globalThis.fetch.bind(globalThis);

  const images = (await fetchJson(
    `${base}/ExportImages.json`,
    fetchImpl,
  )) as Record<string, ExportImageEntry>;

  const catalog: ItemIconCatalog = new Map();

  for (const file of ITEM_ICON_EXPORT_FILES) {
    const sheet = (await fetchJson(`${base}/${file}`, fetchImpl)) as Record<
      string,
      ExportIconEntry
    >;
    for (const [uniqueName, entry] of Object.entries(sheet)) {
      const iconPath = entry?.icon;
      if (!iconPath || catalog.has(uniqueName)) {
        continue;
      }
      const hash = images[iconPath]?.contentHash;
      catalog.set(uniqueName, {
        iconPath,
        iconUrl: buildOfficialIconUrl(iconPath, hash),
      });
    }
  }

  return catalog;
}

/**
 * 组装官方 CDN 图标 URL。
 *
 * @param iconPath - PublicExport 相对路径（以 `/Lotus/...` 开头）
 * @param contentHash - ExportImages 中的 contentHash；缺省时不加 `!hash` 后缀
 * @returns 完整 `content.warframe.com` URL
 */
export function buildOfficialIconUrl(
  iconPath: string,
  contentHash?: string,
): string {
  const path = iconPath.startsWith('/') ? iconPath : `/${iconPath}`;
  if (contentHash && contentHash.length > 0) {
    return `${OFFICIAL_PUBLIC_EXPORT_CDN}${path}!${contentHash}`;
  }
  return `${OFFICIAL_PUBLIC_EXPORT_CDN}${path}`;
}

/**
 * 从目录查找图标；未命中返回 undefined。
 * 商人 Manifest 常为 `/Lotus/StoreItems/...`，会先规范为 Export 分册键再查。
 *
 * @param catalog - 已加载目录
 * @param uniqueName - ItemType / storeItem / uniqueName
 * @returns 图标引用或 undefined
 */
export function lookupItemIcon(
  catalog: ItemIconCatalog,
  uniqueName: string,
): ItemIconRef | undefined {
  const direct = catalog.get(uniqueName);
  if (direct) {
    return direct;
  }
  const canonical = canonicalizeItemPath(uniqueName);
  if (canonical !== uniqueName) {
    return catalog.get(canonical);
  }
  return undefined;
}

/**
 * GET JSON 辅助。
 *
 * @param url - 绝对 URL
 * @param fetchImpl - fetch 实现
 * @returns 解析后的 JSON
 * @throws 非 2xx 或解析失败
 */
async function fetchJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`item icon catalog fetch failed: ${response.status} ${url}`);
  }
  return response.json();
}
