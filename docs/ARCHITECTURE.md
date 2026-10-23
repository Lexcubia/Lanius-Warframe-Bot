# 架构说明

> 产品设计细节以项目 Context 设计文档为准；本文是**仓库内**实现边界，供人类与 Agent 遵守。

## 1. 系统形态

```
 Warframe 官方数据（优先）+ 经标注的社区源（仅 API 层）
              │
              ▼
 ┌────────────────────────────────────┐
 │  apps/api — Lanius 自定义 API       │
 │  规范化 / 缓存 / 别名 / realm·locale │
 └─────────────┬──────────────────────┘
               │  HTTP（唯一业务入口）
       ┌───────┼──────────────┬────────────────┐
       ▼       ▼              ▼                ▼（后期）
  apps/bot   apps/web      apps/web         Tauri 2
  QQ 官方适配  公开查询站     /admin          桌面/移动
             （Nuxt / Vue 宿主）
```

**生产默认：** 宿主机 **Node 三进程**（API `dist` + Bot `dist` + Web Nitro `.output`）+ **systemd** + 旁路 Caddy（`deploy/Caddyfile.node`）。见 [DEPLOY.md](./DEPLOY.md)。  
Docker 单容器 `lanius-app`（`deploy/docker-compose.app.yml`）为**可选**路径，不再作为默认上线方式。  
后期 Tauri 客户端仍只调 Lanius API，**不**替代 QQ、**不**直连上游。

## 2. 目标 Monorepo 布局

```
lanius-warframe-bot/
├── apps/
│   ├── api/                 # Lanius 自定义 API 服务（@lanius/server，Hono + Zod + pino）
│   ├── bot/                 # QQ 官方适配
│   ├── web/                 # Nuxt 4：公开站 + /admin（当前 UI 宿主）
│   ├── desktop/             # 后期 Tauri 2 Windows（现不建）
│   └── mobile/              # 后期 Tauri 2 移动（现不建）
├── packages/
│   ├── core/                # DTO、Zod schema、别名、错误码、realm/locale、指令目录
│   ├── api/                 # 可注入 baseUrl + fetch 的 Lanius HTTP 客户端（不默认 axios）
│   ├── ui/                  # Web / 后期 Tauri：Vue 展示块（看板、面板）；非 QQ 出图卡
│   ├── render/              # QQ 出图：截图壳、dense ModuleCard、DTO → PNG/WebP
│   └── qq-official/         # 验签、事件、发文本/发图
├── config.example.yaml
├── config.local.yaml        # gitignore
├── docs/
│   └── TODO-TAURI.md        # Tauri 阶段 TODO（无脚手架）
├── .cursor/rules/
├── .cursor/skills/
├── AGENTS.md
└── README.md
```

**已落地：** `packages/core`、`packages/api`、`packages/ui`、`packages/render`、`packages/qq-official`、`apps/api`、`apps/bot`、`apps/web`。  
API：`/v1/health` · `/v1/meta` · `/v1/help` · `/v1/worldstate` · `/v1/market/items` · `/v1/riven` · `/v1/void-trader` · `/v1/varzia` · `/v1/rotations/{tenet|coda}` · `/v1/subscriptions` · `/v1/push/{tick|ack}` · `/v1/admin/*`（含 **config** / **releases**）。  
配置：`@lanius/config` 驱动，`config/default` ⊕ `config/local`；Admin 可改并热加载。  
推送：可查询模块 → SQLite 订阅 → Bot `push/tick`；频率 `on_change|hourly|daily|weekly`。  
发版硬顺序：`develop` → `main` → tag → **`main` tip → `release`**（禁止 develop 直推 release）。tag 后可选推 GHCR；`release` / Admin 选版 → 默认 **`update-node.sh`（git + build + systemd）**；Docker pull 为可选。  
指令前导：`commandPrefix` + `commandPrefixPolicy`；接 Agent 时建议 `required`。  
管理入口仅手输 `/admin`（公开导航不展示）。  
**禁止**在未立项时脚手架 Tauri。  
**Web 栈已锁定 Nuxt/Vue**；勿再引入 Next.js / React / shadcn / next-intl 作为 Web 默认。

