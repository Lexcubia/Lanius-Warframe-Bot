# Changelog

本文件记录 **Lanius-Warframe-Bot** 的用户/运维可感知变更。  
格式参考 [Keep a Changelog](https://keepachangelog.com/)；版本号遵循 [SemVer](https://semver.org/)。  
策略详见 [docs/VERSIONING.md](./docs/VERSIONING.md)。

## [Unreleased]

### Changed

- Web 选型改为 **Nuxt 4 + Vue 3 + Nuxt UI + `@nuxtjs/i18n`**；HTTP 客户端锁定原生 **`fetch`**（`packages/api-client`），不默认 axios。
- 废弃 Web 默认栈：Next.js / React / shadcn/ui / next-intl；`packages/ui` 改为 Vue-friendly（供后期 Tauri）。
- 同步 `docs/ARCHITECTURE.md`、`TODO-TAURI.md`、`AGENTS.md`、README、`.cursor/rules` 中相关表述。

### Added

- 仓库工程规范、Cursor rules/skills、IDE 与 ESLint/Prettier 基线。
- Git 模型：`develop` 日常集成，`main` 发布归档；SemVer 与 tag 约定。
- 后期 Tauri 2 路线与现期 Web 可插拔 TODO（`docs/TODO-TAURI.md`；不脚手架）。

## [0.0.0] - 2026-10-10

### Added

- 仓库初始化（尚无应用运行时；版本占位）。
