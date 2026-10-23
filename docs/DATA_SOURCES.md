# 数据源说明

Lanius **仅在 `apps/api` 适配层**访问上游；bot / web / admin 只调 Lanius API。

| 源                                                                            | 用途                                                  | 备注                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warframe 官方 `worldState.php`                                                | 世界状态 / 裂隙 / 入侵 / 午夜电波 / 虚空商人 / 瓦奇娅 | MVP：`realm=international`                                                                                                                                                                                                                            |
| Warframe 官方 PublicExport CDN（`content.warframe.com`）                      | 武器 / 物品图标图床                                   | URL 由 API 写入 DTO 的 `iconUrl`，客户端直链官方 CDN（如 `.../StoreIcons/Weapons/...png!hash`）                                                                                                                                                       |
| 仓库内 `packages/ui/assets/elements/*.png`                                    | 信条/终幕 Valence 元素图标                            | 本地资产（冲击/火焰/冰冻/电击/毒素/磁力/辐射）；**不是**官方 Damage CDN                                                                                                                                                                               |
| [warframe-public-export-plus](https://browse.wf/warframe-public-export-plus/) | uniqueName → icon 目录索引                            | 社区结构化镜像；**仅 API 适配层**用于解析图标路径与 contentHash                                                                                                                                                                                       |
| [Warframe Market](https://warframe.market/) API                               | `/wm` 在线卖单排行、`/zk` 在线紫卡拍卖                | 社区源；**默认 v2**（`/v2/items`、`/v2/orders/item/{slug}`、`/v2/riven/weapons`）。v1 物品/订单已弃用（404/403）。紫卡拍卖暂仍走 v1 `/auctions/search`。名称取自 v2 `i18n`；订单映射 `rank`→`mod_rank`、`ingameName`、`status`；结果经 Redis TTL 缓存 |
| SQLite `rotation_schedules`                                                   | 信条 / 终幕**当期货架**（`items_json` 全部平级展示）  | admin 可改 epoch / `periodDays`（通常 4）/ 货架列表；Valence 元素与百分比官方 worldState **不含**，需按游戏内或 wiki 人工维护                                                                                                                         |

缓存与持久化：

- **Redis**：上游规范化结果 TTL（不可用时内存降级，`/v1/health` → `cache=degraded`）
- **SQLite**：模块开关、帮助菜单、ACL、调用审计、**订阅推送**、轮换表