### 2.0 Web UI ⊥ QQ 出图 UI（硬边界）

主站（公开站 / Admin / 后期 Tauri）与 QQ **截图出图** UI **完全剥离、互不干涉**。两端只共用底层 **Lanius 自定义 API** + `@lanius/core`（DTO / Zod / 别名 / 指令目录等）。色板等品牌 token 可对齐，但**不得**用同一套 ModuleCard / Shell 绑两端布局。

| 侧 | 包 / 应用 | 职责 | 禁止 |
| -- | --------- | ---- | ---- |
| **Web / Tauri** | `packages/ui` + `apps/web`（后期 `apps/desktop` 等） | 响应式看板、面板、站点主题；可插拔 Vue 展示 | `import` QQ ModuleCard / `QqCardShell`；把截图密度当站点布局 |
| **QQ 出图** | `packages/render` + `apps/bot` | Playwright 截图壳、dense 卡、固定宽（如 640/560）、会话 `cardSkin` | 向 Web 导出出图卡；公开站直接渲染 QQ 卡片 |
| **共享契约** | `@lanius/api` / `@lanius/core` | HTTP 业务入口与 DTO | 客户端直连 WF / 社区上游 |

**QQ 皮肤（仅会话，非站点主题）：** Bot 指令 `/皮肤`（及英文等价别名，见指令目录）在会话内切换 `light` \| `dark`，经 `SessionPrefs.cardSkin` 传入 `render*Card` / capture；默认 `bot.defaultCardSkin: light`。站点主题与此无关，禁止把 `cardSkin` 挂到 `apps/web`。

运行时仍遵守：QQ ↔ Web **无进程耦合**；QQ 消息中的公开站 URL 仅展示导流。

### 2.1 Web 公开路由（`apps/web`）

