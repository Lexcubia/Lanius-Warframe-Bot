# Changelog

本文件记录 **Lanius-Warframe-Bot** 的用户/运维可感知变更。  
格式参考 [Keep a Changelog](https://keepachangelog.com/)；版本号遵循 [SemVer](https://semver.org/)。  
策略详见 [docs/VERSIONING.md](./docs/VERSIONING.md)。

## [Unreleased]

## [0.1.0] - 2026-10-10

### Added

- 合入 `main` 后按 CHANGELOG 最新版本节自动打 `vX.Y.Z` 并 `workflow_call` 触发 Release（GHCR + 部署）；脚本 `scripts/changelog-release-version.mjs`。
- 运行时配置 `config/default`（回退）+ `config/local`（覆盖，gitignore）：站点页脚备案、`labels` 派系/节点/路径映射；`GET /v1/site`；Web Footer。
- Docker 多阶段镜像（`apps/api|web|bot/Dockerfile`）、`deploy/` Compose + Caddy 同域示例。
- Fork 安全 GitHub Actions：`ci.yml`（测试与类型检查）与 `release.yml`（tag / 自动发版 → GHCR + SSH 部署）。
- [docs/DEPLOY.md](./docs/DEPLOY.md) 部署与开源流水线说明。
- Bot + Web 并行脚手架：`apps/bot`、`apps/web`、`packages/qq-official`、`packages/render`、`packages/ui`。
- 共享 Lanius 视觉 token；Web 世界状态板与 QQ worldstate 卡片同色板。
- QQ 命令：独立根 `/世界状态` `/入侵` `/夜浪` `/模式` `/帮助`；图片渲染失败时降级为文本；本地默认 `bot.dryRun: true`。
- 公开站：首页搜索壳、世界状态、帮助、`/admin` 壳；zh/en；Nitro 代理 `/api/lanius`。
- API `GET /v1/help`。
- Monorepo API 垂直切片：`packages/core`、`packages/api`、`apps/api`。
- 公开端点 `GET /v1/health`、`GET /v1/meta`、`GET /v1/worldstate`（国际服官方 worldState 适配 + 进程内 TTL 缓存）。
- YAML 配置加载（`config.local.yaml` / `config.example.yaml`，`LANIUS_CONFIG` 可覆盖路径）。
- Vitest 单测覆盖 core 查询解析、worldstate 映射、API 路由与 `@lanius/api` 客户端。
- 仓库工程规范、Cursor rules/skills、IDE 与 ESLint/Prettier 基线。
- Git 模型：`develop` 日常集成，`main` 发布归档；SemVer 与 tag 约定。
- 后期 Tauri 2 路线与现期 Web 可插拔规划（`docs/TODO-TAURI.md`）。

### Changed

- 包重命名：`packages/api-client` → `packages/api`（`@lanius/api`），`packages/card-render` → `packages/render`（`@lanius/render`）；`apps/api` 包名改为 `@lanius/server`。
- QQ 指令改为独立根命令（如 `/世界状态`、`/模式 <文本|图片>`）；`GET /v1/help` 与 Web 帮助页展示用法/参数/示例。
- Web / 卡片视觉改为浅色清新工具站配色（青绿主色 + 暖橙 LIVE）。
- API/Bot 生产 `tsup` 打入 `@lanius/*`；Bot 支持 `LANIUS_API_BASE` / `PUBLIC_SITE_BASE_URL` 覆盖服务发现。
- 国际服 worldstate 默认上游改为 `https://api.warframe.com/cdn/worldState.php`。
- worldstate 映射：节点 / 阵营 / 夜浪挑战 / 奖励经 WFCD 字典解析为中英可读名；过滤已完成入侵；`InvasionDto` 显示字段改为 `LocalizedName`。
- Web 选型为 **Nuxt 4 + Vue 3 + Nuxt UI + `@nuxtjs/i18n`**；HTTP 客户端为原生 **`fetch`**（`packages/api`）；`packages/ui` 为 Vue SFC（供后期 Tauri WebView 复用）。
- 同步 `docs/ARCHITECTURE.md`、`TODO-TAURI.md`、`AGENTS.md`、README、`.cursor/rules` 中相关表述。

## [0.0.0] - 2026-10-10

### Added

- 仓库初始化与工程基线（版本占位）。
