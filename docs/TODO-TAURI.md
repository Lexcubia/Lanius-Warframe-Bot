# TODO — Tauri 2（后期桌面 / 移动）

> **现在不要脚手架 Tauri。** 当前 UI 宿主 = **Next.js（`apps/web`）**。  
> Context 详案：项目 Context 中的 `docs/tauri-roadmap.md`。  
> 架构约定见 [ARCHITECTURE.md](./ARCHITECTURE.md) §Tauri 可插拔。

## 目标（后期）

- Windows 桌面 +（能力成熟后）移动 APP，经 **Tauri 2** 承载。
- 与 Web **共用**规划中的 `packages/ui` + `packages/api-client`；业务仍只调 **Lanius API**。
- **不**替代官方 QQ Bot；**不**直连 Warframe 上游。

## Phase 0 — Web MVP（现在）

- [ ] 公开站 / 后台响应式与触控可用（窄屏 + 宽屏）
- [ ] 展示组件与页面路由解耦；少在共享层使用 Next-only API
- [ ] API 访问可配置 `baseUrl`（为日后桌面指向同一 API 做准备）
- [ ] 关键操作不只依赖 hover

## Phase 1 — 共享包（仍无 Tauri）

- [ ] `packages/api-client`：基于 `packages/core`；可注入 `fetch` / `baseUrl`
- [ ] `packages/ui`：搜索、结果、世界状态等展示块
- [ ] `apps/web` 改为组合上述包；SEO / middleware / BFF 留在 Next 壳

## Phase 2 — Windows（Tauri 2）

- [ ] 立项时再脚手架 `apps/desktop`（或等价）
- [ ] 复用 ui + api-client；本地配置 / 安全存储（密钥仍不进 env 主存储）
- [ ] 窗口、更新、鉴权桥接按需

## Phase 3 — Mobile（Tauri 2）

- [ ] 待官方移动端成熟度足够再开工
- [ ] 安全区、权限、分发合规

## Agent 提醒

- 改 Web UI / 客户端代码时遵守 `.cursor/rules` 中 Tauri 可插拔规则。
- 完成某条 TODO 时在本文件勾选，并视需要更新 `CHANGELOG.md` `[Unreleased]`。
