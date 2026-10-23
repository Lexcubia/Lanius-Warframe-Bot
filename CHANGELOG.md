# Changelog

本文件记录 **Lanius-Warframe-Bot** 的用户/运维可感知变更。  
格式参考 [Keep a Changelog](https://keepachangelog.com/)；版本号遵循 [SemVer](https://semver.org/)。  
策略详见 [docs/VERSIONING.md](./docs/VERSIONING.md)。

## [Unreleased]

### Changed

- `/wm` `/zk` 私聊：改用 Markdown `<qqbot-cmd-input>`，点击后直接把 `/w …` 插入输入框且**不带 @bot**（键盘仅保留翻页）。

## [0.4.6] - 2026-10-23

### Fixed

- 容器热启动部署：`update-container.sh` 与 Deploy workflow 在机房连不上 `github.com` 时回退 git 镜像（与 `update-node.sh` 同策略）。

## [0.4.5] - 2026-10-23

### Changed

- `/wm` `/zk`：去掉社区自造「拉特龙」别名表；仅用 WFM `zh-hans` / 英文索引模糊锁定（请用官方译名「拉特昂」）。
- 市场/紫卡卡片：物品图标（WFM thumb）+ 白金图标；价与数量分开展示（如 `69 白金 · ×20`）；`online`/`ingame` 在 zh 下显示「在线」「游戏中」。
- 紫卡属性名改为 WFM `/riven/attributes` 双语（zh-hans / en），不再只显示英文 slug。
- QQ 键盘增加「私聊N」按钮：返回可粘贴到游戏的 `/w 卖家 …` 文案（与翻页并存）。

## [0.4.4] - 2026-10-23

### Fixed

- `update-container.sh` 支持 `LANIUS_REPO_ROOT`；Deploy 将目标 ref 脚本写到 `deploy/update-container.ref.sh` 再执行，修复脚本落在 `/tmp` 时把仓库根误解析为 `/`（git exit 128）。

## [0.4.3] - 2026-10-23

### Fixed

- Deploy 先 `git show <ref>:deploy/update-container.sh` 再执行，避免服务器旧 checkout 里的旧脚本在 reset 后仍不跑 `--force-recreate`。
- workflow 层再强制 `compose up --force-recreate` + `restart`，并轮询健康检查直到 `uptimeSec ≤ 120`。

## [0.4.2] - 2026-10-23

### Fixed

- 容器热启动部署强制 `--force-recreate` + `restart`，避免 `compose up -d` 未换进程导致超长 `uptimeSec` 与旧代码继续对外服务。
- Deploy release 健康检查拒绝 `uptimeSec > 120`，防止「Actions 绿但现网未换码」。

## [0.4.1] - 2026-10-23

### Added

- `/wm` / `/zk`：中文模糊锁定单一目标后展示在线/游戏中卖单（紫卡为拍卖），价升序、每页 10 条，QQ Markdown 翻页键盘重放筛选。
- 紫卡行展示属性、段位、等级、循环；指令支持 `等级=` / `段位=` / `循环=` / `p=`。

### Changed

- Warframe Market 适配改为 **API v2**（物品索引、订单、紫卡武器列表）；紫卡拍卖暂仍走 v1。
- 市场/紫卡 Web 页与模块卡改为单目标分页订单展示。

### Fixed

- WFM v1 物品/订单弃用导致行情失败（404/403 Deprecated）。
- 社区译名「拉特龙」与官方「拉特昂」别名互通；未点名变体时优先锁定 `latron_prime_set` / 紫卡 `latron`。
- 空武器 slug 不再打到上游 auctions（避免 HTTP 400）。

## [0.4.0] - 2026-10-14

### Added

- 共享包 `@lanius/logger`：统一结构化日志与敏感路径脱敏（API / Bot）。
- QQ 图片模式模块卡：信条 / 终幕 / 瓦奇娅 / 虚空商人（`packages/ui` + `packages/render`）。
- Node 生产部署资产：`deploy/systemd/*`、`deploy/update-node.sh`、`deploy/Caddyfile.node`、`deploy/install-node-services.sh`。
- 容器热启动：`docker-compose.app.yml` 挂载 monorepo 源码，api/bot 经 `tsx` 直跑 TypeScript，更新即重启生效；启动更新检查与 `deploy/update.sh`。

### Changed

- **生产默认运行时改为 Node + systemd**（API `dist` / Bot `dist` / Web Nitro `.output`）；长期分支 `release` 部署执行 `update-node.sh`（git checkout + pnpm build + systemd）。
- 旧 GHCR `update-image.sh` / 单容器 `lanius-app` 降级为可选；Admin「版本」默认 `github.deployMode: node`。
- QQ Webhook：先 ACK 再异步发信；群面板支持 `force` 重绑；取消远端开发/生产双环境方案（不落地）。
- QQ 卡片统一小圆角（10px，对齐 QQ 原生卡片），内容行纯白背景与米白卡片底区分。
- 裂隙卡片改两列网格（末行单个只占一列），卡片截图透明背景保留圆角。

### Fixed

- 指令面板说明按开放平台**加权 ≤30** 截断并提供专用短文案，缓解同步 `30013`（#34）。
- Markdown 嵌图占位保留 alt 中的 `#Wpx #Hpx` 尺寸标注（#34）。
- 群聊命令静默：入群强制面板 rebind、退群清缓存、发信失败结构化日志（#35）。
- 入侵等 CDN 图标截白图：截图等待改为可执行 async IIFE；图标 `loading="eager"`（#36）。
- 卡片时间戳时区偏差 8 小时：容器设 `TZ=Asia/Shanghai`，时间戳经 `formatTimestamp` 走运行时本地时区。
- 裂隙时间/节点名溢出省略：移除截断，文本完整显示不换行溢出；信条/终幕卡片宽度收紧并显示加成数值百分比。
- 截图卡片直角白底：`omitBackground` + 透明 host 背景；去除卡片嵌套导致的双层内边距。

## [0.3.0] - 2026-10-12

### Added

- `@lanius/config` 模块化配置驱动（`config/default` + `config/local`）；Admin 全量配置编辑（密钥掩码）与进程内热加载。
- Admin「版本」：拉取 GitHub Releases/tags，选版更新/回退（与 `deploy/update-image.sh` 同路径，pull 不 rebuild）。
- 长期分支 `release` 自动部署工作流（SSH pull + up）；开源友好手动 / Docker 部署文档；主体单容器 `lanius-app`（api + web + bot + 内嵌 Redis）+ 旁路 Caddy。
- Web Admin 控制台：会话探测 / logout、侧栏分区；ACL CRUD、轮换表单、帮助菜单、审计表、订阅与模块开关。
- Web 公开站全模块查询页：裂隙、市场、紫卡、商人、轮换、帮助详解（`?module=`）、订阅说明；首页搜索跳转市场。
- API 模块：市场、紫卡、商人、信条/终幕轮换、订阅、推送 tick/ack、Admin；Redis/内存缓存与 SQLite 仓储。
- QQ：市场 / 商人文本格式化；推送 worker；裂隙 / 入侵 / 夜浪等模块卡片与 Web 同源。
- 官方 PublicExport 物品图标目录（`CatalogItemDto.iconUrl`）；伤害元素本地 PNG；信条/终幕 valence 进度条。
- 开放世界周期六地分色主题与环形进度中心图标（地球 / 平原 / 魔胎 / 山谷 / 双衍 / 扎里曼）。
- 虚空裂隙三维筛选（遗物 / 任务类型 / 普通·钢铁之路·九重天）与路径色标。
- QQ 裂隙回复支持 Markdown + 底部指令按钮（纪元 / 路径档一键筛选；图片模式附带按钮条）。
- 午夜电波挑战标注每日 / 每周（`kind` + `kindLabel`），列表按周期分组。
- 数据源说明 [docs/DATA_SOURCES.md](./docs/DATA_SOURCES.md)。

### Changed

- `release.yml` 仅测试 + 推 GHCR（含 `lanius-app`），不再 SSH 部署；`deploy-develop` 停用。
- 根单体 `config.local.yaml` 启动时拆分迁移到 `config/local/*`（兼容一轮）。
- 公开导航与首页看板重构：主导航左侧悬浮轨；动漫风视觉；主区域禁止横向滚动。
- 世界状态看板仅展示开放世界周期；入侵 / 午夜电波为独立模块。
- 信条与终幕改为货架式 offerings（无「当前高亮」），valence 以进度条展示。
- `@lanius/api` 客户端对 `fetch` 使用 `bind`，修复浏览器 SPA 切换时报 Illegal invocation。
- 派系/节点中文显示对齐灰机 wiki；星图繁体星球名转简体。
- 虚空商人 / 瓦奇娅货架与入侵奖励展示物品图标；入侵 `ItemCount > 1` 显示数量。

### Fixed

- 裂隙任务类型筛选芯片按展示名去重（避免 MT_* 与九重天节点键重复）。
- 裂隙卡片内时间等文案禁止换行；遗物图标优先本地纪元资源。
- 无官方图标时使用固定尺寸占位，保持列表对齐。

## [0.2.0] - 2026-10-11

### Added

- QQ 图片卡片改为 **Vue（`packages/ui`）+ Playwright 节点截图**，与 Web 同源组件；生产镜像预构建 `card-host` 并内置 Chromium。
- 世界状态模块以开放世界周期环为主；独立模块：**虚空裂隙**（官方遗物图标）、入侵、午夜电波。
- API / DTO：裂隙纪元与路径档、周期 `progress`、节点/任务中英标签映射增强。
- QQ 官方下行：被动回复（群/C2C/频道）、指令面板同步、配额回收与 `specific` 绑定（at/join）。
- 运维：`Deploy develop` 热修工作流；拉取 bot 日志 / dump QQ panels 探测工作流。
- Bot 默认回复模式改为图片（配置示例与生产 secrets 对齐）。

### Changed

- `@lanius/render` 出图路径切换为 Chromium 截图；Satori 树构建仍保留作兼容/单测。
- CI / Release 安装 Playwright Chromium（`--with-deps`）以跑卡片截图测试。
- Bot Docker 镜像安装 Chromium 系统依赖，并通过 `LANIUS_CARD_HOST_DIR` 指向预构建宿主页。

### Fixed

- QQ 面板超限（30013）时回收/复用已有面板；列表探测与错误体可读性。
- Deploy develop 在已检出 `develop` 时用 `FETCH_HEAD` 硬对齐，避免 fetch 失败。

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
