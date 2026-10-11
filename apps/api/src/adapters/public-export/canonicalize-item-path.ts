/**
 * 将商人货架等场景的 StoreItem 路径规范为 PublicExport 目录键。
 *
 * ExportVendors / worldState Manifest 使用 `/Lotus/StoreItems/...`，
 * 而 ExportWeapons / ExportResources 等分册键为去掉 `StoreItems/` 后的路径。
 *
 * @param uniqueName - 上游 ItemType / storeItem / uniqueName
 * @returns 可用于图标目录查找的规范路径；非 StoreItems 时原样返回
 */
export function canonicalizeItemPath(uniqueName: string): string {
  const trimmed = uniqueName.trim();
  if (trimmed.startsWith('/Lotus/StoreItems/')) {
    return `/Lotus/${trimmed.slice('/Lotus/StoreItems/'.length)}`;
  }
  return trimmed;
}