| 路由             | 职责                                                 | 主要 API                                                                                                   |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/`              | **首页看板**：全模块可折叠 + 速跳；市场/紫卡内联搜索 | 世界状态（周期）/ 裂隙 / **入侵** / **午夜电波** / 商人 / 轮换 / 市场 / 紫卡 / 帮助 / 订阅（彼此独立面板） |
| `/tools`         | 工具占位（待开发）                                   | —                                                                                                          |
| `/about`         | 关于                                                 | —                                                                                                          |
| `/worldstate` 等 | 旧模块深链页（仍可用，不进主导航）；世界状态页仅周期 | 同前                                                                                                       |
| `/admin`         | 运营控制台（不进公开 nav）                           | `/v1/admin/*` · 订阅 PATCH                                                                                 |

主导航：**首页 / 工具 / 关于 / 帮助 / 订阅**（左侧悬浮轨，可收起）。查询类模块集中在首页看板。视觉参考 wf.wiki 轻工具站气质的动漫风（暖底、软阴影、速跳条）。

客户端统一经 `useLaniusApi` / Nitro `/api/lanius` 代理；**禁止**直连 Warframe / 社区上游。

## 3. 依赖规则

| 包 / 应用                      | 可依赖                                             | 禁止                                              |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| `packages/core`                | 无业务应用依赖                                     | 依赖 api/bot/web                                  |
| `packages/api` (`@lanius/api`) | `core`；可注入 `fetch` / `baseUrl`                 | 直连 WF 上游；默认 axios；仅能在 Nuxt server 工作 |
| `packages/ui`                  | Vue 展示向依赖；**避免**硬绑 `vue-router` / `#app` | React；假设 `window` 必存在且无适配；**QQ 出图 ModuleCard / Shell** |
| `apps/api` (`@lanius/server`)  | `core`；上游 HTTP 客户端                           | 依赖 bot/web；把 QQ SDK 塞进 API                  |
| `apps/bot`                     | `@lanius/api`；`qq-official`；`render`（出图）     | 直连 WF 上游；依赖 Nuxt/Web / `packages/ui` 出图卡 |
| `apps/web`                     | `@lanius/api` / `ui` + Nuxt 壳（SEO/BFF/cookie）   | 直连上游；依赖 bot 进程；默认 axios；**引用 QQ ModuleCard** |
| `qq-official`                  | 仅 bot                                             | 被 api/web 引用                                   |
| `packages/render`              | bot（MVP）；可选 server 管理预览；自有 dense 卡壳  | 公开站直接渲染 QQ 卡片；把出图卡当 Web 共享组件   |

## 4. Tauri 可插拔（现期）

- **当前宿主**：Nuxt 4（Vue 3）。后期：**Tauri 2**（Windows 优先，移动另阶段）。
- Web 须：**响应式**、触控可用；业务 UI/API 调用倾向进 `packages/ui`（Vue，**Web/Tauri 展示**）+ `packages/api`（fetch）。QQ dense 出图卡属 `packages/render`，**不**进入 Tauri 复用面。
- Nuxt 专有能力（SSR SEO、route middleware、Nitro BFF、HttpOnly cookie 桥）留在 `apps/web`。
- 清单：[TODO-TAURI.md](./TODO-TAURI.md)。Context 详案：`tauri-roadmap.md`。

## 5. 横切约定

| 项       | 约定                                                                                                      | MVP                                |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `realm`  | `international` \| `china`                                                                                | 仅实现 international               |
| `locale` | `zh` \| `en`（`@nuxtjs/i18n`）                                                                            | 中英骨架                           |
| Web UI   | Nuxt UI + Tailwind；Lanius 主题                                                                           | 避免默认紫系 AI 审美               |
| HTTP     | `fetch` via `packages/api`                                                                                | 不默认 axios                       |
| 密钥     | `config.local.yaml` 和/或 DB                                                                              | 不以 env 为主存储                  |
| **缓存** | **业务 TTL / 上游快照 / 跨进程共享 → Redis**（或同等外部缓存）；进程内 `Map` 仅作本地降级或不可共享的短态 | 编排引入 Redis；API 缓存抽象可插拔 |
| QQ 回复  | `text` \| `image`                                                                                         | 均需支持；图片可降级文本           |
| Git      | 日常 → `develop`；发布 → `main` + `vX.Y.Z`                                                                | 二者禁直推 commit                  |

### 5.1 缓存边界

| 放入 Redis（或外部缓存）                     | 可留进程内                                       |
| -------------------------------------------- | ------------------------------------------------ |
| worldstate / WFM 市场 / 紫卡等上游规范化结果 | 单次请求内的临时变量                             |
| 管理配置热读缓存（DB 为源）                  | QQ `access_token` 极短槽（多实例时也应迁 Redis） |
| 调用审计的聚合计数、限流计数                 | 纯本地调试开关                                   |

现有 `apps/api` 的 `TtlCache`（内存 Map）视为过渡实现，重整时改为 `CacheStore` 接口 + Redis 适配；Redis 不可用时允许短暂内存降级并在 `/v1/health` 标 `cache=degraded`。

## 6. 非目标（架构层）

- 非官方 QQ 协议栈
- QQ ↔ Web 运行时耦合
- Web 与 QQ **出图 UI 同源 ModuleCard / Shell**（布局必须分离；仅 API + core 共享）
- 客户端旁路 Lanius API
- MVP 上线国服数据
- 多租户 / 多 IM 中台
- **现在**脚手架 Tauri / 另起桌面业务后端
- Web 侧 React / Next.js 默认栈

## 7. 相关文档

- [TODO-TAURI.md](./TODO-TAURI.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [VERSIONING.md](./VERSIONING.md)
- 根目录 [AGENTS.md](../AGENTS.md)
